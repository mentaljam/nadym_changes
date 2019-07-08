import 'leaflet/dist/leaflet.css'
import './index.css'


import('./main')
  .then((main) => (main.default || main)())
  .catch(() => {
    const div = document.getElementById('nc-loading')
    if (div) {
      div.innerText = 'Internal error'
    }
  })
