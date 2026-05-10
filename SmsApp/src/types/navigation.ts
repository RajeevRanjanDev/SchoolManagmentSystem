import type { StackNavigationProp } from '@react-navigation/stack';
import type { RouteProp } from '@react-navigation/native';
import type { DrawerNavigationProp } from '@react-navigation/drawer';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

// ─── Auth Stack ───────────────────────────────────────────────────────────────

export type AuthStackParamList = {
  Splash: undefined;
  Login: undefined;
};

// ─── Admin Drawer ─────────────────────────────────────────────────────────────

export type AdminDrawerParamList = {
  AdminHome: undefined;
  StudentManagement: undefined;
  StudentDetail: { studentId: number };
  AddStudent: undefined;
  TeacherManagement: undefined;
  ParentManagement: undefined;
  SchoolSetup: undefined;
  FeeManagement: undefined;
  TimetableManagement: undefined;
  LibraryManagement: undefined;
  BusTracking: undefined;
  RouteManagement: undefined;
  EventManagement: undefined;
  CircularManagement: undefined;
  Reports: undefined;
  Notifications: undefined;
  Profile: undefined;
};

// ─── Teacher Stack ────────────────────────────────────────────────────────────

export type TeacherTabParamList = {
  TeacherDashboard: undefined;
  Attendance: undefined;
  Homework: undefined;
  Timetable: undefined;
  TeacherProfile: undefined;
};

export type TeacherStackParamList = {
  TeacherTabs: undefined;
  ResultUpload: { examId?: number; sectionId?: number };
  Classwork: undefined;
  CircularManagement: undefined;
  EventManagement: undefined;
  Notifications: undefined;
};

// ─── Accountant Stack ─────────────────────────────────────────────────────────

export type AccountantTabParamList = {
  AccountantDashboard: undefined;
  FeeManagement: undefined;
  Reports: undefined;
  AccountantProfile: undefined;
};

// ─── Librarian Stack ─────────────────────────────────────────────────────────

export type LibrarianTabParamList = {
  LibrarianDashboard: undefined;
  LibraryManagement: undefined;
  LibrarianProfile: undefined;
};

// ─── Transport Stack ─────────────────────────────────────────────────────────

export type TransportTabParamList = {
  TransportDashboard: undefined;
  BusTracking: undefined;
  RouteManagement: undefined;
  TransportProfile: undefined;
};

// ─── Navigation Prop Helpers ─────────────────────────────────────────────────

export type AuthNavProp<T extends keyof AuthStackParamList> =
  StackNavigationProp<AuthStackParamList, T>;

export type AuthRouteProp<T extends keyof AuthStackParamList> =
  RouteProp<AuthStackParamList, T>;

export type AdminNavProp<T extends keyof AdminDrawerParamList> =
  DrawerNavigationProp<AdminDrawerParamList, T>;

export type TeacherTabNavProp<T extends keyof TeacherTabParamList> =
  BottomTabNavigationProp<TeacherTabParamList, T>;
