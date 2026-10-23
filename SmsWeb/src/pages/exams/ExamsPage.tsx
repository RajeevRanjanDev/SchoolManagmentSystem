import {
  Box, Card, Grid, Typography, FormControl, InputLabel, Select, MenuItem, TextField,
  Button, Chip, CircularProgress, Divider, IconButton, Tooltip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions, Alert,
} from '@mui/material';
import { Add, DeleteOutline, Save, EventNote } from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useSnackbar } from 'notistack';
import dayjs from 'dayjs';
import { examsApi } from '@/api/exams.api';
import { attendanceApi } from '@/api/attendance.api';
import { classesApi, sectionsApi } from '@/api/admin.api';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { useAuth } from '@/hooks/useAuth';
import { fmtDate } from '@/utils/formatters';

const YEAR = '2024-2025';

export default function ExamsPage() {
  const qc = useQueryClient();
  const { isSchoolAdmin } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const admin = isSchoolAdmin();

  const [classId, setClassId] = useState<number | ''>('');
  const [sectionId, setSectionId] = useState<number | ''>('');
  const [examId, setExamId] = useState<number | ''>('');
  const [addOpen, setAddOpen] = useState(false);
  const [deleteExam, setDeleteExam] = useState<any | null>(null);
  const [marks, setMarks] = useState<Record<number, string>>({});

  const { data: classes = [] } = useQuery<any[]>({ queryKey: ['classes'], queryFn: () => classesApi.list(), staleTime: 60_000 });
  const { data: sections = [] } = useQuery<any[]>({ queryKey: ['sections-all'], queryFn: () => sectionsApi.listAll(), staleTime: 60_000 });
  const sectionsForClass = sections.filter((s) => s.classId === classId);

  const { data: exams = [] } = useQuery<any[]>({
    queryKey: ['exams', sectionId],
    queryFn: () => examsApi.listBySection(sectionId as number, YEAR),
    enabled: !!sectionId,
  });

  const { data: roster = [] } = useQuery<any[]>({
    queryKey: ['section-roster', sectionId],
    queryFn: () => attendanceApi.getSectionStudents(sectionId as number),
    enabled: !!sectionId,
  });

  const { data: results = [] } = useQuery<any[]>({
    queryKey: ['exam-results', examId],
    queryFn: () => examsApi.getExamResults(examId as number),
    enabled: !!examId,
  });

  const selectedExam = exams.find((e) => e.id === examId);

  // Prefill marks from existing results whenever the exam / results change.
  useEffect(() => {
    const map: Record<number, string> = {};
    results.forEach((r) => { if (r.studentId != null) map[r.studentId] = String(r.marksObtained ?? ''); });
    setMarks(map);
  }, [examId, results]);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<any>({
    defaultValues: { examName: '', examDate: dayjs().format('YYYY-MM-DD'), totalMarks: 100 },
  });

  const createMutation = useMutation({
    mutationFn: (d: any) => examsApi.schedule({
      sectionId: sectionId as number, examName: d.examName, examDate: d.examDate,
      totalMarks: Number(d.totalMarks) || 100, academicYear: YEAR,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['exams', sectionId] });
      setAddOpen(false); reset();
      enqueueSnackbar('Exam created', { variant: 'success' });
    },
    onError: (e: any) => enqueueSnackbar(e?.response?.data?.message ?? 'Failed to create exam', { variant: 'error' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => examsApi.deleteExam(id),
    onSuccess: (_d, id) => {
      qc.invalidateQueries({ queryKey: ['exams', sectionId] });
      if (examId === id) setExamId('');
      setDeleteExam(null);
      enqueueSnackbar('Exam deleted', { variant: 'success' });
    },
    onError: (e: any) => { setDeleteExam(null); enqueueSnackbar(e?.response?.data?.message ?? 'Failed to delete', { variant: 'error' }); },
  });

  const saveMutation = useMutation({
    mutationFn: () => examsApi.bulkUpload(examId as number,
      roster
        .filter((s) => marks[s.id] !== undefined && marks[s.id] !== '')
        .map((s) => ({ studentId: s.id, marksObtained: Number(marks[s.id]) }))),
    onSuccess: (res: any) => {
      qc.invalidateQueries({ queryKey: ['exam-results', examId] });
      enqueueSnackbar(res?.message ?? 'Results saved', { variant: 'success' });
    },
    onError: (e: any) => enqueueSnackbar(e?.response?.data?.message ?? 'Failed to save results', { variant: 'error' }),
  });

  return (
    <Box>
      <PageHeader
        title="Exams & Results"
        subtitle="Create exams per class-section and upload results"
        crumbs={[{ label: 'Dashboard', path: '/' }, { label: 'Exams & Results' }]}
      />

      {/* Selectors */}
      <Card sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <FormControl size="small" fullWidth>
              <InputLabel>Class</InputLabel>
              <Select label="Class" value={classId}
                onChange={(e) => { setClassId(Number(e.target.value)); setSectionId(''); setExamId(''); }}>
                {classes.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl size="small" fullWidth disabled={classId === ''}>
              <InputLabel>Section</InputLabel>
              <Select label="Section" value={sectionId}
                onChange={(e) => { setSectionId(Number(e.target.value)); setExamId(''); }}>
                {sectionsForClass.map((s) => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4} sx={{ textAlign: { sm: 'right' } }}>
            {admin && (
              <Button variant="contained" startIcon={<Add />} disabled={!sectionId} onClick={() => setAddOpen(true)}>
                Add Exam
              </Button>
            )}
          </Grid>
        </Grid>
      </Card>

      {!sectionId ? (
        <Card sx={{ py: 2 }}><EmptyState title="Select a class & section" description="Choose a class and section to see its exams and enter results." /></Card>
      ) : (
        <>
          {/* Exams list */}
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>Exams ({exams.length})</Typography>
          {exams.length === 0 ? (
            <Card sx={{ py: 2, mb: 3 }}><EmptyState title="No exams yet" description={admin ? 'Use "Add Exam" to create one.' : 'No exams have been scheduled for this section.'} /></Card>
          ) : (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 3 }}>
              {exams.map((ex) => (
                <Card key={ex.id} onClick={() => setExamId(ex.id)}
                  sx={{ p: 1.75, cursor: 'pointer', minWidth: 220, border: examId === ex.id ? '2px solid #0C831F' : undefined }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <EventNote sx={{ color: 'primary.main' }} />
                      <Box>
                        <Typography variant="body2" fontWeight={700}>{ex.examName}</Typography>
                        <Typography variant="caption" color="text.secondary">{fmtDate(ex.examDate)} · /{ex.totalMarks}</Typography>
                      </Box>
                    </Box>
                    {admin && (
                      <Tooltip title="Delete exam & results">
                        <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); setDeleteExam(ex); }}>
                          <DeleteOutline fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                </Card>
              ))}
            </Box>
          )}

          {/* Results entry */}
          {examId !== '' && (
            <Card>
              <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                <Box>
                  <Typography variant="subtitle1" fontWeight={700}>{selectedExam?.examName} — Results</Typography>
                  <Typography variant="caption" color="text.secondary">Enter marks out of {selectedExam?.totalMarks}</Typography>
                </Box>
                <Button variant="contained" startIcon={<Save />} disabled={roster.length === 0 || saveMutation.isPending}
                  onClick={() => saveMutation.mutate()}>
                  {saveMutation.isPending ? 'Saving…' : 'Save Results'}
                </Button>
              </Box>
              <Divider />
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Roll</TableCell>
                      <TableCell>Student</TableCell>
                      <TableCell>Admission No.</TableCell>
                      <TableCell align="right">Marks (/{selectedExam?.totalMarks})</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {roster.length === 0 ? (
                      <TableRow><TableCell colSpan={4}><EmptyState title="No students" description="No enrolled students in this section." /></TableCell></TableRow>
                    ) : roster.map((s) => (
                      <TableRow key={s.id} hover>
                        <TableCell>{s.rollNumber ?? '—'}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{s.firstName} {s.lastName}</TableCell>
                        <TableCell sx={{ fontFamily: 'monospace' }}>{s.admissionNumber}</TableCell>
                        <TableCell align="right">
                          <TextField
                            size="small" type="number" sx={{ width: 110 }}
                            inputProps={{ min: 0, max: selectedExam?.totalMarks, style: { textAlign: 'right' } }}
                            value={marks[s.id] ?? ''}
                            onChange={(e) => setMarks((m) => ({ ...m, [s.id]: e.target.value }))}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          )}
        </>
      )}

      {/* Add exam dialog */}
      <Dialog open={addOpen} onClose={() => setAddOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle fontWeight={700}>New Exam</DialogTitle>
        <form onSubmit={handleSubmit((d) => createMutation.mutate(d))}>
          <DialogContent>
            {createMutation.isError && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: 3 }}>
                {(createMutation.error as any)?.response?.data?.message ?? 'Failed to create exam'}
              </Alert>
            )}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <TextField label="Exam name" fullWidth required placeholder="e.g. Mid-Term, Unit Test 1"
                {...register('examName', { required: 'Required' })} error={!!errors.examName} helperText={(errors.examName as any)?.message} />
              <TextField label="Exam date" type="date" fullWidth required InputLabelProps={{ shrink: true }}
                {...register('examDate', { required: 'Required' })} />
              <TextField label="Total marks" type="number" fullWidth inputProps={{ min: 1 }}
                {...register('totalMarks', { valueAsNumber: true })} />
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
            <Button onClick={() => setAddOpen(false)} variant="outlined">Cancel</Button>
            <Button type="submit" variant="contained" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Saving…' : 'Create Exam'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <ConfirmDialog
        open={deleteExam !== null}
        title="Delete Exam"
        message={`Delete "${deleteExam?.examName}" and all its results? This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={() => deleteExam && deleteMutation.mutate(deleteExam.id)}
        onCancel={() => setDeleteExam(null)}
        loading={deleteMutation.isPending}
      />
    </Box>
  );
}
