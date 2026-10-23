import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { adminService } from '@api/services/adminService';
import Header from '@components/common/Header';
import Card from '@components/common/Card';
import Badge from '@components/common/Badge';
import LoadingSpinner from '@components/common/LoadingSpinner';
import EmptyState from '@components/common/EmptyState';
import { Colors } from '@constants/colors';
import { Sizes } from '@constants/sizes';
import { getInitials } from '@utils/formatters';

const statusColor = (s?: string) => {
  switch ((s ?? '').toUpperCase()) {
    case 'ENROLLED': case 'ACTIVE': return Colors.success;
    case 'ADMITTED': return Colors.info;
    case 'APPLICANT': return Colors.warning;
    default: return Colors.textMuted;
  }
};

const AdminStudentsScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-students', search],
    queryFn: () => adminService.listStudents({ search: search || undefined, size: 50 }),
  });

  const students = data?.content ?? [];

  return (
    <View style={styles.root}>
      <Header title="Students" rightIcon="account-plus-outline" onRightPress={() => navigation.navigate('AdmissionWizard')} />
      <View style={styles.searchRow}>
        <Icon name="magnify" size={20} color={Colors.textMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={() => setSearch(query.trim())}
          placeholder="Search name / admission no."
          placeholderTextColor={Colors.textMuted}
          returnKeyType="search"
          style={styles.searchInput}
        />
        {query ? (
          <TouchableOpacity onPress={() => { setQuery(''); setSearch(''); }}>
            <Icon name="close-circle" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        ) : null}
      </View>

      {isLoading ? (
        <LoadingSpinner message="Loading students…" />
      ) : (
        <FlatList
          data={students}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 110 }]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<EmptyState icon="account-off" title="No students" subtitle="Try a different search." />}
          renderItem={({ item }) => (
            <TouchableOpacity activeOpacity={0.85} onPress={() => navigation.navigate('StudentDetail', { studentId: item.id })}>
              <Card style={styles.card}>
                <View style={styles.row}>
                  <View style={styles.avatar}><Text style={styles.avatarText}>{getInitials(`${item.firstName ?? ''} ${item.lastName ?? ''}`)}</Text></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{item.firstName} {item.lastName}</Text>
                    <Text style={styles.sub}>
                      {[item.admissionNumber, [item.className, item.sectionName].filter(Boolean).join(' · ')].filter(Boolean).join('  ·  ')}
                    </Text>
                  </View>
                  {item.status ? <Badge label={item.status} color={statusColor(item.status)} /> : null}
                </View>
              </Card>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: Sizes.sm,
    marginHorizontal: Sizes.md, marginBottom: Sizes.sm, paddingHorizontal: Sizes.md,
    height: 46, borderRadius: Sizes.radiusFull, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border,
  },
  searchInput: { flex: 1, fontSize: Sizes.fontMd, color: Colors.textPrimary },
  list: { paddingHorizontal: Sizes.md, gap: Sizes.sm },
  card: { padding: Sizes.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: Sizes.md },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.softBlueBg, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 15, fontWeight: '700', color: Colors.primary },
  name: { fontSize: Sizes.fontMd, fontWeight: '700', color: Colors.textPrimary },
  sub: { fontSize: Sizes.fontXs, color: Colors.textMuted, marginTop: 2 },
});

export default AdminStudentsScreen;
