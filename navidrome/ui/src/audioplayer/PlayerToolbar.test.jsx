import React from 'react'
import { render, screen, cleanup } from '@testing-library/react'
import { useMediaQuery } from '@material-ui/core'
import { useGetOne } from 'react-admin'
import { useToggleLove } from '../common'
import PlayerToolbar from './PlayerToolbar'

vi.mock('@material-ui/core', async () => {
  const actual = await import('@material-ui/core')
  return {
    ...actual,
    useMediaQuery: vi.fn(),
  }
})

vi.mock('react-admin', () => ({
  useGetOne: vi.fn(),
}))

vi.mock('../common', () => ({
  LoveButton: ({ className, disabled }) => (
    <button data-testid="love-button" className={className} disabled={disabled}>
      Love
    </button>
  ),
  useToggleLove: vi.fn(),
}))

vi.mock('react-hotkeys', () => ({
  GlobalHotKeys: () => <div data-testid="global-hotkeys" />,
}))

describe('<PlayerToolbar />', () => {
  const mockToggleLove = vi.fn()
  const mockSongData = { id: 'song-1', name: 'Test Song', starred: false }

  beforeEach(() => {
    vi.clearAllMocks()
    useGetOne.mockReturnValue({ data: mockSongData, loading: false })
    useToggleLove.mockReturnValue([mockToggleLove, false])
  })

  afterEach(cleanup)

  it('renders desktop toolbar with the love button', () => {
    useMediaQuery.mockReturnValue(true)
    render(<PlayerToolbar id="song-1" />)

    const listItems = screen.getAllByRole('listitem')
    expect(listItems).toHaveLength(1)
    expect(screen.getByTestId('love-button')).toBeInTheDocument()
    expect(listItems[0].className).toContain('toolbar')
  })

  it('renders mobile toolbar with the love button', () => {
    useMediaQuery.mockReturnValue(false)
    render(<PlayerToolbar id="song-1" />)

    const listItems = screen.getAllByRole('listitem')
    expect(listItems).toHaveLength(1)
    expect(screen.getByTestId('love-button')).toBeInTheDocument()
    expect(listItems[0].className).toContain('mobileListItem')
  })

  it('disables love button while loading', () => {
    useGetOne.mockReturnValue({ data: mockSongData, loading: true })
    render(<PlayerToolbar id="song-1" />)

    expect(screen.getByTestId('love-button')).toBeDisabled()
  })

  it('renders global hotkeys in both layouts', () => {
    useMediaQuery.mockReturnValue(true)
    render(<PlayerToolbar id="song-1" />)
    expect(screen.getByTestId('global-hotkeys')).toBeInTheDocument()

    cleanup()
    useMediaQuery.mockReturnValue(false)
    render(<PlayerToolbar id="song-1" />)
    expect(screen.getByTestId('global-hotkeys')).toBeInTheDocument()
  })

  it('disables love button when id is not provided', () => {
    render(<PlayerToolbar />)

    expect(screen.getByTestId('love-button')).toBeDisabled()
  })
})
