// ---------------------------------------------------------------------------------------
// THE ISLAND'S MATTER (docs/plans/GODHAND.md section 3): the ground the god hand moves, a layered height field laid over the authored
// island round the jar. Each cell keeps the authored ground under it (bedrock, sampled once and never moved), and on top of it CLAY and
// SAND the hand has put there, and LACHRYMA standing on all of it with the shares of the seven feelings it carries. Water runs by
// virtual pipes (each cell's four neighbours, a flux sped by the height difference and limited by the cell's own water), sand and clay
// slump past their angle of repose (real sand's 34 degrees; clay holds to 50), and everything relaxes back toward the authored shape
// over a game day (the MENDING: an Island of Ego keeps its self-image). Matter is moved, never made: every op says how much it took and
// gave, and what had to come from nothing (the caller charges Lachryma for that).
// Pure data and arithmetic on typed arrays: nothing here touches three.js or the physics; godhand/islandmatter.js owns one, its look
// and its collider.
//
// Prior art: From Dust (Ubisoft Montpellier, 2011: the god carries matter, three layered fluids, the angle of repose); Mei, Decaudin and
// Hu, "Fast Hydraulic Erosion Simulation and Visualization on GPU" (2007: the virtual pipes, as the Spirit Garden's water.js uses them
// on a sphere: here the same on a flat grid); Musgrave's thermal erosion (the talus angle); Populous (raise and lower, conserved).
//
//   const M = new MatterField({ n, cell, ox, oz })   M.sampleBase((x, z) => y | NaN)   M.step(dt)   M.groundAt(x, z)   M.depthAt(x, z)
//   M.pour(x, z, r, vol, { kind: 'water' | 'clay' | 'sand', feeling })   M.take(x, z, r, vol) -> { clay, sand, water, feeling }
//   M.raise(x, z, r, dh) -> { moved, made }   M.smooth(x, z, r, toY, k) -> { moved, made }   M.carve(ax, az, bx, bz, w, depth) -> { moved }
//   M.freeze(x, z, r, sec)   M.hold(x, z, r, sec)   M.pull(x, z, r, sec)   M.corrode(x, z, r, amount)   M.fuse(x, z, r)   M.heat(x, z, r, sec)
//   M.delta() -> m³ off the authored shape   M.version (bumps when the ground changes)   M.wversion (when the water does)
// ---------------------------------------------------------------------------------------
import { DISPLAY_ORDER } from '../progress/weather.js';

export const FEELINGS = DISPLAY_ORDER; // (the seven, in the shown order)
const NF = FEELINGS.length;
export const FEELING_INDEX = Object.fromEntries(FEELINGS.map((f, i) => [f, i]));

/** The numbers (GODHAND.md section 3). Talus as rise over run: tan 34° for sand, tan 50° for clay. `mendTau`: real seconds for the
 *  mending to take two thirds of a change back (1,200: most of it gone within the game day's real hour). `dry`: metres a real second
 *  off still Lachryma. `g`: the island's gravity for the pipes (core/config.js's). */
export const MATTER = {
  n: 144, cell: 0.5,
  g: 9.8, damp: 0.992, minDepth: 1e-4, film: 0.002, dry: 0.0003, pipe: 1,
  talus: { sand: 0.67, clay: 1.19 }, slumpK: 0.35, slumpEvery: 0.1,
  mendTau: 1200, mendEvery: 0.5,
  erodeK: 0.004, // (metres of sand a real second a metre-a-second of current wears away, carried and laid down where it slows)
  lavaCool: 0.06, // (metres of molten matter a real second turned to clay where it lies: the Volcano's)
};

export class MatterField {
  constructor({ n = MATTER.n, cell = MATTER.cell, ox = 0, oz = 0 } = {}) {
    this.n = n; this.cell = cell;
    this.ox = ox - (n * cell) / 2; this.oz = oz - (n * cell) / 2; // (the field's corner: it is centred on where it was laid)
    this.cx = ox; this.cz = oz;
    const N = n * n;
    this.base = new Float32Array(N); this.void = new Uint8Array(N); // (the authored ground, and cells with none under them)
    this.clay = new Float32Array(N); this.sand = new Float32Array(N); this.w = new Float32Array(N);
    this.mix = new Float32Array(N * NF); this.mixNext = new Float32Array(N * NF); this.wNext = new Float32Array(N);
    this.fl = new Float32Array(N); this.fr = new Float32Array(N); this.ft = new Float32Array(N); this.fb = new Float32Array(N);
    this.ice = new Float32Array(N); this.still = new Float32Array(N); this.bias = new Float32Array(N); this.hot = new Float32Array(N);
    this.pulls = []; this.j0 = n; this.j1 = -1; this.bb = null; this.mendV = 0; this.slumpT = 0; this.mendT = 0; this.version = 0; this.wversion = 0; this.water = 0; this.time = 1; this.timeCells = null;
  }

