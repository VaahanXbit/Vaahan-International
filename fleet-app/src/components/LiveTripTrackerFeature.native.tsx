import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import theme from '../theme';
import { Driver } from '../data/mockFleetData';
import { api } from '../api/client';

interface Props {
  driver: Driver;
}

const CITY_COORDINATES: { [key: string]: { latitude: number; longitude: number } } = {
  bangalore: { latitude: 12.9716, longitude: 77.5946 },
  delhi: { latitude: 28.6139, longitude: 77.2090 },
  mumbai: { latitude: 19.0760, longitude: 72.8777 },
};

export const LiveTripTrackerFeature: React.FC<Props> = ({ driver }) => {
  const [gpsPoints, setGpsPoints] = useState<{ lat: number; lng: number; timestamp: string }[]>([]);
  const [activeTripId, setActiveTripId] = useState<string | null>(null);
  const [liveSpeed, setLiveSpeed] = useState<number>(0);
  const [liveLocation, setLiveLocation] = useState<string>('Locating...');
  const [liveHarshBrakes, setLiveHarshBrakes] = useState<number>(0);
  const [liveHarshCorners, setLiveHarshCorners] = useState<number>(0);
  const [liveSpeeding, setLiveSpeeding] = useState<number>(0);

  const lowercaseCity = (driver.city || 'bangalore').trim().toLowerCase();
  const defaultCoords = CITY_COORDINATES[lowercaseCity] || CITY_COORDINATES['bangalore'];

  const hasGpsData = gpsPoints && gpsPoints.length > 0;

  const initialRegion = hasGpsData
    ? {
        latitude: gpsPoints[gpsPoints.length - 1].lat,
        longitude: gpsPoints[gpsPoints.length - 1].lng,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }
    : {
        latitude: defaultCoords.latitude,
        longitude: defaultCoords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };

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
              api.getTrip(activeTrip.id)
                .then(tripRes => {
                  if (tripRes.data?.gps_points) {
                    const points = tripRes.data.gps_points.map((p: any) => ({
                      lat: parseFloat(p.latitude),
                      lng: parseFloat(p.longitude),
                      timestamp: p.timestamp,
                    }));
                    setGpsPoints(points);
                  }
                  if (tripRes.data?.trip) {
                    setLiveHarshBrakes(tripRes.data.trip.harsh_brake_count || 0);
                    setLiveHarshCorners(tripRes.data.trip.harsh_corner_count || 0);
                    setLiveSpeeding(tripRes.data.trip.speeding_count || 0);
                  }
                })
                .catch(err => console.error('Error fetching active trip details:', err));
            } else {
              setActiveTripId(null);
              setGpsPoints([]);
            }
          } else {
            setActiveTripId(null);
            setGpsPoints([]);
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

  // WebSocket Live Updates
  useEffect(() => {
    if (!activeTripId) {
      setLiveSpeed(0);
      setLiveLocation('Locating...');
      return;
    }

    const wsBaseUrl = api.defaults.baseURL 
      ? api.defaults.baseURL.replace('http://', 'ws://').replace('https://', 'wss://') 
      : 'ws://127.0.0.1:8001/api/v1';
    const wsUrl = `${wsBaseUrl}/auth/ws/trip/${activeTripId}/listen`;

    console.log('Connecting Live Tracking WS:', wsUrl);
    const ws = new WebSocket(wsUrl);

    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.lat && data.lng) {
          setGpsPoints(prev => {
            if (prev.some(p => p.timestamp === data.timestamp)) return prev;
            return [...prev, { lat: data.lat, lng: data.lng, timestamp: data.timestamp }];
          });
        }
        if (data.speed_kmh !== undefined) {
          setLiveSpeed(data.speed_kmh);
        }
        if (data.location_name) {
          setLiveLocation(data.location_name);
        }
        if (data.event_detected) {
          if (data.event_detected === 'harsh_brake') {
            setLiveHarshBrakes(prev => prev + 1);
          } else if (data.event_detected === 'harsh_corner') {
            setLiveHarshCorners(prev => prev + 1);
          } else if (data.event_detected === 'speeding') {
            setLiveSpeeding(prev => prev + 1);
          }
        }
      } catch (err) {
        console.error('Error parsing live WS payload:', err);
      }
    };

    return () => {
      ws.close();
    };
  }, [activeTripId]);

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
      {/* Map View Wrapper */}
      <View style={styles.mapWrapper}>
        <MapView
          style={styles.map}
          initialRegion={initialRegion}
          showsUserLocation={false}
          showsMyLocationButton={false}
          zoomEnabled={true}
          scrollEnabled={true}
        >
          {hasGpsData && (
            <>
              <Polyline
                coordinates={gpsPoints.map(p => ({ latitude: p.lat, longitude: p.lng }))}
                strokeColor={theme.colors.primary}
                strokeWidth={4}
              />
              <Marker
                coordinate={{
                  latitude: gpsPoints[gpsPoints.length - 1].lat,
                  longitude: gpsPoints[gpsPoints.length - 1].lng,
                }}
                anchor={{ x: 0.5, y: 0.5 }}
              >
                <View style={styles.truckMarker}>
                  <MaterialIcons name="local-shipping" size={16} color="#000" />
                </View>
              </Marker>
            </>
          )}
        </MapView>

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
  map: {
    flex: 1,
  },
  truckMarker: {
    backgroundColor: theme.colors.primary,
    padding: 8,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 4,
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
