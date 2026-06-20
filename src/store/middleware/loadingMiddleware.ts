import { isFulfilled, isPending, isRejected, Middleware } from "@reduxjs/toolkit";
import { requestFinished, requestStarted } from "../slices/loadingSlice";

/**
 * Tracks every createAsyncThunk request app-wide and keeps loadingSlice's
 * activeRequests counter in sync — without each thunk needing to opt in
 * individually.
 *
 * This is the Redux Toolkit-native equivalent of an Angular HttpInterceptor:
 * every createAsyncThunk automatically dispatches a `xxx/pending` action
 * when it starts and an `xxx/fulfilled` or `xxx/rejected` action when it
 * settles. Since every action passes through the middleware chain, matching
 * on those action *shapes* (via RTK's isPending/isFulfilled/isRejected
 * matchers) lets a single piece of middleware observe every request in the
 * app, the same way an Angular interceptor sits in front of every
 * HttpClient call.
 */
export const loadingMiddleware: Middleware = (store) => (next) => (action) => {
  if (isPending(action)) {
    store.dispatch(requestStarted());
  } else if (isFulfilled(action) || isRejected(action)) {
    store.dispatch(requestFinished());
  }
  return next(action);
};
