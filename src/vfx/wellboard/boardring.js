// ---------------------------------------------------------------------------------------
// A RING OF THE WELL'S BOARD, DRAWN (docs/plans/WELL-BOARD.md 10): one floor of the board (progress/wellboard/layout.js: twelve
// spaces round to its door, one side line) as a floating wheel in the void. A DRAFT LOOK, a free hand's.
//
//   THE DECK     an annulus with the Well's shaft through its middle (the floor below is seen down it), its top the painted wheel
//                (boardkit.js deckTexture), its walls in the film
//   THE PADS     one a space: a cream foot, a body in its kind's colour, its icon on a pale plate (Mario Party's pads: one colour a
//                job). The main line stands on the deck; a short cut crosses the shaft as stepping pads in the air; a long way
//                floats outside the rim. A pad worked (a floor cleared, a cache taken) greys and wears a check.
//   THE DOOR     an arch on its pad, its portal dark while shut and turning in the film once the ring's two floors are cleared;
//                the FOE's space wears an eye instead, shut while it sleeps
//   THE HEART    over the shaft, an armillary of three gold hoops round a stellated core, and a lit orb a key of the door
//   THE STRAY    a dark burr with one red eye over the pad the ring's stray stands on; A SNARE: a toothed hoop turning on its pad
//   THE REACH    a hoop over each pad a picked die could land on, heavier the likelier, the pad lifted
//
// Prior art: Mario Party's pads and Dokapon Kingdom's board spaces; an armillary sphere; the zodiac wheel; Super Mario Galaxy's
// floating platforms (a path that is plainly a toy and plainly in space).
//
//   new BoardRing(floor, depth, { need }) -> .group   .at(id) -> Vector3 (world)   .sync(state, keys)   .reach({ id: k })   .update(t, dt)
//   ringY(depth)   spot(space) -> { x, y, z } (in the ring's own frame)   RING (the sizes)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { BOARD } from '../../progress/wellboard/layout.js';
import { toy, iconTexture, deckTexture, PAD } from './boardkit.js';

export const RING = { r: 9, inner: 6.3, outer: 11.5, drop: 15, short: 0.5, long: 1.4, pad: 1.05 };
export const ringY = (depth) => -depth * RING.drop;
const N = BOARD.main;

/** Where a space stands in its ring's frame: the main line round the wheel, the door at the far side from the first view, going
 *  clockwise; a short cut inside over the shaft, lifted as a bridge; a long way outside, floating. */
export function spot(s) {
  if (s.kind === 'mouth') { const a = (-90 * Math.PI) / 180; return { x: Math.cos(a) * (RING.r + 3.6), y: 1.1, z: Math.sin(a) * (RING.r + 3.6), a }; }
  const a = ((-90 + (s.x + 1) * (360 / N)) * Math.PI) / 180, k = s.y < 0 ? RING.short : s.y > 0 ? RING.long : 1;
  return { x: Math.cos(a) * RING.r * k, y: s.y < 0 ? 1.3 : s.y > 0 ? 0.9 : 0, z: Math.sin(a) * RING.r * k, a };
}

const padGeo = new THREE.CylinderGeometry(RING.pad, RING.pad * 1.07, 0.36, 32), footGeo = new THREE.CylinderGeometry(RING.pad * 1.14, RING.pad * 1.26, 0.2, 32);
const hoopGeo = new THREE.TorusGeometry(RING.pad * 1.42, 0.085, 8, 40), dotGeo = new THREE.CylinderGeometry(0.26, 0.3, 0.12, 14);

