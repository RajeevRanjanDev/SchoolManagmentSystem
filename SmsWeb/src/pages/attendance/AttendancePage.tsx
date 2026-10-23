import {
  Box, Card, Grid, Typography, TextField, MenuItem, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  ToggleButton, ToggleButtonGroup, Avatar, CircularProgress, Alert,
  Chip,
} from '@mui/material';
import { CheckCircle, Cancel, AccessTime, Today, PersonSearch } from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { attendanceApi } from '@/api/attendance.api';
import { sectionsApi } from '@/api/admin.api';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { initials } from '@/utils/formatters';
import type { AttendanceStatus } from '@/types/academic.types';

export default function AttendancePage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [selectedSection, setSelectedSection] = useState<number | ''>('');
  const [date, setDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [records, setRecords] = useState<Record<number, AttendanceStatus>>({});
  const [saved, setSaved] = useState(false);

  const { data: sections = [] } = useQuery<any[]>({
    queryKey: ['sections-all'],
    queryFn: () => sectionsApi.listAll(),
    staleTime: 300_000,
  });

  const { data: existing = [], isLoading: loadingExisting } = useQuery<any[]>({
    queryKey: ['attendance', selectedSection, date],
    queryFn: () => attendanceApi.getBySection(selectedSection as number, date),
    enabled: !!selectedSection,
  });

  const { data: students, isLoading: loadingStudents } = useQuery<any[]>({
    queryKey: ['students-section', selectedSection],
    queryFn: () => attendanceApi.getSectionStudents(selectedSection as number),
    enabled: !!selectedSection,
  });

  // Seed the editor from already-marked attendance only — leave unmarked students
  // blank so nothing is auto-selected until someone explicitly picks a status.
  useEffect(() => {
    if (!students) return;
    const map: Record<number, AttendanceStatus> = {};
    (existing ?? []).forEach((r: any) => { if (r.studentId) map[r.studentId] = r.status; });
    setRecords(map);
  }, [students, existing]);

  const alreadyMarked = (existing?.length ?? 0) > 0;
  const markedCount = (students ?? []).filter((s: any) => records[s.id]).length;

  const markMutation = useMutation({
    mutationFn: attendanceApi.markAttendance,
    onSuccess: () => {
      setSaved(true);
      qc.invalidateQueries({ queryKey: ['attendance', selectedSection, date] });
      setTimeout(() => setSaved(false), 3000);
    },
  });

  const setAll = (status: AttendanceStatus) => {
    if (!students) return;
    const map: Record<number, AttendanceStatus> = {};
    students.forEach((s: any) => { map[s.id] = status; });
    setRecords(map);
  };

  const handleSave = () => {
    if (!selectedSection || !students) return;
    markMutation.mutate({
      sectionId: selectedSection as number,
      attendanceDate: date,
      // Only submit students that were actually marked.
      records: students.filter((s: any) => records[s.id]).map((s: any) => ({ studentId: s.id, status: records[s.id] })),
    });
  };

  const STATUS_OPTIONS: { value: AttendanceStatus; label: string; color: string }[] = [
    { value: 'PRESENT', label: 'P', color: '#388E3C' },
    { value: 'ABSENT', label: 'A', color: '#E53935' },
    { value: 'LEAVE', label: 'L', color: '#0277BD' },
  ];

  const summary = students
    ? {
        present: Object.values(records).filter((s) => s === 'PRESENT').length,
        absent: Object.values(records).filter((s) => s === 'ABSENT').length,
        leave: Object.values(records).filter((s) => s === 'LEAVE').length,
      }
    : null;

  return (
    <Box>
      <PageHeader
        title="Attendance"
        subtitle="Mark and manage daily student attendance"
        crumbs={[{ label: 'Dashboard', path: '/' }, { label: 'Attendance' }]}
        action={
          <Button variant="outlined" startIcon={<PersonSearch />} onClick={() => navigate('/attendance/student')}>
            Student Attendance
          </Button>
        }
      />

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <TextField
            select
            label="Select Class / Section"
            fullWidth
            value={selectedSection}
            onChange={(e) => setSelectedSection(Number(e.target.value))}
          >
            {sections.map((s) => (
              <MenuItem key={s.id} value={s.id}>{s.className} — {s.name}</MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={3}>
          <TextField
            label="Date"
            type="date"
            fullWidth
            value={date}
            onChange={(e) => setDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            InputProps={{ startAdornment: <Today sx={{ color: 'text.secondary', mr: 1 }} /> }}
          />
        </Grid>
        {students && (
          <Grid item xs={12} sm={5} sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Typography variant="body2" color="text.secondary">Mark all:</Typography>
            <Button size="small" variant="outlined" color="success" onClick={() => setAll('PRESENT')}>All Present</Button>
            <Button size="small" variant="outlined" color="error" onClick={() => setAll('ABSENT')}>All Absent</Button>
          </Grid>
        )}
      </Grid>

      {summary && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[
            { label: 'Present', count: summary.present, icon: <CheckCircle />, color: '#388E3C' },
            { label: 'Absent', count: summary.absent, icon: <Cancel />, color: '#E53935' },
            { label: 'Leave', count: summary.leave, icon: <AccessTime />, color: '#0277BD' },
          ].map((s) => (
            <Grid item xs={4} key={s.label}>
              <Card sx={{ bgcolor: `${s.color}0D` }}>
                <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box sx={{ color: s.color }}>{s.icon}</Box>
                  <Box>
                    <Typography variant="h5" fontWeight={700} sx={{ color: s.color }}>{s.count}</Typography>
                    <Typography variant="caption" color="text.secondary">{s.label}</Typography>
                  </Box>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {saved && <Alert severity="success" sx={{ mb: 2 }}>Attendance saved successfully!</Alert>}

      {!selectedSection ? (
        <Card><EmptyState title="Select a section" description="Choose a class section and date to mark attendance." /></Card>
      ) : loadingStudents ? (
        <Box sx={{ textAlign: 'center', py: 6 }}><CircularProgress /></Box>
      ) : (
        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Student</TableCell>
                  <TableCell>Admission No.</TableCell>
                  <TableCell>Attendance</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(students ?? []).map((s: any) => (
                  <TableRow key={s.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: 12 }}>
                          {initials(s.firstName, s.lastName)}
                        </Avatar>
                        <Typography variant="body2" fontWeight={500}>{s.firstName} {s.lastName}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', color: 'primary.main', fontWeight: 600 }}>{s.admissionNumber}</TableCell>
                    <TableCell>
                      <ToggleButtonGroup
                        exclusive
                        size="small"
                        value={records[s.id] ?? null}
                        onChange={(_, v) => v && setRecords((prev) => ({ ...prev, [s.id]: v }))}
                      >
                        {STATUS_OPTIONS.map((opt) => (
                          <ToggleButton
                            key={opt.value}
                            value={opt.value}
                            sx={{
                              px: 1.5,
                              fontWeight: 700,
                              fontSize: '0.75rem',
                              '&.Mui-selected': { bgcolor: opt.color, color: '#fff', '&:hover': { bgcolor: opt.color } },
                            }}
                          >
                            {opt.label}
                          </ToggleButton>
                        ))}
                      </ToggleButtonGroup>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ p: 2, borderTop: '1px solid #EBEBEB', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1.5 }}>
            {alreadyMarked && (
              <Typography variant="caption" color="success.main">Already marked — editing will update it</Typography>
            )}
            {markedCount < (students?.length ?? 0) && (
              <Typography variant="caption" color="text.secondary">
                {(students?.length ?? 0) - markedCount} of {students?.length} not marked yet
              </Typography>
            )}
            <Button
              variant="contained"
              size="large"
              onClick={handleSave}
              disabled={markMutation.isPending || markedCount === 0}
            >
              {markMutation.isPending ? 'Saving...' : alreadyMarked ? 'Update Attendance' : 'Save Attendance'}
            </Button>
          </Box>
        </Card>
      )}
    </Box>
  );
}
