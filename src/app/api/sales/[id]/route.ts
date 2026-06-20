import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeDailyRecord } from "@/lib/serialize";

/**
 * DELETE /api/sales/[id]
 * Deletes a sale and decrements the corresponding buyer counter on the parent DailyRecord.
 * Returns the updated DailyRecord.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let sale;
  try {
    sale = await prisma.sale.findUnique({
      where: { id },
      include: { saleItems: true },
    });
  } catch {
    sale = await prisma.sale.findUnique({ where: { id } });
  }
  if (!sale) {
    return NextResponse.json({ error: "Sale not found" }, { status: 404 });
  }

  const buyerField = sale.type === "foreign" ? "foreignBuyers" : "localBuyers";

  const record = await prisma.$transaction(
    async (tx) => {
      const saleItems = "saleItems" in sale ? sale.saleItems ?? [] : [];

      // Restore stock for all lines concurrently instead of one-by-one —
      // keeps the transaction short so it doesn't outlive Prisma's timeout
      // or a Neon cold-start delay.
      await Promise.all(
        saleItems
          .filter((line) => line.stockItemId)
          .map((line) =>
            tx.stockItem.update({
              where: { id: line.stockItemId as string },
              data: { units: { increment: line.quantity } },
            })
          )
      );

      await tx.sale.delete({ where: { id } });

      const updated = await tx.dailyRecord.update({
        where: { id: sale.dailyRecordId },
        data: { [buyerField]: { decrement: 1 } },
      });

      // Clamp to 0 if somehow negative
      if (updated[buyerField] < 0) {
        await tx.dailyRecord.update({
          where: { id: sale.dailyRecordId },
          data: { [buyerField]: 0 },
        });
      }

      return tx.dailyRecord.findUniqueOrThrow({
        where: { id: sale.dailyRecordId },
        include: { sales: true },
      });
    },
    { timeout: 20000, maxWait: 10000 }
  );

  const recordWithSales = await findRecordForResponse(record.id);
  return NextResponse.json(serializeDailyRecord(recordWithSales ?? record));
}

async function findRecordForResponse(id: string) {
  try {
    return await prisma.dailyRecord.findUnique({
      where: { id },
      include: { sales: { include: { saleItems: true } } },
    });
  } catch {
    return prisma.dailyRecord.findUnique({
      where: { id },
      include: { sales: true },
    });
  }
}
