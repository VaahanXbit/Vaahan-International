import { useEffect, useState, useRef } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import { View, Text, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { endTrip } from '../src/services/trip';
import { startAccelListening, stopAccelListening, isHarshEvent, AccelReading } from '../src/services/sensors';
import { startLocationTracking, stopLocationTracking } from '../src/services/location';
import { connectTripSocket, sendTelemetry, disconnectTripSocket, onServerMessage } from '../src/services/tripSocket';
import { SlideButton } from '../src/components/SlideButton';
import { theme } from '../src/theme';

// Helper to calculate Haversine distance in km
const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; 
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export default function ActiveTripScreen() {
  const { tripId } = useLocalSearchParams<{ tripId: string }>();
  const [lastReading, setLastReading] = useState<AccelReading | null>(null);
  const [harshBrakesCount, setHarshBrakesCount] = useState(0);
  const [harshCornersCount, setHarshCornersCount] = useState(0);
  const [speed, setSpeed] = useState<number>(0);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [speedingCount, setSpeedingCount] = useState(0);

  // Refs for tracking values synchronously inside listeners without stale closure bugs
  const distanceRef = useRef<number>(0);
  const lastPosRef = useRef<{ lat: number; lng: number } | null>(null);
  const lastSpeedingTimeRef = useRef<number>(0);
  const tripStartTimeRef = useRef<number>(Date.now());
  
  const speedingCountRef = useRef<number>(0);
  const harshBrakesCountRef = useRef<number>(0);
  const harshCornersCountRef = useRef<number>(0);

  // Cache refs for combining sensors in real-time updates
  const latestLocationRef = useRef<{ lat: number; lng: number; speedKmh: number } | null>(null);
  const latestAccelRef = useRef<AccelReading | null>(null);

  useEffect(() => {
    let isMounted = true;

    // Connect to WebSocket using the active trip ID
    if (tripId) {
      connectTripSocket(tripId);
      onServerMessage((res) => {
        console.log(' Telemetry server verification callback:', res);
        if (res.event_detected) {
          if (res.event_detected === 'harsh_brake' || res.event_detected === 'harsh_accel') {
            harshBrakesCountRef.current += 1;
            setHarshBrakesCount(harshBrakesCountRef.current);
          } else if (res.event_detected === 'harsh_corner') {
            harshCornersCountRef.current += 1;
            setHarshCornersCount(harshCornersCountRef.current);
          }
        }
      });
    }

    // Start accelerometer
    startAccelListening((reading) => {
      if (isMounted) {
        setLastReading(reading);
        latestAccelRef.current = reading;

        // Stream telemetry immediately using latest location reading if available
        if (latestLocationRef.current) {
          sendTelemetry({
            lat: latestLocationRef.current.lat,
            lng: latestLocationRef.current.lng,
            speed_kmh: latestLocationRef.current.speedKmh,
            accel_x: reading.x,
            accel_y: reading.y,
            accel_z: reading.z,
            timestamp: new Date().toISOString(),
          });
        }
      }
    });

    // Start location/speed tracking
    startLocationTracking((reading) => {
      if (isMounted) {
        setSpeed(reading.speedKmh);
        setCoords({ lat: reading.lat, lng: reading.lng });
        latestLocationRef.current = { lat: reading.lat, lng: reading.lng, speedKmh: reading.speedKmh };

        // Track distance
        if (lastPosRef.current) {
          const dist = getDistance(
            lastPosRef.current.lat,
            lastPosRef.current.lng,
            reading.lat,
            reading.lng
          );
          distanceRef.current += dist;
        }
        lastPosRef.current = { lat: reading.lat, lng: reading.lng };

        // Track speeding (speed > 80 km/h with 10-second incident cooldown)
        if (reading.speedKmh > 80) {
          const now = Date.now();
          if (now - lastSpeedingTimeRef.current > 10000) {
            lastSpeedingTimeRef.current = now;
            speedingCountRef.current += 1;
            setSpeedingCount(speedingCountRef.current);
          }
        }

        // Stream telemetry immediately using latest accelerometer reading if available
        sendTelemetry({
          lat: reading.lat,
          lng: reading.lng,
          speed_kmh: reading.speedKmh,
          accel_x: latestAccelRef.current?.x ?? 0.0,
          accel_y: latestAccelRef.current?.y ?? 0.0,
          accel_z: latestAccelRef.current?.z ?? 0.0,
          timestamp: new Date().toISOString(),
        });
      }
    });

    return () => {
      isMounted = false;
      stopAccelListening();
      stopLocationTracking();
      disconnectTripSocket();
    };
  }, []);

  const handleEndTrip = async () => {
    stopAccelListening();
    stopLocationTracking();
    disconnectTripSocket();

    // Local scoring logic
    const totalHarsh = harshBrakesCountRef.current + harshCornersCountRef.current;
    const finalScore = Math.max(0, 100 - (totalHarsh * 5) - (speedingCountRef.current * 5));

    const summary = await endTrip({
      distanceKm: distanceRef.current,
      harshEvents: totalHarsh,
      speedingIncidents: speedingCountRef.current,
      finalScore: finalScore,
      durationMin: 0
    });

    router.replace({ pathname: '/trip-summary', params: { summary: JSON.stringify(summary) } });
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
      <View style={styles.container}>
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerLabel}>ACTIVE TRIP</Text>
          <Text style={styles.tripId}>#{tripId}</Text>
        </View>

        {/* Speed Indicator */}
        <View style={styles.speedCard}>
          <Text style={styles.speedLabel}>CURRENT SPEED</Text>
          <Text style={styles.speedValue}>
            {speed.toFixed(0)} <Text style={styles.speedUnit}>km/h</Text>
          </Text>
        </View>

        {/* Coordinates & Accelerometer Data */}
        <View style={styles.detailsContainer}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>GPS POSITION</Text>
            <Text style={styles.detailValue}>
              {coords 
                ? `${coords.lat.toFixed(5)}° N, ${coords.lng.toFixed(5)}° E` 
                : 'WAITING FOR GPS...'}
            </Text>
          </View>

          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>LIVE ACCELEROMETER</Text>
            <Text style={styles.detailValue}>
              {lastReading 
                ? `${lastReading.x.toFixed(2)}, ${lastReading.y.toFixed(2)}, ${lastReading.z.toFixed(2)}` 
                : '—'}
            </Text>
          </View>

          <View style={styles.statsRow}>
            <View style={[styles.detailItem, styles.oneThirdWidth]}>
              <Text style={styles.detailLabel}>HARSH BRAKES</Text>
              <Text style={[styles.detailValue, harshBrakesCount > 0 ? styles.dangerText : null]}>
                {harshBrakesCount}
              </Text>
            </View>
            <View style={[styles.detailItem, styles.oneThirdWidth]}>
              <Text style={styles.detailLabel}>HARSH CORNERS</Text>
              <Text style={[styles.detailValue, harshCornersCount > 0 ? styles.dangerText : null]}>
                {harshCornersCount}
              </Text>
            </View>
            <View style={[styles.detailItem, styles.oneThirdWidth]}>
              <Text style={styles.detailLabel}>SPEEDING</Text>
              <Text style={[styles.detailValue, speedingCount > 0 ? styles.dangerText : null]}>
                {speedingCount}
              </Text>
            </View>
          </View>
        </View>

        {/* Slide gesture trigger */}
        <View style={styles.sliderWrapper}>
          <SlideButton onSlideSuccess={handleEndTrip} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
    padding: theme.spacing.lg,
    justifyContent: 'space-between',
  },
  header: {
    marginTop: theme.spacing.md,
    alignItems: 'center',
  },
  headerLabel: {
    ...theme.typography.labelCaps,
    color: theme.colors.textMuted,
  },
  tripId: {
    ...theme.typography.headlineMd,
    color: theme.colors.text,
    marginTop: theme.spacing.xs,
  },
  speedCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.rounded.xl,
    paddingVertical: theme.spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  speedLabel: {
    ...theme.typography.labelCaps,
    color: theme.colors.textMuted,
  },
  speedValue: {
    ...theme.typography.metricLg,
    color: theme.colors.text,
    marginTop: theme.spacing.xs,
  },
  speedUnit: {
    fontSize: 20,
    color: theme.colors.textMuted,
    fontWeight: '400',
  },
  detailsContainer: {
    gap: theme.spacing.md,
  },
  detailItem: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.rounded.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  detailLabel: {
    ...theme.typography.labelCaps,
    color: theme.colors.textMuted,
  },
  detailValue: {
    ...theme.typography.bodyLg,
    color: theme.colors.text,
    marginTop: theme.spacing.xs,
    fontFamily: 'System',
  },
  statsRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  halfWidth: {
    flex: 1,
  },
  oneThirdWidth: {
    flex: 1,
  },
  dangerText: {
    color: theme.colors.danger,
    fontWeight: 'bold',
  },
  sliderWrapper: {
    marginBottom: theme.spacing.md,
  },
});