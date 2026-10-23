import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors } from '@constants/colors';
import { Sizes } from '@constants/sizes';
import { TransportTabParams } from './types';

import TransportStudentsScreen from '@screens/transport/TransportStudentsScreen';
import TransportRoutesScreen from '@screens/transport/TransportRoutesScreen';
import EmployeeProfileScreen from '@screens/common/EmployeeProfileScreen';

const Tab = createBottomTabNavigator<TransportTabParams>();

const TransportNavigator = () => (
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
          Students: focused ? 'bus-school' : 'bus-school',
          Routes:   focused ? 'road-variant' : 'road-variant',
          Profile:  focused ? 'menu' : 'menu',
        };
        return (
          <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
            <Icon name={iconMap[route.name] ?? 'circle'} size={24} color={color} />
          </View>
        );
      },
    })}>
    <Tab.Screen name="Students" component={TransportStudentsScreen} />
    <Tab.Screen name="Routes"   component={TransportRoutesScreen} />
    <Tab.Screen name="Profile"  component={EmployeeProfileScreen} />
  </Tab.Navigator>
);

const styles = StyleSheet.create({
  tabBar: { position: 'absolute', left: 16, right: 16, bottom: Platform.OS === 'ios' ? 28 : 16, height: 64, borderRadius: Sizes.radiusFull, backgroundColor: Colors.white, borderTopWidth: 0, paddingHorizontal: 6, ...Sizes.shadowMd },
  item: { height: 64 },
  iconWrap: { width: 48, height: 40, borderRadius: Sizes.radiusFull, alignItems: 'center', justifyContent: 'center' },
  iconWrapActive: { backgroundColor: Colors.softBlueBg },
});

export default TransportNavigator;
