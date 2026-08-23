import { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { startTrip, getActiveTrip } from '../src/services/trip';
import { requestLocationPermission } from '../src/services/location';
import { theme } from '../src/theme';

export default function HomeScreen() {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getActiveTrip().then((trip) => {
      if (trip) router.replace('/active-trip');
    });
  }, []);

  const handleStartTrip = async () => {
    setLoading(true);
    const granted = await requestLocationPermission();
    if (!granted) {
      setLoading(false);
      alert('Location permission is required to start a trip.');
      return;
    }
    const trip = await startTrip("default", "default");
    setLoading(false);
    router.push({ pathname: '/active-trip', params: { tripId: trip.tripId } });
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.subtitle}>FLEET MANAGEMENT</Text>
          <Text style={styles.title}>DRIVER PORTAL</Text>
        </View>



        {/* Buttons */}
        <View style={styles.actionContainer}>
          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.buttonPressed,
              loading && styles.buttonDisabled,
            ]}
            onPress={handleStartTrip}
            disabled={loading}
          >
            <Text style={styles.primaryButtonText}>
              {loading ? 'STARTING...' : 'START TRIP'}
            </Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => router.push('/documents')}
          >
            <Text style={styles.secondaryButtonText}>RTO DOCUMENTS</Text>
          </Pressable>
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
    marginTop: theme.spacing.xl,
  },
  subtitle: {
    ...theme.typography.labelCaps,
    color: theme.colors.textMuted,
  },
  title: {
    ...theme.typography.metricMobile,
    color: theme.colors.text,
    marginTop: theme.spacing.xs,
  },
  actionContainer: {
    gap: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  primaryButton: {
    backgroundColor: theme.colors.success,
    height: 56,
    borderRadius: theme.rounded.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  secondaryButton: {
    backgroundColor: theme.colors.card,
    height: 56,
    borderRadius: theme.rounded.lg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  secondaryButtonText: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});