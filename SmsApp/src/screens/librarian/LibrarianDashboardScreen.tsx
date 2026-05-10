import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { libraryApi } from '../../api/library.api';
import { QUERY_KEYS } from '../../constants';
import { useAuth } from '../../hooks/useAuth';
import { Avatar } from '../../components/common/Avatar';
import { Card } from '../../components/common/Card';
import { StatCard } from '../../components/common/StatCard';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Colors, Typography, Spacing } from '../../theme';

export function LibrarianDashboardScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<any>();

  const { data: booksPage, isLoading, refetch, isRefetching } = useQuery({
    queryKey: QUERY_KEYS.LIBRARY_BOOKS,
    queryFn: () => libraryApi.getBooks(0, 100),
  });

  const books = booksPage?.content ?? [];
  const availableCount = books.filter(b => b.availableCopies > 0).length;
  const issuedCount = books.filter(b => b.availableCopies < b.totalCopies).length;

  if (isLoading) return <LoadingSpinner fullScreen />;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
    >
      <View style={styles.header}>
        <Avatar firstName={user?.firstName} lastName={user?.lastName} size={46} />
        <View style={styles.headerText}>
          <Text style={styles.greeting}>Welcome,</Text>
          <Text style={styles.userName}>{user?.firstName} {user?.lastName}</Text>
          <Text style={styles.role}>Librarian</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <StatCard title="Total Books" value={books.length} color={Colors.librarianColor} icon={<Text>📚</Text>} />
        <StatCard title="Available" value={availableCount} color={Colors.success} icon={<Text>✅</Text>} />
        <StatCard title="Issued" value={issuedCount} color={Colors.warning} icon={<Text>📤</Text>} />
      </View>

      <Card style={styles.actionsCard}>
        <Text style={styles.sectionTitle}>Library Operations</Text>
        <TouchableOpacity style={styles.actionRow} onPress={() => navigation.navigate('LibraryMgmt')}>
          <Text style={styles.actionIcon}>📚</Text>
          <View style={styles.actionText}>
            <Text style={styles.actionTitle}>Manage Books</Text>
            <Text style={styles.actionSubtitle}>Add, issue and return books</Text>
          </View>
          <Text style={styles.actionArrow}>›</Text>
        </TouchableOpacity>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { backgroundColor: Colors.librarianColor, flexDirection: 'row', alignItems: 'center', padding: Spacing.md, paddingTop: Spacing.lg },
  headerText: { marginLeft: Spacing.md },
  greeting: { ...Typography.caption, color: 'rgba(255,255,255,0.7)' },
  userName: { ...Typography.h5, color: Colors.white },
  role: { ...Typography.caption, color: 'rgba(255,255,255,0.6)' },
  statsRow: { flexDirection: 'row', padding: Spacing.sm },
  actionsCard: { margin: Spacing.md },
  sectionTitle: { ...Typography.h5, color: Colors.textPrimary, marginBottom: Spacing.md },
  actionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md },
  actionIcon: { fontSize: 24, marginRight: Spacing.md },
  actionText: { flex: 1 },
  actionTitle: { ...Typography.body1, color: Colors.textPrimary, fontWeight: '600' },
  actionSubtitle: { ...Typography.caption, color: Colors.textSecondary },
  actionArrow: { fontSize: 20, color: Colors.textTertiary },
});
