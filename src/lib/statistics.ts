import {
  AverageTicketStats,
  BestWorstDays,
  DailyRecordDTO,
  FunnelAnalysis,
  FunnelStats,
  GroupedAnalysisRow,
  ImpactSegment,
  ImpactWindowMetrics,
  RevenueStats,
  TimeSeriesPoint,
  TotalsStats,
  WeeklyAnalysisRow,
} from "@/types";
import {
  addDaysToDateString,
  dateStringDiffInDays,
  getDayOfWeekName,
  isDateInRange,
  WEEKDAY_ORDER,
} from "./dates";

export interface DayMetrics {
  date: string;
  weather: string | null;
  dayType: string | null;
  foreignPassers: number;
  localPassers: number;
  foreignVisitors: number;
  localVisitors: number;
  foreignBuyers: number;
  localBuyers: number;
  foreignRevenue: number;
  localRevenue: number;
  totalPassers: number;
  totalVisitors: number;
  totalBuyers: number;
  totalRevenue: number;
  conversionRate: number;
}

function safeDivide(numerator: number, denominator: number): number {
  if (!denominator) return 0;
  return numerator / denominator;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Convert raw daily records (with sales) into per-day computed metrics. */
export function computeDayMetrics(records: DailyRecordDTO[]): DayMetrics[] {
  return records.map((record) => {
    let foreignRevenue = 0;
    let localRevenue = 0;
    for (const sale of record.sales) {
      if (sale.type === "foreign") foreignRevenue += sale.amountKes;
      else localRevenue += sale.amountKes;
    }

    const totalPassers = record.foreignPassers + record.localPassers;
    const totalVisitors = record.foreignVisitors + record.localVisitors;
    const totalBuyers = record.foreignBuyers + record.localBuyers;
    const totalRevenue = foreignRevenue + localRevenue;

    return {
      date: record.date,
      weather: record.weather,
      dayType: record.dayType,
      foreignPassers: record.foreignPassers,
      localPassers: record.localPassers,
      foreignVisitors: record.foreignVisitors,
      localVisitors: record.localVisitors,
      foreignBuyers: record.foreignBuyers,
      localBuyers: record.localBuyers,
      foreignRevenue,
      localRevenue,
      totalPassers,
      totalVisitors,
      totalBuyers,
      totalRevenue,
      conversionRate: safeDivide(totalBuyers, totalPassers),
    };
  });
}

export function getTotals(days: DayMetrics[]): TotalsStats {
  return days.reduce<TotalsStats>(
    (acc, d) => ({
      foreignPassers: acc.foreignPassers + d.foreignPassers,
      localPassers: acc.localPassers + d.localPassers,
      foreignVisitors: acc.foreignVisitors + d.foreignVisitors,
      localVisitors: acc.localVisitors + d.localVisitors,
      foreignBuyers: acc.foreignBuyers + d.foreignBuyers,
      localBuyers: acc.localBuyers + d.localBuyers,
    }),
    {
      foreignPassers: 0,
      localPassers: 0,
      foreignVisitors: 0,
      localVisitors: 0,
      foreignBuyers: 0,
      localBuyers: 0,
    }
  );
}

export function getRevenue(days: DayMetrics[]): RevenueStats {
  const foreign = days.reduce((sum, d) => sum + d.foreignRevenue, 0);
  const local = days.reduce((sum, d) => sum + d.localRevenue, 0);
  return {
    total: round2(foreign + local),
    foreign: round2(foreign),
    local: round2(local),
  };
}

export function getAverageTicket(days: DayMetrics[]): AverageTicketStats {
  const revenue = getRevenue(days);
  const totals = getTotals(days);
  const totalBuyers = totals.foreignBuyers + totals.localBuyers;
  return {
    foreign: round2(safeDivide(revenue.foreign, totals.foreignBuyers)),
    local: round2(safeDivide(revenue.local, totals.localBuyers)),
    overall: round2(safeDivide(revenue.total, totalBuyers)),
  };
}

function buildFunnelStats(passers: number, visitors: number, buyers: number): FunnelStats {
  return {
    passers,
    visitors,
    buyers,
    visitorRate: round2(safeDivide(visitors, passers) * 100),
    purchaseRate: round2(safeDivide(buyers, visitors) * 100),
    conversionRate: round2(safeDivide(buyers, passers) * 100),
  };
}

export function getFunnel(days: DayMetrics[]): FunnelAnalysis {
  const totals = getTotals(days);
  const foreign = buildFunnelStats(
    totals.foreignPassers,
    totals.foreignVisitors,
    totals.foreignBuyers
  );
  const local = buildFunnelStats(totals.localPassers, totals.localVisitors, totals.localBuyers);
  const combined = buildFunnelStats(
    totals.foreignPassers + totals.localPassers,
    totals.foreignVisitors + totals.localVisitors,
    totals.foreignBuyers + totals.localBuyers
  );
  return { foreign, local, combined };
}

export function getBestWorstDays(days: DayMetrics[]): BestWorstDays {
  if (days.length === 0) {
    return {
      highestBuyers: null,
      highestRevenue: null,
      highestConversion: null,
      lowestBuyers: null,
      lowestRevenue: null,
      lowestConversion: null,
    };
  }

  let highestBuyers = days[0];
  let lowestBuyers = days[0];
  let highestRevenue = days[0];
  let lowestRevenue = days[0];
  let highestConversion = days[0];
  let lowestConversion = days[0];

  for (const d of days) {
    if (d.totalBuyers > highestBuyers.totalBuyers) highestBuyers = d;
    if (d.totalBuyers < lowestBuyers.totalBuyers) lowestBuyers = d;
    if (d.totalRevenue > highestRevenue.totalRevenue) highestRevenue = d;
    if (d.totalRevenue < lowestRevenue.totalRevenue) lowestRevenue = d;
    if (d.conversionRate > highestConversion.conversionRate) highestConversion = d;
    if (d.conversionRate < lowestConversion.conversionRate) lowestConversion = d;
  }

  return {
    highestBuyers: { date: highestBuyers.date, value: highestBuyers.totalBuyers },
    highestRevenue: { date: highestRevenue.date, value: round2(highestRevenue.totalRevenue) },
    highestConversion: {
      date: highestConversion.date,
      value: round2(highestConversion.conversionRate * 100),
    },
    lowestBuyers: { date: lowestBuyers.date, value: lowestBuyers.totalBuyers },
    lowestRevenue: { date: lowestRevenue.date, value: round2(lowestRevenue.totalRevenue) },
    lowestConversion: {
      date: lowestConversion.date,
      value: round2(lowestConversion.conversionRate * 100),
    },
  };
}

export function getWeeklyAnalysis(days: DayMetrics[]): WeeklyAnalysisRow[] {
  const groups = new Map<string, DayMetrics[]>();
  for (const weekday of WEEKDAY_ORDER) groups.set(weekday, []);

  for (const d of days) {
    const weekday = getDayOfWeekName(d.date);
    groups.get(weekday)?.push(d);
  }

  return WEEKDAY_ORDER.map((weekday) => {
    const group = groups.get(weekday) ?? [];
    const count = group.length;
    return {
      day: weekday,
      count,
      avgForeignVisitors: round2(
        safeDivide(group.reduce((s, d) => s + d.foreignVisitors, 0), count)
      ),
      avgLocalVisitors: round2(
        safeDivide(group.reduce((s, d) => s + d.localVisitors, 0), count)
      ),
      avgForeignBuyers: round2(
        safeDivide(group.reduce((s, d) => s + d.foreignBuyers, 0), count)
      ),
      avgLocalBuyers: round2(safeDivide(group.reduce((s, d) => s + d.localBuyers, 0), count)),
      avgRevenue: round2(safeDivide(group.reduce((s, d) => s + d.totalRevenue, 0), count)),
      avgConversion: round2(
        safeDivide(group.reduce((s, d) => s + d.conversionRate, 0), count) * 100
      ),
    };
  });
}

function buildGroupedAnalysis(
  days: { key: string | null; metrics: DayMetrics }[],
  keys: string[]
): GroupedAnalysisRow[] {
  const groups = new Map<string, DayMetrics[]>();
  for (const key of keys) groups.set(key, []);

  for (const { key, metrics } of days) {
    if (key && groups.has(key)) {
      groups.get(key)?.push(metrics);
    }
  }

  return keys.map((key) => {
    const group = groups.get(key) ?? [];
    const count = group.length;
    return {
      key,
      count,
      avgVisitors: round2(safeDivide(group.reduce((s, d) => s + d.totalVisitors, 0), count)),
      avgBuyers: round2(safeDivide(group.reduce((s, d) => s + d.totalBuyers, 0), count)),
      avgRevenue: round2(safeDivide(group.reduce((s, d) => s + d.totalRevenue, 0), count)),
      avgConversion: round2(
        safeDivide(group.reduce((s, d) => s + d.conversionRate, 0), count) * 100
      ),
    };
  });
}

export const WEATHER_OPTIONS = ["Sunny", "Cloudy", "Rainy", "Windy"];
export const DAY_TYPE_OPTIONS = [
  "Normal Day",
  "Weekend",
  "Public Holiday",
  "School Holiday",
  "Festival",
  "Cruise Arrival",
  "Other",
];

export function getWeatherAnalysis(days: DayMetrics[]): GroupedAnalysisRow[] {
  return buildGroupedAnalysis(
    days.map((d) => ({ key: d.weather, metrics: d })),
    WEATHER_OPTIONS
  );
}

export function getDayTypeAnalysis(days: DayMetrics[]): GroupedAnalysisRow[] {
  return buildGroupedAnalysis(
    days.map((d) => ({ key: d.dayType, metrics: d })),
    DAY_TYPE_OPTIONS
  );
}

export function getTimeSeries(days: DayMetrics[]): TimeSeriesPoint[] {
  return [...days]
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
    .map((d) => ({
      date: d.date,
      revenue: round2(d.totalRevenue),
      foreignRevenue: round2(d.foreignRevenue),
      localRevenue: round2(d.localRevenue),
      buyers: d.totalBuyers,
      foreignBuyers: d.foreignBuyers,
      localBuyers: d.localBuyers,
      visitors: d.totalVisitors,
      foreignVisitors: d.foreignVisitors,
      localVisitors: d.localVisitors,
      passers: d.totalPassers,
      conversionRate: round2(d.conversionRate * 100),
    }));
}

// ----- Improvement impact analysis -----

type Segment = "foreign" | "local" | "combined";

function aggregateWindow(
  days: DayMetrics[],
  start: string,
  end: string,
  segment: Segment
): ImpactWindowMetrics {
  const inWindow = days.filter((d) => isDateInRange(d.date, start, end));

  let visitors = 0;
  let buyers = 0;
  let revenue = 0;
  let passers = 0;

  for (const d of inWindow) {
    if (segment === "foreign") {
      visitors += d.foreignVisitors;
      buyers += d.foreignBuyers;
      revenue += d.foreignRevenue;
      passers += d.foreignPassers;
    } else if (segment === "local") {
      visitors += d.localVisitors;
      buyers += d.localBuyers;
      revenue += d.localRevenue;
      passers += d.localPassers;
    } else {
      visitors += d.totalVisitors;
      buyers += d.totalBuyers;
      revenue += d.totalRevenue;
      passers += d.totalPassers;
    }
  }

  return {
    visitors,
    buyers,
    revenue: round2(revenue),
    conversionRate: round2(safeDivide(buyers, passers) * 100),
    days: inWindow.length,
  };
}

function percentChange(before: number, after: number): number {
  if (before === 0) {
    if (after === 0) return 0;
    return 100;
  }
  return round2(((after - before) / before) * 100);
}

/**
 * Compute before/after impact windows for an improvement implemented on
 * `implementationDate`. "Before" windows end the day before implementation;
 * "after" windows start on the implementation date itself.
 */
export function computeImpactSegment(
  days: DayMetrics[],
  implementationDate: string,
  segment: Segment
): ImpactSegment {
  const before7Start = addDaysToDateString(implementationDate, -7);
  const before7End = addDaysToDateString(implementationDate, -1);
  const after7Start = implementationDate;
  const after7End = addDaysToDateString(implementationDate, 6);

  const before30Start = addDaysToDateString(implementationDate, -30);
  const before30End = addDaysToDateString(implementationDate, -1);
  const after30Start = implementationDate;
  const after30End = addDaysToDateString(implementationDate, 29);

  const before7 = aggregateWindow(days, before7Start, before7End, segment);
  const after7 = aggregateWindow(days, after7Start, after7End, segment);
  const before30 = aggregateWindow(days, before30Start, before30End, segment);
  const after30 = aggregateWindow(days, after30Start, after30End, segment);

  return {
    before7,
    after7,
    before30,
    after30,
    changes: {
      revenueChange7: percentChange(before7.revenue, after7.revenue),
      buyersChange7: percentChange(before7.buyers, after7.buyers),
      conversionChange7: percentChange(before7.conversionRate, after7.conversionRate),
      revenueChange30: percentChange(before30.revenue, after30.revenue),
      buyersChange30: percentChange(before30.buyers, after30.buyers),
      conversionChange30: percentChange(before30.conversionRate, after30.conversionRate),
    },
  };
}

export { dateStringDiffInDays };
