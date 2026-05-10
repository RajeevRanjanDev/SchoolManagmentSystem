import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { Colors } from '@constants/colors';
import { Sizes } from '@constants/sizes';

interface Props {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightIcon?: string;
  onRightPress?: () => void;
  transparent?: boolean;
}

const Header: React.FC<Props> = ({
  title,
  subtitle,
  onBack,
  rightIcon,
  onRightPress,
  transparent = false,
}) => {
  const insets = useSafeAreaInsets();

  const content = (
    <View style={[styles.row, { paddingTop: insets.top + 8 }]}>
      {onBack ? (
        <TouchableOpacity onPress={onBack} style={styles.iconBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Icon name="arrow-left" size={24} color={Colors.white} />
        </TouchableOpacity>
      ) : (
        <View style={styles.iconBtn} />
      )}

      <View style={styles.titleBlock}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        {subtitle && <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>}
      </View>

      {rightIcon ? (
        <TouchableOpacity onPress={onRightPress} style={styles.iconBtn}>
          <Icon name={rightIcon} size={24} color={Colors.white} />
        </TouchableOpacity>
      ) : (
        <View style={styles.iconBtn} />
      )}
    </View>
  );

  if (transparent) {
    return (
      <View style={styles.transparent}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
        {content}
      </View>
    );
  }

  return (
    <LinearGradient
      colors={Colors.gradientPrimary as [string, string]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.gradient}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      {content}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: { paddingBottom: 16 },
  transparent: { paddingBottom: 16 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Sizes.md,
  },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  titleBlock: { flex: 1, alignItems: 'center' },
  title: {
    fontSize: Sizes.fontLg,
    fontWeight: '700',
    color: Colors.white,
  },
  subtitle: {
    fontSize: Sizes.fontXs,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
});

export default Header;
