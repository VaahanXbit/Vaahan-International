import client from '../api/client';

let ws: WebSocket | null = null;
let serverMessageCallback: ((data: { received: boolean; event_detected: string }) => void) | null = null;

// Resolve the WebSocket URL based on the REST API client baseURL configuration
const getWebSocketUrl = (tripId: string): string => {
  const baseURL = client.defaults.baseURL || 'http://localhost:8001/api/v1';
  const match = baseURL.match(/^https?:\/\/([^/]+)/);
  let host = match ? match[1] : 'localhost:8001';
  
  // Keep the port consistent (fastapi runs on 8001)
  if (host.includes('localhost:8000')) {
    host = host.replace('localhost:8000', 'localhost:8001');
  } else if (host.includes('10.0.2.2:8000')) {
    host = host.replace('10.0.2.2:8000', '10.0.2.2:8001');
  }
  
  return `ws://${host}/ws/trip/${tripId}`;
};

/**
 * Open a live WebSocket connection for the active trip
 */
export function connectTripSocket(tripId: string) {
  const url = getWebSocketUrl(tripId);
  console.log(`🔌 Connecting to Telemetry WebSocket: ${url}`);
  
  try {
    ws = new WebSocket(url);
    
    ws.onopen = () => {
      console.log('🔌 Telemetry WebSocket connected successfully.');
    };
    
    ws.onmessage = (event) => {
      try {
        const response = JSON.parse(event.data);
        console.log('🔌 WebSocket Server Response:', response);
        if (serverMessageCallback) {
          serverMessageCallback(response);
        }
      } catch (err) {
        console.error('Failed to parse WebSocket server response:', err);
      }
    };
    
    ws.onerror = (error) => {
      console.warn('Telemetry WebSocket error:', error);
    };
    
    ws.onclose = (event) => {
      console.log(`Telemetry WebSocket closed (code: ${event.code}, reason: ${event.reason})`);
    };
  } catch (error) {
    console.error('Failed to initialize WebSocket connection:', error);
  }
}

/**
 * Send one telemetry reading packet to the backend server
 */
export function sendTelemetry(reading: {
  lat: number;
  lng: number;
  speed_kmh: number;
  accel_x: number;
  accel_y: number;
  accel_z: number;
  timestamp: string;
}) {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    console.log('⚠️  Cannot send telemetry. WebSocket connection is not open.');
    return;
  }
  
  try {
    const payload = JSON.stringify(reading);
    ws.send(payload);
  } catch (error) {
    // Wrap in try/catch so a network write failure doesn't crash the local UI/scoring
    console.error('Error sending telemetry over WebSocket:', error);
  }
}

/**
 * Register a listener for server validation responses
 */
export function onServerMessage(callback: (data: { received: boolean; event_detected: string }) => void) {
  serverMessageCallback = callback;
}

/**
 * Disconnect and clean up the active WebSocket connection
 */
export function disconnectTripSocket() {
  if (ws) {
    console.log('🔌 Disconnecting Telemetry WebSocket...');
    try {
      ws.close();
    } catch (error) {
      console.error('Error closing WebSocket:', error);
    }
    ws = null;
  }
  serverMessageCallback = null;
}
