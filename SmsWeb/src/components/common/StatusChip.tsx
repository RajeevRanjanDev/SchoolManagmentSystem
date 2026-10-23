import { Chip } from '@mui/material';

const COLORS: Record<string, 'success' | 'error' | 'warning' | 'info' | 'default'> = {
  ACTIVE: 'success', PRESENT: 'success', PAID: 'success', AVAILABLE: 'success',
  INACTIVE: 'default', ABSENT: 'error', OVERDUE: 'error', EXPELLED: 'error', RESIGNED: 'error',
  LATE: 'warning', PENDING: 'warning', PARTIAL: 'warning', ON_LEAVE: 'warning', HALF_DAY: 'warning',
  TRANSFERRED: 'info', GRADUATED: 'info', HOLIDAY: 'info', LEAVE: 'info', ISSUED: 'info',
  WAIVED: 'default', ARCHIVED: 'default',
};

export function StatusChip({ status }: { status: string }) {
  const color = COLORS[status] ?? 'default';
  return (
    <Chip
      label={status.replace(/_/g, ' ')}
      color={color}
      size="small"
      variant="filled"
      sx={{ fontWeight: 600, fontSize: '0.7rem' }}
    />
  );
}
