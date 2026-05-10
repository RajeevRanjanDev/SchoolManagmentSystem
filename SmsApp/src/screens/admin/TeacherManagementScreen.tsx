import React, { useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  TextInput, Modal, ScrollView, Alert, RefreshControl,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '../../api/users.api';
import { QUERY_KEYS } from '../../constants';
import { Header } from '../../components/common/Header';
import { Avatar } from '../../components/common/Avatar';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Card } from '../../components/common/Card';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';
import { isRequired, isValidEmail } from '../../utils/validators';
import type { User } from '../../types';

export function TeacherManagementScreen() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: QUERY_KEYS.TEACHERS,
    queryFn: () => usersApi.getAll(0, 100),
  });

  // Filter only teachers
  const teachers = (data?.content ?? []).filter(u => u.roles.includes('TEACHER'));
  const filtered = search.trim()
    ? teachers.filter(t =>
        `${t.firstName} ${t.lastName} ${t.email}`.toLowerCase().includes(search.toLowerCase()),
      )
    : teachers;

  const addMutation = useMutation({
    mutationFn: () =>
      usersApi.create({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        phone: form.phone,
        password: form.password,
        roles: ['TEACHER'],
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TEACHERS });
      setShowAddModal(false);
      setForm({ firstName: '', lastName: '', email: '', phone: '', password: '' });
      Alert.alert('Success', 'Teacher added successfully!');
    },
    onError: () => Alert.alert('Error', 'Failed to add teacher.'),
  });

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!isRequired(form.firstName)) errs.firstName = 'Required';
    if (!isRequired(form.lastName)) errs.lastName = 'Required';
    if (!isValidEmail(form.email)) errs.email = 'Valid email required';
    if (!isRequired(form.password) || form.password.length < 6) errs.password = 'Min 6 characters';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function renderTeacher({ item }: { item: User }) {
    return (
      <View style={styles.card}>
        <Avatar firstName={item.firstName} lastName={item.lastName} size={44} color={Colors.secondary} />
        <View style={styles.info}>
          <Text style={styles.name}>{item.firstName} {item.lastName}</Text>
          <Text style={styles.email}>{item.email}</Text>
          {item.phone ? <Text style={styles.phone}>📞 {item.phone}</Text> : null}
        </View>
        <View style={[styles.statusDot, { backgroundColor: item.active ? Colors.success : Colors.error }]} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header
        title="Teacher Management"
        subtitle={`${teachers.length} teachers`}
        rightAction={
          <TouchableOpacity onPress={() => setShowAddModal(true)} style={styles.addBtn}>
            <Text style={styles.addBtnText}>+ Add</Text>
          </TouchableOpacity>
        }
      />

      <View style={styles.searchBox}>
        <TextInput
          style={styles.search}
          placeholder="Search teachers..."
          placeholderTextColor={Colors.textTertiary}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {isLoading ? (
        <LoadingSpinner fullScreen />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => String(item.id)}
          renderItem={renderTeacher}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          ListEmptyComponent={
            <EmptyState
              title="No teachers found"
              actionLabel="Add Teacher"
              onAction={() => setShowAddModal(true)}
            />
          }
          ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
        />
      )}

      {/* Add Teacher Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Teacher</Text>
            <ScrollView keyboardShouldPersistTaps="handled">
              <Input label="First Name *" value={form.firstName} onChangeText={v => setForm(f => ({ ...f, firstName: v }))} error={errors.firstName} placeholder="First name" />
              <Input label="Last Name *" value={form.lastName} onChangeText={v => setForm(f => ({ ...f, lastName: v }))} error={errors.lastName} placeholder="Last name" />
              <Input label="Email *" value={form.email} onChangeText={v => setForm(f => ({ ...f, email: v }))} error={errors.email} placeholder="teacher@school.com" keyboardType="email-address" autoCapitalize="none" />
              <Input label="Phone" value={form.phone} onChangeText={v => setForm(f => ({ ...f, phone: v }))} placeholder="10-digit mobile" keyboardType="phone-pad" />
              <Input label="Password *" value={form.password} onChangeText={v => setForm(f => ({ ...f, password: v }))} error={errors.password} placeholder="Min 6 characters" isPassword />
            </ScrollView>
            <View style={styles.modalActions}>
              <Button label="Cancel" onPress={() => setShowAddModal(false)} variant="outline" style={styles.modalBtn} />
              <Button label="Add Teacher" onPress={() => validate() && addMutation.mutate()} loading={addMutation.isPending} style={styles.modalBtn} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  searchBox: { backgroundColor: Colors.surface, padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  search: { backgroundColor: Colors.surfaceVariant, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, ...Typography.body2, color: Colors.textPrimary },
  list: { padding: Spacing.md },
  card: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.md, flexDirection: 'row', alignItems: 'center', ...Shadows.sm },
  info: { flex: 1, marginLeft: Spacing.md },
  name: { ...Typography.h5, color: Colors.textPrimary },
  email: { ...Typography.caption, color: Colors.textSecondary },
  phone: { ...Typography.caption, color: Colors.textTertiary, marginTop: 2 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  addBtn: { backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.round },
  addBtnText: { ...Typography.caption, color: Colors.white, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: Spacing.xl, maxHeight: '90%' },
  modalTitle: { ...Typography.h4, color: Colors.textPrimary, marginBottom: Spacing.lg },
  modalActions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.lg },
  modalBtn: { flex: 1 },
});
