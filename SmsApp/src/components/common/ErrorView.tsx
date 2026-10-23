import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AppButton from './AppButton';
import { Colors } from '@constants/colors';
import { Sizes } from '@constants/sizes';

interface Props {
  message?: string;
  onRetry?: () => void;
}

const ErrorView: React.FC<Props> = ({
  message = 'Something went wrong. Please try again.',
  onRetry,
}) => (
  <View style={styles.container}>
    <Icon name="alert-circle-outline" size={56} color={Colors.danger} />
    <Text style={styles.message}>{message}</Text>
    {onRetry && (
      <AppButton
        title="Try Again"
        onPress={onRetry}
        variant="outline"
        size="sm"
        style={styles.button}
      />
    )}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Sizes.xl,
  },
  message: {
    marginTop: Sizes.md,
    fontSize: Sizes.fontMd,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  button: { marginTop: Sizes.lg, minWidth: 120 },
});

export default ErrorView;
