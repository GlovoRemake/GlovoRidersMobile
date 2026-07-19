import * as SecureStore from 'expo-secure-store';

export const saveSecureStore = (key: string, value: string) => {
    SecureStore.setItem(key, value);
};

export function getSecureStore(key: string) {
    return SecureStore.getItem(key);
};

export function deleteSecureStore(key: string) {
    SecureStore.deleteItemAsync(key);
};