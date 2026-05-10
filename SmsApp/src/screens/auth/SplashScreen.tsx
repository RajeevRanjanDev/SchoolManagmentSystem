import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors, Typography, Spacing } from '../../theme';
import { useAuth } from '../../hooks/useAuth';
import type { AuthNavProp } from '../../types/navigation';

export function SplashScreen() {
  const navigation = useNavigation<AuthNavProp<'Splash'>>();
  const { isAuthenticated } = useAuth();
  const scaleAnim = new Animated.Value(0.6);
  const opacityAnim = new Animated.Value(0);

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 60, friction: 8 }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => {
      if (!isAuthenticated) {
        navigation.replace('Login');
      }
      // If authenticated, RootNavigator handles routing to correct dashboard
    }, 2500);

    return () => clearTimeout(timer);
  }, [isAuthenticated, navigation]);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.logoContainer, { transform: [{ scale: scaleAnim }], opacity: opacityAnim }]}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoText}>🏫</Text>
        </View>
        <Text style={styles.appName}>SMS</Text>
        <Text style={styles.tagline}>School Management System</Text>
      </Animated.View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Multi-Tenant School ERP</Text>
        <Text style={styles.version}>v1.0.0</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  logoText: {
    fontSize: 48,
  },
  appName: {
    fontSize: 42,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: 4,
  },
  tagline: {
    ...Typography.body1,
    color: 'rgba(255,255,255,0.8)',
    marginTop: Spacing.sm,
    letterSpacing: 0.5,
  },
  footer: {
    position: 'absolute',
    bottom: Spacing.xxl,
    alignItems: 'center',
  },
  footerText: {
    ...Typography.caption,
    color: 'rgba(255,255,255,0.6)',
  },
  version: {
    ...Typography.caption,
    color: 'rgba(255,255,255,0.4)',
    marginTop: Spacing.xs,
  },
});
