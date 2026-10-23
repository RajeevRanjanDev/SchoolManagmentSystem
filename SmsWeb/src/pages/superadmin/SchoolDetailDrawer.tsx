import {
  Drawer, Box, Typography, Divider, Chip, Button, Stack, CircularProgress, IconButton,
  Grid, TextField, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions, Alert,
  Tabs, Tab, Table, TableBody, TableCell, TableHead, TableRow, Switch, FormControlLabel,
} from '@mui/material';
import {
  Close, Edit, Download, LockReset, PersonAdd, CreditCard, History as HistoryIcon,
} from '@mui/icons-material';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { superAdminApi, type CreateTenantPayload } from '@/api/superadmin.api';
import { fmtDate } from '@/utils/formatters';
import { STATUS_META, statusActions } from './schoolStatus';

export default function SchoolDetailDrawer({
  schoolId, onClose, onChanged,
}: { schoolId: number; onClose: () => void; onChanged: () => void }) {
  const qc = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [tab, setTab] = useState(0);
  const [editing, setEditing] = useState(false);
  const [confirm, setConfirm] = useState<{ to: string; label: string } | null>(null);
  const [reason, setReason] = useState('');

  const { data: school, isLoading } = useQuery({
    queryKey: ['sa-school', schoolId],
    queryFn: () => superAdminApi.getSchool(schoolId),
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['sa-school', schoolId] });
    qc.invalidateQueries({ queryKey: ['sa-stats'] });
    onChanged();
  };

  const statusMut = useMutation({
    mutationFn: ({ to }: { to: string }) => superAdminApi.updateStatus(schoolId, to, reason || undefined),
    onSuccess: (_d, v) => { enqueueSnackbar(`Status changed to ${v.to}`, { variant: 'success' }); setConfirm(null); setReason(''); refresh(); },
    onError: (e: any) => enqueueSnackbar(e?.response?.data?.message ?? 'Status change failed', { variant: 'error' }),
  });

  return (
    <Drawer anchor="right" open onClose={onClose} PaperProps={{ sx: { width: { xs: '100%', sm: 620 } } }}>
      {isLoading || !school ? (
        <Box sx={{ textAlign: 'center', py: 10 }}><CircularProgress /></Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Box sx={{ p: 2.5, bgcolor: 'primary.main', color: '#fff' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box>
                <Typography variant="h6" fontWeight={800}>{school.name}</Typography>
                <Typography variant="body2" sx={{ opacity: 0.85, fontFamily: 'monospace' }}>{school.code}</Typography>
              </Box>
              <IconButton onClick={onClose} sx={{ color: '#fff' }}><Close /></IconButton>
            </Box>
            <Stack direction="row" spacing={1} sx={{ mt: 1.5, flexWrap: 'wrap', gap: 1 }}>
              <Chip size="small" label={(STATUS_META[school.status] ?? STATUS_META.TRIAL).label}
                sx={{ bgcolor: 'rgba(255,255,255,0.22)', color: '#fff', fontWeight: 700 }} />
              {statusActions(school.status).map((a) => (
                <Button key={a.to} size="small" variant="contained" color={a.color === 'inherit' ? 'primary' : a.color}
                  onClick={() => setConfirm({ to: a.to, label: a.label })}>
                  {a.label}
                </Button>
              ))}
            </Stack>
          </Box>

          <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto"
            sx={{ px: 1, borderBottom: '1px solid #EBEBEB' }}>
            <Tab label="Overview" />
            <Tab label="Configuration" />
            <Tab label="Subscription" />
            <Tab label="Admins" />
            <Tab label="History" />
          </Tabs>

          <Box sx={{ flex: 1, overflowY: 'auto', p: 2.5 }}>
            {tab === 0 && <OverviewTab school={school} onEdit={() => setEditing(true)} />}
            {tab === 1 && <ConfigTab school={school} onSaved={refresh} />}
            {tab === 2 && <SubscriptionTab school={school} onSaved={refresh} />}
            {tab === 3 && <AdminsTab schoolId={schoolId} />}
            {tab === 4 && <HistoryTab schoolId={schoolId} />}
          </Box>
        </Box>
      )}

      <Dialog open={!!confirm} onClose={() => setConfirm(null)} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight={700}>{confirm?.label} school?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            {confirm?.to === 'SUSPENDED' && 'Suspended schools cannot log in until reactivated.'}
            {confirm?.to === 'TERMINATED' && 'Terminated schools lose access. This is a hard stop.'}
            {confirm?.to === 'ACTIVE' && 'The school will regain full access.'}
          </Typography>
          <TextField label="Reason (for audit log)" fullWidth multiline minRows={2}
            value={reason} onChange={(e) => setReason(e.target.value)} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setConfirm(null)} variant="outlined">Cancel</Button>
          <Button variant="contained" disabled={statusMut.isPending}
            onClick={() => confirm && statusMut.mutate({ to: confirm.to })}>
            {statusMut.isPending ? 'Saving…' : confirm?.label}
          </Button>
        </DialogActions>
      </Dialog>

      {school && editing && (
        <EditSchoolDialog school={school} onClose={() => setEditing(false)} onSaved={() => { setEditing(false); refresh(); }} />
      )}
    </Drawer>
  );
}

