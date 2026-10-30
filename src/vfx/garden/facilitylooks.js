// ---------------------------------------------------------------------------------------
// THE FACILITIES' LOOKS: the Spirit Garden's fixed places dressed over the world's stand-ins so each reads by its shape from another
// planetoid (South, 2026-10-30: "the facilities need much stronger identity, readily identifiable silhouettes and the like"). The
// places and what F does at them are Petra's (world/garden/place.js, realm.js); this only draws, on the first entry, under the seam's
// cover, and compiles what it drew there:
//
//   THE SHED      the Pneuka Box's shed as a kura (facilitymodels.js), its round door turned to where the Jar comes in by the gate
//   THE GATE      a great round moon gate where the torii stood, its opening turned to the Jar's start so the first
//                 view looks through it; a faint veil of light in the ring, breathing
//   THE ATHANOR   its tower furnace on the west shoulder (the press keeps the crown, the hokora the east), its door to the crown,
//                 smoke from its cap; stepped round the planetoid if a plot or a lotus stands where it would
//   THE TREE      the cocoon tree hung with silk cocoons as lanterns, clear of its three pods' boughs, lit at dusk
//   THE CHIMNEY   the mat a round straw mat; a climbing kiln of four chambers and its firebox stepping up the ball to the needle's
//                 foot beside it; the needle crowned with the kiln's stack, smoking
//   (the hokora's torii and streamers are its own model's: vfx/garden/hokora.js)
//
// All of it two merged meshes in the decor pieces' one program (vfx/garden/decorpieces.js decorMaterial: the body's lamps by the hour,
// the fire's always lit and wavering), the body outlined; the veil one disc; the smoke two held library effects (`garden.smoke`).
//
// Prior art: Super Mario Galaxy's planetoids, each known by one landmark from across the hub; Sonic Adventure's Chao Garden (the
// buildings of a home garden as toys); the dress-over-the-placeholder way of the open sea's looks (vfx/opensea/isletlooks.js).
//
//   game.facilityLooks = new FacilityLooks(game)   (dresses on garden.enter; smokes while inside)   .update(rawDt)   FACILITY_LOOK
//   .spots { kura, gate, athanor, mat, kiln: [], stack } (each one's frame, a Matrix4: for a camera or a probe)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { facilityPieces } from './facilitymodels.js';
import { decorMaterial } from './decorpieces.js';
import { addOutline } from '../../render/outline.js';

/** Where and how each stands (degrees, metres, real seconds). */
export const FACILITY_LOOK = {
  gate: { down: 0.5, veil: { r: 1.48, y: 2.25, colour: 0xd8ccff, opacity: [0.1, 0.2], breath: 0.5 } },
  athanor: { lat: 44, lon: -90, clear: 3.4, step: 25, smoke: 8.95 },
  lanterns: { n: 9, ring: [3.35, 4.05], top: [5.25, 5.6], thread: 0.9, sc: [0.9, 1.1], clearOfPods: 0.42 },
  kiln: { lon: 140, lats: [10, 19, 28, 37, 45], foot: [0, 0.25, 0.5, 0.8, 1.15] },
  stack: { lift: 0.3, smoke: 7.5 },
};
const UP = new THREE.Vector3(0, 1, 0), _a = new THREE.Vector3(), _b = new THREE.Vector3(), _t1 = new THREE.Vector3(), _t2 = new THREE.Vector3();
const dirOf = (lat, lon) => { const a = THREE.MathUtils.degToRad(lat), b = THREE.MathUtils.degToRad(lon); return new THREE.Vector3(Math.cos(a) * Math.sin(b), Math.sin(a), Math.cos(a) * Math.cos(b)); };

/** A frame standing on planetoid P in direction `n` (from its heart): up the ground's normal, +Z turned toward `toward` (a world point)
 *  in the ground's plane, sat on the highest ground within `foot` m, lifted `lift`. */
function standOn(P, n, { toward = null, foot = 0, lift = 0 } = {}) {
  const up = n.clone().normalize(), ground = (d) => (P.radiusAt ? P.radiusAt(d) : P.r);
  let r = ground(up);
  if (foot > 0) {
    _t1.set(1, 0, 0).projectOnPlane(up); if (_t1.lengthSq() < 1e-4) _t1.set(0, 0, 1).projectOnPlane(up); _t1.normalize(); _t2.crossVectors(up, _t1);
    for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; _a.copy(up).addScaledVector(_t1, Math.cos(a) * foot / r).addScaledVector(_t2, Math.sin(a) * foot / r).normalize(); r = Math.max(r, ground(_a) * _a.dot(up)); }
  }
  const pos = P.c.clone().addScaledVector(up, r + lift);
  const fwd = (toward ? toward.clone().sub(pos) : _b.set(0, 0, 1)).projectOnPlane(up);
  if (fwd.lengthSq() < 1e-6) fwd.set(1, 0, 0).projectOnPlane(up);
  fwd.normalize(); const x = new THREE.Vector3().crossVectors(up, fwd).normalize();
  return new THREE.Matrix4().makeBasis(x, up, fwd).setPosition(pos);
}

