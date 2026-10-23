import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';

import { studentPortalService } from '@api/services/studentPortalService';
import Header from '@components/common/Header';
import Card from '@components/common/Card';
import LoadingSpinner from '@components/common/LoadingSpinner';
import EmptyState from '@components/common/EmptyState';
import { Colors } from '@constants/colors';
import { Sizes } from '@constants/sizes';
import { gradeColor } from '@utils/formatters';
import { formatDate } from '@utils/dateUtils';

const StudentResultsScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { data, isLoading } = useQuery({
    queryKey: ['student-results'],
    queryFn: () => studentPortalService.getResults(),
  });

  return (
    <View style={styles.root}>
      <Header title="Results" onBack={() => navigation.goBack()} />
      {isLoading ? (
        <LoadingSpinner message="Loading…" />
      ) : (
        <FlatList
          data={data}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 110 }]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<EmptyState icon="chart-box-outline" title="No results yet" subtitle="Published results will appear here." />}
          renderItem={({ item }) => (
            <Card style={styles.card}>
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.exam}>{item.examName}</Text>
                  <Text style={styles.subject}>
                    {item.subject}{item.examDate ? ` · ${formatDate(item.examDate)}` : ''}
                  </Text>
                </View>
                <View style={styles.scoreBox}>
                  <Text style={styles.score}>
                    {item.marksObtained ?? '--'}{item.totalMarks != null ? `/${item.totalMarks}` : ''}
                  </Text>
                  {item.grade ? (
                    <View style={[styles.gradePill, { backgroundColor: gradeColor(item.grade) + '20' }]}>
                      <Text style={[styles.gradeText, { color: gradeColor(item.grade) }]}>{item.grade}</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            </Card>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  list: { padding: Sizes.md, gap: Sizes.sm },
  card: { padding: Sizes.md },
  row: { flexDirection: 'row', alignItems: 'center' },
  exam: { fontSize: Sizes.fontMd, fontWeight: '700', color: Colors.textPrimary },
  subject: { fontSize: Sizes.fontXs, color: Colors.textMuted, marginTop: 2 },
  scoreBox: { alignItems: 'flex-end', gap: 4 },
  score: { fontSize: Sizes.fontLg, fontWeight: '800', color: Colors.textPrimary },
  gradePill: { paddingHorizontal: 10, paddingVertical: 2, borderRadius: Sizes.radiusFull },
  gradeText: { fontSize: Sizes.fontXs, fontWeight: '800' },
});

export default StudentResultsScreen;
