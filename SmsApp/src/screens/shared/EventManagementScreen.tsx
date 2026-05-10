import React, { useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  Modal, ScrollView, Alert, RefreshControl, Image,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eventsApi } from '../../api/events.api';
import { QUERY_KEYS } from '../../constants';
import { Header } from '../../components/common/Header';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';
import { formatDate } from '../../utils/formatters';
import { isRequired } from '../../utils/validators';
import type { SchoolEvent } from '../../types';

export function EventManagementScreen() {
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', eventDate: '', venue: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: QUERY_KEYS.EVENTS,
    queryFn: () => eventsApi.getAll(0, 50),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      eventsApi.create({
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        eventDate: form.eventDate,
        venue: form.venue.trim() || undefined,
        publish: true,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.EVENTS });
      setShowCreateModal(false);
      setForm({ title: '', description: '', eventDate: '', venue: '' });
      Alert.alert('Success', 'Event created!');
    },
    onError: () => Alert.alert('Error', 'Failed to create event.'),
  });

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!isRequired(form.title)) errs.title = 'Title is required';
    if (!isRequired(form.eventDate)) errs.eventDate = 'Event date is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function renderEvent({ item }: { item: SchoolEvent }) {
    const isPast = new Date(item.eventDate) < new Date();
    return (
      <Card style={styles.eventCard}>
        <View style={styles.eventHeader}>
          <View style={styles.dateBox}>
            <Text style={styles.dateDay}>{new Date(item.eventDate).getDate()}</Text>
            <Text style={styles.dateMonth}>{new Date(item.eventDate).toLocaleString('default', { month: 'short' })}</Text>
          </View>
          <View style={styles.eventInfo}>
            <Text style={styles.eventTitle}>{item.title}</Text>
            {item.venue ? <Text style={styles.venue}>📍 {item.venue}</Text> : null}
            {item.description ? <Text style={styles.description} numberOfLines={2}>{item.description}</Text> : null}
          </View>
          <Badge
            label={isPast ? 'Past' : 'Upcoming'}
            backgroundColor={isPast ? Colors.surfaceVariant : Colors.successLight}
            color={isPast ? Colors.textSecondary : Colors.success}
          />
        </View>
      </Card>
    );
  }

  return (
    <View style={styles.container}>
      <Header
        title="Events"
        subtitle="School events & activities"
        rightAction={
          <TouchableOpacity onPress={() => setShowCreateModal(true)} style={styles.addBtn}>
            <Text style={styles.addBtnText}>+ Create</Text>
          </TouchableOpacity>
        }
      />

      {isLoading ? (
        <LoadingSpinner fullScreen />
      ) : (
        <FlatList
          data={data?.content ?? []}
          keyExtractor={item => String(item.id)}
          renderItem={renderEvent}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          ListEmptyComponent={
            <EmptyState title="No events yet" actionLabel="Create Event" onAction={() => setShowCreateModal(true)} />
          }
        />
      )}

      <Modal visible={showCreateModal} animationType="slide" transparent>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Create Event</Text>
            <ScrollView keyboardShouldPersistTaps="handled">
              <Input label="Title *" value={form.title} onChangeText={v => setForm(f => ({ ...f, title: v }))} error={errors.title} placeholder="e.g. Annual Sports Day" />
              <Input label="Event Date (YYYY-MM-DD) *" value={form.eventDate} onChangeText={v => setForm(f => ({ ...f, eventDate: v }))} error={errors.eventDate} placeholder="2024-08-15" />
              <Input label="Venue" value={form.venue} onChangeText={v => setForm(f => ({ ...f, venue: v }))} placeholder="e.g. School Auditorium" />
              <Input label="Description" value={form.description} onChangeText={v => setForm(f => ({ ...f, description: v }))} placeholder="Describe the event..." multiline numberOfLines={4} />
            </ScrollView>
            <View style={styles.modalActions}>
              <Button label="Cancel" onPress={() => setShowCreateModal(false)} variant="outline" style={styles.modalBtn} />
              <Button label="Create" onPress={() => validate() && createMutation.mutate()} loading={createMutation.isPending} style={styles.modalBtn} />
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
  eventCard: { marginBottom: 0 },
  eventHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  dateBox: { backgroundColor: Colors.primary, borderRadius: BorderRadius.md, width: 48, alignItems: 'center', paddingVertical: Spacing.sm, marginRight: Spacing.md },
  dateDay: { ...Typography.h4, color: Colors.white },
  dateMonth: { ...Typography.overline, color: 'rgba(255,255,255,0.8)' },
  eventInfo: { flex: 1, marginRight: Spacing.sm },
  eventTitle: { ...Typography.h5, color: Colors.textPrimary, marginBottom: 4 },
  venue: { ...Typography.caption, color: Colors.textSecondary },
  description: { ...Typography.caption, color: Colors.textTertiary, marginTop: 4, lineHeight: 18 },
  addBtn: { backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.round },
  addBtnText: { ...Typography.caption, color: Colors.white, fontWeight: '700' },
  overlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  modal: { backgroundColor: Colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: Spacing.xl, maxHeight: '85%' },
  modalTitle: { ...Typography.h4, color: Colors.textPrimary, marginBottom: Spacing.lg },
  modalActions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.lg },
  modalBtn: { flex: 1 },
});
