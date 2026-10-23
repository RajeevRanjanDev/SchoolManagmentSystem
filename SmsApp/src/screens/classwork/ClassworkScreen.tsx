import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Header from '@components/common/Header';
import Card from '@components/common/Card';
import LoadingSpinner from '@components/common/LoadingSpinner';
import ErrorView from '@components/common/ErrorView';
import EmptyState from '@components/common/EmptyState';
import { Colors } from '@constants/colors';
import { Sizes } from '@constants/sizes';
import { formatDate } from '@utils/dateUtils';
import { currentAcademicYear } from '@utils/dateUtils';
import { useAppSelector } from '@store/hooks';
import { studentService } from '@api/services/studentService';

const SUBJECT_COLORS: Record<string, string> = {
  Mathematics: '#4F46E5', English: '#06B6D4', Science: '#10B981',
  Hindi: '#F59E0B', History: '#EF4444', Geography: '#8B5CF6',
};

const ClassworkScreen = () => {
  const navigation = useNavigation<any>();
  const student    = useAppSelector(s => s.student.selectedStudent);
  const academicYear = currentAcademicYear();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['child-classwork', student?.studentId, academicYear],
    queryFn: () =>
      student ? studentService.getChildClasswork(student.studentId, academicYear) : Promise.resolve([]),
    enabled: !!student,
  });

  return (
    <View style={styles.root}>
      <Header title="Classwork" subtitle={student?.firstName} onBack={() => navigation.goBack()} />
      {isLoading ? (
        <LoadingSpinner message="Loading classwork…" />
      ) : isError ? (
        <ErrorView onRetry={refetch} />
      ) : (
        <FlatList
          data={data}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<EmptyState icon="pencil-off" title="No Classwork" subtitle="Nothing recorded yet." />}
          renderItem={({ item }) => {
            const color = (item.subject && SUBJECT_COLORS[item.subject]) || Colors.primary;
            const date = item.date ?? item.workDate ?? item.createdAt;
            return (
              <Card style={styles.card}>
                <View style={styles.row}>
                  <View style={[styles.dot, { backgroundColor: color }]} />
                  <View style={{ flex: 1 }}>
                    {item.subject ? <Text style={[styles.subject, { color }]}>{item.subject}</Text> : null}
                    <Text style={styles.title}>{item.title}</Text>
                    {item.description ? <Text style={styles.desc} numberOfLines={3}>{item.description}</Text> : null}
                    <View style={styles.meta}>
                      {item.teacherName ? (
                        <>
                          <Icon name="account-outline" size={12} color={Colors.textMuted} />
                          <Text style={styles.metaText}>{item.teacherName}</Text>
                        </>
                      ) : null}
                      {date ? (
                        <>
                          <Icon name="calendar-outline" size={12} color={Colors.textMuted} style={{ marginLeft: 8 }} />
                          <Text style={styles.metaText}>{formatDate(date)}</Text>
                        </>
                      ) : null}
                    </View>
                  </View>
                </View>
              </Card>
            );
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  list: { padding: Sizes.md, paddingBottom: 120 },
  card: { marginBottom: Sizes.sm },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: Sizes.sm },
  dot: { width: 4, borderRadius: 2, alignSelf: 'stretch', minHeight: 36 },
  subject: { fontSize: Sizes.fontXs, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  title: { fontSize: Sizes.fontMd, fontWeight: '600', color: Colors.textPrimary, marginTop: 2 },
  desc: { fontSize: Sizes.fontSm, color: Colors.textSecondary, marginTop: 2, lineHeight: 18 },
  meta: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 4 },
  metaText: { fontSize: Sizes.fontXs, color: Colors.textMuted },
});

export default ClassworkScreen;
