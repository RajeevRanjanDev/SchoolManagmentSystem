import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';

import { financeService } from '@api/services/employeeService';
import Header from '@components/common/Header';
import Card from '@components/common/Card';
import Badge from '@components/common/Badge';
import AppButton from '@components/common/AppButton';
import { Colors } from '@constants/colors';
import { Sizes } from '@constants/sizes';

const MODES = ['TEST', 'LIVE'];

const FinanceGatewayScreen = () => {
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const [mode, setMode] = useState('TEST');
  const [keyId, setKeyId] = useState('');
  const [keySecret, setKeySecret] = useState('');
  const [webhookSecret, setWebhookSecret] = useState('');

  const { data: accounts } = useQuery({ queryKey: ['gateway-accounts'], queryFn: () => financeService.gatewayAccounts() });

  const saveMut = useMutation({
    mutationFn: () => financeService.saveGatewayAccount({ mode, keyId: keyId.trim(), keySecret: keySecret.trim() || undefined, webhookSecret: webhookSecret.trim() || undefined, active: true }),
    onSuccess: () => { Toast.show({ type: 'success', text1: 'Gateway saved' }); setKeySecret(''); setWebhookSecret(''); qc.invalidateQueries({ queryKey: ['gateway-accounts'] }); },
    onError: (e: any) => Toast.show({ type: 'error', text1: 'Failed', text2: e?.response?.data?.message ?? 'Try again' }),
  });

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Header title="Payment Gateway" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scroll, { paddingTop: insets.top + Sizes.sm, paddingBottom: insets.bottom + 110 }]}>
        {(accounts ?? []).map(a => (
          <Card key={a.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.mode}>{a.mode}</Text>
              <Badge label={a.active ? 'Active' : 'Inactive'} color={a.active ? Colors.success : Colors.textMuted} />
            </View>
            <Text style={styles.keyId}>{a.keyId}</Text>
            <View style={styles.flags}>
              <Flag ok={a.hasSecret} label="Secret" />
              <Flag ok={a.hasWebhookSecret} label="Webhook" />
            </View>
          </Card>
        ))}

        <Card style={styles.formCard}>
          <Text style={styles.section}>Save Razorpay keys</Text>
          <Text style={styles.label}>Mode</Text>
          <View style={styles.row}>
            {MODES.map(m => {
              const on = mode === m;
              return (<TouchableOpacity key={m} onPress={() => setMode(m)} style={[styles.chip, on && styles.chipActive]}><Text style={[styles.chipText, on && styles.chipTextActive]}>{m}</Text></TouchableOpacity>);
            })}
          </View>
          <TextInput value={keyId} onChangeText={setKeyId} placeholder="Key ID (rzp_…)" placeholderTextColor={Colors.textMuted} autoCapitalize="none" style={[styles.input, { marginTop: Sizes.sm }]} />
          <TextInput value={keySecret} onChangeText={setKeySecret} placeholder="Key secret" placeholderTextColor={Colors.textMuted} autoCapitalize="none" secureTextEntry style={[styles.input, { marginTop: Sizes.sm }]} />
          <TextInput value={webhookSecret} onChangeText={setWebhookSecret} placeholder="Webhook secret (optional)" placeholderTextColor={Colors.textMuted} autoCapitalize="none" secureTextEntry style={[styles.input, { marginTop: Sizes.sm }]} />
          <AppButton title={saveMut.isPending ? 'Saving…' : 'Save Gateway'} onPress={() => saveMut.mutate()} loading={saveMut.isPending} disabled={!keyId.trim()} style={{ marginTop: Sizes.md }} />
          <Text style={styles.hint}>Secrets are stored encrypted on the server and never shown again.</Text>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const Flag = ({ ok, label }: { ok: boolean; label: string }) => (
  <View style={styles.flag}>
    <Icon name={ok ? 'check-circle' : 'close-circle-outline'} size={14} color={ok ? Colors.success : Colors.textMuted} />
    <Text style={styles.flagText}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Sizes.md, gap: Sizes.sm },
  card: { padding: Sizes.md },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  mode: { fontSize: Sizes.fontMd, fontWeight: '800', color: Colors.textPrimary },
  keyId: { fontSize: Sizes.fontSm, color: Colors.textSecondary, marginTop: 4 },
  flags: { flexDirection: 'row', gap: Sizes.md, marginTop: 6 },
  flag: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  flagText: { fontSize: Sizes.fontXs, color: Colors.textMuted },
  formCard: { padding: Sizes.md, marginTop: Sizes.sm },
  section: { fontSize: Sizes.fontLg, fontWeight: '800', color: Colors.textPrimary, marginBottom: Sizes.sm },
  label: { fontSize: Sizes.fontSm, fontWeight: '700', color: Colors.textSecondary, marginBottom: 6 },
  row: { flexDirection: 'row', gap: Sizes.sm },
  chip: { paddingHorizontal: Sizes.md, paddingVertical: 8, borderRadius: Sizes.radiusFull, backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: Sizes.fontSm, fontWeight: '600', color: Colors.textSecondary },
  chipTextActive: { color: Colors.white },
  input: { backgroundColor: Colors.background, borderRadius: Sizes.radiusMd, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: Sizes.md, paddingVertical: Platform.OS === 'ios' ? 12 : 9, fontSize: Sizes.fontMd, color: Colors.textPrimary },
  hint: { fontSize: Sizes.fontXs, color: Colors.textMuted, marginTop: Sizes.sm },
});

export default FinanceGatewayScreen;
