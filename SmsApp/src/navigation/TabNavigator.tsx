import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors } from '@constants/colors';
import { Sizes } from '@constants/sizes';
import { useAppSelector } from '@store/hooks';
import { TabParams } from './types';

// Screens
import DashboardScreen   from '@screens/dashboard/DashboardScreen';
import AttendanceScreen  from '@screens/attendance/AttendanceScreen';
import FeesScreen        from '@screens/fees/FeeHistoryScreen';
import NotificationsScreen from '@screens/notifications/NotificationsScreen';
import ProfileScreen     from '@screens/profile/ProfileScreen';

const Tab = createBottomTabNavigator<TabParams>();

const TabNavigator = () => {
  const unreadCount = useAppSelector(s => s.notification.unreadCount);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarItemStyle: styles.item,
        tabBarStyle: styles.tabBar,
        tabBarIcon: ({ color, focused }) => {
          const iconMap: Record<string, string> = {
            Dashboard: focused ? 'home' : 'home-outline',
            Attendance: focused ? 'calendar-check' : 'calendar-check-outline',
            Fees: focused ? 'credit-card' : 'credit-card-outline',
            Notifications: focused ? 'chat' : 'chat-outline',
            Profile: focused ? 'menu' : 'menu',
          };
          return (
            <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
              <Icon name={iconMap[route.name] ?? 'circle'} size={24} color={color} />
              {route.name === 'Notifications' && unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Text>
                </View>
              )}
            </View>
          );
        },
      })}>
      <Tab.Screen name="Dashboard"     component={DashboardScreen}     options={{ title: 'Home' }} />
      <Tab.Screen name="Attendance"    component={AttendanceScreen}    options={{ title: 'Attendance' }} />
      <Tab.Screen name="Fees"          component={FeesScreen}          options={{ title: 'Fees' }} />
      <Tab.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Alerts' }} />
      <Tab.Screen name="Profile"       component={ProfileScreen}       options={{ title: 'More' }} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  // Floating pill tab bar
  tabBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: Platform.OS === 'ios' ? 28 : 16,
    height: 64,
    borderRadius: Sizes.radiusFull,
    backgroundColor: Colors.white,
    borderTopWidth: 0,
    paddingHorizontal: 6,
    ...Sizes.shadowMd,
  },
  item: { height: 64 },
  iconWrap: {
    width: 48,
    height: 40,
    borderRadius: Sizes.radiusFull,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: { backgroundColor: Colors.softBlueBg },
  badge: {
    position: 'absolute',
    top: -2,
    right: 2,
    backgroundColor: Colors.danger,
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { color: Colors.white, fontSize: 9, fontWeight: '700' },
});

export default TabNavigator;
