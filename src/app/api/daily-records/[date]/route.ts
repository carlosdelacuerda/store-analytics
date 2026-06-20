import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeDailyRecord } from "@/lib/serialize";
import { dateStringToUTCDate } from "@/lib/dates";
import { dailyRecordSchema } from "@/lib/validation";
import { EmptyDailyRecordDTO } from "@/types";

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

async function findRecordForResponse(where: { id: string } | { date: Date }) {
  return prisma.dailyRecord.findUnique({
    where,
    include: { sales: { include: { saleItems: true } } },
  });
}

function emptyRecord(date: string): EmptyDailyRecordDTO {
  return {
    id: null,
    date,
    foreignPassers: 0,
    localPassers: 0,
    foreignVisitors: 0,
    localVisitors: 0,
    foreignBuyers: 0,
    localBuyers: 0,
    weather: null,
    dayType: null,
    specialNotes: null,
    missingProducts: null,
    notes: null,
    createdAt: null,
    updatedAt: null,
    sales: [],
  };
}

/** GET /api/daily-records/[date] — fetch a single day, or an empty placeholder if none exists. */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ date: string }> }
) {
  const { date } = await params;
  if (!DATE_REGEX.test(date)) {
    return NextResponse.json({ error: "Invalid date format, expected YYYY-MM-DD" }, { status: 400 });
  }

  const record = await findRecordForResponse({ date: dateStringToUTCDate(date) });

  if (!record) {
    return NextResponse.json(emptyRecord(date));
  }

  return NextResponse.json(serializeDailyRecord(record));
}

/** PUT /api/daily-records/[date] — create or update a day's record. */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ date: string }> }
) {
  const { date } = await params;
  if (!DATE_REGEX.test(date)) {
    return NextResponse.json({ error: "Invalid date format, expected YYYY-MM-DD" }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const parsed = dailyRecordSchema.safeParse({ ...body, date });
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const dateValue = dateStringToUTCDate(date);

  const record = await prisma.dailyRecord.upsert({
    where: { date: dateValue },
    create: {
      date: dateValue,
      foreignPassers: data.foreignPassers,
      localPassers: data.localPassers,
      foreignVisitors: data.foreignVisitors,
      localVisitors: data.localVisitors,
      foreignBuyers: data.foreignBuyers,
      localBuyers: data.localBuyers,
      weather: data.weather ?? null,
      dayType: data.dayType ?? null,
      specialNotes: data.specialNotes ?? null,
      missingProducts: data.missingProducts ?? null,
      notes: data.notes ?? null,
    },
    update: {
      foreignPassers: data.foreignPassers,
      localPassers: data.localPassers,
      foreignVisitors: data.foreignVisitors,
      localVisitors: data.localVisitors,
      foreignBuyers: data.foreignBuyers,
      localBuyers: data.localBuyers,
      weather: data.weather ?? null,
      dayType: data.dayType ?? null,
      specialNotes: data.specialNotes ?? null,
      missingProducts: data.missingProducts ?? null,
      notes: data.notes ?? null,
    },
  });

  const recordWithSales = await findRecordForResponse({ id: record.id });

  return NextResponse.json(serializeDailyRecord(recordWithSales ?? { ...record, sales: [] }));
}

/** DELETE /api/daily-records/[date] — delete a day and its related sales (cascade). */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ date: string }> }
) {
  const { date } = await params;
  if (!DATE_REGEX.test(date)) {
    return NextResponse.json({ error: "Invalid date format, expected YYYY-MM-DD" }, { status: 400 });
  }

  const dateValue = dateStringToUTCDate(date);
  const record = await findRecordForResponse({ date: dateValue });

  if (!record) {
    return NextResponse.json({ success: true });
  }

  await prisma.$transaction(
    async (tx) => {
      const linesToRestore = record.sales.flatMap((sale) =>
        sale.saleItems.filter((line) => line.stockItemId)
      );

      // Restore stock for every sale line across the whole day concurrently,
      // then delete the record. Keeping this transaction short avoids
      // Prisma's interactive-transaction timeout, especially after Neon's
      // compute has been idle and needs a moment to wake back up.
      await Promise.all(
        linesToRestore.map((line) =>
          tx.stockItem.update({
            where: { id: line.stockItemId as string },
            data: { units: { increment: line.quantity } },
          })
        )
      );

      await tx.dailyRecord.delete({ where: { id: record.id } });
    },
    { timeout: 20000, maxWait: 10000 }
  );

  return NextResponse.json({ success: true });
}
