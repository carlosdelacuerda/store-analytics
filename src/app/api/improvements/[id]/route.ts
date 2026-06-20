import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeImprovement } from "@/lib/serialize";
import { improvementSchema } from "@/lib/validation";
import { dateStringToUTCDate } from "@/lib/dates";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = improvementSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request" }, { status: 400 });
  }
  const { title, type, description, implementationDate } = parsed.data;
  const item = await prisma.improvement.update({
    where: { id },
    data: { title, type, description: description ?? null, implementationDate: dateStringToUTCDate(implementationDate) },
  });
  return NextResponse.json(serializeImprovement(item));
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.improvement.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
