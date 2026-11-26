import React from 'react'
import { render, fireEvent, screen, waitFor } from '@testing-library/react'
import { TestContext } from 'ra-test'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SongContextMenu } from './SongContextMenu'
import subsonic from '../subsonic'

vi.mock('../subsonic', () => ({
  default: { getSimilarSongs2: vi.fn() },
}))

vi.mock('../config', () => ({
  default: {
    enableDownloads: true,
    enableFavourites: true,
    enableSharing: true,
    enableExternalServices: true,
  },
}))

const mockDispatch = vi.fn()
vi.mock('react-redux', () => ({ useDispatch: () => mockDispatch }))

const mockNotify = vi.fn()

vi.mock('react-admin', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useNotify: () => mockNotify,
    useDataProvider: () => ({
      inspect: vi.fn().mockResolvedValue({
        data: { rawTags: {} },
      }),
    }),
  }
})

describe('SongContextMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    subsonic.getSimilarSongs2.mockResolvedValue({
      json: {
        'subsonic-response': {
          status: 'ok',
          similarSongs2: { song: [{ id: 's1' }] },
        },
      },
    })
  })

  describe('Instant Mix action', () => {
    it('calls getSimilarSongs2 with song id and shows loading notification', async () => {
      render(
        <TestContext>
          <SongContextMenu record={{ id: 'song1', size: 1 }} resource="song" />
        </TestContext>,
      )

      fireEvent.click(screen.getAllByRole('button')[1])
      await waitFor(() =>
        screen.getByText(/resources\.song\.actions\.instantMix/),
      )
      fireEvent.click(screen.getByText(/resources\.song\.actions\.instantMix/))

      // Verify loading notification is shown
      expect(mockNotify).toHaveBeenCalledWith('message.startingInstantMix', {
        type: 'info',
      })

      await waitFor(() =>
        expect(subsonic.getSimilarSongs2).toHaveBeenCalledWith('song1', 100),
      )
      expect(mockDispatch).toHaveBeenCalled()
    })

    it('plays seed song first followed by similar songs', async () => {
      const seedRecord = { id: 'song1', title: 'Seed Song', size: 1 }
      render(
        <TestContext>
          <SongContextMenu record={seedRecord} resource="song" />
        </TestContext>,
      )

      fireEvent.click(screen.getAllByRole('button')[1])
      await waitFor(() =>
        screen.getByText(/resources\.song\.actions\.instantMix/),
      )
      fireEvent.click(screen.getByText(/resources\.song\.actions\.instantMix/))

      await waitFor(() => expect(mockDispatch).toHaveBeenCalled())

      // Verify dispatch was called with playTracks action
      const dispatchCall = mockDispatch.mock.calls.find(
        (call) => call[0]?.type === 'PLAYER_PLAY_TRACKS',
      )
      expect(dispatchCall).toBeDefined()

      // Verify seed song is first (id property contains the first song to play)
      const { id, data } = dispatchCall[0]
      expect(id).toBe('song1')
      // Verify seed song data is included
      expect(data['song1']).toBeDefined()
    })

    it('uses mediaFileId when available (playlist context)', async () => {
      render(
        <TestContext>
          <SongContextMenu
            record={{
              id: 'playlistTrackId',
              mediaFileId: 'actualSongId',
              size: 1,
            }}
            resource="song"
          />
        </TestContext>,
      )

      fireEvent.click(screen.getAllByRole('button')[1])
      await waitFor(() =>
        screen.getByText(/resources\.song\.actions\.instantMix/),
      )
      fireEvent.click(screen.getByText(/resources\.song\.actions\.instantMix/))

      await waitFor(() =>
        expect(subsonic.getSimilarSongs2).toHaveBeenCalledWith(
          'actualSongId',
          100,
        ),
      )

      await waitFor(() => expect(mockDispatch).toHaveBeenCalled())

      // Verify the mediaFileId is used as the seed song id
      const dispatchCall = mockDispatch.mock.calls.find(
        (call) => call[0]?.type === 'PLAYER_PLAY_TRACKS',
      )
      expect(dispatchCall).toBeDefined()
      const { id, data } = dispatchCall[0]
      expect(id).toBe('actualSongId')
      // Verify seed song data is included
      expect(data['actualSongId']).toBeDefined()
    })
  })
})
