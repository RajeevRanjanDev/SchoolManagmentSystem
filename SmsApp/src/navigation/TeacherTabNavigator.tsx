import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors } from '@constants/colors';
import { Sizes } from '@constants/sizes';
import { TeacherTabParams } from './types';

import TeacherDashboardScreen from '@screens/teacher/TeacherDashboardScreen';
import MarkAttendanceScreen   from '@screens/teacher/MarkAttendanceScreen';
import TeacherNoticeScreen     from '@screens/teacher/TeacherNoticeScreen';
import ExamResultsScreen       from '@screens/teacher/ExamResultsScreen';
import TeacherProfileScreen     from '@screens/teacher/TeacherProfileScreen';

const Tab = createBottomTabNavigator<TeacherTabParams>();

const TeacherTabNavigator = () => (
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
          Dashboard:      focused ? 'home' : 'home-outline',
          MarkAttendance: focused ? 'calendar-check' : 'calendar-check-outline',
          Notices:        focused ? 'bullhorn' : 'bullhorn-outline',
          Exams:          focused ? 'chart-box' : 'chart-box-outline',
          Profile:        focused ? 'menu' : 'menu',
        };
        return (
          <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
            <Icon name={iconMap[route.name] ?? 'circle'} size={24} color={color} />
          </View>
        );
      },
    })}>
    <Tab.Screen name="Dashboard"      component={TeacherDashboardScreen} />
    <Tab.Screen name="MarkAttendance" component={MarkAttendanceScreen} />
    <Tab.Screen name="Notices"        component={TeacherNoticeScreen} />
    <Tab.Screen name="Exams"          component={ExamResultsScreen} />
    <Tab.Screen name="Profile"        component={TeacherProfileScreen} />
  </Tab.Navigator>
);

const styles = StyleSheet.create({
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
    width: 48, height: 40, borderRadius: Sizes.radiusFull,
    alignItems: 'center', justifyContent: 'center',
  },
  iconWrapActive: { backgroundColor: Colors.softBlueBg },
});

export default TeacherTabNavigator;
