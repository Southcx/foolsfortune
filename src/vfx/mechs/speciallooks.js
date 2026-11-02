// ---------------------------------------------------------------------------------------
// A PART'S SPECIAL'S LOOK (plain name; game.mechSpecialLooks): Petra's `mech.special` (world/hangar/mechspecials.js) answered with the
// library's mech.* effects (vfx/library/mechs.js) and the caster shaders where the frame and the straw giant stand, each in its
// domain's grammar at the frame's scale, its size the special's strength (specialK: the domain's level). Looks only: it listens,
// reads where things are (game.hangar.pilot, its body pilot.mech, the giant game.hangar.giant) and draws; it never decides.
//   scan     the iris opened at the head's lens, a cone of rings swept to the giant, its weak point marked for the mark's time
//   ward     the circle written round the feet and a geodesic bubble round the frame in Spellscription's cobalt
//            (vfx/caster/bubble.js), ringing where a blow lands on it (`mech.hurt`), for the barrier's time
//   hasten   Ouranurgy's hoops falling over the frame, the clock's halo at the head, after-images of its forearms and shins
//   sunder   a blade of the island's clay grown out of the right hand along the line, Alteration's band run down it, crumbling
//   gust     a cone of wind ahead, its wave along the ground, dust and debris driven
//   quake    the ground heaved in a ring round the feet: a shock ring, a wall of dust, clods
//   blink    the caster's Portal eyes at both ends (vfx/godhand/portalpair.js, reused whole), the frame's after-image left at the first
//   pull     Psychokinesis's tether from the right hand to where the thing was drawn from
// And a part's special rested (pilot.specials.ready(slot) reaching 1): a gold glint on that part (`mech.ready`).
// At a distance (40 m on bright sand) the scan, the gust, the blade and the pull each carry a dark core under their light and a mark
// on the ground where they touch (mech.scan.ground under the marked giant, mech.gust.ground, mech.sunder.scar).
// Prior art: the house's split of rules from looks (game.domainLooks, game.sentinelLook); Evangelion's AT Field (the barrier seen only
// as it rings); the after-images of a hasted body (Chrono Trigger's Haste, Dragon Ball's afterimage technique); the portal pair of the
// god hand's Portal; Shadow of the Colossus's dust off a giant's step.
//
//   game.mechSpecialLooks = installMechSpecialLooks(game)   (boot/world.js, after the mech looks)   .update(rawDt)   .clear()
//   MECH_SPECIAL_LOOK (sizes in metres, times in real seconds)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { PART_SPECIALS, SPECIAL_KEYS, specialK } from '../../progress/mechs/specials.js';
import { Bubble } from '../caster/bubble.js';
import { portalPair } from '../godhand/portalpair.js';

/** The look's numbers: the bubble's radius (a share of the frame's height) and its fades; the after-images' rate, life and joints; the
 *  clay blade's growth, hold, crumble, width and depth; the portal's ring and life; the ready glint's offset over the head. */
export const MECH_SPECIAL_LOOK = {
  ward: { r: 0.62, in: 0.25, out: 0.45, tint: 0x6f8fe0, rim: 0xeaf0ff },
  ghost: { every: 0.09, life: 0.38, colour: 0xb9d8ff, joints: ['elbowL', 'elbowR', 'kneeL', 'kneeR', 'lowerLF', 'lowerRF', 'lowerLB', 'lowerRB'] },
  blade: { grow: 0.12, hold: 0.45, crumble: 0.5, w: 4, h: 1.3, clay: 0xb5653a }, // (2.7 times its first width: a thin line at 40 m on bright sand did not read)
  blink: { r: 9, life: 2.2, ghost: 0.8 },
  headUp: 1.2,
};
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _f = new THREE.Vector3();

