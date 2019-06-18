import fs from 'fs'


export const readKey = (file) => {
  if (!fs.existsSync(file)) {
    throw new Error(`API key file ${file} doesn't exist`)
  }
  return fs.readFileSync(file).toString().trim()
}
