import {
  Box, Button, Card, CardContent, Typography, List, ListItem,
  ListItemText, ListItemIcon, IconButton, Chip, CircularProgress, Divider,
  Tabs, Tab, TextField, MenuItem, Grid, Stack, Avatar,
} from '@mui/material';
import {
  Notifications, CheckCircle, Payment, EventNote, Campaign,
  Event, Send, MarkEmailRead, NotificationsNone,
  Announcement, Schedule,
} from '@mui/icons-material';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { notificationsApi, broadcastApi } from '@/api/communication.api';
import { classesApi, sectionsApi } from '@/api/admin.api';
import { attendanceApi } from '@/api/attendance.api';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { AttachmentPicker, AttachmentChip } from '@/components/common/AttachmentPicker';
import { fmtDate } from '@/utils/formatters';

// Values MUST match the backend NotificationType enum.
const NOTIFICATION_TYPES = [
  { value: 'GENERAL', label: 'General', icon: <Notifications />, color: '#616161' },
  { value: 'CIRCULAR', label: 'Circular', icon: <Campaign />, color: '#0277BD' },
  { value: 'FEE_REMINDER', label: 'Fee Notice', icon: <Payment />, color: '#F57C00' },
  { value: 'EXAM_SCHEDULE', label: 'Exam Notice', icon: <EventNote />, color: '#7B1FA2' },
  { value: 'ATTENDANCE_ALERT', label: 'Attendance', icon: <EventNote />, color: '#1565C0' },
];

// Student-targeting audiences are offered for attendance & fee notices.
const STUDENT_TARGET_TYPES = ['ATTENDANCE_ALERT', 'FEE_REMINDER'];

const AUDIENCE_LABEL: Record<string, string> = {
  ALL_SCHOOL: 'All School',
  TEACHERS: 'Teachers',
  CLASS_TEACHERS: 'Class Teachers',
  CLASS: 'Class Teachers (class)',
  CLASS_STUDENTS: 'Class — all students',
  SECTION_STUDENTS: 'Section — all students',
  STUDENT: 'A student',
  FEE_DEFAULTERS: 'Fee defaulters',
};

const TYPE_ICON: Record<string, React.ReactNode> = {
  ATTENDANCE_ALERT: <EventNote />, FEE_REMINDER: <Payment />, HOMEWORK: <Notifications />,
  EXAM_SCHEDULE: <EventNote />, CIRCULAR: <Campaign />, EVENT: <Event />,
  RESULT_PUBLISHED: <EventNote />, GENERAL: <Notifications />,
};

const TYPE_COLOR: Record<string, string> = {
  ATTENDANCE_ALERT: '#1565C0', FEE_REMINDER: '#F57C00', HOMEWORK: '#388E3C',
  EXAM_SCHEDULE: '#7B1FA2', CIRCULAR: '#0277BD', EVENT: '#E53935',
  RESULT_PUBLISHED: '#00897B', GENERAL: '#616161',
};


