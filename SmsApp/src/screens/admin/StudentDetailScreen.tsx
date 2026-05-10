import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRoute } from '@react-navigation/native';
import { studentsApi } from '../../api/students.api';
import { attendanceApi } from '../../api/attendance.api';
import { feesApi } from '../../api/fees.api';
import { QUERY_KEYS } from '../../constants';
import { Header } from '../../components/common/Header';
import { Card } from '../../components/common/Card';
import { Avatar } from '../../components/common/Avatar';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Colors, Typography, Spacing } from '../../theme';
import { formatDate, formatCurrency, formatPercentage, getAcademicYear } from '../../utils/formatters';
import { FEE_STATUS_COLORS } from '../../constants';

export function StudentDetailScreen() {
  const route = useRoute<any>();
  const { studentId } = route.params;
  const academicYear = getAcademicYear();

  const { data: student, isLoading } = useQuery({
    queryKey: QUERY_KEYS.STUDENT(studentId),
    queryFn: () => studentsApi.getById(studentId),
  });

  const today = new Date().toISOString().split('T')[0];
  const monthStart = today.slice(0, 8) + '01';

  const { data: attendancePct } = useQuery({
    queryKey: [...QUERY_KEYS.STUDENT_ATTENDANCE(studentId), 'pct'],
    queryFn: () => attendanceApi.getStudentPercentage(studentId, monthStart, today),
  });

  const { data: fees } = useQuery({
    queryKey: QUERY_KEYS.STUDENT_FEES(studentId),
    queryFn: () => feesApi.getStudentFees(studentId),
  });

  if (isLoading || !student) return <LoadingSpinner fullScreen />;

  const pendingFee = fees?.filter(f => f.status !== 'PAID').reduce((acc, f) => acc + (f.pendingAmount ?? f.amount), 0) ?? 0;

  return (
    <View style={styles.container}>
      <Header title="Student Profile" showBack />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Profile Card */}
        <Card style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <Avatar
              firstName={student.firstName}
              lastName={student.lastName}
              photoUrl={student.profilePhotoUrl}
              size={70}
            />
            <View style={styles.profileInfo}>
              <Text style={styles.name}>{student.firstName} {student.lastName}</Text>
              <Text style={styles.admNo}>Admission# {student.admissionNumber}</Text>
              <Badge
                label={student.active ? 'Active' : 'Inactive'}
                backgroundColor={student.active ? Colors.successLight : Colors.errorLight}
                color={student.active ? Colors.success : Colors.error}
              />
            </View>
          </View>
        </Card>

        {/* Details */}
        <Card>
          <Text style={styles.sectionHeading}>Personal Information</Text>
          <InfoRow label="Date of Birth" value={formatDate(student.dateOfBirth)} />
          <InfoRow label="Gender" value={student.gender ?? '—'} />
          <InfoRow label="Class" value={student.currentClass ?? '—'} />
          <InfoRow label="Section" value={student.currentSection ?? '—'} />
          <InfoRow label="Enrolled" value={formatDate(student.createdAt)} />
        </Card>

        {/* Academic Stats */}
        <View style={styles.statsRow}>
          <StatBox label="Attendance" value={formatPercentage(attendancePct)} color={Colors.success} />
          <StatBox label="Pending Fee" value={formatCurrency(pendingFee)} color={pendingFee > 0 ? Colors.error : Colors.success} />
          <StatBox label="Academic Year" value={academicYear} color={Colors.primary} />
        </View>

        {/* Fee Records */}
        {fees && fees.length > 0 && (
          <Card>
            <Text style={styles.sectionHeading}>Fee Records</Text>
            {fees.map(fee => (
              <View key={fee.id} style={styles.feeRow}>
                <View style={styles.feeInfo}>
                  <Text style={styles.feeType}>{fee.feeType}</Text>
                  <Text style={styles.feeDue}>Due: {formatDate(fee.dueDate)}</Text>
                </View>
                <View style={styles.feeRight}>
                  <Text style={styles.feeAmount}>{formatCurrency(fee.amount)}</Text>
                  <Badge
                    label={fee.status.replace('_', ' ')}
                    backgroundColor={FEE_STATUS_COLORS[fee.status] + '22'}
                    color={FEE_STATUS_COLORS[fee.status]}
                  />
                </View>
              </View>
            ))}
          </Card>
        )}
      </ScrollView>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={infoStyles.row}>
      <Text style={infoStyles.label}>{label}</Text>
      <Text style={infoStyles.value}>{value}</Text>
    </View>
  );
}

function StatBox({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={[statStyles.box, { borderTopColor: color, borderTopWidth: 3 }]}>
      <Text style={[statStyles.value, { color }]}>{value}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </View>
  );
}

const infoStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  label: { ...Typography.body2, color: Colors.textSecondary },
  value: { ...Typography.body2, color: Colors.textPrimary, fontWeight: '600' },
});

const statStyles = StyleSheet.create({
  box: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 10,
    padding: Spacing.md,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  value: { ...Typography.h5, marginBottom: 4 },
  label: { ...Typography.caption, color: Colors.textSecondary, textAlign: 'center' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.md, paddingBottom: Spacing.xxl },
  profileCard: { marginBottom: Spacing.md },
  profileHeader: { flexDirection: 'row', alignItems: 'center' },
  profileInfo: { marginLeft: Spacing.md, flex: 1 },
  name: { ...Typography.h4, color: Colors.textPrimary, marginBottom: 4 },
  admNo: { ...Typography.caption, color: Colors.textSecondary, marginBottom: Spacing.sm },
  sectionHeading: { ...Typography.h5, color: Colors.textPrimary, marginBottom: Spacing.md },
  statsRow: { flexDirection: 'row', marginBottom: Spacing.md },
  feeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  feeInfo: { flex: 1 },
  feeType: { ...Typography.body2, color: Colors.textPrimary, fontWeight: '600' },
  feeDue: { ...Typography.caption, color: Colors.textSecondary },
  feeRight: { alignItems: 'flex-end' },
  feeAmount: { ...Typography.body2, fontWeight: '700', color: Colors.textPrimary, marginBottom: 4 },
});
