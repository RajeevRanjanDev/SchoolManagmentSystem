import {
  Box, Grid, Card, CardContent, Typography, Avatar, Chip, Stack,
  Table, TableBody, TableCell, TableHead, TableRow, Paper, LinearProgress,
  Divider, Button, CircularProgress,
} from '@mui/material';
import {
  School, MenuBook, AssignmentTurnedIn, Schedule, Group,
  CheckCircle, PendingActions, Today,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { teacherApi } from '@/api/teacher.api';
import { useAuth } from '@/hooks/useAuth';
import { initials } from '@/utils/formatters';
import type { TeacherDashboard, TimetablePeriod } from '@/types/teacher.types';
import { useNavigate } from 'react-router-dom';

const ACADEMIC_YEAR = '2024-2025';
const DAYS = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const SUBJECT_COLORS: Record<string, string> = {
  Mathematics: '#1565C0', Science: '#2E7D32', English: '#6A1B9A',
  Hindi: '#E65100', 'Social Studies': '#00695C', 'Computer Science': '#37474F',
  Physics: '#1565C0', Chemistry: '#558B2F', Biology: '#00695C',
  Geography: '#00838F', 'Physical Education': '#BF360C', 'Art & Craft': '#AD1457',
};

function subjectColor(subject: string) {
  return SUBJECT_COLORS[subject] ?? '#455A64';
}

const todayDow = new Date().getDay() || 7; // 1=Mon..7=Sun

export default function TeacherDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: dashboard, isLoading } = useQuery<TeacherDashboard>({
    queryKey: ['teacher-dashboard', ACADEMIC_YEAR],
    queryFn: () => teacherApi.getDashboard(),
    staleTime: 30_000,
  });

  const { data: timetable = [] } = useQuery<TimetablePeriod[]>({
    queryKey: ['teacher-timetable', dashboard?.teacherId, ACADEMIC_YEAR],
    queryFn: () => teacherApi.getMyTimetable(dashboard!.teacherId, ACADEMIC_YEAR),
    enabled: !!dashboard?.teacherId,
  });

  const todayPeriods = timetable
    .filter((p) => p.dayOfWeek === todayDow)
    .sort((a, b) => a.periodNumber - b.periodNumber);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  const d = dashboard;

  return (
    <Box sx={{ p: 3 }}>
      {/* ── Profile header ── */}
      <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 3, background: 'linear-gradient(135deg, #1565C0 0%, #1976D2 100%)' }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2.5} alignItems={{ sm: 'center' }}>
          <Avatar sx={{ width: 72, height: 72, bgcolor: 'rgba(255,255,255,0.2)', fontSize: 26, fontWeight: 700 }}>
            {d ? initials(d.teacherName.split(' ')[0], d.teacherName.split(' ').slice(1).join(' ')) : '?'}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h5" sx={{ color: '#fff', fontWeight: 700 }}>{d?.teacherName ?? 'Teacher'}</Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.75)', mt: 0.25 }}>
              {d?.employeeCode ?? ''} · Academic Year {d?.academicYear ?? ACADEMIC_YEAR}
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap', gap: 0.5 }}>
              {d?.classTeacherSections.map((ct) => (
                <Chip key={ct.sectionId}
                  label={`Class Teacher — ${ct.className}-${ct.sectionName}`}
                  size="small"
                  sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: 11 }} />
              ))}
            </Stack>
          </Box>
          <Stack direction="row" spacing={1} sx={{ mt: { xs: 1, sm: 0 } }}>
            <Button variant="outlined" size="small"
              sx={{ color: '#fff', borderColor: 'rgba(255,255,255,0.5)', '&:hover': { borderColor: '#fff' } }}
              onClick={() => navigate('/teacher/attendance')}>
              Student Attendance
            </Button>
            <Button variant="outlined" size="small"
              sx={{ color: '#fff', borderColor: 'rgba(255,255,255,0.5)', '&:hover': { borderColor: '#fff' } }}
              onClick={() => navigate('/teacher/homework')}>
              Post Homework
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {/* ── Stats row ── */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Sections', value: d?.totalSections ?? 0, icon: <Group />, color: '#1565C0' },
          { label: 'Subjects', value: d?.totalSubjects ?? 0, icon: <School />, color: '#2E7D32' },
          { label: 'Homework this week', value: d?.homeworkPostedThisWeek ?? 0, icon: <MenuBook />, color: '#6A1B9A' },
          { label: 'Classwork this week', value: d?.classworkPostedThisWeek ?? 0, icon: <AssignmentTurnedIn />, color: '#E65100' },
        ].map((s) => (
          <Grid item xs={6} sm={3} key={s.label}>
            <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #EBEBEB' }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: '14px !important' }}>
                <Box sx={{ p: 1, borderRadius: 2, bgcolor: `${s.color}15`, color: s.color, display: 'flex' }}>
                  {s.icon}
                </Box>
                <Box>
                  <Typography variant="h5" fontWeight={700} color={s.color}>{s.value}</Typography>
                  <Typography variant="caption" color="text.secondary">{s.label}</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* ── Today's timetable ── */}
        <Grid item xs={12} md={5}>
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid #EBEBEB', height: '100%' }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
              <Today color="primary" />
              <Typography variant="subtitle1" fontWeight={700}>
                Today — {DAYS[todayDow]}
              </Typography>
              <Chip label={`${todayPeriods.length} periods`} size="small" color="primary" variant="outlined" />
            </Stack>
            {todayPeriods.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Schedule sx={{ fontSize: 40, color: '#CBD5E1', mb: 1 }} />
                <Typography variant="body2" color="text.secondary">No classes today</Typography>
              </Box>
            ) : (
              <Stack spacing={1}>
                {todayPeriods.map((p) => (
                  <Box key={p.id} sx={{
                    display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5,
                    borderRadius: 2, bgcolor: `${subjectColor(p.subject)}10`,
                    border: `1px solid ${subjectColor(p.subject)}30`,
                  }}>
                    <Box sx={{
                      width: 36, height: 36, borderRadius: 2, display: 'flex', alignItems: 'center',
                      justifyContent: 'center', bgcolor: subjectColor(p.subject), color: '#fff',
                      fontWeight: 700, fontSize: 13, flexShrink: 0,
                    }}>
                      P{p.periodNumber}
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" fontWeight={600} noWrap>{p.subject}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {p.startTime?.slice(0, 5)} – {p.endTime?.slice(0, 5)}
                        {p.section && ` · ${p.section.name}`}
                        {p.roomNumber && ` · Room ${p.roomNumber}`}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Stack>
            )}
          </Paper>
        </Grid>

        {/* ── Assignments table ── */}
        <Grid item xs={12} md={7}>
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid #EBEBEB' }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
              <School color="primary" />
              <Typography variant="subtitle1" fontWeight={700}>My Assignments</Typography>
              <Chip label={`${d?.assignments?.length ?? 0} subjects`} size="small" variant="outlined" />
            </Stack>
            {!d?.assignments?.length ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <PendingActions sx={{ fontSize: 40, color: '#CBD5E1', mb: 1 }} />
                <Typography variant="body2" color="text.secondary">No assignments yet</Typography>
                <Typography variant="caption" color="text.secondary">Ask admin to assign you to a class</Typography>
              </Box>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ '& th': { fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', pb: 1 } }}>
                    <TableCell>Class</TableCell>
                    <TableCell>Section</TableCell>
                    <TableCell>Subject</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {d?.assignments.map((a) => (
                    <TableRow key={a.id} hover>
                      <TableCell sx={{ fontSize: '0.8rem' }}>{a.className}</TableCell>
                      <TableCell sx={{ fontSize: '0.8rem' }}>{a.sectionName}</TableCell>
                      <TableCell>
                        <Chip label={a.subjectName} size="small"
                          sx={{ bgcolor: `${subjectColor(a.subjectName)}15`, color: subjectColor(a.subjectName), fontWeight: 600 }} />
                      </TableCell>
                      <TableCell>
                        {a.classTeacher && <Chip label="Class Teacher" size="small" color="primary" variant="outlined" />}
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                          <Button size="small" onClick={() => navigate('/teacher/classwork')}>Classwork</Button>
                          <Button size="small" onClick={() => navigate('/teacher/homework')}>Homework</Button>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Paper>
        </Grid>

        {/* ── Weekly timetable overview ── */}
        <Grid item xs={12}>
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid #EBEBEB' }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
              <Schedule color="primary" />
              <Typography variant="subtitle1" fontWeight={700}>Weekly Schedule</Typography>
            </Stack>
            <Box sx={{ overflowX: 'auto' }}>
              <Table size="small" sx={{ minWidth: 600 }}>
                <TableHead>
                  <TableRow sx={{ '& th': { fontWeight: 700, fontSize: '0.75rem', textAlign: 'center' } }}>
                    <TableCell sx={{ width: 60 }}>Period</TableCell>
                    {[1,2,3,4,5].map((d) => (
                      <TableCell key={d} align="center"
                        sx={{ bgcolor: d === todayDow ? 'primary.50' : 'transparent', fontWeight: d === todayDow ? 700 : 400 }}>
                        {DAYS[d]}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {[1,2,3,4,5,6].map((period) => (
                    <TableRow key={period} hover>
                      <TableCell align="center" sx={{ fontWeight: 600, fontSize: '0.75rem', color: 'text.secondary' }}>
                        P{period}
                      </TableCell>
                      {[1,2,3,4,5].map((day) => {
                        const entry = timetable.find(t => t.dayOfWeek === day && t.periodNumber === period);
                        return (
                          <TableCell key={day} align="center"
                            sx={{ bgcolor: day === todayDow ? 'primary.50' : 'transparent', p: 0.75 }}>
                            {entry ? (
                              <Box sx={{
                                px: 1, py: 0.5, borderRadius: 1.5, fontSize: '0.75rem', fontWeight: 600,
                                bgcolor: `${subjectColor(entry.subject)}15`,
                                color: subjectColor(entry.subject),
                              }}>
                                {entry.subject.length > 10 ? entry.subject.split(' ')[0] : entry.subject}
                              </Box>
                            ) : (
                              <Typography variant="caption" color="text.disabled">—</Typography>
                            )}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
