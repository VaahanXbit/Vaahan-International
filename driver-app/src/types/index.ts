export interface Trip {
  tripId: string;
  startedAt: string;
  status: 'active' | 'completed';
}

export interface TripSummary {
  tripId: string;
  distanceKm: number;
  durationMin: number;
  harshEvents: number;
  speedingIncidents: number;
  finalScore: number;
}
