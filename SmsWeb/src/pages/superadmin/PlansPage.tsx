import {
  Box, Card, Grid, Typography, Button, Chip, CircularProgress, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem, Stack, Divider, InputAdornment,
} from '@mui/material';
import { Add, Edit, AutoFixHigh } from '@mui/icons-material';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { superAdminApi, type Plan, type PlanPayload } from '@/api/superadmin.api';
import { PageHeader } from '@/components/common/PageHeader';

export default function PlansPage() {
  const { data: plans = [], isLoading } = useQuery({ queryKey: ['sa-all-plans'], queryFn: superAdminApi.listAllPlans });
  const [editing, setEditing] = useState<Plan | null>(null);
  const [creating, setCreating] = useState(false);

  return (
    <Box>
      <PageHeader
        title="Subscription Plans"
        subtitle="Define plans, feature limits and pricing"
        crumbs={[{ label: 'Platform' }, { label: 'Plans' }]}
        action={<Button variant="contained" startIcon={<Add />} onClick={() => setCreating(true)}>New Plan</Button>}
      />
      {isLoading ? (
        <Box sx={{ textAlign: 'center', py: 6 }}><CircularProgress /></Box>
      ) : (
        <Grid container spacing={2}>
          {(plans as Plan[]).map((p) => (
            <Grid item xs={12} sm={6} md={4} key={p.id}>
              <Card sx={{ p: 2.5, height: '100%' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography variant="h6" fontWeight={800}>{p.planName}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>{p.planCode}</Typography>
                  </Box>
                  <Chip size="small" label={p.status} color={p.status === 'ACTIVE' ? 'success' : 'default'} />
                </Box>
                <Typography variant="h5" fontWeight={800} sx={{ mt: 1 }}>₹{p.monthlyPrice}<Typography component="span" variant="caption" color="text.secondary">/mo</Typography></Typography>
                <Typography variant="caption" color="text.secondary">₹{p.annualPrice}/yr · {p.trialDays}-day trial</Typography>
                <Divider sx={{ my: 1.5 }} />
                <Stack spacing={0.5}>
                  <Typography variant="body2">Students: <b>{p.maxStudents}</b></Typography>
                  <Typography variant="body2">Teachers: <b>{p.maxTeachers}</b></Typography>
                  <Typography variant="body2">Parents: <b>{p.maxParents}</b></Typography>
                  <Typography variant="body2">Storage: <b>{p.maxStorageGb} GB</b></Typography>
                </Stack>
                <Button size="small" startIcon={<Edit />} sx={{ mt: 1.5 }} onClick={() => setEditing(p)}>Edit</Button>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
      {(creating || editing) && (
        <PlanDialog plan={editing} onClose={() => { setCreating(false); setEditing(null); }} />
      )}
    </Box>
  );
}

const PLAN_CODE_RE = /^PLAN-\d{3,6}$/;
const genPlanCode = () => `PLAN-${Math.floor(100 + Math.random() * 900)}`;

function PlanDialog({ plan, onClose }: { plan: Plan | null; onClose: () => void }) {
  const qc = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [form, setForm] = useState<PlanPayload>({
    id: plan?.id,
    planCode: plan?.planCode ?? genPlanCode(), planName: plan?.planName ?? '', description: plan?.description ?? '',
    maxStudents: plan?.maxStudents ?? 500, maxTeachers: plan?.maxTeachers ?? 50, maxParents: plan?.maxParents ?? 1000,
    maxStorageGb: plan?.maxStorageGb ?? 5, monthlyPrice: plan?.monthlyPrice ?? 0, annualPrice: plan?.annualPrice ?? 0,
    trialDays: plan?.trialDays ?? 30, status: plan?.status ?? 'ACTIVE',
  });
  const set = (p: Partial<PlanPayload>) => setForm((f) => ({ ...f, ...p }));
  const mut = useMutation({
    mutationFn: () => superAdminApi.upsertPlan(form),
    onSuccess: () => { enqueueSnackbar('Plan saved', { variant: 'success' }); qc.invalidateQueries({ queryKey: ['sa-all-plans'] }); qc.invalidateQueries({ queryKey: ['sa-plans'] }); onClose(); },
    onError: (e: any) => enqueueSnackbar(e?.response?.data?.message ?? 'Save failed', { variant: 'error' }),
  });
  const num = (label: string, key: keyof PlanPayload) => (
    <TextField label={label} type="number" fullWidth size="small" value={form[key] as any} onChange={(e) => set({ [key]: Number(e.target.value) } as any)} />
  );

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle fontWeight={700}>{plan ? 'Edit Plan' : 'New Plan'}</DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField label="Plan Code *" fullWidth size="small" value={form.planCode}
              disabled={!!plan}
              onChange={(e) => set({ planCode: e.target.value.toUpperCase() })}
              error={!plan && !PLAN_CODE_RE.test(form.planCode ?? '')}
              helperText={plan ? 'Code cannot be changed' : 'Format: PLAN-123 (must be unique)'}
              InputProps={plan ? undefined : {
                endAdornment: (
                  <InputAdornment position="end">
                    <Button size="small" startIcon={<AutoFixHigh />} onClick={() => set({ planCode: genPlanCode() })}>
                      Generate
                    </Button>
                  </InputAdornment>
                ),
              }} />
          </Grid>
          <Grid item xs={12} sm={6}><TextField label="Plan Name *" fullWidth size="small" value={form.planName} onChange={(e) => set({ planName: e.target.value })} /></Grid>
          <Grid item xs={12}><TextField label="Description" fullWidth size="small" value={form.description} onChange={(e) => set({ description: e.target.value })} /></Grid>
          <Grid item xs={6} sm={3}>{num('Max Students', 'maxStudents')}</Grid>
          <Grid item xs={6} sm={3}>{num('Max Teachers', 'maxTeachers')}</Grid>
          <Grid item xs={6} sm={3}>{num('Max Parents', 'maxParents')}</Grid>
          <Grid item xs={6} sm={3}>{num('Storage GB', 'maxStorageGb')}</Grid>
          <Grid item xs={6} sm={4}>{num('Monthly ₹', 'monthlyPrice')}</Grid>
          <Grid item xs={6} sm={4}>{num('Annual ₹', 'annualPrice')}</Grid>
          <Grid item xs={6} sm={4}>{num('Trial Days', 'trialDays')}</Grid>
          <Grid item xs={12} sm={6}>
            <TextField select label="Status" fullWidth size="small" value={form.status} onChange={(e) => set({ status: e.target.value })}>
              <MenuItem value="ACTIVE">Active</MenuItem>
              <MenuItem value="INACTIVE">Inactive</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="outlined">Cancel</Button>
        <Button variant="contained"
          disabled={!form.planName || mut.isPending || (!plan && !PLAN_CODE_RE.test(form.planCode ?? ''))}
          onClick={() => mut.mutate()}>
          {mut.isPending ? 'Saving…' : 'Save Plan'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
