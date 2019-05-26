import {Feature} from 'geojson'
import L from 'leaflet'

import './bookmarks.css'


const epsg3857toepsg4326 = ({lat, lng}: L.LatLng) => 
  L.Projection.SphericalMercator.unproject(L.point(lng, lat))

interface IBookmarkProps {
  name: string
}

export default class BookmarksControl<P = any> extends L.Control {
  private map?: L.Map
  private layer!: L.GeoJSON<P>
  private container?: HTMLDivElement
  private btn?: HTMLAnchorElement
  private list?: HTMLDivElement

  constructor(layer: L.GeoJSON<P>) {
    super({position: 'topright'})
    this.layer = layer
  }

  public onAdd(map: L.Map) {
    this.map = map
    this.btn = document.createElement('a')
    this.btn.className = 'nc-bm-button'
    this.btn.innerText = '★'
    this.btn.href = '#'
    this.btn.onmouseover = this.handleMouseOver
    this.btn.onclick = L.DomEvent.stop
    L.DomEvent.disableClickPropagation(this.btn)

    this.container = document.createElement('div')
    this.container.className = 'leaflet-bar nc-control-bm'
    this.container.appendChild(this.btn)

    return this.container
  }

  private handleMouseOver = () => {
    if (!this.list) {
      this.list = document.createElement('div')
      this.list.className = 'nc-bm-list-container'
      L.DomEvent.disableClickPropagation(this.list)
      this.list.onmouseleave = this.handleMouseLeave

      const title = document.createElement('h4')
      title.textContent = 'Bookmarks'
      this.list.appendChild(title)

      const ul = document.createElement('ul')
      ul.className = 'nc-bm-list'
      this.layer.eachLayer(layer => {
        const {properties: {name}} = (layer as L.GeoJSON<IBookmarkProps>).feature as Feature<any, IBookmarkProps>
        const bm = document.createElement('button')
        bm.innerHTML = '🔍&nbsp;' + name
        bm.value = String(this.layer.getLayerId(layer))
        bm.onclick = this.handleBMClick
        L.DomEvent.disableClickPropagation(bm)
        const li = document.createElement('li')
        li.appendChild(bm)
        ul.appendChild(li)
      })
      this.list.appendChild(ul)
    }
    this.container!.replaceChild(this.list, this.container!.firstChild!)
  }

  private handleMouseLeave = () => {
    this.container!.replaceChild(this.btn!, this.container!.firstChild!)
  }

  private handleBMClick = ({currentTarget}: MouseEvent) => {
    const {value} = (currentTarget as HTMLButtonElement)
    const layer = this.layer.getLayer(parseInt(value, 10)) as L.GeoJSON<IBookmarkProps>
    const bounds = layer.getBounds()
    const sw = epsg3857toepsg4326(bounds.getSouthWest())
    const ne = epsg3857toepsg4326(bounds.getNorthEast())
    const center = epsg3857toepsg4326(bounds.getCenter())
    this.map!.fitBounds(L.latLngBounds(sw, ne), {
      animate: true,
      duration: Math.log10(this.map!.getCenter().distanceTo(center)),
    })
  }
}
