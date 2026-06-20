import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeStockItem } from "@/lib/serialize";
import { stockItemSchema, stockUnitsSchema } from "@/lib/validation";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = stockItemSchema.safeParse(body ?? {});
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 }
    );
  }

  const item = await prisma.stockItem.update({
    where: { id },
    data: parsed.data,
  });
  return NextResponse.json(serializeStockItem(item));
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = stockUnitsSchema.safeParse(body ?? {});
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 }
    );
  }

  const item = await prisma.$transaction(
    async (tx) => {
      const current = await tx.stockItem.findUnique({ where: { id } });
      if (!current) return null;
      return tx.stockItem.update({
        where: { id },
        data: { units: Math.max(0, current.units + parsed.data.delta) },
      });
    },
    { timeout: 20000, maxWait: 10000 }
  );

  if (!item) {
    return NextResponse.json({ error: "Stock item not found" }, { status: 404 });
  }

  return NextResponse.json(serializeStockItem(item));
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.stockItem.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