  // ---- where
  idx(i, j) { return j * this.n + i; }
  /** The cell over a point, or -1 off the field. */
  cellAt(x, z) {
    const i = Math.floor((x - this.ox) / this.cell), j = Math.floor((z - this.oz) / this.cell);
    return i < 0 || j < 0 || i >= this.n || j >= this.n ? -1 : j * this.n + i;
  }
  xOf(k) { return this.ox + ((k % this.n) + 0.5) * this.cell; }
  zOf(k) { return this.oz + (Math.floor(k / this.n) + 0.5) * this.cell; }
  contains(x, z) { return this.cellAt(x, z) >= 0; }
  /** The authored ground's height at each cell centre, from `fn(x, z)` (NaN where there is none: the cell is void, nothing settles). */
  sampleBase(fn) {
    for (let k = 0; k < this.base.length; k++) { const y = fn(this.xOf(k), this.zOf(k)); if (Number.isFinite(y)) this.base[k] = y; else { this.void[k] = 1; this.base[k] = -1e3; } }
    this.version++;
  }
  /** The ground's top over a cell: the authored ground and the matter on it (frozen Lachryma is ground too). */
  top(k) { return this.base[k] + this.clay[k] + this.sand[k] + (this.ice[k] > 0 ? this.w[k] : 0); }
  /** Matter heaped on the authored ground at a cell (metres). */
  amount(k) { return this.clay[k] + this.sand[k]; }
  groundAt(x, z) { const k = this.cellAt(x, z); return k < 0 || this.void[k] ? NaN : this.top(k); }
  depthAt(x, z) { const k = this.cellAt(x, z); return k < 0 ? 0 : this.w[k]; }
  /** The leading feeling of the Lachryma at a cell, or null for none or fair (no share over a fifth). */
  feelingAt(k) {
    if (this.w[k] < 0.01) return null;
    let best = -1, bv = 0.2;
    for (let f = 0; f < NF; f++) { const v = this.mix[k * NF + f]; if (v > bv) { bv = v; best = f; } }
    return best < 0 ? null : FEELINGS[best];
  }

