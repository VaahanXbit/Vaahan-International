/**
 * ============================================================================
 *     FLEET TELEMATICS PLATFORM - Driver Mobile Application
 *
 *     File: App.js
 *     Purpose: Main entry point for driver mobile application
 *     Description:
 *         - React Native application using Expo
 *         - Redux for state management
 *         - React Navigation for screen routing
 *         - Automatic GPS tracking during trips
 *         - Daily score visualization
 *         - FASTAG wallet management
 *
 *     Author: Team
 *     Version: 1.0.0
 *     Last Modified:  2026
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

// Import Redux reducers
import authReducer, { setToken, setUser } from './src/store/authSlice';

// Import screens
import { LoginScreen } from './src/screens/LoginScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { ScoreScreen } from './src/screens/ScoreScreen';
import { TripScreen } from './src/screens/TripScreen';
import { WalletScreen } from './src/screens/WalletScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';

// ============================================================================
// REDUX STORE CONFIGURATION
// ============================================================================

const store = configureStore({
  reducer: {
    auth: authReducer,
  },
});

// ============================================================================
// NAVIGATION STACKS
// ============================================================================

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

/**
 * Authentication Stack
 * Shown when user is not logged in
 */
const AuthStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      animationEnabled: true,
      cardStyle: { backgroundColor: '#F5F5F5' },
    }}
  >
    <Stack.Screen name="Login" component={LoginScreen} />
  </Stack.Navigator>
);

/**
 * Application Stack
 * Shown when user is logged in
 * Contains bottom tab navigation
 */
const AppStack = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      // Tab bar icon configuration
      tabBarIcon: ({ focused, color, size }) => {
        let iconName;

        if (route.name === 'Home') {
          iconName = focused ? 'home' : 'home-outline';
        } else if (route.name === 'Trip') {
          iconName = focused ? 'navigate' : 'navigate-outline';
        } else if (route.name === 'Score') {
          iconName = focused ? 'stats-chart' : 'stats-chart-outline';
        } else if (route.name === 'Wallet') {
          iconName = focused ? 'wallet' : 'wallet-outline';
        } else if (route.name === 'Profile') {
          iconName = focused ? 'person' : 'person-outline';
        }

        return <Ionicons name={iconName} size={size} color={color} />;
      },
      // Tab bar styling
      tabBarActiveTintColor: '#007AFF',
      tabBarInactiveTintColor: '#999',
      tabBarStyle: {
        backgroundColor: '#F5F5F5',
        borderTopColor: '#E0E0E0',
        borderTopWidth: 1,
      },
      // Header styling
      headerStyle: {
        backgroundColor: '#007AFF',
      },
      headerTintColor: '#FFF',
      headerTitleStyle: {
        fontWeight: 'bold',
      },
    })}
  >
    <Tab.Screen
      name="Home"
      component={HomeScreen}
      options={{
        title: 'Dashboard',
        tabBarLabel: 'Home',
      }}
    />
    <Tab.Screen
      name="Trip"
      component={TripScreen}
      options={{
        title: 'Active Trip',
        tabBarLabel: 'Trip',
      }}
    />
    <Tab.Screen
      name="Score"
      component={ScoreScreen}
      options={{
        title: 'My Score',
        tabBarLabel: 'Score',
      }}
    />
    <Tab.Screen
      name="Wallet"
      component={WalletScreen}
      options={{
        title: 'FASTAG Wallet',
        tabBarLabel: 'Wallet',
      }}
    />
    <Tab.Screen
      name="Profile"
      component={ProfileScreen}
      options={{
        title: 'Profile',
        tabBarLabel: 'Profile',
      }}
    />
  </Tab.Navigator>
);

// ============================================================================
// ROOT COMPONENT WITH AUTHENTICATION CHECK
// ============================================================================

const RootNavigator = () => {
  const dispatch = useDispatch();
  const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Check if user is already logged in on app startup
   * Restores session from AsyncStorage
   */
  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        // Restore token from storage
        const token = await AsyncStorage.getItem('driverToken');
        const user = await AsyncStorage.getItem('driverUser');

        if (token && user) {
          dispatch(setToken(token));
          dispatch(setUser(JSON.parse(user)));
          console.log('  User session restored');
        } else {
          console.log('ℹ️  No existing session found');
        }
      } catch (e) {
        // Ignore errors during restoration
        console.error('Error restoring session:', e);
      } finally {
        setIsLoading(false);
      }
    };

    bootstrapAsync();
  }, [dispatch]);

  // Show loading screen while checking session
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading...</Text>
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
// MAIN APP COMPONENT
// ============================================================================

export default function App() {
  return (
    <Provider store={store}>
      <RootNavigator />
    </Provider>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
});

/**
 * APP FEATURES:
 *
 * 1. HOME SCREEN
 *    - Welcome message
 *    - Today's score (if available)
 *    - Quick trip start button
 *    - Recent events
 *
 * 2. TRIP SCREEN
 *    - Start/stop trip
 *    - Real-time GPS tracking
 *    - Distance and duration
 *    - Event detection (harsh brakes, speeding)
 *    - Trip playback
 *
 * 3. SCORE SCREEN
 *    - Yesterday's score (main display)
 *    - Weekly average
 *    - Monthly trend chart
 *    - Event breakdown (brakes, speeding, corners)
 *    - Score history (30 days)
 *
 * 4. WALLET SCREEN
 *    - Current FASTAG balance
 *    - Top-up request (if fleet owner)
 *    - Transaction history
 *    - Auto-topup settings
 *
 * 5. PROFILE SCREEN
 *    - Driver information
 *    - Document upload (License, RC, Insurance)
 *    - Account settings
 *    - Logout button
 */
