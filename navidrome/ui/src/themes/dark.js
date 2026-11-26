import stylesheet from './dark.css.js'

const accent = '#14b8a6'

export default {
  themeName: 'Dark',
  palette: {
    type: 'dark',
    primary: {
      main: accent,
      light: '#2dd4bf',
      dark: '#0f9488',
      contrastText: '#03110e',
    },
    secondary: {
      main: '#2dd4bf',
    },
    background: {
      default: '#050807',
      paper: '#0d1412',
    },
    text: {
      primary: '#eef7f4',
      secondary: '#91a8a1',
    },
    divider: 'rgba(148, 184, 174, 0.13)',
    action: {
      hover: 'rgba(20, 184, 166, 0.08)',
      selected: 'rgba(20, 184, 166, 0.14)',
    },
  },
  shape: {
    borderRadius: 14,
  },
  typography: {
    fontFamily:
      'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    h1: { fontWeight: 700, letterSpacing: '-0.035em' },
    h2: { fontWeight: 700, letterSpacing: '-0.03em' },
    h3: { fontWeight: 700, letterSpacing: '-0.025em' },
    h4: { fontWeight: 700, letterSpacing: '-0.02em' },
    h5: { fontWeight: 650 },
    h6: { fontWeight: 650 },
    button: { fontWeight: 650 },
  },
  overrides: {
    MuiAppBar: {
      root: {
        backgroundColor: '#161616 !important',
        backdropFilter: 'blur(18px)',
        boxShadow: 'none',
        borderBottom: '1px solid #3f3f3f',
      },
      positionFixed: {
        backgroundColor: '#161616 !important',
      },
      colorDefault: {
        backgroundColor: '#161616 !important',
        color: '#eef7f4',
      },
      colorPrimary: {
        backgroundColor: '#161616 !important',
        color: '#eef7f4',
      },
      colorSecondary: {
        backgroundColor: '#161616 !important',
        color: '#eef7f4',
      },
    },
    MuiDrawer: {
      paper: {
        backgroundColor: '#080d0c',
        borderRight: '1px solid rgba(148, 184, 174, 0.1)',
      },
    },
    MuiPaper: {
      root: {
        backgroundImage: 'none',
      },
      rounded: {
        borderRadius: 16,
      },
    },
    MuiCard: {
      root: {
        backgroundColor: '#0d1412',
        border: '1px solid rgba(148, 184, 174, 0.1)',
        boxShadow: '0 12px 32px rgba(0, 0, 0, 0.16)',
      },
    },
    MuiButton: {
      root: {
        borderRadius: 999,
        padding: '8px 18px',
        textTransform: 'none',
      },
      containedPrimary: {
        color: '#03110e',
        boxShadow: 'none',
        '&:hover': {
          backgroundColor: '#2dd4bf',
          boxShadow: '0 8px 24px rgba(20, 184, 166, 0.18)',
        },
      },
      textPrimary: {
        color: accent,
      },
      outlined: {
        borderColor: 'rgba(148, 184, 174, 0.22)',
      },
    },
    MuiIconButton: {
      root: {
        transition: 'color 150ms ease, background-color 150ms ease',
        '&:hover': {
          color: accent,
          backgroundColor: 'rgba(20, 184, 166, 0.08)',
        },
      },
    },
    MuiListItem: {
      root: {
        '&.Mui-selected, &.Mui-selected:hover': {
          backgroundColor: 'rgba(20, 184, 166, 0.12)',
        },
      },
      button: {
        borderRadius: 12,
        '&:hover': {
          backgroundColor: 'rgba(20, 184, 166, 0.07)',
        },
      },
    },
    MuiMenu: {
      paper: {
        backgroundColor: '#101916',
        border: '1px solid rgba(148, 184, 174, 0.14)',
        boxShadow: '0 18px 50px rgba(0, 0, 0, 0.42)',
      },
    },
    MuiDialog: {
      paper: {
        backgroundColor: '#0d1412',
        border: '1px solid rgba(148, 184, 174, 0.14)',
      },
    },
    MuiTableRow: {
      root: {
        '&.MuiTableRow-hover:hover': {
          backgroundColor: 'rgba(20, 184, 166, 0.055)',
        },
      },
      head: {
        backgroundColor: 'rgba(20, 184, 166, 0.025)',
      },
    },
    MuiTableCell: {
      root: {
        borderBottomColor: 'rgba(148, 184, 174, 0.09)',
      },
      head: {
        color: '#91a8a1',
        fontSize: '0.75rem',
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
      },
    },
    MuiOutlinedInput: {
      root: {
        borderRadius: 12,
        '&:hover $notchedOutline': {
          borderColor: 'rgba(20, 184, 166, 0.55)',
        },
        '&.Mui-focused $notchedOutline': {
          borderColor: accent,
        },
      },
      notchedOutline: {
        borderColor: 'rgba(148, 184, 174, 0.2)',
      },
    },
    MuiTabs: {
      indicator: {
        height: 3,
        borderRadius: 3,
        backgroundColor: accent,
      },
    },
    MuiLinearProgress: {
      colorPrimary: {
        backgroundColor: 'rgba(20, 184, 166, 0.12)',
      },
    },
    MuiFormGroup: {
      root: {
        color: '#eef7f4',
      },
    },
    NDLogin: {
      systemNameLink: {
        color: accent,
      },
      icon: {},
      welcome: {
        color: '#c4d5d0',
      },
      card: {
        minWidth: 300,
        backgroundColor: 'rgba(13, 20, 18, 0.96)',
        border: '1px solid rgba(20, 184, 166, 0.2)',
        borderRadius: 24,
        backdropFilter: 'blur(20px)',
      },
      avatar: {},
      button: {
        boxShadow: '0 10px 26px rgba(20, 184, 166, 0.18)',
      },
    },
    NDMobileArtistDetails: {
      bgContainer: {
        background:
          'linear-gradient(to bottom, rgba(5, 8, 7, 0.7), #050807)!important',
      },
    },
    NDAlbumGridView: {
      link: {
        borderRadius: 16,
        overflow: 'hidden',
      },
      albumPlayButton: {
        color: accent,
      },
    },
  },
  player: {
    theme: 'dark',
    stylesheet,
  },
}
