// ---------------------------------------------------------------------------------------
// BODIES IN THE FIRE (plain names; the city's fire's look, vfx/mechs/fire/; the rules Dovina's: progress/mechs/fire.js, her runtime
// world/hangar/cityfire.js), three bodies answering her events, looks only:
//   the frame heated     `mech.heat { k }`: a heat shimmer round your mech's legs (the caster shells' heat haze, vfx/caster/heathaze.js)
//                        and embers and an ember's glow coming off its leg joints, by k
//   the straw giant ablaze  `giant.burn { id, k }`: the cel flame cards (flames.js) standing out of its seams on its own body (so
//                        its pose carries them), set out past its sack and drawn after its AT field (giants/atfield.js, order 7)
//                        so the field never veils them; burning straw flung, its burlap and straw charring toward black with
//                        Fury's ember glowing in it
//   the colossus vitrified  `giant.vitrify { id, on }`: the dune colossus's fired clay glazing to a glassy sheen over FIRE_LOOK
//                        .bodies.vitrify.turn real s (roughness down, a celadon-ash tint, a stronger reflection), flakes of the glaze
//                        cracking off it while it holds, and the glaze shattering off as it ends
// The dress (vfx/mechs/giants/: game.giantLooks.dress) is read, its materials changed in place and put back exactly when the state
// ends or the dress is made again. No allocation a frame: one emit record and scratch vectors, reused.
// Prior art: Shadow of the Colossus (a colossus's body its weak point, lit), the Wicker Man (a straw giant burning), raku and
// ash glazes (clay glazed glassy in the heat, crazing as it cools), Far Cry 2's heat shimmer over a fire.
//
//   const B = new FireBodies(game)   B.heat(k)   B.burn(id, k)   B.vitrify(id, on)   B.update(dt)   B.clear()
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { FIRE_LOOK } from './table.js';
import { FlameCards, furyHex } from './flames.js';

const BK = FIRE_LOOK.bodies, EM = FIRE_LOOK.embers;
const EMBER = EM.at.map(furyHex), EMBER_END = furyHex(EM.endAt), GLOW = furyHex(0.62), GLOW_END = furyHex(0.36);
/** The straw cards drawn after the AT field's shell (giants/atfield.js: 7, your own 8). */
const OVER_FIELD = 9;
/** Where the straw giant's flames stand (its body's frame, metres: its seams, its shoulders, its crown; vfx/mechs/giants/straw.js). */
const STRAW_SEAMS = [[3.75, 8.2, 0.4], [-3.4, 10.6, -1.2], [0, 13.3, 0.5], [2.6, 5, 1.6], [-2.4, 5, 1.8], [0, 9, 2.4], [3.1, 11.6, 0.2],
  [-3.6, 7, 0.8], [1.4, 14.6, 0], [-1.2, 6, -2.2], [2.2, 12.6, -1.6], [-2.6, 12.4, 1], [0.6, 4.4, -2], [-0.8, 10.2, 2.5], [3.4, 6.4, -1], [-3.2, 9.2, -2]];
const _v = new THREE.Vector3(), _w = new THREE.Vector3(), _c = new THREE.Color(), _e = new THREE.Color();
const E = { pos: new THREE.Vector3(), vel: new THREE.Vector3(), life: 1, size: 1, sizeEnd: 0, color: 0, colorEnd: 0, alpha: 1, alphaEnd: 0, shape: 'soft', drag: 0.6, gravity: -1, twinkle: 6, stretch: 0, spin: 0, grow: 0 };

/** Every material of a dress's meshes, once. */
function matsOf(dress) { const out = new Set(); for (const m of dress?.meshes || []) if (m.material && !Array.isArray(m.material)) out.add(m.material); return [...out]; }

export class FireBodies {
  constructor(game) {
    this.game = game; this.t = 0;
    this.heatK = 0; this.heatH = null; this.heatAcc = 0; this.glowAcc = 0;
    this.burnK = 0; this.burnTo = 0; this.burnFor = null; this.burnCards = null; this.burnH = null; this.burnMats = null; this.cardK = -1;
    this.vitOn = false; this.vitK = 0; this.vitFor = null; this.vitMats = null; this.crackT = 0;
  }
  play(n, ctx) { try { return this.game.vfx?.play(n, ctx) || null; } catch { return null; } }
  giant() { const Gi = this.game.hangar?.giant; return Gi?.group ? Gi : null; }
  dress() { return this.game.giantLooks?.dress || null; }

