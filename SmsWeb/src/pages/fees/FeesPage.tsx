import {
  Box, Button, Card, CardContent, TextField, InputAdornment, Typography,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TableFooter,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Grid, MenuItem, Alert, CircularProgress, Chip, Tabs, Tab,
  IconButton, Tooltip, Stack,
} from '@mui/material';
import {
  Search, Payment, Receipt, TrendingUp, Download,
  AccountBalance, Warning, CheckCircle, HourglassEmpty,
} from '@mui/icons-material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { feesApi, type RecordPaymentRequest } from '@/api/fees.api';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { fmtDate, fmtCurrency } from '@/utils/formatters';
import { academicYears } from '@/utils/academicYears';

const PAYMENT_METHODS = ['CASH', 'UPI', 'ONLINE', 'CHEQUE', 'BANK_TRANSFER', 'CARD'];

/** Extract the originating template name from a fee's remarks, if present. */
function templateName(remarks?: string): string | null {
  if (!remarks) return null;
  const m = remarks.match(/template:\s*(.+)$/i);
  return m ? m[1].trim() : null;
}

const STATUS_TABS = ['ALL', 'PENDING', 'PAID', 'OVERDUE'];

function SummaryCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: `${color}18`, color, display: 'flex' }}>
          {icon}
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary" textTransform="uppercase" letterSpacing={0.5}>
            {label}
          </Typography>
          <Typography variant="h6" fontWeight={700} color={color}>{value}</Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

