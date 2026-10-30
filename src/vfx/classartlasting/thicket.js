// ---------------------------------------------------------------------------------------
// OVERGROWTH'S THICKET: the Empress's thicket (Petra's runtime, courier/classarts/lasting.js `thicket`: its `at` and `r`, its edge held
// against what is outside it, everything in it slowed) grown as a ring of briars and flowering vines round `at` at `r`: the garden's
// own bramble (vfx/garden/thornlook.js thornClumps: arching hooked canes in olive and rust) set clump by clump round the ring, with
// blossoms of wild rose opened along it. The ring is cut in arcs, each its own body, growing up out of the ground one after another,
// swaying a little each on its own beat, and sinking back when it is done. A creature caught inside it (slowed: the runtime's status)
// wears a tuft of young canes round its feet while it stands in it. Petals and leaves drifting over it are the library's `art.bloom.hold`.
//
// Prior art: Sleeping Beauty's briar wall (the thicket grown round a place at once), the Empress's garden of the Rider-Waite deck, the
// house's bramble (the garden's thorn patches: GARDEN-COZY.md A4), Ori's thornfen, the snare vines of Zelda's Deku and Diablo's druid.
//
//   const T = new Thicket(game, at, r, ctx)   T.update(dt, on, shown) -> false once it has sunk   T.dispose()
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { thornClumps } from '../garden/thornlook.js';
import { stoneMat, painted, rng, groundY, envelope } from './kit.js';

/** The thicket's numbers: its arcs, the clumps an arc, the spread about the ring (m), the blossoms an arc, how long it takes to grow
 *  and sink (real s), the sway (rad), and the most creatures it snares at once. */
export const THICKET = { arcs: 8, clumps: 4, spread: 0.45, blossoms: 9, grow: 0.7, sink: 0.55, sway: 0.045, snares: 6 };
const BLOOM = [0xf3c4cf, 0xfff3ea, 0xe8a8c0, 0xd8c8ff, 0xf6d6e2]; // (wild rose: blush, white, a deeper pink, and the film's lilac: the Empress is wild)

let CLUMPS = null;
/** The bramble's three clumps, with only what the stone material reads (position, normal, colour). */
function clumps() {
  if (CLUMPS) return CLUMPS;
  CLUMPS = thornClumps().map((g) => { for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'color'].includes(k)) g.deleteAttribute(k); return g; });
  return CLUMPS;
}
/** A wild rose: five petals round a gold heart, a little cupped, its face up (m). */
function blossom(r, hex) {
  const parts = [], pet = new THREE.Color().setHex(hex), heart = new THREE.Color().setHex(0xf0c040);
  for (let i = 0; i < 5; i++) {
    const g = new THREE.CircleGeometry(0.035, 6); g.scale(1, 1.25, 1); g.translate(0, 0.036, 0); g.rotateX(-1.15); g.rotateY((i / 5) * Math.PI * 2 + r() * 0.2);
    parts.push(painted(g, () => pet));
  }
  const c = new THREE.IcosahedronGeometry(0.014, 0); c.translate(0, 0.012, 0); parts.push(painted(c, () => heart));
  return mergeGeometries(parts);
}

const ARCS = new Map();
/** One arc of the ring as built for a radius (shared by every arc of it: each is turned and some mirrored, so no two read the same):
 *  its clumps along the arc and the blossoms along them, in the arc's own space (its middle on +Z at the ring, its foot at 0). */
function arcGeometry(r) {
  const key = r.toFixed(2); if (ARCS.has(key)) return ARCS.get(key);
  const C = clumps(), rnd = rng(31 + Math.round(r * 10)), span = (Math.PI * 2) / THICKET.arcs, parts = [];
  for (let i = 0; i < THICKET.clumps; i++) {
    const a = (i / THICKET.clumps - 0.5 + 0.5 / THICKET.clumps) * span + (rnd() - 0.5) * span * 0.1, rr = r + (rnd() - 0.5) * THICKET.spread * 2;
    const g = C[i % 2 ? 1 + (rnd() < 0.4 ? 1 : 0) : 0].clone(), s = 0.85 + rnd() * 0.45;
    g.scale(s, s * (0.9 + rnd() * 0.35), s); g.rotateY(rnd() * Math.PI * 2); g.translate(Math.sin(a) * rr, 0, Math.cos(a) * rr - r);
    parts.push(g);
  }
  for (let i = 0; i < THICKET.blossoms; i++) {
    const a = (rnd() - 0.5) * span * 0.95, rr = r + (rnd() - 0.5) * THICKET.spread * 1.6, y = 0.35 + rnd() * 0.75, b = blossom(rnd, BLOOM[i % BLOOM.length]);
    b.rotateX((rnd() - 0.5) * 0.9); b.rotateZ((rnd() - 0.5) * 0.9); b.translate(Math.sin(a) * rr, y, Math.cos(a) * rr - r);
    parts.push(b);
  }
  const geo = mergeGeometries(parts); for (const p of parts) p.dispose();
  ARCS.set(key, geo); return geo;
}
let TUFT = null;
/** A creature's snare: three young canes round its feet, small (its own size set by the creature's). */
function tuftGeometry() {
  if (TUFT) return TUFT;
  const C = clumps()[0], parts = [];
  for (let i = 0; i < 3; i++) { const g = C.clone(); g.scale(0.42, 0.5, 0.42); g.rotateY(i * 2.1); g.translate(Math.sin(i * 2.1) * 0.55, 0, Math.cos(i * 2.1) * 0.55); parts.push(g); }
  TUFT = mergeGeometries(parts); for (const p of parts) p.dispose();
  return TUFT;
}

