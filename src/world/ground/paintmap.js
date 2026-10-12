// ---------------------------------------------------------------------------------------
// THE PAINT MAP: where Lachryma lies on the ground, as a grid the world can ask and the ground's shaders can draw. The Soul Brush's
// paint lays a feeling on it (and the mop drinks it back), and what stands in it is asked of it (stains of spilled crude are their own
// meshes: world/ground/stains.js): a creature in painted ground takes the feeling's status, a Brush Slide over it runs on (docs/plans/SUNSHINE-SYSTEMS.md: phase 2,
// and Dovina's numbers).
//
// Prior art: Super Mario Sunshine's pollution layers (doldecomp/sms PollutionLayer: a bitmap projected flat onto the floor, stamped by
// the spray, asked by the collision), Splatoon's paint kept in a texture laid over the level, and our own trail map
// (world/ground/trailmap.js: a window that follows the focus, re-centred in whole cells so nothing swims). Kept on the CPU, as
// Sunshine's was, so the game asks it without a read-back; uploaded to two small textures for the look (the colour; the height and
// the motif byte), which is Calissa's: vfx/paintmotifs.js (each feeling's pattern, crude's oil film, the gloss).
//
//   const pm = new PaintMap()   pm.update(dt, focusX, focusZ)   pm.patch(material) (the ground's shaders: tops of things only)
//   pm.stamp(x, y, z, r, aspect, k) -> m² newly covered   pm.drink(x, y, z, r, want) -> paint taken (0..want, in cell-fulls)
//   pm.at(x, y, z) -> { k, aspect, crude } | null   pm.wipe(ax, az, bx, bz, y, width, want, crude, centre?) -> { got, aspect, smear }
//   pm.slick(x, y, z, r, k) (crude that fades: a fight's)   pm.count(x, y, z, r, crude) -> cells   pm.onRecentre (set by stains.js: the blots laid again)   ASPECT_COLOR
//   (one cell is 0.25 m, so a puddle's edge reads round; a window of 256 cells, 64 m, round the focus; paint fades over LIFE real seconds)
// ONE STORE (docs/plans/PAINT.md, the owner, 2026-10-12): the old slip field (courier/moves/env.js SlipField) and the slicks' meshes are
// gone into it. A coat is anything wet laid on a surface (a shell's splash, a jelly's spit, the brush's trail): on a floor it is cells
// (the Courier's in the brush's feeling, anyone else's a slick), on a wall a disc that dries (until walls are charts, phase 2). A fixed
// coat (the tech lab's lane and wall) keeps: cells laid again when the window moves. The Paint Dive asks `wet`; moving through it
// drags it on (`smear`, world/ground/painttrack.js).
//   pm.coat(c, n, r, life, delay, by)   pm.coatRect(c, n, u, hu, hv)   pm.wet(p, n, depth, wet) -> the surface's normal | null
//   pm.smear(x, y, z, r, vx, vz, dt, share) -> cells moved   pm.clearCoats()   pm.spots (the coats as discs: the ecology's wet ground)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { OPPOSITE, ASPECTS, COLOR } from '../../progress/weather.js';
import { paintMotifCode, PAINT_DRY, PAINT_LOOK_HEAD, PAINT_LOOK_BODY, PAINT_LOOK_ROUGH, PAINT_LOOK_NORMAL } from '../../vfx/paintmotifs.js';

const N = 256, CELL = 0.25, SPAN = N * CELL, LIFE = 150, SLICK_LIFE = 40, NONE = -1e4, NEAR = 0.8, FLAT = 0x3b2b22; // (a slick: crude thrown or welled up in a fight, flat (no feeling), gone in 40 real seconds)
/** Which cells a wipe or a count takes: true a blot's crude, 'slick' a slick's, false paint. */
const KIND = (crude) => (crude === 'slick' ? 2 : crude ? 1 : 0);
const UP = new THREE.Vector3(0, 1, 0), _d = new THREE.Vector3();
export const ASPECT_COLOR = Object.fromEntries(ASPECTS.map((a) => [a, new THREE.Color(COLOR[a])]));

