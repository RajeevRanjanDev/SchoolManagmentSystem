import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Header from '@components/common/Header';
import Card from '@components/common/Card';
import EmptyState from '@components/common/EmptyState';
import Badge from '@components/common/Badge';
import { Colors } from '@constants/colors';
import { Sizes } from '@constants/sizes';
import { formatDate } from '@utils/dateUtils';
import { useAppSelector } from '@store/hooks';

// Classwork uses the same API shape as homework — just filtered by type
// Backend endpoint: /api/v1/homework?type=CLASSWORK (mocked here)
const DEMO_CLASSWORK = [
  { id: 1, subject: 'Mathematics',  title: 'Chapter 5 – Fractions worksheet',   date: '2026-05-10', teacher: 'Priya Sharma' },
  { id: 2, subject: 'English',      title: 'Essay: My Favourite Season',         date: '2026-05-10', teacher: 'Arjun Mehta' },
  { id: 3, subject: 'Science',      title: 'Draw and label plant cell diagram',  date: '2026-05-09', teacher: 'Sita Devi' },
  { id: 4, subject: 'Hindi',        title: 'पत्र लेखन – प्रधानाचार्य को पत्र', date: '2026-05-08', teacher: 'Mohan Lal' },
];

const SUBJECT_COLORS: Record<string, string> = {
  Mathematics: '#4F46E5', English: '#06B6D4', Science: '#10B981',
  Hindi: '#F59E0B',
};

const ClassworkScreen = () => {
  const navigation = useNavigation<any>();
  const student    = useAppSelector(s => s.student.selectedStudent);

  return (
    <View style={styles.root}>
      <Header
        title="Classwork"
        subtitle={student?.firstName}
        onBack={() => navigation.goBack()}
      />
      <FlatList
        data={DEMO_CLASSWORK}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState icon="pencil-off" title="No Classwork" subtitle="Nothing recorded yet." />
        }
        renderItem={({ item }) => {
          const color = SUBJECT_COLORS[item.subject] ?? Colors.primary;
          return (
            <Card style={styles.card}>
              <View style={styles.row}>
                <View style={[styles.dot, { backgroundColor: color }]} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.subject, { color }]}>{item.subject}</Text>
                  <Text style={styles.title}>{item.title}</Text>
                  <View style={styles.meta}>
                    <Icon name="account-outline" size={12} color={Colors.textMuted} />
                    <Text style={styles.metaText}>{item.teacher}</Text>
                    <Icon name="calendar-outline" size={12} color={Colors.textMuted} style={{ marginLeft: 8 }} />
                    <Text style={styles.metaText}>{formatDate(item.date)}</Text>
                  </View>
                </View>
                <Badge label="Done" color={Colors.success} />
              </View>
            </Card>
          );
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  list: { padding: Sizes.md, paddingBottom: 32 },
  card: { marginBottom: Sizes.sm },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: Sizes.sm },
  dot: { width: 4, borderRadius: 2, alignSelf: 'stretch', minHeight: 36 },
  subject: { fontSize: Sizes.fontXs, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  title: { fontSize: Sizes.fontMd, fontWeight: '600', color: Colors.textPrimary, marginTop: 2 },
  meta: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 4 },
  metaText: { fontSize: Sizes.fontXs, color: Colors.textMuted },
});

export default ClassworkScreen;
