import { Box, Typography, Breadcrumbs, Link } from '@mui/material';
import { useNavigate } from 'react-router-dom';

interface Crumb { label: string; path?: string }

interface Props {
  title: string;
  subtitle?: string;
  crumbs?: Crumb[];
  action?: React.ReactNode;
}

export function PageHeader({ title, subtitle, crumbs, action }: Props) {
  const navigate = useNavigate();
  return (
    <Box sx={{ mb: 3, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
      <Box>
        {crumbs && (
          <Breadcrumbs sx={{ mb: 0.5 }}>
            {crumbs.map((c, i) =>
              c.path ? (
                <Link
                  key={i}
                  underline="hover"
                  color="inherit"
                  sx={{ cursor: 'pointer', fontSize: '0.8rem' }}
                  onClick={() => navigate(c.path!)}
                >
                  {c.label}
                </Link>
              ) : (
                <Typography key={i} color="text.primary" sx={{ fontSize: '0.8rem' }}>
                  {c.label}
                </Typography>
              )
            )}
          </Breadcrumbs>
        )}
        <Typography variant="h5" fontWeight={700}>{title}</Typography>
        {subtitle && <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>{subtitle}</Typography>}
      </Box>
      {action && <Box sx={{ flexShrink: 0, ml: 2 }}>{action}</Box>}
    </Box>
  );
}
