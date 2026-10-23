import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';

import { studentPortalService } from '@api/services/studentPortalService';
import Header from '@components/common/Header';
import Card from '@components/common/Card';
import LoadingSpinner from '@components/common/LoadingSpinner';
import EmptyState from '@components/common/EmptyState';
import MonthlyAttendanceChart, { MonthBucket } from '@components/dashboard/MonthlyAttendanceChart';
import { Colors } from '@constants/colors';
import { Sizes } from '@constants/sizes';
import { attendanceColor, formatPercent } from '@utils/formatters';
import { formatDate } from '@utils/dateUtils';

const StudentAttendanceScreen = () => {
  const insets = useSafeAreaInsets();
  const { data, isLoading } = useQuery({
    queryKey: ['student-attendance'],
    queryFn: () => studentPortalService.getAttendance(),
  });

  if (isLoading) return (
    <View style={styles.root}><Header title="Attendance" /><LoadingSpinner message="Loading…" /></View>
  );

  const pct = data?.percentage ?? 0;
  const months: MonthBucket[] = (data?.months ?? []).slice(-6)
    .map(m => ({ label: m.label, present: m.present, absent: m.absent }));

  return (
    <View style={styles.root}>
      <Header title="Attendance" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 110 }]}>

        <View style={styles.summaryRow}>
          <Summary label="Present" value={data?.present ?? 0} color={Colors.present} />
          <Summary label="Absent"  value={data?.absent ?? 0}  color={Colors.absent} />
          <Summary label="Late"    value={data?.late ?? 0}    color={Colors.late} />
        </View>

        <Card style={styles.pctCard}>
          <View style={styles.pctRow}>
            <Text style={styles.pctTitle}>Attendance Rate</Text>
            <Text style={[styles.pctValue, { color: pct >= 75 ? Colors.success : Colors.danger }]}>
              {formatPercent(pct)}
            </Text>
          </View>
          <View style={styles.barBg}>
            <View style={[styles.barFill, { width: `${Math.min(100, pct)}%` as any, backgroundColor: pct >= 75 ? Colors.success : Colors.danger }]} />
          </View>
        </Card>

        {months.length > 0 && (
          <Card style={styles.chartCard}>
            <Text style={styles.cardTitle}>Monthly Breakdown</Text>
            <MonthlyAttendanceChart data={months} />
          </Card>
        )}

        <Text style={styles.listTitle}>Recent</Text>
        {(data?.recent ?? []).length === 0 ? (
          <EmptyState icon="calendar-blank" title="No records" />
        ) : (
          (data?.recent ?? []).map((r, i) => (
            <View key={`${r.date}-${i}`} style={styles.row}>
              <View style={[styles.dot, { backgroundColor: attendanceColor(r.status) }]} />
              <Text style={styles.rowDate}>{formatDate(r.date)}</Text>
              <View style={{ flex: 1 }} />
              <Text style={[styles.rowStatus, { color: attendanceColor(r.status) }]}>{r.status}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const Summary = ({ label, value, color }: { label: string; value: number; color: string }) => (
  <Card style={[styles.summaryCard, { borderTopColor: color, borderTopWidth: 3 }]}>
    <Text style={[styles.summaryValue, { color }]}>{value}</Text>
    <Text style={styles.summaryLabel}>{label}</Text>
  </Card>
);

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Sizes.md, gap: Sizes.md },
  summaryRow: { flexDirection: 'row', gap: Sizes.sm },
  summaryCard: { flex: 1, alignItems: 'center', padding: Sizes.md },
  summaryValue: { fontSize: Sizes.fontXxl, fontWeight: '800' },
  summaryLabel: { fontSize: Sizes.fontXs, color: Colors.textMuted, marginTop: 2 },
  pctCard: { padding: Sizes.md },
  pctRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Sizes.sm },
  pctTitle: { fontSize: Sizes.fontMd, fontWeight: '700', color: Colors.textPrimary },
  pctValue: { fontSize: Sizes.fontLg, fontWeight: '800' },
  barBg: { height: 10, backgroundColor: Colors.divider, borderRadius: 5, overflow: 'hidden' },
  barFill: { height: 10, borderRadius: 5 },
  chartCard: { padding: Sizes.md },
  cardTitle: { fontSize: Sizes.fontLg, fontWeight: '800', color: Colors.textPrimary, marginBottom: Sizes.sm },
  listTitle: { fontSize: Sizes.fontMd, fontWeight: '700', color: Colors.textPrimary },
  row: { flexDirection: 'row', alignItems: 'center', gap: Sizes.sm, backgroundColor: Colors.white, borderRadius: Sizes.radiusMd, padding: Sizes.md, ...Sizes.shadowSm },
  dot: { width: 10, height: 10, borderRadius: 5 },
  rowDate: { fontSize: Sizes.fontMd, color: Colors.textPrimary, fontWeight: '600' },
  rowStatus: { fontSize: Sizes.fontXs, fontWeight: '700' },
});

export default StudentAttendanceScreen;
