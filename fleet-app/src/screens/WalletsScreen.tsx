import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { api } from '../api/client';
import theme from '../theme';
import { MaterialIcons } from '@expo/vector-icons';

interface VehicleItem {
  id: string;
  number: string;
  fastag_id: string | null;
  fastag_balance: number;
}

export const WalletsScreen: React.FC = () => {
  const companyId = useSelector((state: any) => state.auth.user?.companyId);
  const [vehicles, setVehicles] = useState<VehicleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchWallets = async () => {
    if (!companyId) return;
    try {
      const response = await api.getVehicles(companyId);
      if (response.data?.status === 'success') {
        setVehicles(response.data.vehicles || []);
      }
    } catch (error) {
      console.error('Error fetching company vehicles/wallets:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWallets();
  }, [companyId]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchWallets();
  };

  const renderWalletCard = ({ item }: { item: VehicleItem }) => {
    const isLowBalance = item.fastag_balance < 1000;
    
    return (
      <View style={styles.walletCard}>
        <View style={[styles.iconContainer, { backgroundColor: isLowBalance ? 'rgba(250, 116, 111, 0.1)' : 'rgba(155, 208, 213, 0.1)' }]}>
          <MaterialIcons 
            name="local-atm" 
            size={24} 
            color={isLowBalance ? theme.colors.error : theme.colors.primary} 
          />
        </View>
        <View style={styles.infoCol}>
          <Text style={[theme.typography.bodyLg, styles.plateNumber]}>{item.number}</Text>
          <Text style={[theme.typography.bodyMd, styles.fastagId]}>
            ID: {item.fastag_id || 'NOT LINKED'}
          </Text>
        </View>
        <View style={styles.balanceCol}>
          <Text style={[theme.typography.bodyLg, styles.balanceText, isLowBalance && styles.lowBalanceText]}>
            ₹{item.fastag_balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
          <Text style={[theme.typography.labelCaps, styles.balanceLabel, isLowBalance && styles.lowBalanceLabel]}>
            {isLowBalance ? 'LOW BALANCE' : 'ACTIVE'}
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
        <Text style={[theme.typography.headlineMd, styles.headerTitle]}>FASTAG WALLETS</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[theme.typography.bodyMd, styles.loadingText]}>Loading wallets...</Text>
        </View>
      ) : (
        <FlatList
          data={vehicles}
          keyExtractor={(item) => item.id}
          renderItem={renderWalletCard}
          contentContainerStyle={styles.listContent}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialIcons name="account-balance-wallet" size={48} color={theme.colors.onSurfaceVariant} />
              <Text style={[theme.typography.bodyLg, styles.emptyText]}>No vehicle wallets found</Text>
              <Text style={[theme.typography.bodyMd, styles.emptySubtext]}>
                Add vehicles and link Fastags in your fleet dashboard to monitor balances.
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
  walletCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceContainer,
    borderRadius: theme.rounded.md,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoCol: {
    flex: 1,
    marginLeft: 16,
  },
  plateNumber: {
    color: theme.colors.onSurface,
    fontWeight: '600',
  },
  fastagId: {
    color: theme.colors.onSurfaceVariant,
    marginTop: 4,
  },
  balanceCol: {
    alignItems: 'flex-end',
  },
  balanceText: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
  lowBalanceText: {
    color: theme.colors.error,
  },
  balanceLabel: {
    color: theme.colors.primary,
    fontSize: 9,
    marginTop: 4,
    letterSpacing: 0.5,
  },
  lowBalanceLabel: {
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

export default WalletsScreen;
