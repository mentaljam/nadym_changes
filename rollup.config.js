import {terser} from 'rollup-plugin-terser'
import commonjs from 'rollup-plugin-commonjs'
import copy2 from 'rollup-plugin-copy2'
import gzip from 'rollup-plugin-gzip'
import html2 from 'rollup-plugin-html2'
import license from 'rollup-plugin-license'
import postcss from 'rollup-plugin-postcss'
import replace from 'rollup-plugin-replace'
import resolve from 'rollup-plugin-node-resolve'
import tslint from 'rollup-plugin-tslint'
import typescript2 from 'rollup-plugin-typescript2'

import clean from './rollup/clean'
import svg from './rollup/svg'
import {readKey} from './rollup/utils'

import coronaBounds from './corona_bounds'


const prodMode = process.env.NODE_ENV === 'production'
const dir = 'dist/' + (prodMode ? 'prod' : 'dev')
const names = prodMode ? '[name]-[hash].js' : '[name].js'

const yandexKey = readKey('yandex.txt')
const bingKey = readKey('bing.txt')
// Add one degree to every side of the Corona layer
const maxBounds = [
  coronaBounds[0].map(c => c - 1),
  coronaBounds[1].map(c => c + 1),
]
const geoserverUrl = prodMode ?
  '/geoserver' :
  'https://ageoportal.ipos-tmn.ru/geoserver'

const plugins = [
  clean(),
  replace({
    BING_KEY: JSON.stringify(bingKey),
    CORONA_BOUNDS: JSON.stringify(coronaBounds),
    MAX_BOUNDS: JSON.stringify(maxBounds),
    GEOSERVER_URL: JSON.stringify(geoserverUrl),
  }),
  resolve(),
  commonjs(),
  postcss({
    extract: true,
    minimize: prodMode,
  }),
  tslint(),
  typescript2(),
  html2({
    template: 'src/index.html',
    externals: [{
      type: 'js',
      file: `https://api-maps.yandex.ru/2.1/?apikey=${yandexKey}&lang=ru_RU`,
      pos: 'before',
    }],
    minify: prodMode && {
      removeComments: true,
      collapseWhitespace: true,
      keepClosingSlash: true,
    },
  }),
  svg(),
  copy2({
    assets: [
      'LICENSE',
    ],
  }),
]

if (prodMode) {
  plugins.push(
    terser(),
    license({
      thirdParty: {
        output: dir + '/dependencies.txt',
      },
    }),
    gzip({
      filter: /\.(js|json|css|html)$/,
    }),
  )
}

export default {
  input: 'src/index.ts',
  output: {
    dir,
    format: 'es',
    entryFileNames: names,
    chunkFileNames: names,
  },
  plugins,
}
