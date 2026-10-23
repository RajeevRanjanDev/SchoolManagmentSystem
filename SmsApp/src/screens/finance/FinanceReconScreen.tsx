import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';

import { financeService, ReconException } from '@api/services/employeeService';
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

const FinanceReconScreen = () => {
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();

  const { data: summary, isLoading } = useQuery({ queryKey: ['recon-summary'], queryFn: () => financeService.summary() });
  const { data: exceptions } = useQuery({ queryKey: ['recon-exceptions', 'OPEN'], queryFn: () => financeService.exceptions('OPEN') });

  const runMut = useMutation({
    mutationFn: () => financeService.runReconciliation(),
    onSuccess: () => {
      Toast.show({ type: 'success', text1: 'Reconciliation run started' });
      qc.invalidateQueries({ queryKey: ['recon-summary'] });
      qc.invalidateQueries({ queryKey: ['recon-exceptions', 'OPEN'] });
    },
    onError: (e: any) => Toast.show({ type: 'error', text1: 'Failed', text2: e?.response?.data?.message ?? 'Try again' }),
  });

  const resolveMut = useMutation({
    mutationFn: (id: number) => financeService.resolveException(id, { status: 'RESOLVED' }),
    onSuccess: () => { Toast.show({ type: 'success', text1: 'Exception resolved' }); qc.invalidateQueries({ queryKey: ['recon-exceptions', 'OPEN'] }); qc.invalidateQueries({ queryKey: ['recon-summary'] }); },
    onError: (e: any) => Toast.show({ type: 'error', text1: 'Failed', text2: e?.response?.data?.message ?? 'Try again' }),
  });

  return (
    <View style={styles.root}>
      <Header title="Reconciliation" />
      {isLoading ? (
        <LoadingSpinner message="Loading…" />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 110 }]}>
          <View style={styles.tiles}>
            <Tile label="Captured" value={formatCurrency(Number(summary?.capturedTotal ?? 0))} fg={Colors.tileBlueFg} bg={Colors.tileBlueBg} />
            <Tile label="Allocated" value={formatCurrency(Number(summary?.allocatedTotal ?? 0))} fg={Colors.success} bg={Colors.tileBlueBg} />
            <Tile label="Expected settlement" value={formatCurrency(Number(summary?.expectedSettlement ?? 0))} fg={Colors.tileAmberFg} bg={Colors.tileAmberBg} />
            <Tile label="Open exceptions" value={String(summary?.openExceptions ?? 0)} fg={Colors.danger} bg={Colors.tilePinkBg} />
          </View>

          <AppButton title={runMut.isPending ? 'Running…' : 'Run Reconciliation'} onPress={() => runMut.mutate()} loading={runMut.isPending} style={{ marginVertical: Sizes.sm }} />

          <Text style={styles.heading}>Open Exceptions</Text>
          {(exceptions ?? []).length === 0 ? (
            <EmptyState icon="check-circle-outline" title="All clear" subtitle="No open exceptions." />
          ) : (
            (exceptions ?? []).map((x: ReconException) => (
              <Card key={x.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.exType}>{x.exceptionType}</Text>
                  <Badge label={x.status} color={Colors.warning} />
                </View>
                {x.description ? <Text style={styles.desc}>{x.description}</Text> : null}
                <Text style={styles.meta}>{x.createdAt ? formatDate(x.createdAt) : ''}</Text>
                <TouchableOpacity style={styles.resolveBtn} onPress={() => Alert.alert('Resolve', 'Mark this exception as resolved?', [
                  { text: 'Cancel', style: 'cancel' }, { text: 'Resolve', onPress: () => resolveMut.mutate(x.id) },
                ])}>
                  <Text style={styles.resolveText}>Mark resolved</Text>
                </TouchableOpacity>
              </Card>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
};

const Tile = ({ label, value, fg, bg }: { label: string; value: string; fg: string; bg: string }) => (
  <View style={[styles.tile, { backgroundColor: bg }]}>
    <Text style={[styles.tileValue, { color: fg }]}>{value}</Text>
    <Text style={styles.tileLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Sizes.md },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: Sizes.sm },
  tile: { width: '48%', borderRadius: Sizes.radiusLg, padding: Sizes.md, minHeight: 72, justifyContent: 'center' },
  tileValue: { fontSize: Sizes.fontLg, fontWeight: '800' },
  tileLabel: { fontSize: Sizes.fontXs, color: Colors.textSecondary, marginTop: 2 },
  heading: { fontSize: Sizes.fontLg, fontWeight: '800', color: Colors.textPrimary, marginBottom: Sizes.sm },
  card: { padding: Sizes.md, marginBottom: Sizes.sm },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  exType: { fontSize: Sizes.fontMd, fontWeight: '700', color: Colors.textPrimary },
  desc: { fontSize: Sizes.fontSm, color: Colors.textSecondary, marginTop: 4 },
  meta: { fontSize: Sizes.fontXs, color: Colors.textMuted, marginTop: 4 },
  resolveBtn: { alignSelf: 'flex-start', marginTop: Sizes.sm, backgroundColor: Colors.softBlueBg, borderRadius: Sizes.radiusFull, paddingHorizontal: Sizes.md, paddingVertical: 6 },
  resolveText: { fontSize: Sizes.fontXs, fontWeight: '700', color: Colors.primary },
});

export default FinanceReconScreen;
