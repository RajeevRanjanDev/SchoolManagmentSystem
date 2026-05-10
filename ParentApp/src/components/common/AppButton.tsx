import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Colors } from '@constants/colors';
import { Sizes } from '@constants/sizes';

interface Props {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const AppButton: React.FC<Props> = ({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  size = 'md',
  style,
  textStyle,
}) => {
  const isDisabled = disabled || loading;

  const heightMap = { sm: 40, md: 52, lg: 60 };
  const fontSizeMap = { sm: 13, md: 15, lg: 17 };

  if (variant === 'primary') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={isDisabled}
        activeOpacity={0.85}
        style={[{ borderRadius: Sizes.radiusMd }, style]}>
        <LinearGradient
          colors={isDisabled ? ['#CBD5E1', '#94A3B8'] : (Colors.gradientPrimary as [string, string])}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.base, { height: heightMap[size] }]}>
          {loading ? (
            <ActivityIndicator color={Colors.white} size="small" />
          ) : (
            <Text style={[styles.primaryText, { fontSize: fontSizeMap[size] }, textStyle]}>
              {title}
            </Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  const outlineStyles: ViewStyle = {
    borderWidth: 1.5,
    borderColor: variant === 'danger' ? Colors.danger : Colors.primary,
    backgroundColor: variant === 'ghost' ? 'transparent' : Colors.white,
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.75}
      style={[
        styles.base,
        outlineStyles,
        { height: heightMap[size], borderRadius: Sizes.radiusMd, opacity: isDisabled ? 0.5 : 1 },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator
          color={variant === 'danger' ? Colors.danger : Colors.primary}
          size="small"
        />
      ) : (
        <Text
          style={[
            styles.altText,
            {
              color: variant === 'danger' ? Colors.danger : Colors.primary,
              fontSize: fontSizeMap[size],
            },
            textStyle,
          ]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Sizes.radiusMd,
    paddingHorizontal: Sizes.lg,
  },
  primaryText: {
    color: Colors.white,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  altText: {
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});

export default AppButton;
