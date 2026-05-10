import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { studentService } from '@api/services/studentService';
import { useAppSelector, useAppDispatch } from '@store/hooks';
import { setStudents, selectStudent } from '@store/slices/studentSlice';
import Card from '@components/common/Card';
import LoadingSpinner from '@components/common/LoadingSpinner';
import { Colors } from '@constants/colors';
import { Sizes } from '@constants/sizes';
import { formatCurrency, getInitials } from '@utils/formatters';
import { Student } from '@app-types/index';

// â”€â”€ Feature menu items â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const MENU_ITEMS = [
  { label: 'Attendance',  icon: 'calendar-check',     color: '#4F46E5', screen: 'Attendance'   },
  { label: 'Homework',    icon: 'book-open-variant',  color: '#06B6D4', screen: 'Homework'     },
  { label: 'Classwork',   icon: 'pencil-box',         color: '#8B5CF6', screen: 'Classwork'    },
  { label: 'Timetable',   icon: 'timetable',          color: '#10B981', screen: 'Timetable'    },
  { label: 'Circulars',   icon: 'newspaper-variant',  color: '#F59E0B', screen: 'Circulars'    },
  { label: 'Events',      icon: 'image-multiple',     color: '#EF4444', screen: 'EventGallery' },
  { label: 'Results',     icon: 'chart-bar',          color: '#6366F1', screen: 'Results'      },
  { label: 'Fees',        icon: 'cash-multiple',      color: '#059669', screen: 'Fees'         },
  { label: 'Bus Track',   icon: 'bus-clock',          color: '#D97706', screen: 'BusTracking'  },
  { label: 'Library',     icon: 'library',            color: '#7C3AED', screen: 'Library'      },
] as const;

