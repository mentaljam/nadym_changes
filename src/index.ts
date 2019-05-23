import L from 'leaflet'

import 'leaflet-plugins/layer/tile/Bing.js'
import 'leaflet-plugins/layer/tile/Yandex.js'
import 'leaflet.sync'

import CrossSVG from './cross.svg'

import 'leaflet/dist/leaflet.css'

import './index.css'

const center: L.LatLngTuple = [65.534, 72.941]
const minZoom = 5
const maxZoom = 16
const zoom = 7
const maxBounds: L.LatLngBoundsLiteral = MAX_BOUNDS

const imageLayer = L.tileLayer('corona/{z}/{x}/{y}.jpg', {
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
  layers: [gfwLayer],
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

imageMap.sync(baseMap)
baseMap.sync(imageMap)
