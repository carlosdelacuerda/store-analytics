import { configureStore } from "@reduxjs/toolkit";
import dailyRecordReducer from "./slices/dailyRecordSlice";
import uiReducer from "./slices/uiSlice";
import improvementsReducer from "./slices/improvementsSlice";
import stockReducer from "./slices/stockSlice";
import loadingReducer from "./slices/loadingSlice";
import authReducer from "./slices/authSlice";
import { loadingMiddleware } from "./middleware/loadingMiddleware";

export const store = configureStore({
  reducer: {
    dailyRecord: dailyRecordReducer,
    ui: uiReducer,
    improvements: improvementsReducer,
    stock: stockReducer,
    loading: loadingReducer,
    auth: authReducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(loadingMiddleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
