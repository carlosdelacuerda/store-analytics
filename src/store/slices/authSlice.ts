import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

interface AuthState {
  status: "idle" | "loading" | "failed";
  error: string | null;
}

const initialState: AuthState = {
  status: "idle",
  error: null,
};

export interface LoginArgs {
  username: string;
  password: string;
  rememberMe: boolean;
}

export const loginUser = createAsyncThunk("auth/login", async (args: LoginArgs) => {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(args),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? "Invalid username or password");
  }
  return res.json();
});

export const logoutUser = createAsyncThunk("auth/logout", async () => {
  await fetch("/api/auth/logout", { method: "POST" });
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearAuthError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state) => {
        state.status = "idle";
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message ?? "Login failed";
      })
      .addCase(logoutUser.pending, (state) => {
        state.status = "loading";
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.status = "idle";
      })
      .addCase(logoutUser.rejected, (state) => {
        // Even if the network call fails, the caller still navigates to
        // /login — there's nothing useful to surface here.
        state.status = "idle";
      });
  },
});

export const { clearAuthError } = authSlice.actions;
export default authSlice.reducer;
