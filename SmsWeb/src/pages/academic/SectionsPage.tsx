import {
  Box, Button, Card, TextField, InputAdornment, Grid, Typography, Chip,
  CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions,
  IconButton, Menu, MenuItem, ListItemIcon, Divider, Alert, Avatar,
  Select, FormControl, InputLabel, LinearProgress,
} from '@mui/material';
import {
  Add, Search, MeetingRoom, MoreVert, Edit, DeleteOutline,
  ToggleOn, ToggleOff, Groups2, Star, PersonOutline,
} from '@mui/icons-material';
import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useSnackbar } from 'notistack';
import { classesApi, sectionsApi, type CreateSectionRequest } from '@/api/admin.api';
import { PageHeader } from '@/components/common/PageHeader';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { EmptyState } from '@/components/common/EmptyState';
import { useAuth } from '@/hooks/useAuth';

export default function SectionsPage() {
  const qc = useQueryClient();
  const { isSchoolAdmin } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const admin = isSchoolAdmin();

  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState<number | ''>('');
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<any | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<any | null>(null);
  const [menu, setMenu] = useState<{ el: HTMLElement; sec: any } | null>(null);

  const { data: classes = [] } = useQuery<any[]>({ queryKey: ['classes'], queryFn: () => classesApi.list(), staleTime: 60_000 });

  const { data: sections = [], isLoading } = useQuery<any[]>({
    queryKey: ['sections', classFilter],
    queryFn: () => classFilter ? sectionsApi.listByClass(classFilter as number) : sectionsApi.listAll(),
    staleTime: 20_000,
  });

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<CreateSectionRequest & { classId: number }>();
  const selectedClassId = watch('classId');

  useEffect(() => {
    if (formOpen) {
      reset(editTarget
        ? { classId: editTarget.classId, name: editTarget.name, maxCapacity: editTarget.maxCapacity }
        : { classId: (classFilter || classes[0]?.id) as number, name: '', maxCapacity: 40 });
    }
  }, [formOpen, editTarget, reset, classFilter, classes]);

  const saveMutation = useMutation({
    mutationFn: (d: CreateSectionRequest & { classId: number }) =>
      editTarget
        ? sectionsApi.update(editTarget.id, { name: d.name, maxCapacity: d.maxCapacity })
        : sectionsApi.create(d.classId, { name: d.name, maxCapacity: d.maxCapacity }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sections'] });
      setFormOpen(false); setEditTarget(null);
      enqueueSnackbar(editTarget ? 'Section updated' : 'Section created', { variant: 'success' });
    },
    onError: (e: any) => enqueueSnackbar(e?.response?.data?.message ?? 'Failed to save section', { variant: 'error' }),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: 'ACTIVE' | 'INACTIVE' }) => sectionsApi.setStatus(id, status),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ['sections'] });
      setDeactivateTarget(null);
      enqueueSnackbar(v.status === 'ACTIVE' ? 'Section activated' : 'Section deactivated', { variant: 'success' });
    },
    onError: (e: any) => enqueueSnackbar(e?.response?.data?.message ?? 'Failed to update status', { variant: 'error' }),
  });

  const deleteMutation = useMutation({
    mutationFn: sectionsApi.delete,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sections'] }); setDeleteTarget(null); enqueueSnackbar('Section deleted', { variant: 'success' }); },
    onError: (e: any) => { setDeleteTarget(null); enqueueSnackbar(e?.response?.data?.message ?? 'Cannot delete this section', { variant: 'error' }); },
  });

  // When admin clicks Deactivate, check impact first
  const askDeactivate = async (sec: any) => {
    setMenu(null);
    if (sec.status === 'INACTIVE') { statusMutation.mutate({ id: sec.id, status: 'ACTIVE' }); return; }
    try {
      const impact = await sectionsApi.impact(sec.id);
      setDeactivateTarget({ ...sec, _impact: impact });
    } catch {
      setDeactivateTarget({ ...sec, _impact: { studentCount: sec.studentCount ?? 0, hasStudents: (sec.studentCount ?? 0) > 0, canDelete: (sec.studentCount ?? 0) === 0 } });
    }
  };

  const filtered = useMemo(() => sections.filter((s) =>
    search === '' ||
    `${s.className} ${s.name}`.toLowerCase().includes(search.toLowerCase()) ||
    (s.classTeacherName ?? '').toLowerCase().includes(search.toLowerCase()),
  ), [sections, search]);

  const openForm = (sec: any | null) => { setEditTarget(sec); setFormOpen(true); };

  return (
    <Box>
      <PageHeader
        title="Sections"
        subtitle={`${sections.length} sections`}
        crumbs={[{ label: 'Dashboard', path: '/' }, { label: 'Academic Setup' }, { label: 'Sections' }]}
        action={admin && (
          <Button variant="contained" startIcon={<Add />} onClick={() => openForm(null)} disabled={classes.length === 0}>
            Add Section
          </Button>
        )}
      />

      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mb: 2.5 }}>
        <TextField
          size="small" placeholder="Search section or class teacher…"
          value={search} onChange={(e) => setSearch(e.target.value)}
          sx={{ flex: 1, minWidth: 280, '& .MuiOutlinedInput-root': { bgcolor: '#fff' } }}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }}
        />
        <FormControl size="small" sx={{ minWidth: 200, bgcolor: '#fff', borderRadius: 2 }}>
          <InputLabel>Filter by class</InputLabel>
          <Select label="Filter by class" value={classFilter} onChange={(e) => setClassFilter(e.target.value === '' ? '' : Number(e.target.value))}>
            <MenuItem value="">All classes</MenuItem>
            {classes.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
          </Select>
        </FormControl>
      </Box>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
      ) : filtered.length === 0 ? (
        <Card sx={{ py: 2 }}><EmptyState title="No sections found" description={search ? 'Try a different search.' : 'Create a class first, then add sections.'} /></Card>
      ) : (
        <Grid container spacing={2.5}>
          {filtered.map((s) => {
            const inactive = s.status === 'INACTIVE';
            const cap = s.maxCapacity ?? 0;
            const count = s.studentCount ?? 0;
            const pct = cap > 0 ? Math.min(100, Math.round((count / cap) * 100)) : 0;
            return (
              <Grid item xs={12} sm={6} md={4} key={s.id}>
                <Card sx={{ p: 2.5, height: '100%', opacity: inactive ? 0.72 : 1, '&:hover': { boxShadow: '0 10px 28px rgba(16,24,40,0.10)' } }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                      <Avatar variant="rounded" sx={{ bgcolor: inactive ? 'grey.300' : 'secondary.main', color: inactive ? 'grey.600' : '#1C1C1C', width: 46, height: 46, borderRadius: 3, fontWeight: 800 }}>
                        {s.name}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle1" fontWeight={700}>{s.className}-{s.name}</Typography>
                        <Chip size="small" label={inactive ? 'Inactive' : 'Active'} color={inactive ? 'default' : 'success'} sx={{ fontWeight: 600, height: 20 }} />
                      </Box>
                    </Box>
                    {admin && <IconButton size="small" onClick={(e) => setMenu({ el: e.currentTarget, sec: s })}><MoreVert fontSize="small" /></IconButton>}
                  </Box>

                  <Divider sx={{ my: 1.75 }} />

                  {/* Class teacher */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                    {s.classTeacherName ? (
                      <>
                        <Star sx={{ fontSize: 18, color: '#FF8A00' }} />
                        <Typography variant="body2" fontWeight={600}>{s.classTeacherName}</Typography>
                        <Typography variant="caption" color="text.secondary">· Class Teacher</Typography>
                      </>
                    ) : (
                      <>
                        <PersonOutline sx={{ fontSize: 18, color: 'text.disabled' }} />
                        <Typography variant="body2" color="text.disabled">No class teacher assigned</Typography>
                      </>
                    )}
                  </Box>

                  {/* Capacity */}
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                      <Groups2 sx={{ fontSize: 18, color: 'text.secondary' }} />
                      <Typography variant="body2"><b>{count}</b>{cap > 0 ? ` / ${cap}` : ''} students</Typography>
                    </Box>
                    {cap > 0 && <Typography variant="caption" color={pct >= 100 ? 'error.main' : 'text.secondary'} fontWeight={700}>{pct}%</Typography>}
                  </Box>
                  {cap > 0 && (
                    <LinearProgress variant="determinate" value={pct} sx={{ height: 7, borderRadius: 4, bgcolor: '#EEF1F3', '& .MuiLinearProgress-bar': { borderRadius: 4, bgcolor: pct >= 100 ? '#E23744' : '#0C831F' } }} />
                  )}
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Row menu */}
      <Menu anchorEl={menu?.el} open={Boolean(menu)} onClose={() => setMenu(null)} PaperProps={{ sx: { borderRadius: 2.5, minWidth: 200 } }}>
        <MenuItem onClick={() => { openForm(menu!.sec); setMenu(null); }}>
          <ListItemIcon><Edit fontSize="small" /></ListItemIcon> Edit details
        </MenuItem>
        {menu?.sec.status === 'INACTIVE' ? (
          <MenuItem onClick={() => askDeactivate(menu!.sec)}>
            <ListItemIcon><ToggleOn fontSize="small" /></ListItemIcon> Activate
          </MenuItem>
        ) : (
          <MenuItem onClick={() => askDeactivate(menu!.sec)}>
            <ListItemIcon><ToggleOff fontSize="small" /></ListItemIcon> Deactivate
          </MenuItem>
        )}
        <Divider />
        <MenuItem sx={{ color: 'error.main' }} onClick={() => { setDeleteTarget(menu!.sec); setMenu(null); }}>
          <ListItemIcon><DeleteOutline fontSize="small" sx={{ color: 'error.main' }} /></ListItemIcon> Delete
        </MenuItem>
      </Menu>

      {/* Add / Edit dialog */}
      <Dialog open={formOpen} onClose={() => { setFormOpen(false); setEditTarget(null); }} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle fontWeight={700}>{editTarget ? 'Edit Section' : 'Add New Section'}</DialogTitle>
        <form onSubmit={handleSubmit((d) => saveMutation.mutate(d))}>
          <DialogContent>
            {saveMutation.isError && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: 3 }}>
                {(saveMutation.error as any)?.response?.data?.message ?? 'Failed to save section'}
              </Alert>
            )}
            <Grid container spacing={2} sx={{ mt: 0 }}>
              <Grid item xs={12}>
                <FormControl fullWidth required disabled={!!editTarget}>
                  <InputLabel>Class</InputLabel>
                  <Select
                    label="Class"
                    value={selectedClassId ?? ''}
                    onChange={(e) => setValue('classId', Number(e.target.value))}
                  >
                    {classes.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <TextField label="Section Name" fullWidth required placeholder="e.g. A"
                  {...register('name', { required: 'Required', setValueAs: (v) => (v ?? '').trim().toUpperCase() })}
                  inputProps={{ style: { textTransform: 'uppercase' } }}
                  error={!!errors.name} helperText={errors.name?.message} />
              </Grid>
              <Grid item xs={6}>
                <TextField label="Max Capacity" type="number" fullWidth placeholder="40" {...register('maxCapacity', { valueAsNumber: true })} />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
            <Button onClick={() => { setFormOpen(false); setEditTarget(null); }} variant="outlined">Cancel</Button>
            <Button type="submit" variant="contained" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Saving…' : editTarget ? 'Save Changes' : 'Add Section'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Deactivate with impact warning */}
      <ConfirmDialog
        open={deactivateTarget !== null}
        title={`Deactivate ${deactivateTarget?.className}-${deactivateTarget?.name}?`}
        message={
          (deactivateTarget?._impact?.studentCount ?? 0) > 0
            ? `⚠️ ${deactivateTarget?._impact?.studentCount} student(s) are still enrolled in this section. Deactivating hides it from daily use but preserves all records. Move students to another section first if this isn't intended.`
            : 'This section has no enrolled students. Deactivating hides it from daily use but preserves it.'
        }
        confirmLabel="Deactivate"
        onConfirm={() => deactivateTarget && statusMutation.mutate({ id: deactivateTarget.id, status: 'INACTIVE' })}
        onCancel={() => setDeactivateTarget(null)}
        loading={statusMutation.isPending}
      />

      {/* Delete */}
      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete Section"
        message={
          (deleteTarget?.studentCount ?? 0) > 0
            ? `"${deleteTarget?.className}-${deleteTarget?.name}" has ${deleteTarget?.studentCount} enrolled student(s). You can't delete it — deactivate it instead to preserve records.`
            : `Delete empty section "${deleteTarget?.className}-${deleteTarget?.name}"? This cannot be undone.`
        }
        confirmLabel="Delete"
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
        loading={deleteMutation.isPending}
      />
    </Box>
  );
}
