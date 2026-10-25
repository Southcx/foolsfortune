// ---------------------------------------------------------------------------------------
// THE BAZAAR HALL'S DRESS (docs/plans/CASINO.md section 9; Dovina's handoff of 2026-10-15, item 1; the owner: "Gold Saucer all the way"):
// Raku's bazaar (world/bazaar/bazaar.js) dressed as a carnival under a dome, on clay, in the game's one look (glazed stone, kiln glazes
// and gold, Lachryma's oil film for the neon).
//   - THE DOME: a big top of the Emocean's violet in sixteen gores, warm at the horizon where the carnival's light reaches it, gold
//     constellations (twelve, a nod to Astroll: Zodiac) and a dust of pale stars over it, a gold rosette at the crown; it turns slowly.
//   - THE FLOOR: a mosaic of kiln-glaze tiles laid in rings (oxblood and shino rays, a celadon and ru field, tenmoku and iron-amber rays
//     out to a lapis and gold border), the gold inlay ring where Dovina's stands, and a wheel of fortune at the middle: a sun hub, eight
//     wedges carrying die pips.
//   - THE STALLS: twelve booths round the wall, each a glazed counter, striped awnings with a scalloped valance, a clay sign with a gold
//     frame and a neon glyph of a Tarot suit (cups, wands, swords, pentacles: glyphs, never words), and a string of paper lanterns.
//   - THE NEON: four bands of tube signage round the wall's top (lines, zigzags, scallops, diamonds), each walking the oil film's colours
//     (featTint, vfx/oxidation.js), a quarter of the loop apart; the stalls' glyphs ride the band of their suit.
//   - THE LANTERNS: twelve strings of paper lanterns from the wall's top to a gold ring hung under the crown, a big lantern under it.
//   - RAKU'S CAGE: a gilded booth over Dovina's counter (gold posts and bars, onion domes, a gold cube over it).
//   - THE GATE: a carnival gate over Dovina's arch (striped pillars, gold capitals, a sunburst crest with marquee bulbs, a curtain closing
//     the wall's gap behind it).
//   - THE PROPS: a wheel of fortune spinning on the north wall over the Treasury's slot, a clay carousel of jars, a giant d20 on a plinth.
//   - THE PLINTHS of the three tables wear the hall's glaze (a sleeve and gold bands); their tops are not this module's.
// Dovina's dome and neon tori are taken out of the scene (these replace them); her six lamps are retinted to the lanterns' warmth, still
// the light budget's (render/lightbudget.js). The Treasury's slot (BAZAAR.treasury: 34 m by 8 m) is left clear.
// Every material is one already built: the kit's vertex-coloured flat standard (vfx/racewaypark.js's parameters) and the vertex-coloured
// double-sided basic (vfx/rope.js's, the chest model's). No program added. Draw calls: the mosaic 1, the structures 1 and its outline 1,
// the glow (lanterns, bulbs) 1, the dome 1, the neon 4, the wheel 1, the carousel 1 = 11, in place of Dovina's dome and four tori (5):
// +6 net, only in the bazaar's zone.
//
// Prior art: Final Fantasy VII's Gold Saucer (a casino and carnival under a dome: neon, lanterns, the big top, the wheel); the circus big
// top's striped gores and bunting run to the king pole; Coney Island's and Tivoli's marquee bulbs and sunburst gates; Byzantine and
// Roman opus tessellatum (tesserae laid in rings round a medallion); the Rider-Waite-Smith deck's four suits as stall signs; the
// carousel (Bayol's and Savage's gallopers, here clay jars); Kirby Air Ride's and Mario Party's wheels of fortune; the house's own kit
// (vfx/racewaypark.js's builder of coloured triangles, its lajvardina blue and gold).
//
// AREAS (stage 2, render/areas.js): `build(game)` lays the hall (its meshes, outline and colliders) and `teardown(game)` takes it all
// down, the materials kept (their programs stay compiled, so coming back compiles nothing); both are safe to call twice. Built from the
// constructor until the bazaar's own area builds it (Dovina's: her room's build and teardown call these).
//
//   game.bazaarHall = new BazaarHall(game)   (main.js, after game.bazaar)   .update(dt)   .build(game)   .teardown(game)   .built
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { BAZAAR } from '../world/bazaar/bazaar.js';
import { TABLES } from '../world/bazaar/session.js';
import { featTint, SCHILLER } from './oxidation.js';
import { addOutline, OUTLINES } from '../render/outline.js';
import { zoneOf } from '../render/zonemap.js';
import { RAPIER, GROUPS } from '../core/physics.js';

/** The numbers: the kiln glazes; the dome (radius, gores, the warm horizon, the zenith); the floor (the tiles' size, their grout); the
 *  stalls' angles off the gate (radians, both sides); the neon bands (radius, height); the lantern strings; the props' places (local m). */
