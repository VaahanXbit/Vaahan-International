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

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://vaahan-international-1-yro3.onrender.com/api/v1';

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
};

export default client;
