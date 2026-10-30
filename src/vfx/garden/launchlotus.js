// ---------------------------------------------------------------------------------------
// THE LAUNCH LOTUSES, DRAWN: each launch lotus of the Spirit Garden (Petra's: world/garden/place.js lays them, realm.js flies the Pneuka
// Jar from one when it stands on it) as a giant lotus you would want to jump into (South, 2026-10-30: "the Spirit Garden needs a
// graphical overhaul, (like the jump pads between planetoids)"):
//
//   THE FLOWER   three rings of cupped petals (6, 8, 10; 0.9 to 1.36 m long), pearl white flushed rose to the tips, the film's schiller
//                running over them at a grazing look; a bud at rest, half open, breathing; opening wide as the Jar comes within 7 m
//   THE HEART    the seed pod at its middle, its seeds and the base of every petal glowing in the colour of where it throws to (DEST:
//                gold to the Dantian's lake, ember to the Athanor, lilac to the Pavilions ...), brighter at dusk and as the Jar nears
//   THE STEM     curling from under the flower back and down into the planetoid, a lotus leaf raised on its own stalk behind it and a pad
//                lying on the ground (their green the season's: the garden's mood)
//   THE LAUNCH   on `garden.launch` the petals snap shut round the Jar and fling open past wide (a spring kicked), a burst of petals and
//                pollen (`garden.lotus.launch`), and the pollen arc to where it goes lights along the Jar's flight (pollenarcs.js); the
//                lotus it lands on catches it (closing a little, opening again) with a puff of pollen (`garden.lotus.land`)
//
// Three InstancedMeshes (petals, pods, stems and leaves) on ONE program (a standard material taught a glow by `aGlow` in each lotus's
// instance colour, the leaves' green by `aKind`, and the schiller), and the arcs' one Points: four draws for every lotus in the garden,
// a bought planetoid's added when its lotuses are. The petals open on the CPU (a matrix a petal, only for a lotus near the camera or
// moving); the world's stand-in cones are hidden, never removed.
//
// Prior art: Super Mario Galaxy's launch star (the pull as you near, the wind-up and the fling, the sparkle path), the sacred lotus
// (Nelumbo: the seed pod's head, the leaf raised out of the water on its own stalk, the bud rising on a curled stem), Okami's blooms
// opening at a stroke, and the film's schiller (vfx/oxidation.js FILM) as the house's mark of Lachryma.
//
//   game.launchLotuses = new LaunchLotuses(game)   .update(rawDt)   (dresses on garden.enter)   LOTUS_LOOK   DEST
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { PollenArcs } from './pollenarcs.js';

/** The flower's numbers: rings of petals (count, length and width m, base radius and height m, bud and open angles from the up in
 *  radians), the flower's height over the ground, the Jar's nearness (m: begins to open, wide), the rest, the spring and its kicks. */
export const LOTUS_LOOK = {
  rings: [
    { n: 6, len: 0.92, w: 0.46, r0: 0.26, h0: 0.12, bud: 0.08, open: 0.66 },
    { n: 8, len: 1.14, w: 0.54, r0: 0.36, h0: 0.07, bud: 0.16, open: 1.02 },
    { n: 10, len: 1.38, w: 0.6, r0: 0.46, h0: 0.02, bud: 0.26, open: 1.36 },
  ],
  lift: 0.42, near: [7, 2.2], rest: 0.34, breath: 0.035, animate: 45,
  spring: { stiff: 55, damp: 6 }, snap: { t: 0.13, k: -0.18, fling: 9 }, catch: 5,
};
/** Where a lotus throws to, as its heart's glow (sRGB): the place's own colour, lit. */
export const DEST = { dantian: 0xffcf5a, terraces: 0xa6f06e, athanor: 0xff8a3a, pavilions: 0xd2a6ff, mulberryGrove: 0x74f0c4, chimney: 0x9cc0ff, myggdrasil: 0xc4f09a, other: 0xf0e4ff };
const PETAL_BASE = { w: 0.5 }; // (the petal geometry's own width: a ring's petal is it scaled)

// ------------------------------------------------------------------------------------------------- the geometry
/** A part's attributes: colour by position (a fn, given the vertex's normal in _n), a hex, or a grey (below 2), glow, kind (0 the
 *  flower, 1 green: the mood's leaf times its grey, 2 the pod). */
