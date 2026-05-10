/**
 * Firebase push notification setup.
 * Call this once from App.tsx after authentication.
 */
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { useAppDispatch } from '@store/hooks';
import { setUnreadCount, incrementUnread } from '@store/slices/notificationSlice';
import { notificationService } from '@api/services/notificationService';

export const useNotifications = (isAuthenticated: boolean) => {
  const dispatch = useAppDispatch();

  // Poll unread count every 30 seconds when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchCount = async () => {
      try {
        const count = await notificationService.getUnreadCount();
        dispatch(setUnreadCount(count));
      } catch { /* silently ignore */ }
    };

    fetchCount();
    const interval = setInterval(fetchCount, 30_000);
    return () => clearInterval(interval);
  }, [isAuthenticated, dispatch]);

  // FCM setup — wrapped in try/catch so app works without Firebase
  useEffect(() => {
    if (!isAuthenticated) return;

    const setupFCM = async () => {
      try {
        let messaging: any;
        try { messaging = require('@react-native-firebase/messaging').default; }
        catch { return; }
        const permission = await messaging().requestPermission();
        if (permission) {
          const token = await messaging().getToken();
          if (token) {
            await notificationService.registerFcmToken(
              token,
              Platform.OS.toUpperCase(),
              'SMS Parent App',
            );
          }
        }

        // Handle foreground messages
        const unsubscribe = messaging().onMessage(async (remoteMessage: any) => {
          // Increment unread count on new push
          dispatch(incrementUnread());
        });

        return unsubscribe;
      } catch {
        // Firebase not configured — skip silently
      }
    };

    let cleanup: (() => void) | undefined;
    setupFCM().then(fn => { cleanup = fn; });
    return () => cleanup?.();
  }, [isAuthenticated, dispatch]);
};
