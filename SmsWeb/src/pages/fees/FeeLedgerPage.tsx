import {
  Box, Card, Grid, Typography, FormControl, InputLabel, Select, MenuItem,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip,
  Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Alert, CircularProgress, Divider, IconButton, Tooltip,
} from '@mui/material';
import { Payments, Tune, ReceiptLong, PictureAsPdf } from '@mui/icons-material';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { feesApi } from '@/api/fees.api';
import { classesApi, sectionsApi } from '@/api/admin.api';
import { attendanceApi } from '@/api/attendance.api';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { fmtCurrency, fmtDate } from '@/utils/formatters';

const PAYMENT_METHODS = ['CASH', 'UPI', 'ONLINE', 'CHEQUE', 'BANK_TRANSFER', 'CARD'];
const STATUS_COLOR: Record<string, any> = { PAID: 'success', PENDING: 'warning', PARTIAL: 'info', OVERDUE: 'error', WAIVED: 'default' };

export default function FeeLedgerPage() {
  const qc = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const [classId, setClassId] = useState<number | ''>('');
  const [sectionId, setSectionId] = useState<number | ''>('');
  const [studentId, setStudentId] = useState<number | '' | 'ALL'>('');
  const [yearFilter, setYearFilter] = useState<string>('ALL');

  const [reconcile, setReconcile] = useState<any | null>(null);
  const [recAmount, setRecAmount] = useState('');
  const [recMethod, setRecMethod] = useState('CASH');
  const [recRef, setRecRef] = useState('');
  const [recComment, setRecComment] = useState('');

  const [adjust, setAdjust] = useState<any | null>(null);
  const [adjMode, setAdjMode] = useState<'WAIVE' | 'DISCOUNT'>('WAIVE');
  const [adjDiscount, setAdjDiscount] = useState('');
  const [adjComment, setAdjComment] = useState('');

  const { data: classes = [] } = useQuery<any[]>({ queryKey: ['classes'], queryFn: () => classesApi.list(), staleTime: 60_000 });
  const { data: sections = [] } = useQuery<any[]>({ queryKey: ['sections-all'], queryFn: () => sectionsApi.listAll(), staleTime: 60_000 });
  const sectionsForClass = sections.filter((s) => s.classId === classId);

  const { data: roster = [] } = useQuery<any[]>({
    queryKey: ['section-roster', sectionId],
    queryFn: () => attendanceApi.getSectionStudents(sectionId as number),
    enabled: !!sectionId,
  });

  const { data: fees = [], isLoading: loadingFees } = useQuery<any[]>({
    queryKey: ['student-fees', studentId],
    queryFn: () => feesApi.getByStudent(studentId as number),
    enabled: !!studentId && studentId !== 'ALL',
  });

  const { data: sectionSummary = [], isLoading: loadingSummary } = useQuery<any[]>({
    queryKey: ['section-fee-summary', sectionId, yearFilter],
    queryFn: () => feesApi.getSectionSummary(sectionId as number, yearFilter),
    enabled: studentId === 'ALL' && !!sectionId,
  });

  const { data: payments = [] } = useQuery<any[]>({
    queryKey: ['student-payments', studentId],
    queryFn: () => feesApi.getStudentPayments(studentId as number),
    enabled: !!studentId,
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['student-fees', studentId] });
    qc.invalidateQueries({ queryKey: ['student-payments', studentId] });
  };

  const payMutation = useMutation({
    mutationFn: () => feesApi.recordPayment({
      feeId: reconcile.id,
      amountPaid: Number(recAmount),
      paymentMethod: recMethod,
      transactionReference: recRef || undefined,
      remarks: recComment.trim(),
    } as any),
    onSuccess: () => { refresh(); setReconcile(null); enqueueSnackbar('Payment reconciled', { variant: 'success' }); },
    onError: (e: any) => enqueueSnackbar(e?.response?.data?.message ?? 'Failed to record payment', { variant: 'error' }),
  });

  const adjustMutation = useMutation({
    mutationFn: () => feesApi.adjustFee(adjust.id, {
      waiveRemaining: adjMode === 'WAIVE',
      discount: adjMode === 'DISCOUNT' ? Number(adjDiscount) : undefined,
      remarks: adjComment.trim(),
    }),
    onSuccess: () => { refresh(); setAdjust(null); enqueueSnackbar('Fee adjusted', { variant: 'success' }); },
    onError: (e: any) => enqueueSnackbar(e?.response?.data?.message ?? 'Failed to adjust fee', { variant: 'error' }),
  });

  // Distinct session years present, newest first.
  const years = Array.from(new Set(fees.map((f) => f.academicYear).filter(Boolean))).sort().reverse();
  const feesForYear = (yearFilter === 'ALL' ? fees : fees.filter((f) => f.academicYear === yearFilter))
    .slice()
    .sort((a, b) => String(a.dueDate ?? '').localeCompare(String(b.dueDate ?? '')));
  const paymentsForYear = yearFilter === 'ALL' ? payments : payments.filter((p) => p.academicYear === yearFilter);

  const totals = feesForYear.reduce((acc, f) => {
    acc.billed += f.netAmount ?? 0;
    acc.paid += f.paidAmount ?? 0;
    acc.balance += Math.max(0, f.balance ?? 0);
    return acc;
  }, { billed: 0, paid: 0, balance: 0 });

  const openReconcile = (f: any) => {
    setReconcile(f);
    setRecAmount(String(Math.max(0, f.balance ?? 0)));
    setRecMethod('CASH'); setRecRef(''); setRecComment('');
  };
  const openAdjust = (f: any) => {
    setAdjust(f); setAdjMode('WAIVE'); setAdjDiscount(String(f.discount ?? 0)); setAdjComment('');
  };

  const selectedStudent = roster.find((r) => r.id === studentId);
  const selectedSection = sections.find((s) => s.id === sectionId);
  const selectedClass = classes.find((c) => c.id === classId);

  const sectionTotals = sectionSummary.reduce((a, s) => {
    a.billed += s.totalBilled ?? 0;
    a.paid += s.totalPaid ?? 0;
    a.balance += s.totalBalance ?? 0;
    return a;
  }, { billed: 0, paid: 0, balance: 0 });

  const esc = (v: any) => String(v ?? '').replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c] as string));

  const pdfStyles = `<style>body{font-family:Arial,Helvetica,sans-serif;color:#1C1C1C;margin:32px;}h1{font-size:20px;margin:0;}
      h2{font-size:14px;margin:22px 0 8px;}.muted{color:#777;font-size:11px;}.sub{color:#555;font-size:12px;margin-top:4px;}
      table{width:100%;border-collapse:collapse;font-size:12px;}th,td{border-bottom:1px solid #e5e5e5;padding:7px 8px;text-align:left;}
      th{background:#f4f7f5;text-transform:uppercase;font-size:10px;letter-spacing:.04em;color:#555;}.r{text-align:right;}
      .totals{display:flex;gap:16px;margin:12px 0;}.tot{border:1px solid #e5e5e5;border-radius:8px;padding:8px 14px;font-size:11px;color:#555;}
      .tot b{display:block;font-size:16px;color:#1C1C1C;}.foot{margin-top:26px;color:#999;font-size:10px;}</style>`;

  const printHtml = (html: string) => {
    const w = window.open('', '_blank');
    if (!w) { enqueueSnackbar('Allow pop-ups to export the PDF', { variant: 'warning' }); return; }
    w.document.write(html); w.document.close(); w.focus();
    setTimeout(() => w.print(), 300);
  };

  const downloadSectionPdf = () => {
    const yr = yearFilter === 'ALL' ? 'All sessions' : yearFilter;
    const title = `${selectedClass?.name ?? ''} · ${selectedSection?.name ?? ''}`.trim();
    const rows = sectionSummary.map((s) => `
      <tr><td>${esc(s.rollNumber ? '#' + s.rollNumber : '—')}</td>
      <td>${esc(s.studentName)}<div class="muted">${esc(s.admissionNumber)}</div></td>
      <td class="r">${fmtCurrency(s.totalBilled ?? 0)}</td>
      <td class="r">${fmtCurrency(s.totalPaid ?? 0)}</td>
      <td class="r">${fmtCurrency(Math.max(0, s.totalBalance ?? 0))}</td></tr>`).join('');
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Fee Ledger - ${esc(title)}</title>
      ${pdfStyles}</head><body>
      <h1>Section Fee Ledger</h1>
      <div class="sub"><b>${esc(title)}</b> · Session: ${esc(yr)} · ${sectionSummary.length} students</div>
      <div class="totals"><div class="tot">Billed<b>${fmtCurrency(sectionTotals.billed)}</b></div>
      <div class="tot">Collected<b>${fmtCurrency(sectionTotals.paid)}</b></div>
      <div class="tot">Balance<b>${fmtCurrency(sectionTotals.balance)}</b></div></div>
      <table><thead><tr><th>Roll</th><th>Student</th><th class="r">Billed</th><th class="r">Collected</th><th class="r">Balance</th></tr></thead>
      <tbody>${rows || '<tr><td colspan="5" class="muted">No students</td></tr>'}</tbody></table>
      <div class="foot">Generated ${new Date().toLocaleString()}</div></body></html>`;
    printHtml(html);
  };

  const downloadPdf = () => {
    if (studentId === 'ALL') { downloadSectionPdf(); return; }
    const name = selectedStudent ? `${selectedStudent.firstName} ${selectedStudent.lastName}` : 'Student';
    const yr = yearFilter === 'ALL' ? 'All sessions' : yearFilter;
    const feeRows = feesForYear.map((f) => `
      <tr><td>${esc(f.feeCategory)}<div class="muted">${esc(f.feePeriod)}</div></td>
      <td>${fmtDate(f.dueDate)}</td><td class="r">${fmtCurrency(f.netAmount ?? 0)}</td>
      <td class="r">${fmtCurrency(f.paidAmount ?? 0)}</td><td class="r">${fmtCurrency(Math.max(0, f.balance ?? 0))}</td>
      <td>${esc(f.status)}</td></tr>`).join('');
    const payRows = paymentsForYear.map((p) => `
      <tr><td>${fmtDate(p.paymentDate, 'DD MMM YYYY')}</td><td>${esc(p.feeCategory)} · ${esc(p.feePeriod)}</td>
      <td class="r">${fmtCurrency(p.amountPaid ?? 0)}</td><td>${esc((p.paymentMethod ?? '').replace('_', ' '))}</td>
      <td>${esc(p.receiptNumber)}</td><td>${esc(p.remarks)}</td></tr>`).join('');
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Fee Ledger - ${esc(name)}</title>
      ${pdfStyles}</head><body>
      <h1>Fee Ledger</h1>
      <div class="sub"><b>${esc(name)}</b> · ${esc(selectedStudent?.admissionNumber)} · Session: ${esc(yr)}</div>
      <div class="totals"><div class="tot">Billed<b>${fmtCurrency(totals.billed)}</b></div>
      <div class="tot">Collected<b>${fmtCurrency(totals.paid)}</b></div>
      <div class="tot">Balance<b>${fmtCurrency(totals.balance)}</b></div></div>
      <h2>Fees (${feesForYear.length})</h2>
      <table><thead><tr><th>Fee</th><th>Due</th><th class="r">Net</th><th class="r">Paid</th><th class="r">Balance</th><th>Status</th></tr></thead>
      <tbody>${feeRows || '<tr><td colspan="6" class="muted">No fees</td></tr>'}</tbody></table>
      <h2>Transaction History (${paymentsForYear.length})</h2>
      <table><thead><tr><th>Date</th><th>Fee</th><th class="r">Amount</th><th>Method</th><th>Receipt</th><th>Comment</th></tr></thead>
      <tbody>${payRows || '<tr><td colspan="6" class="muted">No transactions</td></tr>'}</tbody></table>
      <div class="foot">Generated ${new Date().toLocaleString()}</div></body></html>`;
    printHtml(html);
  };

  return (
    <Box>
      <PageHeader
        title="Student Ledger & Reconciliation"
        subtitle="See a student's full fee & payment history, and reconcile payments"
        crumbs={[{ label: 'Dashboard', path: '/' }, { label: 'Fees', path: '/fees' }, { label: 'Ledger' }]}
        action={
          <Button variant="outlined" startIcon={<PictureAsPdf />} disabled={!studentId} onClick={downloadPdf}>
            Download PDF
          </Button>
        }
      />

      {/* Selectors */}
      <Card sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <FormControl size="small" fullWidth>
              <InputLabel>Class</InputLabel>
              <Select label="Class" value={classId}
                onChange={(e) => { setClassId(Number(e.target.value)); setSectionId(''); setStudentId(''); }}>
                {classes.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl size="small" fullWidth disabled={classId === ''}>
              <InputLabel>Section</InputLabel>
              <Select label="Section" value={sectionId}
                onChange={(e) => { setSectionId(Number(e.target.value)); setStudentId(''); }}>
                {sectionsForClass.map((s) => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl size="small" fullWidth disabled={!sectionId}>
              <InputLabel>Student</InputLabel>
              <Select label="Student" value={studentId}
                onChange={(e) => setStudentId(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}>
                <MenuItem value="ALL"><em>— All students in this section —</em></MenuItem>
                {roster.map((r) => (
                  <MenuItem key={r.id} value={r.id}>
                    {r.rollNumber ? `#${r.rollNumber} · ` : ''}{r.firstName} {r.lastName} ({r.admissionNumber})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Card>

      {!studentId ? (
        <Card sx={{ py: 2 }}><EmptyState title="Select a student" description="Choose a class, section and student — or “All students” — to view the ledger." /></Card>
      ) : studentId === 'ALL' ? (
        loadingSummary ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
        ) : (
          <>
            {/* Section-wide summary */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              {[
                { label: 'Total Billed', value: sectionTotals.billed, color: '#2E6FF2' },
                { label: 'Collected', value: sectionTotals.paid, color: '#0C831F' },
                { label: 'Balance Due', value: sectionTotals.balance, color: sectionTotals.balance > 0 ? '#E23744' : '#0C831F' },
              ].map((s) => (
                <Grid item xs={12} sm={4} key={s.label}>
                  <Card sx={{ p: 2 }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>{s.label}</Typography>
                    <Typography variant="h5" fontWeight={800} sx={{ color: s.color }}>{fmtCurrency(Math.max(0, s.value))}</Typography>
                  </Card>
                </Grid>
              ))}
            </Grid>

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
              <Typography variant="subtitle1" fontWeight={700}>
                {selectedClass?.name} · {selectedSection?.name} · All students ({sectionSummary.length})
              </Typography>
              <FormControl size="small" sx={{ minWidth: 190 }}>
                <InputLabel>Session year</InputLabel>
                <Select label="Session year" value={yearFilter} onChange={(e) => setYearFilter(e.target.value)}>
                  <MenuItem value="ALL">All sessions</MenuItem>
                  {years.map((y) => <MenuItem key={y} value={y}>{y}</MenuItem>)}
                </Select>
              </FormControl>
            </Box>

            <Card>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Roll</TableCell>
                      <TableCell>Student</TableCell>
                      <TableCell align="right">Billed</TableCell>
                      <TableCell align="right">Collected</TableCell>
                      <TableCell align="right">Balance</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sectionSummary.length === 0 ? (
                      <TableRow><TableCell colSpan={6}><EmptyState title="No students" description="No active students in this section." /></TableCell></TableRow>
                    ) : sectionSummary.map((s) => (
                      <TableRow key={s.studentId} hover>
                        <TableCell>{s.rollNumber ? `#${s.rollNumber}` : '—'}</TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>{s.studentName}</Typography>
                          <Typography variant="caption" color="text.secondary">{s.admissionNumber}</Typography>
                        </TableCell>
                        <TableCell align="right">{fmtCurrency(s.totalBilled ?? 0)}</TableCell>
                        <TableCell align="right" sx={{ color: 'success.main' }}>{fmtCurrency(s.totalPaid ?? 0)}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: (s.totalBalance ?? 0) > 0 ? 'error.main' : 'inherit' }}>
                          {fmtCurrency(Math.max(0, s.totalBalance ?? 0))}
                        </TableCell>
                        <TableCell align="right">
                          <Button size="small" onClick={() => setStudentId(s.studentId)}>View ledger</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          </>
        )
      ) : loadingFees ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
      ) : (
        <>
          {/* Summary */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {[
              { label: 'Total Billed', value: totals.billed, color: '#2E6FF2' },
              { label: 'Collected', value: totals.paid, color: '#0C831F' },
              { label: 'Balance Due', value: totals.balance, color: totals.balance > 0 ? '#E23744' : '#0C831F' },
            ].map((s) => (
              <Grid item xs={12} sm={4} key={s.label}>
                <Card sx={{ p: 2 }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>{s.label}</Typography>
                  <Typography variant="h5" fontWeight={800} sx={{ color: s.color }}>{fmtCurrency(Math.max(0, s.value))}</Typography>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
            <Typography variant="subtitle1" fontWeight={700}>
              {selectedStudent ? `${selectedStudent.firstName} ${selectedStudent.lastName}` : 'Student'} · Fees
            </Typography>
            <FormControl size="small" sx={{ minWidth: 190 }}>
              <InputLabel>Session year</InputLabel>
              <Select label="Session year" value={yearFilter} onChange={(e) => setYearFilter(e.target.value)}>
                <MenuItem value="ALL">All sessions</MenuItem>
                {years.map((y) => <MenuItem key={y} value={y}>{y}</MenuItem>)}
              </Select>
            </FormControl>
          </Box>
          <Card sx={{ mb: 3 }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Fee</TableCell>
                    <TableCell>Due</TableCell>
                    <TableCell align="right">Net</TableCell>
                    <TableCell align="right">Paid</TableCell>
                    <TableCell align="right">Balance</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {feesForYear.length === 0 ? (
                    <TableRow><TableCell colSpan={7}><EmptyState title="No fees" description="No fee records for this session." /></TableCell></TableRow>
                  ) : feesForYear.map((f) => (
                    <TableRow key={f.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>{f.feeCategory}</Typography>
                        <Typography variant="caption" color="text.secondary">{f.feePeriod}</Typography>
                      </TableCell>
                      <TableCell>{fmtDate(f.dueDate)}</TableCell>
                      <TableCell align="right">{fmtCurrency(f.netAmount ?? 0)}</TableCell>
                      <TableCell align="right" sx={{ color: 'success.main' }}>{fmtCurrency(f.paidAmount ?? 0)}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>{fmtCurrency(Math.max(0, f.balance ?? 0))}</TableCell>
                      <TableCell><Chip size="small" label={f.status} color={STATUS_COLOR[f.status] ?? 'default'} /></TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                          {f.status !== 'PAID' && (
                            <Tooltip title="Reconcile / record payment">
                              <IconButton size="small" color="primary" onClick={() => openReconcile(f)}><Payments fontSize="small" /></IconButton>
                            </Tooltip>
                          )}
                          <Tooltip title="Adjust / waive (reason required)">
                            <IconButton size="small" onClick={() => openAdjust(f)}><Tune fontSize="small" /></IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>

          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            <ReceiptLong fontSize="small" /> Transaction History ({paymentsForYear.length})
          </Typography>
          <Card>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Fee</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell>Method</TableCell>
                    <TableCell>Receipt</TableCell>
                    <TableCell>By</TableCell>
                    <TableCell>Comment</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paymentsForYear.length === 0 ? (
                    <TableRow><TableCell colSpan={7}><EmptyState title="No transactions" description="No payments recorded for this session yet." /></TableCell></TableRow>
                  ) : paymentsForYear.map((p) => (
                    <TableRow key={p.id} hover>
                      <TableCell>{fmtDate(p.paymentDate, 'DD MMM YYYY, HH:mm')}</TableCell>
                      <TableCell>{p.feeCategory} <Typography variant="caption" color="text.secondary">· {p.feePeriod}</Typography></TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: 'success.main' }}>{fmtCurrency(p.amountPaid ?? 0)}</TableCell>
                      <TableCell><Chip size="small" variant="outlined" label={(p.paymentMethod ?? '').replace('_', ' ')} /></TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{p.receiptNumber}</TableCell>
                      <TableCell>{p.collectedByName}</TableCell>
                      <TableCell sx={{ maxWidth: 220 }}><Typography variant="caption">{p.remarks ?? '—'}</Typography></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </>
      )}

      {/* Reconcile / record payment */}
      <Dialog open={reconcile !== null} onClose={() => setReconcile(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle fontWeight={700}>Reconcile Payment</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2, p: 1.5, borderRadius: 2, bgcolor: '#F6F8F9' }}>
            <Typography variant="caption" color="text.secondary">{reconcile?.feeCategory} · {reconcile?.feePeriod}</Typography>
            <Typography variant="h6" fontWeight={800}>Balance {fmtCurrency(Math.max(0, reconcile?.balance ?? 0))}</Typography>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField label="Amount received (₹)" type="number" fullWidth value={recAmount} onChange={(e) => setRecAmount(e.target.value)} />
            <FormControl fullWidth>
              <InputLabel>Method</InputLabel>
              <Select label="Method" value={recMethod} onChange={(e) => setRecMethod(e.target.value)}>
                {PAYMENT_METHODS.map((m) => <MenuItem key={m} value={m}>{m.replace('_', ' ')}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField label="Transaction reference" fullWidth value={recRef} onChange={(e) => setRecRef(e.target.value)} placeholder="UPI / cheque / bank ref (optional)" />
            <TextField label="Comment / reason *" fullWidth required multiline minRows={2} value={recComment}
              onChange={(e) => setRecComment(e.target.value)} placeholder="Why / how this was reconciled, e.g. 'Cash paid at office'"
              helperText="Required — explains why this reconciliation was done" />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setReconcile(null)} variant="outlined">Cancel</Button>
          <Button variant="contained" disabled={!recAmount || Number(recAmount) <= 0 || !recComment.trim() || payMutation.isPending}
            onClick={() => payMutation.mutate()}>
            {payMutation.isPending ? 'Saving…' : 'Record Payment'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Adjust / waive */}
      <Dialog open={adjust !== null} onClose={() => setAdjust(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle fontWeight={700}>Adjust Fee</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2, borderRadius: 3 }}>
            Use this to waive the balance or apply a discount when a fee was wrongly charged. A reason is required and kept for audit.
          </Alert>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Action</InputLabel>
              <Select label="Action" value={adjMode} onChange={(e) => setAdjMode(e.target.value as any)}>
                <MenuItem value="WAIVE">Waive remaining balance</MenuItem>
                <MenuItem value="DISCOUNT">Set discount amount</MenuItem>
              </Select>
            </FormControl>
            {adjMode === 'DISCOUNT' && (
              <TextField label="Discount (₹)" type="number" fullWidth value={adjDiscount} onChange={(e) => setAdjDiscount(e.target.value)} />
            )}
            <TextField label="Reason / comment *" fullWidth required multiline minRows={2} value={adjComment}
              onChange={(e) => setAdjComment(e.target.value)} placeholder="e.g. 'Fee charged in error — transport not availed'"
              helperText="Required — explains why this adjustment was made" />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setAdjust(null)} variant="outlined">Cancel</Button>
          <Button variant="contained" color="warning" disabled={!adjComment.trim() || adjustMutation.isPending}
            onClick={() => adjustMutation.mutate()}>
            {adjustMutation.isPending ? 'Saving…' : 'Apply Adjustment'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
