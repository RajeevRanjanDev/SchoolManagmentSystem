import {
  Box, Card, List, ListItem, ListItemIcon, ListItemText, Typography, Chip,
  IconButton, Divider, CircularProgress,
} from '@mui/material';
import {
  Notifications, CheckCircle, Payment, EventNote, Campaign, NotificationsNone,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '@/api/communication.api';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { fmtDate } from '@/utils/formatters';

const TYPE_ICON: Record<string, React.ReactNode> = {
  ATTENDANCE_ALERT: <EventNote />, FEE_REMINDER: <Payment />, EXAM_SCHEDULE: <EventNote />,
  CIRCULAR: <Campaign />, RESULT_PUBLISHED: <EventNote />, GENERAL: <Notifications />,
};
const TYPE_COLOR: Record<string, string> = {
  ATTENDANCE_ALERT: '#1565C0', FEE_REMINDER: '#F57C00', EXAM_SCHEDULE: '#7B1FA2',
  CIRCULAR: '#0277BD', RESULT_PUBLISHED: '#00897B', GENERAL: '#616161',
};

export default function TeacherInboxPage() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.list(0, 50),
  });

  const markRead = useMutation({
    mutationFn: notificationsApi.markRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const notifications = (data as any)?.content ?? (data as any)?.data?.content ?? [];
  const unread = notifications.filter((n: any) => !n.read).length;

  return (
    <Box>
      <PageHeader
        title="Inbox"
        subtitle="Notifications sent to you by the school"
        crumbs={[{ label: 'Dashboard', path: '/' }, { label: 'Inbox' }]}
      />

      {unread > 0 && (
        <Box sx={{ mb: 2 }}>
          <Chip icon={<NotificationsNone />} label={`${unread} unread`} color="primary" size="small" />
        </Box>
      )}

      <Card sx={{ maxWidth: 720 }}>
        {isLoading ? (
          <Box sx={{ textAlign: 'center', py: 6 }}><CircularProgress /></Box>
        ) : notifications.length === 0 ? (
          <EmptyState title="No notifications" description="You're all caught up!" icon={<Notifications sx={{ fontSize: 64 }} />} />
        ) : (
          <List disablePadding>
            {notifications.map((n: any, i: number) => (
              <Box key={n.id}>
                <ListItem
                  sx={{ px: 3, py: 2, bgcolor: n.read ? 'transparent' : '#F0F4FF', '&:hover': { bgcolor: '#F5F7FA' } }}
                  secondaryAction={
                    !n.read && (
                      <IconButton size="small" title="Mark as read" onClick={() => markRead.mutate(n.id)}>
                        <CheckCircle fontSize="small" sx={{ color: 'success.main' }} />
                      </IconButton>
                    )
                  }
                >
                  <ListItemIcon>
                    <Box sx={{
                      width: 40, height: 40, borderRadius: '50%',
                      bgcolor: `${TYPE_COLOR[n.type] ?? '#616161'}18`, color: TYPE_COLOR[n.type] ?? '#616161',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {TYPE_ICON[n.type] ?? <Notifications />}
                    </Box>
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" fontWeight={n.read ? 400 : 600}>{n.title}</Typography>
                        {!n.read && <Chip label="New" size="small" color="primary" sx={{ fontSize: 10, height: 18 }} />}
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="caption" color="text.secondary">{n.body}</Typography>
                        <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 0.25 }}>
                          {fmtDate(n.createdAt, 'DD MMM YYYY, HH:mm')}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
                {i < notifications.length - 1 && <Divider />}
              </Box>
            ))}
          </List>
        )}
      </Card>
    </Box>
  );
}
