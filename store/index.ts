import { configureStore } from "@reduxjs/toolkit";
import { type TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import {apiAccount} from "@/store/service/apiAccount"
import authSlice from "@/store/slices/authSlice";

export const store = configureStore({
    reducer: {
        [apiAccount.reducerPath]: apiAccount.reducer,
        auth: authSlice,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(apiAccount.middleware)
});

// Типи, які знаходяться у Redux
export type RootState = ReturnType<typeof store.getState>;
// Метод, який дає команди для reducer - залогінь, вийди із акаунта
export type AppDispatch = typeof store.dispatch;

// виклик різних методів із глобального стора
export const useAppDispatch = () => useDispatch<AppDispatch>();

// Отримуємо дані із глобального стора на основі типів, які там є
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;