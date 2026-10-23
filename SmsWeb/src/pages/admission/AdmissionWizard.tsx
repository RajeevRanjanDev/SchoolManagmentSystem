import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Stepper, Step, StepLabel, Grid, TextField, MenuItem,
  Typography, Divider, Alert, CircularProgress, Box, Chip,
  FormControlLabel, Checkbox, IconButton, Stack, Paper,
} from '@mui/material';
import { Add, Delete, School } from '@mui/icons-material';
import { useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { admissionApi, campusesApi, transportRoutesApi } from '@/api/admission.api';
import { useQuery } from '@tanstack/react-query';
import { classesApi, sectionsApi } from '@/api/admin.api';
import { feeTemplatesApi } from '@/api/fees.api';

const STEPS = [
  'Basic Info',
  'Academic Info',
  'Guardians',
  'Address',
  'Medical & Extras',
];

const INSTITUTION_TYPES = [
  { value: 'SCHOOL',             label: 'School' },
  { value: 'COLLEGE',            label: 'College' },
  { value: 'UNIVERSITY',         label: 'University' },
  { value: 'COACHING_INSTITUTE', label: 'Coaching Institute' },
  { value: 'TRAINING_INSTITUTE', label: 'Training Institute' },
];

const GENDERS       = ['MALE', 'FEMALE', 'OTHER'];
const BLOOD_GROUPS  = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
const CATEGORIES    = ['GENERAL', 'OBC', 'SC', 'ST', 'EWS', 'NRI', 'OTHER'];
const ADMISSION_TYPES = ['FRESH', 'LATERAL_ENTRY', 'TRANSFER', 'RE_ADMISSION', 'MANAGEMENT_QUOTA', 'MERIT'];
const GUARDIAN_RELATIONS = ['FATHER', 'MOTHER', 'GRANDPARENT', 'UNCLE', 'AUNT', 'SIBLING', 'LEGAL_GUARDIAN', 'OTHER'];

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

/** Recursively drop empty strings / null so optional @Pattern fields aren't sent as "" (which fails regex). */
function pruneEmpty(value: any): any {
  if (Array.isArray(value)) {
    return value.map(pruneEmpty).filter((v) => v !== undefined && !(v && typeof v === 'object' && Object.keys(v).length === 0));
  }
  if (value && typeof value === 'object') {
    const out: any = {};
    for (const [k, v] of Object.entries(value)) {
      const cleaned = pruneEmpty(v);
      if (cleaned === '' || cleaned === null || cleaned === undefined) continue;
      out[k] = cleaned;
    }
    return out;
  }
  return typeof value === 'string' ? value.trim() : value;
}

const FIELD_LABELS: Record<string, string> = {
  firstName: 'Student — first name',
  lastName: 'Student — last name',
  gender: 'Student — gender',
  dateOfBirth: 'Student — date of birth',
  academicSession: 'Academic session',
  admissionDate: 'Admission date',
  mobile: 'Student mobile (must be a valid 10-digit number)',
  aadhaarNumber: 'Aadhaar number (12 digits)',
  'currentAddress.addressLine1': 'Address line 1',
  'currentAddress.city': 'City',
  'currentAddress.state': 'State',
  schoolClassAndSectionPresent: 'Class & Section',
  classId: 'Class',
  sectionId: 'Section',
};

function labelFor(key: string): string {
  const g = key.match(/^guardians\[(\d+)\]\.(\w+)/);
  if (g) {
    const field = g[2].replace(/([A-Z])/g, ' $1').toLowerCase();
    return `Guardian ${Number(g[1]) + 1} — ${field}`;
  }
  return FIELD_LABELS[key] ?? key;
}

/** Turn a backend validation-error response into a readable list of messages. */
function extractErrors(error: any): string[] {
  const resp = error?.response?.data;
  const fieldMap = resp?.data;
  if (fieldMap && typeof fieldMap === 'object') {
    return Object.entries(fieldMap).map(([k, v]) => `${labelFor(k)}: ${v}`);
  }
  return [resp?.message ?? 'Registration failed. Please check the form.'];
}

export default function AdmissionWizard({ open, onClose, onSuccess }: Props) {
  const [step, setStep] = useState(0);

  // Student must be at least 2 years old → DOB on or before (today − 2 years).
  const maxDob = (() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 2);
    return d.toISOString().slice(0, 10);
  })();

  const { register, handleSubmit, control, watch, setValue, reset, trigger, formState: { errors } } = useForm<any>({
    defaultValues: {
      institutionType: 'SCHOOL',
      nationality: 'Indian',
      admissionType: 'FRESH',
      permanentSameAsCurrent: true,
      guardians: [{ relation: 'FATHER', firstName: '', mobile: '', primary: true }],
    },
  });

  const { fields: guardianFields, append: addGuardian, remove: removeGuardian } = useFieldArray({
    control, name: 'guardians',
  });

  const institutionType = watch('institutionType');
  const sameAddress = watch('permanentSameAsCurrent');
  const selectedClass = watch('classId');

  const { data: classes = [] } = useQuery<any[]>({
    queryKey: ['classes'],
    queryFn: () => classesApi.list(),
    enabled: open && institutionType === 'SCHOOL',
    staleTime: 60_000,
  });

  const { data: sections = [] } = useQuery<any[]>({
    queryKey: ['sections-by-class', selectedClass],
    queryFn: () => sectionsApi.listByClass(Number(selectedClass)),
    enabled: !!selectedClass,
    staleTime: 60_000,
  });

  const { data: campuses = [] } = useQuery<any[]>({
    queryKey: ['campuses'],
    queryFn: campusesApi.list,
    enabled: open,
    staleTime: 60_000,
  });

  const { data: transportRoutes = [] } = useQuery<any[]>({
    queryKey: ['transport-routes'],
    queryFn: transportRoutesApi.list,
    enabled: open,
    staleTime: 60_000,
  });

  const { data: feeTemplates = [] } = useQuery<any[]>({
    queryKey: ['fee-templates'],
    queryFn: () => feeTemplatesApi.list(),
    enabled: open,
    staleTime: 60_000,
  });

  // When a route is picked, its stops drive the Stop Name dropdown.
  const selectedRouteId = watch('transportInfo.routeId');
  const selectedRoute = (transportRoutes as any[]).find((r) => String(r.id) === String(selectedRouteId));
  const routeStops: any[] = selectedRoute?.stops ?? [];

  const mutation = useMutation({
    mutationFn: admissionApi.register,
    onSuccess: () => { reset(); setStep(0); onSuccess(); },
  });

  const onSubmit = (data: any) => mutation.mutate(pruneEmpty(data));

  // Fields validated before leaving each step (so errors show inline, not on a hidden step).
  const stepFields: string[][] = [
    ['firstName', 'lastName', 'gender', 'dateOfBirth'],
    ['academicSession', 'admissionDate', 'feeTemplateId', ...(institutionType === 'SCHOOL' ? ['classId', 'sectionId'] : [])],
    ['guardians'],
    ['currentAddress.addressLine1', 'currentAddress.city', 'currentAddress.state'],
    [],
  ];

  const next = async () => {
    const ok = await trigger(stepFields[step] as any, { shouldFocus: true });
    if (ok) setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const handleClose = () => { reset(); setStep(0); onClose(); };

  const isSchool    = institutionType === 'SCHOOL';
  const isCollegeUni = ['COLLEGE', 'UNIVERSITY'].includes(institutionType);
  const isCoaching  = ['COACHING_INSTITUTE', 'TRAINING_INSTITUTE'].includes(institutionType);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth
      PaperProps={{ sx: { borderRadius: 3, height: '90vh' } }}>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <School color="primary" />
          <Box>
            <Typography variant="h6" fontWeight={700}>New Student Admission</Typography>
            <Typography variant="caption" color="text.secondary">
              Step {step + 1} of {STEPS.length} — {STEPS[step]}
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <Divider />

      <Box sx={{ px: 3, pt: 2 }}>
        <Stepper activeStep={step} alternativeLabel>
          {STEPS.map((label) => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}
        </Stepper>
      </Box>

      <form
        onSubmit={handleSubmit(onSubmit)}
        onKeyDown={(e) => {
          // Submit only via the "Complete Registration" button, never on Enter —
          // (textareas still get their newline). Prevents accidental early save.
          const el = e.target as HTMLElement;
          if (e.key === 'Enter' && el.tagName !== 'TEXTAREA') e.preventDefault();
        }}
      >
        <DialogContent sx={{ py: 3, overflowY: 'auto' }}>
          {mutation.isError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              <Typography variant="body2" fontWeight={700} sx={{ mb: 0.5 }}>Please fix the following:</Typography>
              <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
                {extractErrors(mutation.error).map((msg, i) => (
                  <li key={i}><Typography variant="body2">{msg}</Typography></li>
                ))}
              </Box>
            </Alert>
          )}

          {/* ── Step 0: Basic Info ── */}
          {step === 0 && (
            <Grid container spacing={2.5}>
              <Grid item xs={12}><Typography variant="subtitle2" color="text.secondary">Personal Information</Typography></Grid>
              <Grid item xs={4}><TextField label="First Name *" fullWidth {...register('firstName', { required: true })} error={!!errors.firstName} /></Grid>
              <Grid item xs={4}><TextField label="Middle Name" fullWidth {...register('middleName')} /></Grid>
              <Grid item xs={4}><TextField label="Last Name *" fullWidth {...register('lastName', { required: true })} error={!!errors.lastName} /></Grid>
              <Grid item xs={4}>
                <Controller name="gender" control={control} rules={{ required: true }}
                  render={({ field }) => (
                    <TextField select label="Gender *" fullWidth {...field} value={field.value ?? ''} error={!!errors.gender}>
                      {GENDERS.map((g) => <MenuItem key={g} value={g}>{g}</MenuItem>)}
                    </TextField>
                  )}
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  label="Date of Birth *" type="date" fullWidth InputLabelProps={{ shrink: true }}
                  inputProps={{ max: maxDob }}
                  {...register('dateOfBirth', {
                    required: 'Date of birth is required',
                    validate: (v: string) => !v || v <= maxDob || 'Student must be at least 2 years old',
                  })}
                  error={!!(errors as any).dateOfBirth}
                  helperText={(errors as any).dateOfBirth?.message}
                />
              </Grid>
              <Grid item xs={4}>
                <Controller name="bloodGroup" control={control}
                  render={({ field }) => (
                    <TextField select label="Blood Group" fullWidth {...field} value={field.value ?? ''}>
                      <MenuItem value="">— Unknown —</MenuItem>
                      {BLOOD_GROUPS.map((b) => <MenuItem key={b} value={b}>{b}</MenuItem>)}
                    </TextField>
                  )}
                />
              </Grid>
              <Grid item xs={4}>
                <Controller name="category" control={control}
                  render={({ field }) => (
                    <TextField select label="Category" fullWidth {...field} value={field.value ?? ''}>
                      {CATEGORIES.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                    </TextField>
                  )}
                />
              </Grid>
              <Grid item xs={4}><TextField label="Nationality" fullWidth {...register('nationality')} /></Grid>
              <Grid item xs={4}><TextField label="Religion" fullWidth {...register('religion')} /></Grid>
              <Grid item xs={12}><Divider><Typography variant="caption" color="text.secondary">Contact</Typography></Divider></Grid>
              <Grid item xs={4}>
                <TextField
                  label="Mobile *" fullWidth
                  {...register('mobile', {
                    required: 'Mobile number is required',
                    pattern: { value: /^[6-9]\d{9}$/, message: 'Enter a valid 10-digit mobile number' },
                  })}
                  error={!!(errors as any).mobile}
                  helperText={(errors as any).mobile?.message}
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  label="Email *" fullWidth
                  {...register('email', {
                    required: 'Email is required',
                    pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email' },
                  })}
                  error={!!(errors as any).email}
                  helperText={(errors as any).email?.message}
                />
              </Grid>
              <Grid item xs={4}><TextField label="Aadhaar Number" fullWidth inputProps={{ maxLength: 12 }} {...register('aadhaarNumber')} /></Grid>
              <Grid item xs={4}>
                <TextField label="Admission Number" fullWidth value="Auto-generated (ADM-YYYY-NNNNNN)" disabled
                  helperText="Assigned automatically on save" InputProps={{ readOnly: true }} />
              </Grid>
              <Grid item xs={4}>
                <Controller name="campusId" control={control}
                  render={({ field }) => (
                    <TextField select label="Campus / Branch" fullWidth {...field} value={field.value ?? ''}>
                      <MenuItem value="">— Main Campus —</MenuItem>
                      {(campuses as any[]).map((c: any) => (
                        <MenuItem key={c.id} value={c.id}>{c.name} {c.code ? `(${c.code})` : ''}</MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Grid>
            </Grid>
          )}

          {/* ── Step 1: Academic Info ── */}
          {step === 1 && (
            <Grid container spacing={2.5}>
              <Grid item xs={12}><Typography variant="subtitle2" color="text.secondary">Academic Details</Typography></Grid>
              <Grid item xs={6}>
                <Controller name="institutionType" control={control}
                  render={({ field }) => (
                    <TextField select label="Institution Type *" fullWidth {...field}>
                      {INSTITUTION_TYPES.map((t) => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
                    </TextField>
                  )}
                />
              </Grid>
              <Grid item xs={6}><TextField label="Academic Session *" fullWidth defaultValue="2024-2025" {...register('academicSession', { required: true })} error={!!errors.academicSession} /></Grid>
              <Grid item xs={6}><TextField label="Admission Date *" type="date" fullWidth InputLabelProps={{ shrink: true }} {...register('admissionDate', { required: true })} error={!!errors.admissionDate} /></Grid>
              <Grid item xs={6}>
                <Controller name="feeTemplateId" control={control} rules={{ required: 'Fee template is required' }}
                  render={({ field }) => (
                    <TextField select label="Fee Template *" fullWidth required {...field} value={field.value ?? ''}
                      error={!!(errors as any).feeTemplateId}
                      helperText={(errors as any).feeTemplateId?.message ?? 'Student will be billed from this template'}>
                      {(feeTemplates as any[]).filter((t) => t.status !== 'INACTIVE').map((t) => (
                        <MenuItem key={t.id} value={t.id}>{t.name} — ₹{t.amount} ({t.feeType})</MenuItem>
                      ))}
                    </TextField>
                  )} />
              </Grid>
              <Grid item xs={6}>
                <Controller name="admissionType" control={control}
                  render={({ field }) => (
                    <TextField select label="Admission Type" fullWidth {...field} value={field.value ?? ''}>
                      {ADMISSION_TYPES.map((t) => <MenuItem key={t} value={t}>{t.replace('_', ' ')}</MenuItem>)}
                    </TextField>
                  )}
                />
              </Grid>
              <Grid item xs={12}><TextField label="Previous Institution" fullWidth {...register('previousInstitution')} /></Grid>

              {/* School fields */}
              {isSchool && (
                <>
                  <Grid item xs={12}><Divider><Chip label="School" size="small" /></Divider></Grid>
                  <Grid item xs={4}>
                    <Controller name="classId" control={control}
                      rules={{ required: isSchool ? 'Class is required' : false }}
                      render={({ field }) => (
                        <TextField select label="Class *" fullWidth {...field} value={field.value ?? ''}
                          error={!!errors.classId} helperText={(errors.classId as any)?.message}>
                          {(classes as any[]).map((c: any) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                        </TextField>
                      )}
                    />
                  </Grid>
                  <Grid item xs={4}>
                    <Controller name="sectionId" control={control}
                      rules={{ required: isSchool ? 'Section is required' : false }}
                      render={({ field }) => (
                        <TextField select label="Section *" fullWidth disabled={!selectedClass} {...field} value={field.value ?? ''}
                          error={!!errors.sectionId} helperText={(errors.sectionId as any)?.message}>
                          {(sections as any[]).map((s: any) => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
                        </TextField>
                      )}
                    />
                  </Grid>
                  <Grid item xs={4}><TextField label="Roll Number" fullWidth {...register('rollNumber')} /></Grid>
                </>
              )}

              {/* College / University fields */}
              {isCollegeUni && (
                <>
                  <Grid item xs={12}><Divider><Chip label="College / University" size="small" /></Divider></Grid>
                  <Grid item xs={4}><TextField label="Program" fullWidth placeholder="B.Tech / M.Sc / MBA" {...register('program')} /></Grid>
                  <Grid item xs={4}><TextField label="Course" fullWidth {...register('course')} /></Grid>
                  <Grid item xs={4}><TextField label="Department" fullWidth {...register('department')} /></Grid>
                  <Grid item xs={4}><TextField label="Branch" fullWidth {...register('branch')} /></Grid>
                  <Grid item xs={4}><TextField label="Semester" type="number" fullWidth {...register('semester')} /></Grid>
                  <Grid item xs={4}><TextField label="Year of Study" type="number" fullWidth {...register('yearOfStudy')} /></Grid>
                  <Grid item xs={6}><TextField label="Registration Number" fullWidth {...register('registrationNumber')} /></Grid>
                  <Grid item xs={6}><TextField label="University Roll Number" fullWidth {...register('universityRollNumber')} /></Grid>
                </>
              )}

              {/* Coaching / Training fields */}
              {isCoaching && (
                <>
                  <Grid item xs={12}><Divider><Chip label="Coaching / Training" size="small" /></Divider></Grid>
                  <Grid item xs={4}><TextField label="Batch Name" fullWidth {...register('batchName')} /></Grid>
                  <Grid item xs={4}><TextField label="Batch Start Date" type="date" fullWidth InputLabelProps={{ shrink: true }} {...register('batchStartDate')} /></Grid>
                  <Grid item xs={4}><TextField label="Batch End Date" type="date" fullWidth InputLabelProps={{ shrink: true }} {...register('batchEndDate')} /></Grid>
                </>
              )}
            </Grid>
          )}

          {/* ── Step 2: Guardians ── */}
          {step === 2 && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">Guardian / Parent Information</Typography>
                <Button size="small" startIcon={<Add />}
                  onClick={() => addGuardian({ relation: 'MOTHER', firstName: '', mobile: '', primary: false })}>
                  Add Guardian
                </Button>
              </Box>
              <Stack spacing={2}>
                {guardianFields.map((field, i) => (
                  <Paper key={field.id} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                      <Typography variant="body2" fontWeight={600}>Guardian {i + 1}</Typography>
                      {i > 0 && (
                        <IconButton size="small" color="error" onClick={() => removeGuardian(i)}>
                          <Delete fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                    <Grid container spacing={2}>
                      <Grid item xs={4}>
                        <Controller name={`guardians.${i}.relation`} control={control}
                          render={({ field }) => (
                            <TextField select label="Relation *" fullWidth {...field} value={field.value ?? ''}>
                              {GUARDIAN_RELATIONS.map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
                            </TextField>
                          )}
                        />
                      </Grid>
                      <Grid item xs={4}><TextField label="First Name *" fullWidth {...register(`guardians.${i}.firstName`, { required: true })} /></Grid>
                      <Grid item xs={4}><TextField label="Last Name" fullWidth {...register(`guardians.${i}.lastName`)} /></Grid>
                      <Grid item xs={4}><TextField label="Mobile" fullWidth {...register(`guardians.${i}.mobile`)} /></Grid>
                      <Grid item xs={4}><TextField label="Email" fullWidth {...register(`guardians.${i}.email`)} /></Grid>
                      <Grid item xs={4}><TextField label="Occupation" fullWidth {...register(`guardians.${i}.occupation`)} /></Grid>
                      <Grid item xs={4}><TextField label="Annual Income (₹)" type="number" fullWidth {...register(`guardians.${i}.annualIncome`)} /></Grid>
                      <Grid item xs={4}><TextField label="Qualification" fullWidth {...register(`guardians.${i}.qualification`)} /></Grid>
                      <Grid item xs={4}>
                        <Controller name={`guardians.${i}.primary`} control={control}
                          render={({ field }) => (
                            <FormControlLabel control={<Checkbox checked={!!field.value} onChange={field.onChange} />} label="Primary Contact" />
                          )}
                        />
                      </Grid>
                    </Grid>
                  </Paper>
                ))}
              </Stack>
            </Box>
          )}

          {/* ── Step 3: Address ── */}
          {step === 3 && (
            <Grid container spacing={2.5}>
              <Grid item xs={12}><Typography variant="subtitle2" color="text.secondary">Current Address</Typography></Grid>
              <Grid item xs={12}><TextField label="Address Line 1 *" fullWidth {...register('currentAddress.addressLine1', { required: true })} error={!!(errors as any).currentAddress?.addressLine1} /></Grid>
              <Grid item xs={12}><TextField label="Address Line 2" fullWidth {...register('currentAddress.addressLine2')} /></Grid>
              <Grid item xs={4}><TextField label="City *" fullWidth {...register('currentAddress.city', { required: true })} /></Grid>
              <Grid item xs={4}><TextField label="State *" fullWidth {...register('currentAddress.state', { required: true })} /></Grid>
              <Grid item xs={4}><TextField label="Pincode" fullWidth {...register('currentAddress.pincode')} /></Grid>

              <Grid item xs={12}>
                <Controller name="permanentSameAsCurrent" control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={<Checkbox checked={!!field.value} onChange={field.onChange} />}
                      label="Permanent address same as current address"
                    />
                  )}
                />
              </Grid>

              {!sameAddress && (
                <>
                  <Grid item xs={12}><Divider><Typography variant="caption" color="text.secondary">Permanent Address</Typography></Divider></Grid>
                  <Grid item xs={12}><TextField label="Address Line 1" fullWidth {...register('permanentAddress.addressLine1')} /></Grid>
                  <Grid item xs={12}><TextField label="Address Line 2" fullWidth {...register('permanentAddress.addressLine2')} /></Grid>
                  <Grid item xs={4}><TextField label="City" fullWidth {...register('permanentAddress.city')} /></Grid>
                  <Grid item xs={4}><TextField label="State" fullWidth {...register('permanentAddress.state')} /></Grid>
                  <Grid item xs={4}><TextField label="Pincode" fullWidth {...register('permanentAddress.pincode')} /></Grid>
                </>
              )}
            </Grid>
          )}

          {/* ── Step 4: Medical & Extras ── */}
          {step === 4 && (
            <Grid container spacing={2.5}>
              <Grid item xs={12}><Typography variant="subtitle2" color="text.secondary">Medical Information (Optional)</Typography></Grid>
              <Grid item xs={6}><TextField label="Medical Conditions" fullWidth multiline rows={2} {...register('medicalInfo.medicalConditions')} /></Grid>
              <Grid item xs={6}><TextField label="Allergies" fullWidth multiline rows={2} {...register('medicalInfo.allergies')} /></Grid>
              <Grid item xs={6}><TextField label="Disability Details" fullWidth {...register('medicalInfo.disabilityDetails')} /></Grid>
              <Grid item xs={6}><TextField label="Emergency Medical Notes" fullWidth {...register('medicalInfo.emergencyMedicalNotes')} /></Grid>
              <Grid item xs={6}><TextField label="Family Doctor Name" fullWidth {...register('medicalInfo.familyDoctorName')} /></Grid>
              <Grid item xs={6}><TextField label="Family Doctor Mobile" fullWidth {...register('medicalInfo.familyDoctorMobile')} /></Grid>

              <Grid item xs={12}><Divider><Typography variant="caption" color="text.secondary">Transport</Typography></Divider></Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={<Checkbox {...register('transportInfo.transportRequired')} />}
                  label="Transport required"
                />
              </Grid>
              <Grid item xs={6}>
                <Controller name="transportInfo.routeId" control={control}
                  render={({ field }) => (
                    <TextField select label="Route" fullWidth {...field} value={field.value ?? ''}
                      onChange={(e) => {
                        field.onChange(e);
                        const r = (transportRoutes as any[]).find((x) => String(x.id) === String(e.target.value));
                        // Keep routeName in sync and clear any stop from a previous route.
                        setValue('transportInfo.routeName', r?.routeName ?? '');
                        setValue('transportInfo.stopName', '');
                      }}>
                      <MenuItem value="">— No route —</MenuItem>
                      {(transportRoutes as any[]).map((r: any) => (
                        <MenuItem key={r.id} value={r.id}>{r.routeName}{r.routeNumber ? ` (${r.routeNumber})` : ''}</MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Grid>
              <Grid item xs={6}>
                <Controller name="transportInfo.stopName" control={control}
                  render={({ field }) => (
                    routeStops.length > 0 ? (
                      <TextField select label="Stop Name" fullWidth {...field} value={field.value ?? ''}
                        helperText="Stops from the selected route (pickup time comes from the stop)">
                        {routeStops.map((s: any) => (
                          <MenuItem key={s.id ?? s.stopName} value={s.stopName}>
                            {s.stopName}{s.pickupTime ? ` · ${s.pickupTime}` : ''}
                          </MenuItem>
                        ))}
                      </TextField>
                    ) : (
                      <TextField label="Stop Name" fullWidth {...field} value={field.value ?? ''}
                        helperText={selectedRouteId ? 'This route has no stops — type one' : 'Select a route first'} />
                    )
                  )}
                />
              </Grid>
              <Grid item xs={6}>
                <Controller name="transportInfo.transportType" control={control}
                  render={({ field }) => (
                    <TextField select label="Transport Type" fullWidth {...field} value={field.value ?? ''}>
                      {['MORNING','EVENING','BOTH'].map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                    </TextField>
                  )}
                />
              </Grid>

              <Grid item xs={12}><Divider><Typography variant="caption" color="text.secondary">Hostel</Typography></Divider></Grid>
              <Grid item xs={4}><TextField label="Hostel Name" fullWidth {...register('hostelInfo.hostelName')} /></Grid>
              <Grid item xs={4}><TextField label="Room Number" fullWidth {...register('hostelInfo.roomNumber')} /></Grid>
              <Grid item xs={4}>
                <Controller name="hostelInfo.hostelType" control={control}
                  render={({ field }) => (
                    <TextField select label="Hostel Type" fullWidth {...field} value={field.value ?? ''}>
                      {['BOYS', 'GIRLS', 'MIXED'].map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                    </TextField>
                  )}
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>

        <Divider />

        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button type="button" onClick={handleClose} variant="outlined" color="inherit">Cancel</Button>
          <Box sx={{ flex: 1 }} />
          {step > 0 && <Button type="button" onClick={back} variant="outlined">Back</Button>}
          {step < STEPS.length - 1 ? (
            <Button type="button" onClick={next} variant="contained">Next</Button>
          ) : (
            <Button type="submit" variant="contained" color="success" disabled={mutation.isPending}
              startIcon={mutation.isPending ? <CircularProgress size={16} color="inherit" /> : undefined}>
              {mutation.isPending ? 'Registering...' : 'Complete Registration'}
            </Button>
          )}
        </DialogActions>
      </form>
    </Dialog>
  );
}
