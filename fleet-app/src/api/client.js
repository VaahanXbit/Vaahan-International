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

const API_BASE_URL ='http://10.15.251.49:8001/api/v1';

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

// Request interceptor
client.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('fleetToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
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
  loginCompany: (email) => client.post(`/auth/login-company?email=${encodeURIComponent(email)}`),
  registerCompany: (name, email, phone, city, gst) => 
    client.post(`/auth/register-company?name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}&phone=${encodeURIComponent(phone)}&city=${encodeURIComponent(city)}&gst_number=${encodeURIComponent(gst)}`),
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
