import {
  Box, Card, Button, TextField, MenuItem, Grid, Typography,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions, Chip, CircularProgress, Alert,
} from '@mui/material';
import { Add } from '@mui/icons-material';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { homeworkApi } from '@/api/academic.api';
import { apiClient } from '@/api/client';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { fmtDate } from '@/utils/formatters';
import type { Section } from '@/types/academic.types';

export default function HomeworkPage() {
  const qc = useQueryClient();
  const [sectionId, setSectionId] = useState<number | ''>('');
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: sections } = useQuery({
    queryKey: ['sections'],
    queryFn: () => apiClient.get<Section[]>('/api/v1/sections').then((r) => r.data),
    staleTime: 300_000,
  });

  const { data: homework, isLoading } = useQuery({
    queryKey: ['homework', sectionId],
    queryFn: () => homeworkApi.getBySection(sectionId as number),
    enabled: !!sectionId,
  });

  const createMutation = useMutation({
    mutationFn: homeworkApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['homework'] });
      setDialogOpen(false);
      reset();
    },
  });

  const { register, handleSubmit, reset } = useForm<any>();

  return (
    <Box>
      <PageHeader
        title="Homework"
        subtitle="Assign and track homework by section"
        crumbs={[{ label: 'Dashboard', path: '/' }, { label: 'Homework' }]}
        action={
          <Button variant="contained" startIcon={<Add />} onClick={() => setDialogOpen(true)}>
            Assign Homework
          </Button>
        }
      />

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <TextField
            select
            label="Filter by Section"
            fullWidth
            value={sectionId}
            onChange={(e) => setSectionId(Number(e.target.value))}
          >
            {(sections ?? []).map((s) => (
              <MenuItem key={s.id} value={s.id}>{s.schoolClassName} — {s.name}</MenuItem>
            ))}
          </TextField>
        </Grid>
      </Grid>

      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Subject</TableCell>
                <TableCell>Section</TableCell>
                <TableCell>Assigned Date</TableCell>
                <TableCell>Due Date</TableCell>
                <TableCell>Teacher</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {!sectionId ? (
                <TableRow><TableCell colSpan={6}><EmptyState title="Select a section" description="Choose a section to view homework." /></TableCell></TableRow>
              ) : isLoading ? (
                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 6 }}><CircularProgress /></TableCell></TableRow>
              ) : !homework?.length ? (
                <TableRow><TableCell colSpan={6}><EmptyState title="No homework found" /></TableCell></TableRow>
              ) : (
                homework.map((h) => (
                  <TableRow key={h.id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{h.title}</TableCell>
                    <TableCell><Chip label={h.subject} size="small" /></TableCell>
                    <TableCell>{h.sectionName}</TableCell>
                    <TableCell>{fmtDate(h.assignedDate)}</TableCell>
                    <TableCell sx={{ color: new Date(h.dueDate) < new Date() ? 'error.main' : 'inherit' }}>
                      {fmtDate(h.dueDate)}
                    </TableCell>
                    <TableCell>{h.teacherName}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog open={dialogOpen} onClose={() => { setDialogOpen(false); reset(); }} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle fontWeight={700}>Assign Homework</DialogTitle>
        <form onSubmit={handleSubmit((d) => createMutation.mutate({ ...d, sectionId: Number(d.sectionId) }))}>
          <DialogContent>
            {createMutation.isError && <Alert severity="error" sx={{ mb: 2 }}>Failed to assign homework</Alert>}
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField select label="Section" fullWidth required {...register('sectionId')}>
                  {(sections ?? []).map((s) => <MenuItem key={s.id} value={s.id}>{s.schoolClassName} — {s.name}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={6}>
                <TextField label="Subject" fullWidth required {...register('subject')} />
              </Grid>
              <Grid item xs={12}>
                <TextField label="Title" fullWidth required {...register('title')} />
              </Grid>
              <Grid item xs={12}>
                <TextField label="Description" fullWidth multiline rows={3} {...register('description')} />
              </Grid>
              <Grid item xs={6}>
                <TextField label="Due Date" type="date" fullWidth required InputLabelProps={{ shrink: true }} {...register('dueDate')} />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
            <Button onClick={() => { setDialogOpen(false); reset(); }} variant="outlined">Cancel</Button>
            <Button type="submit" variant="contained" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Saving...' : 'Assign'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
