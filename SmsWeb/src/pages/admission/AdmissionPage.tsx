import {
  Box, Button, Card, Chip, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Avatar, TextField, InputAdornment, MenuItem,
  CircularProgress, Tooltip, IconButton, Stack, Typography,
  TablePagination,
} from '@mui/material';
import {
  Search, Add, Visibility, Edit, PersonAdd,
  CheckCircle, HourglassEmpty, School, TransferWithinAStation,
  Block, EmojiEvents, WorkspacePremium,
} from '@mui/icons-material';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { admissionApi } from '@/api/admission.api';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { fmtDate, initials } from '@/utils/formatters';
import { useAuth } from '@/hooks/useAuth';
import AdmissionWizard from './AdmissionWizard';
import StudentDetailDrawer from './StudentDetailDrawer';

import { statusGroupOf, STATUS_LABEL, STATUS_COLOR, STATUS_FILTERS } from '@/utils/studentStatus';

export default function AdmissionPage() {
  const qc = useQueryClient();
  const { isSchoolAdmin } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(0);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [dropoutId, setDropoutId] = useState<number | null>(null);
  const [passId, setPassId] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admission-students', statusFilter, search, page],
    queryFn: () => admissionApi.list({
      statusGroup: statusFilter === 'ALL' ? undefined : statusFilter,
      search: search || undefined,
      page,
      size: 20,
    }),
    staleTime: 30_000,
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['admission-students'] });
    qc.invalidateQueries({ queryKey: ['student-count'] });
  };

  const dropoutMutation = useMutation({
    mutationFn: (id: number) => admissionApi.deactivate(id, 'Student left school'),
    onSuccess: () => { refresh(); setDropoutId(null); enqueueSnackbar('Student deactivated — roll number is now free', { variant: 'success' }); },
    onError: (e: any) => { setDropoutId(null); enqueueSnackbar(e?.response?.data?.message ?? 'Failed to deactivate', { variant: 'error' }); },
  });

  const passoutMutation = useMutation({
    mutationFn: (id: number) => admissionApi.passout(id, 'Marked passed out'),
    onSuccess: () => { refresh(); setPassId(null); enqueueSnackbar('Marked as passed out', { variant: 'success' }); },
    onError: (e: any) => { setPassId(null); enqueueSnackbar(e?.response?.data?.message ?? 'Failed to mark passed out', { variant: 'error' }); },
  });

  const students: any[] = data?.content ?? [];
  const total: number = data?.totalElements ?? 0;

  return (
    <Box>
      <PageHeader
        title="Admission & Registration"
        subtitle={`${total} students across all lifecycle stages`}
        crumbs={[{ label: 'Dashboard', path: '/' }, { label: 'Admission' }]}
        action={
          isSchoolAdmin() && (
            <Button variant="contained" startIcon={<PersonAdd />} onClick={() => setWizardOpen(true)}>
              New Admission
            </Button>
          )
        }
      />

      {/* Status filter chips */}
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
        {STATUS_FILTERS.map((s) => (
          <Chip
            key={s.v}
            label={s.label}
            variant={statusFilter === s.v ? 'filled' : 'outlined'}
            color={statusFilter === s.v ? 'primary' : 'default'}
            size="small"
            onClick={() => { setStatusFilter(s.v); setPage(0); }}
            sx={{ cursor: 'pointer' }}
          />
        ))}
      </Stack>

      <Card>
        <Box sx={{ p: 2, borderBottom: '1px solid #EBEBEB' }}>
          <TextField
            size="small"
            placeholder="Search by name, admission no, mobile..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            sx={{ width: 360 }}
            InputProps={{
              startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment>,
            }}
          />
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Student</TableCell>
                <TableCell>Admission No.</TableCell>
                <TableCell>Class / Program</TableCell>
                <TableCell>Mobile</TableCell>
                <TableCell>Admission Date</TableCell>
                <TableCell>Lifecycle</TableCell>
                <TableCell>Docs</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6 }}><CircularProgress /></TableCell>
                </TableRow>
              ) : students.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8}>
                    <EmptyState
                      title="No students found"
                      description='Click "New Admission" to register the first student.'
                    />
                  </TableCell>
                </TableRow>
              ) : (
                students.map((s: any) => (
                  <TableRow key={s.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar src={s.profilePhotoUrl} sx={{ width: 36, height: 36, bgcolor: 'primary.main', fontSize: 13 }}>
                          {initials(s.firstName ?? '', s.lastName ?? '')}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={600}>{s.fullName}</Typography>
                          <Typography variant="caption" color="text.secondary">{s.studentCode}</Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600, color: 'primary.main' }}>
                      {s.admissionNumber ?? '—'}
                    </TableCell>
                    <TableCell>
                      {s.academic?.className
                        ? `${s.academic.className} ${s.academic.sectionName ?? ''}`
                        : s.academic?.program ?? s.academic?.batchName ?? '—'}
                    </TableCell>
                    <TableCell>{s.mobile ?? '—'}</TableCell>
                    <TableCell>{fmtDate(s.admissionDate)}</TableCell>
                    <TableCell>
                      <Chip
                        label={STATUS_LABEL[statusGroupOf(s.lifecycleStatus)]}
                        size="small"
                        color={STATUS_COLOR[statusGroupOf(s.lifecycleStatus)]}
                      />
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.5}>
                        <Chip
                          icon={<CheckCircle sx={{ fontSize: '12px !important' }} />}
                          label={s.verifiedDocuments}
                          size="small"
                          color="success"
                          variant="outlined"
                          sx={{ height: 20, fontSize: 11 }}
                        />
                        {s.pendingDocuments > 0 && (
                          <Chip
                            icon={<HourglassEmpty sx={{ fontSize: '12px !important' }} />}
                            label={s.pendingDocuments}
                            size="small"
                            color="warning"
                            variant="outlined"
                            sx={{ height: 20, fontSize: 11 }}
                          />
                        )}
                      </Stack>
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 0.25, flexWrap: 'nowrap' }}>
                        <Tooltip title="View Details">
                          <IconButton size="small" onClick={() => setSelectedStudent(s)}>
                            <Visibility fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {isSchoolAdmin() && statusGroupOf(s.lifecycleStatus) === 'ADMITTED' && (
                          <Tooltip title="Mark Passed Out">
                            <IconButton size="small" color="secondary" onClick={() => setPassId(s.id)}>
                              <WorkspacePremium fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        {isSchoolAdmin() && statusGroupOf(s.lifecycleStatus) !== 'DEACTIVATED' && (
                          <Tooltip title="Deactivate (left school)">
                            <IconButton size="small" color="error" onClick={() => setDropoutId(s.id)}>
                              <Block fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {total > 20 && (
          <TablePagination
            component="div"
            count={total}
            page={page}
            rowsPerPage={20}
            rowsPerPageOptions={[20]}
            onPageChange={(_, p) => setPage(p)}
          />
        )}
      </Card>

      {/* Registration Wizard */}
      <AdmissionWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onSuccess={() => {
          setWizardOpen(false);
          qc.invalidateQueries({ queryKey: ['admission-students'] });
        }}
      />

      {/* Student detail drawer */}
      {selectedStudent && (
        <StudentDetailDrawer
          studentId={selectedStudent.id}
          onClose={() => setSelectedStudent(null)}
          onRefresh={() => qc.invalidateQueries({ queryKey: ['admission-students'] })}
        />
      )}

      <ConfirmDialog
        open={dropoutId !== null}
        title="Deactivate Student"
        message="Mark this student as left school? Their records and history are preserved, and their roll number is freed for another student."
        confirmLabel="Deactivate"
        onConfirm={() => dropoutId && dropoutMutation.mutate(dropoutId)}
        onCancel={() => setDropoutId(null)}
        loading={dropoutMutation.isPending}
      />

      <ConfirmDialog
        open={passId !== null}
        title="Mark Passed Out"
        message="Mark this student as passed out? They move to the Passed Out list and their records are kept."
        confirmLabel="Mark Passed Out"
        onConfirm={() => passId && passoutMutation.mutate(passId)}
        onCancel={() => setPassId(null)}
        loading={passoutMutation.isPending}
      />
    </Box>
  );
}