  /** The cells within r of a point, with a soft weight (1 at the centre, 0 at r). */
  each(x, z, r, fn, mark = true) {
    const c = this.cell, n = this.n;
    const i0 = Math.max(0, Math.floor((x - r - this.ox) / c)), i1 = Math.min(n - 1, Math.floor((x + r - this.ox) / c));
    const j0 = Math.max(0, Math.floor((z - r - this.oz) / c)), j1 = Math.min(n - 1, Math.floor((z + r - this.oz) / c));
    if (mark) this.grow(i0, i1, j0, j1);
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
      const k = j * n + i; if (this.void[k]) continue;
      const dx = this.ox + (i + 0.5) * c - x, dz = this.oz + (j + 0.5) * c - z, d = Math.sqrt(dx * dx + dz * dz);
      if (d < r) { const u = 1 - d / r; fn(k, u * u * (3 - 2 * u), d); }
    }
  }

  /** The box of cells that may hold matter (the slump, the mending, the look and the collider work only there). */
  grow(i0, i1, j0, j1) {
    const b = this.bb, n = this.n;
    if (!b) this.bb = [Math.max(0, i0 - 1), Math.min(n - 1, i1 + 1), Math.max(0, j0 - 1), Math.min(n - 1, j1 + 1)];
    else { b[0] = Math.max(0, Math.min(b[0], i0 - 1)); b[1] = Math.min(n - 1, Math.max(b[1], i1 + 1)); b[2] = Math.max(0, Math.min(b[2], j0 - 1)); b[3] = Math.min(n - 1, Math.max(b[3], j1 + 1)); }
  }

  // ---- the hand's verbs (each conserves matter; `made` is what came from nothing)
  /** Lay `vol` cubic metres of a kind over r (clay, sand, or Lachryma of a feeling). */
  pour(x, z, r, vol, { kind = 'water', feeling = null } = {}) {
    let wsum = 0; this.each(x, z, r, (k, w) => { wsum += w; });
    if (!wsum || vol <= 0) return 0;
    const a = this.cell * this.cell, fi = feeling != null ? FEELING_INDEX[feeling] : -1;
    this.each(x, z, r, (k, w) => {
      const dh = (vol * w) / wsum / a;
      if (kind === 'clay') this.clay[k] += dh;
      else if (kind === 'sand') this.sand[k] += dh;
      else this.addWater(k, dh, fi);
    });
    if (kind === 'water') { this.wversion++; } else this.version++;
    return vol;
  }
  addWater(k, dh, fi) {
    const w0 = this.w[k], w1 = w0 + dh, o = k * NF, j = (k / this.n) | 0;
    if (j < this.j0) this.j0 = j; if (j > this.j1) this.j1 = j; // (the rows that hold water: the pipes run only there)
    if (w1 <= 0) { this.w[k] = 0; return; }
    for (let f = 0; f < NF; f++) this.mix[o + f] = (this.mix[o + f] * w0 + (f === fi ? dh : 0)) / w1;
    this.w[k] = w1; this.water += dh * this.cell * this.cell;
  }
  /** Take up to `vol` cubic metres from the top of r: Lachryma first, then sand, then clay. What it got, by kind (and the water's leading
   *  feeling). The authored ground is never taken. */
  take(x, z, r, vol, layers = ['w', 'sand', 'clay']) {
    const a = this.cell * this.cell, got = { water: 0, sand: 0, clay: 0, feeling: null }, mixSum = new Float32Array(NF);
    let wsum = 0; this.each(x, z, r, (k, w) => { wsum += w; });
    if (!wsum) return got;
    for (const layer of layers) {
      const want = vol - got.water - got.sand - got.clay;
      if (want <= 1e-6) break;
      this.each(x, z, r, (k, w) => {
        const L = this[layer], dh = Math.min(L[k], (want * w) / wsum / a);
        if (dh <= 0) return;
        if (layer === 'w') { for (let f = 0; f < NF; f++) mixSum[f] += this.mix[k * NF + f] * dh; this.water -= dh * a; }
        L[k] -= dh;
        got[layer === 'w' ? 'water' : layer] += dh * a;
      });
    }
    if (got.water > 0) { let best = -1, bv = 0; for (let f = 0; f < NF; f++) if (mixSum[f] > bv) { bv = mixSum[f]; best = f; } got.feeling = best >= 0 && bv / (got.water / a) > 0.2 ? FEELINGS[best] : null; this.wversion++; }
    if (got.sand || got.clay) this.version++;
    return got;
  }
  /** Two square patches (half side h) trade their matter (Fold), or the first is pressed over the second (Stamp: `copy`). What a copy
   *  lays over less is `made` (m³). Cells off the field or over no ground are left. */
  patch(ax, az, bx, bz, h, { copy = false } = {}) {
    const c = this.cell, n = this.n, m = Math.max(1, Math.round(h / c)), a = c * c;
    const ia = Math.floor((ax - this.ox) / c), ja = Math.floor((az - this.oz) / c), ib = Math.floor((bx - this.ox) / c), jb = Math.floor((bz - this.oz) / c);
    const ok = (i, j) => i >= 0 && j >= 0 && i < n && j < n && !this.void[j * n + i];
    let made = 0, moved = 0;
    for (let dj = -m; dj < m; dj++) for (let di = -m; di < m; di++) {
      const iA = ia + di, jA = ja + dj, iB = ib + di, jB = jb + dj;
      if (!ok(iA, jA) || !ok(iB, jB)) continue;
      const A = jA * n + iA, B = jB * n + iB;
      const was = this.clay[B] + this.sand[B] + this.w[B], now = this.clay[A] + this.sand[A] + this.w[A];
      for (const L of [this.clay, this.sand, this.w]) { const t = L[A]; if (!copy) L[A] = L[B]; L[B] = t; }
      for (let f = 0; f < NF; f++) { const t = this.mix[A * NF + f]; if (!copy) this.mix[A * NF + f] = this.mix[B * NF + f]; this.mix[B * NF + f] = t; }
      if (copy) made += Math.max(0, now - was) * a; else moved += (now + was) * a;
    }
    this.grow(ia - m, ia + m, ja - m, ja + m); this.grow(ib - m, ib + m, jb - m, jb + m);
    this.j0 = Math.max(0, Math.min(this.j0, ja - m, jb - m)); this.j1 = Math.min(n - 1, Math.max(this.j1, ja + m, jb + m));
    this.water = 0; for (let k = 0; k < n * n; k++) this.water += this.w[k]; this.water *= a;
    this.version++; this.wversion++;
    return { moved, made };
  }

  /** Raise the ground at r by dh (negative lowers it): the matter comes from (or goes to) the ring r..2r round it, as clay. What had no
   *  matter to come from is `made` (the caller pays Lachryma for it); lowering never digs below the authored ground. */
  raise(x, z, r, dh) {
    const a = this.cell * this.cell;
    let want = 0, ringSum = 0;
    this.each(x, z, r, (k, w) => { want += (dh > 0 ? dh * w : Math.max(dh * w, -this.amount(k))) * a; });
    this.each(x, z, r * 2, (k, w, d) => { if (d >= r) ringSum += dh > 0 ? this.amount(k) : 1; });
    if (dh > 0) {
      let fromRing = Math.min(want * 0.85, ringSum * a * 0.25);
      const share = ringSum > 0 ? fromRing / (ringSum * a) : 0;
      if (share > 0) this.each(x, z, r * 2, (k, w, d) => { if (d >= r) { const f = 1 - share; this.clay[k] *= f; this.sand[k] *= f; } });
      else fromRing = 0;
      this.each(x, z, r, (k, w) => { this.clay[k] += dh * w; });
      this.version++;
      return { moved: want, made: Math.max(0, want - fromRing) };
    }
    let moved = 0, ring = 0;
    this.each(x, z, r * 2, (k, w, d) => { if (d >= r) ring++; });
    this.each(x, z, r, (k, w) => { const t = Math.min(this.amount(k), -dh * w); if (t <= 0) return; const fs = Math.min(this.sand[k], t); this.sand[k] -= fs; this.clay[k] -= t - fs; moved += t * a; });
    if (ring) this.each(x, z, r * 2, (k, w, d) => { if (d >= r) this.clay[k] += moved / ring / a; });
    this.version++;
    return { moved, made: 0 };
  }
  /** Level r toward a height (`toY`, the stroke's start: terraces), k of the way: matter shaved off the high cells fills the low ones; a
   *  shortfall is `made`. */
  smooth(x, z, r, toY, k = 0.25) {
    const a = this.cell * this.cell; let cut = 0, fill = 0;
    this.each(x, z, r, (c, w) => {
      const d = (toY - this.top(c)) * k * w;
      if (d < 0) { const t = Math.min(this.amount(c), -d); const fs = Math.min(this.sand[c], t); this.sand[c] -= fs; this.clay[c] -= t - fs; cut += t * a; }
      else if (d > 0) { this.clay[c] += d; fill += d * a; }
    });
    this.version++;
    return { moved: Math.max(cut, fill), made: Math.max(0, fill - cut) };
  }
  /** Cut a channel from a to b, w wide and up to `depth` deep (into the matter only), its spoil heaped along both banks. */
  carve(ax, az, bx, bz, w, depth) {
    const a = this.cell * this.cell, L = Math.hypot(bx - ax, bz - az) || 1e-6, ux = (bx - ax) / L, uz = (bz - az) / L;
    let spoil = 0; const banks = [];
    this.each((ax + bx) / 2, (az + bz) / 2, L / 2 + w * 1.5, (k) => {
      const px = this.xOf(k) - ax, pz = this.zOf(k) - az, along = px * ux + pz * uz, side = Math.abs(px * -uz + pz * ux);
      if (along < -w / 2 || along > L + w / 2) return;
      if (side <= w / 2) { const t = Math.min(this.amount(k), depth * (1 - side / (w / 2)) ** 0.5); const fs = Math.min(this.sand[k], t); this.sand[k] -= fs; this.clay[k] -= t - fs; spoil += t * a; }
      else if (side <= w * 1.5) banks.push(k);
    });
    if (banks.length && spoil) for (const k of banks) this.clay[k] += spoil / banks.length / a;
    this.version++;
    return { moved: spoil };
  }

  // ---- what the miracles do to matter
  freeze(x, z, r, sec) { this.each(x, z, r, (k) => { if (this.w[k] > 0.005) this.ice[k] = Math.max(this.ice[k], sec); }); this.version++; }
  hold(x, z, r, sec) { this.each(x, z, r, (k) => { this.still[k] = Math.max(this.still[k], sec); }); }
  /** Lachryma within r flows toward the point, uphill if need be, for `sec` (Desire's Pull). */
  pull(x, z, r, sec, strength = 1.2) { this.pulls.push({ x, z, r, t: sec, s: strength }); this.rebias(); }
  rebias() {
    this.bias.fill(0);
    for (const p of this.pulls) this.each(p.x, p.z, p.r, (k, w) => { this.bias[k] -= p.s * w; });
  }
  /** Eat matter away (Gall's Blight): up to `amount` metres off the matter at the centre; what is eaten is gone (a drain). */
  corrode(x, z, r, amount) { this.each(x, z, r, (k, w) => { const t = Math.min(this.amount(k), amount * w); const fs = Math.min(this.sand[k], t); this.sand[k] -= fs; this.clay[k] -= t - fs; }); this.version++; }
  /** Sand fused to glass (Fury's bolts in the sand): kept as clay, which stands where sand would slump. */
  fuse(x, z, r) { this.each(x, z, r, (k, w) => { const t = this.sand[k] * w; this.sand[k] -= t; this.clay[k] += t; }); this.version++; }
  /** Molten matter (the Volcano's lava): Lachryma marked hot runs, then cools to clay where it lies. */
  heat(x, z, r, sec) { this.each(x, z, r, (k) => { this.hot[k] = Math.max(this.hot[k], sec); }); }
  /** A feeling's Lachryma turned to another's within r (Transmute), or sand to clay and back. */
  transmute(x, z, r, { feeling = null, swap = false } = {}) {
    const fi = feeling != null ? FEELING_INDEX[feeling] : -1;
    this.each(x, z, r, (k, w) => {
      if (fi >= 0 && this.w[k] > 0) { const o = k * NF; for (let f = 0; f < NF; f++) this.mix[o + f] = this.mix[o + f] * (1 - w) + (f === fi ? w : 0); }
      if (swap) { const s = this.sand[k] * w, c = this.clay[k] * w; this.sand[k] += c - s; this.clay[k] += s - c; }
    });
    this.version++; this.wversion++;
  }
  /** Matter's own time over r runs at `scale` for `sec` (Hasten 4, Stay 0): the pipes and the slump read it. */
  hasten(x, z, r, sec, scale) { (this.timeCells ||= []).push({ x, z, r, t: sec, s: scale }); }

  // ---- the step
  step(dt) {
    if (dt <= 0) return;
    // the pipes at 30 steps a real second, whatever the frame rate (half the work at 60, and the same flow at any rate)
    if (this.water > 1e-4 || this.anyHot) { this.flowT = (this.flowT || 0) + dt; for (let i = 0; i < 2 && this.flowT >= 1 / 30; i++) { this.flow(1 / 30); this.flowT -= 1 / 30; } if (this.flowT > 1 / 30) this.flowT = 0; }
    this.slumpT += dt; if (this.slumpT >= MATTER.slumpEvery) { this.slump(this.slumpT); this.slumpT = 0; }
    this.mendT += dt; if (this.mendT >= MATTER.mendEvery) { this.mend(this.mendT); this.mendT = 0; }
    for (let i = this.pulls.length - 1; i >= 0; i--) if ((this.pulls[i].t -= dt) <= 0) { this.pulls.splice(i, 1); this.rebias(); }
    if (this.timeCells) for (let i = this.timeCells.length - 1; i >= 0; i--) if ((this.timeCells[i].t -= dt) <= 0) this.timeCells.splice(i, 1);
  }

  /** Lachryma by the virtual pipes: each cell's outflow to its four neighbours, sped by the drop in surface (and a Pull's bias), limited
   *  so it never sends more than it holds; then the shares of the feelings carried with it. Frozen or held cells neither send nor take. */
  flow(dt) {
    const n = this.n, W = this.w, B = this.bias, c = this.cell, A = c * c, K = dt * MATTER.pipe * MATTER.g / c, damp = MATTER.damp;
    const FL = this.fl, FR = this.fr, FT = this.ft, FB = this.fb;
    const surf = (k) => this.base[k] + this.clay[k] + this.sand[k] + W[k] + B[k];
    let any = false, hot = false;
    const ja = Math.max(0, this.j0 - 1), jb = Math.min(n - 1, this.j1 + 1); // (only the rows with water, and one either side)
    for (let j = ja; j <= jb; j++) for (let i = 0; i < n; i++) {
      const k = j * n + i;
      if (W[k] < MATTER.minDepth || this.ice[k] > 0 || this.still[k] > 0 || this.void[k]) { FL[k] = FR[k] = FT[k] = FB[k] = 0; continue; }
      any = true;
      const h = surf(k), ks = this.timeScale(k), kk = K * ks;
      FL[k] = i > 0 ? Math.max(0, FL[k] * damp + kk * (h - surf(k - 1))) : 0;
      FR[k] = i < n - 1 ? Math.max(0, FR[k] * damp + kk * (h - surf(k + 1))) : 0;
      FT[k] = j > 0 ? Math.max(0, FT[k] * damp + kk * (h - surf(k - n))) : 0;
      FB[k] = j < n - 1 ? Math.max(0, FB[k] * damp + kk * (h - surf(k + n))) : 0;
      const out = (FL[k] + FR[k] + FT[k] + FB[k]) * dt;
      if (out > W[k]) { const s = W[k] / out; FL[k] *= s; FR[k] *= s; FT[k] *= s; FB[k] *= s; }
    }
    if (!any) { this.water = 0; return; }
    const WN = this.wNext, M = this.mix, MN = this.mixNext, k0 = ja * n, k1 = (jb + 1) * n;
    let nj0 = n, nj1 = -1;
    for (let k = k0; k < k1; k++) {
      if (this.void[k]) { WN[k] = 0; continue; }
      const i = k % n, j = (k / n) | 0;
      const inL = i > 0 ? this.fr[k - 1] : 0, inR = i < n - 1 ? this.fl[k + 1] : 0, inT = j > 0 ? this.fb[k - n] : 0, inB = j < n - 1 ? this.ft[k + n] : 0;
      const outF = FL[k] + FR[k] + FT[k] + FB[k], kept = Math.max(0, W[k] - outF * dt);
      const wn = kept + (inL + inR + inT + inB) * dt;
      WN[k] = wn;
      const o = k * NF;
      if (wn > MATTER.minDepth) {
        for (let f = 0; f < NF; f++) {
          let v = M[o + f] * kept;
          if (inL) v += M[(k - 1) * NF + f] * inL * dt; if (inR) v += M[(k + 1) * NF + f] * inR * dt;
          if (inT) v += M[(k - n) * NF + f] * inT * dt; if (inB) v += M[(k + n) * NF + f] * inB * dt;
          MN[o + f] = v / wn;
        }
      } else for (let f = 0; f < NF; f++) MN[o + f] = 0;
    }
    let total = 0;
    for (let k = k0; k < k1; k++) {
      // the current wears sand away where it runs fast and lays it down where it slows (a channel through a dune becomes a gully)
      const v = (FL[k] + FR[k] + FT[k] + FB[k]) / Math.max(0.05, WN[k]) * 0.25;
      if (v > 0.2 && this.sand[k] > 0) { const t = Math.min(this.sand[k], MATTER.erodeK * v * dt); this.sand[k] -= t; this.carry = (this.carry || 0) + t; }
      else if (this.carry > 0 && v < 0.05 && WN[k] > 0.02) { const t = Math.min(this.carry, MATTER.erodeK * dt); this.sand[k] += t; this.carry -= t; }
      if (this.hot[k] > 0) { hot = true; this.hot[k] -= dt; const t = Math.min(WN[k], MATTER.lavaCool * dt); WN[k] -= t; this.clay[k] += t; }
      if (WN[k] < MATTER.film) WN[k] = 0; // (a film thinner than this soaks in: the field's wet rows stay few)
      total += WN[k];
      if (WN[k] > MATTER.minDepth) { const j = (k / n) | 0; if (j < nj0) nj0 = j; if (j > nj1) nj1 = j; }
    }
    this.w.set(WN.subarray(k0, k1), k0); this.mix.set(MN.subarray(k0 * NF, k1 * NF), k0 * NF);
    this.j0 = nj0; this.j1 = nj1;
    this.water = total * A; this.anyHot = hot; this.wversion++;
    if (hot || this.carry) this.version++;
  }
  timeScale(k) {
    if (!this.timeCells?.length) return 1;
    const x = this.xOf(k), z = this.zOf(k);
    for (const t of this.timeCells) if ((x - t.x) ** 2 + (z - t.z) ** 2 < t.r * t.r) return t.s;
    return 1;
  }

  /** Thermal erosion: a slope of sand or clay steeper than its talus sends the excess downhill, half the difference a pass (Musgrave). */
  slump(dt) {
    const n = this.n, c = this.cell, k1 = Math.min(1, MATTER.slumpK * dt * 10);
    let moved = 0;
    const b = this.bb; if (!b) return;
    for (const layer of ['sand', 'clay']) {
      const L = this[layer], tal = MATTER.talus[layer] * c;
      for (let j = b[2]; j <= b[3]; j++) for (let i = b[0]; i <= b[1]; i++) {
        const k = j * n + i; if (L[k] <= 1e-4 || this.void[k] || this.ice[k] > 0) continue;
        const h = this.top(k);
        for (const nb of [i > 0 ? k - 1 : -1, i < n - 1 ? k + 1 : -1, j > 0 ? k - n : -1, j < n - 1 ? k + n : -1]) {
          if (nb < 0 || this.void[nb]) continue;
          const d = h - this.top(nb) - tal;
          if (d > 0.002) { const t = Math.min(L[k], d * 0.5 * k1); L[k] -= t; L[nb] += t; moved += t; }
        }
      }
    }
    if (moved) { this.grow(b[0], b[1], b[2], b[3]); if (moved > 0.02 / (this.cell * this.cell)) this.version++; else this.mendV++; } // (a slump may spill a cell past the box; a settling trickle is the slow kind of change)
  }

  /** The mending: everything relaxes toward the authored island (and still Lachryma dries a little), and the miracles' timers run down. */
  mend(dt) {
    const f = Math.exp(-dt / MATTER.mendTau), dry = MATTER.dry * dt, n = this.n, A = this.cell * this.cell;
    let changed = false, wet = false, iced = false, left = false;
    const b = this.bb;
    if (b) for (let j = b[2]; j <= b[3]; j++) for (let k = j * n + b[0], ke = j * n + b[1]; k <= ke; k++) {
      if (this.clay[k] > 1e-4 || this.sand[k] > 1e-4) { this.clay[k] *= f; this.sand[k] *= f; changed = true; if (this.clay[k] < 1e-3) this.clay[k] = 0; if (this.sand[k] < 1e-3) this.sand[k] = 0; if (this.clay[k] || this.sand[k]) left = true; }
      if (this.ice[k] > 0) { left = true; if ((this.ice[k] -= dt) <= 0) { this.ice[k] = 0; iced = true; } }
      if (this.still[k] > 0) this.still[k] = Math.max(0, this.still[k] - dt);
    }
    if (this.water > 0 && this.j1 >= this.j0) for (let k = this.j0 * n, ke = (this.j1 + 1) * n; k < ke; k++) if (this.w[k] > 0) { const t = Math.min(this.w[k], dry); this.w[k] -= t; this.water -= t * A; wet = true; }
    if (b && !left) this.bb = null; // (all healed: nothing left for the slump or the look to walk)
    if (changed) this.mendV++; // (the mending's slow change: the look and the collider follow it at their own slow pace)
    if (iced) this.version++;
    if (wet) this.wversion++;
  }

  /** How far the ground stands from the authored island: the matter laid on it, in cubic metres (rejection reads it). */
  delta() {
    const b = this.bb, n = this.n; if (!b) return 0;
    let v = 0; for (let j = b[2]; j <= b[3]; j++) for (let k = j * n + b[0], ke = j * n + b[1]; k <= ke; k++) v += this.clay[k] + this.sand[k];
    return v * this.cell * this.cell;
  }
}
