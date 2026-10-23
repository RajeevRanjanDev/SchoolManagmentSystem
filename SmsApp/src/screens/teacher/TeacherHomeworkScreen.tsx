import React, { useMemo, useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, addDays } from 'date-fns';
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

const TeacherHomeworkScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const qc = useQueryClient();
  const academicYear = currentAcademicYear();

  const [opt, setOpt] = useState<Opt | null>(null);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [due, setDue] = useState(format(addDays(new Date(), 1), 'yyyy-MM-dd'));

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

  const canSend = !!opt && title.trim().length > 0 && /^\d{4}-\d{2}-\d{2}$/.test(due);

  const mutation = useMutation({
    mutationFn: () => teacherService.createHomework({
      sectionId: opt!.sectionId,
      subjectId: opt!.subjectId,
      title: title.trim(),
      description: desc.trim() || undefined,
      dueDate: due,
      academicYear,
    }),
    onSuccess: () => {
      Toast.show({ type: 'success', text1: 'Homework assigned' });
      setTitle(''); setDesc('');
      qc.invalidateQueries({ queryKey: ['teacher-homework'] });
    },
    onError: (e: any) => Toast.show({ type: 'error', text1: 'Failed', text2: e?.response?.data?.message ?? 'Try again' }),
  });

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Header title="Assign Homework" onBack={() => navigation.goBack()} />
      <ScrollView
        showsVerticalScrollIndicator={false}
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
                  <TouchableOpacity key={o.key} onPress={() => setOpt(o)}
                    style={[styles.chip, active && styles.chipActive]}>
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{o.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <Card style={styles.formCard}>
              <Text style={styles.label}>Title</Text>
              <TextInput value={title} onChangeText={setTitle} placeholder="e.g. Chapter 3 exercises"
                placeholderTextColor={Colors.textMuted} style={styles.input} />

              <Text style={[styles.label, { marginTop: Sizes.md }]}>Description</Text>
              <TextInput value={desc} onChangeText={setDesc} placeholder="Details / questions…"
                placeholderTextColor={Colors.textMuted} style={[styles.input, styles.textarea]} multiline textAlignVertical="top" />

              <Text style={[styles.label, { marginTop: Sizes.md }]}>Due date (yyyy-MM-dd)</Text>
              <TextInput value={due} onChangeText={setDue} placeholder="2026-01-01"
                placeholderTextColor={Colors.textMuted} style={styles.input} />

              <AppButton
                title={mutation.isPending ? 'Assigning…' : 'Assign Homework'}
                onPress={() => mutation.mutate()}
                loading={mutation.isPending}
                disabled={!canSend}
                style={{ marginTop: Sizes.md }}
              />
            </Card>
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
    paddingHorizontal: Sizes.md, paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    fontSize: Sizes.fontMd, color: Colors.textPrimary,
  },
  textarea: { minHeight: 100 },
});

export default TeacherHomeworkScreen;
