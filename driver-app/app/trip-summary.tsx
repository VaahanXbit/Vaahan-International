import { useLocalSearchParams, router } from 'expo-router';
import { View, Text, Pressable, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../src/theme';

export default function TripSummaryScreen() {
  const { summary } = useLocalSearchParams<{ summary: string }>();
  let data: any = {};
  try {
    data = JSON.parse(summary || '{}');
  } catch (error) {
    console.error('Failed to parse trip summary:', error);
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
});