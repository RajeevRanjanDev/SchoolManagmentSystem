import {
  Box, TextField, Button, Typography, Link,
  InputAdornment, IconButton, Alert, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { Visibility, VisibilityOff, School } from '@mui/icons-material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { authApi } from '@/api/auth.api';
import { setCredentials } from '@/store/slices/authSlice';
import { useAppDispatch } from '@/store/hooks';

// Admins log in with email; students/teachers with a generated login ID — accept either.
const schema = yup.object({ email: yup.string().required('Email or login ID is required'), password: yup.string().required() });

export default function LoginPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const sessionExpired = new URLSearchParams(window.location.search).get('expired') === '1';

  // Forgot-password dialog
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotId, setForgotId] = useState('');
  const [forgotMsg, setForgotMsg] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const submitForgot = async () => {
    if (!forgotId.trim()) return;
    setForgotLoading(true);
    try {
      const msg = await authApi.forgotPassword(forgotId.trim());
      setForgotMsg(msg);
    } catch (e: any) {
      enqueueSnackbar(e?.response?.data?.message ?? 'Could not process the request', { variant: 'error' });
    } finally {
      setForgotLoading(false);
    }
  };

  const closeForgot = () => { setForgotOpen(false); setForgotId(''); setForgotMsg(''); };

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (data: { email: string; password: string }) => {
    setLoading(true);
    setError('');
    try {
      const raw = await authApi.login(data);
      // Backend wraps in ApiResponse<AuthResponse> — unwrap if needed
      const res = (raw as any)?.data ?? raw;

      // Map backend shape → UserInfo
      // roles come as "ROLE_SCHOOL_ADMIN" or "SCHOOL_ADMIN" — strip prefix
      const rawRoles: string[] = Array.isArray(res.roles)
        ? res.roles
        : typeof res.roles === 'string'
          ? res.roles.split(',')
          : [];
      const roles = rawRoles.map((r: string) => r.replace(/^ROLE_/, '')) as any[];

      const [firstName = '', ...rest] = (res.fullName ?? res.email ?? '').split(' ');
      const lastName = rest.join(' ');

      dispatch(setCredentials({
        user: {
          id: res.userId ?? res.id,
          firstName,
          lastName,
          email: res.email,
          roles,
          schoolId: res.schoolId,
          schoolName: res.schoolName,
        },
        accessToken: res.accessToken,
        refreshToken: res.refreshToken,
      }));
      // Students get the dedicated mobile portal; everyone else the admin app.
      navigate(roles.includes('STUDENT') ? '/student' : '/');
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', bgcolor: '#fff' }}>
      {/* Left brand panel */}
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          flex: 1.1,
          position: 'relative',
          overflow: 'hidden',
          flexDirection: 'column',
          justifyContent: 'space-between',
          p: 6,
          color: '#fff',
          background: 'linear-gradient(150deg, #0C831F 0%, #16A34A 60%, #1DA837 100%)',
        }}
      >
        <Box sx={{ position: 'absolute', top: -80, right: -60, width: 320, height: 320, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.08)' }} />
        <Box sx={{ position: 'absolute', bottom: -120, left: -40, width: 300, height: 300, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.06)' }} />

        <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ width: 44, height: 44, borderRadius: 2.5, bgcolor: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(6px)' }}>
            <School sx={{ color: '#fff', fontSize: 26 }} />
          </Box>
          <Typography fontWeight={800} fontSize="1.25rem" letterSpacing="-0.02em">SchoolERP</Typography>
        </Box>

        <Box sx={{ position: 'relative' }}>
          <Typography variant="h3" fontWeight={800} sx={{ lineHeight: 1.15, mb: 2 }}>
            Run your entire<br />school from one<br />premium dashboard.
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.85)', fontWeight: 500, maxWidth: 420 }}>
            Students, teachers, attendance, fees, exams and transport — unified, fast and beautifully simple.
          </Typography>
        </Box>

        <Typography variant="caption" sx={{ position: 'relative', color: 'rgba(255,255,255,0.7)' }}>
          © {new Date().getFullYear()} School Management System
        </Typography>
      </Box>

      {/* Right form panel */}
      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3 }}>
        <Box sx={{ width: '100%', maxWidth: 400 }}>
          <Box sx={{ mb: 4 }}>
            <Box
              sx={{
                display: { xs: 'inline-flex', md: 'none' }, width: 56, height: 56, borderRadius: 3,
                background: 'linear-gradient(135deg, #0C831F 0%, #1DA837 100%)', alignItems: 'center', justifyContent: 'center', mb: 2,
              }}
            >
              <School sx={{ color: '#fff', fontSize: 30 }} />
            </Box>
            <Typography variant="h4" fontWeight={800}>Welcome back</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Sign in to your management suite to continue.
            </Typography>
          </Box>

          {sessionExpired && !error && (
            <Alert severity="info" sx={{ mb: 2, borderRadius: 3 }}>Your session expired. Please sign in again.</Alert>
          )}
          {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 3 }}>{error}</Alert>}

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
              EMAIL OR LOGIN ID
            </Typography>
            <TextField
              placeholder="Admin: email · Student/Teacher: login ID"
              fullWidth
              autoComplete="username"
              autoFocus
              {...register('email')}
              error={!!errors.email}
              helperText={errors.email?.message}
            />

            <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ mt: 2, mb: 0.5, display: 'block' }}>
              PASSWORD
            </Typography>
            <TextField
              placeholder="Enter your password"
              type={showPw ? 'text' : 'password'}
              fullWidth
              autoComplete="current-password"
              {...register('password')}
              error={!!errors.password}
              helperText={errors.password?.message}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPw(!showPw)} edge="end" size="small">
                      {showPw ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
              <Link component="button" type="button" underline="hover" variant="body2"
                onClick={() => setForgotOpen(true)} sx={{ fontWeight: 600 }}>
                Forgot password?
              </Link>
            </Box>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{ mt: 2, py: 1.5, fontSize: '1rem' }}
            >
              {loading ? <CircularProgress size={22} color="inherit" /> : 'Sign In'}
            </Button>
          </form>

          <Dialog open={forgotOpen} onClose={closeForgot} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
            <DialogTitle fontWeight={700}>Reset your password</DialogTitle>
            <DialogContent>
              {forgotMsg ? (
                <Alert severity="success" sx={{ mt: 1 }}>{forgotMsg}</Alert>
              ) : (
                <>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Enter your email or login ID. If an account exists, a temporary password will be emailed to your registered address.
                  </Typography>
                  <TextField
                    autoFocus fullWidth label="Email or login ID"
                    value={forgotId}
                    onChange={(e) => setForgotId(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') submitForgot(); }}
                  />
                </>
              )}
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button onClick={closeForgot} variant="outlined">{forgotMsg ? 'Close' : 'Cancel'}</Button>
              {!forgotMsg && (
                <Button variant="contained" onClick={submitForgot} disabled={!forgotId.trim() || forgotLoading}>
                  {forgotLoading ? 'Sending…' : 'Send temporary password'}
                </Button>
              )}
            </DialogActions>
          </Dialog>

          <Box sx={{ mt: 3, p: 1.75, borderRadius: 3, bgcolor: '#F6F8F9', border: '1px solid #EDEFF1' }}>
            <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ display: 'block', mb: 0.5 }}>
              Demo logins
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              School Admin · admin@dpsdemo.edu / Admin@1234
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              Teacher · teacher@dpsdemo.edu / Teacher@1234
            </Typography>
            <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 0.5 }}>
              Platform (all schools) · superadmin@sms.com / Admin@1234
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
