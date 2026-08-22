import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import theme from '../theme';
import { Driver } from '../data/mockFleetData';
import { api } from '../api/client';
import { useTelemetry } from '../context/TelemetryContext';

interface Props {
  driver: Driver;
}

export const LiveTripTrackerFeature: React.FC<Props> = ({ driver }) => {
  const { startTrackingTrip, getTelemetryState, setInitialTelemetry } = useTelemetry();
  const [activeTripId, setActiveTripId] = useState<string | null>(null);

  const telemetryState = activeTripId ? getTelemetryState(activeTripId) : {
    gpsPoints: [],
    liveSpeed: 0,
    liveLocation: 'Locating...',
    liveHarshBrakes: 0,
    liveHarshCorners: 0,
    liveSpeeding: 0
  };

  const gpsPoints = telemetryState.gpsPoints;
  const liveSpeed = telemetryState.liveSpeed;
  const liveLocation = telemetryState.liveLocation;
  const liveHarshBrakes = telemetryState.liveHarshBrakes;
  const liveHarshCorners = telemetryState.liveHarshCorners;
  const liveSpeeding = telemetryState.liveSpeeding;

  const hasGpsData = gpsPoints && gpsPoints.length > 0;

  // Poll active trip status on load
  useEffect(() => {
    let pollInterval: any = null;

    const fetchActiveTelemetry = () => {
      api.listTrips(driver.id)
        .then(res => {
          if (res.data?.trips?.length > 0) {
            const activeTrip = res.data.trips.find((t: any) => t.status === 'active');
            if (activeTrip) {
              setActiveTripId(activeTrip.id);
              startTrackingTrip(activeTrip.id);
              api.getTrip(activeTrip.id)
                .then(tripRes => {
                  if (tripRes.data?.gps_points) {
                    const points = tripRes.data.gps_points.map((p: any) => ({
                      lat: parseFloat(p.latitude),
                      lng: parseFloat(p.longitude),
                      timestamp: p.timestamp,
                    }));
                    setInitialTelemetry(activeTrip.id, {
                      gpsPoints: points,
                      liveHarshBrakes: tripRes.data.trip?.harsh_brake_count || 0,
                      liveHarshCorners: tripRes.data.trip?.harsh_corner_count || 0,
                      liveSpeeding: tripRes.data.trip?.speeding_count || 0,
                      liveLocation: tripRes.data.trip?.current_location || 'Locating...'
                    });
                  }
                })
                .catch(err => console.error('Error fetching active trip details:', err));
            } else {
              setActiveTripId(null);
            }
          } else {
            setActiveTripId(null);
          }
        })
        .catch(err => console.error('Error listing trips for driver:', err));
    };

    fetchActiveTelemetry();
    pollInterval = setInterval(fetchActiveTelemetry, 5000);

    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [driver.id]);

  if (!activeTripId) {
    return (
      <View style={styles.noTripContainer}>
        <MaterialIcons name="info-outline" size={48} color={theme.colors.onSurfaceVariant} />
        <Text style={styles.noTripText}>No active trip currently running for this driver.</Text>
        <Text style={styles.noTripSubtext}>Once the driver starts a trip in the mobile app, live telemetry will broadcast here automatically.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 24 }}>
      {/* Web Map Placeholder */}
      <View style={styles.mapWrapper}>
        <View style={styles.webMapFallback}>
          <MaterialIcons name="map" size={36} color={theme.colors.brandTeal} style={{ marginBottom: 8 }} />
          <Text style={styles.webMapTitle}>Interactive Map View is active on Android/iOS</Text>
          {hasGpsData ? (
            <Text style={styles.webMapSubtitle}>
              GPS Coordinates: {gpsPoints[gpsPoints.length - 1].lat.toFixed(5)}, {gpsPoints[gpsPoints.length - 1].lng.toFixed(5)}
            </Text>
          ) : (
            <Text style={styles.webMapSubtitle}>Waiting for GPS signals...</Text>
          )}
        </View>

        {/* Speed HUD Overlay */}
        <View style={styles.liveOverlayBadge}>
          <View style={styles.liveIndicatorDot} />
          <Text style={styles.liveBadgeText}>LIVE: {liveSpeed.toFixed(0)} km/h</Text>
        </View>
      </View>

      {/* Geocoded Address Card */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>CURRENT LOCATION</Text>
        <View style={styles.locationRow}>
          <MaterialIcons name="navigation" size={18} color={theme.colors.primary} style={{ marginRight: 8 }} />
          <Text style={styles.locationText}>{liveLocation}</Text>
        </View>
      </View>

      {/* Live Incidents Section */}
      <Text style={styles.sectionHeader}>LIVE INCIDENTS</Text>
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>HARSH BRAKES</Text>
          <Text style={styles.statValue}>{liveHarshBrakes}</Text>
        </View>

        <View style={styles.statBox}>
          <Text style={styles.statLabel}>HARSH CORNERS</Text>
          <Text style={styles.statValue}>{liveHarshCorners}</Text>
        </View>

        <View style={styles.statBox}>
          <Text style={styles.statLabel}>SPEEDING</Text>
          <Text style={styles.statValue}>{liveSpeeding}</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  noTripContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: theme.colors.surfaceContainer,
    borderRadius: theme.rounded.lg,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    marginTop: 16,
  },
  noTripText: {
    color: theme.colors.onSurface,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  noTripSubtext: {
    color: theme.colors.onSurfaceVariant,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  mapWrapper: {
    height: 320,
    borderRadius: theme.rounded.lg,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
  },
  webMapFallback: {
    flex: 1,
    backgroundColor: '#0f0f12',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  webMapTitle: {
    color: '#ffffff',
    fontWeight: '600',
    textAlign: 'center',
    fontSize: 14,
  },
  webMapSubtitle: {
    color: theme.colors.onSurfaceVariant,
    marginTop: 6,
    fontSize: 11,
    fontWeight: '600',
  },
  liveOverlayBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
    gap: 8,
  },
  liveIndicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
  },
  liveBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  card: {
    backgroundColor: theme.colors.surfaceContainer,
    borderRadius: theme.rounded.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    marginBottom: 16,
  },
  cardLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.onSurfaceVariant,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.onSurface,
    flex: 1,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.onSurfaceVariant,
    letterSpacing: 0.8,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: theme.colors.surfaceContainer,
    borderRadius: theme.rounded.lg,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    padding: 16,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.primary,
  },
});
