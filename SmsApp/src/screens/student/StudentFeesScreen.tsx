import React, { useMemo } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';

import { studentPortalService, StudentFee } from '@api/services/studentPortalService';
import Header from '@components/common/Header';
import Card from '@components/common/Card';
import Badge from '@components/common/Badge';
import LoadingSpinner from '@components/common/LoadingSpinner';
import EmptyState from '@components/common/EmptyState';
import { Colors } from '@constants/colors';
import { Sizes } from '@constants/sizes';
import { formatCurrency, feeStatusColor } from '@utils/formatters';
import { formatDate } from '@utils/dateUtils';

const feeBalance = (f: StudentFee) => {
  const net = f.netAmount ?? f.amount - (f.discount ?? 0) + (f.fine ?? 0);
  return f.balance ?? net - (f.paidAmount ?? 0);
};

const StudentFeesScreen = () => {
  const insets = useSafeAreaInsets();
  const { data, isLoading } = useQuery({
    queryKey: ['student-fees'],
    queryFn: () => studentPortalService.getFees(),
  });

  const outstanding = useMemo(
    () => (data ?? []).reduce((s, f) => (f.status === 'PAID' ? s : s + Math.max(0, feeBalance(f))), 0),
    [data],
  );
  const paid = useMemo(
    () => (data ?? []).reduce((s, f) => s + (f.paidAmount ?? (f.status === 'PAID' ? (f.netAmount ?? f.amount) : 0)), 0),
    [data],
  );

  if (isLoading) return (
    <View style={styles.root}><Header title="Fees" /><LoadingSpinner message="Loading…" /></View>
  );

  return (
    <View style={styles.root}>
      <Header title="Fees" />
      <FlatList
        data={data}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          (data ?? []).length ? (
            <View style={styles.summaryRow}>
              <Card style={[styles.box, { borderTopColor: Colors.danger, borderTopWidth: 3 }]}>
                <Text style={[styles.boxVal, { color: Colors.danger }]}>{formatCurrency(outstanding)}</Text>
                <Text style={styles.boxLbl}>Outstanding</Text>
              </Card>
              <Card style={[styles.box, { borderTopColor: Colors.success, borderTopWidth: 3 }]}>
                <Text style={[styles.boxVal, { color: Colors.success }]}>{formatCurrency(paid)}</Text>
                <Text style={styles.boxLbl}>Paid</Text>
              </Card>
            </View>
          ) : null
        }
        ListEmptyComponent={<EmptyState icon="cash-off" title="No fee records" />}
        renderItem={({ item }) => (
          <Card style={styles.feeCard}>
            <View style={styles.feeHeader}>
              <Text style={styles.feeCategory}>{item.feeCategory ?? 'Fee'}</Text>
              <Badge label={item.status} color={feeStatusColor(item.status)} />
            </View>
            <Text style={styles.feePeriod}>
              {[item.feePeriod, item.academicYear].filter(Boolean).join(' · ')}
            </Text>
            <View style={styles.feeMeta}>
              <Text style={styles.feeAmount}>{formatCurrency(item.netAmount ?? item.amount)}</Text>
              {item.status !== 'PAID' && (
                <Text style={styles.feeBalance}>Balance {formatCurrency(Math.max(0, feeBalance(item)))}</Text>
              )}
            </View>
            {item.dueDate ? <Text style={styles.feeDue}>Due: {formatDate(item.dueDate)}</Text> : null}
          </Card>
        )}
      />
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
  feeCard: { padding: Sizes.md },
  feeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  feeCategory: { fontSize: Sizes.fontMd, fontWeight: '700', color: Colors.textPrimary },
  feePeriod: { fontSize: Sizes.fontXs, color: Colors.textMuted, marginTop: 2 },
  feeMeta: { flexDirection: 'row', alignItems: 'center', gap: Sizes.md, marginTop: 6 },
  feeAmount: { fontSize: Sizes.fontLg, fontWeight: '800', color: Colors.textPrimary },
  feeBalance: { fontSize: Sizes.fontXs, color: Colors.danger, fontWeight: '600' },
  feeDue: { fontSize: Sizes.fontXs, color: Colors.textMuted, marginTop: 4 },
});

export default StudentFeesScreen;
