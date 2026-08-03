/**
 * ============================================================================
 *     API Client for Driver App
 *
 *     File: src/api/client.js
 *     Purpose: Axios HTTP client with JWT authentication
 *     Features:
 *         - Automatic token injection
 *         - Error handling
 *         - Request/response interceptors
 * ============================================================================
 */

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import store from '../store';
import { logout } from '../store/authSlice';

import Constants from 'expo-constants';
import { Platform } from 'react-native';

const getBaseURL = () => {
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // Expo Go / Dev server host IP detection
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
      return `http://${ip}:8001/api/v1`;
    }
  }
  
  // High-reliability local network fallback using active interface IP
  return 'http://192.168.0.189:8001/api/v1';
};

const API_BASE_URL = getBaseURL();
console.log(`🔌 API Base URL resolved to: ${API_BASE_URL}`);

// ============================================================================
// CREATE AXIOS INSTANCE
// ============================================================================

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ============================================================================
// REQUEST INTERCEPTOR - ADD JWT TOKEN
// ============================================================================

client.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('driverToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('  Token added to request');
      }
    } catch (error) {
      console.error('Error getting token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ============================================================================
// RESPONSE INTERCEPTOR - HANDLE ERRORS
// ============================================================================

client.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    // Handle 401 Unauthorized - Token expired or invalid
    if (error.response?.status === 401) {
      console.warn('⚠️  Unauthorized - Token invalid or expired');
      
      // Clear auth data
      await AsyncStorage.removeItem('driverToken');
      await AsyncStorage.removeItem('driverUser');
      
      // Dispatch logout action
      store.dispatch(logout());
      
      // Redirect to login (handled by RootNavigator)
    }
    
    // Handle network errors
    if (!error.response) {
      console.error('❌ Network error:', error.message);
      return Promise.reject({
        message: 'Network error. Please check your connection.',
      });
    }
    
    return Promise.reject(error);
  }
);

export default client;
