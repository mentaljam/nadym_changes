import 'leaflet/dist/leaflet.css'
import './index.css'

import {ProgressBar} from './progressbar'


declare global {
  const progress: ProgressBar
}
const progress = new ProgressBar()


import('./main')
  .then((main) => {
    progress.increase(20);
    (main.default || main)()
  })
  .catch(() => {
    const div = document.getElementById('nc-loading')
    if (div) {
      div.innerText = 'Internal error'
    }
  })