  heat(k) { this.heatK = Math.max(0, Math.min(1, +k || 0)); }
  burn(id, k) { const Gi = this.giant(); if (Gi && (id == null || Gi.G?.id === id)) this.burnTo = Math.max(0, Math.min(1, +k || 0)); }
  vitrify(id, on) {
    const Gi = this.giant(); if (!Gi || (id != null && Gi.G?.id !== id)) return;
    if (this.vitOn && !on) for (let i = 0; i < 6; i++) this.crack(Gi, 1.3); // (the glaze shattering off as it ends)
    this.vitOn = !!on;
  }

  update(dt) {
    this.t += dt;
    try { this.stepHeat(dt); } catch (e) { console.warn('fire heat', e); this.heatK = 0; }
    try { this.stepBurn(dt); } catch (e) { console.warn('fire burn', e); this.burnTo = 0; }
    try { this.stepVitrify(dt); } catch (e) { console.warn('fire vitrify', e); this.vitOn = false; }
  }

  // ------------------------------------------------------------------ the frame heated
  stepHeat(dt) {
    const B = this.game.hangar?.pilot?.mech, legs = B?.legJoints, k = this.heatK, P = this.game.vfx;
    if (!legs?.length || k < 0.03 || !P?.add) { if (this.heatH) { this.heatH.stop(); this.heatH = null; } return; }
    B.joints?.pelvis?.getWorldPosition(_v); const foot = B.group.position.y;
    if (!this.heatH) this.heatH = this.play('caster.heatHaze', { pos: _v, scale: BK.heat.haze });
    if (this.heatH) { this.heatH.pos.set(_v.x, (foot + _v.y) / 2, _v.z); this.heatH.k = k; }
    this.heatAcc += dt * BK.heat.embers * k; this.glowAcc += dt * BK.heat.glow * k;
    while (this.heatAcc >= 1 || this.glowAcc >= 1) {
      const glow = this.glowAcc >= 1; if (glow) this.glowAcc -= 1; else this.heatAcc -= 1;
      legs[(Math.random() * legs.length) | 0].getWorldPosition(E.pos);
      E.pos.x += (Math.random() - 0.5) * 1.2; E.pos.y += (Math.random() - 0.5) * 1.2; E.pos.z += (Math.random() - 0.5) * 1.2;
      if (glow) { E.vel.set(0, 0.3, 0); E.life = 0.5 + Math.random() * 0.3; E.size = 1.4 + Math.random() * 0.8; E.sizeEnd = 0.6; E.color = GLOW; E.colorEnd = GLOW_END; E.alpha = 0.35 + 0.35 * k; E.twinkle = 0; E.shape = 'soft'; }
      else { E.vel.set((Math.random() - 0.5) * 1.5, 1 + Math.random() * 3, (Math.random() - 0.5) * 1.5); E.life = 0.9 + Math.random() * 0.8; E.size = 0.24 + Math.random() * 0.2; E.sizeEnd = 0; E.color = EMBER[(Math.random() * EMBER.length) | 0]; E.colorEnd = EMBER_END; E.alpha = 1; E.twinkle = 6; E.shape = 'star4'; }
      P.add.emit(E);
    }
  }

