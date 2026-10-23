import {
  Box, Card, Typography, Avatar, Divider, Grid, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Skeleton, Chip,
} from '@mui/material';
import { LockReset, Logout, Badge } from '@mui/icons-material';
import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { studentPortalApi } from '@/api/studentPortal.api';
import { SectionCard } from '@/components/student/StudentUI';
import { useAppDispatch } from '@/store/hooks';
import { logout } from '@/store/slices/authSlice';
import { fmtDate } from '@/utils/formatters';

export default function StudentProfilePage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { enqueueSnackbar } = useSnackbar();
  const { data: me, isLoading } = useQuery({ queryKey: ['student-me'], queryFn: studentPortalApi.me });

  const [pwdOpen, setPwdOpen] = useState(false);
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });

  const changePwd = useMutation({
    mutationFn: () => studentPortalApi.changePassword({ currentPassword: form.currentPassword, newPassword: form.newPassword }),
    onSuccess: (msg) => { enqueueSnackbar(msg, { variant: 'success' }); closePwd(); },
    onError: (e: any) => enqueueSnackbar(e?.response?.data?.message ?? 'Failed to change password', { variant: 'error' }),
  });

  const closePwd = () => { setPwdOpen(false); setForm({ currentPassword: '', newPassword: '', confirm: '' }); };

  const doLogout = () => { dispatch(logout()); navigate('/login'); };

  const rows: [string, string | undefined][] = me ? [
    ['Admission No. (Login ID)', me.admissionNumber],
    ['Class', me.className],
    ['Section', me.sectionName],
    ['Roll Number', me.rollNumber ? `#${me.rollNumber}` : '—'],
    ['Date of Birth', me.dateOfBirth ? fmtDate(me.dateOfBirth) : '—'],
    ['Gender', me.gender ?? '—'],
    ['Email', me.email ?? '—'],
    ['Mobile', me.mobile ?? '—'],
    ["Father's Name", me.fatherName ?? '—'],
    ["Mother's Name", me.motherName ?? '—'],
  ] : [];

  return (
    <Box sx={{ pb: 2, maxWidth: 680, mx: 'auto' }}>
      <Card sx={{ p: 2.5, borderRadius: 4, boxShadow: 'none', mb: 2, textAlign: 'center' }}>
        {isLoading ? (
          <Skeleton variant="circular" width={72} height={72} sx={{ mx: 'auto' }} />
        ) : (
          <Avatar sx={{ width: 72, height: 72, mx: 'auto', bgcolor: 'primary.main', fontSize: 26, fontWeight: 700 }}>
            {`${me?.firstName?.[0] ?? ''}${me?.lastName?.[0] ?? ''}`.toUpperCase()}
          </Avatar>
        )}
        <Typography variant="h6" fontWeight={800} sx={{ mt: 1 }}>
          {me ? `${me.firstName} ${me.lastName}` : <Skeleton width={160} sx={{ mx: 'auto' }} />}
        </Typography>
        {me && (
          <Chip icon={<Badge />} label={me.admissionNumber} size="small" variant="outlined" sx={{ mt: 0.5 }} />
        )}
      </Card>

      <SectionCard title="Basic Details" sx={{ mb: 2 }}>
        {isLoading ? (
          [0, 1, 2, 3].map((i) => <Skeleton key={i} height={34} />)
        ) : (
          <Grid container>
            {rows.map(([label, value], i) => (
              <Grid item xs={12} key={label}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}>
                  <Typography variant="body2" color="text.secondary">{label}</Typography>
                  <Typography variant="body2" fontWeight={600} sx={{ textAlign: 'right', ml: 2 }}>{value}</Typography>
                </Box>
                {i < rows.length - 1 && <Divider />}
              </Grid>
            ))}
          </Grid>
        )}
      </SectionCard>

      {me && (
        <SectionCard title="Transport" sx={{ mb: 2 }}>
          {(me.transportRequired || me.routeName || me.stopName) ? (
            <Grid container>
              {([
                ['Route', me.routeName || '—'],
                ['Stop', me.stopName || '—'],
                ['Pickup Time', me.pickupPoint || '—'],
                ['Type', me.transportType || '—'],
              ] as [string, string][]).map(([label, value], i, arr) => (
                <Grid item xs={12} key={label}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}>
                    <Typography variant="body2" color="text.secondary">{label}</Typography>
                    <Typography variant="body2" fontWeight={600} sx={{ textAlign: 'right', ml: 2 }}>{value}</Typography>
                  </Box>
                  {i < arr.length - 1 && <Divider />}
                </Grid>
              ))}
            </Grid>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
              No transport assigned.
            </Typography>
          )}
        </SectionCard>
      )}

      <Button fullWidth variant="outlined" startIcon={<LockReset />} sx={{ mb: 1.5, borderRadius: 3, py: 1.2 }}
        onClick={() => setPwdOpen(true)}>
        Change Password
      </Button>
      <Button fullWidth variant="outlined" color="error" startIcon={<Logout />} sx={{ borderRadius: 3, py: 1.2 }}
        onClick={doLogout}>
        Log Out
      </Button>

      <Dialog open={pwdOpen} onClose={closePwd} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle fontWeight={700}>Change Password</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 0.5 }}>
            <TextField label="Current password" type="password" fullWidth value={form.currentPassword}
              onChange={(e) => setForm({ ...form, currentPassword: e.target.value })} />
            <TextField label="New password" type="password" fullWidth value={form.newPassword}
              helperText="At least 6 characters"
              onChange={(e) => setForm({ ...form, newPassword: e.target.value })} />
            <TextField label="Confirm new password" type="password" fullWidth value={form.confirm}
              error={!!form.confirm && form.confirm !== form.newPassword}
              helperText={!!form.confirm && form.confirm !== form.newPassword ? 'Passwords do not match' : ' '}
              onChange={(e) => setForm({ ...form, confirm: e.target.value })} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button onClick={closePwd} variant="outlined">Cancel</Button>
          <Button variant="contained"
            disabled={!form.currentPassword || form.newPassword.length < 6 || form.newPassword !== form.confirm || changePwd.isPending}
            onClick={() => changePwd.mutate()}>
            {changePwd.isPending ? 'Saving…' : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
