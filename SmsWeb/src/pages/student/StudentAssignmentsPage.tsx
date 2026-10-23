import { Box, Card, Typography, TextField, Chip, Divider, Skeleton, Stack } from '@mui/material';
import { MenuBook, Assignment } from '@mui/icons-material';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { studentPortalApi, type StudentAssignment } from '@/api/studentPortal.api';
import { SectionCard } from '@/components/student/StudentUI';
import { fmtDate } from '@/utils/formatters';

export default function StudentAssignmentsPage() {
  const { data: all = [], isLoading } = useQuery({ queryKey: ['student-assignments'], queryFn: studentPortalApi.assignments });
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));

  const forDate = all.filter((a) => a.date === date);
  const homework = forDate.filter((a) => a.type === 'HOMEWORK');
  const classwork = forDate.filter((a) => a.type === 'CLASSWORK');

  // Dates (within the last month) that have assignments, newest first.
  const dates = Array.from(new Set(all.map((a) => a.date).filter(Boolean))) as string[];

  const Block = ({ title, items, tint, color }: { title: string; items: StudentAssignment[]; tint: string; color: string }) => (
    <Box sx={{ mb: 2 }}>
      <Chip label={title} size="small" sx={{ bgcolor: tint, color, fontWeight: 700, mb: 1 }} />
      {items.length === 0 ? (
        <Typography variant="body2" color="text.secondary">Nothing posted.</Typography>
      ) : (
        items.map((a) => (
          <Typography key={a.id} variant="body2" sx={{ whiteSpace: 'pre-wrap', mb: 0.5 }}>
            {a.description || a.title}
          </Typography>
        ))
      )}
    </Box>
  );

  return (
    <Box sx={{ pb: 2, maxWidth: 820, mx: 'auto' }}>
      <Typography variant="h6" fontWeight={800} sx={{ mb: 1.5 }}>Assignments</Typography>

      <Card sx={{ p: 2, borderRadius: 4, boxShadow: 'none', mb: 2 }}>
        <TextField
          type="date" label="Select date" size="small" value={date}
          onChange={(e) => setDate(e.target.value)} InputLabelProps={{ shrink: true }}
          inputProps={{ max: new Date().toISOString().slice(0, 10) }}
        />
      </Card>

      <SectionCard title={fmtDate(date, 'DD MMM YYYY')} sx={{ mb: 2 }}>
        {isLoading ? (
          [0, 1].map((i) => <Skeleton key={i} height={40} />)
        ) : forDate.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <Assignment sx={{ fontSize: 44, color: '#CBD5E1' }} />
            <Typography variant="body2" color="text.secondary">No homework or classwork for this date.</Typography>
          </Box>
        ) : (
          <>
            <Block title="Homework" items={homework} tint="#E8F5E9" color="#388E3C" />
            <Block title="Classwork" items={classwork} tint="#EDE7F6" color="#5E35B1" />
          </>
        )}
      </SectionCard>

      {/* Past month — dates with assignments */}
      <SectionCard title="Recent (last month)">
        {isLoading ? (
          [0, 1, 2].map((i) => <Skeleton key={i} height={34} />)
        ) : dates.length === 0 ? (
          <Typography variant="body2" color="text.secondary">No assignments yet.</Typography>
        ) : (
          <Stack divider={<Divider />}>
            {dates.map((d) => {
              const count = all.filter((a) => a.date === d).length;
              return (
                <Box key={d} onClick={() => setDate(d)}
                  sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 1.1, cursor: 'pointer', bgcolor: d === date ? '#F0F7F1' : 'transparent', borderRadius: 1, px: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                    <MenuBook fontSize="small" sx={{ color: '#5A5A5A' }} />
                    <Typography variant="body2" fontWeight={600}>{fmtDate(d, 'DD MMM YYYY')}</Typography>
                  </Box>
                  <Chip size="small" label={`${count} item${count === 1 ? '' : 's'}`} variant="outlined" />
                </Box>
              );
            })}
          </Stack>
        )}
      </SectionCard>
    </Box>
  );
}
