import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography,
  Table, TableHead, TableRow, TableCell, TableBody, Chip, LinearProgress,
  Alert, Link, IconButton, Divider,
} from '@mui/material';
import { CloudUpload, Download, Close, CheckCircle, ErrorOutline } from '@mui/icons-material';
import { useState, useRef, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { admissionApi } from '@/api/admission.api';
import { classesApi, sectionsApi } from '@/api/admin.api';

interface Props {
  open: boolean;
  onClose: () => void;
  onImported: () => void;
}

const TEMPLATE_COLUMNS = [
  'firstName', 'lastName', 'gender', 'dateOfBirth', 'admissionNumber',
  'className', 'sectionName', 'rollNumber',
  'guardianName', 'guardianMobile', 'guardianRelation',
  'addressLine1', 'city', 'state', 'pincode',
];

const TEMPLATE_SAMPLE =
  'Aarav,Mehta,MALE,2014-05-12,ADM-2024-101,Class 5,A,12,Rakesh Mehta,9876543210,FATHER,12 MG Road,New Delhi,Delhi,110001';

type ParsedRow = Record<string, string>;
type RowResult = { row: number; name: string; ok: boolean; message?: string };

/** Minimal CSV parser handling quoted fields and commas inside quotes. */
function parseCSV(text: string): ParsedRow[] {
  const lines = text.replace(/\r/g, '').split('\n').filter((l) => l.trim() !== '');
  if (lines.length < 2) return [];
  const parseLine = (line: string): string[] => {
    const out: string[] = [];
    let cur = '', inQ = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') { if (inQ && line[i + 1] === '"') { cur += '"'; i++; } else inQ = !inQ; }
      else if (c === ',' && !inQ) { out.push(cur); cur = ''; }
      else cur += c;
    }
    out.push(cur);
    return out.map((s) => s.trim());
  };
  const headers = parseLine(lines[0]);
  return lines.slice(1).map((line) => {
    const cells = parseLine(line);
    const row: ParsedRow = {};
    headers.forEach((h, i) => { row[h] = cells[i] ?? ''; });
    return row;
  });
}

