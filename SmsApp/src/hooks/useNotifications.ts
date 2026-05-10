import { useEffect } from 'react';
import { Platform } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import { useAppDispatch } from '../store/hooks';
import { addIncomingNotification, setUnreadCount } from '../store/slices/notificationSlice';
import { authApi } from '../api/auth.api';
import type { AppNotification, NotificationType } from '../types';

export function useNotifications(userId?: number) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!userId) return;

    let unsubscribeOnMessage: (() => void) | undefined;

    const setup = async () => {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (!enabled) return;

      const fcmToken = await messaging().getToken();
      if (fcmToken) {
        try {
          await authApi.registerDevice({
            fcmToken,
            deviceType: Platform.OS === 'ios' ? 'IOS' : 'ANDROID',
            deviceName: `${Platform.OS}-device`,
          });
        } catch {
          // Non-fatal — app still works without push
        }
      }

      // Foreground message handler
      unsubscribeOnMessage = messaging().onMessage(async remoteMessage => {
        const notification: AppNotification = {
          id: Date.now(),
          title: remoteMessage.notification?.title ?? 'New notification',
          message: remoteMessage.notification?.body ?? '',
          type: (remoteMessage.data?.type as NotificationType) ?? 'GENERAL',
          read: false,
          createdAt: new Date().toISOString(),
          referenceId: remoteMessage.data?.referenceId
            ? Number(remoteMessage.data.referenceId)
            : undefined,
        };
        dispatch(addIncomingNotification(notification));
      });
    };

    setup();

    return () => {
      unsubscribeOnMessage?.();
    };
  }, [userId, dispatch]);
}
