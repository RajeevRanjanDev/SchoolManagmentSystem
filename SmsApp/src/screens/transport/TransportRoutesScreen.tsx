import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Alert,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';

import { transportMgrService } from '@api/services/employeeService';
import Header from '@components/common/Header';
import Card from '@components/common/Card';
import AppButton from '@components/common/AppButton';
import LoadingSpinner from '@components/common/LoadingSpinner';
import EmptyState from '@components/common/EmptyState';
import { Colors } from '@constants/colors';
import { Sizes } from '@constants/sizes';
import { formatCurrency } from '@utils/formatters';

const TransportRoutesScreen = () => {
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const [show, setShow] = useState(false);
  const [name, setName] = useState('');
  const [number, setNumber] = useState('');
  const [fee, setFee] = useState('');
  const [stops, setStops] = useState('');

  const { data: routes, isLoading } = useQuery({ queryKey: ['transport-routes'], queryFn: () => transportMgrService.listRoutes() });

  const createMut = useMutation({
    mutationFn: () => transportMgrService.createRoute({
      routeName: name.trim(), routeNumber: number.trim(),
      monthlyFee: fee ? Number(fee) : undefined,
      stops: stops.split(',').map(s => s.trim()).filter(Boolean).map(stopName => ({ stopName })),
    }),
    onSuccess: () => { Toast.show({ type: 'success', text1: 'Route created' }); setName(''); setNumber(''); setFee(''); setStops(''); setShow(false); qc.invalidateQueries({ queryKey: ['transport-routes'] }); },
    onError: (e: any) => Toast.show({ type: 'error', text1: 'Failed', text2: e?.response?.data?.message ?? 'Try again' }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => transportMgrService.deleteRoute(id),
    onSuccess: () => { Toast.show({ type: 'success', text1: 'Route deleted' }); qc.invalidateQueries({ queryKey: ['transport-routes'] }); },
    onError: (e: any) => Toast.show({ type: 'error', text1: 'Failed', text2: e?.response?.data?.message ?? 'Try again' }),
  });

  const canCreate = name.trim().length > 0 && number.trim().length > 0;

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Header title="Routes" rightIcon={show ? 'close' : 'plus'} onRightPress={() => setShow(s => !s)} />
      {show && (
        <Card style={styles.formCard}>
          <View style={styles.inlineRow}>
            <TextInput value={name} onChangeText={setName} placeholder="Route name" placeholderTextColor={Colors.textMuted} style={[styles.input, { flex: 2 }]} />
            <TextInput value={number} onChangeText={setNumber} placeholder="No." placeholderTextColor={Colors.textMuted} style={[styles.input, { flex: 1 }]} />
          </View>
          <TextInput value={fee} onChangeText={v => setFee(v.replace(/[^0-9.]/g, ''))} placeholder="Monthly fee" placeholderTextColor={Colors.textMuted} keyboardType="numeric" style={[styles.input, { marginTop: Sizes.sm }]} />
          <TextInput value={stops} onChangeText={setStops} placeholder="Stops (comma separated)" placeholderTextColor={Colors.textMuted} style={[styles.input, { marginTop: Sizes.sm }]} />
          <AppButton title={createMut.isPending ? 'Creating…' : 'Create Route'} onPress={() => createMut.mutate()} loading={createMut.isPending} disabled={!canCreate} size="sm" style={{ marginTop: Sizes.sm }} />
        </Card>
      )}

      {isLoading ? (
        <LoadingSpinner message="Loading…" />
      ) : (
        <FlatList
          data={routes ?? []}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 110 }]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<EmptyState icon="road-variant" title="No routes" subtitle="Tap + to add a route." />}
          renderItem={({ item }) => (
            <Card style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.routeName}>{item.routeName}</Text>
                <TouchableOpacity onPress={() => Alert.alert('Delete route', `Delete ${item.routeName}?`, [
                  { text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: () => deleteMut.mutate(item.id) },
                ])}>
                  <Icon name="trash-can-outline" size={20} color={Colors.danger} />
                </TouchableOpacity>
              </View>
              <Text style={styles.routeMeta}>
                #{item.routeNumber}{item.monthlyFee != null ? `  ·  ${formatCurrency(item.monthlyFee)}/mo` : ''}
                {item.stops?.length ? `  ·  ${item.stops.length} stops` : ''}
              </Text>
              {item.stops?.length ? (
                <Text style={styles.stops} numberOfLines={2}>{item.stops.map(s => s.stopName).join(' → ')}</Text>
              ) : null}
            </Card>
          )}
        />
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  formCard: { padding: Sizes.md, margin: Sizes.md },
  inlineRow: { flexDirection: 'row', gap: Sizes.sm },
  input: { backgroundColor: Colors.background, borderRadius: Sizes.radiusMd, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: Sizes.md, paddingVertical: Platform.OS === 'ios' ? 12 : 9, fontSize: Sizes.fontMd, color: Colors.textPrimary },
  list: { paddingHorizontal: Sizes.md, gap: Sizes.sm },
  card: { padding: Sizes.md },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  routeName: { fontSize: Sizes.fontMd, fontWeight: '700', color: Colors.textPrimary },
  routeMeta: { fontSize: Sizes.fontXs, color: Colors.textMuted, marginTop: 2 },
  stops: { fontSize: Sizes.fontXs, color: Colors.textSecondary, marginTop: 6 },
});

export default TransportRoutesScreen;
