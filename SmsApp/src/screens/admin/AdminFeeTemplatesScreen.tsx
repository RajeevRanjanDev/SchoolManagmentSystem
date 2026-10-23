import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Alert, ScrollView,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';

import { adminService } from '@api/services/adminService';
import Header from '@components/common/Header';
import Card from '@components/common/Card';
import Badge from '@components/common/Badge';
import AppButton from '@components/common/AppButton';
import LoadingSpinner from '@components/common/LoadingSpinner';
import EmptyState from '@components/common/EmptyState';
import { Colors } from '@constants/colors';
import { Sizes } from '@constants/sizes';
import { formatCurrency } from '@utils/formatters';
import { currentAcademicYear } from '@utils/dateUtils';

const FEE_TYPES = ['TUITION', 'TRANSPORT', 'EXAM', 'OTHER'];
const FREQS = ['MONTHLY', 'QUARTERLY', 'ANNUAL', 'ONE_TIME'];
const SCOPES = ['CLASS', 'SECTION', 'STUDENT'] as const;

const AdminFeeTemplatesScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const qc = useQueryClient();
  const academicYear = currentAcademicYear();

  const [show, setShow] = useState(false);
  const [name, setName] = useState('');
  const [feeType, setFeeType] = useState('TUITION');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState('MONTHLY');

  const [applyTpl, setApplyTpl] = useState<any | null>(null);
  const [scope, setScope] = useState<'CLASS' | 'SECTION' | 'STUDENT'>('CLASS');
  const [classId, setClassId] = useState<number | undefined>();
  const [sectionId, setSectionId] = useState<number | undefined>();
  const [studentId, setStudentId] = useState('');

  const { data: templates, isLoading } = useQuery({ queryKey: ['admin-fee-templates'], queryFn: () => adminService.listFeeTemplates() });
  const { data: classes } = useQuery({ queryKey: ['admin-classes', academicYear], queryFn: () => adminService.listClasses(academicYear), enabled: !!applyTpl });
  const { data: sections } = useQuery({ queryKey: ['admin-sections', classId], queryFn: () => adminService.listSections(classId!), enabled: classId != null && scope === 'SECTION' });
  useEffect(() => { setSectionId(undefined); }, [classId]);

  const createMut = useMutation({
    mutationFn: () => adminService.createFeeTemplate({
      name: name.trim(), feeType, amount: Number(amount) || 0, frequency, academicYear,
      dueDayOfMonth: 10, graceDays: 5, lateFeeEnabled: true, lateFeeAmount: 100,
      repeatedLateFeeAmount: 50, partialAllowed: false, minPartialPercent: 50,
      reminderDaysBefore: 3, reminderOnDueDate: true, reminderDaysAfter: 5,
      concessionType: 'NONE', status: 'ACTIVE',
    }),
    onSuccess: () => { Toast.show({ type: 'success', text1: 'Template created' }); setName(''); setAmount(''); setShow(false); qc.invalidateQueries({ queryKey: ['admin-fee-templates'] }); },
    onError: (e: any) => Toast.show({ type: 'error', text1: 'Failed', text2: e?.response?.data?.message ?? 'Try again' }),
  });
  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: number; status: 'ACTIVE' | 'INACTIVE' }) => adminService.setFeeTemplateStatus(id, status),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-fee-templates'] }); },
  });
  const deleteMut = useMutation({
    mutationFn: (id: number) => adminService.deleteFeeTemplate(id),
    onSuccess: () => { Toast.show({ type: 'success', text1: 'Deleted' }); qc.invalidateQueries({ queryKey: ['admin-fee-templates'] }); },
    onError: (e: any) => Toast.show({ type: 'error', text1: 'Failed', text2: e?.response?.data?.message ?? 'Try again' }),
  });
  const applyMut = useMutation({
    mutationFn: () => adminService.applyFeeTemplate(applyTpl.id, {
      scope,
      classId: scope !== 'STUDENT' ? classId : undefined,
      sectionId: scope === 'SECTION' ? sectionId : undefined,
      studentId: scope === 'STUDENT' ? Number(studentId) : undefined,
    }),
    onSuccess: () => { Toast.show({ type: 'success', text1: 'Fees generated' }); setApplyTpl(null); },
    onError: (e: any) => Toast.show({ type: 'error', text1: 'Failed', text2: e?.response?.data?.message ?? 'Try again' }),
  });

  const canApply = scope === 'CLASS' ? classId != null : scope === 'SECTION' ? sectionId != null : Number(studentId) > 0;

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Header title="Fee Templates" onBack={() => navigation.goBack()} rightIcon={show ? 'close' : 'plus'} onRightPress={() => setShow(s => !s)} />
      {show && (
        <Card style={styles.formCard}>
          <TextInput value={name} onChangeText={setName} placeholder="Template name" placeholderTextColor={Colors.textMuted} style={styles.input} />
          <Text style={styles.label}>Fee type</Text>
          <Row items={FEE_TYPES} value={feeType} onChange={setFeeType} />
          <Text style={styles.label}>Frequency</Text>
          <Row items={FREQS} value={frequency} onChange={setFrequency} />
          <TextInput value={amount} onChangeText={v => setAmount(v.replace(/[^0-9.]/g, ''))} placeholder="Amount" placeholderTextColor={Colors.textMuted} keyboardType="numeric" style={[styles.input, { marginTop: Sizes.sm }]} />
          <AppButton title={createMut.isPending ? 'Creating…' : 'Create Template'} onPress={() => createMut.mutate()} loading={createMut.isPending} disabled={!name.trim() || !(Number(amount) > 0)} size="sm" style={{ marginTop: Sizes.sm }} />
        </Card>
      )}

      {isLoading ? (
        <LoadingSpinner message="Loading…" />
      ) : (
        <FlatList
          data={templates ?? []}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 120 }]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<EmptyState icon="file-document-outline" title="No templates" subtitle="Tap + to create one." />}
          renderItem={({ item }) => {
            const active = (item.status ?? 'ACTIVE') === 'ACTIVE';
            return (
              <Card style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.name}>{item.name}</Text>
                  <Badge label={item.status ?? 'ACTIVE'} color={active ? Colors.success : Colors.textMuted} />
                </View>
                <Text style={styles.meta}>{item.feeType} · {formatCurrency(item.amount ?? 0)}{item.academicYear ? `  ·  ${item.academicYear}` : ''}</Text>
                <View style={styles.actions}>
                  <TouchableOpacity style={styles.actBtn} onPress={() => { setApplyTpl(item); setScope('CLASS'); setClassId(undefined); setStudentId(''); }}>
                    <Icon name="playlist-plus" size={18} color={Colors.primary} /><Text style={styles.actText}>Apply</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actBtn} onPress={() => statusMut.mutate({ id: item.id, status: active ? 'INACTIVE' : 'ACTIVE' })}>
                    <Icon name={active ? 'pause-circle-outline' : 'play-circle-outline'} size={18} color={Colors.textSecondary} /><Text style={[styles.actText, { color: Colors.textSecondary }]}>{active ? 'Deactivate' : 'Activate'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actBtn} onPress={() => Alert.alert('Delete', `Delete ${item.name}?`, [
                    { text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: () => deleteMut.mutate(item.id) },
                  ])}>
                    <Icon name="trash-can-outline" size={18} color={Colors.danger} /><Text style={[styles.actText, { color: Colors.danger }]}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </Card>
            );
          }}
        />
      )}

      {applyTpl && (
        <View style={[styles.panel, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.panelHeader}>
            <Text style={styles.panelTitle}>Apply — {applyTpl.name}</Text>
            <TouchableOpacity onPress={() => setApplyTpl(null)}><Text style={styles.cancel}>Cancel</Text></TouchableOpacity>
          </View>
          <Row items={SCOPES as unknown as string[]} value={scope} onChange={(v) => setScope(v as any)} />
          {scope !== 'STUDENT' && (
            <>
              <Text style={[styles.label, { marginTop: Sizes.sm }]}>Class</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
                {(classes ?? []).map(c => {
                  const on = c.id === classId;
                  return (<TouchableOpacity key={c.id} onPress={() => setClassId(c.id)} style={[styles.chip, on && styles.chipActive]}><Text style={[styles.chipText, on && styles.chipTextActive]}>{c.name}</Text></TouchableOpacity>);
                })}
              </ScrollView>
            </>
          )}
          {scope === 'SECTION' && classId != null && (
            <>
              <Text style={[styles.label, { marginTop: Sizes.sm }]}>Section</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
                {(sections ?? []).map(s => {
                  const on = s.id === sectionId;
                  return (<TouchableOpacity key={s.id} onPress={() => setSectionId(s.id)} style={[styles.chip, on && styles.chipActive]}><Text style={[styles.chipText, on && styles.chipTextActive]}>{s.name}</Text></TouchableOpacity>);
                })}
              </ScrollView>
            </>
          )}
          {scope === 'STUDENT' && (
            <TextInput value={studentId} onChangeText={v => setStudentId(v.replace(/[^0-9]/g, ''))} placeholder="Student ID" placeholderTextColor={Colors.textMuted} keyboardType="number-pad" style={[styles.input, { marginTop: Sizes.sm }]} />
          )}
          <AppButton title={applyMut.isPending ? 'Applying…' : 'Generate Fees'} onPress={() => applyMut.mutate()} loading={applyMut.isPending} disabled={!canApply} style={{ marginTop: Sizes.sm }} />
        </View>
      )}
    </KeyboardAvoidingView>
  );
};

