import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Linking,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { io, Socket } from 'socket.io-client';
import { busService } from '@api/services/busService';
import { RootStackParams } from '@navigation/types';
import Header from '@components/common/Header';
import Card from '@components/common/Card';
import { Colors } from '@constants/colors';
import { Sizes } from '@constants/sizes';
import { WS_URL } from '@constants/api';
import { BusLocation } from '@app-types/index';

type RouteType = RouteProp<RootStackParams, 'BusTracking'>;

const BusTrackingScreen = () => {
  const navigation = useNavigation<any>();
  const route      = useRoute<RouteType>();
  const mapRef     = useRef<MapView>(null);
  const socketRef  = useRef<Socket | null>(null);

  const [busLocation, setBusLocation] = useState<BusLocation | null>(null);
  const [isConnected, setIsConnected]  = useState(false);

  // vehicleId must be passed as a navigation param
  const vehicleId: number | undefined = route.params?.vehicleId;

  useEffect(() => {
    if (!vehicleId) return;
    busService.getBusLocation(vehicleId)
      .then(loc => setBusLocation(loc))
      .catch(() => { /* bus not yet active */ });
  }, [vehicleId]);

  // WebSocket for live updates
  useEffect(() => {
    if (!vehicleId) return;

    const socket = io(WS_URL, {
      transports: ['websocket'],
      reconnectionAttempts: 5,
    });
    socketRef.current = socket;

    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));

    // Subscribe to bus location topic
    socket.on(`bus/${vehicleId}`, (data: BusLocation) => {
      setBusLocation(data);
      // Animate map to new bus position
      mapRef.current?.animateToRegion({
        latitude: data.latitude,
        longitude: data.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 500);
    });

    return () => {
      socket.disconnect();
    };
  }, [vehicleId]);

  const callDriver = useCallback((phone: string) => {
    Linking.openURL(`tel:${phone}`);
  }, []);

  const centerMap = useCallback(() => {
    if (!busLocation) return;
    mapRef.current?.animateToRegion({
      latitude: busLocation.latitude,
      longitude: busLocation.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    }, 500);
  }, [busLocation]);

  // Default to New Delhi if no bus data
  const initialRegion: Region = busLocation
    ? {
        latitude: busLocation.latitude,
        longitude: busLocation.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      }
    : {
        latitude: 28.6139,
        longitude: 77.2090,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };

  if (!vehicleId) {
    return (
      <View style={styles.root}>
        <Header title="Bus Tracking" subtitle="Live location" onBack={() => navigation.goBack()} />
        <Card style={styles.nobus}>
          <Icon name="bus-alert" size={32} color={Colors.textMuted} />
          <Text style={styles.nobusText}>No bus assigned</Text>
          <Text style={styles.nobusSubText}>Contact school for bus assignment details</Text>
        </Card>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <Header title="Bus Tracking" subtitle="Live location" onBack={() => navigation.goBack()} />

      {/* Map */}
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation
        showsMyLocationButton={false}>

        {/* Bus marker */}
        {busLocation && (
          <Marker
            coordinate={{ latitude: busLocation.latitude, longitude: busLocation.longitude }}
            title={busLocation.vehicleNumber}
            description={`Speed: ${busLocation.speedKmh.toFixed(1)} km/h`}>
            <View style={styles.busMarker}>
              <Icon name="bus" size={22} color={Colors.white} />
            </View>
          </Marker>
        )}

      </MapView>

      {/* Center button */}
      <TouchableOpacity style={styles.centerBtn} onPress={centerMap}>
        <Icon name="crosshairs-gps" size={24} color={Colors.primary} />
      </TouchableOpacity>

      {/* Status panel */}
      <View style={styles.panel}>
        {/* Connection status */}
        <View style={styles.statusRow}>
          <View style={[styles.statusDot, { backgroundColor: isConnected ? Colors.success : Colors.danger }]} />
          <Text style={styles.statusText}>{isConnected ? 'Live tracking active' : 'Connecting...'}</Text>
        </View>

        {busLocation ? (
          <Card style={styles.busInfo}>
            <View style={styles.busInfoRow}>
              <View style={styles.busNumBox}>
                <Icon name="bus" size={28} color={Colors.primary} />
                <Text style={styles.busNum}>{busLocation.vehicleNumber}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.driverName}>{busLocation.driverName}</Text>
                <Text style={styles.speed}>{busLocation.speedKmh.toFixed(1)} km/h</Text>
              </View>
              <TouchableOpacity
                style={styles.callBtn}
                onPress={() => callDriver(busLocation.driverPhone)}>
                <Icon name="phone" size={20} color={Colors.white} />
              </TouchableOpacity>
            </View>
          </Card>
        ) : (
          <Card style={styles.nobus}>
            <Icon name="bus-clock" size={32} color={Colors.textMuted} />
            <Text style={styles.nobusText}>Bus not active right now</Text>
            <Text style={styles.nobusSubText}>Location will appear when the bus starts</Text>
          </Card>
        )}

      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  map: { flex: 1 },
  busMarker: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: Colors.white,
    ...Sizes.shadowMd,
  },
  centerBtn: {
    position: 'absolute',
    top: '40%',
    right: Sizes.md,
    backgroundColor: Colors.white,
    width: 44, height: 44,
    borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    ...Sizes.shadowMd,
  },
  panel: {
    backgroundColor: Colors.white,
    padding: Sizes.md,
    paddingBottom: Sizes.lg,
    borderTopLeftRadius: Sizes.radiusXl,
    borderTopRightRadius: Sizes.radiusXl,
    ...Sizes.shadowMd,
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: Sizes.sm },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: Sizes.fontSm, color: Colors.textSecondary },
  busInfo: { marginBottom: Sizes.sm },
  busInfoRow: { flexDirection: 'row', alignItems: 'center', gap: Sizes.md },
  busNumBox: { alignItems: 'center', gap: 4 },
  busNum: { fontSize: Sizes.fontXs, fontWeight: '700', color: Colors.textPrimary },
  driverName: { fontSize: Sizes.fontMd, fontWeight: '600', color: Colors.textPrimary },
  speed: { fontSize: Sizes.fontXs, color: Colors.textMuted, marginTop: 2 },
  callBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.success,
    alignItems: 'center', justifyContent: 'center',
  },
  nobus: { alignItems: 'center', padding: Sizes.xl, gap: 4, margin: Sizes.md },
  nobusText: { fontSize: Sizes.fontMd, fontWeight: '600', color: Colors.textSecondary },
  nobusSubText: { fontSize: Sizes.fontXs, color: Colors.textMuted },
});

export default BusTrackingScreen;
