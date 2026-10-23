import {
  Box, Card, CardContent, Typography, Grid, Chip, CircularProgress,
  Button, IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Divider, Stack, Alert, Tooltip, Tabs, Tab,
  Table, TableBody, TableCell, TableHead, TableRow, InputAdornment,
} from '@mui/material';
import {
  DirectionsBus, Add, Edit, Delete, AddLocationAlt, Close, Person, Route as RouteIcon, Search, EditRoad, Download,
} from '@mui/icons-material';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { routesApi, transportStudentsApi } from '@/api/transport.api';
import type { TransportRoute, TransportRoutePayload, TransportStudent } from '@/api/transport.api';
import { teachersApi } from '@/api/teachers.api';
import { classesApi, sectionsApi } from '@/api/admin.api';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';

interface StopRow { stopName: string; pickupTime: string }

interface FormState {
  routeName: string;
  routeNumber: string;
  startPoint: string;
  endPoint: string;
  monthlyFee: string;
  inchargeTeacherId: string;
  stops: StopRow[];
}

const EMPTY_FORM: FormState = {
  routeName: '', routeNumber: '', startPoint: '', endPoint: '',
  monthlyFee: '', inchargeTeacherId: '', stops: [{ stopName: '', pickupTime: '' }],
};

export default function TransportPage() {
  const qc = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const [tab, setTab] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const { data: routes = [], isLoading } = useQuery({
    queryKey: ['transport-routes'],
    queryFn: () => routesApi.list(),
  });

  const { data: employees = [] } = useQuery<any[]>({
    queryKey: ['employees'],
    queryFn: () => teachersApi.list(),
    staleTime: 60_000,
  });

  const saveMutation = useMutation({
    mutationFn: (payload: TransportRoutePayload) =>
      editId ? routesApi.update(editId, payload) : routesApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transport-routes'] });
      enqueueSnackbar(editId ? 'Route updated' : 'Route created', { variant: 'success' });
      closeDialog();
    },
    onError: (e: any) =>
      enqueueSnackbar(e?.response?.data?.message ?? 'Failed to save route', { variant: 'error' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => routesApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transport-routes'] });
      enqueueSnackbar('Route deleted', { variant: 'success' });
    },
    onError: (e: any) =>
      enqueueSnackbar(e?.response?.data?.message ?? 'Failed to delete route', { variant: 'error' }),
  });

  function openCreate() {
    setEditId(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEdit(r: TransportRoute) {
    setEditId(r.id);
    setForm({
      routeName: r.routeName ?? '',
      routeNumber: r.routeNumber ?? '',
      startPoint: r.startPoint ?? '',
      endPoint: r.endPoint ?? '',
      monthlyFee: r.monthlyFee != null ? String(r.monthlyFee) : '',
      inchargeTeacherId: r.inchargeTeacherId != null ? String(r.inchargeTeacherId) : '',
      stops: r.stops?.length
        ? r.stops.map((s) => ({ stopName: s.stopName ?? '', pickupTime: s.pickupTime ?? '' }))
        : [{ stopName: '', pickupTime: '' }],
    });
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setEditId(null);
    setForm(EMPTY_FORM);
  }

  function updateStop(i: number, key: keyof StopRow, value: string) {
    setForm((f) => ({ ...f, stops: f.stops.map((s, idx) => (idx === i ? { ...s, [key]: value } : s)) }));
  }
  function addStop() {
    setForm((f) => ({ ...f, stops: [...f.stops, { stopName: '', pickupTime: '' }] }));
  }
  function removeStop(i: number) {
    setForm((f) => ({ ...f, stops: f.stops.filter((_, idx) => idx !== i) }));
  }

  function submit() {
    if (!form.routeName.trim() || !form.routeNumber.trim()) {
      enqueueSnackbar('Route name and number are required', { variant: 'warning' });
      return;
    }
    const payload: TransportRoutePayload = {
      routeName: form.routeName.trim(),
      routeNumber: form.routeNumber.trim(),
      startPoint: form.startPoint.trim() || undefined,
      endPoint: form.endPoint.trim() || undefined,
      monthlyFee: form.monthlyFee ? Number(form.monthlyFee) : undefined,
      inchargeTeacherId: form.inchargeTeacherId ? Number(form.inchargeTeacherId) : null,
      stops: form.stops
        .filter((s) => s.stopName.trim())
        .map((s) => ({ stopName: s.stopName.trim(), pickupTime: s.pickupTime.trim() || undefined })),
    };
    saveMutation.mutate(payload);
  }

  const empName = (e: any) => e.fullName ?? `${e.firstName ?? ''} ${e.lastName ?? ''}`.trim();

  return (
    <Box>
      <PageHeader
        title="Transport"
        subtitle="Manage bus routes, stops, route incharge and student route assignment"
        crumbs={[{ label: 'Dashboard', path: '/' }, { label: 'Transport' }]}
        action={
          tab === 0 ? (
            <Button variant="contained" startIcon={<Add />} onClick={openCreate}>
              New Route
            </Button>
          ) : undefined
        }
      />

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3, borderBottom: '1px solid #EBEBEB' }}>
        <Tab icon={<RouteIcon />} iconPosition="start" label="Routes" />
        <Tab icon={<Person />} iconPosition="start" label="Students & Routes" />
      </Tabs>

      {tab === 1 && <StudentsTab routes={routes} />}

      {tab === 0 && (isLoading ? (
        <Box sx={{ textAlign: 'center', py: 6 }}><CircularProgress /></Box>
      ) : !routes.length ? (
        <Card>
          <EmptyState
            title="No routes yet"
            description="Create your first bus route with stops and a route incharge."
            icon={<DirectionsBus sx={{ fontSize: 64 }} />}
          />
        </Card>
      ) : (
        <Grid container spacing={2}>
          {routes.map((r) => (
            <Grid item xs={12} md={6} key={r.id}>
              <Card sx={{ height: '100%' }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                      <Box sx={{
                        width: 42, height: 42, borderRadius: 2, bgcolor: '#E7F6EA',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0C831F',
                      }}>
                        <RouteIcon />
                      </Box>
                      <Box>
                        <Typography variant="subtitle1" fontWeight={700}>{r.routeName}</Typography>
                        <Chip label={r.routeNumber} size="small" sx={{ height: 20, fontSize: 11 }} />
                      </Box>
                    </Box>
                    <Box>
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => openEdit(r)}><Edit fontSize="small" /></IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" color="error"
                          onClick={() => { if (confirm(`Delete route ${r.routeNumber}?`)) deleteMutation.mutate(r.id); }}>
                          <Delete fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>

                  {(r.startPoint || r.endPoint) && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {r.startPoint || '—'} → {r.endPoint || '—'}
                    </Typography>
                  )}

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                    <Chip
                      icon={<Person />}
                      label={r.inchargeName ? `Incharge: ${r.inchargeName}` : 'No incharge'}
                      size="small"
                      variant="outlined"
                      color={r.inchargeName ? 'primary' : 'default'}
                    />
                    {r.monthlyFee != null && (
                      <Chip label={`₹${r.monthlyFee}/mo`} size="small" variant="outlined" />
                    )}
                  </Box>

                  <Divider sx={{ my: 1 }} />
                  <Typography variant="caption" fontWeight={700} color="text.secondary">
                    STOPS ({r.stops?.length ?? 0})
                  </Typography>
                  {r.stops?.length ? (
                    <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                      {r.stops.map((s, i) => (
                        <Box key={s.id ?? i} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip label={i + 1} size="small" sx={{ height: 18, minWidth: 18, fontSize: 10 }} />
                          <Typography variant="body2">{s.stopName}</Typography>
                          {s.pickupTime && (
                            <Typography variant="caption" color="text.disabled">· {s.pickupTime}</Typography>
                          )}
                        </Box>
                      ))}
                    </Stack>
                  ) : (
                    <Typography variant="body2" color="text.disabled" sx={{ mt: 0.5 }}>No stops added</Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ))}

      {/* Create / edit dialog */}
      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle fontWeight={700}>{editId ? 'Edit Route' : 'New Route'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0 }}>
            <Grid item xs={12} sm={8}>
              <TextField label="Route Name" fullWidth required value={form.routeName}
                onChange={(e) => setForm({ ...form, routeName: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField label="Route Number" fullWidth required value={form.routeNumber}
                placeholder="R-01"
                onChange={(e) => setForm({ ...form, routeNumber: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Start Point" fullWidth value={form.startPoint}
                onChange={(e) => setForm({ ...form, startPoint: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="End Point" fullWidth value={form.endPoint}
                onChange={(e) => setForm({ ...form, endPoint: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Monthly Fee (₹)" type="number" fullWidth value={form.monthlyFee}
                onChange={(e) => setForm({ ...form, monthlyFee: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField select label="Route Incharge" fullWidth value={form.inchargeTeacherId}
                onChange={(e) => setForm({ ...form, inchargeTeacherId: e.target.value })}>
                <MenuItem value=""><em>None</em></MenuItem>
                {employees.map((e: any) => (
                  <MenuItem key={e.id} value={String(e.id)}>
                    {empName(e)}{e.role ? ` · ${e.role}` : ''}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="subtitle2" fontWeight={700}>Stops</Typography>
                <Button size="small" startIcon={<AddLocationAlt />} onClick={addStop}>Add Stop</Button>
              </Box>
              {employees.length === 0 && (
                <Alert severity="info" sx={{ mt: 1 }}>
                  No employees found — add employees to assign a route incharge.
                </Alert>
              )}
              <Stack spacing={1.25} sx={{ mt: 1 }}>
                {form.stops.map((s, i) => (
                  <Box key={i} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Chip label={i + 1} size="small" sx={{ height: 22 }} />
                    <TextField label="Stop name" size="small" fullWidth value={s.stopName}
                      onChange={(e) => updateStop(i, 'stopName', e.target.value)} />
                    <TextField label="Time" size="small" sx={{ width: 120 }} value={s.pickupTime}
                      placeholder="07:45 AM"
                      onChange={(e) => updateStop(i, 'pickupTime', e.target.value)} />
                    <IconButton size="small" color="error" onClick={() => removeStop(i)}
                      disabled={form.stops.length === 1}>
                      <Close fontSize="small" />
                    </IconButton>
                  </Box>
                ))}
              </Stack>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button onClick={closeDialog} variant="outlined">Cancel</Button>
          <Button onClick={submit} variant="contained" disabled={saveMutation.isPending}>
            {saveMutation.isPending ? 'Saving...' : editId ? 'Update Route' : 'Create Route'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// ── Students & Routes tab ─────────────────────────────────────────────────────
function StudentsTab({ routes }: { routes: TransportRoute[] }) {
  const qc = useQueryClient();
  const [classId, setClassId] = useState<number | ''>('');
  const [sectionId, setSectionId] = useState<number | ''>('');
  const [routeId, setRouteId] = useState<number | ''>('');
  const [search, setSearch] = useState('');
  const [assignFor, setAssignFor] = useState<TransportStudent | null>(null);

  const { data: classes = [] } = useQuery<any[]>({ queryKey: ['classes'], queryFn: () => classesApi.list(), staleTime: 60_000 });
  const { data: sections = [] } = useQuery<any[]>({
    queryKey: ['sections-for-class', classId], queryFn: () => sectionsApi.listByClass(classId as number), enabled: !!classId,
  });

  const { data: students = [], isLoading } = useQuery<TransportStudent[]>({
    queryKey: ['transport-students', classId, sectionId, routeId, search],
    queryFn: () => transportStudentsApi.list({
      classId: classId || undefined, sectionId: sectionId || undefined,
      routeId: routeId || undefined, search: search || undefined,
    }),
  });

  const exportCsv = () => {
    // Sort by route so the export reads route-wise; respects the current filters.
    const sorted = [...students].sort((a, b) =>
      (a.routeName ?? 'zzz').localeCompare(b.routeName ?? 'zzz') || a.fullName.localeCompare(b.fullName));
    const header = ['Route', 'Stop', 'Pickup', 'Student', 'Admission No.', 'Class', 'Section', 'Transport Type'];
    const rows = sorted.map((s) => [
      s.routeName ?? 'Unassigned', s.stopName ?? '', s.pickupPoint ?? '', s.fullName,
      s.admissionNumber ?? '', s.className ?? '', s.sectionName ?? '', s.transportType ?? '',
    ]);
    const esc = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const csv = [header, ...rows].map((r) => r.map(esc).join(',')).join('\n');
    const label = routeId ? (routes.find((r) => r.id === routeId)?.routeName ?? 'route') : 'all-routes';
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const a = document.createElement('a');
    a.href = url; a.download = `transport-${label}.csv`.replace(/\s+/g, '-');
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30_000);
  };

  return (
    <Box>
      <Card sx={{ p: 2, mb: 2 }}>
        <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
          <TextField size="small" placeholder="Search name / admission no." value={search}
            onChange={(e) => setSearch(e.target.value)} sx={{ minWidth: 240, flex: 1 }}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }} />
          <TextField select size="small" label="Class" value={classId} sx={{ minWidth: 140 }}
            onChange={(e) => { setClassId(Number(e.target.value) || ''); setSectionId(''); }}>
            <MenuItem value="">All classes</MenuItem>
            {classes.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
          </TextField>
          <TextField select size="small" label="Section" value={sectionId} sx={{ minWidth: 140 }} disabled={!classId}
            onChange={(e) => setSectionId(Number(e.target.value) || '')}>
            <MenuItem value="">All sections</MenuItem>
            {sections.map((s) => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
          </TextField>
          <TextField select size="small" label="Route" value={routeId} sx={{ minWidth: 160 }}
            onChange={(e) => setRouteId(Number(e.target.value) || '')}>
            <MenuItem value="">All routes</MenuItem>
            {routes.map((r) => <MenuItem key={r.id} value={r.id}>{r.routeName}</MenuItem>)}
          </TextField>
          <Box sx={{ flex: 1 }} />
          <Button variant="outlined" startIcon={<Download />} disabled={students.length === 0} onClick={exportCsv}>
            Export CSV
          </Button>
        </Stack>
      </Card>

      <Card>
        {isLoading ? <Box sx={{ textAlign: 'center', py: 6 }}><CircularProgress /></Box> : students.length === 0 ? (
          <EmptyState title="No students found" description="Adjust the filters, or enrol students first." />
        ) : (
          <Table size="small">
            <TableHead><TableRow>
              <TableCell>Student</TableCell><TableCell>Class · Section</TableCell><TableCell>Admission</TableCell>
              <TableCell>Route</TableCell><TableCell>Stop</TableCell><TableCell>Pickup</TableCell><TableCell align="right">Action</TableCell>
            </TableRow></TableHead>
            <TableBody>
              {students.map((s) => (
                <TableRow key={s.profileId} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{s.fullName}</TableCell>
                  <TableCell>{[s.className, s.sectionName].filter(Boolean).join(' · ') || '—'}</TableCell>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>{s.admissionNumber ?? '—'}</TableCell>
                  <TableCell>{s.routeName ? <Chip size="small" label={s.routeName} color="primary" variant="outlined" /> : <Chip size="small" label="Unassigned" />}</TableCell>
                  <TableCell>{s.stopName ?? '—'}</TableCell>
                  <TableCell>{s.pickupPoint ?? '—'}</TableCell>
                  <TableCell align="right">
                    <Button size="small" startIcon={<EditRoad />} onClick={() => setAssignFor(s)}>
                      {s.routeId ? 'Change' : 'Assign'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {assignFor && <AssignRouteDialog student={assignFor} routes={routes} onClose={() => setAssignFor(null)}
        onSaved={() => { setAssignFor(null); qc.invalidateQueries({ queryKey: ['transport-students'] }); }} />}
    </Box>
  );
}

function AssignRouteDialog({ student, routes, onClose, onSaved }:
  { student: TransportStudent; routes: TransportRoute[]; onClose: () => void; onSaved: () => void }) {
  const { enqueueSnackbar } = useSnackbar();
  const [routeId, setRouteId] = useState<number | ''>(student.routeId ?? '');
  const [stopName, setStopName] = useState<string>(student.stopName ?? '');
  const [transportType, setTransportType] = useState<string>(student.transportType ?? 'BOTH');
  const route = routes.find((r) => r.id === routeId);

  const mut = useMutation({
    mutationFn: () => transportStudentsApi.assign(student.profileId, {
      transportRequired: !!routeId,
      routeId: routeId || null,
      routeName: route?.routeName,
      stopName: stopName || undefined,
      transportType,
    }),
    onSuccess: () => { enqueueSnackbar('Route assigned', { variant: 'success' }); onSaved(); },
    onError: (e: any) => enqueueSnackbar(e?.response?.data?.message ?? 'Could not assign route', { variant: 'error' }),
  });

  return (
    <Dialog open onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle fontWeight={700}>Assign route — {student.fullName}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Typography variant="caption" color="text.secondary">
            {[student.className, student.sectionName].filter(Boolean).join(' · ')} · {student.admissionNumber}
          </Typography>
          <TextField select label="Route" fullWidth value={routeId}
            onChange={(e) => { setRouteId(Number(e.target.value) || ''); setStopName(''); }}>
            <MenuItem value="">— No route (remove) —</MenuItem>
            {routes.map((r) => <MenuItem key={r.id} value={r.id}>{r.routeName}{r.routeNumber ? ` (${r.routeNumber})` : ''}</MenuItem>)}
          </TextField>
          {route && (
            <TextField select label="Stop" fullWidth value={stopName} onChange={(e) => setStopName(e.target.value)}
              helperText="Pickup time comes from the stop">
              {(route.stops ?? []).map((st) => (
                <MenuItem key={st.id ?? st.stopName} value={st.stopName}>
                  {st.stopName}{st.pickupTime ? ` · ${st.pickupTime}` : ''}
                </MenuItem>
              ))}
            </TextField>
          )}
          <TextField select label="Transport Type" fullWidth value={transportType} onChange={(e) => setTransportType(e.target.value)}>
            {['MORNING', 'EVENING', 'BOTH'].map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
          </TextField>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="outlined">Cancel</Button>
        <Button variant="contained" disabled={mut.isPending} onClick={() => mut.mutate()}>
          {mut.isPending ? 'Saving…' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
