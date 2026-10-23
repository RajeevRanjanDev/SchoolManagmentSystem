import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import { useAppDispatch, useAppSelector } from '@store/hooks';
import { loginThunk } from '@store/slices/authSlice';
import { authService } from '@api/services/authService';
import AppInput from '@components/common/AppInput';
import AppButton from '@components/common/AppButton';
import { Colors } from '@constants/colors';
import { Sizes } from '@constants/sizes';

const LoginScreen = () => {
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const { isLoading } = useAppSelector(s => s.auth);

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors]     = useState<{ email?: string; password?: string }>({});

  const [forgotOpen, setForgotOpen]       = useState(false);
  const [forgotId, setForgotId]           = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const submitForgot = async () => {
    if (forgotId.trim().length < 3) return;
    setForgotLoading(true);
    try {
      await authService.forgotPassword(forgotId.trim());
      setForgotOpen(false);
      setForgotId('');
      Toast.show({ type: 'success', text1: 'Check your email', text2: 'If an account exists, a temporary password was sent.' });
    } catch {
      // Backend never reveals existence — show the same neutral message.
      setForgotOpen(false);
      setForgotId('');
      Toast.show({ type: 'success', text1: 'Check your email', text2: 'If an account exists, a temporary password was sent.' });
    } finally {
      setForgotLoading(false);
    }
  };

  const validate = (): boolean => {
    const newErrors: typeof errors = {};
    // Accepts an email (admins/parents) OR a login ID (teachers: ABC-TE-2025-001,
    // students: admission number). So just require a non-trivial identifier.
    if (!email.trim()) newErrors.email = 'Email or Login ID is required';
    else if (email.trim().length < 3) newErrors.email = 'Enter a valid email or login ID';
    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 6) newErrors.password = 'Minimum 6 characters';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    const result = await dispatch(loginThunk({ email: email.trim(), password }));
    if (loginThunk.rejected.match(result)) {
      Alert.alert('Login Failed', result.payload as string ?? 'Invalid credentials');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.root}>
      {/* Hero gradient header */}
      <LinearGradient
        colors={Colors.gradientPrimary as [string, string]}
        style={[styles.hero, { paddingTop: insets.top + 32 }]}>
        <View style={styles.logoCircle}>
          <Icon name="school" size={40} color={Colors.primary} />
        </View>
        <Text style={styles.heroTitle}>Welcome Back</Text>
        <Text style={styles.heroSub}>Sign in to your account</Text>
      </LinearGradient>

      {/* Form card */}
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sign In</Text>

          <AppInput
            label="Email or Login ID"
            value={email}
            onChangeText={text => {
              setEmail(text);
              if (errors.email) setErrors(e => ({ ...e, email: undefined }));
            }}
            error={errors.email}
            leftIcon="account-outline"
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="email or login ID (e.g. ABC-TE-2025-001)"
          />

          <AppInput
            label="Password"
            value={password}
            onChangeText={text => {
              setPassword(text);
              if (errors.password) setErrors(e => ({ ...e, password: undefined }));
            }}
            error={errors.password}
            leftIcon="lock-outline"
            secureTextEntry
            placeholder="Enter your password"
          />

          <TouchableOpacity style={styles.forgotBtn} onPress={() => { setForgotId(email); setForgotOpen(true); }}>
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>

          <AppButton
            title="Sign In"
            onPress={handleLogin}
            loading={isLoading}
            style={styles.loginBtn}
          />

          {/* Demo credentials hint */}
          <View style={styles.hint}>
            <Icon name="information-outline" size={14} color={Colors.textMuted} />
            <Text style={styles.hintText}>
              Parents sign in with email · Teachers with their login ID
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Forgot password modal */}
      <Modal visible={forgotOpen} transparent animationType="fade" onRequestClose={() => setForgotOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Reset Password</Text>
            <Text style={styles.modalSub}>Enter your email or login ID. We'll email a temporary password.</Text>
            <TextInput
              value={forgotId}
              onChangeText={setForgotId}
              placeholder="email or login ID"
              placeholderTextColor={Colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.modalInput}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setForgotOpen(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <AppButton
                title={forgotLoading ? 'Sending…' : 'Send'}
                onPress={submitForgot}
                loading={forgotLoading}
                disabled={forgotId.trim().length < 3}
                style={styles.modalSend}
              />
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  hero: {
    alignItems: 'center',
    paddingBottom: 48,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Sizes.md,
    ...Sizes.shadowLg,
  },
  heroTitle: {
    fontSize: Sizes.fontXxl,
    fontWeight: '800',
    color: Colors.white,
  },
  heroSub: {
    fontSize: Sizes.fontMd,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  scroll: { flexGrow: 1 },
  card: {
    margin: Sizes.md,
    marginTop: -32,
    backgroundColor: Colors.white,
    borderRadius: Sizes.radiusXl,
    padding: Sizes.xl,
    ...Sizes.shadowMd,
  },
  cardTitle: {
    fontSize: Sizes.fontXl,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Sizes.lg,
  },
  forgotBtn: { alignSelf: 'flex-end', marginTop: -8, marginBottom: Sizes.lg },
  forgotText: { fontSize: Sizes.fontSm, color: Colors.primary, fontWeight: '600' },
  loginBtn: { marginTop: 4 },
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Sizes.lg,
    gap: 6,
  },
  hintText: { fontSize: 11, color: Colors.textMuted },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center', padding: Sizes.lg },
  modalCard: { width: '100%', backgroundColor: Colors.white, borderRadius: Sizes.radiusXl, padding: Sizes.xl },
  modalTitle: { fontSize: Sizes.fontXl, fontWeight: '800', color: Colors.textPrimary },
  modalSub: { fontSize: Sizes.fontSm, color: Colors.textMuted, marginTop: 4, marginBottom: Sizes.md, lineHeight: 18 },
  modalInput: { backgroundColor: Colors.background, borderRadius: Sizes.radiusMd, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: Sizes.md, paddingVertical: 12, fontSize: Sizes.fontMd, color: Colors.textPrimary },
  modalActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: Sizes.md, marginTop: Sizes.md },
  modalCancel: { paddingHorizontal: Sizes.md, paddingVertical: 10 },
  modalCancelText: { fontSize: Sizes.fontMd, color: Colors.textSecondary, fontWeight: '600' },
  modalSend: { minWidth: 110 },
});

export default LoginScreen;