function Rows({ rows }: { rows: [string, any][] }) {
  return (
    <Stack spacing={0}>
      {rows.map(([label, value]) => (
        <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.9, borderBottom: '1px solid #F2F2F2' }}>
          <Typography variant="body2" color="text.secondary">{label}</Typography>
          <Typography variant="body2" fontWeight={500} sx={{ textAlign: 'right', maxWidth: '62%' }}>{value || '—'}</Typography>
        </Box>
      ))}
    </Stack>
  );
}

function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
      <Typography variant="subtitle2" fontWeight={700}>{title}</Typography>
      {action}
    </Box>
  );
}

function OverviewTab({ school, onEdit }: { school: any; onEdit: () => void }) {
  const { enqueueSnackbar } = useSnackbar();
  return (
    <Box>
      {school.usageAlert && (
        <Alert severity={school.subscriptionExpired ? 'error' : 'warning'} sx={{ mb: 2 }}>
          {school.alertReasons || 'This school needs attention.'}
        </Alert>
      )}
      <SectionHeader title="Profile" action={
        <Stack direction="row" spacing={1}>
          <Button size="small" startIcon={<Download />}
            onClick={() => superAdminApi.exportSchool(school.id, school.code).catch(() => enqueueSnackbar('Export failed', { variant: 'error' }))}>
            Export
          </Button>
          <Button size="small" startIcon={<Edit />} onClick={onEdit}>Edit</Button>
        </Stack>
      } />
      <Rows rows={[
        ['School Code', school.code],
        ['Legal Name', school.legalName],
        ['Email', school.email],
        ['Phone', school.phone],
        ['Mobile', school.mobile],
        ['Website', school.website],
        ['Registered Address', [school.address, school.city, school.state, school.pincode].filter(Boolean).join(', ')],
        ['Academic Year', school.currentAcademicYear],
        ['Registered', school.createdAt ? fmtDate(school.createdAt) : null],
      ]} />
      <Divider sx={{ my: 2 }} />
      <SectionHeader title="Usage" />
      <Rows rows={[
        ['Students', `${school.studentCount ?? 0}${school.maxStudents ? ` / ${school.maxStudents}${school.studentUsagePct != null ? ` (${school.studentUsagePct}%)` : ''}` : ''}`],
        ['Staff / Teachers', `${school.teacherCount ?? 0}${school.maxTeachers ? ` / ${school.maxTeachers}${school.teacherUsagePct != null ? ` (${school.teacherUsagePct}%)` : ''}` : ''}`],
        ['Parents', `${school.parentCount ?? 0}${school.maxParents ? ` / ${school.maxParents}${school.parentUsagePct != null ? ` (${school.parentUsagePct}%)` : ''}` : ''}`],
        ['Subscription', school.subscriptionExpiry ? `${fmtDate(school.subscriptionExpiry)}${school.subscriptionExpired ? ' · expired' : school.subscriptionExpiringSoon ? ` · ${school.daysToExpiry}d left` : ''}` : '—'],
      ]} />
    </Box>
  );
}

const SCHOOL_TYPES = ['PRIVATE', 'GOVERNMENT', 'AIDED', 'TRUST'];
const BOARDS = ['CBSE', 'ICSE', 'STATE', 'IB', 'IGCSE', 'OTHER'];

