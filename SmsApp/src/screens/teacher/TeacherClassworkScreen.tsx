import React, { useMemo, useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import Toast from 'react-native-toast-message';

import { teacherService, TeacherAssignment } from '@api/services/teacherService';
import Header from '@components/common/Header';
import Card from '@components/common/Card';
import AppButton from '@components/common/AppButton';
import EmptyState from '@components/common/EmptyState';
import { Colors } from '@constants/colors';
import { Sizes } from '@constants/sizes';
import { currentAcademicYear } from '@utils/dateUtils';
import { formatDate } from '@utils/dateUtils';

interface Opt { key: string; label: string; sectionId: number; subjectId?: number }

const TeacherClassworkScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const qc = useQueryClient();
  const academicYear = currentAcademicYear();

  const [opt, setOpt] = useState<Opt | null>(null);
  const [topic, setTopic] = useState('');
  const [desc, setDesc] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const { data: assignments } = useQuery({
    queryKey: ['teacher-assignments', academicYear],
    queryFn: () => teacherService.getMyAssignments(academicYear),
  });

  const opts: Opt[] = useMemo(() =>
    (assignments ?? []).map((a: TeacherAssignment, i) => ({
      key: `${a.sectionId}-${a.subjectId ?? i}`,
      label: `${a.className ?? 'Class'}${a.sectionName ? ' · ' + a.sectionName : ''}${a.subjectName ? '  (' + a.subjectName + ')' : ''}`,
      sectionId: a.sectionId,
      subjectId: a.subjectId,
    })), [assignments]);

  useEffect(() => { if (!opt && opts.length > 0) setOpt(opts[0]); }, [opts, opt]);

  const { data: list } = useQuery({
    queryKey: ['teacher-classwork', opt?.sectionId, academicYear],
    queryFn: () => teacherService.getClasswork(opt!.sectionId, academicYear),
    enabled: opt?.sectionId != null,
  });

  const canSend = !!opt && opt.subjectId != null && topic.trim().length > 0 && /^\d{4}-\d{2}-\d{2}$/.test(date);

  const mutation = useMutation({
    mutationFn: () => teacherService.createClasswork({
      sectionId: opt!.sectionId,
      subjectId: opt!.subjectId!,
      academicYear,
      topic: topic.trim(),
      description: desc.trim() || undefined,
      classDate: date,
    }),
    onSuccess: () => {
      Toast.show({ type: 'success', text1: 'Classwork recorded' });
      setTopic(''); setDesc('');
      qc.invalidateQueries({ queryKey: ['teacher-classwork', opt?.sectionId, academicYear] });
    },
    onError: (e: any) => Toast.show({ type: 'error', text1: 'Failed', text2: e?.response?.data?.message ?? 'Try again' }),
  });

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Header title="Daily Classwork" onBack={() => navigation.goBack()} />
      <ScrollView showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 110 }]}>

        {opts.length === 0 ? (
          <EmptyState icon="book-off-outline" title="No classes assigned" subtitle="You have no subject assignments yet." />
        ) : (
          <>
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

            <Card style={styles.formCard}>
              <Text style={styles.label}>Topic</Text>
              <TextInput value={topic} onChangeText={setTopic} placeholder="e.g. Fractions – addition"
                placeholderTextColor={Colors.textMuted} style={styles.input} />
              <Text style={[styles.label, { marginTop: Sizes.md }]}>Description</Text>
              <TextInput value={desc} onChangeText={setDesc} placeholder="What was covered…"
                placeholderTextColor={Colors.textMuted} style={[styles.input, styles.textarea]} multiline textAlignVertical="top" />
              <Text style={[styles.label, { marginTop: Sizes.md }]}>Date (yyyy-MM-dd)</Text>
              <TextInput value={date} onChangeText={setDate} placeholder="2026-01-01"
                placeholderTextColor={Colors.textMuted} style={styles.input} />
              <AppButton
                title={mutation.isPending ? 'Saving…' : 'Record Classwork'}
                onPress={() => mutation.mutate()}
                loading={mutation.isPending}
                disabled={!canSend}
                style={{ marginTop: Sizes.md }}
              />
            </Card>

            <Text style={styles.heading}>Recent</Text>
            {(list ?? []).length === 0 ? (
              <EmptyState icon="pencil-off" title="No classwork yet" />
            ) : (
              (list ?? []).map(c => (
                <Card key={c.id} style={styles.item}>
                  <Text style={styles.itemTopic}>{c.topic}</Text>
                  {c.description ? <Text style={styles.itemDesc} numberOfLines={2}>{c.description}</Text> : null}
                  <Text style={styles.itemMeta}>
                    {[c.subjectName, c.classDate ? formatDate(c.classDate) : null].filter(Boolean).join('  ·  ')}
                  </Text>
                </Card>
              ))
            )}
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Sizes.md, gap: Sizes.sm },
  label: { fontSize: Sizes.fontSm, fontWeight: '700', color: Colors.textSecondary, marginBottom: 6 },
  chipsRow: { gap: Sizes.sm, paddingVertical: 2 },
  chip: { paddingHorizontal: Sizes.md, paddingVertical: 8, borderRadius: Sizes.radiusFull, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: Sizes.fontSm, fontWeight: '600', color: Colors.textSecondary },
  chipTextActive: { color: Colors.white },
  formCard: { padding: Sizes.md, marginTop: Sizes.sm },
  input: {
    backgroundColor: Colors.background, borderRadius: Sizes.radiusMd, borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Sizes.md, paddingVertical: Platform.OS === 'ios' ? 12 : 9, fontSize: Sizes.fontMd, color: Colors.textPrimary,
  },
  textarea: { minHeight: 90 },
  heading: { fontSize: Sizes.fontLg, fontWeight: '800', color: Colors.textPrimary, marginTop: Sizes.md },
  item: { padding: Sizes.md, marginTop: Sizes.sm },
  itemTopic: { fontSize: Sizes.fontMd, fontWeight: '700', color: Colors.textPrimary },
  itemDesc: { fontSize: Sizes.fontSm, color: Colors.textSecondary, marginTop: 2, lineHeight: 18 },
  itemMeta: { fontSize: Sizes.fontXs, color: Colors.textMuted, marginTop: 6 },
});

export default TeacherClassworkScreen;
