import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  RefreshControl,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { studentsApi } from '../../api/students.api';
import { QUERY_KEYS } from '../../constants';
import { Header } from '../../components/common/Header';
import { Avatar } from '../../components/common/Avatar';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';
import type { Student } from '../../types';

export function StudentManagementScreen() {
  const navigation = useNavigation<any>();
  const [search, setSearch] = useState('');

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: QUERY_KEYS.STUDENTS,
    queryFn: () => studentsApi.getAll(0, 100),
  });

  const students = data?.content ?? [];
  const filtered = search.trim()
    ? students.filter(s =>
        `${s.firstName} ${s.lastName} ${s.admissionNumber}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      )
    : students;

  function renderStudent({ item }: { item: Student }) {
    return (
      <TouchableOpacity
        style={styles.studentCard}
        onPress={() => navigation.navigate('StudentDetail', { studentId: item.id })}
        activeOpacity={0.75}
      >
        <Avatar firstName={item.firstName} lastName={item.lastName} photoUrl={item.profilePhotoUrl} size={46} />
        <View style={styles.studentInfo}>
          <Text style={styles.studentName}>{item.firstName} {item.lastName}</Text>
          <Text style={styles.admissionNo}>Adm# {item.admissionNumber}</Text>
          {item.currentClass ? (
            <Text style={styles.classInfo}>{item.currentClass} — {item.currentSection}</Text>
          ) : null}
        </View>
        <View style={styles.statusBadge}>
          <View style={[styles.dot, { backgroundColor: item.active ? Colors.success : Colors.error }]} />
          <Text style={styles.statusText}>{item.active ? 'Active' : 'Inactive'}</Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <Header
        title="Student Management"
        subtitle={`${students.length} students`}
        rightAction={
          <TouchableOpacity
            onPress={() => navigation.navigate('AddStudent')}
            style={styles.addBtn}
          >
            <Text style={styles.addBtnText}>+ Add</Text>
          </TouchableOpacity>
        }
      />

      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or admission number..."
          placeholderTextColor={Colors.textTertiary}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {isLoading ? (
        <LoadingSpinner fullScreen message="Loading students..." />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => String(item.id)}
          renderItem={renderStudent}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          ListEmptyComponent={
            <EmptyState
              title="No students found"
              message={search ? 'Try a different search term' : 'Add your first student to get started'}
              actionLabel={!search ? 'Add Student' : undefined}
              onAction={() => navigation.navigate('AddStudent')}
            />
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  searchContainer: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  searchInput: {
    backgroundColor: Colors.surfaceVariant,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    ...Typography.body2,
    color: Colors.textPrimary,
  },
  list: { padding: Spacing.md },
  studentCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    ...Shadows.sm,
  },
  studentInfo: { flex: 1, marginLeft: Spacing.md },
  studentName: { ...Typography.h5, color: Colors.textPrimary },
  admissionNo: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  classInfo: { ...Typography.caption, color: Colors.primary, marginTop: 2, fontWeight: '600' },
  statusBadge: { alignItems: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4, marginBottom: 3 },
  statusText: { ...Typography.overline, color: Colors.textTertiary },
  separator: { height: Spacing.sm },
  addBtn: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.round,
  },
  addBtnText: { ...Typography.caption, color: Colors.white, fontWeight: '700' },
});
