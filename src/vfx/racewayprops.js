// ---------------------------------------------------------------------------------------
// THE RACEWAY'S PROPS (docs/plans/SKIFF-RACING.md section 12; Dovina's handoff of 2026-10-14, round six, items 1, 6, 7 and 8): four of
// her placeholders dressed into the Raceway's one look, glazed stone and gold, Lachrymite where Lachryma is.
//   - THE VEIN LANES (raceway.plates with `lane`; her 5 m slabs in `meshes`): Lachrymite in the sand, the cavern's veins' kin and not a sun
//     plate. A glow down the lane's middle and along both its edges, laid on the sand following the lane's curve, in the cavern veins'
//     pulse (a bright core leaded dark at its sides, so it reads on noon sand: vfx/racewaycavern.js pulseTexture), the pulses running the
//     race's way; spires of Lachrymite lining both edges like a pit lane's bollards, and a fretted stave and its lesser spires standing at
//     each end as the lane's gateposts (the cavern's own spires and crystal program): "the pool is here", read from far off. Ridden
//     (the board's plate a lane): the glow quickens and flares, Lachryma drawn up out of the sand into the hull (raceway.lane.drink), and
//     on coming on (skiff.refill) a cold ring and the gateposts' frets run foot to point. The sun plates' dress leaves them out (`vein`).
//   - THE POT SMASH'S POTS (pottrial.js; her InstancedMesh of cylinders hidden): the workshop's own pottery (world/props/pottery.js: its
//     lathe profiles, clay bodies and painted bands), thirty pots of six profiles about a metre tall, in the kit's clays with one in four
//     glazed lapis, each turned its own way; one merged draw. Smashed: that pot's triangles folded away, the house's own pot burst
//     (fx.shatterBurst, its body's numbers) and sherds of its colour thrown on the way the board goes (raceway.pot.smash).
//   - THE ANTLION CHASER (escape.js; her dark cone hidden in her `body`): the pits' maw come up out of the road (vfx/racewaypark.js: the
//     same throat in its ring of broken stone and the same tenmoku mandibles), in a berm of sand it ploughs up as it comes, the jaws
//     leaning on toward you and snapping, quicker as it closes; sand thrown up behind it in a rooster tail (raceway.antlion.spray), grit
//     off the tips at each snap (raceway.antlion.snap).
//   - THE CITY TRIAL'S PATCHES (citytrial.js; her octahedra hidden): a gem a patch whose shape says its kind as well as its colour: TOP a
//     tall spire, ACCEL an arrowhead, GRIP a toothed disc (a gear), POOL a droplet, FLARE a sun star; slowly turning and bobbing, in the
//     crystals' program; one instanced draw a kind. Taken: its facets burst out in its colour (raceway.patch.take).
// No words, no numbers. Every material is one already built: the Dunes' crystal program (vfx/crystalfrets.js, the cavern's identical
// parameters, instanced and instance-coloured), the veins' glow (the halos' mapped basic: raceway-glow's program), and the kit's
// vertex-coloured flat standard (the pots, the maw). No program added. Draw calls: the lanes 2 (glow, spires) in place of her ~75 slabs;
// the pots 1 in place of her 1; the chaser 3 (throat and berm, two jaws) in place of her 1; the patches 5 in place of her 1.
//
// Prior art: F-Zero's pit strip (energy back while on it, the strip read from far off by its own colour) and a pit lane's bollards;
// Zelda's pots and Crash's crates bursting in sherds; the antlion larva (Myrmeleontidae) and Crash Bandicoot's boulder chase, Sonic
// Adventure's orca (a chaser that ploughs the ground it follows); Kirby Air Ride's City Trial patches (a kind by its shape and colour);
// the house's own crystals (world/dunes/crystals.js), pottery (world/props/pottery.js, breakables.js) and maw (vfx/racewaypark.js).
//
//   game.racewayProps = new RacewayProps(game)   (main.js)   .update(dt)   (dresses each placeholder as it appears, and undresses it as it goes)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { crystalFretMaterial, CrystalFrets } from './crystalfrets.js';
import { RACEWAY_CAVERN, spireGeometry, pulseTexture } from './racewaycavern.js';
import { antlionThroat, antlionMandible } from './racewaypark.js';
import { LACHRYMA_TINT } from './racewayeffects.js';
import { PROFILES, prepProfile, buildPotGeometry } from '../world/props/pottery.js';
import { PATCHES } from '../world/raceway/citytrial.js';
import { ESCAPE } from '../world/raceway/escape.js';
import { sideOf } from '../world/raceway/kit.js';

