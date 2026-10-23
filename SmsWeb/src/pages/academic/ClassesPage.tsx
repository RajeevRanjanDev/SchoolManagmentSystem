import {
  Box, Button, Card, TextField, InputAdornment, Grid, Typography, Chip,
  CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions,
  IconButton, Menu, MenuItem, ListItemIcon, Divider, Alert, Avatar,
} from '@mui/material';
import {
  Add, Search, Class as ClassIcon, MoreVert, Edit, DeleteOutline,
  ToggleOn, ToggleOff, Groups2, MeetingRoom,
} from '@mui/icons-material';
import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useSnackbar } from 'notistack';
import { classesApi, type CreateClassRequest } from '@/api/admin.api';
import { PageHeader } from '@/components/common/PageHeader';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { EmptyState } from '@/components/common/EmptyState';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const CURRENT_YEAR = '2024-2025';

export default function ClassesPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { isSchoolAdmin } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const admin = isSchoolAdmin();

  const [search, setSearch] = useState('');
  const [academicYear] = useState(CURRENT_YEAR);
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<any | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [menu, setMenu] = useState<{ el: HTMLElement; cls: any } | null>(null);

  const { data = [], isLoading } = useQuery<any[]>({
    queryKey: ['classes', academicYear],
    queryFn: () => classesApi.list(academicYear),
    staleTime: 30_000,
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateClassRequest>({
    defaultValues: { academicYear: CURRENT_YEAR },
  });

  useEffect(() => {
    if (formOpen) {
      reset(editTarget
        ? { name: editTarget.name, numericName: editTarget.numericName, academicYear: editTarget.academicYear }
        : { name: '', numericName: undefined, academicYear: CURRENT_YEAR });
    }
  }, [formOpen, editTarget, reset]);

  const saveMutation = useMutation({
    mutationFn: (d: CreateClassRequest) => editTarget ? classesApi.update(editTarget.id, d) : classesApi.create(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['classes'] });
      setFormOpen(false); setEditTarget(null);
      enqueueSnackbar(editTarget ? 'Class updated' : 'Class created', { variant: 'success' });
    },
    onError: (e: any) => enqueueSnackbar(e?.response?.data?.message ?? 'Failed to save class', { variant: 'error' }),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: 'ACTIVE' | 'INACTIVE' }) => classesApi.setStatus(id, status),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ['classes'] });
      enqueueSnackbar(v.status === 'ACTIVE' ? 'Class activated' : 'Class deactivated', { variant: 'success' });
    },
    onError: (e: any) => enqueueSnackbar(e?.response?.data?.message ?? 'Failed to update status', { variant: 'error' }),
  });

  const deleteMutation = useMutation({
    mutationFn: classesApi.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['classes'] });
      setDeleteTarget(null);
      enqueueSnackbar('Class deleted', { variant: 'success' });
    },
    onError: (e: any) => {
      setDeleteTarget(null);
      enqueueSnackbar(e?.response?.data?.message ?? 'Cannot delete this class', { variant: 'error' });
    },
  });

  const filtered = useMemo(() => data.filter((c) =>
    search === '' ||
    (c.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
    String(c.numericName ?? '').includes(search),
  ), [data, search]);

  const openForm = (cls: any | null) => { setEditTarget(cls); setFormOpen(true); };

  return (
    <Box>
      <PageHeader
        title="Classes"
        subtitle={`${data.length} classes · ${academicYear}`}
        crumbs={[{ label: 'Dashboard', path: '/' }, { label: 'Academic Setup' }, { label: 'Classes' }]}
        action={admin && (
          <Button variant="contained" startIcon={<Add />} onClick={() => openForm(null)}>Add Class</Button>
        )}
      />

      <Box sx={{ mb: 2.5, maxWidth: 420 }}>
        <TextField
          size="small" fullWidth placeholder="Search by class name or number…"
          value={search} onChange={(e) => setSearch(e.target.value)}
          sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#fff' } }}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }}
        />
      </Box>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
      ) : filtered.length === 0 ? (
        <Card sx={{ py: 2 }}><EmptyState title="No classes found" description={search ? 'Try a different search.' : 'Add your first class to get started.'} /></Card>
      ) : (
        <Grid container spacing={2.5}>
          {filtered.map((c) => {
            const inactive = c.status === 'INACTIVE';
            return (
              <Grid item xs={12} sm={6} md={4} lg={3} key={c.id}>
                <Card sx={{ p: 2.5, height: '100%', opacity: inactive ? 0.72 : 1, '&:hover': { boxShadow: '0 10px 28px rgba(16,24,40,0.10)' } }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <Avatar variant="rounded" sx={{ bgcolor: inactive ? 'grey.300' : 'primary.main', width: 46, height: 46, borderRadius: 3 }}>
                      <ClassIcon />
                    </Avatar>
                    {admin && (
                      <IconButton size="small" onClick={(e) => setMenu({ el: e.currentTarget, cls: c })}><MoreVert fontSize="small" /></IconButton>
                    )}
                  </Box>

                  <Typography variant="h6" fontWeight={700} sx={{ mt: 1.5 }}>{c.name}</Typography>
                  <Box sx={{ display: 'flex', gap: 0.75, mt: 0.5, flexWrap: 'wrap' }}>
                    {c.numericName != null && <Chip size="small" label={`Grade ${c.numericName}`} sx={{ fontWeight: 600 }} />}
                    <Chip size="small" label={inactive ? 'Inactive' : 'Active'} color={inactive ? 'default' : 'success'} sx={{ fontWeight: 600 }} />
                  </Box>

                  <Divider sx={{ my: 1.75 }} />

                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                      <MeetingRoom sx={{ fontSize: 18, color: 'text.secondary' }} />
                      <Typography variant="body2"><b>{c.sectionCount ?? 0}</b> sections</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                      <Groups2 sx={{ fontSize: 18, color: 'text.secondary' }} />
                      <Typography variant="body2"><b>{c.studentCount ?? 0}</b> students</Typography>
                    </Box>
                  </Box>

                  <Button
                    fullWidth variant="outlined" sx={{ mt: 2 }}
                    startIcon={<MeetingRoom />}
                    onClick={() => navigate('/academic/sections')}
                  >
                    View Sections
                  </Button>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Row menu */}
      <Menu anchorEl={menu?.el} open={Boolean(menu)} onClose={() => setMenu(null)} PaperProps={{ sx: { borderRadius: 2.5, minWidth: 190 } }}>
        <MenuItem onClick={() => { openForm(menu!.cls); setMenu(null); }}>
          <ListItemIcon><Edit fontSize="small" /></ListItemIcon> Edit details
        </MenuItem>
        {menu?.cls.status === 'INACTIVE' ? (
          <MenuItem onClick={() => { statusMutation.mutate({ id: menu!.cls.id, status: 'ACTIVE' }); setMenu(null); }}>
            <ListItemIcon><ToggleOn fontSize="small" /></ListItemIcon> Activate
          </MenuItem>
        ) : (
          <MenuItem onClick={() => { statusMutation.mutate({ id: menu!.cls.id, status: 'INACTIVE' }); setMenu(null); }}>
            <ListItemIcon><ToggleOff fontSize="small" /></ListItemIcon> Deactivate
          </MenuItem>
        )}
        <Divider />
        <MenuItem sx={{ color: 'error.main' }} onClick={() => { setDeleteTarget(menu!.cls); setMenu(null); }}>
          <ListItemIcon><DeleteOutline fontSize="small" sx={{ color: 'error.main' }} /></ListItemIcon> Delete
        </MenuItem>
      </Menu>

      {/* Add / Edit dialog */}
      <Dialog open={formOpen} onClose={() => { setFormOpen(false); setEditTarget(null); }} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle fontWeight={700}>{editTarget ? 'Edit Class' : 'Add New Class'}</DialogTitle>
        <form onSubmit={handleSubmit((d) => saveMutation.mutate(d))}>
          <DialogContent>
            {saveMutation.isError && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: 3 }}>
                {(saveMutation.error as any)?.response?.data?.message ?? 'Failed to save class'}
              </Alert>
            )}
            <Grid container spacing={2} sx={{ mt: 0 }}>
              <Grid item xs={12}>
                <TextField label="Class Name" fullWidth required placeholder="e.g. Class 5" {...register('name', { required: 'Required' })} error={!!errors.name} helperText={errors.name?.message} />
              </Grid>
              <Grid item xs={6}>
                <TextField label="Grade Number" type="number" fullWidth placeholder="e.g. 5" {...register('numericName', { valueAsNumber: true })} />
              </Grid>
              <Grid item xs={6}>
                <TextField label="Academic Year" fullWidth required placeholder="2024-2025" {...register('academicYear', { required: 'Required' })} error={!!errors.academicYear} helperText={errors.academicYear?.message} />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
            <Button onClick={() => { setFormOpen(false); setEditTarget(null); }} variant="outlined">Cancel</Button>
            <Button type="submit" variant="contained" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Saving…' : editTarget ? 'Save Changes' : 'Add Class'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete Class"
        message={
          (deleteTarget?.studentCount ?? 0) > 0
            ? `"${deleteTarget?.name}" has ${deleteTarget?.studentCount} enrolled student(s). You cannot delete it — deactivate it instead to preserve records.`
            : `Delete "${deleteTarget?.name}" and its ${deleteTarget?.sectionCount ?? 0} empty section(s)? This cannot be undone.`
        }
        confirmLabel={(deleteTarget?.studentCount ?? 0) > 0 ? 'Delete anyway' : 'Delete'}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
        loading={deleteMutation.isPending}
      />
    </Box>
  );
}
