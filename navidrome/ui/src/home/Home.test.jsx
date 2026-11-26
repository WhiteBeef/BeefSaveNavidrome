import React from 'react'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Home from './Home'

const mockDispatch = vi.fn()
const mockNotify = vi.fn()
const mockGetList = vi.fn()
const mockDataProvider = { getList: mockGetList }
const mockAudioListeners = {}
const mockAudioInstance = {
  playByIndex: vi.fn(),
  playNext: vi.fn(),
  playPrev: vi.fn(),
  togglePlay: vi.fn(),
  addEventListener: vi.fn((event, listener) => {
    mockAudioListeners[event] = listener
  }),
  removeEventListener: vi.fn((event) => {
    delete mockAudioListeners[event]
  }),
}
let mockPlayerState

vi.mock('react-redux', () => ({
  useDispatch: () => mockDispatch,
  useSelector: (selector) => selector({ player: mockPlayerState }),
}))

vi.mock('react-admin', () => ({
  Title: ({ title }) => <div>{title}</div>,
  useDataProvider: () => mockDataProvider,
  useNotify: () => mockNotify,
  useTranslate: () => (key, options) => options?._ || key,
}))

vi.mock('../common/Artwork', () => ({
  Artwork: ({ title, className }) => <img alt={title} className={className} />,
}))

vi.mock('../audioplayer/audioPlayerContext', () => ({
  useAudioPlayer: () => ({ audioInstance: mockAudioInstance }),
}))

vi.mock('../audioplayer/PlayerToolbar', () => ({
  default: () => <button>Love</button>,
}))

const makeSongs = (start, count) =>
  Array.from({ length: count }, (_, index) => ({
    id: `song-${start + index}`,
    title: `Song ${start + index}`,
    artist: 'Artist',
  }))

const getDispatchedActions = (type) =>
  mockDispatch.mock.calls
    .map(([action]) => action)
    .filter((action) => action.type === type)

const wrapHome = () => (
  <MemoryRouter>
    <Home />
  </MemoryRouter>
)