/** The numbers. The lanes: samples along (m), the core's and the edges' widths, the glow's colour and brightness, ridden and flared, its
 *  pulses a real second (idle, ridden); the bollards (m apart, out past the edge, heights, widths); the gateposts (the stave's height and
 *  width, lesser spires). The pots: their profiles, heights (m), clays and glaze, one glazed in `glazed`. The chaser: its size, the
 *  berm's colours, the jaws' lean, open and closed, a snap's period far and near (real s), the spray's place behind it. The patches:
 *  each kind's gem height (m), their turn (rad a real second), bob (m, Hz), glow. */
export const RACEWAY_PROPS = {
  lane: { step: 2.5, core: 2.0, edge: 0.8, colour: LACHRYMA_TINT, k: 1.1, ridden: 1.8, flash: 1.4, pulse: [0.45, 1.6],
    bollard: { every: 3.5, out: 0.3, h: [0.5, 1.1], w: [0.2, 0.3] }, gate: { h: [2.0, 2.7], w: 0.62, lesser: 3 } },
  pots: { kinds: ['amphora', 'urn', 'tsubo', 'jar', 'pitcher', 'ember'], h: [0.85, 1.15], clays: [0xc9744a, 0xd9906a, 0xb8692e, 0xa8643a], glaze: 0x2c3f8f, glazed: 4 },
  chaser: { scale: 1.15, berm: { crest: 0xd8a070, shade: 0xc98a52, inner: 0x6a4028 }, lean: 0.55, open: 0.62, shut: 0.06, period: [1.2, 0.55], spray: 3.2 },
  patch: { h: 1.5, turn: 1.1, bob: [0.12, 0.6], glow: 0.4 },
};
const C = RACEWAY_PROPS, X = RACEWAY_CAVERN.crystal, UP = new THREE.Vector3(0, 1, 0);
const hash = (n) => { const x = Math.sin(n * 127.1) * 43758.5453; return x - Math.floor(x); };
const lerp = (a, b, t) => a + (b - a) * t;
const _c = new THREE.Color(), _q = new THREE.Quaternion(), _m = new THREE.Matrix4(), _s = new THREE.Vector3(), _v = new THREE.Vector3(), _e = new THREE.Euler();

