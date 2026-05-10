import React from 'react';
import { Text, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AccountantDashboardScreen } from '../screens/accountant/AccountantDashboardScreen';
import { FeeManagementScreen } from '../screens/shared/FeeManagementScreen';
import { ReportsScreen } from '../screens/shared/ReportsScreen';
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

export function AccountantNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: Colors.surface, height: 60, paddingBottom: 8 },
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen
        name="AccHome"
        component={AccountantDashboardScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="🏠" label="Home" focused={focused} /> }}
      />
      <Tab.Screen
        name="FeeManagement"
        component={FeeManagementScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="💰" label="Fees" focused={focused} /> }}
      />
      <Tab.Screen
        name="Reports"
        component={ReportsScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="📊" label="Reports" focused={focused} /> }}
      />
      <Tab.Screen
        name="AccProfile"
        component={ProfileScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="👤" label="Profile" focused={focused} /> }}
      />
    </Tab.Navigator>
  );
}
