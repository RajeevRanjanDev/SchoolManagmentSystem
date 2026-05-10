import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing } from '../../theme';

interface LoadingSpinnerProps {
  fullScreen?: boolean;
  message?: string;
  color?: string;
}

export function LoadingSpinner({
  fullScreen = false,
  message,
  color = Colors.primary,
}: LoadingSpinnerProps) {
  if (fullScreen) {
    return (
      <View style={styles.fullScreen}>
        <ActivityIndicator size="large" color={color} />
        {message ? <Text style={styles.message}>{message}</Text> : null}
      </View>
    );
  }

  return (
    <View style={styles.inline}>
      <ActivityIndicator size="small" color={color} />
      {message ? <Text style={styles.inlineMessage}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  inline: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
  },
  message: {
    ...Typography.body2,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  inlineMessage: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
  },
});
