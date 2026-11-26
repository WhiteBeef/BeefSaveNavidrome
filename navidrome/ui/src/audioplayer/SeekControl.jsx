import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { Slider } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import { useTranslate } from 'react-admin'
import { formatDuration } from '../utils'

const useStyles = makeStyles((theme) => ({
  root: {
    width: 'min(100%, 560px)',
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1.5),
    marginTop: theme.spacing(1.5),
  },
  time: {
    minWidth: 38,
    color: theme.palette.text.secondary,
    fontSize: '0.75rem',
    fontVariantNumeric: 'tabular-nums',
    textAlign: 'center',
  },
  slider: {
    color: theme.palette.primary.main,
  },
}))

export const SeekControl = ({ audioInstance, trackDuration = 0, trackId }) => {
  const classes = useStyles()
  const translate = useTranslate()
  const [position, setPosition] = useState(0)
  const [duration, setDuration] = useState(trackDuration)

  useEffect(() => {
    setPosition(0)
    setDuration(Number.isFinite(trackDuration) ? trackDuration : 0)
  }, [trackId, trackDuration])

  useEffect(() => {
    if (!audioInstance) {
      return
    }
    const updateProgress = () => {
      if (Number.isFinite(audioInstance.currentTime)) {
        setPosition(audioInstance.currentTime)
      }
      if (
        Number.isFinite(audioInstance.duration) &&
        audioInstance.duration > 0
      ) {
        setDuration(audioInstance.duration)
      }
    }
    const events = ['timeupdate', 'durationchange', 'loadedmetadata', 'seeked']
    updateProgress()
    events.forEach((event) =>
      audioInstance.addEventListener(event, updateProgress),
    )
    return () => {
      events.forEach((event) =>
        audioInstance.removeEventListener(event, updateProgress),
      )
    }
  }, [audioInstance, trackId])

  const handleSeek = (event, value) => {
    if (!audioInstance || !trackId) {
      return
    }
    audioInstance.currentTime = value
    setPosition(value)
  }

  return (
    <div className={classes.root}>
      <span className={classes.time}>{formatDuration(position)}</span>
      <Slider
        className={classes.slider}
        aria-label={translate('player.seekText')}
        aria-valuetext={`${formatDuration(position)} / ${formatDuration(duration)}`}
        disabled={!audioInstance || !trackId || duration <= 0}
        min={0}
        max={Math.max(duration, 1)}
        step={1}
        value={Math.min(position, duration)}
        onChange={handleSeek}
      />
      <span className={classes.time}>{formatDuration(duration)}</span>
    </div>
  )
}

SeekControl.propTypes = {
  audioInstance: PropTypes.object,
  trackDuration: PropTypes.number,
  trackId: PropTypes.string,
}