export class PaintMap {
  constructor() {
    this.k = new Float32Array(N * N);       // paint, 0..1
    this.asp = new Int8Array(N * N).fill(-1); // its feeling (index into ASPECTS)
    this.crude = new Uint8Array(N * N); // 1: crude, a blot's (world/ground/stains.js), which keeps; 2: a slick, crude that fades; 0: paint, which fades
    this.h = new Float32Array(N * N).fill(NONE); // the height it lies at
    this.wetT = new Float32Array(N * N); this.clock = 0; // (when a cell was last wetted, real seconds: the look dries it, vfx/paintmotifs.js PAINT_DRY) (CROSSING, Calissa: the look)
    this.x0 = -SPAN / 2; this.z0 = -SPAN / 2; // (the window's corner, in whole cells)
    this.live = new Set(); this.dirty = true; this.upT = 0;
    this.colData = new Uint8Array(N * N * 4); this.hData = new Float32Array(N * N * 2); // (the height a cell lies at, and its motif: vfx/paintmotifs.js)
    this.colTex = new THREE.DataTexture(this.colData, N, N, THREE.RGBAFormat); this.colTex.magFilter = this.colTex.minFilter = THREE.LinearFilter;
    this.hTex = new THREE.DataTexture(this.hData, N, N, THREE.RGFormat, THREE.FloatType); this.hTex.magFilter = this.hTex.minFilter = THREE.NearestFilter;
    this.colTex.needsUpdate = this.hTex.needsUpdate = true;
    this.spots = []; this.rects = []; this.fixed = []; // (coats as discs; fixed coats on walls; fixed coats on floors, laid as cells)
    this.aspectOf = null; // (the feeling the Courier's coats are laid in: main.js, the brush's load)
    this.uniforms = { uPmCol: { value: this.colTex }, uPmH: { value: this.hTex }, uPmWin: { value: new THREE.Vector4(this.x0, this.z0, SPAN, 1 / N) } };
  }

  cell(x, z) { const i = Math.floor((x - this.x0) / CELL), j = Math.floor((z - this.z0) / CELL); return i < 0 || j < 0 || i >= N || j >= N ? -1 : j * N + i; }

  /** Lay `k` of a feeling in a disc of radius r at (x, y, z). Returns the area newly covered (m²). One feeling a cell: the same feeling
   *  thickens, another takes the cell (the last writer wins, a crisp edge), its opposite cancels it toward bare ground (LACHRYMA-LOOP.md
   *  3, rule 5). `crude`: laid as a blot's crude, which keeps (and paint over crude is laid over it, crude over paint takes the cell);
   *  crude with no feeling (`aspect` null: a blot's, the owner, 2026-10-11) is drawn flat, in crude's oil film. */
  stamp(x, y, z, r, aspect, k = 1, crude = false) {
    const a = aspect == null && crude ? -1 : ASPECTS.indexOf(aspect); if (a < 0 && !(crude && aspect == null)) return 0;
    let fresh = 0;
    const c = Math.ceil(r / CELL), opp = ASPECTS.indexOf(OPPOSITE[aspect]);
    const ci = Math.floor((x - this.x0) / CELL), cj = Math.floor((z - this.z0) / CELL);
    for (let dj = -c; dj <= c; dj++) for (let di = -c; di <= c; di++) {
      const i = ci + di, j = cj + dj; if (i < 0 || j < 0 || i >= N || j >= N) continue;
      const px = this.x0 + (i + 0.5) * CELL, pz = this.z0 + (j + 0.5) * CELL, d = Math.hypot(px - x, pz - z); if (d > r) continue;
      const n = j * N + i, add = crude ? k : k * (1 - 0.5 * (d / r) ** 2); // (crude lies flat to its edge: a blot's crude is its cells)
      if (this.h[n] !== NONE && Math.abs(this.h[n] - y) > NEAR && this.k[n] > 0.05) continue; // (another floor's paint: leave it)
      if (this.crude[n] && !crude && this.k[n] > 0.05) continue; // (paint does not cover crude: it is wiped up, the mop's, or cleaned)
      if (this.k[n] < 0.05) fresh += CELL * CELL;
      if (this.k[n] >= 0.05 && this.asp[n] === opp && !crude && !this.crude[n]) { this.k[n] = Math.max(0, this.k[n] - add); if (this.k[n] < 0.05) { this.k[n] = 0; this.asp[n] = -1; } this.live.add(n); continue; } // (opposites cancel)
      if (this.asp[n] === a && this.crude[n] === (crude ? 1 : 0)) this.k[n] = Math.min(1, this.k[n] + add); // (the same: it thickens)
      else { this.asp[n] = a; this.k[n] = Math.min(1, Math.max(add, crude ? this.k[n] : 0)); this.crude[n] = crude ? 1 : 0; } // (another: the last writer takes it)
      this.h[n] = y; this.wetT[n] = this.clock; this.live.add(n);
    }
    this.dirty = true;
    return fresh;
  }

