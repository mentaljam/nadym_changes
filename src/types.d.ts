// tslint:disable-next-line:no-namespace
declare namespace L {
  // tslint:disable-next-line:interface-name
  interface Map {
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

  // tslint:disable-next-line:max-classes-per-file
  class Yandex extends Layer  {
    constructor(type?: YandexMap, options?: IYandexOptions);
  }
}

declare const BING_KEY: string
declare const CROSS_SVG: string

