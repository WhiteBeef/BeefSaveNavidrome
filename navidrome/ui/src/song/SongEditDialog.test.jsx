import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { SongEditDialog } from './SongEditDialog'

const { mockNotify, mockRefresh, mockUpdateSongMetadata } = vi.hoisted(() => ({
  mockNotify: vi.fn(),
  mockRefresh: vi.fn(),
  mockUpdateSongMetadata: vi.fn(),
}))

vi.mock('react-admin', () => ({
  useNotify: () => mockNotify,
  useRefresh: () => mockRefresh,
  useTranslate: () => (key) => key,
}))

vi.mock('../dataProvider', () => ({
  useDirectDataProvider: () => ({
    updateSongMetadata: mockUpdateSongMetadata,
  }),
}))

vi.mock('../common/Artwork', () => ({ Artwork: () => null }))

describe('SongEditDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.URL.createObjectURL = vi.fn(() => 'blob:cover-preview')
    global.URL.revokeObjectURL = vi.fn()
    mockUpdateSongMetadata.mockResolvedValue({ data: { id: 'song-1' } })
  })

  it('saves edited metadata and a new cover', async () => {
    const onClose = vi.fn()
    render(
      <SongEditDialog
        record={{
          id: 'song-1',
          title: 'Old title',
          artist: 'Old artist',
          album: 'Old album',
        }}
        onClose={onClose}
      />,
    )

    fireEvent.change(screen.getByLabelText(/resources\.song\.fields\.title/), {
      target: { value: 'New title' },
    })
    fireEvent.change(screen.getByLabelText(/resources\.song\.fields\.artist/), {
      target: { value: 'New artist' },
    })
    fireEvent.change(screen.getByLabelText(/resources\.song\.fields\.album/), {
      target: { value: 'New album' },
    })
    const cover = new File(['image'], 'cover.jpg', { type: 'image/jpeg' })
    fireEvent.change(screen.getByTestId('song-cover-input'), {
      target: { files: [cover] },
    })
    fireEvent.click(screen.getByText('ra.action.save'))

    await waitFor(() =>
      expect(mockUpdateSongMetadata).toHaveBeenCalledWith(
        'song-1',
        {
          title: 'New title',
          artist: 'New artist',
          album: 'New album',
        },
        cover,
      ),
    )
    expect(mockRefresh).toHaveBeenCalled()
    expect(onClose).toHaveBeenCalled()
    expect(mockNotify).toHaveBeenCalledWith(
      'resources.song.notifications.updated',
      'success',
    )
  })

  it('keeps the dialog open when saving fails', async () => {
    const onClose = vi.fn()
    mockUpdateSongMetadata.mockRejectedValue(new Error('save failed'))
    render(
      <SongEditDialog
        record={{ id: 'song-1', title: 'Title', artist: 'Artist' }}
        onClose={onClose}
      />,
    )

    fireEvent.click(screen.getByText('ra.action.save'))

    await waitFor(() =>
      expect(mockNotify).toHaveBeenCalledWith('save failed', {
        type: 'warning',
        multiLine: true,
      }),
    )
    expect(onClose).not.toHaveBeenCalled()
  })
})
