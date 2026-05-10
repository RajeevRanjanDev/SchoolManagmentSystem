import React, { useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  Modal, ScrollView, Alert, RefreshControl,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { homeworkApi } from '../../api/homework.api';
import { QUERY_KEYS } from '../../constants';
import { useAuth } from '../../hooks/useAuth';
import { Header } from '../../components/common/Header';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';
import { formatDate, todayISO } from '../../utils/formatters';
import { isRequired } from '../../utils/validators';
import type { Homework } from '../../types';

const DEFAULT_SECTION_ID = 1; // In production, fetch from teacher's assigned sections

export function HomeworkScreen() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    subject: '', title: '', description: '',
    assignedDate: todayISO(), dueDate: '', sectionId: String(DEFAULT_SECTION_ID),
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: homeworkList, isLoading, refetch, isRefetching } = useQuery({
    queryKey: QUERY_KEYS.HOMEWORK(DEFAULT_SECTION_ID),
    queryFn: () => homeworkApi.getBySectionId(DEFAULT_SECTION_ID),
  });

  const mutation = useMutation({
    mutationFn: () =>
      homeworkApi.assign({
        sectionId: Number(form.sectionId),
        subject: form.subject.trim(),
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        assignedDate: form.assignedDate,
        dueDate: form.dueDate,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.HOMEWORK(DEFAULT_SECTION_ID) });
      setShowModal(false);
      setForm({ subject: '', title: '', description: '', assignedDate: todayISO(), dueDate: '', sectionId: String(DEFAULT_SECTION_ID) });
      Alert.alert('Success', 'Homework assigned!');
    },
    onError: () => Alert.alert('Error', 'Failed to assign homework.'),
  });

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!isRequired(form.subject)) errs.subject = 'Subject is required';
    if (!isRequired(form.title)) errs.title = 'Title is required';
    if (!isRequired(form.dueDate)) errs.dueDate = 'Due date is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function renderItem({ item }: { item: Homework }) {
    const isPastDue = new Date(item.dueDate) < new Date();
    return (
      <Card style={styles.hwCard}>
        <View style={styles.hwHeader}>
          <Badge label={item.subject} backgroundColor={Colors.primary + '18'} color={Colors.primary} />
          <Badge
            label={isPastDue ? 'Overdue' : 'Active'}
            backgroundColor={isPastDue ? Colors.errorLight : Colors.successLight}
            color={isPastDue ? Colors.error : Colors.success}
          />
        </View>
        <Text style={styles.hwTitle}>{item.title}</Text>
        {item.description ? <Text style={styles.hwDesc}>{item.description}</Text> : null}
        <View style={styles.hwFooter}>
          <Text style={styles.hwDate}>Assigned: {formatDate(item.assignedDate)}</Text>
          <Text style={[styles.hwDate, isPastDue && styles.overdue]}>Due: {formatDate(item.dueDate)}</Text>
        </View>
      </Card>
    );
  }

  return (
    <View style={styles.container}>
      <Header
        title="Homework"
        subtitle="Manage assignments"
        rightAction={
          <TouchableOpacity onPress={() => setShowModal(true)} style={styles.addBtn}>
            <Text style={styles.addBtnText}>+ Assign</Text>
          </TouchableOpacity>
        }
      />

      {isLoading ? (
        <LoadingSpinner fullScreen />
      ) : (
        <FlatList
          data={homeworkList ?? []}
          keyExtractor={item => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          ListEmptyComponent={
            <EmptyState
              title="No homework assigned"
              message="Assign homework to your students"
              actionLabel="Assign Homework"
              onAction={() => setShowModal(true)}
            />
          }
        />
      )}

      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Assign Homework</Text>
            <ScrollView keyboardShouldPersistTaps="handled">
              <Input label="Subject *" value={form.subject} onChangeText={v => setForm(f => ({ ...f, subject: v }))} error={errors.subject} placeholder="e.g. Mathematics" />
              <Input label="Title *" value={form.title} onChangeText={v => setForm(f => ({ ...f, title: v }))} error={errors.title} placeholder="e.g. Chapter 5 Exercises" />
              <Input label="Description" value={form.description} onChangeText={v => setForm(f => ({ ...f, description: v }))} placeholder="Optional details..." multiline numberOfLines={3} />
              <Input label="Assigned Date (YYYY-MM-DD) *" value={form.assignedDate} onChangeText={v => setForm(f => ({ ...f, assignedDate: v }))} placeholder="2024-06-15" />
              <Input label="Due Date (YYYY-MM-DD) *" value={form.dueDate} onChangeText={v => setForm(f => ({ ...f, dueDate: v }))} error={errors.dueDate} placeholder="2024-06-20" />
            </ScrollView>
            <View style={styles.modalActions}>
              <Button label="Cancel" onPress={() => setShowModal(false)} variant="outline" style={styles.modalBtn} />
              <Button label="Assign" onPress={() => validate() && mutation.mutate()} loading={mutation.isPending} style={styles.modalBtn} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  list: { padding: Spacing.md },
  hwCard: { marginBottom: 0 },
  hwHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm },
  hwTitle: { ...Typography.h5, color: Colors.textPrimary, marginBottom: Spacing.xs },
  hwDesc: { ...Typography.body2, color: Colors.textSecondary, marginBottom: Spacing.sm, lineHeight: 20 },
  hwFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  hwDate: { ...Typography.caption, color: Colors.textTertiary },
  overdue: { color: Colors.error, fontWeight: '600' },
  addBtn: { backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.round },
  addBtnText: { ...Typography.caption, color: Colors.white, fontWeight: '700' },
  overlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  modal: { backgroundColor: Colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: Spacing.xl, maxHeight: '85%' },
  modalTitle: { ...Typography.h4, color: Colors.textPrimary, marginBottom: Spacing.lg },
  modalActions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.lg },
  modalBtn: { flex: 1 },
});
