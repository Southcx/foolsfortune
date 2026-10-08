// ---------------------------------------------------------------------------------------
// THE GARDEN'S WATER (the glossary: the garden's water): Lachryma that runs on the planetoids, a shallow-water simulation on each
// planetoid's clay grid (world/garden/clay.js: 128 by 64 cells over latitude and longitude). Each cell holds a depth over its ground;
// virtual pipes to its four neighbours carry a flux that the height difference speeds up and the cell's own water limits, so water runs
// downhill, pools in hollows, spills over rims and sloshes before it settles. Running water wears the ground away by its speed and lays
// it down where it slows (hydraulic erosion: rivers cut, deltas build), and a sculpted slope steeper than it can hold slumps (thermal
// erosion, on the clay's own heights: the planetoids' authored shapes are never worn). Each cell's water keeps its mix of the five
// feelings (the shares of each), which mixes as the water does; what a feeling's water does is Dovina's rule to come (her list, item 11).
// Water comes from **springs** (a source the hand sets, or the garden's own) and from the hand pouring it, and leaves through **drains**,
// the hand drinking it up, and a slow drying. A planetoid with no water and no spring sleeps. The water's look is a stand-in
// (world/garden/watermesh.js) until Calissa's.
// Events: garden.water { planetoid, how: 'pour' | 'drink' | 'spring' | 'drain' | 'unset' } (the hand's, world/garden/hand.js).
//
// Prior art: Mei, Decaudin and Hu, "Fast Hydraulic Erosion Simulation and Visualization on GPU" (2007: the virtual pipes, the sediment's
// capacity, the semi-Lagrangian carry), From Dust's water over sculpted land, and the thermal erosion of terrain generators (a talus
// angle, Musgrave 1989).
//
//   const W = new PlanetWater(clay, { g })   W.step(dt) (60 a real second)   W.slump(dt) (a few a real second)   W.depthAt(dir)   W.pour(dir, volume, feeling)   W.drink(dir, volume)
//   W.total   W.version   W.mix(k) -> [5 shares]   W.dump() / W.load(d)   basinVolume(clay) -> cubic metres its basins would hold
// ---------------------------------------------------------------------------------------
import { NX, NY, CELL_DIRS, uvOf } from './clay.js';

export const FEELINGS = ['wonder', 'mirth', 'desire', 'grief', 'dread']; // (the shown order: DISPLAY_ORDER, progress/weather.js)
const WATER = { g: 20, damp: 0.985, minDepth: 1e-4, dry: 0.0015, erodeK: 0.02, depositK: 0.06, capacityK: 0.05, minSlope: 0.06, talus: 1.1, slumpK: 0.25, sediment: 0.5 };
// (g: the garden's gravity, planetbody.js; dry: metres a real second off still water; erosion: Mei's Kc, Ks, Kd; talus: the steepest a
// sculpted slope holds, rise over run; sediment: the most a cell's water carries, metres)

