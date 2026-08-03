import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import theme from '../theme';
import { Driver } from '../data/mockFleetData';

export interface GpsPoint {
  lat: number;
  lng: number;
  timestamp: string;
}

interface Props {
  driver: Driver;
  gpsPoints?: GpsPoint[];
}

export const LiveTripTrackerFeature: React.FC<Props> = ({ driver, gpsPoints = [] }) => {
  const hasGpsData = gpsPoints && gpsPoints.length > 0;

  return (
    <View style={styles.contentCard}>
      <Text style={[theme.typography.labelCaps, styles.cardLabel]}>GPS LIVE ROUTE TRACKING</Text>

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
          <Text style={styles.detailVal}>
            {hasGpsData ? 'Active Telemetry Stream' : 'No active route'}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Estimated Time</Text>
          <Text style={styles.detailVal}>
            {hasGpsData ? 'Calculating...' : 'N/A'}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
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
});
