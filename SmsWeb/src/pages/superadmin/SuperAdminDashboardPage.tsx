import { Box, Card, Grid, Typography, CircularProgress, Chip, Stack, Button, Divider } from '@mui/material';
import {
  Business, CheckCircle, HourglassTop, Block, People, Groups, School, ArrowForward, Warning,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { superAdminApi } from '@/api/superadmin.api';
import { PageHeader } from '@/components/common/PageHeader';
import { fmtDate } from '@/utils/formatters';
import { STATUS_META } from './schoolStatus';

export default function SuperAdminDashboardPage() {
  const navigate = useNavigate();

  const { data: stats, isLoading } = useQuery({ queryKey: ['sa-stats'], queryFn: superAdminApi.stats });
  const { data: recent } = useQuery({
    queryKey: ['sa-recent-schools'],
    queryFn: () => superAdminApi.listSchools({ page: 0, size: 6 }),
  });
  const recentSchools = (recent as any)?.content ?? [];

  const tiles = [
    { label: 'Total Schools', value: stats?.totalTenants, icon: <Business />, color: '#0C831F' },
    { label: 'Active', value: stats?.activeTenants, icon: <CheckCircle />, color: '#0C831F', status: 'ACTIVE' },
    { label: 'Trial / Pending', value: stats?.trialTenants, icon: <HourglassTop />, color: '#F59E0B', status: 'TRIAL' },
    { label: 'Suspended', value: stats?.suspendedTenants, icon: <Block />, color: '#E23744', status: 'SUSPENDED' },
    { label: 'Needs Attention', value: stats?.alertSchools, icon: <Warning />, color: '#E23744', alerts: true },
  ];

  const usage = [
    { label: 'Students', value: stats?.totalStudents, icon: <People />, color: '#2E6FF2' },
    { label: 'Teachers', value: stats?.totalTeachers, icon: <Groups />, color: '#7C3AED' },
    { label: 'Total Users', value: stats?.totalUsers, icon: <School />, color: '#0277BD' },
  ];

  return (
    <Box>
      <PageHeader
        title="Platform Dashboard"
        subtitle="Overview of all schools on the platform"
        crumbs={[{ label: 'Platform' }, { label: 'Dashboard' }]}
      />

      {isLoading ? (
        <Box sx={{ textAlign: 'center', py: 6 }}><CircularProgress /></Box>
      ) : (
        <>
          <Grid container spacing={2} sx={{ mb: 1 }}>
            {tiles.map((t) => (
              <Grid item xs={6} md={2.4} key={t.label}>
                <Card
                  sx={{ p: 2.5, cursor: (t.status || (t as any).alerts) ? 'pointer' : 'default', '&:hover': (t.status || (t as any).alerts) ? { boxShadow: 3 } : {} }}
                  onClick={() => {
                    if ((t as any).alerts) navigate('/admin/schools?alerts=1');
                    else if (t.status) navigate(`/admin/schools?status=${t.status}`);
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: `${t.color}18`, color: t.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {t.icon}
                    </Box>
                    <Box>
                      <Typography variant="h4" fontWeight={800}>{t.value ?? 0}</Typography>
                      <Typography variant="body2" color="text.secondary">{t.label}</Typography>
                    </Box>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Grid container spacing={2} sx={{ mb: 3 }}>
            {usage.map((t) => (
              <Grid item xs={12} md={4} key={t.label}>
                <Card sx={{ p: 2.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: `${t.color}18`, color: t.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {t.icon}
                    </Box>
                    <Box>
                      <Typography variant="h5" fontWeight={800}>{t.value ?? 0}</Typography>
                      <Typography variant="body2" color="text.secondary">{t.label}</Typography>
                    </Box>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Card sx={{ p: 2.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
              <Typography variant="h6" fontWeight={700}>Recently Registered Schools</Typography>
              <Button size="small" endIcon={<ArrowForward />} onClick={() => navigate('/admin/schools')}>
                View all
              </Button>
            </Box>
            <Divider sx={{ mb: 1 }} />
            {recentSchools.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>No schools yet.</Typography>
            ) : (
              <Stack divider={<Divider />}>
                {recentSchools.map((s: any) => {
                  const meta = STATUS_META[s.status] ?? STATUS_META.TRIAL;
                  return (
                    <Box key={s.id} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 1.25, cursor: 'pointer' }}
                      onClick={() => navigate(`/admin/schools?open=${s.id}`)}>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>{s.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {s.code}{s.city ? ` · ${s.city}` : ''}{s.createdAt ? ` · ${fmtDate(s.createdAt)}` : ''}
                        </Typography>
                      </Box>
                      <Chip size="small" label={meta.label} sx={{ bgcolor: `${meta.color}18`, color: meta.color, fontWeight: 600 }} />
                    </Box>
                  );
                })}
              </Stack>
            )}
          </Card>
        </>
      )}
    </Box>
  );
}
