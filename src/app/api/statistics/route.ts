import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeDailyRecord } from "@/lib/serialize";
import {
  computeDayMetrics, getTotals, getRevenue, getAverageTicket,
  getFunnel, getBestWorstDays, getWeeklyAnalysis,
  getWeatherAnalysis, getDayTypeAnalysis, getTimeSeries,
} from "@/lib/statistics";

export async function GET() {
  const records = await prisma.dailyRecord.findMany({
    include: { sales: true },
    orderBy: { date: "asc" },
  });

  const serialized = records.map(serializeDailyRecord);
  const days = computeDayMetrics(serialized);

  return NextResponse.json({
    totals: getTotals(days),
    revenue: getRevenue(days),
    averageTicket: getAverageTicket(days),
    funnel: getFunnel(days),
    bestWorst: getBestWorstDays(days),
    weekly: getWeeklyAnalysis(days),
    weather: getWeatherAnalysis(days),
    dayType: getDayTypeAnalysis(days),
    timeSeries: getTimeSeries(days),
    recordCount: records.length,
  });
}
