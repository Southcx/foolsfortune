// ---------------------------------------------------------------------------------------
// JORMUNGANDR'S BODY (docs/plans/OPEN-SEA.md 14.3; Dovina's row: progress/opensea/seabeasts.js SEA_BEASTS.worldSerpent; Petra's chassis:
// creatures/seaserpent/, its holds in signatures.js): the world serpent, gall's legend, fought in three phases from the free helm. It IS
// the sea serpent's body (seaserpentbody.js SeaSerpentBody: the spine, the hide, the humps, the head, the gold line, the crazing, the
// ostinato), not a fork of it: that body is built in its own frame and drawn three times its size (JORM_LOOK.scale), so the hide is
// 11 m thick, the head 36 m long (a sloop's length), the humps 24 m high and 105 m apart, over a 600 m spine of 44 joints; the
// water's service is handed the world's points (a proxy), so the ripples land where it is drawn. Its own dress over it: the safari's
// green-bronze scale (egregoreshapes2.js worldSerpent) recoloured into the hide and the skull, metal in its sheen, a crown of spines
// round the skull's back, two long barbels off the jaw's corners and two off the chin, the horns longer; the film lit in Gall's colour.
//
// THE PHASES' LOOKS (as Petra's runtime holds them: `c.held` { move, t, hold, centre }):
//   circle     its body laid as a ring round the ship at `r`, humps breaking the surface all round in a running wave; the ring open
//              where its head and tail are (the gap: where it dives, its tail going under); a `gap` angle given dives the joints there
//   rise       the head reared high over the ship, its jaw parting (a fan of spit after: the serpent's own spit tell, 'spit')
//   coilWorld  a ring closing round where the ship was: the body spirals outward from `r` (one coil a body's breadth and a half
//              apart, so a small ring wraps it many times), its head reared on the ring and lit gold at the peak, the gold line
//              round the skull bright: that is where it is shot to break it
//   ram, spit, dive, breach (the ram led): the serpent's
//
// Prior art: the Prose Edda (Gylfaginning 48 and Hymiskviða: Thor fishing it up with an ox's head, the serpent that girdles Midgard,
// biting its own tail); the Altuna and Gosforth stones (its head on Thor's line); Olaus Magnus's Carta Marina (1539: the coils arched
// through the sea round a ship); God of War's Jörmungandr (a head the size of a ship over a body you never see the end of); Shadow of
// the Colossus's Phalanx and Monster Hunter's Dalamadur (a body that is the arena); the safari's own Jormungandr (egregoreshapes2.js).
//
//   const J = new JormungandrBody(game, { segments = 44, length = 600, seaY? })   (game.makeSeaBeast('worldSerpent', ...))
//   J.drive({ head, heading, rise, move: null|'ram'|'spit'|'dive'|'breach'|'rise'|'circle'|'coilWorld', k, coil?,
//             ring?: { centre: Vector3, r, gap? (rad, the ring's open side, from +x toward +z) }, held?: c.held })
//     ring for circle and coilWorld; else from `held` (its centre, and its radius: circle SIGNATURE.circle.r, coilWorld r0 .. r1 by
//     t / hold); neither given, the body follows the head's own path round (it is steered round the ring: still a ring)
//   J.update(dt)   J.hit('head' | 'coil', k)   J.down()   J.headPos   J.headRadius (13.7 m)   J.segmentsAt() -> [Vector3] (world)
//   J.radii (m, world)   J.parts() -> [{ id: 'head' | 'coil', i, pos, r, open }]   J.tris   J.dispose()   JORM_LOOK
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { SeaSerpentBody, SERPENT_LOOK } from '../seaserpentbody.js';
import { FoeKit, PAL } from '../../railfoes/kit.js';
import { limb } from '../egregorekit.js';
import { COLOR } from '../../../progress/weather.js';
import { SIGNATURE } from '../../../creatures/seaserpent/signatures.js';
import { SEA } from '../../../world/opensea/seaprops.js';

/** Its size on the serpent's: every length x `scale`; the spine (joints, m); the coil's pitch (x the hide's thickest breadth). */
export const JORM_LOOK = { scale: 3, segments: 44, length: 600, pitch: 1.5 };
const K = SERPENT_LOOK.scale, PI = Math.PI;
const GALL = new THREE.Color(COLOR.gall ?? 0x8a5ac8), GOLD = new THREE.Color(1.0, 0.651, 0.141);
const _v = new THREE.Vector3(), _c = new THREE.Color(), _d = new THREE.Color();
const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;

