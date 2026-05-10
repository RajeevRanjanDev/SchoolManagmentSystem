import React from 'react';
import { Text, TouchableOpacity, StyleSheet, View } from 'react-native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';

import { DashboardScreen } from '../screens/admin/DashboardScreen';
import { StudentManagementScreen } from '../screens/admin/StudentManagementScreen';
import { StudentDetailScreen } from '../screens/admin/StudentDetailScreen';
import { AddStudentScreen } from '../screens/admin/AddStudentScreen';
import { TeacherManagementScreen } from '../screens/admin/TeacherManagementScreen';
import { ParentManagementScreen } from '../screens/admin/ParentManagementScreen';
import { SchoolSetupScreen } from '../screens/admin/SchoolSetupScreen';
import { FeeManagementScreen } from '../screens/shared/FeeManagementScreen';
import { LibraryManagementScreen } from '../screens/shared/LibraryManagementScreen';
import { BusTrackingScreen } from '../screens/shared/BusTrackingScreen';
import { RouteManagementScreen } from '../screens/shared/RouteManagementScreen';
import { CircularManagementScreen } from '../screens/shared/CircularManagementScreen';
import { EventManagementScreen } from '../screens/shared/EventManagementScreen';
import { ReportsScreen } from '../screens/shared/ReportsScreen';
import { NotificationsScreen } from '../screens/shared/NotificationsScreen';
import { ProfileScreen } from '../screens/shared/ProfileScreen';
import { TimetableScreen } from '../screens/teacher/TimetableScreen';
import { Colors, Spacing } from '../theme';
import { useAppSelector } from '../store/hooks';

const Drawer = createDrawerNavigator();
const Stack = createStackNavigator();

function StudentStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="StudentList" component={StudentManagementScreen} />
      <Stack.Screen name="StudentDetail" component={StudentDetailScreen} />
      <Stack.Screen name="AddStudent" component={AddStudentScreen} />
    </Stack.Navigator>
  );
}

function DrawerLabel({ label, icon }: { label: string; icon: string }) {
  return (
    <View style={drawerStyles.item}>
      <Text style={drawerStyles.icon}>{icon}</Text>
      <Text style={drawerStyles.label}>{label}</Text>
    </View>
  );
}

export function AdminNavigator() {
  const unreadCount = useAppSelector(s => s.notifications.unreadCount);

  return (
    <Drawer.Navigator
      screenOptions={{
        headerShown: false,
        drawerStyle: drawerStyles.drawer,
        drawerActiveTintColor: Colors.primary,
        drawerInactiveTintColor: Colors.textSecondary,
        drawerLabelStyle: drawerStyles.drawerLabel,
      }}
    >
      <Drawer.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ drawerLabel: () => <DrawerLabel label="Dashboard" icon="🏠" /> }}
      />
      <Drawer.Screen
        name="Students"
        component={StudentStack}
        options={{ drawerLabel: () => <DrawerLabel label="Students" icon="👨‍🎓" /> }}
      />
      <Drawer.Screen
        name="Teachers"
        component={TeacherManagementScreen}
        options={{ drawerLabel: () => <DrawerLabel label="Teachers" icon="👩‍🏫" /> }}
      />
      <Drawer.Screen
        name="Parents"
        component={ParentManagementScreen}
        options={{ drawerLabel: () => <DrawerLabel label="Parents" icon="👪" /> }}
      />
      <Drawer.Screen
        name="FeeManagement"
        component={FeeManagementScreen}
        options={{ drawerLabel: () => <DrawerLabel label="Fee Management" icon="💰" /> }}
      />
      <Drawer.Screen
        name="Timetable"
        component={TimetableScreen}
        options={{ drawerLabel: () => <DrawerLabel label="Timetable" icon="📅" /> }}
      />
      <Drawer.Screen
        name="Library"
        component={LibraryManagementScreen}
        options={{ drawerLabel: () => <DrawerLabel label="Library" icon="📚" /> }}
      />
      <Drawer.Screen
        name="BusTracking"
        component={BusTrackingScreen}
        options={{ drawerLabel: () => <DrawerLabel label="Bus Tracking" icon="🚌" /> }}
      />
      <Drawer.Screen
        name="Routes"
        component={RouteManagementScreen}
        options={{ drawerLabel: () => <DrawerLabel label="Routes" icon="🗺️" /> }}
      />
      <Drawer.Screen
        name="Circulars"
        component={CircularManagementScreen}
        options={{ drawerLabel: () => <DrawerLabel label="Circulars" icon="📋" /> }}
      />
      <Drawer.Screen
        name="Events"
        component={EventManagementScreen}
        options={{ drawerLabel: () => <DrawerLabel label="Events" icon="🎉" /> }}
      />
      <Drawer.Screen
        name="Reports"
        component={ReportsScreen}
        options={{ drawerLabel: () => <DrawerLabel label="Reports & Analytics" icon="📊" /> }}
      />
      <Drawer.Screen
        name="SchoolSetup"
        component={SchoolSetupScreen}
        options={{ drawerLabel: () => <DrawerLabel label="School Setup" icon="🏫" /> }}
      />
      <Drawer.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          drawerLabel: () => (
            <DrawerLabel label={`Notifications${unreadCount > 0 ? ` (${unreadCount})` : ''}`} icon="🔔" />
          ),
        }}
      />
      <Drawer.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ drawerLabel: () => <DrawerLabel label="Profile" icon="👤" /> }}
      />
    </Drawer.Navigator>
  );
}

const drawerStyles = StyleSheet.create({
  drawer: {
    backgroundColor: Colors.surface,
    width: 280,
  },
  drawerLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  icon: {
    fontSize: 20,
    marginRight: Spacing.sm,
  },
  label: {
    fontSize: 15,
    color: Colors.textPrimary,
  },
});
