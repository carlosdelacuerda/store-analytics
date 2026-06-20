import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeStockItem } from "@/lib/serialize";
import { stockItemSchema } from "@/lib/validation";

export async function GET() {
  const items = await prisma.stockItem.findMany({
    orderBy: [{ createdAt: "desc" }],
  });
  return NextResponse.json(items.map(serializeStockItem));
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = stockItemSchema.safeParse(body ?? {});
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 }
    );
  }

  const item = await prisma.stockItem.create({ data: parsed.data });
  return NextResponse.json(serializeStockItem(item), { status: 201 });
}
