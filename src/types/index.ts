export type Weather = "Sunny" | "Cloudy" | "Rainy" | "Windy";

export type DayType =
  | "Normal Day"
  | "Weekend"
  | "Public Holiday"
  | "School Holiday"
  | "Festival"
  | "Cruise Arrival"
  | "Other";

export type ImprovementType =
  | "Signage"
  | "Product"
  | "Promotion"
  | "Layout"
  | "Pricing"
  | "Staff"
  | "Other";

export type SaleType = "foreign" | "local";

export interface StockItemDTO {
  id: string;
  name: string | null;
  model: string | null;
  purchasePrice: number | null;
  salePrice: number | null;
  notes: string | null;
  units: number;
  createdAt: string;
  updatedAt: string;
}

export interface SaleItemDTO {
  id: string;
  saleId: string;
  stockItemId: string | null;
  label: string;
  quantity: number;
  unitPriceKes: number | null;
  createdAt: string;
}

export interface SaleDTO {
  id: string;
  date: string; // YYYY-MM-DD
  type: SaleType;
  amountKes: number;
  items: string | null;
  dailyRecordId: string;
  createdAt: string;
  saleItems: SaleItemDTO[];
}

export interface DailyRecordDTO {
  id: string;
  date: string; // YYYY-MM-DD
  foreignPassers: number;
  localPassers: number;
  foreignVisitors: number;
  localVisitors: number;
  foreignBuyers: number;
  localBuyers: number;
  weather: Weather | null;
  dayType: DayType | null;
  specialNotes: string | null;
  missingProducts: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  sales: SaleDTO[];
}

export interface ImprovementDTO {
  id: string;
  title: string;
  type: ImprovementType;
  description: string | null;
  implementationDate: string; // YYYY-MM-DD
  createdAt: string;
}

export interface EmptyDailyRecordDTO {
  id: null;
  date: string;
  foreignPassers: number;
  localPassers: number;
  foreignVisitors: number;
  localVisitors: number;
  foreignBuyers: number;
  localBuyers: number;
  weather: Weather | null;
  dayType: DayType | null;
  specialNotes: string | null;
  missingProducts: string | null;
  notes: string | null;
  createdAt: null;
  updatedAt: null;
  sales: SaleDTO[];
}

export type DailyRecordOrEmptyDTO = DailyRecordDTO | EmptyDailyRecordDTO;

// ----- Statistics -----

export interface TotalsStats {
  foreignPassers: number;
  localPassers: number;
  foreignVisitors: number;
  localVisitors: number;
  foreignBuyers: number;
  localBuyers: number;
}

export interface RevenueStats {
  total: number;
  foreign: number;
  local: number;
}

export interface AverageTicketStats {
  foreign: number;
  local: number;
  overall: number;
}

export interface FunnelStats {
  passers: number;
  visitors: number;
  buyers: number;
  visitorRate: number; // visitors / passers
  purchaseRate: number; // buyers / visitors
  conversionRate: number; // buyers / passers
}

export interface FunnelAnalysis {
  foreign: FunnelStats;
  local: FunnelStats;
  combined: FunnelStats;
}

export interface DayHighlight {
  date: string;
  value: number;
}

export interface BestWorstDays {
  highestBuyers: DayHighlight | null;
  highestRevenue: DayHighlight | null;
  highestConversion: DayHighlight | null;
  lowestBuyers: DayHighlight | null;
  lowestRevenue: DayHighlight | null;
  lowestConversion: DayHighlight | null;
}

export interface WeeklyAnalysisRow {
  day: string;
  count: number;
  avgForeignVisitors: number;
  avgLocalVisitors: number;
  avgForeignBuyers: number;
  avgLocalBuyers: number;
  avgRevenue: number;
  avgConversion: number;
}

export interface GroupedAnalysisRow {
  key: string;
  count: number;
  avgVisitors: number;
  avgBuyers: number;
  avgRevenue: number;
  avgConversion: number;
}

export interface TimeSeriesPoint {
  date: string;
  revenue: number;
  foreignRevenue: number;
  localRevenue: number;
  buyers: number;
  foreignBuyers: number;
  localBuyers: number;
  visitors: number;
  foreignVisitors: number;
  localVisitors: number;
  passers: number;
  conversionRate: number;
}

export interface StatisticsResponse {
  totals: TotalsStats;
  revenue: RevenueStats;
  averageTicket: AverageTicketStats;
  funnel: FunnelAnalysis;
  bestWorst: BestWorstDays;
  weekly: WeeklyAnalysisRow[];
  weather: GroupedAnalysisRow[];
  dayType: GroupedAnalysisRow[];
  timeSeries: TimeSeriesPoint[];
  recordCount: number;
}

// ----- Improvement impact -----

export interface ImpactWindowMetrics {
  visitors: number;
  buyers: number;
  revenue: number;
  conversionRate: number;
  days: number;
}

export interface ImpactSegment {
  before7: ImpactWindowMetrics;
  after7: ImpactWindowMetrics;
  before30: ImpactWindowMetrics;
  after30: ImpactWindowMetrics;
  changes: {
    revenueChange7: number;
    buyersChange7: number;
    conversionChange7: number;
    revenueChange30: number;
    buyersChange30: number;
    conversionChange30: number;
  };
}

export interface ImprovementImpactResponse {
  improvement: ImprovementDTO;
  foreign: ImpactSegment;
  local: ImpactSegment;
  combined: ImpactSegment;
}
