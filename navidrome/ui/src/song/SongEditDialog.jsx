import React, { useEffect, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import ImageIcon from '@material-ui/icons/Image'
import { useNotify, useRefresh, useTranslate } from 'react-admin'
import { Artwork } from '../common/Artwork'
import { useDirectDataProvider } from '../dataProvider'

const useStyles = makeStyles((theme) => ({
  form: {
    display: 'grid',
    gap: theme.spacing(2),
    paddingTop: theme.spacing(1),
  },
  coverSection: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(2),
  },
  cover: {
    width: 120,
    height: 120,
    flexShrink: 0,
    borderRadius: 8,
    objectFit: 'cover',
  },
  coverControls: {
    minWidth: 0,
    display: 'grid',
    gap: theme.spacing(1),
    justifyItems: 'start',
  },
  fileName: {
    maxWidth: 280,
    overflow: 'hidden',
    color: theme.palette.text.secondary,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
}))

export const SongEditDialog = ({ record, onClose }) => {
  const classes = useStyles()
  const dataProvider = useDirectDataProvider()
  const notify = useNotify()
  const refresh = useRefresh()
  const translate = useTranslate()
  const inputRef = useRef(null)
  const [title, setTitle] = useState('')
  const [artist, setArtist] = useState('')
  const [album, setAlbum] = useState('')
  const [cover, setCover] = useState(null)
  const [coverPreview, setCoverPreview] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    setTitle(record?.title || '')
    setArtist(record?.artist || '')
    setAlbum(record?.album || '')
    setCover(null)
  }, [record])

  useEffect(() => {
    if (!cover) {
      setCoverPreview('')
      return undefined
    }
    const preview = URL.createObjectURL(cover)
    setCoverPreview(preview)
    return () => URL.revokeObjectURL(preview)
  }, [cover])

  const handleClose = () => {
    if (!isSaving) onClose()
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    event.stopPropagation()
    if (!record || isSaving) return
    setIsSaving(true)
    try {
      await dataProvider.updateSongMetadata(
        record.mediaFileId || record.id,
        { title, artist, album },
        cover,
      )
      notify('resources.song.notifications.updated', 'success')
      refresh()
      onClose()
    } catch (error) {
      notify(error.message || 'resources.song.notifications.updateError', {
        type: 'warning',
        multiLine: true,
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog
      open={Boolean(record)}
      onClose={handleClose}
      onClick={(event) => event.stopPropagation()}
      fullWidth
      maxWidth="sm"
      aria-labelledby="song-edit-dialog-title"
    >
      <DialogTitle id="song-edit-dialog-title">
        {translate('resources.song.actions.edit')}
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent className={classes.form}>
          <TextField
            id="song-edit-title"
            label={translate('resources.song.fields.title')}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            inputProps={{ maxLength: 1000 }}
            variant="outlined"
            required
            fullWidth
          />
          <TextField
            id="song-edit-artist"
            label={translate('resources.song.fields.artist')}
            value={artist}
            onChange={(event) => setArtist(event.target.value)}
            inputProps={{ maxLength: 1000 }}
            variant="outlined"
            required
            fullWidth
          />
          <TextField
            id="song-edit-album"
            label={translate('resources.song.fields.album')}
            value={album}
            onChange={(event) => setAlbum(event.target.value)}
            inputProps={{ maxLength: 1000 }}
            variant="outlined"
            fullWidth
          />
          <div className={classes.coverSection}>
            {coverPreview ? (
              <img
                src={coverPreview}
                className={classes.cover}
                alt={translate('resources.song.fields.coverArt')}
              />
            ) : (
              record && (
                <Artwork
                  record={record}
                  size={240}
                  square
                  className={classes.cover}
                  title={record.title}
                />
              )
            )}
            <div className={classes.coverControls}>
              <Button
                variant="outlined"
                startIcon={<ImageIcon />}
                onClick={() => inputRef.current?.click()}
              >
                {translate('resources.song.actions.changeCover')}
              </Button>
              <Typography variant="body2" className={classes.fileName}>
                {cover?.name || translate('resources.song.fields.coverArt')}
              </Typography>
              <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                hidden
                data-testid="song-cover-input"
                onChange={(event) => setCover(event.target.files[0] || null)}
              />
            </div>
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={isSaving}>
            {translate('ra.action.cancel')}
          </Button>
          <Button
            type="submit"
            color="primary"
            variant="contained"
            disabled={isSaving || !title.trim() || !artist.trim()}
            startIcon={isSaving ? <CircularProgress size={18} /> : null}
          >
            {translate('ra.action.save')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}

SongEditDialog.propTypes = {
  record: PropTypes.object,
  onClose: PropTypes.func.isRequired,
}
