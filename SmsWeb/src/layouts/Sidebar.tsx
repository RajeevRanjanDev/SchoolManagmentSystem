import {
  Drawer, List, ListItemButton, ListItemIcon, ListItemText,
  Toolbar, Typography, Box, Divider, Collapse,
} from '@mui/material';
import {
  Dashboard, People, School, AssignmentTurnedIn, AccountBalance, CreditScore,
  MenuBook, Campaign, Business, BugReport,
  DirectionsBus, Notifications,
  Class, MeetingRoom, ExpandLess, ExpandMore,
  PersonAdd, AutoStories, HowToReg, EditNote,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';

const DRAWER_WIDTH = 260;

interface NavItem {
  label: string;
  path?: string;
  icon: React.ReactNode;
  roles?: string[];
  children?: NavItem[];
}

const NAV: NavItem[] = [
  // Finance (ACCOUNTANT) and transport (TRANSPORT_MANAGER) employees land on their own screen, not the admin dashboard.
  { label: 'Dashboard', path: '/', icon: <Dashboard />, roles: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'SUPPORT_STAFF', 'TEACHER', 'ADMISSION_OFFICER', 'PRINCIPAL', 'DEAN'] },
  {
    label: 'Academic Setup',
    icon: <AutoStories />,
    roles: ['SCHOOL_ADMIN', 'SUPER_ADMIN', 'SUPPORT_STAFF'],
    children: [
      { label: 'Classes', path: '/academic/classes', icon: <Class /> },
      { label: 'Sections', path: '/academic/sections', icon: <MeetingRoom /> },
      { label: 'Subjects', path: '/academic/subjects', icon: <MenuBook /> },
    ],
  },
  {
    label: 'Admission',
    icon: <HowToReg />,
    roles: ['ADMISSION_OFFICER', 'SCHOOL_ADMIN', 'SUPER_ADMIN', 'PRINCIPAL', 'DEAN', 'SUPPORT_STAFF'],
    children: [
      { label: 'Admission Register', path: '/admission', icon: <HowToReg /> },
      { label: 'All Students', path: '/students', icon: <People /> },
    ],
  },
  { label: 'Employees', path: '/teachers', icon: <PersonAdd />, roles: ['SCHOOL_ADMIN', 'SUPER_ADMIN', 'SUPPORT_STAFF'] },
  {
    label: 'Teacher Portal',
    icon: <School />,
    roles: ['TEACHER'],
    children: [
      { label: 'My Dashboard', path: '/teacher/dashboard', icon: <Dashboard /> },
      { label: 'My Class', path: '/teacher/class', icon: <Class /> },
      { label: 'Student Attendance', path: '/teacher/attendance', icon: <AssignmentTurnedIn /> },
      { label: 'Homework & Classwork', path: '/teacher/daily-work', icon: <EditNote /> },
      { label: 'Exams & Results', path: '/teacher/exams', icon: <School /> },
      { label: 'Notices', path: '/teacher/notices', icon: <Campaign /> },
      { label: 'Inbox', path: '/teacher/inbox', icon: <Notifications /> },
    ],
  },
  { label: 'Attendance', path: '/attendance', icon: <AssignmentTurnedIn />, roles: ['SCHOOL_ADMIN', 'SUPER_ADMIN', 'SUPPORT_STAFF'] },
  { label: 'Fees', path: '/fees', icon: <AccountBalance />, roles: ['ACCOUNTANT', 'SCHOOL_ADMIN', 'SUPER_ADMIN'] },
  { label: 'Payment Reconciliation', path: '/finance/reconciliation', icon: <CreditScore />, roles: ['ACCOUNTANT', 'SCHOOL_ADMIN', 'SUPER_ADMIN'] },
  { label: 'Homework & Classwork', path: '/homework', icon: <MenuBook />, roles: ['SCHOOL_ADMIN', 'SUPER_ADMIN', 'SUPPORT_STAFF'] },
  { label: 'Exams & Results', path: '/exams', icon: <School />, roles: ['SCHOOL_ADMIN', 'SUPER_ADMIN', 'SUPPORT_STAFF'] },
  { label: 'Transport', path: '/transport', icon: <DirectionsBus />, roles: ['TRANSPORT_MANAGER', 'SCHOOL_ADMIN', 'SUPER_ADMIN', 'SUPPORT_STAFF'] },
  { label: 'Notifications', path: '/notifications', icon: <Notifications />, roles: ['SCHOOL_ADMIN', 'SUPER_ADMIN', 'SUPPORT_STAFF'] },
];

