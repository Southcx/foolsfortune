// ---------------------------------------------------------------------------------------
// A QR CODE, MADE (ISO/IEC 18004): the game's own codes (a made track's FF2-, a spirit's FFS-) drawn as a real code a phone's camera can
// read off a screen, so a code shared is a code scanned (docs/plans/SEEDS-SLABS-SCANS.md 3; the scanner reads QR codes: world/scanner.js).
// One job: text in, a square of modules out. Byte mode only (the codes are ASCII), versions 1 to 40, error correction L or M, the mask
// chosen by the standard's penalty (its four rules). The drawing is ui/combcode.js's, in the Comb's dress beside it.
//
// Prior art: Project Nayuki's QR Code generator (MIT; its structure followed here: the codewords' interleave, the Reed-Solomon divisor,
// the function patterns, the zigzag and the penalty), Denso Wave's specification (1994), Thonky's QR tutorial (the tables checked against
// it). Checked headless by decoding with jsQR (scratchpad, never shipped).
//
//   qrMatrix(text, { ecl = 'M' }) -> { size, version, at(x, y) -> bool } | null (too long for version 40)
// ---------------------------------------------------------------------------------------

const ECL = { L: { i: 0, bits: 1 }, M: { i: 1, bits: 0 } };
// (error correction codewords a block, and blocks, by level then version: the standard's table 9)
const ECC_PER_BLOCK = [
  [-1, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30, 30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
  [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28],
];
const BLOCKS = [
  [-1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9, 10, 12, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25],
  [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49],
];

const rawModules = (v) => { let r = (16 * v + 128) * v + 64; if (v >= 2) { const n = Math.floor(v / 7) + 2; r -= (25 * n - 10) * n - 55; if (v >= 7) r -= 36; } return r; };
const dataCodewords = (v, e) => Math.floor(rawModules(v) / 8) - ECC_PER_BLOCK[e][v] * BLOCKS[e][v];
const gfMul = (x, y) => { let z = 0; for (let i = 7; i >= 0; i--) { z = (z << 1) ^ ((z >>> 7) * 0x11d); z ^= ((y >>> i) & 1) * x; } return z & 0xff; };
function rsDivisor(deg) {
  const r = new Array(deg).fill(0); r[deg - 1] = 1; let root = 1;
  for (let i = 0; i < deg; i++) { for (let j = 0; j < deg; j++) { r[j] = gfMul(r[j], root); if (j + 1 < deg) r[j] ^= r[j + 1]; } root = gfMul(root, 2); }
  return r;
}
function rsRemainder(data, div) {
  const r = div.map(() => 0);
  for (const b of data) { const f = b ^ r.shift(); r.push(0); div.forEach((c, i) => { r[i] ^= gfMul(c, f); }); }
  return r;
}

/** The modules of `text` as a QR code (byte mode, UTF-8), the smallest version that holds it; null past version 40. */
export function qrMatrix(text, { ecl = 'M' } = {}) {
  const E = ECL[ecl] || ECL.M, e = E.i, bytes = Array.from(new TextEncoder().encode(String(text)));
  let v = 1;
  for (; v <= 40; v++) { const cc = v < 10 ? 8 : 16; if (4 + cc + bytes.length * 8 <= dataCodewords(v, e) * 8) break; }
  if (v > 40) return null;
  // the data's bits: the mode (byte), its count, its bytes, the terminator, padded to whole codewords and then with the pad bytes
  const bits = [], put = (val, n) => { for (let i = n - 1; i >= 0; i--) bits.push((val >>> i) & 1); }, cap = dataCodewords(v, e) * 8;
  put(4, 4); put(bytes.length, v < 10 ? 8 : 16); for (const b of bytes) put(b, 8);
  put(0, Math.min(4, cap - bits.length)); while (bits.length % 8) bits.push(0);
  const data = []; for (let i = 0; i < bits.length; i += 8) data.push(bits.slice(i, i + 8).reduce((a, b) => (a << 1) | b, 0));
  for (let p = 0xec; data.length < cap / 8; p ^= 0xec ^ 0x11) data.push(p);
  // the error correction, block by block, interleaved
  const nb = BLOCKS[e][v], el = ECC_PER_BLOCK[e][v], raw = Math.floor(rawModules(v) / 8), nShort = nb - (raw % nb), shortLen = Math.floor(raw / nb), div = rsDivisor(el), blocks = [];
  for (let i = 0, k = 0; i < nb; i++) { const d = data.slice(k, k + shortLen - el + (i < nShort ? 0 : 1)); k += d.length; const ecc = rsRemainder(d, div); if (i < nShort) d.push(0); blocks.push(d.concat(ecc)); }
  const words = [];
  for (let i = 0; i < blocks[0].length; i++) blocks.forEach((b, j) => { if (i !== shortLen - el || j >= nShort) words.push(b[i]); });
  // the symbol
  const size = v * 4 + 17, mod = new Uint8Array(size * size), fn = new Uint8Array(size * size);
  const set = (x, y, dark) => { mod[y * size + x] = dark ? 1 : 0; fn[y * size + x] = 1; };
  for (let i = 0; i < size; i++) { set(6, i, i % 2 === 0); set(i, 6, i % 2 === 0); }
  for (const [cx, cy] of [[3, 3], [size - 4, 3], [3, size - 4]]) for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) {
    const x = cx + dx, y = cy + dy, d = Math.max(Math.abs(dx), Math.abs(dy)); if (x >= 0 && y >= 0 && x < size && y < size) set(x, y, d !== 2 && d !== 4);
  }
  const al = alignments(v, size), last = al.length - 1;
  al.forEach((ax, i) => al.forEach((ay, j) => { if ((i === 0 && j === 0) || (i === 0 && j === last) || (i === last && j === 0)) return; for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) set(ax + dx, ay + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1); }));
  const format = (mask) => {
    const d = (E.bits << 3) | mask; let r = d; for (let i = 0; i < 10; i++) r = (r << 1) ^ ((r >>> 9) * 0x537);
    const b = ((d << 10) | r) ^ 0x5412, bit = (i) => ((b >>> i) & 1) === 1;
    for (let i = 0; i <= 5; i++) set(8, i, bit(i)); set(8, 7, bit(6)); set(8, 8, bit(7)); set(7, 8, bit(8));
    for (let i = 9; i < 15; i++) set(14 - i, 8, bit(i));
    for (let i = 0; i < 8; i++) set(size - 1 - i, 8, bit(i));
    for (let i = 8; i < 15; i++) set(8, size - 15 + i, bit(i));
    set(8, size - 8, true);
  };
  format(0);
  if (v >= 7) { let r = v; for (let i = 0; i < 12; i++) r = (r << 1) ^ ((r >>> 11) * 0x1f25); const b = (v << 12) | r; for (let i = 0; i < 18; i++) { const dark = ((b >>> i) & 1) === 1, a = size - 11 + (i % 3), c = Math.floor(i / 3); set(a, c, dark); set(c, a, dark); } }
  // the codewords in the zigzag, two columns at a time from the bottom right
  let i = 0;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vert = 0; vert < size; vert++) for (let j = 0; j < 2; j++) {
      const x = right - j, up = ((right + 1) & 2) === 0, y = up ? size - 1 - vert : vert;
      if (!fn[y * size + x] && i < words.length * 8) { mod[y * size + x] = (words[i >>> 3] >>> (7 - (i & 7))) & 1; i++; }
    }
  }
  // the mask with the least penalty
  const flip = (m) => { for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if (!fn[y * size + x] && MASKS[m](x, y)) mod[y * size + x] ^= 1; };
  let best = 0, bp = Infinity;
  for (let m = 0; m < 8; m++) { flip(m); format(m); const p = penalty(mod, size); if (p < bp) { bp = p; best = m; } flip(m); }
  flip(best); format(best);
  return { size, version: v, at: (x, y) => x >= 0 && y >= 0 && x < size && y < size && mod[y * size + x] === 1 };
}

