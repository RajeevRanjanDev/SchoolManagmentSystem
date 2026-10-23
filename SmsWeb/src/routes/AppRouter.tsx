import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { MainLayout } from '@/layouts/MainLayout';
import { StudentLayout } from '@/layouts/StudentLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';

const LoginPage        = lazy(() => import('@/pages/auth/LoginPage'));
const StudentDashboardPage  = lazy(() => import('@/pages/student/StudentDashboardPage'));
const StudentPortalProfilePage = lazy(() => import('@/pages/student/StudentProfilePage'));
const StudentFeesPage       = lazy(() => import('@/pages/student/StudentFeesPage'));
const StudentPortalAttendancePage = lazy(() => import('@/pages/student/StudentAttendancePage'));
const StudentCircularsPage  = lazy(() => import('@/pages/student/StudentCircularsPage'));
const StudentAssignmentsPage = lazy(() => import('@/pages/student/StudentAssignmentsPage'));
const StudentResultsPage    = lazy(() => import('@/pages/student/StudentResultsPage'));
const DashboardPage    = lazy(() => import('@/pages/dashboard/DashboardPage'));
const StudentsPage     = lazy(() => import('@/pages/students/StudentsPage'));
const TeachersPage     = lazy(() => import('@/pages/teachers/TeachersPage'));
const ClassesPage      = lazy(() => import('@/pages/academic/ClassesPage'));
const SectionsPage     = lazy(() => import('@/pages/academic/SectionsPage'));
const SubjectsPage     = lazy(() => import('@/pages/academic/SubjectsPage'));
const AttendancePage   = lazy(() => import('@/pages/attendance/AttendancePage'));
const StudentAttendancePage = lazy(() => import('@/pages/attendance/StudentAttendancePage'));
const FeesPage         = lazy(() => import('@/pages/fees/FeesPage'));
const FeeTemplatesPage = lazy(() => import('@/pages/fees/FeeTemplatesPage'));
const FeeLedgerPage    = lazy(() => import('@/pages/fees/FeeLedgerPage'));
const HomeworkPage     = lazy(() => import('@/pages/homework/DailyWorkPage'));
const ExamsPage        = lazy(() => import('@/pages/exams/ExamsPage'));
const NotificationsPage = lazy(() => import('@/pages/notifications/NotificationManagementPage'));
const AdmissionPage    = lazy(() => import('@/pages/admission/AdmissionPage'));
const TransportPage    = lazy(() => import('@/pages/transport/TransportPage'));
const NotFoundPage     = lazy(() => import('@/pages/errors/NotFoundPage'));
const ForbiddenPage    = lazy(() => import('@/pages/errors/ForbiddenPage'));
const TeacherDashboardPage = lazy(() => import('@/pages/teacher/TeacherDashboardPage'));
const MyClassPage          = lazy(() => import('@/pages/teacher/MyClassPage'));
const TeacherAttendancePage = lazy(() => import('@/pages/teacher/TeacherAttendancePage'));
const TeacherExamsPage     = lazy(() => import('@/pages/teacher/TeacherExamsPage'));
const TeacherNoticesPage   = lazy(() => import('@/pages/teacher/TeacherNoticesPage'));
const TeacherInboxPage     = lazy(() => import('@/pages/teacher/TeacherInboxPage'));
const TeacherDailyWorkPage = lazy(() => import('@/pages/teacher/TeacherDailyWorkPage'));
const ProfilePage          = lazy(() => import('@/pages/profile/ProfilePage'));
const FinancePage      = lazy(() => import('@/pages/finance/FinancePage'));
const SuperAdminDashboardPage = lazy(() => import('@/pages/superadmin/SuperAdminDashboardPage'));
const SchoolsPage          = lazy(() => import('@/pages/superadmin/SchoolsPage'));
const PlansPage            = lazy(() => import('@/pages/superadmin/PlansPage'));
const OperationsPage       = lazy(() => import('@/pages/superadmin/OperationsPage'));

const Loader = () => (
  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
    <CircularProgress />
  </Box>
);