export class MechSpecialLooks {
  constructor(game) {
    this.game = game; this.live = []; this.prev = new THREE.Vector3(); this.hasPrev = false; this.ready = {}; this.pullFrom = null;
    this.bladeGeo = null; this.bladeMat = null;
    game.events?.on?.('mech.special', (e) => { try { this.special(e || {}); } catch (err) { console.warn('mech special look', err); } });
    game.events?.on?.('mech.hurt', () => this.ring());
  }
  get pilot() { const P = this.game.hangar?.pilot; return P?.mech ? P : null; }
  play(name, ctx) { return this.game.vfx?.play(name, ctx); }
  /** The domain's strength on this special (1 .. specialK's top). */
  amp(S) { return specialK(S, this.game.psyche?.level?.(S.domain) ?? 1); }
  head(out) { const j = this.pilot?.mech.joints; return j?.head ? j.head.getWorldPosition(out).add(_f.set(0, MECH_SPECIAL_LOOK.headUp, 0)) : out.copy(this.pilot.pos).setY(this.pilot.pos.y + 14); }
  chest(out) { const j = this.pilot?.mech.joints; return j?.chest ? j.chest.getWorldPosition(out) : out.copy(this.pilot.pos).setY(this.pilot.pos.y + 9); }
  hand(out) { const B = this.pilot.mech; return B.hand ? B.hand('R', out) : this.chest(out); }
  giant() { const G = this.game.hangar?.giant; return G?.c ? G : null; }
  /** Something held: drawn each frame until `until` (real s from now) or until its update says false; `end` takes it down. */
  hold(t, update, end) { const H = { t: 0, until: t, update, end }; this.live.push(H); return H; }

  special(e) {
    const p = this.pilot, S = PART_SPECIALS[e.part]; if (!p || !S) return;
    const fn = this[`k_${e.kind || S.kind}`]; if (fn) fn.call(this, p, S, this.amp(S));
  }

