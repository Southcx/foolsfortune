// ---------------------------------------------------------------------------------------
// THE RACEWAY'S MAP (Dovina's diagnostic, the owner 2026-10-14: "do you need better diagnostic tooling?"): the park drawn from above as a
// PNG, from the one height function the game lays (world/raceway/park.js), with no browser: the sand hill-shaded and tinted by height,
// the water, every track's line (and its branch), its gates and start, its sun plates, rails (the coaster rails magenta, darker where
// upside down), sandfalls, pits, craters and half-pipes. A drive's trace (scripts/raceway/drive.mjs) can be laid over it.
//   node scripts/raceway/map.mjs [out.png] [--px 2 (metres a pixel)] [--at x,z --size m (a window)] [--trace trace.json]
// ---------------------------------------------------------------------------------------
import { readFileSync } from 'node:fs';
import { park } from '../../src/world/raceway/park.js';
import { coasterPath } from '../../src/world/raceway/coasterrail.js';
import { RW } from '../../src/world/raceway/track.js';
import { Img } from './png.mjs';

const args = process.argv.slice(2), opt = (k, d) => { const i = args.indexOf(`--${k}`); return i >= 0 ? args[i + 1] : d; };
const out = args.find((a) => a.endsWith('.png')) || 'raceway-map.png';
const mpp = +opt('px', 2), at = (opt('at', '0,0')).split(',').map(Number), size = +opt('size', RW.half * 2), trace = opt('trace', null);
const t0 = performance.now(), P = park(), W = Math.round(size / mpp), x0 = at[0] - size / 2, z0 = at[1] - size / 2;
const toPx = (x, z) => [(x - x0) / mpp, (z0 + size - z) / mpp]; // (north up: +z is up the picture)
const img = new Img(W, W), H = new Float32Array(W * W);
for (let j = 0; j < W; j++) for (let i = 0; i < W; i++) H[j * W + i] = P.heightAt(x0 + (i + 0.5) * mpp, z0 + size - (j + 0.5) * mpp);
const tint = (h) => { const t = Math.max(0, Math.min(1, (h + 50) / 130)); return [150 + 95 * t, 110 + 90 * t, 70 + 60 * t]; };
for (let j = 0; j < W; j++) for (let i = 0; i < W; i++) {
  const h = H[j * W + i], hx = H[j * W + Math.min(W - 1, i + 1)] - H[j * W + Math.max(0, i - 1)], hz = H[Math.max(0, j - 1) * W + i] - H[Math.min(W - 1, j + 1) * W + i];
  const shade = Math.max(0.35, Math.min(1.25, 0.9 + (-hx * 0.6 + hz * 0.6) / (2 * mpp))), c = tint(h), contour = Math.abs(((h % 10) + 10) % 10) < 0.35 * mpp ? 0.86 : 1;
  const x = x0 + (i + 0.5) * mpp, z = z0 + size - (j + 0.5) * mpp, w = P.waterAt(x, z);
  if (w != null && w > h) img.set(i, j, 60, 120 + Math.min(60, (w - h) * 20), 200); else img.set(i, j, c[0] * shade * contour, c[1] * shade * contour, c[2] * shade * contour);
}
const COL = { sun: [255, 200, 40], gorge: [240, 90, 40], coaster: [80, 220, 120] };
const poly = (pts, rgb, w = 1) => { for (let k = 1; k < pts.length; k++) { const [a, b] = [toPx(...pts[k - 1]), toPx(...pts[k])]; img.line(a[0], a[1], b[0], b[1], rgb, w); } };
for (const T of P.tracks) {
  const c = COL[T.id] || [255, 255, 255], line = [];
  for (let s = 0; s <= T.length; s += 4) { const f = T.frame(s); line.push([f.x, f.z]); }
  poly(line, c, 2);
  if (T.branch) { const b = []; for (let s = 0; s <= T.branch.length; s += 4) { const f = T.branch.frame(s); b.push([f.x, f.z]); } poly(b, [200, 120, 255], 2); }
  for (const g of T.gates) { const f = T.frame(g), [x, y] = toPx(f.x, f.z), [x2, y2] = toPx(f.x - f.fz * f.w, f.z + f.fx * f.w), [x3, y3] = toPx(f.x + f.fz * f.w, f.z - f.fx * f.w); img.line(x2, y2, x3, y3, [255, 255, 255], 1); img.dot(x, y, 1, [255, 255, 255]); }
  { const f = T.frame(T.line), [x, y] = toPx(f.x, f.z); img.dot(x, y, 5, [40, 255, 40]); }
  for (const Pl of T.features.plates || []) { const f = T.frame(T.sOf(Pl.cp, Pl.at)), [x, y] = toPx(f.x - f.fz * Pl.lat, f.z + f.fx * Pl.lat); img.dot(x, y, 2, [255, 255, 120]); }
  for (const Sf of T.features.sandfalls || []) { const f = T.frame(T.sOf(Sf.cp, 0)), [x, y] = toPx(f.x, f.z); img.dot(x, y, 4, [80, 240, 255]); }
  for (const K of [...(T.features.kickers || []), ...(T.features.ramps || [])]) { const f = T.frame(T.sOf(K.cp, K.at)), [x, y] = toPx(f.x - f.fz * (K.lat || 0), f.z + f.fx * (K.lat || 0)); img.dot(x, y, 2, [255, 120, 200]); }
  for (const R of T.features.rails || []) { const a = T.frame(T.sOf(R.from[0], R.from[1])), b = T.frame(T.sOf(R.to[0], R.to[1])); if (R.line) continue; const n = []; let s0 = T.sOf(R.from[0], R.from[1]), s1 = T.sOf(R.to[0], R.to[1]); if (s1 < s0) s1 += T.length; for (let s = s0; s <= s1; s += 3) { const f = T.frame(s), k = (s - s0) / Math.max(1, s1 - s0), lat = R.from[2] + (R.to[2] - R.from[2]) * k; n.push([f.x - f.fz * lat, f.z + f.fx * lat]); } poly(n, [220, 40, 40], 1); void a; void b; }
  for (const C of T.features.coaster || []) { const L = coasterPath(C); for (let k = 1; k < L.pts.length; k++) { const a = toPx(L.pts[k - 1][0], L.pts[k - 1][2]), b = toPx(L.pts[k][0], L.pts[k][2]); img.line(a[0], a[1], b[0], b[1], L.ups[k][1] < 0.3 ? [120, 0, 120] : [255, 60, 255], 2); } }
}
for (const Pt of P.pits) { for (let a = 0; a < 6.3; a += 0.02) { const [x, y] = toPx(Pt.x + Math.cos(a) * Pt.r, Pt.z + Math.sin(a) * Pt.r); img.set(x, y, 120, 40, 20); } const [x, y] = toPx(Pt.x, Pt.z); img.dot(x, y, 3, [120, 20, 10]); }
for (const Pp of P.pipes) { const fx = Math.sin(Pp.dir), fz = Math.cos(Pp.dir), a = toPx(Pp.x - fx * Pp.len / 2, Pp.z - fz * Pp.len / 2), b = toPx(Pp.x + fx * Pp.len / 2, Pp.z + fz * Pp.len / 2); img.line(a[0], a[1], b[0], b[1], [90, 90, 255], 2); }
{ const [x, y] = toPx(P.hub.x, P.hub.z); img.dot(x, y, 4, [255, 255, 255]); }
if (trace) { // a drive's path: speed as colour (blue slow .. red fast), its bails as black dots
  const T = JSON.parse(readFileSync(trace, 'utf8')), F = T.frames || [];
  for (let k = 1; k < F.length; k++) { const v = Math.min(1, F[k][3] / 40), a = toPx(F[k - 1][0], F[k - 1][2]), b = toPx(F[k][0], F[k][2]); img.line(a[0], a[1], b[0], b[1], [255 * v, 60, 255 * (1 - v)], 1); }
  for (const e of T.marks || []) { const [x, y] = toPx(e.x, e.z); img.dot(x, y, 3, e.kind === 'bail' ? [0, 0, 0] : [255, 255, 255]); }
}
img.write(out);
console.log(`${out}: ${W}x${W} px, ${mpp} m a pixel, ${((performance.now() - t0) / 1000).toFixed(1)} s; tracks ${P.tracks.map((T) => `${T.id} ${Math.round(T.length)} m${T.branch ? ` (+${Math.round(T.branch.length)} m branch)` : ''}`).join(', ')}`);