  /** A slick: crude with no feeling laid in a disc (a jelly's spit, a slam's ring, a cast's puddle: LACHRYMA-LOOP.md 0, "every liquid
   *  hazard is crude"), over bare ground and paint, never over a blot; it fades in SLICK_LIFE real seconds. */
  slick(x, y, z, r, k = 1) {
    const c = Math.ceil(r / CELL), ci = Math.floor((x - this.x0) / CELL), cj = Math.floor((z - this.z0) / CELL);
    for (let dj = -c; dj <= c; dj++) for (let di = -c; di <= c; di++) {
      const i = ci + di, j = cj + dj; if (i < 0 || j < 0 || i >= N || j >= N) continue;
      if (Math.hypot(this.x0 + (i + 0.5) * CELL - x, this.z0 + (j + 0.5) * CELL - z) > r) continue;
      const n = j * N + i; if (this.crude[n] === 1 && this.k[n] > 0.05) continue;
      if (this.h[n] !== NONE && Math.abs(this.h[n] - y) > NEAR && this.k[n] > 0.05) continue;
      this.asp[n] = -1; this.crude[n] = 2; this.k[n] = Math.max(this.k[n], k); this.h[n] = y; this.live.add(n);
    }
    this.dirty = true;
  }

  /** The mop's wipe: a strip `w` wide from a to b (the stroke this frame), rim cells first, up to `want` cell-fulls. `crude` true: only
   *  a blot's crude, 'slick': only a slick's, false: only paint. Returns { got, aspect, smear: where the edge of it was pushed to (0.5 m on along the stroke) } (rule 7). */
  wipe(ax, az, bx, bz, y, w, want, crude, centre = null) {
    const dx = bx - ax, dz = bz - az, len = Math.hypot(dx, dz) || 1e-6, ux = dx / len, uz = dz / len, half = w / 2;
    const x0 = Math.min(ax, bx) - half, x1 = Math.max(ax, bx) + half, z0 = Math.min(az, bz) - half, z1 = Math.max(az, bz) + half;
    const cells = [];
    for (let j = Math.floor((z0 - this.z0) / CELL); j <= Math.floor((z1 - this.z0) / CELL); j++) for (let i = Math.floor((x0 - this.x0) / CELL); i <= Math.floor((x1 - this.x0) / CELL); i++) {
      if (i < 0 || j < 0 || i >= N || j >= N) continue;
      const n = j * N + i; if (this.k[n] <= 0 || this.crude[n] !== KIND(crude) || Math.abs(this.h[n] - y) > NEAR) continue;
      const px = this.x0 + (i + 0.5) * CELL - ax, pz = this.z0 + (j + 0.5) * CELL - az, along = px * ux + pz * uz, across = Math.abs(px * uz - pz * ux);
      if (across > half || along < -half || along > len + half) continue;
      const cx = centre ? this.x0 + (i + 0.5) * CELL - centre.x : 0, cz = centre ? this.z0 + (j + 0.5) * CELL - centre.z : 0;
      cells.push([n, centre ? -(cx * cx + cz * cz) : -across]); // (the rim first: farthest from the blot's middle, else the strip's edge)
    }
    cells.sort((p, q) => p[1] - q[1]);
    let got = 0, aspect = null;
    for (const [n] of cells) { if (got >= want) break; const t = Math.min(this.k[n], want - got); this.k[n] -= t; got += t; aspect = ASPECTS[this.asp[n]]; if (this.k[n] <= 0.02) { this.k[n] = 0; this.asp[n] = -1; this.crude[n] = 0; } }
    if (got) this.dirty = true;
    return { got, aspect, smear: got > 0 ? { x: bx + ux * 0.5, z: bz + uz * 0.5 } : null };
  }