/** Super Admin sees a platform-only console, not the school-scoped menus. */
const PLATFORM_NAV: NavItem[] = [
  { label: 'Dashboard', path: '/admin', icon: <Dashboard /> },
  { label: 'Schools', path: '/admin/schools', icon: <Business /> },
  { label: 'Plans', path: '/admin/plans', icon: <AccountBalance /> },
  { label: 'Operations', path: '/admin/operations', icon: <BugReport /> },
];

const itemSx = (active: boolean) => ({
  borderRadius: 2.5,
  mb: 0.35,
  py: 0.9,
  position: 'relative',
  color: active ? '#0C831F' : '#5A5A5A',
  bgcolor: active ? '#E7F6EA !important' : 'transparent',
  fontWeight: active ? 700 : 500,
  transition: 'background-color .15s ease, color .15s ease',
  '&:hover': { bgcolor: active ? '#E7F6EA' : '#F3F5F6', color: active ? '#0C831F' : '#1C1C1C' },
  '& .MuiListItemIcon-root': { color: 'inherit', minWidth: 36 },
  ...(active && {
    '&::before': {
      content: '""',
      position: 'absolute',
      left: 0,
      top: '20%',
      bottom: '20%',
      width: 3,
      borderRadius: 4,
      backgroundColor: '#0C831F',
    },
  }),
});

export function Sidebar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { hasRole, isSuperAdmin } = useAuth();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({ 'Academic Setup': true });

  const nav = isSuperAdmin() ? PLATFORM_NAV : NAV;

  const toggle = (label: string) =>
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));

  const isVisible = (item: NavItem) =>
    !item.roles || hasRole(...(item.roles as any[]));

  // Exact match for roots so '/admin' doesn't stay active on '/admin/schools'.
  const EXACT = ['/', '/admin'];
  const isActive = (path?: string) =>
    path ? (EXACT.includes(path) ? pathname === path : pathname.startsWith(path)) : false;

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' },
      }}
    >
      <Toolbar sx={{ px: 2.5, py: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, #0C831F 0%, #1DA837 100%)',
              boxShadow: '0 6px 16px rgba(12,131,31,0.30)',
            }}
          >
            <School sx={{ color: '#fff', fontSize: 24 }} />
          </Box>
          <Box>
            <Typography sx={{ color: '#1C1C1C', fontWeight: 800, lineHeight: 1.05, fontSize: '1.05rem', letterSpacing: '-0.02em' }}>
              SchoolERP
            </Typography>
            <Typography variant="caption" sx={{ color: '#9AA0A6', fontWeight: 600 }}>
              Management Suite
            </Typography>
          </Box>
        </Box>
      </Toolbar>

      <Divider sx={{ borderColor: '#EDEFF1' }} />

      <List sx={{ px: 1, py: 1, flex: 1, overflowY: 'auto' }}>
        {nav.filter(isVisible).map((item) => {
          // Group with children
          if (item.children) {
            const groupOpen = !!openGroups[item.label];
            const groupActive = item.children.some((c) => isActive(c.path));
            return (
              <Box key={item.label}>
                <ListItemButton
                  onClick={() => toggle(item.label)}
                  sx={itemSx(groupActive && !groupOpen)}
                >
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: groupActive ? 600 : 400 }}
                  />
                  {groupOpen ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
                </ListItemButton>

                <Collapse in={groupOpen} timeout="auto" unmountOnExit>
                  <List disablePadding sx={{ pl: 1.5 }}>
                    {item.children.filter(isVisible).map((child) => {
                      const active = isActive(child.path);
                      return (
                        <ListItemButton
                          key={child.path}
                          onClick={() => navigate(child.path!)}
                          selected={active}
                          sx={itemSx(active)}
                        >
                          <ListItemIcon sx={{ minWidth: 32 }}>{child.icon}</ListItemIcon>
                          <ListItemText
                            primary={child.label}
                            primaryTypographyProps={{ fontSize: '0.8125rem', fontWeight: active ? 600 : 400 }}
                          />
                        </ListItemButton>
                      );
                    })}
                  </List>
                </Collapse>
              </Box>
            );
          }

          // Regular item
          const active = isActive(item.path);
          return (
            <ListItemButton
              key={item.path}
              onClick={() => navigate(item.path!)}
              selected={active}
              sx={itemSx(active)}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: active ? 600 : 400 }}
              />
            </ListItemButton>
          );
        })}
      </List>
    </Drawer>
  );
}
