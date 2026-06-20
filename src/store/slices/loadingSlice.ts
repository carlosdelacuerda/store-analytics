import { createSlice } from "@reduxjs/toolkit";

interface LoadingState {
  /** Number of fetch() calls currently in flight, tracked by the global fetch interceptor. */
  activeRequests: number;
}

const initialState: LoadingState = {
  activeRequests: 0,
};

const loadingSlice = createSlice({
  name: "loading",
  initialState,
  reducers: {
    requestStarted(state) {
      state.activeRequests += 1;
    },
    requestFinished(state) {
      state.activeRequests = Math.max(0, state.activeRequests - 1);
    },
  },
});

export const { requestStarted, requestFinished } = loadingSlice.actions;
export default loadingSlice.reducer;