  /** Drink up to `want` cell-fulls of paint within r of (x, y, z) (the mop). Returns what was taken. */
  drink(x, y, z, r, want) {
    let got = 0;
    const c = Math.ceil(r / CELL), ci = Math.floor((x - this.x0) / CELL), cj = Math.floor((z - this.z0) / CELL);
    for (let dj = -c; dj <= c && got < want; dj++) for (let di = -c; di <= c && got < want; di++) {
      const i = ci + di, j = cj + dj; if (i < 0 || j < 0 || i >= N || j >= N) continue;
      const n = j * N + i; if (this.k[n] <= 0 || this.crude[n] || Math.abs(this.h[n] - y) > NEAR) continue; // (paint: crude is the blots', wipe())
      if (Math.hypot(this.x0 + (i + 0.5) * CELL - x, this.z0 + (j + 0.5) * CELL - z) > r) continue;
      const t = Math.min(this.k[n], want - got); this.k[n] -= t; got += t;
    }
    if (got) this.dirty = true;
    return got;
  }

  /** How many cells within r of (x, z) hold something (crude, or paint), at height y. */
  count(x, y, z, r, crude = true) {
    let n = 0; const c = Math.ceil(r / CELL), ci = Math.floor((x - this.x0) / CELL), cj = Math.floor((z - this.z0) / CELL);
    for (let dj = -c; dj <= c; dj++) for (let di = -c; di <= c; di++) {
      const i = ci + di, j = cj + dj; if (i < 0 || j < 0 || i >= N || j >= N) continue;
      const m = j * N + i; if (this.k[m] <= 0.02 || this.crude[m] !== KIND(crude) || Math.abs(this.h[m] - y) > NEAR) continue;
      if (Math.hypot(this.x0 + (i + 0.5) * CELL - x, this.z0 + (j + 0.5) * CELL - z) <= r) n++;
    }
    return n;
  }

