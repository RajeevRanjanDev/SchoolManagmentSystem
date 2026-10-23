import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { differenceInDays, parseISO } from 'date-fns';
import { libraryService } from '@api/services/libraryService';
import { useAppSelector } from '@store/hooks';
import Header from '@components/common/Header';
import Card from '@components/common/Card';
import Badge from '@components/common/Badge';
import LoadingSpinner from '@components/common/LoadingSpinner';
import ErrorView from '@components/common/ErrorView';
import EmptyState from '@components/common/EmptyState';
import { Colors } from '@constants/colors';
import { Sizes } from '@constants/sizes';
import { formatCurrency } from '@utils/formatters';
import { formatDate } from '@utils/dateUtils';
import { LibraryBook } from '@app-types/index';

const LibraryScreen = () => {
  const navigation = useNavigation<any>();
  const student    = useAppSelector(s => s.student.selectedStudent);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['library', student?.studentId],
    queryFn: () => student ? libraryService.getIssuedBooks(student.studentId) : Promise.resolve([]),
    enabled: !!student,
  });

  const activeBooks   = data?.filter(b => b.status !== 'RETURNED') ?? [];
  const returnedBooks = data?.filter(b => b.status === 'RETURNED') ?? [];

  return (
    <View style={styles.root}>
      <Header title="Library" subtitle={student?.firstName} onBack={() => navigation.goBack()} />

      {isLoading ? (
        <LoadingSpinner message="Loading library books..." />
      ) : isError ? (
        <ErrorView onRetry={refetch} />
      ) : (
        <FlatList
          data={[...activeBooks, ...returnedBooks]}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            data?.length ? (
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryVal}>{activeBooks.length}</Text>
                  <Text style={styles.summaryLbl}>Active</Text>
                </View>
                <View style={styles.summaryDiv} />
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryVal, { color: Colors.danger }]}>
                    {activeBooks.filter(b => b.status === 'OVERDUE').length}
                  </Text>
                  <Text style={styles.summaryLbl}>Overdue</Text>
                </View>
                <View style={styles.summaryDiv} />
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryVal}>{returnedBooks.length}</Text>
                  <Text style={styles.summaryLbl}>Returned</Text>
                </View>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <EmptyState
              icon="book-off-outline"
              title="No Books Issued"
              subtitle="Library books issued to this student will appear here."
            />
          }
          renderItem={({ item }) => <BookCard book={item} />}
        />
      )}
    </View>
  );
};

const BookCard = ({ book }: { book: LibraryBook }) => {
  const daysLeft = book.returnDate
    ? 0
    : differenceInDays(parseISO(book.dueDate), new Date());

  const statusColor =
    book.status === 'RETURNED' ? Colors.success
    : book.status === 'OVERDUE' ? Colors.danger
    : daysLeft <= 3 ? Colors.warning
    : Colors.info;

  return (
    <Card style={styles.card}>
      <View style={styles.cardRow}>
        <View style={[styles.bookIcon, { backgroundColor: Colors.primary + '15' }]}>
          <Icon name="book-open-page-variant" size={28} color={Colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{book.bookTitle}</Text>
          <Text style={styles.author}>{book.author}</Text>
          <Text style={styles.isbn}>ISBN: {book.isbn}</Text>

          <View style={styles.datesRow}>
            <View style={styles.dateItem}>
              <Icon name="calendar-arrow-right" size={13} color={Colors.textMuted} />
              <Text style={styles.dateText}>Issued: {formatDate(book.issueDate)}</Text>
            </View>
            <View style={styles.dateItem}>
              <Icon
                name="calendar-arrow-left"
                size={13}
                color={book.status === 'OVERDUE' ? Colors.danger : Colors.textMuted}
              />
              <Text style={[styles.dateText, book.status === 'OVERDUE' && styles.overdue]}>
                Due: {formatDate(book.dueDate)}
              </Text>
            </View>
          </View>

          {book.status !== 'RETURNED' && daysLeft >= 0 && (
            <Text style={[styles.daysLeft, { color: statusColor }]}>
              {daysLeft === 0 ? 'Due today!' : `${daysLeft} days left`}
            </Text>
          )}

          {book.fineAmount && book.fineAmount > 0 && (
            <Text style={styles.fine}>
              Fine: {formatCurrency(book.fineAmount)}
            </Text>
          )}
        </View>
        <Badge
          label={book.status}
          color={statusColor}
          style={{ alignSelf: 'flex-start' }}
        />
      </View>
    </Card>
  );
};


const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  list: { padding: Sizes.md, paddingBottom: 32 },
  summaryRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.white, borderRadius: Sizes.radiusMd,
    padding: Sizes.md, marginBottom: Sizes.md,
    ...Sizes.shadowSm,
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryVal: { fontSize: Sizes.fontXxl, fontWeight: '800', color: Colors.textPrimary },
  summaryLbl: { fontSize: Sizes.fontXs, color: Colors.textMuted, marginTop: 2 },
  summaryDiv: { width: 1, height: 40, backgroundColor: Colors.border },
  card: { marginBottom: Sizes.sm },
  cardRow: { flexDirection: 'row', gap: Sizes.md, alignItems: 'flex-start' },
  bookIcon: {
    width: 56, height: 56, borderRadius: Sizes.radiusMd,
    alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: Sizes.fontMd, fontWeight: '700', color: Colors.textPrimary },
  author: { fontSize: Sizes.fontSm, color: Colors.textSecondary, marginTop: 2 },
  isbn: { fontSize: Sizes.fontXs, color: Colors.textMuted, marginTop: 2 },
  datesRow: { flexDirection: 'row', gap: Sizes.md, marginTop: Sizes.sm },
  dateItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dateText: { fontSize: Sizes.fontXs, color: Colors.textMuted },
  overdue: { color: Colors.danger, fontWeight: '600' },
  daysLeft: { fontSize: Sizes.fontXs, fontWeight: '600', marginTop: 4 },
  fine: { fontSize: Sizes.fontXs, color: Colors.danger, fontWeight: '600', marginTop: 2 },
});

export default LibraryScreen;
