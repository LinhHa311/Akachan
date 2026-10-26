// Vẽ icon bình sữa ra PNG (không cần thư viện ngoài).
// Chạy: node scripts/make-icons.mjs
import { writeFileSync } from 'node:fs'
import { deflateSync } from 'node:zlib'

const SIZES = { 'apple-touch-icon.png': 180, 'icon-192.png': 192, 'icon-512.png': 512 }
const SAMPLES = 4 // khử răng cưa 4x4

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))
const TOP = hex('#f7b2c9')
const BOTTOM = hex('#e96a97')
const WHITE = hex('#ffffff')
const COLLAR = hex('#fde3ec')
const MILK = hex('#fff3d6')
const MARK = hex('#e96a97')

function inRoundRect(x, y, x0, y0, x1, y1, r) {
  if (x < x0 || x > x1 || y < y0 || y > y1) return false
  const cx = Math.min(Math.max(x, x0 + r), x1 - r)
  const cy = Math.min(Math.max(y, y0 + r), y1 - r)
  return (x - cx) ** 2 + (y - cy) ** 2 <= r * r
}

// Toạ độ trong hình vuông [0, 1]; vẽ lần lượt, lớp sau đè lớp trước
function colorAt(x, y) {
  let c = TOP.map((t, i) => t + (BOTTOM[i] - t) * y)
  if ((x - 0.5) ** 2 + (y - 0.24) ** 2 <= 0.075 ** 2 || inRoundRect(x, y, 0.445, 0.24, 0.555, 0.33, 0)) c = WHITE
  if (inRoundRect(x, y, 0.36, 0.305, 0.64, 0.385, 0.025)) c = COLLAR
  if (inRoundRect(x, y, 0.33, 0.375, 0.67, 0.8, 0.07)) c = WHITE
  if (inRoundRect(x, y, 0.355, 0.57, 0.645, 0.775, 0.05)) c = MILK
  for (const my of [0.45, 0.51, 0.63]) {
    if (inRoundRect(x, y, 0.38, my - 0.008, 0.46, my + 0.008, 0.008)) c = MARK
  }
  return c
}

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})
function crc32(buf) {
  let c = 0xffffffff
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}
function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([len, body, crc])
}

function png(size) {
  const raw = Buffer.alloc(size * (size * 3 + 1))
  for (let py = 0; py < size; py++) {
    raw[py * (size * 3 + 1)] = 0 // filter: none
    for (let px = 0; px < size; px++) {
      const sum = [0, 0, 0]
      for (let sy = 0; sy < SAMPLES; sy++) {
        for (let sx = 0; sx < SAMPLES; sx++) {
          const c = colorAt((px + (sx + 0.5) / SAMPLES) / size, (py + (sy + 0.5) / SAMPLES) / size)
          for (let i = 0; i < 3; i++) sum[i] += c[i]
        }
      }
      const o = py * (size * 3 + 1) + 1 + px * 3
      for (let i = 0; i < 3; i++) raw[o + i] = Math.round(sum[i] / SAMPLES ** 2)
    }
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 2 // RGB, không trong suốt (iOS tô đen phần trong suốt)
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

for (const [name, size] of Object.entries(SIZES)) {
  writeFileSync(new URL(`../public/${name}`, import.meta.url), png(size))
  console.log(`public/${name} (${size}x${size})`)
}
