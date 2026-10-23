import React, { useEffect, useMemo } from 'react';
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
import { format, parseISO } from 'date-fns';

import { studentService, ChildSummary } from '@api/services/studentService';
import { attendanceService } from '@api/services/attendanceService';
import { circularService } from '@api/services/circularService';
import { useAppSelector, useAppDispatch } from '@store/hooks';
import { setStudents, selectStudent } from '@store/slices/studentSlice';
import Card from '@components/common/Card';
import LoadingSpinner from '@components/common/LoadingSpinner';
import MonthlyAttendanceChart, {
  MonthBucket,
} from '@components/dashboard/MonthlyAttendanceChart';
import { Colors } from '@constants/colors';
import { Sizes } from '@constants/sizes';
import { formatCurrency, getInitials } from '@utils/formatters';
import { currentAcademicYear } from '@utils/dateUtils';
import { Circular } from '@app-types/index';

// ── Quick-action buttons (circular, soft-blue) ───────────────────────────────
const QUICK_ACTIONS = [
  { label: 'Attendance',    icon: 'calendar-check',      screen: 'Attendance'    },
  { label: 'Fee',           icon: 'credit-card-outline', screen: 'Fees'          },
  { label: 'Communication', icon: 'chat-outline',        screen: 'Circulars'     },
  { label: 'Updates',       icon: 'bullhorn-outline',    screen: 'Notifications' },
  { label: 'Assignments',   icon: 'book-open-variant',   screen: 'Homework'      },
  { label: 'Results',       icon: 'chart-box-outline',   screen: 'Results'       },
] as const;

const MORE_FEATURES = [
  { label: 'Homework',     icon: 'book-open-variant',   screen: 'Homework'           },
  { label: 'Classwork',    icon: 'pencil-box-outline',  screen: 'Classwork'          },
  { label: 'Results',      icon: 'chart-box-outline',   screen: 'Results'            },
  { label: 'Teachers',     icon: 'account-tie-outline', screen: 'ChildTeachers'      },
  { label: 'Announcements',icon: 'bullhorn-outline',    screen: 'ChildAnnouncements' },
  { label: 'Timetable',    icon: 'timetable',           screen: 'Timetable'          },
  { label: 'Library',      icon: 'library-outline',     screen: 'Library'            },
  { label: 'Bus',          icon: 'bus',                 screen: 'BusTracking'        },
  { label: 'Events',       icon: 'image-multiple-outline', screen: 'EventGallery'    },
  { label: 'Circulars',    icon: 'newspaper-variant-outline', screen: 'Circulars'    },
] as const;

const todayStr = () => format(new Date(), 'yyyy-MM-dd');

