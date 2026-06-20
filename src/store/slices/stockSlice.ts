import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { StockItemDTO } from "@/types";

export interface StockItemFormData {
  name: string | null;
  model: string | null;
  purchasePrice: number | null;
  salePrice: number | null;
  notes: string | null;
  units: number;
}

interface StockState {
  items: StockItemDTO[];
  status: "idle" | "loading" | "succeeded" | "failed";
  mutationStatus: "idle" | "saving" | "failed";
  error: string | null;
}

const initialState: StockState = {
  items: [],
  status: "idle",
  mutationStatus: "idle",
  error: null,
};

export const fetchStock = createAsyncThunk("stock/fetch", async () => {
  const res = await fetch("/api/stock", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load stock");
  const data: StockItemDTO[] = await res.json();
  return data;
});

export const createStockItem = createAsyncThunk(
  "stock/create",
  async (data: StockItemFormData) => {
    const res = await fetch("/api/stock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error ?? "Failed to create stock item");
    }
    const result: StockItemDTO = await res.json();
    return result;
  }
);

export const updateStockItem = createAsyncThunk(
  "stock/update",
  async ({ id, data }: { id: string; data: StockItemFormData }) => {
    const res = await fetch(`/api/stock/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error ?? "Failed to update stock item");
    }
    const result: StockItemDTO = await res.json();
    return result;
  }
);

export const adjustStockUnits = createAsyncThunk(
  "stock/adjustUnits",
  async ({ id, delta }: { id: string; delta: number }) => {
    const res = await fetch(`/api/stock/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ delta }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error ?? "Failed to adjust stock units");
    }
    const result: StockItemDTO = await res.json();
    return result;
  }
);

export const deleteStockItem = createAsyncThunk("stock/delete", async (id: string) => {
  const res = await fetch(`/api/stock/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Failed to delete stock item");
  }
  return id;
});

const stockSlice = createSlice({
  name: "stock",
  initialState,
  reducers: {
    clearStockError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchStock.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchStock.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchStock.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message ?? "Failed to load stock";
      })
      .addCase(createStockItem.pending, (state) => {
        state.mutationStatus = "saving";
        state.error = null;
      })
      .addCase(createStockItem.fulfilled, (state, action) => {
        state.mutationStatus = "idle";
        state.items.unshift(action.payload);
      })
      .addCase(createStockItem.rejected, (state, action) => {
        state.mutationStatus = "failed";
        state.error = action.error.message ?? "Failed to create stock item";
      })
      .addCase(updateStockItem.pending, (state) => {
        state.mutationStatus = "saving";
        state.error = null;
      })
      .addCase(updateStockItem.fulfilled, (state, action) => {
        state.mutationStatus = "idle";
        const idx = state.items.findIndex((item) => item.id === action.payload.id);
        if (idx !== -1) state.items[idx] = action.payload;
      })
      .addCase(updateStockItem.rejected, (state, action) => {
        state.mutationStatus = "failed";
        state.error = action.error.message ?? "Failed to update stock item";
      })
      .addCase(adjustStockUnits.fulfilled, (state, action) => {
        const idx = state.items.findIndex((item) => item.id === action.payload.id);
        if (idx !== -1) state.items[idx] = action.payload;
      })
      .addCase(adjustStockUnits.rejected, (state, action) => {
        state.error = action.error.message ?? "Failed to adjust stock units";
      })
      .addCase(deleteStockItem.pending, (state) => {
        state.mutationStatus = "saving";
        state.error = null;
      })
      .addCase(deleteStockItem.fulfilled, (state, action) => {
        state.mutationStatus = "idle";
        state.items = state.items.filter((item) => item.id !== action.payload);
      })
      .addCase(deleteStockItem.rejected, (state, action) => {
        state.error = action.error.message ?? "Failed to delete stock item";
      });
  },
});

export const { clearStockError } = stockSlice.actions;

export default stockSlice.reducer;
