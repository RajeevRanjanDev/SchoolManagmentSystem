import {
  Box, Card, Typography, CircularProgress, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Button, TextField, ToggleButton,
  ToggleButtonGroup, Chip, Stack,
} from '@mui/material';
import { FactCheck, DoneAll } from '@mui/icons-material';
import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { attendanceApi } from '@/api/attendance.api';
import { teacherApi } from '@/api/teacher.api';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { useMyClassSections } from '@/hooks/useMyClassSections';
import { ClassSectionPicker } from '@/components/teacher/ClassSectionPicker';

const STATUSES = ['PRESENT', 'ABSENT', 'LEAVE'] as const;
type Status = typeof STATUSES[number];

const STATUS_COLOR: Record<Status, string> = {
  PRESENT: '#0C831F', ABSENT: '#E23744', LEAVE: '#0277BD',
};

export default function TeacherAttendancePage() {
  const qc = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const { sections, selectedId, setSelectedId, isLoading, hasNone } = useMyClassSections();
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [marks, setMarks] = useState<Record<number, Status>>({});

  const { data: roster = [], isLoading: loadingRoster } = useQuery<any[]>({
    queryKey: ['teacher-att-roster', selectedId],
    queryFn: () => attendanceApi.getSectionStudents(selectedId as number),
    enabled: !!selectedId,
  });

  const { data: existing = [] } = useQuery<any[]>({
    queryKey: ['teacher-att-existing', selectedId, date],
    queryFn: () => attendanceApi.getBySection(selectedId as number, date),
    enabled: !!selectedId && !!date,
  });

  // Seed per-student status from existing marks only — leave unmarked students blank
  // so nothing is auto-selected until the teacher actually picks a status.
  useEffect(() => {
    if (!roster.length) return;
    const seeded: Record<number, Status> = {};
    (existing ?? []).forEach((a: any) => { if (a.studentId) seeded[a.studentId] = a.status; });
    setMarks(seeded);
  }, [roster, existing]);

  const saveMutation = useMutation({
    mutationFn: () => teacherApi.markAttendance({
      sectionId: selectedId,
      attendanceDate: date,
      // Only submit students the teacher actually marked.
      entries: roster.filter((s) => marks[s.id]).map((s) => ({ studentId: s.id, status: marks[s.id] })),
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teacher-att-existing', selectedId, date] });
      enqueueSnackbar('Attendance saved', { variant: 'success' });
    },
    onError: (e: any) => enqueueSnackbar(e?.response?.data?.message ?? 'Failed to save attendance', { variant: 'error' }),
  });

  const markedCount = roster.filter((s) => marks[s.id]).length;

  const setAll = (status: Status) => {
    const all: Record<number, Status> = {};
    roster.forEach((s) => { all[s.id] = status; });
    setMarks(all);
  };

  const counts = STATUSES.reduce((acc, st) => {
    acc[st] = roster.filter((s) => marks[s.id] === st).length;
    return acc;
  }, {} as Record<Status, number>);

  const alreadyMarked = (existing ?? []).length > 0;

  return (
    <Box>
      <PageHeader
        title="Student Attendance"
        subtitle="Mark, review and correct attendance for the students in your class"
        crumbs={[{ label: 'Dashboard', path: '/' }, { label: 'Student Attendance' }]}
      />

      {isLoading ? (
        <Box sx={{ textAlign: 'center', py: 6 }}><CircularProgress /></Box>
      ) : hasNone ? (
        <Card><EmptyState title="No class assigned" description="You are not set as class teacher of any section yet." icon={<FactCheck sx={{ fontSize: 64 }} />} /></Card>
      ) : (
        <>
          <Card sx={{ p: 2, mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              <ClassSectionPicker sections={sections} selectedId={selectedId} onChange={setSelectedId} />
              <TextField
                type="date" label="Date" size="small" value={date}
                onChange={(e) => setDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                inputProps={{ max: new Date().toISOString().slice(0, 10) }}
              />
              {alreadyMarked && <Chip size="small" color="info" label="Already marked — editing will correct it" />}
            </Box>
          </Card>

          {loadingRoster ? (
            <Box sx={{ textAlign: 'center', py: 6 }}><CircularProgress /></Box>
          ) : roster.length === 0 ? (
            <Card><EmptyState title="No students" description="This section has no enrolled students." /></Card>
          ) : (
            <>
              <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                <Button size="small" startIcon={<DoneAll />} variant="outlined" onClick={() => setAll('PRESENT')}>
                  Mark all present
                </Button>
                {STATUSES.map((st) => (
                  <Chip key={st} size="small" label={`${st.replace('_', ' ')}: ${counts[st]}`}
                    sx={{ bgcolor: `${STATUS_COLOR[st]}18`, color: STATUS_COLOR[st], fontWeight: 600 }} />
                ))}
              </Stack>

              <Card sx={{ mb: 3 }}>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Roll</TableCell>
                        <TableCell>Student</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {roster.map((s) => (
                        <TableRow key={s.id} hover>
                          <TableCell>{s.rollNumber ? `#${s.rollNumber}` : '—'}</TableCell>
                          <TableCell><Typography variant="body2" fontWeight={600}>{s.firstName} {s.lastName}</Typography></TableCell>
                          <TableCell>
                            <ToggleButtonGroup
                              exclusive size="small"
                              value={marks[s.id] ?? null}
                              onChange={(_, v) => { if (v) setMarks((m) => ({ ...m, [s.id]: v })); }}
                            >
                              {STATUSES.map((st) => (
                                <ToggleButton key={st} value={st}
                                  sx={{ px: 1.25, '&.Mui-selected': { bgcolor: `${STATUS_COLOR[st]}22`, color: STATUS_COLOR[st], fontWeight: 700 } }}>
                                  {st.charAt(0) + st.slice(1).toLowerCase()}
                                </ToggleButton>
                              ))}
                            </ToggleButtonGroup>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Card>

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 2 }}>
                {markedCount < roster.length && (
                  <Typography variant="caption" color="text.secondary">
                    {roster.length - markedCount} of {roster.length} not marked yet
                  </Typography>
                )}
                <Button variant="contained" disabled={saveMutation.isPending || markedCount === 0}
                  onClick={() => saveMutation.mutate()}>
                  {saveMutation.isPending ? 'Saving…' : alreadyMarked ? 'Update Attendance' : 'Save Attendance'}
                </Button>
              </Box>
            </>
          )}
        </>
      )}
    </Box>
  );
}
