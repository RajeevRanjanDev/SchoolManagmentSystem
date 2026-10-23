import {
  Drawer, Box, Typography, Divider, Chip, Avatar, Button,
  Tab, Tabs, CircularProgress, Stack, Alert,
  Table, TableBody, TableCell, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, FormControlLabel, Checkbox,
  IconButton, Paper, Grid,
} from '@mui/material';
import {
  Person, School, FamilyRestroom, LocationOn,
  Description, Timeline, CheckCircle, HourglassEmpty,
  Cancel, Edit, DirectionsBus, Hotel, Add, Delete,
  AccountBalanceWallet, Diversity3, LockReset, LocalHospital,
} from '@mui/icons-material';
import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { useSnackbar } from 'notistack';
import { admissionApi, transportRoutesApi } from '@/api/admission.api';
import { feesApi } from '@/api/fees.api';
import { classesApi, sectionsApi } from '@/api/admin.api';
import { fmtDate, fmtCurrency, initials } from '@/utils/formatters';
import type { StudentProfile, StudentHistoryEntry } from '@/types/student.types';

const DOC_TYPES = [
  'STUDENT_PHOTO','AADHAAR_CARD','BIRTH_CERTIFICATE','PREVIOUS_MARKSHEET',
  'TRANSFER_CERTIFICATE','ADDRESS_PROOF','PARENT_ID_PROOF',
];

const STATUS_COLOR: Record<string, any> = {
  APPLICANT: 'info', ADMISSION_REVIEW: 'warning', ADMITTED: 'primary',
  ENROLLED: 'success', PROMOTED: 'success', TRANSFERRED: 'secondary',
  DROPPED: 'error', PASSED_OUT: 'secondary', ALUMNI: 'default',
};

const GUARDIAN_RELATIONS = ['FATHER','MOTHER','GRANDPARENT','UNCLE','AUNT','SIBLING','LEGAL_GUARDIAN','OTHER'];
const TRANSPORT_TYPES = ['MORNING','EVENING','BOTH'];
const HOSTEL_TYPES = ['BOYS','GIRLS','MIXED'];

interface Props { studentId: number; onClose: () => void; onRefresh: () => void; }

