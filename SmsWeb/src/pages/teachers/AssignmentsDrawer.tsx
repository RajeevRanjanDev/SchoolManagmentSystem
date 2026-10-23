import {
  Drawer, Box, Typography, Avatar, IconButton, Divider, Chip, Button,
  Select, MenuItem, FormControl, InputLabel, Switch, FormControlLabel,
  CircularProgress, Tooltip, TextField, Card,
} from '@mui/material';
import { Close, Star, StarBorder, DeleteOutline, Add, Workspaces, InfoOutlined } from '@mui/icons-material';
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { teachersApi } from '@/api/teachers.api';
import { classesApi, sectionsApi, subjectsApi } from '@/api/admin.api';
import { initials } from '@/utils/formatters';
import { brand } from '@/theme/theme';

interface Props {
  teacher: any | null;
  onClose: () => void;
}

function currentAcademicYear() {
  const now = new Date();
  const y = now.getFullYear();
  return now.getMonth() >= 3 ? `${y}-${y + 1}` : `${y - 1}-${y}`;
}

export function AssignmentsDrawer({ teacher, onClose }: Props) {
  const qc = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const open = !!teacher;
  const teacherId = teacher?.id;

  const [classId, setClassId] = useState<number | ''>('');
  const [sectionId, setSectionId] = useState<number | ''>('');
  const [subjectId, setSubjectId] = useState<number | ''>('');
  const [year, setYear] = useState(currentAcademicYear());
  const [asClassTeacher, setAsClassTeacher] = useState(false);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['teachers'] });
    qc.invalidateQueries({ queryKey: ['teacher-assignments', teacherId] });
  };

  const { data: assignments = [], isLoading } = useQuery<any[]>({
    queryKey: ['teacher-assignments', teacherId],
    queryFn: () => teachersApi.getAssignments(teacherId),
    enabled: open,
  });

  const { data: classes = [] } = useQuery<any[]>({ queryKey: ['classes'], queryFn: () => classesApi.list(), enabled: open });
  const { data: sections = [] } = useQuery<any[]>({ queryKey: ['sections-all'], queryFn: () => sectionsApi.listAll(), enabled: open });
  const { data: subjects = [] } = useQuery<any[]>({ queryKey: ['subjects'], queryFn: () => subjectsApi.list(), enabled: open });

  const sectionsForClass = useMemo(
    () => sections.filter((s) => s.classId === classId),
    [sections, classId],
  );

  const resetForm = () => {
    setClassId(''); setSectionId(''); setSubjectId(''); setAsClassTeacher(false);
  };

  const assignMutation = useMutation({
    mutationFn: () => teachersApi.assign(teacherId, {
      classId: classId as number,
      sectionId: sectionId as number,
      subjectId: subjectId as number,
      academicYear: year,
      isClassTeacher: asClassTeacher,
    }),
    onSuccess: () => {
      invalidate();
      resetForm();
      enqueueSnackbar('Class assigned', { variant: 'success' });
    },
    onError: (e: any) => enqueueSnackbar(e?.response?.data?.message ?? 'Failed to assign', { variant: 'error' }),
  });

  const classTeacherMutation = useMutation({
    mutationFn: ({ id, flag }: { id: number; flag: boolean }) => teachersApi.setClassTeacher(id, flag),
    onSuccess: (_d, v) => {
      invalidate();
      enqueueSnackbar(v.flag ? 'Set as class teacher' : 'Removed as class teacher', { variant: 'success' });
    },
    onError: (e: any) => enqueueSnackbar(e?.response?.data?.message ?? 'Could not update class teacher', { variant: 'error' }),
  });

  const removeMutation = useMutation({
    mutationFn: (id: number) => teachersApi.removeAssignment(id),
    onSuccess: () => { invalidate(); enqueueSnackbar('Assignment removed', { variant: 'success' }); },
    onError: (e: any) => enqueueSnackbar(e?.response?.data?.message ?? 'Failed to remove', { variant: 'error' }),
  });

  const canAdd = classId !== '' && sectionId !== '' && subjectId !== '' && year.trim() !== '';

  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: { xs: '100%', sm: 460 }, borderRadius: 0 } }}>
      {teacher && (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Header */}
          <Box sx={{ p: 2.5, background: 'linear-gradient(135deg, #0C831F 0%, #16A34A 100%)', color: '#fff' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Workspaces fontSize="small" />
                <Typography fontWeight={700}>Manage Classes</Typography>
              </Box>
              <IconButton onClick={onClose} sx={{ color: '#fff' }}><Close /></IconButton>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar src={teacher.photoUrl} sx={{ width: 48, height: 48, bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 700 }}>
                {initials(teacher.firstName ?? '?', teacher.lastName ?? '')}
              </Avatar>
              <Box>
                <Typography fontWeight={700}>{teacher.firstName} {teacher.lastName}</Typography>
                <Typography variant="caption" sx={{ opacity: 0.85, fontFamily: 'monospace' }}>{teacher.employeeCode}</Typography>
              </Box>
            </Box>
          </Box>

          {/* Body */}
          <Box sx={{ flex: 1, overflowY: 'auto', p: 2.5 }}>
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
              Current Assignments ({assignments.length})
            </Typography>

            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={28} /></Box>
            ) : assignments.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 3, color: 'text.disabled' }}>
                <Typography variant="body2">No classes assigned yet.</Typography>
              </Box>
            ) : (
              assignments.map((a) => (
                <Card key={a.id} variant="outlined" sx={{ p: 1.5, mb: 1.25, display: 'flex', alignItems: 'center', gap: 1, bgcolor: a.classTeacher ? '#FFF6D9' : '#fff', borderColor: a.classTeacher ? '#FFD54A' : brand.line }}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
                      <Typography variant="body2" fontWeight={700}>{a.className}-{a.sectionName}</Typography>
                      <Chip size="small" label={a.subjectName} sx={{ height: 20, fontSize: '0.68rem', fontWeight: 600 }} />
                    </Box>
                    <Typography variant="caption" color="text.secondary">{a.academicYear}</Typography>
                    {a.classTeacher && (
                      <Typography variant="caption" fontWeight={700} color="#8A5B00" sx={{ display: 'block' }}>
                        ★ Class Teacher of this section
                      </Typography>
                    )}
                  </Box>
                  <Tooltip title={a.classTeacher ? 'Remove as class teacher' : 'Make class teacher of this section'}>
                    <span>
                      <IconButton
                        size="small"
                        disabled={classTeacherMutation.isPending}
                        onClick={() => classTeacherMutation.mutate({ id: a.id, flag: !a.classTeacher })}
                      >
                        {a.classTeacher ? <Star sx={{ color: '#FF8A00' }} /> : <StarBorder />}
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title="Remove assignment">
                    <span>
                      <IconButton size="small" color="error" disabled={removeMutation.isPending} onClick={() => removeMutation.mutate(a.id)}>
                        <DeleteOutline fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                </Card>
              ))
            )}

            <Divider sx={{ my: 2.5 }} />

            {/* Add form */}
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>Assign a Class</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.75 }}>
              <FormControl size="small" fullWidth>
                <InputLabel>Class</InputLabel>
                <Select value={classId} label="Class" onChange={(e) => { setClassId(e.target.value as number); setSectionId(''); }}>
                  {classes.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                </Select>
              </FormControl>

              <FormControl size="small" fullWidth disabled={classId === ''}>
                <InputLabel>Section</InputLabel>
                <Select value={sectionId} label="Section" onChange={(e) => setSectionId(e.target.value as number)}>
                  {sectionsForClass.length === 0 && <MenuItem disabled value="">No sections</MenuItem>}
                  {sectionsForClass.map((s) => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
                </Select>
              </FormControl>

              <FormControl size="small" fullWidth>
                <InputLabel>Subject</InputLabel>
                <Select value={subjectId} label="Subject" onChange={(e) => setSubjectId(e.target.value as number)}>
                  {subjects.map((s) => <MenuItem key={s.id} value={s.id}>{s.subjectName ?? s.name}</MenuItem>)}
                </Select>
              </FormControl>

              <TextField size="small" label="Academic Year" fullWidth value={year} onChange={(e) => setYear(e.target.value)} placeholder="2024-2025" />

              <FormControlLabel
                control={<Switch checked={asClassTeacher} onChange={(e) => setAsClassTeacher(e.target.checked)} color="warning" />}
                label={<Typography variant="body2" fontWeight={600}>Also make class teacher of this section</Typography>}
              />

              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.75, p: 1.25, borderRadius: 2, bgcolor: '#F3F5F6' }}>
                <InfoOutlined sx={{ fontSize: 16, color: 'text.secondary', mt: 0.2 }} />
                <Typography variant="caption" color="text.secondary">
                  A section can have only one class teacher. If one already exists, remove theirs first.
                </Typography>
              </Box>

              <Button
                variant="contained"
                startIcon={<Add />}
                disabled={!canAdd || assignMutation.isPending}
                onClick={() => assignMutation.mutate()}
              >
                {assignMutation.isPending ? 'Assigning…' : 'Add Assignment'}
              </Button>
            </Box>
          </Box>
        </Box>
      )}
    </Drawer>
  );
}
