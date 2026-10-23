import {
  Box, Card, Grid, Typography, Tabs, Tab, Button, Chip, CircularProgress, Divider, Stack,
  Table, TableBody, TableCell, TableHead, TableRow, TextField, Dialog, DialogTitle,
  DialogContent, DialogActions, MenuItem, Alert, TablePagination,
} from '@mui/material';
import {
  CreditScore, AccountBalance, ReportProblem, Sync, Upload, Settings, Payments,
} from '@mui/icons-material';
import { useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { financeApi, type GatewayAccount, type ReconException } from '@/api/finance.api';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { fmtCurrency, fmtDate } from '@/utils/formatters';

export default function FinancePage() {
  const [tab, setTab] = useState(0);
  return (
    <Box>
      <PageHeader title="Payment Reconciliation" subtitle="Online payments, 3-way reconciliation and refunds"
        crumbs={[{ label: 'Finance' }, { label: 'Reconciliation' }]} />
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3, borderBottom: '1px solid #EBEBEB' }}>
        <Tab icon={<AccountBalance />} iconPosition="start" label="Reconciliation" />
        <Tab icon={<Payments />} iconPosition="start" label="Payments" />
        <Tab icon={<ReportProblem />} iconPosition="start" label="Exceptions" />
        <Tab icon={<Settings />} iconPosition="start" label="Gateway Keys" />
      </Tabs>
      {tab === 0 && <ReconTab />}
      {tab === 1 && <PaymentsTab />}
      {tab === 2 && <ExceptionsTab />}
      {tab === 3 && <GatewayTab />}
    </Box>
  );
}

function Tile({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: string; sub?: string; color: string }) {
  return (
    <Card sx={{ p: 2.5, height: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: `${color}18`, color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</Box>
        <Box>
          <Typography variant="h5" fontWeight={800}>{value}</Typography>
          <Typography variant="body2" color="text.secondary">{label}</Typography>
          {sub && <Typography variant="caption" color="text.disabled">{sub}</Typography>}
        </Box>
      </Box>
    </Card>
  );
}

function ReconTab() {
  const qc = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const bankInput = useRef<HTMLInputElement>(null);
  const today = new Date().toISOString().slice(0, 10);
  const monthAgo = new Date(Date.now() - 30 * 86400_000).toISOString().slice(0, 10);
  const [from, setFrom] = useState(monthAgo);
  const [to, setTo] = useState(today);

  const { data: s, isLoading } = useQuery({ queryKey: ['fin-summary'], queryFn: financeApi.summary });

  const runMut = useMutation({
    mutationFn: () => financeApi.runReconciliation(from, to),
    onSuccess: () => { enqueueSnackbar('Reconciliation complete', { variant: 'success' }); qc.invalidateQueries({ queryKey: ['fin-summary'] }); qc.invalidateQueries({ queryKey: ['fin-exceptions'] }); },
    onError: (e: any) => enqueueSnackbar(e?.response?.data?.message ?? 'Reconciliation failed', { variant: 'error' }),
  });
  const settleMut = useMutation({
    mutationFn: () => financeApi.importSettlements(from, to),
    onSuccess: (r: any) => enqueueSnackbar(r?.message ?? 'Settlements imported', { variant: 'success' }),
    onError: (e: any) => enqueueSnackbar(e?.response?.data?.message ?? 'Import failed', { variant: 'error' }),
  });
  const bankMut = useMutation({
    mutationFn: (file: File) => financeApi.importBank(file),
    onSuccess: (r: any) => enqueueSnackbar(r?.message ?? 'Bank statement processed', { variant: 'success' }),
    onError: (e: any) => enqueueSnackbar(e?.response?.data?.message ?? 'Import failed', { variant: 'error' }),
  });

  if (isLoading) return <Box sx={{ textAlign: 'center', py: 6 }}><CircularProgress /></Box>;

  return (
    <Box>
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} sm={6} md={3}><Tile icon={<CreditScore />} label="Captured payments" value={fmtCurrency(s?.capturedTotal ?? 0)} color="#0C831F" /></Grid>
        <Grid item xs={12} sm={6} md={3}><Tile icon={<AccountBalance />} label="Allocated to fees" value={fmtCurrency(s?.allocatedTotal ?? 0)} color="#2E6FF2" /></Grid>
        <Grid item xs={12} sm={6} md={3}><Tile icon={<Sync />} label="Expected settlement" value={fmtCurrency(s?.expectedSettlement ?? 0)} color="#7C3AED" /></Grid>
        <Grid item xs={12} sm={6} md={3}><Tile icon={<ReportProblem />} label="Open exceptions" value={String(s?.openExceptions ?? 0)} sub={`${s?.unmatchedPayments ?? 0} unmatched · ${s?.settlementExceptions ?? 0} settlement`} color="#E23744" /></Grid>
      </Grid>

      <Card sx={{ p: 2.5 }}>
        <Typography variant="subtitle1" fontWeight={700} gutterBottom>Run reconciliation</Typography>
        <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap alignItems="center">
          <TextField size="small" type="date" label="From" InputLabelProps={{ shrink: true }} value={from} onChange={(e) => setFrom(e.target.value)} />
          <TextField size="small" type="date" label="To" InputLabelProps={{ shrink: true }} value={to} onChange={(e) => setTo(e.target.value)} />
          <Button variant="contained" startIcon={<Sync />} disabled={runMut.isPending} onClick={() => runMut.mutate()}>
            {runMut.isPending ? 'Running…' : 'Run reconciliation'}
          </Button>
          <Button variant="outlined" startIcon={<AccountBalance />} disabled={settleMut.isPending} onClick={() => settleMut.mutate()}>
            Import settlements
          </Button>
          <Button variant="outlined" startIcon={<Upload />} onClick={() => bankInput.current?.click()}>
            Import bank CSV
          </Button>
          <input ref={bankInput} type="file" accept=".csv,text/csv" hidden
            onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) bankMut.mutate(f); }} />
        </Stack>
        <Alert severity="info" sx={{ mt: 2 }}>
          Captured payments are recorded at the full amount against the student's fees. Gateway fees are a separate expense and never reduce the student's paid amount.
        </Alert>
      </Card>
    </Box>
  );
}

