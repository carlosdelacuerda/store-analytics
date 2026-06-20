import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { ImprovementDTO, ImprovementType } from "@/types";

interface ImprovementsState {
  items: ImprovementDTO[];
  status: "idle" | "loading" | "succeeded" | "failed";
  mutationStatus: "idle" | "saving" | "failed";
  error: string | null;
}

const initialState: ImprovementsState = {
  items: [],
  status: "idle",
  mutationStatus: "idle",
  error: null,
};

export const fetchImprovements = createAsyncThunk("improvements/fetch", async () => {
  const res = await fetch("/api/improvements", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load improvements");
  const data: ImprovementDTO[] = await res.json();
  return data;
});

export interface ImprovementFormData {
  title: string;
  type: ImprovementType;
  description: string | null;
  implementationDate: string;
}

export const createImprovement = createAsyncThunk(
  "improvements/create",
  async (data: ImprovementFormData) => {
    const res = await fetch("/api/improvements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error ?? "Failed to create improvement");
    }
    const result: ImprovementDTO = await res.json();
    return result;
  }
);

export const updateImprovement = createAsyncThunk(
  "improvements/update",
  async ({ id, data }: { id: string; data: ImprovementFormData }) => {
    const res = await fetch(`/api/improvements/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error ?? "Failed to update improvement");
    }
    const result: ImprovementDTO = await res.json();
    return result;
  }
);

export const deleteImprovement = createAsyncThunk(
  "improvements/delete",
  async (id: string) => {
    const res = await fetch(`/api/improvements/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error ?? "Failed to delete improvement");
    }
    return id;
  }
);

const improvementsSlice = createSlice({
  name: "improvements",
  initialState,
  reducers: {
    clearImprovementsError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchImprovements.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchImprovements.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchImprovements.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message ?? "Failed to load improvements";
      })
      .addCase(createImprovement.pending, (state) => {
        state.mutationStatus = "saving";
        state.error = null;
      })
      .addCase(createImprovement.fulfilled, (state, action) => {
        state.mutationStatus = "idle";
        state.items.unshift(action.payload);
        state.items.sort((a, b) =>
          a.implementationDate < b.implementationDate ? 1 : -1
        );
      })
      .addCase(createImprovement.rejected, (state, action) => {
        state.mutationStatus = "failed";
        state.error = action.error.message ?? "Failed to create improvement";
      })
      .addCase(updateImprovement.fulfilled, (state, action) => {
        const idx = state.items.findIndex((i) => i.id === action.payload.id);
        if (idx !== -1) state.items[idx] = action.payload;
      })
      .addCase(updateImprovement.rejected, (state, action) => {
        state.mutationStatus = "failed";
        state.error = action.error.message ?? "Failed to update improvement";
      })
      .addCase(deleteImprovement.fulfilled, (state, action) => {
        state.items = state.items.filter((i) => i.id !== action.payload);
      })
      .addCase(deleteImprovement.rejected, (state, action) => {
        state.error = action.error.message ?? "Failed to delete improvement";
      });
  },
});

export const { clearImprovementsError } = improvementsSlice.actions;

export default improvementsSlice.reducer;
