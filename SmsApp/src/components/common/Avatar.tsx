import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Colors, Typography, BorderRadius } from '../../theme';
import { getInitials } from '../../utils/formatters';

interface AvatarProps {
  firstName?: string;
  lastName?: string;
  photoUrl?: string;
  size?: number;
  color?: string;
}

export function Avatar({ firstName, lastName, photoUrl, size = 42, color = Colors.primary }: AvatarProps) {
  const radius = size / 2;
  const fontSize = size * 0.35;

  if (photoUrl) {
    return (
      <Image
        source={{ uri: photoUrl }}
        style={{ width: size, height: size, borderRadius: radius }}
      />
    );
  }

  return (
    <View style={[styles.container, { width: size, height: size, borderRadius: radius, backgroundColor: color + '22' }]}>
      <Text style={[styles.initials, { fontSize, color }]}>
        {getInitials(firstName, lastName)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontWeight: '700',
  },
});
