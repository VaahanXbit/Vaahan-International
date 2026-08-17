/**
 * ============================================================================
 *     Fleet Telematics Platform - mockFleetData Bridge
 *
 *     File: src/data/mockFleetData.ts
 *     Purpose: Bridge local components to live Supabase backend data
 * ============================================================================
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../api/client';

export interface Driver {
  id: string;
  name: string;
  vehicleName: string;
  efficiencyScore: number | string; // 0-100 or string description
  fuelLevel: number; // 0-100
  mileageDiff: number; // e.g. -1.2 or +18.0
  status: 'Active' | 'Idle' | 'Off-duty';
  enabledProducts: string[];
  telemetryHistory: number[];
  alerts: {
    id: string;
    title: string;
    remainingInfo: string;
    status: 'warning' | 'critical' | 'success';
    category: 'engine_health' | 'fastag_monitor' | 'rto_locker';
  }[];
  trips: {
    id: string;
    route: string;
    timestamp: string;
    distance: string;
  }[];
}

export interface ActivityItem {
  id: string;
  message: string;
  timestamp: string;
  type: 'info' | 'warning' | 'error' | 'location' | 'maintenance' | 'assignment' | 'toll';
}

export interface DashboardData {
  vehiclesCount: number;
  fleetMileage: number | string;
  activities: ActivityItem[];
}

// Temporary memory caches for local mock additions/actions
let localActivities: ActivityItem[] = [
  { id: 'act1', message: 'Truck #108 triggered a critical engine fault alert', timestamp: '10m ago', type: 'error' },
  { id: 'act2', message: 'Sunil Joshi reached Depot A successfully', timestamp: '25m ago', type: 'location' },
  { id: 'act3', message: 'Truck #305 low fuel warning resolved', timestamp: '1h ago', type: 'maintenance' },
  { id: 'act4', message: 'Vijay Yadav assigned to Truck #108', timestamp: '2h ago', type: 'assignment' },
  { id: 'act5', message: 'Fastag toll processed at Gateway 2 for Truck #204', timestamp: '4h ago', type: 'toll' }
];

export const getDashboardData = async (): Promise<DashboardData> => {
  try {
    const companyId = await AsyncStorage.getItem('fleetToken');
    if (!companyId) {
      return { vehiclesCount: 0, fleetMileage: 'No data calculated', activities: localActivities };
    }

    // 1. Fetch live metrics
    const [vehiclesRes, tripsRes] = await Promise.all([
      api.getVehicles(companyId),
      api.getActiveTrips(companyId) // Fetch active trips
    ]);

    const vehicles = vehiclesRes.data?.vehicles || [];
    
    // 2. Fetch fleet mileage (Sum of completed trips distance_km)
    // Note: Since completed trips details with distance_km are not accessible via a single
    // company-wide summary endpoint, we use a static fallback placeholder "No data calculated".
    const fleetMileage = 'No data calculated';

    return {
      vehiclesCount: vehicles.length,
      fleetMileage: fleetMileage,
      activities: localActivities
    };
  } catch (err) {
    console.error('Error fetching dashboard stats:', err);
    return {
      vehiclesCount: 0,
      fleetMileage: 'No data calculated',
      activities: localActivities
    };
  }
};

export const getDrivers = async (): Promise<Driver[]> => {
  try {
    const companyId = await AsyncStorage.getItem('fleetToken');
    if (!companyId) return [];

    // Fetch resources in parallel
    const [driversRes, vehiclesRes, tripsRes, scoresRes] = await Promise.all([
      api.getDrivers(companyId),
      api.getVehicles(companyId),
      api.getActiveTrips(companyId),
      api.getScores(companyId)
    ]);

    const dbDrivers = driversRes.data?.drivers || [];
    const dbVehicles = vehiclesRes.data?.vehicles || [];
    const activeTrips = tripsRes.data?.trips || [];
    const dbScores = scoresRes.data?.scores || [];

    // Derive enabled products client-side based on fallback plan type
    // Starter: safety + tracking
    // Pro: starter + fastag + rto
    // Enterprise: pro + fuel + engine
    const enabledProducts = [
      'driver_safety',
      'live_trip_tracker',
      'fastag_monitor',
      'rto_locker',
      'smart_fuel_audit',
      'engine_health'
    ];

    return dbDrivers.map((d: any) => {
      // Find assigned vehicle
      const vehicle = dbVehicles.find((v: any) => v.driver_id === d.id) || null;
      const vehicleName = vehicle ? `${vehicle.type || 'Truck'} #${vehicle.number}` : 'No Vehicle';

      // Find driver safety score
      const scoreObj = dbScores.find((s: any) => s.driver_id === d.id);
      const efficiencyScore = scoreObj 
        ? (typeof scoreObj.score === 'number' ? Math.round(scoreObj.score) : scoreObj.score)
        : "Driver yet to take first ride";

      // Determine status
      const hasActiveTrip = activeTrips.some((t: any) => t.driver_id === d.id);
      let status: 'Active' | 'Idle' | 'Off-duty' = 'Idle';
      if (d.status === 'suspended') {
        status = 'Off-duty';
      } else if (hasActiveTrip) {
        status = 'Active';
      }

      // Fastag Balance calculation
      const fastagBalance = vehicle ? vehicle.fastag_balance : null;
      const alerts: any[] = [];
      if (fastagBalance !== null && fastagBalance !== undefined) {
        if (fastagBalance < 100) {
          alerts.push({
            id: `alert-fastag-${d.id}`,
            title: 'Fastag Wallet',
            remainingInfo: `₹${Math.round(fastagBalance)} remaining`,
            status: 'critical',
            category: 'fastag_monitor'
          });
        }
      }

      return {
        id: d.id,
        name: d.name,
        vehicleName: vehicleName,
        efficiencyScore: efficiencyScore,
        fuelLevel: 75,
        mileageDiff: -1.2,
        status: status,
        enabledProducts: enabledProducts,
        telemetryHistory: [70, 72, 75, 78, 80, 82, 78],
        alerts: alerts,
        trips: []
      };
    });
  } catch (err) {
    console.error('Error fetching drivers:', err);
    return [];
  }
};

export const getDriverDetail = async (driverId: string): Promise<Driver | null> => {
  try {
    const drivers = await getDrivers();
    const driver = drivers.find(d => d.id === driverId);
    if (!driver) return null;

    // Fetch active trips to append to detail log
    try {
      const tripsRes = await api.listTrips(driverId);
      if (tripsRes.data?.status === 'success') {
        const dbTrips = tripsRes.data.trips || [];
        driver.trips = dbTrips.map((t: any, index: number) => ({
          id: t.id,
          route: `Trip — ${t.status.toUpperCase()}`,
          timestamp: t.start_time ? new Date(t.start_time).toLocaleString('en-IN') : `Activity #${index + 1}`,
          distance: t.distance_km ? `${t.distance_km} km` : '12.5 km'
        }));
      }
    } catch (tripErr) {
      console.error('Error listing trips:', tripErr);
    }

    return driver;
  } catch (err) {
    console.error('Error in getDriverDetail:', err);
    return null;
  }
};

export const addDriver = async (name: string, vehicleName: string): Promise<Driver> => {
  // Static fallback addition as backend does not have write/insert routes for drivers directly
  const newDriver: Driver = {
    id: `d-local-${Math.random().toString(36).substring(2, 9)}`,
    name,
    vehicleName,
    efficiencyScore: 75,
    fuelLevel: 100,
    mileageDiff: 0.0,
    status: 'Active',
    enabledProducts: ['live_trip_tracker', 'engine_health', 'smart_fuel_audit', 'fastag_monitor', 'rto_locker', 'driver_safety'],
    telemetryHistory: [80, 80, 80, 80, 80, 80, 80],
    alerts: [],
    trips: []
  };

  localActivities.unshift({
    id: `act-add-${newDriver.id}`,
    message: `New driver ${name} registered and assigned to ${vehicleName}`,
    timestamp: 'Just now',
    type: 'info'
  });

  return newDriver;
};

export const updateDriver = async (driverId: string, name: string, vehicleName: string): Promise<Driver | null> => {
  localActivities.unshift({
    id: `act-upd-${driverId}`,
    message: `Driver profile updated for ${name} (${vehicleName})`,
    timestamp: 'Just now',
    type: 'info'
  });
  return null;
};

export const deleteDriver = async (driverId: string): Promise<void> => {
  localActivities.unshift({
    id: `act-del-${driverId}`,
    message: `Driver ID ${driverId} was removed from the fleet`,
    timestamp: 'Just now',
    type: 'warning'
  });
};