/** The serpent's Brine dress mapped to the world serpent's: its greys to the safari's green-bronze, the pearl to bronze. */
const DRESS = [[PAL.hide, 0x4a5a3a], [PAL.hideD, 0x2c3a22], [PAL.belly, 0xb8c0a0], [PAL.pearl, 0xd8c078], [PAL.barn, 0x8a7a50], [PAL.mouth, PAL.mouth], [PAL.tooth, 0xe8dcb0]];
const DRESS_LIN = DRESS.map(([a, b]) => [new THREE.Color(a), new THREE.Color(b)]);
function redress(geo) {
  const C = geo.attributes.color; if (!C) return;
  const A = C.array, h0 = DRESS_LIN[0][0], b0 = DRESS_LIN[2][0], h1 = DRESS_LIN[0][1], b1 = DRESS_LIN[2][1];
  const gx = b0.r - h0.r, gy = b0.g - h0.g, gz = b0.b - h0.b, gl = gx * gx + gy * gy + gz * gz;
  for (let i = 0; i < A.length; i += 3) {
    _c.setRGB(A[i], A[i + 1], A[i + 2]);
    let best = null, bd = Infinity;
    for (const [from, to] of DRESS_LIN) { const d = (from.r - _c.r) ** 2 + (from.g - _c.g) ** 2 + (from.b - _c.b) ** 2; if (d < bd) { bd = d; best = to; } }
    const t = Math.min(1, Math.max(0, ((_c.r - h0.r) * gx + (_c.g - h0.g) * gy + (_c.b - h0.b) * gz) / gl)); // (on the hide-to-belly shading: kept as a shading)
    const gd = (h0.r + gx * t - _c.r) ** 2 + (h0.g + gy * t - _c.g) ** 2 + (h0.b + gz * t - _c.b) ** 2;
    if (gd < bd) _d.copy(h1).lerp(b1, t); else _d.copy(best);
    A[i] = _d.r; A[i + 1] = _d.g; A[i + 2] = _d.b;
  }
  C.needsUpdate = true;
}

/** The crown, the barbels and the long horns, in the head's frame (the serpent's skull units: it is scaled with it). */
function buildDress() {
  const k = new FoeKit(), P = Math.PI, bronze = 0xc8a860, dark = 0x2c3a22;
  for (let i = 0; i < 9; i++) { // (the crown: spines round the skull's back, raked)
    const a = -P * 0.85 + (i / 8) * P * 1.7, x = Math.sin(a) * 0.62, y = 0.42 + Math.cos(a) * 0.42;
    k.add(new THREE.ConeGeometry(0.08, 1.15 + 0.5 * Math.cos(a), 5), { c: (_, yy) => (yy > y + 0.35 ? bronze : dark), fx: (_, yy) => [yy > y + 0.4 ? 0.9 : 0, 0, 0, 0], p: [x, y + 0.45, -0.05], r: [-0.9, 0, -Math.sin(a) * 0.7], g: 'crown' });
  }
  for (const s of [-1, 1]) {
    k.add(limb([[s * 0.3, 0.5, 0.15], [s * 0.6, 1.2, -0.7], [s * 0.7, 1.4, -1.9], [s * 0.55, 1.1, -2.7]], 0.15, 0.03, 10, 6), { c: bronze, fx: [0.25, 0, 0, 0], g: 'horns' });
    k.add(limb([[s * 0.36, -0.28, 2.3], [s * 0.7, -0.6, 2.0], [s * 0.9, -1.3, 1.2], [s * 0.85, -2.0, 0.2]], 0.06, 0.015, 10, 5), { c: dark, fx: [0.4, 0, 0, 0], g: 'barbels' });
    k.add(limb([[s * 0.1, -0.35, 2.0], [s * 0.15, -0.9, 1.9], [s * 0.1, -1.4, 1.5]], 0.045, 0.012, 8, 5), { c: dark, g: 'barbels' });
  }
  const b = k.build(), n = b.geo.attributes.position.count, U = b.geo.attributes.unit.array;
  for (let i = 0; i < n; i++) U[i * 2] = 1; // (the head's unit: its flash, its crazing, its gold line)
  b.geo.setAttribute('rest', new THREE.BufferAttribute(b.geo.attributes.position.array.slice(), 3));
  return b;
}

