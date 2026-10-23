import { format, parseISO, isToday, isYesterday, formatDistanceToNow } from 'date-fns';

/** Format ISO date string → "15 Jan 2026" */
export const formatDate = (dateStr: string): string => {
  try {
    return format(parseISO(dateStr), 'd MMM yyyy');
  } catch {
    return dateStr;
  }
};

/** Format ISO date string → "Mon, 15 Jan" */
export const formatShortDate = (dateStr: string): string => {
  try {
    return format(parseISO(dateStr), 'EEE, d MMM');
  } catch {
    return dateStr;
  }
};

/** Format time string "HH:mm:ss" → "09:30 AM" */
export const formatTime = (timeStr: string): string => {
  try {
    const [h, m] = timeStr.split(':').map(Number);
    const suffix = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return `${hour}:${String(m).padStart(2, '0')} ${suffix}`;
  } catch {
    return timeStr;
  }
};

/** Relative time label — "Today", "Yesterday", or "15 Jan" */
export const relativeDate = (dateStr: string): string => {
  try {
    const d = parseISO(dateStr);
    if (isToday(d)) return 'Today';
    if (isYesterday(d)) return 'Yesterday';
    return format(d, 'd MMM');
  } catch {
    return dateStr;
  }
};

/** "2 hours ago" style label */
export const timeAgo = (dateStr: string): string => {
  try {
    return formatDistanceToNow(parseISO(dateStr), { addSuffix: true });
  } catch {
    return dateStr;
  }
};

/** Current academic year string e.g. "2024-2025" */
export const currentAcademicYear = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  return month >= 4
    ? `${year}-${year + 1}`
    : `${year - 1}-${year}`;
};

/** Month list for filter pickers */
export const MONTHS = [
  { label: 'January',   value: '01' },
  { label: 'February',  value: '02' },
  { label: 'March',     value: '03' },
  { label: 'April',     value: '04' },
  { label: 'May',       value: '05' },
  { label: 'June',      value: '06' },
  { label: 'July',      value: '07' },
  { label: 'August',    value: '08' },
  { label: 'September', value: '09' },
  { label: 'October',   value: '10' },
  { label: 'November',  value: '11' },
  { label: 'December',  value: '12' },
];