const DashboardScreen = () => {
  const insets     = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const dispatch   = useAppDispatch();
  const user       = useAppSelector(s => s.auth.user);
  const { selectedStudent, students } = useAppSelector(s => s.student);

  // Fetch my children on mount
  const { data: studentsData, isLoading: studentsLoading } = useQuery({
    queryKey: ['my-students'],
    queryFn: studentService.getMyStudents,
  });

  useEffect(() => {
    if (studentsData) dispatch(setStudents(studentsData));
  }, [studentsData, dispatch]);

  // Fetch dashboard stats
  const { data: stats } = useQuery({
    queryKey: ['dashboard'],
    queryFn: studentService.getDashboard,
  });

  if (studentsLoading) return <LoadingSpinner fullScreen message="Loading..." />;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* â”€â”€ Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <LinearGradient
        colors={Colors.gradientPrimary as [string, string]}
        style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greeting}>Good Morning ðŸ‘‹</Text>
            <Text style={styles.userName}>{user?.fullName}</Text>
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate('Notifications')}
            style={styles.notifBtn}>
            <Icon name="bell-outline" size={24} color={Colors.white} />
          </TouchableOpacity>
        </View>

        {/* Student switcher */}
        {students.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.studentRow}>
            {students.map(s => (
              <TouchableOpacity
                key={s.id}
                onPress={() => dispatch(selectStudent(s))}
                style={[
                  styles.studentChip,
                  selectedStudent?.id === s.id && styles.studentChipActive,
                ]}>
                <View style={styles.studentAvatar}>
                  <Text style={styles.studentAvatarText}>
                    {getInitials(`${s.firstName} ${s.lastName}`)}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.studentName,
                    selectedStudent?.id === s.id && styles.studentNameActive,
                  ]}>
                  {s.firstName}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 80 }]}>

        {/* â”€â”€ Quick stats â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        {stats && (
          <View style={styles.statsRow}>
            <StatCard
              icon="account-group"
              label="Students"
              value={String(stats.totalStudents)}
              color={Colors.primary}
            />
            <StatCard
              icon="cash-check"
              label="Fees Due"
              value={formatCurrency(stats.totalFeesPendingThisMonth)}
              color={Colors.danger}
            />
            <StatCard
              icon="book"
              label="Books"
              value={String(stats.booksIssued)}
              color={Colors.secondary}
            />
          </View>
        )}

        {/* â”€â”€ Menu grid â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <Text style={styles.sectionTitle}>Quick Access</Text>
        <View style={styles.menuGrid}>
          {MENU_ITEMS.map(item => (
            <TouchableOpacity
              key={item.screen}
              style={styles.menuItem}
              onPress={() => navigation.navigate(item.screen)}
              activeOpacity={0.75}>
              <View style={[styles.menuIcon, { backgroundColor: item.color + '18' }]}>
                <Icon name={item.icon} size={26} color={item.color} />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* â”€â”€ Selected student info â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        {selectedStudent && (
          <>
            <Text style={styles.sectionTitle}>Selected Child</Text>
            <Card style={styles.studentCard}>
              <View style={styles.studentCardRow}>
                <View style={styles.studentCardAvatar}>
                  <Text style={styles.studentCardInitials}>
                    {getInitials(`${selectedStudent.firstName} ${selectedStudent.lastName}`)}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.studentCardName}>
                    {selectedStudent.firstName} {selectedStudent.lastName}
                  </Text>
                  <Text style={styles.studentCardSub}>
                    {selectedStudent.className ?? 'Class N/A'}
                    {selectedStudent.sectionName ? ` Â· ${selectedStudent.sectionName}` : ''}
                  </Text>
                  <Text style={styles.studentCardSub}>
                    Admission: {selectedStudent.admissionNumber ?? 'N/A'}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => navigation.navigate('Attendance')}
                  style={styles.viewBtn}>
                  <Text style={styles.viewBtnText}>View</Text>
                </TouchableOpacity>
              </View>
            </Card>
          </>
        )}
      </ScrollView>
    </View>
  );
};

// â”€â”€ Sub-components â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const StatCard = ({
  icon,
  label,
  value,
  color,
}: {
  icon: string;
  label: string;
  value: string;
  color: string;
}) => (
  <Card style={styles.statCard}>
    <Icon name={icon} size={22} color={color} />
    <Text style={[styles.statValue, { color }]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </Card>
);

// â”€â”€ Styles â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: Sizes.md, paddingBottom: Sizes.lg },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: Sizes.md,
  },
  greeting: { fontSize: Sizes.fontSm, color: 'rgba(255,255,255,0.8)' },
  userName: { fontSize: Sizes.fontXl, fontWeight: '700', color: Colors.white },
  notifBtn: { padding: 8 },
  studentRow: { paddingTop: Sizes.md, gap: Sizes.sm },
  studentChip: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: Sizes.radiusLg,
    padding: Sizes.sm,
    minWidth: 72,
  },
  studentChipActive: { backgroundColor: 'rgba(255,255,255,0.3)' },
  studentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  studentAvatarText: { fontSize: 14, fontWeight: '700', color: Colors.primary },
  studentName: { fontSize: 11, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },
  studentNameActive: { color: Colors.white, fontWeight: '700' },
  scroll: { padding: Sizes.md },
  statsRow: { flexDirection: 'row', gap: Sizes.sm, marginBottom: Sizes.md },
  statCard: { flex: 1, alignItems: 'center', padding: Sizes.md },
  statValue: { fontSize: Sizes.fontLg, fontWeight: '700', marginTop: 4 },
  statLabel: { fontSize: Sizes.fontXs, color: Colors.textMuted, marginTop: 2 },
  sectionTitle: {
    fontSize: Sizes.fontLg,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Sizes.sm,
    marginTop: Sizes.sm,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Sizes.sm,
    marginBottom: Sizes.md,
  },
  menuItem: {
    width: (Sizes.screenWidth - Sizes.md * 2 - Sizes.sm * 4) / 5,
    alignItems: 'center',
  },
  menuIcon: {
    width: 52,
    height: 52,
    borderRadius: Sizes.radiusMd,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  menuLabel: { fontSize: 10, color: Colors.textSecondary, fontWeight: '600', textAlign: 'center' },
  studentCard: { marginBottom: Sizes.md },
  studentCardRow: { flexDirection: 'row', alignItems: 'center', gap: Sizes.md },
  studentCardAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary + '18',
    alignItems: 'center',
    justifyContent: 'center',
  },
  studentCardInitials: { fontSize: 20, fontWeight: '700', color: Colors.primary },
  studentCardName: { fontSize: Sizes.fontMd, fontWeight: '700', color: Colors.textPrimary },
  studentCardSub: { fontSize: Sizes.fontXs, color: Colors.textMuted, marginTop: 2 },
  viewBtn: {
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: Sizes.sm,
    paddingVertical: 6,
    borderRadius: Sizes.radiusSm,
  },
  viewBtnText: { fontSize: Sizes.fontSm, fontWeight: '600', color: Colors.primary },
});

export default DashboardScreen;
