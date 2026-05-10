import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { transportApi } from '../../api/transport.api';
import { QUERY_KEYS } from '../../constants';
import { useAuth } from '../../hooks/useAuth';
import { Avatar } from '../../components/common/Avatar';
import { Card } from '../../components/common/Card';
import { StatCard } from '../../components/common/StatCard';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';
import type { TransportVehicle } from '../../types';

export function TransportDashboardScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<any>();

  const { data: vehicles, isLoading, refetch, isRefetching } = useQuery({
    queryKey: QUERY_KEYS.VEHICLES,
    queryFn: transportApi.getVehicles,
  });

  const { data: routes } = useQuery({
    queryKey: QUERY_KEYS.ROUTES,
    queryFn: transportApi.getRoutes,
  });

  const vehicleList = vehicles ?? [];
  const routeList = routes ?? [];

  if (isLoading) return <LoadingSpinner fullScreen />;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
    >
      <View style={styles.header}>
        <Avatar firstName={user?.firstName} lastName={user?.lastName} size={46} />
        <View style={styles.headerText}>
          <Text style={styles.greeting}>Welcome,</Text>
          <Text style={styles.userName}>{user?.firstName} {user?.lastName}</Text>
          <Text style={styles.role}>Transport Manager</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <StatCard title="Total Buses" value={vehicleList.length} color={Colors.transportColor} icon={<Text>🚌</Text>} />
        <StatCard title="Total Routes" value={routeList.length} color={Colors.primary} icon={<Text>🗺️</Text>} />
      </View>

      {/* Vehicle List */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Vehicles</Text>
        {vehicleList.map((v: TransportVehicle) => (
          <TouchableOpacity
            key={v.id}
            style={styles.vehicleCard}
            onPress={() => navigation.navigate('BusTracking')}
          >
            <Text style={styles.vehicleIcon}>🚌</Text>
            <View style={styles.vehicleInfo}>
              <Text style={styles.vehicleNumber}>{v.vehicleNumber}</Text>
              <Text style={styles.vehicleName}>{v.vehicleName}</Text>
              {v.driverName ? <Text style={styles.driver}>Driver: {v.driverName}</Text> : null}
            </View>
            <Text style={styles.trackText}>Track →</Text>
          </TouchableOpacity>
        ))}
        {vehicleList.length === 0 && (
          <Card><Text style={styles.emptyText}>No vehicles registered</Text></Card>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { backgroundColor: Colors.transportColor, flexDirection: 'row', alignItems: 'center', padding: Spacing.md, paddingTop: Spacing.lg },
  headerText: { marginLeft: Spacing.md },
  greeting: { ...Typography.caption, color: 'rgba(255,255,255,0.7)' },
  userName: { ...Typography.h5, color: Colors.white },
  role: { ...Typography.caption, color: 'rgba(255,255,255,0.6)' },
  statsRow: { flexDirection: 'row', padding: Spacing.sm },
  section: { padding: Spacing.md },
  sectionTitle: { ...Typography.h5, color: Colors.textPrimary, marginBottom: Spacing.sm },
  vehicleCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.md, flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm, ...Shadows.sm },
  vehicleIcon: { fontSize: 28, marginRight: Spacing.md },
  vehicleInfo: { flex: 1 },
  vehicleNumber: { ...Typography.h5, color: Colors.textPrimary },
  vehicleName: { ...Typography.body2, color: Colors.textSecondary },
  driver: { ...Typography.caption, color: Colors.textTertiary },
  trackText: { ...Typography.caption, color: Colors.primary, fontWeight: '700' },
  emptyText: { ...Typography.body2, color: Colors.textSecondary, textAlign: 'center' },
});