export class BoardRing {
  constructor(floor, depth, { need = BOARD.need, mouth = null } = {}) {
    this.depth = depth; this.need = need; this.pads = {}; this.spin = [];
    const G = (this.group = new THREE.Group()); G.name = `WellBoardRing:${depth}`; G.position.y = ringY(depth);
    // the deck: the painted top, the walls, the underside
    const top = new THREE.Mesh(new THREE.RingGeometry(RING.inner, RING.outer, 96, 1), toy({ map: (this.deck = deckTexture(depth)), mapOn: 1 })); top.rotation.x = -Math.PI / 2; G.add(top);
    const wall = (r0, r1, side) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r0, r1, 1.1, 96, 1, true), toy({ color: 0x3a1c6e, film: 0.85, side })); m.position.y = -0.55; G.add(m); };
    wall(RING.outer, RING.outer - 0.9, THREE.FrontSide); wall(RING.inner, RING.inner + 0.7, THREE.BackSide);
    const under = new THREE.Mesh(new THREE.RingGeometry(RING.inner + 0.7, RING.outer - 0.9, 96, 1), toy({ color: 0x1a0d2e, film: 0.5 })); under.rotation.x = Math.PI / 2; under.position.y = -1.1; G.add(under);
    // the pads
    const spaces = Object.values(floor.spaces); if (mouth) spaces.push(mouth);
    for (const s of spaces) this.addPad(s);
    // stepping dots along the side line and to the mouth
    const by = Object.fromEntries(spaces.map((s) => [s.id, s]));
    for (const s of spaces) for (const n of s.next) if (by[n] && (s.side || by[n].side || s.kind === 'mouth')) this.dots(spot(s), spot(by[n]));
    // the heart over the shaft
    const H = (this.heart = new THREE.Group()); H.position.y = 2.2; G.add(H);
    for (const [r, i] of [[3.3, 0], [2.8, 1], [2.3, 2]]) { const h = new THREE.Mesh(new THREE.TorusGeometry(r, 0.07, 8, 64), toy({ color: 0xffd36a, film: 0.35, glow: 0.15 })); h.rotation.set(i * 1.1, i * 0.7, 0); H.add(h); this.spin.push([h, 0.25 + i * 0.13, i]); }
    this.core = new THREE.Mesh(new THREE.IcosahedronGeometry(1.0, 0), toy({ color: 0xffffff, film: 1, flat: true, glow: 0.25 })); H.add(this.core);
    const spike = new THREE.Mesh(new THREE.OctahedronGeometry(1.55, 0), toy({ color: 0xffd36a, film: 0.6, flat: true, alpha: 0.35 })); H.add(spike); this.spike = spike;
    this.keys = [...Array(need)].map((_, i) => { const k = new THREE.Mesh(new THREE.SphereGeometry(0.32, 16, 12), toy({ color: 0xffd36a, glow: 0 })); H.add(k); return k; });
    // the ring's stray: a dark burr with one red eye, hung over the pad it stands on (rules.js: it walks a d4 a round)
    const T = (this.stray = new THREE.Group()); T.visible = false; G.add(T);
    T.add(new THREE.Mesh(new THREE.IcosahedronGeometry(0.62, 0), toy({ color: 0x1a0d1f, film: 0.6, flat: true })));
    for (let i = 0; i < 8; i++) { const a = (i * Math.PI) / 4, c = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.7, 5), toy({ color: 0xd0103a, flat: true, glow: 0.3 })); c.position.set(Math.cos(a) * 0.85, Math.sin(i * 1.7) * 0.3, Math.sin(a) * 0.85); c.rotation.z = -Math.PI / 2 + 0; c.lookAt(c.position.clone().multiplyScalar(2)); c.rotateX(Math.PI / 2); T.add(c); }
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.26, 12, 10), toy({ color: 0xff2a4a, glow: 1.2 })); eye.position.y = 0.45; T.add(eye);
    this.snares = {}; this.strayAt = null;
    this.sync({ seats: [{ cleared: {} }], taken: {}, snares: {}, stray: {} }, 0);
  }

  addPad(s) {
    const P = spot(s), C = PAD[s.kind] || PAD['?'], g = new THREE.Group(); g.position.set(P.x, P.y, P.z); g.rotation.y = -P.a - Math.PI / 2; // (its icon reads from outside the wheel)
    const foot = new THREE.Mesh(footGeo, toy({ color: 0xfff1d6 })); foot.position.y = 0.1; g.add(foot);
    const body = new THREE.Mesh(padGeo, toy({ color: C.color, top: C.top, map: iconTexture(s.kind, s.shift), mapOn: 2, film: s.kind === 'foe' ? 0.5 : 0.08 })); body.position.y = 0.38; g.add(body);
    const hoop = new THREE.Mesh(hoopGeo, toy({ color: 0xc9a7ff, film: 0.7, glow: 0.9 })); hoop.rotation.x = Math.PI / 2; hoop.position.y = 0.9; hoop.visible = false; g.add(hoop);
    const pad = (this.pads[s.id] = { s, g, body, foot, hoop, kind: s.kind, y: P.y, lift: 0, k: 0, worked: false });
    if (s.side || s.kind === 'mouth') { const stem = new THREE.Mesh(new THREE.ConeGeometry(0.9, 1.6, 7), toy({ color: 0x3a1c6e, film: 0.8, flat: true })); stem.rotation.x = Math.PI; stem.position.y = -0.8; g.add(stem); } // (a floating pad: a shard under it)
    if (s.kind === 'door') {
      const arch = new THREE.Mesh(new THREE.TorusGeometry(1.25, 0.2, 10, 28, Math.PI), toy({ color: 0xffd36a, film: 0.3 })); arch.position.y = 0.6; arch.rotation.y = Math.PI / 2; g.add(arch);
      for (const z of [-1.25, 1.25]) { const post = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 0.5, 10), toy({ color: 0xffd36a, film: 0.3 })); post.position.set(0, 0.6, z); g.add(post); }
      pad.portal = new THREE.Mesh(new THREE.CircleGeometry(1.08, 28, 0, Math.PI), toy({ color: 0x120820, film: 0, alpha: 0.92, side: THREE.DoubleSide })); pad.portal.position.y = 0.62; pad.portal.rotation.y = Math.PI / 2; g.add(pad.portal);
    } else if (s.kind === 'foe') {
      const eye = new THREE.Group(); eye.position.y = 2.3; g.add(eye); pad.eye = eye;
      eye.add(new THREE.Mesh(new THREE.SphereGeometry(0.95, 24, 16), toy({ color: 0x1a0d1f, film: 0.7 })));
      pad.iris = new THREE.Mesh(new THREE.SphereGeometry(0.5, 20, 14), toy({ color: 0xff2a4a, glow: 0 })); pad.iris.position.z = -0.62; eye.add(pad.iris); // (toward the wheel's outside, where the camera stands)
      for (let i = 0; i < 7; i++) { const a = (i * 2 * Math.PI) / 7, t = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.9, 5), toy({ color: 0xffd36a, film: 0.4, flat: true })); t.position.set(Math.cos(a) * 1.5, Math.sin(a) * 1.5, 0); t.rotation.z = a - Math.PI / 2; eye.add(t); }
    }
    this.group.add(g);
  }
  dots(A, B) {
    for (let i = 1; i <= 2; i++) { const k = i / 3, d = new THREE.Mesh(dotGeo, toy({ color: 0xffd36a, glow: 0.35 })); d.position.set(A.x + (B.x - A.x) * k, A.y + (B.y - A.y) * k + 0.25, A.z + (B.z - A.z) * k); this.group.add(d); }
  }

  /** A space's standing point in the world (the top of its pad). */
  at(id, out = new THREE.Vector3()) { const p = this.pads[id]; return p ? out.set(p.g.position.x, this.group.position.y + p.y + 0.56, p.g.position.z) : null; }

  /** The rules' state worn: a pad worked greyed under a check, the door's portal and the FOE's eye open, the keys lit. */
  sync(S, keys = 0) {
    const cleared = S.seats[0].cleared; // (the pads wear YOUR run: each seat clears its own floors)
    for (const p of Object.values(this.pads)) {
      const worked = !!(cleared[p.s.id] || S.taken[p.s.id]);
      if (p.kind !== p.s.kind) { const C = PAD[p.s.kind] || PAD['?'], u = p.body.material.uniforms; p.kind = p.s.kind; u.uColor.value.setHex(C.color); u.uTop.value.setHex(C.top); p.worked = null; } // (a Transmute: the pad is another kind now)
      if (worked !== p.worked) { p.worked = worked; p.body.material.uniforms.uDim.value = worked ? 0.85 : 0; p.body.material.uniforms.uMap.value = worked ? iconTexture('check') : iconTexture(p.s.kind, p.s.shift); }
    }
    this.open = keys >= this.need;
    this.keys.forEach((k, i) => { k.material.uniforms.uGlow.value = i < keys ? 1.2 : 0; k.material.uniforms.uDim.value = i < keys ? 0 : 0.8; });
    for (const p of Object.values(this.pads)) {
      if (p.portal) { const u = p.portal.material.uniforms; u.uFilm.value = this.open ? 1 : 0; u.uGlow.value = this.open ? 0.8 : 0; u.uColor.value.setHex(this.open ? 0xfff1d6 : 0x120820); }
      if (p.iris) { const awake = this.open && !cleared[p.s.id]; p.iris.material.uniforms.uGlow.value = awake ? 1.4 : 0; p.iris.scale.setScalar(cleared[p.s.id] ? 0.3 : awake ? 1 : 0.55); }
    }
    // the stray and the snares
    const at = S.stray[this.depth] || null; if (at && !this.strayAt && this.pads[at]) this.stray.position.copy(this.pads[at].g.position); this.strayAt = at && this.pads[at] ? at : null; this.stray.visible = !!this.strayAt;
    for (const id of Object.keys(this.snares)) if (S.snares[id] == null) { this.group.remove(this.snares[id]); delete this.snares[id]; }
    for (const id of Object.keys(S.snares)) if (this.pads[id] && !this.snares[id]) {
      const g = (this.snares[id] = new THREE.Group()), hoop = new THREE.Mesh(new THREE.TorusGeometry(RING.pad * 0.78, 0.07, 6, 28), toy({ color: 0xd0103a, glow: 0.5 })); hoop.rotation.x = Math.PI / 2; g.add(hoop);
      for (let i = 0; i < 8; i++) { const a = (i * Math.PI) / 4, t = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.34, 4), toy({ color: 0xfff1d6, flat: true })); t.position.set(Math.cos(a) * RING.pad * 0.78, 0.17, Math.sin(a) * RING.pad * 0.78); g.add(t); }
      this.group.add(g);
    }
  }
  /** The pads a picked die could land on: { id: 0..1 }. */
  reach(map = {}) { for (const [id, p] of Object.entries(this.pads)) p.k = map[id] || 0; }

  update(t, dt) {
    for (const [h, w, i] of this.spin) { h.rotation.x += w * dt; h.rotation.y += w * 0.7 * dt * (i % 2 ? -1 : 1); }
    this.core.rotation.y += dt * 0.6; this.core.rotation.x += dt * 0.37; this.spike.rotation.y -= dt * 0.4; this.spike.rotation.z += dt * 0.23;
    this.heart.position.y = 2.2 + Math.sin(t * 0.8 + this.depth) * 0.25;
    this.keys.forEach((k, i) => { const a = t * 0.9 + (i * 2 * Math.PI) / this.keys.length; k.position.set(Math.cos(a) * 1.9, Math.sin(t * 1.3 + i) * 0.3, Math.sin(a) * 1.9); });
    for (const p of Object.values(this.pads)) {
      p.lift += ((p.k > 0 ? 0.35 : 0) - p.lift) * Math.min(1, dt * 10);
      const bob = p.s.side || p.s.kind === 'mouth' ? Math.sin(t * 1.4 + p.g.position.x) * 0.12 : 0;
      p.g.position.y = p.y + p.lift + bob;
      p.hoop.visible = p.k > 0;
      if (p.k > 0) { const s = 1 + 0.08 * Math.sin(t * 6 + p.g.position.z); p.hoop.scale.set(s, s, 1 + p.k); p.hoop.position.y = 0.95 + 0.12 * Math.sin(t * 3 + p.g.position.x); p.hoop.material.uniforms.uGlow.value = 0.5 + p.k * 1.2; }
      if (p.eye) { p.eye.position.y = 2.3 + Math.sin(t * 1.1) * 0.15; p.eye.rotation.z = Math.sin(t * 0.5) * 0.1; }
    }
    if (this.strayAt) { const g = this.pads[this.strayAt].g.position, T = this.stray, k = Math.min(1, dt * 5); T.position.x += (g.x - T.position.x) * k; T.position.z += (g.z - T.position.z) * k; T.position.y += (g.y + 2.5 + Math.sin(t * 2.6) * 0.2 - T.position.y) * k; T.rotation.y += dt * 1.4; }
    for (const [id, g] of Object.entries(this.snares)) { const q = this.pads[id].g.position; g.position.set(q.x, q.y + 0.6, q.z); g.rotation.y -= dt * 0.9; }
  }
  dispose() { this.deck.dispose(); this.group.parent?.remove(this.group); this.group.traverse((o) => { if (o.isMesh) { if (![padGeo, footGeo, hoopGeo, dotGeo].includes(o.geometry)) o.geometry.dispose(); o.material.dispose(); } }); }
}
