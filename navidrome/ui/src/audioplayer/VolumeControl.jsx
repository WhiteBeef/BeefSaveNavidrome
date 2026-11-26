import React, { useRef } from 'react'
import PropTypes from 'prop-types'
import { IconButton, Slider } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import VolumeOffIcon from '@material-ui/icons/VolumeOff'
import VolumeUpIcon from '@material-ui/icons/VolumeUp'
import { useTranslate } from 'react-admin'

const useStyles = makeStyles((theme) => ({
  root: {
    position: 'relative',
    width: 48,
    display: 'flex',
    justifyContent: 'center',
    color: theme.palette.text.secondary,
    '&:hover $sliderContainer': {
      opacity: 1,
      visibility: 'visible',
      pointerEvents: 'auto',
      transform: 'translate(-50%, 0)',
    },
  },
  sliderContainer: {
    position: 'absolute',
    bottom: '100%',
    left: '50%',
    height: 140,
    display: 'flex',
    justifyContent: 'center',
    boxSizing: 'border-box',
    padding: theme.spacing(1.5, 1),
    borderRadius: 12,
    backgroundColor: theme.palette.background.paper,
    boxShadow: theme.shadows[4],
    opacity: 0,
    visibility: 'hidden',
    pointerEvents: 'none',
    transform: 'translate(-50%, 4px)',
    transition: 'opacity 150ms ease, transform 150ms ease, visibility 150ms',
  },
  slider: {
    height: '100%',
    color: theme.palette.primary.main,
  },
}))

export const VolumeControl = ({ audioInstance, volume = 1 }) => {
  const classes = useStyles()
  const translate = useTranslate()
  const previousVolumeRef = useRef(volume || 1)
  const label = translate('player.volumeText')

  const setVolume = (nextVolume) => {
    if (!audioInstance) {
      return
    }
    if (nextVolume > 0) {
      previousVolumeRef.current = nextVolume
    }
    audioInstance.volume = nextVolume * nextVolume
  }

  return (
    <div className={classes.root}>
      <IconButton
        aria-label={label}
        disabled={!audioInstance}
        onClick={() => setVolume(volume === 0 ? previousVolumeRef.current : 0)}
      >
        {volume === 0 ? <VolumeOffIcon /> : <VolumeUpIcon />}
      </IconButton>
      <div className={classes.sliderContainer}>
        <Slider
          className={classes.slider}
          aria-label={label}
          orientation="vertical"
          disabled={!audioInstance}
          min={0}
          max={100}
          value={Math.round(volume * 100)}
          onChange={(event, value) => setVolume(value / 100)}
        />
      </div>
    </div>
  )
}

VolumeControl.propTypes = {
  audioInstance: PropTypes.object,
  volume: PropTypes.number,
}
