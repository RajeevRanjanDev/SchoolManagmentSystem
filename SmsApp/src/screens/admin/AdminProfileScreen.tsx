import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';

import { useAppDispatch, useAppSelector } from '@store/hooks';
import { logoutThunk } from '@store/slices/authSlice';
import Card from '@components/common/Card';
import { Colors } from '@constants/colors';
import { Sizes } from '@constants/sizes';
import { getInitials } from '@utils/formatters';

const MENU = [
  { icon: 'account-school-outline', label: 'Students', screen: 'Students' },
  { icon: 'account-tie-outline',    label: 'Teachers', screen: 'Teachers' },
  { icon: 'google-classroom',       label: 'Classes & Sections', screen: 'Classes' },
  { icon: 'book-outline',           label: 'Subjects', screen: 'Subjects' },
  { icon: 'credit-card-outline',    label: 'Fees', screen: 'Fees' },
  { icon: 'bullhorn-outline',       label: 'Broadcast', screen: 'Broadcast' },
];

const AdminProfileScreen = () => {
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const navigation = useNavigation<any>();
  const user = useAppSelector(s => s.auth.user);

  const handleLogout = () => Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Sign Out', style: 'destructive', onPress: () => { dispatch(logoutThunk()); } },
  ]);

  return (
    <ScrollView style={styles.root} contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 110 }]} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{getInitials(user?.fullName ?? 'A')}</Text></View>
        <Text style={styles.name}>{user?.fullName}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <View style={styles.roleBadge}><Text style={styles.roleText}>School Admin</Text></View>
      </View>

      <Card style={styles.menuCard}>
        {MENU.map((m, i) => (
          <TouchableOpacity key={m.label} style={[styles.menuItem, i < MENU.length - 1 && styles.menuBorder]} onPress={() => navigation.navigate(m.screen as never)}>
            <Icon name={m.icon} size={22} color={Colors.primary} />
            <Text style={styles.menuLabel}>{m.label}</Text>
            <Icon name="chevron-right" size={20} color={Colors.textMuted} />
          </TouchableOpacity>
        ))}
      </Card>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Icon name="logout" size={20} color={Colors.danger} />
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>
      <Text style={styles.version}>SMS App · Admin v1.0.0</Text>
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
  menuCard: { padding: 0, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: Sizes.md, gap: Sizes.md },
  menuBorder: { borderBottomWidth: 1, borderBottomColor: Colors.divider },
  menuLabel: { flex: 1, fontSize: Sizes.fontMd, color: Colors.textPrimary },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: Sizes.md, gap: Sizes.sm, borderRadius: Sizes.radiusMd, backgroundColor: Colors.danger + '10' },
  logoutText: { fontSize: Sizes.fontMd, fontWeight: '700', color: Colors.danger },
  version: { textAlign: 'center', fontSize: Sizes.fontXs, color: Colors.textMuted },
});

export default AdminProfileScreen;