function paint(geo, { color = 0xffffff, glow = 0, kind = 0 } = {}) {
  const g = geo.index ? geo.toNonIndexed() : geo, P = g.attributes.position, n = P.count, col = new Float32Array(n * 3), gl = new Float32Array(n), kd = new Float32Array(n).fill(kind), c = new THREE.Color();
  for (let i = 0; i < n; i++) {
    if (g.attributes.normal) _n.fromBufferAttribute(g.attributes.normal, i);
    if (typeof color === 'function') color(P.getX(i), P.getY(i), P.getZ(i), c); else if (color < 2) c.setScalar(color); else c.setHex(color);
    col.set([c.r, c.g, c.b], i * 3); gl[i] = typeof glow === 'function' ? glow(P.getX(i), P.getY(i), P.getZ(i)) : glow;
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.setAttribute('aGlow', new THREE.BufferAttribute(gl, 1)); g.setAttribute('aKind', new THREE.BufferAttribute(kd, 1));
  for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'color', 'aGlow', 'aKind'].includes(k)) g.deleteAttribute(k);
  return g;
}
const merge = (parts) => { const g = mergeGeometries(parts, false); parts.forEach((p) => p.dispose()); return g; };

/** One petal, 1 m long and PETAL_BASE.w wide, its base at the origin, along +Y, cupped toward -Z (the flower's heart), both faces. */
function petalGeometry() {
  const U = 6, V = 4, w = PETAL_BASE.w, side = (back) => {
    const pos = [], col = [], glow = [], idx = [], c = new THREE.Color(), cs = back ? [0xeaa6bd, 0xf8dfe8, 0xdf6690] : [0xffc6d8, 0xfff5f8, 0xf27fa3];
    for (let i = 0; i <= U; i++) for (let j = 0; j <= V; j++) {
      const u = i / U, v = (j / V) * 2 - 1, hw = (w / 2) * Math.pow(Math.sin(Math.PI * (0.08 + 0.92 * u)), 0.72);
      const z = 0.11 * Math.sin(Math.PI * u) - 0.13 * v * v * Math.sin(Math.PI * (0.12 + 0.88 * u)) + 0.16 * u * u * u + (back ? 0.018 : 0);
      pos.push(v * hw, u, z);
      const t = Math.min(1, u / 0.42); c.setHex(cs[0]).lerp(_c.setHex(cs[1]), t); if (u > 0.42) c.lerp(_c.setHex(cs[2]), Math.pow((u - 0.42) / 0.58, 1.6)); c.lerp(_c.setHex(cs[2]), 0.18 * v * v * u);
      if (j === V / 2) c.multiplyScalar(0.94); col.push(c.r, c.g, c.b); glow.push(back ? 0.3 * (1 - u) ** 3 : 0.95 * (1 - u) ** 2);
      if (i < U && j < V) { const a = i * (V + 1) + j, b = a + V + 1; if (back) idx.push(a, a + 1, b, a + 1, b + 1, b); else idx.push(a, b, a + 1, a + 1, b, b + 1); }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setAttribute('aGlow', new THREE.Float32BufferAttribute(glow, 1)); g.setAttribute('aKind', new THREE.Float32BufferAttribute(new Array(pos.length / 3).fill(0), 1));
    return g;
  };
  return merge([side(false), side(true)]);
}

/** The seed pod: a flat-topped receptacle, its seeds glowing, a fringe of stamens round it. */
function podGeometry() {
  const parts = [], L = (pts, seg) => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg);
  parts.push(paint(L([[0.02, 0], [0.16, 0.04], [0.26, 0.2], [0.36, 0.38], [0.41, 0.45], [0.38, 0.48], [0.02, 0.49]], 14), { color: (x, y, z, c) => c.setHex(0xb8bf5c).lerp(_c.setHex(0xe8de8c), Math.min(1, y / 0.48)), glow: (x, y) => (y > 0.46 ? 0.45 : 0), kind: 2 }));
  for (let k = 0; k < 7; k++) { const a = (k / 6) * Math.PI * 2, r = k ? 0.22 : 0; parts.push(paint(new THREE.SphereGeometry(0.065, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2).translate(Math.cos(a) * r, 0.475, Math.sin(a) * r), { color: 0xfff0b4, glow: 1, kind: 2 })); }
  for (let k = 0; k < 16; k++) { const a = (k / 16) * Math.PI * 2, g = new THREE.ConeGeometry(0.024, 0.32, 4).translate(0, 0.16, 0).rotateX(0.75).rotateY(-a + Math.PI / 2).translate(Math.cos(a) * 0.34, 0.3, Math.sin(a) * 0.34); parts.push(paint(g, { color: 0xffd65a, glow: 0.45, kind: 2 })); }
  return merge(parts);
}

