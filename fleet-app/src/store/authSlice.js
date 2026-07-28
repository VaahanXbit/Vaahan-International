import { createSlice } from '@reduxjs/toolkit';

const authSlice = createSlice({
  name: 'auth',
  initialState: { token: null, user: null, isLoggedIn: false, loading: false },
  reducers: {
    setToken: (state, action) => { state.token = action.payload; state.isLoggedIn = true; },
    setUser: (state, action) => { state.user = action.payload; },
    setLoading: (state, action) => { state.loading = action.payload; },
    logout: (state) => { state.token = null; state.user = null; state.isLoggedIn = false; },
  },
});

export const { setToken, setUser, setLoading, logout } = authSlice.actions;
export default authSlice.reducer;
