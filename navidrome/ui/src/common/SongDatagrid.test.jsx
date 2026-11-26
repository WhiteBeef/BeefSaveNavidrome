import React from 'react'
import { render, fireEvent, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createTheme, ThemeProvider } from '@material-ui/core/styles'
import { DiscSubtitleRow, SongDatagridBody } from './SongDatagrid'

vi.mock('../subsonic', () => ({
  default: { getDiscCoverArtUrl: () => 'http://localhost/cover.jpg' },
}))

const mockDispatch = vi.fn()

vi.mock('react-redux', () => ({ useDispatch: () => mockDispatch }))

vi.mock('react-admin', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    PureDatagridBody: ({ rowClick }) => (
      <button data-testid="song-row" onClick={() => rowClick('second')} />
    ),
  }
})

vi.mock('../common', () => ({ AlbumContextMenu: () => null }))

vi.mock('react-dnd', () => ({ useDrag: () => [{}, vi.fn()] }))

const record = {
  id: 'song-1',
  albumId: 'album-1',
  album: 'The Album',
  discNumber: 2,
  discSubtitle: 'Bonus Disc',
  updatedAt: '2024-01-01',
}

const renderRow = (onClick) =>
  render(
    <ThemeProvider theme={createTheme()}>
      <table>
        <tbody>
          <DiscSubtitleRow record={record} onClick={onClick} colSpan={3} />
        </tbody>
      </table>
    </ThemeProvider>,
  )

const openLightbox = () => {
  fireEvent.click(document.querySelector('img'))
  expect(document.querySelector('.ril__closeButton')).toBeTruthy()
}

describe('DiscSubtitleRow', () => {
  beforeEach(() => vi.clearAllMocks())

  it('plays the disc when the row is clicked', () => {
    const onClick = vi.fn()
    renderRow(onClick)
    fireEvent.click(screen.getByText('Bonus Disc'))
    expect(onClick).toHaveBeenCalledWith(2)
  })

  it('does not play the disc when opening the lightbox', () => {
    const onClick = vi.fn()
    renderRow(onClick)
    openLightbox()
    expect(onClick).not.toHaveBeenCalled()
  })

  it('does not play the disc when closing the lightbox', () => {
    const onClick = vi.fn()
    renderRow(onClick)
    openLightbox()
    fireEvent.click(document.querySelector('.ril__closeButton'))
    expect(onClick).not.toHaveBeenCalled()
  })

  it('does not play the disc when clicking the lightbox backdrop', () => {
    const onClick = vi.fn()
    renderRow(onClick)
    openLightbox()
    fireEvent.click(document.querySelector('.ril__inner'))
    expect(onClick).not.toHaveBeenCalled()
  })
})

describe('SongDatagridBody', () => {
  beforeEach(() => vi.clearAllMocks())

  it('plays all rows starting from the clicked song', () => {
    const data = {
      first: { id: 'first', title: 'First' },
      second: { id: 'second', title: 'Second' },
      third: { id: 'third', title: 'Third' },
    }
    const ids = Object.keys(data)

    render(<SongDatagridBody data={data} ids={ids} playAllOnClick />)
    fireEvent.click(screen.getByTestId('song-row'))

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'PLAYER_PLAY_TRACKS',
      id: 'second',
      data,
    })
  })
})
