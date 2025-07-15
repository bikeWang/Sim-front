import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface UserState {
  username: string;
  isLoggedIn: boolean;
}

const initialState: UserState = {
  username: '',
  isLoggedIn: false,
};

export const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    login: (state, action: PayloadAction<string>) => {
      state.isLoggedIn = true;
      state.username = action.payload;
    },
    logout: (state) => {
      state.isLoggedIn = false;
      state.username = '';
    },
  },
});

export const { login, logout } = userSlice.actions;
export default userSlice.reducer;