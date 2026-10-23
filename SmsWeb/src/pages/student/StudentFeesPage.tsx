import { Box, Card, Typography, Chip, Divider, Button, Skeleton, Collapse, IconButton } from '@mui/material';
import { ExpandMore, CreditCard, CheckCircle } from '@mui/icons-material';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { studentPortalApi } from '@/api/studentPortal.api';
import { studentPaymentsApi, loadRazorpay } from '@/api/payments.api';
import { SectionCard } from '@/components/student/StudentUI';
import { fmtCurrency, fmtDate } from '@/utils/formatters';

const STATUS_COLOR: Record<string, any> = { PAID: 'success', PENDING: 'warning', PARTIAL: 'info', OVERDUE: 'error', WAIVED: 'default' };

export default function StudentFeesPage() {
  const { enqueueSnackbar } = useSnackbar();
  const qc = useQueryClient();
  const { data: fees = [], isLoading } = useQuery({ queryKey: ['student-fees'], queryFn: studentPortalApi.fees });
  const [expanded, setExpanded] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);

  const payOnline = async () => {
    const dueIds = fees.filter((f: any) => Math.max(0, f.balance ?? 0) > 0).map((f: any) => f.id);
    if (dueIds.length === 0) return;
    setPaying(true);
    try {
      const ok = await loadRazorpay();
      if (!ok) { enqueueSnackbar('Could not load the payment gateway. Check your connection.', { variant: 'error' }); return; }
      const order = await studentPaymentsApi.createOrder(dueIds);
      const rzp = new (window as any).Razorpay({
        key: order.razorpayKeyId,
        amount: order.amount,
        currency: order.currency,
        name: order.schoolName,
        description: 'School fee payment',
        order_id: order.razorpayOrderId,
        prefill: { name: order.studentName, email: order.prefillEmail, contact: order.prefillContact },
        theme: { color: '#0C831F' },
        handler: async (resp: any) => {
          try {
            await studentPaymentsApi.verify({
              paymentAttemptId: order.paymentAttemptId,
              razorpayOrderId: order.razorpayOrderId,
              razorpayPaymentId: resp.razorpay_payment_id,
              razorpaySignature: resp.razorpay_signature,
            });
            enqueueSnackbar('Payment successful — fees updated.', { variant: 'success' });
            qc.invalidateQueries({ queryKey: ['student-fees'] });
          } catch (e: any) {
            enqueueSnackbar(e?.response?.data?.message ?? 'Payment captured but verification failed — it will reconcile shortly.', { variant: 'warning' });
          }
        },
        modal: { ondismiss: () => enqueueSnackbar('Payment cancelled.', { variant: 'info' }) },
      });
      rzp.on('payment.failed', (r: any) => enqueueSnackbar(r?.error?.description ?? 'Payment failed.', { variant: 'error' }));
      rzp.open();
    } catch (e: any) {
      enqueueSnackbar(e?.response?.data?.message ?? 'Could not start the payment.', { variant: 'error' });
    } finally {
      setPaying(false);
    }
  };

  // Group fees by category (Tuition / Transport / …)
  const groups = fees.reduce((acc: Record<string, any[]>, f: any) => {
    const k = f.feeCategory ?? 'Other';
    (acc[k] = acc[k] || []).push(f);
    return acc;
  }, {});

  const totalBilled = fees.reduce((s: number, f: any) => s + (f.netAmount ?? 0), 0);
  const totalPaid = fees.reduce((s: number, f: any) => s + (f.paidAmount ?? 0), 0);
  const totalDue = fees.reduce((s: number, f: any) => s + Math.max(0, f.balance ?? 0), 0);

  return (
    <Box sx={{ pb: 2, maxWidth: 820, mx: 'auto' }}>
      {/* Cumulative to-pay */}
      <Card sx={{ p: 2.5, borderRadius: 4, boxShadow: 'none', mb: 2,
        background: totalDue > 0 ? 'linear-gradient(120deg,#F57C00,#FF9800)' : 'linear-gradient(120deg,#0C831F,#1DA837)', color: '#fff' }}>
        <Typography variant="caption" sx={{ opacity: 0.9 }}>Total payable</Typography>
        <Typography variant="h4" fontWeight={800}>{fmtCurrency(totalDue)}</Typography>
        <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
          <Typography variant="caption" sx={{ opacity: 0.9 }}>Billed {fmtCurrency(totalBilled)}</Typography>
          <Typography variant="caption" sx={{ opacity: 0.9 }}>Paid {fmtCurrency(totalPaid)}</Typography>
        </Box>
        {totalDue > 0 && (
          <Button fullWidth variant="contained" startIcon={<CreditCard />} disabled={paying}
            sx={{ mt: 1.5, bgcolor: '#fff', color: '#333', borderRadius: 3, '&:hover': { bgcolor: '#f3f3f3' } }}
            onClick={payOnline}>
            {paying ? 'Starting…' : `Pay ${fmtCurrency(totalDue)}`}
          </Button>
        )}
      </Card>

      {isLoading ? (
        [0, 1].map((i) => <Skeleton key={i} variant="rounded" height={90} sx={{ borderRadius: 4, mb: 1.5 }} />)
      ) : fees.length === 0 ? (
        <SectionCard><Typography variant="body2" color="text.secondary">No fees assigned yet.</Typography></SectionCard>
      ) : (
        Object.entries(groups).map(([category, list]) => {
          const catDue = list.reduce((s, f) => s + Math.max(0, f.balance ?? 0), 0);
          const open = expanded === category;
          return (
            <Card key={category} sx={{ borderRadius: 4, boxShadow: 'none', border: '1px solid #EDEFF1', mb: 1.5 }}>
              <Box sx={{ p: 2, display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                onClick={() => setExpanded(open ? null : category)}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle1" fontWeight={700}>{category}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {list.length} item{list.length === 1 ? '' : 's'} · Due {fmtCurrency(catDue)}
                  </Typography>
                </Box>
                {catDue === 0 ? <CheckCircle fontSize="small" sx={{ color: 'success.main', mr: 1 }} /> : null}
                <IconButton size="small" sx={{ transform: open ? 'rotate(180deg)' : 'none', transition: '.2s' }}>
                  <ExpandMore />
                </IconButton>
              </Box>
              <Collapse in={open}>
                <Divider />
                <Box sx={{ p: 2, pt: 1 }}>
                  {list.map((f) => (
                    <Box key={f.id} sx={{ py: 1, borderBottom: '1px solid #F2F2F2', '&:last-child': { borderBottom: 'none' } }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                          <Typography variant="body2" fontWeight={600}>{f.feePeriod}</Typography>
                          <Typography variant="caption" color="text.secondary">Due {fmtDate(f.dueDate)}</Typography>
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography variant="body2" fontWeight={700}>{fmtCurrency(Math.max(0, f.balance ?? 0))}</Typography>
                          <Chip label={f.status} size="small" color={STATUS_COLOR[f.status] ?? 'default'} sx={{ height: 18, fontSize: 10 }} />
                        </Box>
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Collapse>
            </Card>
          );
        })
      )}
    </Box>
  );
}
