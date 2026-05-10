import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, Alert,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRoute } from '@react-navigation/native';
import { attendanceApi } from '../../api/attendance.api';
import { studentsApi } from '../../api/students.api';
import { QUERY_KEYS, ATTENDANCE_COLORS } from '../../constants';
import { Header } from '../../components/common/Header';
import { Button } from '../../components/common/Button';
import { Avatar } from '../../components/common/Avatar';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';
import { formatDate, todayISO } from '../../utils/formatters';
import type { AttendanceStatus, Student } from '../../types';

const STATUS_OPTIONS: AttendanceStatus[] = ['PRESENT', 'ABSENT', 'HALF_DAY', 'LEAVE'];
const STATUS_LABELS: Record<AttendanceStatus, string> = {
  PRESENT: 'P',
  ABSENT: 'A',
  HALF_DAY: 'H',
  LEAVE: 'L',
};

export function AttendanceScreen() {
  const route = useRoute<any>();
  const queryClient = useQueryClient();

  // sectionId can come from timetable shortcut or manual entry
  const [sectionId] = useState<number>(route.params?.sectionId ?? 1);
  const [selectedDate] = useState(todayISO());
  const [statusMap, setStatusMap] = useState<Record<number, AttendanceStatus>>({});

  const { data: studentsPage, isLoading: loadingStudents } = useQuery({
    queryKey: QUERY_KEYS.STUDENTS,
    queryFn: () => studentsApi.getAll(0, 200),
  });

  const { data: existing, isLoading: loadingAttendance, refetch } = useQuery({
    queryKey: QUERY_KEYS.ATTENDANCE(sectionId, selectedDate),
    queryFn: () => attendanceApi.getBySection(sectionId, selectedDate),
  });

  // Pre-populate status map when existing attendance records load
  useEffect(() => {
    if (existing && existing.length > 0) {
      const map: Record<number, AttendanceStatus> = {};
      existing.forEach(r => { map[r.studentId] = r.status; });
      setStatusMap(map);
    }
  }, [existing]);

  const students = studentsPage?.content ?? [];

  const mutation = useMutation({
    mutationFn: () =>
      attendanceApi.markAttendance({
        sectionId,
        attendanceDate: selectedDate,
        studentAttendanceMap: statusMap,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ATTENDANCE(sectionId, selectedDate) });
      Alert.alert('Success', 'Attendance marked successfully!');
    },
    onError: () => Alert.alert('Error', 'Failed to mark attendance. Please try again.'),
  });

  function toggleStatus(studentId: number, current: AttendanceStatus) {
    const idx = STATUS_OPTIONS.indexOf(current);
    const next = STATUS_OPTIONS[(idx + 1) % STATUS_OPTIONS.length];
    setStatusMap(m => ({ ...m, [studentId]: next }));
  }

  function markAll(status: AttendanceStatus) {
    const map: Record<number, AttendanceStatus> = {};
    students.forEach(s => { map[s.id] = status; });
    setStatusMap(map);
  }

  const presentCount = Object.values(statusMap).filter(s => s === 'PRESENT').length;
  const absentCount = Object.values(statusMap).filter(s => s === 'ABSENT').length;

  if (loadingStudents || loadingAttendance) return <LoadingSpinner fullScreen />;

  function renderStudent({ item }: { item: Student }) {
    const status: AttendanceStatus = statusMap[item.id] ?? 'PRESENT';
    return (
      <View style={styles.studentRow}>
        <Avatar firstName={item.firstName} lastName={item.lastName} size={38} />
        <View style={styles.studentInfo}>
          <Text style={styles.studentName}>{item.firstName} {item.lastName}</Text>
          <Text style={styles.admNo}>#{item.admissionNumber}</Text>
        </View>
        <View style={styles.statusButtons}>
          {STATUS_OPTIONS.map(opt => (
            <TouchableOpacity
              key={opt}
              style={[
                styles.statusBtn,
                { borderColor: ATTENDANCE_COLORS[opt] },
                status === opt && { backgroundColor: ATTENDANCE_COLORS[opt] },
              ]}
              onPress={() => setStatusMap(m => ({ ...m, [item.id]: opt }))}
            >
              <Text style={[styles.statusBtnText, status === opt && styles.statusBtnTextActive]}>
                {STATUS_LABELS[opt]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Mark Attendance" subtitle={formatDate(selectedDate)} />

      {/* Summary bar */}
      <View style={styles.summaryBar}>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryCount, { color: Colors.success }]}>{presentCount}</Text>
          <Text style={styles.summaryLabel}>Present</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryCount, { color: Colors.error }]}>{absentCount}</Text>
          <Text style={styles.summaryLabel}>Absent</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryCount, { color: Colors.textSecondary }]}>{students.length}</Text>
          <Text style={styles.summaryLabel}>Total</Text>
        </View>
      </View>

      {/* Quick mark all */}
      <View style={styles.quickMarkRow}>
        <Text style={styles.quickMarkLabel}>Mark All:</Text>
        {STATUS_OPTIONS.map(s => (
          <TouchableOpacity
            key={s}
            style={[styles.quickMarkBtn, { backgroundColor: ATTENDANCE_COLORS[s] + '22', borderColor: ATTENDANCE_COLORS[s] }]}
            onPress={() => markAll(s)}
          >
            <Text style={[styles.quickMarkText, { color: ATTENDANCE_COLORS[s] }]}>{STATUS_LABELS[s]}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {students.length === 0 ? (
        <EmptyState title="No students in this section" />
      ) : (
        <FlatList
          data={students}
          keyExtractor={item => String(item.id)}
          renderItem={renderStudent}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: Colors.divider }} />}
        />
      )}

      {/* Submit */}
      <View style={styles.footer}>
        <Button
          label={`Submit Attendance (${presentCount} Present)`}
          onPress={() => mutation.mutate()}
          loading={mutation.isPending}
          fullWidth
          size="lg"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  summaryBar: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryCount: { ...Typography.h3 },
  summaryLabel: { ...Typography.caption, color: Colors.textSecondary },
  quickMarkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.sm,
  },
  quickMarkLabel: { ...Typography.caption, color: Colors.textSecondary, fontWeight: '600' },
  quickMarkBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickMarkText: { ...Typography.caption, fontWeight: '700' },
  list: { paddingHorizontal: Spacing.md },
  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
  },
  studentInfo: { flex: 1, marginLeft: Spacing.sm },
  studentName: { ...Typography.body2, color: Colors.textPrimary, fontWeight: '600' },
  admNo: { ...Typography.caption, color: Colors.textTertiary },
  statusButtons: { flexDirection: 'row', gap: 4 },
  statusBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBtnText: { fontSize: 11, fontWeight: '700', color: Colors.textSecondary },
  statusBtnTextActive: { color: Colors.white },
  footer: {
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
});
