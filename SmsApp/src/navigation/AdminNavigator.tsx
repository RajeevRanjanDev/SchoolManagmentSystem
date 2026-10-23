import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors } from '@constants/colors';
import { Sizes } from '@constants/sizes';
import { AdminTabParams, AdminStackParams } from './types';

import AdminDashboardScreen     from '@screens/admin/AdminDashboardScreen';
import AdminStudentsScreen      from '@screens/admin/AdminStudentsScreen';
import AdminStudentDetailScreen from '@screens/admin/AdminStudentDetailScreen';
import AdmissionWizardScreen     from '@screens/admin/AdmissionWizardScreen';
import AdminStudentLifecycleScreen from '@screens/admin/AdminStudentLifecycleScreen';
import AdminTeachersScreen      from '@screens/admin/AdminTeachersScreen';
import AdminTeacherFormScreen   from '@screens/admin/AdminTeacherFormScreen';
import AdminTeacherAssignmentsScreen from '@screens/admin/AdminTeacherAssignmentsScreen';
import AdminClassesScreen       from '@screens/admin/AdminClassesScreen';
import AdminSubjectsScreen      from '@screens/admin/AdminSubjectsScreen';
import AdminFeeTemplatesScreen  from '@screens/admin/AdminFeeTemplatesScreen';
import AdminLibraryScreen       from '@screens/admin/AdminLibraryScreen';
import AdminAttendanceScreen    from '@screens/admin/AdminAttendanceScreen';
import CircularsScreen          from '@screens/comms/CircularsScreen';
import EventsScreen             from '@screens/comms/EventsScreen';
import AdminFeesScreen          from '@screens/admin/AdminFeesScreen';
import AdminBroadcastScreen     from '@screens/admin/AdminBroadcastScreen';
import AdminProfileScreen       from '@screens/admin/AdminProfileScreen';

const Tab = createBottomTabNavigator<AdminTabParams>();
const Stack = createNativeStackNavigator<AdminStackParams>();

const AdminTabs = () => (
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
          Home:      focused ? 'home' : 'home-outline',
          Students:  focused ? 'account-school' : 'account-school-outline',
          Fees:      focused ? 'credit-card' : 'credit-card-outline',
          Broadcast: focused ? 'bullhorn' : 'bullhorn-outline',
          Profile:   focused ? 'menu' : 'menu',
        };
        return (
          <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
            <Icon name={iconMap[route.name] ?? 'circle'} size={24} color={color} />
          </View>
        );
      },
    })}>
    <Tab.Screen name="Home"      component={AdminDashboardScreen} />
    <Tab.Screen name="Students"  component={AdminStudentsScreen} />
    <Tab.Screen name="Fees"      component={AdminFeesScreen} />
    <Tab.Screen name="Broadcast" component={AdminBroadcastScreen} />
    <Tab.Screen name="Profile"   component={AdminProfileScreen} />
  </Tab.Navigator>
);

const AdminNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="AdminTabs"     component={AdminTabs} />
    <Stack.Screen name="StudentDetail"    component={AdminStudentDetailScreen} />
    <Stack.Screen name="StudentLifecycle" component={AdminStudentLifecycleScreen} />
    <Stack.Screen name="AdmissionWizard"  component={AdmissionWizardScreen} />
    <Stack.Screen name="Teachers"         component={AdminTeachersScreen} />
    <Stack.Screen name="TeacherForm"      component={AdminTeacherFormScreen} />
    <Stack.Screen name="TeacherAssignments" component={AdminTeacherAssignmentsScreen} />
    <Stack.Screen name="Classes"          component={AdminClassesScreen} />
    <Stack.Screen name="Subjects"         component={AdminSubjectsScreen} />
    <Stack.Screen name="FeeTemplates"     component={AdminFeeTemplatesScreen} />
    <Stack.Screen name="Library"          component={AdminLibraryScreen} />
    <Stack.Screen name="Attendance"       component={AdminAttendanceScreen} />
    <Stack.Screen name="Circulars"        component={CircularsScreen} />
    <Stack.Screen name="Events"           component={EventsScreen} />
  </Stack.Navigator>
);

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute', left: 16, right: 16, bottom: Platform.OS === 'ios' ? 28 : 16,
    height: 64, borderRadius: Sizes.radiusFull, backgroundColor: Colors.white,
    borderTopWidth: 0, paddingHorizontal: 6, ...Sizes.shadowMd,
  },
  item: { height: 64 },
  iconWrap: { width: 48, height: 40, borderRadius: Sizes.radiusFull, alignItems: 'center', justifyContent: 'center' },
  iconWrapActive: { backgroundColor: Colors.softBlueBg },
});

export default AdminNavigator;