/** Home route: route each role to the screen they're allowed to use. */
function HomeRoute() {
  const { isSuperAdmin, hasRole } = useAuth();
  if (isSuperAdmin()) return <Navigate to="/admin" replace />;
  const adminish = hasRole('SCHOOL_ADMIN', 'SUPPORT_STAFF');
  if (!adminish && hasRole('ACCOUNTANT')) return <Navigate to="/fees" replace />;           // finance employee
  if (!adminish && hasRole('TRANSPORT_MANAGER')) return <Navigate to="/transport" replace />; // transport employee
  return <DashboardPage />;
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Suspense fallback={<Loader />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/403" element={<ForbiddenPage />} />
          <Route path="/404" element={<NotFoundPage />} />

          {/* Student portal — mobile-style, separate layout */}
          <Route
            path="/student"
            element={
              <ProtectedRoute roles={['STUDENT']}>
                <StudentLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<StudentDashboardPage />} />
            <Route path="assignments" element={<StudentAssignmentsPage />} />
            <Route path="results" element={<StudentResultsPage />} />
            <Route path="attendance" element={<StudentPortalAttendancePage />} />
            <Route path="fees" element={<StudentFeesPage />} />
            <Route path="circulars" element={<StudentCircularsPage />} />
            <Route path="profile" element={<StudentPortalProfilePage />} />
          </Route>

          <Route
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<HomeRoute />} />
            {/* Super Admin — platform console */}
            <Route path="admin" element={
              <ProtectedRoute roles={['SUPER_ADMIN']}>
                <SuperAdminDashboardPage />
              </ProtectedRoute>
            } />
            <Route path="admin/schools" element={
              <ProtectedRoute roles={['SUPER_ADMIN']}>
                <SchoolsPage />
              </ProtectedRoute>
            } />
            <Route path="admin/plans" element={
              <ProtectedRoute roles={['SUPER_ADMIN']}>
                <PlansPage />
              </ProtectedRoute>
            } />
            <Route path="admin/operations" element={
              <ProtectedRoute roles={['SUPER_ADMIN']}>
                <OperationsPage />
              </ProtectedRoute>
            } />
            <Route path="students" element={<StudentsPage />} />
            <Route path="teachers" element={<TeachersPage />} />
            <Route path="academic/classes" element={
              <ProtectedRoute roles={['SCHOOL_ADMIN', 'SUPER_ADMIN', 'SUPPORT_STAFF']}>
                <ClassesPage />
              </ProtectedRoute>
            } />
            <Route path="academic/sections" element={
              <ProtectedRoute roles={['SCHOOL_ADMIN', 'SUPER_ADMIN', 'SUPPORT_STAFF']}>
                <SectionsPage />
              </ProtectedRoute>
            } />
            <Route path="academic/subjects" element={
              <ProtectedRoute roles={['SCHOOL_ADMIN', 'SUPER_ADMIN', 'SUPPORT_STAFF']}>
                <SubjectsPage />
              </ProtectedRoute>
            } />
            <Route path="admission" element={
              <ProtectedRoute roles={['ADMISSION_OFFICER', 'SCHOOL_ADMIN', 'SUPER_ADMIN', 'PRINCIPAL', 'DEAN', 'SUPPORT_STAFF']}>
                <AdmissionPage />
              </ProtectedRoute>
            } />
            <Route path="attendance" element={<AttendancePage />} />
            <Route path="attendance/student" element={
              <ProtectedRoute roles={['TEACHER', 'SCHOOL_ADMIN', 'SUPER_ADMIN', 'SUPPORT_STAFF']}>
                <StudentAttendancePage />
              </ProtectedRoute>
            } />
            <Route path="fees" element={
              <ProtectedRoute roles={['ACCOUNTANT', 'SCHOOL_ADMIN', 'SUPER_ADMIN']}>
                <FeesPage />
              </ProtectedRoute>
            } />
            <Route path="fees/templates" element={
              <ProtectedRoute roles={['ACCOUNTANT', 'SCHOOL_ADMIN', 'SUPER_ADMIN']}>
                <FeeTemplatesPage />
              </ProtectedRoute>
            } />
            <Route path="fees/ledger" element={
              <ProtectedRoute roles={['ACCOUNTANT', 'SCHOOL_ADMIN', 'SUPER_ADMIN']}>
                <FeeLedgerPage />
              </ProtectedRoute>
            } />
            <Route path="finance/reconciliation" element={
              <ProtectedRoute roles={['ACCOUNTANT', 'SCHOOL_ADMIN', 'SUPER_ADMIN']}>
                <FinancePage />
              </ProtectedRoute>
            } />
            <Route path="homework" element={<HomeworkPage />} />
            <Route path="exams" element={<ExamsPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="transport" element={<TransportPage />} />
            <Route path="profile" element={<ProfilePage />} />
            {/* Teacher Portal */}
            <Route path="teacher/dashboard" element={
              <ProtectedRoute roles={['TEACHER', 'SCHOOL_ADMIN', 'SUPER_ADMIN']}>
                <TeacherDashboardPage />
              </ProtectedRoute>
            } />
            <Route path="teacher/class" element={
              <ProtectedRoute roles={['TEACHER', 'SCHOOL_ADMIN', 'SUPER_ADMIN']}>
                <MyClassPage />
              </ProtectedRoute>
            } />
            <Route path="teacher/attendance" element={
              <ProtectedRoute roles={['TEACHER', 'SCHOOL_ADMIN', 'SUPER_ADMIN']}>
                <TeacherAttendancePage />
              </ProtectedRoute>
            } />
            <Route path="teacher/exams" element={
              <ProtectedRoute roles={['TEACHER', 'SCHOOL_ADMIN', 'SUPER_ADMIN']}>
                <TeacherExamsPage />
              </ProtectedRoute>
            } />
            <Route path="teacher/notices" element={
              <ProtectedRoute roles={['TEACHER', 'SCHOOL_ADMIN', 'SUPER_ADMIN']}>
                <TeacherNoticesPage />
              </ProtectedRoute>
            } />
            <Route path="teacher/inbox" element={
              <ProtectedRoute roles={['TEACHER', 'SCHOOL_ADMIN', 'SUPER_ADMIN']}>
                <TeacherInboxPage />
              </ProtectedRoute>
            } />
            <Route path="teacher/daily-work" element={
              <ProtectedRoute roles={['TEACHER', 'SCHOOL_ADMIN', 'SUPER_ADMIN']}>
                <TeacherDailyWorkPage />
              </ProtectedRoute>
            } />
          </Route>

          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
