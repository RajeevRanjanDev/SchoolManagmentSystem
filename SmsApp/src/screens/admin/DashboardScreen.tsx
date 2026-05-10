import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { dashboardApi } from '../../api/dashboard.api';
import { QUERY_KEYS } from '../../constants';
import { useAuth } from '../../hooks/useAuth';
import { StatCard } from '../../components/common/StatCard';
import { Card } from '../../components/common/Card';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Avatar } from '../../components/common/Avatar';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';
import { formatCurrency, formatPercentage } from '../../utils/formatters';

interface QuickAction {
  icon: string;
  label: string;
  screen: string;
  color: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  { icon: '👨‍🎓', label: 'Students', screen: 'Students', color: Colors.primary },
  { icon: '👩‍🏫', label: 'Teachers', screen: 'Teachers', color: Colors.secondary },
  { icon: '💰', label: 'Fees', screen: 'FeeManagement', color: '#E65100' },
  { icon: '✅', label: 'Attendance', screen: 'Reports', color: '#2E7D32' },
  { icon: '📚', label: 'Library', screen: 'Library', color: '#6A1B9A' },
  { icon: '🚌', label: 'Transport', screen: 'BusTracking', color: '#1565C0' },
  { icon: '📋', label: 'Circulars', screen: 'Circulars', color: '#00838F' },
  { icon: '🎉', label: 'Events', screen: 'Events', color: '#AD1457' },
];

export function DashboardScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<any>();

  const { data: stats, isLoading, refetch, isRefetching } = useQuery({
    queryKey: QUERY_KEYS.DASHBOARD,
    queryFn: dashboardApi.getStats,
  });

  if (isLoading) return <LoadingSpinner fullScreen message="Loading dashboard..." />;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
    >
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Avatar firstName={user?.firstName} lastName={user?.lastName} size={46} />
          <View style={styles.headerText}>
            <Text style={styles.greeting}>Good morning,</Text>
            <Text style={styles.userName}>{user?.firstName} {user?.lastName}</Text>
            <Text style={styles.role}>School Administrator</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Notifications')} style={styles.notifBtn}>
          <Text style={styles.notifIcon}>🔔</Text>
        </TouchableOpacity>
      </View>

      {/* Stats Grid */}
      <Text style={styles.sectionTitle}>Overview</Text>
      <View style={styles.statsGrid}>
        <StatCard
          title="Students"
          value={stats?.totalStudents ?? 0}
          color={Colors.primary}
          icon={<Text style={styles.statIcon}>👨‍🎓</Text>}
        />
        <StatCard
          title="Teachers"
          value={stats?.totalTeachers ?? 0}
          color={Colors.secondary}
          icon={<Text style={styles.statIcon}>👩‍🏫</Text>}
        />
        <StatCard
          title="Attendance"
          value={formatPercentage(stats?.attendancePercentageToday)}
          color={Colors.success}
          icon={<Text style={styles.statIcon}>✅</Text>}
        />
        <StatCard
          title="Pending Fees"
          value={stats?.pendingFeeCount ?? 0}
          color={Colors.error}
          icon={<Text style={styles.statIcon}>⚠️</Text>}
        />
        <StatCard
          title="Fee Collected"
          value={formatCurrency(stats?.feeCollectedThisMonth)}
          subtitle="This month"
          color={Colors.success}
          icon={<Text style={styles.statIcon}>💰</Text>}
        />
        <StatCard
          title="Active Buses"
          value={stats?.activeVehicles ?? 0}
          color={Colors.primary}
          icon={<Text style={styles.statIcon}>🚌</Text>}
        />
      </View>

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <Card>
        <View style={styles.actionsGrid}>
          {QUICK_ACTIONS.map(action => (
            <TouchableOpacity
              key={action.label}
              style={styles.actionItem}
              onPress={() => navigation.navigate(action.screen)}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIcon, { backgroundColor: action.color + '18' }]}>
                <Text style={styles.actionEmoji}>{action.icon}</Text>
              </View>
              <Text style={styles.actionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Card>

      {/* Pending Fees Alert */}
      {(stats?.pendingFeeAmount ?? 0) > 0 && (
        <TouchableOpacity
          onPress={() => navigation.navigate('FeeManagement')}
          activeOpacity={0.8}
        >
          <Card style={styles.alertCard}>
            <View style={styles.alertRow}>
              <Text style={styles.alertIcon}>⚠️</Text>
              <View style={styles.alertText}>
                <Text style={styles.alertTitle}>Pending Fee Alert</Text>
                <Text style={styles.alertSubtitle}>
                  {stats?.pendingFeeCount} students have pending fees totalling{' '}
                  {formatCurrency(stats?.pendingFeeAmount)}
                </Text>
              </View>
              <Text style={styles.alertArrow}>›</Text>
            </View>
          </Card>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingBottom: Spacing.xxl },
  header: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    paddingTop: Spacing.lg,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  headerText: { marginLeft: Spacing.sm, flex: 1 },
  greeting: { ...Typography.caption, color: 'rgba(255,255,255,0.7)' },
  userName: { ...Typography.h5, color: Colors.white },
  role: { ...Typography.caption, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  notifBtn: { padding: Spacing.sm },
  notifIcon: { fontSize: 22 },
  sectionTitle: {
    ...Typography.h5,
    color: Colors.textPrimary,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.sm,
  },
  statIcon: { fontSize: 20 },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  actionItem: {
    width: '25%',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  actionIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  actionEmoji: { fontSize: 24 },
  actionLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
  },
  alertCard: { marginHorizontal: Spacing.md, backgroundColor: Colors.warningLight },
  alertRow: { flexDirection: 'row', alignItems: 'center' },
  alertIcon: { fontSize: 24, marginRight: Spacing.sm },
  alertText: { flex: 1 },
  alertTitle: { ...Typography.body2, fontWeight: '700', color: Colors.textPrimary },
  alertSubtitle: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  alertArrow: { fontSize: 20, color: Colors.textTertiary },
});
