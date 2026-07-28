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

import authReducer, { setToken, setUser } from './src/store/authSlice';
import { LoginScreen } from './src/screens/LoginScreen';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { DriversScreen } from './src/screens/DriversScreen';
import { ScoresScreen } from './src/screens/ScoresScreen';
import { WalletsScreen } from './src/screens/WalletsScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';

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
 * App Stack - Tab-based navigation
 */
const AppStack = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName;
        if (route.name === 'Dashboard') iconName = focused ? 'stats-chart' : 'stats-chart-outline';
        else if (route.name === 'Drivers') iconName = focused ? 'people' : 'people-outline';
        else if (route.name === 'Scores') iconName = focused ? 'bar-chart' : 'bar-chart-outline';
        else if (route.name === 'Wallets') iconName = focused ? 'wallet' : 'wallet-outline';
        else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
        return <Ionicons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: '#007AFF',
      tabBarInactiveTintColor: '#999',
      headerStyle: { backgroundColor: '#007AFF' },
      headerTintColor: '#FFF',
    })}
  >
    <Tab.Screen name="Dashboard" component={DashboardScreen} />
    <Tab.Screen name="Drivers" component={DriversScreen} />
    <Tab.Screen name="Scores" component={ScoresScreen} />
    <Tab.Screen name="Wallets" component={WalletsScreen} />
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
      <RootNavigator />
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
