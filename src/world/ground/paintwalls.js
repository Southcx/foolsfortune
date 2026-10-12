// ---------------------------------------------------------------------------------------
// THE PAINT MAP'S WALLS: every side face of a `level.box` laid out once, at the level's build, as a chart: its own rectangle of 0.25 m
// cells in one atlas (docs/plans/PAINT.md phase 2, the owner, 2026-10-12: "build it future-proof", every surface paintable in stages).
// A chart knows its face (an origin, its two edges, its normal); the face's vertices carry where its chart lies in the atlas (`pmChart`,
// offset by 2 so a mesh without it reads none), so the wall's shader reads its own cells (world/ground/paintmap.js patch). Kept on the
// CPU like the floor's window, asked and written by world position: a stamp is a sphere, and every chart facing it within its reach takes
// its share. Paint fades, a slick fades, crude keeps, as on the floor.
//
// Prior art: lightmap atlases (every static face given its own rectangle of a shared texture: Quake's surface cache, Unity's UV2 unwrap),
// Splatoon's ink laid in a per-level texture over a second UV set, and a shelf packer (rows of rectangles: Jukka Jylänki's survey).
//
//   const W = new PaintWalls()   W.chartBox(nonIndexedBoxGeometry) (adds its pmChart attribute)   W.pack() (once, before the merge)   W.stamp(p, n, r, aspectIndex, k, kind)
//   W.wipe(p, n, r, want, kind) -> got   W.at(p, n, depth) -> { k, asp, kind, normal } | null   W.fixedRect(R) -> laid any?
//   W.update(dt)   W.colTex / W.hTex (the shader's)   W.charts   W.full (charts that did not fit)   W.touched (cells the last stamp or wipe reached)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { OPPOSITE, ASPECTS, COLOR } from '../../progress/weather.js';
import { paintMotifCode } from '../../vfx/paintmotifs.js';

/** A: the atlas's side in cells (1024: 65,536 m² of wall at 0.25 m); CELL: a cell's side (m), the floor's; BIG: a face over this (m²) is
 *  charted at twice the cell (the build's walls measured 2026-10-12: 1,788 faces, 102,869 m², 222 of them over 50 m² holding 86% of it); LIFE, SLICK_LIFE: real seconds
 *  paint and a slick last; UP_HZ: uploads a second at most; HASH: the spatial hash's cell (m). */
export const PAINT_WALLS = { A: 1024, CELL: 0.25, BIG: 50, LIFE: 150, SLICK_LIFE: 40, UP_HZ: 4, HASH: 4 };
const { A, CELL } = PAINT_WALLS, FLAT = 0x3b2b22;
const COLORS = ASPECTS.map((a) => new THREE.Color(COLOR[a]));
const _r = new THREE.Vector3(), _c = new THREE.Color();

export class PaintWalls {
  constructor() {
    this.k = new Float32Array(A * A); this.asp = new Int8Array(A * A).fill(-1); this.kind = new Uint8Array(A * A); // (0 paint, 1 crude that keeps, 2 a slick)
    this.charts = []; this.hash = new Map(); this.live = new Set(); this.full = 0; this.demand = 0; this.pending = []; // (the wall area asked for, m²; the faces not yet packed)
    this.px = 0; this.py = 0; this.row = 0; // (the shelf packer: the cursor and the row's height)
    this.colData = new Uint8Array(A * A * 4); this.hData = new Float32Array(A * A);
    this.colTex = new THREE.DataTexture(this.colData, A, A, THREE.RGBAFormat); this.colTex.magFilter = this.colTex.minFilter = THREE.LinearFilter;
    this.hTex = new THREE.DataTexture(this.hData, A, A, THREE.RedFormat, THREE.FloatType); this.hTex.magFilter = this.hTex.minFilter = THREE.NearestFilter;
    this.colTex.needsUpdate = this.hTex.needsUpdate = true;
    this.dirty = false; this.upT = 0;
  }

