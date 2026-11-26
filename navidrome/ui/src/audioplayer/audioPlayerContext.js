import { createContext, useContext } from 'react'

export const AudioPlayerContext = createContext({
  audioInstance: null,
  setAudioInstance: () => {},
})

export const useAudioPlayer = () => useContext(AudioPlayerContext)
