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
