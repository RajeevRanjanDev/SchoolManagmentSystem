import {
  Box, Button, Card, TextField, InputAdornment, Avatar, IconButton, Chip,
  CircularProgress, Typography, Menu, MenuItem, ListItemIcon, Divider,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination,
  ToggleButtonGroup, ToggleButton, Tooltip, FormControl, InputLabel, Select,
  Dialog, DialogTitle, DialogContent, DialogActions, Alert,
} from '@mui/material';
import {
  Search, PersonAdd, UploadFile, MoreVert, Visibility, Block,
  DeleteOutline, Groups2, School, HowToReg, PersonOff, SwapHoriz, Tag, ArrowCircleUp,
  WorkspacePremium,
} from '@mui/icons-material';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { admissionApi } from '@/api/admission.api';
import { classesApi, sectionsApi } from '@/api/admin.api';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { fmtDate, initials } from '@/utils/formatters';
import { useAuth } from '@/hooks/useAuth';
import { brand } from '@/theme/theme';
import { statusGroupOf, STATUS_LABEL, STATUS_COLOR, STATUS_FILTERS, type StatusFilterValue } from '@/utils/studentStatus';
import AdmissionWizard from '../admission/AdmissionWizard';
import StudentDetailDrawer from '../admission/StudentDetailDrawer';
import StudentImportDialog from './StudentImportDialog';

