import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import theme from '../theme';
import { Driver } from '../data/mockFleetData';

interface Props {
  driver: Driver;
}

export const DriverSafetyFeature: React.FC<Props> = ({ driver }) => {
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
  subSectionTitle: {
    color: theme.colors.onSurfaceVariant,
    marginTop: 16,
    marginBottom: 8,
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
