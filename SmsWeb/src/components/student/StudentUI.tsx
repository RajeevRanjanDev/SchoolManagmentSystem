import { Box, Card, Typography } from '@mui/material';

/** Soft pastel stat tile used across the student dashboard. */
export function StatTile({
  icon, label, value, tint, color,
}: { icon: React.ReactNode; label: string; value: string; tint: string; color: string }) {
  return (
    <Card sx={{ p: 2, borderRadius: 4, bgcolor: tint, boxShadow: 'none', height: '100%' }}>
      <Box sx={{
        width: 40, height: 40, borderRadius: 2.5, bgcolor: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center', color, mb: 1.5,
      }}>
        {icon}
      </Box>
      <Typography variant="h5" fontWeight={800} sx={{ lineHeight: 1.1 }}>{value}</Typography>
      <Typography variant="body2" color="text.secondary">{label}</Typography>
    </Card>
  );
}

/** Section wrapper card with a title + optional action. */
export function SectionCard({
  title, action, children, sx,
}: { title?: string; action?: React.ReactNode; children: React.ReactNode; sx?: any }) {
  return (
    <Card sx={{ p: 2, borderRadius: 4, boxShadow: 'none', border: '1px solid #EDEFF1', ...sx }}>
      {(title || action) && (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
          {title && <Typography variant="subtitle1" fontWeight={800}>{title}</Typography>}
          {action}
        </Box>
      )}
      {children}
    </Card>
  );
}

/** Colour + label for a notice / circular category. */
// Student-facing categories: General (absorbs circular/event/result/homework),
// Fee, Exam, Attendance.
export const NOTICE_STYLE: Record<string, { label: string; color: string; tint: string }> = {
  GENERAL:           { label: 'General',    color: '#616161', tint: '#F0F0F0' },
  CIRCULAR:          { label: 'General',    color: '#616161', tint: '#F0F0F0' },
  EVENT:             { label: 'General',    color: '#616161', tint: '#F0F0F0' },
  RESULT_PUBLISHED:  { label: 'General',    color: '#616161', tint: '#F0F0F0' },
  HOMEWORK:          { label: 'General',    color: '#616161', tint: '#F0F0F0' },
  FEE_REMINDER:      { label: 'Fee',        color: '#F57C00', tint: '#FFF3E0' },
  EXAM_SCHEDULE:     { label: 'Exam',       color: '#7B1FA2', tint: '#F3E5F5' },
  ATTENDANCE_ALERT:  { label: 'Attendance', color: '#1565C0', tint: '#E3F2FD' },
};

export const noticeStyle = (type?: string) =>
  NOTICE_STYLE[type ?? 'GENERAL'] ?? NOTICE_STYLE.GENERAL;