export class Thicket {
  constructor(game, at, r, ctx = {}) {
    this.game = game; this.at = at.clone(); this.r = r; this.ctx = ctx; this.k = 0; this.t = 0; this.grownT = 0; this.sinkT = -1;
    this.group = new THREE.Group(); this.group.name = 'classart-thicket'; this.group.position.copy(this.at); this.arcs = []; // (its parts in its own space round `at`)
    const geo = arcGeometry(r), rnd = rng((Math.random() * 1e6) | 0);
    for (let i = 0; i < THICKET.arcs; i++) {
      const yaw = (i / THICKET.arcs) * Math.PI * 2 + (rnd() - 0.5) * 0.05, x = this.at.x + Math.sin(yaw) * r, z = this.at.z + Math.cos(yaw) * r;
      const holder = new THREE.Group(); holder.position.set(x - this.at.x, groundY(game, x, z, this.at.y) - this.at.y, z - this.at.z); holder.rotation.y = yaw;
      const m = new THREE.Mesh(geo, stoneMat()); m.castShadow = true; m.receiveShadow = true; m.scale.set(i % 3 === 1 ? -1 : 1, 0.02, 1); // (some arcs mirrored: one geometry, no two alike)
      holder.add(m); this.group.add(holder);
      this.arcs.push({ m, delay: rnd() * 0.35, ph: rnd() * 6.28, rate: 0.8 + rnd() * 0.5 });
    }
    this.snares = new Map();
    game.scene.add(this.group);
  }
  update(dt, on, shown) {
    this.t += dt; this.k = envelope(this.k, on, dt, 0.2, THICKET.sink);
    if (on) this.grownT += dt; else if (this.sinkT < 0) this.sinkT = 0; else this.sinkT += dt;
    for (const A of this.arcs) {
      const up = Math.min(1, Math.max(0, (this.grownT - A.delay) / THICKET.grow)), down = this.sinkT < 0 ? 0 : Math.min(1, Math.max(0, (this.sinkT - A.delay * 0.4) / THICKET.sink));
      const s = Math.max(0.02, easeBack(up) * (1 - down * down));
      A.m.scale.y = s; A.m.position.y = -0.25 * down;
      A.m.rotation.set(THICKET.sway * Math.sin(this.t * A.rate + A.ph), 0, THICKET.sway * 0.6 * Math.sin(this.t * A.rate * 0.7 + A.ph * 1.3));
    }
    this.group.visible = shown;
    this.snare(dt, on && shown);
    if (!on && this.sinkT > THICKET.sink + 0.4 && this.snares.size === 0) { this.dispose(); return false; }
    return true;
  }
  /** The tufts at the feet of the creatures standing in it (grown on them, and let go as they leave or it sinks). */
  snare(dt, live) {
    const g = this.game, A = this.at, inside = new Set();
    if (live) for (const c of g.creatures?.near?.(A, this.r) || []) if (c.alive && !c.ally && Math.hypot(c.pos.x - A.x, c.pos.z - A.z) < this.r - 0.3 && inside.size < THICKET.snares) inside.add(c);
    for (const c of inside) if (!this.snares.has(c)) {
      const m = new THREE.Mesh(tuftGeometry(), stoneMat()); m.scale.setScalar(0.01); this.group.add(m);
      this.snares.set(c, { m, k: 0, s: Math.max(0.6, (c.radius ?? 0.5) * 1.6) });
    }
    for (const [c, S] of this.snares) {
      S.k = envelope(S.k, inside.has(c), dt, 0.3, 0.3);
      S.m.position.set(c.pos.x - A.x, c.pos.y - A.y, c.pos.z - A.z); S.m.rotation.y += dt * 0.15;
      S.m.scale.set(S.s, Math.max(0.01, S.s * easeBack(S.k)), S.s);
      if (S.k <= 0 && !inside.has(c)) { S.m.parent?.remove(S.m); this.snares.delete(c); }
    }
  }
  dispose() { if (this.dead) return; this.dead = true; this.group.parent?.remove(this.group); } // (its geometries are every thicket's, kept, and its material the kit's)
}
/** Grown with a little overshoot, as a plant springs up (Penner's back ease, gently). */
function easeBack(u) { const s = 0.9; u = Math.min(1, Math.max(0, u)); return 1 + (s + 1) * Math.pow(u - 1, 3) + s * Math.pow(u - 1, 2); }
