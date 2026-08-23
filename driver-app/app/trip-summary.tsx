import React, { useEffect, useState } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import { View, Text, Pressable, StyleSheet, StatusBar, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../src/theme';
import api from '../src/api/client';

export default function TripSummaryScreen() {
  const { summary } = useLocalSearchParams<{ summary: string }>();
  
  // Set initial data state from local estimated values
  const [data, setData] = useState<any>(() => {
    try {
      const parsed = JSON.parse(summary || '{}');
      return {
        tripId: parsed.tripId,
        durationMin: parsed.durationMin,
        distanceKm: parsed.distanceKm,
        finalScore: parsed.finalScore,
        harshBrakes: parsed.harshEvents, // local fallback map
        harshCorners: 0,
        speedingIncidents: parsed.speedingIncidents,
      };
    } catch {
      return {};
    }
  });

  const [syncing, setSyncing] = useState<boolean>(true);

  // Fetch the final, backend-calculated scoring results from database
  useEffect(() => {
    if (!data.tripId) {
      setSyncing(false);
      return;
    }

    const fetchBackendScore = () => {
      api.get(`/trips/${data.tripId}`)
        .then((res) => {
          if (res.data?.trip) {
            const t = res.data.trip;
            // Use defensive state merger to ensure local values don't vanish if fields are undefined
            setData((prev: any) => ({
              ...prev,
              tripId: t.id || prev.tripId,
              durationMin: t.duration_minutes !== undefined ? t.duration_minutes : prev.durationMin,
              distanceKm: t.distance_km !== undefined ? t.distance_km : prev.distanceKm,
              finalScore: t.final_score !== undefined ? t.final_score : prev.finalScore,
              harshBrakes: t.harsh_brake_count !== undefined ? t.harsh_brake_count : prev.harshBrakes,
              harshCorners: t.harsh_corner_count !== undefined ? t.harsh_corner_count : prev.harshCorners,
              speedingIncidents: t.speeding_count !== undefined ? t.speeding_count : prev.speedingIncidents,
            }));
          }
          setSyncing(false);
        })
        .catch((err) => {
          console.warn('Could not fetch synchronized scoring details from backend:', err);
          setSyncing(false); // Fallback: show estimated local stats if network query fails
        });
    };

    // 2-second delay gives the Celery background worker sufficient time to process math and commit
    const timer = setTimeout(fetchBackendScore, 2000);
    return () => clearTimeout(timer);
  }, [summary]);

  if (syncing) {
    return (
      <SafeAreaView style={styles.safeContainer}>
        <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingTitle}>Analyzing Driving Telematics</Text>
          <Text style={styles.loadingSubtitle}>
            Calculating scores, jerks, and fuel efficiency metrics...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeContainer}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerLabel}>COMPLETED</Text>
          <Text style={styles.title}>TRIP SUMMARY</Text>
        </View>

        {/* Stats Summary Panel */}
        <View style={styles.statsCard}>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Trip ID</Text>
            <Text style={styles.statValue}>#{data.tripId}</Text>
          </View>
          <View style={styles.divider} />
          
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Duration</Text>
            <Text style={styles.statValue}>{data.durationMin} min</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Distance</Text>
            <Text style={styles.statValue}>{data.distanceKm?.toFixed(2) || '0.00'} km</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Safety Score</Text>
            <Text style={[styles.statValue, styles.scoreValue]}>
              {data.finalScore}/100
            </Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Harsh Brakes</Text>
            <Text style={styles.statValue}>
              {data.harshBrakes || 0} events
            </Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Harsh Corners</Text>
            <Text style={styles.statValue}>
              {data.harshCorners || 0} events
            </Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Speeding Incidents</Text>
            <Text style={styles.statValue}>
              {data.speedingIncidents || 0} events
            </Text>
          </View>
        </View>

        {/* Done Button */}
        <Pressable
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
          ]}
          onPress={() => router.replace('/')}
        >
          <Text style={styles.buttonText}>DONE</Text>
        </Pressable>
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
    marginTop: theme.spacing.xl,
    alignItems: 'center',
  },
  headerLabel: {
    ...theme.typography.labelCaps,
    color: theme.colors.textMuted,
  },
  title: {
    ...theme.typography.headlineMd,
    color: theme.colors.text,
    marginTop: theme.spacing.xs,
  },
  statsCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.rounded.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  statLabel: {
    ...theme.typography.bodyLg,
    color: theme.colors.textMuted,
  },
  statValue: {
    ...theme.typography.bodyLg,
    color: theme.colors.text,
    fontWeight: '600',
  },
  scoreValue: {
    color: theme.colors.success,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.xs,
  },
  button: {
    backgroundColor: theme.colors.primary,
    height: 56,
    borderRadius: theme.rounded.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  loadingTitle: {
    ...theme.typography.headlineSm,
    color: theme.colors.text,
    marginTop: theme.spacing.lg,
    fontWeight: '700',
  },
  loadingSubtitle: {
    ...theme.typography.bodyMd,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
    lineHeight: 20,
  },
});