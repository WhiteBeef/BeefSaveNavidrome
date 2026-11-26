import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { CircularProgress, Typography } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import { Title, useDataProvider, useNotify, useTranslate } from 'react-admin'
import { addTracks, playTracks } from '../actions'
import { Artwork } from '../common/Artwork'
import { processSongsForPlayback } from '../common/playbackActions'
import { useAudioPlayer } from '../audioplayer/audioPlayerContext'
import { PlaybackControls } from '../audioplayer/PlaybackControls'
import { VolumeControl } from '../audioplayer/VolumeControl'
import PlayerToolbar from '../audioplayer/PlayerToolbar'

const DECK_SIZE = 10
const REQUEST_SIZE = 50

const useStyles = makeStyles((theme) => ({
  root: {
    width: '100%',
    maxWidth: 1200,
    minHeight: 'calc(100dvh - 112px)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    boxSizing: 'border-box',
    margin: '0 auto',
    padding: theme.spacing(3),
    [theme.breakpoints.down('xs')]: {
      minHeight: 'calc(100dvh - 88px)',
      padding: theme.spacing(2, 1.5, 4),
    },
  },
  currentTrack: {
    display: 'flex',
    alignItems: 'center',
    flexDirection: 'column',
    margin: '0 auto',
    textAlign: 'center',
  },
  currentCover: {
    width: 'min(38vh, 340px)',
    minWidth: 220,
    aspectRatio: '1',
    marginBottom: theme.spacing(2.5),
    border: '1px solid rgba(20, 184, 166, 0.18)',
    borderRadius: 28,
    background: '#101916',
    boxShadow: '0 24px 70px rgba(0, 0, 0, 0.42)',
  },
  currentName: {
    maxWidth: 'min(90vw, 650px)',
    overflow: 'hidden',
    color: theme.palette.text.primary,
    fontSize: '1.7rem',
    fontWeight: 700,
    letterSpacing: '-0.03em',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  currentArtist: {
    marginTop: theme.spacing(0.75),
    color: theme.palette.text.secondary,
    fontSize: '1rem',
  },
  currentControls: {
    width: 'min(100%, 560px)',
    display: 'grid',
    gridTemplateColumns: '150px auto 150px',
    alignItems: 'center',
    marginTop: theme.spacing(1.5),
    '& .MuiIconButton-root': {
      margin: theme.spacing(0, 0.5),
    },
    [theme.breakpoints.down('xs')]: {
      gridTemplateColumns: '48px auto 110px',
    },
  },
  playbackButtons: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loveButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    '& li': {
      margin: 0,
    },
  },
  sideTracks: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: theme.spacing(3),
    maxWidth: 760,
    margin: theme.spacing(4, 'auto', 0),
    [theme.breakpoints.down('xs')]: {
      gap: theme.spacing(1.5),
    },
  },
  sideTrack: {
    minWidth: 0,
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1.5),
    padding: theme.spacing(1.5),
    border: '1px solid rgba(148, 184, 174, 0.1)',
    borderRadius: 18,
    background: '#0d1412',
    color: 'inherit',
    font: 'inherit',
    textAlign: 'left',
    cursor: 'pointer',
    '&:not(:disabled):hover': {
      borderColor: 'rgba(20, 184, 166, 0.5)',
    },
    '&:disabled': {
      cursor: 'default',
      opacity: 0.45,
    },
  },
  sideTrackNext: {
    flexDirection: 'row-reverse',
    textAlign: 'right',
  },
  sideCover: {
    width: 68,
    height: 68,
    flexShrink: 0,
    borderRadius: 12,
    background: '#101916',
  },
  sideText: {
    minWidth: 0,
    flex: 1,
  },
  sideLabel: {
    color: theme.palette.primary.main,
    fontSize: '0.68rem',
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  },
  sideName: {
    overflow: 'hidden',
    marginTop: theme.spacing(0.5),
    color: theme.palette.text.primary,
    fontSize: '0.9rem',
    fontWeight: 600,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  sideArtist: {
    overflow: 'hidden',
    color: theme.palette.text.secondary,
    fontSize: '0.78rem',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  loader: {
    display: 'flex',
    justifyContent: 'center',
    padding: theme.spacing(3),
    color: theme.palette.primary.main,
  },
  empty: {
    padding: theme.spacing(6, 2),
    color: theme.palette.text.secondary,
    textAlign: 'center',
  },
}))

