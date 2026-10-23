/**
 * Role helpers. Login returns Spring authorities, usually prefixed with "ROLE_"
 * (e.g. "ROLE_TEACHER"), so we match by substring to be tolerant of the prefix.
 */
export const hasRole = (roles: string[] | undefined, role: string): boolean =>
  (roles ?? []).some(r => r.toUpperCase().includes(role.toUpperCase()));

export const isTeacher = (roles?: string[]): boolean => hasRole(roles, 'TEACHER');

export const isParent = (roles?: string[]): boolean => hasRole(roles, 'PARENT');

export const isStudent = (roles?: string[]): boolean => hasRole(roles, 'STUDENT');

/** School admin console. (SUPER_ADMIN is a platform role — not supported on mobile.) */
export const isAdmin = (roles?: string[]): boolean => hasRole(roles, 'SCHOOL_ADMIN');

/** Finance / accountant — fees + reconciliation only. */
export const isFinance = (roles?: string[]): boolean => hasRole(roles, 'ACCOUNTANT');

/** Transport manager — transport students + routes only. */
export const isTransport = (roles?: string[]): boolean => hasRole(roles, 'TRANSPORT_MANAGER');

/** Support staff — admin console minus fees/finance. */
export const isSupport = (roles?: string[]): boolean => hasRole(roles, 'SUPPORT_STAFF');