  // ------------------------------------------------------------------ the straw giant ablaze
  stepBurn(dt) {
    const Gi = this.giant(), D = this.dress();
    if (!Gi || D?.kind !== 'straw') { this.unburn(); return; }
    if (this.burnFor && this.burnFor !== D) this.unburn();
    this.burnK += (this.burnTo - this.burnK) * Math.min(1, dt * 1.5);
    const k = this.burnK;
    if (k < 0.02 && this.burnTo === 0) { this.unburn(); return; }
    if (!this.burnFor) {
      this.burnFor = D; this.cardK = -1;
      this.burnMats = matsOf(D).map((m) => ({ m, col: m.color.clone(), em: m.emissive.clone(), ei: m.emissiveIntensity }));
      this.burnCards = new FlameCards(Gi.body, STRAW_SEAMS.length, 'fire.straw.flames'); this.burnCards.mesh.renderOrder = OVER_FIELD;
    }
    const S = BK.straw;
    if (Math.abs(k - this.cardK) > 0.04) { // (the cards written again only as the fire grows or dies)
      const n = Math.max(1, Math.round(STRAW_SEAMS.length * Math.min(1, 0.25 + k)));
      for (let i = 0; i < n; i++) { const [x, y, z] = STRAW_SEAMS[i], r = Math.hypot(x, z) || 1, o = S.out / r; this.burnCards.set(i, x + x * o, y - 0.9, z + z * o, S.width * (0.7 + 0.5 * k), S.minH + (S.maxH - S.minH) * k * (0.7 + 0.3 * ((i * 7) % 5) / 4), i * 1.3, (i * 0.618) % 1, 0.25 * k, 0.6); }
      this.burnCards.commit(n); this.cardK = k;
    }
    _c.setHex(S.char); _e.setHex(furyHex(S.emberAt));
    const fl = 0.75 + 0.25 * Math.sin(this.t * 7.3) * Math.sin(this.t * 3.1 + 1.2);
    for (const r of this.burnMats) { r.m.color.copy(r.col).lerp(_c, 0.7 * k); r.m.emissive.copy(_e); r.m.emissiveIntensity = 0.45 * k * fl; }
    Gi.body.updateMatrixWorld(true); Gi.body.localToWorld(_w.set(0, 9.5, 0.5));
    if (!this.burnH) this.burnH = this.play('giant.straw.burn', { pos: _w });
    if (this.burnH) { this.burnH.pos.copy(_w); this.burnH.k = k; this.burnH.ctx.power = 0.3 + k; }
  }
  unburn() {
    if (this.burnMats) for (const r of this.burnMats) { r.m.color.copy(r.col); r.m.emissive.copy(r.em); r.m.emissiveIntensity = r.ei; }
    this.burnMats = null; this.burnCards?.dispose(); this.burnCards = null; this.burnFor = null; this.cardK = -1;
    if (this.burnH) { this.burnH.stop(); this.burnH = null; }
    if (!this.giant()) { this.burnTo = 0; this.burnK = 0; }
  }

  // ------------------------------------------------------------------ the colossus vitrified
  stepVitrify(dt) {
    const Gi = this.giant(), D = this.dress(), V = BK.vitrify;
    if (!Gi || D?.kind !== 'sand') { this.unglaze(); this.vitOn = false; return; }
    if (this.vitFor && this.vitFor !== D) this.unglaze();
    this.vitK = Math.max(0, Math.min(1, this.vitK + (this.vitOn ? dt : -dt * 2) / V.turn));
    if (this.vitK <= 0 && !this.vitOn) { this.unglaze(); return; }
    if (!this.vitFor) {
      this.vitFor = D;
      this.vitMats = matsOf(D).filter((m) => m.roughness !== undefined && m.name !== 'giant.dress.eyeGlow').map((m) => ({ m, r: m.roughness, mt: m.metalness, col: m.color.clone(), env: m.envMapIntensity ?? 1 }));
    }
    const k = this.vitK, s = k * k * (3 - 2 * k); _c.setHex(V.tint);
    for (const R of this.vitMats) { R.m.roughness = R.r + (V.rough - R.r) * s; R.m.metalness = R.mt + (V.metal - R.mt) * s; R.m.color.copy(R.col).lerp(_c, 0.32 * s); R.m.envMapIntensity = R.env * (1 + 1.6 * s); }
    if (this.vitOn && k > 0.6) { this.crackT -= dt; if (this.crackT <= 0) { this.crackT = V.crackEvery * (0.5 + Math.random()); this.crack(Gi, 1); } }
  }
  crack(Gi, scale) {
    const J = [Gi.head, ...(Gi.arms || []), ...(Gi.fore || []), Gi.legs?.L, Gi.legs?.R, Gi.body];
    const o = J[(Math.random() * J.length) | 0]; if (!o) return;
    o.getWorldPosition(_v); this.play('giant.vitrify.crack', { pos: _v, scale });
  }
  unglaze() {
    if (this.vitMats) for (const R of this.vitMats) { R.m.roughness = R.r; R.m.metalness = R.mt; R.m.color.copy(R.col); R.m.envMapIntensity = R.env; }
    this.vitMats = null; this.vitFor = null; this.vitK = 0;
  }

  clear() { this.heatK = 0; this.burnTo = 0; this.burnK = 0; this.unburn(); this.vitOn = false; this.unglaze(); if (this.heatH) { this.heatH.stop(); this.heatH = null; } }
}