  /** Something wet laid on a surface: centre c, normal n, radius r, drying in `life` real seconds, wet only after `delay`. On a floor it
   *  is cells: the Courier's (`by` 'courier') in the brush's feeling, or a slick with none known; anyone else's a slick. Every coat is
   *  kept as a disc too: a wall's wetness (until walls are charts), and the ecology's wet ground. */
  coat(c, n, r, life, delay = 0, by = 'creature') {
    if (this.spots.length > 400) this.spots.shift();
    this.spots.push({ c: c.clone(), n: n.clone().normalize(), r, life, age: 0, delay });
    if (n.y < 0.5) return;
    const a = by === 'courier' ? this.aspectOf?.() : null;
    if (a) this.stamp(c.x, c.y, c.z, r, a, 0.6); else this.slick(c.x, c.y, c.z, r, 0.8);
  }
  /** A fixed coat that keeps: centre c, normal n, half extents hu along u and hv along n x u. A floor's is laid as crude cells (again
   *  whenever the window moves); a wall's is kept as a rectangle for `wet`. */
  coatRect(c, n, u, hu, hv) {
    const R = { c: c.clone(), n: n.clone().normalize(), u: u.clone().normalize(), hu, hv };
    R.v = new THREE.Vector3().crossVectors(R.n, R.u).normalize();
    if (R.n.y > 0.7) { this.fixed.push(R); this.layFixed(R); } else this.rects.push(R);
    return R;
  }
  layFixed(R) {
    const ext = Math.hypot(R.hu, R.hv), ci = Math.floor((R.c.x - this.x0) / CELL), cj = Math.floor((R.c.z - this.z0) / CELL), c = Math.ceil(ext / CELL);
    for (let dj = -c; dj <= c; dj++) for (let di = -c; di <= c; di++) {
      const i = ci + di, j = cj + dj; if (i < 0 || j < 0 || i >= N || j >= N) continue;
      _d.set(this.x0 + (i + 0.5) * CELL - R.c.x, 0, this.z0 + (j + 0.5) * CELL - R.c.z);
      if (Math.abs(_d.dot(R.u)) > R.hu || Math.abs(_d.dot(R.v)) > R.hv) continue;
      const n = j * N + i; this.k[n] = 1; this.asp[n] = -1; this.crude[n] = 1; this.h[n] = R.c.y; this.live.add(n);
    }
    this.dirty = true;
  }
  /** Wet enough to dive into at p? On a floor (n up, or none): its cells as deep as `wet`. On another surface facing n (dot > 0.7):
   *  a fixed coat or a coat's disc within `depth` of it. Returns the surface's normal, or null. */
  wet(p, n = null, depth = 0.3, wet = 0.3) {
    if (!n || n.y > 0.7) { const c = this.at(p.x, p.y, p.z); return c && c.k >= wet ? UP : null; }
    for (const r of this.rects) {
      if (r.n.dot(n) < 0.7) continue;
      _d.subVectors(p, r.c); const h = _d.dot(r.n);
      if (h < -0.15 || h > depth || Math.abs(_d.dot(r.u)) > r.hu || Math.abs(_d.dot(r.v)) > r.hv) continue;
      return r.n;
    }
    for (const s of this.spots) {
      if (s.age < s.delay || s.n.dot(n) < 0.7) continue;
      _d.subVectors(p, s.c); const h = _d.dot(s.n);
      if (h < -0.15 || h > depth || _d.addScaledVector(s.n, -h).length() > s.r) continue;
      return s.n;
    }
    return null;
  }
  clearCoats() { this.spots.length = 0; }

  /** Something moving through it drags it on (a slide, the Paint Dive, a Brush Slide: world/ground/painttrack.js): within r of (x, z)
   *  at height y, a share of each cell is lifted and laid a step on along the motion, the front cells first so nothing moves twice
   *  (Sunshine's goop under a belly slide, Splatoon's roller). A blot's crude dragged off it thins to a slick. Returns the cells moved. */
  smear(x, y, z, r, vx, vz, dt, share = 0.35) {
    const sp = Math.hypot(vx, vz); if (sp < 0.8) return 0;
    const ux = vx / sp, uz = vz / sp, step = Math.max(CELL, sp * dt), take = Math.min(0.5, share * sp * dt / r);
    const c = Math.ceil(r / CELL), ci = Math.floor((x - this.x0) / CELL), cj = Math.floor((z - this.z0) / CELL), cells = [];
    for (let dj = -c; dj <= c; dj++) for (let di = -c; di <= c; di++) {
      const i = ci + di, j = cj + dj; if (i < 0 || j < 0 || i >= N || j >= N) continue;
      const n = j * N + i; if (this.k[n] < 0.03 || Math.abs(this.h[n] - y) > NEAR) continue;
      const px = this.x0 + (i + 0.5) * CELL - x, pz = this.z0 + (j + 0.5) * CELL - z; if (Math.hypot(px, pz) > r) continue;
      cells.push([n, px * ux + pz * uz, px, pz]);
    }
    cells.sort((p, q) => q[1] - p[1]);
    let moved = 0;
    for (const [n, , px, pz] of cells) {
      const m = this.cell(x + px + ux * step, z + pz + uz * step); if (m < 0 || m === n) continue;
      const t = this.k[n] * take; if (t < 0.005) continue;
      this.k[n] -= t; this.deposit(m, this.asp[n], this.crude[n], t, this.h[n]); moved++;
    }
    if (moved) this.dirty = true;
    return moved;
  }
  /** Lay t of a kind (paint of feeling `asp`, or crude) into cell m: the same thickens; a feeling meets its opposite and cancels; crude
   *  takes paint's cell; paint dragged onto crude is lost in it; another feeling takes the cell only if it brings more. */
  deposit(m, asp, kind, t, y) {
    if (kind === 1) { kind = 2; asp = -1; } // (a blot's crude, dragged off it: a slick)
    const k = this.k[m];
    if (k < 0.05) { this.asp[m] = asp; this.crude[m] = kind; this.k[m] = t; }
    else if (this.crude[m] === kind && this.asp[m] === asp) this.k[m] = Math.min(1, k + t);
    else if (this.crude[m]) { if (kind) this.k[m] = Math.min(1, k + t); } // (onto crude: crude joins it, paint is lost in it)
    else if (kind) { this.asp[m] = -1; this.crude[m] = kind; this.k[m] = Math.max(k, t); } // (crude over paint takes the cell)
    else if (ASPECTS[asp] && OPPOSITE[ASPECTS[asp]] === ASPECTS[this.asp[m]]) { this.k[m] = Math.max(0, k - t); if (this.k[m] < 0.05) { this.k[m] = 0; this.asp[m] = -1; } }
    else if (t > k) { this.asp[m] = asp; this.k[m] = t; }
    if (this.k[m] > 0) { this.h[m] = y; this.wetT[m] = this.clock; this.live.add(m); }
  }

