import React from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert,
} from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { Avatar } from '../../components/common/Avatar';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';
import { formatDate, getAcademicYear } from '../../utils/formatters';

const ROLE_COLORS: Record<string, string> = {
  SCHOOL_ADMIN: Colors.adminColor,
  TEACHER: Colors.teacherColor,
  ACCOUNTANT: Colors.accountantColor,
  LIBRARIAN: Colors.librarianColor,
  TRANSPORT_MANAGER: Colors.transportColor,
};

export function ProfileScreen() {
  const { user, logout } = useAuth();

  function handleLogout() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => logout() },
    ]);
  }

  if (!user) return null;

  const primaryRole = user.roles[0];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile Header */}
      <View style={styles.header}>
        <Avatar
          firstName={user.firstName}
          lastName={user.lastName}
          photoUrl={user.profilePhotoUrl}
          size={80}
          color={Colors.white}
        />
        <Text style={styles.name}>{user.firstName} {user.lastName}</Text>
        <Text style={styles.email}>{user.email}</Text>
        <View style={styles.rolesRow}>
          {user.roles.map(role => (
            <Badge
              key={role}
              label={role.replace('_', ' ')}
              backgroundColor={(ROLE_COLORS[role] ?? Colors.primary) + '33'}
              color={ROLE_COLORS[role] ?? Colors.primary}
            />
          ))}
        </View>
      </View>

      {/* Info Card */}
      <Card>
        <Text style={styles.sectionTitle}>Account Information</Text>
        <InfoRow icon="👤" label="Full Name" value={`${user.firstName} ${user.lastName}`} />
        <InfoRow icon="📧" label="Email" value={user.email} />
        <InfoRow icon="🏫" label="School ID" value={String(user.schoolId ?? 'Global')} />
        <InfoRow icon="📅" label="Academic Year" value={getAcademicYear()} />
        <InfoRow icon="✅" label="Status" value={user.active ? 'Active' : 'Inactive'} />
      </Card>

      {/* Permissions Card */}
      <Card>
        <Text style={styles.sectionTitle}>Your Permissions</Text>
        {user.roles.map(role => (
          <View key={role} style={styles.permissionRow}>
            <View style={[styles.roleIndicator, { backgroundColor: ROLE_COLORS[role] ?? Colors.primary }]} />
            <Text style={styles.roleText}>{role.replace(/_/g, ' ')}</Text>
          </View>
        ))}
      </Card>

      {/* Actions */}
      <Card>
        <Text style={styles.sectionTitle}>Support</Text>
        <TouchableOpacity style={styles.supportRow}>
          <Text style={styles.supportIcon}>📞</Text>
          <Text style={styles.supportLabel}>Contact School Admin</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.supportRow}>
          <Text style={styles.supportIcon}>❓</Text>
          <Text style={styles.supportLabel}>Help & FAQ</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.supportRow}>
          <Text style={styles.supportIcon}>📋</Text>
          <Text style={styles.supportLabel}>Terms & Privacy Policy</Text>
        </TouchableOpacity>
      </Card>

      {/* Logout */}
      <Button
        label="Sign Out"
        onPress={handleLogout}
        variant="danger"
        fullWidth
        style={styles.logoutBtn}
        size="lg"
      />

      <Text style={styles.version}>SMS App v1.0.0</Text>
    </ScrollView>
  );
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoIcon}>{icon}</Text>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingBottom: Spacing.xxl },
  header: {
    backgroundColor: Colors.primary,
    alignItems: 'center',
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.md,
  },
  name: { ...Typography.h3, color: Colors.white, marginTop: Spacing.md, marginBottom: Spacing.xs },
  email: { ...Typography.body2, color: 'rgba(255,255,255,0.8)', marginBottom: Spacing.md },
  rolesRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: Spacing.xs },
  sectionTitle: { ...Typography.h5, color: Colors.textPrimary, marginBottom: Spacing.md },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.divider },
  infoIcon: { fontSize: 18, marginRight: Spacing.md, width: 28 },
  infoContent: { flex: 1 },
  infoLabel: { ...Typography.caption, color: Colors.textSecondary },
  infoValue: { ...Typography.body2, color: Colors.textPrimary, fontWeight: '600' },
  permissionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.divider },
  roleIndicator: { width: 4, height: 20, borderRadius: 2, marginRight: Spacing.md },
  roleText: { ...Typography.body2, color: Colors.textPrimary, fontWeight: '600', textTransform: 'capitalize' },
  supportRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.divider },
  supportIcon: { fontSize: 18, marginRight: Spacing.md },
  supportLabel: { ...Typography.body2, color: Colors.textPrimary },
  logoutBtn: { margin: Spacing.md },
  version: { ...Typography.caption, color: Colors.textTertiary, textAlign: 'center', marginTop: Spacing.sm },
});