export class FacilityLooks {
  constructor(game) {
    this.game = game; this.dressed = false; this.smoke = []; this.vents = []; this.t = 0; this.spots = {}; // (spots: each facility's frame, for a camera or a probe)
    game.events?.on('garden.enter', () => this.enter());
    game.events?.on('garden.leave', () => this.stopSmoke());
  }

  enter() {
    const R = this.game.realm; if (!R?.site) return;
    if (!this.dressed) { this.dressed = true; try { this.dress(R); this.compile(); } catch (e) { console.warn('facility looks', e); } }
    this.startSmoke();
  }

  /** Every facility drawn where the world's places stand, the stand-ins they replace hidden. */
  dress(R) {
    const S = R.site, L = FACILITY_LOOK, body = [], fire = [], game = this.game, group = (this.group = new THREE.Group()); group.name = 'garden-facilities';
    const put = (kind, m, opts) => { const { body: b, fire: f } = facilityPieces(kind, opts); if (b) body.push(b.done().applyMatrix4(m)); if (f) fire.push(f.done().applyMatrix4(m)); return m; };
    const feat = (k) => S.features.find((f) => f.kind === k), D = S.by.dantian, start = R.gateStart?.() ?? D.c.clone().addScaledVector(UP, D.r);
    // the shed: a kura, its round door to the gate
    { const f = feat('shed'); if (f) this.spots.kura = put('kura', standOn(D, f.pos.clone().sub(D.c), { toward: start, foot: 2.2, lift: -0.05 })); }
    // the gate: the moon gate, its opening to the Jar's start, set back down the slope so its upper wall clears the lake's stones
    { const f = feat('gate'); if (f) {
      const m = standOn(D, f.pos.clone().sub(D.c), { toward: start, foot: 2.4, lift: -0.04 }), up = _a.setFromMatrixColumn(m, 1), side = _b.setFromMatrixColumn(m, 0);
      const upslope = UP.clone().projectOnPlane(up).normalize(), along = Math.sign(side.dot(upslope)) || 1; m.setPosition(_t1.setFromMatrixPosition(m).addScaledVector(side, -along * L.gate.down));
      this.spots.gate = put('moonGate', m); this.veil(m);
    } }
    // the Athanor's tower: the west shoulder, stepped round until no plot or lotus stands within its footing
    { const P = S.by.athanor; if (P) {
      const busy = [...(R.plots?.plots || []).filter((p) => p.planet === P).map((p) => p.pos), ...S.lotuses.filter((l) => l.planet === P).map((l) => l.pos), ...S.features.filter((f) => f.planet === P && f.kind !== 'athanor').map((f) => f.pos)];
      let n = dirOf(L.athanor.lat, L.athanor.lon);
      for (let k = 0; k < 360 / L.athanor.step; k++) { n = dirOf(L.athanor.lat, L.athanor.lon + k * L.athanor.step); const at = P.c.clone().addScaledVector(n, P.r); if (!busy.some((q) => q.distanceTo(at) < L.athanor.clear + 1.6)) break; }
      const m = put('athanor', standOn(P, n, { toward: P.c.clone().addScaledVector(UP, P.r * 2), foot: 2.1, lift: -0.05 }));
      this.vents.push({ m, y: L.athanor.smoke }); this.spots.athanor = m;
    } }
    // the cocoon tree's silk lanterns, in its own frame, clear of the boughs that hold its pods
    { const T = S.tree; if (T) {
      T.group.updateMatrixWorld(true); const W = T.group.matrixWorld, C = L.lanterns, pods = T.slots.map((s) => s.a);
      for (let i = 0, made = 0; made < C.n && i < 40; i++) {
        const a = (i / C.n) * Math.PI * 2 + 0.1 + Math.floor(i / C.n) * 0.17; if (pods.some((b) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b))) < C.clearOfPods)) continue;
        const r = C.ring[made % 2], y = C.top[(made >> 1) % 2], sc = C.sc[0] + ((made * 37) % 10) / 10 * (C.sc[1] - C.sc[0]);
        put('silkLantern', W, { at: [Math.cos(a) * r, y, Math.sin(a) * r], thread: C.thread, sc }); made++;
      }
    } }
    // the Chimney: the straw mat; the climbing kiln up the ball to the needle's foot; the stack on the summit
    { const P = S.by.chimney; if (P) {
      const mat = feat('tribulationMat'); if (mat) this.spots.mat = put('strawMat', standOn(P, mat.pos.clone().sub(P.c), { foot: 1.4, lift: -0.02 }));
      const K = L.kiln, pole = P.c.clone().addScaledVector(UP, P.r * 6);
      this.spots.kiln = K.lats.map((lat, i) => put(i ? 'kilnChamber' : 'firebox', standOn(P, dirOf(lat, K.lon), { toward: pole, foot: 1.0, lift: -0.04 }), { foot: K.foot[i] }));
      const top = P.base ? P.base(UP) : P.r, m = new THREE.Matrix4().setPosition(P.c.clone().addScaledVector(UP, top + L.stack.lift));
      this.spots.stack = put('stack', m); this.vents.push({ m, y: L.stack.smoke });
    } }
    // the two meshes, and the stand-ins gone
    this.bodyMat = new THREE.MeshStandardMaterial({ name: 'garden-facilities', roughness: 0.82 }); decorMaterial(this.bodyMat, game);
    this.fireMat = new THREE.MeshStandardMaterial({ name: 'garden-facilities-fire', roughness: 0.9 }); const lit = decorMaterial(this.fireMat, game).lamps, moodRender = this.fireMat.onBeforeRender;
    this.fireMat.onBeforeRender = (...a) => { moodRender(...a); lit.value = 1; }; // (the fire is lit by day too: its glow wavers by the decor program's FLICKER)
    for (const [list, mat, name, outline] of [[body, this.bodyMat, 'garden-facilities-body', true], [fire, this.fireMat, 'garden-facilities-fire', false]]) {
      if (!list.length) continue;
      const geo = mergeGeometries(list, false); list.forEach((g) => g.dispose()); geo.computeBoundingSphere();
      const mesh = new THREE.Mesh(geo, mat); mesh.name = name; mesh.castShadow = true; mesh.receiveShadow = true; group.add(mesh);
      if (outline) addOutline(mesh);
    }
    S.group.add(group);
  }

  /** The gate's veil: a soft light filling the ring, breathing (the halo's texture, no program of its own). */
  veil(m) {
    const V = FACILITY_LOOK.gate.veil, mat = new THREE.MeshBasicMaterial({ name: 'garden-gate-veil', map: this.game.fx?.haloTexture ?? null, color: V.colour, transparent: true, opacity: V.opacity[0], depthWrite: false, blending: THREE.AdditiveBlending });
    const geo = new THREE.CircleGeometry(V.r * 1.25, 32), veil = new THREE.Group(); veil.name = 'garden-gate-veil';
    for (const turn of [0, Math.PI]) { const d = new THREE.Mesh(geo, mat); d.rotation.y = turn; d.position.y = V.y; d.renderOrder = 2; veil.add(d); }
    veil.applyMatrix4(m); this.group.add(veil); this.veilMat = mat;
  }

  /** Compiled where it is drawn, as the realm's warm-up compiles the garden (world/garden/realm.js build), under the same cover. */
  compile() {
    const g = this.game, R = g.renderer; if (!R || !this.group) return;
    const was = R.getRenderTarget();
    try { R.setRenderTarget(g.post?.target ?? null); R.render(_empty, g.camera); R.compile(this.group, g.camera, g.scene); } catch (e) { console.warn('facility looks warm-up', e); }
    R.setRenderTarget(was ?? null);
  }

  startSmoke() {
    if (this.smoke.length || !this.game.vfx) return;
    for (const v of this.vents) { const pos = new THREE.Vector3(0, v.y, 0).applyMatrix4(v.m), dir = _a.setFromMatrixColumn(v.m, 1).clone().normalize(); const h = this.game.vfx.play('garden.smoke', { pos, dir, normal: dir }); if (h) this.smoke.push(h); }
  }
  stopSmoke() { for (const h of this.smoke) h.stop?.(); this.smoke.length = 0; }

  update(raw = 1 / 60) {
    if (!this.veilMat || !this.game.realm?.active) return;
    this.t += raw; const V = FACILITY_LOOK.gate.veil, lamps = this.game.gardenMood?.now?.lamps ?? 0, b = 0.5 + 0.5 * Math.sin(this.t * V.breath * Math.PI * 2);
    this.veilMat.opacity = V.opacity[0] + (V.opacity[1] - V.opacity[0]) * (0.4 * b + 0.6 * lamps);
  }
}
const _empty = new THREE.Scene();
