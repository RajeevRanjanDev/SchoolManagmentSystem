/**
 * Secure storage for sensitive data (tokens).
 * Uses react-native-encrypted-storage on device,
 * falls back to AsyncStorage for less-sensitive data.
 */
import EncryptedStorage from 'react-native-encrypted-storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  ACCESS_TOKEN: 'sms_access_token',
  REFRESH_TOKEN: 'sms_refresh_token',
  USER: 'sms_user',
  SELECTED_STUDENT: 'sms_selected_student',
} as const;

// ── Token storage (encrypted) ────────────────────────────────────

export const saveTokens = async (
  accessToken: string,
  refreshToken: string,
): Promise<void> => {
  await EncryptedStorage.setItem(KEYS.ACCESS_TOKEN, accessToken);
  await EncryptedStorage.setItem(KEYS.REFRESH_TOKEN, refreshToken);
};

export const getAccessToken = (): Promise<string | null> =>
  EncryptedStorage.getItem(KEYS.ACCESS_TOKEN);

export const getRefreshToken = (): Promise<string | null> =>
  EncryptedStorage.getItem(KEYS.REFRESH_TOKEN);

export const clearTokens = async (): Promise<void> => {
  await EncryptedStorage.removeItem(KEYS.ACCESS_TOKEN);
  await EncryptedStorage.removeItem(KEYS.REFRESH_TOKEN);
};

// ── User profile (AsyncStorage — not sensitive) ──────────────────

export const saveUser = async (user: object): Promise<void> => {
  await AsyncStorage.setItem(KEYS.USER, JSON.stringify(user));
};

export const getUser = async <T>(): Promise<T | null> => {
  const raw = await AsyncStorage.getItem(KEYS.USER);
  return raw ? (JSON.parse(raw) as T) : null;
};

export const clearUser = (): Promise<void> =>
  AsyncStorage.removeItem(KEYS.USER);

// ── Selected student ─────────────────────────────────────────────

export const saveSelectedStudent = async (studentId: number): Promise<void> => {
  await AsyncStorage.setItem(KEYS.SELECTED_STUDENT, String(studentId));
};

export const getSelectedStudentId = async (): Promise<number | null> => {
  const raw = await AsyncStorage.getItem(KEYS.SELECTED_STUDENT);
  return raw ? Number(raw) : null;
};

// ── Clear everything on logout ────────────────────────────────────

export const clearAllStorage = async (): Promise<void> => {
  await clearTokens();
  await clearUser();
  await AsyncStorage.removeItem(KEYS.SELECTED_STUDENT);
};
