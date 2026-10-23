import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { studentService, ChildResult } from '@api/services/studentService';
import { useAppSelector } from '@store/hooks';
import Header from '@components/common/Header';
import Card from '@components/common/Card';
import LoadingSpinner from '@components/common/LoadingSpinner';
import ErrorView from '@components/common/ErrorView';
import EmptyState from '@components/common/EmptyState';
import { Colors } from '@constants/colors';
import { Sizes } from '@constants/sizes';
import { formatPercent, gradeColor } from '@utils/formatters';
import { formatDate } from '@utils/dateUtils';

const pctOf = (r: ChildResult) =>
  r.totalMarks && r.totalMarks > 0 ? (r.marksObtained / r.totalMarks) * 100 : 0;

const ResultsScreen = () => {
  const navigation = useNavigation<any>();
  const student    = useAppSelector(s => s.student.selectedStudent);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['child-results', student?.studentId],
    queryFn: () => student ? studentService.getChildResults(student.studentId) : Promise.resolve([]),
    enabled: !!student,
  });

  const published = React.useMemo(() => (data ?? []).filter(r => r.isPublished !== false), [data]);
  const grouped = React.useMemo(() => {
    return published.reduce<Record<string, ChildResult[]>>((acc, r) => {
      (acc[r.examName] ||= []).push(r);
      return acc;
    }, {});
  }, [published]);
  const examNames = Object.keys(grouped);
  const average = React.useMemo(
    () => (published.length ? published.reduce((s, r) => s + pctOf(r), 0) / published.length : 0),
    [published],
  );

  return (
    <View style={styles.root}>
      <Header title="Exam Results" subtitle={student?.firstName} onBack={() => navigation.goBack()} />
      {isLoading ? (
        <LoadingSpinner message="Fetching results…" />
      ) : isError ? (
        <ErrorView onRetry={refetch} />
      ) : (
        <FlatList
          data={examNames}
          keyExtractor={name => name}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            published.length ? (
              <Card style={styles.summaryCard}>
                <View style={styles.summaryRow}>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryVal}>{formatPercent(average)}</Text>
                    <Text style={styles.summaryLbl}>Overall Average</Text>
                  </View>
                  <View style={styles.summaryDivider} />
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryVal}>{published.length}</Text>
                    <Text style={styles.summaryLbl}>Results</Text>
                  </View>
                </View>
              </Card>
            ) : null
          }
          ListEmptyComponent={<EmptyState icon="chart-bar" title="No Results" subtitle="Results appear here once published." />}
          renderItem={({ item: examName }) => (
            <View style={styles.examSection}>
              <Text style={styles.examName}>{examName}</Text>
              {grouped[examName].map(result => <ResultRow key={result.id} result={result} />)}
            </View>
          )}
        />
      )}
    </View>
  );
};

const ResultRow = ({ result }: { result: ChildResult }) => {
  const color = gradeColor(result.grade ?? '');
  const pct = pctOf(result);
  return (
    <Card style={styles.resultCard}>
      <View style={styles.resultHeader}>
        <Text style={styles.subject}>{result.subject ?? 'Subject'}</Text>
        {result.grade ? (
          <View style={[styles.gradeCircle, { borderColor: color }]}>
            <Text style={[styles.gradeText, { color }]}>{result.grade}</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.marksRow}>
        <Text style={styles.marks}>{result.marksObtained}{result.totalMarks != null ? ` / ${result.totalMarks}` : ''}</Text>
        <Text style={[styles.pct, { color }]}>{formatPercent(pct)}</Text>
      </View>
      <View style={styles.barBg}>
        <View style={[styles.barFill, { width: `${Math.min(100, pct)}%` as any, backgroundColor: color }]} />
      </View>
      <View style={styles.resultFooter}>
        <Text style={styles.examDate}>{result.examDate ? formatDate(result.examDate) : ''}</Text>
        {result.remarks ? <Text style={styles.remarks}>{result.remarks}</Text> : null}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  list: { padding: Sizes.md, paddingBottom: 120 },
  summaryCard: { marginBottom: Sizes.md },
  summaryRow: { flexDirection: 'row', alignItems: 'center' },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryVal: { fontSize: Sizes.fontXl, fontWeight: '800', color: Colors.textPrimary },
  summaryLbl: { fontSize: Sizes.fontXs, color: Colors.textMuted, marginTop: 2 },
  summaryDivider: { width: 1, height: 40, backgroundColor: Colors.border },
  examSection: { marginBottom: Sizes.md },
  examName: { fontSize: Sizes.fontLg, fontWeight: '700', color: Colors.textPrimary, marginBottom: Sizes.sm },
  resultCard: { marginBottom: Sizes.sm },
  resultHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  subject: { fontSize: Sizes.fontMd, fontWeight: '700', color: Colors.textPrimary },
  gradeCircle: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  gradeText: { fontSize: Sizes.fontMd, fontWeight: '800' },
  marksRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: Sizes.sm },
  marks: { fontSize: Sizes.fontSm, color: Colors.textSecondary },
  pct: { fontSize: Sizes.fontSm, fontWeight: '700' },
  barBg: { height: 6, backgroundColor: Colors.divider, borderRadius: 3, overflow: 'hidden', marginTop: Sizes.sm },
  barFill: { height: 6, borderRadius: 3 },
  resultFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: Sizes.sm },
  examDate: { fontSize: Sizes.fontXs, color: Colors.textMuted },
  remarks: { fontSize: Sizes.fontXs, color: Colors.textMuted, fontStyle: 'italic' },
});

export default ResultsScreen;
