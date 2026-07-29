// TODO(backend): Replace this entire module with real API calls to the
// FastAPI backend once available. Function signatures below should stay
// stable so screens don't need changes.

export interface Driver {
  id: string;
  name: string;
  vehicleName: string;
  efficiencyScore: number; // 0-100
  fuelLevel: number; // 0-100
  mileageDiff: number; // e.g. -1.2 or +18.0
  status: 'Active' | 'Idle' | 'Off-duty';
  enabledProducts: string[]; // e.g. ['engine_health', 'driver_safety']
  telemetryHistory: number[]; // 7 numbers for 7-day chart
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
  fleetMileage: number;
  activities: ActivityItem[];
}

// Initial seed mock data
let mockDrivers: Driver[] = [
  {
    id: 'd1',
    name: 'John Doe',
    vehicleName: 'Truck #204',
    efficiencyScore: 82, // Green (>75)
    fuelLevel: 78,
    mileageDiff: -1.2,
    status: 'Active',
    enabledProducts: ['live_trip_tracker', 'engine_health', 'smart_fuel_audit', 'fastag_monitor', 'rto_locker', 'driver_safety'],
    telemetryHistory: [70, 72, 75, 78, 80, 82, 78],
    alerts: [
      { id: 'a1', title: 'Permit Renewal Required', remainingInfo: 'Expiring in 5 days', status: 'warning', category: 'rto_locker' },
      { id: 'a2', title: 'Low Brake Fluid', remainingInfo: 'Action needed soon', status: 'warning', category: 'engine_health' }
    ],
    trips: [
      { id: 't1', route: 'Depot A to Port Terminal', timestamp: 'Today, 08:42', distance: '14.2 mi' },
      { id: 't2', route: 'Port Terminal to Depot B', timestamp: 'Yesterday, 16:15', distance: '12.4 mi' }
    ]
  },
  {
    id: 'd2',
    name: 'Jane Smith',
    vehicleName: 'Truck #108',
    efficiencyScore: 45, // Red (<50)
    fuelLevel: 12,
    mileageDiff: 18.0,
    status: 'Idle',
    enabledProducts: ['live_trip_tracker', 'engine_health', 'driver_safety'],
    telemetryHistory: [20, 18, 15, 12, 10, 12, 12],
    alerts: [
      { id: 'a3', title: 'Critical Engine Fault', remainingInfo: 'DTC Code P0300', status: 'critical', category: 'engine_health' },
      { id: 'a4', title: 'Fastag Balance Low', remainingInfo: '₹120 remaining', status: 'warning', category: 'fastag_monitor' }
    ],
    trips: [
      { id: 't3', route: 'Warehouse A to Highway 9', timestamp: 'Today, 10:15', distance: '32.4 mi' }
    ]
  },
  {
    id: 'd3',
    name: 'Robert Johnson',
    vehicleName: 'Truck #305',
    efficiencyScore: 68, // Amber (50-75)
    fuelLevel: 55,
    mileageDiff: 2.5,
    status: 'Off-duty',
    enabledProducts: ['smart_fuel_audit', 'rto_locker', 'driver_safety'],
    telemetryHistory: [60, 58, 55, 52, 55, 57, 55],
    alerts: [
      { id: 'a5', title: 'Scheduled Maintenance', remainingInfo: 'Due in 3 days', status: 'warning', category: 'engine_health' }
    ],
    trips: [
      { id: 't4', route: 'Depot B to City Center', timestamp: 'Today, 11:30', distance: '18.7 mi' }
    ]
  }
];

let mockActivities: ActivityItem[] = [
  { id: 'act1', message: 'Truck #108 triggered a critical engine fault alert', timestamp: '10m ago', type: 'error' },
  { id: 'act2', message: 'John Doe reached Depot A successfully', timestamp: '25m ago', type: 'location' },
  { id: 'act3', message: 'Truck #305 low fuel warning resolved', timestamp: '1h ago', type: 'maintenance' },
  { id: 'act4', message: 'Jane Smith assigned to Truck #108', timestamp: '2h ago', type: 'assignment' },
  { id: 'act5', message: 'Fastag toll processed at Gateway 2 for Truck #204', timestamp: '4h ago', type: 'toll' }
];

export const getDashboardData = async (): Promise<DashboardData> => {
  return {
    vehiclesCount: mockDrivers.length,
    fleetMileage: 124802,
    activities: mockActivities
  };
};

export const getDrivers = async (): Promise<Driver[]> => {
  return [...mockDrivers];
};

export const getDriverDetail = async (driverId: string): Promise<Driver | null> => {
  const driver = mockDrivers.find(d => d.id === driverId);
  return driver ? { ...driver } : null;
};

export const addDriver = async (name: string, vehicleName: string): Promise<Driver> => {
  // Generate random stats for new driver
  const newDriver: Driver = {
    id: `d${mockDrivers.length + 1}`,
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

  mockDrivers.push(newDriver);

  // Add event to activities
  mockActivities.unshift({
    id: `act${mockActivities.length + 1}`,
    message: `New driver ${name} registered and assigned to ${vehicleName}`,
    timestamp: 'Just now',
    type: 'info'
  });

  return newDriver;
};

export const updateDriver = async (driverId: string, name: string, vehicleName: string): Promise<Driver | null> => {
  const driverIdx = mockDrivers.findIndex(d => d.id === driverId);
  if (driverIdx === -1) return null;

  mockDrivers[driverIdx] = {
    ...mockDrivers[driverIdx],
    name,
    vehicleName
  };

  mockActivities.unshift({
    id: `act${mockActivities.length + 1}`,
    message: `Driver profile updated for ${name} (${vehicleName})`,
    timestamp: 'Just now',
    type: 'info'
  });

  return mockDrivers[driverIdx];
};

export const deleteDriver = async (driverId: string): Promise<void> => {
  const driver = mockDrivers.find(d => d.id === driverId);
  if (!driver) return;

  mockDrivers = mockDrivers.filter(d => d.id !== driverId);

  mockActivities.unshift({
    id: `act${mockActivities.length + 1}`,
    message: `Driver ${driver.name} was removed from the fleet`,
    timestamp: 'Just now',
    type: 'warning'
  });
};

