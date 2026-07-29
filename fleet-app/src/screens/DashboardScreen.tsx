import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import theme from '../theme';
import { getDashboardData, DashboardData } from '../data/mockFleetData';
import { Sidebar } from '../components/Sidebar';
import { AddDriverModal } from '../components/AddDriverModal';
import { MaterialIcons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logout } from '../store/authSlice';
import { api } from '../api/client';

type Props = NativeStackScreenProps<RootStackParamList, 'Dashboard'>;

export const DashboardScreen: React.FC<Props> = ({ navigation }) => {
  const dispatch = useDispatch();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const companyId = useSelector((state: any) => state.auth.user?.companyId);

  useEffect(() => {
    if (!companyId) return;

    Promise.all([
      api.getDashboard(companyId),
      getDashboardData()
    ]).then(([liveRes, mockData]) => {
      if (liveRes.data?.status === 'success') {
        setDashboardData({
          vehiclesCount: liveRes.data.total_drivers, // Use driver count as proxy
          fleetMileage: mockData.fleetMileage,
          activities: mockData.activities
        });
      } else {
        setDashboardData(mockData);
      }
    }).catch(err => {
      console.error('Error fetching live dashboard stats:', err);
      getDashboardData().then(setDashboardData);
    });
  }, [refreshTrigger, companyId]);

  const handleSelectDriver = (driverId: string) => {
    navigation.navigate('DriverDetail', { driverId });
  };

  const handleNotificationPress = () => {
    console.log('Notifications stub triggered');
  };

  const handleLogoutPress = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log out',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('fleetToken');
              await AsyncStorage.removeItem('fleetUser');
              dispatch(logout());
            } catch (e) {
              console.error('Error during local auth logout:', e);
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />

      {/* Custom Top App Bar */}
      <View style={styles.appBar}>
        <TouchableOpacity
          style={styles.appBarButton}
          onPress={() => setSidebarOpen(true)}
          activeOpacity={0.7}
        >
          <MaterialIcons name="menu" size={24} color={theme.colors.onSurface} />
        </TouchableOpacity>

        <Text style={[theme.typography.headlineMd, styles.appBarTitle]}>
          FLEET OPS
        </Text>

        <View style={styles.rightActions}>
          {/* TODO(backend): Wire to real notifications endpoint once available. */}
          <TouchableOpacity
            style={styles.appBarButton}
            onPress={handleNotificationPress}
            activeOpacity={0.7}
          >
            <MaterialIcons name="notifications-none" size={24} color={theme.colors.onSurface} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.appBarButton}
            onPress={handleLogoutPress}
            activeOpacity={0.7}
          >
            <MaterialIcons name="logout" size={22} color={theme.colors.error} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Vehicles header line */}
        <Text style={[theme.typography.headlineMd, styles.vehiclesHeading]}>
          {dashboardData?.vehiclesCount ?? '--'} vehicles in fleet
        </Text>

        {/* Full width Fleet Mileage card */}
        <View style={styles.statCardFull}>
          <Text style={[theme.typography.labelCaps, styles.statLabel]}>FLEET MILEAGE</Text>
          <Text style={styles.statValLarge}>
            {dashboardData ? dashboardData.fleetMileage.toLocaleString() : '--'}
          </Text>
          <Text style={[theme.typography.labelCaps, styles.statSubtext]}>
            +12% vs last month
          </Text>
        </View>

        {/* Recent Activity Section */}
        <View style={styles.sectionHeader}>
          <Text style={[theme.typography.labelCaps, styles.sectionTitle]}>RECENT ACTIVITY</Text>
        </View>

        <View style={styles.activityFeed}>
          {dashboardData?.activities.map(act => {
            let iconName = 'info-outline';
            let iconColor: string = theme.colors.primary;

            if (act.type === 'error') {
              iconName = 'error-outline';
              iconColor = theme.colors.error;
            } else if (act.type === 'warning') {
              iconName = 'warning-amber';
              iconColor = '#d97706';
            } else if (act.type === 'location') {
              iconName = 'place';
              iconColor = theme.colors.primary;
            } else if (act.type === 'maintenance') {
              iconName = 'build';
              iconColor = theme.colors.primary;
            } else if (act.type === 'assignment') {
              iconName = 'person';
              iconColor = theme.colors.primary;
            } else if (act.type === 'toll') {
              iconName = 'local-atm';
              iconColor = theme.colors.primary;
            }

            return (
              <View key={act.id} style={styles.activityItem}>
                <View style={[styles.activityIconBox, { backgroundColor: theme.colors.surfaceContainerLow }]}>
                  <MaterialIcons name={iconName as any} size={20} color={iconColor} />
                </View>
                <View style={styles.activityInfo}>
                  <Text style={[theme.typography.bodyMd, { color: theme.colors.onSurface }]}>
                    {act.message}
                  </Text>
                  <Text style={[theme.typography.labelCaps, { color: theme.colors.onSurfaceVariant, fontSize: 10, marginTop: 4 }]}>
                    {act.timestamp}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Slide-out Sidebar Drawer */}
      <Sidebar
        visible={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onSelectDriver={handleSelectDriver}
        onOpenAddDriver={() => setAddModalOpen(true)}
        driversUpdatedTrigger={refreshTrigger}
      />

      {/* Add New Driver Modal Form */}
      <AddDriverModal
        visible={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onDriverAdded={() => setRefreshTrigger(prev => prev + 1)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  appBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.gutter,
    borderBottomWidth: 1,
    borderColor: theme.colors.outlineVariant,
    backgroundColor: theme.colors.surface,
  },
  appBarButton: {
    padding: theme.spacing.unit,
  },
  appBarTitle: {
    fontWeight: '700',
    color: theme.colors.primary,
    letterSpacing: 0.5,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scrollContent: {
    padding: theme.spacing.margin,
  },
  vehiclesHeading: {
    color: theme.colors.onSurface,
    fontWeight: '700',
    marginBottom: 12,
  },
  statCardFull: {
    backgroundColor: theme.colors.surfaceContainer,
    borderRadius: theme.rounded.lg,
    padding: theme.spacing.gutter,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    marginBottom: theme.spacing.margin,
  },
  statLabel: {
    color: theme.colors.onSurfaceVariant,
    marginBottom: theme.spacing.unit * 2,
  },
  statValLarge: {
    color: theme.colors.onSurface,
    fontWeight: '700',
    fontSize: 36,
    marginBottom: 4,
  },
  statSubtext: {
    color: theme.colors.primary,
    fontSize: 11,
    fontWeight: '600',
  },
  sectionHeader: {
    marginBottom: theme.spacing.unit * 4,
  },
  sectionTitle: {
    color: theme.colors.onSurfaceVariant,
  },
  activityFeed: {
    backgroundColor: theme.colors.surfaceContainer,
    borderRadius: theme.rounded.lg,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    padding: theme.spacing.unit * 4,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.unit * 4,
    borderBottomWidth: 1,
    borderColor: theme.colors.surfaceContainerLow,
  },
  activityIconBox: {
    width: 36,
    height: 36,
    borderRadius: theme.rounded.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.unit * 4,
  },
  activityInfo: {
    flex: 1,
  },
});
export default DashboardScreen;
