import { Box, Card, Typography, Chip, Stack, Skeleton } from '@mui/material';
import { Campaign } from '@mui/icons-material';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { studentPortalApi } from '@/api/studentPortal.api';
import { noticeStyle } from '@/components/student/StudentUI';
import { AttachmentChip } from '@/components/common/AttachmentPicker';
import { fmtDate } from '@/utils/formatters';

const FILTERS = [
  { value: 'ALL', label: 'All' },
  { value: 'GENERAL', label: 'General' },
  { value: 'FEE_REMINDER', label: 'Fee' },
  { value: 'EXAM_SCHEDULE', label: 'Exam' },
  { value: 'ATTENDANCE_ALERT', label: 'Attendance' },
];

export default function StudentCircularsPage() {
  const { data: notices = [], isLoading } = useQuery({ queryKey: ['student-circulars'], queryFn: studentPortalApi.circulars });
  const [filter, setFilter] = useState('ALL');

  // "General" absorbs circular/event/result — any non fee/exam/attendance notice.
  const GENERAL_BUCKET = ['GENERAL', 'CIRCULAR', 'EVENT', 'RESULT_PUBLISHED', 'HOMEWORK'];
  const shown = filter === 'ALL'
    ? notices
    : notices.filter((n) => (filter === 'GENERAL'
        ? GENERAL_BUCKET.includes(n.category)
        : n.category === filter));

  return (
    <Box sx={{ pb: 2 }}>
      <Typography variant="h6" fontWeight={800} sx={{ mb: 1.5 }}>Updates & Circulars</Typography>

      <Stack direction="row" spacing={1} sx={{ overflowX: 'auto', pb: 1, mb: 1 }}>
        {FILTERS.map((f) => (
          <Chip key={f.value} label={f.label} onClick={() => setFilter(f.value)}
            color={filter === f.value ? 'primary' : 'default'}
            variant={filter === f.value ? 'filled' : 'outlined'} sx={{ flexShrink: 0 }} />
        ))}
      </Stack>

      {isLoading ? (
        [0, 1, 2].map((i) => <Skeleton key={i} variant="rounded" height={72} sx={{ borderRadius: 4, mb: 1.5 }} />)
      ) : shown.length === 0 ? (
        <Card sx={{ p: 3, borderRadius: 4, boxShadow: 'none', textAlign: 'center' }}>
          <Campaign sx={{ fontSize: 48, color: '#CBD5E1' }} />
          <Typography variant="body2" color="text.secondary">No updates in this category.</Typography>
        </Card>
      ) : (
        shown.map((n) => {
          const s = noticeStyle(n.category);
          return (
            <Card key={`${n.source}-${n.id}`} sx={{ p: 2, borderRadius: 4, boxShadow: 'none', border: '1px solid #EDEFF1', mb: 1.5, borderLeft: `4px solid ${s.color}` }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                <Chip label={s.label} size="small" sx={{ height: 20, fontSize: 11, bgcolor: s.tint, color: s.color, fontWeight: 700 }} />
                <Typography variant="caption" color="text.disabled">{fmtDate(n.date, 'DD MMM YYYY')}</Typography>
              </Box>
              <Typography variant="subtitle2" fontWeight={700}>{n.title}</Typography>
              {n.body && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25, whiteSpace: 'pre-wrap' }}>{n.body}</Typography>
              )}
              {n.attachmentUrl && (
                <Box sx={{ mt: 1 }}>
                  <AttachmentChip url={n.attachmentUrl} name={n.attachmentName} />
                </Box>
              )}
            </Card>
          );
        })
      )}
    </Box>
  );
}