const MASKS = [
  (x, y) => (x + y) % 2 === 0, (x, y) => y % 2 === 0, (x) => x % 3 === 0, (x, y) => (x + y) % 3 === 0,
  (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0, (x, y) => ((x * y) % 2) + ((x * y) % 3) === 0,
  (x, y) => (((x * y) % 2) + ((x * y) % 3)) % 2 === 0, (x, y) => (((x + y) % 2) + ((x * y) % 3)) % 2 === 0,
];
function alignments(v, size) {
  if (v === 1) return [];
  const n = Math.floor(v / 7) + 2, step = Math.floor((v * 8 + n * 3 + 5) / (n * 4 - 4)) * 2, out = [6];
  for (let pos = size - 7; out.length < n; pos -= step) out.splice(1, 0, pos);
  return out;
}
/** The standard's four penalties: runs of five or more, 2 x 2 blocks, finder-like patterns, and the dark share's distance from half. */
function penalty(mod, n) {
  let p = 0, dark = 0;
  const line = (get) => {
    let run = 0, prev = -1;
    for (let i = 0; i < n; i++) { const c = get(i); if (c === prev) { run++; if (run === 5) p += 3; else if (run > 5) p++; } else { prev = c; run = 1; } }
    for (let i = 0; i + 10 < n; i++) {
      const s = [1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0]; let a = true, b = true;
      for (let k = 0; k < 11; k++) { if (get(i + k) !== s[k]) a = false; if (get(i + k) !== s[10 - k]) b = false; }
      if (a) p += 40; if (b) p += 40;
    }
  };
  for (let y = 0; y < n; y++) line((x) => mod[y * n + x]);
  for (let x = 0; x < n; x++) line((y) => mod[y * n + x]);
  for (let y = 0; y + 1 < n; y++) for (let x = 0; x + 1 < n; x++) { const c = mod[y * n + x]; if (c === mod[y * n + x + 1] && c === mod[(y + 1) * n + x] && c === mod[(y + 1) * n + x + 1]) p += 3; }
  for (let i = 0; i < n * n; i++) dark += mod[i];
  return p + Math.floor(Math.abs(dark * 20 - n * n * 10) / (n * n)) * 10;
}
