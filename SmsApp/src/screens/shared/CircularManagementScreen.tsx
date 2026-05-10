import React, { useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  Modal, ScrollView, Alert, RefreshControl,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { circularsApi } from '../../api/circulars.api';
import { QUERY_KEYS } from '../../constants';
import { Header } from '../../components/common/Header';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Card } from '../../components/common/Card';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';
import { formatDateTime } from '../../utils/formatters';
import { isRequired } from '../../utils/validators';
import type { Circular } from '../../types';

export function CircularManagementScreen() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', content: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: QUERY_KEYS.CIRCULARS,
    queryFn: () => circularsApi.getAll(0, 50),
  });

  const mutation = useMutation({
    mutationFn: () => circularsApi.create({ title: form.title.trim(), content: form.content.trim(), publish: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CIRCULARS });
      setShowModal(false);
      setForm({ title: '', content: '' });
      Alert.alert('Success', 'Circular published!');
    },
    onError: () => Alert.alert('Error', 'Failed to publish circular.'),
  });

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!isRequired(form.title)) errs.title = 'Title is required';
    if (!isRequired(form.content)) errs.content = 'Content is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function renderCircular({ item }: { item: Circular }) {
    return (
      <Card style={styles.circular}>
        <View style={styles.circularHeader}>
          <Text style={styles.circularTitle}>{item.title}</Text>
          <View style={[styles.publishedDot, { backgroundColor: item.published ? Colors.success : Colors.warning }]} />
        </View>
        <Text style={styles.circularContent} numberOfLines={3}>{item.content}</Text>
        <Text style={styles.circularDate}>{formatDateTime(item.createdAt)}</Text>
        {item.createdBy ? <Text style={styles.circularAuthor}>by {item.createdBy}</Text> : null}
      </Card>
    );
  }

  return (
    <View style={styles.container}>
      <Header
        title="Circulars"
        subtitle="School announcements"
        rightAction={
          <TouchableOpacity onPress={() => setShowModal(true)} style={styles.addBtn}>
            <Text style={styles.addBtnText}>+ New</Text>
          </TouchableOpacity>
        }
      />

      {isLoading ? (
        <LoadingSpinner fullScreen />
      ) : (
        <FlatList
          data={data?.content ?? []}
          keyExtractor={item => String(item.id)}
          renderItem={renderCircular}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          ListEmptyComponent={
            <EmptyState title="No circulars yet" actionLabel="Publish Circular" onAction={() => setShowModal(true)} />
          }
        />
      )}

      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>New Circular</Text>
            <Input label="Title *" value={form.title} onChangeText={v => setForm(f => ({ ...f, title: v }))} error={errors.title} placeholder="e.g. Parent-Teacher Meeting" />
            <Input label="Content *" value={form.content} onChangeText={v => setForm(f => ({ ...f, content: v }))} error={errors.content} placeholder="Write the full announcement here..." multiline numberOfLines={6} style={{ height: 120, textAlignVertical: 'top' }} />
            <View style={styles.modalActions}>
              <Button label="Cancel" onPress={() => setShowModal(false)} variant="outline" style={styles.modalBtn} />
              <Button label="Publish" onPress={() => validate() && mutation.mutate()} loading={mutation.isPending} style={styles.modalBtn} />
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
  circular: { marginBottom: 0 },
  circularHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.sm },
  circularTitle: { ...Typography.h5, color: Colors.textPrimary, flex: 1 },
  publishedDot: { width: 10, height: 10, borderRadius: 5 },
  circularContent: { ...Typography.body2, color: Colors.textSecondary, lineHeight: 22, marginBottom: Spacing.sm },
  circularDate: { ...Typography.caption, color: Colors.textTertiary },
  circularAuthor: { ...Typography.caption, color: Colors.primary, fontWeight: '600' },
  addBtn: { backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.round },
  addBtnText: { ...Typography.caption, color: Colors.white, fontWeight: '700' },
  overlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  modal: { backgroundColor: Colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: Spacing.xl },
  modalTitle: { ...Typography.h4, color: Colors.textPrimary, marginBottom: Spacing.lg },
  modalActions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.lg },
  modalBtn: { flex: 1 },
});
