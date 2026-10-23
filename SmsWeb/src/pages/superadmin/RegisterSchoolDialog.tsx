import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Grid, TextField,
  MenuItem, Typography, Divider, Alert, InputAdornment, Collapse,
} from '@mui/material';
import { AutoFixHigh } from '@mui/icons-material';
import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { superAdminApi, type CreateTenantPayload } from '@/api/superadmin.api';
import { academicYears, currentAcademicYear } from '@/utils/academicYears';

const CODE_RE = /^[A-Z0-9-]+$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function suggestCode(name: string): string {
  const cleaned = name.toUpperCase().replace(/[^A-Z0-9 ]/g, '').trim();
  const words = cleaned.split(/\s+/).filter(Boolean);
  let base = words.length >= 2
    ? words.map((w) => w[0]).join('').slice(0, 6)       // acronym for multi-word names
    : (words[0] ?? 'SCH').slice(0, 8);
  if (base.length < 3) base = (base + 'SCH').slice(0, 3);
  const rand = Math.floor(100 + Math.random() * 900);
  return `${base}-${rand}`;
}

export default function RegisterSchoolDialog({
  open, onClose, onCreated,
}: { open: boolean; onClose: () => void; onCreated: (id: number) => void }) {
  const { enqueueSnackbar } = useSnackbar();
  const empty: CreateTenantPayload = {
    name: '', legalName: '', code: '', email: '', phone: '', mobile: '', website: '',
    address: '', city: '', state: '', country: 'India', pincode: '',
    planCode: '', status: 'TRIAL', currentAcademicYear: currentAcademicYear(),
    adminFirstName: '', adminLastName: '', adminEmail: '', adminPassword: '', adminMobile: '',
  };
  const [form, setForm] = useState({ ...empty });
  const set = (p: Partial<typeof empty>) => setForm((f) => ({ ...f, ...p }));

  const { data: plans = [] } = useQuery({ queryKey: ['sa-plans'], queryFn: superAdminApi.listPlans, enabled: open });

  // Duplicate check: look for existing schools matching the typed name/email.
  const { data: dupData } = useQuery({
    queryKey: ['sa-dup', form.name, form.email],
    queryFn: () => superAdminApi.listSchools({ search: form.name || form.email, size: 5 }),
    enabled: open && (form.name.trim().length >= 3 || !!form.email),
  });
  const duplicates = ((dupData as any)?.content ?? []).filter((s: any) =>
    (form.name && s.name?.toLowerCase() === form.name.trim().toLowerCase()) ||
    (form.email && s.email?.toLowerCase() === form.email.trim().toLowerCase()),
  );

  const codeValid = CODE_RE.test(form.code) && form.code.length >= 3 && form.code.length <= 20;

  const mutation = useMutation({
    mutationFn: () => {
      const payload: CreateTenantPayload = {
        name: form.name.trim(), legalName: form.legalName || undefined, code: form.code.trim(),
        email: form.email || undefined, phone: form.phone || undefined, mobile: form.mobile || undefined,
        website: form.website || undefined, address: form.address || undefined,
        city: form.city || undefined, state: form.state || undefined, country: form.country || undefined,
        pincode: form.pincode || undefined, planCode: form.planCode || undefined, status: form.status,
        currentAcademicYear: form.currentAcademicYear,
        // Admin account is mandatory — the school admin logs in with this email.
        adminFirstName: form.adminFirstName,
        adminLastName: form.adminLastName,
        adminEmail: form.adminEmail?.trim(),
        adminPassword: form.adminPassword || undefined,
        adminMobile: form.adminMobile,
      };
      return superAdminApi.createSchool(payload);
    },
    onSuccess: (t) => {
      enqueueSnackbar('School registered', { variant: 'success' });
      setForm({ ...empty });
      onCreated(t.id);
    },
    onError: (e: any) => enqueueSnackbar(e?.response?.data?.message ?? 'Could not register school', { variant: 'error' }),
  });

  const adminEmailValid = EMAIL_RE.test(form.adminEmail ?? '');
  const canSubmit = !!form.name.trim() && codeValid && !mutation.isPending
    && !!form.currentAcademicYear
    && !!form.adminFirstName && !!form.adminLastName && adminEmailValid && !!(form.adminMobile ?? '').trim();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle fontWeight={700}>Register New School</DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField label="School Name *" fullWidth value={form.name}
              onChange={(e) => set({ name: e.target.value })} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="School Code *" fullWidth value={form.code}
              onChange={(e) => set({ code: e.target.value.toUpperCase() })}
              error={!!form.code && !codeValid}
              helperText={form.code && !codeValid ? '3–20 chars, A–Z 0–9 and hyphens' : 'Unique identifier'}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <Button size="small" startIcon={<AutoFixHigh />} disabled={!form.name.trim()}
                      onClick={() => set({ code: suggestCode(form.name) })}>
                      Generate
                    </Button>
                  </InputAdornment>
                ),
              }} />
          </Grid>

          <Grid item xs={12}>
            <Collapse in={duplicates.length > 0}>
              <Alert severity="warning" sx={{ mb: 0.5 }}>
                Possible duplicate: {duplicates.map((d: any) => `${d.name} (${d.code})`).join(', ')}. Confirm this isn't the same school before continuing.
              </Alert>
            </Collapse>
          </Grid>

          <Grid item xs={12} sm={6}><TextField label="Legal Name" fullWidth value={form.legalName} onChange={(e) => set({ legalName: e.target.value })} /></Grid>
          <Grid item xs={12} sm={6}><TextField label="Email" fullWidth value={form.email} onChange={(e) => set({ email: e.target.value })} /></Grid>
          <Grid item xs={12} sm={4}><TextField label="Phone" fullWidth value={form.phone} onChange={(e) => set({ phone: e.target.value })} /></Grid>
          <Grid item xs={12} sm={4}><TextField label="Mobile" fullWidth value={form.mobile} onChange={(e) => set({ mobile: e.target.value })} /></Grid>
          <Grid item xs={12} sm={4}><TextField label="Website" fullWidth value={form.website} onChange={(e) => set({ website: e.target.value })} /></Grid>

          <Grid item xs={12}><TextField label="Address" fullWidth value={form.address} onChange={(e) => set({ address: e.target.value })} /></Grid>
          <Grid item xs={12} sm={3}><TextField label="City" fullWidth value={form.city} onChange={(e) => set({ city: e.target.value })} /></Grid>
          <Grid item xs={12} sm={3}><TextField label="State" fullWidth value={form.state} onChange={(e) => set({ state: e.target.value })} /></Grid>
          <Grid item xs={12} sm={3}><TextField label="Country" fullWidth value={form.country} onChange={(e) => set({ country: e.target.value })} /></Grid>
          <Grid item xs={12} sm={3}><TextField label="Pincode" fullWidth value={form.pincode} onChange={(e) => set({ pincode: e.target.value })} /></Grid>

          <Grid item xs={12} sm={4}>
            <TextField select label="Plan" fullWidth value={form.planCode} onChange={(e) => set({ planCode: e.target.value })}>
              <MenuItem value=""><em>Trial (default)</em></MenuItem>
              {(plans as any[]).map((p) => <MenuItem key={p.planCode} value={p.planCode}>{p.planName}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField select label="Initial Status" fullWidth value={form.status} onChange={(e) => set({ status: e.target.value })}>
              <MenuItem value="TRIAL">Trial / Pending</MenuItem>
              <MenuItem value="ACTIVE">Active</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField select label="Academic Year *" fullWidth value={form.currentAcademicYear}
              onChange={(e) => set({ currentAcademicYear: e.target.value })}
              error={!form.currentAcademicYear} helperText={!form.currentAcademicYear ? 'Required' : ' '}>
              {academicYears().map((y) => <MenuItem key={y} value={y}>{y}</MenuItem>)}
            </TextField>
          </Grid>

          <Grid item xs={12}><Divider sx={{ my: 1 }}><Typography variant="caption" color="text.secondary">School Admin (login account — required)</Typography></Divider></Grid>
          <Grid item xs={12} sm={6}><TextField label="Admin First Name *" fullWidth value={form.adminFirstName} onChange={(e) => set({ adminFirstName: e.target.value })} /></Grid>
          <Grid item xs={12} sm={6}><TextField label="Admin Last Name *" fullWidth value={form.adminLastName} onChange={(e) => set({ adminLastName: e.target.value })} /></Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Admin Email (login) *" fullWidth value={form.adminEmail}
              onChange={(e) => set({ adminEmail: e.target.value })}
              error={!!form.adminEmail && !EMAIL_RE.test(form.adminEmail)}
              helperText={form.adminEmail && !EMAIL_RE.test(form.adminEmail) ? 'Enter a valid email' : 'Must be unique — the admin logs in with this'} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Admin Mobile *" fullWidth value={form.adminMobile}
              onChange={(e) => set({ adminMobile: e.target.value })}
              error={!(form.adminMobile ?? '').trim()} helperText={!(form.adminMobile ?? '').trim() ? 'Required' : ' '} />
          </Grid>
          <Grid item xs={12}>
            <TextField label="Temporary Password" fullWidth value={form.adminPassword}
              onChange={(e) => set({ adminPassword: e.target.value })}
              helperText="Leave blank to use the system default (School@123)" />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="outlined">Cancel</Button>
        <Button onClick={() => mutation.mutate()} variant="contained" disabled={!canSubmit}>
          {mutation.isPending ? 'Registering…' : 'Register School'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
