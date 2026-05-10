import React, { useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { notificationService } from '@api/services/notificationService';
import { useAppDispatch } from '@store/hooks';
import { decrementUnread } from '@store/slices/notificationSlice';
import Header from '@components/common/Header';
import LoadingSpinner from '@components/common/LoadingSpinner';
import ErrorView from '@components/common/ErrorView';
import EmptyState from '@components/common/EmptyState';
import { Colors } from '@constants/colors';
import { Sizes } from '@constants/sizes';
import { timeAgo } from '@utils/dateUtils';
import { AppNotification } from '@app-types/index';

const TYPE_CONFIG: Record<string, { icon: string; color: string }> = {
  HOMEWORK:   { icon: 'book-open-variant',   color: '#4F46E5' },
  CIRCULAR:   { icon: 'newspaper-variant',   color: '#06B6D4' },
  FEE:        { icon: 'cash-multiple',       color: '#EF4444' },
  ATTENDANCE: { icon: 'calendar-check',      color: '#10B981' },
  BUS:        { icon: 'bus-clock',           color: '#F59E0B' },
  EXAM:       { icon: 'chart-bar',           color: '#8B5CF6' },
  GENERAL:    { icon: 'bell-ring',           color: '#64748B' },
};

const NotificationsScreen = () => {
  const dispatch     = useAppDispatch();
  const queryClient  = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationService.getNotifications(),
  });

  const markReadMutation = useMutation({
    mutationFn: notificationService.markAsRead,
    onSuccess: (_, id) => {
      dispatch(decrementUnread());
      // Optimistically update notification in cache
      queryClient.setQueryData<any>(['notifications'], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          content: old.content.map((n: AppNotification) =>
            n.id === id ? { ...n, isRead: true } : n,
          ),
        };
      });
    },
  });

  const handlePress = useCallback((n: AppNotification) => {
    if (!n.isRead) markReadMutation.mutate(n.id);
  }, [markReadMutation]);

  return (
    <View style={styles.root}>
      <Header title="Notifications" />

      {isLoading ? (
        <LoadingSpinner message="Loading notifications..." />
      ) : isError ? (
        <ErrorView onRetry={refetch} />
      ) : (
        <FlatList
          data={data?.content}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              icon="bell-off-outline"
              title="No Notifications"
              subtitle="You're all caught up!"
            />
          }
          renderItem={({ item }) => (
            <NotificationItem item={item} onPress={() => handlePress(item)} />
          )}
        />
      )}
    </View>
  );
};

const NotificationItem = ({
  item,
  onPress,
}: {
  item: AppNotification;
  onPress: () => void;
}) => {
  const config = TYPE_CONFIG[item.type] ?? TYPE_CONFIG.GENERAL;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[styles.item, !item.isRead && styles.unread]}>
      <View style={[styles.iconBox, { backgroundColor: config.color + '18' }]}>
        <Icon name={config.icon} size={22} color={config.color} />
      </View>
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
          {!item.isRead && <View style={styles.dot} />}
        </View>
        <Text style={styles.body} numberOfLines={2}>{item.body}</Text>
        <Text style={styles.time}>{timeAgo(item.createdAt)}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  list: { paddingVertical: Sizes.sm, paddingBottom: 32 },
  item: {
    flexDirection: 'row',
    padding: Sizes.md,
    gap: Sizes.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
    backgroundColor: Colors.white,
  },
  unread: { backgroundColor: Colors.primary + '05' },
  iconBox: {
    width: 48, height: 48,
    borderRadius: Sizes.radiusMd,
    alignItems: 'center', justifyContent: 'center',
  },
  content: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  title: { flex: 1, fontSize: Sizes.fontMd, fontWeight: '700', color: Colors.textPrimary },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary },
  body: { fontSize: Sizes.fontSm, color: Colors.textSecondary, marginTop: 2, lineHeight: 18 },
  time: { fontSize: Sizes.fontXs, color: Colors.textMuted, marginTop: 4 },
});

export default NotificationsScreen;
