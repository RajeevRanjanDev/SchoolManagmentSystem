import React from 'react';
import { Text, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';

import { TeacherDashboardScreen } from '../screens/teacher/TeacherDashboardScreen';
import { AttendanceScreen } from '../screens/teacher/AttendanceScreen';
import { HomeworkScreen } from '../screens/teacher/HomeworkScreen';
import { TimetableScreen } from '../screens/teacher/TimetableScreen';
import { ProfileScreen } from '../screens/shared/ProfileScreen';
import { ResultUploadScreen } from '../screens/teacher/ResultUploadScreen';
import { CircularManagementScreen } from '../screens/shared/CircularManagementScreen';
import { NotificationsScreen } from '../screens/shared/NotificationsScreen';
import { Colors } from '../theme';
import { useAppSelector } from '../store/hooks';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function TabIcon({ icon, label, focused }: { icon: string; label: string; focused: boolean }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ fontSize: 20 }}>{icon}</Text>
      <Text style={{ fontSize: 10, color: focused ? Colors.primary : Colors.textTertiary, marginTop: 2 }}>
        {label}
      </Text>
    </View>
  );
}

function TeacherTabs() {
  const unreadCount = useAppSelector(s => s.notifications.unreadCount);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: Colors.surface, height: 60, paddingBottom: 8 },
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen
        name="TeacherHome"
        component={TeacherDashboardScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="🏠" label="Home" focused={focused} /> }}
      />
      <Tab.Screen
        name="Attendance"
        component={AttendanceScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="✅" label="Attendance" focused={focused} /> }}
      />
      <Tab.Screen
        name="Homework"
        component={HomeworkScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="📝" label="Homework" focused={focused} /> }}
      />
      <Tab.Screen
        name="Timetable"
        component={TimetableScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="📅" label="Timetable" focused={focused} /> }}
      />
      <Tab.Screen
        name="TeacherProfile"
        component={ProfileScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="👤" label="Profile" focused={focused} /> }}
      />
    </Tab.Navigator>
  );
}

export function TeacherNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="TeacherTabs" component={TeacherTabs} />
      <Stack.Screen name="ResultUpload" component={ResultUploadScreen} />
      <Stack.Screen name="Circulars" component={CircularManagementScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
    </Stack.Navigator>
  );
}