export class PlanetWater {
  constructor(clay, { g = WATER.g } = {}) {
    this.clay = clay; this.g = g; const n = NX * NY, R = clay.P.r;
    this.w = new Float32Array(n); this.s = new Float32Array(n); this.s2 = new Float32Array(n);
    this.fl = new Float32Array(n); this.fr = new Float32Array(n); this.ft = new Float32Array(n); this.fb = new Float32Array(n);
    this.vx = new Float32Array(n); this.vy = new Float32Array(n);
    this.mixes = new Float32Array(n * 5); this.next = new Float32Array(n * 5); this.wNext = new Float32Array(n);
    // the cells' sizes on the sphere: a row's width shrinks toward the poles (held to a fifth of its height, so a pole cell is not a needle)
    this.dy = (R * Math.PI) / NY; this.dx = new Float32Array(NY); this.area = new Float32Array(NY);
    for (let j = 0; j < NY; j++) { const lat = ((j + 0.5) / NY - 0.5) * Math.PI; this.dx[j] = Math.max(this.dy * 0.2, (R * Math.cos(lat) * Math.PI * 2) / NX); this.area[j] = this.dx[j] * this.dy; }
    // the neighbours (wrapping round in longitude; over a pole, the cell across it)
    this.nl = new Int32Array(n); this.nr = new Int32Array(n); this.nt = new Int32Array(n); this.nb = new Int32Array(n);
    for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
      const k = j * NX + i, ac = (i + NX / 2) % NX;
      this.nl[k] = j * NX + (i + NX - 1) % NX; this.nr[k] = j * NX + (i + 1) % NX;
      this.nt[k] = j === NY - 1 ? j * NX + ac : (j + 1) * NX + i; this.nb[k] = j === 0 ? ac : (j - 1) * NX + i;
    }
    this.total = 0; this.version = 0; this.awake = false; this.moving = 0; this.eroded = false;
    this.j0 = 0; this.j1 = NY - 1; this.still = 0; // (the rows that hold water, and the real seconds it has lain still: settled water rests)
  }

  /** The cell under a direction (the nearest). */
  cellOf(dir) { const [u, v] = uvOf(dir); return Math.min(NY - 1, Math.max(0, Math.round(v))) * NX + (Math.round(u) % NX); }
  /** The water's depth over the ground in a direction (bilinear, metres). */
  depthAt(dir) {
    if (!this.total) return 0;
    const [u, v] = uvOf(dir), i0 = Math.floor(u), j0 = Math.max(0, Math.min(NY - 1, Math.floor(v))), j1 = Math.min(NY - 1, j0 + 1), i1 = (i0 + 1) % NX, fu = u - i0, fv = Math.max(0, Math.min(1, v - j0)), W = this.w;
    return (W[j0 * NX + i0] * (1 - fu) + W[j0 * NX + i1] * fu) * (1 - fv) + (W[j1 * NX + i0] * (1 - fu) + W[j1 * NX + i1] * fu) * fv;
  }
  mix(k) { return Array.from(this.mixes.subarray(k * 5, k * 5 + 5)); }

  /** Water poured at a direction: `volume` cubic metres of one feeling, spread over the cell and its four neighbours. */
  pour(dir, volume, feeling = 'wonder') {
    const k0 = this.cellOf(dir), e = Math.max(0, FEELINGS.indexOf(feeling));
    for (const k of [k0, this.nl[k0], this.nr[k0], this.nt[k0], this.nb[k0]]) {
      const add = (volume / 5) / this.area[(k / NX) | 0], was = this.w[k], now = was + add, M = this.mixes;
      for (let f = 0; f < 5; f++) M[k * 5 + f] = now > 0 ? (M[k * 5 + f] * was + (f === e ? add : 0)) / now : 0;
      this.w[k] = now;
    }
    this.wake();
  }
  /** Water disturbed (poured, drunk, the ground under it moved): every row is looked at again, and it runs. */
  wake() { this.awake = true; this.still = 0; this.j0 = 0; this.j1 = NY - 1; this.version++; }
  /** Water taken up at a direction: at most `volume` cubic metres from the cell and its neighbours; what was taken. */
  drink(dir, volume) {
    const k0 = this.cellOf(dir); let got = 0;
    for (const k of [k0, this.nl[k0], this.nr[k0], this.nt[k0], this.nb[k0]]) { const A = this.area[(k / NX) | 0], take = Math.min(this.w[k], (volume / 5) / A); this.w[k] -= take; got += take * A; }
    if (got) this.wake();
    return got;
  }

  /** One step of the water (a real second's fraction: the caller substeps, world/garden/realm.js). */
  step(dt) {
    if (!this.awake) return;
    if (this.still > 2 && !this.springs) { this.still += dt; if (this.still % 1 < dt) this.dryOff(1); return; } // (settled: only dries, a real second at a time)
    const C = this.clay, W = this.w, G = this.g, n = NX * NY, k0 = this.j0 * NX, k1 = (this.j1 + 1) * NX, B = C.base, Hc = C.h, { fl, fr, ft, fb, nl, nr, nt, nb, dx, dy, area } = this;
    // 1. the pipes: each outflow sped up by the drop to the neighbour, then scaled so a cell never gives more than it holds
    let moving = 0;
    for (let k = k0; k < k1; k++) {
      if (W[k] < WATER.minDepth) { fl[k] = fr[k] = ft[k] = fb[k] = 0; continue; }
      const j = (k / NX) | 0, Hk = B[k] + Hc[k] + W[k], cx = dt * G * dy / dx[j], cy = dt * G * dx[j] / dy;
      const L = nl[k], Rr = nr[k], T = nt[k], Bm = nb[k];
      let a = Math.max(0, fl[k] * WATER.damp + cx * (Hk - B[L] - Hc[L] - W[L])), b = Math.max(0, fr[k] * WATER.damp + cx * (Hk - B[Rr] - Hc[Rr] - W[Rr]));
      let c = Math.max(0, ft[k] * WATER.damp + cy * (Hk - B[T] - Hc[T] - W[T])), d = Math.max(0, fb[k] * WATER.damp + cy * (Hk - B[Bm] - Hc[Bm] - W[Bm]));
      const out = (a + b + c + d) * dt, has = W[k] * area[j];
      if (out > has) { const K = has / out; a *= K; b *= K; c *= K; d *= K; }
      fl[k] = a; fr[k] = b; ft[k] = c; fb[k] = d; moving = Math.max(moving, a + b + c + d);
    }
    // 2. the depths and the feelings carried with them (what flows in brings its mix), and the speed through each cell
    const M = this.mixes, N = this.next, WN = this.wNext;
    WN.set(W); N.set(M);
    for (let k = k0; k < k1; k++) {
      const outV = (fl[k] + fr[k] + ft[k] + fb[k]) * dt; if (!outV) continue;
      WN[k] -= outV / area[(k / NX) | 0];
      for (let q = 0; q < 4; q++) {
        const m = q === 0 ? nl[k] : q === 1 ? nr[k] : q === 2 ? nt[k] : nb[k], f = q === 0 ? fl[k] : q === 1 ? fr[k] : q === 2 ? ft[k] : fb[k];
        if (!f) continue;
        const dm = (f * dt) / area[(m / NX) | 0], before = WN[m], after = before + dm;
        if (after > 0) for (let e = 0; e < 5; e++) N[m * 5 + e] = (N[m * 5 + e] * before + M[k * 5 + e] * dm) / after;
        WN[m] = after;
      }
    }
    let total = 0, wj0 = NY, wj1 = -1;
    for (let k = 0; k < n; k++) {
      if (k < k0 - NX || k >= k1 + NX) { if (W[k]) { const j = (k / NX) | 0; total += W[k] * area[j]; wj0 = Math.min(wj0, j); wj1 = Math.max(wj1, j); } continue; } // (rows out of the band: unchanged)
      const j = (k / NX) | 0, inX = fr[nl[k]] - fl[k] + fr[k] - fl[nr[k]], inY = ft[nb[k]] - fb[k] + ft[k] - fb[nt[k]];
      let w = Math.max(0, WN[k] - (moving < 1e-4 ? WATER.dry * dt : WATER.dry * 0.2 * dt)); // (still water dries faster than running)
      if (w < WATER.minDepth) w = 0;
      const mean = Math.max(1e-3, (W[k] + w) * 0.5);
      this.vx[k] = inX / (2 * dy * mean); this.vy[k] = inY / (2 * dx[j] * mean);
      W[k] = w; total += w * area[j]; if (w) { if (j < wj0) wj0 = j; if (j > wj1) wj1 = j; }
    }
    // the next step's band: the wet rows and one either side (all of them near a pole, where neighbours cross it)
    this.j0 = wj0 <= 1 || wj1 >= NY - 2 ? 0 : wj0 - 1; this.j1 = wj0 <= 1 || wj1 >= NY - 2 ? NY - 1 : wj1 + 1;
    this.still = moving < 0.05 ? this.still + dt : 0; // (under 0.05 m³ a real second through any cell: settled)
    M.set(N);
    // 3. the ground worn and laid down by running water, and carried with it
    const S = this.s, S2 = this.s2; let eroded = false;
    for (let k = k0; k < k1; k++) {
      if (W[k] < 0.01 && S[k] < 1e-5) continue;
      const j = (k / NX) | 0, gx = (C.base[nr[k]] + C.h[nr[k]] - C.base[nl[k]] - C.h[nl[k]]) / (2 * dx[j]), gy = (C.base[nt[k]] + C.h[nt[k]] - C.base[nb[k]] - C.h[nb[k]]) / (2 * dy);
      const slope = Math.max(WATER.minSlope, Math.sqrt(gx * gx + gy * gy) / Math.sqrt(1 + gx * gx + gy * gy)), speed = Math.hypot(this.vx[k], this.vy[k]);
      const cap = Math.min(WATER.sediment, WATER.capacityK * slope * speed);
      if (cap > S[k]) { const d = C.add(k, -WATER.erodeK * (cap - S[k]) * dt); S[k] -= d; if (d) eroded = true; }
      else { const d = C.add(k, WATER.depositK * (S[k] - cap) * dt); S[k] -= d; if (d) eroded = true; }
    }
    for (let k = k0; k < k1; k++) { // (the sediment carried: taken from upstream, a semi-Lagrangian step in cells)
      if (!S[k] && !W[k]) { S2[k] = 0; continue; }
      const j = (k / NX) | 0, u = -this.vx[k] * dt / dx[j], v = -this.vy[k] * dt / dy;
      const from = Math.abs(u) > 0.5 || Math.abs(v) > 0.5 ? (Math.abs(u) > Math.abs(v) ? (u < 0 ? nl[k] : nr[k]) : (v < 0 ? nb[k] : nt[k])) : k;
      S2[k] = from === k ? S[k] : S[k] * 0.5 + S[from] * 0.5;
    }
    S.set(S2);
    if (eroded) this.eroded = true;
    this.total = total; this.moving = moving; this.version++;
    if (total < 1e-3 && !this.springs) { this.awake = false; this.w.fill(0); this.total = 0; }
  }

  /** Still water drying a while at once (settled water is not stepped). */
  dryOff(secs) { const W = this.w, A = this.area; let total = 0; for (let k = 0; k < NX * NY; k++) { if (!W[k]) continue; W[k] = Math.max(0, W[k] - WATER.dry * secs); if (W[k] < WATER.minDepth) W[k] = 0; total += W[k] * A[(k / NX) | 0]; } this.total = total; this.version++; if (total < 1e-3 && !this.springs) { this.awake = false; this.total = 0; } }

  /** A sculpted slope steeper than it can hold slumps (the clay's own heights only: an authored needle stands). A few times a real
   *  second, wet or dry (the realm calls it after a stroke, and while the water runs). True if the ground moved. */
  slump(dt) {
    const C = this.clay, Hc = C.h, n = NX * NY, { nr, nt, dx, dy } = this; let eroded = false;
    for (let k = 0; k < n; k++) {
      const j = (k / NX) | 0;
      for (let q = 0; q < 2; q++) {
        const m = q ? nt[k] : nr[k], l = q ? dy : dx[j], drop = (Hc[k] - Hc[m]) / l;
        if (drop <= WATER.talus && drop >= -WATER.talus) continue;
        const move = (Math.abs(drop) - WATER.talus) * l * 0.5 * WATER.slumpK * dt * Math.sign(drop);
        const a = C.add(k, -move); C.add(m, -a); if (a) eroded = true;
      }
    }
    if (eroded) this.eroded = true;
    return eroded;
  }

  /** Kept: the wet cells as [cell, centimetres, the strongest feeling], and the sediment is let go. */
  dump() { const a = []; for (let k = 0; k < NX * NY; k++) if (this.w[k] >= 0.01) { const M = this.mix(k); a.push(k, Math.round(this.w[k] * 100), M.indexOf(Math.max(...M))); } return a.length ? a : null; }
  load(a) {
    this.w.fill(0); this.mixes.fill(0);
    if (!Array.isArray(a)) return;
    for (let i = 0; i + 2 < a.length; i += 3) { const k = a[i] | 0; if (k < 0 || k >= NX * NY) continue; this.w[k] = (a[i + 1] || 0) / 100; this.mixes[k * 5 + Math.max(0, Math.min(4, a[i + 2] | 0))] = 1; }
    this.awake = true; this.version++;
  }
}

