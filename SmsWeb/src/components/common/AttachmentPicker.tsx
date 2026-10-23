import { Box, Button, Chip, CircularProgress, Typography } from '@mui/material';
import { AttachFile, Close, InsertDriveFile } from '@mui/icons-material';
import { useRef, useState } from 'react';
import { useSnackbar } from 'notistack';
import { attachmentsApi } from '@/api/attachments.api';

export interface AttachmentValue {
  url: string;
  name: string;
}

/** Upload widget: pick a PDF/image, uploads it, and reports {url, name}. */
export function AttachmentPicker({
  value,
  onChange,
  label = 'Attach PDF / image',
}: {
  value?: AttachmentValue | null;
  onChange: (v: AttachmentValue | null) => void;
  label?: string;
}) {
  const { enqueueSnackbar } = useSnackbar();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const pick = () => inputRef.current?.click();

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    try {
      const up = await attachmentsApi.upload(file);
      onChange({ url: up.url, name: up.fileName });
    } catch (err: any) {
      enqueueSnackbar(err?.response?.data?.message ?? 'Could not upload file', { variant: 'error' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Box>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,image/png,image/jpeg,image/webp,image/gif"
        hidden
        onChange={onFile}
      />
      {value ? (
        <Chip
          icon={<InsertDriveFile />}
          label={value.name}
          onDelete={() => onChange(null)}
          deleteIcon={<Close />}
          variant="outlined"
          sx={{ maxWidth: '100%' }}
        />
      ) : (
        <Button
          size="small"
          variant="outlined"
          startIcon={uploading ? <CircularProgress size={16} /> : <AttachFile />}
          onClick={pick}
          disabled={uploading}
        >
          {uploading ? 'Uploading…' : label}
        </Button>
      )}
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
        PDF or image, up to 10 MB.
      </Typography>
    </Box>
  );
}

/** Download chip: shown to recipients to open an attachment. */
export function AttachmentChip({ url, name }: { url?: string | null; name?: string | null }) {
  const { enqueueSnackbar } = useSnackbar();
  if (!url) return null;
  return (
    <Chip
      size="small"
      icon={<InsertDriveFile />}
      label={name || 'Attachment'}
      variant="outlined"
      clickable
      onClick={async () => {
        try {
          await attachmentsApi.open(url, name || undefined);
        } catch {
          enqueueSnackbar('Could not open attachment', { variant: 'error' });
        }
      }}
      sx={{ maxWidth: '100%' }}
    />
  );
}