export default function StudentDetailDrawer({ studentId, onClose, onRefresh }: Props) {
  const qc = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [tab, setTab] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadType, setUploadType] = useState('');

  const { data: student, isLoading } = useQuery<StudentProfile>({
    queryKey: ['admission-student', studentId],
    queryFn: () => admissionApi.getById(studentId),
  });

  const { data: history = [] } = useQuery<StudentHistoryEntry[]>({
    queryKey: ['admission-history', studentId],
    queryFn: () => admissionApi.getHistory(studentId),
    enabled: tab === 7,
  });

  const { data: fees = [] } = useQuery<any[]>({
    queryKey: ['student-fees', studentId],
    queryFn: () => feesApi.getByStudent(studentId),
    enabled: tab === 8,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['admission-student', studentId] });
    onRefresh();
  };

  const uploadMutation = useMutation({
    mutationFn: ({ file, type }: { file: File; type: string }) =>
      admissionApi.uploadDocument(studentId, type, file),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admission-student', studentId] }),
  });

  const verifyMutation = useMutation({
    mutationFn: ({ docId, status }: { docId: number; status: string }) =>
      admissionApi.verifyDocument(studentId, docId, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admission-student', studentId] }),
  });

  const admitMutation = useMutation({
    mutationFn: () => admissionApi.admit(studentId, { effectiveDate: new Date().toISOString().split('T')[0] }),
    onSuccess: invalidate,
  });
  const resetPwdMutation = useMutation({
    mutationFn: () => admissionApi.resetPassword(studentId),
    onSuccess: (msg) => enqueueSnackbar(msg, { variant: 'success' }),
    onError: (e: any) => enqueueSnackbar(e?.response?.data?.message ?? 'Failed to reset password', { variant: 'error' }),
  });

  const enrollMutation = useMutation({
    mutationFn: () => admissionApi.enroll(studentId, { effectiveDate: new Date().toISOString().split('T')[0] }),
    onSuccess: invalidate,
  });

  const handleFileSelect = (docType: string) => { setUploadType(docType); fileInputRef.current?.click(); };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && uploadType) uploadMutation.mutate({ file, type: uploadType });
    e.target.value = '';
  };

  return (
    <Drawer anchor="right" open onClose={onClose}
      PaperProps={{ sx: { width: { xs: '100%', sm: 620 } } }}>
      <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileChange}
        accept=".pdf,.jpg,.jpeg,.png" />
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <CircularProgress />
        </Box>
      ) : !student ? null : (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* Header */}
          <Box sx={{ p: 3, bgcolor: 'primary.main', color: '#fff' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar src={student.profilePhotoUrl} sx={{ width: 56, height: 56, bgcolor: 'primary.dark', fontSize: 20 }}>
                {initials(student.firstName ?? '', student.lastName ?? '')}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" fontWeight={700}>{student.fullName}</Typography>
                <Typography variant="caption" sx={{ opacity: 0.85 }}>{student.studentCode}</Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Chip label={student.lifecycleStatus?.replace(/_/g, ' ')} size="small"
                    sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: 11 }} />
                </Box>
              </Box>
            </Box>
            <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: 'wrap', gap: 1 }}>
              {student.lifecycleStatus === 'APPLICANT' && (
                <Button size="small" variant="outlined" sx={{ color: '#fff', borderColor: 'rgba(255,255,255,0.5)' }}
                  onClick={() => admitMutation.mutate()} disabled={admitMutation.isPending}>
                  Admit
                </Button>
              )}
              {student.lifecycleStatus === 'ADMITTED' && (
                <Button size="small" variant="outlined" sx={{ color: '#fff', borderColor: 'rgba(255,255,255,0.5)' }}
                  onClick={() => enrollMutation.mutate()} disabled={enrollMutation.isPending}>
                  Confirm Enrollment
                </Button>
              )}
              <Button size="small" variant="outlined" startIcon={<LockReset />}
                sx={{ color: '#fff', borderColor: 'rgba(255,255,255,0.5)' }}
                disabled={resetPwdMutation.isPending}
                onClick={() => { if (confirm('Generate a temporary password and email it to this student?')) resetPwdMutation.mutate(); }}>
                Reset password
              </Button>
            </Stack>
          </Box>

          <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ px: 1, borderBottom: '1px solid #EBEBEB' }}
            variant="scrollable" scrollButtons="auto">
            <Tab icon={<Person />} iconPosition="start" label="Profile" />
            <Tab icon={<School />} iconPosition="start" label="Academic" />
            <Tab icon={<FamilyRestroom />} iconPosition="start" label="Guardians" />
            <Tab icon={<DirectionsBus />} iconPosition="start" label="Transport" />
            <Tab icon={<LocalHospital />} iconPosition="start" label="Medical" />
            <Tab icon={<Hotel />} iconPosition="start" label="Hostel" />
            <Tab icon={<Description />} iconPosition="start" label="Documents" />
            <Tab icon={<Timeline />} iconPosition="start" label="History" />
            <Tab icon={<AccountBalanceWallet />} iconPosition="start" label="Fees" />
            <Tab icon={<Diversity3 />} iconPosition="start" label="Siblings" />
          </Tabs>

          <Box sx={{ flex: 1, overflowY: 'auto', p: 3 }}>
            {tab === 0 && <ProfileTab student={student} onSaved={invalidate} />}
            {tab === 1 && <AcademicTab student={student} onSaved={invalidate} />}
            {tab === 2 && <GuardiansTab student={student} onSaved={invalidate} />}
            {tab === 3 && <TransportTab student={student} onSaved={invalidate} />}
            {tab === 4 && <MedicalTab student={student} onSaved={invalidate} />}
            {tab === 5 && <HostelTab student={student} onSaved={invalidate} />}
            {tab === 6 && (
              <DocumentsTab student={student}
                onUpload={handleFileSelect}
                onVerify={(docId, status) => verifyMutation.mutate({ docId, status })}
                uploading={uploadMutation.isPending}
              />
            )}
            {tab === 7 && <HistoryTab history={history} />}
            {tab === 8 && <FeesTab fees={fees} />}
            {tab === 9 && <SiblingsTab student={student} />}
          </Box>

          <Divider />
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button onClick={onClose} variant="outlined">Close</Button>
          </Box>
        </Box>
      )}
    </Drawer>
  );
}

