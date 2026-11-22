// ---------------------------------------------------------------------------------------
// THE RECITAL'S STAGE (plain names: the recital's lights, the stage's pyro; looks only): the combat recital (tools/crucibelle/recital.js,
// recitalplay.js) drawn as a live show round the Courier while it is on:
//   - THE RECITAL'S LIGHTS: three cones of light hung a few metres over the Courier (behind them to each side, and before them), each
//     a cone of the beam program (vfx/beam.js beamMaterial, as the rave's are: emissive, additive, no lamp) with a soft pool where it lands,
//     swinging off the Courier between beats and onto them on the beat, tinted the colour of the last note played (DEGREE_COLOR); at the
//     rockstar moment they turn through the film's colours. They swell gently on the beat, never strobe.
//   - The bolts of the licks while they fly (recital.lick.fly, following each), a ring off the amp at each note (recital.note), a lick's
//     landing, the strum's wall of sound, the windmill's ring and pyro, the feedback's beam held from the amp along the aim, the rockstar
//     moment's pyro and confetti, and the amp smoking at fever (vfx/library/recital.js).
//
// Prior art: the arena show's moving heads (a spot swung onto the soloist on the downbeat), Guitar Hero's stage and star power, the
// rave's beams in this house (vfx/rave.js), and the Persona 5 all-out's colour owning the frame (here only for 1.5 real s).
//
//   game.recitalLooks = new RecitalLooks(game)   .update(rawDt) (the `fx` phase)   RECITAL_LOOK
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { beamMaterial } from './beam.js';
import { DEGREE_COLOR } from '../tools/crucibelle/songs.js';

/** The lights' numbers: their height over the Courier (m), the side and back offsets of each fixture, the pool's radius, how far they
 *  swing off between beats, their brightness (at rest, the beat's swell, the rockstar's), and how fast the tint follows a note (1/s). */
export const RECITAL_LOOK = {
  height: 3.6, fixtures: [[-2.6, -1.6], [2.6, -1.6], [0, 3.2]], pool: 0.95, swing: 1.1,
  opacity: { rest: 0.15, beat: 0.07, rock: 0.2 }, poolK: 0.5, tintRate: 5, smokeEvery: 0.28,
};
const RL = RECITAL_LOOK, _hsl = { h: 0, s: 0, l: 0 }; // (height 3.6: under a low room's beams, the workshop's)
const DOWN = new THREE.Vector3(0, -1, 0), _a = new THREE.Vector3(), _b = new THREE.Vector3(), _f = new THREE.Vector3(), _l = new THREE.Vector3(), _q = new THREE.Quaternion();

export class RecitalLooks {
  constructor(game) {
    this.game = game; this.t = 0; this.smokeT = 0; this.rock = 0;
    this.tint = new THREE.Color(DEGREE_COLOR[0]); this.want = new THREE.Color(DEGREE_COLOR[0]);
    this.root = new THREE.Group(); this.root.visible = false; game.scene?.add(this.root);
    const geo = new THREE.ConeGeometry(1, 1, 24, 1, true); geo.translate(0, -0.5, 0);
    this.lights = RL.fixtures.map((fx, i) => {
      const mat = beamMaterial({ color: 0xffffff, opacity: 0, foot: 1.1, edge: 1.5, white: 0, flip: true, additive: true });
      const cone = new THREE.Mesh(geo, mat); cone.frustumCulled = false; cone.renderOrder = 6; this.root.add(cone);
      const pool = new THREE.Mesh(new THREE.CircleGeometry(1, 24), new THREE.MeshBasicMaterial({ map: game.fx?.haloTexture ?? null, color: 0xffffff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0, toneMapped: false }));
      pool.rotation.x = -Math.PI / 2; pool.renderOrder = 3; this.root.add(pool);
      return { cone, pool, mat, fx, ph: (i / RL.fixtures.length) * Math.PI * 2, fix: new THREE.Vector3(), aim: new THREE.Vector3(), col: new THREE.Color() };
    });
    const E = game.events;
    E?.on?.('crucibelle.recital.note', (e) => { this.want.setHex(DEGREE_COLOR[(e.degree ?? 1) - 1] ?? 0xffffff); this.play('recital.note', { pos: this.mouth(new THREE.Vector3()), tint: DEGREE_COLOR[(e.degree ?? 1) - 1], dir: this.fwd(new THREE.Vector3()) }); });
    E?.on?.('crucibelle.lick', (e) => { if (e.hit && e.at) this.play('recital.lick.hit', { pos: e.at.clone(), tint: DEGREE_COLOR[(e.degree ?? 1) - 1] }); });
    E?.on?.('crucibelle.strum', (e) => {
      const P = this.game.player; if (!P || !this.recital?.on) return;
      if (e.windmill) this.play('recital.windmill', { pos: P.pos.clone(), dir: this.fwd(new THREE.Vector3()) });
      else this.play('recital.strum', { pos: P.pos.clone(), dir: this.fwd(new THREE.Vector3()), power: 0.7 + 0.25 * (e.chain || 1), scale: 0.85 + 0.15 * (e.chain || 1) });
    });
    E?.on?.('crucibelle.feedback', (e) => {
      this.fb?.stop?.(); this.fb = null;
      if (e.on) this.fb = this.play('recital.feedback', { pos: this.mouth(new THREE.Vector3()), dir: this.fwd(new THREE.Vector3()), follow: (h) => !!this.recital?.play.feedbackOn && (this.mouth(h.pos), this.fwd(h.dir), true) });
    });
    E?.on?.('crucibelle.rockstar', () => { const P = this.game.player; if (P) this.play('recital.rockstar', { pos: P.pos.clone(), dir: this.fwd(new THREE.Vector3()) }); });
  }
  get recital() { return this.game.crucibelle?.recital ?? null; }
  play(name, ctx) { return this.game.vfx?.play?.(name, ctx) ?? null; }
  mouth(out) { const R = this.recital; return R ? R.mouth(out) : out.copy(this.game.player?.pos ?? _a.set(0, 0, 0)); }
  /** The aim along the ground (the strum's and the feedback's way). */
  fwd(out) { const P = this.game.player; return P?.lookDir ? P.lookDir(out).setY(0).normalize() : out.set(0, 0, 1); }

