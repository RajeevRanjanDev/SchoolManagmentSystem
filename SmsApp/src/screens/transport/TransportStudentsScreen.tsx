import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';

import { transportMgrService, TransportStudent, TransportRoute } from '@api/services/employeeService';
import Header from '@components/common/Header';
import Card from '@components/common/Card';
import AppButton from '@components/common/AppButton';
import LoadingSpinner from '@components/common/LoadingSpinner';
import EmptyState from '@components/common/EmptyState';
import { Colors } from '@constants/colors';
import { Sizes } from '@constants/sizes';
import { getInitials } from '@utils/formatters';

const TransportStudentsScreen = () => {
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<TransportStudent | null>(null);
  const [routeId, setRouteId] = useState<number | undefined>();
  const [stop, setStop] = useState('');

  const { data: students, isLoading } = useQuery({
    queryKey: ['transport-students', search],
    queryFn: () => transportMgrService.listStudents({ search: search || undefined }),
  });
  const { data: routes } = useQuery({ queryKey: ['transport-routes'], queryFn: () => transportMgrService.listRoutes() });

  const assignMut = useMutation({
    mutationFn: () => {
      const route = (routes ?? []).find(r => r.id === routeId);
      return transportMgrService.assignStudent(selected!.profileId, {
        transportRequired: true, routeId: routeId ?? null, routeName: route?.routeName, stopName: stop.trim() || undefined,
      });
    },
    onSuccess: () => {
      Toast.show({ type: 'success', text1: 'Route assigned' });
      setSelected(null); setRouteId(undefined); setStop('');
      qc.invalidateQueries({ queryKey: ['transport-students', search] });
    },
    onError: (e: any) => Toast.show({ type: 'error', text1: 'Failed', text2: e?.response?.data?.message ?? 'Try again' }),
  });

  const openAssign = (s: TransportStudent) => { setSelected(s); setRouteId(s.routeId); setStop(s.stopName ?? ''); };

  return (
    <View style={styles.root}>
      <Header title="Students & Routes" />
      <View style={styles.searchRow}>
        <Icon name="magnify" size={20} color={Colors.textMuted} />
        <TextInput value={query} onChangeText={setQuery} onSubmitEditing={() => setSearch(query.trim())}
          placeholder="Search student" placeholderTextColor={Colors.textMuted} returnKeyType="search" style={styles.searchInput} />
      </View>

      {isLoading ? (
        <LoadingSpinner message="Loading…" />
      ) : (
        <FlatList
          data={students ?? []}
          keyExtractor={item => String(item.profileId)}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 120 }]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<EmptyState icon="bus-school" title="No students" />}
          renderItem={({ item }) => (
            <Card style={styles.card}>
              <View style={styles.row}>
                <View style={styles.avatar}><Text style={styles.avatarText}>{getInitials(item.fullName)}</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{item.fullName}</Text>
                  <Text style={styles.sub}>
                    {[item.className, item.sectionName].filter(Boolean).join(' · ')}
                    {item.routeName ? `  ·  ${item.routeName}` : '  ·  No route'}
                  </Text>
                </View>
                <TouchableOpacity style={styles.assignBtn} onPress={() => openAssign(item)}>
                  <Text style={styles.assignText}>{item.routeId ? 'Change' : 'Assign'}</Text>
                </TouchableOpacity>
              </View>
            </Card>
          )}
        />
      )}

      {selected && (
        <View style={[styles.panel, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.panelHeader}>
            <Text style={styles.panelTitle}>Assign route — {selected.fullName}</Text>
            <TouchableOpacity onPress={() => setSelected(null)}><Text style={styles.cancel}>Cancel</Text></TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
            {(routes ?? []).map((r: TransportRoute) => {
              const active = r.id === routeId;
              return (
                <TouchableOpacity key={r.id} onPress={() => setRouteId(r.id)} style={[styles.chip, active && styles.chipActive]}>
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{r.routeName}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <TextInput value={stop} onChangeText={setStop} placeholder="Stop / pickup point" placeholderTextColor={Colors.textMuted} style={styles.input} />
          <AppButton title={assignMut.isPending ? 'Assigning…' : 'Assign'} onPress={() => assignMut.mutate()} loading={assignMut.isPending} disabled={routeId == null} style={{ marginTop: Sizes.sm }} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: Sizes.sm, marginHorizontal: Sizes.md, marginBottom: Sizes.sm, paddingHorizontal: Sizes.md, height: 46, borderRadius: Sizes.radiusFull, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border },
  searchInput: { flex: 1, fontSize: Sizes.fontMd, color: Colors.textPrimary },
  list: { paddingHorizontal: Sizes.md, gap: Sizes.sm },
  card: { padding: Sizes.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: Sizes.md },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.softBlueBg, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 15, fontWeight: '700', color: Colors.primary },
  name: { fontSize: Sizes.fontMd, fontWeight: '700', color: Colors.textPrimary },
  sub: { fontSize: Sizes.fontXs, color: Colors.textMuted, marginTop: 2 },
  assignBtn: { backgroundColor: Colors.primary, borderRadius: Sizes.radiusFull, paddingHorizontal: Sizes.md, paddingVertical: 8 },
  assignText: { fontSize: Sizes.fontXs, fontWeight: '700', color: Colors.white },
  panel: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: Colors.white, borderTopLeftRadius: Sizes.radiusLg, borderTopRightRadius: Sizes.radiusLg, padding: Sizes.md, ...Sizes.shadowLg },
  panelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Sizes.sm },
  panelTitle: { flex: 1, fontSize: Sizes.fontMd, fontWeight: '800', color: Colors.textPrimary },
  cancel: { fontSize: Sizes.fontSm, color: Colors.danger, fontWeight: '600' },
  chipsRow: { gap: Sizes.sm, paddingVertical: 2 },
  chip: { paddingHorizontal: Sizes.md, paddingVertical: 8, borderRadius: Sizes.radiusFull, backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: Sizes.fontSm, fontWeight: '600', color: Colors.textSecondary },
  chipTextActive: { color: Colors.white },
  input: { backgroundColor: Colors.background, borderRadius: Sizes.radiusMd, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: Sizes.md, paddingVertical: 10, fontSize: Sizes.fontMd, color: Colors.textPrimary, marginTop: Sizes.sm },
});

export default TransportStudentsScreen;
