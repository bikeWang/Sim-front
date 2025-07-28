import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface UserState {
  id: number | null;
  username: string;
  isLoggedIn: boolean;
}

const initialState: UserState = {
  id: null,
  username: '',
  isLoggedIn: false,
};

export const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    login: (state, action: PayloadAction<{ id: number; username: string }>) => {
      state.isLoggedIn = true;
      state.id = action.payload.id;
      state.username = action.payload.username;
    },
    logout: (state) => {
      state.isLoggedIn = false;
      state.id = null;
      state.username = '';
    },
  },
});

export const { login, logout } = userSlice.actions;
export default userSlice.reducer;