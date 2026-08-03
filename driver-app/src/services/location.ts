import { Platform } from 'react-native';
import * as Location from 'expo-location';
import type { LocationSubscription } from 'expo-location';

export interface LocationReading {
  lat: number;
  lng: number;
  speedKmh: number;
  ts: string;
}

let subscription: LocationSubscription | null = null;

export async function requestLocationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === 'granted';
}

export async function startLocationTracking(onReading: (reading: LocationReading) => void) {
  if (Platform.OS === 'web') {
    console.warn('Location not supported on web — test on a physical device');
    return;
  }
  subscription = await Location.watchPositionAsync(
    { accuracy: Location.Accuracy.High, timeInterval: 3000, distanceInterval: 5 },
    (loc) => {
      onReading({
        lat: loc.coords.latitude,
        lng: loc.coords.longitude,
        speedKmh: Math.max(0, (loc.coords.speed ?? 0) * 3.6), 
        ts: new Date(loc.timestamp).toISOString(),
      });
    }
  );
}

export function stopLocationTracking() {
  subscription?.remove();
  subscription = null;
}