export const BAZAAR_HALL = {
  glaze: { oxblood: 0x8e2a2a, shino: 0xe6d2b0, celadon: 0x8fb39a, ru: 0x8fa6c4, tenmoku: 0x5b2f1f, amber: 0xb8732e, lapis: 0x2c3f8f,
    gold: 0xffd696, goldDeep: 0xd9a441, rose: 0xd77a8a, clay: 0xc07a48, grout: 0x2a1a18, ink: 0x1a0f1a },
  dome: { r: 60, gores: 16, horizon: 0x6a2f62, low: 0x3a1a52, zenith: 0x0e0820, star: 0xffd696, line: 0xb8903e },
  floor: { tile: 1.25, gap: 0.05, edge: 57.3, y: 0.03 },
  stalls: [0.62, 1.02, 1.42, 1.82, 2.22, 2.62], stallR: 57.2,
  neon: { r: 56.5, y: [13.4, 12.6, 11.8, 11.0], tube: 0.06, bright: 1.6 },
  strings: { n: 12, lanterns: 15, ring: { r: 3, y: 30 }, sag: 3.5 },
  lantern: [0xff5a3c, 0xffb347, 0xffe9b0, 0xff6fa8],
  wheel: { y: 9.5, z: -56.0, r: 5 }, carousel: { x: -32, z: 28, r: 5 }, d20: { x: 32, z: 28 },
  lamps: [0xffb060, 0xff7a6a, 0xffd27a, 0xff8fb0, 0xffb060, 0xffd27a],
};
const H = BAZAAR_HALL, G = H.glaze, TAU = Math.PI * 2, UP = new THREE.Vector3(0, 1, 0), ZAX = new THREE.Vector3(0, 0, 1);
const _c = new THREE.Color(), _e1 = new THREE.Vector3(), _e2 = new THREE.Vector3(), _m = new THREE.Vector3(), _q = new THREE.Quaternion();
const hash = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const shade = (hex, f) => new THREE.Color(hex).multiplyScalar(f);
/** A placing matrix: at (x, y, z), turned by Euler (rx, ry, rz). */
const at = (x, y, z, rx = 0, ry = 0, rz = 0) => new THREE.Matrix4().compose(V(x, y, z), _q.setFromEuler(new THREE.Euler(rx, ry, rz)), V(1, 1, 1));

/** A builder of non-indexed triangles with a colour a vertex (vfx/racewaypark.js's, with faces turned to a side and shapes placed). */
class Tris {
  constructor() { this.pos = []; this.col = []; }
  tri(a, b, c, ca, cb = ca, cc = ca) { a.toArray(this.pos, this.pos.length); b.toArray(this.pos, this.pos.length); c.toArray(this.pos, this.pos.length); for (const k of [ca, cb, cc]) _c.set(k).toArray(this.col, this.col.length); }
  quad(a, b, c, d, col) { this.tri(a, b, c, col); this.tri(a, c, d, col); }
  /** A quad whose front faces `n`. */
  face(a, b, c, d, col, n) { _e1.subVectors(b, a).cross(_e2.subVectors(c, a)); if (_e1.dot(n) < 0) { this.tri(a, d, c, col); this.tri(a, c, b, col); } else this.quad(a, b, c, d, col); }
  /** A thin sheet seen from both sides (an awning, a ray, a curtain). */
  both(a, b, c, d, col) { this.quad(a, b, c, d, col); this.tri(a, d, c, col); this.tri(a, c, b, col); }
  /** A geometry shaped elsewhere, placed by `m`, its colour a value or fn(centroid in its own space, triangle index). */
  add(geo, col, m) {
    const g = geo.index ? geo.toNonIndexed() : geo, p = g.attributes.position, fn = typeof col === 'function';
    for (let i = 0; i < p.count; i += 3) {
      let c = col;
      if (fn) { _m.set(0, 0, 0); for (let k = 0; k < 3; k++) { _m.x += p.getX(i + k) / 3; _m.y += p.getY(i + k) / 3; _m.z += p.getZ(i + k) / 3; } c = col(_m, i / 3); }
      for (let k = 0; k < 3; k++) _c.set(c).toArray(this.col, this.col.length);
    }
    if (m) g.applyMatrix4(m);
    for (let i = 0; i < p.count; i++) this.pos.push(p.getX(i), p.getY(i), p.getZ(i));
    if (g !== geo) g.dispose(); geo.dispose();
  }
  box(m, size, col) { this.add(new THREE.BoxGeometry(size[0], size[1], size[2]), col, m); }
  /** A square rod from a to b (a tube, a string, a bar). */
  rod(a, b, r, col) {
    const d = _e1.subVectors(b, a), len = d.length(); if (len < 1e-4) return;
    const m = new THREE.Matrix4().compose(_m.addVectors(a, b).multiplyScalar(0.5), _q.setFromUnitVectors(ZAX, d.normalize()), V(1, 1, 1));
    this.add(new THREE.BoxGeometry(2 * r, 2 * r, len + r), col, m);
  }
  line(pts, r, col, closed = false) { for (let i = 0; i < pts.length - (closed ? 0 : 1); i++) this.rod(pts[i], pts[(i + 1) % pts.length], r, col); }
  /** A flat disc (or ring, r0 > 0) facing up at height y. */
  disc(cx, cz, r0, r1, y, col, segs = 24, a0 = 0, a1 = TAU) {
    for (let i = 0; i < segs; i++) {
      const p = a0 + (a1 - a0) * i / segs, q = a0 + (a1 - a0) * (i + 1) / segs, o = (r, a) => V(cx + Math.cos(a) * r, y, cz + Math.sin(a) * r);
      if (r0 <= 0) { const A = V(cx, y, cz), B = o(r1, p), C = o(r1, q); _e1.subVectors(B, A).cross(_e2.subVectors(C, A)); if (_e1.y < 0) this.tri(A, C, B, col); else this.tri(A, B, C, col); }
      else this.face(o(r0, p), o(r1, p), o(r1, q), o(r0, q), col, UP);
    }
  }
  geometry() { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(this.col, 3)); g.computeVertexNormals(); g.computeBoundingSphere(); return g; }
}

/** A paper lantern (a lathe of six sides, dark caps), its body `col`, `h` tall. */
function lantern(T, p, h, col) {
  const w = h * 0.42, pts = [[0.3, -0.5], [0.85, -0.3], [1, 0], [0.85, 0.3], [0.3, 0.5]].map(([x, y]) => new THREE.Vector2(x * w, y * h));
  const bright = shade(col, 1.4), cap = G.ink;
  T.add(new THREE.LatheGeometry(pts, 6), (c) => (Math.abs(c.y) > 0.4 * h ? cap : bright), at(p.x, p.y, p.z));
}
/** Points along a hanging string from a to b, `sag` m down at its middle. */
const hang = (a, b, sag, n) => Array.from({ length: n + 1 }, (_, i) => { const s = i / n; return a.clone().lerp(b, s).addScaledVector(UP, -sag * 4 * s * (1 - s)); });

