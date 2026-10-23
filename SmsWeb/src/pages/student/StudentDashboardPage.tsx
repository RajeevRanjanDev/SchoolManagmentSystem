import { Box, Grid, Typography, Skeleton, Chip, Card } from '@mui/material';
import { EventAvailable, CreditCard, MenuBook, CalendarMonth, Campaign, ChevronRight } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { studentPortalApi } from '@/api/studentPortal.api';
import { StatTile, SectionCard, noticeStyle } from '@/components/student/StudentUI';
import { fmtCurrency, fmtDate } from '@/utils/formatters';

export default function StudentDashboardPage() {
  const navigate = useNavigate();
  const { data: dash, isLoading } = useQuery({ queryKey: ['student-dashboard'], queryFn: studentPortalApi.dashboard });
  const { data: notices = [] } = useQuery({ queryKey: ['student-circulars'], queryFn: studentPortalApi.circulars });
  const { data: assignments = [] } = useQuery({ queryKey: ['student-assignments'], queryFn: studentPortalApi.assignments });

  return (
    <Box sx={{ pb: 2 }}>
      {/* Greeting */}
      <Card sx={{ p: 2.5, borderRadius: 4, boxShadow: 'none', mb: 2,
        background: 'linear-gradient(120deg, #0C831F 0%, #16A34A 60%, #1DA837 100%)', color: '#fff' }}>
        <Typography variant="h6" fontWeight={800}>
          Hello, {isLoading ? '…' : (dash?.studentName?.split(' ')[0] ?? 'Student')}! 👋
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.9 }}>
          {dash?.className && dash?.sectionName ? `Class ${dash.className} · ${dash.sectionName}` : "Here's your day at a glance"}
        </Typography>
      </Card>

      {/* Stat tiles */}
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        {isLoading ? (
          [0, 1, 2, 3].map((i) => (
            <Grid item xs={6} md={3} key={i}><Skeleton variant="rounded" height={118} sx={{ borderRadius: 4 }} /></Grid>
          ))
        ) : (
          <>
            <Grid item xs={6} md={3}>
              <StatTile icon={<EventAvailable />} tint="#E3F2FD" color="#1565C0"
                value={`${dash?.attendanceRate ?? 0}%`} label="Attendance Rate" />
            </Grid>
            <Grid item xs={6} md={3}>
              <StatTile icon={<CreditCard />} tint="#FFF3E0" color="#F57C00"
                value={fmtCurrency(dash?.outstandingFee ?? 0)} label="Outstanding Fee" />
            </Grid>
            <Grid item xs={6} md={3}>
              <StatTile icon={<MenuBook />} tint="#F3E5F5" color="#7B1FA2"
                value={String(dash?.todayAssignments ?? 0)} label="Today's Assignments" />
            </Grid>
            <Grid item xs={6} md={3}>
              <StatTile icon={<CalendarMonth />} tint="#FCE4EC" color="#C2185B"
                value={String(dash?.todayUpdates ?? 0)} label="Today's Updates" />
            </Grid>
          </>
        )}
      </Grid>

      {/* Recent notices + assignments — side by side on desktop */}
      <Grid container spacing={2}>
      <Grid item xs={12} md={6}>
      <SectionCard
        title="Latest Updates"
        action={<Chip size="small" label="View all" onClick={() => navigate('/student/circulars')} clickable />}
        sx={{ height: '100%' }}>
        {notices.length === 0 ? (
          <Typography variant="body2" color="text.secondary">No updates yet.</Typography>
        ) : (
          notices.slice(0, 4).map((n) => {
            const s = noticeStyle(n.category);
            return (
              <Box key={`${n.source}-${n.id}`} onClick={() => navigate('/student/circulars')}
                sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1, cursor: 'pointer', borderBottom: '1px solid #F2F2F2', '&:last-child': { borderBottom: 'none' } }}>
                <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: s.tint, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Campaign fontSize="small" />
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" fontWeight={600} noWrap>{n.title}</Typography>
                  <Chip label={s.label} size="small" sx={{ height: 18, fontSize: 10, bgcolor: s.tint, color: s.color, mt: 0.25 }} />
                </Box>
                <ChevronRight fontSize="small" sx={{ color: '#BDBDBD' }} />
              </Box>
            );
          })
        )}
      </SectionCard>
      </Grid>

      {/* Recent assignments */}
      <Grid item xs={12} md={6}>
      <SectionCard title="Recent Assignments" sx={{ height: '100%' }}>
        {assignments.length === 0 ? (
          <Typography variant="body2" color="text.secondary">No assignments posted.</Typography>
        ) : (
          assignments.slice(0, 4).map((a) => (
            <Box key={`${a.type}-${a.id}`} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1, borderBottom: '1px solid #F2F2F2', '&:last-child': { borderBottom: 'none' } }}>
              <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: a.type === 'HOMEWORK' ? '#E8F5E9' : '#EDE7F6', color: a.type === 'HOMEWORK' ? '#388E3C' : '#5E35B1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MenuBook fontSize="small" />
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" fontWeight={600} noWrap>{a.title ?? a.subject ?? a.type}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {a.subject ? `${a.subject} · ` : ''}{a.type === 'HOMEWORK' ? 'Homework' : 'Classwork'}
                  {a.dueDate ? ` · due ${fmtDate(a.dueDate)}` : a.date ? ` · ${fmtDate(a.date)}` : ''}
                </Typography>
              </Box>
            </Box>
          ))
        )}
      </SectionCard>
      </Grid>
      </Grid>
    </Box>
  );
}