export class JormungandrBody {
  constructor(game, { segments = JORM_LOOK.segments, length = JORM_LOOK.length, seaY = SEA.y } = {}) {
    const sc = (this.sc = JORM_LOOK.scale), A = (this.anchor = new THREE.Vector3(0, seaY, 0));
    this.game = game; this.seaY = seaY; this.placed = false; this.t = 0;
    const proxy = { // (the serpent's game, in its own frame: the water handed world points)
      scene: null, get music() { return game.music; },
      water: { disturb: (x, z, s, kind) => game.water?.disturb?.(A.x + x * sc, A.z + z * sc, Math.min(1, s * 1.3), kind, seaY) },
    };
    this.inner = new SeaSerpentBody(proxy, { segments, length: length / sc, seaY: 0 });
    this.inner.layCoil = (C) => this.layRing(C); // (its coil laid as the world serpent's ring)
    const D = buildDress(); this.dress = new THREE.Mesh(D.geo, this.inner.mat); this.dress.userData.zone = 'opensea'; this.inner.head.add(this.dress);
    for (const m of [this.inner.hide, this.inner.head, this.inner.jaw]) redress(m.geometry);
    this.inner.mat.metalness = 0.32; this.inner.mat.roughness = 0.36; // (bronze in its sheen)
    this.group = new THREE.Group(); this.group.userData.zone = 'opensea'; this.group.scale.setScalar(sc); this.group.add(this.inner.group);
    this.joints = this.inner.joints.map(() => new THREE.Vector3()); this.radii = Float32Array.from(this.inner.radii, (r) => r * sc);
    this.headPos = new THREE.Vector3(); this.headRadius = this.inner.headRadius * sc;
    this.mode = null; this.ring = { centre: new THREE.Vector3(), r: 0, gap: null }; this.peak = 0;
    this._parts = [{ id: 'head', i: 0, pos: this.headPos, r: this.headRadius, open: false }, ...this.joints.slice(1).map((p, j) => ({ id: 'coil', i: j + 1, pos: p, r: this.radii[j + 1], open: false }))];
    this.tris = this.inner.tris + D.tris;
    game.scene?.add(this.group);
  }

  /** A world point into the serpent's own frame. */
  local(p, out) { return out.set((p.x - this.anchor.x) / this.sc, 0, (p.z - this.anchor.z) / this.sc); }

  drive({ head, heading = 0, rise = 0, move = null, k = 0, coil = null, ring = null, held = null } = {}) {
    if (!this.placed) { this.anchor.set(head.x, this.seaY, head.z); this.group.position.copy(this.anchor); this.placed = true; }
    k = Math.min(1, Math.max(0, k));
    const mv = move ?? held?.move ?? null, R = this.ring;
    let rg = ring;
    if (!rg && held?.centre && (mv === 'circle' || mv === 'coilWorld')) {
      const W = SIGNATURE.coilWorld, r = mv === 'circle' ? SIGNATURE.circle.r : held.r ?? W.r0 + (W.r1 - W.r0) * (1 - (held.t ?? 0) / (held.hold || 1));
      rg = { centre: held.centre, r };
    }
    this.mode = rg && (mv === 'circle' || mv === 'coilWorld') ? mv : null;
    this.peak = mv === 'coilWorld' ? (move === 'coilWorld' && !held ? k : 1) : 0;
    let m = mv, r = rise, c = null;
    if (this.mode) { this.local(rg.centre, R.centre); R.r = rg.r / this.sc; R.gap = rg.gap ?? null; m = 'coil'; c = R; }
    else if (mv === 'rise') { m = null; r = Math.max(rise, 0.75 + 0.25 * k); }
    else if (mv === 'breach') m = 'ram';
    else if (mv === 'circle' || mv === 'coilWorld') m = null;
    this.kRise = mv === 'rise' ? k : 0;
    if (coil && mv === 'coil') { this.local(coil.centre, R.centre); R.r = coil.r / this.sc; c = R; }
    this.inner.drive({ head: this.local(head, _v).clone(), heading, rise: r, move: m, k, coil: c });
  }

