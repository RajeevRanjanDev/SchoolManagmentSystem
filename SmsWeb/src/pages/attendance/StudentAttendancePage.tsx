import {
  Box, Card, Grid, Typography, FormControl, InputLabel, Select, MenuItem,
  TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, Button, CircularProgress,
} from '@mui/material';
import { PictureAsPdf, CheckCircle, Cancel, AccessTime } from '@mui/icons-material';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { attendanceApi } from '@/api/attendance.api';
import { classesApi, sectionsApi } from '@/api/admin.api';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { fmtDate } from '@/utils/formatters';

const STATUS_COLOR: Record<string, any> = {
  PRESENT: 'success', ABSENT: 'error', LATE: 'warning',
  HALF_DAY: 'secondary', LEAVE: 'info', HOLIDAY: 'default',
};

/** Start of the current academic session (April 1, Indian convention). */
function sessionStart() {
  const now = dayjs();
  const y = now.month() >= 3 ? now.year() : now.year() - 1;
  return dayjs(`${y}-04-01`);
}

export default function StudentAttendancePage() {
  const [classId, setClassId] = useState<number | ''>('');
  const [sectionId, setSectionId] = useState<number | ''>('');
  const [studentId, setStudentId] = useState<number | ''>('');
  const [from, setFrom] = useState(sessionStart().format('YYYY-MM-DD'));
  const [to, setTo] = useState(dayjs().format('YYYY-MM-DD'));

  const { data: classes = [] } = useQuery<any[]>({ queryKey: ['classes'], queryFn: () => classesApi.list(), staleTime: 60_000 });
  const { data: sections = [] } = useQuery<any[]>({ queryKey: ['sections-all'], queryFn: () => sectionsApi.listAll(), staleTime: 60_000 });
  const sectionsForClass = sections.filter((s) => s.classId === classId);

  const { data: roster = [] } = useQuery<any[]>({
    queryKey: ['section-roster', sectionId],
    queryFn: () => attendanceApi.getSectionStudents(sectionId as number),
    enabled: !!sectionId,
  });

  const { data: records = [], isLoading } = useQuery<any[]>({
    queryKey: ['student-attendance', studentId, from, to],
    queryFn: () => attendanceApi.getByStudent(studentId as number, from, to),
    enabled: !!studentId,
  });

  const selectedStudent = roster.find((r) => r.id === studentId);

  const sorted = records.slice().sort((a, b) => String(a.attendanceDate).localeCompare(String(b.attendanceDate)));
  const count = (st: string) => records.filter((r) => r.status === st).length;
  const present = count('PRESENT'); const absent = count('ABSENT'); const leave = count('LEAVE');
  const markedDays = present + absent + leave;
  const pct = markedDays > 0 ? Math.round((present / markedDays) * 100) : 0;

  const downloadPdf = () => {
    const name = selectedStudent ? `${selectedStudent.firstName} ${selectedStudent.lastName}` : 'Student';
    const esc = (v: any) => String(v ?? '').replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c] as string));
    const rows = sorted.map((r) => `
      <tr><td>${fmtDate(r.attendanceDate, 'DD MMM YYYY (ddd)')}</td><td>${esc(r.status)}</td><td>${esc(r.remarks)}</td></tr>`).join('');
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Attendance - ${esc(name)}</title>
      <style>body{font-family:Arial,Helvetica,sans-serif;color:#1C1C1C;margin:32px;}h1{font-size:20px;margin:0;}
      h2{font-size:14px;margin:22px 0 8px;}.sub{color:#555;font-size:12px;margin-top:4px;}
      table{width:100%;border-collapse:collapse;font-size:12px;}th,td{border-bottom:1px solid #e5e5e5;padding:7px 8px;text-align:left;}
      th{background:#f4f7f5;text-transform:uppercase;font-size:10px;letter-spacing:.04em;color:#555;}
      .totals{display:flex;gap:16px;margin:12px 0;flex-wrap:wrap;}.tot{border:1px solid #e5e5e5;border-radius:8px;padding:8px 14px;font-size:11px;color:#555;}
      .tot b{display:block;font-size:16px;color:#1C1C1C;}.foot{margin-top:26px;color:#999;font-size:10px;}</style></head><body>
      <h1>Attendance Report</h1>
      <div class="sub"><b>${esc(name)}</b> · ${esc(selectedStudent?.admissionNumber)} · ${fmtDate(from)} to ${fmtDate(to)}</div>
      <div class="totals">
        <div class="tot">Attendance<b>${pct}%</b></div>
        <div class="tot">Present<b>${present}</b></div>
        <div class="tot">Absent<b>${absent}</b></div>
        <div class="tot">Leave<b>${leave}</b></div>
      </div>
      <h2>Day-by-day (${sorted.length})</h2>
      <table><thead><tr><th>Date</th><th>Status</th><th>Remarks</th></tr></thead>
      <tbody>${rows || '<tr><td colspan="3">No records</td></tr>'}</tbody></table>
      <div class="foot">Generated ${new Date().toLocaleString()}</div></body></html>`;
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(html); w.document.close(); w.focus();
    setTimeout(() => w.print(), 300);
  };

  return (
    <Box>
      <PageHeader
        title="Student Attendance"
        subtitle="Day-by-day attendance for a student, with PDF export"
        crumbs={[{ label: 'Dashboard', path: '/' }, { label: 'Attendance', path: '/attendance' }, { label: 'Student' }]}
        action={
          <Button variant="outlined" startIcon={<PictureAsPdf />} disabled={!studentId || records.length === 0} onClick={downloadPdf}>
            Download PDF
          </Button>
        }
      />

      {/* Selectors */}
      <Card sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={3}>
            <FormControl size="small" fullWidth>
              <InputLabel>Class</InputLabel>
              <Select label="Class" value={classId}
                onChange={(e) => { setClassId(Number(e.target.value)); setSectionId(''); setStudentId(''); }}>
                {classes.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={3}>
            <FormControl size="small" fullWidth disabled={classId === ''}>
              <InputLabel>Section</InputLabel>
              <Select label="Section" value={sectionId}
                onChange={(e) => { setSectionId(Number(e.target.value)); setStudentId(''); }}>
                {sectionsForClass.map((s) => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={3}>
            <FormControl size="small" fullWidth disabled={!sectionId}>
              <InputLabel>Student</InputLabel>
              <Select label="Student" value={studentId} onChange={(e) => setStudentId(Number(e.target.value))}>
                {roster.map((r) => (
                  <MenuItem key={r.id} value={r.id}>
                    {r.rollNumber ? `#${r.rollNumber} · ` : ''}{r.firstName} {r.lastName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} sm={1.5}>
            <TextField size="small" label="From" type="date" fullWidth value={from} onChange={(e) => setFrom(e.target.value)} InputLabelProps={{ shrink: true }} />
          </Grid>
          <Grid item xs={6} sm={1.5}>
            <TextField size="small" label="To" type="date" fullWidth value={to} onChange={(e) => setTo(e.target.value)} InputLabelProps={{ shrink: true }} />
          </Grid>
        </Grid>
      </Card>

      {!studentId ? (
        <Card sx={{ py: 2 }}><EmptyState title="Select a student" description="Choose a class, section and student to view their attendance." /></Card>
      ) : isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
      ) : (
        <>
          {/* Summary */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {[
              { label: 'Attendance %', value: `${pct}%`, color: pct >= 75 ? '#0C831F' : '#E23744', icon: <CheckCircle /> },
              { label: 'Present', value: present, color: '#0C831F', icon: <CheckCircle /> },
              { label: 'Absent', value: absent, color: '#E23744', icon: <Cancel /> },
              { label: 'Leave', value: leave, color: '#0277BD', icon: <AccessTime /> },
            ].map((s) => (
              <Grid item xs={6} sm={3} key={s.label}>
                <Card sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box sx={{ color: s.color, display: 'flex' }}>{s.icon}</Box>
                  <Box>
                    <Typography variant="h5" fontWeight={800} sx={{ color: s.color }}>{s.value}</Typography>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>{s.label}</Typography>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
            {selectedStudent ? `${selectedStudent.firstName} ${selectedStudent.lastName}` : 'Student'} · Day-by-day ({sorted.length})
          </Typography>
          <Card>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Day</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Remarks</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sorted.length === 0 ? (
                    <TableRow><TableCell colSpan={4}><EmptyState title="No records" description="No attendance recorded for this student in the selected range." /></TableCell></TableRow>
                  ) : sorted.map((r) => (
                    <TableRow key={r.id ?? r.attendanceDate} hover>
                      <TableCell sx={{ fontWeight: 600 }}>{fmtDate(r.attendanceDate)}</TableCell>
                      <TableCell>{dayjs(r.attendanceDate).format('ddd')}</TableCell>
                      <TableCell><Chip size="small" label={(r.status ?? '').replace('_', ' ')} color={STATUS_COLOR[r.status] ?? 'default'} /></TableCell>
                      <TableCell><Typography variant="caption" color="text.secondary">{r.remarks ?? '—'}</Typography></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </>
      )}
    </Box>
  );
}
