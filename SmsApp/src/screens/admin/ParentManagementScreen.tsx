import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { usersApi } from '../../api/users.api';
import { QUERY_KEYS } from '../../constants';
import { Header } from '../../components/common/Header';
import { Avatar } from '../../components/common/Avatar';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';
import type { User } from '../../types';

export function ParentManagementScreen() {
  const [search, setSearch] = useState('');

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: QUERY_KEYS.PARENTS,
    queryFn: () => usersApi.getAll(0, 100),
  });

  const parents = (data?.content ?? []).filter(u => u.roles.includes('PARENT'));
  const filtered = search.trim()
    ? parents.filter(p =>
        `${p.firstName} ${p.lastName} ${p.email}`.toLowerCase().includes(search.toLowerCase()),
      )
    : parents;

  function renderParent({ item }: { item: User }) {
    return (
      <View style={styles.card}>
        <Avatar firstName={item.firstName} lastName={item.lastName} size={44} color={Colors.accent} />
        <View style={styles.info}>
          <Text style={styles.name}>{item.firstName} {item.lastName}</Text>
          <Text style={styles.email}>{item.email}</Text>
          {item.phone ? <Text style={styles.phone}>📞 {item.phone}</Text> : null}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Parent Management" subtitle={`${parents.length} parents`} />

      <View style={styles.searchBox}>
        <TextInput
          style={styles.search}
          placeholder="Search parents..."
          placeholderTextColor={Colors.textTertiary}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {isLoading ? (
        <LoadingSpinner fullScreen />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => String(item.id)}
          renderItem={renderParent}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          ListEmptyComponent={<EmptyState title="No parents found" />}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  searchBox: { backgroundColor: Colors.surface, padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  search: { backgroundColor: Colors.surfaceVariant, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, ...Typography.body2, color: Colors.textPrimary },
  list: { padding: Spacing.md },
  card: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.md, flexDirection: 'row', alignItems: 'center', ...Shadows.sm },
  info: { flex: 1, marginLeft: Spacing.md },
  name: { ...Typography.h5, color: Colors.textPrimary },
  email: { ...Typography.caption, color: Colors.textSecondary },
  phone: { ...Typography.caption, color: Colors.textTertiary, marginTop: 2 },
});