const Home = () => {
  const classes = useStyles()
  const dispatch = useDispatch()
  const dataProvider = useDataProvider()
  const notify = useNotify()
  const translate = useTranslate()
  const playerMode = useSelector((state) => state.player?.mode)
  const current = useSelector((state) => state.player?.current)
  const queue = useSelector((state) => state.player?.queue || [])
  const volume = useSelector((state) => state.player?.volume ?? 1)
  const { audioInstance } = useAudioPlayer()
  const isShuffle = playerMode === 'shufflePlay'
  const [songs, setSongs] = useState([])
  const [isLoadingDeck, setIsLoadingDeck] = useState(true)
  const [isStarting, setIsStarting] = useState(false)
  const songsRef = useRef([])
  const isMountedRef = useRef(true)
  const isLoadingDeckRef = useRef(false)
  const hasStartedRef = useRef(false)
  const isExhaustedRef = useRef(false)
  const playedTrackIdsRef = useRef(new Set())
  const lastCurrentIndexRef = useRef(-1)
  const currentUuid = current?.uuid
  const currentIndex = queue.findIndex((item) => item.uuid === currentUuid)
  if (currentIndex >= 0) {
    lastCurrentIndexRef.current = currentIndex
  }
  const displayIndex =
    currentIndex >= 0 ? currentIndex : lastCurrentIndexRef.current
  const trackCount = Math.max(queue.length, songs.length)
  const getSongAt = (index) => queue[index]?.song || songs[index] || null
  const previousIndex = displayIndex > 0 ? displayIndex - 1 : trackCount - 1
  const nextIndex =
    displayIndex >= 0 && trackCount > 0 ? (displayIndex + 1) % trackCount : 1
  const currentSong =
    displayIndex >= 0 ? getSongAt(displayIndex) : songs[0] || null
  const previousSong =
    displayIndex >= 0 && trackCount > 0
      ? getSongAt((displayIndex - 1 + trackCount) % trackCount)
      : null
  const nextSong =
    displayIndex >= 0 && trackCount > 0
      ? getSongAt((displayIndex + 1) % trackCount)
      : songs[1] || null

  const loadDeck = useCallback(async () => {
    if (isLoadingDeckRef.current || isExhaustedRef.current) {
      return []
    }
    isLoadingDeckRef.current = true
    if (isMountedRef.current) {
      setIsLoadingDeck(true)
    }
    try {
      const response = await dataProvider.getList('song', {
        pagination: { page: 1, perPage: REQUEST_SIZE },
        sort: { field: 'random', order: 'ASC' },
        filter: { missing: false },
      })
      if (response.data.length === 0) {
        isExhaustedRef.current = true
        return []
      }
      const existingIds = new Set(songsRef.current.map((song) => song.id))
      const newSongs = response.data
        .filter((song) => !existingIds.has(song.id))
        .slice(0, DECK_SIZE)
      if (newSongs.length < DECK_SIZE) {
        const deckIds = new Set(newSongs.map((song) => song.id))
        const remainingCount = DECK_SIZE - newSongs.length
        const repeatedSongs = response.data
          .filter((song) => !deckIds.has(song.id))
          .slice(0, remainingCount)
        newSongs.push(...repeatedSongs)
      }
      if (newSongs.length > 0) {
        songsRef.current = [...songsRef.current, ...newSongs]
        if (isMountedRef.current) {
          setSongs(songsRef.current)
        }
      }
      return newSongs
    } catch {
      notify('ra.page.error', 'warning')
      return []
    } finally {
      isLoadingDeckRef.current = false
      if (isMountedRef.current) {
        setIsLoadingDeck(false)
      }
    }
  }, [dataProvider, notify])

  useEffect(() => {
    isMountedRef.current = true
    loadDeck()
    return () => {
      isMountedRef.current = false
    }
  }, [loadDeck])

  const startPlayback = useCallback(async () => {
    setIsStarting(true)
    try {
      if (songsRef.current.length === 0) {
        await loadDeck()
      }
      const availableSongs = songsRef.current
      if (availableSongs.length === 0) {
        return
      }
      const { songData, ids } = processSongsForPlayback(availableSongs)
      hasStartedRef.current = true
      playedTrackIdsRef.current.clear()
      dispatch(playTracks(songData, ids))
    } finally {
      setIsStarting(false)
    }
  }, [dispatch, loadDeck])

  const handleTogglePlay = useCallback(() => {
    if (currentUuid) {
      audioInstance?.togglePlay?.()
      return
    }
    startPlayback()
  }, [audioInstance, currentUuid, startPlayback])

  useEffect(() => {
    if (
      !hasStartedRef.current ||
      !currentUuid ||
      currentIndex < 0 ||
      songs.length === 0 ||
      isExhaustedRef.current
    ) {
      return
    }
    playedTrackIdsRef.current.add(currentUuid)
    const shouldExtend = isShuffle
      ? playedTrackIdsRef.current.size >= songs.length - 2
      : currentIndex >= songs.length - 3
    if (!shouldExtend) {
      return
    }
    loadDeck().then((newSongs) => {
      if (newSongs.length === 0 || !hasStartedRef.current) {
        return
      }
      const { songData, ids } = processSongsForPlayback(newSongs)
      dispatch(addTracks(songData, ids))
    })
  }, [currentIndex, currentUuid, dispatch, isShuffle, loadDeck, songs.length])

  const renderSideTrack = (song, label, index, isNext = false) => (
    <button
      className={`${classes.sideTrack} ${isNext ? classes.sideTrackNext : ''}`}
      type="button"
      disabled={!song || !audioInstance}
      onClick={() => audioInstance?.playByIndex?.(index)}
      aria-label={label}
    >
      {song && (
        <Artwork
          record={song}
          size={160}
          square
          className={classes.sideCover}
          title={song.title}
        />
      )}
      <span className={classes.sideText}>
        <Typography className={classes.sideLabel}>{label}</Typography>
        <Typography className={classes.sideName}>
          {song?.title || '—'}
        </Typography>
        <Typography className={classes.sideArtist}>
          {song?.artist || ''}
        </Typography>
      </span>
    </button>
  )

  return (
    <div className={classes.root}>
      <Title title={translate('home.title', { _: 'My wave' })} />
      {currentSong ? (
        <>
          <section className={classes.currentTrack}>
            <Artwork
              record={currentSong}
              size={700}
              square
              className={classes.currentCover}
              title={currentSong.title}
            />
            <Typography component="h2" className={classes.currentName}>
              {currentSong.title}
            </Typography>
            <Typography className={classes.currentArtist}>
              {currentSong.artist}
            </Typography>
            <div className={classes.currentControls}>
              <span className={classes.loveButton}>
                <PlayerToolbar
                  id={current?.trackId || currentSong.id}
                  isRadio={false}
                />
              </span>
              <PlaybackControls
                className={classes.playbackButtons}
                audioInstance={audioInstance}
                paused={current?.paused ?? true}
                size="large"
                onTogglePlay={handleTogglePlay}
                disabled={isStarting || isLoadingDeck}
              />
              <VolumeControl audioInstance={audioInstance} volume={volume} />
            </div>
          </section>
          <div className={classes.sideTracks}>
            {renderSideTrack(
              previousSong,
              translate('home.previous', { _: 'Previous' }),
              previousIndex,
            )}
            {renderSideTrack(
              nextSong,
              translate('home.next', { _: 'Next' }),
              nextIndex,
              true,
            )}
          </div>
        </>
      ) : (
        !isLoadingDeck && (
          <div className={classes.empty}>
            {translate('home.emptyDeck', {
              _: 'No tracks found in your library',
            })}
          </div>
        )
      )}
      {isLoadingDeck && (
        <div className={classes.loader} data-testid="deck-loader">
          <CircularProgress color="inherit" />
        </div>
      )}
    </div>
  )
}

export default Home
