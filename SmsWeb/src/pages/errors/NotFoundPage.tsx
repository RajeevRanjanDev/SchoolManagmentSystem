import { Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export default function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
      <Box>
        <Typography variant="h1" sx={{ fontSize: '6rem', fontWeight: 900, color: 'primary.main', lineHeight: 1 }}>404</Typography>
        <Typography variant="h5" gutterBottom>Page not found</Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>The page you're looking for doesn't exist.</Typography>
        <Button variant="contained" onClick={() => navigate('/')}>Back to Dashboard</Button>
      </Box>
    </Box>
  );
}
