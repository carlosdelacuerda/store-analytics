import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  DailyRecordDTO,
  DailyRecordOrEmptyDTO,
  DayType,
  SaleType,
  Weather,
} from "@/types";

export const COUNTER_FIELDS = [
  "foreignPassers",
  "localPassers",
  "foreignVisitors",
  "localVisitors",
  "foreignBuyers",
  "localBuyers",
] as const;

export type CounterField = (typeof COUNTER_FIELDS)[number];

export function emptyRecordForDate(date: string): DailyRecordOrEmptyDTO {
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

interface DailyRecordState {
  selectedDate: string;
  record: DailyRecordOrEmptyDTO | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  saveStatus: "idle" | "saving" | "succeeded" | "failed";
  saleStatus: "idle" | "saving" | "failed";
  deleteStatus: "idle" | "deleting" | "failed";
  error: string | null;
  isDirty: boolean;
}

function todayUTC(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()))
    .toISOString()
    .slice(0, 10);
}

const initialState: DailyRecordState = {
  selectedDate: todayUTC(),
  record: null,
  status: "idle",
  saveStatus: "idle",
  saleStatus: "idle",
  deleteStatus: "idle",
  error: null,
  isDirty: false,
};

export const fetchDailyRecord = createAsyncThunk(
  "dailyRecord/fetch",
  async (date: string) => {
    const res = await fetch(`/api/daily-records/${date}`, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to load day");
    const data: DailyRecordOrEmptyDTO = await res.json();
    return data;
  }
);

export interface SaveDailyRecordArgs {
  date: string;
  data: {
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
  };
}

export const saveDailyRecord = createAsyncThunk(
  "dailyRecord/save",
  async ({ date, data }: SaveDailyRecordArgs) => {
    const res = await fetch(`/api/daily-records/${date}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, ...data }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error ?? "Failed to save day");
    }
    const result: DailyRecordDTO = await res.json();
    return result;
  }
);

export const deleteDailyRecord = createAsyncThunk(
  "dailyRecord/delete",
  async (date: string) => {
    const res = await fetch(`/api/daily-records/${date}`, { method: "DELETE" });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error ?? "Failed to delete day");
    }
    return date;
  }
);

export interface AddSaleArgs {
  date: string;
  type: SaleType;
  amountKes: number;
  items: string | null;
  saleItems?: {
    stockItemId: string | null;
    label: string;
    quantity: number;
    unitPriceKes: number | null;
  }[];
}

export const addSale = createAsyncThunk("dailyRecord/addSale", async (args: AddSaleArgs) => {
  const res = await fetch("/api/sales", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(args),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Failed to record sale");
  }
  const result: DailyRecordDTO = await res.json();
  return result;
});

export const deleteSale = createAsyncThunk("dailyRecord/deleteSale", async (saleId: string) => {
  const res = await fetch(`/api/sales/${saleId}`, { method: "DELETE" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Failed to delete sale");
  }
  const result: DailyRecordDTO = await res.json();
  return result;
});

const dailyRecordSlice = createSlice({
  name: "dailyRecord",
  initialState,
  reducers: {
    setSelectedDate(state, action: PayloadAction<string>) {
      state.selectedDate = action.payload;
      state.record = null;
      state.status = "idle";
      state.isDirty = false;
    },
    adjustCounter(
      state,
      action: PayloadAction<{ field: CounterField; delta: number }>
    ) {
      if (!state.record) return;
      const { field, delta } = action.payload;
      const next = state.record[field] + delta;
      state.record[field] = Math.max(0, next);
      state.isDirty = true;
    },
    setContextField(
      state,
      action: PayloadAction<{
        field: "weather" | "dayType" | "specialNotes" | "missingProducts" | "notes";
        value: string | null;
      }>
    ) {
      if (!state.record) return;
      const { field, value } = action.payload;
      (state.record as Record<string, unknown>)[field] = value;
      state.isDirty = true;
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDailyRecord.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchDailyRecord.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.record = action.payload;
        state.isDirty = false;
      })
      .addCase(fetchDailyRecord.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message ?? "Failed to load day";
      })
      .addCase(saveDailyRecord.pending, (state) => {
        state.saveStatus = "saving";
        state.error = null;
      })
      .addCase(saveDailyRecord.fulfilled, (state, action) => {
        state.saveStatus = "succeeded";
        state.record = action.payload;
        state.isDirty = false;
      })
      .addCase(saveDailyRecord.rejected, (state, action) => {
        state.saveStatus = "failed";
        state.error = action.error.message ?? "Failed to save day";
      })
      .addCase(deleteDailyRecord.pending, (state) => {
        state.deleteStatus = "deleting";
        state.error = null;
      })
      .addCase(deleteDailyRecord.fulfilled, (state) => {
        state.deleteStatus = "idle";
        if (state.record) {
          state.record = emptyRecordForDate(state.record.date);
        }
        state.isDirty = false;
      })
      .addCase(deleteDailyRecord.rejected, (state, action) => {
        state.deleteStatus = "failed";
        state.error = action.error.message ?? "Failed to delete day";
      })
      .addCase(addSale.pending, (state) => {
        state.saleStatus = "saving";
        state.error = null;
      })
      .addCase(addSale.fulfilled, (state, action) => {
        state.saleStatus = "idle";
        state.record = action.payload;
      })
      .addCase(addSale.rejected, (state, action) => {
        state.saleStatus = "failed";
        state.error = action.error.message ?? "Failed to record sale";
      })
      .addCase(deleteSale.fulfilled, (state, action) => {
        state.record = action.payload;
      })
      .addCase(deleteSale.rejected, (state, action) => {
        state.error = action.error.message ?? "Failed to delete sale";
      });
  },
});

export const { setSelectedDate, adjustCounter, setContextField, clearError } =
  dailyRecordSlice.actions;

export default dailyRecordSlice.reducer;
