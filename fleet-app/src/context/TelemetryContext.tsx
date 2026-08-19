import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { api } from '../api/client';

interface TelemetryPoint {
  lat: number;
  lng: number;
  timestamp: string;
}

interface TelemetryState {
  gpsPoints: TelemetryPoint[];
  liveSpeed: number;
  liveLocation: string;
  liveHarshBrakes: number;
  liveHarshCorners: number;
  liveSpeeding: number;
}

interface TelemetryContextType {
  activeConnections: { [tripId: string]: boolean };
  telemetryData: { [tripId: string]: TelemetryState };
  startTrackingTrip: (tripId: string) => void;
  stopTrackingTrip: (tripId: string) => void;
  getTelemetryState: (tripId: string) => TelemetryState;
  setInitialTelemetry: (tripId: string, initialData: Partial<TelemetryState>) => void;
}

const TelemetryContext = createContext<TelemetryContextType | undefined>(undefined);

export const TelemetryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [telemetryData, setTelemetryData] = useState<{ [tripId: string]: TelemetryState }>({});
  const [activeConnections, setActiveConnections] = useState<{ [tripId: string]: boolean }>({});
  const socketsRef = useRef<{ [tripId: string]: { ws: WebSocket; reconnectTimeout: any; isClosedIntentional: boolean } }>({});

  const setInitialTelemetry = (tripId: string, initialData: Partial<TelemetryState>) => {
    setTelemetryData(prev => {
      const current = prev[tripId] || {
        gpsPoints: [],
        liveSpeed: 0,
        liveLocation: 'Locating...',
        liveHarshBrakes: 0,
        liveHarshCorners: 0,
        liveSpeeding: 0
      };
      
      // Merge initial data if not already populated or if we need to sync REST data
      return {
        ...prev,
        [tripId]: {
          gpsPoints: initialData.gpsPoints && initialData.gpsPoints.length > current.gpsPoints.length ? initialData.gpsPoints : current.gpsPoints,
          liveSpeed: initialData.liveSpeed !== undefined ? initialData.liveSpeed : current.liveSpeed,
          liveLocation: initialData.liveLocation || current.liveLocation,
          liveHarshBrakes: initialData.liveHarshBrakes !== undefined ? Math.max(initialData.liveHarshBrakes, current.liveHarshBrakes) : current.liveHarshBrakes,
          liveHarshCorners: initialData.liveHarshCorners !== undefined ? Math.max(initialData.liveHarshCorners, current.liveHarshCorners) : current.liveHarshCorners,
          liveSpeeding: initialData.liveSpeeding !== undefined ? Math.max(initialData.liveSpeeding, current.liveSpeeding) : current.liveSpeeding
        }
      };
    });
  };

  const startTrackingTrip = (tripId: string) => {
    if (socketsRef.current[tripId]) {
      // Socket is already active in background
      return;
    }

    const wsBaseUrl = api.baseURL
      ? api.baseURL.replace('http://', 'ws://').replace('https://', 'wss://')
      : 'ws://127.0.0.1:8001/api/v1';
    const wsUrl = `${wsBaseUrl}/auth/ws/trip/${tripId}/listen`;

    const connect = () => {
      const stateRef = socketsRef.current[tripId];
      if (stateRef && stateRef.isClosedIntentional) return;

      console.log('Connecting Global Live Tracking WS:', wsUrl);
      const ws = new WebSocket(wsUrl);

      socketsRef.current[tripId] = {
        ws,
        reconnectTimeout: null,
        isClosedIntentional: false
      };

      ws.onopen = () => {
        console.log(`Global Live Tracking WS Connected successfully for Trip: ${tripId}`);
        setActiveConnections(prev => ({ ...prev, [tripId]: true }));
      };

      ws.onerror = (err) => {
        console.error(`Global Live Tracking WS Error for Trip ${tripId}:`, err);
      };

      ws.onclose = (event) => {
        console.log(`Global Live Tracking WS Closed for Trip ${tripId}:`, event.code, event.reason);
        setActiveConnections(prev => ({ ...prev, [tripId]: false }));

        const currentRef = socketsRef.current[tripId];
        if (currentRef && !currentRef.isClosedIntentional) {
          console.log(`WS connection dropped for Trip ${tripId}. Reconnecting in 3s...`);
          currentRef.reconnectTimeout = setTimeout(connect, 3000);
        }
      };

      ws.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          console.log(`Global WS Message Received for Trip ${tripId}:`, data);
          
          setTelemetryData(prev => {
            const current = prev[tripId] || {
              gpsPoints: [],
              liveSpeed: 0,
              liveLocation: 'Locating...',
              liveHarshBrakes: 0,
              liveHarshCorners: 0,
              liveSpeeding: 0
            };

            let updatedPoints = current.gpsPoints;
            if (data.lat !== undefined && data.lng !== undefined && (data.lat !== 0 || data.lng !== 0)) {
              if (!updatedPoints.some(p => p.timestamp === data.timestamp)) {
                updatedPoints = [...updatedPoints, { lat: data.lat, lng: data.lng, timestamp: data.timestamp }];
              }
            }

            return {
              ...prev,
              [tripId]: {
                gpsPoints: updatedPoints,
                liveSpeed: data.speed_kmh !== undefined ? data.speed_kmh : current.liveSpeed,
                liveLocation: data.location_name || current.liveLocation,
                liveHarshBrakes: data.event_detected === 'harsh_brake' ? current.liveHarshBrakes + 1 : current.liveHarshBrakes,
                liveHarshCorners: data.event_detected === 'harsh_corner' ? current.liveHarshCorners + 1 : current.liveHarshCorners,
                liveSpeeding: data.event_detected === 'speeding' ? current.liveSpeeding + 1 : current.liveSpeeding
              }
            };
          });
        } catch (err) {
          console.error(`Error parsing global WS payload for Trip ${tripId}:`, err);
        }
      };
    };

    connect();
  };

  const stopTrackingTrip = (tripId: string) => {
    const socketState = socketsRef.current[tripId];
    if (socketState) {
      socketState.isClosedIntentional = true;
      if (socketState.ws) socketState.ws.close();
      if (socketState.reconnectTimeout) clearTimeout(socketState.reconnectTimeout);
      delete socketsRef.current[tripId];
    }
    setActiveConnections(prev => {
      const updated = { ...prev };
      delete updated[tripId];
      return updated;
    });
  };

  const getTelemetryState = (tripId: string): TelemetryState => {
    return telemetryData[tripId] || {
      gpsPoints: [],
      liveSpeed: 0,
      liveLocation: 'Locating...',
      liveHarshBrakes: 0,
      liveHarshCorners: 0,
      liveSpeeding: 0
    };
  };

  // Cleanup all connections on component unmount (app close)
  useEffect(() => {
    return () => {
      Object.keys(socketsRef.current).forEach(tripId => {
        const socketState = socketsRef.current[tripId];
        if (socketState) {
          socketState.isClosedIntentional = true;
          if (socketState.ws) socketState.ws.close();
          if (socketState.reconnectTimeout) clearTimeout(socketState.reconnectTimeout);
        }
      });
    };
  }, []);

  return (
    <TelemetryContext.Provider value={{ activeConnections, telemetryData, startTrackingTrip, stopTrackingTrip, getTelemetryState, setInitialTelemetry }}>
      {children}
    </TelemetryContext.Provider>
  );
};

export const useTelemetry = () => {
  const context = useContext(TelemetryContext);
  if (!context) {
    throw new Error('useTelemetry must be used within a TelemetryProvider');
  }
  return context;
};
