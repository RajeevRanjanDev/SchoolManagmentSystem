import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Linking,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import { studentService, HomeworkWithSubmission } from '@api/services/studentService';
import { useAppSelector } from '@store/hooks';
import { useNavigation } from '@react-navigation/native';
import Header from '@components/common/Header';
import Card from '@components/common/Card';
import Badge from '@components/common/Badge';
import LoadingSpinner from '@components/common/LoadingSpinner';
import ErrorView from '@components/common/ErrorView';
import EmptyState from '@components/common/EmptyState';
import AppButton from '@components/common/AppButton';
import { Colors } from '@constants/colors';
import { Sizes } from '@constants/sizes';
import { formatDate } from '@utils/dateUtils';
import { currentAcademicYear } from '@utils/dateUtils';

const isDone = (s?: string) => s === 'SUBMITTED' || s === 'GRADED' || s === 'REVIEWED';

const HomeworkScreen = () => {
  const navigation = useNavigation<any>();
  const qc = useQueryClient();
  const student = useAppSelector(s => s.student.selectedStudent);
  const academicYear = currentAcademicYear();
  const [expanded, setExpanded] = useState<number | null>(null);
  const [responses, setResponses] = useState<Record<number, string>>({});

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['child-homework', student?.studentId, academicYear],
    queryFn: () =>
      student ? studentService.getChildHomework(student.studentId, academicYear) : Promise.resolve([]),
    enabled: !!student,
  });

  const submitMut = useMutation({
    mutationFn: (homeworkId: number) =>
      studentService.submitHomework(student!.studentId, homeworkId, {
        textResponse: responses[homeworkId]?.trim() || undefined,
      }),
    onSuccess: () => {
      Toast.show({ type: 'success', text1: 'Homework submitted' });
      qc.invalidateQueries({ queryKey: ['child-homework', student?.studentId, academicYear] });
    },
    onError: (e: any) => Toast.show({ type: 'error', text1: 'Submit failed', text2: e?.response?.data?.message ?? 'Try again' }),
  });

  return (
    <View style={styles.root}>
      <Header title="Homework" subtitle={student?.firstName} onBack={() => navigation.goBack()} />
      {isLoading ? (
        <LoadingSpinner message="Loading homework…" />
      ) : isError ? (
        <ErrorView onRetry={refetch} />
      ) : (
        <FlatList
          data={data}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<EmptyState icon="book-open-outline" title="No Homework" subtitle="No pending homework right now." />}
          renderItem={({ item }) => {
            const done = isDone(item.submissionStatus);
            const overdue = item.dueDate ? new Date(item.dueDate) < new Date() && !done : false;
            const open = expanded === item.id;
            return (
              <Card style={styles.card}>
                <TouchableOpacity activeOpacity={0.85} onPress={() => setExpanded(p => (p === item.id ? null : item.id))}>
                  <View style={styles.header}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.subject}>{item.subject}</Text>
                      <Text style={styles.title} numberOfLines={open ? undefined : 2}>{item.title}</Text>
                    </View>
                    <Icon name={open ? 'chevron-up' : 'chevron-down'} size={20} color={Colors.textMuted} />
                  </View>
                  <View style={styles.metaRow}>
                    <Icon name="calendar-outline" size={13} color={overdue ? Colors.danger : Colors.textMuted} />
                    <Text style={[styles.metaText, overdue && { color: Colors.danger }]}>
                      Due: {item.dueDate ? formatDate(item.dueDate) : '—'}
                    </Text>
                  </View>
                </TouchableOpacity>

                {open && (
                  <View style={styles.expanded}>
                    {item.description ? <Text style={styles.description}>{item.description}</Text> : null}
                    {item.attachmentUrl ? (
                      <TouchableOpacity style={styles.attachBtn} onPress={() => Linking.openURL(item.attachmentUrl!)}>
                        <Icon name="paperclip" size={16} color={Colors.primary} />
                        <Text style={styles.attachText}>View Attachment</Text>
                      </TouchableOpacity>
                    ) : null}
                    {item.teacherRemarks ? (
                      <Text style={styles.remarks}>Teacher: {item.teacherRemarks}</Text>
                    ) : null}

                    {!done && (
                      <View style={styles.submitBox}>
                        <TextInput
                          value={responses[item.id] ?? ''}
                          onChangeText={v => setResponses(p => ({ ...p, [item.id]: v }))}
                          placeholder="Write a note / link (optional)…"
                          placeholderTextColor={Colors.textMuted}
                          style={styles.input}
                          multiline
                          textAlignVertical="top"
                        />
                        <AppButton
                          title={submitMut.isPending ? 'Submitting…' : 'Submit Homework'}
                          onPress={() => submitMut.mutate(item.id)}
                          loading={submitMut.isPending}
                          size="sm"
                          style={{ marginTop: Sizes.sm }}
                        />
                      </View>
                    )}
                  </View>
                )}

                <View style={styles.footer}>
                  <Text style={styles.assigned}>Assigned: {item.assignedDate ? formatDate(item.assignedDate) : '—'}</Text>
                  <Badge
                    label={item.submissionStatus ?? 'PENDING'}
                    color={done ? Colors.success : overdue ? Colors.danger : Colors.warning}
                  />
                </View>
              </Card>
            );
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  list: { padding: Sizes.md, paddingBottom: 120 },
  card: { marginBottom: Sizes.md },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: Sizes.sm },
  subject: { fontSize: Sizes.fontXs, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  title: { fontSize: Sizes.fontMd, fontWeight: '600', color: Colors.textPrimary, marginTop: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: Sizes.sm },
  metaText: { fontSize: Sizes.fontXs, color: Colors.textMuted },
  expanded: { marginTop: Sizes.md, paddingTop: Sizes.md, borderTopWidth: 1, borderTopColor: Colors.divider },
  description: { fontSize: Sizes.fontSm, color: Colors.textSecondary, lineHeight: 20 },
  attachBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: Sizes.sm },
  attachText: { fontSize: Sizes.fontSm, color: Colors.primary, fontWeight: '600' },
  remarks: { fontSize: Sizes.fontXs, color: Colors.textMuted, marginTop: Sizes.sm, fontStyle: 'italic' },
  submitBox: { marginTop: Sizes.md },
  input: {
    backgroundColor: Colors.background, borderRadius: Sizes.radiusMd, borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Sizes.md, paddingVertical: 10, fontSize: Sizes.fontSm, color: Colors.textPrimary, minHeight: 60,
  },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Sizes.sm },
  assigned: { fontSize: Sizes.fontXs, color: Colors.textMuted },
});

export default HomeworkScreen;