/** A lotus leaf: a shallow funnel `r` round, its edge rippled, a notch where the pad splits (`notch` radians, 0 none), its veins lighter
 *  on top and its underside a shade darker (both faces, so a raised leaf reads from below). */
function leafGeometry(r, { funnel = 0.16, ripple = 0.05, notch = 0 } = {}) {
  const S = 18, Rn = 4, pos = [], top = [], under = [], n = (Rn + 1) * (S + 1);
  for (let i = 0; i <= Rn; i++) for (let j = 0; j <= S; j++) {
    const t = i / Rn, a = notch / 2 + (j / S) * (Math.PI * 2 - notch), rr = r * t;
    pos.push(Math.cos(a) * rr, funnel * t * t * r + ripple * r * t * t * Math.sin(a * 7), Math.sin(a) * rr);
    if (i < Rn && j < S) { const p = i * (S + 1) + j, q = p + S + 1; top.push(p, p + 1, q, p + 1, q + 1, q); under.push(n + p, n + q, n + p + 1, n + p + 1, n + q, n + q + 1); }
  }
  for (let k = 0; k < n; k++) pos.push(pos[k * 3], pos[k * 3 + 1] - 0.012, pos[k * 3 + 2]);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex([...top, ...under]); g.computeVertexNormals();
  return paint(g, { color: (x, y, z, c) => { const t = Math.hypot(x, z) / r, a = Math.atan2(z, x), vein = Math.pow(Math.abs(Math.cos(a * 4.5)), 24); return c.setScalar((1.05 - 0.3 * t + 0.12 * vein * (1 - t)) * (_n.y < 0 ? 0.62 : 1)); }, kind: 1 });
}

/** The stem curling from under the flower down into the ground, the sepal cup holding it, the raised leaf on its stalk, the pad. */
function stemGeometry() {
  const B = LOTUS_LOOK.lift, parts = [], tube = (pts, r, seg = 24) => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p))), seg, r, 6, false);
  parts.push(paint(new THREE.LatheGeometry([[0.05, 0], [0.3, 0.04], [0.46, 0.14], [0.52, 0.24]].map(([r, y]) => new THREE.Vector2(r, y)), 12).translate(0, B - 0.1, 0), { color: 0.82, kind: 1 }));
  parts.push(paint(tube([[0, B - 0.06, 0], [0, B - 0.26, -0.32], [0.08, 0.12, -0.82], [0.14, 0.22, -1.26], [0.12, 0.08, -1.6], [0.08, -0.5, -1.78]], 0.075), { color: 0.78, kind: 1 }));
  parts.push(paint(tube([[0.62, -0.4, -1.02], [0.63, 0.38, -1.05], [0.7, 0.98, -0.98], [0.76, 1.3, -0.9]], 0.045, 16), { color: 0.74, kind: 1 }));
  parts.push(leafGeometry(0.78, { funnel: 0.22, ripple: 0.05 }).rotateX(0.55).rotateZ(-0.25).translate(0.76, 1.32, -0.9));
  parts.push(leafGeometry(0.66, { funnel: 0.04, ripple: 0.03, notch: 0.35 }).rotateY(1.2).translate(-1.08, 0.03, -0.5));
  return merge(parts);
}

// ------------------------------------------------------------------------------------------------- the material
/** The lotus's one program: the standard material, its diffuse the vertex colour (the leaves' times the mood's green), a glow of the
 *  instance colour where `aGlow` says, the film's schiller at a grazing look on the petals. */
