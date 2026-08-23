import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import theme from '../theme';
import { Driver } from '../data/mockFleetData';

interface Props {
  driver: Driver;
}

export const FastagMonitorFeature: React.FC<Props> = ({ driver }) => {
  // Find fastag alert if present to display dynamic balance
  const fastagAlert = driver.alerts.find(a => a.category === 'fastag_monitor');
  const balanceText = fastagAlert ? fastagAlert.remainingInfo.replace(' remaining', '') : '₹4,850.00';
  const statusText = fastagAlert ? 'STATUS: CRITICAL / LOW BALANCE' : 'STATUS: ACTIVE / RECHARGED';
  const statusColor = fastagAlert ? theme.colors.error : '#10b981';

  return (
    <View style={styles.contentCard}>
      <Text style={[theme.typography.labelCaps, styles.cardLabel]}>FASTAG BALANCE & TOLL RECORDS</Text>

      <View style={styles.balanceContainer}>
        <Text style={styles.balanceTitle}>Current Wallet Balance</Text>
        <Text style={styles.balanceValue}>{balanceText}</Text>
        <Text style={[theme.typography.labelCaps, { color: statusColor, fontSize: 10, marginTop: 4 }]}>
          {statusText}
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
