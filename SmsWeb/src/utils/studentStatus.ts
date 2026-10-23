/**
 * Collapses the many internal lifecycle states into the three the admin actually cares about.
 * Keeps the UI simple: Admitted (in school) · Passed Out · Deactivated.
 */
export type StatusGroup = 'ADMITTED' | 'PASSED_OUT' | 'DEACTIVATED';

export function statusGroupOf(raw?: string): StatusGroup {
  switch (raw) {
    case 'PASSED_OUT':
    case 'ALUMNI':
      return 'PASSED_OUT';
    case 'DROPPED':
    case 'TRANSFERRED':
      return 'DEACTIVATED';
    default:
      return 'ADMITTED';
  }
}

export const STATUS_LABEL: Record<StatusGroup, string> = {
  ADMITTED: 'Admitted',
  PASSED_OUT: 'Passed Out',
  DEACTIVATED: 'Deactivated',
};

export const STATUS_COLOR: Record<StatusGroup, 'success' | 'secondary' | 'error'> = {
  ADMITTED: 'success',
  PASSED_OUT: 'secondary',
  DEACTIVATED: 'error',
};

export type StatusFilterValue = 'ALL' | StatusGroup;

export const STATUS_FILTERS: { v: StatusFilterValue; label: string }[] = [
  { v: 'ALL', label: 'All' },
  { v: 'ADMITTED', label: 'Admitted' },
  { v: 'PASSED_OUT', label: 'Passed Out' },
  { v: 'DEACTIVATED', label: 'Deactivated' },
];