/** Every cell's direction, for the look (world/garden/watermesh.js). */
export { CELL_DIRS };

/** What the clay's basins would hold, filled to their spill points (a priority-flood: Barnes, Lehman and Mulla, 2014). A planetoid has no
 *  edge to drain over, so the outlet is its lowest cell: water there is the sea, everything held up behind a rim above it is a basin.
 *  Read at a stroke's end, before and after (garden.sculpt's `q`: TRAINING.md 6), on the water's own grid (neighbours wrapping in
 *  longitude and across a pole; a cell's area by its row), without making the planetoid's water. 8,192 cells, a few milliseconds. */
export function basinVolume(clay) {
  const n = NX * NY, z = new Float32Array(n), seen = new Uint8Array(n), lvl = new Float32Array(n), heap = [];
  for (let k = 0; k < n; k++) z[k] = clay.base[k] + clay.h[k];
  const R = clay.P.r, dy = (R * Math.PI) / NY, area = new Float32Array(NY);
  for (let j = 0; j < NY; j++) { const lat = ((j + 0.5) / NY - 0.5) * Math.PI; area[j] = Math.max(dy * 0.2, (R * Math.cos(lat) * Math.PI * 2) / NX) * dy; }
  const near = (k, out) => { const j = (k / NX) | 0, i = k - j * NX, ac = (i + NX / 2) % NX; out[0] = j * NX + (i + NX - 1) % NX; out[1] = j * NX + (i + 1) % NX; out[2] = j === NY - 1 ? j * NX + ac : (j + 1) * NX + i; out[3] = j === 0 ? ac : (j - 1) * NX + i; return out; };
  const push = (k, v) => { lvl[k] = v; heap.push(k); let i = heap.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (lvl[heap[p]] <= v) break; heap[i] = heap[p]; i = p; } heap[i] = k; };
  const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { let i = 0; const v = lvl[last]; for (;;) { let c = 2 * i + 1; if (c >= heap.length) break; if (c + 1 < heap.length && lvl[heap[c + 1]] < lvl[heap[c]]) c++; if (lvl[heap[c]] >= v) break; heap[i] = heap[c]; i = c; } heap[i] = last; } return top; };
  let lo = 0; for (let k = 1; k < n; k++) if (z[k] < z[lo]) lo = k;
  push(lo, z[lo]); seen[lo] = 1;
  let vol = 0; const nb = [0, 0, 0, 0];
  while (heap.length) {
    const k = pop(), L = lvl[k];
    for (const m of near(k, nb)) {
      if (seen[m]) continue; seen[m] = 1;
      if (z[m] < L) { vol += (L - z[m]) * area[(m / NX) | 0]; push(m, L); } else push(m, z[m]);
    }
  }
  return vol;
}
