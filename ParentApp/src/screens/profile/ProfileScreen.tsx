import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppDispatch, useAppSelector } from '@store/hooks';
import { logoutThunk } from '@store/slices/authSlice';
import { clearStudents } from '@store/slices/studentSlice';
import Card from '@components/common/Card';
import { Colors } from '@constants/colors';
import { Sizes } from '@constants/sizes';
import { getInitials } from '@utils/formatters';

const MENU_SECTIONS = [
  {
    title: 'Account',
    items: [
      { icon: 'account-edit-outline', label: 'Edit Profile',       action: 'edit' },
      { icon: 'lock-reset',           label: 'Change Password',    action: 'password' },
      { icon: 'bell-cog-outline',     label: 'Notification Prefs', action: 'notif' },
    ],
  },
  {
    title: 'App',
    items: [
      { icon: 'translate',            label: 'Language',           action: 'lang' },
      { icon: 'palette-outline',      label: 'Appearance',         action: 'theme' },
      { icon: 'help-circle-outline',  label: 'Help & Support',     action: 'help' },
      { icon: 'information-outline',  label: 'About App',          action: 'about' },
    ],
  },
];

const ProfileScreen = () => {
  const insets   = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const user     = useAppSelector(s => s.auth.user);
  const { selectedStudent, students } = useAppSelector(s => s.student);

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await dispatch(logoutThunk());
          dispatch(clearStudents());
        },
      },
    ]);
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 80 }]}
      showsVerticalScrollIndicator={false}>

      {/* Profile header */}
      <LinearGradient
        colors={Colors.gradientPrimary as [string, string]}
        style={[styles.header, { paddingTop: insets.top + 24 }]}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{getInitials(user?.fullName ?? '')}</Text>
        </View>
        <Text style={styles.name}>{user?.fullName}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>Parent Account</Text>
        </View>
      </LinearGradient>

      {/* Children */}
      {students.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Children ({students.length})</Text>
          {students.map(s => (
            <Card key={s.id} style={styles.childCard}>
              <View style={styles.childRow}>
                <View style={styles.childAvatar}>
                  <Text style={styles.childAvatarText}>
                    {getInitials(`${s.firstName} ${s.lastName}`)}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.childName}>{s.firstName} {s.lastName}</Text>
                  <Text style={styles.childClass}>
                    {s.className ?? 'Class N/A'}
                    {s.sectionName ? ` · Section ${s.sectionName}` : ''}
                  </Text>
                  <Text style={styles.childAdmission}>
                    Adm No: {s.admissionNumber ?? 'N/A'}
                  </Text>
                </View>
                {selectedStudent?.id === s.id && (
                  <View style={styles.activeBadge}>
                    <Text style={styles.activeBadgeText}>Active</Text>
                  </View>
                )}
              </View>
            </Card>
          ))}
        </View>
      )}

      {/* Menu sections */}
      {MENU_SECTIONS.map(section => (
        <View key={section.title} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <Card style={styles.menuCard}>
            {section.items.map((item, idx) => (
              <TouchableOpacity
                key={item.action}
                style={[
                  styles.menuItem,
                  idx < section.items.length - 1 && styles.menuItemBorder,
                ]}
                onPress={() => {}}>
                <Icon name={item.icon} size={22} color={Colors.primary} />
                <Text style={styles.menuLabel}>{item.label}</Text>
                <Icon name="chevron-right" size={20} color={Colors.textMuted} />
              </TouchableOpacity>
            ))}
          </Card>
        </View>
      ))}

      {/* Sign out */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Icon name="logout" size={20} color={Colors.danger} />
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>

      <Text style={styles.version}>SMS Parent App v1.0.0</Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  scroll: {},
  header: { alignItems: 'center', paddingBottom: Sizes.xl },
  avatar: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: Colors.white,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Sizes.md,
    ...Sizes.shadowLg,
  },
  avatarText: { fontSize: 32, fontWeight: '800', color: Colors.primary },
  name: { fontSize: Sizes.fontXxl, fontWeight: '700', color: Colors.white },
  email: { fontSize: Sizes.fontSm, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  roleBadge: {
    marginTop: Sizes.sm,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: Sizes.md,
    paddingVertical: 4,
    borderRadius: Sizes.radiusFull,
  },
  roleText: { fontSize: Sizes.fontXs, color: Colors.white, fontWeight: '600' },
  section: { paddingHorizontal: Sizes.md, marginTop: Sizes.md },
  sectionTitle: {
    fontSize: Sizes.fontSm, fontWeight: '700',
    color: Colors.textMuted, textTransform: 'uppercase',
    letterSpacing: 0.8, marginBottom: Sizes.sm,
  },
  childCard: { marginBottom: Sizes.sm },
  childRow: { flexDirection: 'row', alignItems: 'center', gap: Sizes.md },
  childAvatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center', justifyContent: 'center',
  },
  childAvatarText: { fontSize: 16, fontWeight: '700', color: Colors.primary },
  childName: { fontSize: Sizes.fontMd, fontWeight: '700', color: Colors.textPrimary },
  childClass: { fontSize: Sizes.fontXs, color: Colors.textSecondary, marginTop: 2 },
  childAdmission: { fontSize: Sizes.fontXs, color: Colors.textMuted, marginTop: 1 },
  activeBadge: {
    backgroundColor: Colors.success + '20',
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: Sizes.radiusFull,
  },
  activeBadgeText: { fontSize: 10, fontWeight: '700', color: Colors.success },
  menuCard: { padding: 0, overflow: 'hidden' },
  menuItem: {
    flexDirection: 'row', alignItems: 'center',
    padding: Sizes.md, gap: Sizes.md,
  },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: Colors.divider },
  menuLabel: { flex: 1, fontSize: Sizes.fontMd, color: Colors.textPrimary },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    margin: Sizes.md, padding: Sizes.md,
    gap: Sizes.sm, borderRadius: Sizes.radiusMd,
    backgroundColor: Colors.danger + '10',
  },
  logoutText: { fontSize: Sizes.fontMd, fontWeight: '700', color: Colors.danger },
  version: { textAlign: 'center', fontSize: Sizes.fontXs, color: Colors.textMuted, marginBottom: Sizes.md },
});

export default ProfileScreen;