export default function FeesPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const [search, setSearch] = useState('');
  // Blank = all academic years, so fees from templates with different years all show.
  const [academicYear, setAcademicYear] = useState('');
  const [minOutstanding, setMinOutstanding] = useState('');
  const [payDialog, setPayDialog] = useState<{ id: number; netAmount: number } | null>(null);

  const statusFilter = STATUS_TABS[tab] === 'ALL' ? undefined : STATUS_TABS[tab];

  const { data: summary } = useQuery({
    queryKey: ['fee-summary', academicYear],
    queryFn: () => feesApi.getSummary(academicYear),
    staleTime: 30_000,
  });

  const { data: fees = [], isLoading } = useQuery<any[]>({
    queryKey: ['fees', statusFilter, academicYear],
    queryFn: () => feesApi.getAll(statusFilter, academicYear),
    staleTime: 30_000,
  });

  const payMutation = useMutation({
    mutationFn: feesApi.recordPayment,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fees'] });
      qc.invalidateQueries({ queryKey: ['fee-summary'] });
      setPayDialog(null);
      resetPay();
    },
  });

  const {
    register: regPay, handleSubmit: handlePay, reset: resetPay,
  } = useForm<RecordPaymentRequest>();

  // Accumulated outstanding per student = sum of every unpaid balance across all
  // their fee templates (independent of the min-outstanding filter below).
  const studentOutstanding = new Map<number, number>();
  for (const f of fees) {
    const bal = Number(f.balance ?? 0);
    if (bal > 0 && f.studentId != null) {
      studentOutstanding.set(f.studentId, (studentOutstanding.get(f.studentId) ?? 0) + bal);
    }
  }

  const minOut = Number(minOutstanding) || 0;
  const filtered = fees
    .filter((f) =>
      search === '' ||
      (f.studentName ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (f.feeCategory ?? '').toLowerCase().includes(search.toLowerCase()))
    .filter((f) => minOut <= 0 || (studentOutstanding.get(f.studentId) ?? 0) >= minOut)
    // Group each student's fees together so multiple fees appear on consecutive rows.
    .sort((a, b) => (a.studentName ?? '').localeCompare(b.studentName ?? ''));

  const totals = filtered.reduce(
    (acc, f) => {
      acc.amount += Number(f.netAmount ?? f.amount ?? 0);
      acc.paid += Number(f.paidAmount ?? 0);
      acc.outstanding += Number(f.balance ?? 0);
      return acc;
    },
    { amount: 0, paid: 0, outstanding: 0 },
  );

  const exportCsv = () => {
    const header = ['Student', 'Category', 'Template', 'Period', 'Financial Year', 'Amount', 'Discount', 'Fine', 'Net', 'Paid', 'Fee Balance', 'Total Outstanding', 'Due Date', 'Status'];
    const rows = filtered.map((f) => [
      f.studentName, f.feeCategory, templateName(f.remarks) ?? '', f.feePeriod, f.academicYear,
      f.amount, f.discount, f.fine, f.netAmount ?? f.amount, f.paidAmount ?? 0, f.balance ?? 0,
      studentOutstanding.get(f.studentId) ?? 0,   // accumulated across all this student's unpaid fees
      f.dueDate, f.status,
    ]);
    const esc = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const csv = [header, ...rows].map((r) => r.map(esc).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const a = document.createElement('a');
    a.href = url; a.download = `fees-${academicYear || 'all'}-${STATUS_TABS[tab].toLowerCase()}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30_000);
  };

  const statusColor: Record<string, string> = {
    PAID: 'success', PENDING: 'warning', PARTIAL: 'info', OVERDUE: 'error',
  };

  return (
    <Box>
      <PageHeader
        title="Fee Management"
        subtitle="Assign, collect, and track school fees"
        crumbs={[{ label: 'Dashboard', path: '/' }, { label: 'Fees' }]}
        action={
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="outlined" startIcon={<AccountBalance />} onClick={() => navigate('/fees/ledger')}>
              Student Ledger
            </Button>
            <Button variant="outlined" startIcon={<Receipt />} onClick={() => navigate('/fees/templates')}>
              Fee Templates
            </Button>
          </Box>
        }
      />

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <SummaryCard
            icon={<TrendingUp />}
            label="Total Billed"
            value={fmtCurrency(summary?.totalBilled ?? 0)}
            color="#1565C0"
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <SummaryCard
            icon={<CheckCircle />}
            label="Collected"
            value={fmtCurrency(summary?.totalCollected ?? 0)}
            color="#2E7D32"
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <SummaryCard
            icon={<HourglassEmpty />}
            label="Pending"
            value={fmtCurrency(summary?.totalPending ?? 0)}
            color="#E65100"
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <SummaryCard
            icon={<Warning />}
            label="Overdue"
            value={fmtCurrency(summary?.totalOverdue ?? 0)}
            color="#B71C1C"
          />
        </Grid>
      </Grid>

      {/* Counts row */}
      {summary && (
        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
          <Chip icon={<CheckCircle />} label={`${summary.countPaid} Paid`} color="success" size="small" />
          <Chip icon={<HourglassEmpty />} label={`${summary.countPending} Pending`} color="warning" size="small" />
          <Chip icon={<Warning />} label={`${summary.countOverdue} Overdue`} color="error" size="small" />
        </Stack>
      )}

      <Card>
        {/* Filters */}
        <Box sx={{ px: 2, pt: 2, pb: 1, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder="Search student or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ width: 280 }}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }}
          />
          <TextField
            select
            size="small"
            label="Financial Year"
            value={academicYear}
            onChange={(e) => setAcademicYear(e.target.value)}
            sx={{ width: 170 }}
          >
            <MenuItem value=""><em>All years</em></MenuItem>
            {academicYears().map((y) => <MenuItem key={y} value={y}>{y}</MenuItem>)}
          </TextField>
          <TextField
            size="small"
            type="number"
            label="Min total due ₹"
            value={minOutstanding}
            onChange={(e) => setMinOutstanding(e.target.value)}
            placeholder="0"
            sx={{ width: 150 }}
            InputProps={{ inputProps: { min: 0 } }}
          />
          <Box sx={{ flex: 1 }} />
          <Button variant="outlined" startIcon={<Download />} onClick={exportCsv} disabled={filtered.length === 0}>
            Export CSV
          </Button>
        </Box>

        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{ px: 2, borderBottom: '1px solid #EBEBEB' }}
          textColor="primary"
          indicatorColor="primary"
        >
          {STATUS_TABS.map((s) => <Tab key={s} label={s} />)}
        </Tabs>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Student</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Period</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Discount</TableCell>
                <TableCell>Fine</TableCell>
                <TableCell>Net Due</TableCell>
                <TableCell>Paid</TableCell>
                <TableCell>Total Outstanding</TableCell>
                <TableCell>Due Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={12} align="center" sx={{ py: 6 }}><CircularProgress /></TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={12}>
                    <EmptyState title="No fee records found" description="Fees are generated from fee templates assigned to a class." />
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((f: any) => {
                  // Accumulated outstanding across all this student's unpaid fees —
                  // shown identically on each of the student's rows.
                  const studentTotal = studentOutstanding.get(f.studentId) ?? 0;
                  return (
                  <TableRow key={f.id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{f.studentName}</TableCell>
                    <TableCell>
                      <Chip label={f.feeCategory} size="small" variant="outlined" />
                      {templateName(f.remarks) && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
                          {templateName(f.remarks)}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
                      {f.feePeriod}
                      {f.academicYear && (
                        <Typography variant="caption" color="text.disabled" sx={{ display: 'block' }}>{f.academicYear}</Typography>
                      )}
                    </TableCell>
                    <TableCell>{fmtCurrency(f.amount)}</TableCell>
                    <TableCell sx={{ color: 'success.main' }}>
                      {f.discount > 0 ? `-${fmtCurrency(f.discount)}` : '—'}
                    </TableCell>
                    <TableCell sx={{ color: 'error.main' }}>
                      {f.fine > 0 ? `+${fmtCurrency(f.fine)}` : '—'}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{fmtCurrency(f.netAmount ?? f.amount)}</TableCell>
                    <TableCell sx={{ color: 'success.main' }}>{fmtCurrency(f.paidAmount ?? 0)}</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: studentTotal > 0 ? 'error.main' : 'text.secondary' }}>
                      {fmtCurrency(studentTotal)}
                    </TableCell>
                    <TableCell>{fmtDate(f.dueDate)}</TableCell>
                    <TableCell>
                      <Chip
                        label={f.status}
                        size="small"
                        color={(statusColor[f.status] ?? 'default') as any}
                      />
                    </TableCell>
                    <TableCell align="right">
                      {f.status !== 'PAID' && (
                        <Tooltip title="Record Payment">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => setPayDialog({ id: f.id, netAmount: f.netAmount ?? f.amount })}
                          >
                            <Payment fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {f.status === 'PAID' && (
                        <Tooltip title="Paid">
                          <CheckCircle fontSize="small" sx={{ color: 'success.main', mt: 0.5 }} />
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                  );
                })
              )}
            </TableBody>
            {filtered.length > 0 && (
              <TableFooter>
                <TableRow sx={{ '& td': { fontWeight: 700, color: 'text.primary', borderTop: '2px solid #EBEBEB' } }}>
                  <TableCell colSpan={6}>Total ({filtered.length} fee{filtered.length === 1 ? '' : 's'})</TableCell>
                  <TableCell>{fmtCurrency(totals.amount)}</TableCell>
                  <TableCell sx={{ color: 'success.main' }}>{fmtCurrency(totals.paid)}</TableCell>
                  <TableCell sx={{ color: totals.outstanding > 0 ? 'error.main' : 'text.secondary' }}>{fmtCurrency(totals.outstanding)}</TableCell>
                  <TableCell colSpan={3} />
                </TableRow>
              </TableFooter>
            )}
          </Table>
        </TableContainer>
      </Card>

      {/* ── Record Payment Dialog ────────────────────────────────────────── */}
      <Dialog
        open={payDialog !== null}
        onClose={() => { setPayDialog(null); resetPay(); }}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle fontWeight={700}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Payment color="primary" />
            Record Payment
          </Box>
        </DialogTitle>
        <form onSubmit={handlePay((d) => payMutation.mutate({ ...d, feeId: payDialog!.id, amountPaid: Number(d.amountPaid) }))}>
          <DialogContent>
            {payMutation.isError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {(payMutation.error as any)?.response?.data?.message ?? 'Failed to record payment'}
              </Alert>
            )}
            {payDialog && (
              <Box sx={{ mb: 2, p: 1.5, bgcolor: '#F0F4FF', borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary">Net Due Amount</Typography>
                <Typography variant="h6" fontWeight={700} color="primary">
                  {fmtCurrency(payDialog.netAmount)}
                </Typography>
              </Box>
            )}
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  label="Amount Paid (₹)" type="number" fullWidth required
                  inputProps={{ min: 1 }}
                  {...regPay('amountPaid', { required: true })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  select label="Payment Method" fullWidth required
                  defaultValue="CASH"
                  {...regPay('paymentMethod', { required: true })}
                >
                  {PAYMENT_METHODS.map((m) => (
                    <MenuItem key={m} value={m}>{m.replace('_', ' ')}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Transaction Reference" fullWidth
                  placeholder="For UPI/online/cheque payments"
                  {...regPay('transactionReference')}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField label="Comment / reason *" fullWidth required multiline minRows={2}
                  {...regPay('remarks', { required: 'A comment is required' })}
                  placeholder="Why / how this payment was reconciled, e.g. 'Cash paid at office'"
                  helperText="Required" />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
            <Button onClick={() => { setPayDialog(null); resetPay(); }} variant="outlined">Cancel</Button>
            <Button type="submit" variant="contained" color="success" disabled={payMutation.isPending}>
              {payMutation.isPending ? 'Processing...' : 'Confirm Payment'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
