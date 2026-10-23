import {
  Dialog, DialogTitle, DialogContent, DialogActions, Grid, TextField,
  Button, Alert, Box, Avatar, Typography, MenuItem,
} from '@mui/material';
import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { teachersApi, EMPLOYEE_ROLES, type CreateTeacherRequest } from '@/api/teachers.api';
import { initials } from '@/utils/formatters';

interface Props {
  open: boolean;
  teacher: any | null; // null = create, object = edit
  onClose: () => void;
}

const EMPTY: CreateTeacherRequest = {
  firstName: '', lastName: '', email: '', password: '', employeeCode: '', role: 'TEACHER',
  mobile: '', qualification: '', specialization: '', joiningDate: '', experienceYears: undefined,
};

export function TeacherFormDialog({ open, teacher, onClose }: Props) {
  const qc = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const isEdit = !!teacher;

  const { register, handleSubmit, reset, control, watch, formState: { errors } } = useForm<CreateTeacherRequest>({ defaultValues: EMPTY });
  const role = watch('role');
  const isTeacher = role === 'TEACHER';

  useEffect(() => {
    if (open) {
      reset(teacher ? {
        firstName: teacher.firstName ?? '',
        lastName: teacher.lastName ?? '',
        email: teacher.email ?? '',
        employeeCode: teacher.employeeCode ?? '',
        role: teacher.role ?? 'TEACHER',
        mobile: teacher.mobile ?? '',
        qualification: teacher.qualification ?? '',
        specialization: teacher.specialization ?? '',
        joiningDate: teacher.joiningDate ?? '',
        experienceYears: teacher.experienceYears ?? undefined,
      } : EMPTY);
    }
  }, [open, teacher, reset]);

  const mutation = useMutation({
    mutationFn: (d: CreateTeacherRequest) =>
      isEdit
        ? teachersApi.update(teacher.id, { ...d, employeeCode: teacher.employeeCode })
        : teachersApi.create({ ...d, employeeCode: undefined }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teachers'] });
      enqueueSnackbar(isEdit ? 'Employee updated' : 'Employee added', { variant: 'success' });
      onClose();
    },
    onError: (e: any) => enqueueSnackbar(e?.response?.data?.message ?? 'Failed to save employee', { variant: 'error' }),
  });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ bgcolor: 'primary.main', width: 44, height: 44 }}>
            {isEdit ? initials(teacher.firstName ?? '?', teacher.lastName ?? '') : '+'}
          </Avatar>
          <Box>
            <Typography variant="h6" fontWeight={700}>{isEdit ? 'Edit Employee' : 'Add New Employee'}</Typography>
            <Typography variant="caption" color="text.secondary">
              {isEdit ? 'Update profile details' : 'Create a staff profile and login account'}
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <form onSubmit={handleSubmit((d) => mutation.mutate(d))}>
        <DialogContent>
          {mutation.isError && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 3 }}>
              {(mutation.error as any)?.response?.data?.message ?? 'Failed to save teacher'}
            </Alert>
          )}
          <Grid container spacing={2} sx={{ mt: 0 }}>
            <Grid item xs={12}>
              <Controller
                name="role"
                control={control}
                render={({ field }) => (
                  <TextField select label="Employee Role" fullWidth required disabled={isEdit}
                    {...field} value={field.value ?? 'TEACHER'}
                    helperText={isEdit ? 'Role cannot be changed after creation' : 'Determines which portal this employee sees on login'}>
                    {EMPLOYEE_ROLES.map((r) => <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>)}
                  </TextField>
                )}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField label="First Name" fullWidth required {...register('firstName', { required: 'Required' })} error={!!errors.firstName} helperText={errors.firstName?.message} />
            </Grid>
            <Grid item xs={6}>
              <TextField label="Last Name" fullWidth required {...register('lastName', { required: 'Required' })} error={!!errors.lastName} helperText={errors.lastName?.message} />
            </Grid>
            <Grid item xs={6}>
              {isEdit ? (
                <TextField label="Employee Code" fullWidth value={teacher?.employeeCode ?? ''} disabled InputProps={{ readOnly: true }} helperText=" " />
              ) : (
                <TextField label="Employee Code" fullWidth value="Auto-generated (EMP-NNN)" disabled InputProps={{ readOnly: true }} helperText="Assigned automatically on save" />
              )}
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Email" type="email" fullWidth required disabled={isEdit}
                {...register('email', isEdit ? {} : {
                  required: 'Email is required',
                  pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email' },
                })}
                error={!!errors.email}
                helperText={isEdit ? 'Email cannot be changed' : (errors.email?.message ?? 'Contact email — login ID is auto-generated and the temp password is emailed here')}
              />
            </Grid>
            {!isEdit && (
              <Grid item xs={6}>
                <TextField label="Password (optional)" type="password" fullWidth {...register('password')}
                  helperText="Leave blank → a temporary password is emailed to the employee" />
              </Grid>
            )}
            <Grid item xs={6}>
              <TextField
                label="Mobile" fullWidth required
                {...register('mobile', {
                  required: 'Mobile number is required',
                  pattern: { value: /^[6-9]\d{9}$/, message: 'Enter a valid 10-digit mobile number' },
                })}
                error={!!errors.mobile}
                helperText={errors.mobile?.message}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField label="Joining Date" type="date" fullWidth required InputLabelProps={{ shrink: true }} {...register('joiningDate', { required: 'Required' })} error={!!errors.joiningDate} helperText={errors.joiningDate?.message} />
            </Grid>
            {isTeacher && (
              <>
                <Grid item xs={6}>
                  <TextField label="Qualification" fullWidth {...register('qualification')} />
                </Grid>
                <Grid item xs={6}>
                  <TextField label="Specialization" fullWidth {...register('specialization')} />
                </Grid>
                <Grid item xs={6}>
                  <TextField label="Experience (years)" type="number" fullWidth {...register('experienceYears', { valueAsNumber: true })} />
                </Grid>
              </>
            )}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={onClose} variant="outlined">Cancel</Button>
          <Button type="submit" variant="contained" disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Employee'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
