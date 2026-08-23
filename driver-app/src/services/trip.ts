import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api/client';
import { Trip, TripSummary } from '../types';

const TRIP_KEY = 'activeTrip';

const generateId = () => Math.random().toString(36).substring(2, 10);

export async function startTrip(driverId: string, vehicleId: string): Promise<Trip> {
  const response = await api.post(`/trips/start?driver_id=${driverId}&vehicle_id=${vehicleId}`);
  const trip: Trip = {
    tripId: response.data.trip_id,
    startedAt: new Date().toISOString(),
    status: 'active',
  };
  await AsyncStorage.setItem(TRIP_KEY, JSON.stringify(trip)); 
  return trip;
}

export async function getActiveTrip(): Promise<Trip | null> {
  const json = await AsyncStorage.getItem(TRIP_KEY);
  return json ? JSON.parse(json) : null;
}

export async function sendGpsBatch(tripId: string, points: { lat: number; lng: number; speed: number }[]) {
  await api.put(`/trips/${tripId}/locations`, { gps_points: points }); 
}

export async function endTrip(stats: {
  distanceKm: number;
  durationMin: number;
  harshEvents: number;
  speedingIncidents: number;
  finalScore: number;
}): Promise<TripSummary> {
  const trip = await getActiveTrip();
  if (!trip) throw new Error('No active trip to end');

  try {
    await api.post(`/trips/${trip.tripId}/end?distance_km=${stats.distanceKm}&duration_minutes=${stats.durationMin}`);
  } catch (error) {
    console.warn(' Could not report trip end to backend server:', error);
  }

  const summary: TripSummary = { tripId: trip.tripId, ...stats };
  await AsyncStorage.removeItem(TRIP_KEY);
  return summary;
}