const Row = ({ items, value, onChange }: { items: string[]; value: string; onChange: (v: string) => void }) => (
  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
    {items.map(it => {
      const on = value === it;
      return (<TouchableOpacity key={it} onPress={() => onChange(it)} style={[styles.chip, on && styles.chipActive]}><Text style={[styles.chipText, on && styles.chipTextActive]}>{it.replace('_', ' ')}</Text></TouchableOpacity>);
    })}
  </ScrollView>
);

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  formCard: { padding: Sizes.md, margin: Sizes.md },
  label: { fontSize: Sizes.fontSm, fontWeight: '700', color: Colors.textSecondary, marginBottom: 6, marginTop: Sizes.sm },
  input: { backgroundColor: Colors.background, borderRadius: Sizes.radiusMd, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: Sizes.md, paddingVertical: Platform.OS === 'ios' ? 12 : 9, fontSize: Sizes.fontMd, color: Colors.textPrimary },
  chipsRow: { gap: Sizes.sm, paddingVertical: 2 },
  chip: { paddingHorizontal: Sizes.md, paddingVertical: 8, borderRadius: Sizes.radiusFull, backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: Sizes.fontSm, fontWeight: '600', color: Colors.textSecondary },
  chipTextActive: { color: Colors.white },
  list: { paddingHorizontal: Sizes.md, gap: Sizes.sm },
  card: { padding: Sizes.md },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: Sizes.fontMd, fontWeight: '700', color: Colors.textPrimary },
  meta: { fontSize: Sizes.fontXs, color: Colors.textMuted, marginTop: 2 },
  actions: { flexDirection: 'row', gap: Sizes.lg, marginTop: Sizes.sm, paddingTop: Sizes.sm, borderTopWidth: 1, borderTopColor: Colors.divider },
  actBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actText: { fontSize: Sizes.fontSm, color: Colors.primary, fontWeight: '600' },
  panel: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: Colors.white, borderTopLeftRadius: Sizes.radiusLg, borderTopRightRadius: Sizes.radiusLg, padding: Sizes.md, ...Sizes.shadowLg },
  panelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Sizes.sm },
  panelTitle: { flex: 1, fontSize: Sizes.fontMd, fontWeight: '800', color: Colors.textPrimary },
  cancel: { fontSize: Sizes.fontSm, color: Colors.danger, fontWeight: '600' },
});

export default AdminFeeTemplatesScreen;
