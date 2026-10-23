/** Format a number as Indian Rupees: ₹1,234.00 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
  }).format(amount);
};

/** Percentage string: "87.5%" */
export const formatPercent = (value: number): string =>
  `${value.toFixed(1)}%`;

/** "Aarav Verma" → "AV" initials for avatar */
export const getInitials = (name: string): string =>
  name
    .split(' ')
    .slice(0, 2)
    .map(n => n[0]?.toUpperCase() ?? '')
    .join('');

/** Grade colour for result cards */
export const gradeColor = (grade: string): string => {
  switch (grade?.toUpperCase()) {
    case 'A+': case 'A': return '#10B981';
    case 'B+': case 'B': return '#3B82F6';
    case 'C+': case 'C': return '#F59E0B';
    case 'D':             return '#F97316';
    default:              return '#EF4444';
  }
};

/** Attendance status colour */
export const attendanceColor = (status: string): string => {
  switch (status) {
    case 'PRESENT':  return '#10B981';
    case 'ABSENT':   return '#EF4444';
    case 'LATE':     return '#F59E0B';
    case 'HALF_DAY': return '#8B5CF6';
    case 'HOLIDAY':  return '#64748B';
    default:         return '#94A3B8';
  }
};

/** Fee status colour */
export const feeStatusColor = (status: string): string => {
  switch (status) {
    case 'PAID':    return '#10B981';
    case 'PENDING': return '#F59E0B';
    case 'OVERDUE': return '#EF4444';
    case 'PARTIAL': return '#3B82F6';
    case 'WAIVED':  return '#8B5CF6';
    default:        return '#94A3B8';
  }
};
