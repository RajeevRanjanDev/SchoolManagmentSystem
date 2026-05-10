import * as Keychain from 'react-native-keychain';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants';
import type { AuthUser } from '../types';

// Access token stored securely in Keychain
// User data stored in AsyncStorage (non-sensitive)

export const storage = {
  setAccessToken: async (token: string): Promise<void> => {
    await Keychain.setGenericPassword(STORAGE_KEYS.ACCESS_TOKEN, token, {
      service: STORAGE_KEYS.ACCESS_TOKEN,
    });
  },

  getAccessToken: async (): Promise<string | null> => {
    try {
      const creds = await Keychain.getGenericPassword({
        service: STORAGE_KEYS.ACCESS_TOKEN,
      });
      return creds ? creds.password : null;
    } catch {
      return null;
    }
  },

  setRefreshToken: async (token: string): Promise<void> => {
    await Keychain.setGenericPassword(STORAGE_KEYS.REFRESH_TOKEN, token, {
      service: STORAGE_KEYS.REFRESH_TOKEN,
    });
  },

  getRefreshToken: async (): Promise<string | null> => {
    try {
      const creds = await Keychain.getGenericPassword({
        service: STORAGE_KEYS.REFRESH_TOKEN,
      });
      return creds ? creds.password : null;
    } catch {
      return null;
    }
  },

  setUserData: async (user: AuthUser): Promise<void> => {
    await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
  },

  getUserData: async (): Promise<AuthUser | null> => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
      return data ? (JSON.parse(data) as AuthUser) : null;
    } catch {
      return null;
    }
  },

  clearAll: async (): Promise<void> => {
    await Promise.allSettled([
      Keychain.resetGenericPassword({ service: STORAGE_KEYS.ACCESS_TOKEN }),
      Keychain.resetGenericPassword({ service: STORAGE_KEYS.REFRESH_TOKEN }),
      AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA),
    ]);
  },
};
