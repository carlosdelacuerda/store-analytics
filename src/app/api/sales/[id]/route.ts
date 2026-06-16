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

  const sale = await prisma.sale.findUnique({ where: { id } });
  if (!sale) {
    return NextResponse.json({ error: "Sale not found" }, { status: 404 });
  }

  const buyerField = sale.type === "foreign" ? "foreignBuyers" : "localBuyers";

  const record = await prisma.$transaction(async (tx) => {
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
  });

  return NextResponse.json(serializeDailyRecord(record));
}
