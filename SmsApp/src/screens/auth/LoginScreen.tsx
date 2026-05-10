import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';
import { isValidEmail, isRequired } from '../../utils/validators';

export function LoginScreen() {
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  function validate(): boolean {
    const newErrors: typeof errors = {};
    if (!isRequired(email)) newErrors.email = 'Email is required';
    else if (!isValidEmail(email)) newErrors.email = 'Enter a valid email address';
    if (!isRequired(password)) newErrors.password = 'Password is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleLogin() {
    if (!validate()) return;
    const result = await login({ email: email.trim(), password });
    if (result.type.endsWith('/rejected')) {
      Alert.alert('Login Failed', (result as { payload?: string }).payload ?? 'Invalid credentials');
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header Banner */}
        <View style={styles.header}>
          <Text style={styles.headerIcon}>🏫</Text>
          <Text style={styles.appTitle}>SMS</Text>
          <Text style={styles.appSubtitle}>School Management System</Text>
        </View>

        {/* Login Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Welcome Back</Text>
          <Text style={styles.cardSubtitle}>Sign in to your account</Text>

          <Input
            label="Email Address"
            value={email}
            onChangeText={text => { setEmail(text); setErrors(e => ({ ...e, email: undefined })); }}
            placeholder="admin@school.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            error={errors.email}
            containerStyle={styles.input}
          />

          <Input
            label="Password"
            value={password}
            onChangeText={text => { setPassword(text); setErrors(e => ({ ...e, password: undefined })); }}
            placeholder="Enter your password"
            isPassword
            error={errors.password}
            containerStyle={styles.input}
          />

          <Button
            label="Sign In"
            onPress={handleLogin}
            loading={isLoading}
            fullWidth
            style={styles.loginBtn}
          />

          <Text style={styles.roleHint}>
            Login with your school-assigned credentials
          </Text>
        </View>

        {/* Role info */}
        <View style={styles.roleInfo}>
          <Text style={styles.roleInfoTitle}>Supported Roles</Text>
          <View style={styles.rolesRow}>
            {['Admin', 'Teacher', 'Accountant', 'Librarian', 'Transport'].map(role => (
              <View key={role} style={styles.rolePill}>
                <Text style={styles.rolePillText}>{role}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.primary },
  scroll: { flex: 1 },
  container: {
    flexGrow: 1,
    paddingBottom: Spacing.xxl,
  },
  header: {
    alignItems: 'center',
    paddingTop: Spacing.xxl + 16,
    paddingBottom: Spacing.xl,
  },
  headerIcon: { fontSize: 52, marginBottom: Spacing.sm },
  appTitle: {
    fontSize: 38,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: 4,
  },
  appSubtitle: {
    ...Typography.body2,
    color: 'rgba(255,255,255,0.75)',
    marginTop: Spacing.xs,
  },
  card: {
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    ...Shadows.lg,
  },
  cardTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  cardSubtitle: {
    ...Typography.body2,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  input: {
    marginBottom: Spacing.md,
  },
  loginBtn: {
    marginTop: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  roleHint: {
    ...Typography.caption,
    color: Colors.textTertiary,
    textAlign: 'center',
    marginTop: Spacing.md,
  },
  roleInfo: {
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
  },
  roleInfoTitle: {
    ...Typography.caption,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: Spacing.sm,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  rolesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  rolePill: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: BorderRadius.round,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 4,
    margin: 3,
  },
  rolePillText: {
    ...Typography.caption,
    color: Colors.white,
    fontWeight: '600',
  },
});
