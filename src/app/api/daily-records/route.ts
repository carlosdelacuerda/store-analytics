import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeDailyRecord } from "@/lib/serialize";
import { dateStringToUTCDate } from "@/lib/dates";

/**
 * GET /api/daily-records?from=YYYY-MM-DD&to=YYYY-MM-DD
 * Returns all daily records (with sales) ordered by date ascending,
 * optionally filtered to an inclusive date range.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const where: { date?: { gte?: Date; lte?: Date } } = {};
  if (from || to) {
    where.date = {};
    if (from) where.date.gte = dateStringToUTCDate(from);
    if (to) where.date.lte = dateStringToUTCDate(to);
  }

  const records = await prisma.dailyRecord.findMany({
    where,
    include: { sales: true },
    orderBy: { date: "asc" },
  });

  return NextResponse.json(records.map(serializeDailyRecord));
}
