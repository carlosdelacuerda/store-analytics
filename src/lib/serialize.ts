import { DailyRecord, Improvement, Sale } from "@prisma/client";
import { DailyRecordDTO, ImprovementDTO, SaleDTO } from "@/types";
import { dateToDateString } from "./dates";

export function serializeSale(sale: Sale): SaleDTO {
  return {
    id: sale.id,
    date: dateToDateString(sale.date),
    type: sale.type,
    amountKes: Number(sale.amountKes),
    items: sale.items,
    dailyRecordId: sale.dailyRecordId,
    createdAt: sale.createdAt.toISOString(),
  };
}

export function serializeDailyRecord(
  record: DailyRecord & { sales: Sale[] }
): DailyRecordDTO {
  return {
    id: record.id,
    date: dateToDateString(record.date),
    foreignPassers: record.foreignPassers,
    localPassers: record.localPassers,
    foreignVisitors: record.foreignVisitors,
    localVisitors: record.localVisitors,
    foreignBuyers: record.foreignBuyers,
    localBuyers: record.localBuyers,
    weather: record.weather as DailyRecordDTO["weather"],
    dayType: record.dayType as DailyRecordDTO["dayType"],
    specialNotes: record.specialNotes,
    missingProducts: record.missingProducts,
    notes: record.notes,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    sales: record.sales.map(serializeSale),
  };
}

export function serializeImprovement(improvement: Improvement): ImprovementDTO {
  return {
    id: improvement.id,
    title: improvement.title,
    type: improvement.type as ImprovementDTO["type"],
    description: improvement.description,
    implementationDate: dateToDateString(improvement.implementationDate),
    createdAt: improvement.createdAt.toISOString(),
  };
}
