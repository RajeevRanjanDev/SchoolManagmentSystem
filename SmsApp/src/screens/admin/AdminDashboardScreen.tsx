import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';

import { adminService } from '@api/services/adminService';
import { studentService } from '@api/services/studentService';
import { useAppSelector } from '@store/hooks';
import Card from '@components/common/Card';
import LoadingSpinner from '@components/common/LoadingSpinner';
import { Colors } from '@constants/colors';
import { Sizes } from '@constants/sizes';
import { formatCurrency, getInitials } from '@utils/formatters';

const QUICK_ACTIONS = [
  { label: 'Students',  icon: 'account-school-outline', screen: 'Students'  },
  { label: 'Fees',      icon: 'credit-card-outline',    screen: 'Fees'      },
  { label: 'Broadcast', icon: 'bullhorn-outline',       screen: 'Broadcast' },
  { label: 'Teachers',  icon: 'account-tie-outline',    screen: 'Teachers'  },
] as const;

const MORE = [
  { label: 'Teachers',   icon: 'account-tie-outline',  screen: 'Teachers'     },
  { label: 'Classes',    icon: 'google-classroom',     screen: 'Classes'      },
  { label: 'Subjects',   icon: 'book-outline',         screen: 'Subjects'     },
  { label: 'Fee Plans',  icon: 'file-document-outline',screen: 'FeeTemplates' },
  { label: 'Attendance', icon: 'calendar-check-outline', screen: 'Attendance' },
  { label: 'Library',    icon: 'library-outline',      screen: 'Library'      },
  { label: 'Circulars',  icon: 'newspaper-variant-outline', screen: 'Circulars' },
  { label: 'Events',     icon: 'calendar-star',        screen: 'Events'       },
  { label: 'New Student',icon: 'account-plus-outline', screen: 'AdmissionWizard' },
] as const;

const AdminDashboardScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const user = useAppSelector(s => s.auth.user);

  const { data: profile } = useQuery({ queryKey: ['me-profile'], queryFn: () => studentService.getMyProfile() });
  const schoolName = (profile as any)?.schoolName ?? (profile as any)?.school?.name ?? 'Your School';

  const { data: stats, isLoading } = useQuery({ queryKey: ['admin-dashboard'], queryFn: () => adminService.getDashboard() });

  if (isLoading) return <LoadingSpinner fullScreen message="Loading…" />;

  const firstName = (user?.fullName ?? 'Admin').split(' ')[0];

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 110 }]}>
        <View style={styles.topBar}>
          <View style={styles.logoCircle}><Icon name="shield-account-outline" size={22} color={Colors.primary} /></View>
          <View style={{ flex: 1 }} />
          <TouchableOpacity style={styles.avatar} onPress={() => navigation.navigate('Profile')}>
            <Text style={styles.avatarText}>{getInitials(user?.fullName ?? 'A')}</Text>
          </TouchableOpacity>
        </View>

        <Card style={styles.welcomeCard}>
          <Text style={styles.welcomeKicker}>Admin Console</Text>
          <Text style={styles.welcomeSchool}>{schoolName}</Text>
        </Card>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.actionsRow}>
          {QUICK_ACTIONS.map(a => (
            <TouchableOpacity key={a.label} style={styles.action} activeOpacity={0.8} onPress={() => navigation.navigate(a.screen as never)}>
              <View style={styles.actionCircle}><Icon name={a.icon} size={24} color={Colors.primary} /></View>
              <Text style={styles.actionLabel}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Card style={styles.overviewCard}>
          <Text style={styles.hello}>Hello, {firstName}! 👋</Text>
          <Text style={styles.helloSub}>School snapshot</Text>
          <View style={styles.tilesGrid}>
            <Tile icon="account-school" bg={Colors.tileBlueBg} fg={Colors.tileBlueFg} value={String(stats?.totalStudents ?? 0)} label="Students" />
            <Tile icon="account-tie" bg={Colors.tilePurpleBg} fg={Colors.tilePurpleFg} value={String(stats?.totalTeachers ?? 0)} label="Teachers" />
            <Tile icon="credit-card-outline" bg={Colors.tileAmberBg} fg={Colors.tileAmberFg} value={formatCurrency(stats?.pendingFees ?? 0)} label="Pending Fees" />
            <Tile icon="calendar-check" bg={Colors.tilePinkBg} fg={Colors.tilePinkFg} value={String(stats?.presentToday ?? 0)} label="Present Today" />
          </View>
        </Card>

        <Card style={styles.listCard}>
          <Text style={styles.cardTitle}>Manage</Text>
          <View style={styles.grid}>
            {MORE.map(m => (
              <TouchableOpacity key={m.label} style={styles.gridItem} activeOpacity={0.8} onPress={() => navigation.navigate(m.screen as never)}>
                <View style={styles.gridIcon}><Icon name={m.icon} size={22} color={Colors.primary} /></View>
                <Text style={styles.gridLabel} numberOfLines={1}>{m.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>
      </ScrollView>
    </View>
  );
};

const Tile = ({ icon, bg, fg, value, label }: { icon: string; bg: string; fg: string; value: string; label: string }) => (
  <View style={[styles.tile, { backgroundColor: bg }]}>
    <View style={[styles.tileIcon, { backgroundColor: Colors.white }]}><Icon name={icon} size={18} color={fg} /></View>
    <Text style={styles.tileValue}>{value}</Text>
    <Text style={styles.tileLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Sizes.md, gap: Sizes.md },
  topBar: { flexDirection: 'row', alignItems: 'center' },
  logoCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.softBlueBg, alignItems: 'center', justifyContent: 'center' },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.softBlueBg, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.primaryLight },
  avatarText: { fontSize: 14, fontWeight: '700', color: Colors.primary },
  welcomeCard: { padding: Sizes.lg },
  welcomeKicker: { fontSize: Sizes.fontSm, color: Colors.textMuted },
  welcomeSchool: { fontSize: Sizes.fontXxl, fontWeight: '800', color: Colors.textPrimary, marginTop: 2 },
  actionsRow: { gap: Sizes.lg, paddingVertical: 2, paddingHorizontal: 2 },
  action: { alignItems: 'center', width: 72 },
  actionCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.softBlueBg, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  actionLabel: { fontSize: Sizes.fontXs, color: Colors.textPrimary, fontWeight: '600', textAlign: 'center' },
  overviewCard: { padding: Sizes.lg },
  hello: { fontSize: Sizes.fontXl, fontWeight: '800', color: Colors.textPrimary },
  helloSub: { fontSize: Sizes.fontSm, color: Colors.textMuted, marginTop: 2, marginBottom: Sizes.md },
  tilesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Sizes.sm },
  tile: { width: '48%', borderRadius: Sizes.radiusLg, padding: Sizes.md, minHeight: 92, justifyContent: 'center' },
  tileIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  tileValue: { fontSize: Sizes.fontXl, fontWeight: '800', color: Colors.textPrimary },
  tileLabel: { fontSize: Sizes.fontXs, color: Colors.textSecondary, marginTop: 2 },
  listCard: { padding: Sizes.md },
  cardTitle: { fontSize: Sizes.fontLg, fontWeight: '800', color: Colors.textPrimary, marginBottom: Sizes.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  gridItem: { width: '25%', alignItems: 'center', marginBottom: Sizes.md },
  gridIcon: { width: 48, height: 48, borderRadius: Sizes.radiusMd, backgroundColor: Colors.softBlueBg, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  gridLabel: { fontSize: Sizes.fontXs, color: Colors.textSecondary, fontWeight: '600' },
});

export default AdminDashboardScreen;
