/**
 * ============================================================================
 *     Redux Store - Auth Slice
 *
 *     File: src/store/authSlice.js
 *     Purpose: Authentication state management
 *     Actions:
 *         - setToken: Store JWT token
 *         - setUser: Store user information
 *         - logout: Clear all auth data
 * ============================================================================
 */

import { createSlice } from '@reduxjs/toolkit';

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    token: null,
    user: null,
    isLoggedIn: false,
    loading: false,
    error: null,
  },
  reducers: {
    setToken: (state, action) => {
      state.token = action.payload;
      state.isLoggedIn = true;
    },
    setUser: (state, action) => {
      state.user = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    logout: (state) => {
      state.token = null;
      state.user = null;
      state.isLoggedIn = false;
      state.error = null;
    },
  },
});

export const { setToken, setUser, setLoading, setError, logout } = authSlice.actions;
export default authSlice.reducer;
