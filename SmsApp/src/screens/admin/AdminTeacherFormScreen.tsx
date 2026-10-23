import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import Toast from 'react-native-toast-message';

import { adminService, CreateTeacherRequest } from '@api/services/adminService';
import Header from '@components/common/Header';
import Card from '@components/common/Card';
import AppButton from '@components/common/AppButton';
import { Colors } from '@constants/colors';
import { Sizes } from '@constants/sizes';

const ROLES: CreateTeacherRequest['role'][] = ['TEACHER', 'ACCOUNTANT', 'TRANSPORT_MANAGER', 'SUPPORT_STAFF', 'SCHOOL_ADMIN'];
const ROLE_LABEL: Record<string, string> = {
  TEACHER: 'Teacher', ACCOUNTANT: 'Accountant', TRANSPORT_MANAGER: 'Transport', SUPPORT_STAFF: 'Support Staff', SCHOOL_ADMIN: 'Admin',
};

const AdminTeacherFormScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const qc = useQueryClient();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [qualification, setQualification] = useState('');
  const [role, setRole] = useState<CreateTeacherRequest['role']>('TEACHER');
  const [joiningDate, setJoiningDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const valid = firstName.trim() && lastName.trim() &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) && /^\d{4}-\d{2}-\d{2}$/.test(joiningDate);

  const mutation = useMutation({
    mutationFn: () => adminService.createTeacher({
      firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim(),
      mobile: mobile.trim() || undefined, qualification: qualification.trim() || undefined,
      role, joiningDate,
    }),
    onSuccess: () => {
      Toast.show({ type: 'success', text1: 'Employee created', text2: 'Login ID & temp password emailed' });
      qc.invalidateQueries({ queryKey: ['admin-teachers'] });
      navigation.goBack();
    },
    onError: (e: any) => Toast.show({ type: 'error', text1: 'Create failed', text2: e?.response?.data?.message ?? 'Try again' }),
  });

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Header title="New Employee" onBack={() => navigation.goBack()} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}>
        <Card style={styles.card}>
          <Field label="First name" value={firstName} onChangeText={setFirstName} />
          <Field label="Last name" value={lastName} onChangeText={setLastName} />
          <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          <Field label="Mobile" value={mobile} onChangeText={setMobile} keyboardType="phone-pad" />
          <Field label="Qualification" value={qualification} onChangeText={setQualification} />

          <Text style={styles.label}>Role</Text>
          <View style={styles.roleRow}>
            {ROLES.map(r => {
              const active = role === r;
              return (
                <TouchableOpacity key={r} onPress={() => setRole(r)} style={[styles.roleChip, active && styles.roleChipActive]}>
                  <Text style={[styles.roleText, active && styles.roleTextActive]}>{ROLE_LABEL[r as string]}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Field label="Joining date (yyyy-MM-dd)" value={joiningDate} onChangeText={setJoiningDate} />

          <AppButton
            title={mutation.isPending ? 'Creating…' : 'Create Employee'}
            onPress={() => mutation.mutate()}
            loading={mutation.isPending}
            disabled={!valid}
            style={{ marginTop: Sizes.md }}
          />
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const Field = ({ label, ...props }: any) => (
  <View style={{ marginBottom: Sizes.sm }}>
    <Text style={styles.label}>{label}</Text>
    <TextInput placeholderTextColor={Colors.textMuted} style={styles.input} {...props} />
  </View>
);

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Sizes.md },
  card: { padding: Sizes.md },
  label: { fontSize: Sizes.fontSm, fontWeight: '700', color: Colors.textSecondary, marginBottom: 6 },
  input: {
    backgroundColor: Colors.background, borderRadius: Sizes.radiusMd, borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Sizes.md, paddingVertical: Platform.OS === 'ios' ? 12 : 9, fontSize: Sizes.fontMd, color: Colors.textPrimary,
  },
  roleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Sizes.sm, marginBottom: Sizes.sm },
  roleChip: { paddingHorizontal: Sizes.md, paddingVertical: 8, borderRadius: Sizes.radiusFull, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border },
  roleChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  roleText: { fontSize: Sizes.fontSm, fontWeight: '600', color: Colors.textSecondary },
  roleTextActive: { color: Colors.white },
});

export default AdminTeacherFormScreen;
