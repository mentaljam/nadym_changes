import L from 'leaflet'

import 'leaflet-plugins/layer/tile/Bing.js'
import 'leaflet-plugins/layer/tile/Yandex.js'
import 'leaflet.sync'

import CrossSVG from './cross.svg'

import 'leaflet/dist/leaflet.css'

import './index.css'

// Constants
const viewKey = 'nadym_view'
const minZoom = 5
const maxZoom = 16
const maxBounds: L.LatLngBoundsLiteral = MAX_BOUNDS

// Restore view
interface ILastView {
  lat: number
  lng: number
  zoom: number
}
const lastViewJSON = localStorage.getItem(viewKey)
const lastView: ILastView | null = lastViewJSON && JSON.parse(lastViewJSON)
const center: L.LatLngTuple = lastView ? [lastView.lat, lastView.lng] : [65.534, 72.941]
const zoom = lastView ? lastView.zoom : 7

// `GEOSERVER_URL` will be concatenated by terser
const wmtsUrlTmpl = (layer: string) => (GEOSERVER_URL + `/gwc/service/wmts?\
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

const imageLayer = L.tileLayer(wmtsUrlTmpl('KH_4b_19680821_2m'), {
  attribution: 'Corona KH-4 21.08.1968',
  bounds: CORONA_BOUNDS,
})

const imageMap = L.map('image-map', {
  layers: [imageLayer],
  center,
  minZoom,
  maxZoom,
  zoom,
  maxBounds,
})

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

baseMap.addControl(L.control.layers(baseLayers, undefined, {
  collapsed: false,
}))

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
const saveView = () => {
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
  viewTimeout = setTimeout(saveView, 1000) as any
})
