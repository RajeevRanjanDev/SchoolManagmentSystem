import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Colors } from '@constants/colors';
import { Sizes } from '@constants/sizes';

interface Props {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  padding?: number;
}

const Card: React.FC<Props> = ({
  children,
  style,
  padding = Sizes.cardPadding,
}) => (
  <View style={[styles.card, { padding }, style as ViewStyle]}>{children}</View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Sizes.cardRadius,
    ...Sizes.shadowMd,
  },
});

export default Card;
