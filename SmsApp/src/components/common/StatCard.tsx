import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  color?: string;
  icon?: React.ReactNode;
  style?: ViewStyle;
}

export function StatCard({ title, value, subtitle, color = Colors.primary, icon, style }: StatCardProps) {
  return (
    <View style={[styles.card, style]}>
      <View style={[styles.iconContainer, { backgroundColor: color + '18' }]}>
        {icon ? icon : <View style={[styles.dot, { backgroundColor: color }]} />}
      </View>
      <Text style={[styles.value, { color }]}>{value}</Text>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    flex: 1,
    margin: Spacing.xs,
    ...Shadows.md,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.round,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  value: {
    ...Typography.h3,
    marginBottom: 2,
  },
  title: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  subtitle: {
    ...Typography.overline,
    color: Colors.textTertiary,
    marginTop: 2,
  },
});
