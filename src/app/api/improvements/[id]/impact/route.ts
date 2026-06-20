import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeDailyRecord, serializeImprovement } from "@/lib/serialize";
import { computeDayMetrics, computeImpactSegment } from "@/lib/statistics";
import { addDaysToDateString } from "@/lib/dates";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const improvement = await prisma.improvement.findUnique({ where: { id } });
  if (!improvement) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const implDate = improvement.implementationDate.toISOString().slice(0, 10);
  const from = addDaysToDateString(implDate, -30);
  const to = addDaysToDateString(implDate, 30);

  const records = await prisma.dailyRecord.findMany({
    where: { date: { gte: new Date(`${from}T00:00:00Z`), lte: new Date(`${to}T00:00:00Z`) } },
    include: { sales: true },
    orderBy: { date: "asc" },
  });

  const days = computeDayMetrics(records.map(serializeDailyRecord));

  return NextResponse.json({
    improvement: serializeImprovement(improvement),
    foreign: computeImpactSegment(days, implDate, "foreign"),
    local: computeImpactSegment(days, implDate, "local"),
    combined: computeImpactSegment(days, implDate, "combined"),
  });
}
