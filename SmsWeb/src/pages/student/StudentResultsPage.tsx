import { Box, Card, Typography, Chip, Divider, Skeleton, LinearProgress, TextField, Button } from '@mui/material';
import { Grading } from '@mui/icons-material';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { studentPortalApi, type StudentResult } from '@/api/studentPortal.api';
import { SectionCard } from '@/components/student/StudentUI';
import { fmtDate } from '@/utils/formatters';

function pct(obtained?: number, total?: number) {
  if (!obtained || !total) return 0;
  return Math.round((obtained / total) * 1000) / 10;
}
function barColor(p: number) {
  if (p >= 75) return '#0C831F';
  if (p >= 40) return '#F59E0B';
  return '#E23744';
}

export default function StudentResultsPage() {
  const { data: results = [], isLoading } = useQuery({ queryKey: ['student-results'], queryFn: studentPortalApi.results });

  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  // Filter by exam date range (both optional).
  const filtered = results.filter((r) => {
    if (from && (!r.examDate || r.examDate < from)) return false;
    if (to && (!r.examDate || r.examDate > to)) return false;
    return true;
  });

  // Group by exam name.
  const groups = filtered.reduce((acc: Record<string, StudentResult[]>, r) => {
    const k = r.examName ?? 'Exam';
    (acc[k] = acc[k] || []).push(r);
    return acc;
  }, {});

  return (
    <Box sx={{ pb: 2, maxWidth: 820, mx: 'auto' }}>
      <Typography variant="h6" fontWeight={800} sx={{ mb: 1.5 }}>Exam Results</Typography>

      {/* Date filter */}
      <Card sx={{ p: 2, borderRadius: 4, boxShadow: 'none', mb: 2, display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
        <TextField type="date" label="From date" size="small" value={from}
          onChange={(e) => setFrom(e.target.value)} InputLabelProps={{ shrink: true }} />
        <TextField type="date" label="To date" size="small" value={to}
          onChange={(e) => setTo(e.target.value)} InputLabelProps={{ shrink: true }} />
        {(from || to) && <Button size="small" onClick={() => { setFrom(''); setTo(''); }}>Clear</Button>}
      </Card>

      {isLoading ? (
        [0, 1].map((i) => <Skeleton key={i} variant="rounded" height={120} sx={{ borderRadius: 4, mb: 2 }} />)
      ) : filtered.length === 0 ? (
        <Card sx={{ p: 4, borderRadius: 4, boxShadow: 'none', textAlign: 'center' }}>
          <Grading sx={{ fontSize: 56, color: '#CBD5E1' }} />
          <Typography variant="body2" color="text.secondary">
            {results.length === 0 ? 'No results published yet.' : 'No results in this date range.'}
          </Typography>
        </Card>
      ) : (
        Object.entries(groups).map(([examName, rows]) => {
          const totObtained = rows.reduce((s, r) => s + (r.marksObtained ?? 0), 0);
          const totMax = rows.reduce((s, r) => s + (r.totalMarks ?? 0), 0);
          const overall = pct(totObtained, totMax);
          return (
            <SectionCard
              key={examName}
              title={examName}
              action={<Chip label={`${overall}%`} size="small" sx={{ bgcolor: `${barColor(overall)}18`, color: barColor(overall), fontWeight: 700 }} />}
              sx={{ mb: 2 }}
            >
              {rows.map((r) => {
                const p = pct(r.marksObtained, r.totalMarks);
                return (
                  <Box key={r.id} sx={{ py: 1, borderBottom: '1px solid #F2F2F2', '&:last-child': { borderBottom: 'none' } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>{r.subject ?? '—'}</Typography>
                        {r.examDate && <Typography variant="caption" color="text.disabled">{fmtDate(r.examDate)}</Typography>}
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="body2" fontWeight={700}>
                          {r.marksObtained ?? '—'}{r.totalMarks ? ` / ${r.totalMarks}` : ''}
                        </Typography>
                        {r.grade && <Chip label={r.grade} size="small" sx={{ height: 18, fontSize: 10 }} />}
                      </Box>
                    </Box>
                    {r.totalMarks ? (
                      <LinearProgress variant="determinate" value={Math.min(100, p)}
                        sx={{ mt: 0.75, height: 6, borderRadius: 3, bgcolor: '#EEE', '& .MuiLinearProgress-bar': { bgcolor: barColor(p) } }} />
                    ) : null}
                  </Box>
                );
              })}
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="caption" color="text.secondary">Total</Typography>
                <Typography variant="body2" fontWeight={700}>{totObtained} / {totMax} · {overall}%</Typography>
              </Box>
            </SectionCard>
          );
        })
      )}
    </Box>
  );
}
