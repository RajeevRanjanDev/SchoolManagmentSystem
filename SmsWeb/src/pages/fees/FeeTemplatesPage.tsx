import {
  Box, Button, Card, Grid, Typography, Chip, CircularProgress, Divider,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
  IconButton, Menu, ListItemIcon, Switch, FormControlLabel, Alert,
  Avatar,
} from '@mui/material';
import {
  Add, MoreVert, Edit, DeleteOutline, ToggleOn, ToggleOff, Groups2,
  ReceiptLong, Payments,
} from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { feeTemplatesApi, type CreateFeeTemplateRequest } from '@/api/fees.api';
import { classesApi, sectionsApi } from '@/api/admin.api';
import { attendanceApi } from '@/api/attendance.api';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { fmtCurrency } from '@/utils/formatters';
import { academicYears, currentAcademicYear } from '@/utils/academicYears';
import { useNavigate } from 'react-router-dom';

const FEE_TYPES = ['TUITION', 'ACTIVITY', 'TRANSPORT', 'EXAM', 'LIBRARY', 'ADMISSION', 'OTHER'];
const FREQUENCIES = ['MONTHLY', 'QUARTERLY', 'HALF_YEARLY', 'ANNUAL', 'ONE_TIME'];
const CONCESSIONS = ['NONE', 'FIXED', 'PERCENT'];

const DEFAULTS: CreateFeeTemplateRequest = {
  name: '', feeType: 'TUITION', amount: 0, frequency: 'MONTHLY',
  dueDayOfMonth: 10, graceDays: 5, lateFeeEnabled: true, lateFeeAmount: 100,
  repeatedLateFeeAmount: 50, partialAllowed: false, minPartialPercent: 50, reminderDaysBefore: 3,
  reminderOnDueDate: true, reminderDaysAfter: 5, concessionType: 'NONE',
  concessionValue: 0, academicYear: currentAcademicYear(), status: 'ACTIVE',
};

const TYPE_COLOR: Record<string, string> = {
  TUITION: '#0C831F', ACTIVITY: '#7C3AED', TRANSPORT: '#2E6FF2',
  EXAM: '#FF8A00', LIBRARY: '#0EA5B5', ADMISSION: '#E23744', OTHER: '#5A5A5A',
};

