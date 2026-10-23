import React from 'react';
import { View, Text, StyleSheet, ScrollView, Linking, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { teacherService } from '@api/services/teacherService';
import Header from '@components/common/Header';
import Card from '@components/common/Card';
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

const TeacherStudentCardScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const studentId: number = route.params?.studentId;

  const { data, isLoading } = useQuery({
    queryKey: ['student-card', studentId],
    queryFn: () => teacherService.getStudentCard(studentId),
    enabled: studentId != null,
  });

  if (isLoading) return (
    <View style={styles.root}><Header title="Student" onBack={() => navigation.goBack()} /><LoadingSpinner message="Loading…" /></View>
  );

  const name = data ? `${data.firstName ?? ''} ${data.lastName ?? ''}`.trim() : '';

  return (
    <View style={styles.root}>
      <Header title="Student" onBack={() => navigation.goBack()} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}>
        <View style={styles.hero}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{getInitials(name || 'S')}</Text></View>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.sub}>
            {[data?.className, data?.sectionName].filter(Boolean).join(' · ')}
            {data?.rollNumber ? `  ·  Roll ${data.rollNumber}` : ''}
          </Text>
        </View>

        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Details</Text>
          <Line label="Admission" value={data?.admissionNumber} />
          <Line label="DOB" value={data?.dateOfBirth ? formatDate(data.dateOfBirth) : undefined} />
          <Line label="Gender" value={data?.gender} />
          <Line label="Blood group" value={data?.bloodGroup} />
          <Line label="Category" value={data?.category} />
          <Line label="Mobile" value={data?.mobile} />
          <Line label="Email" value={data?.email} />
          <Line label="Address" value={data?.currentAddress ?? data?.permanentAddress} />
        </Card>

        {(data?.guardians ?? []).length > 0 && (
          <Card style={styles.card}>
            <Text style={styles.cardTitle}>Guardians</Text>
            {(data?.guardians ?? []).map((g, i) => (
              <View key={i} style={styles.guardian}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.gName}>{g.name ?? 'Guardian'}{g.relation ? ` (${g.relation})` : ''}</Text>
                  {g.email ? <Text style={styles.gSub}>{g.email}</Text> : null}
                </View>
                {g.mobile ? (
                  <TouchableOpacity style={styles.callBtn} onPress={() => Linking.openURL(`tel:${g.mobile}`)}>
                    <Icon name="phone-outline" size={18} color={Colors.primary} />
                  </TouchableOpacity>
                ) : null}
              </View>
            ))}
          </Card>
        )}
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

export default TeacherStudentCardScreen;
