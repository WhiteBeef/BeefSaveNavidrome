import { alpha, makeStyles } from '@material-ui/core/styles'

const useStyle = makeStyles(
  (theme) => ({
    audioTitle: {
      textDecoration: 'none',
      color: theme.palette.text.primary,
    },
    songTitle: {
      fontWeight: 'bold',
      '&:hover + $qualityInfo': {
        opacity: 1,
      },
    },
    songInfo: {
      display: 'block',
      marginTop: '2px',
    },
    songAlbum: {
      fontStyle: 'italic',
      fontSize: 'smaller',
    },
    qualityInfo: {
      marginTop: '-4px',
      opacity: 0,
      transition: 'all 500ms ease-out',
    },
    player: {
      display: (props) => (props.visible ? 'block' : 'none'),
      '& .custom-player-controls': {
        display: 'none',
      },
      '@media screen and (min-width:811px)': {
        '& .music-player-panel .panel-content': {
          position: 'static',
          maxWidth: 1280,
          margin: '0 auto',
          padding: '0 16px',
          overflow: 'visible',
        },
        '& .music-player-panel .panel-content .progress-bar-content': {
          position: 'static',
          flex: '1 1 auto',
          minWidth: 0,
          maxWidth: 'calc(50% - 230px)',
          height: 'auto',
          padding: '0 20px',
          overflow: 'visible',
          zIndex: 2,
          '& .audio-title': {
            display: 'block',
            width: '100%',
            overflow: 'hidden',
            color: theme.palette.text.primary,
            pointerEvents: 'auto',
          },
          '& .songTitle, & .songInfo': {
            display: 'block',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          },
          '& .songInfo': {
            color: theme.palette.text.secondary,
          },
          '& .current-time, & .duration': {
            display: 'none',
          },
          '& section.audio-main': {
            position: 'absolute',
            top: 0,
            left: 0,
            zIndex: 4,
            width: '100%',
            height: 14,
            margin: 0,
            transform: 'translateY(-50%)',
          },
          '& .progress-bar': {
            position: 'relative',
            width: '100%',
            height: 14,
            margin: 0,
          },
          '& .rc-slider': {
            width: '100%',
            height: 14,
            padding: '5px 0',
          },
          '& .rc-slider-rail': {
            width: '100%',
            height: 3,
            backgroundColor: 'rgba(255, 255, 255, 0.4) !important',
          },
          '& .rc-slider-track': {
            height: 3,
            backgroundColor: `${theme.palette.primary.main} !important`,
            transition: 'width 1s linear',
            boxShadow: `0 24px 48px 16px ${alpha(
              theme.palette.primary.main,
              0.3,
            )}`,
          },
          '& .rc-slider-step': {
            height: 3,
          },
          '& .rc-slider-handle': {
            top: '50%',
            zIndex: 3,
            width: 12,
            height: 12,
            marginTop: 0,
            border: 0,
            opacity: 0,
            transform: 'translateY(-50%)',
            backgroundColor: theme.palette.primary.main,
            transition: 'left 1s linear, opacity 150ms ease',
          },
          '& .rc-slider:active': {
            '& .rc-slider-track': {
              transition: 'none',
            },
            '& .rc-slider-handle': {
              opacity: 1,
              transition: 'opacity 150ms ease',
            },
          },
        },
        '& .music-player-panel:hover .panel-content .progress-bar-content .rc-slider-handle':
          {
            opacity: 1,
          },
        '& .music-player-panel .panel-content .img-content': {
          position: 'relative',
          zIndex: 2,
          flexShrink: 0,
        },
        '& .music-player-panel .panel-content .player-content': {
          position: 'static',
          flexBasis: 'auto',
          alignItems: 'center',
          marginLeft: 'auto',
          paddingLeft: 0,
        },
        '& .music-player-panel .panel-content .player-content > .group': {
          position: 'relative',
          zIndex: 2,
        },
        '& .music-player-panel .panel-content .player-content > .group:first-child':
          {
            display: 'none',
          },
        '& .custom-player-controls': {
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          zIndex: 3,
        },
        '& .custom-player-controls > div': {
          display: 'flex',
          alignItems: 'center',
        },
        '& .custom-player-controls .central-play-button': {
          width: 48,
          height: 48,
          margin: '0 4px',
          padding: 8,
          borderRadius: '50%',
          backgroundColor: theme.palette.primary.main,
          color: theme.palette.primary.contrastText,
          '&:hover': {
            backgroundColor: theme.palette.primary.light,
            color: theme.palette.primary.contrastText,
          },
          '& svg': {
            fontSize: 30,
          },
        },
        '& .custom-player-controls .toolbar': {
          flexGrow: 0,
          alignSelf: 'center',
        },
      },
      '@media screen and (max-width:810px)': {
        '& .sound-operation': {
          display: 'none',
        },
      },
      '@media (prefers-reduced-motion)': {
        '& .music-player-panel .panel-content div.img-rotate': {
          animation: 'none',
        },
      },
      '& .progress-bar-content': {
        display: 'flex',
        flexDirection: 'column',
      },
      '& .play-mode-title': {
        'pointer-events': 'none',
      },
      '& .music-player-panel .panel-content div.img-rotate': {
        // Customize desktop player when cover animation is disabled
        animationDuration: (props) => !props.enableCoverAnimation && '0s',
        borderRadius: (props) => !props.enableCoverAnimation && '0',
        // Fix cover display when image is not square
        backgroundSize: 'contain',
        backgroundPosition: 'center',
      },
      '& .react-jinke-music-player-mobile .react-jinke-music-player-mobile-cover':
        {
          // Customize mobile player when cover animation is disabled
          borderRadius: (props) => !props.enableCoverAnimation && '0',
          width: (props) => !props.enableCoverAnimation && '85%',
          maxWidth: (props) => !props.enableCoverAnimation && '600px',
          height: (props) => !props.enableCoverAnimation && 'auto',
          // Fix cover display when image is not square
          aspectRatio: '1/1',
          display: 'flex',
        },
      '& .react-jinke-music-player-mobile .react-jinke-music-player-mobile-cover img.cover':
        {
          animationDuration: (props) => !props.enableCoverAnimation && '0s',
          objectFit: 'contain', // Fix cover display when image is not square
        },
      // Hide old singer display
      '& .react-jinke-music-player-mobile .react-jinke-music-player-mobile-singer':
        {
          display: 'none',
        },
      // Hide extra whitespace from switch div
      '& .react-jinke-music-player-mobile .react-jinke-music-player-mobile-switch':
        {
          display: 'none',
        },
      '& .music-player-panel .panel-content .progress-bar-content section.audio-main':
        {
          display: (props) => (props.isRadio ? 'none' : 'inline-flex'),
        },
      '& .react-jinke-music-player-mobile-progress': {
        display: (props) => (props.isRadio ? 'none' : 'flex'),
      },
    },
  }),
  { name: 'NDAudioPlayer' },
)

export default useStyle
