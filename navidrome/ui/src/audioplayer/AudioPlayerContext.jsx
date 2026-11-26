import React, { useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import { AudioPlayerContext } from './audioPlayerContext'

export const AudioPlayerProvider = ({ children }) => {
  const [audioInstance, setAudioInstance] = useState(null)
  const value = useMemo(
    () => ({ audioInstance, setAudioInstance }),
    [audioInstance],
  )
  return (
    <AudioPlayerContext.Provider value={value}>
      {children}
    </AudioPlayerContext.Provider>
  )
}

AudioPlayerProvider.propTypes = {
  children: PropTypes.node,
}
