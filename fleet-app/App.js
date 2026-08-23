/**
 * ============================================================================
 *     FLEET TELEMATICS PLATFORM - Fleet Owner Mobile Application
 *
 *     File: App.js
 *     Purpose: Main entry point for fleet owner application
 *     Description:
 *         - View all drivers and their scores
 *         - Manage FASTAG wallets
 *         - Track active trips
 *         - View analytics
 *
 *     Author: Team
 *     Version: 1.0.0
 * ============================================================================
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Provider, useSelector, useDispatch } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from '@expo/vector-icons/Ionicons';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import authReducer, { setToken, setUser } from './src/store/authSlice';
import { LoginScreen } from './src/screens/LoginScreen';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { DriverDetailScreen } from './src/screens/DriverDetailScreen';
import { FeatureDetailScreen } from './src/screens/FeatureDetailScreen';
import { TelemetryProvider } from './src/context/TelemetryContext';

// ============================================================================
// REDUX STORE
// ============================================================================

const store = configureStore({
  reducer: {
    auth: authReducer,
  },
});

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

/**
 * Auth Stack - Login screen
 */
const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
  </Stack.Navigator>
);

/**
 * Dashboard Tab Stack - Allows pushing details screens inside Dashboard tab
 */
const DashboardStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Dashboard" component={DashboardScreen} />
    <Stack.Screen name="DriverDetail" component={DriverDetailScreen} />
    <Stack.Screen name="FeatureDetail" component={FeatureDetailScreen} />
  </Stack.Navigator>
);

/**
 * App Stack - Tab-based navigation
 */
const AppStack = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarIcon: ({ focused, color, size }) => {
        let iconName;
        if (route.name === 'Dashboard') iconName = focused ? 'stats-chart' : 'stats-chart-outline';
        else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
        return <Ionicons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: '#9bd0d5',
      tabBarInactiveTintColor: '#a2adad',
      tabBarStyle: {
        backgroundColor: '#131b1b',
        borderTopColor: '#3f4a4a',
        borderTopWidth: 1,
        paddingTop: 4,
      },
    })}
  >
    <Tab.Screen name="Dashboard" component={DashboardStack} />
    <Tab.Screen name="Profile" component={ProfileScreen} />
  </Tab.Navigator>
);

// ============================================================================
// ROOT NAVIGATOR
// ============================================================================

const RootNavigator = () => {
  const dispatch = useDispatch();
  const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        const token = await AsyncStorage.getItem('fleetToken');
        const user = await AsyncStorage.getItem('fleetUser');
        
        if (token && user) {
          dispatch(setToken(token));
          dispatch(setUser(JSON.parse(user)));
        }
      } catch (e) {
        console.error('Error restoring session:', e);
      } finally {
        setIsLoading(false);
      }
    };

    bootstrapAsync();
  }, [dispatch]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {isLoggedIn ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
};

// ============================================================================
// MAIN APP
// ============================================================================

export default function App() {
  return (
    <Provider store={store}>
      <TelemetryProvider>
        <SafeAreaProvider>
          <RootNavigator />
        </SafeAreaProvider>
      </TelemetryProvider>
    </Provider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
