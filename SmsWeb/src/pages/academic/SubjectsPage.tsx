import {
  Box, Button, Card, TextField, InputAdornment, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, IconButton,
  Tooltip, Dialog, DialogTitle, DialogContent, DialogActions,
  Grid, Alert, CircularProgress, Typography, Chip,
} from '@mui/material';
import { Search, Add, Edit, Delete } from '@mui/icons-material';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { subjectsApi, type CreateSubjectRequest } from '@/api/admin.api';
import { PageHeader } from '@/components/common/PageHeader';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { EmptyState } from '@/components/common/EmptyState';
import { useAuth } from '@/hooks/useAuth';

export default function SubjectsPage() {
  const qc = useQueryClient();
  const { isSchoolAdmin } = useAuth();
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<any | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data = [], isLoading } = useQuery<any[]>({
    queryKey: ['subjects'],
    queryFn: subjectsApi.list,
    staleTime: 60_000,
  });

  const createMutation = useMutation({
    mutationFn: subjectsApi.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['subjects'] }); closeDialog(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: CreateSubjectRequest }) => subjectsApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['subjects'] }); closeDialog(); },
  });

  const deleteMutation = useMutation({
    mutationFn: subjectsApi.delete,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['subjects'] }); setDeleteId(null); },
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateSubjectRequest>();

  const openCreate = () => { setEditItem(null); reset({}); setDialogOpen(true); };
  const openEdit = (item: any) => { setEditItem(item); reset({ subjectName: item.subjectName, subjectCode: item.subjectCode, description: item.description }); setDialogOpen(true); };
  const closeDialog = () => { setDialogOpen(false); setEditItem(null); reset(); };

  const onSubmit = (d: CreateSubjectRequest) => {
    if (editItem) updateMutation.mutate({ id: editItem.id, data: d });
    else createMutation.mutate(d);
  };

  const isPending = createMutation.isPending || updateMutation.isPending;
  const isError = createMutation.isError || updateMutation.isError;
  const errorMsg = (createMutation.error as any)?.response?.data?.message
    ?? (updateMutation.error as any)?.response?.data?.message
    ?? 'Operation failed';

  const filtered = data.filter(
    (s) =>
      search === '' ||
      s.subjectName.toLowerCase().includes(search.toLowerCase()) ||
      (s.subjectCode ?? '').toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <Box>
      <PageHeader
        title="Subjects"
        subtitle={`${data.length} subjects defined`}
        crumbs={[{ label: 'Dashboard', path: '/' }, { label: 'Academic Setup' }, { label: 'Subjects' }]}
        action={
          isSchoolAdmin() && (
            <Button variant="contained" startIcon={<Add />} onClick={openCreate}>
              Add Subject
            </Button>
          )
        }
      />

      <Card>
        <Box sx={{ p: 2, borderBottom: '1px solid #EBEBEB' }}>
          <TextField
            size="small"
            placeholder="Search subjects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ width: 300 }}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }}
          />
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Subject Name</TableCell>
                <TableCell>Code</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Status</TableCell>
                {isSchoolAdmin() && <TableCell align="right">Actions</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5}>
                    <EmptyState title="No subjects found" description="Add subjects like Mathematics, Science, English." />
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((s: any) => (
                  <TableRow key={s.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>{s.subjectName}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={s.subjectCode} size="small" color="primary" variant="outlined" sx={{ fontFamily: 'monospace' }} />
                    </TableCell>
                    <TableCell sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>
                      {s.description ?? '—'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={s.status ?? 'ACTIVE'}
                        size="small"
                        color={s.status === 'ACTIVE' ? 'success' : 'default'}
                      />
                    </TableCell>
                    {isSchoolAdmin() && (
                      <TableCell align="right">
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => openEdit(s)}>
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton size="small" color="error" onClick={() => setDeleteId(s.id)}>
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Add / Edit Subject Dialog */}
      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle fontWeight={700}>{editItem ? 'Edit Subject' : 'Add New Subject'}</DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent>
            {isError && (
              <Alert severity="error" sx={{ mb: 2 }}>{errorMsg}</Alert>
            )}
            <Grid container spacing={2}>
              <Grid item xs={8}>
                <TextField label="Subject Name" fullWidth required {...register('subjectName', { required: 'Required' })} error={!!errors.subjectName} helperText={errors.subjectName?.message} />
              </Grid>
              <Grid item xs={4}>
                <TextField label="Code" fullWidth required placeholder="MATH" {...register('subjectCode', { required: 'Required' })} error={!!errors.subjectCode} helperText={errors.subjectCode?.message} />
              </Grid>
              <Grid item xs={12}>
                <TextField label="Description" fullWidth multiline rows={2} {...register('description')} />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
            <Button onClick={closeDialog} variant="outlined">Cancel</Button>
            <Button type="submit" variant="contained" disabled={isPending}>
              {isPending ? 'Saving...' : editItem ? 'Update' : 'Add Subject'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <ConfirmDialog
        open={deleteId !== null}
        title="Delete Subject"
        message="Are you sure you want to delete this subject?"
        confirmLabel="Delete"
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        onCancel={() => setDeleteId(null)}
        loading={deleteMutation.isPending}
      />
    </Box>
  );
}
