import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { studentsApi } from '../../api/students.api';
import { QUERY_KEYS } from '../../constants';
import { Header } from '../../components/common/Header';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';
import { isRequired } from '../../utils/validators';

type Gender = 'MALE' | 'FEMALE' | 'OTHER';

export function AddStudentScreen() {
  const navigation = useNavigation();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    admissionNumber: '',
    dateOfBirth: '',
    gender: '' as Gender | '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const mutation = useMutation({
    mutationFn: studentsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.STUDENTS });
      Alert.alert('Success', 'Student added successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    },
    onError: () => {
      Alert.alert('Error', 'Failed to add student. Please try again.');
    },
  });

  function setField(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }));
    setErrors(e => ({ ...e, [field]: '' }));
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (!isRequired(form.firstName)) newErrors.firstName = 'First name is required';
    if (!isRequired(form.lastName)) newErrors.lastName = 'Last name is required';
    if (!isRequired(form.admissionNumber)) newErrors.admissionNumber = 'Admission number is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;
    mutation.mutate({
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      admissionNumber: form.admissionNumber.trim(),
      dateOfBirth: form.dateOfBirth || undefined,
      gender: (form.gender || undefined) as Gender | undefined,
    });
  }

  return (
    <View style={styles.container}>
      <Header title="Add New Student" showBack />

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Card>
          <Text style={styles.sectionTitle}>Personal Details</Text>

          <Input
            label="First Name *"
            value={form.firstName}
            onChangeText={v => setField('firstName', v)}
            placeholder="e.g. Rahul"
            error={errors.firstName}
          />
          <Input
            label="Last Name *"
            value={form.lastName}
            onChangeText={v => setField('lastName', v)}
            placeholder="e.g. Sharma"
            error={errors.lastName}
          />
          <Input
            label="Admission Number *"
            value={form.admissionNumber}
            onChangeText={v => setField('admissionNumber', v)}
            placeholder="e.g. 2024001"
            error={errors.admissionNumber}
          />
          <Input
            label="Date of Birth (YYYY-MM-DD)"
            value={form.dateOfBirth}
            onChangeText={v => setField('dateOfBirth', v)}
            placeholder="e.g. 2010-06-15"
            keyboardType="numeric"
          />

          <Text style={styles.labelText}>Gender</Text>
          <View style={styles.genderRow}>
            {(['MALE', 'FEMALE', 'OTHER'] as Gender[]).map(g => (
              <TouchableOpacity
                key={g}
                style={[styles.genderBtn, form.gender === g && styles.genderBtnActive]}
                onPress={() => setField('gender', g)}
              >
                <Text style={[styles.genderLabel, form.gender === g && styles.genderLabelActive]}>
                  {g === 'MALE' ? '♂ Male' : g === 'FEMALE' ? '♀ Female' : '⚬ Other'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        <Button
          label="Add Student"
          onPress={handleSubmit}
          loading={mutation.isPending}
          fullWidth
          style={styles.submitBtn}
          size="lg"
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.md, paddingBottom: Spacing.xxl },
  sectionTitle: { ...Typography.h5, color: Colors.textPrimary, marginBottom: Spacing.md },
  labelText: { ...Typography.body2, color: Colors.textSecondary, fontWeight: '600', marginBottom: Spacing.sm },
  genderRow: { flexDirection: 'row', marginBottom: Spacing.md, gap: Spacing.sm },
  genderBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  genderBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '12' },
  genderLabel: { ...Typography.caption, color: Colors.textSecondary, fontWeight: '600' },
  genderLabelActive: { color: Colors.primary },
  submitBtn: { marginTop: Spacing.md },
});
