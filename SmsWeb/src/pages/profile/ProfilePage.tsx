import {
  Avatar, Box, Button, Card, CardContent, Chip, Divider, Grid, Stack, Typography,
} from '@mui/material';
import { Logout, Email, Phone, Business, Badge as BadgeIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '@/store/hooks';
import { logout } from '@/store/slices/authSlice';
import { useAuth } from '@/hooks/useAuth';
import { authApi } from '@/api/auth.api';
import { initials } from '@/utils/formatters';

export default function ProfilePage() {
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try { await authApi.logout(); } catch { /* ignore */ }
    dispatch(logout());
    navigate('/login');
  };

  if (!user) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="text.secondary">No user information available.</Typography>
      </Box>
    );
  }

  const rows = [
    { icon: <Email fontSize="small" />, label: 'Email', value: user.email },
    { icon: <Phone fontSize="small" />, label: 'Phone', value: user.phone || '—' },
    { icon: <Business fontSize="small" />, label: 'School', value: user.schoolName || '—' },
    { icon: <BadgeIcon fontSize="small" />, label: 'User ID', value: String(user.id) },
  ];

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom>
        My Profile
      </Typography>

      <Grid container spacing={3} sx={{ mt: 0 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <Avatar
                sx={{ width: 88, height: 88, bgcolor: 'primary.main', fontSize: 32, mx: 'auto', mb: 2 }}
              >
                {initials(user.firstName, user.lastName)}
              </Avatar>
              <Typography variant="h6" fontWeight={600}>
                {user.firstName} {user.lastName}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {user.email}
              </Typography>
              <Box sx={{ mt: 1 }}>
                {user.roles?.map((r) => (
                  <Chip key={r} label={r.replace(/_/g, ' ')} size="small" sx={{ m: 0.25 }} />
                ))}
              </Box>
              <Button
                variant="outlined"
                color="error"
                startIcon={<Logout />}
                onClick={handleLogout}
                sx={{ mt: 3 }}
              >
                Sign out
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Account Details
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Stack spacing={2}>
                {rows.map((row) => (
                  <Box key={row.label} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ color: 'text.secondary', display: 'flex' }}>{row.icon}</Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        {row.label}
                      </Typography>
                      <Typography variant="body2" fontWeight={500}>
                        {row.value}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
