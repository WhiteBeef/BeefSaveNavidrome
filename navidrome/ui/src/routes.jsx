import React from 'react'
import { Route } from 'react-router-dom'
import Personal from './personal/Personal'
import MusicSearch from './music/MusicSearch'

const routes = [
  <Route exact path="/personal" render={() => <Personal />} key={'personal'} />,
  <Route exact path="/music" render={() => <MusicSearch />} key={'music'} />,
]

export default routes
