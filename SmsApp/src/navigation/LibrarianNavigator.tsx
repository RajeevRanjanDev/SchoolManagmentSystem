import React from 'react';
import { Text, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { LibrarianDashboardScreen } from '../screens/librarian/LibrarianDashboardScreen';
import { LibraryManagementScreen } from '../screens/shared/LibraryManagementScreen';
import { ProfileScreen } from '../screens/shared/ProfileScreen';
import { Colors } from '../theme';

const Tab = createBottomTabNavigator();

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

export function LibrarianNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: Colors.surface, height: 60, paddingBottom: 8 },
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen
        name="LibHome"
        component={LibrarianDashboardScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="🏠" label="Home" focused={focused} /> }}
      />
      <Tab.Screen
        name="LibraryMgmt"
        component={LibraryManagementScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="📚" label="Library" focused={focused} /> }}
      />
      <Tab.Screen
        name="LibProfile"
        component={ProfileScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="👤" label="Profile" focused={focused} /> }}
      />
    </Tab.Navigator>
  );
}
