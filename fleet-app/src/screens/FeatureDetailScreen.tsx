/**
 * ============================================================================
 *     Fleet Telematics Platform - Feature Detail Screen
 *
 *     File: src/screens/FeatureDetailScreen.tsx
 *     Purpose: Display drill-down configurations for selected features
 * ============================================================================
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import theme from '../theme';
import { getDriverDetail, Driver } from '../data/mockFleetData';
import { MaterialIcons } from '@expo/vector-icons';
import { api } from '../api/client';

// Subcomponents separated according to feature/card component criteria
import { LiveTripTrackerFeature } from '../components/LiveTripTrackerFeature';
import { FastagMonitorFeature } from '../components/FastagMonitorFeature';
import { RtoLockerFeature } from '../components/RtoLockerFeature';
import { DriverSafetyFeature } from '../components/DriverSafetyFeature';
import { NotTrackedFeature } from '../components/NotTrackedFeature';

type Props = NativeStackScreenProps<RootStackParamList, 'FeatureDetail'>;

export const FeatureDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { feature, driverId } = route.params;
  const [driver, setDriver] = useState<Driver | null>(null);
  const [loading, setLoading] = useState(true);
  const [dbHarshBrakes, setDbHarshBrakes] = useState(0);
  const [dbHarshCorners, setDbHarshCorners] = useState(0);
  const [dbSpeeding, setDbSpeeding] = useState(0);
  const [dbSafetyScore, setDbSafetyScore] = useState<number | undefined>(undefined);

  useEffect(() => {
    getDriverDetail(driverId).then(data => {
      setDriver(data);
      setLoading(false);
    });

    api.listTrips(driverId)
      .then(res => {
        if (res.data?.trips) {
          const completedOnly = res.data.trips.filter((t: any) => t.status === 'completed');
          if (completedOnly.length > 0) {
            const totalBrakes = completedOnly.reduce((sum: number, t: any) => sum + (t.harsh_brake_count || 0), 0);
            const totalCorners = completedOnly.reduce((sum: number, t: any) => sum + (t.harsh_corner_count || 0), 0);
            const totalSpeeding = completedOnly.reduce((sum: number, t: any) => sum + (t.speeding_count || 0), 0);
            const avgScore = completedOnly.reduce((sum: number, t: any) => sum + (t.final_score || 100), 0) / completedOnly.length;

            setDbHarshBrakes(totalBrakes);
            setDbHarshCorners(totalCorners);
            setDbSpeeding(totalSpeeding);
            setDbSafetyScore(avgScore);
          }
        }
      })
      .catch(err => console.error('Error fetching driver safety stats from trips:', err));
  }, [driverId]);

  if (loading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </SafeAreaView>
    );
  }

  if (!driver) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <Text style={[theme.typography.bodyLg, { color: theme.colors.onSurface }]}>
          Driver not found.
        </Text>
      </SafeAreaView>
    );
  }

  // Get screen metadata
  const getFeatureDetails = () => {
    switch (feature) {
      case 'live_trip_tracker':
        return { title: 'Live Trip Tracker', icon: 'map' };
      case 'engine_health':
        return { title: 'Engine Health', icon: 'speed' };
      case 'smart_fuel_audit':
        return { title: 'Smart Fuel Audit', icon: 'local-gas-station' };
      case 'fastag_monitor':
        return { title: 'Fastag Monitor', icon: 'account-balance-wallet' };
      case 'rto_locker':
        return { title: 'RTO Locker', icon: 'description' };
      case 'driver_safety':
        return { title: 'Driver Safety Profile', icon: 'security' };
      default:
        return { title: 'Feature Details', icon: 'info' };
    }
  };

  const featureMeta = getFeatureDetails();

  const renderContent = () => {
    switch (feature) {
      case 'live_trip_tracker':
        return <LiveTripTrackerFeature driver={driver} />;
      case 'engine_health':
        return (
          <NotTrackedFeature
            title="OBD ENGINE DIAGNOSTICS"
            message="Not tracked yet (No OBD-II telemetry source configured)"
          />
        );
      case 'smart_fuel_audit':
        return (
          <NotTrackedFeature
            title="FUEL ECONOMY & ANOMALIES"
            message="Not tracked yet (No fuel level telematics database source configured)"
          />
        );
      case 'fastag_monitor':
        return <FastagMonitorFeature driver={driver} />;
      case 'rto_locker':
        return <RtoLockerFeature driver={driver} />;
      case 'driver_safety':
        return (
          <DriverSafetyFeature 
            driver={driver} 
            harshBrakes={dbHarshBrakes} 
            harshCorners={dbHarshCorners} 
            speeding={dbSpeeding} 
            safetyScore={dbSafetyScore} 
          />
        );
      default:
        return (
          <View style={styles.contentCard}>
            <Text style={[theme.typography.bodyMd, { color: theme.colors.onSurface }]}>
              No detailed configuration found for this product.
            </Text>
          </View>
        );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* App Bar */}
      <View style={styles.appBar}>
        <TouchableOpacity
          style={styles.appBarButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <MaterialIcons name="arrow-back" size={24} color={theme.colors.onSurface} />
        </TouchableOpacity>

        <Text style={[theme.typography.headlineMd, styles.appBarTitle]}>
          {featureMeta.title}
        </Text>

        <View style={styles.placeholderButton}>
          <MaterialIcons name={featureMeta.icon as any} size={24} color={theme.colors.primary} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Driver context header */}
        <View style={styles.driverContextCard}>
          <Text style={[theme.typography.bodyMd, { color: theme.colors.onSurfaceVariant, fontSize: 11 }]}>
            DRIVER TARGET
          </Text>
          <Text style={[theme.typography.headlineMd, { color: theme.colors.onSurface, fontWeight: '700', marginTop: 2 }]}>
            {driver.name}
          </Text>
          <Text style={[theme.typography.labelCaps, { color: theme.colors.primary, marginTop: 4 }]}>
            {driver.vehicleName}
          </Text>
        </View>

        {renderContent()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  appBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderColor: theme.colors.outlineVariant,
    backgroundColor: theme.colors.surface,
  },
  appBarButton: {
    padding: 8,
  },
  appBarTitle: {
    fontWeight: '700',
    color: theme.colors.onSurface,
    flex: 1,
    textAlign: 'center',
  },
  placeholderButton: {
    padding: 8,
    width: 40,
    alignItems: 'center',
  },
  scrollContent: {
    padding: 16,
  },
  driverContextCard: {
    backgroundColor: theme.colors.surfaceContainer,
    borderRadius: theme.rounded.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    marginBottom: 16,
  },
  contentCard: {
    backgroundColor: theme.colors.surfaceContainer,
    borderRadius: theme.rounded.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
  },
});

export default FeatureDetailScreen;