const DashboardScreen = () => {
  const insets     = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const dispatch   = useAppDispatch();
  const unread     = useAppSelector(s => s.notification.unreadCount);
  const { selectedStudent, students } = useAppSelector(s => s.student);

  const academicYear = currentAcademicYear();                 // "2025-2026"
  const yearStart    = `${academicYear.split('-')[0]}-04-01`;  // Apr 1 of start year
  const today        = todayStr();
  const studentId    = selectedStudent?.studentId;

  // ── Parent's children ──────────────────────────────────────────────────────
  const { data: childrenData, isLoading: childrenLoading } = useQuery<ChildSummary[]>({
    queryKey: ['my-children'],
    queryFn: () => studentService.getMyChildren(),
  });
  useEffect(() => {
    if (childrenData) dispatch(setStudents(childrenData));
  }, [childrenData, dispatch]);

  // ── School branding (welcome header) ───────────────────────────────────────
  const { data: profile } = useQuery({
    queryKey: ['me-profile'],
    queryFn: () => studentService.getMyProfile(),
  });
  const schoolName =
    (profile as any)?.schoolName ?? (profile as any)?.school?.name ?? 'Your School';
  const schoolCity =
    (profile as any)?.schoolCity ?? (profile as any)?.school?.city ?? undefined;

  // ── Child-scoped data (gated on a selected child) ──────────────────────────
  const { data: attendancePct } = useQuery({
    queryKey: ['att-pct', studentId, yearStart, today],
    queryFn: () => attendanceService.getAttendancePercentage(studentId!, yearStart, today),
    enabled: !!studentId,
  });

  const { data: attRecords } = useQuery({
    queryKey: ['att-records', studentId, yearStart, today],
    queryFn: () => attendanceService.getStudentAttendance(studentId!, yearStart, today),
    enabled: !!studentId,
  });

  const { data: fees } = useQuery({
    queryKey: ['child-fees', studentId, academicYear],
    queryFn: () => studentService.getChildFees(studentId!, academicYear),
    enabled: !!studentId,
  });

  const { data: homework } = useQuery({
    queryKey: ['child-homework', studentId, academicYear],
    queryFn: () => studentService.getChildHomework(studentId!, academicYear),
    enabled: !!studentId,
  });

  const { data: announcements } = useQuery({
    queryKey: ['child-announcements', studentId],
    queryFn: () => studentService.getChildAnnouncements(studentId!),
    enabled: !!studentId,
  });

  const { data: circularPage } = useQuery({
    queryKey: ['circulars'],
    queryFn: () => circularService.getCirculars(0, 8),
  });
  const circulars: Circular[] = circularPage?.content ?? [];

  // ── Derived snapshot ───────────────────────────────────────────────────────
  const outstandingFee = useMemo(() => {
    if (!fees) return 0;
    return fees.reduce((sum, f) => {
      if (f.status === 'PAID') return sum;
      const net = f.netAmount ?? f.amount - (f.discount ?? 0) + (f.fine ?? 0);
      const bal = f.balance ?? net - (f.paidAmount ?? 0);
      return sum + Math.max(0, bal);
    }, 0);
  }, [fees]);

  const todaysAssignments = useMemo(
    () => (homework ?? []).filter(h => (h.dueDate ?? '').slice(0, 10) === today).length,
    [homework, today],
  );

  const todaysUpdates = useMemo(
    () =>
      (announcements ?? []).filter(a => {
        const d = (a.date ?? a.createdAt ?? a.publishedAt ?? '') as string;
        return d.slice(0, 10) === today;
      }).length,
    [announcements, today],
  );

  const monthBuckets: MonthBucket[] = useMemo(() => {
    const map = new Map<string, MonthBucket>();
    (attRecords ?? []).forEach(r => {
      const raw = (r as any).attendanceDate ?? (r as any).date;
      if (!raw) return;
      let key: string;
      let label: string;
      try {
        const d = parseISO(raw);
        key = format(d, 'yyyy-MM');
        label = format(d, 'MMM');
      } catch {
        return;
      }
      if (!map.has(key)) map.set(key, { label, present: 0, absent: 0 });
      const b = map.get(key)!;
      if (r.status === 'PRESENT' || r.status === 'LATE') b.present++;
      else if (r.status === 'ABSENT') b.absent++;
    });
    return Array.from(map.values()).slice(-6);
  }, [attRecords]);

  if (childrenLoading) return <LoadingSpinner fullScreen message="Loading…" />;

  const childName = selectedStudent
    ? selectedStudent.fullName ?? `${selectedStudent.firstName} ${selectedStudent.lastName}`
    : '';

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 110 }]}>

        {/* ── Top bar ───────────────────────────────────────────────────── */}
        <View style={styles.topBar}>
          <View style={styles.logoCircle}>
            <Icon name="school-outline" size={22} color={Colors.primary} />
          </View>
          <View style={{ flex: 1 }} />
          <TouchableOpacity style={styles.iconBtn}>
            <Icon name="help-circle-outline" size={24} color={Colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => navigation.navigate('Notifications')}>
            <Icon name="bell-outline" size={24} color={Colors.textSecondary} />
            {unread > 0 && (
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeText}>{unread > 99 ? '99+' : unread}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.avatar}
            onPress={() => navigation.navigate('Profile')}>
            <Text style={styles.avatarText}>{childName ? getInitials(childName) : '👤'}</Text>
          </TouchableOpacity>
        </View>

        {/* ── Welcome card ──────────────────────────────────────────────── */}
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

        {/* ── Child switcher (only if >1 child) ─────────────────────────── */}
        {students.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.childRow}>
            {students.map(s => {
              const active = selectedStudent?.studentId === s.studentId;
              return (
                <TouchableOpacity
                  key={s.studentId}
                  onPress={() => dispatch(selectStudent(s))}
                  style={[styles.childChip, active && styles.childChipActive]}>
                  <Text style={[styles.childChipText, active && styles.childChipTextActive]}>
                    {s.firstName}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {/* ── Quick actions ─────────────────────────────────────────────── */}
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

        {/* ── Explore (all features) ────────────────────────────────────── */}
        <Card style={styles.listCard}>
          <Text style={styles.cardTitle}>Explore</Text>
          <View style={styles.grid}>
            {MORE_FEATURES.map(f => (
              <TouchableOpacity
                key={f.label}
                style={styles.gridItem}
                activeOpacity={0.8}
                onPress={() => navigation.navigate(f.screen as never)}>
                <View style={styles.gridIcon}>
                  <Icon name={f.icon} size={22} color={Colors.primary} />
                </View>
                <Text style={styles.gridLabel} numberOfLines={1}>{f.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* ── Notice (latest circular) ──────────────────────────────────── */}
        {circulars[0] && (
          <Card style={styles.noticeCard}>
            <View style={styles.noticeRow}>
              <View style={styles.noticeIcon}>
                <Icon name="bullhorn-outline" size={18} color={Colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.noticeTitle}>Notice</Text>
                <Text style={styles.noticeBody} numberOfLines={3}>
                  {circulars[0].content || circulars[0].title}
                </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Circulars')}>
                  <Text style={styles.noticeLink}>Open link</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Card>
        )}

        {/* ── Greeting + stat tiles ─────────────────────────────────────── */}
        <Card style={styles.overviewCard}>
          <Text style={styles.hello}>
            Hello, {selectedStudent?.firstName ?? 'there'}! 👋
          </Text>
          <Text style={styles.helloSub}>Here's a quick overview about today</Text>

          <View style={styles.tilesGrid}>
            <StatTile
              icon="calendar-check"
              bg={Colors.tileBlueBg}
              fg={Colors.tileBlueFg}
              value={attendancePct != null ? `${attendancePct.toFixed(2)}%` : '—'}
              label="Attendance Rate"
            />
            <StatTile
              icon="credit-card-outline"
              bg={Colors.tileAmberBg}
              fg={Colors.tileAmberFg}
              value={fees ? formatCurrency(outstandingFee) : '—'}
              label="Outstanding Fee"
            />
            <StatTile
              icon="book-open-variant"
              bg={Colors.tilePurpleBg}
              fg={Colors.tilePurpleFg}
              value={homework ? String(todaysAssignments) : '—'}
              label="Today's Assignments"
            />
            <StatTile
              icon="calendar-text"
              bg={Colors.tilePinkBg}
              fg={Colors.tilePinkFg}
              value={announcements ? String(todaysUpdates) : '—'}
              label="Today's Updates"
            />
          </View>
        </Card>

        {/* ── Circulars list ────────────────────────────────────────────── */}
        {circulars.length > 0 && (
          <Card style={styles.listCard}>
            <Text style={styles.listCount}>{circulars.length} circulars</Text>
            {circulars.map(c => (
              <TouchableOpacity
                key={c.id}
                style={styles.circularRow}
                onPress={() => navigation.navigate('Circulars')}>
                <View style={styles.dateChip}>
                  <Text style={styles.dateDay}>{safeDay(c.publishedDate)}</Text>
                  <Text style={styles.dateMon}>{safeMon(c.publishedDate)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.circularTitle} numberOfLines={1}>{c.title}</Text>
                  <View style={styles.categoryChip}>
                    <Text style={styles.categoryText}>{c.category || 'Circulars & Notices'}</Text>
                  </View>
                </View>
                <Icon name="chevron-right" size={22} color={Colors.textMuted} />
              </TouchableOpacity>
            ))}
          </Card>
        )}

        {/* ── Attendance overview ───────────────────────────────────────── */}
        {monthBuckets.length > 0 && (
          <Card style={styles.listCard}>
            <View style={styles.cardHeaderRow}>
              <View>
                <Text style={styles.cardTitle}>Attendance Overview</Text>
                <Text style={styles.cardSub}>Monthly breakdown — current year</Text>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('Attendance')}>
                <Text style={styles.viewAll}>View all →</Text>
              </TouchableOpacity>
            </View>
            <MonthlyAttendanceChart data={monthBuckets} />
          </Card>
        )}
      </ScrollView>
    </View>
  );
};

// ── Helpers ──────────────────────────────────────────────────────────────────
const safeDay = (d?: string) => {
  try { return format(parseISO(d!), 'd'); } catch { return '--'; }
};
const safeMon = (d?: string) => {
  try { return format(parseISO(d!), 'MMM').toUpperCase(); } catch { return ''; }
};

const StatTile = ({
  icon, bg, fg, value, label,
}: {
  icon: string; bg: string; fg: string; value: string; label: string;
}) => (
  <View style={[styles.tile, { backgroundColor: bg }]}>
    <View style={[styles.tileIcon, { backgroundColor: Colors.white }]}>
      <Icon name={icon} size={18} color={fg} />
    </View>
    <Text style={styles.tileValue}>{value}</Text>
    <Text style={styles.tileLabel}>{label}</Text>
  </View>
);

// ── Styles ───────────────────────────────────────────────────────────────────
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

  childRow: { gap: Sizes.sm, paddingVertical: 2 },
  childChip: {
    paddingHorizontal: Sizes.md, paddingVertical: 8, borderRadius: Sizes.radiusFull,
    backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border,
  },
  childChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  childChipText: { fontSize: Sizes.fontSm, fontWeight: '600', color: Colors.textSecondary },
  childChipTextActive: { color: Colors.white },

  actionsRow: { gap: Sizes.lg, paddingVertical: 2, paddingHorizontal: 2 },
  action: { alignItems: 'center', width: 68 },
  actionCircle: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.softBlueBg,
    alignItems: 'center', justifyContent: 'center', marginBottom: 6,
  },
  actionLabel: { fontSize: Sizes.fontXs, color: Colors.textPrimary, fontWeight: '600', textAlign: 'center' },

  noticeCard: { padding: Sizes.md },
  noticeRow: { flexDirection: 'row', gap: Sizes.sm },
  noticeIcon: {
    width: 34, height: 34, borderRadius: 17, backgroundColor: Colors.softBlueBg,
    alignItems: 'center', justifyContent: 'center',
  },
  noticeTitle: { fontSize: Sizes.fontMd, fontWeight: '700', color: Colors.textPrimary },
  noticeBody: { fontSize: Sizes.fontSm, color: Colors.textSecondary, marginTop: 2, lineHeight: 19 },
  noticeLink: { fontSize: Sizes.fontSm, color: Colors.primary, fontWeight: '600', marginTop: 6 },

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
  listCount: { fontSize: Sizes.fontSm, color: Colors.textMuted, marginBottom: Sizes.sm },
  circularRow: {
    flexDirection: 'row', alignItems: 'center', gap: Sizes.sm,
    paddingVertical: Sizes.sm, borderTopWidth: 1, borderTopColor: Colors.divider,
  },
  dateChip: { alignItems: 'center', width: 44 },
  dateDay: { fontSize: Sizes.fontLg, fontWeight: '800', color: Colors.textPrimary },
  dateMon: { fontSize: Sizes.fontXs, color: Colors.textMuted },
  circularTitle: { fontSize: Sizes.fontMd, fontWeight: '600', color: Colors.textPrimary },
  categoryChip: {
    alignSelf: 'flex-start', backgroundColor: Colors.chipBg, borderRadius: Sizes.radiusFull,
    paddingHorizontal: 10, paddingVertical: 3, marginTop: 4,
  },
  categoryText: { fontSize: Sizes.fontXs, color: Colors.chipFg, fontWeight: '600' },

  cardHeaderRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    marginBottom: Sizes.sm,
  },
  cardTitle: { fontSize: Sizes.fontLg, fontWeight: '800', color: Colors.textPrimary },
  cardSub: { fontSize: Sizes.fontXs, color: Colors.textMuted, marginTop: 2 },
  viewAll: { fontSize: Sizes.fontSm, color: Colors.primary, fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: Sizes.sm },
  gridItem: { width: '25%', alignItems: 'center', marginBottom: Sizes.md },
  gridIcon: { width: 48, height: 48, borderRadius: Sizes.radiusMd, backgroundColor: Colors.softBlueBg, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  gridLabel: { fontSize: Sizes.fontXs, color: Colors.textSecondary, fontWeight: '600' },
});

export default DashboardScreen;
