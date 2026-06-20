import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeDailyRecord } from "@/lib/serialize";
import { dateStringToUTCDate } from "@/lib/dates";
import { saleSchema } from "@/lib/validation";

/**
 * POST /api/sales
 * Creates a sale linked to the DailyRecord for that date (creating the record if needed),
 * and increments the corresponding buyer counter.
 * Returns the updated DailyRecord with all sales.
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = saleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 }
    );
  }

  const { date, type, amountKes, items, saleItems } = parsed.data;
  const dateValue = dateStringToUTCDate(date);
  const buyerField = type === "foreign" ? "foreignBuyers" : "localBuyers";

  try {
    const record = await prisma.$transaction(async (tx) => {
    const stockIds = saleItems
      .map((item) => item.stockItemId)
      .filter((id): id is string => !!id);
    const stockItems = stockIds.length
      ? await tx.stockItem.findMany({ where: { id: { in: stockIds } } })
      : [];
    const stockById = new Map(stockItems.map((item) => [item.id, item]));

    for (const line of saleItems) {
      if (!line.stockItemId) continue;
      const stockItem = stockById.get(line.stockItemId);
      if (!stockItem) throw new Error("One selected stock item was not found");
      if (stockItem.units < line.quantity) {
        throw new Error(`${stockItem.name ?? "Selected item"} only has ${stockItem.units} units available`);
      }
    }

    // Guard against overselling when the same stock item appears in multiple
    // lines of the same sale (e.g. added twice via "+ Add item"). Each line
    // is checked above against the item's total units individually, which
    // would miss a combined quantity that exceeds stock. Aggregate per
    // stockItemId and re-validate against the running total.
    const requestedByStockId = new Map<string, number>();
    for (const line of saleItems) {
      if (!line.stockItemId) continue;
      requestedByStockId.set(
        line.stockItemId,
        (requestedByStockId.get(line.stockItemId) ?? 0) + line.quantity
      );
    }
    for (const [stockItemId, totalRequested] of requestedByStockId) {
      const stockItem = stockById.get(stockItemId);
      if (!stockItem) continue;
      if (stockItem.units < totalRequested) {
        throw new Error(
          `${stockItem.name ?? "Selected item"} only has ${stockItem.units} units available (requested ${totalRequested})`
        );
      }
    }

    const existing = await tx.dailyRecord.upsert({
      where: { date: dateValue },
      create: { date: dateValue },
      update: {},
    });

    const updated = await tx.dailyRecord.update({
      where: { id: existing.id },
      data: { [buyerField]: { increment: 1 } },
    });

    const sale = await tx.sale.create({
      data: {
        date: dateValue,
        type,
        amountKes,
        items:
          items ??
          (saleItems.length
            ? saleItems
                .map((item) => {
                  const stockItem = item.stockItemId ? stockById.get(item.stockItemId) : null;
                  return `${item.quantity}x ${item.label || stockItem?.name || "Other"}`;
                })
                .join(", ")
            : null),
        dailyRecordId: updated.id,
      },
    });

    // Decrement stock and create sale item lines concurrently — these writes
    // are independent of each other, so running them in parallel keeps this
    // transaction short. Long sequential chains of awaited queries are the
    // main reason interactive transactions time out against Neon, especially
    // right after the compute has been idle and needs to "wake up".
    await Promise.all(
      saleItems.flatMap((line) => {
        const stockItem = line.stockItemId ? stockById.get(line.stockItemId) : null;
        return [
          tx.saleItem.create({
            data: {
              saleId: sale.id,
              stockItemId: line.stockItemId ?? null,
              label: line.label || stockItem?.name || "Other",
              quantity: line.quantity,
              unitPriceKes: line.unitPriceKes ?? stockItem?.salePrice ?? null,
            },
          }),
          ...(line.stockItemId
            ? [
                tx.stockItem.update({
                  where: { id: line.stockItemId },
                  data: { units: { decrement: line.quantity } },
                }),
              ]
            : []),
        ];
      })
    );

    return tx.dailyRecord.findUniqueOrThrow({
      where: { id: updated.id },
      include: { sales: true },
    });
    },
      { timeout: 20000, maxWait: 10000 }
    );

    const recordWithSales = await findRecordForResponse(record.id);
    return NextResponse.json(serializeDailyRecord(recordWithSales ?? record), { status: 201 });
  } catch (error) {
    return handleSalesError(error);
  }
}

async function findRecordForResponse(id: string) {
  return prisma.dailyRecord.findUnique({
    where: { id },
    include: { sales: { include: { saleItems: true } } },
  });
}

function handleSalesError(error: unknown) {
  if (error instanceof Error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ error: "Failed to record sale" }, { status: 500 });
}
