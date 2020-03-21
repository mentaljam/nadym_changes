/* eslint-disable @typescript-eslint/camelcase */
import {Feature} from 'geojson'
import L from 'leaflet'

import BookmarkSVG from './bookmark.svg'

import './bookmarks.css'


interface IBookmarkProps {
  name: string
  site_id: number
}

interface IIBookmarkPropsWithLid extends IBookmarkProps {
  lid: string
}

const getBookmarks = (layer: L.GeoJSON): IIBookmarkPropsWithLid[] => {
  const bookmarks: IIBookmarkPropsWithLid[] = []
  layer.eachLayer(l => {
    const {properties: {site_id, name}} = (l as L.GeoJSON<IBookmarkProps>).feature as Feature<any, IBookmarkProps>
    const lid = String(layer.getLayerId(l))
    bookmarks.push({site_id, name, lid})
  })
  return bookmarks.sort(({site_id: a}, {site_id: b}) => (
    a < b ? -1 :
    a > b ?  1 :
             0
  ))
}

export default class BookmarksControl<P = any> extends L.Control {
  private map!: L.Map
  private layer!: L.GeoJSON<P>
  private container!: HTMLDivElement
  private btn?: HTMLAnchorElement
  private list?: HTMLDivElement

  constructor(layer: L.GeoJSON<P>) {
    super({position: 'topright'})
    this.layer = layer
  }

  public onAdd(map: L.Map): HTMLDivElement {
    this.map = map
    this.btn = document.createElement('a')
    this.btn.className = 'nc-bm-button'
    this.btn.innerHTML = BookmarkSVG
    this.btn.href = '#'
    this.btn.onmouseover = this.handleMouseOver
    this.btn.onclick = L.DomEvent.stop
    L.DomEvent.disableClickPropagation(this.btn)

    this.container = document.createElement('div')
    this.container.className = 'leaflet-bar nc-control-bm'
    this.container.appendChild(this.btn)

    return this.container
  }

  private handleMouseOver = (): void => {
    if (!this.list) {
      this.list = document.createElement('div')
      this.list.className = 'nc-bm-list-container'
      L.DomEvent.disableClickPropagation(this.list)
      L.DomEvent.disableScrollPropagation(this.list)
      this.list.onmouseleave = this.handleMouseLeave

      const title = document.createElement('h3')
      title.textContent = 'Bookmarks'
      this.list.appendChild(title)

      const ul = document.createElement('ul')
      ul.className = 'nc-bm-list'
      getBookmarks(this.layer).forEach(({site_id, name, lid}) =>  {
        const bm = document.createElement('button')
        bm.innerHTML = `🔍&nbsp;${site_id}&nbsp;${name}`
        bm.value = lid
        bm.onclick = this.handleBMClick
        L.DomEvent.disableClickPropagation(bm)
        const li = document.createElement('li')
        li.appendChild(bm)
        ul.appendChild(li)
      })
      this.list.appendChild(ul)
    }
    const child = this.container.firstChild
    if (child) {
      this.container.replaceChild(this.list, child)
      this.list.classList.add('expanded')
    }
  }

  private handleMouseLeave = (): void => {
    const child = this.container.firstChild
    if (this.btn && this.list && child) {
      this.container.replaceChild(this.btn, child)
      this.list.classList.remove('expanded')
    }
  }

  private handleBMClick = ({currentTarget}: MouseEvent): void => {
    const {value} = (currentTarget as HTMLButtonElement)
    const layer = this.layer.getLayer(parseInt(value, 10)) as L.GeoJSON<IBookmarkProps>
    this.map.fitBounds(layer.getBounds())
  }
}