function lotusMaterial(U) {
  const m = new THREE.MeshStandardMaterial({ name: 'garden-launch-lotus', vertexColors: true, roughness: 0.55, metalness: 0 });
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float aGlow; attribute float aKind; varying float vGlow; varying float vPetal; varying vec3 vTint; uniform vec3 uLeaf;')
      .replace('#include <color_vertex>', `vColor = color; vGlow = aGlow; vPetal = 1.0 - step(0.5, aKind);
#ifdef USE_INSTANCING_COLOR
  vTint = instanceColor;
#else
  vTint = vec3(1.0);
#endif
  if (aKind > 0.5 && aKind < 1.5) vColor *= uLeaf;`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
varying float vGlow; varying float vPetal; varying vec3 vTint; uniform float uGlowK; uniform float uTime; uniform float uSheen;
vec3 lotusFilm(float t) { float x = fract(t) * 4.0; vec3 a = vec3(0.30, 0.06, 0.70), b = vec3(0.04, 0.55, 0.75), c = vec3(0.95, 0.72, 0.18), d = vec3(0.85, 0.10, 0.50);
  return x < 1.0 ? mix(a, b, x) : x < 2.0 ? mix(b, c, x - 1.0) : x < 3.0 ? mix(c, d, x - 2.0) : mix(d, a, x - 3.0); }`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
  totalEmissiveRadiance += vTint * vGlow * uGlowK;
  float lotusFres = pow(1.0 - clamp(abs(dot(normal, normalize(vViewPosition))), 0.0, 1.0), 2.4);
  totalEmissiveRadiance += lotusFilm(dot(vViewPosition, vec3(0.06, 0.08, 0.05)) + uTime * 0.05) * lotusFres * uSheen * vPetal;`);
  };
  m.customProgramCacheKey = () => 'garden-launch-lotus';
  return m;
}

// ------------------------------------------------------------------------------------------------- the lotuses
export class LaunchLotuses {
  constructor(game) {
    this.game = game; this.lotuses = []; this.count = -1; this.t = 0; this.flying = null;
    this.U = { uLeaf: { value: new THREE.Color(0x4e9a3c).multiplyScalar(1.7) }, uGlowK: { value: 0.6 }, uTime: { value: 0 }, uSheen: { value: 0.32 } };
    this.arcs = new PollenArcs();
    game.events?.on('garden.enter', () => { this.flying = null; const R = game.realm; if (R?.site && this.count !== R.site.lotuses.length) { try { this.build(R); this.compile(); } catch (e) { console.warn('launch lotuses', e); } } });
    game.events?.on('garden.launch', (e) => this.launched(e));
  }

