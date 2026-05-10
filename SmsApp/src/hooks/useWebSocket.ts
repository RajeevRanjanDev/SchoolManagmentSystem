import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { WS_BASE_URL } from '../constants';
import type { BusLocation } from '../types';

export function useBusTracking(vehicleId: number | null) {
  const socketRef = useRef<Socket | null>(null);
  const [location, setLocation] = useState<BusLocation | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!vehicleId) return;

    const socket = io(WS_BASE_URL, {
      transports: ['websocket'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    // Subscribe to STOMP-style topic for this vehicle
    socket.on(`bus:location:${vehicleId}`, (data: BusLocation) => {
      setLocation(data);
    });

    return () => {
      socket.disconnect();
    };
  }, [vehicleId]);

  return { location, connected };
}
