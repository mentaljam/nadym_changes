import 'leaflet/dist/leaflet.css'
import './index.css'

import {ProgressBar} from './progressbar'


const progress = new ProgressBar()

import('./main')
  .then((main) => {
    progress.increase(20);
    (main.default || main)(progress)
  })
  .catch(() => {
    const div = document.getElementById('nc-loading')
    if (div) {
      div.innerText = 'Internal error'
    }
  })
