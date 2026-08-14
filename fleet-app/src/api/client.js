/**
 * ============================================================================
 *     API Client for Fleet Owner App
 *
 *     File: src/api/client.js
 *     Purpose: Axios HTTP client with JWT authentication
 * ============================================================================
 */

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

import Constants from 'expo-constants';
import { Platform } from 'react-native';

const getBaseURL = () => {
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }

  // Prioritize Android emulator loopback to bypass local firewall and LAN routing issues
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8001/api/v1';
  }
  
  // Expo Go / Dev server host IP detection
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
      return `http://${ip}:8001/api/v1`;
    }
  }
  
  return 'http://localhost:8001/api/v1';
};

const API_BASE_URL = getBaseURL();

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

// Request interceptor
client.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('fleetToken');
  if (token) {
    if (!config.headers) config.headers = {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('fleetToken');
    }
    return Promise.reject(error);
  }
);

export const api = {
  baseURL: API_BASE_URL,
  loginCompany: (email, password) => client.post(`/auth/login-company?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`),
  registerCompany: (name, email, phone, city, gst, password) => 
    client.post(`/auth/register-company?name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}&phone=${encodeURIComponent(phone)}&city=${encodeURIComponent(city)}&gst_number=${encodeURIComponent(gst)}&password=${encodeURIComponent(password)}`),
  updateCompany: (companyId, name, email, phone, gst) => 
    client.put(`/auth/update-company/${companyId}?name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}&phone=${encodeURIComponent(phone)}&gst_number=${encodeURIComponent(gst)}`),
  getDashboard: (companyId) => client.get(`/fleet/dashboard?company_id=${companyId}`),
  getDrivers: (companyId) => client.get(`/fleet/drivers?company_id=${companyId}`),
  getVehicles: (companyId) => client.get(`/fleet/vehicles?company_id=${companyId}`),
  getActiveTrips: (companyId) => client.get(`/fleet/active-trips?company_id=${companyId}`),
  getScores: (companyId) => client.get(`/fleet/scores?company_id=${companyId}`),
  listTrips: (driverId) => client.get(`/trips?driver_id=${driverId}`),
  getTrip: (tripId) => client.get(`/trips/${tripId}`),
  getCurrentUser: () => client.get('/auth/me'),
};

export default client;
