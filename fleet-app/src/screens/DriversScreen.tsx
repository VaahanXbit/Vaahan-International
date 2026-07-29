import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { api } from '../api/client';
import theme from '../theme';
import { MaterialIcons } from '@expo/vector-icons';

interface DriverItem {
  id: string;
  name: string;
  phone: string;
  status: string;
}

export const DriversScreen: React.FC = () => {
  const companyId = useSelector((state: any) => state.auth.user?.companyId);
  const [drivers, setDrivers] = useState<DriverItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDrivers = async () => {
    if (!companyId) return;
    try {
      const response = await api.getDrivers(companyId);
      if (response.data?.status === 'success') {
        setDrivers(response.data.drivers || []);
      }
    } catch (error) {
      console.error('Error fetching company drivers:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, [companyId]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDrivers();
  };

  const getInitials = (name: string) => {
    if (!name) return 'D';
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const renderDriverCard = ({ item }: { item: DriverItem }) => {
    const status = item.status || 'active';
    const isInactive = status === 'suspended' || status === 'inactive' || status === 'deleted';
    
    return (
      <View style={styles.driverCard}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>{getInitials(item.name)}</Text>
        </View>
        <View style={styles.driverInfo}>
          <Text style={[theme.typography.bodyLg, styles.driverName]}>{item.name}</Text>
          <View style={styles.phoneRow}>
            <MaterialIcons name="phone" size={14} color={theme.colors.onSurfaceVariant} />
            <Text style={[theme.typography.bodyMd, styles.driverPhone]}>{item.phone}</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, isInactive && styles.statusBadgeInactive]}>
          <Text style={[styles.statusText, isInactive && styles.statusTextInactive]}>
            {status.toUpperCase()}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={[theme.typography.headlineMd, styles.headerTitle]}>FLEET DRIVERS</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[theme.typography.bodyMd, styles.loadingText]}>Loading drivers...</Text>
        </View>
      ) : (
        <FlatList
          data={drivers}
          keyExtractor={(item) => item.id}
          renderItem={renderDriverCard}
          contentContainerStyle={styles.listContent}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialIcons name="people-outline" size={48} color={theme.colors.onSurfaceVariant} />
              <Text style={[theme.typography.bodyLg, styles.emptyText]}>No registered drivers found</Text>
              <Text style={[theme.typography.bodyMd, styles.emptySubtext]}>
                Invite drivers from the login page or using the dashboard command.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    height: 56,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.gutter,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outlineVariant,
    backgroundColor: theme.colors.surfaceContainerLow,
  },
  headerTitle: {
    color: theme.colors.primary,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: theme.colors.onSurfaceVariant,
    marginTop: 12,
  },
  listContent: {
    padding: theme.spacing.gutter,
  },
  driverCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceContainer,
    borderRadius: theme.rounded.md,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.surfaceContainerHighest,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  avatarText: {
    color: theme.colors.primary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  driverInfo: {
    flex: 1,
    marginLeft: 16,
  },
  driverName: {
    color: theme.colors.onSurface,
    fontWeight: '600',
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  driverPhone: {
    color: theme.colors.onSurfaceVariant,
    marginLeft: 6,
  },
  statusBadge: {
    backgroundColor: 'rgba(155, 208, 213, 0.1)',
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderRadius: theme.rounded.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusBadgeInactive: {
    backgroundColor: 'rgba(250, 116, 111, 0.1)',
    borderColor: theme.colors.error,
  },
  statusText: {
    color: theme.colors.primary,
    fontSize: 10,
    fontWeight: 'bold',
  },
  statusTextInactive: {
    color: theme.colors.error,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    color: theme.colors.onSurface,
    fontWeight: 'bold',
    marginTop: 16,
  },
  emptySubtext: {
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 32,
  },
});

export default DriversScreen;
