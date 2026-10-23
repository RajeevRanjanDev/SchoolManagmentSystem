import { useAppSelector } from '@/store/hooks';
import type { RoleName } from '@/types/common.types';

export function useAuth() {
  const { user, isAuthenticated } = useAppSelector((s) => s.auth);

  const hasRole = (...roles: RoleName[]) =>
    user?.roles?.some((r) => roles.includes(r)) ?? false;

  const isSuperAdmin = () => hasRole('SUPER_ADMIN');
  const isSchoolAdmin = () => hasRole('SCHOOL_ADMIN', 'SUPER_ADMIN');
  const isTeacher = () => hasRole('TEACHER');
  const isAccountant = () => hasRole('ACCOUNTANT', 'SCHOOL_ADMIN', 'SUPER_ADMIN');

  return { user, isAuthenticated, hasRole, isSuperAdmin, isSchoolAdmin, isTeacher, isAccountant };
}
