import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { timetableApi } from '../../api/timetable.api';
import { homeworkApi } from '../../api/homework.api';
import { QUERY_KEYS, CURRENT_ACADEMIC_YEAR, DAY_LABELS } from '../../constants';
import { useAuth } from '../../hooks/useAuth';
import { Card } from '../../components/common/Card';
import { Avatar } from '../../components/common/Avatar';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';
import { formatTime } from '../../utils/formatters';
import type { TimetableEntry } from '../../types';

const DAYS: Record<number, string> = { 1: 'MONDAY', 2: 'TUESDAY', 3: 'WEDNESDAY', 4: 'THURSDAY', 5: 'FRIDAY', 6: 'SATURDAY' };

const QUICK_ACTIONS = [
  { icon: '✅', label: 'Mark Attendance', screen: 'Attendance', color: Colors.success },
  { icon: '📝', label: 'Assign Homework', screen: 'Homework', color: Colors.primary },
  { icon: '📊', label: 'Upload Results', screen: 'ResultUpload', color: Colors.secondary },
  { icon: '📋', label: 'Circular', screen: 'Circulars', color: Colors.accent },
];

export function TeacherDashboardScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const todayName = DAYS[new Date().getDay()] ?? 'MONDAY';

  const { data: timetable, isLoading, refetch, isRefetching } = useQuery({
    queryKey: QUERY_KEYS.TIMETABLE_TEACHER(user?.id ?? 0),
    queryFn: () => timetableApi.getByTeacher(user!.id, CURRENT_ACADEMIC_YEAR),
    enabled: !!user?.id,
  });

  const todayClasses = (timetable ?? []).filter(t => t.dayOfWeek === todayName);

  if (isLoading) return <LoadingSpinner fullScreen />;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Avatar firstName={user?.firstName} lastName={user?.lastName} size={46} color={Colors.white} />
          <View style={styles.headerText}>
            <Text style={styles.greeting}>Good morning,</Text>
            <Text style={styles.userName}>{user?.firstName} {user?.lastName}</Text>
            <Text style={styles.role}>Teacher</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Notifications')} style={styles.notifBtn}>
          <Text style={styles.notifIcon}>🔔</Text>
        </TouchableOpacity>
      </View>

      {/* Today's Classes */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Today's Classes ({DAY_LABELS[todayName] ?? todayName})</Text>
        {todayClasses.length === 0 ? (
          <Card>
            <Text style={styles.noClass}>No classes scheduled for today 🎉</Text>
          </Card>
        ) : (
          todayClasses
            .sort((a, b) => a.periodNumber - b.periodNumber)
            .map((cls: TimetableEntry) => (
              <Card key={cls.id} style={styles.classCard}>
                <View style={styles.periodBadge}>
                  <Text style={styles.periodNum}>{cls.periodNumber}</Text>
                </View>
                <View style={styles.classInfo}>
                  <Text style={styles.subject}>{cls.subject}</Text>
                  <Text style={styles.classTime}>{formatTime(cls.startTime)} – {formatTime(cls.endTime)}</Text>
                </View>
                <TouchableOpacity
                  style={styles.markBtn}
                  onPress={() => navigation.navigate('Attendance', { sectionId: cls.sectionId })}
                >
                  <Text style={styles.markBtnText}>Mark</Text>
                </TouchableOpacity>
              </Card>
            ))
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          {QUICK_ACTIONS.map(a => (
            <TouchableOpacity
              key={a.label}
              style={styles.actionCard}
              onPress={() => navigation.navigate(a.screen)}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIcon, { backgroundColor: a.color + '18' }]}>
                <Text style={styles.actionEmoji}>{a.icon}</Text>
              </View>
              <Text style={styles.actionLabel}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { backgroundColor: Colors.secondary, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.md, paddingTop: Spacing.lg },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  headerText: { marginLeft: Spacing.sm },
  greeting: { ...Typography.caption, color: 'rgba(255,255,255,0.7)' },
  userName: { ...Typography.h5, color: Colors.white },
  role: { ...Typography.caption, color: 'rgba(255,255,255,0.6)' },
  notifBtn: { padding: Spacing.sm },
  notifIcon: { fontSize: 22 },
  section: { padding: Spacing.md },
  sectionTitle: { ...Typography.h5, color: Colors.textPrimary, marginBottom: Spacing.sm },
  classCard: { flexDirection: 'row', alignItems: 'center', marginBottom: 0 },
  periodBadge: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.secondary + '18', alignItems: 'center', justifyContent: 'center', marginRight: Spacing.sm },
  periodNum: { ...Typography.h5, color: Colors.secondary },
  classInfo: { flex: 1 },
  subject: { ...Typography.h5, color: Colors.textPrimary },
  classTime: { ...Typography.caption, color: Colors.textSecondary },
  markBtn: { backgroundColor: Colors.secondary + '18', paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.round },
  markBtnText: { ...Typography.caption, color: Colors.secondary, fontWeight: '700' },
  noClass: { ...Typography.body2, color: Colors.textSecondary, textAlign: 'center', paddingVertical: Spacing.sm },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  actionCard: { width: '48%', backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.md, alignItems: 'center', margin: '1%' },
  actionIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm },
  actionEmoji: { fontSize: 24 },
  actionLabel: { ...Typography.caption, color: Colors.textSecondary, textAlign: 'center', fontWeight: '600' },
});
