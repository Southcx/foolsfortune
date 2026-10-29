// ---------------------------------------------------------------------------------------
// THE TRAPS' LOOKS (docs/plans/TRACK-EDITOR.md 4; Dovina's handoff of 2026-10-24): the seven traps of a made track, and of a park track
// in its haunted modes (world/raceway/traps.js, the rules progress/traps.js), dressed in place of her placeholders. Her `place` asks
// here first and keeps its placeholder only if this answers nothing; her `show` hands each trap's phase to its look every frame:
// `Tp.phase` idle, tell (Tp.k 0..1 through it) or active, `Tp.stun`, `Tp.lane`, `Tp.dir`, `Tp.swing`, `Tp.red`.
//   THE TELL      every trap tells in the one grammar (vfx/racewaytraps/kit.js): its reach drawn on the sand, faint gold at rest, ember
//                 and beating faster through the tell, hot while it acts; and the body's own motion (a slab rumbling, vanes spinning up,
//                 the sand turning, crude welling, an eye opening, a lamp swelling with a thread to its mark). Each tell is the trap's
//                 own length (at least 0.6 real s, TRAP.tellMin) and big enough to read from a board at speed and from the editor's
//                 camera 130 m up: the reach marks are metres wide and lit, never a hairline.
//   THE BODIES    the Raceway's glazed clay and gold, no words (world marks): vfx/racewaytraps/bodies.js (pillars, pendulum, gust,
//                 sinkhole) and bodies2.js (gusher, portal pair, Wisp turret), on the house's kits: crude's slick and oil film
//                 (vfx/slicks.js, vfx/oxidation.js), the caster shells' Portal (vfx/caster/portal.js), the Lantern Wisp's model and ember
//                 (vfx/lanternwisplook.js).
// Materials: the park's stone (vertex colours, flat), basic glows, the Portal's and the Wisp's warmed programs: no program added. Each
// trap owns its materials (her clear disposes what it finds); its outline hulls, portals and Wisp are taken out by its look's dispose
// before that (the house's hull material and the Wisp's geometry are shared).
//
// Prior art: in the bodies' headers; the house's Figment attack telegraph (where, when, what kind before the blow).
//
//   game.racewayTraps = new RacewayTraps(game)   .place(Tp, traps) -> look | null   .ball(Tp, pos) -> the turret's ember mesh
//   look: { root, show(Tp, t), dispose(), lamp? (the turret's: where a parried flame flies home) }
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { BODIES } from './racewaytraps/bodies.js';
import { BODIES2, ball } from './racewaytraps/bodies2.js';
import { releaseOutlines } from './racewaytraps/kit.js';

const BUILD = { ...BODIES, ...BODIES2 };

export class RacewayTraps {
  constructor(game) { this.game = game; }

  /** A trap's look, built in its root on the line (as her placeholder stands: on the line at its s, turned the race's way), or null. */
  place(Tp, traps) {
    const make = BUILD[Tp.kind]; if (!make || !traps?.group) return null;
    const root = new THREE.Group(), { F, pos } = traps.frameAt(Tp.s, 0);
    root.position.copy(pos); root.rotation.y = Math.atan2(F.fx, F.fz); root.name = `raceway-trap-${Tp.kind}`; traps.group.add(root);
    let L;
    try { L = make({ game: this.game, traps, Tp, root, R: traps.R, W: F.w }); } catch (e) { console.warn('[racewaytraps] a trap would not dress', Tp.kind, e); root.removeFromParent(); return null; }
    let last = null;
    return {
      root, lamp: L.lamp || root, arm: L.arm,
      show: (Tp2, t) => { const dt = last == null ? 0 : Math.max(0, Math.min(0.1, t - last)); last = t; L.show(Tp2, t, dt); },
      dispose: () => { for (const r of [root, L.far]) if (r) releaseOutlines(r); L.dispose?.(); }, // (what is left, her clear disposes)
    };
  }
  /** The turret's flame, as her cast flies it. */
  ball(Tp, pos) { return ball(this.game, Tp, pos); }
}
