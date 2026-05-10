/**
 * App color palette — all screens import from here.
 * Change values here to retheme the whole app.
 */
export const Colors = {
  // Brand
  primary: '#4F46E5',       // indigo-600
  primaryDark: '#3730A3',   // indigo-800
  primaryLight: '#818CF8',  // indigo-400
  secondary: '#06B6D4',     // cyan-500
  accent: '#F59E0B',        // amber-500

  // Status
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#3B82F6',

  // Attendance
  present: '#10B981',
  absent: '#EF4444',
  late: '#F59E0B',
  holiday: '#8B5CF6',

  // Neutrals
  white: '#FFFFFF',
  black: '#000000',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  border: '#E2E8F0',
  divider: '#F1F5F9',

  // Text
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  textInverse: '#FFFFFF',

  // Gradients (use as array in LinearGradient)
  gradientPrimary: ['#4F46E5', '#7C3AED'],
  gradientSuccess: ['#10B981', '#059669'],
  gradientWarning: ['#F59E0B', '#D97706'],
  gradientDanger: ['#EF4444', '#DC2626'],
} as const;
