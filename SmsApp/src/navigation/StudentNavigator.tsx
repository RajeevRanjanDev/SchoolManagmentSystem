import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors } from '@constants/colors';
import { Sizes } from '@constants/sizes';
import { StudentTabParams, StudentStackParams } from './types';

import StudentHomeScreen        from '@screens/student/StudentHomeScreen';
import StudentAttendanceScreen  from '@screens/student/StudentAttendanceScreen';
import StudentFeesScreen        from '@screens/student/StudentFeesScreen';
import StudentUpdatesScreen     from '@screens/student/StudentUpdatesScreen';
import StudentProfileScreen     from '@screens/student/StudentProfileScreen';
import StudentResultsScreen     from '@screens/student/StudentResultsScreen';
import StudentAssignmentsScreen from '@screens/student/StudentAssignmentsScreen';

const Tab = createBottomTabNavigator<StudentTabParams>();
const Stack = createNativeStackNavigator<StudentStackParams>();

const StudentTabs = () => (
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
          Home:       focused ? 'home' : 'home-outline',
          Attendance: focused ? 'calendar-check' : 'calendar-check-outline',
          Fees:       focused ? 'credit-card' : 'credit-card-outline',
          Updates:    focused ? 'chat' : 'chat-outline',
          Profile:    focused ? 'menu' : 'menu',
        };
        return (
          <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
            <Icon name={iconMap[route.name] ?? 'circle'} size={24} color={color} />
          </View>
        );
      },
    })}>
    <Tab.Screen name="Home"       component={StudentHomeScreen} />
    <Tab.Screen name="Attendance" component={StudentAttendanceScreen} />
    <Tab.Screen name="Fees"       component={StudentFeesScreen} />
    <Tab.Screen name="Updates"    component={StudentUpdatesScreen} />
    <Tab.Screen name="Profile"    component={StudentProfileScreen} />
  </Tab.Navigator>
);

const StudentNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="StudentTabs"        component={StudentTabs} />
    <Stack.Screen name="StudentResults"     component={StudentResultsScreen} />
    <Stack.Screen name="StudentAssignments" component={StudentAssignmentsScreen} />
  </Stack.Navigator>
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
  iconWrap: { width: 48, height: 40, borderRadius: Sizes.radiusFull, alignItems: 'center', justifyContent: 'center' },
  iconWrapActive: { backgroundColor: Colors.softBlueBg },
});

export default StudentNavigator;
