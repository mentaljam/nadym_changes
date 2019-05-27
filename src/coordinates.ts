import L from 'leaflet'

import './coordinates.css'


const zfill = (num: number) => {
  let str = String(num)
  for (let i = str.length - 2; i < 0; ++i) {
    str = '0' + str
  }
  return str
}

const toDMS = (deg: number) => {
  deg = Math.abs(deg)
  let d = Math.floor(deg)
  const mf = (deg - d) * 60
  let m = Math.floor(mf)
  const sf = (mf - m) * 60
  let s = Math.round(sf)
  if (s === 60) {
  	++m
  	s = 0
  }
  if (m === 60) {
  	++d
  	m = 0
  }
  return `${zfill(d)}&deg;${zfill(m)}'${zfill(s)}''`
}

export default class CoordinatesControl extends L.Control {
  private map?: L.Map
  private coordinates?: HTMLDivElement

  constructor() {
    super({position: 'bottomleft'})
  }

  public onAdd(map: L.Map) {
    this.map = map

    this.coordinates = document.createElement('div')
    this.coordinates.className = 'nc-control-coords'
    this.coordinates.title = 'Click to copy'
    L.DomEvent.disableClickPropagation(this.coordinates)
    this.coordinates.onclick = this.handleClick

    map.on('move', this.handleMove)

    return this.coordinates
  }

  private handleClick = () => {
    const {lat, lng} = this.map!.getCenter()
    navigator.clipboard.writeText(`${lat}, ${lng}`)
    this.coordinates!.textContent = 'Coordinates copied'
    setTimeout(this.handleMove, 1500)
  }

  private handleMove = () => {
    const {lat, lng} = this.map!.getCenter()
    const ns = lat >= 0 ? 'N' : 'S'
    const ew = lng >= 0 ? 'E' : 'W'
    this.coordinates!.innerHTML = `${toDMS(lat)}${ns} ${toDMS(lng)}${ew}`
  }
}
