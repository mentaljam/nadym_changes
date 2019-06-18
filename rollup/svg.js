import svgo from 'svgo'


export default () => ({
  name: 'svg',
  transform(code, id) {
    const optimozer = new svgo()
    if (id.endsWith('.svg')) {
      return optimozer.optimize(code).then(({data}) => 'export default ' + JSON.stringify(data))
    }
  }
})
