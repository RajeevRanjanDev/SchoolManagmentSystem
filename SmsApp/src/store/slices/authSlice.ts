import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { AuthState, AuthUser, RoleName } from '../../types';
import type { LoginRequest } from '../../types/api';
import { authApi } from '../../api/auth.api';
import { storage } from '../../utils/storage';

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
};

// ─── Async Thunks ─────────────────────────────────────────────────────────────

export const loginThunk = createAsyncThunk(
  'auth/login',
  async (credentials: LoginRequest, { rejectWithValue }) => {
    try {
      const data = await authApi.login(credentials);
      await storage.setAccessToken(data.accessToken);
      await storage.setRefreshToken(data.refreshToken);
      return data;
    } catch (error: unknown) {
      const axiosErr = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(
        axiosErr.response?.data?.message ?? 'Login failed. Please check your credentials.',
      );
    }
  },
);

export const logoutThunk = createAsyncThunk('auth/logout', async (_, { rejectWithValue }) => {
  try {
    await authApi.logout();
  } catch {
    // Silently ignore logout API errors — clear local state regardless
  } finally {
    await storage.clearAll();
  }
});

export const hydrateAuthThunk = createAsyncThunk(
  'auth/hydrate',
  async (_, { rejectWithValue }) => {
    try {
      const accessToken = await storage.getAccessToken();
      const refreshToken = await storage.getRefreshToken();
      const userData = await storage.getUserData();
      if (!accessToken || !userData) return rejectWithValue('No session');
      return { accessToken, refreshToken, user: userData };
    } catch {
      return rejectWithValue('Hydration failed');
    }
  },
);

// ─── Slice ────────────────────────────────────────────────────────────────────

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: AuthUser; accessToken: string; refreshToken: string }>,
    ) => {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.isAuthenticated = true;
    },
    logout: state => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
    },
    updateAccessToken: (state, action: PayloadAction<string>) => {
      state.accessToken = action.payload;
    },
  },
  extraReducers: builder => {
    // login
    builder.addCase(loginThunk.pending, state => {
      state.isLoading = true;
    });
    builder.addCase(loginThunk.fulfilled, (state, action) => {
      state.isLoading = false;
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.isAuthenticated = true;
      // Build AuthUser from response
      state.user = {
        id: action.payload.userId,
        firstName: action.payload.fullName.split(' ')[0] ?? '',
        lastName: action.payload.fullName.split(' ').slice(1).join(' ') ?? '',
        email: action.payload.email,
        roles: action.payload.roles as RoleName[],
        schoolId: action.payload.schoolId,
        active: true,
      } as AuthUser;
      // Persist user data for next app launch
      storage.setUserData(state.user);
    });
    builder.addCase(loginThunk.rejected, state => {
      state.isLoading = false;
    });

    // logout
    builder.addCase(logoutThunk.fulfilled, state => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
    });

    // hydrate
    builder.addCase(hydrateAuthThunk.fulfilled, (state, action) => {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken ?? null;
      state.user = action.payload.user;
      state.isAuthenticated = true;
    });
  },
});

export const { setCredentials, logout, updateAccessToken } = authSlice.actions;
export default authSlice.reducer;
