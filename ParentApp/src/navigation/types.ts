import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

// ── Auth stack ────────────────────────────────────────────────────
export type AuthStackParams = {
  Login: undefined;
};

// ── Main tab bar ──────────────────────────────────────────────────
export type TabParams = {
  Dashboard: undefined;
  Attendance: undefined;
  Fees: undefined;
  Notifications: undefined;
  Profile: undefined;
};

// ── Root stack (wraps tabs + modal screens) ───────────────────────
export type RootStackParams = {
  Tabs: undefined;
  Homework: undefined;
  Classwork: undefined;
  Timetable: undefined;
  Circulars: undefined;
  EventGallery: undefined;
  Results: undefined;
  FeePayment: { feeIds: number[] };
  FeeHistory: undefined;
  BusTracking: { vehicleId?: number };
  Library: undefined;
  StudentDetail: { studentId: number };
};

// ── Convenience types for each screen ────────────────────────────
export type LoginScreenProps     = NativeStackScreenProps<AuthStackParams, 'Login'>;
export type DashboardScreenProps = BottomTabScreenProps<TabParams, 'Dashboard'>;
export type AttendanceScreenProps = BottomTabScreenProps<TabParams, 'Attendance'>;
export type FeesScreenProps      = BottomTabScreenProps<TabParams, 'Fees'>;
export type NotificationsScreenProps = BottomTabScreenProps<TabParams, 'Notifications'>;
export type ProfileScreenProps   = BottomTabScreenProps<TabParams, 'Profile'>;
export type FeePaymentScreenProps = NativeStackScreenProps<RootStackParams, 'FeePayment'>;
export type BusTrackingScreenProps = NativeStackScreenProps<RootStackParams, 'BusTracking'>;
