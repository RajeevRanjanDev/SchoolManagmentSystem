import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useQuery, useMutation } from '@tanstack/react-query';
import { format } from 'date-fns';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';

import {
  teacherService,
  AttendanceStatus,
} from '@api/services/teacherService';
import Card from '@components/common/Card';
import LoadingSpinner from '@components/common/LoadingSpinner';
import EmptyState from '@components/common/EmptyState';
import AppButton from '@components/common/AppButton';
import { Colors } from '@constants/colors';
import { Sizes } from '@constants/sizes';
import { currentAcademicYear } from '@utils/dateUtils';

type Mark = 'PRESENT' | 'ABSENT' | 'LEAVE';
const OPTIONS: { key: Mark; label: string; color: string }[] = [
  { key: 'PRESENT', label: 'P', color: Colors.present },
  { key: 'ABSENT',  label: 'A', color: Colors.absent  },
  { key: 'LEAVE',   label: 'L', color: Colors.holiday },
];

interface SectionOpt { sectionId: number; label: string }

const MarkAttendanceScreen = () => {
  const insets     = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route      = useRoute<any>();
  const academicYear = currentAcademicYear();
  const presetSection: number | undefined = route.params?.sectionId;

  const [sectionId, setSectionId] = useState<number | undefined>(presetSection);
  const [marks, setMarks] = useState<Record<number, Mark>>({});
  const today = format(new Date(), 'yyyy-MM-dd');

  // Build section options from class-sections + assignments
  const { data: classSections } = useQuery({
    queryKey: ['teacher-class-sections', academicYear],
    queryFn: () => teacherService.getMyClassSections(academicYear),
  });
  const { data: assignments } = useQuery({
    queryKey: ['teacher-assignments', academicYear],
    queryFn: () => teacherService.getMyAssignments(academicYear),
  });

  const sectionOpts: SectionOpt[] = useMemo(() => {
    const map = new Map<number, string>();
    (classSections ?? []).forEach(c =>
      map.set(c.sectionId, `${c.className ?? 'Class'}${c.sectionName ? ' · ' + c.sectionName : ''}`),
    );
    (assignments ?? []).forEach(a => {
      if (!map.has(a.sectionId)) {
        map.set(a.sectionId, `${a.className ?? 'Class'}${a.sectionName ? ' · ' + a.sectionName : ''}`);
      }
    });
    return Array.from(map.entries()).map(([id, label]) => ({ sectionId: id, label }));
  }, [classSections, assignments]);

  // Default to first section
  useEffect(() => {
    if (sectionId == null && sectionOpts.length > 0) setSectionId(sectionOpts[0].sectionId);
  }, [sectionOpts, sectionId]);

  // Roster
  const { data: students, isLoading: rosterLoading } = useQuery({
    queryKey: ['section-students', sectionId],
    queryFn: () => teacherService.getSectionStudents(sectionId!),
    enabled: sectionId != null,
  });

  // Reset marks when section changes
  useEffect(() => { setMarks({}); }, [sectionId]);

  const setMark = (studentId: number, m: Mark) =>
    setMarks(prev => ({ ...prev, [studentId]: m }));

  const markAll = (m: Mark) => {
    const next: Record<number, Mark> = {};
    (students ?? []).forEach(s => { next[s.id] = m; });
    setMarks(next);
  };

  const markedCount = Object.keys(marks).length;

  const mutation = useMutation({
    mutationFn: () =>
      teacherService.markAttendance({
        sectionId: sectionId!,
        attendanceDate: today,
        entries: Object.entries(marks).map(([id, status]) => ({
          studentId: Number(id),
          status: status as AttendanceStatus,
        })),
      }),
    onSuccess: () => {
      Toast.show({ type: 'success', text1: 'Attendance saved', text2: `${markedCount} students marked` });
    },
    onError: (e: any) => {
      Toast.show({ type: 'error', text1: 'Failed to save', text2: e?.response?.data?.message ?? 'Try again' });
    },
  });

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('Dashboard')} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Mark Attendance</Text>
          <Text style={styles.headerSub}>{format(new Date(), 'EEE, d MMM yyyy')}</Text>
        </View>
      </View>

      {/* Section chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsRow}>
        {sectionOpts.map(opt => {
          const active = opt.sectionId === sectionId;
          return (
            <TouchableOpacity
              key={opt.sectionId}
              onPress={() => setSectionId(opt.sectionId)}
              style={[styles.chip, active && styles.chipActive]}>
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Bulk actions */}
      {(students ?? []).length > 0 && (
        <View style={styles.bulkRow}>
          <Text style={styles.bulkInfo}>{markedCount}/{students?.length} marked</Text>
          <TouchableOpacity onPress={() => markAll('PRESENT')}>
            <Text style={styles.bulkBtn}>Mark all Present</Text>
          </TouchableOpacity>
        </View>
      )}

      {rosterLoading ? (
        <LoadingSpinner message="Loading students…" />
      ) : (students ?? []).length === 0 ? (
        <EmptyState icon="account-off" title="No students" subtitle="This section has no students, or none selected." />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 120 }]}>
          {(students ?? []).map(s => {
            const current = marks[s.id];
            return (
              <Card key={s.id} style={styles.studentCard}>
                <View style={styles.studentRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.studentName}>{s.firstName} {s.lastName}</Text>
                    <Text style={styles.studentSub}>
                      {s.rollNumber ? `Roll ${s.rollNumber}` : s.admissionNumber ?? ''}
                    </Text>
                  </View>
                  <View style={styles.segment}>
                    {OPTIONS.map(o => {
                      const on = current === o.key;
                      return (
                        <TouchableOpacity
                          key={o.key}
                          onPress={() => setMark(s.id, o.key)}
                          style={[
                            styles.segmentBtn,
                            on && { backgroundColor: o.color, borderColor: o.color },
                          ]}>
                          <Text style={[styles.segmentText, on && { color: Colors.white }]}>{o.label}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </Card>
            );
          })}
        </ScrollView>
      )}

      {/* Submit */}
      {(students ?? []).length > 0 && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + 90 }]}>
          <AppButton
            title={mutation.isPending ? 'Saving…' : `Save Attendance (${markedCount})`}
            onPress={() => mutation.mutate()}
            loading={mutation.isPending}
            disabled={markedCount === 0}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: Sizes.sm,
    paddingHorizontal: Sizes.md, paddingVertical: Sizes.sm,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: Sizes.fontLg, fontWeight: '800', color: Colors.textPrimary },
  headerSub: { fontSize: Sizes.fontXs, color: Colors.textMuted },
  chipsRow: { gap: Sizes.sm, paddingHorizontal: Sizes.md, paddingVertical: Sizes.sm },
  chip: {
    paddingHorizontal: Sizes.md, paddingVertical: 8, borderRadius: Sizes.radiusFull,
    backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border,
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: Sizes.fontSm, fontWeight: '600', color: Colors.textSecondary },
  chipTextActive: { color: Colors.white },
  bulkRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Sizes.md, paddingVertical: Sizes.sm,
  },
  bulkInfo: { fontSize: Sizes.fontSm, color: Colors.textMuted, fontWeight: '600' },
  bulkBtn: { fontSize: Sizes.fontSm, color: Colors.primary, fontWeight: '700' },
  list: { paddingHorizontal: Sizes.md, gap: Sizes.sm },
  studentCard: { padding: Sizes.md },
  studentRow: { flexDirection: 'row', alignItems: 'center' },
  studentName: { fontSize: Sizes.fontMd, fontWeight: '700', color: Colors.textPrimary },
  studentSub: { fontSize: Sizes.fontXs, color: Colors.textMuted, marginTop: 2 },
  segment: { flexDirection: 'row', gap: 6 },
  segmentBtn: {
    width: 36, height: 36, borderRadius: Sizes.radiusFull,
    borderWidth: 1.5, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  segmentText: { fontSize: Sizes.fontMd, fontWeight: '800', color: Colors.textSecondary },
  footer: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    paddingHorizontal: Sizes.md, paddingTop: Sizes.sm,
    backgroundColor: Colors.background,
  },
});

export default MarkAttendanceScreen;
