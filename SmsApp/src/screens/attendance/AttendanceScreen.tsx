import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { attendanceService } from '@api/services/attendanceService';
import { useAppSelector } from '@store/hooks';
import Header from '@components/common/Header';
import Card from '@components/common/Card';
import LoadingSpinner from '@components/common/LoadingSpinner';
import ErrorView from '@components/common/ErrorView';
import EmptyState from '@components/common/EmptyState';
import Badge from '@components/common/Badge';
import { Colors } from '@constants/colors';
import { Sizes } from '@constants/sizes';
import { attendanceColor, formatPercent } from '@utils/formatters';
import { formatDate, relativeDate } from '@utils/dateUtils';
import { AttendanceRecord } from '@app-types/index';

const AttendanceScreen = () => {
  const student = useAppSelector(s => s.student.selectedStudent);
  const [month, setMonth] = useState(new Date());

  const from = format(startOfMonth(month), 'yyyy-MM-dd');
  const to   = format(endOfMonth(month),   'yyyy-MM-dd');

  const { data: records, isLoading, isError, refetch } = useQuery({
    queryKey: ['attendance', student?.studentId, from, to],
    queryFn: () =>
      student
        ? attendanceService.getStudentAttendance(student.studentId, from, to)
        : Promise.resolve([]),
    enabled: !!student,
  });

  const { data: percentage } = useQuery({
    queryKey: ['attendance-pct', student?.studentId, from, to],
    queryFn: () =>
      student
        ? attendanceService.getAttendancePercentage(student.studentId, from, to)
        : Promise.resolve(0),
    enabled: !!student,
  });

  const summary = React.useMemo(() => {
    if (!records) return { present: 0, absent: 0, late: 0 };
    return records.reduce(
      (acc, r) => {
        if (r.status === 'PRESENT') acc.present++;
        else if (r.status === 'ABSENT') acc.absent++;
        else if (r.status === 'LATE') acc.late++;
        return acc;
      },
      { present: 0, absent: 0, late: 0 },
    );
  }, [records]);

  const prevMonth = () =>
    setMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1));
  const nextMonth = () =>
    setMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1));

  if (!student) return (
    <View style={styles.root}>
      <Header title="Attendance" />
      <EmptyState icon="account-off" title="No child selected" subtitle="Please select a child from the dashboard." />
    </View>
  );

  return (
    <View style={styles.root}>
      <Header title="Attendance" subtitle={student.firstName} />

      {/* Month picker */}
      <View style={styles.monthPicker}>
        <TouchableOpacity onPress={prevMonth} style={styles.arrowBtn}>
          <Icon name="chevron-left" size={24} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.monthLabel}>{format(month, 'MMMM yyyy')}</Text>
        <TouchableOpacity onPress={nextMonth} style={styles.arrowBtn}>
          <Icon name="chevron-right" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <LoadingSpinner message="Fetching attendance..." />
      ) : isError ? (
        <ErrorView onRetry={refetch} />
      ) : (
        <FlatList
          data={records}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <>
              {/* Summary cards */}
              <View style={styles.summaryRow}>
                <SummaryCard label="Present" value={summary.present} color={Colors.present} icon="check-circle" />
                <SummaryCard label="Absent"  value={summary.absent}  color={Colors.absent}  icon="close-circle" />
                <SummaryCard label="Late"    value={summary.late}    color={Colors.late}    icon="clock-alert" />
              </View>

              {/* Percentage bar */}
              <Card style={styles.pctCard}>
                <View style={styles.pctRow}>
                  <Text style={styles.pctTitle}>Attendance Rate</Text>
                  <Text style={[styles.pctValue, { color: (percentage ?? 0) >= 75 ? Colors.success : Colors.danger }]}>
                    {formatPercent(percentage ?? 0)}
                  </Text>
                </View>
                <View style={styles.barBg}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        width: `${percentage ?? 0}%` as any,
                        backgroundColor:
                          (percentage ?? 0) >= 75 ? Colors.success : Colors.danger,
                      },
                    ]}
                  />
                </View>
                {(percentage ?? 0) < 75 && (
                  <Text style={styles.warningText}>
                    âš ï¸ Below 75% â€” attendance is low
                  </Text>
                )}
              </Card>

              <Text style={styles.listTitle}>Daily Records</Text>
            </>
          }
          ListEmptyComponent={
            <EmptyState icon="calendar-blank" title="No records" subtitle="No attendance data for this month." />
          }
          renderItem={({ item }) => <AttendanceRow record={item} />}
        />
      )}
    </View>
  );
};

const SummaryCard = ({
  label, value, color, icon,
}: {
  label: string; value: number; color: string; icon: string;
}) => (
  <Card style={[styles.summaryCard, { borderTopColor: color, borderTopWidth: 3 }]}>
    <Icon name={icon} size={20} color={color} />
    <Text style={[styles.summaryValue, { color }]}>{value}</Text>
    <Text style={styles.summaryLabel}>{label}</Text>
  </Card>
);

const AttendanceRow = ({ record }: { record: AttendanceRecord }) => {
  const color = attendanceColor(record.status);
  return (
    <View style={styles.row}>
      <View style={[styles.statusDot, { backgroundColor: color }]} />
      <View style={{ flex: 1 }}>
        <Text style={styles.rowDate}>{formatDate(record.attendanceDate)}</Text>
        {record.remarks ? (
          <Text style={styles.rowRemarks}>{record.remarks}</Text>
        ) : null}
      </View>
      <Badge label={record.status} color={color} />
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  monthPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Sizes.md,
    paddingVertical: Sizes.sm,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  arrowBtn: { padding: 8 },
  monthLabel: { fontSize: Sizes.fontLg, fontWeight: '700', color: Colors.textPrimary },
  list: { padding: Sizes.md, paddingBottom: 120 },
  summaryRow: { flexDirection: 'row', gap: Sizes.sm, marginBottom: Sizes.md },
  summaryCard: { flex: 1, alignItems: 'center', padding: Sizes.md },
  summaryValue: { fontSize: Sizes.fontXxl, fontWeight: '800', marginTop: 4 },
  summaryLabel: { fontSize: Sizes.fontXs, color: Colors.textMuted },
  pctCard: { marginBottom: Sizes.md },
  pctRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Sizes.sm },
  pctTitle: { fontSize: Sizes.fontMd, fontWeight: '600', color: Colors.textPrimary },
  pctValue: { fontSize: Sizes.fontLg, fontWeight: '800' },
  barBg: { height: 8, backgroundColor: Colors.divider, borderRadius: 4, overflow: 'hidden' },
  barFill: { height: 8, borderRadius: 4 },
  warningText: { fontSize: Sizes.fontXs, color: Colors.warning, marginTop: Sizes.sm },
  listTitle: { fontSize: Sizes.fontMd, fontWeight: '700', color: Colors.textPrimary, marginBottom: Sizes.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Sizes.radiusMd,
    padding: Sizes.md,
    marginBottom: Sizes.sm,
    gap: Sizes.sm,
    ...Sizes.shadowSm,
  },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  rowDate: { fontSize: Sizes.fontMd, fontWeight: '600', color: Colors.textPrimary },
  rowRemarks: { fontSize: Sizes.fontXs, color: Colors.textMuted, marginTop: 2 },
});

export default AttendanceScreen;
