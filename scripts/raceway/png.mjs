// A small PNG writer for the Raceway's diagnostic pictures (scripts/raceway/map.mjs, drive.mjs): RGB rows, zlib, CRCs. No dependencies.
//   const img = new Img(w, h)   img.set(x, y, r, g, b)   img.line(x0, y0, x1, y1, rgb, width)   img.dot(x, y, r, rgb)   img.write(path)
import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';

const CRC = new Uint32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc = (buf) => { let c = 0xffffffff; for (const b of buf) c = CRC[(c ^ b) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([len, td, c]); };

export class Img {
  constructor(w, h) { this.w = w; this.h = h; this.px = new Uint8Array(w * h * 3); }
  set(x, y, r, g, b) { x |= 0; y |= 0; if (x < 0 || y < 0 || x >= this.w || y >= this.h) return; const i = (y * this.w + x) * 3; this.px[i] = Math.max(0, Math.min(255, r)); this.px[i + 1] = Math.max(0, Math.min(255, g)); this.px[i + 2] = Math.max(0, Math.min(255, b)); }
  dot(x, y, rad, [r, g, b]) { for (let j = -rad; j <= rad; j++) for (let i = -rad; i <= rad; i++) if (i * i + j * j <= rad * rad) this.set(x + i, y + j, r, g, b); }
  line(x0, y0, x1, y1, rgb, width = 1) { const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0)) + 1; for (let k = 0; k <= n; k++) { const t = k / n; this.dot(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, width - 1, rgb); } }
  write(path) {
    const raw = Buffer.alloc((this.w * 3 + 1) * this.h);
    for (let y = 0; y < this.h; y++) { raw[y * (this.w * 3 + 1)] = 0; Buffer.from(this.px.buffer, y * this.w * 3, this.w * 3).copy(raw, y * (this.w * 3 + 1) + 1); }
    const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(this.w, 0); ihdr.writeUInt32BE(this.h, 4); ihdr[8] = 8; ihdr[9] = 2;
    writeFileSync(path, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw, { level: 6 })), chunk('IEND', Buffer.alloc(0))]));
  }
}
