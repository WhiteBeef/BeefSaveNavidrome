import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { SongSimpleList } from './SongSimpleList'

const mockDispatch = vi.fn()

vi.mock('react-redux', () => ({
  useDispatch: () => mockDispatch,
}))

vi.mock('../config', () => ({
  default: { enableStarRating: false },
}))

vi.mock('./index', () => ({
  DurationField: () => <span>3:00</span>,
  SongContextMenu: () => null,
  RatingField: () => null,
}))

describe('SongSimpleList', () => {
  beforeEach(() => vi.clearAllMocks())

  it('plays the whole list starting from the selected song', () => {
    const data = {
      first: { id: 'first', title: 'First', artist: 'Artist' },
      second: { id: 'second', title: 'Second', artist: 'Artist' },
      third: { id: 'third', title: 'Third', artist: 'Artist' },
    }
    const ids = Object.keys(data)

    render(<SongSimpleList data={data} ids={ids} total={3} />)
    fireEvent.click(screen.getByText('Second'))

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'PLAYER_PLAY_TRACKS',
      id: 'second',
      data,
    })
  })
})
