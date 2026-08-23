import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import theme from '../theme';

interface Props {
  title: string;
  message: string;
}

export const NotTrackedFeature: React.FC<Props> = ({ title, message }) => {
  return (
    <View style={styles.contentCard}>
      <Text style={[theme.typography.labelCaps, styles.cardLabel]}>{title}</Text>
      <View style={styles.cleanStatusBox}>
        <MaterialIcons name="info-outline" size={24} color={theme.colors.onSurfaceVariant} />
        <Text style={[styles.cleanStatusText, { color: theme.colors.onSurfaceVariant }]}>
          {message}
        </Text>
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
  cleanStatusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    padding: 12,
    borderRadius: theme.rounded.md,
    marginBottom: 16,
  },
  cleanStatusText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
});
