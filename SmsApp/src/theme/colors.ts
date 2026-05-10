export const Colors = {
  // Brand
  primary: '#1565C0',        // Deep blue — trust, education
  primaryLight: '#1E88E5',
  primaryDark: '#0D47A1',
  secondary: '#00897B',      // Teal accent
  secondaryLight: '#26A69A',
  accent: '#FF6F00',         // Warm amber for actions

  // Background
  background: '#F5F7FA',
  surface: '#FFFFFF',
  surfaceVariant: '#EEF2F7',
  card: '#FFFFFF',

  // Text
  textPrimary: '#1A1A2E',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  textOnPrimary: '#FFFFFF',
  textOnDark: '#FFFFFF',

  // Status
  success: '#4CAF50',
  successLight: '#E8F5E9',
  warning: '#FF9800',
  warningLight: '#FFF3E0',
  error: '#F44336',
  errorLight: '#FFEBEE',
  info: '#2196F3',
  infoLight: '#E3F2FD',

  // Border & Divider
  border: '#E5E7EB',
  divider: '#F3F4F6',

  // Attendance
  present: '#4CAF50',
  absent: '#F44336',
  halfDay: '#FF9800',
  leave: '#9E9E9E',

  // Fee status
  paid: '#4CAF50',
  partialPaid: '#FF9800',
  pending: '#F44336',
  defaultFee: '#9C27B0',

  // Neutral
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
  shadow: 'rgba(0,0,0,0.08)',
  overlay: 'rgba(0,0,0,0.5)',

  // Role colors
  adminColor: '#1565C0',
  teacherColor: '#00897B',
  accountantColor: '#7B1FA2',
  librarianColor: '#E65100',
  transportColor: '#1B5E20',

  // Gradient starts/ends
  gradientStart: '#1565C0',
  gradientEnd: '#1E88E5',
};

export type ColorKey = keyof typeof Colors;
