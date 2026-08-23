import { Platform } from 'react-native';
import { Accelerometer } from 'expo-sensors';
import type { EventSubscription } from 'expo-modules-core';

export interface AccelReading {
  x: number;
  y: number;
  z: number;
  ts: string;
}

let subscription: EventSubscription | null = null;

export function startAccelListening(onReading: (reading: AccelReading) => void) {
  if (Platform.OS === 'web') {
    console.warn('Accelerometer not supported on web, test on a mobile via Expo Go.');
    return;
  }
  try {
    Accelerometer.setUpdateInterval(500); 
    subscription = Accelerometer.addListener(({ x, y, z }) => {
      onReading({ x, y, z, ts: new Date().toISOString() });
    });
  } catch (error) {
    console.warn('Accelerometer is not supported on this platform/device:', error);
  }
}

export function stopAccelListening() {
  subscription?.remove();
  subscription = null;
}

let lastMagnitude = 1.0; 
let lastEventTime = 0;
const COOLDOWN_MS = 2000;

export function isHarshEvent(reading: AccelReading): string | null {
  const magnitude = Math.sqrt(reading.x ** 2 + reading.y ** 2 + reading.z ** 2);
  const delta = magnitude - lastMagnitude;
  lastMagnitude = magnitude;

  const now = Date.now();
  if (now - lastEventTime < COOLDOWN_MS) return null; 

  if (delta < -0.5 || delta > 0.5) {
    lastEventTime = now;
    return delta < 0 ? 'harsh_brake' : 'harsh_accel';
  }
  return null;
}