/** The four suits as tube glyphs in a 2D frame (x right, y up, about a metre and a half across): cups, wands, swords, pentacles. */
function suitGlyph(k) {
  const arc = (cx, cy, r, a0, a1, n) => Array.from({ length: n + 1 }, (_, i) => { const a = a0 + (a1 - a0) * i / n; return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]; });
  if (k === 0) return [[...arc(0, 0.25, 0.5, 0, -Math.PI, 8).reverse(), [-0.5, 0.25]], [[0, -0.25], [0, -0.55]], [[-0.3, -0.6], [0.3, -0.6]], [[-0.5, 0.25], [0.5, 0.25]]]; // (a cup)
  if (k === 1) return [[[-0.35, -0.7], [0.35, 0.7]], [[0.05, 0.1], [-0.25, 0.25], [-0.05, 0.3]], [[0.2, 0.4], [0.45, 0.3], [0.3, 0.55]], [[-0.15, -0.3], [-0.4, -0.2]]]; // (a wand in leaf)
  if (k === 2) return [[[0, -0.35], [0, 0.75]], [[-0.4, -0.35], [0.4, -0.35]], [[0, -0.35], [0, -0.6]], arc(0, -0.68, 0.09, 0, TAU, 6)]; // (a sword)
  const star = Array.from({ length: 6 }, (_, i) => { const a = Math.PI / 2 + i * (TAU * 2 / 5); return [Math.cos(a) * 0.55, Math.sin(a) * 0.55]; });
  return [arc(0, 0, 0.62, 0, TAU, 16), star]; // (a pentacle)
}

