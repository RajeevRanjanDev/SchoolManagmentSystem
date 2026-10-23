import {
  Box, Card, Typography, CircularProgress, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, Avatar, Dialog, DialogTitle,
  DialogContent, DialogActions, Button, Grid, Divider,
} from '@mui/material';
import { Groups, Person } from '@mui/icons-material';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { attendanceApi } from '@/api/attendance.api';
import { teacherApi } from '@/api/teacher.api';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { useMyClassSections } from '@/hooks/useMyClassSections';
import { ClassSectionPicker } from '@/components/teacher/ClassSectionPicker';
import { fmtDate } from '@/utils/formatters';

export default function MyClassPage() {
  const { sections, selected, selectedId, setSelectedId, isLoading, hasNone } = useMyClassSections();
  const [profile, setProfile] = useState<any | null>(null);

  const { data: roster = [], isLoading: loadingRoster } = useQuery<any[]>({
    queryKey: ['teacher-roster', selectedId],
    queryFn: () => attendanceApi.getSectionStudents(selectedId as number),
    enabled: !!selectedId,
  });

  // Fuller profile (guardians, address, details) loaded when a student is opened.
  const { data: card, isLoading: loadingCard } = useQuery<any>({
    queryKey: ['teacher-student-card', profile?.id],
    queryFn: () => teacherApi.getStudentCard(profile.id),
    enabled: !!profile?.id,
  });

  const initials = (f = '', l = '') => `${f[0] ?? ''}${l[0] ?? ''}`.toUpperCase();

  return (
    <Box>
      <PageHeader
        title="My Class"
        subtitle="Your class roster and student profiles (read-only)"
        crumbs={[{ label: 'Dashboard', path: '/' }, { label: 'My Class' }]}
      />

      {isLoading ? (
        <Box sx={{ textAlign: 'center', py: 6 }}><CircularProgress /></Box>
      ) : hasNone ? (
        <Card><EmptyState title="No class assigned" description="You are not set as class teacher of any section yet. Ask your admin to assign you." icon={<Groups sx={{ fontSize: 64 }} />} /></Card>
      ) : (
        <>
          <Card sx={{ p: 2, mb: 3 }}>
            <ClassSectionPicker sections={sections} selectedId={selectedId} onChange={setSelectedId} />
          </Card>

          <Card>
            {loadingRoster ? (
              <Box sx={{ textAlign: 'center', py: 6 }}><CircularProgress /></Box>
            ) : roster.length === 0 ? (
              <EmptyState title="No students" description="This section has no enrolled students." icon={<Groups sx={{ fontSize: 64 }} />} />
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Roll</TableCell>
                      <TableCell>Student</TableCell>
                      <TableCell>Admission No.</TableCell>
                      <TableCell align="right">Profile</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {roster.map((s) => (
                      <TableRow key={s.id} hover sx={{ cursor: 'pointer' }} onClick={() => setProfile(s)}>
                        <TableCell>{s.rollNumber ? `#${s.rollNumber}` : '—'}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                            <Avatar sx={{ width: 32, height: 32, fontSize: 13, bgcolor: '#E7F6EA', color: '#0C831F' }}>
                              {initials(s.firstName, s.lastName)}
                            </Avatar>
                            <Typography variant="body2" fontWeight={600}>{s.firstName} {s.lastName}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell>{s.admissionNumber}</TableCell>
                        <TableCell align="right">
                          <Button size="small" startIcon={<Person />} onClick={(e) => { e.stopPropagation(); setProfile(s); }}>
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Card>
        </>
      )}

      <Dialog open={profile !== null} onClose={() => setProfile(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle fontWeight={700}>Student Profile</DialogTitle>
        <DialogContent>
          {profile && (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Avatar sx={{ width: 56, height: 56, bgcolor: '#E7F6EA', color: '#0C831F', fontWeight: 700 }}>
                  {initials(profile.firstName, profile.lastName)}
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight={700}>{profile.firstName} {profile.lastName}</Typography>
                  <Chip size="small" label={selected ? `${selected.className} · ${selected.sectionName}` : ''} variant="outlined" />
                </Box>
              </Box>

              <Divider sx={{ mb: 1.5 }} />
              <Typography variant="caption" fontWeight={700} color="text.secondary">BASIC DETAILS</Typography>
              <Grid container spacing={1.5} sx={{ mb: 2, mt: 0 }}>
                {[
                  ['Roll Number', profile.rollNumber ? `#${profile.rollNumber}` : '—'],
                  ['Admission Number', card?.admissionNumber ?? profile.admissionNumber ?? '—'],
                  ['Class', card?.className ?? selected?.className ?? '—'],
                  ['Section', card?.sectionName ?? selected?.sectionName ?? '—'],
                  ['Date of Birth', card?.dateOfBirth ? fmtDate(card.dateOfBirth) : '—'],
                  ['Gender', card?.gender ?? '—'],
                  ['Blood Group', card?.bloodGroup ?? '—'],
                  ['Category', card?.category ?? '—'],
                  ['Mobile', card?.mobile ?? '—'],
                  ['Email', card?.email ?? '—'],
                ].map(([label, value]) => (
                  <Grid item xs={6} key={label as string}>
                    <Typography variant="caption" color="text.secondary">{label}</Typography>
                    <Typography variant="body2" fontWeight={600} sx={{ wordBreak: 'break-word' }}>{value as string}</Typography>
                  </Grid>
                ))}
              </Grid>

              <Divider sx={{ mb: 1.5 }} />
              <Typography variant="caption" fontWeight={700} color="text.secondary">ADDRESS</Typography>
              <Typography variant="body2" sx={{ mb: 0.5, mt: 0.5 }}>
                {card?.currentAddress || (loadingCard ? 'Loading…' : '—')}
              </Typography>
              {card?.permanentAddress && card.permanentAddress !== card.currentAddress && (
                <Typography variant="caption" color="text.secondary">Permanent: {card.permanentAddress}</Typography>
              )}

              <Divider sx={{ my: 1.5 }} />
              <Typography variant="caption" fontWeight={700} color="text.secondary">
                GUARDIANS {card?.guardians?.length ? `(${card.guardians.length})` : ''}
              </Typography>
              {loadingCard ? (
                <Box sx={{ py: 1 }}><CircularProgress size={18} /></Box>
              ) : card?.guardians?.length ? (
                <Box sx={{ mt: 0.5 }}>
                  {card.guardians.map((g: any, i: number) => (
                    <Box key={i} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 0.75, borderBottom: '1px solid #F2F2F2', '&:last-child': { borderBottom: 'none' } }}>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>{g.name || '—'}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {g.relation ?? 'Guardian'}{g.email ? ` · ${g.email}` : ''}
                        </Typography>
                      </Box>
                      <Typography variant="body2" fontWeight={700} sx={{ color: 'primary.main' }}>
                        {g.mobile || '—'}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="text.disabled" sx={{ mt: 0.5 }}>No guardian details.</Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setProfile(null)} variant="outlined">Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
