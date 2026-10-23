import {
  Box, Card, CardContent, Typography, List, ListItem,
  ListItemText, ListItemIcon, IconButton, Chip, CircularProgress, Divider,
} from '@mui/material';
import {
  Notifications, CheckCircle, Payment,
  MenuBook, EventNote, Campaign, Event,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '@/api/communication.api';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { fmtDate } from '@/utils/formatters';

const TYPE_ICON: Record<string, React.ReactNode> = {
  ATTENDANCE: <EventNote />,
  FEE: <Payment />,
  HOMEWORK: <MenuBook />,
  EXAM: <EventNote />,
  CIRCULAR: <Campaign />,
  EVENT: <Event />,
  SYSTEM: <Notifications />,
};

const TYPE_COLOR: Record<string, string> = {
  ATTENDANCE: '#1565C0', FEE: '#F57C00', HOMEWORK: '#388E3C',
  EXAM: '#7B1FA2', CIRCULAR: '#0277BD', EVENT: '#E53935', SYSTEM: '#616161',
};

export default function NotificationsPage() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.list(0, 50),
  });

  const markReadMutation = useMutation({
    mutationFn: notificationsApi.markRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const notifications = data?.content ?? [];
  const unread = notifications.filter((n) => !n.isRead).length;

  return (
    <Box>
      <PageHeader
        title="Notifications"
        subtitle={unread > 0 ? `${unread} unread notifications` : 'All notifications'}
        crumbs={[{ label: 'Dashboard', path: '/' }, { label: 'Notifications' }]}
      />

      <Card sx={{ maxWidth: 700 }}>
        {isLoading ? (
          <Box sx={{ textAlign: 'center', py: 6 }}><CircularProgress /></Box>
        ) : notifications.length === 0 ? (
          <EmptyState title="No notifications" icon={<Notifications sx={{ fontSize: 64 }} />} />
        ) : (
          <List disablePadding>
            {notifications.map((n, i) => (
              <Box key={n.id}>
                <ListItem
                  sx={{
                    px: 3,
                    py: 2,
                    bgcolor: n.isRead ? 'transparent' : '#F0F4FF',
                    '&:hover': { bgcolor: '#F5F7FA' },
                  }}
                  secondaryAction={
                    !n.isRead && (
                      <IconButton size="small" onClick={() => markReadMutation.mutate(n.id)} title="Mark as read">
                        <CheckCircle fontSize="small" sx={{ color: 'success.main' }} />
                      </IconButton>
                    )
                  }
                >
                  <ListItemIcon>
                    <Box
                      sx={{
                        width: 40, height: 40, borderRadius: '50%',
                        bgcolor: `${TYPE_COLOR[n.type]}18`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: TYPE_COLOR[n.type],
                      }}
                    >
                      {TYPE_ICON[n.type]}
                    </Box>
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" fontWeight={n.isRead ? 400 : 600}>{n.title}</Typography>
                        <Chip label={n.type} size="small" sx={{ fontSize: 10, height: 18 }} />
                        {!n.isRead && <Chip label="New" size="small" color="primary" sx={{ fontSize: 10, height: 18 }} />}
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
