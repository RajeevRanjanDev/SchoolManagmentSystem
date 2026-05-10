import React from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../../api/dashboard.api';
import { QUERY_KEYS } from '../../constants';
import { Header } from '../../components/common/Header';
import { Card } from '../../components/common/Card';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';
import { formatCurrency, formatPercentage, getAcademicYear } from '../../utils/formatters';

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <View style={progressStyles.track}>
      <View style={[progressStyles.fill, { width: `${pct}%`, backgroundColor: color }]} />
    </View>
  );
}

const progressStyles = StyleSheet.create({
  track: { height: 8, backgroundColor: Colors.surfaceVariant, borderRadius: 4, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4 },
});

export function ReportsScreen() {
  const { data: stats, isLoading, refetch, isRefetching } = useQuery({
    queryKey: QUERY_KEYS.DASHBOARD,
    queryFn: dashboardApi.getStats,
  });

  if (isLoading) return <LoadingSpinner fullScreen />;

  const academicYear = getAcademicYear();
  const attendancePct = stats?.attendancePercentageToday ?? 0;
  const totalStudents = stats?.totalStudents ?? 0;
  const totalTeachers = stats?.totalTeachers ?? 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
    >
      <Header title="Reports & Analytics" subtitle={academicYear} />

      {/* Overall summary */}
      <View style={styles.summaryGrid}>
        <SummaryBox icon="👨‍🎓" label="Students" value={totalStudents} color={Colors.primary} />
        <SummaryBox icon="👩‍🏫" label="Teachers" value={totalTeachers} color={Colors.secondary} />
        <SummaryBox icon="👪" label="Parents" value={stats?.totalParents ?? 0} color={Colors.accent} />
        <SummaryBox icon="🚌" label="Vehicles" value={stats?.activeVehicles ?? 0} color={Colors.transportColor} />
      </View>

      {/* Attendance */}
      <Card>
        <Text style={styles.sectionTitle}>Attendance Overview</Text>
        <View style={styles.statRow}>
          <View style={styles.statItem}>
            <Text style={styles.bigValue}>{formatPercentage(attendancePct)}</Text>
            <Text style={styles.statLabel}>Today's Rate</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.bigValue, { color: Colors.success }]}>
              {Math.round((attendancePct / 100) * totalStudents)}
            </Text>
            <Text style={styles.statLabel}>Present</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.bigValue, { color: Colors.error }]}>
              {totalStudents - Math.round((attendancePct / 100) * totalStudents)}
            </Text>
            <Text style={styles.statLabel}>Absent</Text>
          </View>
        </View>
        <ProgressBar value={attendancePct} max={100} color={attendancePct >= 75 ? Colors.success : Colors.warning} />
        <Text style={styles.progressLabel}>{formatPercentage(attendancePct)} attendance rate</Text>
      </Card>

      {/* Fee Collection */}
      <Card>
        <Text style={styles.sectionTitle}>Fee Collection</Text>
        <View style={styles.feeRow}>
          <View style={styles.feeItem}>
            <Text style={[styles.feeValue, { color: Colors.success }]}>
              {formatCurrency(stats?.feeCollectedThisMonth)}
            </Text>
            <Text style={styles.feeLabel}>Collected This Month</Text>
          </View>
        </View>
        <View style={styles.feeRow}>
          <View style={styles.feeItem}>
            <Text style={[styles.feeValue, { color: Colors.error }]}>
              {formatCurrency(stats?.pendingFeeAmount)}
            </Text>
            <Text style={styles.feeLabel}>Total Pending Amount</Text>
          </View>
          <View style={styles.feeItem}>
            <Text style={[styles.feeValue, { color: Colors.warning }]}>
              {stats?.pendingFeeCount ?? 0}
            </Text>
            <Text style={styles.feeLabel}>Students with Dues</Text>
          </View>
        </View>
      </Card>

      {/* Homework Stats */}
      <Card>
        <Text style={styles.sectionTitle}>Academic Activity</Text>
        <StatLine icon="📝" label="Homework Assigned This Week" value={stats?.homeworkAssignedThisWeek ?? 0} />
        <StatLine icon="🎉" label="Upcoming Events" value={stats?.upcomingEvents ?? 0} />
        <StatLine icon="🚌" label="Active Transport Vehicles" value={stats?.activeVehicles ?? 0} />
      </Card>
    </ScrollView>
  );
}

function SummaryBox({ icon, label, value, color }: { icon: string; label: string; value: number; color: string }) {
  return (
    <View style={[summaryStyles.box, { borderTopColor: color, borderTopWidth: 3 }]}>
      <Text style={summaryStyles.icon}>{icon}</Text>
      <Text style={[summaryStyles.value, { color }]}>{value}</Text>
      <Text style={summaryStyles.label}>{label}</Text>
    </View>
  );
}

function StatLine({ icon, label, value }: { icon: string; label: string; value: number }) {
  return (
    <View style={statLineStyles.row}>
      <Text style={statLineStyles.icon}>{icon}</Text>
      <Text style={statLineStyles.label}>{label}</Text>
      <Text style={statLineStyles.value}>{value}</Text>
    </View>
  );
}

const summaryStyles = StyleSheet.create({
  box: { flex: 1, backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.md, alignItems: 'center', margin: 4 },
  icon: { fontSize: 24, marginBottom: 4 },
  value: { ...Typography.h4, marginBottom: 2 },
  label: { ...Typography.caption, color: Colors.textSecondary, textAlign: 'center' },
});

const statLineStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.divider },
  icon: { fontSize: 18, marginRight: Spacing.sm },
  label: { ...Typography.body2, color: Colors.textSecondary, flex: 1 },
  value: { ...Typography.h5, color: Colors.textPrimary },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingBottom: Spacing.xxl },
  summaryGrid: { flexDirection: 'row', padding: Spacing.sm },
  sectionTitle: { ...Typography.h5, color: Colors.textPrimary, marginBottom: Spacing.md },
  statRow: { flexDirection: 'row', marginBottom: Spacing.md },
  statItem: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: Colors.divider },
  bigValue: { ...Typography.h3, color: Colors.textPrimary },
  statLabel: { ...Typography.caption, color: Colors.textSecondary, marginTop: 4 },
  progressLabel: { ...Typography.caption, color: Colors.textTertiary, marginTop: Spacing.xs },
  feeRow: { flexDirection: 'row', marginBottom: Spacing.sm },
  feeItem: { flex: 1 },
  feeValue: { ...Typography.h4 },
  feeLabel: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
});
