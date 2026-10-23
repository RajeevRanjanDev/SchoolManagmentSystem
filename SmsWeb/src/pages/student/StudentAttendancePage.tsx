import { Box, Grid, Typography, Skeleton, Chip } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { studentPortalApi } from '@/api/studentPortal.api';
import { StatTile, SectionCard } from '@/components/student/StudentUI';
import { fmtDate } from '@/utils/formatters';

const STATUS_COLOR: Record<string, string> = {
  PRESENT: '#0C831F', ABSENT: '#E23744', LATE: '#F59E0B', HALF_DAY: '#2E6FF2',
  HOLIDAY: '#9AA0A6', MEDICAL_LEAVE: '#7C3AED',
};

export default function StudentAttendancePage() {
  const { data, isLoading } = useQuery({ queryKey: ['student-attendance'], queryFn: studentPortalApi.attendance });

  return (
    <Box sx={{ pb: 2 }}>
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        {isLoading ? (
          [0, 1, 2].map((i) => <Grid item xs={4} key={i}><Skeleton variant="rounded" height={110} sx={{ borderRadius: 4 }} /></Grid>)
        ) : (
          <>
            <Grid item xs={4}><StatTile icon={<Box fontWeight={800}>{data?.percentage ?? 0}%</Box>} tint="#E3F2FD" color="#1565C0" value={`${data?.present ?? 0}`} label="Present" /></Grid>
            <Grid item xs={4}><StatTile icon={<Box fontWeight={800}>✕</Box>} tint="#FFEBEE" color="#E23744" value={`${data?.absent ?? 0}`} label="Absent" /></Grid>
            <Grid item xs={4}><StatTile icon={<Box fontWeight={800}>⏱</Box>} tint="#FFF8E1" color="#F59E0B" value={`${data?.late ?? 0}`} label="Late" /></Grid>
          </>
        )}
      </Grid>

      <SectionCard title="Attendance Overview" sx={{ mb: 2 }}>
        {isLoading ? (
          <Skeleton variant="rounded" height={200} />
        ) : !data?.months?.length ? (
          <Typography variant="body2" color="text.secondary">No attendance recorded yet.</Typography>
        ) : (
          <Box sx={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.months} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EEE" />
                <XAxis dataKey="label" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="present" name="Present" fill="#1565C0" radius={[3, 3, 0, 0]} />
                <Bar dataKey="absent" name="Absent" fill="#E23744" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        )}
      </SectionCard>

      <SectionCard title="Recent Days">
        {isLoading ? (
          [0, 1, 2].map((i) => <Skeleton key={i} height={30} />)
        ) : !data?.recent?.length ? (
          <Typography variant="body2" color="text.secondary">No records.</Typography>
        ) : (
          data.recent.map((d, i) => (
            <Box key={i} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 0.9, borderBottom: '1px solid #F2F2F2', '&:last-child': { borderBottom: 'none' } }}>
              <Typography variant="body2">{fmtDate(d.date)}</Typography>
              <Chip label={(d.status ?? '').replace('_', ' ')} size="small"
                sx={{ height: 20, fontSize: 11, bgcolor: `${STATUS_COLOR[d.status] ?? '#9AA0A6'}18`, color: STATUS_COLOR[d.status] ?? '#9AA0A6', fontWeight: 600 }} />
            </Box>
          ))
        )}
      </SectionCard>
    </Box>
  );
}