  /** Chart a box's side faces (a non-indexed BoxGeometry, already placed in the world): each is recorded, and the geometry given its
   *  `pmChart` attribute (0 on the top and bottom, which the floor's window paints), filled in by `pack()` once every face is known. A
   *  face over BIG m² is charted at twice the cell (0.5 m): the halls' shells and the cliffs, seen from afar. */
  chartBox(g) {
    const P = g.getAttribute('position'), N = g.getAttribute('normal'), U = g.getAttribute('uv'), n = P.count;
    const out = new Float32Array(n * 2);
    for (let f = 0; f < n / 6; f++) {
      const v0 = f * 6; if (Math.abs(N.getY(v0)) > 0.3) continue;
      let o = -1, a = -1, b = -1;
      for (let v = v0; v < v0 + 6; v++) { const u = U.getX(v), w = U.getY(v); if (u < 0.5 && w < 0.5) o = v; else if (u > 0.5 && w < 0.5) a = v; else if (u < 0.5 && w > 0.5) b = v; }
      if (o < 0 || a < 0 || b < 0) continue;
      const O = new THREE.Vector3().fromBufferAttribute(P, o), eu = new THREE.Vector3().fromBufferAttribute(P, a).sub(O), ev = new THREE.Vector3().fromBufferAttribute(P, b).sub(O);
      const lu = eu.length(), lv = ev.length(); if (lu < 0.3 || lv < 0.3) continue;
      this.demand += lu * lv;
      const cell = lu * lv > PAINT_WALLS.BIG ? CELL * 2 : CELL;
      const ch = { O, U: eu.divideScalar(lu), V: ev.divideScalar(lv), lu, lv, nu: Math.ceil(lu / cell), nv: Math.ceil(lv / cell), ax: -1, ay: -1, n: new THREE.Vector3().fromBufferAttribute(N, v0), verts: [] };
      for (let v = v0; v < v0 + 6; v++) ch.verts.push(v, U.getX(v), U.getY(v));
      ch.out = out; this.pending.push(ch);
    }
    g.setAttribute('pmChart', new THREE.BufferAttribute(out, 2));
  }

  /** Every face recorded, the tallest first on the shelves (a sorted shelf packs far tighter than faces in build order); each placed
   *  face's vertices told where it lies. What does not fit stays unpainted (`full`). Called once, before the level's static merge. */
  pack() {
    this.pending.sort((p, q) => q.nv - p.nv || q.nu - p.nu);
    for (const ch of this.pending) {
      const at = this.place(ch.nu, ch.nv); if (!at) { this.full++; continue; }
      ch.ax = at[0]; ch.ay = at[1];
      for (let k = 0; k < ch.verts.length; k += 3) { const v = ch.verts[k]; ch.out[v * 2] = 2 + (ch.ax + ch.verts[k + 1] * ch.nu) / A; ch.out[v * 2 + 1] = 2 + (ch.ay + ch.verts[k + 2] * ch.nv) / A; }
      delete ch.verts; delete ch.out;
      this.charts.push(ch); this.index(ch);
    }
    this.pending = [];
    for (const R of this.queued || []) this.fixedRect(R);
    this.queued = null;
  }

  /** A rectangle of nu x nv cells and a gutter of one, on the shelves; null when the atlas is full. */
  place(nu, nv) {
    if (nu + 1 > A || nv + 1 > A) return null;
    if (this.px + nu + 1 > A) { this.px = 0; this.py += this.row; this.row = 0; }
    if (this.py + nv + 1 > A) return null;
    const at = [this.px, this.py]; this.px += nu + 1; this.row = Math.max(this.row, nv + 1);
    return at;
  }

