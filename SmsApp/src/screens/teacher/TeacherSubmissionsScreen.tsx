import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';

import { teacherService } from '@api/services/teacherService';
import Header from '@components/common/Header';
import Card from '@components/common/Card';
import Badge from '@components/common/Badge';
import LoadingSpinner from '@components/common/LoadingSpinner';
import EmptyState from '@components/common/EmptyState';
import { Colors } from '@constants/colors';
import { Sizes } from '@constants/sizes';
import { currentAcademicYear } from '@utils/dateUtils';

interface SectionOpt { sectionId: number; label: string }

const TeacherSubmissionsScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const qc = useQueryClient();
  const academicYear = currentAcademicYear();

  const [sectionId, setSectionId] = useState<number | undefined>();
  const [homeworkId, setHomeworkId] = useState<number | undefined>();

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
    (classSections ?? []).forEach(c => map.set(c.sectionId, `${c.className ?? 'Class'}${c.sectionName ? ' · ' + c.sectionName : ''}`));
    (assignments ?? []).forEach(a => { if (!map.has(a.sectionId)) map.set(a.sectionId, `${a.className ?? 'Class'}${a.sectionName ? ' · ' + a.sectionName : ''}`); });
    return Array.from(map.entries()).map(([id, label]) => ({ sectionId: id, label }));
  }, [classSections, assignments]);

  useEffect(() => { if (sectionId == null && sectionOpts.length > 0) setSectionId(sectionOpts[0].sectionId); }, [sectionOpts, sectionId]);

  const { data: homework } = useQuery({
    queryKey: ['teacher-homework', sectionId, academicYear],
    queryFn: () => teacherService.getHomework(sectionId!, academicYear),
    enabled: sectionId != null,
  });
  useEffect(() => { setHomeworkId(undefined); }, [sectionId]);
  useEffect(() => { if (homeworkId == null && (homework ?? []).length > 0) setHomeworkId(homework![0].id); }, [homework, homeworkId]);

  const { data: subs, isLoading } = useQuery({
    queryKey: ['homework-submissions', homeworkId],
    queryFn: () => teacherService.getHomeworkSubmissions(homeworkId!),
    enabled: homeworkId != null,
  });

  const reviewMut = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      teacherService.reviewSubmission(id, { status }),
    onSuccess: () => {
      Toast.show({ type: 'success', text1: 'Submission reviewed' });
      qc.invalidateQueries({ queryKey: ['homework-submissions', homeworkId] });
    },
    onError: (e: any) => Toast.show({ type: 'error', text1: 'Failed', text2: e?.response?.data?.message ?? 'Try again' }),
  });

  return (
    <View style={styles.root}>
      <Header title="Submissions" onBack={() => navigation.goBack()} />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
        {sectionOpts.map(opt => {
          const active = opt.sectionId === sectionId;
          return (
            <TouchableOpacity key={opt.sectionId} onPress={() => setSectionId(opt.sectionId)} style={[styles.chip, active && styles.chipActive]}>
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {(homework ?? []).length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
          {(homework ?? []).map(h => {
            const active = h.id === homeworkId;
            return (
              <TouchableOpacity key={h.id} onPress={() => setHomeworkId(h.id)} style={[styles.chip, active && styles.chipActive]}>
                <Text style={[styles.chipText, active && styles.chipTextActive]} numberOfLines={1}>{h.title}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      ) : (
        <Text style={styles.note}>No homework for this section yet.</Text>
      )}

      {homeworkId == null ? (
        <EmptyState icon="file-document-outline" title="Pick homework" subtitle="Choose a homework to see submissions." />
      ) : isLoading ? (
        <LoadingSpinner message="Loading submissions…" />
      ) : (subs ?? []).length === 0 ? (
        <EmptyState icon="inbox-outline" title="No submissions" subtitle="No students have submitted yet." />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 110 }]}>
          {(subs ?? []).map(s => (
            <Card key={s.id} style={styles.card}>
              <View style={styles.subHeader}>
                <Text style={styles.studentName}>{s.studentName ?? `Student #${s.studentId ?? s.id}`}</Text>
                {s.status ? <Badge label={s.status} color={s.status === 'ACCEPTED' || s.status === 'COMPLETED' ? Colors.success : Colors.warning} /> : null}
              </View>
              {s.textResponse ? <Text style={styles.response} numberOfLines={3}>{s.textResponse}</Text> : null}
              {s.submissionUrl ? (
                <TouchableOpacity style={styles.attachBtn} onPress={() => Linking.openURL(s.submissionUrl!)}>
                  <Icon name="paperclip" size={16} color={Colors.primary} />
                  <Text style={styles.attachText}>Open submission</Text>
                </TouchableOpacity>
              ) : null}
              <View style={styles.actions}>
                <TouchableOpacity style={[styles.actBtn, styles.accept]} onPress={() => reviewMut.mutate({ id: s.id, status: 'ACCEPTED' })}>
                  <Text style={styles.acceptText}>Accept</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actBtn, styles.resubmit]} onPress={() => reviewMut.mutate({ id: s.id, status: 'RESUBMIT' })}>
                  <Text style={styles.resubmitText}>Ask resubmit</Text>
                </TouchableOpacity>
              </View>
            </Card>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  chipsRow: { gap: Sizes.sm, paddingHorizontal: Sizes.md, paddingVertical: Sizes.sm },
  chip: { maxWidth: 220, paddingHorizontal: Sizes.md, paddingVertical: 8, borderRadius: Sizes.radiusFull, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: Sizes.fontSm, fontWeight: '600', color: Colors.textSecondary },
  chipTextActive: { color: Colors.white },
  note: { fontSize: Sizes.fontSm, color: Colors.textMuted, paddingHorizontal: Sizes.md, paddingVertical: Sizes.sm },
  list: { padding: Sizes.md, gap: Sizes.sm },
  card: { padding: Sizes.md },
  subHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  studentName: { fontSize: Sizes.fontMd, fontWeight: '700', color: Colors.textPrimary },
  response: { fontSize: Sizes.fontSm, color: Colors.textSecondary, marginTop: 6, lineHeight: 18 },
  attachBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: Sizes.sm },
  attachText: { fontSize: Sizes.fontSm, color: Colors.primary, fontWeight: '600' },
  actions: { flexDirection: 'row', gap: Sizes.sm, marginTop: Sizes.md },
  actBtn: { flex: 1, height: 40, borderRadius: Sizes.radiusMd, alignItems: 'center', justifyContent: 'center' },
  accept: { backgroundColor: Colors.success },
  acceptText: { color: Colors.white, fontWeight: '700', fontSize: Sizes.fontSm },
  resubmit: { borderWidth: 1.5, borderColor: Colors.warning },
  resubmitText: { color: Colors.warning, fontWeight: '700', fontSize: Sizes.fontSm },
});

export default TeacherSubmissionsScreen;
