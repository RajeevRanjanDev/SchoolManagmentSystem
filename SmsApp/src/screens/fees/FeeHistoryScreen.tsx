import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { feeService } from '@api/services/feeService';
import { useAppSelector } from '@store/hooks';
import Header from '@components/common/Header';
import Card from '@components/common/Card';
import Badge from '@components/common/Badge';
import AppButton from '@components/common/AppButton';
import LoadingSpinner from '@components/common/LoadingSpinner';
import ErrorView from '@components/common/ErrorView';
import EmptyState from '@components/common/EmptyState';
import { Colors } from '@constants/colors';
import { Sizes } from '@constants/sizes';
import { formatCurrency, feeStatusColor } from '@utils/formatters';
import { formatDate } from '@utils/dateUtils';
import { currentAcademicYear } from '@utils/dateUtils';
import { FeeRecord } from '@app-types/index';

const FeeHistoryScreen = () => {
  const navigation = useNavigation<any>();
  const student    = useAppSelector(s => s.student.selectedStudent);
  const year       = currentAcademicYear();
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['fees', student?.studentId, year],
    queryFn: () => student ? feeService.getFeesByYear(student.studentId, year) : Promise.resolve([]),
    enabled: !!student,
  });

  const pending  = data?.filter(f => f.status === 'PENDING' || f.status === 'OVERDUE') ?? [];
  const totalDue = pending.reduce((sum, f) => sum + f.netAmount, 0);

  const toggleSelect = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id],
    );
  };

  return (
    <View style={styles.root}>
      <Header title="Fee Management" subtitle={student?.firstName} />

      {isLoading ? (
        <LoadingSpinner message="Loading fees..." />
      ) : isError ? (
        <ErrorView onRetry={refetch} />
      ) : (
        <>
          <FlatList
            data={data}
            keyExtractor={item => String(item.id)}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              data?.length ? (
                <View style={styles.summaryRow}>
                  <SummaryBox label="Total Due" value={formatCurrency(totalDue)} color={Colors.danger} icon="cash-remove" />
                  <SummaryBox
                    label="Paid"
                    value={formatCurrency(data.filter(f => f.status === 'PAID').reduce((s, f) => s + f.netAmount, 0))}
                    color={Colors.success}
                    icon="cash-check"
                  />
                </View>
              ) : null
            }
            ListEmptyComponent={
              <EmptyState icon="cash-off" title="No Fee Records" subtitle="No fee records for this academic year." />
            }
            renderItem={({ item }) => (
              <FeeCard
                fee={item}
                selected={selectedIds.includes(item.id)}
                onSelect={() => item.status !== 'PAID' && toggleSelect(item.id)}
              />
            )}
          />

          {/* Pay button */}
          {selectedIds.length > 0 && (
            <View style={styles.payBar}>
              <View>
                <Text style={styles.payCount}>{selectedIds.length} item(s) selected</Text>
                <Text style={styles.payAmount}>
                  {formatCurrency(
                    data?.filter(f => selectedIds.includes(f.id)).reduce((s, f) => s + f.netAmount, 0) ?? 0,
                  )}
                </Text>
              </View>
              <AppButton
                title="Pay Now"
                onPress={() => navigation.navigate('FeePayment', { feeIds: selectedIds })}
                size="sm"
                style={{ minWidth: 100 }}
              />
            </View>
          )}
        </>
      )}
    </View>
  );
};

const SummaryBox = ({
  label, value, color, icon,
}: {
  label: string; value: string; color: string; icon: string;
}) => (
  <Card style={[styles.summaryBox, { borderTopColor: color, borderTopWidth: 3 }]}>
    <Icon name={icon} size={22} color={color} />
    <Text style={[styles.summaryVal, { color }]}>{value}</Text>
    <Text style={styles.summaryLbl}>{label}</Text>
  </Card>
);

