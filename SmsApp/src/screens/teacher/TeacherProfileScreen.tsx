import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useQuery } from '@tanstack/react-query';

import { useAppDispatch, useAppSelector } from '@store/hooks';
import { logoutThunk } from '@store/slices/authSlice';
import { teacherService } from '@api/services/teacherService';
import Card from '@components/common/Card';
import { Colors } from '@constants/colors';
import { Sizes } from '@constants/sizes';
import { getInitials } from '@utils/formatters';
import { currentAcademicYear } from '@utils/dateUtils';

const TeacherProfileScreen = () => {
  const insets   = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const user     = useAppSelector(s => s.auth.user);
  const academicYear = currentAcademicYear();

  const { data: assignments } = useQuery({
    queryKey: ['teacher-assignments', academicYear],
    queryFn: () => teacherService.getMyAssignments(academicYear),
  });

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => { dispatch(logoutThunk()); } },
    ]);
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 100 }]}
      showsVerticalScrollIndicator={false}>

      <View style={[styles.header, { paddingTop: insets.top + 24 }]}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{getInitials(user?.fullName ?? '')}</Text>
        </View>
        <Text style={styles.name}>{user?.fullName}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>Teacher Account</Text>
        </View>
      </View>

      {(assignments ?? []).length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Assignments ({assignments?.length})</Text>
          {(assignments ?? []).map((a, idx) => (
            <Card key={a.id ?? idx} style={styles.assignCard}>
              <View style={styles.assignRow}>
                <View style={styles.assignIcon}>
                  <Icon name="book-education-outline" size={20} color={Colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.assignClass}>
                    {a.className ?? 'Class'}{a.sectionName ? ` · ${a.sectionName}` : ''}
                  </Text>
                  <Text style={styles.assignSub}>
                    {a.subjectName ?? a.subject ?? 'Subject'}
                    {a.isClassTeacher ? '  ·  Class Teacher' : ''}
                  </Text>
                </View>
              </View>
            </Card>
          ))}
        </View>
      )}

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Icon name="logout" size={20} color={Colors.danger} />
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>

      <Text style={styles.version}>SMS App · Teacher v1.0.0</Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  scroll: {},
  header: { alignItems: 'center', paddingBottom: Sizes.xl, backgroundColor: Colors.background },
  avatar: {
    width: 88, height: 88, borderRadius: 44, backgroundColor: Colors.softBlueBg,
    alignItems: 'center', justifyContent: 'center', marginBottom: Sizes.md,
    borderWidth: 3, borderColor: Colors.white, ...Sizes.shadowMd,
  },
  avatarText: { fontSize: 32, fontWeight: '800', color: Colors.primary },
  name: { fontSize: Sizes.fontXxl, fontWeight: '700', color: Colors.textPrimary },
  email: { fontSize: Sizes.fontSm, color: Colors.textMuted, marginTop: 4 },
  roleBadge: {
    marginTop: Sizes.sm, backgroundColor: Colors.chipBg,
    paddingHorizontal: Sizes.md, paddingVertical: 4, borderRadius: Sizes.radiusFull,
  },
  roleText: { fontSize: Sizes.fontXs, color: Colors.chipFg, fontWeight: '600' },
  section: { paddingHorizontal: Sizes.md, marginTop: Sizes.md },
  sectionTitle: {
    fontSize: Sizes.fontSm, fontWeight: '700', color: Colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: Sizes.sm,
  },
  assignCard: { marginBottom: Sizes.sm },
  assignRow: { flexDirection: 'row', alignItems: 'center', gap: Sizes.md },
  assignIcon: {
    width: 44, height: 44, borderRadius: 14, backgroundColor: Colors.softBlueBg,
    alignItems: 'center', justifyContent: 'center',
  },
  assignClass: { fontSize: Sizes.fontMd, fontWeight: '700', color: Colors.textPrimary },
  assignSub: { fontSize: Sizes.fontXs, color: Colors.textSecondary, marginTop: 2 },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    margin: Sizes.md, padding: Sizes.md, gap: Sizes.sm, borderRadius: Sizes.radiusMd,
    backgroundColor: Colors.danger + '10',
  },
  logoutText: { fontSize: Sizes.fontMd, fontWeight: '700', color: Colors.danger },
  version: { textAlign: 'center', fontSize: Sizes.fontXs, color: Colors.textMuted, marginBottom: Sizes.md },
});

export default TeacherProfileScreen;
