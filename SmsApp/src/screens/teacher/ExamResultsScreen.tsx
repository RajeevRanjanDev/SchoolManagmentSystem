import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import { format } from 'date-fns';

import { teacherService } from '@api/services/teacherService';
import Card from '@components/common/Card';
import LoadingSpinner from '@components/common/LoadingSpinner';
import EmptyState from '@components/common/EmptyState';
import AppButton from '@components/common/AppButton';
import { Colors } from '@constants/colors';
import { Sizes } from '@constants/sizes';
import { currentAcademicYear } from '@utils/dateUtils';

interface SectionOpt { sectionId: number; label: string }

const ExamResultsScreen = () => {
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const academicYear = currentAcademicYear();

  const [sectionId, setSectionId] = useState<number | undefined>();
  const [examId, setExamId] = useState<number | undefined>();
  const [marks, setMarks] = useState<Record<number, string>>({});

  // New-exam form
  const [showCreate, setShowCreate] = useState(false);
  const [nName, setNName] = useState('');
  const [nSubject, setNSubject] = useState('');
  const [nDate, setNDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [nTotal, setNTotal] = useState('100');

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
      map.set(c.sectionId, `${c.className ?? 'Class'}${c.sectionName ? ' · ' + c.sectionName : ''}`));
    (assignments ?? []).forEach(a => {
      if (!map.has(a.sectionId))
        map.set(a.sectionId, `${a.className ?? 'Class'}${a.sectionName ? ' · ' + a.sectionName : ''}`);
    });
    return Array.from(map.entries()).map(([id, label]) => ({ sectionId: id, label }));
  }, [classSections, assignments]);

  useEffect(() => {
    if (sectionId == null && sectionOpts.length > 0) setSectionId(sectionOpts[0].sectionId);
  }, [sectionOpts, sectionId]);

  const examsKey = ['section-exams', sectionId, academicYear];
  const { data: exams } = useQuery({
    queryKey: examsKey,
    queryFn: () => teacherService.getSectionExams(sectionId!, academicYear),
    enabled: sectionId != null,
  });

  useEffect(() => { setExamId(undefined); setMarks({}); }, [sectionId]);
  useEffect(() => {
    if (examId == null && (exams ?? []).length > 0) setExamId(exams![0].id);
  }, [exams, examId]);

  const { data: students, isLoading: rosterLoading } = useQuery({
    queryKey: ['section-students', sectionId],
    queryFn: () => teacherService.getSectionStudents(sectionId!),
    enabled: sectionId != null,
  });

  const { data: existing } = useQuery({
    queryKey: ['exam-results', examId],
    queryFn: () => teacherService.getExamResults(examId!),
    enabled: examId != null,
  });

  useEffect(() => {
    if (existing) {
      const next: Record<number, string> = {};
      existing.forEach(r => { if (r.marksObtained != null) next[r.studentId] = String(r.marksObtained); });
      setMarks(next);
    }
  }, [existing]);

  const selectedExam = (exams ?? []).find(e => e.id === examId);
  const maxMarks = selectedExam?.totalMarks;
  const enteredCount = Object.values(marks).filter(v => v.trim() !== '').length;

  // ── Mutations ───────────────────────────────────────────────────────────────
  const createMut = useMutation({
    mutationFn: () => teacherService.createExam({
      sectionId: sectionId!,
      examName: nName.trim(),
      subject: nSubject.trim() || undefined,
      examDate: nDate,
      totalMarks: nTotal ? Number(nTotal) : undefined,
      academicYear,
    }),
    onSuccess: (exam) => {
      Toast.show({ type: 'success', text1: 'Exam created' });
      setShowCreate(false); setNName(''); setNSubject('');
      qc.invalidateQueries({ queryKey: examsKey });
      setExamId(exam.id);
    },
    onError: (e: any) => Toast.show({ type: 'error', text1: 'Create failed', text2: e?.response?.data?.message ?? 'Try again' }),
  });

  const saveMut = useMutation({
    mutationFn: () => teacherService.submitMarks({
      examId: examId!,
      entries: Object.entries(marks).filter(([, v]) => v.trim() !== '')
        .map(([id, v]) => ({ studentId: Number(id), marksObtained: Number(v) })),
    }),
    onSuccess: () => {
      Toast.show({ type: 'success', text1: 'Marks saved', text2: `${enteredCount} entries` });
      qc.invalidateQueries({ queryKey: ['exam-results', examId] });
    },
    onError: (e: any) => Toast.show({ type: 'error', text1: 'Save failed', text2: e?.response?.data?.message ?? 'Try again' }),
  });

  const publishMut = useMutation({
    mutationFn: () => teacherService.publishExamResults(examId!),
    onSuccess: (n) => Toast.show({ type: 'success', text1: 'Results published', text2: `${n} result(s) visible to students` }),
    onError: (e: any) => Toast.show({ type: 'error', text1: 'Publish failed', text2: e?.response?.data?.message ?? 'Try again' }),
  });

  const deleteMut = useMutation({
    mutationFn: () => teacherService.deleteExam(examId!),
    onSuccess: () => {
      Toast.show({ type: 'success', text1: 'Exam deleted' });
      setExamId(undefined);
      qc.invalidateQueries({ queryKey: examsKey });
    },
    onError: (e: any) => Toast.show({ type: 'error', text1: 'Delete failed', text2: e?.response?.data?.message ?? 'Try again' }),
  });

  const confirmDelete = () =>
    Alert.alert('Delete exam', 'This removes the exam and all its results. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteMut.mutate() },
    ]);

  const canCreate = sectionId != null && nName.trim().length > 0 && /^\d{4}-\d{2}-\d{2}$/.test(nDate);

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.header, { paddingTop: insets.top + Sizes.sm }]}>
        <Text style={styles.headerTitle}>Exams & Results</Text>
        <Text style={styles.headerSub}>Create exams, enter & publish marks</Text>
      </View>

      {/* Section chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
        {sectionOpts.map(opt => {
          const active = opt.sectionId === sectionId;
          return (
            <TouchableOpacity key={opt.sectionId} onPress={() => setSectionId(opt.sectionId)}
              style={[styles.chip, active && styles.chipActive]}>
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Exam row + New Exam toggle */}
      <View style={styles.examHeaderRow}>
        <Text style={styles.sectionLabel}>Exams</Text>
        <TouchableOpacity style={styles.newBtn} onPress={() => setShowCreate(s => !s)} disabled={sectionId == null}>
          <Icon name={showCreate ? 'close' : 'plus'} size={16} color={Colors.primary} />
          <Text style={styles.newBtnText}>{showCreate ? 'Cancel' : 'New Exam'}</Text>
        </TouchableOpacity>
      </View>

      {showCreate && (
        <Card style={styles.createCard}>
          <TextInput value={nName} onChangeText={setNName} placeholder="Exam name (e.g. PT III)"
            placeholderTextColor={Colors.textMuted} style={styles.input} />
          <View style={styles.inlineRow}>
            <TextInput value={nSubject} onChangeText={setNSubject} placeholder="Subject (optional)"
              placeholderTextColor={Colors.textMuted} style={[styles.input, { flex: 1 }]} />
            <TextInput value={nTotal} onChangeText={v => setNTotal(v.replace(/[^0-9.]/g, ''))} placeholder="Total"
              placeholderTextColor={Colors.textMuted} keyboardType="numeric" style={[styles.input, { width: 80 }]} />
          </View>
          <TextInput value={nDate} onChangeText={setNDate} placeholder="Exam date (yyyy-MM-dd)"
            placeholderTextColor={Colors.textMuted} style={styles.input} />
          <AppButton
            title={createMut.isPending ? 'Creating…' : 'Create Exam'}
            onPress={() => createMut.mutate()}
            loading={createMut.isPending}
            disabled={!canCreate}
            size="sm"
            style={{ marginTop: Sizes.sm }}
          />
        </Card>
      )}

      {/* Exam chips */}
      {(exams ?? []).length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
          {(exams ?? []).map(e => {
            const active = e.id === examId;
            return (
              <TouchableOpacity key={e.id} onPress={() => setExamId(e.id)}
                style={[styles.examChip, active && styles.chipActive]}>
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {e.examName}{e.subject ? ` · ${e.subject}` : ''}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      ) : (
        !showCreate && <Text style={styles.noExams}>No exams yet. Tap “New Exam” to create one.</Text>
      )}

      {/* Selected exam actions */}
      {examId != null && (
        <View style={styles.selectedRow}>
          <Text style={styles.selectedText} numberOfLines={1}>
            {selectedExam?.examName}{maxMarks != null ? `  ·  out of ${maxMarks}` : ''}
          </Text>
          <TouchableOpacity onPress={confirmDelete} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Icon name="trash-can-outline" size={20} color={Colors.danger} />
          </TouchableOpacity>
        </View>
      )}

      {examId == null ? (
        <EmptyState icon="chart-box-outline" title="Pick or create an exam" subtitle="Select a section, then create or choose an exam." />
      ) : rosterLoading ? (
        <LoadingSpinner message="Loading students…" />
      ) : (students ?? []).length === 0 ? (
        <EmptyState icon="account-off" title="No students" subtitle="This section has no students." />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 150 }]}>
          {(students ?? []).map(s => (
            <Card key={s.id} style={styles.studentCard}>
              <View style={styles.studentRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.studentName}>{s.firstName} {s.lastName}</Text>
                  <Text style={styles.studentSub}>{s.rollNumber ? `Roll ${s.rollNumber}` : s.admissionNumber ?? ''}</Text>
                </View>
                <TextInput
                  value={marks[s.id] ?? ''}
                  onChangeText={v => setMarks(prev => ({ ...prev, [s.id]: v.replace(/[^0-9.]/g, '') }))}
                  placeholder="--" placeholderTextColor={Colors.textMuted}
                  keyboardType="numeric" style={styles.markInput}
                />
              </View>
            </Card>
          ))}
        </ScrollView>
      )}

      {/* Footer: save + publish */}
      {examId != null && (students ?? []).length > 0 && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + 90 }]}>
          <AppButton
            title={saveMut.isPending ? 'Saving…' : `Save Marks (${enteredCount})`}
            onPress={() => saveMut.mutate()}
            loading={saveMut.isPending}
            disabled={enteredCount === 0}
            style={{ flex: 1 }}
          />
          <AppButton
            title={publishMut.isPending ? 'Publishing…' : 'Publish'}
            onPress={() => publishMut.mutate()}
            loading={publishMut.isPending}
            variant="outline"
            style={{ width: 120 }}
          />
        </View>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: Sizes.md, paddingBottom: Sizes.sm },
  headerTitle: { fontSize: Sizes.fontXl, fontWeight: '800', color: Colors.textPrimary },
  headerSub: { fontSize: Sizes.fontSm, color: Colors.textMuted },
  chipsRow: { gap: Sizes.sm, paddingHorizontal: Sizes.md, paddingVertical: Sizes.sm },
  chip: { paddingHorizontal: Sizes.md, paddingVertical: 8, borderRadius: Sizes.radiusFull, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border },
  examChip: { paddingHorizontal: Sizes.md, paddingVertical: 8, borderRadius: Sizes.radiusFull, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: Sizes.fontSm, fontWeight: '600', color: Colors.textSecondary },
  chipTextActive: { color: Colors.white },
  examHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Sizes.md },
  sectionLabel: { fontSize: Sizes.fontSm, fontWeight: '700', color: Colors.textSecondary },
  newBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4, paddingHorizontal: 8 },
  newBtnText: { fontSize: Sizes.fontSm, color: Colors.primary, fontWeight: '700' },
  createCard: { padding: Sizes.md, marginHorizontal: Sizes.md, marginTop: Sizes.xs, gap: Sizes.sm },
  inlineRow: { flexDirection: 'row', gap: Sizes.sm },
  input: {
    backgroundColor: Colors.background, borderRadius: Sizes.radiusMd, borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Sizes.md, paddingVertical: Platform.OS === 'ios' ? 12 : 9,
    fontSize: Sizes.fontMd, color: Colors.textPrimary,
  },
  noExams: { fontSize: Sizes.fontSm, color: Colors.textMuted, paddingHorizontal: Sizes.md, paddingVertical: Sizes.sm },
  selectedRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Sizes.md, paddingVertical: Sizes.xs, gap: Sizes.sm },
  selectedText: { flex: 1, fontSize: Sizes.fontSm, color: Colors.textPrimary, fontWeight: '600' },
  list: { paddingHorizontal: Sizes.md, gap: Sizes.sm, paddingTop: Sizes.xs },
  studentCard: { padding: Sizes.md },
  studentRow: { flexDirection: 'row', alignItems: 'center' },
  studentName: { fontSize: Sizes.fontMd, fontWeight: '700', color: Colors.textPrimary },
  studentSub: { fontSize: Sizes.fontXs, color: Colors.textMuted, marginTop: 2 },
  markInput: {
    width: 72, height: 44, borderRadius: Sizes.radiusMd, borderWidth: 1.5, borderColor: Colors.border,
    textAlign: 'center', fontSize: Sizes.fontLg, fontWeight: '700', color: Colors.textPrimary, backgroundColor: Colors.white,
  },
  footer: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    flexDirection: 'row', gap: Sizes.sm,
    paddingHorizontal: Sizes.md, paddingTop: Sizes.sm, backgroundColor: Colors.background,
  },
});

export default ExamResultsScreen;
