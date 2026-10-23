import { Box, Typography, Button } from '@mui/material';
import { Lock } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

export default function ForbiddenPage() {
  const navigate = useNavigate();
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
      <Box>
        <Lock sx={{ fontSize: 80, color: 'error.main', mb: 2 }} />
        <Typography variant="h4" fontWeight={700} gutterBottom>Access Denied</Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>You don't have permission to view this page.</Typography>
        <Button variant="contained" onClick={() => navigate('/')}>Back to Dashboard</Button>
      </Box>
    </Box>
  );
}
