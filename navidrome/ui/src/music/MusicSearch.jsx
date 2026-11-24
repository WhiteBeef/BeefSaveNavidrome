import React, { useCallback, useEffect, useState } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import CloudDownloadIcon from '@material-ui/icons/CloudDownload'
import SearchIcon from '@material-ui/icons/Search'
import { Title, useNotify, useTranslate } from 'react-admin'
import { useDirectDataProvider } from '../dataProvider'

const useStyles = makeStyles((theme) => ({
  root: { marginTop: theme.spacing(2) },
  form: {
    display: 'flex',
    gap: theme.spacing(2),
    alignItems: 'flex-end',
    flexWrap: 'wrap',
  },
  query: { flex: '1 1 320px' },
  select: { minWidth: 180 },
  results: { marginTop: theme.spacing(3) },
  provider: { whiteSpace: 'nowrap' },
}))

const externalProviders = ['YANDEX', 'SOUNDCLOUD', 'YOUTUBE_MUSIC']

const MusicSearch = () => {
  const classes = useStyles()
  const dataProvider = useDirectDataProvider()
  const notify = useNotify()
  const translate = useTranslate()
  const [plugins, setPlugins] = useState([])
  const [plugin, setPlugin] = useState('')
  const [provider, setProvider] = useState('')
  const [query, setQuery] = useState('')
  const [tracks, setTracks] = useState([])
  const [searching, setSearching] = useState(false)
  const [downloading, setDownloading] = useState('')

  useEffect(() => {
    dataProvider
      .getMusicPlugins()
      .then(({ data }) => {
        const names = data.providers || []
        setPlugins(names)
        if (names.length > 0) setPlugin(names[0])
      })
      .catch((error) => notify(error.message, { type: 'warning' }))
  }, [dataProvider, notify])

  const search = useCallback(
    (event) => {
      event.preventDefault()
      if (!query.trim() || !plugin) return
      setSearching(true)
      dataProvider
        .searchMusic(plugin, query.trim(), provider)
        .then(({ data }) => setTracks(data.tracks || []))
        .catch((error) => notify(error.message, { type: 'warning' }))
        .finally(() => setSearching(false))
    },
    [dataProvider, notify, plugin, provider, query],
  )

  const download = useCallback(
    (track) => {
      setDownloading(track.key)
      dataProvider
        .downloadMusic({
          plugin,
          key: track.key,
          provider: track.provider,
        })
        .then(({ data }) => {
          notify('musicDownload.downloadSuccess', {
            type: 'info',
            messageArgs: { path: data.path },
          })
        })
        .catch((error) => notify(error.message, { type: 'warning' }))
        .finally(() => setDownloading(''))
    },
    [dataProvider, notify, plugin],
  )

  return (
    <Card className={classes.root}>
      <Title title={translate('menu.musicDownload')} />
      <CardContent>
        <Typography variant="h5" gutterBottom>
          {translate('musicDownload.title')}
        </Typography>
        <Typography color="textSecondary" paragraph>
          {translate('musicDownload.description')}
        </Typography>
        <form onSubmit={search} className={classes.form}>
          {plugins.length > 1 && (
            <FormControl className={classes.select}>
              <InputLabel>{translate('musicDownload.plugin')}</InputLabel>
              <Select
                value={plugin}
                onChange={(event) => setPlugin(event.target.value)}
              >
                {plugins.map((name) => (
                  <MenuItem key={name} value={name}>
                    {name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          <FormControl className={classes.select}>
            <InputLabel>{translate('musicDownload.provider')}</InputLabel>
            <Select
              value={provider}
              onChange={(event) => setProvider(event.target.value)}
            >
              <MenuItem value="">
                {translate('musicDownload.allProviders')}
              </MenuItem>
              {externalProviders.map((name) => (
                <MenuItem key={name} value={name}>
                  {name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            className={classes.query}
            label={translate('musicDownload.query')}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            autoFocus
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={searching || !plugin || !query.trim()}
            startIcon={
              searching ? <CircularProgress size={18} /> : <SearchIcon />
            }
          >
            {translate('musicDownload.search')}
          </Button>
        </form>
        {tracks.length > 0 && (
          <Box className={classes.results}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{translate('musicDownload.track')}</TableCell>
                  <TableCell>{translate('musicDownload.artist')}</TableCell>
                  <TableCell>{translate('musicDownload.source')}</TableCell>
                  <TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {tracks.map((track) => (
                  <TableRow key={track.key}>
                    <TableCell>{track.title}</TableCell>
                    <TableCell>{track.artist}</TableCell>
                    <TableCell className={classes.provider}>
                      {track.provider}
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        color="primary"
                        disabled={downloading !== ''}
                        onClick={() => download(track)}
                        startIcon={
                          downloading === track.key ? (
                            <CircularProgress size={18} />
                          ) : (
                            <CloudDownloadIcon />
                          )
                        }
                      >
                        {translate('musicDownload.download')}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
      </CardContent>
    </Card>
  )
}

export default MusicSearch
