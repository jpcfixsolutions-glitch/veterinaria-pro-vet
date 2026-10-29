import appSource from './App.tsx?raw'
import buttonSource from './DownloadCodeButton.tsx?raw'
import stylesSource from './index.css?raw'
import mainSource from './main.tsx?raw'
import viteEnvSource from './vite-env.d.ts?raw'
import packageSource from '../package.json?raw'
import indexSource from '../index.html?raw'
import tsconfigSource from '../tsconfig.json?raw'
import viteConfigSource from '../vite.config.ts?raw'
import faviconSource from '../public/favicon.svg?raw'

const sourceFiles = [
  ['pro-vet/package.json', packageSource],
  ['pro-vet/index.html', indexSource],
  ['pro-vet/tsconfig.json', tsconfigSource],
  ['pro-vet/vite.config.ts', viteConfigSource],
  ['pro-vet/public/favicon.svg', faviconSource],
  ['pro-vet/src/main.tsx', mainSource],
  ['pro-vet/src/App.tsx', appSource],
  ['pro-vet/src/DownloadCodeButton.tsx', buttonSource],
  ['pro-vet/src/index.css', stylesSource],
  ['pro-vet/src/vite-env.d.ts', viteEnvSource],
]

const encoder = new TextEncoder()

function crc32(data: Uint8Array) {
  let crc = 0xffffffff
  for (const byte of data) {
    crc ^= byte
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0)
    }
  }
  return (crc ^ 0xffffffff) >>> 0
}

function write16(view: DataView, offset: number, value: number) {
  view.setUint16(offset, value, true)
}

function write32(view: DataView, offset: number, value: number) {
  view.setUint32(offset, value, true)
}

function joinBytes(parts: Uint8Array[]) {
  const result = new Uint8Array(parts.reduce((total, part) => total + part.length, 0))
  let offset = 0
  for (const part of parts) {
    result.set(part, offset)
    offset += part.length
  }
  return result
}

function createZip(files: string[][]) {
  const localParts: Uint8Array[] = []
  const centralParts: Uint8Array[] = []
  let localOffset = 0

  for (const [path, contents] of files) {
    const name = encoder.encode(path)
    const data = encoder.encode(contents)
    const checksum = crc32(data)

    const localHeader = new Uint8Array(30 + name.length)
    const localView = new DataView(localHeader.buffer)
    write32(localView, 0, 0x04034b50)
    write16(localView, 4, 20)
    write16(localView, 6, 0x0800)
    write16(localView, 8, 0)
    write32(localView, 14, checksum)
    write32(localView, 18, data.length)
    write32(localView, 22, data.length)
    write16(localView, 26, name.length)
    localHeader.set(name, 30)
    localParts.push(localHeader, data)

    const centralHeader = new Uint8Array(46 + name.length)
    const centralView = new DataView(centralHeader.buffer)
    write32(centralView, 0, 0x02014b50)
    write16(centralView, 4, 20)
    write16(centralView, 6, 20)
    write16(centralView, 8, 0x0800)
    write16(centralView, 10, 0)
    write32(centralView, 16, checksum)
    write32(centralView, 20, data.length)
    write32(centralView, 24, data.length)
    write16(centralView, 28, name.length)
    write32(centralView, 42, localOffset)
    centralHeader.set(name, 46)
    centralParts.push(centralHeader)
    localOffset += localHeader.length + data.length
  }

  const centralDirectory = joinBytes(centralParts)
  const end = new Uint8Array(22)
  const endView = new DataView(end.buffer)
  write32(endView, 0, 0x06054b50)
  write16(endView, 8, files.length)
  write16(endView, 10, files.length)
  write32(endView, 12, centralDirectory.length)
  write32(endView, 16, localOffset)

  return joinBytes([...localParts, centralDirectory, end])
}

export default function DownloadCodeButton() {
  const downloadCode = () => {
    const archive = createZip(sourceFiles)
    const url = URL.createObjectURL(new Blob([archive], { type: 'application/zip' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'pro-vet-codigo-fuente.zip'
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <button className="download-code-button" onClick={downloadCode} title="Descargar código fuente en ZIP">
      <svg className="icon" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 3v12m-5-5 5 5 5-5" />
        <path d="M5 21h14" />
      </svg>
      <span>Descargar código</span>
    </button>
  )
}
