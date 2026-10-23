import {
  Box, Card, Grid, Typography, FormControl, InputLabel, Select, MenuItem,
  TextField, Button, CircularProgress, Divider,
} from '@mui/material';
import { MenuBook, EditNote, Save } from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import dayjs from 'dayjs';
import { dailyWorkApi } from '@/api/dailyWork.api';
import { classesApi, sectionsApi } from '@/api/admin.api';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { fmtDate } from '@/utils/formatters';

function WorkCard({
  title, icon, color, value, onChange, onSave, saving, meta, exists,
}: {
  title: string; icon: React.ReactNode; color: string;
  value: string; onChange: (v: string) => void; onSave: () => void; saving: boolean; meta?: string; exists?: boolean;
}) {
  return (
    <Card sx={{ p: 2.5, height: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 1.5 }}>
        <Box sx={{ width: 40, height: 40, borderRadius: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', background: `linear-gradient(135deg, ${color} 0%, ${color}CC 100%)` }}>
          {icon}
        </Box>
        <Box>
          <Typography variant="subtitle1" fontWeight={700}>{title}</Typography>
          {meta && <Typography variant="caption" color="text.secondary">{meta}</Typography>}
        </Box>
      </Box>
      <TextField
        fullWidth multiline minRows={5} placeholder={`What is the ${title.toLowerCase()} for this day?`}
        value={value} onChange={(e) => onChange(e.target.value)}
      />
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1.5, mt: 1.5 }}>
        {exists && <Typography variant="caption" color="success.main">Already posted — editing</Typography>}
        <Button variant="contained" startIcon={<Save />} disabled={!value.trim() || saving} onClick={onSave}>
          {saving ? (exists ? 'Updating…' : 'Saving…') : exists ? 'Update' : 'Save'}
        </Button>
      </Box>
    </Card>
  );
}

export default function DailyWorkPage() {
  const qc = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const [classId, setClassId] = useState<number | ''>('');
  const [sectionId, setSectionId] = useState<number | ''>('');
  const [date, setDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [homework, setHomework] = useState('');
  const [classwork, setClasswork] = useState('');

  const { data: classes = [] } = useQuery<any[]>({ queryKey: ['classes'], queryFn: () => classesApi.list(), staleTime: 60_000 });
  const { data: sections = [] } = useQuery<any[]>({ queryKey: ['sections-all'], queryFn: () => sectionsApi.listAll(), staleTime: 60_000 });
  const sectionsForClass = sections.filter((s) => s.classId === classId);

  const { data: entries = [], isLoading } = useQuery<any[]>({
    queryKey: ['daily-work', sectionId, date],
    queryFn: () => dailyWorkApi.getBySectionAndDate(sectionId as number, date),
    enabled: !!sectionId,
  });

  const hw = entries.find((e) => e.type === 'HOMEWORK');
  const cw = entries.find((e) => e.type === 'CLASSWORK');

  // Load existing entries into the editors when section/date changes.
  useEffect(() => { setHomework(hw?.description ?? ''); }, [hw?.id, sectionId, date]);
  useEffect(() => { setClasswork(cw?.description ?? ''); }, [cw?.id, sectionId, date]);

  const saveMutation = useMutation({
    mutationFn: (type: 'HOMEWORK' | 'CLASSWORK') => dailyWorkApi.upsert({
      sectionId: sectionId as number, workDate: date, type,
      description: (type === 'HOMEWORK' ? homework : classwork).trim(),
    }),
    onSuccess: (_d, type) => {
      qc.invalidateQueries({ queryKey: ['daily-work', sectionId, date] });
      enqueueSnackbar(`${type === 'HOMEWORK' ? 'Homework' : 'Classwork'} saved`, { variant: 'success' });
    },
    onError: (e: any) => enqueueSnackbar(e?.response?.data?.message ?? 'Failed to save', { variant: 'error' }),
  });

  return (
    <Box>
      <PageHeader
        title="Homework & Classwork"
        subtitle="Post the day's homework & classwork for a class-section"
        crumbs={[{ label: 'Dashboard', path: '/' }, { label: 'Homework & Classwork' }]}
      />

      {/* Selectors */}
      <Card sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <FormControl size="small" fullWidth>
              <InputLabel>Class</InputLabel>
              <Select label="Class" value={classId}
                onChange={(e) => { setClassId(Number(e.target.value)); setSectionId(''); }}>
                {classes.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl size="small" fullWidth disabled={classId === ''}>
              <InputLabel>Section</InputLabel>
              <Select label="Section" value={sectionId} onChange={(e) => setSectionId(Number(e.target.value))}>
                {sectionsForClass.map((s) => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField size="small" label="Date" type="date" fullWidth value={date}
              onChange={(e) => setDate(e.target.value)} InputLabelProps={{ shrink: true }} />
          </Grid>
        </Grid>
      </Card>

      {!sectionId ? (
        <Card sx={{ py: 2 }}><EmptyState title="Select a class & section" description="Choose a class, section and date to view or post homework & classwork." /></Card>
      ) : isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
      ) : (
        <>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            For <b>{fmtDate(date, 'DD MMM YYYY (dddd)')}</b>
          </Typography>
          <Grid container spacing={2.5}>
            <Grid item xs={12} md={6}>
              <WorkCard
                title="Homework" icon={<MenuBook />} color="#0C831F"
                value={homework} onChange={setHomework}
                onSave={() => saveMutation.mutate('HOMEWORK')}
                saving={saveMutation.isPending && saveMutation.variables === 'HOMEWORK'}
                meta={hw ? `Last updated by ${hw.createdByName ?? '—'}` : 'Not posted yet'}
                exists={!!hw}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <WorkCard
                title="Classwork" icon={<EditNote />} color="#2E6FF2"
                value={classwork} onChange={setClasswork}
                onSave={() => saveMutation.mutate('CLASSWORK')}
                saving={saveMutation.isPending && saveMutation.variables === 'CLASSWORK'}
                meta={cw ? `Last updated by ${cw.createdByName ?? '—'}` : 'Not posted yet'}
                exists={!!cw}
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />
          <Typography variant="caption" color="text.secondary">
            One homework and one classwork entry per section per day. Saving again updates the existing entry.
          </Typography>
        </>
      )}
    </Box>
  );
}
