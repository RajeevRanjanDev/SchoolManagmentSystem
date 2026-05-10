import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors } from '@constants/colors';
import { Sizes } from '@constants/sizes';

interface Props {
  icon?: string;
  title: string;
  subtitle?: string;
}

const EmptyState: React.FC<Props> = ({
  icon = 'inbox-outline',
  title,
  subtitle,
}) => (
  <View style={styles.container}>
    <Icon name={icon} size={64} color={Colors.border} />
    <Text style={styles.title}>{title}</Text>
    {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Sizes.xxl,
  },
  title: {
    marginTop: Sizes.md,
    fontSize: Sizes.fontLg,
    fontWeight: '600',
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: Sizes.sm,
    fontSize: Sizes.fontSm,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default EmptyState;