  // -------------------------------------------------------------- the kinds
  k_scan(p, S, a) {
    const hd = this.head(new THREE.Vector3()), G = this.giant();
    this.play('mech.scan.iris', { pos: hd, scale: a });
    const tgt = G ? G.c.head() : hd.clone().addScaledVector(p.forward(_a), 60);
    const d = tgt.distanceTo(hd); if (d > 1) this.play('mech.scan.sweep', { pos: tgt, dir: _b.subVectors(hd, tgt).normalize(), scale: d });
    if (!G) return;
    const h = this.play('mech.scan.mark', { pos: tgt, scale: Math.min(1.3, a), follow: (h2) => { const g = this.giant(); if (!g) return false; h2.pos.copy(g.c.head()); return true; } });
    const gr = this.play('mech.scan.ground', { pos: G.pos.clone(), scale: Math.min(1.3, a), follow: (h2) => { const g = this.giant(); if (!g) return false; h2.pos.copy(g.pos); return true; } }); // (its ring on the ground under it)
    this.hold((S.for || 6) * a, null, () => { h?.stop?.(); gr?.stop?.(); });
  }
  k_ward(p, S, a) {
    const B = p.mech, K = MECH_SPECIAL_LOOK.ward, R = (B.height || 15) * K.r, T = (S.for || 6) * a;
    this.play('mech.ward.cast', { pos: p.pos.clone(), scale: Math.min(1.3, R / 9.5) });
    const circle = this.play('mech.ward.hold', { pos: p.pos.clone(), scale: Math.min(1.3, R / 9.5), follow: (h) => { const q = this.pilot; if (!q) return false; h.pos.copy(q.pos); return true; } });
    const bub = new Bubble({ shape: 'sphere', radius: R, cell: R / 9, pattern: 'hex', tint: K.tint, rim: K.rim, film: 0.35, labradorite: 0.2, k: 0 });
    this.game.scene.add(bub.object); this.bubble = bub;
    const at = () => { const q = this.pilot; return q ? _a.copy(q.pos).setY(q.pos.y + (q.mech.hip ?? 3) + 2.5) : null; };
    this.hold(T, (dt, t) => {
      const c = at(); if (!c) return false;
      const k = Math.min(1, t / K.in) * Math.min(1, Math.max(0, (T - t) / K.out));
      bub.set({ pos: c, k: 0.85 * k, radius: R * (1 + 0.06 * Math.sin(Math.min(1, t / K.in) * Math.PI)) }); bub.update(dt);
      return true;
    }, () => { circle?.stop?.(); bub.dispose(); if (this.bubble === bub) this.bubble = null; });
    bub.update(0);
  }
  /** A blow on the frame while the barrier stands: the bubble rings where it struck (toward the giant, else at the chest's front). */
  ring() {
    const B = this.bubble, p = this.pilot; if (!B || !p) return;
    const c = B.object.position, G = this.giant(), dir = G ? _a.subVectors(G.pos, c).setY(2).normalize() : p.forward(_a);
    B.hit(_b.copy(c).addScaledVector(dir, B.radius));
  }
  k_hasten(p, S, a) {
    const T = (S.for || 6) * a, K = MECH_SPECIAL_LOOK.ghost;
    const fol = (h) => { const q = this.pilot; if (!q) return false; h.pos.copy(q.pos); return true; };
    const hoops = this.play('mech.hasten.hold', { pos: p.pos.clone(), follow: fol });
    const halo = this.play('mech.hasten.halo', { pos: this.head(new THREE.Vector3()), follow: (h) => { if (!this.pilot) return false; this.head(h.pos); return true; } });
    let next = 0;
    this.hold(T, (dt, t) => {
      const q = this.pilot; if (!q) return false;
      if (t >= next) { next = t + K.every; const B = q.mech, roots = K.joints.map((n) => B.joints[n]).filter(Boolean); this.ghost(roots, K.life, K.colour, 0.35); }
      return true;
    }, () => { hoops?.stop?.(); halo?.stop?.(); });
  }
  k_sunder(p, S, a) {
    const reach = (S.reach || 30) * a, K = MECH_SPECIAL_LOOK.blade, from = this.hand(new THREE.Vector3()), f = p.forward(new THREE.Vector3()), to = from.clone().addScaledVector(f, reach);
    const m = new THREE.Mesh(this.blade(), this.bladeMaterial()); m.name = 'mech-special.sunder'; m.castShadow = true;
    m.position.copy(from); m.quaternion.setFromUnitVectors(_a.set(0, 0, 1), f); m.scale.set(K.w * Math.sqrt(a), K.h, 0.001); this.game.scene.add(m);
    this.play('mech.sunder.edge', { pos: from, dir: f, scale: reach });
    this.play('mech.sunder.scar', { pos: _b.copy(from).setY(p.pos.y + 0.1), dir: _a.copy(f).setY(0).normalize(), scale: reach, from: from.clone().setY(p.pos.y + 0.3), to: to.clone().setY(p.pos.y + 0.3) }); // (the line cut in the ground under it)
    let crumbled = false; const T = K.grow + K.hold + K.crumble;
    this.hold(T, (dt, t) => {
      const g = Math.min(1, t / K.grow), c = Math.max(0, (t - K.grow - K.hold) / K.crumble);
      m.scale.z = reach * g * (1 - 0.85 * c); m.scale.x = K.w * Math.sqrt(a) * (1 - 0.6 * c); m.scale.y = K.h * (1 - 0.5 * c);
      if (c > 0 && !crumbled) { crumbled = true; this.play('mech.sunder.crumble', { pos: from.clone().lerp(to, 0.5), from, to }); }
      return true;
    }, () => { m.removeFromParent(); });
  }
  k_gust(p, S, a) {
    const reach = (S.reach || 45) * a, c = this.chest(new THREE.Vector3()), f = p.forward(new THREE.Vector3());
    this.play('mech.gust.cone', { pos: c.clone().addScaledVector(f, reach), dir: f.clone().negate(), scale: reach });
    this.play('mech.gust', { pos: c.clone().addScaledVector(f, 6), dir: f, scale: 1 });
    this.play('mech.gust.ground', { pos: p.pos.clone().addScaledVector(f, 4).setY(p.pos.y + 0.1), dir: f.clone().setY(0).normalize(), scale: reach }); // (its track scoured on the ground)
  }
  k_quake(p, S, a) { this.play('mech.quake', { pos: p.pos.clone(), scale: ((S.r || 12) * a) / 12, floor: p.pos.y }); }
  k_blink(p) {
    const K = MECH_SPECIAL_LOOK.blink, from = this.hasPrev ? this.prev.clone() : p.pos.clone(), to = p.pos.clone();
    this.ghost([p.mech.body || p.mech.group], K.ghost, 0xd8eee6, 0.45, from.clone().sub(to));
    let E = null; try { E = portalPair(this.game, [from, to], K.r, 0x9cc3b8, this.game.camera); } catch { E = null; /* (headless: no eyes) */ }
    for (const at of [from, to]) this.play('mech.blink.step', { pos: at });
    if (E) this.hold(K.life, (dt, t) => { E.update(dt, t, K.life); return true; }, () => E.dispose());
  }
  k_pull(p) {
    const to = this.hand(new THREE.Vector3()), from = this.pullFrom ? this.pullFrom.clone() : to.clone().addScaledVector(p.forward(_a), 25), d = from.distanceTo(to);
    if (d > 1) this.play('mech.pull.tether', { pos: to, dir: _b.subVectors(from, to).normalize(), scale: d });
    this.play('mech.pull.motes', { pos: to, from, to });
    this.play('mech.pull.snap', { pos: from.clone().setY(p.pos.y) });
  }

