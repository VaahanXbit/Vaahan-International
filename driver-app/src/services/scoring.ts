export interface ScoreState {
  score: number;
  harshEvents: number;
  speedingIncidents: number;
  distanceKm: number;
}

const SPEED_LIMIT_KMH = 60; 
const HARSH_COOLDOWN_MS = 2000;
const SPEEDING_COOLDOWN_MS = 5000;

let state: ScoreState = { score: 100, harshEvents: 0, speedingIncidents: 0, distanceKm: 0 };
let lastCoord: { lat: number; lng: number } | null = null;
let lastHarshTime = 0;
let lastSpeedingTime = 0;

export function resetScore() {
  state = { score: 100, harshEvents: 0, speedingIncidents: 0, distanceKm: 0 };
  lastCoord = null;
  lastHarshTime = 0;
  lastSpeedingTime = 0;
}

export function getScore(): ScoreState {
  return { ...state };
}

export function registerHarshEvent() {
  const now = Date.now();
  if (now - lastHarshTime < HARSH_COOLDOWN_MS) return;
  lastHarshTime = now;
  state.harshEvents += 1;
  state.score = Math.max(0, state.score - 2);
}

export function registerLocationReading(reading: { lat: number; lng: number; speedKmh: number }) {
  if (lastCoord) {
    state.distanceKm += haversineKm(lastCoord, { lat: reading.lat, lng: reading.lng });
  }
  lastCoord = { lat: reading.lat, lng: reading.lng };

  const now = Date.now();
  if (reading.speedKmh > SPEED_LIMIT_KMH + 10 && now - lastSpeedingTime > SPEEDING_COOLDOWN_MS) {
    lastSpeedingTime = now;
    state.speedingIncidents += 1;
    state.score = Math.max(0, state.score - 3);
  }
}

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371; // Earth radius in km
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(h));
}
