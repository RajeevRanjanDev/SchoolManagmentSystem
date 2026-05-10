import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { AppNotification } from '../../types';

interface NotificationState {
  unreadCount: number;
  notifications: AppNotification[];
}

const initialState: NotificationState = {
  unreadCount: 0,
  notifications: [],
};

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    setUnreadCount: (state, action: PayloadAction<number>) => {
      state.unreadCount = action.payload;
    },
    decrementUnread: state => {
      state.unreadCount = Math.max(0, state.unreadCount - 1);
    },
    setNotifications: (state, action: PayloadAction<AppNotification[]>) => {
      state.notifications = action.payload;
    },
    markNotificationRead: (state, action: PayloadAction<number>) => {
      const n = state.notifications.find(n => n.id === action.payload);
      if (n && !n.read) {
        n.read = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    addIncomingNotification: (state, action: PayloadAction<AppNotification>) => {
      state.notifications.unshift(action.payload);
      state.unreadCount += 1;
    },
  },
});

export const {
  setUnreadCount,
  decrementUnread,
  setNotifications,
  markNotificationRead,
  addIncomingNotification,
} = notificationSlice.actions;

export default notificationSlice.reducer;
