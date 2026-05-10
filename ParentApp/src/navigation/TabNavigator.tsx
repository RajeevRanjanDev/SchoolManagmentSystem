import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
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
        tabBarShowLabel: true,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.label,
        tabBarIcon: ({ color, focused }) => {
          const iconMap: Record<string, string> = {
            Dashboard: focused ? 'view-dashboard' : 'view-dashboard-outline',
            Attendance: focused ? 'calendar-check' : 'calendar-check-outline',
            Fees: focused ? 'cash-multiple' : 'cash-multiple',
            Notifications: focused ? 'bell' : 'bell-outline',
            Profile: focused ? 'account-circle' : 'account-circle-outline',
          };
          return (
            <View>
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
      <Tab.Screen name="Profile"       component={ProfileScreen}       options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    height: Sizes.tabBarHeight,
    paddingBottom: 8,
    paddingTop: 6,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    ...Sizes.shadowSm,
  },
  label: { fontSize: 10, fontWeight: '600' },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
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
