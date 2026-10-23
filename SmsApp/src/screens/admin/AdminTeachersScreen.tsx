import React from 'react';
import { View, Text, StyleSheet, FlatList, Alert, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';

import { adminService } from '@api/services/adminService';
import Header from '@components/common/Header';
import Card from '@components/common/Card';
import Badge from '@components/common/Badge';
import LoadingSpinner from '@components/common/LoadingSpinner';
import EmptyState from '@components/common/EmptyState';
import { Colors } from '@constants/colors';
import { Sizes } from '@constants/sizes';
import { getInitials } from '@utils/formatters';

const AdminTeachersScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({ queryKey: ['admin-teachers'], queryFn: () => adminService.listTeachers() });

  const resetMut = useMutation({
    mutationFn: (id: number) => adminService.resetTeacherPassword(id),
    onSuccess: (msg) => Toast.show({ type: 'success', text1: 'Password reset', text2: msg }),
    onError: (e: any) => Toast.show({ type: 'error', text1: 'Failed', text2: e?.response?.data?.message ?? 'Try again' }),
  });
  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => adminService.updateTeacherStatus(id, status),
    onSuccess: () => { Toast.show({ type: 'success', text1: 'Status updated' }); qc.invalidateQueries({ queryKey: ['admin-teachers'] }); },
    onError: (e: any) => Toast.show({ type: 'error', text1: 'Failed', text2: e?.response?.data?.message ?? 'Try again' }),
  });

  return (
    <View style={styles.root}>
      <Header title="Teachers" onBack={() => navigation.goBack()} rightIcon="plus" onRightPress={() => navigation.navigate('TeacherForm')} />
      {isLoading ? (
        <LoadingSpinner message="Loading teachers…" />
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 110 }]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<EmptyState icon="account-tie-outline" title="No teachers" subtitle="Tap + to add one." />}
          renderItem={({ item }) => {
            const name = item.fullName ?? `${item.firstName ?? ''} ${item.lastName ?? ''}`.trim();
            const active = (item.status ?? 'ACTIVE').toUpperCase() === 'ACTIVE';
            return (
              <Card style={styles.card}>
                <View style={styles.row}>
                  <View style={styles.avatar}><Text style={styles.avatarText}>{getInitials(name || 'T')}</Text></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{name}</Text>
                    <Text style={styles.sub}>{item.loginId ?? item.employeeCode ?? item.email}</Text>
                  </View>
                  <Badge label={item.status ?? 'ACTIVE'} color={active ? Colors.success : Colors.textMuted} />
                </View>
                <View style={styles.actions}>
                  <TouchableOpacity style={styles.actBtn} onPress={() => navigation.navigate('TeacherAssignments', { teacherId: item.id })}>
                    <Icon name="book-education-outline" size={18} color={Colors.primary} />
                    <Text style={styles.actText}>Assignments</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actBtn} onPress={() => Alert.alert('Reset password', `Email a temp password to ${name}?`, [
                    { text: 'Cancel', style: 'cancel' }, { text: 'Reset', onPress: () => resetMut.mutate(item.id) },
                  ])}>
                    <Icon name="lock-reset" size={18} color={Colors.primary} />
                    <Text style={styles.actText}>Reset pwd</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actBtn} onPress={() => statusMut.mutate({ id: item.id, status: active ? 'INACTIVE' : 'ACTIVE' })}>
                    <Icon name={active ? 'account-off-outline' : 'account-check-outline'} size={18} color={active ? Colors.danger : Colors.success} />
                    <Text style={[styles.actText, { color: active ? Colors.danger : Colors.success }]}>{active ? 'Deactivate' : 'Activate'}</Text>
                  </TouchableOpacity>
                </View>
              </Card>
            );
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  list: { padding: Sizes.md, gap: Sizes.sm },
  card: { padding: Sizes.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: Sizes.md },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.softBlueBg, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 15, fontWeight: '700', color: Colors.primary },
  name: { fontSize: Sizes.fontMd, fontWeight: '700', color: Colors.textPrimary },
  sub: { fontSize: Sizes.fontXs, color: Colors.textMuted, marginTop: 2 },
  actions: { flexDirection: 'row', gap: Sizes.lg, marginTop: Sizes.sm, paddingTop: Sizes.sm, borderTopWidth: 1, borderTopColor: Colors.divider },
  actBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actText: { fontSize: Sizes.fontSm, color: Colors.primary, fontWeight: '600' },
});

export default AdminTeachersScreen;
