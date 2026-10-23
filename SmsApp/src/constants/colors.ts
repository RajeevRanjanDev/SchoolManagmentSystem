/**
 * App color palette — all screens import from here.
 * Change values here to retheme the whole app.
 *
 * Tone: light, airy, white surfaces on a soft grey background with a vivid
 * blue primary and pastel stat tiles (matches the student/parent portal look).
 */
export const Colors = {
  // Brand
  primary: '#2563EB',       // blue-600
  primaryDark: '#1D4ED8',   // blue-700
  primaryLight: '#93B4FD',  // blue-300
  secondary: '#38BDF8',     // sky-400
  accent: '#F59E0B',        // amber-500

  // Status
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#3B82F6',

  // Attendance
  present: '#2E6BE6',
  absent: '#EF4444',
  late: '#F59E0B',
  holiday: '#8B5CF6',

  // Neutrals
  white: '#FFFFFF',
  black: '#000000',
  background: '#F4F6FB',    // soft page background
  surface: '#FFFFFF',
  border: '#E6E9F0',
  divider: '#EEF1F6',

  // Text
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  textInverse: '#FFFFFF',

  // Soft "chip" (e.g. category labels like "Circulars & Notices")
  chipBg: '#ECECFE',
  chipFg: '#5B5BD6',

  // Quick-action circular button background
  softBlueBg: '#E8EFFF',

  // Pastel stat tiles  (bg + matching foreground/icon colour)
  tileBlueBg: '#EAF1FE',
  tileBlueFg: '#2563EB',
  tileAmberBg: '#FFF7E6',
  tileAmberFg: '#D97706',
  tilePurpleBg: '#F1ECFF',
  tilePurpleFg: '#7C3AED',
  tilePinkBg: '#FDEBF2',
  tilePinkFg: '#DB2777',

  // Gradients (use as array in LinearGradient)
  gradientPrimary: ['#2563EB', '#4F46E5'],
  gradientSuccess: ['#10B981', '#059669'],
  gradientWarning: ['#F59E0B', '#D97706'],
  gradientDanger: ['#EF4444', '#DC2626'],
} as const;
