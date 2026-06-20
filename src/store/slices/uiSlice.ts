import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { SaleType } from "@/types";

interface UiState {
  saleModal: {
    open: boolean;
    type: SaleType | null;
  };
  confirmDeleteDay: {
    open: boolean;
  };
}

const initialState: UiState = {
  saleModal: { open: false, type: null },
  confirmDeleteDay: { open: false },
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    openSaleModal(state, action: PayloadAction<SaleType>) {
      state.saleModal = { open: true, type: action.payload };
    },
    closeSaleModal(state) {
      state.saleModal = { open: false, type: null };
    },
    openConfirmDeleteDay(state) {
      state.confirmDeleteDay.open = true;
    },
    closeConfirmDeleteDay(state) {
      state.confirmDeleteDay.open = false;
    },
  },
});

export const { openSaleModal, closeSaleModal, openConfirmDeleteDay, closeConfirmDeleteDay } =
  uiSlice.actions;

export default uiSlice.reducer;
