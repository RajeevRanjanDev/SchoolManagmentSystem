import React, { useMemo, useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, addMonths } from 'date-fns';
import Toast from 'react-native-toast-message';

import { teacherService, TeacherAssignment } from '@api/services/teacherService';
import Header from '@components/common/Header';
import Card from '@components/common/Card';
import AppButton from '@components/common/AppButton';
import EmptyState from '@components/common/EmptyState';
import { Colors } from '@constants/colors';
import { Sizes } from '@constants/sizes';
import { currentAcademicYear } from '@utils/dateUtils';

interface Opt { key: string; label: string; sectionId: number; subjectId?: number }
const PLAN_TYPES = ['ANNUAL', 'MONTHLY', 'WEEKLY', 'DAILY'];

const TeacherLessonPlansScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const qc = useQueryClient();
  const academicYear = currentAcademicYear();

  const [showCreate, setShowCreate] = useState(false);
  const [opt, setOpt] = useState<Opt | null>(null);
  const [planType, setPlanType] = useState('MONTHLY');
  const [planName, setPlanName] = useState('');
  const [start, setStart] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [end, setEnd] = useState(format(addMonths(new Date(), 1), 'yyyy-MM-dd'));

  const { data: assignments } = useQuery({
    queryKey: ['teacher-assignments', academicYear],
    queryFn: () => teacherService.getMyAssignments(academicYear),
  });
  const opts: Opt[] = useMemo(() =>
    (assignments ?? []).map((a: TeacherAssignment, i) => ({
      key: `${a.sectionId}-${a.subjectId ?? i}`,
      label: `${a.className ?? 'Class'}${a.sectionName ? ' · ' + a.sectionName : ''}${a.subjectName ? '  (' + a.subjectName + ')' : ''}`,
      sectionId: a.sectionId, subjectId: a.subjectId,
    })), [assignments]);
  useEffect(() => { if (!opt && opts.length > 0) setOpt(opts[0]); }, [opts, opt]);

  const { data: plans, isLoading } = useQuery({
    queryKey: ['lesson-plans', academicYear],
    queryFn: () => teacherService.getLessonPlans(academicYear),
  });

  const canCreate = !!opt && opt.subjectId != null &&
    /^\d{4}-\d{2}-\d{2}$/.test(start) && /^\d{4}-\d{2}-\d{2}$/.test(end);

  const mutation = useMutation({
    mutationFn: () => teacherService.createLessonPlan({
      sectionId: opt!.sectionId, subjectId: opt!.subjectId!, academicYear,
      planType, planName: planName.trim() || undefined, startDate: start, endDate: end,
    }),
    onSuccess: () => {
      Toast.show({ type: 'success', text1: 'Lesson plan created' });
      setShowCreate(false); setPlanName('');
      qc.invalidateQueries({ queryKey: ['lesson-plans', academicYear] });
    },
    onError: (e: any) => Toast.show({ type: 'error', text1: 'Failed', text2: e?.response?.data?.message ?? 'Try again' }),
  });

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Header title="Lesson Plans" onBack={() => navigation.goBack()} rightIcon={showCreate ? 'close' : 'plus'} onRightPress={() => setShowCreate(s => !s)} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 110 }]}>

        {showCreate && (
          <Card style={styles.formCard}>
            <Text style={styles.label}>Class & Subject</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
              {opts.map(o => {
                const active = opt?.key === o.key;
                return (
                  <TouchableOpacity key={o.key} onPress={() => setOpt(o)} style={[styles.chip, active && styles.chipActive]}>
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{o.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <Text style={[styles.label, { marginTop: Sizes.sm }]}>Plan type</Text>
            <View style={styles.typeRow}>
              {PLAN_TYPES.map(t => {
                const active = planType === t;
                return (
                  <TouchableOpacity key={t} onPress={() => setPlanType(t)} style={[styles.typeChip, active && styles.chipActive]}>
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{t}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.label, { marginTop: Sizes.sm }]}>Plan name</Text>
            <TextInput value={planName} onChangeText={setPlanName} placeholder="e.g. Term 1 – Algebra"
              placeholderTextColor={Colors.textMuted} style={styles.input} />
            <View style={styles.inlineRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { marginTop: Sizes.sm }]}>Start</Text>
                <TextInput value={start} onChangeText={setStart} style={styles.input} placeholderTextColor={Colors.textMuted} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { marginTop: Sizes.sm }]}>End</Text>
                <TextInput value={end} onChangeText={setEnd} style={styles.input} placeholderTextColor={Colors.textMuted} />
              </View>
            </View>
            <AppButton title={mutation.isPending ? 'Creating…' : 'Create Plan'} onPress={() => mutation.mutate()}
              loading={mutation.isPending} disabled={!canCreate} style={{ marginTop: Sizes.md }} />
          </Card>
        )}

        {isLoading ? null : (plans ?? []).length === 0 ? (
          <EmptyState icon="clipboard-text-outline" title="No lesson plans" subtitle="Tap + to create one." />
        ) : (
          (plans ?? []).map(p => (
            <Card key={p.id} style={styles.planCard}>
              <View style={styles.planHeader}>
                <Text style={styles.planName}>{p.planName ?? p.planType ?? 'Plan'}</Text>
                {p.status ? <Text style={styles.planStatus}>{p.status}</Text> : null}
              </View>
              <Text style={styles.planSub}>
                {[p.subjectName, p.className, p.sectionName].filter(Boolean).join(' · ')}
              </Text>
              <View style={styles.progressRow}>
                <View style={styles.barBg}>
                  <View style={[styles.barFill, { width: `${Math.min(100, p.completionPercent ?? 0)}%` as any }]} />
                </View>
                <Text style={styles.progressText}>
                  {p.completedTopics ?? 0}/{p.totalTopics ?? 0}
                </Text>
              </View>
            </Card>
          ))
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Sizes.md, gap: Sizes.sm },
  formCard: { padding: Sizes.md },
  label: { fontSize: Sizes.fontSm, fontWeight: '700', color: Colors.textSecondary, marginBottom: 6 },
  chipsRow: { gap: Sizes.sm, paddingVertical: 2 },
  chip: { paddingHorizontal: Sizes.md, paddingVertical: 8, borderRadius: Sizes.radiusFull, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Sizes.sm },
  typeChip: { paddingHorizontal: Sizes.md, paddingVertical: 6, borderRadius: Sizes.radiusFull, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: Sizes.fontSm, fontWeight: '600', color: Colors.textSecondary },
  chipTextActive: { color: Colors.white },
  inlineRow: { flexDirection: 'row', gap: Sizes.sm },
  input: {
    backgroundColor: Colors.background, borderRadius: Sizes.radiusMd, borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Sizes.md, paddingVertical: Platform.OS === 'ios' ? 12 : 9, fontSize: Sizes.fontMd, color: Colors.textPrimary,
  },
  planCard: { padding: Sizes.md },
  planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  planName: { fontSize: Sizes.fontMd, fontWeight: '700', color: Colors.textPrimary },
  planStatus: { fontSize: Sizes.fontXs, color: Colors.primary, fontWeight: '700' },
  planSub: { fontSize: Sizes.fontXs, color: Colors.textMuted, marginTop: 2 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: Sizes.sm, marginTop: Sizes.sm },
  barBg: { flex: 1, height: 8, backgroundColor: Colors.divider, borderRadius: 4, overflow: 'hidden' },
  barFill: { height: 8, borderRadius: 4, backgroundColor: Colors.primary },
  progressText: { fontSize: Sizes.fontXs, color: Colors.textSecondary, fontWeight: '600' },
});

export default TeacherLessonPlansScreen;
