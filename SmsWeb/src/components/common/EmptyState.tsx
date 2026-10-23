import { Box, Typography } from '@mui/material';
import { Inbox } from '@mui/icons-material';

interface Props {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export function EmptyState({
  title = 'No data found',
  description,
  icon,
  action,
}: Props) {
  return (
    <Box sx={{ textAlign: 'center', py: 8 }}>
      <Box sx={{ color: 'text.disabled', mb: 2 }}>
        {icon ?? <Inbox sx={{ fontSize: 64 }} />}
      </Box>
      <Typography variant="h6" color="text.secondary" gutterBottom>{title}</Typography>
      {description && <Typography variant="body2" color="text.disabled" sx={{ mb: 2 }}>{description}</Typography>}
      {action}
    </Box>
  );
}
