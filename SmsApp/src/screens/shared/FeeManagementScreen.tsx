import React, { useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  Modal, ScrollView, Alert, RefreshControl,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { feesApi } from '../../api/fees.api';
import { QUERY_KEYS, FEE_STATUS_COLORS } from '../../constants';
import { Header } from '../../components/common/Header';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Badge } from '../../components/common/Badge';
import { Card } from '../../components/common/Card';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { isPositiveNumber } from '../../utils/validators';
import type { Fee, PaymentMethod } from '../../types';

const PAYMENT_METHODS: PaymentMethod[] = ['CASH', 'UPI', 'ONLINE', 'CHEQUE', 'NEFT'];

export function FeeManagementScreen() {
  const queryClient = useQueryClient();
  const [selectedFee, setSelectedFee] = useState<Fee | null>(null);
  const [paymentForm, setPaymentForm] = useState({ amount: '', method: 'CASH' as PaymentMethod, transactionId: '' });
  const [activeTab, setActiveTab] = useState<'all' | 'pending'>('pending');

  const { data: pendingFees, isLoading, refetch, isRefetching } = useQuery({
    queryKey: QUERY_KEYS.FEES_PENDING,
    queryFn: feesApi.getPendingFees,
  });

  const payMutation = useMutation({
    mutationFn: () =>
      feesApi.recordPayment({
        feeId: selectedFee!.id,
        amountPaid: Number(paymentForm.amount),
        paymentMethod: paymentForm.method,
        transactionId: paymentForm.transactionId || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.FEES_PENDING });
      setSelectedFee(null);
      Alert.alert('Success', 'Payment recorded successfully!');
    },
    onError: () => Alert.alert('Error', 'Failed to record payment.'),
  });

  function handlePay() {
    if (!isPositiveNumber(paymentForm.amount)) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount');
      return;
    }
    payMutation.mutate();
  }

  const fees = pendingFees ?? [];
  const totalPending = fees.reduce((acc, f) => acc + (f.pendingAmount ?? f.amount), 0);

  function renderFee({ item }: { item: Fee }) {
    return (
      <TouchableOpacity
        style={styles.feeCard}
        onPress={() => { setSelectedFee(item); setPaymentForm({ amount: String(item.pendingAmount ?? item.amount), method: 'CASH', transactionId: '' }); }}
        activeOpacity={0.7}
      >
        <View style={styles.feeTop}>
          <View>
            <Text style={styles.studentName}>{item.studentName ?? `Student #${item.studentId}`}</Text>
            <Text style={styles.feeType}>{item.feeType}</Text>
          </View>
          <Badge
            label={item.status.replace('_', ' ')}
            backgroundColor={FEE_STATUS_COLORS[item.status] + '22'}
            color={FEE_STATUS_COLORS[item.status]}
          />
        </View>
        <View style={styles.feeBottom}>
          <View>
            <Text style={styles.feeLabel}>Total</Text>
            <Text style={styles.feeAmount}>{formatCurrency(item.amount)}</Text>
          </View>
          <View>
            <Text style={styles.feeLabel}>Paid</Text>
            <Text style={[styles.feeAmount, { color: Colors.success }]}>{formatCurrency(item.paidAmount ?? 0)}</Text>
          </View>
          <View>
            <Text style={styles.feeLabel}>Pending</Text>
            <Text style={[styles.feeAmount, { color: Colors.error }]}>{formatCurrency(item.pendingAmount ?? item.amount)}</Text>
          </View>
          <View>
            <Text style={styles.feeLabel}>Due</Text>
            <Text style={styles.feeDue}>{formatDate(item.dueDate)}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Fee Management" subtitle="Manage student payments" />

      {/* Summary */}
      <View style={styles.summaryBar}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{fees.length}</Text>
          <Text style={styles.summaryLabel}>Pending</Text>
        </View>
        <View style={[styles.summaryItem, styles.summaryCenter]}>
          <Text style={[styles.summaryValue, { color: Colors.error }]}>{formatCurrency(totalPending)}</Text>
          <Text style={styles.summaryLabel}>Total Due</Text>
        </View>
        <TouchableOpacity style={styles.summaryItem} onPress={() => refetch()}>
          <Text style={[styles.summaryValue, { color: Colors.primary }]}>↻</Text>
          <Text style={styles.summaryLabel}>Refresh</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <LoadingSpinner fullScreen />
      ) : (
        <FlatList
          data={fees}
          keyExtractor={item => String(item.id)}
          renderItem={renderFee}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          ListEmptyComponent={<EmptyState title="No pending fees" message="All students are paid up!" />}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
        />
      )}

      {/* Payment Modal */}
      <Modal visible={!!selectedFee} animationType="slide" transparent>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Record Payment</Text>
            {selectedFee && (
              <>
                <Card style={styles.feeInfoCard}>
                  <Text style={styles.modalStudentName}>{selectedFee.studentName}</Text>
                  <Text style={styles.modalFeeType}>{selectedFee.feeType}</Text>
                  <Text style={styles.modalPending}>Pending: {formatCurrency(selectedFee.pendingAmount ?? selectedFee.amount)}</Text>
                </Card>

                <Input label="Amount *" value={paymentForm.amount} onChangeText={v => setPaymentForm(f => ({ ...f, amount: v }))} keyboardType="numeric" placeholder="Enter amount" />

                <Text style={styles.methodLabel}>Payment Method</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.methodScroll}>
                  {PAYMENT_METHODS.map(method => (
                    <TouchableOpacity
                      key={method}
                      style={[styles.methodBtn, paymentForm.method === method && styles.methodBtnActive]}
                      onPress={() => setPaymentForm(f => ({ ...f, method }))}
                    >
                      <Text style={[styles.methodText, paymentForm.method === method && styles.methodTextActive]}>{method}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {paymentForm.method !== 'CASH' && (
                  <Input label="Transaction ID" value={paymentForm.transactionId} onChangeText={v => setPaymentForm(f => ({ ...f, transactionId: v }))} placeholder="Optional reference number" />
                )}

                <View style={styles.modalActions}>
                  <Button label="Cancel" onPress={() => setSelectedFee(null)} variant="outline" style={styles.modalBtn} />
                  <Button label="Record Payment" onPress={handlePay} loading={payMutation.isPending} style={styles.modalBtn} />
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  summaryBar: { flexDirection: 'row', backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  summaryItem: { flex: 1, alignItems: 'center', paddingVertical: Spacing.md },
  summaryCenter: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: Colors.border },
  summaryValue: { ...Typography.h4, color: Colors.textPrimary },
  summaryLabel: { ...Typography.caption, color: Colors.textSecondary },
  list: { padding: Spacing.md },
  feeCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.md, ...Shadows.sm },
  feeTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.sm },
  studentName: { ...Typography.h5, color: Colors.textPrimary },
  feeType: { ...Typography.caption, color: Colors.textSecondary },
  feeBottom: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.divider },
  feeLabel: { ...Typography.overline, color: Colors.textTertiary, marginBottom: 2 },
  feeAmount: { ...Typography.body2, fontWeight: '700', color: Colors.textPrimary },
  feeDue: { ...Typography.caption, color: Colors.textSecondary },
  overlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  modal: { backgroundColor: Colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: Spacing.xl },
  modalTitle: { ...Typography.h4, color: Colors.textPrimary, marginBottom: Spacing.lg },
  feeInfoCard: { marginBottom: Spacing.md },
  modalStudentName: { ...Typography.h5, color: Colors.textPrimary },
  modalFeeType: { ...Typography.body2, color: Colors.textSecondary },
  modalPending: { ...Typography.h5, color: Colors.error, marginTop: Spacing.sm },
  methodLabel: { ...Typography.body2, color: Colors.textSecondary, fontWeight: '600', marginBottom: Spacing.sm },
  methodScroll: { marginBottom: Spacing.md },
  methodBtn: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.round, borderWidth: 1.5, borderColor: Colors.border, marginRight: Spacing.sm },
  methodBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  methodText: { ...Typography.caption, color: Colors.textSecondary, fontWeight: '600' },
  methodTextActive: { color: Colors.white },
  modalActions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.lg },
  modalBtn: { flex: 1 },
});