export default function FeeTemplatesPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<any | null>(null);
  const [assignTarget, setAssignTarget] = useState<any | null>(null);
  const [scope, setScope] = useState<'CLASS' | 'SECTION' | 'STUDENT'>('CLASS');
  const [applyClassId, setApplyClassId] = useState<number | ''>('');
  const [applySectionId, setApplySectionId] = useState<number | ''>('');
  const [applyStudentId, setApplyStudentId] = useState<number | ''>('');
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [menu, setMenu] = useState<{ el: HTMLElement; t: any } | null>(null);

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['fee-templates'],
    queryFn: feeTemplatesApi.list,
    staleTime: 30_000,
  });

  const { data: classes = [] } = useQuery<any[]>({
    queryKey: ['classes'],
    queryFn: () => classesApi.list(),
    enabled: assignTarget !== null,
  });
  const { data: applySections = [] } = useQuery<any[]>({
    queryKey: ['sections-for-class', applyClassId],
    queryFn: () => sectionsApi.listByClass(applyClassId as number),
    enabled: assignTarget !== null && !!applyClassId && scope !== 'CLASS',
  });
  const { data: applyStudents = [] } = useQuery<any[]>({
    queryKey: ['apply-roster', applySectionId],
    queryFn: () => attendanceApi.getSectionStudents(applySectionId as number),
    enabled: assignTarget !== null && !!applySectionId && scope === 'STUDENT',
  });

  const { register, handleSubmit, reset, control, watch, formState: { errors } } =
    useForm<CreateFeeTemplateRequest & { customFeeType?: string }>({ defaultValues: DEFAULTS });
  const lateFeeEnabled = watch('lateFeeEnabled');
  const concessionType = watch('concessionType');
  const feeType = watch('feeType');

  useEffect(() => {
    if (!formOpen) return;
    if (editTarget) {
      // If an existing template has a custom type (not in the preset list), show it as OTHER + the custom text.
      const isKnown = FEE_TYPES.includes(editTarget.feeType);
      reset({
        ...DEFAULTS, ...editTarget,
        feeType: isKnown ? editTarget.feeType : 'OTHER',
        customFeeType: isKnown ? '' : editTarget.feeType,
      });
    } else {
      reset({ ...DEFAULTS, customFeeType: '' });
    }
  }, [formOpen, editTarget, reset]);

  const saveMutation = useMutation({
    mutationFn: (d: CreateFeeTemplateRequest) =>
      editTarget ? feeTemplatesApi.update(editTarget.id, d) : feeTemplatesApi.create(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fee-templates'] });
      setFormOpen(false); setEditTarget(null);
      enqueueSnackbar(editTarget ? 'Template updated' : 'Template created', { variant: 'success' });
    },
    onError: (e: any) => enqueueSnackbar(e?.response?.data?.message ?? 'Failed to save template', { variant: 'error' }),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: 'ACTIVE' | 'INACTIVE' }) => feeTemplatesApi.setStatus(id, status),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['fee-templates'] }); enqueueSnackbar('Status updated', { variant: 'success' }); },
    onError: (e: any) => enqueueSnackbar(e?.response?.data?.message ?? 'Failed', { variant: 'error' }),
  });

  const deleteMutation = useMutation({
    mutationFn: feeTemplatesApi.delete,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['fee-templates'] }); setDeleteTarget(null); enqueueSnackbar('Template deleted', { variant: 'success' }); },
    onError: (e: any) => { setDeleteTarget(null); enqueueSnackbar(e?.response?.data?.message ?? 'Failed to delete', { variant: 'error' }); },
  });

  const closeApply = () => {
    setAssignTarget(null); setScope('CLASS');
    setApplyClassId(''); setApplySectionId(''); setApplyStudentId('');
  };

  const assignMutation = useMutation({
    mutationFn: () => feeTemplatesApi.apply(assignTarget.id, {
      scope,
      classId: scope === 'CLASS' ? Number(applyClassId) : undefined,
      sectionId: scope === 'SECTION' ? Number(applySectionId) : undefined,
      studentId: scope === 'STUDENT' ? Number(applyStudentId) : undefined,
    }),
    onSuccess: (res: any) => {
      qc.invalidateQueries({ queryKey: ['fees'] });
      const created = res?.data?.feesCreated ?? 0;
      enqueueSnackbar(res?.message ?? `Applied to ${created} student(s).`, { variant: created > 0 ? 'success' : 'warning' });
      closeApply();
    },
    onError: (e: any) => enqueueSnackbar(e?.response?.data?.message ?? 'Failed to apply', { variant: 'error' }),
  });

  const canApply = scope === 'CLASS' ? !!applyClassId
    : scope === 'SECTION' ? !!applySectionId
    : !!applyStudentId;

  return (
    <Box>
      <PageHeader
        title="Fee Templates"
        subtitle="Define reusable fee structures and assign them to classes"
        crumbs={[{ label: 'Dashboard', path: '/' }, { label: 'Fees', path: '/fees' }, { label: 'Templates' }]}
        action={
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="outlined" startIcon={<Payments />} onClick={() => navigate('/fees')}>Collect Fees</Button>
            <Button variant="contained" startIcon={<Add />} onClick={() => { setEditTarget(null); setFormOpen(true); }}>New Template</Button>
          </Box>
        }
      />

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
      ) : templates.length === 0 ? (
        <Card sx={{ py: 2 }}><EmptyState title="No fee templates yet" description="Create a template like “Class 1-3 Tuition — ₹4000/month”, then assign it to a class." /></Card>
      ) : (
        <Grid container spacing={2.5}>
          {templates.map((t: any) => {
            const inactive = t.status === 'INACTIVE';
            const color = TYPE_COLOR[t.feeType] ?? '#5A5A5A';
            return (
              <Grid item xs={12} sm={6} lg={4} key={t.id}>
                <Card sx={{ p: 2.5, height: '100%', opacity: inactive ? 0.7 : 1, display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', gap: 1.25 }}>
                      <Avatar variant="rounded" sx={{ bgcolor: color, width: 44, height: 44, borderRadius: 3 }}><ReceiptLong /></Avatar>
                      <Box>
                        <Typography variant="subtitle1" fontWeight={700} lineHeight={1.2}>{t.name}</Typography>
                        <Chip size="small" label={t.feeType} sx={{ height: 20, fontWeight: 700, bgcolor: `${color}1A`, color }} />
                      </Box>
                    </Box>
                    <IconButton size="small" onClick={(e) => setMenu({ el: e.currentTarget, t })}><MoreVert fontSize="small" /></IconButton>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75, mt: 1.5 }}>
                    <Typography variant="h5" fontWeight={800}>{fmtCurrency(t.amount)}</Typography>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>/ {t.frequency?.toLowerCase().replace('_', ' ')}</Typography>
                  </Box>

                  <Divider sx={{ my: 1.5 }} />

                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 2 }}>
                    {t.dueDayOfMonth != null && <Chip size="small" variant="outlined" label={`Due ${t.dueDayOfMonth}${nth(t.dueDayOfMonth)}`} />}
                    {t.graceDays != null && <Chip size="small" variant="outlined" label={`${t.graceDays}d grace`} />}
                    <Chip size="small" variant="outlined" color={t.lateFeeEnabled ? 'error' : 'default'}
                      label={t.lateFeeEnabled ? `Late ${fmtCurrency(t.lateFeeAmount ?? 0)}` : 'No late fee'} />
                    {t.concessionType !== 'NONE' && (
                      <Chip size="small" variant="outlined" color="success"
                        label={`Concession ${t.concessionType === 'PERCENT' ? t.concessionValue + '%' : fmtCurrency(t.concessionValue ?? 0)}`} />
                    )}
                    <Chip size="small" label={inactive ? 'Inactive' : 'Active'} color={inactive ? 'default' : 'success'} />
                  </Box>

                  <Button fullWidth variant="contained" startIcon={<Groups2 />} sx={{ mt: 'auto' }}
                    onClick={() => { setAssignTarget(t); setScope('CLASS'); setApplyClassId(''); setApplySectionId(''); setApplyStudentId(''); }} disabled={inactive}>
                    Apply Fee
                  </Button>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Row menu */}
      <Menu anchorEl={menu?.el} open={Boolean(menu)} onClose={() => setMenu(null)} PaperProps={{ sx: { borderRadius: 2.5, minWidth: 190 } }}>
        <MenuItem onClick={() => { setEditTarget(menu!.t); setFormOpen(true); setMenu(null); }}>
          <ListItemIcon><Edit fontSize="small" /></ListItemIcon> Edit
        </MenuItem>
        {menu?.t.status === 'INACTIVE' ? (
          <MenuItem onClick={() => { statusMutation.mutate({ id: menu!.t.id, status: 'ACTIVE' }); setMenu(null); }}>
            <ListItemIcon><ToggleOn fontSize="small" /></ListItemIcon> Activate
          </MenuItem>
        ) : (
          <MenuItem onClick={() => { statusMutation.mutate({ id: menu!.t.id, status: 'INACTIVE' }); setMenu(null); }}>
            <ListItemIcon><ToggleOff fontSize="small" /></ListItemIcon> Deactivate
          </MenuItem>
        )}
        <Divider />
        <MenuItem sx={{ color: 'error.main' }} onClick={() => { setDeleteTarget(menu!.t); setMenu(null); }}>
          <ListItemIcon><DeleteOutline fontSize="small" sx={{ color: 'error.main' }} /></ListItemIcon> Delete
        </MenuItem>
      </Menu>

      {/* Create / Edit dialog */}
      <Dialog open={formOpen} onClose={() => { setFormOpen(false); setEditTarget(null); }} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle fontWeight={700}>{editTarget ? 'Edit Fee Template' : 'New Fee Template'}</DialogTitle>
        <form onSubmit={handleSubmit((d) => saveMutation.mutate(coerce(d)))}>
          <DialogContent>
            {saveMutation.isError && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: 3 }}>
                {(saveMutation.error as any)?.response?.data?.message ?? 'Failed to save'}
              </Alert>
            )}
            <Grid container spacing={2} sx={{ mt: 0 }}>
              <Grid item xs={12} sm={7}>
                <TextField label="Template name" fullWidth required placeholder="e.g. Class 1-3 Tuition"
                  {...register('name', { required: 'Required' })} error={!!errors.name} helperText={errors.name?.message} />
              </Grid>
              <Grid item xs={6} sm={5}>
                <Controller name="feeType" control={control} render={({ field }) => (
                  <TextField select label="Fee type" fullWidth {...field}>
                    {FEE_TYPES.map((v) => <MenuItem key={v} value={v}>{v === 'OTHER' ? 'Other…' : v}</MenuItem>)}
                  </TextField>
                )} />
              </Grid>
              {feeType === 'OTHER' && (
                <Grid item xs={12}>
                  <TextField label="Specify fee type" fullWidth required placeholder="e.g. Picnic, Uniform, Lab"
                    {...register('customFeeType', {
                      required: feeType === 'OTHER' ? 'Please specify the fee type' : false,
                    })}
                    error={!!errors.customFeeType} helperText={(errors.customFeeType as any)?.message} />
                </Grid>
              )}
              <Grid item xs={6} sm={4}>
                <TextField label="Amount (₹)" type="number" fullWidth required inputProps={{ min: 1 }}
                  {...register('amount', { required: 'Required', valueAsNumber: true })} error={!!errors.amount} />
              </Grid>
              <Grid item xs={6} sm={4}>
                <Controller name="frequency" control={control} render={({ field }) => (
                  <TextField select label="Frequency" fullWidth {...field}>
                    {FREQUENCIES.map((v) => <MenuItem key={v} value={v}>{v.replace('_', ' ')}</MenuItem>)}
                  </TextField>
                )} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Controller name="academicYear" control={control} rules={{ required: 'Required' }}
                  render={({ field }) => (
                    <TextField select label="Financial Year" fullWidth {...field} value={field.value ?? ''}>
                      {academicYears().map((y) => <MenuItem key={y} value={y}>{y}</MenuItem>)}
                    </TextField>
                  )} />
              </Grid>

              <Grid item xs={6} sm={4}>
                <TextField label="Due day of month" type="number" fullWidth inputProps={{ min: 1, max: 31 }}
                  {...register('dueDayOfMonth', { valueAsNumber: true })} />
              </Grid>
              <Grid item xs={6} sm={4}>
                <TextField label="Grace days" type="number" fullWidth inputProps={{ min: 0 }}
                  {...register('graceDays', { valueAsNumber: true })} />
              </Grid>

              <Grid item xs={12}><Divider><Chip size="small" label="Late fee" /></Divider></Grid>
              <Grid item xs={12}>
                <Controller name="lateFeeEnabled" control={control} render={({ field }) => (
                  <FormControlLabel control={<Switch checked={!!field.value} onChange={field.onChange} />}
                    label="Charge a late fee after the grace period" />
                )} />
              </Grid>
              {lateFeeEnabled && (
                <>
                  <Grid item xs={6}>
                    <TextField label="Late fee (₹)" type="number" fullWidth inputProps={{ min: 0 }}
                      {...register('lateFeeAmount', { valueAsNumber: true })} />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField label="Repeated late fee (₹ / extra month)" type="number" fullWidth inputProps={{ min: 0 }}
                      {...register('repeatedLateFeeAmount', { valueAsNumber: true })} helperText="Optional" />
                  </Grid>
                </>
              )}

              <Grid item xs={12}><Divider><Chip size="small" label="Reminders" /></Divider></Grid>
              <Grid item xs={4}>
                <TextField label="Remind days before" type="number" fullWidth inputProps={{ min: 0 }}
                  {...register('reminderDaysBefore', { valueAsNumber: true })} />
              </Grid>
              <Grid item xs={4} sx={{ display: 'flex', alignItems: 'center' }}>
                <Controller name="reminderOnDueDate" control={control} render={({ field }) => (
                  <FormControlLabel control={<Switch checked={!!field.value} onChange={field.onChange} />} label="On due date" />
                )} />
              </Grid>
              <Grid item xs={4}>
                <TextField label="Remind days after" type="number" fullWidth inputProps={{ min: 0 }}
                  {...register('reminderDaysAfter', { valueAsNumber: true })} />
              </Grid>

              <Grid item xs={12}><Divider><Chip size="small" label="Concession" /></Divider></Grid>
              <Grid item xs={6}>
                <Controller name="concessionType" control={control} render={({ field }) => (
                  <TextField select label="Concession type" fullWidth {...field}>
                    {CONCESSIONS.map((v) => <MenuItem key={v} value={v}>{v}</MenuItem>)}
                  </TextField>
                )} />
              </Grid>
              {concessionType !== 'NONE' && (
                <Grid item xs={6}>
                  <TextField label={concessionType === 'PERCENT' ? 'Concession (%)' : 'Concession (₹)'} type="number" fullWidth
                    inputProps={{ min: 0 }} {...register('concessionValue', { valueAsNumber: true })} helperText="Subject to approval" />
                </Grid>
              )}
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
            <Button onClick={() => { setFormOpen(false); setEditTarget(null); }} variant="outlined">Cancel</Button>
            <Button type="submit" variant="contained" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Saving…' : editTarget ? 'Save Changes' : 'Create Template'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Apply fee dialog — choose scope: Class / Section / Student */}
      <Dialog open={assignTarget !== null} onClose={closeApply} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle fontWeight={700}>Apply Fee</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Generate <b>{assignTarget?.name}</b> ({fmtCurrency(assignTarget?.amount ?? 0)}) for the chosen target.
          </Typography>

          <TextField select fullWidth label="Apply to" value={scope} sx={{ mb: 2 }}
            onChange={(e) => { setScope(e.target.value as any); setApplySectionId(''); setApplyStudentId(''); }}>
            <MenuItem value="CLASS">A whole class</MenuItem>
            <MenuItem value="SECTION">A section</MenuItem>
            <MenuItem value="STUDENT">A single student</MenuItem>
          </TextField>

          <TextField select fullWidth label="Class" value={applyClassId} sx={{ mb: 2 }}
            onChange={(e) => { setApplyClassId(Number(e.target.value)); setApplySectionId(''); setApplyStudentId(''); }}>
            {classes.map((c) => (
              <MenuItem key={c.id} value={c.id}>{c.name}{c.studentCount != null ? ` · ${c.studentCount} students` : ''}</MenuItem>
            ))}
          </TextField>

          {scope !== 'CLASS' && (
            <TextField select fullWidth label="Section" value={applySectionId} sx={{ mb: 2 }} disabled={!applyClassId}
              onChange={(e) => { setApplySectionId(Number(e.target.value)); setApplyStudentId(''); }}>
              {applySections.map((s) => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
            </TextField>
          )}

          {scope === 'STUDENT' && (
            <TextField select fullWidth label="Student" value={applyStudentId} disabled={!applySectionId}
              onChange={(e) => setApplyStudentId(Number(e.target.value))}>
              {applyStudents.map((s) => (
                <MenuItem key={s.id} value={s.id}>
                  {s.rollNumber ? `#${s.rollNumber} · ` : ''}{s.firstName} {s.lastName}
                </MenuItem>
              ))}
            </TextField>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={closeApply} variant="outlined">Cancel</Button>
          <Button variant="contained" disabled={!canApply || assignMutation.isPending}
            onClick={() => assignMutation.mutate()}>
            {assignMutation.isPending ? 'Applying…' : 'Apply Fee'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete Template"
        message={`Delete "${deleteTarget?.name}"? Already-generated student fees are not affected.`}
        confirmLabel="Delete"
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
        loading={deleteMutation.isPending}
      />
    </Box>
  );
}

function nth(n: number) {
  const s = ['th', 'st', 'nd', 'rd'], v = n % 100;
  return s[(v - 20) % 10] ?? s[v] ?? s[0];
}

/** Ensure optional numeric fields are numbers or omitted (not NaN), and resolve a custom "Other" fee type. */
function coerce(d: CreateFeeTemplateRequest & { customFeeType?: string }): CreateFeeTemplateRequest {
  const num = (v: any) => (v === '' || v == null || Number.isNaN(v) ? undefined : Number(v));
  const { customFeeType, ...rest } = d;
  const feeType = d.feeType === 'OTHER' && customFeeType?.trim()
    ? customFeeType.trim().toUpperCase()
    : d.feeType;
  return {
    ...rest,
    feeType,
    amount: Number(d.amount),
    dueDayOfMonth: num(d.dueDayOfMonth),
    graceDays: num(d.graceDays),
    lateFeeAmount: d.lateFeeEnabled ? num(d.lateFeeAmount) : undefined,
    repeatedLateFeeAmount: d.lateFeeEnabled ? num(d.repeatedLateFeeAmount) : undefined,
    reminderDaysBefore: num(d.reminderDaysBefore),
    reminderDaysAfter: num(d.reminderDaysAfter),
    concessionValue: d.concessionType !== 'NONE' ? num(d.concessionValue) : undefined,
  };
}