describe('Home', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPlayerState = { mode: 'orderLoop', current: {}, queue: [], volume: 1 }
    mockAudioInstance.volume = 1
    mockAudioInstance.currentTime = 0
    mockAudioInstance.duration = NaN
    Object.keys(mockAudioListeners).forEach(
      (event) => delete mockAudioListeners[event],
    )
    mockGetList.mockImplementation(() => {
      const requestNumber = mockGetList.mock.calls.length
      const start = (requestNumber - 1) * 10 + 1
      return Promise.resolve({ data: makeSongs(start, 50) })
    })
  })

  const waitForInitialDeck = async () => {
    await screen.findByText('Song 1')
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'player.clickToPlayText' }),
      ).toBeEnabled(),
    )
  }

  const setCurrentTrack = (uuid, rerender) => {
    mockPlayerState = {
      ...mockPlayerState,
      current: { uuid },
      queue: makeSongs(1, 10).map((song, index) => ({
        trackId: song.id,
        uuid: `uuid-${index + 1}`,
        song,
      })),
    }
    rerender(wrapHome())
  }

  it('shows only current and next songs before playback', async () => {
    render(wrapHome())
    await waitForInitialDeck()

    expect(screen.getByText('Song 1')).toBeInTheDocument()
    expect(screen.getByText('Song 2')).toBeInTheDocument()
    expect(screen.queryByText('Song 3')).not.toBeInTheDocument()
    expect(screen.queryByText('Song 10')).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Play music' }),
    ).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Next' })).toBeEnabled()
  })

  it('starts a queue with ten songs', async () => {
    render(wrapHome())
    await waitForInitialDeck()
    fireEvent.click(
      screen.getByRole('button', { name: 'player.clickToPlayText' }),
    )

    const [action] = getDispatchedActions('PLAYER_PLAY_TRACKS')
    expect(action.id).toBe('song-1')
    expect(Object.keys(action.data)).toHaveLength(10)
    expect(mockGetList).toHaveBeenCalledWith('song', {
      pagination: { page: 1, perPage: 50 },
      sort: { field: 'random', order: 'ASC' },
      filter: { missing: false },
    })
  })

  it('adds ten tracks at the eighth song and shows adjacent tracks', async () => {
    const { rerender } = render(wrapHome())
    await waitForInitialDeck()
    fireEvent.click(
      screen.getByRole('button', { name: 'player.clickToPlayText' }),
    )

    setCurrentTrack('uuid-8', rerender)

    await waitFor(() =>
      expect(getDispatchedActions('PLAYER_ADD_TRACKS')).toHaveLength(1),
    )
    const [action] = getDispatchedActions('PLAYER_ADD_TRACKS')
    expect(Object.keys(action.data)).toHaveLength(10)
    expect(screen.getByText('Song 7')).toBeInTheDocument()
    expect(screen.getByText('Song 8')).toBeInTheDocument()
    expect(screen.getByText('Song 9')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(mockAudioInstance.playByIndex).toHaveBeenCalledWith(8)
  })

  it('keeps current and adjacent cards during a track transition', async () => {
    const { rerender } = render(wrapHome())
    await waitForInitialDeck()
    fireEvent.click(
      screen.getByRole('button', { name: 'player.clickToPlayText' }),
    )
    setCurrentTrack('uuid-8', rerender)
    await waitFor(() =>
      expect(getDispatchedActions('PLAYER_ADD_TRACKS')).toHaveLength(1),
    )

    setCurrentTrack('pending-uuid', rerender)

    expect(screen.getByText('Song 7')).toBeInTheDocument()
    expect(screen.getByText('Song 8')).toBeInTheDocument()
    expect(screen.getByText('Song 9')).toBeInTheDocument()
  })

  it('shows the next loaded song at the end of the current queue', async () => {
    const { rerender } = render(wrapHome())
    await waitForInitialDeck()
    fireEvent.click(
      screen.getByRole('button', { name: 'player.clickToPlayText' }),
    )
    setCurrentTrack('uuid-8', rerender)
    await waitFor(() =>
      expect(getDispatchedActions('PLAYER_ADD_TRACKS')).toHaveLength(1),
    )

    setCurrentTrack('uuid-10', rerender)

    expect(screen.getByRole('button', { name: 'Next' })).toHaveTextContent(
      'Song 11',
    )
  })

  it('shows real adjacent tracks at the deck boundaries', async () => {
    mockGetList
      .mockResolvedValueOnce({ data: makeSongs(1, 10) })
      .mockResolvedValueOnce({ data: [] })
    const { rerender } = render(wrapHome())
    await waitForInitialDeck()
    fireEvent.click(
      screen.getByRole('button', { name: 'player.clickToPlayText' }),
    )

    setCurrentTrack('uuid-10', rerender)

    const nextButton = screen.getByRole('button', { name: 'Next' })
    await waitFor(() => expect(nextButton).toHaveTextContent('Song 1'))
    fireEvent.click(nextButton)
    expect(mockAudioInstance.playByIndex).toHaveBeenCalledWith(0)

    setCurrentTrack('uuid-1', rerender)

    const previousButton = screen.getByRole('button', { name: 'Previous' })
    expect(previousButton).toHaveTextContent('Song 10')
    fireEvent.click(previousButton)
    expect(mockAudioInstance.playByIndex).toHaveBeenCalledWith(9)
  })

  it('fills later decks after all unique songs are used', async () => {
    mockGetList
      .mockResolvedValueOnce({ data: makeSongs(1, 10) })
      .mockResolvedValueOnce({
        data: [...makeSongs(11, 2), ...makeSongs(1, 8)],
      })
    const { rerender } = render(wrapHome())
    await waitForInitialDeck()
    fireEvent.click(
      screen.getByRole('button', { name: 'player.clickToPlayText' }),
    )

    setCurrentTrack('uuid-8', rerender)

    await waitFor(() =>
      expect(getDispatchedActions('PLAYER_ADD_TRACKS')).toHaveLength(1),
    )
    const [action] = getDispatchedActions('PLAYER_ADD_TRACKS')
    expect(Object.keys(action.data)).toHaveLength(10)
    expect(action.data['song-11']).toBeDefined()
    expect(action.data['song-12']).toBeDefined()
    expect(action.data['song-1']).toBeDefined()
  })

  it('extends the queue after eight unique tracks in shuffle mode', async () => {
    mockPlayerState.mode = 'shufflePlay'
    const { rerender } = render(wrapHome())
    await waitForInitialDeck()
    fireEvent.click(
      screen.getByRole('button', { name: 'player.clickToPlayText' }),
    )

    const playedTracks = [
      'uuid-8',
      'uuid-1',
      'uuid-2',
      'uuid-3',
      'uuid-4',
      'uuid-5',
      'uuid-6',
      'uuid-7',
    ]
    playedTracks.forEach((uuid) => setCurrentTrack(uuid, rerender))

    await waitFor(() =>
      expect(getDispatchedActions('PLAYER_ADD_TRACKS')).toHaveLength(1),
    )
  })

  it('controls playback from the central player', async () => {
    const { rerender } = render(wrapHome())
    await waitForInitialDeck()
    setCurrentTrack('uuid-1', rerender)

    fireEvent.click(
      screen.getByRole('button', { name: 'player.clickToPlayText' }),
    )
    fireEvent.click(
      screen.getByRole('button', { name: 'player.previousTrackText' }),
    )
    fireEvent.click(
      screen.getByRole('button', { name: 'player.nextTrackText' }),
    )

    expect(mockAudioInstance.togglePlay).toHaveBeenCalled()
    expect(mockAudioInstance.playPrev).toHaveBeenCalled()
    expect(mockAudioInstance.playNext).toHaveBeenCalled()
  })

  it('seeks the current song and shows playback progress', async () => {
    const { rerender } = render(wrapHome())
    await waitForInitialDeck()

    const initialSlider = screen.getByRole('slider', {
      name: 'player.seekText',
      hidden: true,
    })
    expect(initialSlider).toHaveClass('Mui-disabled')

    setCurrentTrack('uuid-1', rerender)
    mockAudioInstance.currentTime = 30
    mockAudioInstance.duration = 180
    act(() => mockAudioListeners.timeupdate())

    const slider = screen.getByRole('slider', {
      name: 'player.seekText',
      hidden: true,
    })
    expect(slider).toHaveAttribute('aria-valuemax', '180')
    expect(slider).toHaveAttribute('aria-valuenow', '30')
    fireEvent.keyDown(slider, { key: 'ArrowRight' })

    expect(mockAudioInstance.currentTime).toBe(31)
    expect(screen.getByText('00:31')).toBeInTheDocument()
    expect(screen.getByText('03:00')).toBeInTheDocument()
  })

  it('changes volume through the shared audio instance', async () => {
    render(wrapHome())
    await waitForInitialDeck()

    const slider = screen
      .getAllByRole('slider', { hidden: true })
      .find(
        (element) => element.getAttribute('aria-label') === 'player.volumeText',
      )
    expect(slider).toHaveAttribute('aria-label', 'player.volumeText')
    expect(slider).toHaveAttribute('aria-orientation', 'vertical')

    fireEvent.keyDown(slider, { key: 'ArrowLeft' })

    expect(mockAudioInstance.volume).toBeCloseTo(0.9801)
  })
})
