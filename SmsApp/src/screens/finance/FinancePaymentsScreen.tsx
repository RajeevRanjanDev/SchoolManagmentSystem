import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';

import { financeService, FinancePayment } from '@api/services/employeeService';
import Header from '@components/common/Header';
import Card from '@components/common/Card';
import Badge from '@components/common/Badge';
import AppButton from '@components/common/AppButton';
import LoadingSpinner from '@components/common/LoadingSpinner';
import EmptyState from '@components/common/EmptyState';
import { Colors } from '@constants/colors';
import { Sizes } from '@constants/sizes';
import { formatCurrency } from '@utils/formatters';
import { formatDate } from '@utils/dateUtils';

const statusColor = (s?: string) => {
  switch ((s ?? '').toUpperCase()) {
    case 'CAPTURED': case 'PAID': case 'SUCCESS': return Colors.success;
    case 'REFUNDED': return Colors.holiday;
    case 'FAILED': return Colors.danger;
    default: return Colors.warning;
  }
};

const FinancePaymentsScreen = () => {
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const [refundOf, setRefundOf] = useState<FinancePayment | null>(null);
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');

  const { data, isLoading } = useQuery({ queryKey: ['finance-payments'], queryFn: () => financeService.payments(0, 50) });
  const payments = data?.content ?? [];

  const refundMut = useMutation({
    mutationFn: () => financeService.refund(refundOf!.id, { amount: amount ? Number(amount) : undefined, reason: reason.trim() || undefined }),
    onSuccess: () => { Toast.show({ type: 'success', text1: 'Refund requested' }); setRefundOf(null); setAmount(''); setReason(''); qc.invalidateQueries({ queryKey: ['finance-payments'] }); },
    onError: (e: any) => Toast.show({ type: 'error', text1: 'Failed', text2: e?.response?.data?.message ?? 'Try again' }),
  });

  return (
    <View style={styles.root}>
      <Header title="Online Payments" />
      {isLoading ? (
        <LoadingSpinner message="Loading…" />
      ) : (
        <FlatList
          data={payments}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 120 }]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<EmptyState icon="credit-card-off-outline" title="No payments" />}
          renderItem={({ item }) => {
            const refundable = (item.capturedAmount ?? item.amount ?? 0) - (item.amountRefunded ?? 0);
            return (
              <Card style={styles.card}>
                <View style={styles.headerRow}>
                  <Text style={styles.amount}>{formatCurrency(item.capturedAmount ?? item.amount ?? 0)}</Text>
                  <Badge label={item.status} color={statusColor(item.status)} />
                </View>
                <Text style={styles.sub}>
                  {[item.razorpayPaymentId, item.method, item.createdAt ? formatDate(item.createdAt) : null].filter(Boolean).join('  ·  ')}
                </Text>
                {refundable > 0 && (
                  <TouchableOpacity style={styles.refundBtn} onPress={() => { setRefundOf(item); setAmount(String(refundable)); }}>
                    <Text style={styles.refundText}>Refund</Text>
                  </TouchableOpacity>
                )}
              </Card>
            );
          }}
        />
      )}

      {refundOf && (
        <View style={[styles.panel, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.panelHeader}>
            <Text style={styles.panelTitle}>Refund payment</Text>
            <TouchableOpacity onPress={() => setRefundOf(null)}><Text style={styles.cancel}>Cancel</Text></TouchableOpacity>
          </View>
          <TextInput value={amount} onChangeText={v => setAmount(v.replace(/[^0-9.]/g, ''))} keyboardType="numeric" placeholder="Amount" placeholderTextColor={Colors.textMuted} style={styles.input} />
          <TextInput value={reason} onChangeText={setReason} placeholder="Reason (optional)" placeholderTextColor={Colors.textMuted} style={[styles.input, { marginTop: Sizes.sm }]} />
          <AppButton title={refundMut.isPending ? 'Processing…' : `Refund ${formatCurrency(Number(amount) || 0)}`} onPress={() => refundMut.mutate()} loading={refundMut.isPending} disabled={!(Number(amount) > 0)} variant="danger" style={{ marginTop: Sizes.sm }} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  list: { padding: Sizes.md, gap: Sizes.sm },
  card: { padding: Sizes.md },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  amount: { fontSize: Sizes.fontLg, fontWeight: '800', color: Colors.textPrimary },
  sub: { fontSize: Sizes.fontXs, color: Colors.textMuted, marginTop: 4 },
  refundBtn: { alignSelf: 'flex-start', marginTop: Sizes.sm, backgroundColor: Colors.danger + '12', borderRadius: Sizes.radiusFull, paddingHorizontal: Sizes.md, paddingVertical: 6 },
  refundText: { fontSize: Sizes.fontXs, fontWeight: '700', color: Colors.danger },
  panel: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: Colors.white, borderTopLeftRadius: Sizes.radiusLg, borderTopRightRadius: Sizes.radiusLg, padding: Sizes.md, ...Sizes.shadowLg },
  panelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Sizes.sm },
  panelTitle: { flex: 1, fontSize: Sizes.fontMd, fontWeight: '800', color: Colors.textPrimary },
  cancel: { fontSize: Sizes.fontSm, color: Colors.danger, fontWeight: '600' },
  input: { backgroundColor: Colors.background, borderRadius: Sizes.radiusMd, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: Sizes.md, paddingVertical: 10, fontSize: Sizes.fontMd, color: Colors.textPrimary },
});

export default FinancePaymentsScreen;
