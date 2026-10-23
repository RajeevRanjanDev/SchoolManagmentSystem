import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { timetableService } from '@api/services/timetableService';
import { useAppSelector } from '@store/hooks';
import Header from '@components/common/Header';
import Card from '@components/common/Card';
import LoadingSpinner from '@components/common/LoadingSpinner';
import ErrorView from '@components/common/ErrorView';
import EmptyState from '@components/common/EmptyState';
import { Colors } from '@constants/colors';
import { Sizes } from '@constants/sizes';
import { formatTime } from '@utils/dateUtils';
import { TimetablePeriod, DayOfWeek } from '@app-types/index';

const DAYS: DayOfWeek[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
const DAY_LABELS: Record<DayOfWeek, string> = {
  MONDAY: 'Mon', TUESDAY: 'Tue', WEDNESDAY: 'Wed',
  THURSDAY: 'Thu', FRIDAY: 'Fri', SATURDAY: 'Sat',
};

const SUBJECT_COLORS: Record<string, string> = {
  Mathematics: '#4F46E5', English: '#06B6D4', Science: '#10B981',
  Hindi: '#F59E0B', History: '#EF4444', Geography: '#8B5CF6',
  Physics: '#3B82F6', Chemistry: '#EC4899', Biology: '#14B8A6',
  'Physical Education': '#F97316', Art: '#A855F7', Music: '#0EA5E9',
};

const TimetableScreen = () => {
  const navigation = useNavigation<any>();
  const student    = useAppSelector(s => s.student.selectedStudent);
  const sectionId  = student?.sectionId ?? 0;

  const todayIndex = new Date().getDay(); // 0=Sun
  const todayDay   = DAYS[todayIndex === 0 ? 0 : todayIndex - 1] ?? 'MONDAY';
  const [activeDay, setActiveDay] = useState<DayOfWeek>(todayDay);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['timetable', sectionId],
    queryFn: () => timetableService.getTimetable(sectionId),
    enabled: !!sectionId,
  });

  const periodsForDay = data?.filter(p => p.dayOfWeek === activeDay)
    .sort((a, b) => a.periodNumber - b.periodNumber) ?? [];

  return (
    <View style={styles.root}>
      <Header title="Timetable" subtitle={student?.firstName} onBack={() => navigation.goBack()} />

      {/* Day tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.dayTabs}>
        {DAYS.map(day => (
          <TouchableOpacity
            key={day}
            onPress={() => setActiveDay(day)}
            style={[styles.dayTab, activeDay === day && styles.dayTabActive]}>
            <Text style={[styles.dayTabText, activeDay === day && styles.dayTabTextActive]}>
              {DAY_LABELS[day]}
            </Text>
            {day === todayDay && <View style={styles.todayDot} />}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {isLoading ? (
        <LoadingSpinner message="Loading timetable..." />
      ) : isError ? (
        <ErrorView onRetry={refetch} />
      ) : (
        <FlatList
          data={periodsForDay}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState icon="calendar-blank" title="No periods" subtitle="No classes scheduled for this day." />
          }
          renderItem={({ item }) => <PeriodCard period={item} />}
        />
      )}
    </View>
  );
};

const PeriodCard = ({ period }: { period: TimetablePeriod }) => {
  const color = SUBJECT_COLORS[period.subject] ?? Colors.primary;
  return (
    <View style={styles.periodRow}>
      {/* Time column */}
      <View style={styles.timeCol}>
        <Text style={styles.startTime}>{formatTime(period.startTime)}</Text>
        <View style={styles.timeLine} />
        <Text style={styles.endTime}>{formatTime(period.endTime)}</Text>
      </View>
      {/* Period card */}
      <Card style={[styles.periodCard, { borderLeftColor: color, borderLeftWidth: 4 }]}>
        <View style={styles.periodHeader}>
          <Text style={[styles.periodSubject, { color }]}>{period.subject}</Text>
          <Text style={styles.periodNum}>Period {period.periodNumber}</Text>
        </View>
        <View style={styles.periodMeta}>
          <Icon name="account-outline" size={13} color={Colors.textMuted} />
          <Text style={styles.periodMetaText}>{period.teacherName}</Text>
          {period.roomNumber && (
            <>
              <Icon name="map-marker-outline" size={13} color={Colors.textMuted} style={{ marginLeft: 8 }} />
              <Text style={styles.periodMetaText}>Room {period.roomNumber}</Text>
            </>
          )}
        </View>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  dayTabs: { paddingHorizontal: Sizes.md, paddingVertical: Sizes.sm, gap: Sizes.xs },
  dayTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Sizes.radiusFull,
    backgroundColor: Colors.divider,
    alignItems: 'center',
  },
  dayTabActive: { backgroundColor: Colors.primary },
  dayTabText: { fontSize: Sizes.fontSm, fontWeight: '600', color: Colors.textSecondary },
  dayTabTextActive: { color: Colors.white },
  todayDot: {
    width: 4, height: 4, borderRadius: 2,
    backgroundColor: Colors.accent, marginTop: 2,
  },
  list: { padding: Sizes.md, paddingBottom: 32 },
  periodRow: { flexDirection: 'row', marginBottom: Sizes.md, gap: Sizes.sm },
  timeCol: { alignItems: 'center', width: 56 },
  startTime: { fontSize: 10, fontWeight: '700', color: Colors.textSecondary },
  timeLine: { flex: 1, width: 1, backgroundColor: Colors.border, marginVertical: 4 },
  endTime: { fontSize: 10, color: Colors.textMuted },
  periodCard: { flex: 1, paddingLeft: Sizes.md },
  periodHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  periodSubject: { fontSize: Sizes.fontMd, fontWeight: '700' },
  periodNum: { fontSize: Sizes.fontXs, color: Colors.textMuted },
  periodMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 4 },
  periodMetaText: { fontSize: Sizes.fontXs, color: Colors.textMuted },
});

export default TimetableScreen;
