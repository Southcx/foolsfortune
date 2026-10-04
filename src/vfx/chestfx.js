// ---------------------------------------------------------------------------------------
// CHEST FX: the effect meshes of a chest's opening (ceremony.js), made in Mesh Create (vfx/meshfx.js, source_assets/meshflow/), laid on
// its beats without the ceremony knowing: each frame this reads the live ceremony (chests.cur: its phase, how far into it, the chest,
// its colour) and plays its meshes to it.
//
//   THE SHOCK    (chest_shock) the burst throws a low flared band out along the floor, wider the higher the tier.
//   THE HELIX    (chest_helix) two ribbons of Lachryma wind up round the chest through the fountain and stand round the curio on the
//                reveal, flowing upward; the prismatic tier's is all the Mind's labradorite.
//
// (The circle of runes and the mandala that lay under the chest are gone, the owner's, R45: they took the eye off what comes out of it;
// the chest's glaze tells the charge now, vfx/chestglaze.js.)
//
// Prior art: the shockwave ring of every hit (Street Fighter's super flash, Smash's KO burst), Kingdom Hearts' and Final Fantasy's
// rising helix of light on a level up or a treasure. One module, so the next ceremony (the Lockheart's opening, a boss's death) reuses
// the meshes and the way they are played.
//
//   const cfx = new ChestFx(game)    cfx.update(dt)   (main.js, every frame)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { meshFx } from './meshfx.js';
import { TIERS } from '../world/treasure/treasure.js';

const _c = new THREE.Color();

export class ChestFx {
  constructor(game) {
    this.game = game;
    this.ready = false;
    meshFx.load().then(() => {
      const S = game.scene;
      this.shock = meshFx.make('chest_shock', { scene: S, opacity: 1.1 });
      this.helix = meshFx.make('chest_helix', { scene: S, opacity: 1.4 });
      this.ready = !!(this.shock && this.helix);
    });
    this.cer = null; this.shockT = -1; this.helixK = 0;
  }

  update(dt) {
    if (!this.ready) return;
    const g = this.game, C = g.chests?.cur;
    if (C !== this.cer) { this.cer = C; this.shockT = -1; this.lastPhase = null; }
    const raw = g.rawDt || dt;
    let helixWant = 0;
    if (C) {
      const chest = C.chest, rig = chest.rig, at = rig.root.position, S = rig.scale || 1, T = C.T, ph = C.phase;
      const prism = T === 4;
      if (ph !== this.lastPhase) { if (ph === 'burst') this.shockT = 0; this.lastPhase = ph; }
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
          s.u.uTint.value.set(prism ? 0xffffff : TIERS[T].rgb); s.u.uLabradorite.value = prism ? 1 : 0.1;
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
      h.u.uLabradorite.value = prism ? 1 : 0.35;
    }
    this.helixK = THREE.MathUtils.damp(this.helixK, helixWant, helixWant > this.helixK ? 5 : 2.5, raw);
    this.helix.set(this.helixK < 0.01 ? 0 : this.helixK);
    this.shock.update(raw); this.helix.update(raw);
  }
}
