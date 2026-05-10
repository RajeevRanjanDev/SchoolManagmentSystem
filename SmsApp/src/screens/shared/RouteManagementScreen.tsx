import React from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { transportApi } from '../../api/transport.api';
import { QUERY_KEYS } from '../../constants';
import { Header } from '../../components/common/Header';
import { Card } from '../../components/common/Card';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';
import type { TransportRoute } from '../../types';

export function RouteManagementScreen() {
  const { data: routes, isLoading, refetch, isRefetching } = useQuery({
    queryKey: QUERY_KEYS.ROUTES,
    queryFn: transportApi.getRoutes,
  });

  function renderRoute({ item }: { item: TransportRoute }) {
    return (
      <View style={styles.routeCard}>
        <View style={styles.routeIcon}>
          <Text style={styles.routeEmoji}>🗺️</Text>
        </View>
        <View style={styles.routeInfo}>
          <Text style={styles.routeName}>{item.routeName}</Text>
          <Text style={styles.routePoints}>📍 {item.startPoint} → {item.endPoint}</Text>
          {item.vehicleId ? <Text style={styles.vehicle}>🚌 Bus #{item.vehicleId}</Text> : null}
          {item.stopPoints && item.stopPoints.length > 0 && (
            <Text style={styles.stops}>Stops: {item.stopPoints.join(' → ')}</Text>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Route Management" subtitle="Transport routes" />

      {isLoading ? (
        <LoadingSpinner fullScreen />
      ) : (
        <FlatList
          data={routes ?? []}
          keyExtractor={item => String(item.id)}
          renderItem={renderRoute}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          ListEmptyComponent={<EmptyState title="No routes configured" message="Contact admin to add transport routes" />}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  list: { padding: Spacing.md },
  routeCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.md, flexDirection: 'row', alignItems: 'flex-start', ...Shadows.sm },
  routeIcon: { width: 44, height: 44, borderRadius: 10, backgroundColor: Colors.transportColor + '18', alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  routeEmoji: { fontSize: 22 },
  routeInfo: { flex: 1 },
  routeName: { ...Typography.h5, color: Colors.textPrimary, marginBottom: 4 },
  routePoints: { ...Typography.body2, color: Colors.textSecondary },
  vehicle: { ...Typography.caption, color: Colors.primary, marginTop: 4 },
  stops: { ...Typography.caption, color: Colors.textTertiary, marginTop: 4, lineHeight: 18 },
});
