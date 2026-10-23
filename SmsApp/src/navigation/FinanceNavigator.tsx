import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors } from '@constants/colors';
import { Sizes } from '@constants/sizes';
import { FinanceTabParams } from './types';

import AdminFeesScreen from '@screens/admin/AdminFeesScreen';
import FinanceReconScreen from '@screens/finance/FinanceReconScreen';
import FinancePaymentsScreen from '@screens/finance/FinancePaymentsScreen';
import FinanceGatewayScreen from '@screens/finance/FinanceGatewayScreen';
import EmployeeProfileScreen from '@screens/common/EmployeeProfileScreen';

const Tab = createBottomTabNavigator<FinanceTabParams>();

const FinanceNavigator = () => (
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
          Fees:           focused ? 'credit-card' : 'credit-card-outline',
          Payments:       focused ? 'cash-multiple' : 'cash-multiple',
          Reconciliation: focused ? 'scale-balance' : 'scale-balance',
          Gateway:        focused ? 'key-variant' : 'key-outline',
          Profile:        focused ? 'menu' : 'menu',
        };
        return (
          <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
            <Icon name={iconMap[route.name] ?? 'circle'} size={24} color={color} />
          </View>
        );
      },
    })}>
    <Tab.Screen name="Fees"           component={AdminFeesScreen} />
    <Tab.Screen name="Payments"       component={FinancePaymentsScreen} />
    <Tab.Screen name="Reconciliation" component={FinanceReconScreen} />
    <Tab.Screen name="Gateway"        component={FinanceGatewayScreen} />
    <Tab.Screen name="Profile"        component={EmployeeProfileScreen} />
  </Tab.Navigator>
);

const styles = StyleSheet.create({
  tabBar: { position: 'absolute', left: 16, right: 16, bottom: Platform.OS === 'ios' ? 28 : 16, height: 64, borderRadius: Sizes.radiusFull, backgroundColor: Colors.white, borderTopWidth: 0, paddingHorizontal: 6, ...Sizes.shadowMd },
  item: { height: 64 },
  iconWrap: { width: 48, height: 40, borderRadius: Sizes.radiusFull, alignItems: 'center', justifyContent: 'center' },
  iconWrapActive: { backgroundColor: Colors.softBlueBg },
});

export default FinanceNavigator;
