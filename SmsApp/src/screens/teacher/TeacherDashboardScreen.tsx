import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';

import { teacherService } from '@api/services/teacherService';
import { studentService } from '@api/services/studentService';
import { useAppSelector } from '@store/hooks';
import Card from '@components/common/Card';
import LoadingSpinner from '@components/common/LoadingSpinner';
import { Colors } from '@constants/colors';
import { Sizes } from '@constants/sizes';
import { getInitials } from '@utils/formatters';
import { currentAcademicYear } from '@utils/dateUtils';

const QUICK_ACTIONS = [
  { label: 'Mark Attendance', icon: 'calendar-check',    screen: 'MarkAttendance' },
  { label: 'Send Notice',     icon: 'bullhorn-outline',  screen: 'Notices'        },
  { label: 'Exam Results',    icon: 'chart-box-outline', screen: 'Exams'          },
  { label: 'Homework',        icon: 'book-edit-outline', screen: 'Homework'       },
] as const;

const MORE_TOOLS = [
  { label: 'Classwork',    icon: 'pencil-box-outline',      screen: 'Classwork'   },
  { label: 'My Students',  icon: 'account-group-outline',   screen: 'Students'    },
  { label: 'Submissions',  icon: 'file-check-outline',      screen: 'Submissions' },
  { label: 'Lesson Plans', icon: 'clipboard-text-outline',  screen: 'LessonPlans' },
  { label: 'Timetable',    icon: 'timetable',               screen: 'Timetable'   },
  { label: 'Circulars',    icon: 'newspaper-variant-outline', screen: 'Circulars' },
  { label: 'Inbox',        icon: 'bell-outline',            screen: 'Inbox'       },
] as const;

