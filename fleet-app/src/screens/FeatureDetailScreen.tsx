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

type Props = NativeStackScreenProps<RootStackParamList, 'FeatureDetail'>;

export const FeatureDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { feature, driverId } = route.params;
  const [driver, setDriver] = useState<Driver | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDriverDetail(driverId).then(data => {
      setDriver(data);
      setLoading(false);
    });
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

  // Get screen titles and icons
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
        return (
          <View style={styles.contentCard}>
            <Text style={[theme.typography.labelCaps, styles.cardLabel]}>GPS LIVE ROUTE TRACKING</Text>
            
            {/* Visual Mock Map Canvas */}
            <View style={styles.mockMapContainer}>
              <View style={styles.mockGrid}>
                {/* Visual grid lines for street representation */}
                <View style={[styles.gridLine, { top: '30%', width: '100%' }]} />
                <View style={[styles.gridLine, { top: '65%', width: '100%' }]} />
                <View style={[styles.gridLine, { left: '25%', height: '100%' }]} />
                <View style={[styles.gridLine, { left: '70%', height: '100%' }]} />
                
                {/* Simulated GPS Route path */}
                <View style={styles.mockRoutePath} />
                
                {/* Route markers */}
                <View style={[styles.mapMarker, styles.markerStart]}>
                  <Text style={styles.markerText}>A</Text>
                </View>
                <View style={[styles.mapMarker, styles.markerEnd]}>
                  <MaterialIcons name="local-shipping" size={14} color="#000" />
                </View>
              </View>
              <Text style={styles.mapStatus}>LIVE — Heading North on Interstate 80</Text>
            </View>

            <View style={styles.detailsList}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Assigned Driver</Text>
                <Text style={styles.detailVal}>{driver.name}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Assigned Vehicle</Text>
                <Text style={styles.detailVal}>{driver.vehicleName}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Current Route</Text>
                <Text style={styles.detailVal}>Depot A to Port Terminal</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Estimated Time</Text>
                <Text style={styles.detailVal}>18 mins remaining</Text>
              </View>
            </View>
          </View>
        );

      case 'engine_health':
        return (
          <View style={styles.contentCard}>
            <Text style={[theme.typography.labelCaps, styles.cardLabel]}>OBD ENGINE DIAGNOSTICS</Text>

            {/* Diagnostic Scanner Banner */}
            <View style={styles.scannerBanner}>
              <MaterialIcons name="settings-input-hdmi" size={24} color={theme.colors.primary} />
              <View>
                <Text style={[theme.typography.bodyLg, { color: theme.colors.onSurface, fontWeight: '700' }]}>
                  OBD-II DONGLE CONNECTED
                </Text>
                <Text style={[theme.typography.labelCaps, { color: '#10b981', fontSize: 9, marginTop: 2 }]}>
                  SYSTEM TESTS COMPLETED — SCAN CLEAN
                </Text>
              </View>
            </View>

            {/* Diagnostic fault list */}
            <Text style={[theme.typography.labelCaps, styles.subSectionTitle]}>ACTIVE TROUBLE CODES (DTC)</Text>
            {driver.id === 'd2' ? (
              <View style={styles.troubleCodeCard}>
                <View style={styles.codeHeader}>
                  <Text style={styles.codeText}>P0300</Text>
                  <Text style={styles.codeSeverity}>CRITICAL FAULT</Text>
                </View>
                <Text style={styles.codeDesc}>Cylinder Misfire Detected (Random/Multiple Cylinders)</Text>
                <Text style={styles.codeAction}>Action Required: Inspect spark plugs, ignition coils, and fuel injectors immediately.</Text>
              </View>
            ) : (
              <View style={styles.cleanStatusBox}>
                <MaterialIcons name="check-circle" size={20} color="#10b981" />
                <Text style={styles.cleanStatusText}>No Active Fault Codes Found</Text>
              </View>
            )}

            {/* General Engine stats */}
            <Text style={[theme.typography.labelCaps, styles.subSectionTitle]}>LIVE SYSTEM TELEMETRY</Text>
            <View style={styles.detailsList}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Coolant Temperature</Text>
                <Text style={styles.detailVal}>92 °C (Optimal)</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Engine RPM</Text>
                <Text style={styles.detailVal}>1,850 RPM</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Battery Voltage</Text>
                <Text style={styles.detailVal}>14.2V (Charging)</Text>
              </View>
            </View>
          </View>
        );

      case 'smart_fuel_audit':
        return (
          <View style={styles.contentCard}>
            <Text style={[theme.typography.labelCaps, styles.cardLabel]}>FUEL ECONOMY & ANOMALIES</Text>

            <View style={styles.fuelGaugeRow}>
              <View style={styles.fuelGaugeCard}>
                <Text style={styles.fuelPercentText}>{driver.fuelLevel}%</Text>
                <Text style={[theme.typography.labelCaps, { color: theme.colors.onSurfaceVariant, fontSize: 10 }]}>
                  CURRENT FUEL LEVEL
                </Text>
              </View>
              <View style={styles.fuelGaugeCard}>
                <Text style={styles.fuelPercentText}>7.8 gal/h</Text>
                <Text style={[theme.typography.labelCaps, { color: theme.colors.onSurfaceVariant, fontSize: 10 }]}>
                  AVG CONSUMPTION RATE
                </Text>
              </View>
            </View>

            {/* Audit Logs */}
            <Text style={[theme.typography.labelCaps, styles.subSectionTitle]}>DETECTED ANOMALIES</Text>
            {driver.id === 'd2' ? (
              <View style={styles.anomalyCard}>
                <MaterialIcons name="warning" size={20} color={theme.colors.error} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.anomalyTitle}>Sudden Fuel Level Drop</Text>
                  <Text style={styles.anomalyDesc}>-4.5% level shift detected during vehicle stop on July 19 at 04:12 AM.</Text>
                </View>
              </View>
            ) : (
              <View style={styles.cleanStatusBox}>
                <MaterialIcons name="check-circle" size={20} color="#10b981" />
                <Text style={styles.cleanStatusText}>No fuel leaks or drainage events detected</Text>
              </View>
            )}

            {/* Audit transactions */}
            <Text style={[theme.typography.labelCaps, styles.subSectionTitle]}>RECENT REFUEL LOG</Text>
            <View style={styles.detailsList}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>July 20, 14:02</Text>
                <Text style={styles.detailVal}>+42.5 Gal (₹8,200)</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>July 15, 08:30</Text>
                <Text style={styles.detailVal}>+38.0 Gal (₹7,410)</Text>
              </View>
            </View>
          </View>
        );

      case 'fastag_monitor':
        return (
          <View style={styles.contentCard}>
            <Text style={[theme.typography.labelCaps, styles.cardLabel]}>FASTAG BALANCE & TOLL RECORDS</Text>

            <View style={styles.balanceContainer}>
              <Text style={styles.balanceTitle}>Current Wallet Balance</Text>
              <Text style={styles.balanceValue}>₹4,850.00</Text>
              <Text style={[theme.typography.labelCaps, { color: '#10b981', fontSize: 10, marginTop: 4 }]}>
                STATUS: ACTIVE / RECHARGED
              </Text>
            </View>

            {/* Toll Plaza Log */}
            <Text style={[theme.typography.labelCaps, styles.subSectionTitle]}>RECENT TOLL TRANSACTIONS</Text>
            <View style={styles.detailsList}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Plaza Gateway 2 (Today, 09:12)</Text>
                <Text style={styles.detailVal}>-₹240.00</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Highway NH-8 Toll (Yesterday, 14:30)</Text>
                <Text style={styles.detailVal}>-₹180.00</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>City Border Point (July 19, 11:22)</Text>
                <Text style={styles.detailVal}>-₹120.00</Text>
              </View>
            </View>
          </View>
        );

      case 'rto_locker':
        return (
          <View style={styles.contentCard}>
            <Text style={[theme.typography.labelCaps, styles.cardLabel]}>RTO OFFICIAL DOCUMENTATION</Text>

            <View style={styles.docList}>
              <View style={styles.docRow}>
                <View style={styles.docIconBox}>
                  <MaterialIcons name="verified-user" size={18} color="#10b981" />
                </View>
                <View style={styles.docInfo}>
                  <Text style={styles.docTitle}>Registration Certificate (RC)</Text>
                  <Text style={styles.docDate}>Expires: Sep 2029</Text>
                </View>
                <Text style={styles.docStatusActive}>VALID</Text>
              </View>

              <View style={styles.docRow}>
                <View style={styles.docIconBox}>
                  <MaterialIcons name="verified-user" size={18} color="#10b981" />
                </View>
                <View style={styles.docInfo}>
                  <Text style={styles.docTitle}>Vehicle Insurance Policy</Text>
                  <Text style={styles.docDate}>Expires: Dec 2026</Text>
                </View>
                <Text style={styles.docStatusActive}>VALID</Text>
              </View>

              <View style={styles.docRow}>
                <View style={styles.docIconBox}>
                  <MaterialIcons name="warning" size={18} color="#d97706" />
                </View>
                <View style={styles.docInfo}>
                  <Text style={styles.docTitle}>National Fitness Permit</Text>
                  <Text style={styles.docDate}>Expires: Next Week</Text>
                </View>
                <Text style={styles.docStatusWarning}>RENEW</Text>
              </View>
            </View>
          </View>
        );

      case 'driver_safety':
        return (
          <View style={styles.contentCard}>
            <Text style={[theme.typography.labelCaps, styles.cardLabel]}>SAFETY SCORE CARD</Text>

            {/* Score circle banner */}
            <View style={styles.safetyScoreBanner}>
              <Text style={styles.safetyScoreVal}>{driver.efficiencyScore}</Text>
              <Text style={[theme.typography.labelCaps, { color: theme.colors.onSurfaceVariant }]}>
                OVERALL SAFETY INDEX
              </Text>
            </View>

            <Text style={[theme.typography.labelCaps, styles.subSectionTitle]}>HARSH INCIDENT LOGS</Text>
            <View style={styles.detailsList}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Harsh Braking Events</Text>
                <Text style={styles.detailVal}>2 times (Last 7 days)</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Rapid Acceleration</Text>
                <Text style={styles.detailVal}>1 time (Last 7 days)</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Speed Violation Occurrences</Text>
                <Text style={styles.detailVal}>0 times</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Harsh Cornering Factor</Text>
                <Text style={styles.detailVal}>92 / 100</Text>
              </View>
            </View>
          </View>
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
  cardLabel: {
    color: theme.colors.onSurfaceVariant,
    marginBottom: 16,
  },
  detailsList: {
    gap: 12,
    marginTop: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: theme.colors.surfaceContainerLow,
  },
  detailLabel: {
    color: theme.colors.onSurfaceVariant,
    fontSize: 14,
  },
  detailVal: {
    color: theme.colors.onSurface,
    fontSize: 14,
    fontWeight: '600',
  },
  mockMapContainer: {
    height: 200,
    backgroundColor: theme.colors.surfaceContainerLow,
    borderRadius: theme.rounded.md,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    overflow: 'hidden',
    marginBottom: 16,
  },
  mockGrid: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#1c2424',
  },
  gridLine: {
    position: 'absolute',
    backgroundColor: '#2e3d3d',
    height: 1,
    width: 1,
  },
  mockRoutePath: {
    position: 'absolute',
    top: '30%',
    left: '25%',
    width: '45%',
    height: '35%',
    borderLeftWidth: 3,
    borderBottomWidth: 3,
    borderColor: theme.colors.primary,
  },
  mapMarker: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerStart: {
    top: '25%',
    left: '22%',
    backgroundColor: theme.colors.primary,
  },
  markerText: {
    color: '#000',
    fontSize: 10,
    fontWeight: 'bold',
  },
  markerEnd: {
    bottom: '25%',
    left: '67%',
    backgroundColor: '#10b981',
  },
  mapStatus: {
    padding: 10,
    backgroundColor: theme.colors.surface,
    color: theme.colors.onSurface,
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
  scannerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: theme.colors.surfaceContainerLow,
    padding: 12,
    borderRadius: theme.rounded.md,
    marginBottom: 16,
  },
  subSectionTitle: {
    color: theme.colors.onSurfaceVariant,
    marginTop: 16,
    marginBottom: 8,
  },
  troubleCodeCard: {
    backgroundColor: '#2c1e1d',
    borderRadius: theme.rounded.md,
    borderWidth: 1,
    borderColor: theme.colors.error,
    padding: 12,
    marginBottom: 16,
  },
  codeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  codeText: {
    color: theme.colors.error,
    fontSize: 16,
    fontWeight: '700',
  },
  codeSeverity: {
    backgroundColor: 'rgba(250, 116, 111, 0.1)',
    color: theme.colors.error,
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },
  codeDesc: {
    color: theme.colors.onSurface,
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
  },
  codeAction: {
    color: theme.colors.onSurfaceVariant,
    fontSize: 12,
    marginTop: 4,
  },
  cleanStatusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
    borderWidth: 1,
    borderColor: '#10b981',
    padding: 12,
    borderRadius: theme.rounded.md,
    marginBottom: 16,
  },
  cleanStatusText: {
    color: '#10b981',
    fontSize: 13,
    fontWeight: '600',
  },
  fuelGaugeRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  fuelGaugeCard: {
    flex: 1,
    backgroundColor: theme.colors.surfaceContainerLow,
    borderRadius: theme.rounded.md,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    alignItems: 'center',
  },
  fuelPercentText: {
    fontSize: 22,
    color: theme.colors.primary,
    fontWeight: '700',
    marginBottom: 4,
  },
  anomalyCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: 'rgba(250, 116, 111, 0.08)',
    borderWidth: 1,
    borderColor: theme.colors.error,
    padding: 12,
    borderRadius: theme.rounded.md,
    marginBottom: 16,
  },
  anomalyTitle: {
    color: theme.colors.error,
    fontSize: 14,
    fontWeight: '700',
  },
  anomalyDesc: {
    color: theme.colors.onSurface,
    fontSize: 12,
    marginTop: 2,
  },
  balanceContainer: {
    backgroundColor: theme.colors.surfaceContainerLow,
    borderRadius: theme.rounded.md,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  balanceTitle: {
    color: theme.colors.onSurfaceVariant,
    fontSize: 12,
  },
  balanceValue: {
    color: theme.colors.onSurface,
    fontSize: 32,
    fontWeight: '700',
    marginTop: 4,
  },
  docList: {
    gap: 12,
  },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceContainerLow,
    borderRadius: theme.rounded.md,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    padding: 12,
  },
  docIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  docInfo: {
    flex: 1,
  },
  docTitle: {
    color: theme.colors.onSurface,
    fontSize: 13,
    fontWeight: '600',
  },
  docDate: {
    color: theme.colors.onSurfaceVariant,
    fontSize: 11,
    marginTop: 2,
  },
  docStatusActive: {
    color: '#10b981',
    fontWeight: '700',
    fontSize: 11,
  },
  docStatusWarning: {
    color: '#d97706',
    fontWeight: '700',
    fontSize: 11,
  },
  safetyScoreBanner: {
    backgroundColor: theme.colors.surfaceContainerLow,
    borderRadius: theme.rounded.md,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  safetyScoreVal: {
    fontSize: 48,
    fontWeight: '800',
    color: theme.colors.primary,
    marginBottom: 4,
  },
});

export default FeatureDetailScreen;
