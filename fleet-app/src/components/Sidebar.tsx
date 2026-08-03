import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import theme from '../theme';
import { getDrivers, Driver } from '../data/mockFleetData';

interface SidebarProps {
  visible: boolean;
  onClose: () => void;
  onSelectDriver: (driverId: string) => void;
  onOpenAddDriver: () => void;
  driversUpdatedTrigger?: number; // Counter to force re-fetch
}

const { width } = Dimensions.get('window');
const SIDEBAR_WIDTH = Math.min(width * 0.8, 320);

export const Sidebar: React.FC<SidebarProps> = ({
  visible,
  onClose,
  onSelectDriver,
  onOpenAddDriver,
  driversUpdatedTrigger = 0,
}) => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;

  useEffect(() => {
    getDrivers().then(setDrivers);
  }, [visible, driversUpdatedTrigger]);

  const [shouldRender, setShouldRender] = useState(visible);

  useEffect(() => {
    if (visible) {
      setShouldRender(true);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -SIDEBAR_WIDTH,
        duration: 250,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) {
          setShouldRender(false);
        }
      });
    }
  }, [visible]);

  if (!shouldRender) return null;

  return (
    <View style={styles.overlay}>
      {/* Tap outside to close */}
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onClose}
      />

      <Animated.View style={[styles.sidebar, { transform: [{ translateX: slideAnim }] }]}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <Text style={[theme.typography.headlineMd, { color: theme.colors.onSurface, fontWeight: '700' }]}>
              Fleet Drivers
            </Text>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
              <Text style={[theme.typography.bodyLg, { color: theme.colors.onSurfaceVariant }]}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollList} contentContainerStyle={styles.listContent}>
            {drivers.map(driver => {
              const statusStyle =
                driver.status === 'Active'
                  ? { bg: 'rgba(155, 208, 213, 0.1)', border: '#9bd0d5', text: '#9bd0d5' }
                  : driver.status === 'Idle'
                  ? { bg: 'rgba(217, 119, 6, 0.1)', border: '#d97706', text: '#d97706' }
                  : { bg: 'rgba(108, 119, 120, 0.1)', border: '#6c7778', text: '#dce8e8' };

              return (
                <TouchableOpacity
                  key={driver.id}
                  style={styles.driverRow}
                  onPress={() => {
                    onSelectDriver(driver.id);
                    onClose();
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.avatar}>
                    <Text style={[theme.typography.labelCaps, { color: theme.colors.onPrimary }]}>
                      {driver.name.charAt(0)}
                    </Text>
                  </View>
                  <View style={styles.driverInfo}>
                    <Text style={[theme.typography.bodyLg, { color: theme.colors.onSurface, fontWeight: '600' }]}>
                      {driver.name}
                    </Text>
                    <Text style={[theme.typography.labelCaps, { color: theme.colors.onSurfaceVariant, fontSize: 10, marginTop: 2 }]}>
                      {driver.vehicleName}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg, borderColor: statusStyle.border }]}>
                    <Text style={[styles.statusBadgeText, { color: statusStyle.text }]}>
                      {driver.status.toUpperCase()}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.addButton}
              onPress={onOpenAddDriver}
              activeOpacity={0.8}
            >
              <Text style={[theme.typography.labelCaps, { color: theme.colors.onPrimary, fontSize: 12 }]}>
                + Add New Driver
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 999,
    flexDirection: 'row',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  sidebar: {
    width: SIDEBAR_WIDTH,
    height: '100%',
    backgroundColor: theme.colors.surfaceContainer,
    borderRightWidth: 1,
    borderColor: theme.colors.outlineVariant,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.gutter,
    borderBottomWidth: 1,
    borderColor: theme.colors.outlineVariant,
  },
  scrollList: {
    flex: 1,
  },
  listContent: {
    padding: theme.spacing.unit * 3,
  },
  driverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.unit * 3,
    borderBottomWidth: 1,
    borderColor: theme.colors.surfaceContainerLow,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: theme.rounded.full,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.unit * 4,
  },
  driverInfo: {
    flex: 1,
  },
  statusBadge: {
    borderWidth: 1,
    borderRadius: theme.rounded.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  footer: {
    padding: theme.spacing.gutter,
    borderTopWidth: 1,
    borderColor: theme.colors.outlineVariant,
  },
  addButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.rounded.DEFAULT,
    paddingVertical: theme.spacing.unit * 3,
    alignItems: 'center',
  },
});
export default Sidebar;