  index(ch) {
    const H = PAINT_WALLS.HASH, xs = [ch.O.x, ch.O.x + ch.U.x * ch.lu, ch.O.x + ch.V.x * ch.lv, ch.O.x + ch.U.x * ch.lu + ch.V.x * ch.lv], zs = [ch.O.z, ch.O.z + ch.U.z * ch.lu, ch.O.z + ch.V.z * ch.lv, ch.O.z + ch.U.z * ch.lu + ch.V.z * ch.lv];
    for (let i = Math.floor(Math.min(...xs) / H); i <= Math.floor(Math.max(...xs) / H); i++) for (let j = Math.floor(Math.min(...zs) / H); j <= Math.floor(Math.max(...zs) / H); j++) {
      const key = i * 100003 + j; if (!this.hash.has(key)) this.hash.set(key, []); this.hash.get(key).push(ch);
    }
  }
  near(p, r) {
    const H = PAINT_WALLS.HASH, seen = new Set();
    for (let i = Math.floor((p.x - r) / H); i <= Math.floor((p.x + r) / H); i++) for (let j = Math.floor((p.z - r) / H); j <= Math.floor((p.z + r) / H); j++) for (const ch of this.hash.get(i * 100003 + j) || []) seen.add(ch);
    return seen;
  }

  /** Every cell of every chart facing n (or any, n null) within r of p: fn(cell, distance in the plane) for each. */
  each(p, n, r, fn) {
    this.touched = 0; // (how many cells the last stamp or wipe reached: none, no chart there)
    for (const ch of this.near(p, r)) {
      if (n && ch.n.dot(n) < 0.7) continue;
      _r.subVectors(p, ch.O); const d = _r.dot(ch.n); if (Math.abs(d) > r) continue;
      const rr = Math.sqrt(r * r - d * d), u = _r.dot(ch.U), v = _r.dot(ch.V);
      const su = ch.nu / ch.lu, sv = ch.nv / ch.lv;
      for (let j = Math.max(0, Math.floor((v - rr) * sv)); j <= Math.min(ch.nv - 1, Math.floor((v + rr) * sv)); j++) for (let i = Math.max(0, Math.floor((u - rr) * su)); i <= Math.min(ch.nu - 1, Math.floor((u + rr) * su)); i++) {
        const dd = Math.hypot((i + 0.5) / su - u, (j + 0.5) / sv - v); if (dd > rr) continue;
        this.touched++; fn((ch.ay + j) * A + ch.ax + i, dd / Math.max(rr, 1e-3), ch);
      }
    }
  }

  /** Lay k of a feeling (aspect index; -1 with kind 1 or 2: crude) in a sphere of radius r at p on the walls facing n. The floor's
   *  rules: the same thickens, its opposite cancels, crude takes paint's cell and paint does not cover crude. Returns the area covered. */
  stamp(p, n, r, a, k = 1, kind = 0) {
    let fresh = 0; const opp = a >= 0 ? ASPECTS.indexOf(OPPOSITE[ASPECTS[a]]) : -2;
    this.each(p, n, r, (m, t) => {
      const add = kind ? k : k * (1 - 0.5 * t * t);
      if (this.k[m] < 0.05) fresh += CELL * CELL;
      if (this.kind[m] && !kind && this.k[m] > 0.05) return;
      if (!kind && !this.kind[m] && this.k[m] >= 0.05 && this.asp[m] === opp) { this.k[m] = Math.max(0, this.k[m] - add); if (this.k[m] < 0.05) { this.k[m] = 0; this.asp[m] = -1; } }
      else if (this.asp[m] === a && this.kind[m] === kind) this.k[m] = Math.min(1, this.k[m] + add);
      else { this.asp[m] = a; this.kind[m] = kind; this.k[m] = Math.min(1, Math.max(add, kind ? this.k[m] : 0)); }
      this.live.add(m);
    });
    this.dirty = true;
    return fresh;
  }

  /** Wash or mop up to `want` cell-fulls of a kind (0 paint, 2 a slick; null either) in a sphere at p. Returns what was taken. */
  wipe(p, n, r, want, kind = null) {
    let got = 0;
    this.each(p, n, r, (m, d) => {
      if (got >= want || this.k[m] <= 0 || this.kind[m] === 1 || (kind != null && this.kind[m] !== kind)) return;
      const t = Math.min(this.k[m] * (1 - 0.8 * d * d), want - got); // (more at the middle: a soft edge) this.k[m] -= t; got += t; if (this.k[m] <= 0.02) { this.k[m] = 0; this.asp[m] = -1; this.kind[m] = 0; }
    });
    if (got) this.dirty = true;
    return got;
  }

