import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, TextInput } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useQuery, useMutation } from '@tanstack/react-query';
import { transportApi } from '../../api/transport.api';
import { QUERY_KEYS } from '../../constants';
import { useBusTracking } from '../../hooks/useWebSocket';
import { usePermissions } from '../../hooks/usePermissions';
import { Header } from '../../components/common/Header';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';
import { formatDateTime } from '../../utils/formatters';

export function BusTrackingScreen() {
  const { isTransportManager } = usePermissions();
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);
  const [manualVehicleId, setManualVehicleId] = useState('');

  // REST — initial position
  const { data: restLocation } = useQuery({
    queryKey: QUERY_KEYS.BUS_LOCATION(selectedVehicleId ?? 0),
    queryFn: () => transportApi.getLiveLocation(selectedVehicleId!),
    enabled: !!selectedVehicleId,
    refetchInterval: 30000, // Poll every 30s as fallback
  });

  // WebSocket — live updates
  const { location: wsLocation, connected } = useBusTracking(selectedVehicleId);

  // Use WS location if available, else REST
  const location = wsLocation ?? restLocation ?? null;

  // Transport Manager: update bus location
  const updateMutation = useMutation({
    mutationFn: () => {
      const position = { latitude: 28.6139, longitude: 77.2090 }; // Use device GPS in production
      return transportApi.updateBusLocation({
        vehicleId: Number(manualVehicleId),
        latitude: position.latitude,
        longitude: position.longitude,
        timestamp: new Date().toISOString(),
      });
    },
    onSuccess: () => Alert.alert('Success', 'Bus location updated!'),
    onError: () => Alert.alert('Error', 'Failed to update location.'),
  });

  const mapRegion = location
    ? { latitude: location.latitude, longitude: location.longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 }
    : { latitude: 28.6139, longitude: 77.2090, latitudeDelta: 0.05, longitudeDelta: 0.05 };

  return (
    <View style={styles.container}>
      <Header title="Bus Tracking" subtitle={connected ? '🟢 Live' : '⚪ Offline'} />

      {/* Vehicle ID input */}
      <View style={styles.vehicleSelector}>
        <TextInput
          style={styles.vehicleInput}
          placeholder="Enter Vehicle ID to track"
          placeholderTextColor={Colors.textTertiary}
          keyboardType="numeric"
          value={manualVehicleId}
          onChangeText={setManualVehicleId}
        />
        <TouchableOpacity
          style={styles.trackBtn}
          onPress={() => manualVehicleId && setSelectedVehicleId(Number(manualVehicleId))}
        >
          <Text style={styles.trackBtnText}>Track</Text>
        </TouchableOpacity>
      </View>

      {/* Map */}
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        region={mapRegion}
        showsUserLocation
        showsMyLocationButton
      >
        {location && (
          <Marker
            coordinate={{ latitude: location.latitude, longitude: location.longitude }}
            title={`Bus #${selectedVehicleId}`}
            description={`Last updated: ${formatDateTime(location.timestamp)}`}
          >
            <View style={styles.busMarker}>
              <Text style={styles.busMarkerIcon}>🚌</Text>
            </View>
          </Marker>
        )}
      </MapView>

      {/* Info panel */}
      {location && (
        <View style={styles.infoPanel}>
          <Text style={styles.infoPanelTitle}>Vehicle #{selectedVehicleId}</Text>
          <Text style={styles.infoText}>Lat: {location.latitude.toFixed(6)}</Text>
          <Text style={styles.infoText}>Lng: {location.longitude.toFixed(6)}</Text>
          <Text style={styles.infoText}>Updated: {formatDateTime(location.timestamp)}</Text>
        </View>
      )}

      {/* Transport Manager: update location */}
      {isTransportManager && (
        <View style={styles.updatePanel}>
          <Button
            label="📍 Update My Bus Location"
            onPress={() => updateMutation.mutate()}
            loading={updateMutation.isPending}
            fullWidth
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  vehicleSelector: { flexDirection: 'row', backgroundColor: Colors.surface, padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border, gap: Spacing.sm },
  vehicleInput: { flex: 1, backgroundColor: Colors.surfaceVariant, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, ...Typography.body2, color: Colors.textPrimary },
  trackBtn: { backgroundColor: Colors.primary, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.lg, justifyContent: 'center' },
  trackBtnText: { ...Typography.button, color: Colors.white },
  map: { flex: 1 },
  busMarker: { backgroundColor: Colors.white, borderRadius: 20, padding: 4, borderWidth: 2, borderColor: Colors.primary },
  busMarkerIcon: { fontSize: 24 },
  infoPanel: {
    position: 'absolute',
    bottom: 80,
    left: Spacing.md,
    right: Spacing.md,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  infoPanelTitle: { ...Typography.h5, color: Colors.textPrimary, marginBottom: Spacing.sm },
  infoText: { ...Typography.caption, color: Colors.textSecondary },
  updatePanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
});