export class BazaarHall {
  constructor(game) {
    this.game = game; this.t = 0; this.built = false;
    this.stone = new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: 0.5, flatShading: true }); // (the kit's parameters: its program)
    this.glowMat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, vertexColors: true }); // (the rope's and the chest model's: their program)
    this.neonMats = [0, 1, 2, 3].map(() => new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, vertexColors: true }));
    this.build(game);
  }

  /** The hall laid: its meshes in the scene, its outline, its colliders; Dovina's placeholders out. */
  build(game = this.game) {
    if (this.built) return; this.built = true;
    const B = BAZAAR, Bz = game.bazaar;
    const S = new Tris(), F = new Tris(), L = new Tris(), N = [new Tris(), new Tris(), new Tris(), new Tris()];
    this.floor(F); this.stalls(S, L, N); this.neonBands(N); this.strings(S, L); this.cage(S, L, N); this.gate(S, L); this.plinths(S);
    const wheel = new Tris(), rotor = new Tris(); this.wheelOfFortune(S, L, wheel); this.carousel(S, rotor); this.d20(S);
    const dome = this.domeTris();
    const put = (T, mat, x = 0, y = 0, z = 0, outline = false) => {
      const m = new THREE.Mesh(T.geometry(), mat); m.position.set(B.x + x, B.y + y, B.z + z); m.userData.zone = 'bazaar';
      if (outline) addOutline(m); game.scene.add(m); return m;
    };
    this.meshes = [put(F, this.stone), put(S, this.stone, 0, 0, 0, true), put(L, this.glowMat)];
    this.dome = put(dome, this.glowMat, 0, B.wall - 2, 0); this.dome.scale.y = B.dome / H.dome.r;
    this.neon = N.map((T, k) => put(T, this.neonMats[k]));
    this.wheel = put(wheel, this.stone, 0, H.wheel.y, H.wheel.z); this.rotor = put(rotor, this.stone, H.carousel.x, 0, H.carousel.z);
    // Dovina's placeholders these replace: her dome and neon tori out of the scene; her lamps (the light budget's) to the lanterns' warmth
    if (Bz) {
      for (const o of [Bz.dome, ...(Bz.neon || [])]) if (o) { game.scene.remove(o); o.geometry.dispose(); }
      Bz.lamps?.forEach((l, k) => l.color.setHex(H.lamps[k % H.lamps.length]));
    }
    this.colliders(game);
  }

  /** The hall taken down: every mesh out of the scene and its geometry let go (its outline's too), its colliders removed; the materials
   *  kept. Dovina's placeholders are hers to build again with her room. */
  teardown(game = this.game) {
    if (!this.built) return; this.built = false;
    for (const m of [...this.meshes, this.dome, ...this.neon, this.wheel, this.rotor]) {
      const o = m.userData.outline; if (o) { OUTLINES.delete(o); m.userData.outline = null; }
      m.parent?.remove(m); m.geometry.dispose();
    }
    this.meshes = this.neon = []; this.dome = this.wheel = this.rotor = null;
    const W = game.level?.physics?.world; for (const c of this.cols || []) W?.removeCollider(c, false); this.cols = [];
  }

  /** Solid where the Courier would walk through the dress: the stalls' counters, the curtain behind the gate, the carousel, the d20. */
  colliders(game) {
    const Lv = game.level, B = BAZAAR; if (!Lv?.physics || !Lv.fixedBody) return;
    this.cols = [];
    const cuboid = (x, y, z, hx, hy, hz, ry = 0) => { const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, 0)); this.cols.push(Lv.physics.world.createCollider(RAPIER.ColliderDesc.cuboid(hx, hy, hz).setTranslation(B.x + x, B.y + y, B.z + z).setRotation(q).setCollisionGroups(GROUPS.static).setFriction(0.9), Lv.fixedBody)); };
    const cyl = (x, z, r, h) => this.cols.push(Lv.physics.world.createCollider(RAPIER.ColliderDesc.cylinder(h / 2, r).setTranslation(B.x + x, B.y + h / 2, B.z + z).setCollisionGroups(GROUPS.static), Lv.fixedBody));
    for (const a of this.stallAngles()) { const r = H.stallR - 2; cuboid(Math.cos(a) * r, 0.6, Math.sin(a) * r, 3, 0.6, 1.9, -a + Math.PI / 2); }
    cuboid(0, 8, B.r - 0.8, 5.2, 8, 0.4);
    cyl(H.carousel.x, H.carousel.z, H.carousel.r + 0.2, 6.8); cyl(H.d20.x, H.d20.z, 2.1, 5.6);
  }

  // ---------------------------------------------------------------- the floor
  floor(T) {
    const f = H.floor, y = f.y;
    T.disc(0, 0, 0, f.edge + 0.1, y - 0.005, G.grout, 96); // (the grout under every tile)
    const colourAt = (rm, s, i, j) => {
      const jit = 0.88 + 0.24 * hash(i * 977 + j * 13);
      if (Math.abs(rm - 18) < 0.65 || Math.abs(rm - 55.4) < 0.65) return shade(G.goldDeep, jit * 1.1);
      if (Math.abs(rm - 31) < 0.65 || rm > 56) return shade(j % 2 && rm < 56 ? G.goldDeep : G.lapis, jit);
      if (rm < 18) return shade(i % 4 === 0 ? G.amber : s % 2 ? G.oxblood : G.shino, jit);
      if (rm < 31) return shade((i + s) % 2 ? G.celadon : G.ru, jit);
      return shade(i % 5 === 0 ? G.shino : s % 2 ? G.tenmoku : G.amber, jit);
    };
    for (let i = 0, r0 = 6.6; r0 < f.edge - 0.1; i++, r0 += f.tile) {
      const r1 = Math.min(f.edge, r0 + f.tile), rm = (r0 + r1) / 2, n = 16 * Math.max(1, Math.round(TAU * rm / f.tile / 16)), g = f.gap / rm;
      for (let j = 0; j < n; j++) {
        const a0 = (j / n) * TAU + g, a1 = ((j + 1) / n) * TAU - g, o = (r, a) => V(Math.cos(a) * r, y, Math.sin(a) * r);
        T.face(o(r0 + f.gap, a0), o(r1 - f.gap, a0), o(r1 - f.gap, a1), o(r0 + f.gap, a1), colourAt(rm, Math.floor((j * 16) / n), i, j), UP);
      }
    }
    // the wheel of fortune at the middle: a gold rim, eight wedges with die pips, gold spokes, a sun hub
    T.disc(0, 0, 5.9, 6.5, y, G.goldDeep, 48);
    for (let w = 0; w < 8; w++) {
      const a0 = (w / 8) * TAU, a1 = ((w + 1) / 8) * TAU, am = (a0 + a1) / 2;
      T.disc(0, 0, 1.6, 5.9, y, w % 2 ? G.lapis : G.oxblood, 4, a0, a1);
      const sp = (r) => V(Math.cos(a0) * r, y + 0.01, Math.sin(a0) * r), side = V(-Math.sin(a0), 0, Math.cos(a0)).multiplyScalar(0.12);
      T.face(sp(1.6).sub(side), sp(5.9).sub(side), sp(5.9).add(side), sp(1.6).add(side), G.gold, UP);
      const c = V(Math.cos(am) * 4, 0, Math.sin(am) * 4), u = V(Math.cos(am), 0, Math.sin(am)), v = V(-Math.sin(am), 0, Math.cos(am));
      for (const [px, py] of PIPS[w % 6]) { const p = c.clone().addScaledVector(u, py * 0.55).addScaledVector(v, px * 0.55); T.disc(p.x, p.z, 0, 0.17, y + 0.012, G.gold, 8); }
    }
    T.disc(0, 0, 0, 1.6, y + 0.005, G.shino, 32);
    for (let k = 0; k < 16; k++) { const a = (k / 16) * TAU, b = a + TAU / 32, o = (r, q) => V(Math.cos(q) * r, y + 0.012, Math.sin(q) * r); const A = o(1.5, a - TAU / 64), Bv = o(k % 2 ? 2.3 : 2.8, b - TAU / 64), C = o(1.5, a + TAU / 32 + TAU / 64); _e1.subVectors(Bv, A).cross(_e2.subVectors(C, A)); if (_e1.y < 0) T.tri(A, C, Bv, G.gold); else T.tri(A, Bv, C, G.gold); }
    T.disc(0, 0, 0, 0.7, y + 0.016, G.goldDeep, 16);
  }

  // ---------------------------------------------------------------- the stalls
  stallAngles() { const s = Math.PI / 2; return H.stalls.flatMap((d) => [s + d, s - d]); } // (the gate is south, at +z: angle pi/2)
  stalls(S, L, N) {
    const sets = [[G.oxblood, G.shino], [G.lapis, G.shino], [G.celadon, G.shino], [G.amber, G.shino], [G.rose, G.shino], [G.ru, G.shino]];
    this.stallAngles().forEach((a, k) => {
      const r = H.stallR, t = V(-Math.sin(a), 0, Math.cos(a)), n = V(-Math.cos(a), 0, -Math.sin(a));
      const M = new THREE.Matrix4().makeBasis(t, UP, n).setPosition(Math.cos(a) * r, 0, Math.sin(a) * r);
      const pt = (u, y, w) => V(u, y, w).applyMatrix4(M), place = (u, y, w, rx = 0) => M.clone().multiply(at(u, y, w, rx));
      const [body, light] = sets[k % sets.length];
      S.box(place(0, 0.55, 2.9), [5, 1.1, 0.9], body); S.box(place(0, 1.13, 2.9), [5.2, 0.06, 1.05], G.goldDeep);
      for (const u of [-1.6, 0, 1.6]) S.box(place(u, 0.55, 3.36), [0.12, 0.9, 0.04], G.gold);
      for (const u of [-2.7, 2.7]) for (const w of [0.4, 3.4]) { S.box(place(u, 2, w), [0.22, 4, 0.22], G.clay); S.box(place(u, 4.05, w), [0.34, 0.14, 0.34], G.gold); }
      // the awning: eight stripes sloping down to the front, a scalloped valance
      const back = 4.8, front = 3.7, w0 = 0.2, w1 = 4.4;
      for (let s = 0; s < 8; s++) {
        const u0 = -3 + s * 0.75, u1 = u0 + 0.75, col = s % 2 ? light : body;
        S.both(pt(u0, back, w0), pt(u1, back, w0), pt(u1, front, w1), pt(u0, front, w1), col);
        S.both(pt(u0, front, w1), pt(u1, front, w1), pt((u0 + u1) / 2, front - 0.45, w1), pt((u0 + u1) / 2, front - 0.45, w1), col);
      }
      // the sign: clay in a gold frame, the suit's neon glyph in front of it
      S.box(place(0, 5.6, 0.45), [3.2, 1.6, 0.25], G.tenmoku);
      for (const [u, y, sx, sy] of [[0, 6.4, 3.4, 0.12], [0, 4.8, 3.4, 0.12], [-1.65, 5.6, 0.12, 1.7], [1.65, 5.6, 0.12, 1.7]]) S.box(place(u, y, 0.58), [sx, sy, 0.12], G.gold);
      for (const pl of suitGlyph(k % 4)) N[k % 4].line(pl.map(([x, y]) => pt(x * 0.9, 5.6 + y * 0.9, 0.7)), H.neon.tube, 0xffffff);
      // the wares: a few pots on the counter
      for (const [u, h, c] of [[-1.8, 0.5, G.celadon], [-1.1, 0.35, G.oxblood], [1.3, 0.45, G.ru], [1.9, 0.3, G.shino]]) S.add(new THREE.CylinderGeometry(0.16, 0.2, h, 8), c, place(u, 1.16 + h / 2, 2.9));
      // its lantern string, between the front posts
      hang(pt(-2.7, 4.0, 3.4), pt(2.7, 4.0, 3.4), 0.5, 6).forEach((p, i, A) => { if (i < A.length - 1) S.rod(p, A[i + 1], 0.02, G.ink); if (i > 0 && i < A.length - 1) lantern(L, p.clone().addScaledVector(UP, -0.3), 0.42, H.lantern[(i + k) % 4]); });
    });
  }

  // ---------------------------------------------------------------- the neon bands
  neonBands(N) {
    const R = H.neon, ring = (k, f, n) => { const r = R.r - k * 0.3, y = R.y[k]; return Array.from({ length: n }, (_, i) => { const a = (i / n) * TAU, [dr, dy] = f(a, i); return V(Math.cos(a) * (r + dr), y + dy, Math.sin(a) * (r + dr)); }); };
    const n = 360, clear = (p) => p.z < 0 && Math.abs(p.x) < H.wheel.r + 1.6; // (the bands part round the wheel of fortune on the north wall)
    const lay = (T, P) => P.forEach((p, i) => { const q = P[(i + 1) % P.length]; if (!clear(p) && !clear(q)) T.rod(p, q, R.tube, 0xffffff); });
    lay(N[0], ring(0, () => [0, 0.14], n)); lay(N[0], ring(0, () => [0, -0.14], n));
    lay(N[1], ring(1, (a, i) => [0, i % 2 ? 0.3 : -0.3], 2 * 112));
    lay(N[2], ring(2, (a, i) => [0, 0.3 - 0.45 * Math.sin(((i % 5) / 4) * Math.PI)], 5 * 74));
    lay(N[3], ring(3, (a, i) => [0, [0, 0.3, 0, -0.3][i % 4]], 4 * 90));
  }

  // ---------------------------------------------------------------- the lantern strings, the dome
  strings(S, L) {
    const R = H.strings, top = V(0, R.ring.y, 0);
    const ringPts = Array.from({ length: 24 }, (_, i) => V(Math.cos((i / 24) * TAU) * R.ring.r, R.ring.y, Math.sin((i / 24) * TAU) * R.ring.r));
    S.line(ringPts, 0.08, G.goldDeep, true); S.rod(top, V(0, BAZAAR.wall - 2 + BAZAAR.dome - 0.5, 0), 0.05, G.goldDeep);
    lantern(L, V(0, R.ring.y - 2.2, 0), 2.6, H.lantern[1]);
    for (let k = 0; k < R.n; k++) {
      const a = (k / R.n) * TAU + 0.13, A = V(Math.cos(a) * 56.6, BAZAAR.wall - 0.5, Math.sin(a) * 56.6), B = V(Math.cos(a) * R.ring.r, R.ring.y, Math.sin(a) * R.ring.r);
      const P = hang(A, B, R.sag, R.lanterns + 1); S.line(P, 0.03, G.ink);
      for (let i = 1; i < P.length - 1; i++) lantern(L, P[i].clone().addScaledVector(UP, -0.45), 0.7, H.lantern[(i + k) % 4]);
    }
  }
  domeTris() {
    const D = H.dome, T = new Tris(), NI = 64, NJ = 14, r = D.r, o = (th, ph, rr = r) => V(Math.cos(ph) * Math.cos(th) * rr, Math.sin(ph) * rr, Math.cos(ph) * Math.sin(th) * rr);
    const low = new THREE.Color(D.low), hor = new THREE.Color(D.horizon), zen = new THREE.Color(D.zenith);
    for (let j = 0; j < NJ; j++) for (let i = 0; i < NI; i++) {
      const p0 = (j / NJ) * Math.PI / 2, p1 = ((j + 1) / NJ) * Math.PI / 2, t0 = (i / NI) * TAU, t1 = ((i + 1) / NI) * TAU, k = (j + 0.5) / NJ;
      const c = (k < 0.25 ? hor.clone().lerp(low, k / 0.25) : low.clone().lerp(zen, Math.pow((k - 0.25) / 0.75, 0.8))).multiplyScalar(Math.floor((i * D.gores) / NI) % 2 ? 0.82 : 1);
      T.quad(o(t0, p0), o(t1, p0), o(t1, p1), o(t0, p1), c);
    }
    const star = (p, s, col) => { const nrm = p.clone().normalize(), a = V(0, 1, 0).cross(nrm).normalize().multiplyScalar(s), b = nrm.clone().cross(a).normalize().multiplyScalar(s); T.quad(p.clone().add(a), p.clone().add(b.clone().multiplyScalar(0.25)), p.clone().sub(a), p.clone().sub(b.clone().multiplyScalar(0.25)), col); T.quad(p.clone().add(b), p.clone().add(a.clone().multiplyScalar(0.25)), p.clone().sub(b), p.clone().sub(a.clone().multiplyScalar(0.25)), col); };
    for (let i = 0; i < 420; i++) star(o(hash(i * 3.1) * TAU, 0.08 + Math.acos(1 - hash(i * 7.7) * 0.92) * 0.98, r - 0.4), 0.1 + 0.12 * hash(i), shade(i % 3 ? 0xf0e0ff : 0xffe2b0, 0.55 + 0.4 * hash(i * 1.3)));
    const gold = shade(D.star, 1.5), line = shade(D.line, 1.1);
    for (let z = 0; z < 12; z++) { // (twelve constellations, a nod to Astroll: Zodiac; seeded shapes, not the sky's)
      const th = (z / 12) * TAU + 0.2 * hash(z), ph = 0.35 + 0.55 * hash(z * 5.3), n = 5 + Math.floor(hash(z * 2.9) * 3), pts = [];
      for (let s = 0; s < n; s++) pts.push(o(th + (hash(z * 31 + s) - 0.5) * 0.42, Math.min(1.35, ph + (hash(z * 17 + s * 3) - 0.5) * 0.36), r - 0.5));
      pts.forEach((p, s) => { star(p, 0.45 + 0.4 * hash(z + s * 9), gold); const q = s ? pts[s - 1] : pts[Math.min(2, n - 1)]; if (!s && n < 3) return; const side = q.clone().sub(p).cross(p).normalize().multiplyScalar(0.05), pp = p.clone().multiplyScalar(1.002), qq = q.clone().multiplyScalar(1.002); T.quad(pp.clone().add(side), qq.clone().add(side), qq.clone().sub(side), pp.clone().sub(side), line); });
    }
    for (let i = 0; i < 32; i++) { const a = (i / 32) * TAU, b = ((i + 1) / 32) * TAU; T.quad(o(a, 1.38, r - 0.6), o(b, 1.38, r - 0.6), o(b, 1.42, r - 0.6), o(a, 1.42, r - 0.6), gold); if (i % 2) T.tri(o(a, 1.42, r - 0.6), o(b, 1.42, r - 0.6), o((a + b) / 2, 1.5, r - 0.6), gold); } // (the crown's rosette)
    return T;
  }

  // ---------------------------------------------------------------- Raku's cage, the gate, the plinths
  cage(S, L, N) {
    const c = BAZAAR.cage, x = c.x, z = c.z;
    S.box(at(x, 0.55, z + 0.73), [7.1, 1.0, 0.06], G.oxblood);
    for (let k = -3; k <= 3; k++) S.box(at(x + k, 0.55, z + 0.77, 0, 0, Math.PI / 4), [0.3, 0.3, 0.03], G.gold);
    for (const sx of [-3.75, 3.75]) for (const dz of [0.85, -0.9]) S.box(at(x + sx, 2.3, z + dz), [0.25, 4.6, 0.25], G.goldDeep);
    for (let u = -3.4; u <= 3.41; u += 0.34) if (Math.abs(u) > 1.2) S.rod(V(x + u, 1.12, z + 0.8), V(x + u, 3.6, z + 0.8), 0.025, G.gold);
    S.box(at(x, 3.65, z + 0.8), [7.6, 0.1, 0.1], G.gold);
    S.box(at(x, 4.75, z), [7.9, 0.5, 2.0], G.lapis); S.box(at(x, 5.02, z), [8.0, 0.06, 2.1], G.gold); S.box(at(x, 4.5, z), [8.0, 0.06, 2.1], G.gold);
    const onion = [[0, 0], [0.8, 0.1], [1, 0.45], [0.7, 0.95], [0.25, 1.35], [0.05, 1.75], [0, 1.85]].map(([a, b]) => new THREE.Vector2(a, b));
    for (const [dx, s] of [[0, 1.1], [-2.8, 0.6], [2.8, 0.6]]) {
      S.add(new THREE.LatheGeometry(onion, 12), (cc) => (Math.floor((Math.atan2(cc.z, cc.x) + Math.PI) / (TAU / 12)) % 2 ? G.oxblood : G.goldDeep), new THREE.Matrix4().compose(V(x + dx, 5.05, z), _q.identity(), V(s, s, s)));
      S.add(new THREE.IcosahedronGeometry(0.12 * s / 0.6, 0), G.gold, at(x + dx, 5.05 + 1.95 * s, z));
    }
    S.add(new THREE.BoxGeometry(0.5, 0.5, 0.5), G.gold, at(x, 7.75, z, Math.atan(Math.SQRT1_2), Math.PI / 4, 0)); // (a cube, Raku's trade, balanced on its corner)
    const cube = [[-0.5, -0.3], [0, -0.55], [0.5, -0.3], [0.5, 0.3], [0, 0.55], [-0.5, 0.3]];
    N[2].line(cube.map(([u, v]) => V(x + u * 1.3, 4.75 + v * 0.35, z + 1.05)), H.neon.tube * 0.8, 0xffffff, true);
    for (let i = 0; i < 12; i++) lantern(L, V(x - 3.5 + i * (7 / 11), 4.25, z + 1.05), 0.26, H.lantern[i % 4]);
  }
  gate(S, L) {
    const g = BAZAAR.gate, z = g.z - 0.1, B = BAZAAR;
    for (const s of [-1, 1]) {
      for (let b = 0; b < 7; b++) S.box(at(g.x + s * 3.2, 0.5 + b, z), [1.15, 1.0, 1.15], b % 2 ? G.shino : G.oxblood);
      S.box(at(g.x + s * 3.2, 0.12, z), [1.5, 0.24, 1.5], G.goldDeep); S.box(at(g.x + s * 3.2, 7.1, z), [1.5, 0.3, 1.5], G.gold);
      S.add(new THREE.IcosahedronGeometry(0.35, 0), G.gold, at(g.x + s * 3.2, 13.0, z)); S.box(at(g.x + s * 3.2, 10.2, z), [0.5, 5.6, 0.5], G.lapis);
    }
    S.box(at(g.x, 7.45, z), [8.0, 0.9, 1.2], G.lapis); for (const y of [7.0, 7.9]) S.box(at(g.x, y, z), [8.1, 0.08, 1.3], G.gold);
    // the crest: a sunburst over the lintel, gold and oxblood rays, a gold rim with marquee bulbs, a sun at its heart
    const cz = z - 0.62, cy = 7.95, R = 4.6, o = (a, r, dz = 0) => V(g.x + Math.cos(a) * r, cy + Math.sin(a) * r, cz + dz);
    for (let k = 0; k < 13; k++) { const a0 = (k / 13) * Math.PI, a1 = ((k + 1) / 13) * Math.PI; S.both(o(a0, 1.3), o(a0, R), o(a1, R), o(a1, 1.3), k % 2 ? G.oxblood : G.goldDeep); }
    S.line(Array.from({ length: 27 }, (_, i) => o((i / 26) * Math.PI, R + 0.1, -0.02)), 0.12, G.gold);
    for (let k = 0; k < 12; k++) S.both(o((k / 12) * Math.PI, 0, -0.02), o((k / 12) * Math.PI, 1.3, -0.02), o(((k + 1) / 12) * Math.PI, 1.3, -0.02), o(((k + 1) / 12) * Math.PI, 0, -0.02), G.shino);
    for (let i = 0; i <= 22; i++) L.add(new THREE.OctahedronGeometry(0.13, 0), shade(0xffe2a0, 1.5), new THREE.Matrix4().setPosition(o((i / 22) * Math.PI, R + 0.1, -0.2)));
    for (let i = 0; i < 14; i++) L.add(new THREE.OctahedronGeometry(0.11, 0), shade(0xffe2a0, 1.5), new THREE.Matrix4().setPosition(g.x - 3.6 + i * (7.2 / 13), 7.45, z - 0.65));
    // the curtain closing the wall's gap behind it (striped velvet in the gap, the wall's dark over it to the top)
    const wz = B.r - 0.8;
    for (let s = 0; s < 10; s++) { const u0 = -5 + s, u1 = u0 + 1; S.both(V(u0, 0, wz), V(u1, 0, wz), V(u1, 8.2, wz), V(u0, 8.2, wz), s % 2 ? G.oxblood : shade(G.oxblood, 0.65)); }
    S.box(at(0, 12.1, wz + 0.1), [10.6, 7.8, 0.4], G.ink); S.box(at(0, 8.25, wz - 0.12), [10.6, 0.15, 0.12], G.gold);
  }
  plinths(S) {
    for (const T of TABLES) {
      const x = T.at.x, z = T.at.z, r = T.r;
      S.add(new THREE.CylinderGeometry(r + 0.04, r + 0.08, 0.8, 20, 1, true), G.oxblood, at(x, 0.42, z));
      for (const [y, h] of [[0.08, 0.1], [0.82, 0.08]]) S.add(new THREE.CylinderGeometry(r + 0.1, r + 0.1, h, 20, 1, true), G.goldDeep, at(x, y, z));
    }
  }

  // ---------------------------------------------------------------- the carnival props
  wheelOfFortune(S, L, W) {
    const Wh = H.wheel, r = Wh.r, segs = 16, wedge = (a) => Math.floor((((a % TAU) + TAU) % TAU) / (TAU / segs));
    const cols = [G.oxblood, G.shino, G.lapis, G.celadon, G.amber, G.ru, G.rose, G.shino];
    W.add(new THREE.CylinderGeometry(r, r, 0.3, segs * 2), (c) => (Math.hypot(c.x, c.z) > r * 0.95 ? G.goldDeep : wedge(-Math.atan2(c.z, c.x)) === 0 ? G.gold : cols[wedge(-Math.atan2(c.z, c.x)) % cols.length]), at(0, 0, 0, Math.PI / 2));
    for (let w = 0; w < segs; w++) {
      const a = ((w + 0.5) / segs) * TAU, u = V(Math.cos(a), Math.sin(a), 0), v = V(-Math.sin(a), Math.cos(a), 0), c = u.clone().multiplyScalar(r * 0.7);
      if (w === 0) { W.add(new THREE.IcosahedronGeometry(0.35, 0), G.lapis, at(c.x, c.y, 0.2)); continue; } // (the jackpot wedge: a lapis star-stone)
      for (const [px, py] of PIPS[(w - 1) % 6]) { const p = c.clone().addScaledVector(u, py * 0.5).addScaledVector(v, px * 0.5); W.add(new THREE.CylinderGeometry(0.12, 0.12, 0.06, 8), G.gold, at(p.x, p.y, 0.17, Math.PI / 2)); }
      const pa = (w / segs) * TAU; W.add(new THREE.CylinderGeometry(0.06, 0.06, 0.4, 6), G.gold, at(Math.cos(pa) * r * 0.97, Math.sin(pa) * r * 0.97, 0.25, Math.PI / 2));
    }
    W.add(new THREE.CylinderGeometry(0.9, 0.9, 0.2, 16), G.goldDeep, at(0, 0, 0.2, Math.PI / 2));
    for (let k = 0; k < 12; k++) { const a = (k / 12) * TAU; W.rod(V(Math.cos(a) * 0.9, Math.sin(a) * 0.9, 0.25), V(Math.cos(a) * 1.5, Math.sin(a) * 1.5, 0.25), 0.06, G.gold); }
    // its frame (fixed): a gold ring, the pointer at the top, a bracket to the wall, marquee bulbs round it
    const y = Wh.y, z = Wh.z;
    S.line(Array.from({ length: 40 }, (_, i) => V(Math.cos((i / 40) * TAU) * (r + 0.3), y + Math.sin((i / 40) * TAU) * (r + 0.3), z - 0.1)), 0.14, G.goldDeep, true);
    S.box(at(0, y + r + 0.35, z + 0.25, 0, 0, Math.PI / 4), [0.6, 0.6, 0.2], G.gold); S.box(at(0, y, z - 0.6), [1.2, 1.2, 1.0], G.lapis);
    for (let i = 0; i < 32; i++) { const a = (i / 32) * TAU; L.add(new THREE.OctahedronGeometry(0.12, 0), shade(0xffe2a0, 1.5), new THREE.Matrix4().setPosition(Math.cos(a) * (r + 0.75), y + Math.sin(a) * (r + 0.75), z + 0.05)); }
  }
  carousel(S, R) {
    const C = H.carousel, x = C.x, z = C.z, r = C.r;
    S.add(new THREE.CylinderGeometry(r + 0.2, r + 0.3, 0.45, 32), (c) => (c.y > 0.2 ? G.shino : Math.floor((Math.atan2(c.z, c.x) + Math.PI) / (TAU / 16)) % 2 ? G.oxblood : G.goldDeep), at(x, 0.225, z));
    R.add(new THREE.CylinderGeometry(r - 0.1, r - 0.1, 0.1, 32), G.amber, at(0, 0.5, 0));
    for (let b = 0; b < 9; b++) R.add(new THREE.CylinderGeometry(0.45, 0.45, 0.5, 12), b % 2 ? G.lapis : G.goldDeep, at(0, 0.8 + b * 0.5, 0));
    const tent = [[0.3, 7.4], [r + 0.4, 5.1], [r + 0.4, 5.0]].map(([a, b]) => new THREE.Vector2(a, b)).reverse();
    R.add(new THREE.LatheGeometry(tent, 24), (c) => (Math.floor((Math.atan2(c.z, c.x) + Math.PI) / (TAU / 12)) % 2 ? G.oxblood : G.shino), null);
    R.add(new THREE.LatheGeometry([...tent].reverse(), 24), G.ink, at(0, -0.02, 0)); // (the canopy's underside)
    for (let k = 0; k < 24; k++) { const a0 = (k / 24) * TAU, a1 = ((k + 1) / 24) * TAU, o = (a, y, rr = r + 0.4) => V(Math.cos(a) * rr, y, Math.sin(a) * rr); R.both(o(a0, 5.0), o(a1, 5.0), o((a0 + a1) / 2, 4.55), o((a0 + a1) / 2, 4.55), k % 2 ? G.goldDeep : G.oxblood); }
    R.add(new THREE.IcosahedronGeometry(0.4, 0), G.gold, at(0, 7.7, 0));
    const pot = [[0, 0], [0.32, 0.05], [0.45, 0.35], [0.38, 0.65], [0.22, 0.8], [0.28, 0.92], [0, 0.92]].map(([a, b]) => new THREE.Vector2(a, b));
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * TAU, rr = k % 2 ? 3.9 : 2.7, px = Math.cos(a) * rr, pz = Math.sin(a) * rr;
      R.rod(V(px, 0.55, pz), V(px, 5.0, pz), 0.05, G.gold);
      R.add(new THREE.LatheGeometry(pot, 8), [G.celadon, G.oxblood, G.ru, G.shino, G.rose, G.amber, G.lapis, G.clay][k], at(px, k % 2 ? 1.3 : 1.7, pz));
    }
  }
  d20(S) {
    const D = H.d20, x = D.x, z = D.z;
    S.add(new THREE.CylinderGeometry(1.2, 1.5, 1.4, 12), (c) => (c.y > 0.6 || c.y < -0.6 ? G.goldDeep : G.tenmoku), at(x, 0.7, z));
    const ico = new THREE.IcosahedronGeometry(2, 0), m = at(x, 3.45, z, 0.35, 0.4, 0.2), p = ico.attributes.position;
    S.add(ico.clone(), (c, i) => (i % 2 ? G.lapis : G.oxblood), m);
    for (let i = 0; i < p.count; i += 3) { // (a gold glyph inset on every face, never a number)
      const a = V(p.getX(i), p.getY(i), p.getZ(i)), b = V(p.getX(i + 1), p.getY(i + 1), p.getZ(i + 1)), c = V(p.getX(i + 2), p.getY(i + 2), p.getZ(i + 2)), ctr = a.clone().add(b).add(c).divideScalar(3), lift = ctr.clone().normalize().multiplyScalar(0.02);
      const s = (q) => ctr.clone().lerp(q, 0.3).add(lift).applyMatrix4(m); S.tri(s(a), s(b), s(c), G.gold);
    }
    ico.dispose();
  }

  update(dt) {
    if (!this.built || zoneOf(this.game.camera.position) !== 'bazaar') return;
    const t = (this.t += dt);
    this.dome.rotation.y = t * 0.006;
    this.wheel.rotation.z = -(t * 0.5 + Math.sin(t * 0.21) * 1.2);
    this.rotor.rotation.y = t * 0.28;
    this.neon.forEach((n, k) => featTint((t * SCHILLER.rate + k * 0.25) % 1, n.material.color, { bright: H.neon.bright }));
  }
}

/** Die pips, 1 to 6, in a unit square (x across, y along). */
const PIPS = [[[0, 0]], [[-0.5, -0.5], [0.5, 0.5]], [[-0.5, -0.5], [0, 0], [0.5, 0.5]], [[-0.5, -0.5], [0.5, -0.5], [-0.5, 0.5], [0.5, 0.5]],
  [[-0.5, -0.5], [0.5, -0.5], [0, 0], [-0.5, 0.5], [0.5, 0.5]], [[-0.5, -0.5], [0.5, -0.5], [-0.5, 0], [0.5, 0], [-0.5, 0.5], [0.5, 0.5]]];