  /** The paint at a point of the ground (within 0.8 m of the height it was laid at), or null. */
  at(x, y, z) {
    const n = this.cell(x, z); if (n < 0 || this.k[n] < 0.08 || Math.abs(this.h[n] - y) > NEAR) return null;
    return { k: this.k[n], aspect: this.asp[n] >= 0 ? ASPECTS[this.asp[n]] : null, crude: !!this.crude[n], slick: this.crude[n] === 2 };
  }

  /** Once a frame: fade the paint, follow the focus (whole cells; what leaves the window is gone), upload when changed. */
  update(dt, fx, fz) {
    const want0 = Math.floor((fx - SPAN / 2) / CELL) * CELL, want1 = Math.floor((fz - SPAN / 2) / CELL) * CELL;
    if (Math.abs(want0 - this.x0) > SPAN / 4 || Math.abs(want1 - this.z0) > SPAN / 4) this.recentre(want0, want1);
    const fade = dt / LIFE; this.clock += dt;
    for (const n of this.live) { if (this.crude[n] === 1 && this.k[n] > 0) continue; this.k[n] -= this.crude[n] === 2 ? dt / SLICK_LIFE : fade; if (this.k[n] <= 0) { this.k[n] = 0; this.asp[n] = -1; this.h[n] = NONE; this.crude[n] = 0; this.live.delete(n); } } // (crude keeps: a blot stays until it is wiped)
    for (let i = this.spots.length - 1; i >= 0; i--) { const s = this.spots[i]; if ((s.age += dt) > s.life) this.spots.splice(i, 1); }
    if (this.live.size) this.dirty = true;
    this.upT -= dt;
    if (this.dirty && this.upT <= 0) { this.upload(); this.upT = 0.1; this.dirty = false; } // (ten uploads a second at most)
  }

  recentre(x0, z0) {
    const di = Math.round((x0 - this.x0) / CELL), dj = Math.round((z0 - this.z0) / CELL);
    const k = new Float32Array(N * N), a = new Int8Array(N * N).fill(-1), h = new Float32Array(N * N).fill(NONE), cr = new Uint8Array(N * N), wt = new Float32Array(N * N), live = new Set();
    for (const n of this.live) {
      const i = (n % N) - di, j = Math.floor(n / N) - dj; if (i < 0 || j < 0 || i >= N || j >= N) continue;
      const m = j * N + i; k[m] = this.k[n]; a[m] = this.asp[n]; h[m] = this.h[n]; cr[m] = this.crude[n]; wt[m] = this.wetT[n]; live.add(m);
    }
    this.k = k; this.asp = a; this.h = h; this.crude = cr; this.wetT = wt; this.live = live; this.x0 = x0; this.z0 = z0;
    for (const R of this.fixed) this.layFixed(R); // (the fixed coats, laid again)
    this.onRecentre?.(); // (what keeps, the blots, is laid again into the new window: stains.js)
    this.uniforms.uPmWin.value.set(x0, z0, SPAN, 1 / N);
    this.dirty = true;
  }

