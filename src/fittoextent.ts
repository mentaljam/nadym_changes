import L from 'leaflet'

import FitToExtentSVG from './fittoextent.svg'


export default class FitToExtentControl extends L.Control {
  private map!: L.Map

  constructor() {
    super({position: 'topleft'})
  }

  public onAdd(map: L.Map): HTMLElement {
    this.map = map
    const btn = document.createElement('a')
    btn.title = 'Zoom to extent'
    btn.innerHTML = FitToExtentSVG
    btn.href = '#'
    btn.onclick = this.handleClick
    L.DomEvent.disableClickPropagation(btn)

    const container = document.createElement('div')
    container.className = 'leaflet-bar'
    container.appendChild(btn)

    return container
  }

  private handleClick = (): void => {
    const bounds = this.map.options.maxBounds
    bounds && this.map.fitBounds(bounds)
  }
}
