/**
 * Hook for WebSocket-based live bus tracking.
 * Opens a socket.io connection and listens to /topic/bus/{vehicleId}.
 */
import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { WS_URL } from '@constants/api';
import { BusLocation } from '@app-types/index';

interface BusTrackingState {
  location: BusLocation | null;
  isConnected: boolean;
  error: string | null;
}

export const useBusTracking = (vehicleId?: number): BusTrackingState => {
  const socketRef = useRef<Socket | null>(null);
  const [state, setState] = useState<BusTrackingState>({
    location: null,
    isConnected: false,
    error: null,
  });

  useEffect(() => {
    if (!vehicleId) return;

    const socket = io(WS_URL, {
      transports: ['websocket'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setState(s => ({ ...s, isConnected: true, error: null }));
    });

    socket.on('disconnect', () => {
      setState(s => ({ ...s, isConnected: false }));
    });

    socket.on('connect_error', (err) => {
      setState(s => ({ ...s, error: err.message }));
    });

    socket.on(`bus/${vehicleId}`, (data: BusLocation) => {
      setState(s => ({ ...s, location: data }));
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [vehicleId]);

  return state;
};
