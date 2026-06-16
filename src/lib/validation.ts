import { z } from "zod";

export const weatherOptions = ["Sunny", "Cloudy", "Rainy", "Windy"] as const;
export const dayTypeOptions = [
  "Normal Day",
  "Weekend",
  "Public Holiday",
  "School Holiday",
  "Festival",
  "Cruise Arrival",
  "Other",
] as const;
export const improvementTypeOptions = [
  "Signage",
  "Product",
  "Promotion",
  "Layout",
  "Pricing",
  "Staff",
  "Other",
] as const;
export const saleTypeOptions = ["foreign", "local"] as const;

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional().default(false),
});

const nonNegativeInt = z.coerce.number().int().min(0);

export const dailyRecordSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  foreignPassers: nonNegativeInt.optional().default(0),
  localPassers: nonNegativeInt.optional().default(0),
  foreignVisitors: nonNegativeInt.optional().default(0),
  localVisitors: nonNegativeInt.optional().default(0),
  foreignBuyers: nonNegativeInt.optional().default(0),
  localBuyers: nonNegativeInt.optional().default(0),
  weather: z.enum(weatherOptions).nullable().optional(),
  dayType: z.enum(dayTypeOptions).nullable().optional(),
  specialNotes: z.string().nullable().optional(),
  missingProducts: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export type DailyRecordInput = z.infer<typeof dailyRecordSchema>;

export const saleSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  type: z.enum(saleTypeOptions),
  amountKes: z.coerce.number().positive("Amount must be greater than 0"),
  items: z.string().nullable().optional(),
});

export type SaleInput = z.infer<typeof saleSchema>;

export const saleUpdateSchema = z.object({
  amountKes: z.coerce.number().positive("Amount must be greater than 0").optional(),
  items: z.string().nullable().optional(),
});

export const improvementSchema = z.object({
  title: z.string().min(1, "Title is required"),
  type: z.enum(improvementTypeOptions),
  description: z.string().nullable().optional(),
  implementationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
});

export type ImprovementInput = z.infer<typeof improvementSchema>;
