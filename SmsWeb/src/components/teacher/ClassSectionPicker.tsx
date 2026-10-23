import { Box, Chip, FormControl, InputLabel, MenuItem, Select, Typography } from '@mui/material';
import { Class as ClassIcon } from '@mui/icons-material';
import type { ClassTeacherSection } from '@/api/teacher.api';

interface Props {
  sections: ClassTeacherSection[];
  selectedId: number | null;
  onChange: (id: number) => void;
}

/**
 * Shows the teacher's current class-section. A dropdown when they are class
 * teacher of several sections; a static chip when there is just one.
 */
export function ClassSectionPicker({ sections, selectedId, onChange }: Props) {
  if (!sections.length) return null;

  const selected = sections.find((s) => s.sectionId === selectedId);

  if (sections.length === 1) {
    const s = sections[0];
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <ClassIcon fontSize="small" color="primary" />
        <Typography variant="subtitle1" fontWeight={700}>
          {s.className} · {s.sectionName}
        </Typography>
        <Chip size="small" label={`${s.studentCount} students`} variant="outlined" />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
      <FormControl size="small" sx={{ minWidth: 240 }}>
        <InputLabel>Class · Section</InputLabel>
        <Select
          label="Class · Section"
          value={selectedId ?? ''}
          onChange={(e) => onChange(Number(e.target.value))}
        >
          {sections.map((s) => (
            <MenuItem key={s.sectionId} value={s.sectionId}>
              {s.className} · {s.sectionName}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      {selected && <Chip size="small" label={`${selected.studentCount} students`} variant="outlined" />}
    </Box>
  );
}
