import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeImprovement } from "@/lib/serialize";
import { improvementSchema } from "@/lib/validation";
import { dateStringToUTCDate } from "@/lib/dates";

export async function GET() {
  const items = await prisma.improvement.findMany({ orderBy: { implementationDate: "desc" } });
  return NextResponse.json(items.map(serializeImprovement));
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = improvementSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request" }, { status: 400 });
  }
  const { title, type, description, implementationDate } = parsed.data;
  const item = await prisma.improvement.create({
    data: { title, type, description: description ?? null, implementationDate: dateStringToUTCDate(implementationDate) },
  });
  return NextResponse.json(serializeImprovement(item), { status: 201 });
}
