import fs from 'fs'
import path from 'path'


export default () => ({
  name: 'clean',
  generateBundle({dir}) {
    dir = path.resolve(process.cwd(), dir)
    if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
      return
    }
    const prevDirs = []
    const nextDirs = []
    while (dir) {
      for (let entry of fs.readdirSync(dir)) {
        entry = path.resolve(dir, entry)
        if (fs.statSync(entry).isDirectory()) {
          if (fs.readdirSync(entry).length) {
            nextDirs.push(entry)
          } else {
            fs.rmdirSync(entry)
          }
        } else {
          fs.unlinkSync(entry)
        }
      }
      if (nextDirs.length) {
        prevDirs.push(dir)
        dir = nextDirs.shift()
      } else {
        dir = prevDirs.pop()
      }
    }
  }
})
