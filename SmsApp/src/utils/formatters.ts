import { format, parseISO, isValid } from 'date-fns';

export function formatDate(dateStr: string | null | undefined, pattern = 'dd MMM yyyy'): string {
  if (!dateStr) return '—';
  try {
    const d = parseISO(dateStr);
    return isValid(d) ? format(d, pattern) : '—';
  } catch {
    return '—';
  }
}

export function formatDateTime(dateStr: string | null | undefined): string {
  return formatDate(dateStr, 'dd MMM yyyy, hh:mm a');
}

export function formatTime(timeStr: string | null | undefined): string {
  if (!timeStr) return '—';
  // timeStr format: "HH:mm:ss" or "HH:mm"
  const parts = timeStr.split(':');
  const hours = parseInt(parts[0], 10);
  const mins = parts[1] ?? '00';
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours % 12 || 12;
  return `${displayHour}:${mins} ${ampm}`;
}

export function formatCurrency(amount: number | null | undefined): string {
  if (amount == null) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPercentage(value: number | null | undefined): string {
  if (value == null) return '0%';
  return `${Math.round(value)}%`;
}

export function getInitials(firstName?: string, lastName?: string): string {
  const f = firstName?.[0]?.toUpperCase() ?? '';
  const l = lastName?.[0]?.toUpperCase() ?? '';
  return `${f}${l}` || '??';
}

export function getFullName(firstName?: string, lastName?: string): string {
  return [firstName, lastName].filter(Boolean).join(' ') || 'Unknown';
}

export function formatPhoneNumber(phone: string | undefined): string {
  if (!phone) return '—';
  return phone.replace(/(\d{5})(\d{5})/, '$1 $2');
}

export function todayISO(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export function getAcademicYear(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  return month >= 4
    ? `${year}-${String(year + 1).slice(2)}`
    : `${year - 1}-${String(year).slice(2)}`;
}