  update(raw) {
    const R = this.recital, w = R?.w ?? 0;
    this.root.visible = w > 0.02;
    if (!this.root.visible) return;
    this.t += raw;
    const g = this.game, P = g.player, play = R.play, T = R.tool;
    // the licks' bolts in flight: each its held effect, let go as it lands or fades
    for (const b of play.bolts) if (!b.h) b.h = this.play('recital.lick.fly', { pos: b.pos.clone(), tint: b.color, scale: b.high ? 0.75 : 1, follow: (h) => !b.done && (h.pos.copy(b.pos), true) }) || true;
    // the amp smoking at fever
    if (T.fever > 0.6 && (this.smokeT -= raw) <= 0) { this.smokeT = RL.smokeEvery / T.fever; this.play('recital.smoke', { pos: this.mouth(new THREE.Vector3()) }); }
    // the lights: swung onto the Courier on the beat, tinted by the last note (or turning through the film at the rockstar moment)
    this.tint.lerp(this.want, 1 - Math.exp(-raw * RL.tintRate));
    this.rock = THREE.MathUtils.damp(this.rock, play.rockT > 0 ? 1 : 0, 6, raw);
    const beat = R.beat ?? 0, chest = g.character?.chestPoint?.(_b) ?? _b.copy(P.pos).setY(P.pos.y + 1.2);
    const q = g.character?.root?.getWorldQuaternion?.(_q); _f.set(0, 0, 1); _l.set(1, 0, 0); if (q) { _f.applyQuaternion(q).setY(0).normalize(); _l.applyQuaternion(q).setY(0).normalize(); }
    const floor = P.pos.y + 0.03;
    for (const L of this.lights) {
      L.fix.copy(P.pos).addScaledVector(_l, L.fx[0]).addScaledVector(_f, L.fx[1]); L.fix.y = P.pos.y + RL.height;
      const off = (1 - beat) * RL.swing, a = L.ph + this.t * 1.3;
      L.aim.copy(chest).addScaledVector(_l, Math.cos(a) * off).addScaledVector(_f, Math.sin(a) * off); L.aim.y = floor;
      _a.subVectors(L.aim, L.fix); const len = _a.length(); _a.multiplyScalar(1 / len);
      L.cone.position.copy(L.fix); L.cone.quaternion.setFromUnitVectors(DOWN, _a); L.cone.scale.set(RL.pool, len, RL.pool);
      if (this.rock > 0.01) L.col.setHSL((this.t * 0.35 + L.ph / (Math.PI * 2)) % 1, 0.75, 0.62).lerp(this.tint, 1 - this.rock); else { L.col.copy(this.tint); L.col.getHSL(_hsl); L.col.setHSL(_hsl.h, Math.min(1, _hsl.s * 1.4 + 0.15), Math.min(_hsl.l, 0.55)); } // (saturated: a stage gel, never near white)
      const op = w * (RL.opacity.rest + RL.opacity.beat * beat + RL.opacity.rock * this.rock);
      L.mat.uniforms.uColor.value.copy(L.col); L.mat.uniforms.uOpacity.value = op;
      L.pool.position.copy(L.aim); L.pool.scale.setScalar(RL.pool * 1.1); L.pool.material.color.copy(L.col); L.pool.material.opacity = op * RL.poolK * 2;
    }
  }
}
