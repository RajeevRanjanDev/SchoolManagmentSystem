import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { format, addDays } from 'date-fns';
import Toast from 'react-native-toast-message';

import { adminService } from '@api/services/adminService';
import Header from '@components/common/Header';
import Card from '@components/common/Card';
import Badge from '@components/common/Badge';
import AppButton from '@components/common/AppButton';
import LoadingSpinner from '@components/common/LoadingSpinner';
import EmptyState from '@components/common/EmptyState';
import { Colors } from '@constants/colors';
import { Sizes } from '@constants/sizes';

const AdminLibraryScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const qc = useQueryClient();
  const [show, setShow] = useState(false);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [isbn, setIsbn] = useState('');
  const [copies, setCopies] = useState('1');

  const [issueBook, setIssueBook] = useState<any | null>(null);
  const [studentId, setStudentId] = useState('');
  const [dueDate, setDueDate] = useState(format(addDays(new Date(), 14), 'yyyy-MM-dd'));

  const { data, isLoading } = useQuery({ queryKey: ['library-books'], queryFn: () => adminService.listBooks() });
  const books: any[] = data?.content ?? [];

  const addMut = useMutation({
    mutationFn: () => adminService.addBook({ title: title.trim(), author: author.trim() || undefined, isbn: isbn.trim() || undefined, copies: Number(copies) || 1 }),
    onSuccess: () => { Toast.show({ type: 'success', text1: 'Book added' }); setTitle(''); setAuthor(''); setIsbn(''); setCopies('1'); setShow(false); qc.invalidateQueries({ queryKey: ['library-books'] }); },
    onError: (e: any) => Toast.show({ type: 'error', text1: 'Failed', text2: e?.response?.data?.message ?? 'Try again' }),
  });
  const issueMut = useMutation({
    mutationFn: () => adminService.issueBook({ bookId: issueBook.id, studentId: Number(studentId), dueDate }),
    onSuccess: () => { Toast.show({ type: 'success', text1: 'Book issued' }); setIssueBook(null); setStudentId(''); qc.invalidateQueries({ queryKey: ['library-books'] }); },
    onError: (e: any) => Toast.show({ type: 'error', text1: 'Failed', text2: e?.response?.data?.message ?? 'Try again' }),
  });

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Header title="Library" onBack={() => navigation.goBack()} rightIcon={show ? 'close' : 'plus'} onRightPress={() => setShow(s => !s)} />
      {show && (
        <Card style={styles.formCard}>
          <TextInput value={title} onChangeText={setTitle} placeholder="Book title" placeholderTextColor={Colors.textMuted} style={styles.input} />
          <View style={styles.inlineRow}>
            <TextInput value={author} onChangeText={setAuthor} placeholder="Author" placeholderTextColor={Colors.textMuted} style={[styles.input, { flex: 2 }]} />
            <TextInput value={copies} onChangeText={v => setCopies(v.replace(/[^0-9]/g, ''))} placeholder="Copies" placeholderTextColor={Colors.textMuted} keyboardType="number-pad" style={[styles.input, { flex: 1 }]} />
          </View>
          <TextInput value={isbn} onChangeText={setIsbn} placeholder="ISBN (optional)" placeholderTextColor={Colors.textMuted} style={[styles.input, { marginTop: Sizes.sm }]} />
          <AppButton title={addMut.isPending ? 'Adding…' : 'Add Book'} onPress={() => addMut.mutate()} loading={addMut.isPending} disabled={!title.trim()} size="sm" style={{ marginTop: Sizes.sm }} />
        </Card>
      )}

      {isLoading ? (
        <LoadingSpinner message="Loading…" />
      ) : (
        <FlatList
          data={books}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 120 }]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<EmptyState icon="book-off-outline" title="No books" subtitle="Tap + to add one." />}
          renderItem={({ item }) => {
            const avail = item.availableCopies ?? 0;
            return (
              <Card style={styles.card}>
                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.title}>{item.title}</Text>
                    <Text style={styles.sub}>{[item.author, item.isbn].filter(Boolean).join('  ·  ')}</Text>
                  </View>
                  <Badge label={`${avail}/${item.totalCopies ?? avail}`} color={avail > 0 ? Colors.success : Colors.danger} />
                </View>
                <TouchableOpacity style={[styles.issueBtn, avail <= 0 && { opacity: 0.4 }]} disabled={avail <= 0} onPress={() => { setIssueBook(item); setStudentId(''); }}>
                  <Icon name="account-arrow-right-outline" size={16} color={Colors.primary} />
                  <Text style={styles.issueText}>Issue</Text>
                </TouchableOpacity>
              </Card>
            );
          }}
        />
      )}

      {issueBook && (
        <View style={[styles.panel, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.panelHeader}>
            <Text style={styles.panelTitle}>Issue — {issueBook.title}</Text>
            <TouchableOpacity onPress={() => setIssueBook(null)}><Text style={styles.cancel}>Cancel</Text></TouchableOpacity>
          </View>
          <TextInput value={studentId} onChangeText={v => setStudentId(v.replace(/[^0-9]/g, ''))} placeholder="Student ID" placeholderTextColor={Colors.textMuted} keyboardType="number-pad" style={styles.input} />
          <TextInput value={dueDate} onChangeText={setDueDate} placeholder="Due date yyyy-MM-dd" placeholderTextColor={Colors.textMuted} style={[styles.input, { marginTop: Sizes.sm }]} />
          <AppButton title={issueMut.isPending ? 'Issuing…' : 'Issue Book'} onPress={() => issueMut.mutate()} loading={issueMut.isPending} disabled={!(Number(studentId) > 0)} style={{ marginTop: Sizes.sm }} />
        </View>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  formCard: { padding: Sizes.md, margin: Sizes.md },
  inlineRow: { flexDirection: 'row', gap: Sizes.sm, marginTop: Sizes.sm },
  input: { backgroundColor: Colors.background, borderRadius: Sizes.radiusMd, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: Sizes.md, paddingVertical: Platform.OS === 'ios' ? 12 : 9, fontSize: Sizes.fontMd, color: Colors.textPrimary },
  list: { paddingHorizontal: Sizes.md, gap: Sizes.sm },
  card: { padding: Sizes.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: Sizes.sm },
  title: { fontSize: Sizes.fontMd, fontWeight: '700', color: Colors.textPrimary },
  sub: { fontSize: Sizes.fontXs, color: Colors.textMuted, marginTop: 2 },
  issueBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: Sizes.sm, alignSelf: 'flex-start' },
  issueText: { fontSize: Sizes.fontSm, color: Colors.primary, fontWeight: '700' },
  panel: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: Colors.white, borderTopLeftRadius: Sizes.radiusLg, borderTopRightRadius: Sizes.radiusLg, padding: Sizes.md, ...Sizes.shadowLg },
  panelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Sizes.sm },
  panelTitle: { flex: 1, fontSize: Sizes.fontMd, fontWeight: '800', color: Colors.textPrimary },
  cancel: { fontSize: Sizes.fontSm, color: Colors.danger, fontWeight: '600' },
});

export default AdminLibraryScreen;
