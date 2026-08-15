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
import { useSelector } from 'react-redux';
import { api } from '../api/client';

const CITY_COORDINATES: Record<string, { latitude: number; longitude: number }> = {
  'bangalore': { latitude: 12.9716, longitude: 77.5946 },
  'bengaluru': { latitude: 12.9716, longitude: 77.5946 },
  'mumbai': { latitude: 19.0760, longitude: 72.8777 },
  'delhi': { latitude: 28.7041, longitude: 77.1025 },
  'new delhi': { latitude: 28.6139, longitude: 77.2090 },
  'gurugram': { latitude: 28.4595, longitude: 77.0266 },
  'gurgaon': { latitude: 28.4595, longitude: 77.0266 },
  'pune': { latitude: 18.5204, longitude: 73.8567 },
  'chennai': { latitude: 13.0827, longitude: 80.2707 },
  'hyderabad': { latitude: 17.3850, longitude: 78.4867 },
  'kolkata': { latitude: 22.5726, longitude: 88.3639 },
};

const darkMapStyle = [
  { "elementType": "geometry", "stylers": [{ "color": "#0f0f12" }] },
  { "elementType": "labels.text.stroke", "stylers": [{ "color": "#0f0f12" }] },
  { "elementType": "labels.text.fill", "stylers": [{ "color": "#746855" }] },
  { "featureType": "administrative.locality", "elementType": "labels.text.fill", "stylers": [{ "color": "#d59563" }] },
  { "featureType": "poi", "elementType": "labels.text.fill", "stylers": [{ "color": "#d59563" }] },
  { "featureType": "poi.park", "elementType": "geometry", "stylers": [{ "color": "#111215" }] },
  { "featureType": "poi.park", "elementType": "labels.text.fill", "stylers": [{ "color": "#6b9a76" }] },
  { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#191a23" }] },
  { "featureType": "road", "elementType": "geometry.stroke", "stylers": [{ "color": "#2a2b37" }] },
  { "featureType": "road", "elementType": "labels.text.fill", "stylers": [{ "color": "#64748b" }] },
  { "featureType": "road.highway", "elementType": "geometry", "stylers": [{ "color": "#6366f1" }, { "weight": 1 }] },
  { "featureType": "road.highway", "elementType": "geometry.stroke", "stylers": [{ "color": "#4f46e5" }] },
  { "featureType": "road.highway", "elementType": "labels.text.fill", "stylers": [{ "color": "#f8fafc" }] },
  { "featureType": "transit", "elementType": "geometry", "stylers": [{ "color": "#191a23" }] },
  { "featureType": "transit.station", "elementType": "labels.text.fill", "stylers": [{ "color": "#d59563" }] },
  { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#0b0c10" }] },
  { "featureType": "water", "elementType": "labels.text.fill", "stylers": [{ "color": "#515c6d" }] },
  { "featureType": "water", "elementType": "labels.stroke", "stylers": [{ "color": "#17263c" }] }
];


type Props = NativeStackScreenProps<RootStackParamList, 'DriverDetail'>;

export const DriverDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { driverId } = route.params;
  const [driver, setDriver] = useState<Driver | null>(null);
  const [loading, setLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [gpsPoints, setGpsPoints] = useState<{ lat: number; lng: number; timestamp: string }[]>([]);
  const [activeTripId, setActiveTripId] = useState<string | null>(null);
  const [liveSpeed, setLiveSpeed] = useState<number>(0);
  const [completedTrips, setCompletedTrips] = useState<any[]>([]);
  const [dbHarshBrakes, setDbHarshBrakes] = useState(0);
  const [dbHarshCorners, setDbHarshCorners] = useState(0);
  const [dbSpeeding, setDbSpeeding] = useState(0);
  const [dbSafetyScore, setDbSafetyScore] = useState<number | undefined>(undefined);

  const companyCity = useSelector((state: any) => state.auth.user?.city);
  const lowercaseCity = (companyCity || 'bangalore').trim().toLowerCase();
  const defaultCoords = CITY_COORDINATES[lowercaseCity] || CITY_COORDINATES['bangalore'];

  const hasGpsData = gpsPoints && gpsPoints.length > 0;

  // Center map on last tracked coordinate, or default to geocoded company city
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

  useEffect(() => {
    let pollInterval: any = null;

    getDriverDetail(driverId).then(data => {
      setDriver(data);
      setLoading(false);

      const fetchActiveTelemetry = () => {
        api.listTrips(driverId)
          .then(res => {
            if (res.data?.trips) {
              const allTrips = res.data.trips;
              setCompletedTrips(allTrips);

              // Aggregate statistics from all completed trips
              const completedOnly = allTrips.filter((t: any) => t.status === 'completed');
              if (completedOnly.length > 0) {
                const totalBrakes = completedOnly.reduce((sum: number, t: any) => sum + (t.harsh_brake_count || 0), 0);
                const totalCorners = completedOnly.reduce((sum: number, t: any) => sum + (t.harsh_corner_count || 0), 0);
                const totalSpeeding = completedOnly.reduce((sum: number, t: any) => sum + (t.speeding_count || 0), 0);
                const avgScore = completedOnly.reduce((sum: number, t: any) => sum + (t.final_score || 100), 0) / completedOnly.length;

                setDbHarshBrakes(totalBrakes);
                setDbHarshCorners(totalCorners);
                setDbSpeeding(totalSpeeding);
                setDbSafetyScore(avgScore);
              } else {
                setDbHarshBrakes(0);
                setDbHarshCorners(92); // default mock-aligned
                setDbSpeeding(0);
                setDbSafetyScore(undefined);
              }

              const activeTrip = allTrips.find((t: any) => t.status === 'active');
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

      // Initial fetch
      fetchActiveTelemetry();

      // Poll every 5 seconds for live coordinates update on map
      pollInterval = setInterval(fetchActiveTelemetry, 5000);
    });

    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [driverId, refreshTrigger]);

  useEffect(() => {
    if (!activeTripId) {
      setLiveSpeed(0);
      return;
    }

    const wsBaseUrl = api.baseURL ? api.baseURL.replace('http://', 'ws://').replace('https://', 'wss://') : 'ws://127.0.0.1:8001/api/v1';
    const wsUrl = `${wsBaseUrl}/auth/ws/trip/${activeTripId}/listen`;

    console.log('Connecting to fleet live tracking WS:', wsUrl);
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('Connected to fleet live tracking WS!');
    };

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
      } catch (err) {
        console.error('Error parsing live WS payload:', err);
      }
    };

    ws.onerror = (e) => {
      console.error('WS Error:', e);
    };

    ws.onclose = () => {
      console.log('WS Connection closed');
    };

    return () => {
      ws.close();
    };
  }, [activeTripId]);

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
            onPress={handleDeletePress}
            activeOpacity={0.7}
          >
            <MaterialIcons name="delete-outline" size={22} color={theme.colors.error} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
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
              <View style={styles.mapWrapper}>
                <View style={styles.webMapFallback}>
                  <MaterialIcons name="map" size={32} color={theme.colors.brandTeal} style={{ marginBottom: 8 }} />
                  <Text style={[theme.typography.bodyMd, { color: '#ffffff', fontWeight: '600', textAlign: 'center' }]}>
                    Interactive Map view is active on Android/iOS
                  </Text>
                  {hasGpsData ? (
                    <Text style={[theme.typography.labelCaps, { color: theme.colors.onSurfaceVariant, marginTop: 4, fontSize: 10 }]}>
                      GPS: {gpsPoints[gpsPoints.length - 1].lat.toFixed(5)}, {gpsPoints[gpsPoints.length - 1].lng.toFixed(5)}
                    </Text>
                  ) : (
                    <Text style={[theme.typography.labelCaps, { color: theme.colors.onSurfaceVariant, marginTop: 4, fontSize: 10 }]}>
                      Waiting for GPS signals...
                    </Text>
                  )}
                </View>

                {activeTripId !== null && (
                  <View style={styles.liveOverlayBadge}>
                    <View style={styles.liveIndicatorDot} />
                    <Text style={styles.liveBadgeText}>LIVE: {liveSpeed.toFixed(0)} km/h</Text>
                  </View>
                )}
              </View>

              {completedTrips.length > 0 ? (
                completedTrips.map(trip => (
                  <View key={trip.id} style={styles.tripRow}>
                    <View style={styles.tripLeft}>
                      <MaterialIcons name="local-shipping" size={20} color={theme.colors.onSurfaceVariant} />
                      <View style={styles.tripText}>
                        <Text style={[theme.typography.bodyMd, { color: theme.colors.onSurface, fontWeight: '500' }]}>
                          Trip {trip.id.substring(0, 8).toUpperCase()} (Score: {trip.final_score !== null ? trip.final_score.toFixed(0) : 'N/A'})
                        </Text>
                        <Text style={[theme.typography.labelCaps, { color: theme.colors.onSurfaceVariant, fontSize: 9, marginTop: 2 }]}>
                          {trip.start_time ? new Date(trip.start_time).toLocaleString() : 'N/A'}
                        </Text>
                      </View>
                    </View>
                    <Text style={[theme.typography.bodyMd, { color: theme.colors.primary, fontWeight: '600' }]}>
                      {trip.distance_km !== null ? `${parseFloat(trip.distance_km).toFixed(1)} km` : '0.0 km'}
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
                value={0}
                displayValue="N/A"
                labelText="Fuel Level (Not Tracked)"
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
                value={0}
                displayValue="N/A"
                labelText="Mileage Diff (Not Tracked)"
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
              style={[styles.gaugeCard, { paddingVertical: 24 }]}
            >
              <Text style={[theme.typography.bodyMd, { color: theme.colors.onSurfaceVariant }]}>
                Not tracked yet (No fuel telemetry database source configured)
              </Text>
            </TouchableOpacity>
          </>
        )}

        {/* Driver Stats (Three Small Cards Row) */}
        {(driver.enabledProducts.includes('engine_health') ||
          driver.enabledProducts.includes('fastag_monitor') ||
          driver.enabledProducts.includes('rto_locker')) && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={[theme.typography.labelCaps, styles.sectionTitle]}>DRIVER STATS</Text>
            </View>
            <View style={styles.threeCardsRow}>
              {/* Card 1: Fastag Wallet */}
              {driver.enabledProducts.includes('fastag_monitor') && (() => {
                const alert = driver.alerts.find(a => a.category === 'fastag_monitor');
                const isLow = alert && alert.status === 'critical';
                const statusColor = isLow ? theme.colors.error : '#10b981';
                const balance = alert?.remainingInfo || 'Balance Optimal';
                return (
                  <TouchableOpacity
                    style={styles.smallStatCard}
                    onPress={() => navigation.navigate('FeatureDetail', { feature: 'fastag_monitor', driverId: driver.id })}
                    activeOpacity={0.8}
                  >
                    <MaterialIcons name="account-balance-wallet" size={24} color={statusColor} style={{ marginBottom: 6 }} />
                    <Text style={styles.smallStatLabel}>Fastag Wallet</Text>
                    <Text style={[styles.smallStatVal, { color: statusColor }]} numberOfLines={1} adjustsFontSizeToFit>
                      {balance}
                    </Text>
                  </TouchableOpacity>
                );
              })()}

              {/* Card 2: Engine Status */}
              {driver.enabledProducts.includes('engine_health') && (() => {
                return (
                  <TouchableOpacity
                    style={styles.smallStatCard}
                    onPress={() => navigation.navigate('FeatureDetail', { feature: 'engine_health', driverId: driver.id })}
                    activeOpacity={0.8}
                  >
                    <MaterialIcons name="speed" size={24} color="#d97706" style={{ marginBottom: 6 }} />
                    <Text style={styles.smallStatLabel}>Engine Status</Text>
                    <Text style={[styles.smallStatVal, { color: '#d97706' }]}>Not tracked</Text>
                  </TouchableOpacity>
                );
              })()}

              {/* Card 3: RTO Locker */}
              {driver.enabledProducts.includes('rto_locker') && (() => {
                return (
                  <TouchableOpacity
                    style={styles.smallStatCard}
                    onPress={() => navigation.navigate('FeatureDetail', { feature: 'rto_locker', driverId: driver.id })}
                    activeOpacity={0.8}
                  >
                    <MaterialIcons name="description" size={24} color="#10b981" style={{ marginBottom: 6 }} />
                    <Text style={styles.smallStatLabel}>RTO Locker</Text>
                    <Text style={[styles.smallStatVal, { color: '#10b981' }]}>All Valid</Text>
                  </TouchableOpacity>
                );
              })()}
            </View>
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
  threeCardsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  smallStatCard: {
    flex: 1,
    backgroundColor: theme.colors.surfaceContainer,
    borderRadius: theme.rounded.lg,
    paddingVertical: 14,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallStatLabel: {
    color: theme.colors.onSurfaceVariant,
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    textAlign: 'center',
    marginBottom: 4,
  },
  smallStatVal: {
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
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
  mapWrapper: {
    height: 150,
    borderRadius: theme.rounded.md,
    overflow: 'hidden',
    position: 'relative',
    marginTop: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
  },
  map: {
    flex: 1,
  },
  emptyOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 15, 18, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  emptyText: {
    color: theme.colors.onSurfaceVariant,
    fontSize: 12,
    fontWeight: '500',
  },
  truckMarker: {
    backgroundColor: theme.colors.primary,
    padding: 6,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveOverlayBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 8,
    gap: 6,
  },
  liveIndicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
  },
  liveBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  webMapFallback: {
    flex: 1,
    backgroundColor: '#0f0f12',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  liveTelemetryCard: {
    backgroundColor: theme.colors.surfaceContainerLow || 'rgba(255, 255, 255, 0.05)',
    borderRadius: theme.rounded.md,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    padding: 12,
    marginTop: 8,
    marginBottom: 16,
  },
  telemetrySectionTitle: {
    fontSize: 9,
    fontWeight: '700',
    color: theme.colors.onSurfaceVariant,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  telemetryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  telemetryLocationText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.onSurface,
    flex: 1,
  },
  telemetryStatsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  telemetryStatBox: {
    flex: 1,
    backgroundColor: theme.colors.surfaceContainer || 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: theme.rounded.sm,
    padding: 8,
    alignItems: 'center',
  },
  telemetryStatLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: 4,
  },
  telemetryStatValue: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.primary,
  },
});
export default DriverDetailScreen;
