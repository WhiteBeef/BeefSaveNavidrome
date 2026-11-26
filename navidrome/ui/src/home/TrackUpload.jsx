import React, { useCallback, useRef, useState } from 'react'
import { Button, CircularProgress, Typography } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import CloudUploadIcon from '@material-ui/icons/CloudUpload'
import { useNotify, useTranslate } from 'react-admin'
import { useDirectDataProvider } from '../dataProvider'

const MAX_FILE_SIZE = 500 * 1024 * 1024

const useStyles = makeStyles((theme) => ({
  root: {
    width: 'min(100%, 560px)',
    boxSizing: 'border-box',
    margin: theme.spacing(3, 'auto', 0),
    padding: theme.spacing(2),
    border: '1px dashed rgba(20, 184, 166, 0.45)',
    borderRadius: 16,
    textAlign: 'center',
    transition: 'border-color 150ms, background-color 150ms',
  },
  active: {
    borderColor: theme.palette.primary.main,
    backgroundColor: 'rgba(20, 184, 166, 0.08)',
  },
  hint: {
    marginTop: theme.spacing(1),
    color: theme.palette.text.secondary,
  },
}))

export const TrackUpload = () => {
  const classes = useStyles()
  const dataProvider = useDirectDataProvider()
  const notify = useNotify()
  const translate = useTranslate()
  const inputRef = useRef(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  const upload = useCallback(
    async (file) => {
      if (!file || isUploading) return
      if (file.size > MAX_FILE_SIZE) {
        notify('home.uploadTooLarge', 'warning')
        return
      }
      setIsUploading(true)
      try {
        const { data } = await dataProvider.uploadTrack(file)
        notify('home.uploadSuccess', {
          type: 'success',
          messageArgs: { name: data.fileName },
        })
      } catch (error) {
        notify(error.message || 'home.uploadError', 'warning')
      } finally {
        setIsUploading(false)
        if (inputRef.current) inputRef.current.value = ''
      }
    },
    [dataProvider, isUploading, notify],
  )

  const handleDrop = useCallback(
    (event) => {
      event.preventDefault()
      setIsDragging(false)
      upload(event.dataTransfer.files[0])
    },
    [upload],
  )

  if (localStorage.getItem('role') !== 'admin') return null

  return (
    <div
      className={`${classes.root} ${isDragging ? classes.active : ''}`}
      data-testid="track-upload-dropzone"
      onDragOver={(event) => {
        event.preventDefault()
        event.dataTransfer.dropEffect = 'copy'
        setIsDragging(true)
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept="audio/*,.mp3,.flac,.m4a,.ogg,.opus,.wav,.aiff,.aif,.aac,.wma"
        hidden
        data-testid="track-upload-input"
        onChange={(event) => upload(event.target.files[0])}
      />
      <Button
        variant="outlined"
        color="primary"
        disabled={isUploading}
        onClick={() => inputRef.current?.click()}
        startIcon={
          isUploading ? <CircularProgress size={18} /> : <CloudUploadIcon />
        }
      >
        {translate(isUploading ? 'home.uploadingTrack' : 'home.uploadTrack')}
      </Button>
      <Typography variant="body2" className={classes.hint}>
        {translate('home.uploadHint')}
      </Typography>
    </div>
  )
}