/** The crystals' material, the cavern's very parameters (its program); `emissive` a uniform only. */
const crystalMaterial = (emissive = X.emissive, k = X.glow, base = X.base) => crystalFretMaterial({ color: 0xffffff, emissive, emissiveIntensity: k, roughness: 0.22, metalness: 0.15, flatShading: true }, base);
/** The kit's vertex-coloured flat standard (world/raceway/kit.js, breakables.js's potMat): its program. */
const clayMaterial = (roughness = 0.82) => new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness, metalness: 0, flatShading: true });
/** Position and normal only, non-indexed (the crystals' geometry's attributes). */
const bare = (geo) => { const g = geo.index ? geo.toNonIndexed() : geo; for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal') g.deleteAttribute(k); return g; };
/** Position, normal and a colour a vertex, non-indexed (the kit's). */
const painted = (geo, paint) => { const g = bare(geo), P = g.attributes.position, a = new Float32Array(P.count * 3); for (let i = 0; i < P.count; i++) _c.set(paint(P.getY(i), i)).toArray(a, i * 3); g.setAttribute('color', new THREE.BufferAttribute(a, 3)); return g; };

export class RacewayProps {
  constructor(game, o = {}) {
    this.game = game; this.parent = o.parent || null; this.vfxOf = () => o.vfx || game.vfx;
    this.t = 0; this.R = null; this.lanes = null; this.pots = null; this.ant = null; this.gems = null;
    const E = o.events || game.events;
    E?.on('skiff.refill', () => this.laneEnter());
  }
  parentOf() { return this.parent || this.game.scene; }
  add(o) { o.userData.zone = 'raceway'; this.parentOf().add(o); return o; }
  skiff() { const S = this.game.player?.techs?.get?.('skiff'); return S?.active ? S : null; }

  update(dt) {
    const g = this.game, R = g.raceway;
    if (R?.built && R.plates?.length && this.R !== R) { this.undressLanes(); this.R = R; this.dressLanes(R); }
    if (!this.R || R?.active === false) return;
    this.t += dt;
    const Rs = g.race?.rulesets, P = Rs?.pots, E = Rs?.escape, Ct = g.cityTrial;
    if (P?.mesh !== (this.pots?.src ?? null)) { this.clearPots(); if (P?.mesh) this.dressPots(P); }
    if (E?.body !== (this.ant?.src ?? null)) { this.clearAnt(); if (E?.body) this.dressAnt(E); }
    if (Ct?.mesh !== (this.gems?.src ?? null)) { this.clearGems(); if (Ct?.mesh) this.dressGems(Ct); }
    this.stepLanes(dt); this.stepPots(); this.stepAnt(dt, E); this.stepGems();
  }

  // ---------------------------------------------------------------- the vein lanes
  dressLanes(R) {
    const list = R.plates.filter((p) => p.lane); if (!list.length) return;
    const L = C.lane, pos = [], uv = [], idx = [], spires = [];
    const strip = (T, Pl, lat, w) => { // (a ribbon on the sand `w` wide, `lat` off the lane's middle, sampled along its curve)
      const base = pos.length / 3, n = Math.max(2, Math.ceil((Pl.s1 - Pl.s0) / L.step) + 1);
      for (let i = 0; i < n; i++) {
        const s = lerp(Pl.s0, Pl.s1, i / (n - 1)), F = T.frame(s), rx = -F.fz, rz = F.fx, c = sideOf(R, T, s, Pl.lat + lat), v = (s - Pl.s0) / 1.75;
        for (const [sd, u] of [[-1, 0], [1, 1]]) { const x = c.x + rx * sd * w / 2, z = c.z + rz * sd * w / 2; pos.push(x, R.heightAt(x, z) + 0.06, z); uv.push(u, v); } // (the cavern's winding: +s then -s, up)
        if (i) { const a = base + (i - 1) * 2, b = base + i * 2; idx.push(a, a + 1, b, a + 1, b + 1, b); }
      }
    };
    const ground = (p) => { p.y = R.heightAt(p.x, p.z) - 0.1; return p; };
    this.lanes = { list, staves: new Map(), flash: 0, ride: 0, offset: 0, drinkH: null };
    for (const Pl of list) {
      const T = R.tracks.find((t) => t.id === Pl.track); if (!T) continue;
      strip(T, Pl, 0, L.core);
      for (const sd of [-1, 1]) strip(T, Pl, sd * (Pl.w - 0.35), L.edge);
      // the bollards: small spires lining both edges, leaning out, the two sides out of step
      const len = Pl.s1 - Pl.s0, B = L.bollard;
      for (const sd of [-1, 1]) for (let u = sd > 0 ? B.every / 2 : 0; u <= len; u += B.every) {
        const s = Pl.s0 + u, F = T.frame(s), out = new THREE.Vector3(-F.fz * sd, 0, F.fx * sd), k = Pl.index * 31 + u * 7 + sd;
        spires.push({ pos: ground(sideOf(R, T, s, Pl.lat + sd * (Pl.w + B.out))), dir: UP.clone().addScaledVector(out, 0.35).addScaledVector(new THREE.Vector3(F.fx, 0, F.fz), (hash(k) - 0.5) * 0.3).normalize(), h: lerp(B.h[0], B.h[1], hash(k * 3)), w: lerp(B.w[0], B.w[1], hash(k * 5)), lane: Pl.index });
      }
      // the gateposts: a fretted stave and its lesser spires at each end, both sides
      const G = L.gate, staves = [];
      for (const [e, s] of [[0, Pl.s0], [1, Pl.s1]]) for (const sd of [-1, 1]) {
        const F = T.frame(s), out = new THREE.Vector3(-F.fz * sd, 0, F.fx * sd), fwd = new THREE.Vector3(F.fx, 0, F.fz), foot = ground(sideOf(R, T, s, Pl.lat + sd * (Pl.w + 0.9))), k = Pl.index * 13 + e * 5 + sd;
        const st = { pos: foot, dir: UP.clone().addScaledVector(out, 0.12).normalize(), h: lerp(G.h[0], G.h[1], hash(k)), w: G.w, stave: true, lane: Pl.index };
        spires.push(st); staves.push(st);
        for (let j = 0; j < G.lesser; j++) {
          const a = (j / G.lesser) * Math.PI * 2 + hash(k + j), off = new THREE.Vector3(Math.cos(a), 0, Math.sin(a)), p = ground(foot.clone().addScaledVector(off, 0.45));
          spires.push({ pos: p, dir: UP.clone().addScaledVector(off, 0.45).addScaledVector(fwd, 0.1).normalize(), h: 0.6 + 0.7 * hash(k * 7 + j), w: 0.25 + 0.15 * hash(k + j * 3), lane: Pl.index });
        }
      }
      this.lanes.staves.set(Pl.index, staves);
      for (const m of Pl.meshes || [Pl.mesh]) if (m) m.visible = false; // (her slabs)
    }
    // the glow: one draw for every lane (the cavern veins' material, its own clone of the pulse so its clock is its own)
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx);
    const map = pulseTexture().clone(); map.needsUpdate = true;
    const mat = (this.lanes.mat = new THREE.MeshBasicMaterial({ name: 'raceway-lane-glow', map, color: L.colour, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
    const glow = (this.lanes.glow = new THREE.Mesh(geo, mat)); glow.name = 'raceway-lane-glow'; glow.renderOrder = 3; glow.frustumCulled = false; this.add(glow);
    // the spires: one instanced draw in the crystals' program
    const cm = (this.lanes.crystalMat = crystalMaterial()), mesh = (this.lanes.spires = new THREE.InstancedMesh(spireGeometry(), cm, spires.length));
    mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(spires.length * 3), 3);
    const frets = (this.lanes.frets = new CrystalFrets(mesh)), base = new THREE.Color(X.base), lach = new THREE.Color(X.lach);
    spires.forEach((s, i) => {
      _q.setFromUnitVectors(UP, s.dir); mesh.setMatrixAt(i, _m.compose(s.pos, _q, _s.set(s.w, s.h, s.w)));
      mesh.setColorAt(i, s.stave ? base : _c.copy(lach).lerp(base, 0.25)); frets.set(i, s.pos.y, s.h * s.dir.y, s.stave ? 1 : 0); s.i = i;
    });
    mesh.castShadow = mesh.receiveShadow = false; mesh.frustumCulled = false; mesh.name = 'raceway-lane-spires'; this.add(mesh); // (no shadow: as the cavern's, no instanced depth program added)
  }
  /** The board coming onto a lane (skiff.refill): a cold ring under it, its gateposts' frets run foot to point. */
  laneEnter() {
    const Ln = this.lanes, S = this.skiff(), Pl = S?.lastPlate; if (!Ln || !Pl?.lane) return;
    const at = this.game.player?.pos; if (at) this.vfxOf()?.play('raceway.lane.enter', { pos: _v.copy(at).setY(this.R.heightAt(at.x, at.z)), normal: UP });
    Ln.flash = 1; for (const st of Ln.staves.get(Pl.index) || []) Ln.frets.run(st.i);
  }
  stepLanes(dt) {
    const Ln = this.lanes, L = C.lane; if (!Ln?.mat) return;
    const S = this.skiff(), on = !!S?.lastPlate?.lane;
    Ln.ride += ((on ? 1 : 0) - Ln.ride) * Math.min(1, dt * 6); Ln.flash = Math.max(0, Ln.flash - dt / 0.6);
    Ln.offset = (Ln.offset + dt * lerp(L.pulse[0], L.pulse[1], Ln.ride)) % 1; Ln.mat.map.offset.y = -Ln.offset; // (the pulses run the race's way, quicker ridden)
    Ln.mat.color.set(L.colour).multiplyScalar(L.k * (0.85 + 0.15 * Math.sin(this.t * 1.3)) + (L.ridden - L.k) * Ln.ride + L.flash * Ln.flash);
    Ln.crystalMat.emissiveIntensity = X.glow * (0.9 + 0.1 * Math.sin(this.t * 0.6) + 0.6 * Ln.ride);
    Ln.frets.update(dt, this.game.daylight?.k?.day ?? 0);
    if (on && !Ln.drinkH?.alive) {
      const follow = (h) => { const B = this.skiff(); if (!B?.lastPlate?.lane) return false; const p = this.game.player.pos; h.pos.set(p.x, this.R.heightAt(p.x, p.z) + 0.1, p.z); if (B.v) h.ctx.vel = B.v; h.ctx.phase = this.t * 0.3; return true; };
      Ln.drinkH = this.vfxOf()?.play('raceway.lane.drink', { follow, dir: UP, phase: 0 }); if (Ln.drinkH) follow(Ln.drinkH);
    }
  }
  undressLanes() {
    const Ln = this.lanes; if (!Ln) return;
    Ln.drinkH?.stop?.();
    for (const o of [Ln.glow, Ln.spires]) { o?.removeFromParent(); o?.geometry?.dispose(); }
    Ln.mat?.map?.dispose(); Ln.mat?.dispose(); Ln.crystalMat?.dispose(); Ln.spires?.dispose();
    for (const Pl of Ln.list) for (const m of Pl.meshes || [Pl.mesh]) if (m) m.visible = true;
    this.lanes = null; this.R = null;
  }

  // ---------------------------------------------------------------- the pot smash's pots
  dressPots(PT) {
    const K = C.pots, pots = PT.pots || [], parts = [], ranges = []; let at = 0;
    pots.forEach((p, k) => {
      const kind = K.kinds[Math.floor(hash(k * 3.7 + 1) * K.kinds.length)], def = PROFILES[kind], top = def.pts[def.pts.length - 1][1];
      const P = prepProfile(kind, lerp(K.h[0], K.h[1], hash(k * 5.3)) / top), colour = (k % K.glazed === 2) ? K.glaze : K.clays[Math.floor(hash(k * 9.1) * K.clays.length)];
      const geo = buildPotGeometry(P, colour); geo.applyMatrix4(_m.compose(_v.set(p.x, p.y, p.z), _q.setFromAxisAngle(UP, hash(k * 2.9) * Math.PI * 2), _s.set(1, 1, 1)));
      for (const n of Object.keys(geo.attributes)) if (!['position', 'normal', 'color'].includes(n)) geo.deleteAttribute(n);
      const count = geo.attributes.position.count; parts.push(geo); ranges.push({ start: at, count, colour, M: P.M, h: P.height, up: true }); at += count;
    });
    if (!parts.length) return;
    const geo = mergeGeometries(parts); parts.forEach((g) => g.dispose());
    const mesh = new THREE.Mesh(geo, (this.potMat ||= clayMaterial())); mesh.castShadow = mesh.receiveShadow = true; mesh.frustumCulled = false; mesh.name = 'raceway-pots';
    PT.mesh.visible = false; this.add(mesh);
    this.pots = { src: PT.mesh, trial: PT, mesh, ranges };
  }
  stepPots() {
    const Q = this.pots; if (!Q) return;
    const g = this.game, pots = Q.trial.pots, A = Q.mesh.geometry.attributes.position; let dirty = false;
    for (let k = 0; k < Q.ranges.length; k++) {
      const r = Q.ranges[k], p = pots[k]; if (!r.up || !p || p.up) continue;
      r.up = false; dirty = true;
      for (let i = r.start; i < r.start + r.count; i++) A.setXYZ(i, p.x, p.y, p.z); // (its triangles folded to a point: gone, the draw kept)
      const S = this.skiff(), dir = S?.v?.lengthSq?.() > 0.01 ? _v.copy(S.v).normalize().addScaledVector(UP, 0.6).normalize() : UP.clone(), c = new THREE.Vector3(p.x, p.y + r.h * 0.45, p.z);
      g.fx?.shatterBurst?.(c, Math.max(0.6, r.h), dir, r.M); // (the house's own pot burst: dust and chips by its clay body)
      this.vfxOf()?.play('raceway.pot.smash', { pos: c, dir, tint: r.colour });
    }
    if (dirty) A.needsUpdate = true;
  }
  clearPots() {
    const Q = this.pots; if (!Q) return;
    Q.mesh.removeFromParent(); Q.mesh.geometry.dispose(); if (Q.src) Q.src.visible = true; this.pots = null;
  }

  // ---------------------------------------------------------------- the antlion chaser
  dressAnt(E) {
    const K = C.chaser, body = E.body, mat = (this.clayVc ||= clayMaterial(0.5));
    for (const c of body.children) c.visible = false; // (her cone)
    // the berm it ploughs up: a ring of sand round the throat, its crest outside the stones
    const prof = [[2.5, 0.05], [3.0, 0.6], [3.7, 1.15], [4.4, 0.8], [5.4, 0.1], [5.9, -0.3]].map(([r, y]) => new THREE.Vector2(r, y));
    const berm = painted(new THREE.LatheGeometry(prof, 16), (y) => (y > 0.9 ? K.berm.crest : y > 0.3 ? K.berm.shade : y > 0 ? K.berm.inner : K.berm.shade));
    const throat = antlionThroat(), mouth = new THREE.Mesh(mergeGeometries([throat, berm]), mat); throat.dispose(); berm.dispose(); // (both position, colour, normal)
    const root = new THREE.Group(); root.name = 'antlion-chaser'; root.position.y = -2; root.scale.setScalar(K.scale); root.add(mouth);
    const head = new THREE.Group(); head.position.y = 0.2; head.rotation.x = K.lean; root.add(head);
    const jaws = [-1, 1].map((sd) => { const j = new THREE.Mesh(antlionMandible(sd), mat); j.position.set(sd * 1.6, 0, 0); head.add(j); return j; });
    for (const m of [mouth, ...jaws]) m.castShadow = true;
    body.add(root);
    this.ant = { src: body, root, head, jaws, mouth, ph: 0, snapped: false, sprayH: null };
  }
  stepAnt(dt, E) {
    const A = this.ant; if (!A || !E) return;
    const K = C.chaser, gap = Math.max(0, (E.mine ?? 0) - (E.d ?? 0)), near = 1 - Math.min(1, gap / (ESCAPE.near * 3));
    const period = lerp(K.period[0], K.period[1], near);
    A.ph += dt / period;
    if (A.ph >= 1) { A.ph %= 1; A.snapped = false; }
    const shut = A.ph < 0.12, open = shut ? 1 - A.ph / 0.12 : Math.min(1, (A.ph - 0.12) / 0.5); // (a quick bite, a slow opening)
    const k = K.shut + (K.open - K.shut) * (shut ? open * open : 1 - (1 - open) * (1 - open));
    A.jaws.forEach((j, i) => { j.rotation.z = (i ? -1 : 1) * k; });
    A.head.rotation.x = K.lean + 0.08 * Math.sin(this.t * 7) * (0.4 + near);
    if (shut && A.ph > 0.08 && !A.snapped) { A.snapped = true; A.head.updateWorldMatrix(true, false); this.vfxOf()?.play('raceway.antlion.snap', { pos: A.head.localToWorld(_v.set(0, 4, 0)), dir: UP }); }
    if (!A.sprayH?.alive) {
      const follow = (h) => { const B = this.ant; if (B !== A || !A.src.parent) return false; const b = A.src, fwd = _s.set(Math.sin(b.rotation.y), 0, Math.cos(b.rotation.y));
        h.pos.copy(b.position).addScaledVector(fwd, -K.spray).setY(b.position.y - 1.6); h.dir.copy(fwd).multiplyScalar(-0.55).addScaledVector(UP, 0.85).normalize(); return true; };
      A.sprayH = this.vfxOf()?.play('raceway.antlion.spray', { follow, dir: UP }); if (A.sprayH) follow(A.sprayH);
    }
  }
  clearAnt() {
    const A = this.ant; if (!A) return;
    A.sprayH?.stop?.(); A.root.removeFromParent(); A.mouth.geometry.dispose(); A.jaws.forEach((j) => j.geometry.dispose());
    for (const c of A.src.children) c.visible = true; this.ant = null;
  }

  // ---------------------------------------------------------------- the City Trial's patches
  /** Each kind's gem, about `h` tall, standing on its middle (position and normal only). */
  gemGeometry(kind) {
    const h = C.patch.h, parts = [];
    if (kind === 'top') { // a tall spire: a hexagonal prism pointed long above and short below
      parts.push(new THREE.CylinderGeometry(0.3, 0.3, h * 0.3, 6, 1), new THREE.ConeGeometry(0.3, h * 0.5, 6).translate(0, h * 0.4, 0), new THREE.ConeGeometry(0.3, h * 0.2, 6).rotateX(Math.PI).translate(0, -h * 0.25, 0));
    } else if (kind === 'accel') { // an arrowhead pointing up, notched behind, faceted (a bevelled extrusion)
      const s = new THREE.Shape([[0, 0.75], [0.6, -0.35], [0.22, -0.2], [0, -0.45], [-0.22, -0.2], [-0.6, -0.35]].map(([x, y]) => new THREE.Vector2(x * h * 0.7, y * h * 0.7)));
      parts.push(new THREE.ExtrudeGeometry(s, { depth: 0.16, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.05, bevelSegments: 1 }).translate(0, 0, -0.08));
    } else if (kind === 'grip') { // a toothed disc stood on edge: a faceted wheel, its teeth round the rim
      const r = h * 0.32, n = 9; parts.push(new THREE.CylinderGeometry(r, r, 0.3, n * 2, 1).rotateX(Math.PI / 2));
      for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; parts.push(new THREE.BoxGeometry(0.2, 0.2, 0.3).rotateZ(a).translate(Math.cos(a) * (r + 0.08), Math.sin(a) * (r + 0.08), 0)); }
      parts.push(new THREE.CylinderGeometry(r * 0.35, r * 0.35, 0.42, 6, 1).rotateX(Math.PI / 2)); // (the hub)
    } else if (kind === 'pool') { // a droplet: round below, drawn to a point above (a faceted lathe)
      const pts = []; for (let i = 0; i <= 8; i++) { const t = i / 8, y = -0.5 + t * 1.25, r = t < 0.45 ? Math.sin((t / 0.45) * Math.PI / 2) * 0.45 : 0.45 * Math.pow(1 - (t - 0.45) / 0.55, 1.4); pts.push(new THREE.Vector2(Math.max(0.001, r) * h * 0.75, y * h * 0.75)); }
      pts[0].x = 0.001; parts.push(new THREE.LatheGeometry(pts, 8));
    } else { // flare: a sun star stood on edge, eight rays round a faceted heart
      parts.push(new THREE.IcosahedronGeometry(h * 0.2, 0));
      for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2, L = h * (i % 2 ? 0.22 : 0.34); parts.push(new THREE.ConeGeometry(0.12, L, 4).translate(0, h * 0.18 + L / 2, 0).rotateZ(a - Math.PI / 2)); }
    }
    const geo = mergeGeometries(parts.map((p) => bare(p))); parts.forEach((p) => p.dispose()); geo.computeVertexNormals(); return geo;
  }
  dressGems(Ct) {
    const list = Ct.patches || [], byKind = {};
    list.forEach((p, k) => (byKind[p.kind] ||= []).push(k));
    const kinds = [];
    for (const [kind, idx] of Object.entries(byKind)) {
      const col = PATCHES[kind]?.colour ?? 0xffffff, mat = crystalMaterial(new THREE.Color(col).multiplyScalar(C.patch.glow).getHex(), 1, col);
      const mesh = new THREE.InstancedMesh(this.gemGeometry(kind), mat, idx.length); mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(idx.length * 3), 3);
      const frets = new CrystalFrets(mesh); idx.forEach((k, i) => { mesh.setColorAt(i, _c.set(col)); frets.set(i, 0, 1, 0); }); // (no frets: the gem is its colour)
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); mesh.castShadow = mesh.receiveShadow = false; mesh.frustumCulled = false; mesh.name = `raceway-patch-${kind}`; this.add(mesh);
      kinds.push({ kind, idx, mesh, mat, col, up: idx.map(() => true) });
    }
    Ct.mesh.visible = false;
    this.gems = { src: Ct.mesh, trial: Ct, kinds };
  }
  stepGems() {
    const G = this.gems; if (!G) return;
    const P = C.patch, list = G.trial.patches || [];
    for (const K of G.kinds) {
      K.idx.forEach((k, i) => {
        const p = list[k], ph = hash(k * 4.1) * Math.PI * 2; if (!p) return;
        if (!p.up) { if (K.up[i]) { K.up[i] = false; this.vfxOf()?.play('raceway.patch.take', { pos: _v.set(p.x, p.y, p.z), tint: K.col }); } K.mesh.setMatrixAt(i, _m.makeScale(0, 0, 0)); return; }
        _q.setFromEuler(_e.set(0, this.t * P.turn + ph, 0));
        K.mesh.setMatrixAt(i, _m.compose(_v.set(p.x, p.y + P.bob[0] * Math.sin(this.t * P.bob[1] * Math.PI * 2 + ph), p.z), _q, _s.set(1, 1, 1)));
      });
      K.mesh.instanceMatrix.needsUpdate = true;
    }
  }
  clearGems() {
    const G = this.gems; if (!G) return;
    for (const K of G.kinds) { K.mesh.removeFromParent(); K.mesh.geometry.dispose(); K.mat.dispose(); K.mesh.dispose(); }
    this.gems = null; // (her mesh is hers: disposed by the trial)
  }
}