  // -------------------------------------------------------------- the pieces
  /** An after-image: every mesh under `roots` copied where it stands now into the scene, in one additive colour, fading over `life`;
   *  `shift` moves it (the blink's: left where the frame was). */
  ghost(roots, life, colour, k0, shift = null) {
    const mat = new THREE.MeshBasicMaterial({ name: 'mech-special.ghost', color: colour, transparent: true, opacity: k0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
    const G = new THREE.Group(); G.name = 'mech-special.ghost'; G.matrixAutoUpdate = false;
    const M = new THREE.Matrix4().makeTranslation(shift?.x || 0, shift?.y || 0, shift?.z || 0);
    for (const r of roots) { r.updateWorldMatrix(true, true); r.traverse((o) => { if (!o.isMesh || o.isInstancedMesh || !o.visible || !o.geometry) return; const g = new THREE.Mesh(o.geometry, mat); g.matrixAutoUpdate = false; g.matrix.multiplyMatrices(M, o.matrixWorld); g.frustumCulled = false; G.add(g); }); }
    G.updateMatrixWorld(true); this.game.scene.add(G);
    this.hold(life, (dt, t) => { mat.opacity = k0 * (1 - t / life) ** 1.5; return true; }, () => { G.removeFromParent(); mat.dispose(); });
  }
  /** The clay blade's one geometry: a box along +Z from 0 to 1, tapering to an edge and a point (built once). */
  blade() {
    if (this.bladeGeo) return this.bladeGeo;
    const g = new THREE.BoxGeometry(1, 1, 1, 2, 1, 12).translate(0, 0, 0.5), P = g.attributes.position;
    for (let i = 0; i < P.count; i++) { const z = P.getZ(i), w = 1 - 0.55 * z, tip = z > 0.9 ? (1 - z) * 10 : 1; P.setX(i, P.getX(i) * w * tip); P.setY(i, P.getY(i) * (0.4 + 0.6 * (1 - Math.abs(P.getX(i)) * 1.6)) * tip); }
    g.computeVertexNormals(); return (this.bladeGeo = g);
  }
  bladeMaterial() { return (this.bladeMat ||= new THREE.MeshStandardMaterial({ name: 'mech-special.clay', color: MECH_SPECIAL_LOOK.blade.clay, roughness: 0.85, metalness: 0, emissive: 0x2a0c04, flatShading: true })); }

  /** One frame (real time): the held looks stepped, the frame's last place kept (the blink's start), what a pull would draw, the rest
   *  that ran out glinted on its part. */
  update(dt) {
    for (let i = this.live.length - 1; i >= 0; i--) {
      const H = this.live[i]; H.t += dt;
      if (H.t >= H.until || (H.update && H.update(dt, H.t) === false)) { H.end?.(); this.live.splice(i, 1); }
    }
    const p = this.pilot;
    if (!p || p.mode !== 'pilot') { this.hasPrev = false; if (!p && this.live.length) this.clear(); return; }
    this.prev.copy(p.pos); this.hasPrev = true;
    const L = p.specials?.list || {};
    if (L.arms?.kind === 'pull' && p.hangar?.props?.nearest) { const r = p.hangar.props.nearest(p.pos, (L.arms.reach || 60) * this.amp(L.arms)); this.pullFrom = r ? r.mesh.getWorldPosition(this.pullFrom || new THREE.Vector3()) : null; }
    for (const slot of Object.keys(SPECIAL_KEYS)) {
      if (!L[slot]) continue;
      const k = p.specials.ready(slot), was = this.ready[slot] ?? 1; this.ready[slot] = k;
      if (k >= 1 && was < 1) this.play('mech.ready', { pos: this.partAt(slot, new THREE.Vector3()) });
    }
  }
  partAt(slot, out) {
    const B = this.pilot.mech, j = B.joints || {};
    if (slot === 'head') return this.head(out);
    if (slot === 'arms') return this.hand(out);
    if (slot === 'legs') return (j.hipL || B.group).getWorldPosition(out);
    return B.seat ? B.seat(out) : this.chest(out);
  }
  clear() { for (const H of this.live) H.end?.(); this.live = []; }
}

/** The looks installed and stepped in the `fx` phase on the real clock (core/systems.js). */
export function installMechSpecialLooks(game) {
  const L = game.mechSpecialLooks = new MechSpecialLooks(game);
  game.systems?.add('fx', L, { clock: 'raw', name: 'mechSpecialLooks' });
  return L;
}