const FeeCard = ({
  fee, selected, onSelect,
}: {
  fee: FeeRecord; selected: boolean; onSelect: () => void;
}) => {
  const statusColor = feeStatusColor(fee.status);
  return (
    <TouchableOpacity onPress={onSelect} activeOpacity={fee.status === 'PAID' ? 1 : 0.8}>
      <Card style={[styles.feeCard, selected && styles.feeCardSelected]}>
        <View style={styles.feeRow}>
          {fee.status !== 'PAID' && (
            <Icon
              name={selected ? 'checkbox-marked' : 'checkbox-blank-outline'}
              size={22}
              color={selected ? Colors.primary : Colors.border}
            />
          )}
          <View style={{ flex: 1 }}>
            <View style={styles.feeHeader}>
              <Text style={styles.feeCategory}>{fee.feeCategory}</Text>
              <Badge label={fee.status} color={statusColor} />
            </View>
            <Text style={styles.feePeriod}>{fee.feePeriod} Â· {fee.academicYear}</Text>
            <View style={styles.feeMeta}>
              <Text style={styles.feeAmount}>{formatCurrency(fee.netAmount)}</Text>
              {fee.discount > 0 && (
                <Text style={styles.feeDiscount}>Discount: {formatCurrency(fee.discount)}</Text>
              )}
              {fee.fine > 0 && (
                <Text style={styles.feeFine}>Fine: +{formatCurrency(fee.fine)}</Text>
              )}
            </View>
            <View style={styles.feeDates}>
              <Icon name="calendar-outline" size={12} color={Colors.textMuted} />
              <Text style={[styles.feeDue, fee.status === 'OVERDUE' && styles.overdue]}>
                Due: {formatDate(fee.dueDate)}
              </Text>
              {fee.paidDate && (
                <Text style={styles.feePaid}>  Paid: {formatDate(fee.paidDate)}</Text>
              )}
            </View>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  list: { padding: Sizes.md, paddingBottom: 170 },
  summaryRow: { flexDirection: 'row', gap: Sizes.sm, marginBottom: Sizes.md },
  summaryBox: { flex: 1, alignItems: 'center', padding: Sizes.md },
  summaryVal: { fontSize: Sizes.fontLg, fontWeight: '800', marginTop: 4 },
  summaryLbl: { fontSize: Sizes.fontXs, color: Colors.textMuted, marginTop: 2 },
  feeCard: { marginBottom: Sizes.sm },
  feeCardSelected: { borderWidth: 2, borderColor: Colors.primary },
  feeRow: { flexDirection: 'row', gap: Sizes.sm, alignItems: 'flex-start' },
  feeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  feeCategory: { fontSize: Sizes.fontMd, fontWeight: '700', color: Colors.textPrimary },
  feePeriod: { fontSize: Sizes.fontXs, color: Colors.textMuted, marginTop: 2 },
  feeMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  feeAmount: { fontSize: Sizes.fontLg, fontWeight: '800', color: Colors.textPrimary },
  feeDiscount: { fontSize: Sizes.fontXs, color: Colors.success },
  feeFine: { fontSize: Sizes.fontXs, color: Colors.danger },
  feeDates: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 },
  feeDue: { fontSize: Sizes.fontXs, color: Colors.textMuted },
  overdue: { color: Colors.danger, fontWeight: '600' },
  feePaid: { fontSize: Sizes.fontXs, color: Colors.success },
  payBar: {
    position: 'absolute', bottom: 96, left: Sizes.md, right: Sizes.md,
    backgroundColor: Colors.white, padding: Sizes.md,
    borderRadius: Sizes.radiusLg,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderWidth: 1, borderColor: Colors.border,
    ...Sizes.shadowMd,
  },
  payCount: { fontSize: Sizes.fontSm, color: Colors.textSecondary },
  payAmount: { fontSize: Sizes.fontXl, fontWeight: '800', color: Colors.textPrimary },
});

export default FeeHistoryScreen;
