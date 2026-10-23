import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors } from '@constants/colors';
import { Sizes } from '@constants/sizes';

const SplashScreen = () => {
  const scaleAnim  = useRef(new Animated.Value(0.5)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 60,
        friction: 8,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <LinearGradient
      colors={Colors.gradientPrimary as [string, string]}
      style={styles.container}>
      <Animated.View
        style={[
          styles.logoWrapper,
          { transform: [{ scale: scaleAnim }], opacity: opacityAnim },
        ]}>
        <View style={styles.iconCircle}>
          <Icon name="school" size={52} color={Colors.primary} />
        </View>
        <Text style={styles.appName}>SMS Parent</Text>
        <Text style={styles.tagline}>School Management System</Text>
      </Animated.View>

      <Text style={styles.version}>v1.0.0</Text>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logoWrapper: { alignItems: 'center' },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...Sizes.shadowLg,
  },
  appName: {
    marginTop: Sizes.lg,
    fontSize: Sizes.fontDisplay,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: 1,
  },
  tagline: {
    marginTop: Sizes.xs,
    fontSize: Sizes.fontMd,
    color: 'rgba(255,255,255,0.8)',
  },
  version: {
    position: 'absolute',
    bottom: 40,
    fontSize: Sizes.fontSm,
    color: 'rgba(255,255,255,0.6)',
  },
});

export default SplashScreen;
