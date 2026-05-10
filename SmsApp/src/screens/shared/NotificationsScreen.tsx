import React from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '../../api/notifications.api';
import { QUERY_KEYS } from '../../constants';
import { useAppDispatch } from '../../store/hooks';
import { markNotificationRead } from '../../store/slices/notificationSlice';
import { Header } from '../../components/common/Header';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';
import { formatDateTime } from '../../utils/formatters';
import type { AppNotification } from '../../types';

const TYPE_ICONS: Record<string, string> = {
  CIRCULAR: '📋',
  ATTENDANCE: '✅',
  FEE: '💰',
  RESULT: '📊',
  HOMEWORK: '📝',
  EVENT: '🎉',
  GENERAL: '🔔',
};

export function NotificationsScreen() {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: QUERY_KEYS.NOTIFICATIONS,
    queryFn: () => notificationsApi.getAll(0, 50),
  });

  const readMutation = useMutation({
    mutationFn: (id: number) => notificationsApi.markRead(id),
    onSuccess: (_, id) => {
      dispatch(markNotificationRead(id));
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.NOTIFICATIONS });
    },
  });

  function renderNotification({ item }: { item: AppNotification }) {
    return (
      <TouchableOpacity
        style={[styles.notifCard, !item.read && styles.unread]}
        onPress={() => !item.read && readMutation.mutate(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.iconContainer}>
          <Text style={styles.typeIcon}>{TYPE_ICONS[item.type] ?? '🔔'}</Text>
        </View>
        <View style={styles.notifContent}>
          <Text style={styles.notifTitle}>{item.title}</Text>
          <Text style={styles.notifMessage}>{item.message}</Text>
          <Text style={styles.notifTime}>{formatDateTime(item.createdAt)}</Text>
        </View>
        {!item.read && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Notifications" showBack />

      {isLoading ? (
        <LoadingSpinner fullScreen />
      ) : (
        <FlatList
          data={data?.content ?? []}
          keyExtractor={item => String(item.id)}
          renderItem={renderNotification}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          ListEmptyComponent={<EmptyState title="No notifications" message="You're all caught up!" />}
          ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: Colors.divider }} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  list: { paddingVertical: Spacing.sm },
  notifCard: { flexDirection: 'row', alignItems: 'flex-start', padding: Spacing.md, backgroundColor: Colors.surface },
  unread: { backgroundColor: Colors.primary + '08' },
  iconContainer: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.surfaceVariant, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  typeIcon: { fontSize: 20 },
  notifContent: { flex: 1 },
  notifTitle: { ...Typography.body2, fontWeight: '700', color: Colors.textPrimary, marginBottom: 2 },
  notifMessage: { ...Typography.body2, color: Colors.textSecondary, lineHeight: 20 },
  notifTime: { ...Typography.caption, color: Colors.textTertiary, marginTop: 4 },
  unreadDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary, marginLeft: Spacing.sm, marginTop: 6 },
});
