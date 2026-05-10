import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { Colors } from '@constants/colors';
import { Sizes } from '@constants/sizes';

interface Props {
  message?: string;
  fullScreen?: boolean;
}

const LoadingSpinner: React.FC<Props> = ({
  message,
  fullScreen = false,
}) => (
  <View style={[styles.container, fullScreen && styles.fullScreen]}>
    <ActivityIndicator size="large" color={Colors.primary} />
    {message && <Text style={styles.message}>{message}</Text>}
  </View>
);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Sizes.xl,
  },
  fullScreen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  message: {
    marginTop: Sizes.sm,
    fontSize: Sizes.fontSm,
    color: Colors.textSecondary,
  },
});

export default LoadingSpinner;
