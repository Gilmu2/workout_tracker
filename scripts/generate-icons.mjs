// Generates simple branded PNG icons (192x192 and 512x512) in public/icons/
// using only Node's standard library. The icon is a solid rounded background
// with a tiny dumbbell silhouette in the accent color.

import { writeFileSync, mkdirSync } from 'node:fs'
import { deflateSync } from 'node:zlib'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outDir = resolve(__dirname, '..', 'public', 'icons')
mkdirSync(outDir, { recursive: true })

const BG = [11, 18, 32]      // #0b1220
const ACCENT = [34, 211, 238] // #22d3ee

function makeIcon(size) {
  const radius = Math.round(size * 0.22)
  const px = new Uint8Array(size * size * 4)

  // background with rounded corners
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4
      if (insideRoundedSquare(x, y, size, radius)) {
        px[i] = BG[0]
        px[i + 1] = BG[1]
        px[i + 2] = BG[2]
        px[i + 3] = 255
      } else {
        px[i + 3] = 0 // transparent corners
      }
    }
  }

  // dumbbell silhouette (centered horizontally)
  // Bar
  const barY1 = Math.round(size * 0.46)
  const barY2 = Math.round(size * 0.54)
  const barX1 = Math.round(size * 0.18)
  const barX2 = Math.round(size * 0.82)
  fillRect(px, size, barX1, barY1, barX2, barY2, ACCENT)

  // Left plate (outer)
  fillRect(
    px,
    size,
    Math.round(size * 0.10),
    Math.round(size * 0.34),
    Math.round(size * 0.20),
    Math.round(size * 0.66),
    ACCENT
  )
  // Left plate (inner / smaller)
  fillRect(
    px,
    size,
    Math.round(size * 0.20),
    Math.round(size * 0.40),
    Math.round(size * 0.26),
    Math.round(size * 0.60),
    ACCENT
  )
  // Right plate (outer)
  fillRect(
    px,
    size,
    Math.round(size * 0.80),
    Math.round(size * 0.34),
    Math.round(size * 0.90),
    Math.round(size * 0.66),
    ACCENT
  )
  // Right plate (inner / smaller)
  fillRect(
    px,
    size,
    Math.round(size * 0.74),
    Math.round(size * 0.40),
    Math.round(size * 0.80),
    Math.round(size * 0.60),
    ACCENT
  )

  return encodePng(size, size, px)
}

function fillRect(px, size, x1, y1, x2, y2, [r, g, b]) {
  for (let y = y1; y < y2; y++) {
    for (let x = x1; x < x2; x++) {
      if (x < 0 || x >= size || y < 0 || y >= size) continue
      if (!insideRoundedSquare(x, y, size, Math.round(size * 0.22))) continue
      const i = (y * size + x) * 4
      px[i] = r
      px[i + 1] = g
      px[i + 2] = b
      px[i + 3] = 255
    }
  }
}

function insideRoundedSquare(x, y, size, radius) {
  if (x >= radius && x < size - radius) return true
  if (y >= radius && y < size - radius) return true
  // corner regions
  const cx = x < radius ? radius : size - radius - 1
  const cy = y < radius ? radius : size - radius - 1
  const dx = x - cx
  const dy = y - cy
  return dx * dx + dy * dy <= radius * radius
}

// Minimal PNG encoder for 8-bit RGBA images.
function encodePng(width, height, rgba) {
  const sig = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr.writeUInt8(8, 8) // bit depth
  ihdr.writeUInt8(6, 9) // color type RGBA
  ihdr.writeUInt8(0, 10)
  ihdr.writeUInt8(0, 11)
  ihdr.writeUInt8(0, 12)

  // IDAT raw: filter byte 0 + scanlines
  const stride = width * 4
  const raw = Buffer.alloc((stride + 1) * height)
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0
    Buffer.from(rgba.buffer, rgba.byteOffset + y * stride, stride).copy(
      raw,
      y * (stride + 1) + 1
    )
  }
  const idat = deflateSync(raw)

  const chunks = [chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]
  return Buffer.concat([Buffer.from(sig), ...chunks])
}

const crcTable = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()

function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii')
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0)
  return Buffer.concat([len, typeBuf, data, crc])
}

for (const size of [192, 512]) {
  const buf = makeIcon(size)
  writeFileSync(resolve(outDir, `icon-${size}.png`), buf)
  console.log(`wrote icon-${size}.png (${buf.length} bytes)`)
}
