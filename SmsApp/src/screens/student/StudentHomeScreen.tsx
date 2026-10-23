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
import { format, parseISO } from 'date-fns';

import { studentPortalService } from '@api/services/studentPortalService';
import { useAppSelector } from '@store/hooks';
import Card from '@components/common/Card';
import LoadingSpinner from '@components/common/LoadingSpinner';
import MonthlyAttendanceChart, { MonthBucket } from '@components/dashboard/MonthlyAttendanceChart';
import { Colors } from '@constants/colors';
import { Sizes } from '@constants/sizes';
import { formatCurrency, getInitials } from '@utils/formatters';

const QUICK_ACTIONS = [
  { label: 'Attendance',  icon: 'calendar-check',    screen: 'Attendance' },
  { label: 'Fee',         icon: 'credit-card-outline', screen: 'Fees'      },
  { label: 'Updates',     icon: 'bullhorn-outline',  screen: 'Updates'     },
  { label: 'Assignments', icon: 'book-open-variant', screen: 'StudentAssignments' },
  { label: 'Results',     icon: 'chart-box-outline', screen: 'StudentResults' },
] as const;

const StudentHomeScreen = () => {
  const insets     = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const unread     = useAppSelector(s => s.notification.unreadCount);

  const { data: dash, isLoading } = useQuery({
    queryKey: ['student-dashboard'],
    queryFn: () => studentPortalService.getDashboard(),
  });
  const { data: circulars } = useQuery({
    queryKey: ['student-circulars'],
    queryFn: () => studentPortalService.getCirculars(),
  });
  const { data: attendance } = useQuery({
    queryKey: ['student-attendance'],
    queryFn: () => studentPortalService.getAttendance(),
  });

  const monthBuckets: MonthBucket[] = (attendance?.months ?? [])
    .slice(-6)
    .map(m => ({ label: m.label, present: m.present, absent: m.absent }));

  if (isLoading) return <LoadingSpinner fullScreen message="Loading…" />;

  const firstName = (dash?.studentName ?? 'there').split(' ')[0];

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
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('Updates')}>
            <Icon name="bell-outline" size={24} color={Colors.textSecondary} />
            {unread > 0 && (
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeText}>{unread > 99 ? '99+' : unread}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.avatar} onPress={() => navigation.navigate('Profile')}>
            <Text style={styles.avatarText}>{getInitials(dash?.studentName ?? 'S')}</Text>
          </TouchableOpacity>
        </View>

        {/* Welcome */}
        <Card style={styles.welcomeCard}>
          <Text style={styles.welcomeKicker}>Welcome to</Text>
          <Text style={styles.welcomeSchool}>{dash?.schoolName ?? 'Your School'}</Text>
          {(dash?.className || dash?.sectionName) && (
            <View style={styles.locationRow}>
              <Icon name="google-classroom" size={15} color={Colors.textMuted} />
              <Text style={styles.locationText}>
                {dash?.className}{dash?.sectionName ? ` · ${dash?.sectionName}` : ''}
              </Text>
            </View>
          )}
        </Card>

        {/* Quick actions */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.actionsRow}>
          {QUICK_ACTIONS.map(a => (
            <TouchableOpacity key={a.label} style={styles.action} activeOpacity={0.8}
              onPress={() => navigation.navigate(a.screen as never)}>
              <View style={styles.actionCircle}>
                <Icon name={a.icon} size={24} color={Colors.primary} />
              </View>
              <Text style={styles.actionLabel}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Notice */}
        {circulars && circulars[0] && (
          <Card style={styles.noticeCard}>
            <View style={styles.noticeRow}>
              <View style={styles.noticeIcon}>
                <Icon name="bullhorn-outline" size={18} color={Colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.noticeTitle}>Notice</Text>
                <Text style={styles.noticeBody} numberOfLines={3}>
                  {circulars[0].body || circulars[0].title}
                </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Updates')}>
                  <Text style={styles.noticeLink}>Open link</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Card>
        )}

        {/* Greeting + tiles */}
        <Card style={styles.overviewCard}>
          <Text style={styles.hello}>Hello, {firstName}! 👋</Text>
          <Text style={styles.helloSub}>Here's a quick overview about today</Text>
          <View style={styles.tilesGrid}>
            <StatTile icon="calendar-check" bg={Colors.tileBlueBg} fg={Colors.tileBlueFg}
              value={dash ? `${dash.attendanceRate.toFixed(2)}%` : '—'} label="Attendance Rate" />
            <StatTile icon="credit-card-outline" bg={Colors.tileAmberBg} fg={Colors.tileAmberFg}
              value={dash ? formatCurrency(dash.outstandingFee) : '—'} label="Outstanding Fee" />
            <StatTile icon="book-open-variant" bg={Colors.tilePurpleBg} fg={Colors.tilePurpleFg}
              value={dash ? String(dash.todayAssignments) : '—'} label="Today's Assignments" />
            <StatTile icon="calendar-text" bg={Colors.tilePinkBg} fg={Colors.tilePinkFg}
              value={dash ? String(dash.todayUpdates) : '—'} label="Today's Updates" />
          </View>
        </Card>

        {/* Circulars list */}
        {circulars && circulars.length > 0 && (
          <Card style={styles.listCard}>
            <Text style={styles.listCount}>{circulars.length} circulars</Text>
            {circulars.slice(0, 8).map(c => (
              <TouchableOpacity key={c.id} style={styles.circularRow} onPress={() => navigation.navigate('Updates')}>
                <View style={styles.dateChip}>
                  <Text style={styles.dateDay}>{safeDay(c.date)}</Text>
                  <Text style={styles.dateMon}>{safeMon(c.date)}</Text>
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

        {/* Attendance overview */}
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

const safeDay = (d?: string) => { try { return format(parseISO(d!), 'd'); } catch { return '--'; } };
const safeMon = (d?: string) => { try { return format(parseISO(d!), 'MMM').toUpperCase(); } catch { return ''; } };

const StatTile = ({ icon, bg, fg, value, label }: { icon: string; bg: string; fg: string; value: string; label: string }) => (
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
  logoCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.softBlueBg, alignItems: 'center', justifyContent: 'center' },
  iconBtn: { padding: 6 },
  bellBadge: { position: 'absolute', top: 0, right: 0, backgroundColor: Colors.danger, borderRadius: 9, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  bellBadgeText: { color: Colors.white, fontSize: 8, fontWeight: '700' },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.softBlueBg, alignItems: 'center', justifyContent: 'center', marginLeft: 4, borderWidth: 2, borderColor: Colors.primaryLight },
  avatarText: { fontSize: 14, fontWeight: '700', color: Colors.primary },
  welcomeCard: { padding: Sizes.lg },
  welcomeKicker: { fontSize: Sizes.fontSm, color: Colors.textMuted },
  welcomeSchool: { fontSize: Sizes.fontXxl, fontWeight: '800', color: Colors.textPrimary, marginTop: 2 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  locationText: { fontSize: Sizes.fontSm, color: Colors.textMuted },
  actionsRow: { gap: Sizes.lg, paddingVertical: 2, paddingHorizontal: 2 },
  action: { alignItems: 'center', width: 72 },
  actionCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.softBlueBg, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  actionLabel: { fontSize: Sizes.fontXs, color: Colors.textPrimary, fontWeight: '600', textAlign: 'center' },
  noticeCard: { padding: Sizes.md },
  noticeRow: { flexDirection: 'row', gap: Sizes.sm },
  noticeIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: Colors.softBlueBg, alignItems: 'center', justifyContent: 'center' },
  noticeTitle: { fontSize: Sizes.fontMd, fontWeight: '700', color: Colors.textPrimary },
  noticeBody: { fontSize: Sizes.fontSm, color: Colors.textSecondary, marginTop: 2, lineHeight: 19 },
  noticeLink: { fontSize: Sizes.fontSm, color: Colors.primary, fontWeight: '600', marginTop: 6 },
  overviewCard: { padding: Sizes.lg },
  hello: { fontSize: Sizes.fontXl, fontWeight: '800', color: Colors.textPrimary },
  helloSub: { fontSize: Sizes.fontSm, color: Colors.textMuted, marginTop: 2, marginBottom: Sizes.md },
  tilesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Sizes.sm },
  tile: { width: '48%', borderRadius: Sizes.radiusLg, padding: Sizes.md, minHeight: 92, justifyContent: 'center' },
  tileIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  tileValue: { fontSize: Sizes.fontXl, fontWeight: '800', color: Colors.textPrimary },
  tileLabel: { fontSize: Sizes.fontXs, color: Colors.textSecondary, marginTop: 2 },
  listCard: { padding: Sizes.md },
  listCount: { fontSize: Sizes.fontSm, color: Colors.textMuted, marginBottom: Sizes.sm },
  circularRow: { flexDirection: 'row', alignItems: 'center', gap: Sizes.sm, paddingVertical: Sizes.sm, borderTopWidth: 1, borderTopColor: Colors.divider },
  dateChip: { alignItems: 'center', width: 44 },
  dateDay: { fontSize: Sizes.fontLg, fontWeight: '800', color: Colors.textPrimary },
  dateMon: { fontSize: Sizes.fontXs, color: Colors.textMuted },
  circularTitle: { fontSize: Sizes.fontMd, fontWeight: '600', color: Colors.textPrimary },
  categoryChip: { alignSelf: 'flex-start', backgroundColor: Colors.chipBg, borderRadius: Sizes.radiusFull, paddingHorizontal: 10, paddingVertical: 3, marginTop: 4 },
  categoryText: { fontSize: Sizes.fontXs, color: Colors.chipFg, fontWeight: '600' },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Sizes.sm },
  cardTitle: { fontSize: Sizes.fontLg, fontWeight: '800', color: Colors.textPrimary },
  cardSub: { fontSize: Sizes.fontXs, color: Colors.textMuted, marginTop: 2 },
  viewAll: { fontSize: Sizes.fontSm, color: Colors.primary, fontWeight: '600' },
});

export default StudentHomeScreen;
