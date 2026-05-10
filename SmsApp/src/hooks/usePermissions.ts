import { useAuth } from './useAuth';
import { hasPermission, PERMISSIONS } from '../constants/permissions';
import type { RoleName } from '../types';

export function usePermissions() {
  const { roles } = useAuth();

  const can = (permission: keyof typeof PERMISSIONS): boolean =>
    hasPermission(roles as RoleName[], permission);

  const isAdmin = roles.includes('SCHOOL_ADMIN') || roles.includes('SUPER_ADMIN');
  const isTeacher = roles.includes('TEACHER');
  const isAccountant = roles.includes('ACCOUNTANT');
  const isLibrarian = roles.includes('LIBRARIAN');
  const isTransportManager = roles.includes('TRANSPORT_MANAGER');

  return {
    can,
    isAdmin,
    isTeacher,
    isAccountant,
    isLibrarian,
    isTransportManager,
    roles,
  };
}
