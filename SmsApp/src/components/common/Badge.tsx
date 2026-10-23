import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '@constants/colors';
import { Sizes } from '@constants/sizes';

interface Props {
  label: string;
  color?: string;
  textColor?: string;
  style?: ViewStyle;
}

const Badge: React.FC<Props> = ({
  label,
  color = Colors.primary,
  textColor = Colors.white,
  style,
}) => (
  <View style={[styles.badge, { backgroundColor: color + '20' }, style]}>
    <Text style={[styles.text, { color }]}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: Sizes.radiusFull,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: Sizes.fontXs,
    fontWeight: '600',
  },
});

export default Badge;
