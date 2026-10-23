import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';

import { adminService, AdminFee } from '@api/services/adminService';
import Header from '@components/common/Header';
import Card from '@components/common/Card';
import Badge from '@components/common/Badge';
import AppButton from '@components/common/AppButton';
import LoadingSpinner from '@components/common/LoadingSpinner';
import EmptyState from '@components/common/EmptyState';
import { Colors } from '@constants/colors';
import { Sizes } from '@constants/sizes';
import { formatCurrency, feeStatusColor } from '@utils/formatters';
import { currentAcademicYear } from '@utils/dateUtils';

const METHODS = ['CASH', 'UPI', 'CARD', 'BANK_TRANSFER', 'CHEQUE'];
const balanceOf = (f: AdminFee) => {
  const net = f.netAmount ?? f.amount - (f.discount ?? 0) + (f.fine ?? 0);
  return f.balance ?? net - (f.paidAmount ?? 0);
};

const AdminFeesScreen = () => {
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const academicYear = currentAcademicYear();

  const [selected, setSelected] = useState<AdminFee | null>(null);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('CASH');

  const { data: fees, isLoading } = useQuery({ queryKey: ['admin-fees', academicYear], queryFn: () => adminService.listFees(undefined, academicYear) });
  const { data: summary } = useQuery({ queryKey: ['admin-fee-summary', academicYear], queryFn: () => adminService.feeSummary(academicYear) });

  const outstanding = useMemo(
    () => (fees ?? []).reduce((s, f) => (f.status === 'PAID' ? s : s + Math.max(0, balanceOf(f))), 0),
    [fees],
  );

  const payMut = useMutation({
    mutationFn: () => adminService.recordPayment({ feeId: selected!.id, amountPaid: Number(amount), paymentMethod: method }),
    onSuccess: () => {
      Toast.show({ type: 'success', text1: 'Payment recorded' });
      setSelected(null); setAmount('');
      qc.invalidateQueries({ queryKey: ['admin-fees', academicYear] });
      qc.invalidateQueries({ queryKey: ['admin-fee-summary', academicYear] });
    },
    onError: (e: any) => Toast.show({ type: 'error', text1: 'Failed', text2: e?.response?.data?.message ?? 'Try again' }),
  });

  const openPay = (f: AdminFee) => { setSelected(f); setAmount(String(Math.max(0, balanceOf(f)))); setMethod('CASH'); };

  return (
    <View style={styles.root}>
      <Header title="Fees" />
      {isLoading ? (
        <LoadingSpinner message="Loading fees…" />
      ) : (
        <FlatList
          data={fees ?? []}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 120 }]}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={styles.summaryRow}>
              <Card style={[styles.box, { borderTopColor: Colors.danger, borderTopWidth: 3 }]}>
                <Text style={[styles.boxVal, { color: Colors.danger }]}>
                  {formatCurrency(Number(summary?.totalOutstanding ?? outstanding))}
                </Text>
                <Text style={styles.boxLbl}>Outstanding</Text>
              </Card>
              <Card style={[styles.box, { borderTopColor: Colors.success, borderTopWidth: 3 }]}>
                <Text style={[styles.boxVal, { color: Colors.success }]}>
                  {formatCurrency(Number(summary?.totalCollected ?? 0))}
                </Text>
                <Text style={styles.boxLbl}>Collected</Text>
              </Card>
            </View>
          }
          ListEmptyComponent={<EmptyState icon="cash-off" title="No fees" />}
          renderItem={({ item }) => (
            <Card style={styles.card}>
              <View style={styles.feeHeader}>
                <Text style={styles.student}>{item.studentName ?? `Student #${item.studentId}`}</Text>
                <Badge label={item.status} color={feeStatusColor(item.status)} />
              </View>
              <Text style={styles.cat}>{[item.feeCategory, item.feePeriod].filter(Boolean).join(' · ')}</Text>
              <View style={styles.amtRow}>
                <Text style={styles.amount}>{formatCurrency(item.netAmount ?? item.amount)}</Text>
                {item.status !== 'PAID' ? (
                  <TouchableOpacity style={styles.payBtn} onPress={() => openPay(item)}>
                    <Text style={styles.payText}>Record payment</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </Card>
          )}
        />
      )}

      {/* Record payment panel */}
      {selected && (
        <View style={[styles.payPanel, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.panelHeader}>
            <Text style={styles.panelTitle}>Record payment — {selected.studentName ?? `#${selected.studentId}`}</Text>
            <TouchableOpacity onPress={() => setSelected(null)}><Text style={styles.cancel}>Cancel</Text></TouchableOpacity>
          </View>
          <View style={styles.inlineRow}>
            <TextInput value={amount} onChangeText={v => setAmount(v.replace(/[^0-9.]/g, ''))} keyboardType="numeric"
              placeholder="Amount" placeholderTextColor={Colors.textMuted} style={[styles.input, { flex: 1 }]} />
          </View>
          <View style={styles.methodRow}>
            {METHODS.map(m => {
              const active = method === m;
              return (
                <TouchableOpacity key={m} onPress={() => setMethod(m)} style={[styles.methodChip, active && styles.methodChipActive]}>
                  <Text style={[styles.methodText, active && styles.methodTextActive]}>{m.replace('_', ' ')}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <AppButton
            title={payMut.isPending ? 'Saving…' : `Record ${formatCurrency(Number(amount) || 0)}`}
            onPress={() => payMut.mutate()}
            loading={payMut.isPending}
            disabled={!(Number(amount) > 0)}
            style={{ marginTop: Sizes.sm }}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  list: { padding: Sizes.md, gap: Sizes.sm },
  summaryRow: { flexDirection: 'row', gap: Sizes.sm, marginBottom: Sizes.sm },
  box: { flex: 1, alignItems: 'center', padding: Sizes.md },
  boxVal: { fontSize: Sizes.fontLg, fontWeight: '800' },
  boxLbl: { fontSize: Sizes.fontXs, color: Colors.textMuted, marginTop: 2 },
  card: { padding: Sizes.md },
  feeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  student: { fontSize: Sizes.fontMd, fontWeight: '700', color: Colors.textPrimary },
  cat: { fontSize: Sizes.fontXs, color: Colors.textMuted, marginTop: 2 },
  amtRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  amount: { fontSize: Sizes.fontLg, fontWeight: '800', color: Colors.textPrimary },
  payBtn: { backgroundColor: Colors.primary, borderRadius: Sizes.radiusFull, paddingHorizontal: Sizes.md, paddingVertical: 8 },
  payText: { fontSize: Sizes.fontXs, fontWeight: '700', color: Colors.white },
  payPanel: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    backgroundColor: Colors.white, borderTopLeftRadius: Sizes.radiusLg, borderTopRightRadius: Sizes.radiusLg,
    padding: Sizes.md, ...Sizes.shadowLg,
  },
  panelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Sizes.sm },
  panelTitle: { flex: 1, fontSize: Sizes.fontMd, fontWeight: '800', color: Colors.textPrimary },
  cancel: { fontSize: Sizes.fontSm, color: Colors.danger, fontWeight: '600' },
  inlineRow: { flexDirection: 'row', gap: Sizes.sm },
  input: {
    backgroundColor: Colors.background, borderRadius: Sizes.radiusMd, borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Sizes.md, paddingVertical: 10, fontSize: Sizes.fontLg, fontWeight: '700', color: Colors.textPrimary,
  },
  methodRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Sizes.sm, marginTop: Sizes.sm },
  methodChip: { paddingHorizontal: Sizes.md, paddingVertical: 6, borderRadius: Sizes.radiusFull, backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border },
  methodChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  methodText: { fontSize: Sizes.fontXs, fontWeight: '600', color: Colors.textSecondary },
  methodTextActive: { color: Colors.white },
});

export default AdminFeesScreen;
