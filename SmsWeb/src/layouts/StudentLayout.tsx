import { useState } from 'react';
import {
  Box, Drawer, List, ListItemButton, ListItemIcon, ListItemText, Toolbar,
  Typography, Avatar, IconButton, Badge, AppBar, Divider,
} from '@mui/material';
import {
  Home, EventAvailable, CreditCard, Forum, Person, Notifications, Logout, Menu as MenuIcon, School, MenuBook, Grading,
} from '@mui/icons-material';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAppDispatch } from '@/store/hooks';
import { logout } from '@/store/slices/authSlice';

const DRAWER_WIDTH = 248;

const NAV = [
  { label: 'Home', path: '/student', icon: <Home /> },
  { label: 'Assignments', path: '/student/assignments', icon: <MenuBook /> },
  { label: 'Results', path: '/student/results', icon: <Grading /> },
  { label: 'Attendance', path: '/student/attendance', icon: <EventAvailable /> },
  { label: 'Fee', path: '/student/fees', icon: <CreditCard /> },
  { label: 'Updates', path: '/student/circulars', icon: <Forum /> },
  { label: 'Profile', path: '/student/profile', icon: <Person /> },
];

export function StudentLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const current = [...NAV].reverse().find((n) =>
    n.path === '/student' ? location.pathname === '/student' : location.pathname.startsWith(n.path),
  )?.path ?? '/student';

  const initials = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase();

  const go = (path: string) => { navigate(path); setMobileOpen(false); };

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Brand */}
      <Box sx={{ px: 2.5, py: 2.5, display: 'flex', alignItems: 'center', gap: 1.25 }}>
        <Box sx={{ width: 38, height: 38, borderRadius: 2, bgcolor: '#E7F6EA', color: '#0C831F', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <School />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1 }}>Student Portal</Typography>
          <Typography variant="subtitle2" fontWeight={800} noWrap sx={{ lineHeight: 1.15 }}>
            {user?.schoolName ?? 'My School'}
          </Typography>
        </Box>
      </Box>
      <Divider />

      {/* Nav */}
      <List sx={{ px: 1.5, py: 1.5, flex: 1 }}>
        {NAV.map((n) => {
          const active = n.path === current;
          return (
            <ListItemButton
              key={n.path}
              onClick={() => go(n.path)}
              sx={{
                borderRadius: 2.5, mb: 0.5, py: 0.9,
                color: active ? '#0C831F' : '#5A5A5A',
                bgcolor: active ? '#E7F6EA !important' : 'transparent',
                fontWeight: active ? 700 : 500,
                '&:hover': { bgcolor: active ? '#E7F6EA' : '#F2F4F5' },
              }}
            >
              <ListItemIcon sx={{ minWidth: 38, color: active ? '#0C831F' : '#8A8A8A' }}>{n.icon}</ListItemIcon>
              <ListItemText primary={n.label} primaryTypographyProps={{ fontWeight: active ? 700 : 500, fontSize: 14 }} />
            </ListItemButton>
          );
        })}
      </List>

      <Divider />
      <List sx={{ px: 1.5, py: 1 }}>
        <ListItemButton onClick={() => { dispatch(logout()); navigate('/login'); }}
          sx={{ borderRadius: 2.5, color: '#E23744', '&:hover': { bgcolor: '#FFEBEE' } }}>
          <ListItemIcon sx={{ minWidth: 38, color: '#E23744' }}><Logout /></ListItemIcon>
          <ListItemText primary="Log out" primaryTypographyProps={{ fontWeight: 600, fontSize: 14 }} />
        </ListItemButton>
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#F6F8F9' }}>
      {/* Permanent sidebar (desktop) */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          width: DRAWER_WIDTH, flexShrink: 0,
          '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box', borderRight: '1px solid #EDEFF1' },
        }}
        open
      >
        {drawer}
      </Drawer>

      {/* Temporary drawer (mobile) */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' } }}
      >
        {drawer}
      </Drawer>

      {/* Main column */}
      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {/* Top bar */}
        <AppBar position="sticky" elevation={0}
          sx={{ bgcolor: '#fff', color: 'text.primary', borderBottom: '1px solid #EDEFF1' }}>
          <Toolbar sx={{ gap: 1 }}>
            <IconButton edge="start" onClick={() => setMobileOpen(true)} sx={{ display: { md: 'none' } }}>
              <MenuIcon />
            </IconButton>
            <Box sx={{ flex: 1 }} />
            <IconButton onClick={() => navigate('/student/circulars')}>
              <Badge color="error" variant="dot"><Notifications /></Badge>
            </IconButton>
            <Avatar onClick={() => navigate('/student/profile')}
              sx={{ width: 38, height: 38, bgcolor: 'primary.main', cursor: 'pointer', fontWeight: 700 }}>
              {initials || <Person />}
            </Avatar>
          </Toolbar>
        </AppBar>

        <Box sx={{ p: { xs: 2, md: 3 }, flex: 1 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
