import { createTheme } from '@mui/material/styles'

/** Dark, low-glare control-room theme — cool greys/blues, high-contrast alerts. */
export const controlRoomTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#5b9fd4' },
    secondary: { main: '#7a8b99' },
    background: {
      default: '#0b0e12',
      paper: '#12171e',
    },
    error: { main: '#e85d5d' },
    warning: { main: '#d4a017' },
    info: { main: '#5b9fd4' },
    success: { main: '#4caf82' },
    text: {
      primary: '#e6edf3',
      secondary: '#9aa7b5',
    },
    divider: 'rgba(255,255,255,0.08)',
  },
  typography: {
    fontFamily: '"IBM Plex Sans", "Segoe UI", sans-serif',
    fontSize: 13,
    h6: { fontWeight: 600, letterSpacing: 0.4 },
    body2: { fontFamily: '"IBM Plex Mono", "Consolas", monospace' },
  },
  shape: { borderRadius: 4 },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          margin: 0,
          overflow: 'hidden',
          backgroundColor: '#0b0e12',
        },
        '#root': {
          height: '100vh',
          width: '100vw',
        },
      },
    },
    MuiButton: {
      defaultProps: { size: 'small' },
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 500 },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 4 },
      },
    },
  },
})
