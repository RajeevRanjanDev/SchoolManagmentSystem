export interface StatusMeta { label: string; color: string; }

/** Backend school/tenant statuses: TRIAL | ACTIVE | SUSPENDED | TERMINATED. */
export const STATUS_META: Record<string, StatusMeta> = {
  TRIAL:      { label: 'Trial / Pending', color: '#F59E0B' },
  ACTIVE:     { label: 'Active',          color: '#0C831F' },
  SUSPENDED:  { label: 'Suspended',       color: '#E23744' },
  TERMINATED: { label: 'Terminated',      color: '#616161' },
};

export const STATUS_OPTIONS = ['ACTIVE', 'TRIAL', 'SUSPENDED', 'TERMINATED'] as const;

/** Lifecycle actions available from the current status. */
export function statusActions(status: string): { label: string; to: string; color: 'success' | 'error' | 'warning' | 'inherit' }[] {
  switch (status) {
    case 'ACTIVE':
      return [{ label: 'Suspend', to: 'SUSPENDED', color: 'error' }];
    case 'TRIAL':
      return [
        { label: 'Activate', to: 'ACTIVE', color: 'success' },
        { label: 'Suspend', to: 'SUSPENDED', color: 'error' },
      ];
    case 'SUSPENDED':
      return [
        { label: 'Reactivate', to: 'ACTIVE', color: 'success' },
        { label: 'Terminate', to: 'TERMINATED', color: 'error' },
      ];
    case 'TERMINATED':
      return [{ label: 'Reactivate', to: 'ACTIVE', color: 'success' }];
    default:
      return [{ label: 'Activate', to: 'ACTIVE', color: 'success' }];
  }
}
