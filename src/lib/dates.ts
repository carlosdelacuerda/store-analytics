/**
 * Date helpers. All dates are stored and compared as UTC midnight to avoid
 * timezone drift between the database (Postgres DATE) and the client.
 */

/** Convert a "YYYY-MM-DD" string into a UTC midnight Date for Prisma writes. */
export function dateStringToUTCDate(dateString: string): Date {
  return new Date(`${dateString}T00:00:00.000Z`);
}

/** Convert a Date (assumed UTC midnight) into a "YYYY-MM-DD" string. */
export function dateToDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Today as a "YYYY-MM-DD" string (server's local date interpreted as UTC date string). */
export function todayDateString(): string {
  const now = new Date();
  const utc = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  return dateToDateString(utc);
}

/** Add (or subtract, with negative) a number of days to a "YYYY-MM-DD" string. */
export function addDaysToDateString(dateString: string, days: number): string {
  const date = dateStringToUTCDate(dateString);
  date.setUTCDate(date.getUTCDate() + days);
  return dateToDateString(date);
}

/** Inclusive day difference between two "YYYY-MM-DD" strings (b - a). */
export function dateStringDiffInDays(a: string, b: string): number {
  const dateA = dateStringToUTCDate(a).getTime();
  const dateB = dateStringToUTCDate(b).getTime();
  return Math.round((dateB - dateA) / (1000 * 60 * 60 * 24));
}

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

/** Get the day-of-week name for a "YYYY-MM-DD" string, using UTC. */
export function getDayOfWeekName(dateString: string): string {
  const date = dateStringToUTCDate(dateString);
  return DAY_NAMES[date.getUTCDay()];
}

export const WEEKDAY_ORDER = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

/** Format a "YYYY-MM-DD" string for display, e.g. "Mon, 15 Jun 2026". */
export function formatDateForDisplay(dateString: string): string {
  const date = dateStringToUTCDate(dateString);
  return date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** True if `date` (YYYY-MM-DD) is within [start, end] inclusive (YYYY-MM-DD strings). */
export function isDateInRange(date: string, start: string, end: string): boolean {
  return date >= start && date <= end;
}
