import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildCsv } from "@/lib/csv";
import { dateToDateString } from "@/lib/dates";

export async function GET(request: NextRequest) {
  const type = new URL(request.url).searchParams.get("type") ?? "daily";

  if (type === "daily") {
    const records = await prisma.dailyRecord.findMany({ include: { sales: true }, orderBy: { date: "asc" } });
    const rows = records.map((r) => {
      const fRev = r.sales.filter((s) => s.type === "foreign").reduce((a, s) => a + Number(s.amountKes), 0);
      const lRev = r.sales.filter((s) => s.type === "local").reduce((a, s) => a + Number(s.amountKes), 0);
      return {
        date: dateToDateString(r.date),
        foreignPassers: r.foreignPassers, localPassers: r.localPassers,
        foreignVisitors: r.foreignVisitors, localVisitors: r.localVisitors,
        foreignBuyers: r.foreignBuyers, localBuyers: r.localBuyers,
        foreignRevenue: fRev.toFixed(2), localRevenue: lRev.toFixed(2),
        totalRevenue: (fRev + lRev).toFixed(2),
        weather: r.weather ?? "", dayType: r.dayType ?? "",
        specialNotes: r.specialNotes ?? "", missingProducts: r.missingProducts ?? "", notes: r.notes ?? "",
      };
    });
    const csv = buildCsv(rows, [
      { key: "date", header: "Date" }, { key: "foreignPassers", header: "Foreign Passers" },
      { key: "localPassers", header: "Local Passers" }, { key: "foreignVisitors", header: "Foreign Visitors" },
      { key: "localVisitors", header: "Local Visitors" }, { key: "foreignBuyers", header: "Foreign Buyers" },
      { key: "localBuyers", header: "Local Buyers" }, { key: "foreignRevenue", header: "Foreign Revenue (KES)" },
      { key: "localRevenue", header: "Local Revenue (KES)" }, { key: "totalRevenue", header: "Total Revenue (KES)" },
      { key: "weather", header: "Weather" }, { key: "dayType", header: "Day Type" },
      { key: "specialNotes", header: "Special Notes" }, { key: "missingProducts", header: "Missing Products" },
      { key: "notes", header: "Notes" },
    ]);
    return new NextResponse(csv, { headers: { "Content-Type": "text/csv", "Content-Disposition": 'attachment; filename="daily-records.csv"' } });
  }

  if (type === "sales") {
    const sales = await prisma.sale.findMany({ orderBy: { date: "asc" } });
    const rows = sales.map((s) => ({ date: dateToDateString(s.date), type: s.type, amountKes: Number(s.amountKes).toFixed(2), items: s.items ?? "", dailyRecordId: s.dailyRecordId, createdAt: s.createdAt.toISOString() }));
    const csv = buildCsv(rows, [
      { key: "date", header: "Date" }, { key: "type", header: "Type" },
      { key: "amountKes", header: "Amount (KES)" }, { key: "items", header: "Items" },
      { key: "dailyRecordId", header: "Daily Record ID" }, { key: "createdAt", header: "Created At" },
    ]);
    return new NextResponse(csv, { headers: { "Content-Type": "text/csv", "Content-Disposition": 'attachment; filename="sales.csv"' } });
  }

  if (type === "improvements") {
    const items = await prisma.improvement.findMany({ orderBy: { implementationDate: "desc" } });
    const rows = items.map((i) => ({ title: i.title, type: i.type, description: i.description ?? "", implementationDate: dateToDateString(i.implementationDate), createdAt: i.createdAt.toISOString() }));
    const csv = buildCsv(rows, [
      { key: "title", header: "Title" }, { key: "type", header: "Type" },
      { key: "description", header: "Description" }, { key: "implementationDate", header: "Implementation Date" },
      { key: "createdAt", header: "Created At" },
    ]);
    return new NextResponse(csv, { headers: { "Content-Type": "text/csv", "Content-Disposition": 'attachment; filename="improvements.csv"' } });
  }

  if (type === "stock") {
    const items = await prisma.stockItem.findMany({ orderBy: { createdAt: "desc" } });
    const rows = items.map((i) => ({
      name: i.name ?? "",
      model: i.model ?? "",
      units: i.units,
      purchasePrice: i.purchasePrice == null ? "" : Number(i.purchasePrice).toFixed(2),
      salePrice: i.salePrice == null ? "" : Number(i.salePrice).toFixed(2),
      stockValue:
        i.purchasePrice == null ? "" : (Number(i.purchasePrice) * i.units).toFixed(2),
      notes: i.notes ?? "",
      createdAt: i.createdAt.toISOString(),
    }));
    const csv = buildCsv(rows, [
      { key: "name", header: "Name" }, { key: "model", header: "Model" },
      { key: "units", header: "Units" }, { key: "purchasePrice", header: "Purchase Price (KES)" },
      { key: "salePrice", header: "Sale Price (KES)" }, { key: "stockValue", header: "Stock Value (KES)" },
      { key: "notes", header: "Notes" }, { key: "createdAt", header: "Created At" },
    ]);
    return new NextResponse(csv, { headers: { "Content-Type": "text/csv", "Content-Disposition": 'attachment; filename="stock.csv"' } });
  }

  return NextResponse.json({ error: "Invalid export type" }, { status: 400 });
}