const TeacherDashboardScreen = () => {
  const insets     = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const user       = useAppSelector(s => s.auth.user);
  const unread     = useAppSelector(s => s.notification.unreadCount);
  const academicYear = currentAcademicYear();

  const { data: profile } = useQuery({
    queryKey: ['me-profile'],
    queryFn: () => studentService.getMyProfile(),
  });
  const schoolName =
    (profile as any)?.schoolName ?? (profile as any)?.school?.name ?? 'Your School';
  const schoolCity =
    (profile as any)?.schoolCity ?? (profile as any)?.school?.city ?? undefined;

  const { data: classSections, isLoading: csLoading } = useQuery({
    queryKey: ['teacher-class-sections', academicYear],
    queryFn: () => teacherService.getMyClassSections(academicYear),
  });

  const { data: assignments } = useQuery({
    queryKey: ['teacher-assignments', academicYear],
    queryFn: () => teacherService.getMyAssignments(academicYear),
  });

  const classCount    = classSections?.length ?? 0;
  const subjectCount  = new Set((assignments ?? []).map(a => a.subjectId ?? a.subjectName)).size;
  const sectionCount  = new Set((assignments ?? []).map(a => a.sectionId)).size;
  const studentCount  = (classSections ?? []).reduce((s, c) => s + (c.studentCount ?? 0), 0);

  const firstName = (user?.fullName ?? 'Teacher').split(' ')[0];

  if (csLoading) return <LoadingSpinner fullScreen message="Loading…" />;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 110 }]}>

        {/* Top bar */}
        <View style={styles.topBar}>
          <View style={styles.logoCircle}>
            <Icon name="school-outline" size={22} color={Colors.primary} />
          </View>
          <View style={{ flex: 1 }} />
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('Notices')}>
            <Icon name="bell-outline" size={24} color={Colors.textSecondary} />
            {unread > 0 && (
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeText}>{unread > 99 ? '99+' : unread}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.avatar} onPress={() => navigation.navigate('Profile')}>
            <Text style={styles.avatarText}>{getInitials(user?.fullName ?? 'T')}</Text>
          </TouchableOpacity>
        </View>

        {/* Welcome */}
        <Card style={styles.welcomeCard}>
          <Text style={styles.welcomeKicker}>Welcome to</Text>
          <Text style={styles.welcomeSchool}>{schoolName}</Text>
          {schoolCity ? (
            <View style={styles.locationRow}>
              <Icon name="map-marker-outline" size={15} color={Colors.textMuted} />
              <Text style={styles.locationText}>{schoolCity}</Text>
            </View>
          ) : null}
        </Card>

        {/* Quick actions */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.actionsRow}>
          {QUICK_ACTIONS.map(a => (
            <TouchableOpacity
              key={a.label}
              style={styles.action}
              activeOpacity={0.8}
              onPress={() => navigation.navigate(a.screen as never)}>
              <View style={styles.actionCircle}>
                <Icon name={a.icon} size={24} color={Colors.primary} />
              </View>
              <Text style={styles.actionLabel}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Greeting + stat tiles */}
        <Card style={styles.overviewCard}>
          <Text style={styles.hello}>Hello, {firstName}! 👋</Text>
          <Text style={styles.helloSub}>Here's your teaching overview</Text>
          <View style={styles.tilesGrid}>
            <StatTile icon="google-classroom" bg={Colors.tileBlueBg}   fg={Colors.tileBlueFg}   value={String(classCount)}   label="My Classes" />
            <StatTile icon="book-outline"      bg={Colors.tileAmberBg}  fg={Colors.tileAmberFg}  value={String(subjectCount)} label="Subjects" />
            <StatTile icon="view-grid-outline" bg={Colors.tilePurpleBg} fg={Colors.tilePurpleFg} value={String(sectionCount)} label="Sections" />
            <StatTile icon="account-group-outline" bg={Colors.tilePinkBg} fg={Colors.tilePinkFg} value={String(studentCount)} label="Students" />
          </View>
        </Card>

        {/* More tools */}
        <Card style={styles.listCard}>
          <Text style={styles.cardTitle}>More Tools</Text>
          <View style={styles.grid}>
            {MORE_TOOLS.map(t => (
              <TouchableOpacity key={t.label} style={styles.gridItem} activeOpacity={0.8}
                onPress={() => navigation.navigate(t.screen as never)}>
                <View style={styles.gridIcon}><Icon name={t.icon} size={22} color={Colors.primary} /></View>
                <Text style={styles.gridLabel} numberOfLines={1}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* My classes */}
        {(classSections ?? []).length > 0 && (
          <Card style={styles.listCard}>
            <Text style={styles.cardTitle}>My Classes</Text>
            {(classSections ?? []).map(c => (
              <View key={c.sectionId} style={styles.classRow}>
                <View style={styles.classIcon}>
                  <Icon name="google-classroom" size={20} color={Colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.className}>
                    {c.className ?? 'Class'}{c.sectionName ? ` · ${c.sectionName}` : ''}
                  </Text>
                  {c.studentCount != null && (
                    <Text style={styles.classSub}>{c.studentCount} students</Text>
                  )}
                </View>
                <TouchableOpacity
                  style={styles.markBtn}
                  onPress={() => navigation.navigate('MarkAttendance', { sectionId: c.sectionId })}>
                  <Text style={styles.markBtnText}>Attendance</Text>
                </TouchableOpacity>
              </View>
            ))}
          </Card>
        )}
      </ScrollView>
    </View>
  );
};

const StatTile = ({
  icon, bg, fg, value, label,
}: { icon: string; bg: string; fg: string; value: string; label: string }) => (
  <View style={[styles.tile, { backgroundColor: bg }]}>
    <View style={[styles.tileIcon, { backgroundColor: Colors.white }]}>
      <Icon name={icon} size={18} color={fg} />
    </View>
    <Text style={styles.tileValue}>{value}</Text>
    <Text style={styles.tileLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Sizes.md, gap: Sizes.md },

  topBar: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  logoCircle: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.softBlueBg,
    alignItems: 'center', justifyContent: 'center',
  },
  iconBtn: { padding: 6 },
  bellBadge: {
    position: 'absolute', top: 0, right: 0, backgroundColor: Colors.danger,
    borderRadius: 9, minWidth: 16, height: 16, alignItems: 'center',
    justifyContent: 'center', paddingHorizontal: 3,
  },
  bellBadgeText: { color: Colors.white, fontSize: 8, fontWeight: '700' },
  avatar: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.softBlueBg,
    alignItems: 'center', justifyContent: 'center', marginLeft: 4,
    borderWidth: 2, borderColor: Colors.primaryLight,
  },
  avatarText: { fontSize: 14, fontWeight: '700', color: Colors.primary },

  welcomeCard: { padding: Sizes.lg },
  welcomeKicker: { fontSize: Sizes.fontSm, color: Colors.textMuted },
  welcomeSchool: { fontSize: Sizes.fontXxl, fontWeight: '800', color: Colors.textPrimary, marginTop: 2 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  locationText: { fontSize: Sizes.fontSm, color: Colors.textMuted },

  actionsRow: { gap: Sizes.lg, paddingVertical: 2, paddingHorizontal: 2 },
  action: { alignItems: 'center', width: 76 },
  actionCircle: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.softBlueBg,
    alignItems: 'center', justifyContent: 'center', marginBottom: 6,
  },
  actionLabel: { fontSize: Sizes.fontXs, color: Colors.textPrimary, fontWeight: '600', textAlign: 'center' },

  overviewCard: { padding: Sizes.lg },
  hello: { fontSize: Sizes.fontXl, fontWeight: '800', color: Colors.textPrimary },
  helloSub: { fontSize: Sizes.fontSm, color: Colors.textMuted, marginTop: 2, marginBottom: Sizes.md },
  tilesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Sizes.sm },
  tile: {
    width: '48%', borderRadius: Sizes.radiusLg, padding: Sizes.md, minHeight: 92,
    justifyContent: 'center',
  },
  tileIcon: {
    width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
  },
  tileValue: { fontSize: Sizes.fontXl, fontWeight: '800', color: Colors.textPrimary },
  tileLabel: { fontSize: Sizes.fontXs, color: Colors.textSecondary, marginTop: 2 },

  listCard: { padding: Sizes.md },
  cardTitle: { fontSize: Sizes.fontLg, fontWeight: '800', color: Colors.textPrimary, marginBottom: Sizes.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  gridItem: { width: '25%', alignItems: 'center', marginBottom: Sizes.md },
  gridIcon: { width: 48, height: 48, borderRadius: Sizes.radiusMd, backgroundColor: Colors.softBlueBg, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  gridLabel: { fontSize: Sizes.fontXs, color: Colors.textSecondary, fontWeight: '600' },
  classRow: {
    flexDirection: 'row', alignItems: 'center', gap: Sizes.sm,
    paddingVertical: Sizes.sm, borderTopWidth: 1, borderTopColor: Colors.divider,
  },
  classIcon: {
    width: 38, height: 38, borderRadius: 12, backgroundColor: Colors.softBlueBg,
    alignItems: 'center', justifyContent: 'center',
  },
  className: { fontSize: Sizes.fontMd, fontWeight: '700', color: Colors.textPrimary },
  classSub: { fontSize: Sizes.fontXs, color: Colors.textMuted, marginTop: 2 },
  markBtn: {
    backgroundColor: Colors.primary, borderRadius: Sizes.radiusFull,
    paddingHorizontal: Sizes.md, paddingVertical: 8,
  },
  markBtnText: { fontSize: Sizes.fontXs, fontWeight: '700', color: Colors.white },
});

export default TeacherDashboardScreen;
