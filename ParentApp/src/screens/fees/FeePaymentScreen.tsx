import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { useMutation } from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { feeService } from '@api/services/feeService';
import { RootStackParams } from '@navigation/types';
import Header from '@components/common/Header';
import Card from '@components/common/Card';
import AppButton from '@components/common/AppButton';
import { Colors } from '@constants/colors';
import { Sizes } from '@constants/sizes';
import { formatCurrency } from '@utils/formatters';

type RouteType = RouteProp<RootStackParams, 'FeePayment'>;

type PayMethod = 'UPI' | 'CARD' | 'ONLINE' | 'CASH';

const PAY_METHODS: { id: PayMethod; label: string; icon: string; desc: string }[] = [
  { id: 'UPI',    label: 'UPI',         icon: 'qrcode-scan',   desc: 'PhonePe, GPay, Paytm, etc.' },
  { id: 'CARD',   label: 'Card',        icon: 'credit-card',   desc: 'Debit / Credit card' },
  { id: 'ONLINE', label: 'Net Banking', icon: 'bank',          desc: 'Internet banking' },
  { id: 'CASH',   label: 'Cash',        icon: 'cash',          desc: 'Pay at school office' },
];

const FeePaymentScreen = () => {
  const navigation = useNavigation<any>();
  const route      = useRoute<RouteType>();
  const { feeIds } = route.params;

  const [method, setMethod]   = useState<PayMethod>('UPI');
  const [txnId, setTxnId]     = useState('');
  const [success, setSuccess] = useState(false);

  // For demo: calculate a mock total
  const totalAmount = feeIds.length * 2500;

  const mutation = useMutation({
    mutationFn: () =>
      feeService.recordPayment({
        feeIds,
        paymentMethod: method,
        transactionId: txnId || undefined,
      }),
    onSuccess: () => setSuccess(true),
    onError: (err: any) => {
      Alert.alert('Payment Failed', err?.response?.data?.message ?? 'Please try again.');
    },
  });

  if (success) {
    return (
      <View style={styles.successContainer}>
        <View style={styles.successIcon}>
          <Icon name="check-circle" size={72} color={Colors.success} />
        </View>
        <Text style={styles.successTitle}>Payment Successful!</Text>
        <Text style={styles.successSub}>
          Your payment of {formatCurrency(totalAmount)} has been recorded.
        </Text>
        <AppButton
          title="Back to Fees"
          onPress={() => navigation.goBack()}
          style={styles.successBtn}
        />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <Header title="Fee Payment" subtitle="Choose payment method" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Amount summary */}
        <Card style={styles.amountCard}>
          <Text style={styles.amountLabel}>Total Amount Due</Text>
          <Text style={styles.amount}>{formatCurrency(totalAmount)}</Text>
          <Text style={styles.amountSub}>{feeIds.length} fee record(s)</Text>
        </Card>

        {/* Payment methods */}
        <Text style={styles.sectionTitle}>Select Payment Method</Text>
        {PAY_METHODS.map(pm => (
          <TouchableOpacity
            key={pm.id}
            onPress={() => setMethod(pm.id)}
            activeOpacity={0.8}>
            <Card style={[styles.methodCard, method === pm.id && styles.methodActive]}>
              <View style={[styles.methodIcon, { backgroundColor: method === pm.id ? Colors.primary + '15' : Colors.divider }]}>
                <Icon name={pm.icon} size={24} color={method === pm.id ? Colors.primary : Colors.textMuted} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.methodLabel, method === pm.id && { color: Colors.primary }]}>
                  {pm.label}
                </Text>
                <Text style={styles.methodDesc}>{pm.desc}</Text>
              </View>
              <Icon
                name={method === pm.id ? 'radiobox-marked' : 'radiobox-blank'}
                size={22}
                color={method === pm.id ? Colors.primary : Colors.border}
              />
            </Card>
          </TouchableOpacity>
        ))}

        {/* UPI notice */}
        {method === 'UPI' && (
          <Card style={styles.infoCard}>
            <Icon name="information-outline" size={18} color={Colors.info} />
            <Text style={styles.infoText}>
              You will be redirected to your UPI app to complete payment. Keep your UPI PIN ready.
            </Text>
          </Card>
        )}

        {method === 'CASH' && (
          <Card style={styles.infoCard}>
            <Icon name="information-outline" size={18} color={Colors.warning} />
            <Text style={styles.infoText}>
              Please visit the school fee counter with this reference. Carry this payment summary.
            </Text>
          </Card>
        )}

        <AppButton
          title={`Pay ${formatCurrency(totalAmount)}`}
          onPress={() => mutation.mutate()}
          loading={mutation.isPending}
          style={styles.payBtn}
        />

        <Text style={styles.secure}>
          🔒 Secured by 256-bit SSL encryption
        </Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Sizes.md, paddingBottom: 48 },
  amountCard: { alignItems: 'center', paddingVertical: Sizes.xl, marginBottom: Sizes.md },
  amountLabel: { fontSize: Sizes.fontSm, color: Colors.textMuted },
  amount: { fontSize: 36, fontWeight: '800', color: Colors.textPrimary, marginTop: 4 },
  amountSub: { fontSize: Sizes.fontXs, color: Colors.textMuted, marginTop: 4 },
  sectionTitle: { fontSize: Sizes.fontMd, fontWeight: '700', color: Colors.textPrimary, marginBottom: Sizes.sm },
  methodCard: { flexDirection: 'row', alignItems: 'center', gap: Sizes.md, marginBottom: Sizes.sm },
  methodActive: { borderWidth: 2, borderColor: Colors.primary },
  methodIcon: { width: 48, height: 48, borderRadius: Sizes.radiusMd, alignItems: 'center', justifyContent: 'center' },
  methodLabel: { fontSize: Sizes.fontMd, fontWeight: '600', color: Colors.textPrimary },
  methodDesc: { fontSize: Sizes.fontXs, color: Colors.textMuted, marginTop: 2 },
  infoCard: { flexDirection: 'row', gap: Sizes.sm, backgroundColor: Colors.info + '10', marginBottom: Sizes.md },
  infoText: { flex: 1, fontSize: Sizes.fontSm, color: Colors.textSecondary, lineHeight: 18 },
  payBtn: { marginTop: Sizes.md },
  secure: { textAlign: 'center', fontSize: Sizes.fontXs, color: Colors.textMuted, marginTop: Sizes.md },
  // Success
  successContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Sizes.xl, backgroundColor: Colors.background },
  successIcon: { marginBottom: Sizes.lg },
  successTitle: { fontSize: Sizes.fontXxl, fontWeight: '800', color: Colors.textPrimary },
  successSub: { fontSize: Sizes.fontMd, color: Colors.textSecondary, textAlign: 'center', marginTop: Sizes.sm, lineHeight: 22 },
  successBtn: { marginTop: Sizes.xl, minWidth: 200 },
});

export default FeePaymentScreen;
