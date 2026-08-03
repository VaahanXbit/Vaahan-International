import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import theme from '../theme';
import { Driver } from '../data/mockFleetData';

interface Props {
  driver: Driver;
}

export const RtoLockerFeature: React.FC<Props> = ({ driver }) => {
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
});
