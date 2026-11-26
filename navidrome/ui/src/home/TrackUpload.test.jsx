import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { TrackUpload } from './TrackUpload'

const { mockNotify, mockUploadTrack } = vi.hoisted(() => ({
  mockNotify: vi.fn(),
  mockUploadTrack: vi.fn(),
}))

vi.mock('react-admin', () => ({
  useNotify: () => mockNotify,
  useTranslate: () => (key) => key,
}))

vi.mock('../dataProvider', () => ({
  useDirectDataProvider: () => ({ uploadTrack: mockUploadTrack }),
}))

describe('TrackUpload', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.setItem('role', 'admin')
    mockUploadTrack.mockResolvedValue({ data: { fileName: 'track.mp3' } })
  })

  it('uploads a dropped audio file', async () => {
    render(<TrackUpload />)
    const file = new File(['audio'], 'track.mp3', { type: 'audio/mpeg' })

    fireEvent.drop(screen.getByTestId('track-upload-dropzone'), {
      dataTransfer: { files: [file] },
    })

    await waitFor(() => expect(mockUploadTrack).toHaveBeenCalledWith(file))
    expect(mockNotify).toHaveBeenCalledWith('home.uploadSuccess', {
      type: 'success',
      messageArgs: { name: 'track.mp3' },
    })
  })

  it('uploads a file chosen with the file picker', async () => {
    render(<TrackUpload />)
    const file = new File(['audio'], 'chosen.flac', { type: 'audio/flac' })
    mockUploadTrack.mockResolvedValue({ data: { fileName: 'chosen.flac' } })

    fireEvent.change(screen.getByTestId('track-upload-input'), {
      target: { files: [file] },
    })

    await waitFor(() => expect(mockUploadTrack).toHaveBeenCalledWith(file))
  })

  it('rejects files larger than 500 MiB before uploading', async () => {
    render(<TrackUpload />)
    const file = new File(['audio'], 'large.mp3', { type: 'audio/mpeg' })
    Object.defineProperty(file, 'size', { value: 500 * 1024 * 1024 + 1 })

    fireEvent.drop(screen.getByTestId('track-upload-dropzone'), {
      dataTransfer: { files: [file] },
    })

    expect(mockUploadTrack).not.toHaveBeenCalled()
    expect(mockNotify).toHaveBeenCalledWith('home.uploadTooLarge', 'warning')
  })

  it('is hidden from regular users', () => {
    localStorage.setItem('role', 'regular')
    const { container } = render(<TrackUpload />)

    expect(container).toBeEmptyDOMElement()
  })
})
