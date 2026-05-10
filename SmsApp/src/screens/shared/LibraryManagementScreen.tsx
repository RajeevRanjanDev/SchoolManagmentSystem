import React, { useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  Modal, ScrollView, Alert, RefreshControl, TextInput,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { libraryApi } from '../../api/library.api';
import { QUERY_KEYS } from '../../constants';
import { Header } from '../../components/common/Header';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';
import { isRequired } from '../../utils/validators';
import type { LibraryBook } from '../../types';

type Tab = 'catalog' | 'issue' | 'return';

export function LibraryManagementScreen() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>('catalog');
  const [showAddModal, setShowAddModal] = useState(false);
  const [search, setSearch] = useState('');
  const [addForm, setAddForm] = useState({ title: '', author: '', isbn: '', copies: '1' });
  const [issueForm, setIssueForm] = useState({ bookId: '', studentId: '', dueDate: '' });
  const [returnIssueId, setReturnIssueId] = useState('');

  const { data: booksPage, isLoading, refetch, isRefetching } = useQuery({
    queryKey: QUERY_KEYS.LIBRARY_BOOKS,
    queryFn: () => libraryApi.getBooks(0, 100),
  });

  const addBookMutation = useMutation({
    mutationFn: () => libraryApi.addBook({ title: addForm.title, author: addForm.author || undefined, isbn: addForm.isbn || undefined, copies: Number(addForm.copies) || 1 }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: QUERY_KEYS.LIBRARY_BOOKS }); setShowAddModal(false); Alert.alert('Success', 'Book added!'); },
    onError: () => Alert.alert('Error', 'Failed to add book.'),
  });

  const issueMutation = useMutation({
    mutationFn: () => libraryApi.issueBook({ bookId: Number(issueForm.bookId), studentId: Number(issueForm.studentId), dueDate: issueForm.dueDate }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: QUERY_KEYS.LIBRARY_BOOKS }); setIssueForm({ bookId: '', studentId: '', dueDate: '' }); Alert.alert('Success', 'Book issued!'); },
    onError: () => Alert.alert('Error', 'Failed to issue book.'),
  });

  const returnMutation = useMutation({
    mutationFn: () => libraryApi.returnBook(Number(returnIssueId)),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: QUERY_KEYS.LIBRARY_BOOKS }); setReturnIssueId(''); Alert.alert('Success', 'Book returned!'); },
    onError: () => Alert.alert('Error', 'Failed to process return.'),
  });

  const books = booksPage?.content ?? [];
  const filtered = search.trim()
    ? books.filter(b => `${b.title} ${b.author}`.toLowerCase().includes(search.toLowerCase()))
    : books;

  function renderBook({ item }: { item: LibraryBook }) {
    const available = item.availableCopies > 0;
    return (
      <View style={styles.bookCard}>
        <View style={styles.bookIcon}>
          <Text style={styles.bookEmoji}>📖</Text>
        </View>
        <View style={styles.bookInfo}>
          <Text style={styles.bookTitle}>{item.title}</Text>
          {item.author ? <Text style={styles.bookAuthor}>by {item.author}</Text> : null}
          {item.isbn ? <Text style={styles.bookIsbn}>ISBN: {item.isbn}</Text> : null}
        </View>
        <View style={styles.bookStats}>
          <Badge
            label={available ? 'Available' : 'All Issued'}
            backgroundColor={available ? Colors.successLight : Colors.errorLight}
            color={available ? Colors.success : Colors.error}
          />
          <Text style={styles.copiesText}>{item.availableCopies}/{item.totalCopies}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header
        title="Library"
        subtitle="Book management"
        rightAction={
          <TouchableOpacity onPress={() => setShowAddModal(true)} style={styles.addBtn}>
            <Text style={styles.addBtnText}>+ Add</Text>
          </TouchableOpacity>
        }
      />

      {/* Tabs */}
      <View style={styles.tabRow}>
        {(['catalog', 'issue', 'return'] as Tab[]).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'catalog' ? '📚 Catalog' : tab === 'issue' ? '📤 Issue' : '📥 Return'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'catalog' && (
        <>
          <View style={styles.searchBox}>
            <TextInput style={styles.search} placeholder="Search books..." placeholderTextColor={Colors.textTertiary} value={search} onChangeText={setSearch} />
          </View>
          {isLoading ? <LoadingSpinner fullScreen /> : (
            <FlatList
              data={filtered}
              keyExtractor={item => String(item.id)}
              renderItem={renderBook}
              contentContainerStyle={styles.list}
              refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
              ListEmptyComponent={<EmptyState title="No books found" actionLabel="Add Book" onAction={() => setShowAddModal(true)} />}
              ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
            />
          )}
        </>
      )}

      {activeTab === 'issue' && (
        <ScrollView contentContainerStyle={styles.list} keyboardShouldPersistTaps="handled">
          <Input label="Book ID *" value={issueForm.bookId} onChangeText={v => setIssueForm(f => ({ ...f, bookId: v }))} keyboardType="numeric" placeholder="Enter book ID" />
          <Input label="Student ID *" value={issueForm.studentId} onChangeText={v => setIssueForm(f => ({ ...f, studentId: v }))} keyboardType="numeric" placeholder="Enter student ID" />
          <Input label="Due Date (YYYY-MM-DD) *" value={issueForm.dueDate} onChangeText={v => setIssueForm(f => ({ ...f, dueDate: v }))} placeholder="2024-07-01" />
          <Button label="Issue Book" onPress={() => issueMutation.mutate()} loading={issueMutation.isPending} fullWidth size="lg" style={{ marginTop: Spacing.md }} />
        </ScrollView>
      )}

      {activeTab === 'return' && (
        <ScrollView contentContainerStyle={styles.list} keyboardShouldPersistTaps="handled">
          <Input label="Issue Record ID *" value={returnIssueId} onChangeText={setReturnIssueId} keyboardType="numeric" placeholder="Enter issue record ID" />
          <Button label="Process Return" onPress={() => returnMutation.mutate()} loading={returnMutation.isPending} fullWidth size="lg" style={{ marginTop: Spacing.md }} />
        </ScrollView>
      )}

      {/* Add Book Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Add Book to Catalog</Text>
            <Input label="Title *" value={addForm.title} onChangeText={v => setAddForm(f => ({ ...f, title: v }))} placeholder="Book title" />
            <Input label="Author" value={addForm.author} onChangeText={v => setAddForm(f => ({ ...f, author: v }))} placeholder="Author name" />
            <Input label="ISBN" value={addForm.isbn} onChangeText={v => setAddForm(f => ({ ...f, isbn: v }))} placeholder="ISBN number" />
            <Input label="Number of Copies" value={addForm.copies} onChangeText={v => setAddForm(f => ({ ...f, copies: v }))} keyboardType="numeric" placeholder="1" />
            <View style={styles.modalActions}>
              <Button label="Cancel" onPress={() => setShowAddModal(false)} variant="outline" style={styles.modalBtn} />
              <Button label="Add Book" onPress={() => isRequired(addForm.title) && addBookMutation.mutate()} loading={addBookMutation.isPending} style={styles.modalBtn} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  tabRow: { flexDirection: 'row', backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  tab: { flex: 1, paddingVertical: Spacing.md, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: Colors.transparent },
  tabActive: { borderBottomColor: Colors.primary },
  tabText: { ...Typography.caption, color: Colors.textSecondary, fontWeight: '600' },
  tabTextActive: { color: Colors.primary },
  searchBox: { backgroundColor: Colors.surface, padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  search: { backgroundColor: Colors.surfaceVariant, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, ...Typography.body2, color: Colors.textPrimary },
  list: { padding: Spacing.md },
  bookCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.md, flexDirection: 'row', alignItems: 'center', ...Shadows.sm },
  bookIcon: { width: 44, height: 44, borderRadius: 10, backgroundColor: Colors.primary + '18', alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  bookEmoji: { fontSize: 22 },
  bookInfo: { flex: 1 },
  bookTitle: { ...Typography.h5, color: Colors.textPrimary },
  bookAuthor: { ...Typography.caption, color: Colors.textSecondary },
  bookIsbn: { ...Typography.caption, color: Colors.textTertiary },
  bookStats: { alignItems: 'flex-end' },
  copiesText: { ...Typography.caption, color: Colors.textTertiary, marginTop: 4 },
  addBtn: { backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.round },
  addBtnText: { ...Typography.caption, color: Colors.white, fontWeight: '700' },
  overlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  modal: { backgroundColor: Colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: Spacing.xl },
  modalTitle: { ...Typography.h4, color: Colors.textPrimary, marginBottom: Spacing.lg },
  modalActions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.lg },
  modalBtn: { flex: 1 },
});