function StatTile({ icon, label, value, color }: { icon: React.ReactNode; label: string; value?: number; color: string }) {
  return (
    <Card sx={{ flex: 1, minWidth: 150, p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
      <Box sx={{ width: 44, height: 44, borderRadius: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', background: `linear-gradient(135deg, ${color} 0%, ${color}CC 100%)`, boxShadow: `0 6px 14px ${color}33` }}>
        {icon}
      </Box>
      <Box>
        <Typography variant="h5" fontWeight={800} lineHeight={1}>{value ?? '—'}</Typography>
        <Typography variant="caption" color="text.secondary" fontWeight={600}>{label}</Typography>
      </Box>
    </Card>
  );
}

export default function StudentsPage() {
  const qc = useQueryClient();
  const { isSchoolAdmin } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const admin = isSchoolAdmin();

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilterValue>('ALL');
  const [classFilter, setClassFilter] = useState<number | ''>('');
  const [sectionFilter, setSectionFilter] = useState<number | ''>('');
  const [page, setPage] = useState(0);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [detailId, setDetailId] = useState<number | null>(null);
  const [menu, setMenu] = useState<{ el: HTMLElement; s: any } | null>(null);
  const [dropTarget, setDropTarget] = useState<any | null>(null);
  const [passTarget, setPassTarget] = useState<any | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [moveTarget, setMoveTarget] = useState<any | null>(null);
  const [moveSectionId, setMoveSectionId] = useState<number | ''>('');
  const [rollTarget, setRollTarget] = useState<any | null>(null);
  const [rollValue, setRollValue] = useState('');
  const [promoteOpen, setPromoteOpen] = useState(false);
  const [promoteForm, setPromoteForm] = useState<{ fromClassId: number | ''; toClassId: number | ''; fromYear: string; toYear: string }>(
    { fromClassId: '', toClassId: '', fromYear: '2024-2025', toYear: '2025-2026' });

  const { data, isLoading } = useQuery({
    queryKey: ['admission-students', status, search, classFilter, sectionFilter, page],
    queryFn: () => admissionApi.list({
      statusGroup: status === 'ALL' ? undefined : status,
      search: search || undefined,
      classId: classFilter || undefined,
      sectionId: sectionFilter || undefined,
      page, size: 20,
    }),
    staleTime: 20_000,
  });

  const { data: classes = [] } = useQuery<any[]>({ queryKey: ['classes'], queryFn: () => classesApi.list(), staleTime: 60_000 });
  const { data: sections = [] } = useQuery<any[]>({ queryKey: ['sections-all'], queryFn: () => sectionsApi.listAll(), staleTime: 60_000 });
  const sectionsForClass = sections.filter((s) => classFilter === '' || s.classId === classFilter);

  // Accurate status counts (small size=1 queries read totalElements)
  const selectTotal = (d: any) => d?.totalElements ?? 0;
  const { data: total } = useQuery({ queryKey: ['student-count', 'all'], queryFn: () => admissionApi.list({ size: 1 }), staleTime: 60_000, select: selectTotal });
  const { data: admitted } = useQuery({ queryKey: ['student-count', 'ADMITTED'], queryFn: () => admissionApi.list({ statusGroup: 'ADMITTED', size: 1 }), staleTime: 60_000, select: selectTotal });
  const { data: passedOut } = useQuery({ queryKey: ['student-count', 'PASSED_OUT'], queryFn: () => admissionApi.list({ statusGroup: 'PASSED_OUT', size: 1 }), staleTime: 60_000, select: selectTotal });
  const { data: deactivated } = useQuery({ queryKey: ['student-count', 'DEACTIVATED'], queryFn: () => admissionApi.list({ statusGroup: 'DEACTIVATED', size: 1 }), staleTime: 60_000, select: selectTotal });

  const dropMutation = useMutation({
    mutationFn: (id: number) => admissionApi.deactivate(id, 'Student left school'),
    onSuccess: () => {
      refresh();
      setDropTarget(null);
      enqueueSnackbar('Student deactivated — roll number is now free', { variant: 'success' });
    },
    onError: (e: any) => { setDropTarget(null); enqueueSnackbar(e?.response?.data?.message ?? 'Failed to deactivate', { variant: 'error' }); },
  });

  const passoutMutation = useMutation({
    mutationFn: (id: number) => admissionApi.passout(id, 'Marked passed out'),
    onSuccess: () => { refresh(); setPassTarget(null); enqueueSnackbar('Marked as passed out', { variant: 'success' }); },
    onError: (e: any) => { setPassTarget(null); enqueueSnackbar(e?.response?.data?.message ?? 'Failed to mark passed out', { variant: 'error' }); },
  });

  const moveMutation = useMutation({
    mutationFn: () => admissionApi.moveToSection(moveTarget.id, moveSectionId as number),
    onSuccess: () => { refresh(); setMoveTarget(null); setMoveSectionId(''); enqueueSnackbar('Student moved', { variant: 'success' }); },
    onError: (e: any) => enqueueSnackbar(e?.response?.data?.message ?? 'Failed to move student', { variant: 'error' }),
  });

  const rollMutation = useMutation({
    mutationFn: () => admissionApi.assignRollNumber(rollTarget.id, rollValue.trim()),
    onSuccess: () => { refresh(); setRollTarget(null); setRollValue(''); enqueueSnackbar('Roll number assigned', { variant: 'success' }); },
    onError: (e: any) => enqueueSnackbar(e?.response?.data?.message ?? 'Failed to assign roll number', { variant: 'error' }),
  });

  const promoteMutation = useMutation({
    mutationFn: () => admissionApi.promoteClass({
      fromClassId: promoteForm.fromClassId as number,
      toClassId: promoteForm.toClassId as number,
      fromAcademicYear: promoteForm.fromYear.trim(),
      toAcademicYear: promoteForm.toYear.trim(),
    }),
    onSuccess: (res: any) => {
      refresh();
      setPromoteOpen(false);
      enqueueSnackbar(res?.message ?? 'Students promoted', { variant: res?.data?.promoted > 0 ? 'success' : 'warning' });
    },
    onError: (e: any) => enqueueSnackbar(e?.response?.data?.message ?? 'Promotion failed', { variant: 'error' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => admissionApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admission-students'] });
      qc.invalidateQueries({ queryKey: ['student-count'] });
      setDeleteTarget(null);
      enqueueSnackbar('Student deleted', { variant: 'success' });
    },
    onError: (e: any) => { setDeleteTarget(null); enqueueSnackbar(e?.response?.data?.message ?? 'Cannot delete — try deactivating instead', { variant: 'error' }); },
  });

  const rawStudents: any[] = data?.content ?? [];
  // When viewing a single section, sort by roll number (numeric, blanks last).
  const rollNum = (s: any) => {
    const n = parseInt(s.academic?.rollNumber, 10);
    return Number.isNaN(n) ? Number.MAX_SAFE_INTEGER : n;
  };
  const students = sectionFilter ? [...rawStudents].sort((a, b) => rollNum(a) - rollNum(b)) : rawStudents;
  const totalElements: number = data?.totalElements ?? 0;

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['admission-students'] });
    qc.invalidateQueries({ queryKey: ['student-count'] });
  };

  return (
    <Box>
      <PageHeader
        title="Students"
        subtitle="Manage student records, enrolment and family links"
        crumbs={[{ label: 'Dashboard', path: '/' }, { label: 'Students' }]}
        action={admin && (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="outlined" startIcon={<ArrowCircleUp />} onClick={() => { setPromoteForm({ fromClassId: '', toClassId: '', fromYear: '2024-2025', toYear: '2025-2026' }); setPromoteOpen(true); }}>Promote Class</Button>
            <Button variant="outlined" startIcon={<UploadFile />} onClick={() => setImportOpen(true)}>Import</Button>
            <Button variant="contained" startIcon={<PersonAdd />} onClick={() => setWizardOpen(true)}>Register Student</Button>
          </Box>
        )}
      />

      {/* Summary */}
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
        <StatTile icon={<Groups2 />} label="Total Students" value={total} color="#0C831F" />
        <StatTile icon={<School />} label="Admitted" value={admitted} color="#2E6FF2" />
        <StatTile icon={<HowToReg />} label="Passed Out" value={passedOut} color="#FF8A00" />
        <StatTile icon={<PersonOff />} label="Deactivated" value={deactivated} color="#7C3AED" />
      </Box>

      {/* Toolbar */}
      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center', mb: 2.5 }}>
        <TextField
          size="small" placeholder="Search by name, admission no or mobile…"
          value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          sx={{ flex: 1, minWidth: 280, '& .MuiOutlinedInput-root': { bgcolor: '#fff' } }}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }}
        />
        <FormControl size="small" sx={{ minWidth: 150, bgcolor: '#fff', borderRadius: 2 }}>
          <InputLabel>Class</InputLabel>
          <Select label="Class" value={classFilter}
            onChange={(e) => { const v = e.target.value === '' ? '' : Number(e.target.value); setClassFilter(v); setSectionFilter(''); setPage(0); }}>
            <MenuItem value="">All classes</MenuItem>
            {classes.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 140, bgcolor: '#fff', borderRadius: 2 }} disabled={classFilter === ''}>
          <InputLabel>Section</InputLabel>
          <Select label="Section" value={sectionFilter}
            onChange={(e) => { setSectionFilter(e.target.value === '' ? '' : Number(e.target.value)); setPage(0); }}>
            <MenuItem value="">All sections</MenuItem>
            {sectionsForClass.map((s) => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
          </Select>
        </FormControl>
        <ToggleButtonGroup
          exclusive size="small" value={status}
          onChange={(_e, v) => { if (v) { setStatus(v); setPage(0); } }}
          sx={{ bgcolor: '#fff', borderRadius: 3, flexWrap: 'wrap', '& .MuiToggleButton-root': { border: 'none', px: 2, borderRadius: '10px !important', fontWeight: 600, textTransform: 'none' }, '& .Mui-selected': { bgcolor: `${brand.greenSoft} !important`, color: `${brand.green} !important` } }}
        >
          {STATUS_FILTERS.map((f) => <ToggleButton key={f.v} value={f.v}>{f.label}</ToggleButton>)}
        </ToggleButtonGroup>
      </Box>

      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Student</TableCell>
                <TableCell>Admission No.</TableCell>
                <TableCell>Class / Section</TableCell>
                <TableCell>Mobile</TableCell>
                <TableCell>Admitted</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 6 }}><CircularProgress /></TableCell></TableRow>
              ) : students.length === 0 ? (
                <TableRow><TableCell colSpan={7}><EmptyState title="No students found" description={search ? 'Try a different search.' : 'Register a student or import from CSV to get started.'} /></TableCell></TableRow>
              ) : (
                students.map((s: any) => (
                  <TableRow key={s.id} hover sx={{ cursor: 'pointer' }} onClick={() => setDetailId(s.id)}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar src={s.profilePhotoUrl} sx={{ width: 40, height: 40, bgcolor: 'primary.main', fontSize: 14 }}>
                          {initials(s.firstName ?? '', s.lastName ?? '')}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={700}>{s.fullName}</Typography>
                          <Typography variant="caption" color="text.secondary">{s.studentCode}</Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600, color: 'primary.main' }}>{s.admissionNumber ?? '—'}</TableCell>
                    <TableCell>
                      {s.academic?.className
                        ? <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                            <Chip size="small" label={`${s.academic.className}${s.academic.sectionName ? '-' + s.academic.sectionName : ''}`} sx={{ fontWeight: 600 }} />
                            {s.academic?.rollNumber
                              ? <Typography variant="caption" color="text.secondary" fontWeight={600}>Roll {s.academic.rollNumber}</Typography>
                              : <Typography variant="caption" color="warning.main">no roll</Typography>}
                          </Box>
                        : <Chip size="small" label="Not enrolled" color="warning" variant="outlined" />}
                    </TableCell>
                    <TableCell>{s.mobile ?? '—'}</TableCell>
                    <TableCell>{fmtDate(s.admissionDate)}</TableCell>
                    <TableCell><Chip size="small" label={STATUS_LABEL[statusGroupOf(s.lifecycleStatus)]} color={STATUS_COLOR[statusGroupOf(s.lifecycleStatus)]} /></TableCell>
                    <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 0.25 }}>
                        <Tooltip title="View details">
                          <IconButton size="small" onClick={() => setDetailId(s.id)}><Visibility fontSize="small" /></IconButton>
                        </Tooltip>
                        {admin && (
                          <IconButton size="small" onClick={(e) => setMenu({ el: e.currentTarget, s })}><MoreVert fontSize="small" /></IconButton>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {totalElements > 20 && (
          <TablePagination
            component="div" count={totalElements} page={page} rowsPerPage={20}
            rowsPerPageOptions={[20]} onPageChange={(_, p) => setPage(p)}
          />
        )}
      </Card>

      {/* Row menu */}
      <Menu anchorEl={menu?.el} open={Boolean(menu)} onClose={() => setMenu(null)} PaperProps={{ sx: { borderRadius: 2.5, minWidth: 190 } }}>
        <MenuItem onClick={() => { setDetailId(menu!.s.id); setMenu(null); }}>
          <ListItemIcon><Visibility fontSize="small" /></ListItemIcon> View / Edit
        </MenuItem>
        {menu?.s.academic?.classId && (
          <MenuItem onClick={() => { setMoveTarget(menu!.s); setMoveSectionId(''); setMenu(null); }}>
            <ListItemIcon><SwapHoriz fontSize="small" /></ListItemIcon> Move to section
          </MenuItem>
        )}
        {menu?.s.academic?.sectionId && (
          <MenuItem onClick={() => { setRollTarget(menu!.s); setRollValue(menu!.s.academic?.rollNumber ?? ''); setMenu(null); }}>
            <ListItemIcon><Tag fontSize="small" /></ListItemIcon> Set roll number
          </MenuItem>
        )}
        {statusGroupOf(menu?.s.lifecycleStatus) === 'ADMITTED' && (
          <MenuItem onClick={() => { setPassTarget(menu!.s); setMenu(null); }}>
            <ListItemIcon><WorkspacePremium fontSize="small" /></ListItemIcon> Mark passed out
          </MenuItem>
        )}
        {statusGroupOf(menu?.s.lifecycleStatus) !== 'DEACTIVATED' && (
          <MenuItem onClick={() => { setDropTarget(menu!.s); setMenu(null); }}>
            <ListItemIcon><Block fontSize="small" /></ListItemIcon> Deactivate (left school)
          </MenuItem>
        )}
        <Divider />
        <MenuItem sx={{ color: 'error.main' }} onClick={() => { setDeleteTarget(menu!.s); setMenu(null); }}>
          <ListItemIcon><DeleteOutline fontSize="small" sx={{ color: 'error.main' }} /></ListItemIcon> Delete
        </MenuItem>
      </Menu>

      {/* Register wizard */}
      <AdmissionWizard open={wizardOpen} onClose={() => setWizardOpen(false)} onSuccess={() => { setWizardOpen(false); refresh(); }} />

      {/* CSV import */}
      <StudentImportDialog open={importOpen} onClose={() => setImportOpen(false)} onImported={refresh} />

      {/* Detail drawer */}
      {detailId !== null && (
        <StudentDetailDrawer studentId={detailId} onClose={() => setDetailId(null)} onRefresh={refresh} />
      )}

      <ConfirmDialog
        open={dropTarget !== null}
        title="Deactivate Student"
        message={`Mark ${dropTarget?.fullName ?? 'this student'} as left school? Their records and history are preserved, and their roll number is freed for another student.`}
        confirmLabel="Deactivate"
        onConfirm={() => dropTarget && dropMutation.mutate(dropTarget.id)}
        onCancel={() => setDropTarget(null)}
        loading={dropMutation.isPending}
      />

      <ConfirmDialog
        open={passTarget !== null}
        title="Mark Passed Out"
        message={`Mark ${passTarget?.fullName ?? 'this student'} as passed out? They move to the Passed Out list and their records are kept.`}
        confirmLabel="Mark Passed Out"
        onConfirm={() => passTarget && passoutMutation.mutate(passTarget.id)}
        onCancel={() => setPassTarget(null)}
        loading={passoutMutation.isPending}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete Student"
        message={`Permanently delete ${deleteTarget?.fullName ?? 'this student'}? If they have fees or academic history, deletion will be blocked — deactivate instead.`}
        confirmLabel="Delete"
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
        loading={deleteMutation.isPending}
      />

      {/* Move to another section (same class) */}
      <Dialog open={moveTarget !== null} onClose={() => setMoveTarget(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle fontWeight={700}>Move Student</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Move <b>{moveTarget?.fullName}</b> to another section of <b>{moveTarget?.academic?.className}</b>.
            If their roll number is taken there, it will be cleared so you can assign a free one.
          </Typography>
          <FormControl fullWidth>
            <InputLabel>New section</InputLabel>
            <Select label="New section" value={moveSectionId} onChange={(e) => setMoveSectionId(Number(e.target.value))}>
              {sections
                .filter((s) => s.classId === moveTarget?.academic?.classId && s.id !== moveTarget?.academic?.sectionId)
                .map((s) => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setMoveTarget(null)} variant="outlined">Cancel</Button>
          <Button variant="contained" disabled={moveSectionId === '' || moveMutation.isPending} onClick={() => moveMutation.mutate()}>
            {moveMutation.isPending ? 'Moving…' : 'Move'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Assign roll number */}
      <Dialog open={rollTarget !== null} onClose={() => setRollTarget(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle fontWeight={700}>Roll Number</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Assign a roll number for <b>{rollTarget?.fullName}</b> in <b>{rollTarget?.academic?.className}-{rollTarget?.academic?.sectionName}</b>.
            It must be free within this section.
          </Typography>
          <TextField autoFocus fullWidth label="Roll number" value={rollValue}
            onChange={(e) => setRollValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && rollValue.trim()) rollMutation.mutate(); }} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setRollTarget(null)} variant="outlined">Cancel</Button>
          <Button variant="contained" disabled={!rollValue.trim() || rollMutation.isPending} onClick={() => rollMutation.mutate()}>
            {rollMutation.isPending ? 'Saving…' : 'Assign'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Promote whole class */}
      <Dialog open={promoteOpen} onClose={() => setPromoteOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle fontWeight={700}>Promote Class</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2, borderRadius: 3 }}>
            Every active student in the chosen class (all sections) moves to the next class, keeping their section (A→A, B→B) and roll number. Previous records are preserved.
          </Alert>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControl fullWidth>
              <InputLabel>From class</InputLabel>
              <Select label="From class" value={promoteForm.fromClassId}
                onChange={(e) => {
                  const fromId = Number(e.target.value);
                  const from = classes.find((c) => c.id === fromId);
                  const next = classes.find((c) => c.numericName === (from?.numericName ?? 0) + 1);
                  setPromoteForm((f) => ({ ...f, fromClassId: fromId, toClassId: next?.id ?? '' }));
                }}>
                {classes.map((c) => <MenuItem key={c.id} value={c.id}>{c.name} · {c.studentCount ?? 0} students</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>To class (next)</InputLabel>
              <Select label="To class (next)" value={promoteForm.toClassId}
                onChange={(e) => setPromoteForm((f) => ({ ...f, toClassId: Number(e.target.value) }))}>
                {classes.filter((c) => c.id !== promoteForm.fromClassId).map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
              </Select>
            </FormControl>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField fullWidth label="From year" value={promoteForm.fromYear} onChange={(e) => setPromoteForm((f) => ({ ...f, fromYear: e.target.value }))} />
              <TextField fullWidth label="To year" value={promoteForm.toYear} onChange={(e) => setPromoteForm((f) => ({ ...f, toYear: e.target.value }))} />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setPromoteOpen(false)} variant="outlined">Cancel</Button>
          <Button variant="contained" color="success"
            disabled={promoteForm.fromClassId === '' || promoteForm.toClassId === '' || promoteMutation.isPending}
            onClick={() => promoteMutation.mutate()}>
            {promoteMutation.isPending ? 'Promoting…' : 'Promote students'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
