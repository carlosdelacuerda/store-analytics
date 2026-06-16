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

  const { date, type, amountKes, items } = parsed.data;
  const dateValue = dateStringToUTCDate(date);
  const buyerField = type === "foreign" ? "foreignBuyers" : "localBuyers";

  // Upsert the daily record (create if not exists) then increment buyer counter
  const record = await prisma.$transaction(async (tx) => {
    const existing = await tx.dailyRecord.upsert({
      where: { date: dateValue },
      create: { date: dateValue },
      update: {},
    });

    const updated = await tx.dailyRecord.update({
      where: { id: existing.id },
      data: { [buyerField]: { increment: 1 } },
    });

    await tx.sale.create({
      data: {
        date: dateValue,
        type,
        amountKes,
        items: items ?? null,
        dailyRecordId: updated.id,
      },
    });

    return tx.dailyRecord.findUniqueOrThrow({
      where: { id: updated.id },
      include: { sales: true },
    });
  });

  return NextResponse.json(serializeDailyRecord(record), { status: 201 });
}
