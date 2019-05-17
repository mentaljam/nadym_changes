import fs from 'fs'
import {terser} from 'rollup-plugin-terser'
import commonjs from 'rollup-plugin-commonjs'
import copy2 from 'rollup-plugin-copy2'
import gzip from 'rollup-plugin-gzip'
import html from 'rollup-plugin-bundle-html'
import license from 'rollup-plugin-license'
import postcss from 'rollup-plugin-postcss'
import replace from 'rollup-plugin-replace'
import resolve from 'rollup-plugin-node-resolve'
import tslint from 'rollup-plugin-tslint'
import typescript2 from 'rollup-plugin-typescript2'
import svgToMiniDataURI from 'mini-svg-data-uri'


const prodMode = process.env.NODE_ENV === 'production'

const readKey = (file) => {
  if (!fs.existsSync(file)) {
    throw new Error(`API key file ${file} doesn't exist`)
  }
  return fs.readFileSync(file).toString().trim()
}

const yandexKey = readKey('yandex.txt')
const bingKey = readKey('bing.txt')
const crossSVG = svgToMiniDataURI(fs.readFileSync('src/cross.svg').toString())


const plugins = [
  replace({
    BING_KEY: JSON.stringify(bingKey),
    CROSS_SVG: JSON.stringify(crossSVG),
  }),
  resolve(),
  commonjs(),
  postcss({
    extract: true,
    minimize: prodMode,
  }),
  tslint(),
  typescript2(),
  html({
    template: 'src/index.html',
    externals: [{
      type: 'js',
      file: `https://api-maps.yandex.ru/2.1/?apikey=${yandexKey}&lang=ru_RU`,
      pos: 'before',
    }],
  }),
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
        output: 'dist/dependencies.txt',
      },
    }),
    gzip(),
  )
}

export default {
  input: 'src/index.ts',
  output: {
    file: 'dist/index.js',
    format: 'iife',
  },
  plugins,
}
