import {
  Box, Card, Grid, Typography, CircularProgress, Chip, TextField, MenuItem,
  Table, TableBody, TableCell, TableHead, TableRow, TablePagination,
  Drawer, IconButton, Button, Stack, Divider,
} from '@mui/material';
import {
  BugReport, Business, CreditCard, ReportProblem, Close, Warning,
} from '@mui/icons-material';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { operationsApi, type ErrorLog } from '@/api/operations.api';
import { superAdminApi } from '@/api/superadmin.api';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { fmtDate } from '@/utils/formatters';

const SEV_COLOR: Record<string, any> = { CRITICAL: 'error', ERROR: 'error', WARN: 'warning' };
const TIME_RANGES = [{ label: 'Last hour', hours: 1 }, { label: 'Last 24 hours', hours: 24 }, { label: 'Last 7 days', hours: 168 }];

function Tile({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <Card sx={{ p: 2.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: `${color}18`, color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</Box>
        <Box>
          <Typography variant="h4" fontWeight={800}>{value ?? 0}</Typography>
          <Typography variant="body2" color="text.secondary">{label}</Typography>
        </Box>
      </Box>
    </Card>
  );
}

export default function OperationsPage() {
  const [hours, setHours] = useState(24);
  const [schoolId, setSchoolId] = useState<number | ''>('');
  const [service, setService] = useState('');
  const [severity, setSeverity] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(25);
  const [openId, setOpenId] = useState<number | null>(null);

  const { data: summary } = useQuery({ queryKey: ['ops-summary', hours], queryFn: () => operationsApi.summary(hours), refetchInterval: 60_000 });
  const { data: services = [] } = useQuery({ queryKey: ['ops-services'], queryFn: operationsApi.services });
  const { data: schoolsPage } = useQuery({ queryKey: ['sa-schools-all'], queryFn: () => superAdminApi.listSchools({ size: 200 }) });
  const schools = (schoolsPage as any)?.content ?? [];

  const { data, isLoading } = useQuery({
    queryKey: ['ops-errors', schoolId, service, severity, status, hours, page, size],
    queryFn: () => operationsApi.errors({
      schoolId: schoolId || undefined, service: service || undefined, severity: severity || undefined,
      status: status || undefined, hours, page, size,
    }),
  });
  const rows = (data as any)?.content ?? [];
  const total = (data as any)?.totalElements ?? 0;

  return (
    <Box>
      <PageHeader title="Operations & System Health" subtitle="Platform-wide failures and incidents"
        crumbs={[{ label: 'Platform' }, { label: 'Operations' }]} />

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={6} md={3}><Tile icon={<BugReport />} label="System errors" value={summary?.systemErrors ?? 0} color="#E23744" /></Grid>
        <Grid item xs={6} md={3}><Tile icon={<Business />} label="Affected schools" value={summary?.affectedSchools ?? 0} color="#F59E0B" /></Grid>
        <Grid item xs={6} md={3}><Tile icon={<CreditCard />} label="Failed payments" value={summary?.failedPayments ?? 0} color="#7C3AED" /></Grid>
        <Grid item xs={6} md={3}><Tile icon={<ReportProblem />} label="Critical incidents" value={summary?.criticalIncidents ?? 0} color="#B91C1C" /></Grid>
      </Grid>

      <Card sx={{ p: 2, mb: 2 }}>
        <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
          <TextField select size="small" label="Time range" value={hours} sx={{ minWidth: 150 }}
            onChange={(e) => { setHours(Number(e.target.value)); setPage(0); }}>
            {TIME_RANGES.map((t) => <MenuItem key={t.hours} value={t.hours}>{t.label}</MenuItem>)}
          </TextField>
          <TextField select size="small" label="Severity" value={severity} sx={{ minWidth: 140 }}
            onChange={(e) => { setSeverity(e.target.value); setPage(0); }}>
            <MenuItem value="">All levels</MenuItem>
            <MenuItem value="WARN">Warnings</MenuItem>
            <MenuItem value="ERROR">Errors</MenuItem>
            <MenuItem value="CRITICAL">Critical</MenuItem>
          </TextField>
          <TextField select size="small" label="Service" value={service} sx={{ minWidth: 150 }}
            onChange={(e) => { setService(e.target.value); setPage(0); }}>
            <MenuItem value="">All services</MenuItem>
            {(services as string[]).map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </TextField>
          <TextField select size="small" label="School" value={schoolId} sx={{ minWidth: 180 }}
            onChange={(e) => { setSchoolId(Number(e.target.value) || ''); setPage(0); }}>
            <MenuItem value="">All schools</MenuItem>
            {schools.map((s: any) => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
          </TextField>
          <TextField select size="small" label="Status" value={status} sx={{ minWidth: 150 }}
            onChange={(e) => { setStatus(e.target.value); setPage(0); }}>
            <MenuItem value="">All statuses</MenuItem>
            <MenuItem value="OPEN">Open</MenuItem>
            <MenuItem value="INVESTIGATING">Investigating</MenuItem>
            <MenuItem value="RESOLVED">Resolved</MenuItem>
          </TextField>
        </Stack>
      </Card>

      <Card>
        {isLoading ? <Box sx={{ textAlign: 'center', py: 6 }}><CircularProgress /></Box> : rows.length === 0 ? (
          <EmptyState title="No failures" description="No errors captured for the selected filters." icon={<BugReport sx={{ fontSize: 64 }} />} />
        ) : (
          <>
            <Table size="small">
              <TableHead><TableRow>
                <TableCell>Severity</TableCell><TableCell>Service</TableCell><TableCell>Message</TableCell>
                <TableCell>School</TableCell><TableCell>×</TableCell><TableCell>Status</TableCell><TableCell>Last seen</TableCell>
              </TableRow></TableHead>
              <TableBody>
                {rows.map((e: ErrorLog) => (
                  <TableRow key={e.id} hover sx={{ cursor: 'pointer' }} onClick={() => setOpenId(e.id)}>
                    <TableCell>
                      <Chip size="small" label={e.severity} color={SEV_COLOR[e.severity] ?? 'default'}
                        icon={e.severity === 'CRITICAL' ? <Warning sx={{ fontSize: 14 }} /> : undefined} />
                    </TableCell>
                    <TableCell>{e.service}</TableCell>
                    <TableCell sx={{ maxWidth: 360, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {e.errorCode ? <b>{e.errorCode}: </b> : ''}{e.message}
                    </TableCell>
                    <TableCell>{e.schoolName ?? (e.schoolId ? `#${e.schoolId}` : 'Platform')}</TableCell>
                    <TableCell>{e.occurrenceCount > 1 ? e.occurrenceCount : ''}</TableCell>
                    <TableCell><Chip size="small" variant="outlined" label={e.status}
                      color={e.status === 'RESOLVED' ? 'success' : e.status === 'INVESTIGATING' ? 'info' : 'warning'} /></TableCell>
                    <TableCell>{fmtDate(e.lastSeenAt ?? e.createdAt, 'DD MMM, HH:mm')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <TablePagination component="div" count={total} page={page} rowsPerPage={size}
              onPageChange={(_, p) => setPage(p)} onRowsPerPageChange={(e) => { setSize(parseInt(e.target.value, 10)); setPage(0); }}
              rowsPerPageOptions={[25, 50, 100]} />
          </>
        )}
      </Card>

      {openId && <ErrorDetailDrawer id={openId} onClose={() => setOpenId(null)} />}
    </Box>
  );
}

function ErrorDetailDrawer({ id, onClose }: { id: number; onClose: () => void }) {
  const qc = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const { data: e, isLoading } = useQuery({ queryKey: ['ops-error', id], queryFn: () => operationsApi.detail(id) });
  const [note, setNote] = useState('');

  const resolveMut = useMutation({
    mutationFn: (newStatus: string) => operationsApi.resolve(id, { status: newStatus, note }),
    onSuccess: () => {
      enqueueSnackbar('Incident updated', { variant: 'success' });
      qc.invalidateQueries({ queryKey: ['ops-error', id] });
      qc.invalidateQueries({ queryKey: ['ops-errors'] });
      qc.invalidateQueries({ queryKey: ['ops-summary'] });
    },
    onError: (err: any) => enqueueSnackbar(err?.response?.data?.message ?? 'Failed', { variant: 'error' }),
  });

  const row = (label: string, value: any) => value ? (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.75, borderBottom: '1px solid #F2F2F2', gap: 2 }}>
      <Typography variant="body2" color="text.secondary">{label}</Typography>
      <Typography variant="body2" fontWeight={500} sx={{ textAlign: 'right', wordBreak: 'break-all' }}>{value}</Typography>
    </Box>
  ) : null;

  return (
    <Drawer anchor="right" open onClose={onClose} PaperProps={{ sx: { width: { xs: '100%', sm: 620 } } }}>
      {isLoading || !e ? <Box sx={{ textAlign: 'center', py: 10 }}><CircularProgress /></Box> : (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Box sx={{ p: 2.5, bgcolor: e.severity === 'CRITICAL' ? '#B91C1C' : '#E23744', color: '#fff' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box>
                <Chip size="small" label={e.severity} sx={{ bgcolor: 'rgba(255,255,255,0.25)', color: '#fff', fontWeight: 700, mb: 0.5 }} />
                <Typography variant="subtitle1" fontWeight={800}>{e.errorCode ?? 'Error'}</Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>{e.service} · {e.schoolName ?? 'Platform'}</Typography>
              </Box>
              <IconButton onClick={onClose} sx={{ color: '#fff' }}><Close /></IconButton>
            </Box>
          </Box>

          <Box sx={{ flex: 1, overflowY: 'auto', p: 2.5 }}>
            <Typography variant="body2" sx={{ mb: 2, whiteSpace: 'pre-wrap' }}>{e.message}</Typography>
            {row('Occurrences', e.occurrenceCount)}
            {row('First seen', e.createdAt ? fmtDate(e.createdAt, 'DD MMM YYYY, HH:mm') : null)}
            {row('Last seen', e.lastSeenAt ? fmtDate(e.lastSeenAt, 'DD MMM YYYY, HH:mm') : null)}
            {row('Request', [e.httpMethod, e.httpPath].filter(Boolean).join(' '))}
            {row('HTTP status', e.httpStatus)}
            {row('Request ID', e.requestId)}
            {row('Trace ID', e.traceId)}
            {row('User ID', e.userId)}
            {row('Reference', e.referenceType ? `${e.referenceType} #${e.referenceId ?? ''}` : null)}
            {row('Environment', e.environment)}

            {e.stackTrace && (
              <>
                <Typography variant="subtitle2" fontWeight={700} sx={{ mt: 2, mb: 1 }}>Stack trace</Typography>
                <Box component="pre" sx={{ bgcolor: '#1E1E1E', color: '#E5E5E5', p: 1.5, borderRadius: 2, fontSize: 11, overflowX: 'auto', maxHeight: 300 }}>
                  {e.stackTrace}
                </Box>
              </>
            )}

            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>Resolution</Typography>
            {e.resolutionNote && <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{e.resolutionNote}</Typography>}
            <TextField fullWidth multiline minRows={2} size="small" placeholder="Investigation / resolution notes"
              value={note} onChange={(ev) => setNote(ev.target.value)} sx={{ mb: 1.5 }} />
            <Stack direction="row" spacing={1}>
              <Button variant="outlined" color="info" disabled={resolveMut.isPending}
                onClick={() => resolveMut.mutate('INVESTIGATING')}>Investigating</Button>
              <Button variant="contained" color="success" disabled={resolveMut.isPending}
                onClick={() => resolveMut.mutate('RESOLVED')}>Mark resolved</Button>
            </Stack>
            <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 1 }}>
              Current status: {e.status}
            </Typography>
          </Box>
        </Box>
      )}
    </Drawer>
  );
}
