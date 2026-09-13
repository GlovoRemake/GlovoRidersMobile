'use client';

import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { saveSecureStore, deleteSecureStore } from "@/utils/secureStore";
import { RootState } from "../index";

interface AuthState {
    accessToken: string | null;
}

const ACCESS_TOKEN_EXPIRED_MIN = 15;
const TOKEN_EXPIRES_DAYS = 7;

const initialState: AuthState = {
    accessToken: null,
};

const authSlice = createSlice({
    name: "auth",
    initialState,

    reducers: {
        setAccessToken: (state, action: PayloadAction<string>) => {
            state.accessToken = action.payload;

            saveSecureStore("accessToken", state.accessToken);
        },

        hydrateToken: (
            state,
            action: PayloadAction<string | null>
        ) => {
            state.accessToken = action.payload;
        },

        setRefreshToken: (
            _state,
            action: PayloadAction<string>
        ) => {
            saveSecureStore("refreshToken", action.payload);
        },

        logout: (state) => {
            deleteSecureStore("accessToken");
            deleteSecureStore("refreshToken");

            state.accessToken = null;
        },
    },
});

export const selectIsAuthenticated = (state: RootState) =>
    Boolean(state.auth.accessToken);

export const selectAccessToken = (state: RootState) =>
    state.auth.accessToken;

export const {
    setAccessToken,
    hydrateToken,
    setRefreshToken,
    logout,
} = authSlice.actions;

export default authSlice.reducer;