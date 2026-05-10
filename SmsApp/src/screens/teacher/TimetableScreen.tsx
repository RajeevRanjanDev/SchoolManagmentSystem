import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { timetableApi } from '../../api/timetable.api';
import { QUERY_KEYS, DAYS_OF_WEEK, DAY_LABELS, CURRENT_ACADEMIC_YEAR } from '../../constants';
import { useAuth } from '../../hooks/useAuth';
import { usePermissions } from '../../hooks/usePermissions';
import { Header } from '../../components/common/Header';
import { Card } from '../../components/common/Card';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';
import { formatTime } from '../../utils/formatters';
import type { TimetableEntry } from '../../types';

export function TimetableScreen() {
  const { user } = useAuth();
  const { isAdmin } = usePermissions();
  const [selectedDay, setSelectedDay] = useState<string>(
    DAYS_OF_WEEK[Math.max(0, new Date().getDay() - 1)],
  );

  const { data: timetable, isLoading } = useQuery({
    queryKey: QUERY_KEYS.TIMETABLE_TEACHER(user?.id ?? 0),
    queryFn: () => timetableApi.getByTeacher(user!.id, CURRENT_ACADEMIC_YEAR),
    enabled: !!user?.id,
  });

  if (isLoading) return <LoadingSpinner fullScreen />;

  const dayEntries = (timetable ?? [])
    .filter(t => t.dayOfWeek === selectedDay)
    .sort((a, b) => a.periodNumber - b.periodNumber);

  return (
    <View style={styles.container}>
      <Header title="My Timetable" subtitle={CURRENT_ACADEMIC_YEAR} />

      {/* Day Selector */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dayScrollView} contentContainerStyle={styles.dayRow}>
        {DAYS_OF_WEEK.map(day => (
          <TouchableOpacity
            key={day}
            style={[styles.dayBtn, selectedDay === day && styles.dayBtnActive]}
            onPress={() => setSelectedDay(day)}
          >
            <Text style={[styles.dayLabel, selectedDay === day && styles.dayLabelActive]}>
              {DAY_LABELS[day]}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Periods for selected day */}
      <ScrollView contentContainerStyle={styles.content}>
        {dayEntries.length === 0 ? (
          <EmptyState title={`No classes on ${DAY_LABELS[selectedDay]}`} />
        ) : (
          dayEntries.map((entry: TimetableEntry) => (
            <View key={entry.id} style={styles.periodCard}>
              <View style={styles.periodNumber}>
                <Text style={styles.periodNum}>{entry.periodNumber}</Text>
                <Text style={styles.periodLabel}>Period</Text>
              </View>
              <View style={styles.periodLine} />
              <View style={styles.periodInfo}>
                <Text style={styles.subject}>{entry.subject}</Text>
                <Text style={styles.time}>
                  {formatTime(entry.startTime)} – {formatTime(entry.endTime)}
                </Text>
                {entry.teacherName ? <Text style={styles.teacher}>👩‍🏫 {entry.teacherName}</Text> : null}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  dayScrollView: { backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  dayRow: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, gap: Spacing.sm },
  dayBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.surfaceVariant,
  },
  dayBtnActive: { backgroundColor: Colors.primary },
  dayLabel: { ...Typography.body2, color: Colors.textSecondary, fontWeight: '600' },
  dayLabelActive: { color: Colors.white },
  content: { padding: Spacing.md },
  periodCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  periodNumber: {
    backgroundColor: Colors.primary,
    width: 56,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  periodNum: { ...Typography.h4, color: Colors.white },
  periodLabel: { ...Typography.overline, color: 'rgba(255,255,255,0.7)' },
  periodLine: { width: 3, height: '100%', backgroundColor: Colors.primaryLight, opacity: 0.3 },
  periodInfo: { flex: 1, padding: Spacing.md },
  subject: { ...Typography.h5, color: Colors.textPrimary, marginBottom: 4 },
  time: { ...Typography.body2, color: Colors.textSecondary },
  teacher: { ...Typography.caption, color: Colors.textTertiary, marginTop: 4 },
});
