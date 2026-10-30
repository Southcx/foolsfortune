// ---------------------------------------------------------------------------------------
// A RARE SPIRIT'S LOOK (docs/plans/SEEDS-SLABS-SCANS.md 2.3: a flawless dig gives the rare look; Petra's bench writes `rare: true` on the
// bound entry, world/garden/bench.js): a spirit carved flawless out of its slab wears the shiny's inversion in the Spirit Garden, as an
// aberrant gone wrong shiny does in a duel (South, 2026-10-29: "like our shiny versions"), and now and then two white and gold stars
// glint by its head (`slab.rare`, vfx/library/slabs.js). The inversion is the aberrant inversion's (vfx/aberrantinvert.js): each of its
// meshes given a copy of its material with the colour turned to its opposite, on the program the original already has.
//
// When the spirit matures the realm clones its material to dress its form (world/garden/raising.js lookOf): a clone of the inverted copy
// is turned back to its own colour first, then held again, so a rare spirit is never inverted twice into its plain colours.
//
// Prior art: Pokemon's shiny (its palette swapped, a sparkle as it appears), the 8- and 16-bit games' palette swap to the opposite colours.
//
//   game.rareSpirits = new RareSpirits(game)   .update(rawDt)   RARE_SPIRITS
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { AberrantInversion } from '../aberrantinvert.js';

/** How often the realm's spirits are looked over (real seconds), and the glint's wait between two (a range, real seconds). */
export const RARE_SPIRITS = { look: 0.5, glint: [3.5, 7], head: 0.45 };
const _v = new THREE.Vector3();

export class RareSpirits {
  constructor(game) {
    this.game = game; this.inv = new AberrantInversion(); this.held = new Map(); this.t = 0;
    game.events?.on('garden.leave', () => this.releaseAll());
  }
  releaseAll() { for (const h of this.held.values()) this.inv.release(h.ent); this.held.clear(); }

  update(raw = 1 / 60) {
    const R = this.game.realm; if (!R?.active) { if (this.held.size) this.releaseAll(); return; }
    if ((this.t -= raw) <= 0) { this.t = RARE_SPIRITS.look; this.look(R); }
    for (const [s, h] of this.held) {
      if ((h.next -= raw) > 0) continue;
      h.next = RARE_SPIRITS.glint[0] + Math.random() * (RARE_SPIRITS.glint[1] - RARE_SPIRITS.glint[0]);
      _v.copy(s.body?.up || s.mesh.up).multiplyScalar(RARE_SPIRITS.head * (s.mesh.scale.x || 1)).add(s.mesh.position);
      s.mesh.parent?.localToWorld(_v);
      this.game.vfx?.play('slab.rare', { pos: _v.clone(), normal: (s.body?.up || s.mesh.up).clone() });
    }
    this.inv.update();
  }
  /** The realm's spirits looked over: a rare one held inverted, held again if its material was changed under it; the rest let go. */
  look(R) {
    const live = new Set();
    for (const s of R.spirits || []) {
      if (!s.e?.rare || !s.mesh) continue;
      live.add(s);
      const h = this.held.get(s), m = s.mesh.material;
      if (h && m === h.copy) continue;
      if (h) this.inv.release(h.ent);
      if (m?.userData?.inverted && m.color) { m.color.setRGB(1 - m.color.r, 1 - m.color.g, 1 - m.color.b); m.userData.inverted = false; m.name = String(m.name || '').replace(/-inverted$/, ''); } // (the realm cloned our copy to dress its form: its own colour back first)
      const ent = { root: s.mesh }; this.inv.hold(ent);
      this.held.set(s, { ent, copy: s.mesh.material, next: h?.next ?? Math.random() * 2 });
    }
    for (const [s, h] of this.held) if (!live.has(s)) { this.inv.release(h.ent); this.held.delete(s); }
  }
}
