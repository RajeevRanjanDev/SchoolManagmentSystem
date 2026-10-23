import dayjs from 'dayjs';

export const fmtDate = (d: string | null | undefined, fmt = 'DD MMM YYYY') =>
  d ? dayjs(d).format(fmt) : '—';

export const fmtCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

export const fmtPercent = (value: number) => `${value.toFixed(1)}%`;

export const DAY_NAMES = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const initials = (first: string, last: string) =>
  `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
