import React from 'react';
import { Text, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { TransportDashboardScreen } from '../screens/transport/TransportDashboardScreen';
import { BusTrackingScreen } from '../screens/shared/BusTrackingScreen';
import { RouteManagementScreen } from '../screens/shared/RouteManagementScreen';
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

export function TransportNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: Colors.surface, height: 60, paddingBottom: 8 },
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen
        name="TransHome"
        component={TransportDashboardScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="🚌" label="Home" focused={focused} /> }}
      />
      <Tab.Screen
        name="BusTracking"
        component={BusTrackingScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="📍" label="Tracking" focused={focused} /> }}
      />
      <Tab.Screen
        name="Routes"
        component={RouteManagementScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="🗺️" label="Routes" focused={focused} /> }}
      />
      <Tab.Screen
        name="TransProfile"
        component={ProfileScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="👤" label="Profile" focused={focused} /> }}
      />
    </Tab.Navigator>
  );
}
