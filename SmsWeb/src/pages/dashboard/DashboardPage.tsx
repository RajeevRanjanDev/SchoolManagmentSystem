import { Grid, Card, Typography, Box, Skeleton, Chip } from '@mui/material';
import {
  People, School, AssignmentTurnedIn, AccountBalance,
  EventNote,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import { dashboardApi } from '@/api/dashboard.api';
import { StatCard } from '@/components/common/StatCard';
import { useAuth } from '@/hooks/useAuth';
import { fmtCurrency } from '@/utils/formatters';
import { brand } from '@/theme/theme';

const ATTENDANCE_DATA = [
  { day: 'Mon', present: 420 },
  { day: 'Tue', present: 415 },
  { day: 'Wed', present: 430 },
  { day: 'Thu', present: 405 },
  { day: 'Fri', present: 425 },
];

const FEE_PIE = [
  { name: 'Paid', value: 68, color: brand.green },
  { name: 'Pending', value: 22, color: brand.yellow },
  { name: 'Overdue', value: 10, color: '#E23744' },
];

const CARDS = [
  { title: 'Total Students', key: 'totalStudents', icon: <People />, color: '#0C831F', trend: 4.2 },
  { title: 'Total Teachers', key: 'totalTeachers', icon: <School />, color: '#2E6FF2', trend: 1.1 },
  { title: 'Present Today', key: 'presentToday', icon: <AssignmentTurnedIn />, color: '#00A389', trend: 2.8 },
  { title: 'Pending Fees', key: 'pendingFees', icon: <AccountBalance />, color: '#FF8A00', currency: true, trend: -3.4 },
  { title: 'Upcoming Exams', key: 'upcomingExams', icon: <EventNote />, color: '#7C3AED' },
];

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: dashboardApi.getStats,
    staleTime: 60_000,
  });

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <Box>
      {/* Hero greeting banner */}
      <Card
        sx={{
          mb: 3.5,
          p: { xs: 3, md: 4 },
          position: 'relative',
          overflow: 'hidden',
          border: 'none',
          background: 'linear-gradient(120deg, #0C831F 0%, #16A34A 55%, #1DA837 100%)',
          color: '#fff',
        }}
      >
        <Box sx={{ position: 'absolute', right: -30, top: -40, width: 220, height: 220, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.08)' }} />
        <Box sx={{ position: 'absolute', right: 80, bottom: -70, width: 180, height: 180, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.06)' }} />
        <Box sx={{ position: 'relative' }}>
          <Chip
            label={today}
            size="small"
            sx={{ bgcolor: 'rgba(255,255,255,0.18)', color: '#fff', fontWeight: 600, mb: 1.5, backdropFilter: 'blur(4px)' }}
          />
          <Typography variant="h4" fontWeight={800} sx={{ mb: 0.5 }}>
            {greeting()}, {user?.firstName}! 👋
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.85)', fontWeight: 500, maxWidth: 520 }}>
            Here's what's happening across your school today. Everything's running smoothly.
          </Typography>
        </Box>
      </Card>

      {/* Stat cards */}
      <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
        {CARDS.map((card) => (
          <Grid item xs={12} sm={6} md={4} lg={2} key={card.key}>
            {isLoading ? (
              <Skeleton variant="rounded" height={140} sx={{ borderRadius: 4 }} />
            ) : (
              <StatCard
                title={card.title}
                value={
                  card.currency
                    ? fmtCurrency((stats as any)?.[card.key] ?? 0)
                    : ((stats as any)?.[card.key] ?? 0)
                }
                icon={card.icon}
                color={card.color}
                trend={card.trend}
              />
            )}
          </Grid>
        ))}
      </Grid>

      {/* Charts */}
      <Grid container spacing={2.5}>
        <Grid item xs={12} md={8}>
          <Card sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box>
                <Typography variant="h6" fontWeight={700}>Weekly Attendance</Typography>
                <Typography variant="body2" color="text.secondary">Students present over the week</Typography>
              </Box>
              <Chip label="This week" size="small" color="success" />
            </Box>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={ATTENDANCE_DATA} margin={{ left: -18, right: 8, top: 8 }}>
                <defs>
                  <linearGradient id="attGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={brand.green} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={brand.green} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke="#EEF1F3" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#9AA0A6' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#9AA0A6' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: '1px solid #EDEFF1', boxShadow: '0 8px 24px rgba(16,24,40,0.12)' }}
                />
                <Area
                  type="monotone"
                  dataKey="present"
                  name="Present"
                  stroke={brand.green}
                  strokeWidth={3}
                  fill="url(#attGrad)"
                  dot={{ r: 4, fill: brand.green, strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" fontWeight={700}>Fee Collection</Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>Current term breakdown</Typography>

            <Box sx={{ position: 'relative' }}>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={FEE_PIE} cx="50%" cy="50%" innerRadius={66} outerRadius={92} paddingAngle={3} dataKey="value" stroke="none">
                    {FEE_PIE.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => `${v}%`} contentStyle={{ borderRadius: 12, border: '1px solid #EDEFF1' }} />
                </PieChart>
              </ResponsiveContainer>
              <Box sx={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                <Typography variant="h4" fontWeight={800} color="success.main">68%</Typography>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>Collected</Typography>
              </Box>
            </Box>

            <Box sx={{ mt: 1.5 }}>
              {FEE_PIE.map((f) => (
                <Box key={f.name} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 0.6 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: f.color }} />
                    <Typography variant="body2" fontWeight={600}>{f.name}</Typography>
                  </Box>
                  <Typography variant="body2" fontWeight={700} color="text.secondary">{f.value}%</Typography>
                </Box>
              ))}
            </Box>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
