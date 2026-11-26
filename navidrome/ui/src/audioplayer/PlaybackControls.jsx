import React from 'react'
import PropTypes from 'prop-types'
import { IconButton } from '@material-ui/core'
import PlayArrowIcon from '@material-ui/icons/PlayArrow'
import PauseIcon from '@material-ui/icons/Pause'
import SkipNextIcon from '@material-ui/icons/SkipNext'
import SkipPreviousIcon from '@material-ui/icons/SkipPrevious'
import { useTranslate } from 'react-admin'

export const PlaybackControls = ({
  audioInstance,
  paused = true,
  size = 'medium',
  className,
  onTogglePlay,
  disabled = false,
}) => {
  const translate = useTranslate()
  const isDisabled = !audioInstance || disabled
  return (
    <div className={className}>
      <IconButton
        aria-label={translate('player.previousTrackText')}
        disabled={isDisabled}
        onClick={() => audioInstance?.playPrev?.()}
      >
        <SkipPreviousIcon fontSize={size} />
      </IconButton>
      <IconButton
        className="central-play-button"
        aria-label={translate(
          paused ? 'player.clickToPlayText' : 'player.clickToPauseText',
        )}
        disabled={isDisabled}
        onClick={onTogglePlay || (() => audioInstance?.togglePlay?.())}
      >
        {paused ? (
          <PlayArrowIcon fontSize={size} />
        ) : (
          <PauseIcon fontSize={size} />
        )}
      </IconButton>
      <IconButton
        aria-label={translate('player.nextTrackText')}
        disabled={isDisabled}
        onClick={() => audioInstance?.playNext?.()}
      >
        <SkipNextIcon fontSize={size} />
      </IconButton>
    </div>
  )
}

PlaybackControls.propTypes = {
  audioInstance: PropTypes.object,
  paused: PropTypes.bool,
  size: PropTypes.string,
  className: PropTypes.string,
  onTogglePlay: PropTypes.func,
  disabled: PropTypes.bool,
}
