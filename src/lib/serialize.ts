import { DailyRecord, Improvement, Sale, SaleItem, StockItem } from "@prisma/client";
import { DailyRecordDTO, ImprovementDTO, SaleDTO, SaleItemDTO, StockItemDTO } from "@/types";
import { dateToDateString } from "./dates";

export function serializeStockItem(item: StockItem): StockItemDTO {
  return {
    id: item.id,
    name: item.name,
    model: item.model,
    purchasePrice: item.purchasePrice == null ? null : Number(item.purchasePrice),
    salePrice: item.salePrice == null ? null : Number(item.salePrice),
    notes: item.notes,
    units: item.units,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

export function serializeSaleItem(item: SaleItem): SaleItemDTO {
  return {
    id: item.id,
    saleId: item.saleId,
    stockItemId: item.stockItemId,
    label: item.label,
    quantity: item.quantity,
    unitPriceKes: item.unitPriceKes == null ? null : Number(item.unitPriceKes),
    createdAt: item.createdAt.toISOString(),
  };
}

export function serializeSale(sale: Sale & { saleItems?: SaleItem[] }): SaleDTO {
  return {
    id: sale.id,
    date: dateToDateString(sale.date),
    type: sale.type,
    amountKes: Number(sale.amountKes),
    items: sale.items,
    dailyRecordId: sale.dailyRecordId,
    createdAt: sale.createdAt.toISOString(),
    saleItems: sale.saleItems?.map(serializeSaleItem) ?? [],
  };
}

export function serializeDailyRecord(
  record: DailyRecord & { sales: (Sale & { saleItems?: SaleItem[] })[] }
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
