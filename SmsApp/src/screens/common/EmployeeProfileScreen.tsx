import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { useAppDispatch, useAppSelector } from '@store/hooks';
import { logoutThunk } from '@store/slices/authSlice';
import { Colors } from '@constants/colors';
import { Sizes } from '@constants/sizes';
import { getInitials } from '@utils/formatters';

const ROLE_LABEL: Record<string, string> = {
  ACCOUNTANT: 'Finance / Accountant',
  TRANSPORT_MANAGER: 'Transport Manager',
  SUPPORT_STAFF: 'Support Staff',
  SCHOOL_ADMIN: 'School Admin',
  TEACHER: 'Teacher',
};

const prettyRole = (roles?: string[]): string => {
  const r = (roles ?? []).map(x => x.replace(/^ROLE_/, '')).find(x => ROLE_LABEL[x]);
  return r ? ROLE_LABEL[r] : 'Staff';
};

/** Generic profile + sign-out used by the Finance / Transport / Support role apps. */
const EmployeeProfileScreen = () => {
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const user = useAppSelector(s => s.auth.user);

  const handleLogout = () => Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Sign Out', style: 'destructive', onPress: () => { dispatch(logoutThunk()); } },
  ]);

  return (
    <ScrollView style={styles.root} contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 110 }]} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{getInitials(user?.fullName ?? 'S')}</Text></View>
        <Text style={styles.name}>{user?.fullName}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <View style={styles.roleBadge}><Text style={styles.roleText}>{prettyRole(user?.roles)}</Text></View>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Icon name="logout" size={20} color={Colors.danger} />
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>
      <Text style={styles.version}>SMS App v1.0.0</Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingHorizontal: Sizes.md, gap: Sizes.md },
  header: { alignItems: 'center', paddingVertical: Sizes.md },
  avatar: { width: 88, height: 88, borderRadius: 44, backgroundColor: Colors.softBlueBg, alignItems: 'center', justifyContent: 'center', marginBottom: Sizes.md, borderWidth: 3, borderColor: Colors.white, ...Sizes.shadowMd },
  avatarText: { fontSize: 32, fontWeight: '800', color: Colors.primary },
  name: { fontSize: Sizes.fontXxl, fontWeight: '700', color: Colors.textPrimary },
  email: { fontSize: Sizes.fontSm, color: Colors.textMuted, marginTop: 4 },
  roleBadge: { marginTop: Sizes.sm, backgroundColor: Colors.chipBg, paddingHorizontal: Sizes.md, paddingVertical: 4, borderRadius: Sizes.radiusFull },
  roleText: { fontSize: Sizes.fontXs, color: Colors.chipFg, fontWeight: '600' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: Sizes.md, gap: Sizes.sm, borderRadius: Sizes.radiusMd, backgroundColor: Colors.danger + '10' },
  logoutText: { fontSize: Sizes.fontMd, fontWeight: '700', color: Colors.danger },
  version: { textAlign: 'center', fontSize: Sizes.fontXs, color: Colors.textMuted },
});

export default EmployeeProfileScreen;
