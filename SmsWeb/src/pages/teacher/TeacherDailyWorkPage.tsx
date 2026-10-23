import {
  Box, Card, CardContent, Typography, CircularProgress, TextField, Button, Divider,
  FormControl, InputLabel, Select, MenuItem,
} from '@mui/material';
import { MenuBook, Save } from '@mui/icons-material';
import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { dailyWorkApi } from '@/api/dailyWork.api';
import { teacherApi } from '@/api/teacher.api';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';

export default function TeacherDailyWorkPage() {
  const qc = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [homework, setHomework] = useState('');
  const [classwork, setClasswork] = useState('');

  // Every class·section the teacher is assigned to teach (deduped).
  const { data: assignments = [], isLoading } = useQuery<any[]>({
    queryKey: ['my-assignments'],
    queryFn: () => teacherApi.getMyAssignments(),
    staleTime: 60_000,
  });

  const sections = useMemo(() => {
    const map = new Map<number, { sectionId: number; sectionName: string; className: string }>();
    (assignments as any[]).forEach((a) => {
      if (a.sectionId != null && !map.has(a.sectionId)) {
        map.set(a.sectionId, { sectionId: a.sectionId, sectionName: a.sectionName, className: a.className });
      }
    });
    return Array.from(map.values());
  }, [assignments]);

  const hasNone = !isLoading && sections.length === 0;
  const [selectedId, setSelectedId] = useState<number | ''>('');

  useEffect(() => {
    if (sections.length && (selectedId === '' || !sections.some((s) => s.sectionId === selectedId))) {
      setSelectedId(sections[0].sectionId);
    }
  }, [sections, selectedId]);

  const { data: existing = [], isLoading: loadingWork } = useQuery<any[]>({
    queryKey: ['teacher-daily-work', selectedId, date],
    queryFn: () => dailyWorkApi.getBySectionAndDate(selectedId as number, date),
    enabled: !!selectedId && !!date,
  });

  // Prefill from any saved work for this section + date.
  useEffect(() => {
    const hw = existing.find((w) => w.type === 'HOMEWORK')?.description ?? '';
    const cw = existing.find((w) => w.type === 'CLASSWORK')?.description ?? '';
    setHomework(hw);
    setClasswork(cw);
  }, [existing]);

  const alreadyPosted = existing.some((w) => (w.description ?? '').trim().length > 0);

  const saveMutation = useMutation({
    mutationFn: async () => {
      await dailyWorkApi.upsert({ sectionId: selectedId as number, workDate: date, type: 'HOMEWORK', description: homework.trim() });
      await dailyWorkApi.upsert({ sectionId: selectedId as number, workDate: date, type: 'CLASSWORK', description: classwork.trim() });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teacher-daily-work', selectedId, date] });
      enqueueSnackbar('Saved', { variant: 'success' });
    },
    onError: (e: any) => enqueueSnackbar(e?.response?.data?.message ?? 'Failed to save', { variant: 'error' }),
  });

  return (
    <Box>
      <PageHeader
        title="Homework & Classwork"
        subtitle="Write the day's homework and classwork for your class"
        crumbs={[{ label: 'Dashboard', path: '/' }, { label: 'Homework & Classwork' }]}
      />

      {isLoading ? (
        <Box sx={{ textAlign: 'center', py: 6 }}><CircularProgress /></Box>
      ) : hasNone ? (
        <Card><EmptyState title="No class assigned" description="You are not assigned to teach any class/section yet. Ask your admin." icon={<MenuBook sx={{ fontSize: 64 }} />} /></Card>
      ) : (
        <>
          <Card sx={{ p: 2, mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              <FormControl size="small" sx={{ minWidth: 240 }}>
                <InputLabel>Class · Section</InputLabel>
                <Select label="Class · Section" value={selectedId}
                  onChange={(e) => setSelectedId(Number(e.target.value))}>
                  {sections.map((s) => (
                    <MenuItem key={s.sectionId} value={s.sectionId}>{s.className} · {s.sectionName}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                type="date" label="Date" size="small" value={date}
                onChange={(e) => setDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Box>
          </Card>

          <Card sx={{ maxWidth: 820 }}>
            <CardContent sx={{ p: 3 }}>
              {loadingWork ? (
                <Box sx={{ textAlign: 'center', py: 4 }}><CircularProgress /></Box>
              ) : (
                <>
                  <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>Homework</Typography>
                  <TextField
                    fullWidth multiline minRows={4} placeholder="Write all homework here (any subjects, consolidated)…"
                    value={homework} onChange={(e) => setHomework(e.target.value)} />

                  <Divider sx={{ my: 3 }} />

                  <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>Classwork</Typography>
                  <TextField
                    fullWidth multiline minRows={4} placeholder="Write what was done in class today (consolidated)…"
                    value={classwork} onChange={(e) => setClasswork(e.target.value)} />

                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1.5, mt: 3 }}>
                    {alreadyPosted && (
                      <Typography variant="caption" color="success.main">Already posted for this date — editing</Typography>
                    )}
                    <Button variant="contained" startIcon={<Save />} disabled={saveMutation.isPending}
                      onClick={() => saveMutation.mutate()}>
                      {saveMutation.isPending ? 'Saving…' : alreadyPosted ? 'Update' : 'Save'}
                    </Button>
                  </Box>
                </>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </Box>
  );
}
