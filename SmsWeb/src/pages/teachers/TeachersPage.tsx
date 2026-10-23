import {
  Box, Button, Card, TextField, InputAdornment, Avatar, IconButton, Chip,
  CircularProgress, Grid, Typography, Menu, MenuItem, ListItemIcon, Tooltip,
  ToggleButtonGroup, ToggleButton, Divider, Select, FormControl, InputLabel,
} from '@mui/material';
import {
  Search, Add, Edit, DeleteOutline, MoreVert, Workspaces,
  PersonOff, CheckCircleOutline, Star, Groups2, LockReset,
} from '@mui/icons-material';
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { teachersApi, ROLE_LABEL, EMPLOYEE_ROLES } from '@/api/teachers.api';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusChip } from '@/components/common/StatusChip';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { EmptyState } from '@/components/common/EmptyState';
import { useAuth } from '@/hooks/useAuth';
import { initials } from '@/utils/formatters';
import { brand } from '@/theme/theme';
import { TeacherFormDialog } from './TeacherFormDialog';
import { AssignmentsDrawer } from './AssignmentsDrawer';

type StatusFilter = 'ALL' | 'ACTIVE' | 'INACTIVE';

function SummaryChip({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <Card sx={{ flex: 1, minWidth: 150, p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
      <Box sx={{ width: 42, height: 42, borderRadius: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', background: `linear-gradient(135deg, ${color} 0%, ${color}CC 100%)`, boxShadow: `0 6px 14px ${color}33` }}>
        {icon}
      </Box>
      <Box>
        <Typography variant="h5" fontWeight={800} lineHeight={1}>{value}</Typography>
        <Typography variant="caption" color="text.secondary" fontWeight={600}>{label}</Typography>
      </Box>
    </Card>
  );
}

export default function TeachersPage() {
  const qc = useQueryClient();
  const { isSchoolAdmin } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const admin = isSchoolAdmin();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [formTeacher, setFormTeacher] = useState<any | null | undefined>(undefined); // undefined=closed, null=create, obj=edit
  const [assignTeacher, setAssignTeacher] = useState<any | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<{ el: HTMLElement; teacher: any } | null>(null);

  const { data = [], isLoading } = useQuery<any[]>({
    queryKey: ['teachers'],
    queryFn: teachersApi.list,
    staleTime: 30_000,
  });

  const deleteMutation = useMutation({
    mutationFn: teachersApi.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teachers'] });
      setDeleteTarget(null);
      enqueueSnackbar('Teacher removed', { variant: 'success' });
    },
    onError: (e: any) => enqueueSnackbar(e?.response?.data?.message ?? 'Failed to remove teacher', { variant: 'error' }),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => teachersApi.updateStatus(id, status),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ['teachers'] });
      enqueueSnackbar(v.status === 'ACTIVE' ? 'Teacher activated' : 'Teacher deactivated', { variant: 'success' });
    },
    onError: (e: any) => enqueueSnackbar(e?.response?.data?.message ?? 'Failed to update status', { variant: 'error' }),
  });

  const resetPwdMutation = useMutation({
    mutationFn: (id: number) => teachersApi.resetPassword(id),
    onSuccess: (msg) => enqueueSnackbar(msg, { variant: 'success' }),
    onError: (e: any) => enqueueSnackbar(e?.response?.data?.message ?? 'Failed to reset password', { variant: 'error' }),
  });

  const stats = useMemo(() => ({
    total: data.length,
    active: data.filter((t) => t.status === 'ACTIVE').length,
    classTeachers: data.filter((t) => (t.assignments ?? []).some((a: any) => a.classTeacher)).length,
  }), [data]);

  const filtered = useMemo(() => data.filter((t) => {
    const name = `${t.firstName ?? ''} ${t.lastName ?? ''}`.toLowerCase();
    const matchesSearch =
      search === '' ||
      name.includes(search.toLowerCase()) ||
      (t.employeeCode ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (t.specialization ?? '').toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
    const matchesRole = roleFilter === 'ALL' || (t.role ?? 'TEACHER') === roleFilter;
    return matchesSearch && matchesStatus && matchesRole;
  }), [data, search, statusFilter, roleFilter]);

  return (
    <Box>
      <PageHeader
        title="Employees"
        subtitle="Manage teachers, finance, transport and other staff"
        crumbs={[{ label: 'Dashboard', path: '/' }, { label: 'Employees' }]}
        action={admin && (
          <Button variant="contained" startIcon={<Add />} onClick={() => setFormTeacher(null)}>
            Add Employee
          </Button>
        )}
      />

      {/* Summary */}
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
        <SummaryChip icon={<Groups2 />} label="Total Teachers" value={stats.total} color="#0C831F" />
        <SummaryChip icon={<CheckCircleOutline />} label="Active" value={stats.active} color="#2E6FF2" />
        <SummaryChip icon={<Star />} label="Class Teachers" value={stats.classTeachers} color="#FF8A00" />
      </Box>

      {/* Toolbar */}
      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center', mb: 2.5 }}>
        <TextField
          size="small"
          placeholder="Search name, code or specialization…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ flex: 1, minWidth: 280, '& .MuiOutlinedInput-root': { bgcolor: '#fff' } }}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }}
        />
        <ToggleButtonGroup
          exclusive
          size="small"
          value={statusFilter}
          onChange={(_e, v) => v && setStatusFilter(v)}
          sx={{ bgcolor: '#fff', borderRadius: 3, '& .MuiToggleButton-root': { border: 'none', px: 2, borderRadius: '10px !important', fontWeight: 600, textTransform: 'none' }, '& .Mui-selected': { bgcolor: `${brand.greenSoft} !important`, color: `${brand.green} !important` } }}
        >
          <ToggleButton value="ALL">All</ToggleButton>
          <ToggleButton value="ACTIVE">Active</ToggleButton>
          <ToggleButton value="INACTIVE">Inactive</ToggleButton>
        </ToggleButtonGroup>
        <FormControl size="small" sx={{ minWidth: 170, bgcolor: '#fff', borderRadius: 2 }}>
          <InputLabel>Role</InputLabel>
          <Select label="Role" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <MenuItem value="ALL">All roles</MenuItem>
            {EMPLOYEE_ROLES.map((r) => <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>)}
          </Select>
        </FormControl>
      </Box>

      {/* Grid */}
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
      ) : filtered.length === 0 ? (
        <Card sx={{ py: 2 }}>
          <EmptyState title="No teachers found" description={search ? 'Try a different search.' : 'Add your first teacher to get started.'} />
        </Card>
      ) : (
        <Grid container spacing={2.5}>
          {filtered.map((t) => {
            const assignments: any[] = t.assignments ?? [];
            const classTeacherOf = assignments.find((a) => a.classTeacher);
            const empRole = t.role ?? 'TEACHER';
            const isTeacher = empRole === 'TEACHER';
            return (
              <Grid item xs={12} sm={6} lg={4} key={t.id}>
                <Card sx={{ p: 2.5, height: '100%', display: 'flex', flexDirection: 'column', '&:hover': { boxShadow: '0 10px 28px rgba(16,24,40,0.10)' } }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                    <Avatar src={t.photoUrl} sx={{ width: 52, height: 52, bgcolor: 'primary.main', fontSize: 18 }}>
                      {initials(t.firstName ?? '?', t.lastName ?? '')}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
                        <Typography variant="subtitle1" fontWeight={700} noWrap>{t.firstName} {t.lastName}</Typography>
                        {classTeacherOf && (
                          <Tooltip title={`Class Teacher of ${classTeacherOf.className}-${classTeacherOf.sectionName}`}>
                            <Star sx={{ fontSize: 17, color: '#FF8A00' }} />
                          </Tooltip>
                        )}
                      </Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                        {t.employeeCode ?? '—'}
                      </Typography>
                    </Box>
                    {admin && (
                      <IconButton size="small" onClick={(e) => setMenuAnchor({ el: e.currentTarget, teacher: t })}>
                        <MoreVert fontSize="small" />
                      </IconButton>
                    )}
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1.5, flexWrap: 'wrap' }}>
                    <Chip label={ROLE_LABEL[empRole] ?? empRole} size="small" color={isTeacher ? 'primary' : 'secondary'} sx={{ fontWeight: 700 }} />
                    <StatusChip status={t.status} />
                    {isTeacher && t.specialization && <Chip label={t.specialization} size="small" variant="outlined" sx={{ fontWeight: 600 }} />}
                  </Box>

                  <Divider sx={{ my: 1.75 }} />

                  {isTeacher ? (
                    <>
                      {/* Class teacher highlight */}
                      {classTeacherOf ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1, borderRadius: 2, bgcolor: '#FFF6D9', mb: 1 }}>
                          <Star sx={{ fontSize: 16, color: '#FF8A00' }} />
                          <Typography variant="caption" fontWeight={700} color="#8A5B00">
                            Class Teacher · {classTeacherOf.className}-{classTeacherOf.sectionName}
                          </Typography>
                        </Box>
                      ) : (
                        <Typography variant="caption" color="text.disabled" sx={{ mb: 1, display: 'block' }}>
                          Not a class teacher
                        </Typography>
                      )}

                      {/* Assigned classes */}
                      <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Assigned ({assignments.length})
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mt: 0.75, mb: 2, minHeight: 28 }}>
                        {assignments.length === 0 && <Typography variant="caption" color="text.disabled">No classes assigned yet</Typography>}
                        {assignments.slice(0, 4).map((a) => (
                          <Chip
                            key={a.id}
                            size="small"
                            label={`${a.className}-${a.sectionName} · ${a.subjectName}`}
                            sx={{ bgcolor: a.classTeacher ? '#FFF6D9' : '#F3F5F6', fontWeight: 600, fontSize: '0.7rem' }}
                          />
                        ))}
                        {assignments.length > 4 && <Chip size="small" label={`+${assignments.length - 4}`} sx={{ fontWeight: 700 }} />}
                      </Box>
                    </>
                  ) : (
                    <Box sx={{ mb: 2, minHeight: 64, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        Manages the <b>{ROLE_LABEL[empRole] ?? empRole}</b> area.
                      </Typography>
                      {t.loginId && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontFamily: 'monospace' }}>
                          Login ID: {t.loginId}
                        </Typography>
                      )}
                      <Typography variant="caption" color="text.disabled">
                        {t.email ?? 'No login email'}
                      </Typography>
                    </Box>
                  )}

                  <Box sx={{ mt: 'auto', display: 'flex', gap: 1 }}>
                    {isTeacher ? (
                      <Button
                        fullWidth
                        variant="contained"
                        startIcon={<Workspaces />}
                        onClick={() => setAssignTeacher(t)}
                        disabled={!admin}
                      >
                        Manage Classes
                      </Button>
                    ) : (
                      <Button fullWidth variant="outlined" startIcon={<Edit />} onClick={() => setFormTeacher(t)} disabled={!admin}>
                        Edit Details
                      </Button>
                    )}
                    {admin && isTeacher && (
                      <Button variant="outlined" onClick={() => setFormTeacher(t)} sx={{ minWidth: 44, px: 0 }}>
                        <Edit fontSize="small" />
                      </Button>
                    )}
                  </Box>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Row menu */}
      <Menu
        anchorEl={menuAnchor?.el}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
        PaperProps={{ sx: { borderRadius: 2.5, minWidth: 190 } }}
      >
        <MenuItem onClick={() => { setFormTeacher(menuAnchor!.teacher); setMenuAnchor(null); }}>
          <ListItemIcon><Edit fontSize="small" /></ListItemIcon> Edit details
        </MenuItem>
        {(menuAnchor?.teacher.role ?? 'TEACHER') === 'TEACHER' && (
          <MenuItem onClick={() => { setAssignTeacher(menuAnchor!.teacher); setMenuAnchor(null); }}>
            <ListItemIcon><Workspaces fontSize="small" /></ListItemIcon> Manage classes
          </MenuItem>
        )}
        <MenuItem
          disabled={resetPwdMutation.isPending}
          onClick={() => {
            if (confirm('Generate a temporary password and email it to this employee?')) {
              resetPwdMutation.mutate(menuAnchor!.teacher.id);
            }
            setMenuAnchor(null);
          }}>
          <ListItemIcon><LockReset fontSize="small" /></ListItemIcon> Reset password
        </MenuItem>
        {menuAnchor?.teacher.status === 'ACTIVE' ? (
          <MenuItem onClick={() => { statusMutation.mutate({ id: menuAnchor!.teacher.id, status: 'INACTIVE' }); setMenuAnchor(null); }}>
            <ListItemIcon><PersonOff fontSize="small" /></ListItemIcon> Deactivate
          </MenuItem>
        ) : (
          <MenuItem onClick={() => { statusMutation.mutate({ id: menuAnchor!.teacher.id, status: 'ACTIVE' }); setMenuAnchor(null); }}>
            <ListItemIcon><CheckCircleOutline fontSize="small" /></ListItemIcon> Activate
          </MenuItem>
        )}
        <Divider />
        <MenuItem sx={{ color: 'error.main' }} onClick={() => { setDeleteTarget(menuAnchor!.teacher); setMenuAnchor(null); }}>
          <ListItemIcon><DeleteOutline fontSize="small" sx={{ color: 'error.main' }} /></ListItemIcon> Remove
        </MenuItem>
      </Menu>

      {/* Add / Edit */}
      <TeacherFormDialog
        open={formTeacher !== undefined}
        teacher={formTeacher ?? null}
        onClose={() => setFormTeacher(undefined)}
      />

      {/* Assignments */}
      <AssignmentsDrawer
        teacher={assignTeacher}
        onClose={() => setAssignTeacher(null)}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Remove Teacher"
        message={`Remove ${deleteTarget?.firstName ?? 'this teacher'} ${deleteTarget?.lastName ?? ''}? Their assignments will be unlinked. This can't be undone.`}
        confirmLabel="Remove"
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
        loading={deleteMutation.isPending}
      />
    </Box>
  );
}