  /** What lies on the wall facing n nearest p, within `depth` of its face: { k, asp, kind, normal }, or null. */
  at(p, n, depth = 0.3) {
    for (const ch of this.near(p, 0.5)) {
      if (n && ch.n.dot(n) < 0.7) continue;
      _r.subVectors(p, ch.O); const d = _r.dot(ch.n); if (d < -0.15 || d > depth) continue;
      const i = Math.floor(_r.dot(ch.U) * ch.nu / ch.lu), j = Math.floor(_r.dot(ch.V) * ch.nv / ch.lv);
      if (i < 0 || j < 0 || i >= ch.nu || j >= ch.nv) continue;
      const m = (ch.ay + j) * A + ch.ax + i; if (this.k[m] < 0.08) continue;
      return { k: this.k[m], asp: this.asp[m], kind: this.kind[m], normal: ch.n };
    }
    return null;
  }

  /** A fixed coat on a wall (R: { c, n, u, v, hu, hv }): crude cells that keep, on the charts it lies on. Returns whether any were laid. */
  fixedRect(R) {
    if (this.pending.length) { (this.queued ||= []).push(R); return true; } // (during the build: laid once the charts are packed)
    let any = false;
    for (const ch of this.near(R.c, Math.hypot(R.hu, R.hv))) {
      if (ch.n.dot(R.n) < 0.7) continue;
      _r.subVectors(R.c, ch.O); if (Math.abs(_r.dot(ch.n)) > 0.15) continue;
      for (let j = 0; j < ch.nv; j++) for (let i = 0; i < ch.nu; i++) {
        const w = ch.O.clone().addScaledVector(ch.U, (i + 0.5) * ch.lu / ch.nu).addScaledVector(ch.V, (j + 0.5) * ch.lv / ch.nv).sub(R.c);
        if (Math.abs(w.dot(R.u)) > R.hu || Math.abs(w.dot(R.v)) > R.hv) continue;
        const m = (ch.ay + j) * A + ch.ax + i; this.k[m] = 1; this.asp[m] = -1; this.kind[m] = 1; this.live.add(m); any = true;
      }
    }
    if (any) this.dirty = true;
    return any;
  }

  /** Once a frame: fade what fades, and upload what changed, UP_HZ times a second at most. */
  update(dt) {
    this.upT -= dt;
    if (this.upT > 0) return;
    const step = 1 / PAINT_WALLS.UP_HZ - this.upT; this.upT = 1 / PAINT_WALLS.UP_HZ;
    for (const m of this.live) {
      if (this.kind[m] !== 1) this.k[m] -= step / (this.kind[m] === 2 ? PAINT_WALLS.SLICK_LIFE : PAINT_WALLS.LIFE);
      if (this.k[m] <= 0.02) { this.k[m] = 0; this.asp[m] = -1; this.kind[m] = 0; this.live.delete(m); this.dirty = true; }
      else if (this.kind[m] !== 1) this.dirty = true;
    }
    if (!this.dirty) return;
    this.dirty = false;
    const C = this.colData, Hh = this.hData;
    for (const m of this.wrote || []) { const o = m * 4; C[o] = C[o + 1] = C[o + 2] = C[o + 3] = 0; Hh[m] = 0; } // (cells that emptied since)
    for (const m of this.live) {
      const p = this.k[m], o = m * 4, kd = this.kind[m];
      if (this.asp[m] < 0) _c.setHex(FLAT); else _c.copy(COLORS[this.asp[m]]);
      const al = Math.min(1, kd === 1 ? Math.max(p, 0.6) : p);
      C[o] = Math.round(_c.r * al * 255); C[o + 1] = Math.round(_c.g * al * 255); C[o + 2] = Math.round(_c.b * al * 255); C[o + 3] = Math.round(al * 255);
      Hh[m] = paintMotifCode(this.asp[m], kd, p);
    }
    this.wrote = [...this.live];
    this.colTex.needsUpdate = this.hTex.needsUpdate = true;
  }
}