  upload() {
    const C = this.colData, Hh = this.hData, tmp = new THREE.Color();
    for (let n = 0; n < N * N; n++) {
      const p = this.k[n], o = n * 4;
      if (p > 0.02) { if (this.asp[n] < 0) tmp.setHex(FLAT); else tmp.copy(ASPECT_COLOR[ASPECTS[this.asp[n]]]); if (this.crude[n] === 1) tmp.multiplyScalar(this.asp[n] < 0 ? 1 : 0.42); Hh[n * 2] = this.h[n]; Hh[n * 2 + 1] = paintMotifCode(this.asp[n], this.crude[n], p, (this.clock - this.wetT[n]) / PAINT_DRY); C[o + 3] = Math.round(255 * Math.min(1, this.crude[n] === 1 ? Math.max(p, 0.6) : p)); } // (a slick's cells too, now the slicks' meshes are gone: its motif carries its age, the oxidation ramp, vfx/paintmotifs.js) // (crude's look is its motif's, oil-black: vfx/paintmotifs.js)
      else { C[o] = C[o + 1] = C[o + 2] = 0; C[o + 3] = 0; Hh[n * 2] = NONE; Hh[n * 2 + 1] = 0; continue; } // (black under nothing: an edge filters toward the colour, not away from it)
      const a = C[o + 3] / 255; C[o] = Math.round(tmp.r * a * 255); C[o + 1] = Math.round(tmp.g * a * 255); C[o + 2] = Math.round(tmp.b * a * 255); // (premultiplied)
    }
    this.colTex.needsUpdate = true; this.hTex.needsUpdate = true;
  }

  /** Draw the map on a material's up-facing surfaces (chained after any patch it has; one program per material kind). */
  patch(material) {
    if (material.userData.paintmap) return material;
    const U = this.uniforms, prev = material.onBeforeCompile;
    const before = material.customProgramCacheKey !== THREE.Material.prototype.customProgramCacheKey ? material.customProgramCacheKey() : prev.toString();
    material.onBeforeCompile = (sh, r) => {
      prev?.call(material, sh, r);
      Object.assign(sh.uniforms, U);
      sh.vertexShader = 'varying vec3 vPmPos;\nvarying vec3 vPmN;\n' + sh.vertexShader
        .replace('#include <begin_vertex>', '#include <begin_vertex>\n  { mat4 pmM = modelMatrix;\n  #ifdef USE_INSTANCING\n    pmM = pmM * instanceMatrix;\n  #endif\n    vPmPos = (pmM * vec4(transformed, 1.0)).xyz; }')
        .replace('#include <beginnormal_vertex>', '#include <beginnormal_vertex>\n  vPmN = normalize(mat3(modelMatrix) * objectNormal);');
      sh.fragmentShader = `varying vec3 vPmPos;
varying vec3 vPmN;
uniform sampler2D uPmCol; uniform sampler2D uPmH; uniform vec4 uPmWin;
${PAINT_LOOK_HEAD}
` + sh.fragmentShader.replace('#include <alphamap_fragment>', `${PAINT_LOOK_BODY}
  #include <alphamap_fragment>`).replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n  totalEmissiveRadiance += pmGlow;')
        .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>${PAINT_LOOK_ROUGH}`)
        .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>${PAINT_LOOK_NORMAL}`); // (the look, the motifs and the gloss: Calissa's, vfx/paintmotifs.js)
    };
    material.customProgramCacheKey = () => `pm|${before}`;
    material.userData.paintmap = true; material.needsUpdate = true;
    return material;
  }
}
