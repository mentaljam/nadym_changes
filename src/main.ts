import {Feature} from 'geojson'
import L from 'leaflet'

import 'leaflet-plugins/layer/tile/Bing.js'
import 'leaflet-plugins/layer/tile/Yandex.js'
import 'leaflet.sync'

import BookmarksControl from './bookmarks'
import CoordinatesControl from './coordinates'
import FitToExtentControl from './fittoextent'
import {ProgressBar} from './progressbar'

import CrossSVG from './cross.svg'


interface ILastView {
  lat: number
  lng: number
  zoom: number
}

interface IBoundProps {
  name: string
  s: number
}

// Constants
const viewKey = 'nadym_view'
const minZoom = 5
const maxZoom = 16
const maxBounds: L.LatLngBoundsLiteral = MAX_BOUNDS
  
// `GEOSERVER_URL` will be concatenated by terser
const wmtsUrlTmpl = (layer: string): string => (GEOSERVER_URL + `/gwc/service/wmts?\
Service=WMTS&\
Version=1.0.0&\
Request=GetTile&\
Format=image/jpeg&\
tilematrixset=nadym&\
TileMatrix=nadym:{z}&\
TileCol={x}&\
TileRow={y}&\
layer=nadym:`
).concat(layer)

const geoJSON = async (name: string, style: L.PathOptions): Promise<L.GeoJSON<unknown>> => {
  const reply = await fetch(GEOSERVER_URL + `/nadym/wfs?\
version=1.0.0&\
request=GetFeature&\
outputFormat=application%2Fjson&\
typeName=nadym%3A` + name)
  const json = await reply.json()
  return L.geoJSON(json, {style})
}

const scaleBar = (): L.Control.Scale => new L.Control.Scale({imperial: false})

const loadImageMapLayers = async (map: L.Map, progress: ProgressBar): Promise<void> => {
  const bookmarks = await geoJSON('nadym_examples', {
    fill: false,
    weight: 0.8,
    color: 'yellow',
  })
  map
    .addLayer(bookmarks)
    .addControl(new BookmarksControl(bookmarks))
  progress.increase()

  const bounds = await geoJSON('nadym_bounds', {
    fill: false,
    color: 'brown',
  })
  map.addLayer(bounds)
  bounds.eachLayer(l => {
    L.marker((l as L.GeoJSON<IBoundProps>).getBounds().getCenter(), {
      icon: L.divIcon({
        className: 'nc-marker',
        html: ((l as L.GeoJSON<IBoundProps>).feature as Feature<any, IBoundProps>).properties.name,
      }),
    }).addTo(map)
  })    
  progress.increase()
}

const addFireOverlays = async (control: L.Control.Layers, progress: ProgressBar): Promise<void> => {
  const config: Array<[number, string]> = [
    [1968, 'yellow'],
    [1988, 'gold'],
    [2001, 'goldenrod'],
    [2016, 'orange'],
    [2018, 'orangered'],
  ]
  for (const [year, fillColor] of config) {
    const fireLayer = await geoJSON('nadym_fire_' + year, {
      color: 'darkgray',
      weight: 0.5,
      fillColor,
      fillOpacity: 0.8,
    })
    control.addOverlay(fireLayer, 'Fires ' + year)
    progress.increase()
  }
}

export default (progress: ProgressBar): void => {
  // Restore view
  const lastViewJSON = localStorage.getItem(viewKey)
  const lastView: ILastView | null = lastViewJSON && JSON.parse(lastViewJSON)
  const center: L.LatLngTuple = lastView ? [lastView.lat, lastView.lng] : [65.534, 72.941]
  const zoom = lastView ? lastView.zoom : 7
  
  const imageLayer = L.tileLayer(wmtsUrlTmpl('KH_4b_19680821_2m'), {
    attribution: 'Corona KH-4 21.08.1968',
    bounds: CORONA_BOUNDS,
  })

  // Remove the `Loading...` placeholder
  progress.increase()
  const loading = document.querySelector('#nc-loading') as Element
  loading.parentElement && loading.parentElement.removeChild(loading)
  const maps = document.getElementsByClassName('nc-map')
  for (const m of maps) {
    m.removeAttribute('hidden')
  }

  const imageMap = L.map('image-map', {
    layers: [imageLayer],
    center,
    minZoom,
    maxZoom,
    zoom,
    maxBounds,
  })

  imageMap
    .addControl(new FitToExtentControl())
    .addControl(scaleBar())

  loadImageMapLayers(imageMap, progress)

  const gfwLayer = new L.TileLayer(
    'https://storage.googleapis.com/earthenginepartners-hansen/tiles/gfc_v1.6/loss_tree_gain/{z}/{x}/{y}.png', {
      maxNativeZoom: 12,
      attribution: '&copy; <a href="http://www.glad.umd.edu/">Hansen/UMD/Google/USGS/NASA</a>',
    })

  const baseLayers = {
    'Bing Maps': new L.BingLayer(BING_KEY, {type: 'AerialWithLabels'}),
    'Yandex.Maps': new L.Yandex('hybrid'),
    'Global Forest Watch<br/>Loss/Extent/Gain<br/>(Red/Green/Blue)': gfwLayer,
  }

  const baseMap = L.map('base-map', {
    layers: [baseLayers['Bing Maps']],
    center,
    minZoom,
    maxZoom,
    zoom,
    zoomControl: false,
    maxBounds,
  })

  const baseMapLayers = L.control.layers(baseLayers, undefined, {
    collapsed: false,
  })

  baseMap
    .addControl(baseMapLayers)
    .addControl(scaleBar())

  addFireOverlays(baseMapLayers, progress)

  const demLayer = new L.TileLayer(wmtsUrlTmpl('dem1968'), {
    attribution: 'ArcticDEM &copy; <a href="https://www.nga.mil/">NGA</a> &amp; <a href="https://www.pgc.umn.edu">PGC</a> 2018',
    bounds: CORONA_BOUNDS,
    maxNativeZoom: 15,
  })

  const demMap = L.map('dem-map', {
    layers: [demLayer],
    center,
    minZoom,
    maxZoom,
    zoom,
    zoomControl: false,
    maxBounds,
  })

  demMap
    .addControl(scaleBar())
    .addControl(new CoordinatesControl())

  const crossContainers = document.getElementsByClassName('nc-cross')
  for (const cc of crossContainers) {
    cc.innerHTML = CrossSVG
  }

  imageMap.sync(demMap)
  imageMap.sync(baseMap)
  demMap.sync(imageMap)
  demMap.sync(baseMap)
  baseMap.sync(imageMap)
  baseMap.sync(demMap)

  // Save view
  let viewTimeout: number
  const saveView = (): void => {
    if (!imageMap._loaded) {
      return
    }
    const {lat, lng} = imageMap.getCenter()
    localStorage.setItem(viewKey, JSON.stringify({
      lat,
      lng,
      zoom: imageMap.getZoom(),
    }))
  }
  imageMap.on('moveend', () => {
    if (viewTimeout) {
      clearTimeout(viewTimeout)
    }
    viewTimeout = setTimeout(saveView, 1000)
  })
}