function PaymentsTab() {
  const qc = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [refundFor, setRefundFor] = useState<any | null>(null);
  const { data, isLoading } = useQuery({ queryKey: ['fin-payments', page, size], queryFn: () => financeApi.payments(page, size) });
  const rows = (data as any)?.content ?? [];
  const total = (data as any)?.totalElements ?? 0;

  const color = (st: string) => st === 'CAPTURED' ? 'success' : st === 'FAILED' ? 'error' : st?.includes('REFUND') ? 'warning' : 'default';

  return (
    <Card>
      {isLoading ? <Box sx={{ textAlign: 'center', py: 6 }}><CircularProgress /></Box> : rows.length === 0 ? (
        <EmptyState title="No online payments yet" description="Payments made by students via Razorpay appear here." />
      ) : (
        <>
          <Table size="small">
            <TableHead><TableRow>
              <TableCell>Payment</TableCell><TableCell>Method</TableCell><TableCell>Amount</TableCell>
              <TableCell>Status</TableCell><TableCell>Allocated</TableCell><TableCell>Receipt</TableCell>
              <TableCell>Date</TableCell><TableCell align="right">Action</TableCell>
            </TableRow></TableHead>
            <TableBody>
              {rows.map((p: any) => (
                <TableRow key={p.id} hover>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: 11 }}>{p.razorpayPaymentId ?? '—'}</TableCell>
                  <TableCell>{p.method ?? '—'}</TableCell>
                  <TableCell>{fmtCurrency(p.capturedAmount ?? p.amount ?? 0)}{p.amountRefunded > 0 ? ` (−${fmtCurrency(p.amountRefunded)})` : ''}</TableCell>
                  <TableCell><Chip size="small" label={p.status} color={color(p.status) as any} /></TableCell>
                  <TableCell>{p.allocated ? <Chip size="small" label="Yes" color="success" variant="outlined" /> : <Chip size="small" label="No" color="warning" variant="outlined" />}</TableCell>
                  <TableCell sx={{ fontSize: 11 }}>{p.receiptNumber ?? '—'}</TableCell>
                  <TableCell>{p.capturedAt ? fmtDate(p.capturedAt) : (p.createdAt ? fmtDate(p.createdAt) : '—')}</TableCell>
                  <TableCell align="right">
                    {(p.status === 'CAPTURED' || p.status === 'PARTIALLY_REFUNDED') && (
                      <Button size="small" onClick={() => setRefundFor(p)}>Refund</Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination component="div" count={total} page={page} rowsPerPage={size}
            onPageChange={(_, p) => setPage(p)} onRowsPerPageChange={(e) => { setSize(parseInt(e.target.value, 10)); setPage(0); }} rowsPerPageOptions={[10, 20, 50]} />
        </>
      )}
      {refundFor && <RefundDialog payment={refundFor} onClose={() => setRefundFor(null)}
        onDone={() => { setRefundFor(null); qc.invalidateQueries({ queryKey: ['fin-payments'] }); }} />}
    </Card>
  );
}

function RefundDialog({ payment, onClose, onDone }: { payment: any; onClose: () => void; onDone: () => void }) {
  const { enqueueSnackbar } = useSnackbar();
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const mut = useMutation({
    mutationFn: () => financeApi.refund(payment.id, { amount: amount ? Number(amount) : undefined, reason }),
    onSuccess: (r: any) => { enqueueSnackbar(`Refund ${r?.data?.status ?? 'requested'}`, { variant: 'success' }); onDone(); },
    onError: (e: any) => enqueueSnackbar(e?.response?.data?.message ?? 'Refund failed', { variant: 'error' }),
  });
  const max = payment.capturedAmount ?? payment.amount ?? 0;
  return (
    <Dialog open onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle fontWeight={700}>Refund payment</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Typography variant="body2" color="text.secondary">Captured {fmtCurrency(max)} · {payment.razorpayPaymentId}</Typography>
          <TextField label={`Amount (blank = full ${fmtCurrency(max)})`} type="number" fullWidth value={amount} onChange={(e) => setAmount(e.target.value)} />
          <TextField label="Reason" fullWidth value={reason} onChange={(e) => setReason(e.target.value)} />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="outlined">Cancel</Button>
        <Button variant="contained" color="error" disabled={mut.isPending} onClick={() => mut.mutate()}>
          {mut.isPending ? 'Processing…' : 'Issue refund'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function ExceptionsTab() {
  const qc = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [status, setStatus] = useState('OPEN');
  const [resolveFor, setResolveFor] = useState<ReconException | null>(null);
  const { data: list = [], isLoading } = useQuery({ queryKey: ['fin-exceptions', status], queryFn: () => financeApi.exceptions(status || undefined) });

  return (
    <Card sx={{ p: 2 }}>
      <Stack direction="row" spacing={2} sx={{ mb: 2 }} alignItems="center">
        <TextField select size="small" label="Status" value={status} onChange={(e) => setStatus(e.target.value)} sx={{ width: 200 }}>
          <MenuItem value="">All</MenuItem>
          <MenuItem value="OPEN">Open</MenuItem>
          <MenuItem value="INVESTIGATING">Investigating</MenuItem>
          <MenuItem value="RESOLVED">Resolved</MenuItem>
          <MenuItem value="WAIVED_WITH_APPROVAL">Waived</MenuItem>
        </TextField>
      </Stack>
      {isLoading ? <CircularProgress size={24} /> : (list as ReconException[]).length === 0 ? (
        <EmptyState title="No exceptions" description="Unmatched or inconsistent entries will appear here." />
      ) : (
        <Stack divider={<Divider />}>
          {(list as ReconException[]).map((e) => (
            <Box key={e.id} sx={{ py: 1.25, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 0.25 }}>
                  <Chip size="small" label={e.exceptionType.replace(/_/g, ' ')} color="warning" />
                  <Chip size="small" label={e.status} variant="outlined" />
                </Box>
                <Typography variant="body2">{e.description}</Typography>
                {e.resolutionNote && <Typography variant="caption" color="text.secondary">Resolution: {e.resolutionNote}</Typography>}
              </Box>
              {e.status === 'OPEN' || e.status === 'INVESTIGATING' ? (
                <Button size="small" variant="outlined" onClick={() => setResolveFor(e)}>Resolve</Button>
              ) : null}
            </Box>
          ))}
        </Stack>
      )}
      {resolveFor && <ResolveDialog exc={resolveFor} onClose={() => setResolveFor(null)}
        onDone={() => { setResolveFor(null); qc.invalidateQueries({ queryKey: ['fin-exceptions'] }); qc.invalidateQueries({ queryKey: ['fin-summary'] }); enqueueSnackbar('Exception updated', { variant: 'success' }); }} />}
    </Card>
  );
}

function ResolveDialog({ exc, onClose, onDone }: { exc: ReconException; onClose: () => void; onDone: () => void }) {
  const { enqueueSnackbar } = useSnackbar();
  const [newStatus, setNewStatus] = useState('RESOLVED');
  const [note, setNote] = useState('');
  const mut = useMutation({
    mutationFn: () => financeApi.resolveException(exc.id, { status: newStatus, note }),
    onSuccess: onDone,
    onError: (e: any) => enqueueSnackbar(e?.response?.data?.message ?? 'Failed', { variant: 'error' }),
  });
  return (
    <Dialog open onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle fontWeight={700}>Resolve exception</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Typography variant="body2" color="text.secondary">{exc.description}</Typography>
          <TextField select label="New status" fullWidth value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
            <MenuItem value="INVESTIGATING">Investigating</MenuItem>
            <MenuItem value="RESOLVED">Resolved</MenuItem>
            <MenuItem value="WAIVED_WITH_APPROVAL">Waived (approved)</MenuItem>
          </TextField>
          <TextField label="Resolution note" fullWidth multiline minRows={2} value={note} onChange={(e) => setNote(e.target.value)} />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="outlined">Cancel</Button>
        <Button variant="contained" disabled={mut.isPending} onClick={() => mut.mutate()}>Save</Button>
      </DialogActions>
    </Dialog>
  );
}

function GatewayTab() {
  const qc = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const { data: accounts = [], isLoading } = useQuery({ queryKey: ['fin-gateway'], queryFn: financeApi.gatewayAccounts });
  const [form, setForm] = useState({ mode: 'TEST', keyId: '', keySecret: '', webhookSecret: '', active: true });
  const set = (p: Partial<typeof form>) => setForm((f) => ({ ...f, ...p }));
  const mut = useMutation({
    mutationFn: () => financeApi.saveGatewayAccount(form),
    onSuccess: () => { enqueueSnackbar('Gateway account saved', { variant: 'success' }); qc.invalidateQueries({ queryKey: ['fin-gateway'] }); setForm({ mode: 'TEST', keyId: '', keySecret: '', webhookSecret: '', active: true }); },
    onError: (e: any) => enqueueSnackbar(e?.response?.data?.message ?? 'Save failed', { variant: 'error' }),
  });

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={6}>
        <Card sx={{ p: 2.5 }}>
          <Typography variant="subtitle1" fontWeight={700} gutterBottom>Configured accounts</Typography>
          {isLoading ? <CircularProgress size={24} /> : (accounts as GatewayAccount[]).length === 0 ? (
            <Typography variant="body2" color="text.secondary">No Razorpay keys configured yet. Add them to enable online payments.</Typography>
          ) : (
            <Stack divider={<Divider />}>
              {(accounts as GatewayAccount[]).map((a) => (
                <Box key={a.id} sx={{ py: 1 }}>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Chip size="small" label={a.mode} color={a.mode === 'LIVE' ? 'success' : 'default'} />
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{a.keyId}</Typography>
                    {a.active && <Chip size="small" label="Active" color="primary" variant="outlined" />}
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    Secret {a.hasSecret ? 'set' : 'missing'} · Webhook secret {a.hasWebhookSecret ? 'set' : 'missing'}
                  </Typography>
                </Box>
              ))}
            </Stack>
          )}
        </Card>
      </Grid>
      <Grid item xs={12} md={6}>
        <Card sx={{ p: 2.5 }}>
          <Typography variant="subtitle1" fontWeight={700} gutterBottom>Add / update keys</Typography>
          <Stack spacing={2}>
            <TextField select label="Mode" value={form.mode} onChange={(e) => set({ mode: e.target.value })}>
              <MenuItem value="TEST">Test</MenuItem>
              <MenuItem value="LIVE">Live</MenuItem>
            </TextField>
            <TextField label="Key ID" value={form.keyId} onChange={(e) => set({ keyId: e.target.value })} placeholder="rzp_test_xxx" />
            <TextField label="Key Secret" value={form.keySecret} onChange={(e) => set({ keySecret: e.target.value })}
              helperText="Stored encrypted. Leave blank to keep the existing secret." />
            <TextField label="Webhook Secret" value={form.webhookSecret} onChange={(e) => set({ webhookSecret: e.target.value })}
              helperText="Used to verify webhook signatures." />
            <Alert severity="warning" sx={{ py: 0.5 }}>Never share your live secret. It is encrypted at rest and never returned by the API.</Alert>
            <Button variant="contained" disabled={!form.keyId || mut.isPending} onClick={() => mut.mutate()}>
              {mut.isPending ? 'Saving…' : 'Save keys'}
            </Button>
          </Stack>
        </Card>
      </Grid>
    </Grid>
  );
}
