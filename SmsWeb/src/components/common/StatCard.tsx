import { Card, Typography, Box } from '@mui/material';
import { TrendingUp, TrendingDown } from '@mui/icons-material';

interface Props {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color?: string;
  subtitle?: string;
  trend?: number; // percentage, positive or negative
}

export function StatCard({ title, value, icon, color = '#0C831F', subtitle, trend }: Props) {
  const up = (trend ?? 0) >= 0;

  return (
    <Card
      sx={{
        height: '100%',
        p: 2.5,
        position: 'relative',
        overflow: 'hidden',
        '&:hover': { boxShadow: '0 8px 24px rgba(16,24,40,0.10)', transform: 'translateY(-2px)' },
      }}
    >
      {/* subtle corner glow */}
      <Box
        sx={{
          position: 'absolute',
          top: -40,
          right: -40,
          width: 120,
          height: 120,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${color}14 0%, transparent 70%)`,
        }}
      />

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
        <Box
          sx={{
            width: 46,
            height: 46,
            borderRadius: 3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            background: `linear-gradient(135deg, ${color} 0%, ${color}CC 100%)`,
            boxShadow: `0 6px 16px ${color}40`,
          }}
        >
          {icon}
        </Box>

        {trend !== undefined && (
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.4,
              px: 1,
              py: 0.4,
              borderRadius: 2,
              bgcolor: up ? 'rgba(12,131,31,0.10)' : 'rgba(226,55,68,0.10)',
              color: up ? 'success.main' : 'error.main',
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            {up ? <TrendingUp sx={{ fontSize: 14 }} /> : <TrendingDown sx={{ fontSize: 14 }} />}
            {Math.abs(trend)}%
          </Box>
        )}
      </Box>

      <Typography variant="h4" fontWeight={800} sx={{ color: 'text.primary', lineHeight: 1.1 }}>
        {value}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mt: 0.5 }}>
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="caption" color="text.disabled" sx={{ mt: 0.25, display: 'block' }}>
          {subtitle}
        </Typography>
      )}
    </Card>
  );
}
