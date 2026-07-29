import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import theme from '../theme';
import { getDriverDetail, deleteDriver, Driver } from '../data/mockFleetData';
import { Gauge } from '../components/Gauge';
import { TelemetryChart } from '../components/TelemetryChart';
import { AddDriverModal } from '../components/AddDriverModal';
import { MaterialIcons } from '@expo/vector-icons';

type Props = NativeStackScreenProps<RootStackParamList, 'DriverDetail'>;

export const DriverDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { driverId } = route.params;
  const [driver, setDriver] = useState<Driver | null>(null);
  const [loading, setLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    // TODO(backend): Confirm this matches real API response shape before
    // wiring in.
    getDriverDetail(driverId).then(data => {
      setDriver(data);
      setLoading(false);
    });
  }, [driverId, refreshTrigger]);

  const handleDeletePress = () => {
    Alert.alert(
      'Delete Driver',
      "Delete this driver? This can't be undone.",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            // TODO(backend): Call backend DELETE /driver/{id} instead of local state only.
            await deleteDriver(driverId);
            navigation.reset({
              index: 0,
              routes: [{ name: 'Dashboard' }],
            });
          }
        }
      ]
    );
  };

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

  return (
    <SafeAreaView style={styles.container}>
      {/* Custom Top App Bar */}
      <View style={styles.appBar}>
        <TouchableOpacity
          style={styles.appBarButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <MaterialIcons name="arrow-back" size={24} color={theme.colors.onSurface} />
        </TouchableOpacity>

        <Text style={[theme.typography.headlineMd, styles.appBarTitle]}>
          {driver.name}
        </Text>

        <View style={styles.appBarActions}>
          <TouchableOpacity
            style={styles.appBarButton}
            onPress={() => setEditModalOpen(true)}
            activeOpacity={0.7}
          >
            <MaterialIcons name="edit" size={22} color={theme.colors.onSurface} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.appBarButton}
            onPress={handleDeletePress}
            activeOpacity={0.7}
          >
            <MaterialIcons name="delete-outline" size={22} color={theme.colors.error} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Main Score Gauge */}
        {driver.enabledProducts.includes('driver_safety') && (
          <TouchableOpacity
            style={styles.gaugeCard}
            onPress={() => navigation.navigate('FeatureDetail', { feature: 'driver_safety', driverId: driver.id })}
            activeOpacity={0.8}
          >
            <Gauge
              value={driver.efficiencyScore}
              displayValue={`${driver.efficiencyScore}`}
              labelText="Efficiency Score"
              size="lg"
              thresholds={{ red: 50, amber: 75 }}
            />
          </TouchableOpacity>
        )}

        {/* Small Gauges Grid */}
        {driver.enabledProducts.includes('smart_fuel_audit') && (
          <View style={styles.smallGaugesRow}>
            <TouchableOpacity
              style={styles.statCard}
              onPress={() => navigation.navigate('FeatureDetail', { feature: 'smart_fuel_audit', driverId: driver.id })}
              activeOpacity={0.8}
            >
              <Gauge
                value={driver.fuelLevel}
                displayValue={`${driver.fuelLevel}%`}
                labelText="Fuel Level"
                size="sm"
                thresholds={{ red: 20, amber: 50 }}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.statCard}
              onPress={() => navigation.navigate('FeatureDetail', { feature: 'smart_fuel_audit', driverId: driver.id })}
              activeOpacity={0.8}
            >
              <Gauge
                value={Math.max(0, 100 - Math.abs(driver.mileageDiff * 4))}
                displayValue={`${driver.mileageDiff > 0 ? '+' : ''}${driver.mileageDiff}%`}
                labelText="Mileage Diff"
                size="sm"
                thresholds={{ red: 30, amber: 65 }}
              />
            </TouchableOpacity>
          </View>
        )}

        {/* 7-day Fuel Telemetry Sparkline/Line Chart */}
        {driver.enabledProducts.includes('smart_fuel_audit') && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={[theme.typography.labelCaps, styles.sectionTitle]}>7-DAY FUEL TELEMETRY</Text>
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate('FeatureDetail', { feature: 'smart_fuel_audit', driverId: driver.id })}
              activeOpacity={0.8}
            >
              <TelemetryChart data={driver.telemetryHistory} />
            </TouchableOpacity>
          </>
        )}

        {/* Active Solution Alerts */}
        {(driver.enabledProducts.includes('engine_health') ||
          driver.enabledProducts.includes('fastag_monitor') ||
          driver.enabledProducts.includes('rto_locker')) && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={[theme.typography.labelCaps, styles.sectionTitle]}>SOLUTION ALERTS</Text>
            </View>

            <View style={styles.alertsContainer}>
              {(() => {
                const activeAlerts = driver.alerts.filter(
                  alert => driver.enabledProducts.includes(alert.category)
                );

                const combinedItems: {
                  id: string;
                  title: string;
                  remainingInfo: string;
                  status: 'warning' | 'critical' | 'success';
                  category: 'engine_health' | 'fastag_monitor' | 'rto_locker';
                }[] = [...activeAlerts];

                const categoriesToCheck: ('engine_health' | 'fastag_monitor' | 'rto_locker')[] = [
                  'engine_health',
                  'fastag_monitor',
                  'rto_locker',
                ];

                categoriesToCheck.forEach(cat => {
                  if (driver.enabledProducts.includes(cat)) {
                    const hasAlert = activeAlerts.some(a => a.category === cat);
                    if (!hasAlert) {
                      if (cat === 'fastag_monitor') {
                        combinedItems.push({
                          id: `status-${cat}`,
                          title: 'Fastag Wallet',
                          remainingInfo: 'Balance Optimal',
                          status: 'success',
                          category: cat,
                        });
                      } else if (cat === 'engine_health') {
                        combinedItems.push({
                          id: `status-${cat}`,
                          title: 'Engine Status',
                          remainingInfo: 'Diagnostics Normal',
                          status: 'success',
                          category: cat,
                        });
                      } else if (cat === 'rto_locker') {
                        combinedItems.push({
                          id: `status-${cat}`,
                          title: 'RTO Locker',
                          remainingInfo: 'All Documents Valid',
                          status: 'success',
                          category: cat,
                        });
                      }
                    }
                  }
                });

                if (combinedItems.length > 0) {
                  return combinedItems.map(item => {
                    const statusDotColor = 
                      item.status === 'critical' 
                        ? theme.colors.error 
                        : item.status === 'warning' 
                        ? '#d97706' 
                        : '#10b981';

                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={styles.alertRow}
                        onPress={() => navigation.navigate('FeatureDetail', { feature: item.category, driverId: driver.id })}
                        activeOpacity={0.7}
                      >
                        <View style={styles.alertLeft}>
                          <View style={[styles.statusDot, { backgroundColor: statusDotColor }]} />
                          <Text style={[theme.typography.bodyMd, { color: theme.colors.onSurface, fontWeight: '500' }]}>
                            {item.title}
                          </Text>
                        </View>
                        <Text style={[theme.typography.labelCaps, { color: theme.colors.onSurfaceVariant, fontSize: 10 }]}>
                          {item.remainingInfo}
                        </Text>
                      </TouchableOpacity>
                    );
                  });
                }

                return (
                  <View style={styles.emptyBox}>
                    <Text style={[theme.typography.labelCaps, { color: theme.colors.onSurfaceVariant }]}>
                      NO ACTIVE ALERTS
                    </Text>
                  </View>
                );
              })()}
            </View>
          </>
        )}

        {/* Recent Trips Log */}
        {driver.enabledProducts.includes('live_trip_tracker') && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={[theme.typography.labelCaps, styles.sectionTitle]}>RECENT TRIPS</Text>
            </View>

            <TouchableOpacity
              onPress={() => navigation.navigate('FeatureDetail', { feature: 'live_trip_tracker', driverId: driver.id })}
              activeOpacity={0.8}
              style={styles.tripsContainer}
            >
              {driver.trips.length > 0 ? (
                driver.trips.map(trip => (
                  <View key={trip.id} style={styles.tripRow}>
                    <View style={styles.tripLeft}>
                      <MaterialIcons name="local-shipping" size={20} color={theme.colors.onSurfaceVariant} />
                      <View style={styles.tripText}>
                        <Text style={[theme.typography.bodyMd, { color: theme.colors.onSurface, fontWeight: '500' }]}>
                          {trip.route}
                        </Text>
                        <Text style={[theme.typography.labelCaps, { color: theme.colors.onSurfaceVariant, fontSize: 9, marginTop: 2 }]}>
                          {trip.timestamp}
                        </Text>
                      </View>
                    </View>
                    <Text style={[theme.typography.bodyMd, { color: theme.colors.primary, fontWeight: '600' }]}>
                      {trip.distance}
                    </Text>
                  </View>
                ))
              ) : (
                <View style={styles.emptyBox}>
                  <Text style={[theme.typography.labelCaps, { color: theme.colors.onSurfaceVariant }]}>
                    NO RECENT TRIPS
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      {/* Edit Driver Modal */}
      <AddDriverModal
        visible={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onDriverAdded={() => setRefreshTrigger(prev => prev + 1)}
        editDriverId={driver.id}
        initialName={driver.name}
        initialVehicle={driver.vehicleName}
      />
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
    padding: theme.spacing.unit * 2,
  },
  appBarTitle: {
    fontWeight: '700',
    color: theme.colors.onSurface,
    flex: 1,
    textAlign: 'center',
  },
  appBarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  scrollContent: {
    padding: 16,
  },
  gaugeCard: {
    backgroundColor: theme.colors.surfaceContainer,
    borderRadius: theme.rounded.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    alignItems: 'center',
    marginBottom: 16,
  },
  smallGaugesRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.surfaceContainer,
    borderRadius: theme.rounded.lg,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    alignItems: 'center',
  },
  sectionHeader: {
    marginTop: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    color: theme.colors.onSurfaceVariant,
  },
  alertsContainer: {
    backgroundColor: theme.colors.surfaceContainer,
    borderRadius: theme.rounded.lg,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    paddingHorizontal: 16,
  },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: theme.colors.surfaceContainerLow,
  },
  alertLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: theme.rounded.full,
  },
  tripsContainer: {
    backgroundColor: theme.colors.surfaceContainer,
    borderRadius: theme.rounded.lg,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  tripRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: theme.colors.surfaceContainerLow,
  },
  tripLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tripText: {
    justifyContent: 'center',
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 24,
  },
});
export default DriverDetailScreen;
