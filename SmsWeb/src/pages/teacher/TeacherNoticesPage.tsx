import {
  Box, Card, CardContent, Typography, CircularProgress, Button, Grid, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
  ToggleButton, ToggleButtonGroup, Divider, Stack,
} from '@mui/material';
import { Campaign, Add, Person, Groups, MeetingRoom } from '@mui/icons-material';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { teacherApi } from '@/api/teacher.api';
import { attendanceApi } from '@/api/attendance.api';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { AttachmentPicker, AttachmentChip, type AttachmentValue } from '@/components/common/AttachmentPicker';
import { fmtDate } from '@/utils/formatters';
import { useMyClassSections } from '@/hooks/useMyClassSections';
import { ClassSectionPicker } from '@/components/teacher/ClassSectionPicker';

type Target = 'CLASS' | 'SECTION' | 'STUDENT';

export default function TeacherNoticesPage() {
  const qc = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const { sections, selected, selectedId, setSelectedId, isLoading, hasNone } = useMyClassSections();

  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState<Target>('SECTION');
  const [studentId, setStudentId] = useState<number | ''>('');
  const [form, setForm] = useState({ title: '', content: '' });
  const [attachment, setAttachment] = useState<AttachmentValue | null>(null);

  const { data: notices = [], isLoading: loadingNotices } = useQuery<any[]>({
    queryKey: ['teacher-notices'],
    queryFn: () => teacherApi.getMyAnnouncements(),
  });

  const { data: roster = [] } = useQuery<any[]>({
    queryKey: ['teacher-notice-roster', selectedId],
    queryFn: () => attendanceApi.getSectionStudents(selectedId as number),
    enabled: !!selectedId && open && target === 'STUDENT',
  });

  const createMutation = useMutation({
    mutationFn: () => teacherApi.createAnnouncement({
      classId: selected!.classId,
      sectionId: target === 'CLASS' ? undefined : selected!.sectionId,
      studentId: target === 'STUDENT' ? Number(studentId) : undefined,
      title: form.title.trim(),
      content: form.content.trim(),
      attachmentUrl: attachment?.url,
      attachmentName: attachment?.name,
      published: true,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teacher-notices'] });
      enqueueSnackbar('Notice published', { variant: 'success' });
      closeDialog();
    },
    onError: (e: any) => enqueueSnackbar(e?.response?.data?.message ?? 'Failed to publish notice', { variant: 'error' }),
  });

  const closeDialog = () => {
    setOpen(false); setTarget('SECTION'); setStudentId(''); setForm({ title: '', content: '' });
    setAttachment(null);
  };

  const targetLabel = (n: any) =>
    n.studentId ? `Student · ${n.studentName}`
      : n.sectionId ? `${n.className} · ${n.sectionName}`
      : `${n.className} · whole class`;

  const canSubmit = !!form.title.trim() && !!form.content.trim()
    && (target !== 'STUDENT' || !!studentId) && !!selected;

  return (
    <Box>
      <PageHeader
        title="Class Notices"
        subtitle="Publish a notice to your whole class, a section, or a single student"
        crumbs={[{ label: 'Dashboard', path: '/' }, { label: 'Notices' }]}
        action={
          !hasNone ? (
            <Button variant="contained" startIcon={<Add />} disabled={!selected} onClick={() => setOpen(true)}>
              New Notice
            </Button>
          ) : undefined
        }
      />

      {isLoading ? (
        <Box sx={{ textAlign: 'center', py: 6 }}><CircularProgress /></Box>
      ) : hasNone ? (
        <Card><EmptyState title="No class assigned" description="You are not set as class teacher of any section yet." icon={<Campaign sx={{ fontSize: 64 }} />} /></Card>
      ) : (
        <>
          <Card sx={{ p: 2, mb: 3 }}>
            <ClassSectionPicker sections={sections} selectedId={selectedId} onChange={setSelectedId} />
          </Card>

          {loadingNotices ? (
            <Box sx={{ textAlign: 'center', py: 6 }}><CircularProgress /></Box>
          ) : notices.length === 0 ? (
            <Card><EmptyState title="No notices yet" description="Publish your first class notice." icon={<Campaign sx={{ fontSize: 64 }} />} /></Card>
          ) : (
            <Grid container spacing={2}>
              {notices.map((n) => (
                <Grid item xs={12} md={6} key={n.id}>
                  <Card sx={{ height: '100%' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Typography variant="subtitle1" fontWeight={700}>{n.title}</Typography>
                        <Chip size="small"
                          icon={n.studentId ? <Person /> : n.sectionId ? <MeetingRoom /> : <Groups />}
                          label={targetLabel(n)} variant="outlined"
                          color={n.studentId ? 'secondary' : 'primary'} />
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, whiteSpace: 'pre-wrap' }}>{n.content}</Typography>
                      {n.attachmentUrl && (
                        <Box sx={{ mb: 1.5 }}>
                          <AttachmentChip url={n.attachmentUrl} name={n.attachmentName} />
                        </Box>
                      )}
                      <Divider sx={{ mb: 1 }} />
                      <Typography variant="caption" color="text.disabled">
                        {n.published ? 'Published' : 'Draft'} · {fmtDate(n.publishedAt ?? n.createdAt, 'DD MMM YYYY, HH:mm')}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </>
      )}

      <Dialog open={open} onClose={closeDialog} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle fontWeight={700}>New Notice</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 0.5 }}>
            <Box>
              <Typography variant="subtitle2" gutterBottom>Who should see this?</Typography>
              <ToggleButtonGroup exclusive size="small" value={target}
                onChange={(_, v) => { if (v) { setTarget(v); setStudentId(''); } }}>
                <ToggleButton value="CLASS"><Groups fontSize="small" sx={{ mr: 0.5 }} /> Whole class</ToggleButton>
                <ToggleButton value="SECTION"><MeetingRoom fontSize="small" sx={{ mr: 0.5 }} /> This section</ToggleButton>
                <ToggleButton value="STUDENT"><Person fontSize="small" sx={{ mr: 0.5 }} /> A student</ToggleButton>
              </ToggleButtonGroup>
              {selected && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75 }}>
                  {target === 'CLASS' ? `Everyone in ${selected.className}`
                    : target === 'SECTION' ? `${selected.className} · ${selected.sectionName}`
                    : `A student in ${selected.className} · ${selected.sectionName}`}
                </Typography>
              )}
            </Box>

            {target === 'STUDENT' && (
              <TextField select label="Student" fullWidth required value={studentId}
                onChange={(e) => setStudentId(Number(e.target.value))}>
                {roster.map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.rollNumber ? `#${s.rollNumber} · ` : ''}{s.firstName} {s.lastName}
                  </MenuItem>
                ))}
              </TextField>
            )}

            <TextField label="Title" fullWidth required value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <TextField label="Message" fullWidth required multiline minRows={4} value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })} />
            <Box>
              <Typography variant="subtitle2" gutterBottom>Attachment (optional)</Typography>
              <AttachmentPicker value={attachment} onChange={setAttachment} />
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button variant="outlined" onClick={closeDialog}>Cancel</Button>
          <Button variant="contained" disabled={!canSubmit || createMutation.isPending}
            onClick={() => createMutation.mutate()}>
            {createMutation.isPending ? 'Publishing…' : 'Publish'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
