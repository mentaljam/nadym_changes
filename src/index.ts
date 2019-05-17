import L from 'leaflet'

import 'leaflet-plugins/layer/tile/Bing.js'
import 'leaflet-plugins/layer/tile/Yandex.js'
import 'leaflet.sync'

import Cross from './cross'

import 'leaflet/dist/leaflet.css'

import './index.css'

const center: L.LatLngTuple = [65.534, 72.941]
const minZoom = 5
const maxZoom = 16
const zoom = 7
const maxBounds: L.LatLngBoundsLiteral = [
  [62.77393131014897, 68.23632868674484],
  [68.29398120986096, 77.64595756645700]
]

const imageLayer = L.tileLayer('corona/{z}/{x}/{y}.png', {
  attribution: 'Corona KH-4 21.08.1968'
})

const imageMap = L.map('image-map', {
  layers: [imageLayer],
  center,
  minZoom,
  maxZoom,
  zoom,
  maxBounds,
})

imageMap.addControl(new Cross())

const baseLayers = {
  'Bing Maps': new L.BingLayer(BING_KEY, {type: 'AerialWithLabels'}),
  'Yandex.Maps': new L.Yandex('hybrid'),
}

const baseMap = L.map('base-map', {
  layers: [baseLayers['Yandex.Maps']],
  center,
  minZoom,
  maxZoom,
  zoom,
  zoomControl: false,
  maxBounds,
})

baseMap
  .addControl(new Cross())
  .addControl(L.control.layers(baseLayers, undefined, {
    collapsed: false,
  }))

imageMap.sync(baseMap)
baseMap.sync(imageMap)
