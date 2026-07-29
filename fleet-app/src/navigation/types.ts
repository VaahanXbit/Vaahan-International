export type RootStackParamList = {
  Login: undefined;
  Dashboard: undefined;
  DriverDetail: { driverId: string };
  FeatureDetail: { feature: string; driverId: string };
};
