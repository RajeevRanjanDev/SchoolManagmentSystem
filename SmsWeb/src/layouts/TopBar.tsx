import {
  AppBar, Toolbar, Typography, IconButton, Avatar, Box,
  Menu, MenuItem, Badge, Divider, Chip, InputBase, ListItemIcon,
} from '@mui/material';
import { Notifications, Logout, AccountCircle, Search, KeyboardArrowDown } from '@mui/icons-material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '@/store/hooks';
import { logout } from '@/store/slices/authSlice';
import { useAuth } from '@/hooks/useAuth';
import { authApi } from '@/api/auth.api';
import { initials } from '@/utils/formatters';

const DRAWER_WIDTH = 260;

export function TopBar() {
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleLogout = async () => {
    setAnchorEl(null);
    try { await authApi.logout(); } catch { /* ignore */ }
    dispatch(logout());
    navigate('/login');
  };

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        width: `calc(100% - ${DRAWER_WIDTH}px)`,
        ml: `${DRAWER_WIDTH}px`,
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between', gap: 2, minHeight: 68 }}>
        {/* Search */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            px: 1.5,
            py: 0.75,
            borderRadius: 3,
            bgcolor: '#F3F5F6',
            width: { xs: 160, sm: 340 },
            transition: 'background-color .15s ease',
            '&:focus-within': { bgcolor: '#FFFFFF', boxShadow: '0 0 0 2px #0C831F33' },
          }}
        >
          <Search sx={{ color: '#9AA0A6', fontSize: 20 }} />
          <InputBase
            placeholder="Search students, fees, classes…"
            sx={{ fontSize: '0.875rem', flex: 1 }}
          />
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton
            onClick={() => navigate('/notifications')}
            sx={{ bgcolor: '#F3F5F6', borderRadius: 2.5, width: 42, height: 42, '&:hover': { bgcolor: '#EAECEE' } }}
          >
            <Badge badgeContent={3} color="error">
              <Notifications sx={{ color: '#5A5A5A', fontSize: 22 }} />
            </Badge>
          </IconButton>

          <Box
            onClick={(e) => setAnchorEl(e.currentTarget)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              pl: 0.75,
              pr: 1,
              py: 0.5,
              borderRadius: 3,
              cursor: 'pointer',
              transition: 'background-color .15s ease',
              '&:hover': { bgcolor: '#F3F5F6' },
            }}
          >
            <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main', fontSize: 14 }}>
              {user ? initials(user.firstName, user.lastName) : '?'}
            </Avatar>
            <Box sx={{ display: { xs: 'none', md: 'block' }, lineHeight: 1 }}>
              <Typography sx={{ fontSize: '0.825rem', fontWeight: 700, color: 'text.primary' }}>
                {user?.firstName} {user?.lastName}
              </Typography>
              <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary', fontWeight: 600 }}>
                {user?.roles?.[0]?.replace(/_/g, ' ') ?? 'User'}
              </Typography>
            </Box>
            <KeyboardArrowDown sx={{ color: '#9AA0A6', fontSize: 18, display: { xs: 'none', md: 'block' } }} />
          </Box>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={() => setAnchorEl(null)}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            PaperProps={{
              sx: { mt: 1.25, minWidth: 236, borderRadius: 3, boxShadow: '0 12px 32px rgba(16,24,40,0.14)', border: '1px solid #EDEFF1' },
            }}
          >
            <Box sx={{ px: 2, py: 1.75 }}>
              <Typography variant="subtitle2" fontWeight={700}>
                {user?.firstName} {user?.lastName}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {user?.email}
              </Typography>
              <Box sx={{ mt: 0.75, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {user?.roles?.map((r) => (
                  <Chip
                    key={r}
                    label={r.replace(/_/g, ' ')}
                    size="small"
                    color="success"
                    sx={{ fontSize: 10, height: 20 }}
                  />
                ))}
              </Box>
            </Box>
            <Divider />
            <MenuItem onClick={() => { setAnchorEl(null); navigate('/profile'); }} sx={{ py: 1.1, mx: 0.5, borderRadius: 2 }}>
              <ListItemIcon><AccountCircle fontSize="small" /></ListItemIcon>
              My Profile
            </MenuItem>
            <MenuItem onClick={handleLogout} sx={{ py: 1.1, mx: 0.5, borderRadius: 2, color: 'error.main' }}>
              <ListItemIcon><Logout fontSize="small" sx={{ color: 'error.main' }} /></ListItemIcon>
              Sign out
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
