/**
 * Based on https://github.com/smellman/Leaflet.CenterCross
 */

import L from 'leaflet'


interface ICrossOptions {
  visible: boolean
}

export default L.Layer.extend({
  marker: null,

  initialize(options: ICrossOptions = {visible: true}) {
    L.Util.setOptions(this, options)
  },

  addTo(map: L.Map) {
    this.onAdd(map)
    return this
  },

  onAdd(map: L.Map) {
    this._map = map
    this.setVisible(this.options.visible)
  },

  onRemove(map: L.Map) {
    map.off('move', this.refresh, this)
    if (this.marker) {
      map.removeLayer(this.marker)
      this.marker = null
    }
  },

  refresh() {
    const pos = this._map.getCenter()
    if (!this.marker) {
      const icon = L.icon({
        iconUrl: CROSS_SVG,
      })

      this.marker = L.marker(pos, {
        icon,
        clickable: false,
        draggable: false,
        keyboard: false,
        opacity: 0.8,
        zIndexOffset: 0
      })
      this.marker.addTo(this._map)
    } else {
      this.marker.setLatLng(pos)
    }
  },

  setVisible(on: boolean) {
    this.options.visible = on
    if (on) {
      this._map.on('move', this.refresh, this)
    } else {
      this._map.off('move', this.refresh, this)
    }
    this.refresh()
    return this
  },

  getVisible() {
    return this.options.visible
  }
})
