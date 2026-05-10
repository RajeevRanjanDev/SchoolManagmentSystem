import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface UIState {
  isGlobalLoading: boolean;
  toasts: Toast[];
}

const initialState: UIState = {
  isGlobalLoading: false,
  toasts: [],
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setGlobalLoading: (state, action: PayloadAction<boolean>) => {
      state.isGlobalLoading = action.payload;
    },
    showToast: (
      state,
      action: PayloadAction<{ message: string; type: ToastType }>,
    ) => {
      state.toasts.push({
        id: Date.now().toString(),
        message: action.payload.message,
        type: action.payload.type,
      });
    },
    dismissToast: (state, action: PayloadAction<string>) => {
      state.toasts = state.toasts.filter(t => t.id !== action.payload);
    },
  },
});

export const { setGlobalLoading, showToast, dismissToast } = uiSlice.actions;
export default uiSlice.reducer;
