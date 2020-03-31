import {Feature} from 'geojson'
import L from 'leaflet'

import 'leaflet-plugins/layer/tile/Bing.js'
import 'leaflet-plugins/layer/tile/Yandex.js'
import 'leaflet.sync'
import 'leaflet-svg-shape-markers'

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

const geoJSON = async (name: string, options: Partial<L.GeoJSONOptions>): Promise<L.GeoJSON<unknown>> => {
  const reply = await fetch(GEOSERVER_URL + `/nadym/wfs?\
version=1.0.0&\
request=GetFeature&\
outputFormat=application%2Fjson&\
typeName=nadym%3A` + name)
  const json = await reply.json()
  return L.geoJSON(json, options)
}

const geeUrlTmpl = (layer: string): string =>
  `https://earthengine.googleapis.com/v1alpha/projects/earthengine-legacy/maps/${layer}/tiles/{z}/{x}/{y}`

const scaleBar = (): L.Control.Scale => new L.Control.Scale({imperial: false})

const loadImageMapLayers = async (map: L.Map, progress: ProgressBar): Promise<void> => {
  const bookmarks = await geoJSON('nadym_examples', {
    style: {
      fill: false,
      weight: 0.8,
      color: 'yellow',
    },
  })
  map
    .addLayer(bookmarks)
    .addControl(new BookmarksControl(bookmarks))
  progress.increase()

  const bounds = await geoJSON('nadym_bounds', {
    style: {
      fill: false,
      color: 'brown',
    },
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

const referenceShape = (change: string): L.ShapeMarkerOptions['shape'] => {
  switch (change) {
    case 'Dense forest':
      return 'square'
    case 'Sparse forest':
      return 'triangle'
    default:
      return 'circle'
  }
}

const addReferencePoints = async (control: L.Control.Layers, progress: ProgressBar): Promise<void> => {
  const config: Array<[string, string, string]> = [
    ['Tundra',     'reference_tundra',     'blue'],
    ['Burnt area', 'reference_burnt_area', 'red'],
  ]
  for (const [displayName, layerName, fillColor] of config) {
    const layer = await geoJSON(layerName, {
      pointToLayer({properties: {Change}}, latlng) {
        return L.shapeMarker(latlng, {
          color: 'black',
          fillColor,
          fillOpacity: 1,
          radius: 7,
          weight: 1,
          shape: referenceShape(Change),
        })
      },
    })
    layer.bindPopup('', {
      closeButton: false,
    })
    layer.on('mouseover', function (
      this: L.GeoJSON,
      {
        latlng,
        sourceTarget: {feature: {properties: {Change}}},
      }: L.LeafletMouseEvent) {
      this.setPopupContent(Change)
      this.openPopup(latlng)
    })
    layer.on('mouseout', function (this: L.GeoJSON) {
      this.closePopup()
    })
    control.addOverlay(layer, 'Reference – ' + displayName)
    progress.increase(5)
  }
}

function bringToBack(this: L.GeoJSON): void {
  this.bringToBack()
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
    const layer = await geoJSON('nadym_fire_' + year, {
      style: {
        color: 'darkgray',
        weight: 0.5,
        fillColor,
        fillOpacity: 0.8,
      },
    })
    layer.on('add', bringToBack)
    control.addOverlay(layer, 'Fires ' + year)
    progress.increase(8)
  }
}

const loadOverlays = async (control: L.Control.Layers, progress: ProgressBar): Promise<void> => {
  await addReferencePoints(control, progress)
  await addFireOverlays(control, progress)
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

  loadOverlays(baseMapLayers, progress)

  const customDemLayer = new L.TileLayer(wmtsUrlTmpl('dem1968'), {
    attribution:   'ArcticDEM &copy; <a href="https://www.nga.mil/">NGA</a> &amp; <a href="https://www.pgc.umn.edu">PGC</a> 2018',
    bounds:        CORONA_BOUNDS,
    maxNativeZoom: 15,
  })

  const elevationLayer = L.tileLayer(geeUrlTmpl('ab9061c7940d452bed963e4ba00d25f8-fe77f0bb2e05ef7d530aa873865dd345'), {
    maxNativeZoom: 15,
  })

  const hillshadeLayer = L.tileLayer(geeUrlTmpl('543faa05cc38092541a83a001f634d16-ded1d0a8cdce622697965b7d23c2f249'), {
    opacity:       0.45,
    maxNativeZoom: 15,
  })

  const arcticDemGroup = L.layerGroup([elevationLayer, hillshadeLayer], {
    attribution: 'ArcticDEM &copy; <a href="https://www.pgc.umn.edu">PGC</a> &amp; <a href="https://earthengine.google.com/">GEE</a> 2020',
  })

  const topoLayer = L.tileLayer('https://maps.marshruty.ru/ml.ashx?al=1&i=1&x={x}&y={y}&z={z}', {
    attribution:   '&copy; <a href="https://www.marshruty.ru">Маршруты.Ру</a> 2005-2020',
    minNativeZoom: 9,
    maxNativeZoom: 13,
  })

  const demLayers = {
    ArcticDEM:        customDemLayer,
   'ArcticDEM GEE':   arcticDemGroup,
   'Topographic map': topoLayer,
  }

  const demMapLayers = L.control.layers(demLayers, undefined, {
    collapsed: false,
  })

  const demMap = L.map('dem-map', {
    layers: [demLayers.ArcticDEM],
    center,
    minZoom,
    maxZoom,
    zoom,
    zoomControl: false,
    maxBounds,
  })

  demMap
    .addControl(demMapLayers)
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
