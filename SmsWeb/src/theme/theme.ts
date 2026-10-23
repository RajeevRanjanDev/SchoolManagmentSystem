import { createTheme } from '@mui/material/styles';

/**
 * Premium design system — inspired by modern consumer apps (Blinkit-style):
 * fresh green brand, bright yellow accent, crisp ink text, light surfaces,
 * bold rounded typography, soft elevation, pill buttons.
 */

export const brand = {
  green: '#0C831F',
  greenDark: '#066B17',
  greenLight: '#1DA837',
  greenSoft: '#E7F6EA',
  yellow: '#FFC400',
  yellowSoft: '#FFF6D9',
  ink: '#1C1C1C',
  inkSoft: '#5A5A5A',
  muted: '#9AA0A6',
  line: '#EDEFF1',
  surface: '#FFFFFF',
  bg: '#F6F8F9',
};

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: brand.green,
      light: brand.greenLight,
      dark: brand.greenDark,
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: brand.yellow,
      light: '#FFD54A',
      dark: '#E0A800',
      contrastText: brand.ink,
    },
    background: {
      default: brand.bg,
      paper: brand.surface,
    },
    text: {
      primary: brand.ink,
      secondary: brand.inkSoft,
    },
    error: { main: '#E23744' },
    warning: { main: '#FF8A00' },
    success: { main: brand.green },
    info: { main: '#2E6FF2' },
    divider: brand.line,
    grey: {
      50: '#FAFBFC',
      100: '#F3F5F6',
      200: '#EAECEE',
      300: '#DDE0E3',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h3: { fontWeight: 800, letterSpacing: '-0.02em' },
    h4: { fontWeight: 800, letterSpacing: '-0.02em' },
    h5: { fontWeight: 700, letterSpacing: '-0.015em' },
    h6: { fontWeight: 700, letterSpacing: '-0.01em' },
    subtitle1: { fontWeight: 600 },
    subtitle2: { fontWeight: 600 },
    body2: { lineHeight: 1.55 },
    button: { fontWeight: 600, textTransform: 'none', letterSpacing: 0 },
  },
  shape: { borderRadius: 14 },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: brand.bg,
          '::-webkit-scrollbar': { width: 10, height: 10 },
          '::-webkit-scrollbar-thumb': {
            backgroundColor: '#D4D9DD',
            borderRadius: 8,
            border: '2px solid transparent',
            backgroundClip: 'content-box',
          },
          '::-webkit-scrollbar-thumb:hover': { backgroundColor: '#BCC3C8' },
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: 12,
          padding: '9px 20px',
          fontWeight: 700,
          transition: 'transform .15s ease, box-shadow .15s ease, background-color .15s ease',
        },
        contained: {
          boxShadow: '0 4px 14px rgba(12,131,31,0.25)',
          '&:hover': { boxShadow: '0 6px 20px rgba(12,131,31,0.32)', transform: 'translateY(-1px)' },
          '&:active': { transform: 'translateY(0)' },
        },
        outlined: {
          borderWidth: 1.5,
          '&:hover': { borderWidth: 1.5, backgroundColor: brand.greenSoft },
        },
        sizeLarge: { padding: '12px 24px', fontSize: '0.975rem' },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 18,
          boxShadow: '0 2px 10px rgba(16,24,40,0.05)',
          border: `1px solid ${brand.line}`,
          backgroundImage: 'none',
          transition: 'box-shadow .2s ease, transform .2s ease',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
        rounded: { borderRadius: 16 },
      },
    },
    MuiTextField: {
      defaultProps: { variant: 'outlined' },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          backgroundColor: '#FFFFFF',
          '& .MuiOutlinedInput-notchedOutline': { borderColor: brand.line },
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#D0D5D9' },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: brand.green,
            borderWidth: 1.5,
          },
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            backgroundColor: '#F4F7F5',
            fontWeight: 700,
            color: brand.inkSoft,
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            borderBottom: `1px solid ${brand.line}`,
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: { borderBottom: `1px solid ${brand.line}` },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600, borderRadius: 8 },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(255,255,255,0.85)',
          backdropFilter: 'saturate(180%) blur(12px)',
          color: brand.ink,
          boxShadow: 'none',
          borderBottom: `1px solid ${brand.line}`,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#FFFFFF',
          color: brand.ink,
          borderRight: `1px solid ${brand.line}`,
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: brand.ink,
          borderRadius: 8,
          fontSize: '0.75rem',
          fontWeight: 500,
          padding: '6px 10px',
        },
      },
    },
    MuiAvatar: {
      styleOverrides: { root: { fontWeight: 700 } },
    },
  },
});
