import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { AuthState, Profile } from './types';

const initialState: AuthState = {
  session: null,
  profile: null,
  status: 'loading',
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setSession: (state, action: PayloadAction<any | null>) => {
      state.session = action.payload;
      if (!action.payload) {
        state.profile = null;
        state.status = 'unauthenticated';
      }
    },
    setProfile: (state, action: PayloadAction<Profile | null>) => {
      state.profile = action.payload;
      state.status = action.payload ? 'authenticated' : 'unauthenticated';
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      if (action.payload) {
        state.status = 'loading';
      }
    }
  },
});

export const { setSession, setProfile, setLoading } = authSlice.actions;
export default authSlice.reducer;
