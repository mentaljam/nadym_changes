import 'leaflet/dist/leaflet.css'
import './index.css'


import('./main')
  .then((main) => (main.default || main)())
  .catch(() => {
    (document.querySelector('#nc-loading') as HTMLDivElement).innerText = 'Internal error'
  })