function ConfigTab({ school, onSaved }: { school: any; onSaved: () => void }) {
  const { enqueueSnackbar } = useSnackbar();
  const [f, setF] = useState<Record<string, any>>({
    registrationNumber: school.registrationNumber ?? '', registrationDate: school.registrationDate ?? '',
    schoolType: school.schoolType ?? '', pan: '', gstin: school.gstin ?? '', gstinVerified: !!school.gstinVerified,
    affiliationBoard: school.affiliationBoard ?? '', affiliationNumber: school.affiliationNumber ?? '',
    recognitionDetails: school.recognitionDetails ?? '', affiliationValidFrom: school.affiliationValidFrom ?? '',
    affiliationValidTo: school.affiliationValidTo ?? '',
    operationalAddress: school.operationalAddress ?? '', operationalCity: school.operationalCity ?? '',
    operationalState: school.operationalState ?? '', operationalPincode: school.operationalPincode ?? '',
    signatoryName: school.signatoryName ?? '', signatoryDesignation: school.signatoryDesignation ?? '',
    receiptHeader: school.receiptHeader ?? '', receiptFooter: school.receiptFooter ?? '', receiptPrefix: school.receiptPrefix ?? '',
    senderDisplayName: school.senderDisplayName ?? '', notificationEmail: school.notificationEmail ?? '', notificationPhone: school.notificationPhone ?? '',
  });
  const set = (p: Record<string, any>) => setF((x) => ({ ...x, ...p }));

  const mut = useMutation({
    mutationFn: () => {
      // Only send PAN if the admin typed a new one (the stored value comes back masked).
      const payload = { ...f };
      if (!payload.pan) delete payload.pan;
      Object.keys(payload).forEach((k) => { if (payload[k] === '') delete payload[k]; });
      return superAdminApi.updateConfig(school.id, payload);
    },
    onSuccess: () => { enqueueSnackbar('Configuration saved', { variant: 'success' }); onSaved(); },
    onError: (e: any) => enqueueSnackbar(e?.response?.data?.message ?? 'Save failed', { variant: 'error' }),
  });

  const T = (label: string, key: string, props: any = {}) => (
    <TextField label={label} fullWidth size="small" value={f[key]} onChange={(e) => set({ [key]: e.target.value })} {...props} />
  );

  return (
    <Box>
      <Typography variant="subtitle2" fontWeight={700} gutterBottom>Legal Identity</Typography>
      <Grid container spacing={1.5}>
        <Grid item xs={12} sm={6}>{T('Registration Number', 'registrationNumber')}</Grid>
        <Grid item xs={12} sm={6}>{T('Registration Date', 'registrationDate', { type: 'date', InputLabelProps: { shrink: true } })}</Grid>
        <Grid item xs={12} sm={6}>
          <TextField select label="School Type" fullWidth size="small" value={f.schoolType} onChange={(e) => set({ schoolType: e.target.value })}>
            <MenuItem value="">—</MenuItem>
            {SCHOOL_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField label="PAN" fullWidth size="small" value={f.pan}
            onChange={(e) => set({ pan: e.target.value.toUpperCase() })}
            placeholder={school.pan || 'Not set'} helperText={school.pan ? `Stored: ${school.pan}` : 'Masked when saved'} />
        </Grid>
        <Grid item xs={12} sm={6}>{T('GSTIN', 'gstin', { onChange: (e: any) => set({ gstin: e.target.value.toUpperCase() }) })}</Grid>
        <Grid item xs={12} sm={6} sx={{ display: 'flex', alignItems: 'center' }}>
          <FormControlLabel control={<Switch checked={f.gstinVerified} onChange={(e) => set({ gstinVerified: e.target.checked })} />} label="GSTIN verified" />
        </Grid>
      </Grid>

      <Divider sx={{ my: 2 }} />
      <Typography variant="subtitle2" fontWeight={700} gutterBottom>Affiliation</Typography>
      <Grid container spacing={1.5}>
        <Grid item xs={12} sm={6}>
          <TextField select label="Board" fullWidth size="small" value={f.affiliationBoard} onChange={(e) => set({ affiliationBoard: e.target.value })}>
            <MenuItem value="">—</MenuItem>
            {BOARDS.map((b) => <MenuItem key={b} value={b}>{b}</MenuItem>)}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={6}>{T('Affiliation Number', 'affiliationNumber')}</Grid>
        <Grid item xs={12}>{T('Recognition Details', 'recognitionDetails')}</Grid>
        <Grid item xs={12} sm={6}>{T('Valid From', 'affiliationValidFrom', { type: 'date', InputLabelProps: { shrink: true } })}</Grid>
        <Grid item xs={12} sm={6}>{T('Valid To', 'affiliationValidTo', { type: 'date', InputLabelProps: { shrink: true } })}</Grid>
      </Grid>

      <Divider sx={{ my: 2 }} />
      <Typography variant="subtitle2" fontWeight={700} gutterBottom>Operational Address</Typography>
      <Grid container spacing={1.5}>
        <Grid item xs={12}>{T('Address', 'operationalAddress')}</Grid>
        <Grid item xs={12} sm={4}>{T('City', 'operationalCity')}</Grid>
        <Grid item xs={12} sm={4}>{T('State', 'operationalState')}</Grid>
        <Grid item xs={12} sm={4}>{T('Pincode', 'operationalPincode')}</Grid>
      </Grid>

      <Divider sx={{ my: 2 }} />
      <Typography variant="subtitle2" fontWeight={700} gutterBottom>Authorized Signatory</Typography>
      <Grid container spacing={1.5}>
        <Grid item xs={12} sm={6}>{T('Signatory Name', 'signatoryName')}</Grid>
        <Grid item xs={12} sm={6}>{T('Designation', 'signatoryDesignation')}</Grid>
      </Grid>

      <Divider sx={{ my: 2 }} />
      <Typography variant="subtitle2" fontWeight={700} gutterBottom>Receipt</Typography>
      <Grid container spacing={1.5}>
        <Grid item xs={12} sm={6}>{T('Receipt Header', 'receiptHeader')}</Grid>
        <Grid item xs={12} sm={6}>{T('Receipt Prefix', 'receiptPrefix', { placeholder: 'DPS/2026/' })}</Grid>
        <Grid item xs={12}>{T('Receipt Footer', 'receiptFooter')}</Grid>
      </Grid>

      <Divider sx={{ my: 2 }} />
      <Typography variant="subtitle2" fontWeight={700} gutterBottom>Communication</Typography>
      <Grid container spacing={1.5}>
        <Grid item xs={12} sm={4}>{T('Sender Display Name', 'senderDisplayName')}</Grid>
        <Grid item xs={12} sm={4}>{T('Notification Email', 'notificationEmail')}</Grid>
        <Grid item xs={12} sm={4}>{T('Notification Phone', 'notificationPhone')}</Grid>
      </Grid>

      <Box sx={{ mt: 2.5, display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="contained" disabled={mut.isPending} onClick={() => mut.mutate()}>
          {mut.isPending ? 'Saving…' : 'Save Configuration'}
        </Button>
      </Box>
    </Box>
  );
}

function SubscriptionTab({ school, onSaved }: { school: any; onSaved: () => void }) {
  const qc = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [planCode, setPlanCode] = useState(school.subscriptionPlanCode ?? '');
  const [expiry, setExpiry] = useState('');
  const [renewMonths, setRenewMonths] = useState(12);
  const [invOpen, setInvOpen] = useState(false);

  const { data: plans = [] } = useQuery({ queryKey: ['sa-plans'], queryFn: superAdminApi.listPlans });
  const { data: invoices = [] } = useQuery({ queryKey: ['sa-invoices', school.id], queryFn: () => superAdminApi.listInvoices(school.id) });

  const assignMut = useMutation({
    mutationFn: () => superAdminApi.assignSubscription(school.id, planCode, expiry || undefined),
    onSuccess: () => { enqueueSnackbar('Plan assigned', { variant: 'success' }); setExpiry(''); onSaved(); },
    onError: (e: any) => enqueueSnackbar(e?.response?.data?.message ?? 'Failed', { variant: 'error' }),
  });
  const renewMut = useMutation({
    mutationFn: () => superAdminApi.renewSubscription(school.id, renewMonths),
    onSuccess: () => { enqueueSnackbar('Subscription renewed', { variant: 'success' }); onSaved(); },
    onError: (e: any) => enqueueSnackbar(e?.response?.data?.message ?? 'Renew failed', { variant: 'error' }),
  });
  const paidMut = useMutation({
    mutationFn: (invoiceId: number) => superAdminApi.markInvoicePaid(school.id, invoiceId),
    onSuccess: () => { enqueueSnackbar('Invoice marked paid', { variant: 'success' }); qc.invalidateQueries({ queryKey: ['sa-invoices', school.id] }); },
  });

  return (
    <Box>
      <SectionHeader title="Current Subscription" />
      <Rows rows={[
        ['Plan', school.subscriptionPlan],
        ['Expires', school.subscriptionExpiry ? fmtDate(school.subscriptionExpiry) : null],
      ]} />

      <Grid container spacing={1.5} sx={{ mt: 0.5 }}>
        <Grid item xs={12} sm={5}>
          <TextField select size="small" label="Plan" fullWidth value={planCode} onChange={(e) => setPlanCode(e.target.value)}>
            {(plans as any[]).map((p) => <MenuItem key={p.planCode} value={p.planCode}>{p.planName}</MenuItem>)}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField size="small" type="date" label="Expiry" fullWidth InputLabelProps={{ shrink: true }} value={expiry} onChange={(e) => setExpiry(e.target.value)} />
        </Grid>
        <Grid item xs={12} sm={3} sx={{ display: 'flex' }}>
          <Button variant="contained" fullWidth disabled={!planCode || assignMut.isPending} onClick={() => assignMut.mutate()}>Assign</Button>
        </Grid>
        <Grid item xs={12} sm={5}>
          <TextField select size="small" label="Renew for" fullWidth value={renewMonths} onChange={(e) => setRenewMonths(Number(e.target.value))}>
            {[1, 3, 6, 12, 24].map((m) => <MenuItem key={m} value={m}>{m} month{m > 1 ? 's' : ''}</MenuItem>)}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={3} sx={{ display: 'flex' }}>
          <Button variant="outlined" fullWidth disabled={renewMut.isPending} onClick={() => renewMut.mutate()}>Renew</Button>
        </Grid>
      </Grid>

      <Divider sx={{ my: 2 }} />
      <SectionHeader title="Billing" action={<Button size="small" startIcon={<CreditCard />} onClick={() => setInvOpen(true)}>New Invoice</Button>} />
      {(invoices as any[]).length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>No invoices yet.</Typography>
      ) : (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Invoice</TableCell><TableCell>Amount</TableCell><TableCell>Issued</TableCell>
              <TableCell>Status</TableCell><TableCell></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(invoices as any[]).map((inv) => (
              <TableRow key={inv.id}>
                <TableCell sx={{ fontFamily: 'monospace', fontSize: 11 }}>{inv.invoiceNumber}</TableCell>
                <TableCell>₹{inv.amount}</TableCell>
                <TableCell>{inv.issueDate ? fmtDate(inv.issueDate) : '—'}</TableCell>
                <TableCell>
                  <Chip size="small" label={inv.status}
                    color={inv.status === 'PAID' ? 'success' : inv.status === 'OVERDUE' ? 'error' : 'warning'} />
                </TableCell>
                <TableCell>
                  {inv.status !== 'PAID' && (
                    <Button size="small" disabled={paidMut.isPending} onClick={() => paidMut.mutate(inv.id)}>Mark paid</Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {invOpen && <InvoiceDialog schoolId={school.id} defaultPlan={school.subscriptionPlanCode}
        onClose={() => setInvOpen(false)}
        onCreated={() => { setInvOpen(false); qc.invalidateQueries({ queryKey: ['sa-invoices', school.id] }); }} />}
    </Box>
  );
}

function InvoiceDialog({ schoolId, defaultPlan, onClose, onCreated }: { schoolId: number; defaultPlan?: string; onClose: () => void; onCreated: () => void }) {
  const { enqueueSnackbar } = useSnackbar();
  const [form, setForm] = useState({ planCode: defaultPlan ?? '', billingPeriod: 'MONTHLY', amount: '', dueDate: '', notes: '' });
  const set = (p: Partial<typeof form>) => setForm((f) => ({ ...f, ...p }));
  const mut = useMutation({
    mutationFn: () => superAdminApi.createInvoice(schoolId, {
      planCode: form.planCode || undefined, billingPeriod: form.billingPeriod,
      amount: Number(form.amount), dueDate: form.dueDate || undefined, notes: form.notes || undefined,
    }),
    onSuccess: () => { enqueueSnackbar('Invoice created', { variant: 'success' }); onCreated(); },
    onError: (e: any) => enqueueSnackbar(e?.response?.data?.message ?? 'Failed', { variant: 'error' }),
  });
  return (
    <Dialog open onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle fontWeight={700}>New Invoice</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <TextField label="Amount (₹) *" type="number" fullWidth value={form.amount} onChange={(e) => set({ amount: e.target.value })} />
          <TextField select label="Billing Period" fullWidth value={form.billingPeriod} onChange={(e) => set({ billingPeriod: e.target.value })}>
            <MenuItem value="MONTHLY">Monthly</MenuItem>
            <MenuItem value="ANNUAL">Annual</MenuItem>
          </TextField>
          <TextField label="Due Date" type="date" fullWidth InputLabelProps={{ shrink: true }} value={form.dueDate} onChange={(e) => set({ dueDate: e.target.value })} />
          <TextField label="Notes" fullWidth value={form.notes} onChange={(e) => set({ notes: e.target.value })} />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="outlined">Cancel</Button>
        <Button variant="contained" disabled={!form.amount || mut.isPending} onClick={() => mut.mutate()}>Create</Button>
      </DialogActions>
    </Dialog>
  );
}

function AdminsTab({ schoolId }: { schoolId: number }) {
  const qc = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [createOpen, setCreateOpen] = useState(false);
  const { data: admins = [], isLoading } = useQuery({ queryKey: ['sa-admins', schoolId], queryFn: () => superAdminApi.listAdmins(schoolId) });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['sa-admins', schoolId] });
  const resetMut = useMutation({
    mutationFn: (userId: number) => superAdminApi.resetAdminPassword(schoolId, userId),
    onSuccess: (msg) => enqueueSnackbar(typeof msg === 'string' ? msg : 'Password reset', { variant: 'success' }),
    onError: (e: any) => enqueueSnackbar(e?.response?.data?.message ?? 'Reset failed', { variant: 'error' }),
  });
  const statusMut = useMutation({
    mutationFn: ({ userId, active }: { userId: number; active: boolean }) => superAdminApi.setAdminStatus(schoolId, userId, active),
    onSuccess: () => { enqueueSnackbar('Admin updated', { variant: 'success' }); invalidate(); },
    onError: (e: any) => enqueueSnackbar(e?.response?.data?.message ?? 'Failed', { variant: 'error' }),
  });

  return (
    <Box>
      <SectionHeader title="School Admins" action={<Button size="small" startIcon={<PersonAdd />} onClick={() => setCreateOpen(true)}>Create Admin</Button>} />
      {isLoading ? <CircularProgress size={24} /> : (admins as any[]).length === 0 ? (
        <Typography variant="body2" color="text.secondary">No admin accounts yet.</Typography>
      ) : (
        <Stack divider={<Divider />}>
          {(admins as any[]).map((a) => (
            <Box key={a.id} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 1 }}>
              <Box>
                <Typography variant="body2" fontWeight={600}>{a.firstName} {a.lastName}</Typography>
                <Typography variant="caption" color="text.secondary">{a.email}</Typography>
              </Box>
              <Stack direction="row" spacing={0.5} alignItems="center">
                <Chip size="small" label={a.status} color={a.active ? 'success' : 'default'} />
                <IconButton size="small" title="Reset password" disabled={resetMut.isPending} onClick={() => resetMut.mutate(a.id)}>
                  <LockReset fontSize="small" />
                </IconButton>
                <Switch size="small" checked={a.active}
                  onChange={(e) => statusMut.mutate({ userId: a.id, active: e.target.checked })} />
              </Stack>
            </Box>
          ))}
        </Stack>
      )}
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
        To replace the primary admin: create the new admin, then deactivate the old one.
      </Typography>
      {createOpen && <CreateAdminDialog schoolId={schoolId} onClose={() => setCreateOpen(false)} onCreated={() => { setCreateOpen(false); invalidate(); }} />}
    </Box>
  );
}

function HistoryTab({ schoolId }: { schoolId: number }) {
  const { data: history = [], isLoading } = useQuery({ queryKey: ['sa-history', schoolId], queryFn: () => superAdminApi.getHistory(schoolId) });
  if (isLoading) return <CircularProgress size={24} />;
  if ((history as any[]).length === 0) return <Typography variant="body2" color="text.secondary">No history yet.</Typography>;
  return (
    <Stack divider={<Divider />}>
      {(history as any[]).map((h) => (
        <Box key={h.id} sx={{ py: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" fontWeight={600}>{h.action?.replace(/_/g, ' ')}</Typography>
            <Typography variant="caption" color="text.disabled">{h.createdAt ? fmtDate(h.createdAt, 'DD MMM YYYY, HH:mm') : ''}</Typography>
          </Box>
          <Typography variant="caption" color="text.secondary">
            {h.entityType}{h.performedBy ? ` · by ${h.performedBy}` : ''}
          </Typography>
        </Box>
      ))}
    </Stack>
  );
}

function EditSchoolDialog({ school, onClose, onSaved }: { school: any; onClose: () => void; onSaved: () => void }) {
  const { enqueueSnackbar } = useSnackbar();
  const [form, setForm] = useState<CreateTenantPayload>({
    name: school.name ?? '', legalName: school.legalName ?? '', code: school.code ?? '',
    email: school.email ?? '', phone: school.phone ?? '', mobile: school.mobile ?? '', website: school.website ?? '',
    address: school.address ?? '', city: school.city ?? '', state: school.state ?? '', country: school.country ?? '',
    pincode: school.pincode ?? '', currentAcademicYear: school.currentAcademicYear ?? '',
  });
  const set = (p: Partial<CreateTenantPayload>) => setForm((f) => ({ ...f, ...p }));
  const mut = useMutation({
    mutationFn: () => superAdminApi.updateSchool(school.id, form),
    onSuccess: () => { enqueueSnackbar('School updated', { variant: 'success' }); onSaved(); },
    onError: (e: any) => enqueueSnackbar(e?.response?.data?.message ?? 'Update failed', { variant: 'error' }),
  });
  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle fontWeight={700}>Edit School</DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}><TextField label="Name *" fullWidth value={form.name} onChange={(e) => set({ name: e.target.value })} /></Grid>
          <Grid item xs={12} sm={6}><TextField label="Code *" fullWidth value={form.code} onChange={(e) => set({ code: e.target.value.toUpperCase() })} /></Grid>
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
          <Grid item xs={12} sm={6}><TextField label="Academic Year" fullWidth value={form.currentAcademicYear} onChange={(e) => set({ currentAcademicYear: e.target.value })} /></Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="outlined">Cancel</Button>
        <Button variant="contained" disabled={!form.name.trim() || !form.code.trim() || mut.isPending} onClick={() => mut.mutate()}>
          {mut.isPending ? 'Saving…' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function CreateAdminDialog({ schoolId, onClose, onCreated }: { schoolId: number; onClose: () => void; onCreated: () => void }) {
  const { enqueueSnackbar } = useSnackbar();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', mobile: '' });
  const set = (p: Partial<typeof form>) => setForm((f) => ({ ...f, ...p }));
  const mut = useMutation({
    mutationFn: () => superAdminApi.createAdmin(schoolId, {
      firstName: form.firstName, lastName: form.lastName, email: form.email,
      password: form.password || undefined, mobile: form.mobile || undefined,
    }),
    onSuccess: (msg) => { enqueueSnackbar(typeof msg === 'string' ? msg : 'Admin created', { variant: 'success' }); onCreated(); },
    onError: (e: any) => enqueueSnackbar(e?.response?.data?.message ?? 'Could not create admin', { variant: 'error' }),
  });
  const canSave = !!form.firstName && !!form.lastName && !!form.email && !mut.isPending;
  return (
    <Dialog open onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle fontWeight={700}>Create School Admin</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Alert severity="info" sx={{ py: 0.5 }}>The admin logs in with their email.</Alert>
          <Grid container spacing={2}>
            <Grid item xs={6}><TextField label="First Name *" fullWidth value={form.firstName} onChange={(e) => set({ firstName: e.target.value })} /></Grid>
            <Grid item xs={6}><TextField label="Last Name *" fullWidth value={form.lastName} onChange={(e) => set({ lastName: e.target.value })} /></Grid>
          </Grid>
          <TextField label="Email (login) *" fullWidth value={form.email} onChange={(e) => set({ email: e.target.value })} />
          <TextField label="Mobile" fullWidth value={form.mobile} onChange={(e) => set({ mobile: e.target.value })} />
          <TextField label="Temporary Password" fullWidth value={form.password} onChange={(e) => set({ password: e.target.value })}
            helperText="Leave blank to use the default (School@123)" />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="outlined">Cancel</Button>
        <Button variant="contained" disabled={!canSave} onClick={() => mut.mutate()}>
          {mut.isPending ? 'Creating…' : 'Create Admin'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
