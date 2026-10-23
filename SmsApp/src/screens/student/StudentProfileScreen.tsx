import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, Alert, TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useQuery, useMutation } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';

import { studentPortalService } from '@api/services/studentPortalService';
import { useAppDispatch } from '@store/hooks';
import { logoutThunk } from '@store/slices/authSlice';
import Card from '@components/common/Card';
import AppButton from '@components/common/AppButton';
import { Colors } from '@constants/colors';
import { Sizes } from '@constants/sizes';
import { getInitials } from '@utils/formatters';

const Line = ({ icon, label, value }: { icon: string; label: string; value?: string }) => (
  <View style={styles.line}>
    <Icon name={icon} size={18} color={Colors.textMuted} />
    <Text style={styles.lineLabel}>{label}</Text>
    <Text style={styles.lineValue}>{value || '—'}</Text>
  </View>
);

const StudentProfileScreen = () => {
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const [cur, setCur] = useState('');
  const [next, setNext] = useState('');

  const { data: me } = useQuery({
    queryKey: ['student-me'],
    queryFn: () => studentPortalService.getMe(),
  });

  const pwMutation = useMutation({
    mutationFn: () => studentPortalService.changePassword({ currentPassword: cur, newPassword: next }),
    onSuccess: () => {
      Toast.show({ type: 'success', text1: 'Password changed' });
      setCur(''); setNext('');
    },
    onError: (e: any) => Toast.show({ type: 'error', text1: 'Failed', text2: e?.response?.data?.message ?? 'Try again' }),
  });

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => { dispatch(logoutThunk()); } },
    ]);
  };

  const name = me ? `${me.firstName} ${me.lastName}` : '';

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 110 }]}
      showsVerticalScrollIndicator={false}>

      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{getInitials(name || 'S')}</Text>
        </View>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.email}>{me?.admissionNumber ?? me?.email}</Text>
        <View style={styles.roleBadge}><Text style={styles.roleText}>Student Account</Text></View>
      </View>

      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Details</Text>
        <Line icon="school-outline" label="School" value={me?.schoolName} />
        <Line icon="google-classroom" label="Class" value={[me?.className, me?.sectionName].filter(Boolean).join(' · ')} />
        <Line icon="card-account-details-outline" label="Roll" value={me?.rollNumber} />
        <Line icon="email-outline" label="Email" value={me?.email} />
        <Line icon="phone-outline" label="Mobile" value={me?.mobile} />
      </Card>

      {me?.transportRequired ? (
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Transport</Text>
          <Line icon="bus" label="Route" value={me?.routeName} />
          <Line icon="map-marker-outline" label="Stop" value={me?.stopName ?? me?.pickupPoint} />
          <Line icon="information-outline" label="Type" value={me?.transportType} />
        </Card>
      ) : null}

      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Change Password</Text>
        <TextInput
          value={cur} onChangeText={setCur} placeholder="Current password"
          placeholderTextColor={Colors.textMuted} secureTextEntry style={styles.input}
        />
        <TextInput
          value={next} onChangeText={setNext} placeholder="New password (min 6)"
          placeholderTextColor={Colors.textMuted} secureTextEntry style={[styles.input, { marginTop: Sizes.sm }]}
        />
        <AppButton
          title={pwMutation.isPending ? 'Updating…' : 'Update Password'}
          onPress={() => pwMutation.mutate()}
          loading={pwMutation.isPending}
          disabled={cur.length < 1 || next.length < 6}
          style={{ marginTop: Sizes.md }}
        />
      </Card>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Icon name="logout" size={20} color={Colors.danger} />
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>
      <Text style={styles.version}>SMS App · Student v1.0.0</Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingHorizontal: Sizes.md, gap: Sizes.md },
  header: { alignItems: 'center', paddingVertical: Sizes.md },
  avatar: {
    width: 88, height: 88, borderRadius: 44, backgroundColor: Colors.softBlueBg,
    alignItems: 'center', justifyContent: 'center', marginBottom: Sizes.md,
    borderWidth: 3, borderColor: Colors.white, ...Sizes.shadowMd,
  },
  avatarText: { fontSize: 32, fontWeight: '800', color: Colors.primary },
  name: { fontSize: Sizes.fontXxl, fontWeight: '700', color: Colors.textPrimary },
  email: { fontSize: Sizes.fontSm, color: Colors.textMuted, marginTop: 4 },
  roleBadge: { marginTop: Sizes.sm, backgroundColor: Colors.chipBg, paddingHorizontal: Sizes.md, paddingVertical: 4, borderRadius: Sizes.radiusFull },
  roleText: { fontSize: Sizes.fontXs, color: Colors.chipFg, fontWeight: '600' },
  card: { padding: Sizes.md },
  cardTitle: { fontSize: Sizes.fontLg, fontWeight: '800', color: Colors.textPrimary, marginBottom: Sizes.sm },
  line: { flexDirection: 'row', alignItems: 'center', gap: Sizes.sm, paddingVertical: 8, borderTopWidth: 1, borderTopColor: Colors.divider },
  lineLabel: { fontSize: Sizes.fontSm, color: Colors.textSecondary, width: 70 },
  lineValue: { flex: 1, fontSize: Sizes.fontSm, color: Colors.textPrimary, fontWeight: '600', textAlign: 'right' },
  input: {
    backgroundColor: Colors.background, borderRadius: Sizes.radiusMd, borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Sizes.md, paddingVertical: 12, fontSize: Sizes.fontMd, color: Colors.textPrimary,
  },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    padding: Sizes.md, gap: Sizes.sm, borderRadius: Sizes.radiusMd, backgroundColor: Colors.danger + '10',
  },
  logoutText: { fontSize: Sizes.fontMd, fontWeight: '700', color: Colors.danger },
  version: { textAlign: 'center', fontSize: Sizes.fontXs, color: Colors.textMuted },
});

export default StudentProfileScreen;
