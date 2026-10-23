import React from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Linking, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useQuery, useMutation } from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';

import { adminService } from '@api/services/adminService';
import Header from '@components/common/Header';
import Card from '@components/common/Card';
import AppButton from '@components/common/AppButton';
import LoadingSpinner from '@components/common/LoadingSpinner';
import { Colors } from '@constants/colors';
import { Sizes } from '@constants/sizes';
import { getInitials } from '@utils/formatters';
import { formatDate } from '@utils/dateUtils';

const Line = ({ label, value }: { label: string; value?: string }) =>
  value ? (
    <View style={styles.line}>
      <Text style={styles.lineLabel}>{label}</Text>
      <Text style={styles.lineValue}>{value}</Text>
    </View>
  ) : null;

const AdminStudentDetailScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const studentId: number = route.params?.studentId;

  const { data, isLoading } = useQuery({ queryKey: ['admin-student', studentId], queryFn: () => adminService.getStudent(studentId), enabled: studentId != null });

  const resetMut = useMutation({
    mutationFn: () => adminService.resetStudentPassword(studentId),
    onSuccess: (msg) => Toast.show({ type: 'success', text1: 'Password reset', text2: msg }),
    onError: (e: any) => Toast.show({ type: 'error', text1: 'Failed', text2: e?.response?.data?.message ?? 'Try again' }),
  });

  const confirmReset = () => Alert.alert('Reset password', 'Email a new temporary password to this student?', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Reset', onPress: () => resetMut.mutate() },
  ]);

  if (isLoading) return (
    <View style={styles.root}><Header title="Student" onBack={() => navigation.goBack()} /><LoadingSpinner message="Loading…" /></View>
  );

  const s = data ?? {};
  const name = `${s.firstName ?? ''} ${s.lastName ?? ''}`.trim();
  const guardians: any[] = s.guardians ?? [];

  return (
    <View style={styles.root}>
      <Header title="Student" onBack={() => navigation.goBack()} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}>
        <View style={styles.hero}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{getInitials(name || 'S')}</Text></View>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.sub}>
            {[s.className, s.sectionName].filter(Boolean).join(' · ')}{s.rollNumber ? `  ·  Roll ${s.rollNumber}` : ''}
          </Text>
          {s.status ? <Text style={styles.status}>{s.status}</Text> : null}
        </View>

        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Details</Text>
          <Line label="Admission" value={s.admissionNumber} />
          <Line label="DOB" value={s.dateOfBirth ? formatDate(s.dateOfBirth) : undefined} />
          <Line label="Gender" value={s.gender} />
          <Line label="Mobile" value={s.mobile} />
          <Line label="Email" value={s.email} />
        </Card>

        {guardians.length > 0 && (
          <Card style={styles.card}>
            <Text style={styles.cardTitle}>Guardians</Text>
            {guardians.map((g, i) => (
              <View key={i} style={styles.guardian}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.gName}>{g.name ?? g.guardianName ?? 'Guardian'}{g.relation || g.relationship ? ` (${g.relation ?? g.relationship})` : ''}</Text>
                  {g.email ? <Text style={styles.gSub}>{g.email}</Text> : null}
                </View>
                {(g.mobile ?? g.phone) ? (
                  <TouchableOpacity style={styles.callBtn} onPress={() => Linking.openURL(`tel:${g.mobile ?? g.phone}`)}>
                    <Icon name="phone-outline" size={18} color={Colors.primary} />
                  </TouchableOpacity>
                ) : null}
              </View>
            ))}
          </Card>
        )}

        <AppButton
          title="Manage Status / Lifecycle"
          onPress={() => navigation.navigate('StudentLifecycle', { studentId })}
          style={{ marginTop: Sizes.sm }}
        />
        <AppButton
          title={resetMut.isPending ? 'Resetting…' : 'Reset Password'}
          onPress={confirmReset}
          loading={resetMut.isPending}
          variant="outline"
          style={{ marginTop: Sizes.sm }}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Sizes.md, gap: Sizes.md },
  hero: { alignItems: 'center', paddingVertical: Sizes.md },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.softBlueBg, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: Colors.white, ...Sizes.shadowMd },
  avatarText: { fontSize: 28, fontWeight: '800', color: Colors.primary },
  name: { fontSize: Sizes.fontXl, fontWeight: '800', color: Colors.textPrimary, marginTop: Sizes.sm },
  sub: { fontSize: Sizes.fontSm, color: Colors.textMuted, marginTop: 2 },
  status: { fontSize: Sizes.fontXs, color: Colors.primary, fontWeight: '700', marginTop: 4 },
  card: { padding: Sizes.md },
  cardTitle: { fontSize: Sizes.fontLg, fontWeight: '800', color: Colors.textPrimary, marginBottom: Sizes.sm },
  line: { flexDirection: 'row', paddingVertical: 8, borderTopWidth: 1, borderTopColor: Colors.divider, gap: Sizes.sm },
  lineLabel: { fontSize: Sizes.fontSm, color: Colors.textSecondary, width: 96 },
  lineValue: { flex: 1, fontSize: Sizes.fontSm, color: Colors.textPrimary, fontWeight: '600', textAlign: 'right' },
  guardian: { flexDirection: 'row', alignItems: 'center', gap: Sizes.sm, paddingVertical: 8, borderTopWidth: 1, borderTopColor: Colors.divider },
  gName: { fontSize: Sizes.fontMd, fontWeight: '700', color: Colors.textPrimary },
  gSub: { fontSize: Sizes.fontXs, color: Colors.textMuted, marginTop: 2 },
  callBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: Colors.softBlueBg, alignItems: 'center', justifyContent: 'center' },
});

export default AdminStudentDetailScreen;
