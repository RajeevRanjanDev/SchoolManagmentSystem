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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppDispatch, useAppSelector } from '@store/hooks';
import { loginThunk } from '@store/slices/authSlice';
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

  const validate = (): boolean => {
    const newErrors: typeof errors = {};
    if (!email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      newErrors.email = 'Enter a valid email address';
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
        <Text style={styles.heroSub}>Sign in to your parent account</Text>
      </LinearGradient>

      {/* Form card */}
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sign In</Text>

          <AppInput
            label="Email Address"
            value={email}
            onChangeText={text => {
              setEmail(text);
              if (errors.email) setErrors(e => ({ ...e, email: undefined }));
            }}
            error={errors.email}
            leftIcon="email-outline"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="parent@school.edu"
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

          <TouchableOpacity style={styles.forgotBtn}>
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
              Demo: parent@dpsdemo.edu / Parent@1234
            </Text>
          </View>
        </View>
      </ScrollView>
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
});

export default LoginScreen;
