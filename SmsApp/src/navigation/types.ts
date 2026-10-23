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

// ── Teacher tab bar ───────────────────────────────────────────────
export type TeacherTabParams = {
  Dashboard: undefined;
  MarkAttendance: { sectionId?: number } | undefined;
  Notices: undefined;
  Exams: undefined;
  Profile: undefined;
};

// ── Teacher stack (wraps teacher tabs + pushed screens) ───────────
export type TeacherStackParams = {
  TeacherTabs: undefined;
  Homework: undefined;
  Classwork: undefined;
  Students: undefined;
  StudentCard: { studentId: number };
  Timetable: undefined;
  Submissions: undefined;
  LessonPlans: undefined;
  Inbox: undefined;
  Circulars: undefined;
};

// ── Admin tabs + stack ────────────────────────────────────────────
export type AdminTabParams = {
  Home: undefined;
  Students: undefined;
  Fees: undefined;
  Broadcast: undefined;
  Profile: undefined;
};

export type AdminStackParams = {
  AdminTabs: undefined;
  StudentDetail: { studentId: number };
  StudentLifecycle: { studentId: number };
  AdmissionWizard: undefined;
  Teachers: undefined;
  TeacherForm: undefined;
  TeacherAssignments: { teacherId: number };
  Classes: undefined;
  Subjects: undefined;
  FeeTemplates: undefined;
  Library: undefined;
  Attendance: undefined;
  Circulars: undefined;
  Events: undefined;
};

// ── Finance (ACCOUNTANT) tabs ─────────────────────────────────────
export type FinanceTabParams = {
  Fees: undefined;
  Payments: undefined;
  Reconciliation: undefined;
  Gateway: undefined;
  Profile: undefined;
};

// ── Transport (TRANSPORT_MANAGER) tabs ────────────────────────────
export type TransportTabParams = {
  Students: undefined;
  Routes: undefined;
  Profile: undefined;
};

// ── Support staff tabs + stack ────────────────────────────────────
export type SupportTabParams = {
  Home: undefined;
  Students: undefined;
  Broadcast: undefined;
  Profile: undefined;
};
export type SupportStackParams = {
  SupportTabs: undefined;
  StudentDetail: { studentId: number };
  Teachers: undefined;
  TeacherForm: undefined;
  Classes: undefined;
  Subjects: undefined;
  Circulars: undefined;
  Events: undefined;
};

// ── Student tabs + stack ──────────────────────────────────────────
export type StudentTabParams = {
  Home: undefined;
  Attendance: undefined;
  Fees: undefined;
  Updates: undefined;
  Profile: undefined;
};

export type StudentStackParams = {
  StudentTabs: undefined;
  StudentResults: undefined;
  StudentAssignments: undefined;
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
  ChildTeachers: undefined;
  ChildAnnouncements: undefined;
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
