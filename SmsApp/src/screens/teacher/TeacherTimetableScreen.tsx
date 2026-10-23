import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';

import { teacherService, TimetablePeriod } from '@api/services/teacherService';
import Header from '@components/common/Header';
import Card from '@components/common/Card';
import LoadingSpinner from '@components/common/LoadingSpinner';
import EmptyState from '@components/common/EmptyState';
import { Colors } from '@constants/colors';
import { Sizes } from '@constants/sizes';
import { formatTime } from '@utils/dateUtils';

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

const TeacherTimetableScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();

  const { data: dash } = useQuery({
    queryKey: ['teacher-dashboard-raw'],
    queryFn: () => teacherService.getDashboard(),
  });
  const teacherId: number | undefined = (dash as any)?.teacherId;

  const { data: periods, isLoading } = useQuery({
    queryKey: ['teacher-timetable', teacherId],
    queryFn: () => teacherService.getTeacherTimetable(teacherId!),
    enabled: teacherId != null,
  });

  const byDay = useMemo(() => {
    const map: Record<string, TimetablePeriod[]> = {};
    (periods ?? []).forEach(p => {
      const d = (p.dayOfWeek ?? 'OTHER').toUpperCase();
      (map[d] ||= []).push(p);
    });
    Object.values(map).forEach(list => list.sort((a, b) => (a.periodNumber ?? 0) - (b.periodNumber ?? 0)));
    return map;
  }, [periods]);

  return (
    <View style={styles.root}>
      <Header title="My Timetable" onBack={() => navigation.goBack()} />
      {isLoading ? (
        <LoadingSpinner message="Loading timetable…" />
      ) : (periods ?? []).length === 0 ? (
        <EmptyState icon="timetable" title="No timetable" subtitle="No periods scheduled for you yet." />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 110 }]}>
          {DAYS.filter(d => byDay[d]?.length).map(day => (
            <Card key={day} style={styles.dayCard}>
              <Text style={styles.day}>{day.charAt(0) + day.slice(1).toLowerCase()}</Text>
              {byDay[day].map((p, i) => (
                <View key={p.id ?? i} style={styles.period}>
                  <View style={styles.periodNo}><Text style={styles.periodNoText}>{p.periodNumber ?? i + 1}</Text></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.subject}>{p.subject ?? 'Period'}</Text>
                    <Text style={styles.section}>{p.sectionName ?? ''}</Text>
                  </View>
                  <Text style={styles.time}>
                    {p.startTime ? formatTime(p.startTime) : ''}{p.endTime ? ` – ${formatTime(p.endTime)}` : ''}
                  </Text>
                </View>
              ))}
            </Card>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Sizes.md, gap: Sizes.md },
  dayCard: { padding: Sizes.md },
  day: { fontSize: Sizes.fontLg, fontWeight: '800', color: Colors.textPrimary, marginBottom: Sizes.sm },
  period: { flexDirection: 'row', alignItems: 'center', gap: Sizes.sm, paddingVertical: 8, borderTopWidth: 1, borderTopColor: Colors.divider },
  periodNo: { width: 30, height: 30, borderRadius: 15, backgroundColor: Colors.softBlueBg, alignItems: 'center', justifyContent: 'center' },
  periodNoText: { fontSize: Sizes.fontSm, fontWeight: '800', color: Colors.primary },
  subject: { fontSize: Sizes.fontMd, fontWeight: '700', color: Colors.textPrimary },
  section: { fontSize: Sizes.fontXs, color: Colors.textMuted, marginTop: 2 },
  time: { fontSize: Sizes.fontXs, color: Colors.textSecondary, fontWeight: '600' },
});

export default TeacherTimetableScreen;
