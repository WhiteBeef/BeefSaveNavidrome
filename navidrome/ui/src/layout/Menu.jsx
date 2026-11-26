import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import { makeStyles } from '@material-ui/core'
import clsx from 'clsx'
import { useTranslate, MenuItemLink, getResources } from 'react-admin'
import ViewListIcon from '@material-ui/icons/ViewList'
import HomeIcon from '@material-ui/icons/Home'
import AlbumIcon from '@material-ui/icons/Album'
import SubMenu from './SubMenu'
import CloudDownloadIcon from '@material-ui/icons/CloudDownload'
import CloudUploadIcon from '@material-ui/icons/CloudUpload'
import { humanize, pluralize } from 'inflection'
import albumLists from '../album/albumLists'
import LibrarySelector from '../common/LibrarySelector'
import config from '../config'

const useStyles = makeStyles((theme) => ({
  root: {
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1),
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    padding: theme.spacing(0, 1),
    paddingBottom: (props) => (props.addPadding ? '80px' : '20px'),
  },
  open: {
    width: 240,
  },
  closed: {
    width: 55,
    padding: 0,
  },
  active: {
    color: theme.palette.primary.main,
    background: theme.palette.action.selected,
    fontWeight: 'bold',
  },
}))

const translatedResourceName = (resource, translate) =>
  translate(`resources.${resource.name}.name`, {
    smart_count: 2,
    _:
      resource.options && resource.options.label
        ? translate(resource.options.label, {
            smart_count: 2,
            _: resource.options.label,
          })
        : humanize(pluralize(resource.name)),
  })

const Menu = ({ dense = false }) => {
  const open = useSelector((state) => state.admin.ui.sidebarOpen)
  const translate = useTranslate()
  const queue = useSelector((state) => state.player?.queue)
  const classes = useStyles({ addPadding: queue.length > 0 })
  const resources = useSelector(getResources)
  const [isAlbumListOpen, setIsAlbumListOpen] = useState(false)

  const renderResourceMenuItemLink = (resource) => (
    <MenuItemLink
      key={resource.name}
      to={`/${resource.name}`}
      activeClassName={classes.active}
      primaryText={translatedResourceName(resource, translate)}
      leftIcon={resource.icon || <ViewListIcon />}
      sidebarIsOpen={open}
      dense={dense}
    />
  )

  const renderAlbumMenuItemLink = (type, al) => {
    const resource = resources.find((r) => r.name === 'album')
    if (!resource) {
      return null
    }

    const albumListAddress = `/album/${type}`

    const name = translate(`resources.album.lists.${type || 'default'}`, {
      _: translatedResourceName(resource, translate),
    })

    return (
      <MenuItemLink
        key={albumListAddress}
        to={albumListAddress}
        activeClassName={classes.active}
        primaryText={name}
        leftIcon={al.icon || <ViewListIcon />}
        sidebarIsOpen={open}
        dense={dense}
        exact
      />
    )
  }

  const subItems = (subMenu) => (resource) =>
    resource.hasList && resource.options && resource.options.subMenu === subMenu

  return (
    <div
      className={clsx(classes.root, {
        [classes.open]: open,
        [classes.closed]: !open,
      })}
    >
      {open && <LibrarySelector />}
      <MenuItemLink
        to="/"
        exact
        activeClassName={classes.active}
        primaryText={translate('menu.home', { _: 'Home' })}
        leftIcon={<HomeIcon />}
        sidebarIsOpen={open}
        dense={dense}
      />
      <SubMenu
        handleToggle={() => setIsAlbumListOpen((value) => !value)}
        isOpen={isAlbumListOpen}
        sidebarIsOpen={open}
        name="menu.albumList"
        icon={<AlbumIcon />}
        dense={dense}
      >
        {Object.keys(albumLists).map((type) =>
          renderAlbumMenuItemLink(type, albumLists[type]),
        )}
      </SubMenu>
      {config.pluginsEnabled && (
        <MenuItemLink
          to="/music"
          activeClassName={classes.active}
          primaryText={translate('menu.musicDownload')}
          leftIcon={<CloudDownloadIcon />}
          sidebarIsOpen={open}
          dense={dense}
        />
      )}
      {localStorage.getItem('role') === 'admin' && (
        <MenuItemLink
          to="/upload"
          activeClassName={classes.active}
          primaryText={translate('home.uploadTrack')}
          leftIcon={<CloudUploadIcon />}
          sidebarIsOpen={open}
          dense={dense}
        />
      )}
      {resources.filter(subItems(undefined)).map(renderResourceMenuItemLink)}
    </div>
  )
}

export default Menu