export default function StudentImportDialog({ open, onClose, onImported }: Props) {
  const { enqueueSnackbar } = useSnackbar();
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState('');
  const [parseError, setParseError] = useState('');
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<RowResult[]>([]);

  const { data: classes = [] } = useQuery<any[]>({ queryKey: ['classes'], queryFn: () => classesApi.list(), enabled: open });
  const { data: sections = [] } = useQuery<any[]>({ queryKey: ['sections-all'], queryFn: () => sectionsApi.listAll(), enabled: open });

  const resolve = useMemo(() => (className: string, sectionName: string) => {
    const cls = classes.find((c) => (c.name ?? '').toLowerCase() === (className ?? '').toLowerCase());
    if (!cls) return { classId: undefined, sectionId: undefined };
    const sec = sections.find((s) => s.classId === cls.id && (s.name ?? '').toLowerCase() === (sectionName ?? '').toLowerCase());
    return { classId: cls.id as number, sectionId: sec?.id as number | undefined };
  }, [classes, sections]);

  const reset = () => { setRows([]); setFileName(''); setParseError(''); setResults([]); setProgress(0); setImporting(false); };

  const handleFile = (file: File) => {
    setParseError(''); setResults([]);
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = parseCSV(String(reader.result));
        if (parsed.length === 0) { setParseError('No data rows found. Make sure the file has a header row and at least one student.'); return; }
        if (!('firstName' in parsed[0])) { setParseError('Missing expected columns. Download the template and match the headers exactly.'); return; }
        setRows(parsed);
        setFileName(file.name);
      } catch {
        setParseError('Could not read this file. Please upload a valid CSV.');
      }
    };
    reader.readAsText(file);
  };

  const downloadTemplate = () => {
    const csv = TEMPLATE_COLUMNS.join(',') + '\n' + TEMPLATE_SAMPLE + '\n';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'student-import-template.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const runImport = async () => {
    setImporting(true); setResults([]); setProgress(0);
    const out: RowResult[] = [];
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const name = `${r.firstName ?? ''} ${r.lastName ?? ''}`.trim();
      try {
        const { classId, sectionId } = resolve(r.className, r.sectionName);
        const [gFirst, ...gRest] = (r.guardianName ?? '').trim().split(' ');
        const payload: any = {
          firstName: r.firstName,
          lastName: r.lastName,
          gender: (r.gender || 'MALE').toUpperCase(),
          dateOfBirth: r.dateOfBirth || undefined,
          admissionNumber: r.admissionNumber || undefined,
          institutionType: 'SCHOOL',
          academicSession: '2024-2025',
          admissionDate: new Date().toISOString().split('T')[0],
          admissionType: 'FRESH',
          nationality: 'Indian',
          classId,
          sectionId,
          rollNumber: r.rollNumber || undefined,
          guardians: r.guardianName ? [{
            relation: (r.guardianRelation || 'FATHER').toUpperCase(),
            firstName: gFirst || r.guardianName,
            lastName: gRest.join(' ') || undefined,
            mobile: r.guardianMobile || undefined,
            primary: true,
          }] : [],
          currentAddress: r.addressLine1 ? {
            addressLine1: r.addressLine1,
            city: r.city || '',
            state: r.state || '',
            pincode: r.pincode || '',
          } : undefined,
          permanentSameAsCurrent: true,
        };
        await admissionApi.register(payload);
        out.push({ row: i + 2, name, ok: true });
      } catch (e: any) {
        out.push({ row: i + 2, name, ok: false, message: e?.response?.data?.message ?? 'Failed' });
      }
      setProgress(Math.round(((i + 1) / rows.length) * 100));
      setResults([...out]);
    }
    setImporting(false);
    const ok = out.filter((r) => r.ok).length;
    enqueueSnackbar(`Imported ${ok}/${rows.length} students`, { variant: ok === rows.length ? 'success' : 'warning' });
    if (ok > 0) onImported();
  };

  const close = () => { reset(); onClose(); };
  const okCount = results.filter((r) => r.ok).length;
  const done = results.length > 0 && !importing;

  return (
    <Dialog open={open} onClose={close} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h6" fontWeight={700}>Import Students</Typography>
          <Typography variant="caption" color="text.secondary">Bulk-register from a CSV file</Typography>
        </Box>
        <IconButton onClick={close}><Close /></IconButton>
      </DialogTitle>
      <Divider />
      <DialogContent>
        <input ref={fileRef} type="file" accept=".csv" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }} />

        {/* Upload zone */}
        {rows.length === 0 && (
          <Box
            onClick={() => fileRef.current?.click()}
            sx={{ mt: 1, p: 5, border: '2px dashed #D0D5D9', borderRadius: 4, textAlign: 'center', cursor: 'pointer', bgcolor: '#FAFBFC', '&:hover': { borderColor: 'primary.main', bgcolor: '#F4F7F5' } }}
          >
            <CloudUpload sx={{ fontSize: 44, color: 'primary.main' }} />
            <Typography fontWeight={600} sx={{ mt: 1 }}>Click to choose a CSV file</Typography>
            <Typography variant="caption" color="text.secondary">Columns must match the template</Typography>
            <Box sx={{ mt: 2 }}>
              <Button size="small" startIcon={<Download />} onClick={(e) => { e.stopPropagation(); downloadTemplate(); }}>
                Download template
              </Button>
            </Box>
          </Box>
        )}

        {parseError && <Alert severity="error" sx={{ mt: 2, borderRadius: 3 }}>{parseError}</Alert>}

        {/* Preview / results */}
        {rows.length > 0 && (
          <Box sx={{ mt: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" fontWeight={600}>
                {fileName} · {rows.length} student{rows.length !== 1 ? 's' : ''}
              </Typography>
              <Link component="button" variant="caption" onClick={() => { reset(); }}>Choose a different file</Link>
            </Box>

            {importing && <LinearProgress variant="determinate" value={progress} sx={{ mb: 1, borderRadius: 4, height: 7 }} />}
            {done && (
              <Alert severity={okCount === rows.length ? 'success' : 'warning'} sx={{ mb: 1, borderRadius: 3 }}>
                Imported {okCount} of {rows.length}. {rows.length - okCount > 0 ? `${rows.length - okCount} failed — see below.` : 'All good!'}
              </Alert>
            )}

            <Box sx={{ maxHeight: 320, overflowY: 'auto', border: '1px solid #EDEFF1', borderRadius: 3 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Adm. No</TableCell>
                    <TableCell>Class</TableCell>
                    <TableCell>Guardian</TableCell>
                    {results.length > 0 && <TableCell>Result</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((r, i) => {
                    const res = results.find((x) => x.row === i + 2);
                    const { classId } = resolve(r.className, r.sectionName);
                    return (
                      <TableRow key={i}>
                        <TableCell>{i + 1}</TableCell>
                        <TableCell>{r.firstName} {r.lastName}</TableCell>
                        <TableCell sx={{ fontFamily: 'monospace' }}>{r.admissionNumber || '—'}</TableCell>
                        <TableCell>
                          {r.className ? (
                            <Chip size="small" label={`${r.className}${r.sectionName ? '-' + r.sectionName : ''}`}
                              color={classId ? 'default' : 'error'} variant={classId ? 'filled' : 'outlined'} />
                          ) : '—'}
                        </TableCell>
                        <TableCell>{r.guardianName || '—'}</TableCell>
                        {results.length > 0 && (
                          <TableCell>
                            {res ? (res.ok
                              ? <Chip size="small" icon={<CheckCircle />} label="Added" color="success" />
                              : <Chip size="small" icon={<ErrorOutline />} label={res.message} color="error" variant="outlined" />
                            ) : '—'}
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Tip: a red class chip means that class/section name didn't match your Academic Setup — the student will still import but without enrollment.
            </Typography>
          </Box>
        )}
      </DialogContent>
      <Divider />
      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button onClick={close} variant="outlined">{done ? 'Done' : 'Cancel'}</Button>
        {rows.length > 0 && !done && (
          <Button variant="contained" onClick={runImport} disabled={importing}>
            {importing ? `Importing… ${progress}%` : `Import ${rows.length} student${rows.length !== 1 ? 's' : ''}`}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