// ── Profile Tab ───────────────────────────────────────────────────────────────
function ProfileTab({ student, onSaved }: { student: StudentProfile; onSaved: () => void }) {
  const { enqueueSnackbar } = useSnackbar();
  const [editing, setEditing] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<any>({
    defaultValues: { mobile: student.mobile ?? '', email: student.email ?? '' },
  });

  useEffect(() => {
    if (editing) reset({ mobile: student.mobile ?? '', email: student.email ?? '' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing]);

  const mutation = useMutation({
    mutationFn: (data: any) => admissionApi.updateContact(student.id, { mobile: data.mobile, email: data.email }),
    onSuccess: () => { setEditing(false); onSaved(); enqueueSnackbar('Contact details updated', { variant: 'success' }); },
    onError: (e: any) => enqueueSnackbar(e?.response?.data?.message ?? 'Could not update contact details', { variant: 'error' }),
  });

  const rows = [
    ['Admission Number', student.admissionNumber],
    ['Enrollment Number', student.enrollmentNumber ?? '—'],
    ['Date of Birth', fmtDate(student.dateOfBirth)],
    ['Gender', student.gender],
    ['Blood Group', student.bloodGroup ?? '—'],
    ['Category', student.category ?? '—'],
    ['Nationality', student.nationality ?? '—'],
    ['Mobile', student.mobile ?? '—'],
    ['Email', student.email ?? '—'],
    ['Admission Date', fmtDate(student.admissionDate)],
    ['Admission Type', student.admissionType ?? '—'],
  ];

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button size="small" startIcon={<Edit />} variant="outlined" onClick={() => setEditing(!editing)}>
          {editing ? 'Cancel' : 'Edit Mobile / Email'}
        </Button>
      </Box>

      {editing && (
        <Box component="form" onSubmit={handleSubmit((d) => mutation.mutate(d))} sx={{ mb: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField label="Mobile *" fullWidth
                {...register('mobile', { required: 'Mobile is required', pattern: { value: /^[6-9]\d{9}$/, message: 'Enter a valid 10-digit mobile' } })}
                error={!!errors.mobile} helperText={errors.mobile?.message as string} />
            </Grid>
            <Grid item xs={6}>
              <TextField label="Email *" fullWidth
                {...register('email', { required: 'Email is required', pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email' } })}
                error={!!errors.email} helperText={errors.email?.message as string} />
            </Grid>
            <Grid item xs={12}>
              <Button type="submit" variant="contained" disabled={mutation.isPending} fullWidth>
                Save Contact Details
              </Button>
            </Grid>
          </Grid>
        </Box>
      )}

      <Stack spacing={0}>
        {rows.map(([label, value]) => (
          <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', py: 1.25, borderBottom: '1px solid #F0F0F0' }}>
            <Typography variant="body2" color="text.secondary">{label}</Typography>
            <Typography variant="body2" fontWeight={500}>{value}</Typography>
          </Box>
        ))}
      </Stack>
    </>
  );
}

// ── Academic Tab ──────────────────────────────────────────────────────────────
function AcademicTab({ student, onSaved }: { student: StudentProfile; onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const { register, handleSubmit, control, watch, reset } = useForm<any>({
    defaultValues: {
      targetClassId: student.academic?.classId ?? '',
      targetSectionId: student.academic?.sectionId ?? '',
      targetAcademicSession: student.academic?.academicSession ?? '',
      remarks: '',
      effectiveDate: new Date().toISOString().split('T')[0],
    },
  });
  const selectedClass = watch('targetClassId');

  const { data: classes = [] } = useQuery<any[]>({ queryKey: ['classes'], queryFn: () => classesApi.list(), staleTime: 60_000 });
  const { data: sections = [] } = useQuery<any[]>({
    queryKey: ['sections-by-class', selectedClass],
    queryFn: () => sectionsApi.listByClass(Number(selectedClass)),
    enabled: !!selectedClass,
  });

  const mutation = useMutation({
    mutationFn: (data: any) => admissionApi.assignClassSection(student.id, data),
    onSuccess: () => { setOpen(false); reset(); onSaved(); },
  });

  const ap = student.academic;
  const rows = [
    ['Institution Type', ap?.institutionType],
    ['Academic Session', ap?.academicSession],
    ['Class', ap?.className ?? '—'],
    ['Section', ap?.sectionName ?? '—'],
    ['Roll Number', ap?.rollNumber ?? '—'],
    ['Program', ap?.program ?? '—'],
    ['Course', ap?.course ?? '—'],
    ['Department', ap?.department ?? '—'],
    ['Branch', ap?.branch ?? '—'],
    ['Semester', ap?.semester ?? '—'],
    ['Batch', ap?.batchName ?? '—'],
  ];

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button size="small" startIcon={<Edit />} variant="outlined" onClick={() => setOpen(true)}>
          Assign Class / Section
        </Button>
      </Box>
      <Stack spacing={0}>
        {rows.map(([label, value]) => (
          <Box key={label as string} sx={{ display: 'flex', justifyContent: 'space-between', py: 1.25, borderBottom: '1px solid #F0F0F0' }}>
            <Typography variant="body2" color="text.secondary">{label}</Typography>
            <Typography variant="body2" fontWeight={500}>{value as string}</Typography>
          </Box>
        ))}
      </Stack>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Assign Class / Section</DialogTitle>
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))}>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 0 }}>
              <Grid item xs={6}>
                <Controller name="targetClassId" control={control}
                  render={({ field }) => (
                    <TextField select label="Class *" fullWidth {...field} value={field.value ?? ''}>
                      {(classes as any[]).map((c: any) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                    </TextField>
                  )} />
              </Grid>
              <Grid item xs={6}>
                <Controller name="targetSectionId" control={control}
                  render={({ field }) => (
                    <TextField select label="Section" fullWidth {...field} value={field.value ?? ''} disabled={!selectedClass}>
                      <MenuItem value="">— None —</MenuItem>
                      {(sections as any[]).map((s: any) => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
                    </TextField>
                  )} />
              </Grid>
              <Grid item xs={6}><TextField label="Academic Session" fullWidth {...register('targetAcademicSession')} /></Grid>
              <Grid item xs={6}><TextField label="Effective Date" type="date" fullWidth InputLabelProps={{ shrink: true }} {...register('effectiveDate')} /></Grid>
              <Grid item xs={12}><TextField label="Remarks" fullWidth {...register('remarks')} /></Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={mutation.isPending}>Save</Button>
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
}

// ── Guardians Tab ─────────────────────────────────────────────────────────────
function GuardiansTab({ student, onSaved }: { student: StudentProfile; onSaved: () => void }) {
  const [editing, setEditing] = useState(false);
  const { control, register, handleSubmit, reset } = useForm<any>({
    defaultValues: { guardians: student.guardians?.length ? student.guardians.map((g: any) => ({ ...g, firstName: g.fullName?.split(' ')[0] ?? '', lastName: g.fullName?.split(' ').slice(1).join(' ') ?? '', relation: g.relation })) : [{ relation: 'FATHER', firstName: '', mobile: '', primary: true }] },
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'guardians' });

  const mutation = useMutation({
    mutationFn: (data: any) => admissionApi.updateGuardians(student.id, data.guardians),
    onSuccess: () => { setEditing(false); onSaved(); },
  });

  if (!editing) {
    return (
      <>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <Button size="small" startIcon={<Edit />} variant="outlined" onClick={() => { reset(); setEditing(true); }}>
            Edit Guardians
          </Button>
        </Box>
        <Stack spacing={2}>
          {(student.guardians ?? []).map((g: any) => (
            <Paper key={g.id} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography fontWeight={600}>{g.fullName}</Typography>
                <Stack direction="row" spacing={0.5}>
                  <Chip label={g.relation} size="small" variant="outlined" />
                  {g.primary && <Chip label="Primary" size="small" color="primary" />}
                </Stack>
              </Box>
              <Typography variant="body2" color="text.secondary">Mobile: {g.mobile ?? '—'}</Typography>
              <Typography variant="body2" color="text.secondary">Email: {g.email ?? '—'}</Typography>
              <Typography variant="body2" color="text.secondary">Occupation: {g.occupation ?? '—'}</Typography>
            </Paper>
          ))}
          {(!student.guardians || student.guardians.length === 0) && (
            <Typography color="text.secondary" variant="body2">No guardians recorded.</Typography>
          )}
        </Stack>
      </>
    );
  }

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="subtitle2">Edit Guardians</Typography>
        <Button size="small" startIcon={<Add />}
          onClick={() => append({ relation: 'MOTHER', firstName: '', mobile: '', primary: false })}>
          Add
        </Button>
      </Box>
      <Stack spacing={2}>
        {fields.map((field, i) => (
          <Paper key={field.id} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
              <Typography variant="body2" fontWeight={600}>Guardian {i + 1}</Typography>
              {i > 0 && <IconButton size="small" color="error" onClick={() => remove(i)}><Delete fontSize="small" /></IconButton>}
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <Controller name={`guardians.${i}.relation`} control={control}
                  render={({ field }) => (
                    <TextField select label="Relation *" fullWidth {...field} value={field.value ?? ''}>
                      {GUARDIAN_RELATIONS.map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
                    </TextField>
                  )} />
              </Grid>
              <Grid item xs={4}><TextField label="First Name *" fullWidth {...register(`guardians.${i}.firstName`, { required: true })} /></Grid>
              <Grid item xs={4}><TextField label="Last Name" fullWidth {...register(`guardians.${i}.lastName`)} /></Grid>
              <Grid item xs={4}><TextField label="Mobile" fullWidth {...register(`guardians.${i}.mobile`)} /></Grid>
              <Grid item xs={4}><TextField label="Email" fullWidth {...register(`guardians.${i}.email`)} /></Grid>
              <Grid item xs={4}><TextField label="Occupation" fullWidth {...register(`guardians.${i}.occupation`)} /></Grid>
              <Grid item xs={4}>
                <Controller name={`guardians.${i}.primary`} control={control}
                  render={({ field }) => (
                    <FormControlLabel control={<Checkbox checked={!!field.value} onChange={field.onChange} />} label="Primary" />
                  )} />
              </Grid>
            </Grid>
          </Paper>
        ))}
      </Stack>
      <Stack direction="row" spacing={1} sx={{ mt: 2, justifyContent: 'flex-end' }}>
        <Button onClick={() => setEditing(false)}>Cancel</Button>
        <Button type="submit" variant="contained" disabled={mutation.isPending}>Save Guardians</Button>
      </Stack>
    </form>
  );
}

// ── Transport Tab ─────────────────────────────────────────────────────────────
function TransportTab({ student, onSaved }: { student: StudentProfile; onSaved: () => void }) {
  const [editing, setEditing] = useState(false);
  const t = (student as any).transport ?? {};
  const { handleSubmit, control, watch, setValue, reset } = useForm<any>({
    defaultValues: { transportRequired: false, routeId: '', routeName: '', stopName: '', transportType: 'BOTH' },
  });
  const transportRequired = watch('transportRequired');

  const { data: routes = [] } = useQuery<any[]>({
    queryKey: ['transport-routes'],
    queryFn: () => transportRoutesApi.list(),
    staleTime: 60_000,
    enabled: editing,
  });

  // Prefill the form from the saved transport detail whenever edit mode opens.
  useEffect(() => {
    if (editing) {
      reset({
        transportRequired: !!t.transportRequired,
        routeId: t.routeId ? String(t.routeId) : '',
        routeName: t.routeName ?? '',
        stopName: t.stopName ?? '',
        transportType: t.transportType ?? 'BOTH',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing]);

  // Stops of the chosen route drive the Stop Name dropdown.
  const selectedRouteId = watch('routeId');
  const selectedRoute = (routes as any[]).find((r) => String(r.id) === String(selectedRouteId));
  const routeStops: any[] = selectedRoute?.stops ?? [];

  const mutation = useMutation({
    mutationFn: (data: any) => admissionApi.updateTransport(student.id, { ...data, routeId: data.routeId || null }),
    onSuccess: () => { setEditing(false); onSaved(); },
  });

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button size="small" startIcon={<Edit />} variant="outlined" onClick={() => setEditing(!editing)}>
          {editing ? 'Cancel' : 'Assign / Update Transport'}
        </Button>
      </Box>

      {!editing ? (
        <Stack spacing={0}>
          {[
            ['Transport Required', t.transportRequired ? 'Yes' : 'No'],
            ['Route', t.routeName || '—'],
            ['Stop', t.stopName || '—'],
            ['Pickup Time', t.pickupPoint || '—'],
            ['Type', t.transportType || '—'],
          ].map(([label, value]) => (
            <Box key={label as string} sx={{ display: 'flex', justifyContent: 'space-between', py: 1.25, borderBottom: '1px solid #F0F0F0' }}>
              <Typography variant="body2" color="text.secondary">{label}</Typography>
              <Typography variant="body2" fontWeight={500}>{value as string}</Typography>
            </Box>
          ))}
          <Box sx={{ py: 2 }}>
            <Typography variant="body2" color="text.secondary">Click "Assign / Update Transport" to set or change the transport route for this student.</Typography>
          </Box>
        </Stack>
      ) : (
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Controller name="transportRequired" control={control}
                render={({ field }) => (
                  <FormControlLabel control={<Checkbox checked={!!field.value} onChange={field.onChange} />} label="Transport required" />
                )} />
            </Grid>
            {transportRequired && (
              <>
                <Grid item xs={12}>
                  <Controller name="routeId" control={control}
                    render={({ field }) => (
                      <TextField select label="Route" fullWidth {...field} value={field.value ?? ''}
                        onChange={(e) => {
                          field.onChange(e);
                          const r = (routes as any[]).find((x) => String(x.id) === String(e.target.value));
                          setValue('routeName', r?.routeName ?? '');
                          setValue('stopName', '');
                        }}>
                        <MenuItem value="">— No route —</MenuItem>
                        {(routes as any[]).map((r: any) => (
                          <MenuItem key={r.id} value={r.id}>{r.routeName}{r.routeNumber ? ` (${r.routeNumber})` : ''}</MenuItem>
                        ))}
                      </TextField>
                    )} />
                </Grid>
                <Grid item xs={6}>
                  <Controller name="stopName" control={control}
                    render={({ field }) => (
                      routeStops.length > 0 ? (
                        <TextField select label="Stop Name" fullWidth {...field} value={field.value ?? ''}
                          helperText="Stops from the selected route (pickup time comes from the stop)">
                          {routeStops.map((s: any) => (
                            <MenuItem key={s.id ?? s.stopName} value={s.stopName}>
                              {s.stopName}{s.pickupTime ? ` · ${s.pickupTime}` : ''}
                            </MenuItem>
                          ))}
                        </TextField>
                      ) : (
                        <TextField label="Stop Name" fullWidth {...field} value={field.value ?? ''}
                          helperText={selectedRouteId ? 'This route has no stops — type one' : 'Select a route first'} />
                      )
                    )} />
                </Grid>
                <Grid item xs={6}>
                  <Controller name="transportType" control={control}
                    render={({ field }) => (
                      <TextField select label="Transport Type" fullWidth {...field} value={field.value ?? ''}>
                        {TRANSPORT_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                      </TextField>
                    )} />
                </Grid>
              </>
            )}
            <Grid item xs={12}>
              <Button type="submit" variant="contained" disabled={mutation.isPending} fullWidth>
                Save Transport
              </Button>
            </Grid>
          </Grid>
        </form>
      )}
    </>
  );
}

// ── Medical Tab ───────────────────────────────────────────────────────────────
function MedicalTab({ student, onSaved }: { student: StudentProfile; onSaved: () => void }) {
  const { enqueueSnackbar } = useSnackbar();
  const [editing, setEditing] = useState(false);
  const m = (student as any).medical ?? {};
  const { register, handleSubmit, reset } = useForm<any>({ defaultValues: m });

  useEffect(() => {
    if (editing) {
      reset({
        bloodGroup: m.bloodGroup ?? '',
        medicalConditions: m.medicalConditions ?? '',
        allergies: m.allergies ?? '',
        disabilityType: m.disabilityType ?? '',
        disabilityDetails: m.disabilityDetails ?? '',
        disabilityPercentage: m.disabilityPercentage ?? '',
        emergencyMedicalNotes: m.emergencyMedicalNotes ?? '',
        familyDoctorName: m.familyDoctorName ?? '',
        familyDoctorMobile: m.familyDoctorMobile ?? '',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing]);

  const mutation = useMutation({
    mutationFn: (data: any) => admissionApi.updateMedical(student.id, {
      ...data,
      disabilityPercentage: data.disabilityPercentage === '' || data.disabilityPercentage == null
        ? null : Number(data.disabilityPercentage),
    }),
    onSuccess: () => { setEditing(false); onSaved(); enqueueSnackbar('Medical details saved', { variant: 'success' }); },
    onError: (e: any) => enqueueSnackbar(e?.response?.data?.message ?? 'Could not save medical details', { variant: 'error' }),
  });

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button size="small" startIcon={<Edit />} variant="outlined" onClick={() => setEditing(!editing)}>
          {editing ? 'Cancel' : 'Add / Update Medical'}
        </Button>
      </Box>

      {!editing ? (
        <Stack spacing={0}>
          {[
            ['Blood Group', m.bloodGroup || '—'],
            ['Medical Conditions', m.medicalConditions || '—'],
            ['Allergies', m.allergies || '—'],
            ['Disability Type', m.disabilityType || '—'],
            ['Disability Details', m.disabilityDetails || '—'],
            ['Disability %', m.disabilityPercentage != null ? String(m.disabilityPercentage) : '—'],
            ['Emergency Notes', m.emergencyMedicalNotes || '—'],
            ['Family Doctor', m.familyDoctorName || '—'],
            ['Doctor Mobile', m.familyDoctorMobile || '—'],
          ].map(([label, value]) => (
            <Box key={label as string} sx={{ display: 'flex', justifyContent: 'space-between', py: 1.25, borderBottom: '1px solid #F0F0F0' }}>
              <Typography variant="body2" color="text.secondary">{label}</Typography>
              <Typography variant="body2" fontWeight={500} sx={{ textAlign: 'right', maxWidth: '60%' }}>{value as string}</Typography>
            </Box>
          ))}
        </Stack>
      ) : (
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))}>
          <Grid container spacing={2}>
            <Grid item xs={6}><TextField label="Blood Group" fullWidth {...register('bloodGroup')} /></Grid>
            <Grid item xs={6}><TextField label="Disability Type" fullWidth {...register('disabilityType')} /></Grid>
            <Grid item xs={12}><TextField label="Medical Conditions" fullWidth multiline minRows={2} {...register('medicalConditions')} /></Grid>
            <Grid item xs={12}><TextField label="Allergies" fullWidth multiline minRows={2} {...register('allergies')} /></Grid>
            <Grid item xs={8}><TextField label="Disability Details" fullWidth {...register('disabilityDetails')} /></Grid>
            <Grid item xs={4}><TextField label="Disability %" type="number" fullWidth inputProps={{ min: 0, max: 100 }} {...register('disabilityPercentage')} /></Grid>
            <Grid item xs={12}><TextField label="Emergency Medical Notes" fullWidth multiline minRows={2} {...register('emergencyMedicalNotes')} /></Grid>
            <Grid item xs={6}><TextField label="Family Doctor Name" fullWidth {...register('familyDoctorName')} /></Grid>
            <Grid item xs={6}><TextField label="Family Doctor Mobile" fullWidth {...register('familyDoctorMobile')} /></Grid>
            <Grid item xs={12}>
              <Button type="submit" variant="contained" disabled={mutation.isPending} fullWidth>
                Save Medical Details
              </Button>
            </Grid>
          </Grid>
        </form>
      )}
    </>
  );
}

// ── Hostel Tab ────────────────────────────────────────────────────────────────
function HostelTab({ student, onSaved }: { student: StudentProfile; onSaved: () => void }) {
  const [editing, setEditing] = useState(false);
  const { register, handleSubmit, control, watch } = useForm<any>({
    defaultValues: { hostelRequired: false, hostelName: '', roomNumber: '', hostelType: 'BOYS' },
  });
  const hostelRequired = watch('hostelRequired');

  const mutation = useMutation({
    mutationFn: (data: any) => admissionApi.update(student.id, { hostelInfo: data }),
    onSuccess: () => { setEditing(false); onSaved(); },
  });

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button size="small" startIcon={<Edit />} variant="outlined" onClick={() => setEditing(!editing)}>
          {editing ? 'Cancel' : 'Assign / Update Hostel'}
        </Button>
      </Box>
      {!editing ? (
        <Box sx={{ py: 2 }}>
          <Typography variant="body2" color="text.secondary">Click "Assign / Update Hostel" to manage hostel assignment for this student.</Typography>
        </Box>
      ) : (
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Controller name="hostelRequired" control={control}
                render={({ field }) => (
                  <FormControlLabel control={<Checkbox checked={!!field.value} onChange={field.onChange} />} label="Hostel required" />
                )} />
            </Grid>
            {hostelRequired && (
              <>
                <Grid item xs={6}><TextField label="Hostel Name" fullWidth {...register('hostelName')} /></Grid>
                <Grid item xs={6}><TextField label="Room Number" fullWidth {...register('roomNumber')} /></Grid>
                <Grid item xs={6}>
                  <Controller name="hostelType" control={control}
                    render={({ field }) => (
                      <TextField select label="Hostel Type" fullWidth {...field} value={field.value ?? ''}>
                        {HOSTEL_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                      </TextField>
                    )} />
                </Grid>
              </>
            )}
            <Grid item xs={12}>
              <Button type="submit" variant="contained" disabled={mutation.isPending} fullWidth>Save Hostel</Button>
            </Grid>
          </Grid>
        </form>
      )}
    </>
  );
}

// ── Documents Tab ─────────────────────────────────────────────────────────────
function DocumentsTab({ student, onUpload, onVerify, uploading }: {
  student: StudentProfile;
  onUpload: (type: string) => void;
  onVerify: (docId: number, status: string) => void;
  uploading: boolean;
}) {
  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell>Document</TableCell>
          <TableCell>Status</TableCell>
          <TableCell align="right">Action</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {DOC_TYPES.map((docType) => {
          const uploaded = (student.documents ?? []).find((d: any) => d.documentType === docType);
          return (
            <TableRow key={docType}>
              <TableCell sx={{ fontSize: '0.8rem' }}>{docType.replace(/_/g, ' ')}</TableCell>
              <TableCell>
                {!uploaded ? <Chip label="Missing" size="small" variant="outlined" />
                  : uploaded.status === 'VERIFIED' ? <Chip icon={<CheckCircle />} label="Verified" size="small" color="success" />
                  : uploaded.status === 'REJECTED' ? <Chip icon={<Cancel />} label="Rejected" size="small" color="error" />
                  : <Chip icon={<HourglassEmpty />} label="Pending" size="small" color="warning" />}
              </TableCell>
              <TableCell align="right">
                {!uploaded ? (
                  <Button size="small" onClick={() => onUpload(docType)} disabled={uploading}>Upload</Button>
                ) : uploaded.status === 'PENDING' ? (
                  <Stack direction="row" spacing={0.5}>
                    <Button size="small" color="success" onClick={() => onVerify(uploaded.id, 'VERIFIED')}>Verify</Button>
                    <Button size="small" color="error" onClick={() => onVerify(uploaded.id, 'REJECTED')}>Reject</Button>
                  </Stack>
                ) : (
                  <Button size="small" onClick={() => onUpload(docType)}>Replace</Button>
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

// ── Fees Tab ──────────────────────────────────────────────────────────────────
const FEE_COLOR: Record<string, any> = {
  PAID: 'success', PENDING: 'warning', PARTIAL: 'warning', OVERDUE: 'error', WAIVED: 'default',
};
function FeesTab({ fees }: { fees: any[] }) {
  const outstanding = fees
    .filter((f) => f.status !== 'PAID' && f.status !== 'WAIVED')
    .reduce((sum, f) => sum + ((f.amount ?? 0) - (f.paidAmount ?? 0) - (f.discount ?? 0) + (f.fine ?? 0)), 0);
  const paidCount = fees.filter((f) => f.status === 'PAID').length;
  const overdue = fees.some((f) => f.status === 'OVERDUE');

  return (
    <Box>
      {/* Summary */}
      <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, mb: 2, bgcolor: outstanding > 0 ? '#FFF6D9' : '#E7F6EA', borderColor: 'transparent' }}>
        <Typography variant="caption" color="text.secondary" fontWeight={600}>OUTSTANDING BALANCE</Typography>
        <Typography variant="h5" fontWeight={800} color={overdue ? 'error.main' : outstanding > 0 ? '#8A5B00' : 'success.main'}>
          {fmtCurrency(Math.max(0, outstanding))}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
          <Chip size="small" label={outstanding <= 0 ? 'All clear' : overdue ? 'Overdue dues' : 'Dues pending'}
            color={outstanding <= 0 ? 'success' : overdue ? 'error' : 'warning'} />
          <Chip size="small" variant="outlined" label={`${paidCount}/${fees.length} paid`} />
        </Box>
      </Paper>

      {fees.length === 0 ? (
        <Typography variant="body2" color="text.secondary">No fee records for this student yet.</Typography>
      ) : (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Category</TableCell>
              <TableCell>Due Date</TableCell>
              <TableCell align="right">Amount</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {fees.map((f) => (
              <TableRow key={f.id}>
                <TableCell sx={{ fontWeight: 600 }}>{f.feeCategory ?? f.feePeriod ?? 'Fee'}</TableCell>
                <TableCell>{fmtDate(f.dueDate)}</TableCell>
                <TableCell align="right">{fmtCurrency(f.amount ?? 0)}</TableCell>
                <TableCell><Chip size="small" label={f.status} color={FEE_COLOR[f.status] ?? 'default'} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Box>
  );
}

// ── Siblings Tab ──────────────────────────────────────────────────────────────
function SiblingsTab({ student }: { student: StudentProfile }) {
  const primary = (student.guardians ?? []).find((g: any) => g.primary) ?? student.guardians?.[0];
  const mobile = primary?.mobile;

  const { data, isLoading } = useQuery<any>({
    queryKey: ['siblings', mobile],
    queryFn: () => admissionApi.list({ search: mobile!, size: 50 }),
    enabled: !!mobile,
  });

  const siblings = (data?.content ?? []).filter((s: any) => s.id !== student.id);

  if (!mobile) {
    return <Typography variant="body2" color="text.secondary">Add a primary guardian with a mobile number to link siblings.</Typography>;
  }

  return (
    <Box>
      <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 3, mb: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Diversity3 color="primary" />
        <Box>
          <Typography variant="body2" fontWeight={600}>{primary?.fullName ?? 'Primary guardian'}</Typography>
          <Typography variant="caption" color="text.secondary">Linked by mobile {mobile} · one parent, multiple children</Typography>
        </Box>
      </Paper>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}><CircularProgress size={26} /></Box>
      ) : siblings.length === 0 ? (
        <Typography variant="body2" color="text.secondary">No other children linked to this guardian.</Typography>
      ) : (
        <Stack spacing={1.5}>
          {siblings.map((s: any) => (
            <Paper key={s.id} variant="outlined" sx={{ p: 1.5, borderRadius: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar src={s.profilePhotoUrl} sx={{ width: 40, height: 40, bgcolor: 'secondary.main', color: '#1C1C1C', fontWeight: 700 }}>
                {initials(s.firstName ?? '', s.lastName ?? '')}
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" fontWeight={600}>{s.fullName}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {s.admissionNumber ?? s.studentCode}
                  {s.academic?.className ? ` · ${s.academic.className}${s.academic.sectionName ? '-' + s.academic.sectionName : ''}` : ''}
                </Typography>
              </Box>
              <Chip size="small" label={s.lifecycleStatus?.replace(/_/g, ' ')} variant="outlined" />
            </Paper>
          ))}
        </Stack>
      )}
    </Box>
  );
}

// ── History Tab ───────────────────────────────────────────────────────────────
function HistoryTab({ history }: { history: StudentHistoryEntry[] }) {
  if (!history.length) {
    return <Typography color="text.secondary" variant="body2">No history records found.</Typography>;
  }
  return (
    <Box sx={{ position: 'relative', pl: 3, '&::before': { content: '""', position: 'absolute', left: 12, top: 8, bottom: 8, width: 2, bgcolor: '#EBEBEB' } }}>
      {history.map((h, i) => (
        <Box key={h.id ?? i} sx={{ display: 'flex', gap: 2, mb: 3, position: 'relative' }}>
          <Box sx={{ width: 16, height: 16, borderRadius: '50%', bgcolor: i === 0 ? 'primary.main' : 'grey.400', flexShrink: 0, mt: 0.25 }} />
          <Box>
            <Typography variant="body2" fontWeight={600}>
              {h.fromStatus ? `${h.fromStatus.replace(/_/g, ' ')} → ` : ''}{h.toStatus.replace(/_/g, ' ')}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {h.action} · {fmtDate(h.effectiveDate)} · by {h.changedBy ?? 'System'}
            </Typography>
            {h.remarks && <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', fontStyle: 'italic' }}>{h.remarks}</Typography>}
          </Box>
        </Box>
      ))}
    </Box>
  );
}
