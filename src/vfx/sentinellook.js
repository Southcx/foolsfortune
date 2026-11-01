// ---------------------------------------------------------------------------------------
// A SENTINEL'S MOMENTS, PLAYED (game.sentinelLook): Petra's sentinel events (creatures/sentinel/sentinels.js) answered with the library's
// sentinel.* effects (vfx/library/sentinel.js) where the sentinel stands. Looks only: it listens and plays, never decides. The body
// itself (vfx/sentinelbody.js) carries the rise, the windup's pose, a blow's flash and cracks and the crumble; these are what the island
// throws round it.
//   sentinel.wake     the sand heaved up round where it rises (a beat after the event: the body's rise has started)
//   sentinel.cast     its slam let go: the shock of sand where the shield came down, a step before its feet
//   sentinel.crack    chips off its chest (`at` its feet, the chest SENTINEL_LOOK_AT.chest m over them)
//   sentinel.mend     the kiln's breath where it wore a creation back (its feet: it mends from within reach)
//   sentinel.fall     the slump of sand as it crumbles
// An event with no `at` is placed at the nearest sentinel alive (game.sentinels.list), else at the last one seen.
//
// Prior art: the house's split of rules from looks (game.domainLooks over the domains, game.panicMarks over the thrown hit).
//
//   game.sentinelLook = new SentinelLook(game)   (boot/world.js, beside the domains' looks)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

export const SENTINEL_LOOK_AT = { chest: 1.4, slamAhead: 1.1, wakeDelay: 0.15 };
const MOMENTS = { wake: 'sentinel.wake', cast: 'sentinel.slam', crack: 'sentinel.crack', mend: 'sentinel.mend', fall: 'sentinel.fall' };

export class SentinelLook {
  constructor(game) {
    this.game = game; this.last = null;
    for (const [ev, fx] of Object.entries(MOMENTS)) game.events?.on?.(`sentinel.${ev}`, (e) => this.play(ev, fx, e || {}));
  }

  /** Where the sentinel the event speaks of stands: its `at`, else the nearest one alive. */
  where(e) {
    if (Array.isArray(e.at)) return { pos: new THREE.Vector3(...e.at), c: this.nearest(e.at) };
    const c = this.nearest(null); if (c) return { pos: c.pos.clone(), c };
    return this.last ? { pos: this.last.clone(), c: null } : null;
  }
  nearest(at) {
    const L = this.game.sentinels?.list || []; let best = null, bd = Infinity;
    for (const c of L) { if (!c.pos) continue; const d = at ? (c.pos.x - at[0]) ** 2 + (c.pos.z - at[2]) ** 2 : (c.alive ? 0 : 1); if (d < bd) { bd = d; best = c; } }
    return best;
  }

  play(ev, fx, e) {
    const g = this.game, W = this.where(e); if (!W || !g.vfx) return;
    const pos = W.pos; this.last = pos.clone();
    if (ev === 'crack') pos.y += SENTINEL_LOOK_AT.chest;
    if (ev === 'cast' && W.c) { const y = W.c.root?.rotation?.y ?? W.c.yaw ?? 0; pos.x += Math.sin(y) * SENTINEL_LOOK_AT.slamAhead; pos.z += Math.cos(y) * SENTINEL_LOOK_AT.slamAhead; }
    if (ev === 'wake') { setTimeout(() => g.vfx.play(fx, { pos }), SENTINEL_LOOK_AT.wakeDelay * 1000); return; }
    g.vfx.play(fx, { pos });
  }
}
