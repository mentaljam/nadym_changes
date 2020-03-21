declare namespace L {
  interface Map {
    _loaded: boolean
    sync(map: Map): void
  }

  interface IBingLayerOptions extends LayerOptions {
    type: 'Aerial' | 'AerialWithLabels' | 'Birdseye' | 'BirdseyeWithLabels' | 'Road'
  }

  class BingLayer extends Layer {
    constructor(key: string, options?: IBingLayerOptions);
  }

  type YandexMap = 'map' | 'satellite' | 'hybrid' | 'publicMap' | 'publicMapHybrid'

  interface IYandexOptions extends LayerOptions {
    minZoom?: number
		maxZoom?: number
		attribution?: string
		opacity?: number
		traffic?: boolean
  }

  class Yandex extends Layer  {
    constructor(type?: YandexMap, options?: IYandexOptions);
  }
}

declare const BING_KEY: string
declare const CORONA_BOUNDS: L.LatLngBoundsLiteral
declare const MAX_BOUNDS: L.LatLngBoundsLiteral
declare const GEOSERVER_URL: string

declare module '*.svg' {
  const content: any
  export default content
}