function InboxTab() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.list(0, 50),
  });

  const markReadMutation = useMutation({
    mutationFn: notificationsApi.markRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const notifications = (data as any)?.data?.content ?? (data as any)?.content ?? [];
  const unread = notifications.filter((n: any) => !n.read).length;

  if (isLoading) {
    return <Box sx={{ textAlign: 'center', py: 6 }}><CircularProgress /></Box>;
  }

  return (
    <Box>
      {unread > 0 && (
        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip icon={<NotificationsNone />} label={`${unread} unread`} color="primary" size="small" />
        </Box>
      )}
      <Card sx={{ maxWidth: 700 }}>
        {notifications.length === 0 ? (
          <EmptyState
            title="No notifications"
            description="You're all caught up!"
            icon={<Notifications sx={{ fontSize: 64 }} />}
          />
        ) : (
          <List disablePadding>
            {notifications.map((n: any, i: number) => (
              <Box key={n.id}>
                <ListItem
                  sx={{
                    px: 3, py: 2,
                    bgcolor: n.read ? 'transparent' : '#F0F4FF',
                    '&:hover': { bgcolor: '#F5F7FA' },
                  }}
                  secondaryAction={
                    !n.read && (
                      <IconButton size="small" title="Mark as read" onClick={() => markReadMutation.mutate(n.id)}>
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
                        <Typography variant="body2" fontWeight={n.read ? 400 : 600}>{n.title}</Typography>
                        <Chip label={n.type} size="small" sx={{ fontSize: 10, height: 18 }} />
                        {!n.read && <Chip label="New" size="small" color="primary" sx={{ fontSize: 10, height: 18 }} />}
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="caption" color="text.secondary">{n.body}</Typography>
                        {n.attachmentUrl && (
                          <Box sx={{ mt: 0.75 }}>
                            <AttachmentChip url={n.attachmentUrl} name={n.attachmentName} />
                          </Box>
                        )}
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

function BroadcastTab() {
  const qc = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const EMPTY = {
    type: 'GENERAL', audience: 'ALL_SCHOOL', title: '', body: '',
    classId: '' as number | '', sectionId: '' as number | '', studentId: '' as number | '',
    feeType: 'ANY', scheduledAt: '', attachmentUrl: '', attachmentName: '',
  };
  const [form, setForm] = useState({ ...EMPTY });
  const set = (patch: Partial<typeof EMPTY>) => setForm((f) => ({ ...f, ...patch }));

  const studentTargeting = STUDENT_TARGET_TYPES.includes(form.type);
  const audienceOptions = [
    'ALL_SCHOOL', 'TEACHERS', 'CLASS_TEACHERS', 'CLASS',
    ...(studentTargeting ? ['CLASS_STUDENTS', 'SECTION_STUDENTS', 'STUDENT'] : []),
    ...(form.type === 'FEE_REMINDER' ? ['FEE_DEFAULTERS'] : []),
  ];

  const needsClass = ['CLASS', 'CLASS_STUDENTS', 'SECTION_STUDENTS', 'STUDENT'].includes(form.audience)
    || (form.audience === 'FEE_DEFAULTERS');
  const needsSection = ['SECTION_STUDENTS', 'STUDENT'].includes(form.audience);
  const needsStudent = form.audience === 'STUDENT';
  const isDefaulters = form.audience === 'FEE_DEFAULTERS';

  const { data: classes = [] } = useQuery<any[]>({ queryKey: ['classes'], queryFn: () => classesApi.list(), staleTime: 60_000 });
  const { data: sections = [] } = useQuery<any[]>({ queryKey: ['sections-all'], queryFn: () => sectionsApi.listAll(), staleTime: 60_000 });
  const sectionsForClass = sections.filter((s) => String(s.classId) === String(form.classId));
  const { data: roster = [] } = useQuery<any[]>({
    queryKey: ['notif-roster', form.sectionId],
    queryFn: () => attendanceApi.getSectionStudents(form.sectionId as number),
    enabled: !!form.sectionId && needsStudent,
  });

  const mutation = useMutation({
    mutationFn: () => broadcastApi.send({
      type: form.type, audience: form.audience, title: form.title.trim(), body: form.body.trim(),
      classId: needsClass && form.classId ? Number(form.classId) : undefined,
      sectionId: (needsSection || isDefaulters) && form.sectionId ? Number(form.sectionId) : undefined,
      studentId: needsStudent && form.studentId ? Number(form.studentId) : undefined,
      feeType: isDefaulters ? form.feeType : undefined,
      scheduledAt: form.scheduledAt || undefined,
      attachmentUrl: form.attachmentUrl || undefined,
      attachmentName: form.attachmentName || undefined,
    }),
    onSuccess: (msg: any) => {
      enqueueSnackbar(typeof msg === 'string' ? msg : 'Notification sent', { variant: 'success' });
      setForm({ ...EMPTY });
      qc.invalidateQueries({ queryKey: ['notifications-sent'] });
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['notifications-unread'] });
    },
    onError: (e: any) => enqueueSnackbar(e?.response?.data?.message ?? 'Failed to send notification', { variant: 'error' }),
  });

  const scopeValid =
    (!needsClass || !!form.classId) && (!needsSection || !!form.sectionId) && (!needsStudent || !!form.studentId);
  const canSend = !!form.title.trim() && !!form.body.trim() && scopeValid && !mutation.isPending;

  return (
    <Box sx={{ maxWidth: 680 }}>
      <Card>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
            <Avatar sx={{ bgcolor: 'primary.main' }}><Announcement /></Avatar>
            <Box>
              <Typography variant="h6" fontWeight={700}>Compose Notification</Typography>
              <Typography variant="caption" color="text.secondary">Pick a type, choose the audience, and send now or schedule it</Typography>
            </Box>
          </Box>

          <Grid container spacing={2.5}>
            {/* Notification Type */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>Notification Type</Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {NOTIFICATION_TYPES.map((t) => (
                  <Chip key={t.value} label={t.label} icon={t.icon as any}
                    onClick={() => set({ type: t.value, audience: 'ALL_SCHOOL', classId: '', sectionId: '', studentId: '' })}
                    variant={form.type === t.value ? 'filled' : 'outlined'}
                    sx={{ cursor: 'pointer', ...(form.type === t.value && { bgcolor: t.color, color: '#fff', '& .MuiChip-icon': { color: '#fff' } }) }} />
                ))}
              </Stack>
            </Grid>

            {/* Audience */}
            <Grid item xs={12} sm={6}>
              <TextField select label="Who can see this" fullWidth value={form.audience}
                onChange={(e) => set({ audience: e.target.value, classId: '', sectionId: '', studentId: '' })}>
                {audienceOptions.map((a) => <MenuItem key={a} value={a}>{AUDIENCE_LABEL[a] ?? a}</MenuItem>)}
              </TextField>
            </Grid>

            {isDefaulters && (
              <Grid item xs={12} sm={6}>
                <TextField select label="Unpaid fee type" fullWidth value={form.feeType}
                  onChange={(e) => set({ feeType: e.target.value })}>
                  <MenuItem value="ANY">Any fee</MenuItem>
                  <MenuItem value="TUITION">Tuition fee</MenuItem>
                  <MenuItem value="TRANSPORT">Transport fee</MenuItem>
                </TextField>
              </Grid>
            )}

            {/* Scope selectors */}
            {needsClass && (
              <Grid item xs={12} sm={6}>
                <TextField select label={isDefaulters ? 'Class (optional scope)' : 'Class'} fullWidth
                  required={!isDefaulters} value={form.classId}
                  onChange={(e) => set({ classId: Number(e.target.value), sectionId: '', studentId: '' })}>
                  {isDefaulters && <MenuItem value=""><em>All classes</em></MenuItem>}
                  {classes.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                </TextField>
              </Grid>
            )}
            {(needsSection || (isDefaulters && form.classId)) && (
              <Grid item xs={12} sm={6}>
                <TextField select label={needsSection ? 'Section' : 'Section (optional)'} fullWidth
                  required={needsSection} value={form.sectionId} disabled={!form.classId}
                  onChange={(e) => set({ sectionId: Number(e.target.value), studentId: '' })}>
                  {!needsSection && <MenuItem value=""><em>All sections</em></MenuItem>}
                  {sectionsForClass.map((s) => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
                </TextField>
              </Grid>
            )}
            {needsStudent && (
              <Grid item xs={12} sm={6}>
                <TextField select label="Student" fullWidth required value={form.studentId} disabled={!form.sectionId}
                  onChange={(e) => set({ studentId: Number(e.target.value) })}>
                  {roster.map((s) => (
                    <MenuItem key={s.id} value={s.id}>
                      {s.rollNumber ? `#${s.rollNumber} · ` : ''}{s.firstName} {s.lastName}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            )}

            {/* Title + message */}
            <Grid item xs={12}>
              <TextField label="Title" fullWidth required value={form.title}
                onChange={(e) => set({ title: e.target.value })} inputProps={{ maxLength: 150 }} />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Message" fullWidth required multiline rows={4} value={form.body}
                onChange={(e) => set({ body: e.target.value })} inputProps={{ maxLength: 1000 }} />
            </Grid>

            {/* Schedule */}
            <Grid item xs={12} sm={6}>
              <TextField type="datetime-local" label="Schedule for later (optional)" fullWidth
                InputLabelProps={{ shrink: true }} value={form.scheduledAt}
                helperText="Leave blank to send now"
                onChange={(e) => set({ scheduledAt: e.target.value })} />
            </Grid>

            {/* Attachment */}
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" gutterBottom>Attachment (optional)</Typography>
              <AttachmentPicker
                value={form.attachmentUrl ? { url: form.attachmentUrl, name: form.attachmentName } : null}
                onChange={(v) => set({ attachmentUrl: v?.url ?? '', attachmentName: v?.name ?? '' })}
              />
            </Grid>

            <Grid item xs={12}><Divider /></Grid>
            <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
              <Button variant="outlined" onClick={() => setForm({ ...EMPTY })}>Clear</Button>
              <Button variant="contained" disabled={!canSend}
                startIcon={mutation.isPending ? <CircularProgress size={16} color="inherit" /> : <Send />}
                onClick={() => mutation.mutate()}>
                {mutation.isPending ? 'Sending…' : form.scheduledAt ? 'Schedule' : 'Send'}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
}

function SentTab() {
  const { data, isLoading } = useQuery({
    queryKey: ['notifications-sent'],
    queryFn: () => notificationsApi.listSent(0, 50),
  });

  const sent = (data as any)?.content ?? [];

  if (isLoading) {
    return <Box sx={{ textAlign: 'center', py: 6 }}><CircularProgress /></Box>;
  }

  return (
    <Card sx={{ maxWidth: 760 }}>
      {sent.length === 0 ? (
        <EmptyState
          title="No notifications sent yet"
          description="Notifications you send will appear here."
          icon={<Campaign sx={{ fontSize: 64 }} />}
        />
      ) : (
        <List disablePadding>
          {sent.map((b: any, i: number) => (
            <Box key={b.id}>
              <ListItem sx={{ px: 3, py: 2, alignItems: 'flex-start' }}>
                <ListItemIcon sx={{ mt: 0.5 }}>
                  <Box
                    sx={{
                      width: 40, height: 40, borderRadius: '50%',
                      bgcolor: `${TYPE_COLOR[b.type] ?? '#616161'}18`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: TYPE_COLOR[b.type] ?? '#616161',
                    }}
                  >
                    {TYPE_ICON[b.type] ?? <Notifications />}
                  </Box>
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                      <Typography variant="body2" fontWeight={600}>{b.title}</Typography>
                      <Chip
                        label={AUDIENCE_LABEL[b.audience] ?? b.audience}
                        size="small"
                        color="primary"
                        variant="outlined"
                        sx={{ fontSize: 10, height: 18 }}
                      />
                      {b.className && (
                        <Chip label={b.className} size="small" sx={{ fontSize: 10, height: 18 }} />
                      )}
                      {b.status === 'SCHEDULED' ? (
                        <Chip icon={<Schedule />} label="Scheduled" size="small" color="warning"
                          sx={{ fontSize: 10, height: 18 }} />
                      ) : (
                        <Chip label={`${b.recipientCount} recipient${b.recipientCount === 1 ? '' : 's'}`}
                          size="small" sx={{ fontSize: 10, height: 18 }} />
                      )}
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="caption" color="text.secondary">{b.body}</Typography>
                      <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 0.25 }}>
                        {b.sentByName ? `By ${b.sentByName} · ` : ''}
                        {b.status === 'SCHEDULED'
                          ? `Scheduled for ${fmtDate(b.scheduledAt, 'DD MMM YYYY, HH:mm')}`
                          : fmtDate(b.sentAt, 'DD MMM YYYY, HH:mm')}
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>
              {i < sent.length - 1 && <Divider />}
            </Box>
          ))}
        </List>
      )}
    </Card>
  );
}

export default function NotificationManagementPage() {
  const [tab, setTab] = useState(0);

  const { data: unreadData } = useQuery({
    queryKey: ['notifications-unread'],
    queryFn: () => notificationsApi.getUnreadCount(),
    refetchInterval: 60_000,
  });
  const unreadCount = (unreadData as any)?.data ?? (unreadData as any) ?? 0;

  return (
    <Box>
      <PageHeader
        title="Notifications"
        subtitle="Manage and send school notifications"
        crumbs={[{ label: 'Dashboard', path: '/' }, { label: 'Notifications' }]}
      />

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{ mb: 3, borderBottom: '1px solid #EBEBEB' }}
        textColor="primary"
        indicatorColor="primary"
      >
        <Tab
          icon={<MarkEmailRead />}
          iconPosition="start"
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              My Inbox
              {unreadCount > 0 && (
                <Chip label={unreadCount} size="small" color="primary" sx={{ height: 18, fontSize: 10 }} />
              )}
            </Box>
          }
        />
        <Tab icon={<Send />} iconPosition="start" label="Send Notification" />
        <Tab icon={<Campaign />} iconPosition="start" label="Sent" />
      </Tabs>

      {tab === 0 && <InboxTab />}
      {tab === 1 && <BroadcastTab />}
      {tab === 2 && <SentTab />}
    </Box>
  );
}
