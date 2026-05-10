import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { feesApi } from '../../api/fees.api';
import { QUERY_KEYS } from '../../constants';
import { useAuth } from '../../hooks/useAuth';
import { Avatar } from '../../components/common/Avatar';
import { Card } from '../../components/common/Card';
import { StatCard } from '../../components/common/StatCard';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Colors, Typography, Spacing } from '../../theme';
import { formatCurrency } from '../../utils/formatters';

export function AccountantDashboardScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<any>();

  const { data: pendingFees, isLoading, refetch, isRefetching } = useQuery({
    queryKey: QUERY_KEYS.FEES_PENDING,
    queryFn: feesApi.getPendingFees,
  });

  const totalPending = (pendingFees ?? []).reduce((acc, f) => acc + (f.pendingAmount ?? f.amount), 0);
  const pendingCount = pendingFees?.length ?? 0;

  if (isLoading) return <LoadingSpinner fullScreen />;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <Avatar firstName={user?.firstName} lastName={user?.lastName} size={46} />
        <View style={styles.headerText}>
          <Text style={styles.greeting}>Good morning,</Text>
          <Text style={styles.userName}>{user?.firstName} {user?.lastName}</Text>
          <Text style={styles.role}>Accountant</Text>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <StatCard title="Pending Students" value={pendingCount} color={Colors.error} icon={<Text>⚠️</Text>} />
        <StatCard title="Total Pending" value={formatCurrency(totalPending)} color={Colors.warning} icon={<Text>💰</Text>} />
      </View>

      {/* Quick Actions */}
      <Card style={styles.actionsCard}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <TouchableOpacity style={styles.actionRow} onPress={() => navigation.navigate('FeeManagement')}>
          <Text style={styles.actionIcon}>💰</Text>
          <View style={styles.actionText}>
            <Text style={styles.actionTitle}>Record Payment</Text>
            <Text style={styles.actionSubtitle}>{pendingCount} students with pending fees</Text>
          </View>
          <Text style={styles.actionArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionRow} onPress={() => navigation.navigate('Reports')}>
          <Text style={styles.actionIcon}>📊</Text>
          <View style={styles.actionText}>
            <Text style={styles.actionTitle}>Fee Reports</Text>
            <Text style={styles.actionSubtitle}>View collection analytics</Text>
          </View>
          <Text style={styles.actionArrow}>›</Text>
        </TouchableOpacity>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { backgroundColor: Colors.accountantColor, flexDirection: 'row', alignItems: 'center', padding: Spacing.md, paddingTop: Spacing.lg },
  headerText: { marginLeft: Spacing.md },
  greeting: { ...Typography.caption, color: 'rgba(255,255,255,0.7)' },
  userName: { ...Typography.h5, color: Colors.white },
  role: { ...Typography.caption, color: 'rgba(255,255,255,0.6)' },
  statsRow: { flexDirection: 'row', padding: Spacing.sm },
  actionsCard: { margin: Spacing.md },
  sectionTitle: { ...Typography.h5, color: Colors.textPrimary, marginBottom: Spacing.md },
  actionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.divider },
  actionIcon: { fontSize: 24, marginRight: Spacing.md },
  actionText: { flex: 1 },
  actionTitle: { ...Typography.body1, color: Colors.textPrimary, fontWeight: '600' },
  actionSubtitle: { ...Typography.caption, color: Colors.textSecondary },
  actionArrow: { fontSize: 20, color: Colors.textTertiary },
});