  /** The ring: circle a ring of humps round the centre, open between the head and the tail (and at `gap`); coilWorld a spiral outward
   *  from r, the head reared on its inside. Laid over the follow-the-leader joints by the serpent's coil weight. */
  layRing(C) {
    const S = this.inner, c = C.coil.centre, r0 = Math.max(C.coil.r, 2), w = S.coilW * S.coilW * (3 - 2 * S.coilW), t = S.t, Kl = K;
    const th0 = Math.atan2(C.head.z - c.z, C.head.x - c.x), fx = Math.sin(C.heading), fz = Math.cos(C.heading);
    const sign = fx * -Math.sin(th0) + fz * Math.cos(th0) >= 0 ? 1 : -1, world = this.mode === 'coilWorld';
    const pitch = JORM_LOOK.pitch * 2 * 1.05 * Kl; let th = th0, rr = r0;
    for (let i = 0; i < S.S; i++) {
      const sL = i * S.d, s = sL / S.L, head = 1 - sstep(0, 5 * Kl, sL);
      if (i > 0) { th -= sign * S.d / rr; if (world) rr = r0 + pitch * Math.abs(th - th0) / (2 * PI); }
      let y;
      if (world) y = S.seaY + Kl * (-0.5 + 0.9 * Math.sin(sL * 0.5 / Kl - t * 1.3) * (1 - head) + head * 6.5) - 0.25 * Kl * Math.abs(th - th0) / (2 * PI);
      else {
        y = S.seaY + Kl * (-0.6 + 1.3 * Math.sin(sL * 0.6 / Kl - t * 1.2)) * (1 - head) + head * Kl * 1.4;
        y -= 3 * Kl * sstep(0.82, 1, s); // (the tail going under: the ring's open side)
        if (C.coil.gap != null) { const dg = Math.abs(Math.atan2(Math.sin(th - C.coil.gap), Math.cos(th - C.coil.gap))); y = lerp(y, S.seaY - 2.8 * Kl, 1 - sstep(0.15, 0.35, dg)); }
      }
      _v.set(c.x + Math.cos(th) * (rr - head * (world ? 0.15 : 0) * rr * 0.4), y, c.z + Math.sin(th) * rr);
      S.joints[i].lerp(_v, w);
    }
  }

  hit(part = 'head', k = 0) { this.inner.hit(part === 'head' ? 'head' : 'coil', k); }
  down() { this.inner.down(); }
  segmentsAt() { return this.joints; }
  parts() {
    const U = this.inner.u.uParts.value, sea = this.seaY;
    for (const P of this._parts) P.open = P.i === 0 ? U[1].y > 0.5 : this.inner.dead < 0 && P.pos.y + P.r * 0.6 > sea;
    return this._parts;
  }

  update(dt) {
    if (!this.placed) return;
    this.t += dt;
    const S = this.inner;
    this.group.matrixWorld.identity(); S.group.matrixWorld.identity(); // (the serpent poses its head in its own frame: its skull's place is what it hands the water)
    S.update(dt);
    // its phase's looks over the serpent's: the circle's head kept low (no looking down from a ring), the rise's jaw, the coil's gold peak
    if (this.mode === 'circle' && S.coilW > 0.5) { S.head.rotation.x -= 0.35; S.head.updateMatrixWorld(true); S.headPos.set(0, 0.1, 1.2).applyMatrix4(S.head.matrixWorld); }
    if (this.kRise) S.jaw.rotation.x = Math.max(S.jaw.rotation.x, 0.55 * this.kRise);
    const U = S.u, live = S.dead < 0 ? 1 : 0, peak = this.peak * live;
    if (peak > 0) U.uParts.value[1].y = Math.max(U.uParts.value[1].y, sstep(0, 0.3, peak));
    U.uAspect.value.lerp(GALL, 0.5).lerp(GOLD, 0.45 * peak * (0.7 + 0.3 * Math.sin(this.t * 5)));
    // back to the world: the joints, the skull
    const A = this.anchor, sc = this.sc;
    for (let i = 0; i < this.joints.length; i++) this.joints[i].copy(S.joints[i]).multiplyScalar(sc).add(A);
    this.headPos.copy(S.headPos).multiplyScalar(sc).add(A);
    this.group.updateMatrixWorld(true);
  }

  dispose() { this.group.removeFromParent(); this.dress.geometry.dispose(); this.inner.dispose(); }
}
