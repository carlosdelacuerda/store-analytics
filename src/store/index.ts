import { configureStore } from "@reduxjs/toolkit";
import dailyRecordReducer from "./slices/dailyRecordSlice";
import uiReducer from "./slices/uiSlice";
import improvementsReducer from "./slices/improvementsSlice";

export const store = configureStore({
  reducer: {
    dailyRecord: dailyRecordReducer,
    ui: uiReducer,
    improvements: improvementsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
