// ---------------------------------------------------------------------------------------
// CHEST FX: the effect meshes of a chest's opening (ceremony.js), made in Mesh Create (vfx/meshfx.js, source_assets/meshflow/), laid on
// its beats without the ceremony knowing: each frame this reads the live ceremony (chests.cur: its phase, how far into it, the chest,
// its colour) and plays its meshes to it.
//
//   THE CIRCLE   (chest_circle) a ring of runes opens on the floor under the chest as it charges, growing and turning faster as the
//                charge tightens, in the colour the beam is showing (a sealed chest's rolls through the tiers with it); on the burst it
//                flares and then fades.
//   THE SHOCK    (chest_shock) the burst throws a low flared band out along the floor, wider the higher the tier.
//   THE HELIX    (chest_helix) two ribbons of Lachryma wind up round the chest through the fountain and stand round the curio on the
//                reveal, flowing upward; the prismatic tier's is all the Mind's labradorite.
//
// Prior art: the summoning circle under a gacha pull (Genshin's wish, Fate/Grand Order's summoning circle: a ring that opens, spins up
// and flares), the shockwave ring of every hit (Street Fighter's super flash, Smash's KO burst), Kingdom Hearts' and Final Fantasy's
// rising helix of light on a level up or a treasure. One module, so the next ceremony (the Lockheart's opening, a boss's death) reuses
// the meshes and the way they are played.
//
//   const cfx = new ChestFx(game)    cfx.update(dt)   (main.js, every frame)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { meshFx } from './meshfx.js';
import { TIERS } from '../treasure.js';

const smooth = (a, b, t) => { const x = THREE.MathUtils.clamp((t - a) / (b - a), 0, 1); return x * x * (3 - 2 * x); };
const _c = new THREE.Color();

export class ChestFx {
  constructor(game) {
    this.game = game;
    this.ready = false;
    meshFx.load().then(() => {
      const S = game.scene;
      this.circle = meshFx.make('chest_circle', { scene: S, opacity: 2.0 });
      this.shock = meshFx.make('chest_shock', { scene: S, opacity: 1.1 });
      this.helix = meshFx.make('chest_helix', { scene: S, opacity: 1.4 });
      this.ready = !!(this.circle && this.shock && this.helix);
    });
    this.cer = null; this.shockT = -1; this.circleK = 0; this.helixK = 0; this.spin = 0;
  }

  update(dt) {
    if (!this.ready) return;
    const g = this.game, C = g.chests?.cur;
    if (C !== this.cer) { this.cer = C; this.shockT = -1; this.spin = 0; this.lastPhase = null; }
    const raw = g.rawDt || dt;
    let circleWant = 0, helixWant = 0;
    if (C) {
      const chest = C.chest, rig = chest.rig, at = rig.root.position, S = rig.scale || 1, T = C.T, ph = C.phase;
      const prism = T === 4;
      const tint = prism ? 0xffffff : (C.glowColor ? C.glowColor.getHex() : TIERS[T].rgb);
      if (ph !== this.lastPhase) { if (ph === 'burst') this.shockT = 0; this.lastPhase = ph; }
      // the circle: through the charge it opens and spins up; on the burst it flares; it is gone by the settle
      const charge = ph === 'charge' ? smooth(0, C.chargeLen || 1.5, C.pt) : 0;
      if (ph === 'charge') circleWant = 0.35 + 0.65 * charge;
      else if (ph === 'burst') circleWant = 1.6;
      else if (ph === 'fountain' || ph === 'reveal' || ph === 'collect') circleWant = 0.55;
      this.spin += raw * (0.4 + 3.2 * charge + (ph === 'burst' ? 4 : 0));
      const c = this.circle;
      c.group.position.set(at.x, chest.floor + 0.03, at.z);
      c.group.rotation.y = this.spin;
      c.group.scale.setScalar(S * (0.75 + 0.35 * Math.max(charge, ph === 'charge' ? 0 : 1)));
      c.u.uTint.value.set(tint); c.u.uLab.value = prism ? 1 : 0.15;
      // the shock: once, from the burst
      const s = this.shock;
      if (this.shockT >= 0) {
        this.shockT += raw;
        const u = this.shockT / 0.7;
        if (u >= 1) { this.shockT = -1; s.set(0); }
        else {
          const r = 1 - Math.pow(1 - u, 3);
          s.group.position.set(at.x, chest.floor + 0.18, at.z);
          s.group.scale.set(S * (0.6 + (2.2 + T * 0.7) * r), S * (1 - 0.6 * u), S * (0.6 + (2.2 + T * 0.7) * r));
          s.u.uTint.value.set(prism ? 0xffffff : TIERS[T].rgb); s.u.uLab.value = prism ? 1 : 0.1;
          s.set(1.6 * (1 - u) * (1 - u));
        }
      }
      // the helix: up round the chest through the fountain, round the curio on the reveal
      if (ph === 'fountain' || ph === 'reveal') helixWant = 1;
      else if (ph === 'collect') helixWant = 0.4;
      const h = this.helix, cur = C.curio?.group?.position;
      const hy = cur && (ph === 'reveal' || ph === 'collect') ? cur.y - 0.3 : chest.floor + 1.3 * S;
      h.group.position.set(cur ? cur.x : at.x, hy, cur ? cur.z : at.z);
      h.group.rotation.y -= raw * 1.6;
      h.group.scale.setScalar(S * (cur && ph !== 'fountain' ? 0.75 : 1));
      h.u.uTint.value.copy(_c.set(prism ? 0xffffff : TIERS[T].rgb).lerp(new THREE.Color(0xffffff), 0.25));
      h.u.uLab.value = prism ? 1 : 0.35;
    }
    this.circleK = THREE.MathUtils.damp(this.circleK, circleWant, circleWant > this.circleK ? 8 : 3, raw);
    this.helixK = THREE.MathUtils.damp(this.helixK, helixWant, helixWant > this.helixK ? 5 : 2.5, raw);
    this.circle.set(this.circleK < 0.01 ? 0 : this.circleK);
    this.helix.set(this.helixK < 0.01 ? 0 : this.helixK);
    this.circle.update(raw); this.shock.update(raw); this.helix.update(raw);
  }
}