  /** Every lotus of the site drawn (again, when a bought planetoid has added its own), the world's cones hidden. */
  build(R) {
    const S = R.site, L = LOTUS_LOOK, recs = S.lotuses;
    this.dispose(false); this.count = recs.length; this.lotuses = [];
    for (const o of S.group.children) if (o.isMesh && o.material === S.mats.lotus && o.name !== 'garden-seed') o.visible = false; // (the stand-ins: world/garden/place.js's cones; the hand's seed shares their material)
    if (!this.geo) { this.geo = { petal: petalGeometry(), pod: podGeometry(), stem: stemGeometry() }; this.mat = lotusMaterial(this.U); }
    const group = (this.group = new THREE.Group()); group.name = 'garden-launch-lotuses';
    const per = L.rings.reduce((a, r) => a + r.n, 0), n = recs.length;
    const mk = (geo, count, name) => { const m = new THREE.InstancedMesh(geo, this.mat, Math.max(1, count)); m.name = name; m.count = count; m.castShadow = true; m.receiveShadow = true; m.frustumCulled = false; m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); m.setColorAt(0, _col.setRGB(1, 1, 1)); group.add(m); return m; };
    this.petals = mk(this.geo.petal, n * per, 'lotus-petals'); this.pods = mk(this.geo.pod, n, 'lotus-pods'); this.stems = mk(this.geo.stem, n, 'lotus-stems');
    const T = new THREE.Matrix4(), Ry = new THREE.Matrix4(), Tz = new THREE.Matrix4();
    recs.forEach((rec, i) => {
      const up = rec.pos.clone().sub(rec.planet.c).normalize(), fwd = rec.toPlanet.c.clone().sub(rec.pos).projectOnPlane(up);
      if (fwd.lengthSq() < 1e-6) fwd.set(1, 0, 0).projectOnPlane(up); fwd.normalize();
      const base = new THREE.Matrix4().makeBasis(new THREE.Vector3().crossVectors(up, fwd).normalize(), up, fwd).setPosition(rec.pos.clone().addScaledVector(up, -0.03));
      const glow = new THREE.Color(DEST[rec.toPlanet.id] ?? DEST.other), lot = { rec, i, up, base, glow, k: L.rest, v: 0, snap: 0, flash: 0, near: 0, drawn: null, lit: -1, ph: i * 1.93, petals: [] };
      lot.centre = rec.pos.clone().addScaledVector(up, L.lift + 0.45);
      let idx = i * per;
      L.rings.forEach((ring, j) => { for (let q = 0; q < ring.n; q++, idx++) {
        const phi = ((q + (j % 2) * 0.5) / ring.n) * Math.PI * 2 + i * 0.37, jit = (((idx * 53) % 17) / 17 - 0.5) * 0.12, s = 0.92 + (((idx * 31) % 13) / 13) * 0.16;
        const m = base.clone().multiply(T.makeTranslation(0, L.lift + ring.h0, 0)).multiply(Ry.makeRotationY(phi)).multiply(Tz.makeTranslation(0, 0, ring.r0));
        lot.petals.push({ idx, m, ring, jit, scale: new THREE.Vector3((ring.w / PETAL_BASE.w) * s, ring.len * s, (ring.w / PETAL_BASE.w) * s) });
      } });
      this.pods.setMatrixAt(i, _m.multiplyMatrices(base, T.makeTranslation(0, L.lift, 0))); this.stems.setMatrixAt(i, base);
      this.lotuses.push(lot);
    });
    for (const lot of this.lotuses) lot.rev = this.lotuses.find((o) => o.rec.planet === lot.rec.toPlanet && o.rec.toPlanet === lot.rec.planet) || null;
    // the arcs: one a pair, along the flight the body takes (world/garden/planetbody.js launch, from a Jar at the lotus to the landing)
    const arcs = [];
    for (const lot of this.lotuses) {
      if (lot.arc !== undefined) continue;
      const A = lot.rec, B = A.toPlanet, landDir = A.land.clone().sub(B.c).normalize(), from = A.pos.clone().addScaledVector(lot.up, 0.5), to = B.c.clone().addScaledVector(landDir, B.r + 0.6);
      const c = from.clone().lerp(to, 0.5).addScaledVector(lot.up.clone().add(landDir).normalize(), from.distanceTo(to) * 0.45);
      lot.arc = arcs.length; lot.arcDir = 1; if (lot.rev) { lot.rev.arc = arcs.length; lot.rev.arcDir = -1; }
      arcs.push({ a: from, c, b: to });
    }
    this.arcs.build(arcs, group);
    for (const lot of this.lotuses) this.pose(lot, true);
    this.petals.instanceMatrix.needsUpdate = true; this.pods.instanceMatrix.needsUpdate = true; this.stems.instanceMatrix.needsUpdate = true;
    S.group.add(group);
  }

  /** Compiled under the seam's cover, as the realm's warm-up compiles the garden (world/garden/realm.js build). */
  compile() {
    const g = this.game, R = g.renderer; if (!R || !this.group) return;
    const was = R.getRenderTarget();
    try { R.setRenderTarget(g.post?.target ?? null); R.compile(this.group, g.camera, g.scene); } catch (e) { console.warn('launch lotuses warm-up', e); }
    R.setRenderTarget(was ?? null);
  }

  /** A launch: the lotus snaps shut and flings, the burst, the arc lit along the flight. */
  launched(e) {
    const lot = this.lotuses.find((l) => l.rec.planet.id === e.from && l.rec.toPlanet.id === e.to); if (!lot) return;
    const S = LOTUS_LOOK.snap; lot.snap = S.t; lot.flash = 1;
    this.flying = lot; this.arcs.light(lot.arc, lot.arcDir);
    this.game.vfx?.play('garden.lotus.launch', { pos: lot.centre, normal: lot.up, dir: lot.up, tint: lot.glow });
  }
  /** The Jar down on the lotus across: it catches it. */
  landed(lot) {
    if (!lot) return; lot.v -= LOTUS_LOOK.catch; lot.flash = Math.max(lot.flash, 0.6);
    this.game.vfx?.play('garden.lotus.land', { pos: lot.centre, normal: lot.up, dir: lot.up, tint: lot.glow });
  }

  update(raw = 1 / 60) {
    const R = this.game.realm; if (!R?.active || !this.group) return;
    if (R.site.lotuses.length !== this.count) { this.build(R); this.compile(); }
    const L = LOTUS_LOOK, dt = Math.min(0.05, Math.max(0, raw)), J = R.jarBody, cam = this.game.camera, mood = this.game.gardenMood?.now, lamps = mood?.lamps ?? 0;
    this.t += dt; this.U.uTime.value = this.t % 3600; this.U.uGlowK.value = 0.55 + 0.85 * lamps; if (mood?.leaf) this.U.uLeaf.value.copy(mood.leaf).multiplyScalar(1.7);
    // the flight: the arc's head with the Jar; down, the lotus across catches it
    if (this.flying) { const F = J?.flight; if (F) this.arcs.follow(F.t * F.t * (3 - 2 * F.t)); else { this.landed(this.flying.rev); this.flying = null; this.arcs.fade(); } }
    let nearest = null, nk = 0, moved = false, tinted = false;
    for (const lot of this.lotuses) {
      const d = J ? J.pos.distanceTo(lot.rec.pos) : 1e9, near = 1 - THREE.MathUtils.smoothstep(d, L.near[1], L.near[0]); lot.near = near;
      if (near > nk) { nk = near; nearest = lot; }
      if (lot.snap > 0) { lot.snap -= dt; lot.k += (L.snap.k - lot.k) * Math.min(1, dt * 35); lot.v = 0; if (lot.snap <= 0) lot.v = L.snap.fling; }
      else { const target = L.rest + (1 - L.rest) * near, a = (target - lot.k) * L.spring.stiff - lot.v * L.spring.damp; lot.v += a * dt; lot.k += lot.v * dt; }
      lot.flash = Math.max(0, lot.flash - dt * 1.4);
      const lit = 1 + 1.1 * near + 2.6 * lot.flash; if (Math.abs(lit - lot.lit) > 0.02) { this.tint(lot, lit); tinted = true; }
      if (lot.drawn === null || Math.abs(lot.k - lot.drawn) > 0.002 || cam.position.distanceToSquared(lot.rec.pos) < L.animate * L.animate) { this.pose(lot); moved = true; }
    }
    this.arcs.near(nearest?.arc, nk); this.arcs.update(dt, lamps);
    if (moved) this.petals.instanceMatrix.needsUpdate = true;
    if (tinted) for (const m of [this.petals, this.pods, this.stems]) m.instanceColor.needsUpdate = true;
  }

  /** A lotus's petals set to its openness (and its breath). */
  pose(lot, first = false) {
    const k = lot.k + LOTUS_LOOK.breath * Math.sin(this.t * 1.15 + lot.ph);
    for (const p of lot.petals) { const th = p.ring.bud + (p.ring.open - p.ring.bud) * k + p.jit; _r.makeRotationX(th).scale(p.scale); this.petals.setMatrixAt(p.idx, _m.multiplyMatrices(p.m, _r)); }
    lot.drawn = lot.k; if (first) this.tint(lot, 1);
  }
  /** A lotus's heart lit (its petals', its pod's) by `k` of its colour. */
  tint(lot, k) {
    lot.lit = k; _col.copy(lot.glow).multiplyScalar(k);
    for (const p of lot.petals) this.petals.setColorAt(p.idx, _col);
    this.pods.setColorAt(lot.i, _col); this.stems.setColorAt(lot.i, _col);
  }

  dispose(all = true) {
    if (this.group) { this.group.removeFromParent(); for (const m of [this.petals, this.pods, this.stems]) m?.dispose?.(); this.group = null; }
    this.arcs.dispose(all); for (const lot of this.lotuses) { delete lot.arc; }
    if (all && this.geo) { for (const g of Object.values(this.geo)) g.dispose(); this.mat.dispose(); this.geo = null; }
  }
}
const _m = new THREE.Matrix4(), _r = new THREE.Matrix4(), _col = new THREE.Color(), _c = new THREE.Color(), _n = new THREE.Vector3();
