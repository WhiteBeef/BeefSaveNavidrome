import React from 'react'
import ShuffleIcon from '@material-ui/icons/Shuffle'
import LibraryAddIcon from '@material-ui/icons/LibraryAdd'
import RepeatIcon from '@material-ui/icons/Repeat'
import AlbumIcon from '@material-ui/icons/Album'
import FavoriteIcon from '@material-ui/icons/Favorite'
import FavoriteBorderIcon from '@material-ui/icons/FavoriteBorder'
import AlbumOutlinedIcon from '@material-ui/icons/AlbumOutlined'
import LibraryAddOutlinedIcon from '@material-ui/icons/LibraryAddOutlined'
import config from '../config'
import DynamicMenuIcon from '../layout/DynamicMenuIcon'

const albumLists = {
  all: {
    icon: (
      <DynamicMenuIcon
        path={'album/all'}
        icon={AlbumOutlinedIcon}
        activeIcon={AlbumIcon}
      />
    ),
    params: 'sort=name&order=ASC&filter={}',
  },
  random: {
    icon: <ShuffleIcon />,
    params: 'sort=random&order=ASC&filter={}',
  },
  ...(config.enableFavourites && {
    starred: {
      icon: (
        <DynamicMenuIcon
          path={'album/starred'}
          icon={FavoriteBorderIcon}
          activeIcon={FavoriteIcon}
        />
      ),
      params: 'sort=starred_at&order=DESC&filter={"starred":true}',
    },
  }),
  recentlyAdded: {
    icon: (
      <DynamicMenuIcon
        path={'album/recentlyAdded'}
        icon={LibraryAddOutlinedIcon}
        activeIcon={LibraryAddIcon}
      />
    ),
    params: 'sort=recently_added&order=DESC&filter={}',
  },
  mostPlayed: {
    icon: <RepeatIcon />,
    params: 'sort=play_count&order=DESC&filter={"recently_played":true}',
  },
}

export default albumLists
export const defaultAlbumList = 'recentlyAdded'
