import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { Header } from '../../components/common/Header';
import { Card } from '../../components/common/Card';
import { Colors, Typography, Spacing } from '../../theme';
import { getAcademicYear } from '../../utils/formatters';

export function SchoolSetupScreen() {
  const { user } = useAuth();

  return (
    <View style={styles.container}>
      <Header title="School Setup" showBack />

      <ScrollView contentContainerStyle={styles.content}>
        <Card>
          <Text style={styles.sectionTitle}>School Information</Text>
          <InfoRow label="School ID" value={String(user?.schoolId ?? '—')} />
          <InfoRow label="Academic Year" value={getAcademicYear()} />
          <InfoRow label="Admin Email" value={user?.email ?? '—'} />
          <InfoRow label="Admin Name" value={`${user?.firstName} ${user?.lastName}`} />
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>Configuration</Text>
          <Text style={styles.note}>
            School configuration like class management, section management, and academic year
            setup is managed through the web admin portal for full control.
          </Text>
          <Text style={styles.note}>
            This mobile app provides quick access to day-to-day operations.
          </Text>
        </Card>
      </ScrollView>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.md },
  sectionTitle: { ...Typography.h5, color: Colors.textPrimary, marginBottom: Spacing.md },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.divider },
  label: { ...Typography.body2, color: Colors.textSecondary },
  value: { ...Typography.body2, color: Colors.textPrimary, fontWeight: '600' },
  note: { ...Typography.body2, color: Colors.textSecondary, lineHeight: 22, marginBottom: Spacing.sm },
});
