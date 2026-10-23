import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import Toast from 'react-native-toast-message';

import { adminService } from '@api/services/adminService';
import Header from '@components/common/Header';
import Card from '@components/common/Card';
import AppButton from '@components/common/AppButton';
import { Colors } from '@constants/colors';
import { Sizes } from '@constants/sizes';
import { currentAcademicYear } from '@utils/dateUtils';

type Action = 'admit' | 'enroll' | 'promote' | 'transfer' | 'roll' | 'dropout' | 'passout' | 'alumni' | 'deactivate';
const ACTIONS: { key: Action; label: string; danger?: boolean }[] = [
  { key: 'admit', label: 'Admit' }, { key: 'enroll', label: 'Enroll' },
  { key: 'promote', label: 'Promote' }, { key: 'transfer', label: 'Transfer' },
  { key: 'roll', label: 'Roll No' },
  { key: 'dropout', label: 'Dropout', danger: true }, { key: 'passout', label: 'Passout' },
  { key: 'alumni', label: 'Alumni' }, { key: 'deactivate', label: 'Deactivate', danger: true },
];
const needsTarget = (a: Action) => a === 'promote' || a === 'transfer';
const isBody = (a: Action) => a === 'admit' || a === 'enroll' || a === 'promote' || a === 'transfer';

const AdminStudentLifecycleScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const qc = useQueryClient();
  const studentId: number = route.params?.studentId;
  const academicYear = currentAcademicYear();

  const [action, setAction] = useState<Action>('promote');
  const [remarks, setRemarks] = useState('');
  const [effectiveDate, setEffectiveDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [rollNumber, setRollNumber] = useState('');
  const [targetClassId, setTargetClassId] = useState<number | undefined>();
  const [targetSectionId, setTargetSectionId] = useState<number | undefined>();

  const { data: classes } = useQuery({ queryKey: ['admin-classes', academicYear], queryFn: () => adminService.listClasses(academicYear), enabled: needsTarget(action) });
  const { data: sections } = useQuery({ queryKey: ['admin-sections', targetClassId], queryFn: () => adminService.listSections(targetClassId!), enabled: targetClassId != null });
  useEffect(() => { setTargetSectionId(undefined); }, [targetClassId]);

  const mutation = useMutation({
    mutationFn: () => {
      if (action === 'roll') return adminService.assignRoll(studentId, rollNumber.trim());
      if (isBody(action)) {
        const body: any = { effectiveDate, remarks: remarks.trim() || undefined };
        if (needsTarget(action)) { body.targetClassId = targetClassId; body.targetSectionId = targetSectionId; }
        return adminService.lifecycleAction(studentId, action as any, body);
      }
      return adminService.lifecycleRemark(studentId, action as any, remarks.trim() || undefined);
    },
    onSuccess: () => {
      Toast.show({ type: 'success', text1: `${action} done` });
      qc.invalidateQueries({ queryKey: ['admin-student', studentId] });
      qc.invalidateQueries({ queryKey: ['admin-students'] });
      navigation.goBack();
    },
    onError: (e: any) => Toast.show({ type: 'error', text1: 'Action failed', text2: e?.response?.data?.message ?? 'Try again' }),
  });

  const valid =
    action === 'roll' ? rollNumber.trim().length > 0 :
    needsTarget(action) ? targetClassId != null && targetSectionId != null :
    true;

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Header title="Manage Status" onBack={() => navigation.goBack()} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}>
        <Text style={styles.label}>Action</Text>
        <View style={styles.actionsWrap}>
          {ACTIONS.map(a => {
            const active = action === a.key;
            return (
              <TouchableOpacity key={a.key} onPress={() => setAction(a.key)}
                style={[styles.actChip, active && (a.danger ? styles.dangerActive : styles.chipActive)]}>
                <Text style={[styles.actText, active && styles.actTextActive]}>{a.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Card style={styles.card}>
          {action === 'roll' ? (
            <>
              <Text style={styles.label}>Roll number</Text>
              <TextInput value={rollNumber} onChangeText={setRollNumber} placeholder="e.g. 12" placeholderTextColor={Colors.textMuted} style={styles.input} />
            </>
          ) : (
            <>
              {isBody(action) && (
                <>
                  <Text style={styles.label}>Effective date (yyyy-MM-dd)</Text>
                  <TextInput value={effectiveDate} onChangeText={setEffectiveDate} style={styles.input} placeholderTextColor={Colors.textMuted} />
                </>
              )}
              {needsTarget(action) && (
                <>
                  <Text style={[styles.label, { marginTop: Sizes.sm }]}>Target class</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
                    {(classes ?? []).map(c => {
                      const active = c.id === targetClassId;
                      return (
                        <TouchableOpacity key={c.id} onPress={() => setTargetClassId(c.id)} style={[styles.chip, active && styles.chipActive]}>
                          <Text style={[styles.chipText, active && styles.chipTextActive]}>{c.name}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                  {targetClassId != null && (
                    <>
                      <Text style={[styles.label, { marginTop: Sizes.sm }]}>Target section</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
                        {(sections ?? []).map(s => {
                          const active = s.id === targetSectionId;
                          return (
                            <TouchableOpacity key={s.id} onPress={() => setTargetSectionId(s.id)} style={[styles.chip, active && styles.chipActive]}>
                              <Text style={[styles.chipText, active && styles.chipTextActive]}>{s.name}</Text>
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                    </>
                  )}
                </>
              )}
              <Text style={[styles.label, { marginTop: Sizes.sm }]}>Remarks</Text>
              <TextInput value={remarks} onChangeText={setRemarks} placeholder="Optional note" placeholderTextColor={Colors.textMuted} style={[styles.input, { minHeight: 60 }]} multiline textAlignVertical="top" />
            </>
          )}

          <AppButton
            title={mutation.isPending ? 'Applying…' : `Apply: ${action}`}
            onPress={() => mutation.mutate()}
            loading={mutation.isPending}
            disabled={!valid}
            variant={action === 'dropout' || action === 'deactivate' ? 'danger' : 'primary'}
            style={{ marginTop: Sizes.md }}
          />
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Sizes.md, gap: Sizes.sm },
  label: { fontSize: Sizes.fontSm, fontWeight: '700', color: Colors.textSecondary, marginBottom: 6 },
  actionsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Sizes.sm },
  actChip: { paddingHorizontal: Sizes.md, paddingVertical: 8, borderRadius: Sizes.radiusFull, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  dangerActive: { backgroundColor: Colors.danger, borderColor: Colors.danger },
  actText: { fontSize: Sizes.fontSm, fontWeight: '600', color: Colors.textSecondary },
  actTextActive: { color: Colors.white },
  card: { padding: Sizes.md, marginTop: Sizes.sm },
  input: { backgroundColor: Colors.background, borderRadius: Sizes.radiusMd, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: Sizes.md, paddingVertical: Platform.OS === 'ios' ? 12 : 9, fontSize: Sizes.fontMd, color: Colors.textPrimary },
  chipsRow: { gap: Sizes.sm, paddingVertical: 2 },
  chip: { paddingHorizontal: Sizes.md, paddingVertical: 8, borderRadius: Sizes.radiusFull, backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border },
  chipText: { fontSize: Sizes.fontSm, fontWeight: '600', color: Colors.textSecondary },
  chipTextActive: { color: Colors.white },
});

export default AdminStudentLifecycleScreen;
