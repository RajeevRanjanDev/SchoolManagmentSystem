import {
  Box, Card, CardContent, Typography, CircularProgress, Button, Grid, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton,
  Tooltip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Divider,
} from '@mui/material';
import { Add, Delete, School, EditNote, ArrowBack } from '@mui/icons-material';
import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { examsApi, type Exam } from '@/api/exams.api';
import { attendanceApi } from '@/api/attendance.api';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { useMyClassSections, ACADEMIC_YEAR } from '@/hooks/useMyClassSections';
import { ClassSectionPicker } from '@/components/teacher/ClassSectionPicker';

export default function TeacherExamsPage() {
  const qc = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const { sections, selected, selectedId, setSelectedId, isLoading, hasNone } = useMyClassSections();

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ examName: '', examDate: '', totalMarks: '100' });
  const [activeExam, setActiveExam] = useState<Exam | null>(null);
  const [marks, setMarks] = useState<Record<number, string>>({});

  const { data: exams = [], isLoading: loadingExams } = useQuery<Exam[]>({
    queryKey: ['teacher-exams', selectedId],
    queryFn: () => examsApi.listBySection(selectedId as number, ACADEMIC_YEAR),
    enabled: !!selectedId,
  });

  const { data: roster = [] } = useQuery<any[]>({
    queryKey: ['teacher-exam-roster', selectedId],
    queryFn: () => attendanceApi.getSectionStudents(selectedId as number),
    enabled: !!selectedId && !!activeExam,
  });

  const { data: results = [] } = useQuery<any[]>({
    queryKey: ['teacher-exam-results', activeExam?.id],
    queryFn: () => examsApi.getExamResults(activeExam!.id),
    enabled: !!activeExam,
  });

  useEffect(() => {
    if (!activeExam) return;
    const seeded: Record<number, string> = {};
    (results ?? []).forEach((r: any) => { if (r.studentId != null) seeded[r.studentId] = String(r.marksObtained ?? ''); });
    setMarks(seeded);
  }, [activeExam, results]);

  const createMutation = useMutation({
    mutationFn: () => examsApi.schedule({
      sectionId: selectedId as number,
      examName: form.examName.trim(),
      examDate: form.examDate,
      totalMarks: form.totalMarks ? Number(form.totalMarks) : undefined,
      academicYear: ACADEMIC_YEAR,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teacher-exams', selectedId] });
      enqueueSnackbar('Exam created', { variant: 'success' });
      setCreateOpen(false); setForm({ examName: '', examDate: '', totalMarks: '100' });
    },
    onError: (e: any) => enqueueSnackbar(e?.response?.data?.message ?? 'Failed to create exam', { variant: 'error' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (examId: number) => examsApi.deleteExam(examId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teacher-exams', selectedId] });
      enqueueSnackbar('Exam deleted', { variant: 'success' });
      setActiveExam(null);
    },
    onError: (e: any) => enqueueSnackbar(e?.response?.data?.message ?? 'Failed to delete exam', { variant: 'error' }),
  });

  const saveMarks = useMutation({
    mutationFn: () => examsApi.bulkUpload(activeExam!.id,
      roster
        .filter((s) => marks[s.id] !== undefined && marks[s.id] !== '')
        .map((s) => ({ studentId: s.id, marksObtained: Number(marks[s.id]) }))),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teacher-exam-results', activeExam?.id] });
      enqueueSnackbar('Marks saved', { variant: 'success' });
    },
    onError: (e: any) => enqueueSnackbar(e?.response?.data?.message ?? 'Failed to save marks', { variant: 'error' }),
  });

  return (
    <Box>
      <PageHeader
        title="Exams & Results"
        subtitle="Create exams and enter report-card marks for your class"
        crumbs={[{ label: 'Dashboard', path: '/' }, { label: 'Exams & Results' }]}
      />

      {isLoading ? (
        <Box sx={{ textAlign: 'center', py: 6 }}><CircularProgress /></Box>
      ) : hasNone ? (
        <Card><EmptyState title="No class assigned" description="You are not set as class teacher of any section yet." icon={<School sx={{ fontSize: 64 }} />} /></Card>
      ) : (
        <>
          <Card sx={{ p: 2, mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
              <ClassSectionPicker sections={sections} selectedId={selectedId} onChange={(id) => { setSelectedId(id); setActiveExam(null); }} />
              {!activeExam && (
                <Button variant="contained" startIcon={<Add />} onClick={() => setCreateOpen(true)}>Add Exam</Button>
              )}
            </Box>
          </Card>

          {activeExam ? (
            <>
              <Button startIcon={<ArrowBack />} sx={{ mb: 2 }} onClick={() => setActiveExam(null)}>Back to exams</Button>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                    <Box>
                      <Typography variant="h6" fontWeight={700}>{activeExam.examName}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {selected?.className} · {selected?.sectionName} · Max marks {activeExam.totalMarks}
                      </Typography>
                    </Box>
                    <Button variant="contained" disabled={saveMarks.isPending} onClick={() => saveMarks.mutate()}>
                      {saveMarks.isPending ? 'Saving…' : 'Save Marks'}
                    </Button>
                  </Box>
                  <Divider sx={{ mb: 1 }} />
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Roll</TableCell>
                          <TableCell>Student</TableCell>
                          <TableCell align="right">Marks (out of {activeExam.totalMarks})</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {roster.length === 0 ? (
                          <TableRow><TableCell colSpan={3}><EmptyState title="No students" description="This section has no students." /></TableCell></TableRow>
                        ) : roster.map((s) => (
                          <TableRow key={s.id} hover>
                            <TableCell>{s.rollNumber ? `#${s.rollNumber}` : '—'}</TableCell>
                            <TableCell><Typography variant="body2" fontWeight={600}>{s.firstName} {s.lastName}</Typography></TableCell>
                            <TableCell align="right">
                              <TextField
                                type="number" size="small" sx={{ width: 120 }}
                                value={marks[s.id] ?? ''}
                                inputProps={{ min: 0, max: activeExam.totalMarks }}
                                onChange={(e) => setMarks((m) => ({ ...m, [s.id]: e.target.value }))}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </>
          ) : loadingExams ? (
            <Box sx={{ textAlign: 'center', py: 6 }}><CircularProgress /></Box>
          ) : exams.length === 0 ? (
            <Card><EmptyState title="No exams yet" description="Click “Add Exam” to schedule one for your class." icon={<School sx={{ fontSize: 64 }} />} /></Card>
          ) : (
            <Grid container spacing={2}>
              {exams.map((ex) => (
                <Grid item xs={12} sm={6} md={4} key={ex.id}>
                  <Card sx={{ height: '100%' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box>
                          <Typography variant="subtitle1" fontWeight={700}>{ex.examName}</Typography>
                          <Typography variant="caption" color="text.secondary">{ex.examDate} · Max {ex.totalMarks}</Typography>
                        </Box>
                        <Tooltip title="Delete exam">
                          <IconButton size="small" color="error"
                            onClick={() => { if (confirm(`Delete exam "${ex.examName}" and its results?`)) deleteMutation.mutate(ex.id); }}>
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                      <Chip sx={{ mt: 1.5 }} size="small" icon={<EditNote />} label="Enter marks"
                        onClick={() => setActiveExam(ex)} color="primary" variant="outlined" clickable />
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </>
      )}

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle fontWeight={700}>New Exam</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 0.5 }}>
            <TextField label="Exam name" fullWidth required value={form.examName}
              placeholder="e.g. Unit Test 1 / Mid-Term"
              onChange={(e) => setForm({ ...form, examName: e.target.value })} />
            <TextField label="Exam date" type="date" fullWidth required InputLabelProps={{ shrink: true }}
              value={form.examDate} onChange={(e) => setForm({ ...form, examDate: e.target.value })} />
            <TextField label="Total marks" type="number" fullWidth value={form.totalMarks}
              inputProps={{ min: 1 }} onChange={(e) => setForm({ ...form, totalMarks: e.target.value })} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button variant="outlined" onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={!form.examName.trim() || !form.examDate || createMutation.isPending}
            onClick={() => createMutation.mutate()}>
            {createMutation.isPending ? 'Creating…' : 'Create Exam'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
