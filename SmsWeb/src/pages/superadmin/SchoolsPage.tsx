import {
  Box, Card, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TextField, MenuItem, Button, Chip, CircularProgress, InputAdornment, TablePagination, Avatar,
  Tooltip, LinearProgress,
} from '@mui/material';
import { Search, Add, Business, Warning } from '@mui/icons-material';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { superAdminApi } from '@/api/superadmin.api';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { fmtDate, initials } from '@/utils/formatters';
import { STATUS_META, STATUS_OPTIONS } from './schoolStatus';
import SchoolDetailDrawer from './SchoolDetailDrawer';
import RegisterSchoolDialog from './RegisterSchoolDialog';

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana',
  'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana',
  'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi', 'Jammu and Kashmir', 'Ladakh',
  'Chandigarh', 'Puducherry', 'Andaman and Nicobar Islands', 'Dadra and Nagar Haveli and Daman and Diu', 'Lakshadweep',
];

export default function SchoolsPage() {
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>(params.get('status') ?? '');
  const [state, setState] = useState('');
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [registerOpen, setRegisterOpen] = useState(false);
  const openId = params.get('open') ? Number(params.get('open')) : null;

  const [alertsOnly, setAlertsOnly] = useState(params.get('alerts') === '1');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['sa-schools', status, search, page, size],
    queryFn: () => superAdminApi.listSchools({
      status: status || undefined, search: search || undefined, page, size,
    }),
    enabled: !alertsOnly,
  });
  const { data: alerts = [], isLoading: alertsLoading, refetch: refetchAlerts } = useQuery({
    queryKey: ['sa-alert-schools'],
    queryFn: superAdminApi.alertSchools,
    enabled: alertsOnly,
  });

  const schools = alertsOnly ? (alerts as any[]) : ((data as any)?.content ?? []);
  const total = alertsOnly ? (alerts as any[]).length : ((data as any)?.totalElements ?? 0);

  // State filter is applied client-side on the current page (backend filters status + search).
  const shown = state ? schools.filter((s: any) => s.state === state) : schools;

  const setOpenId = (id: number | null) => {
    const next = new URLSearchParams(params);
    if (id) next.set('open', String(id)); else next.delete('open');
    setParams(next, { replace: true });
  };

  return (
    <Box>
      <PageHeader
        title="Schools"
        subtitle="Register, search, and manage every school on the platform"
        crumbs={[{ label: 'Platform' }, { label: 'Schools' }]}
        action={
          <Button variant="contained" startIcon={<Add />} onClick={() => setRegisterOpen(true)}>
            Register School
          </Button>
        }
      />

      <Card sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            size="small" placeholder="Search name, code, email, phone…" value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            sx={{ flex: 1, minWidth: 240 }}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }}
          />
          <TextField select size="small" label="Show" value={alertsOnly ? 'ALERT' : (status || '')} sx={{ minWidth: 190 }}
            onChange={(e) => {
              const v = e.target.value;
              setPage(0);
              if (v === 'ALERT') { setAlertsOnly(true); }
              else { setAlertsOnly(false); setStatus(v); }
            }}>
            <MenuItem value="">All schools</MenuItem>
            <MenuItem value="ALERT">⚠ Alerts (needs attention)</MenuItem>
            {STATUS_OPTIONS.map((s) => <MenuItem key={s} value={s}>{STATUS_META[s].label}</MenuItem>)}
          </TextField>
          <TextField select size="small" label="State" value={state} sx={{ minWidth: 160 }}
            onChange={(e) => setState(e.target.value)}>
            <MenuItem value="">All states</MenuItem>
            {INDIAN_STATES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </TextField>
        </Box>
      </Card>

      <Card>
        {(alertsOnly ? alertsLoading : isLoading) ? (
          <Box sx={{ textAlign: 'center', py: 6 }}><CircularProgress /></Box>
        ) : shown.length === 0 ? (
          <EmptyState title={alertsOnly ? 'No schools in alert state' : 'No schools found'}
            description={alertsOnly ? 'All schools are within limits and subscriptions.' : 'Try a different search or register a new school.'}
            icon={<Business sx={{ fontSize: 64 }} />} />
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>School</TableCell>
                    <TableCell>Code</TableCell>
                    <TableCell>Plan</TableCell>
                    <TableCell>Usage (logins)</TableCell>
                    <TableCell>Subscription</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {shown.map((s: any) => {
                    const meta = STATUS_META[s.status] ?? STATUS_META.TRIAL;
                    const maxPct = Math.max(s.studentUsagePct ?? 0, s.teacherUsagePct ?? 0, s.parentUsagePct ?? 0);
                    const barColor = maxPct >= 90 ? '#E23744' : maxPct >= 75 ? '#F59E0B' : '#0C831F';
                    return (
                      <TableRow key={s.id} hover sx={{ cursor: 'pointer', bgcolor: s.usageAlert ? '#FEF2F2' : undefined }}
                        onClick={() => setOpenId(s.id)}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Avatar sx={{ width: 32, height: 32, bgcolor: s.usageAlert ? '#E23744' : 'primary.main', fontSize: 13 }}>
                              {initials(s.name, '')}
                            </Avatar>
                            <Box>
                              <Box sx={{ fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                {s.name}
                                {s.usageAlert && (
                                  <Tooltip title={s.alertReasons || 'Needs attention'}>
                                    <Warning sx={{ fontSize: 16, color: '#E23744' }} />
                                  </Tooltip>
                                )}
                              </Box>
                              <Box sx={{ fontSize: 12, color: 'text.secondary' }}>{s.email ?? '—'}</Box>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ fontFamily: 'monospace' }}>{s.code}</TableCell>
                        <TableCell>{s.subscriptionPlan ?? '—'}</TableCell>
                        <TableCell sx={{ minWidth: 180 }}>
                          <Box sx={{ fontSize: 12, mb: 0.25 }}>
                            S {s.studentCount ?? 0}/{s.maxStudents ?? '∞'} · Staff {s.teacherCount ?? 0}/{s.maxTeachers ?? '∞'}
                          </Box>
                          <LinearProgress variant="determinate" value={Math.min(100, maxPct)}
                            sx={{ height: 6, borderRadius: 3, bgcolor: '#EEE', '& .MuiLinearProgress-bar': { bgcolor: barColor } }} />
                        </TableCell>
                        <TableCell>
                          {s.subscriptionExpiry ? (
                            <Box sx={{ color: s.subscriptionExpired ? 'error.main' : s.subscriptionExpiringSoon ? '#B45309' : 'text.primary', fontSize: 13 }}>
                              {fmtDate(s.subscriptionExpiry)}
                              {s.subscriptionExpired ? ' · expired'
                                : s.subscriptionExpiringSoon ? ` · ${s.daysToExpiry}d left` : ''}
                            </Box>
                          ) : '—'}
                        </TableCell>
                        <TableCell>
                          <Chip size="small" label={meta.label} sx={{ bgcolor: `${meta.color}18`, color: meta.color, fontWeight: 600 }} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
            {!alertsOnly && (
              <TablePagination
                component="div"
                count={total}
                page={page}
                onPageChange={(_, p) => setPage(p)}
                rowsPerPage={size}
                onRowsPerPageChange={(e) => { setSize(parseInt(e.target.value, 10)); setPage(0); }}
                rowsPerPageOptions={[10, 20, 50]}
              />
            )}
          </>
        )}
      </Card>

      {openId && (
        <SchoolDetailDrawer schoolId={openId} onClose={() => setOpenId(null)}
          onChanged={() => { refetch(); refetchAlerts(); }} />
      )}
      <RegisterSchoolDialog
        open={registerOpen}
        onClose={() => setRegisterOpen(false)}
        onCreated={(id) => { setRegisterOpen(false); refetch(); refetchAlerts(); setOpenId(id); }}
      />
    </Box>
  );
}
