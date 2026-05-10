import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { examService } from '@api/services/examService';
import { useAppSelector } from '@store/hooks';
import Header from '@components/common/Header';
import Card from '@components/common/Card';
import Badge from '@components/common/Badge';
import LoadingSpinner from '@components/common/LoadingSpinner';
import ErrorView from '@components/common/ErrorView';
import EmptyState from '@components/common/EmptyState';
import { Colors } from '@constants/colors';
import { Sizes } from '@constants/sizes';
import { formatPercent, gradeColor } from '@utils/formatters';
import { formatDate } from '@utils/dateUtils';
import { ExamResult } from '@app-types/index';

const ResultsScreen = () => {
  const navigation = useNavigation<any>();
  const student    = useAppSelector(s => s.student.selectedStudent);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['results', student?.id],
    queryFn: () => student ? examService.getResults(student.id) : Promise.resolve([]),
    enabled: !!student,
  });

  // Group by exam name
  const grouped = React.useMemo(() => {
    if (!data) return {};
    return data.reduce<Record<string, ExamResult[]>>((acc, r) => {
      if (!acc[r.examName]) acc[r.examName] = [];
      acc[r.examName].push(r);
      return acc;
    }, {});
  }, [data]);

  const examNames = Object.keys(grouped);

  // Overall average
  const average = React.useMemo(() => {
    if (!data?.length) return 0;
    return data.reduce((sum, r) => sum + r.percentage, 0) / data.length;
  }, [data]);

  return (
    <View style={styles.root}>
      <Header title="Exam Results" subtitle={student?.firstName} onBack={() => navigation.goBack()} />

      {isLoading ? (
        <LoadingSpinner message="Fetching results..." />
      ) : isError ? (
        <ErrorView onRetry={refetch} />
      ) : (
        <FlatList
          data={examNames}
          keyExtractor={name => name}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            data?.length ? (
              <Card style={styles.summaryCard}>
                <View style={styles.summaryRow}>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryVal}>{formatPercent(average)}</Text>
                    <Text style={styles.summaryLbl}>Overall Average</Text>
                  </View>
                  <View style={styles.summaryDivider} />
                  <View style={styles.summaryItem}>
                    <Text style={[styles.summaryVal, { color: gradeColor(data[0]?.grade ?? '') }]}>
                      {data[0]?.grade ?? '-'}
                    </Text>
                    <Text style={styles.summaryLbl}>Latest Grade</Text>
                  </View>
                  <View style={styles.summaryDivider} />
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryVal}>{data.length}</Text>
                    <Text style={styles.summaryLbl}>Exams Taken</Text>
                  </View>
                </View>
              </Card>
            ) : null
          }
          ListEmptyComponent={
            <EmptyState icon="chart-bar-stacked" title="No Results" subtitle="Exam results will appear here once published." />
          }
          renderItem={({ item: examName }) => (
            <View style={styles.examSection}>
              <Text style={styles.examName}>{examName}</Text>
              {grouped[examName].map(result => (
                <ResultRow key={result.id} result={result} />
              ))}
            </View>
          )}
        />
      )}
    </View>
  );
};

const ResultRow = ({ result }: { result: ExamResult }) => {
  const color = gradeColor(result.grade);
  const pct   = result.percentage;

  return (
    <Card style={styles.resultCard}>
      <View style={styles.resultHeader}>
        <Text style={styles.subject}>{result.subject}</Text>
        <View style={[styles.gradeCircle, { borderColor: color }]}>
          <Text style={[styles.gradeText, { color }]}>{result.grade}</Text>
        </View>
      </View>

      <View style={styles.marksRow}>
        <Text style={styles.marks}>
          {result.marksObtained} / {result.totalMarks}
        </Text>
        <Text style={[styles.pct, { color }]}>{formatPercent(pct)}</Text>
      </View>

      {/* Progress bar */}
      <View style={styles.barBg}>
        <View style={[styles.barFill, { width: `${pct}%` as any, backgroundColor: color }]} />
      </View>

      <View style={styles.resultFooter}>
        <Text style={styles.examDate}>{formatDate(result.examDate)}</Text>
        {result.remarks && <Text style={styles.remarks}>{result.remarks}</Text>}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  list: { padding: Sizes.md, paddingBottom: 32 },
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
