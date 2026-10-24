// ---------------------------------------------------------------------------------------
// POT WRECKS: what a break leaves, and making a pot whole again. `onGone` runs when a pot is gone (shattered or sliced): its placer hears
// it (`def.onBreak`), a gold one pays its kintsugi drop, and one marked `wreck` leaves a wreck site on the floor under it (up to 24 are
// kept) for the clapperjars to rebuild; `rebuild(wreck)` is the repair done: the pot pops back with gold seams. `mend(ent)` makes a cracked
// pot that still stands whole: its cracks turn gold and it is tougher; `mendWithin(at, r)` does both to everything broken within r of a
// point and says how many (the caller says what did it: Bloom, a World shell).
//
// Laid onto Breakables (world/props/breakables.js) as methods of the class (`this` is the Breakables), the way tools/stringrun.js is
// laid onto the Moveset; split out of breakables.js to keep it under the module contract's 800 lines.
//
//   POT_WRECKS: onGone(ent, basePos)   rebuild(wreck) -> ent   mend(ent)   mendWithin(at, r) -> n
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { GROUPS } from '../../core/physics.js';
import { T } from '../../core/config.js';
import { PROFILES } from './pottery.js';
import { setCracks } from './potcracks.js';
import { stream } from '../../core/rng.js';
const simRand = stream('world/props/breakables'); // (the simulation's chance: core/rng.js, the same twice; the breakables' one stream, drawn from by every part)

const UP = new THREE.Vector3(0, 1, 0);

export const POT_WRECKS = {
  /** Shared by shatter + slice: kintsugi payout, and leave a wreck site to rebuild. */
  onGone(ent, basePos) {
    const def = ent.def;
    def.onBreak?.(ent, basePos.clone().setY(basePos.y + ent.P.height * 0.5), ent.by || 'courier'); // (whoever placed it hears it go: a Well's find, world/well/finds.js)
    if (ent.gold) {
      const c = basePos.clone().setY(basePos.y + ent.P.height * 0.5);
      this.game.baubles?.spawn(c, T.clappers.kintsugiDrop * ent.gold);
      this.fx.glitter([c], c, UP, new THREE.Color(0xf2b24a));
    }
    // (a broken pot stays broken: only one marked `wreck` leaves a site the clapperjars rebuild; the Throwing Room's come back by their own
    // `respawn` (the owner, 2026-10-06: "pots should respawn only if in a designated testing area, not the whole workshop"))
    if (!def.wreck || def.hang || def.lantern || def.ember || def.slip || def.target || def.respawn || ent.size < 0.2) return;
    // the site is the floor under where it broke
    const down = this.physics.raycast({ x: basePos.x, y: basePos.y + 0.2, z: basePos.z }, { x: 0, y: -1, z: 0 }, 12, undefined, GROUPS.controllerQuery,
      (c) => !c.isSensor() && !c.parent()?.isDynamic());
    if (!down || down.normal.y < 0.8) return;
    this.wrecks.push({ def, pos: down.point.clone(), t: this.game?.events?.time ?? 0, gold: ent.gold || 0, claimed: null, size: ent.size, rMax: ent.P.rMax });
    if (this.wrecks.length > 24) this.wrecks.shift();
  },

  /** A clapperjar finished a repair: the pot pops back with gold seams. */
  rebuild(w) {
    const i = this.wrecks.indexOf(w);
    if (i >= 0) this.wrecks.splice(i, 1);
    const ent = this.spawn({ ...w.def, pos: [w.pos.x, w.pos.y + 0.01, w.pos.z], popIn: true, gold: Math.min(3, (w.gold || 0) + 1), yaw: simRand() * Math.PI * 2, facing: undefined });
    this.game.onRepaired?.(ent);
    return ent;
  },

  /** Everything broken within r of `at` made whole, as the clapperjars would (a wreck rebuilt with gold seams, a cracked pot's cracks
   *  turned gold); returns how many. The caller says what did it (Bloom, a World shell: tools/psygun/shellworld.js emits `shell.mend`). */
  mendWithin(at, r) {
    let n = 0;
    for (const w of [...this.wrecks]) if (Math.hypot(w.pos.x - at.x, w.pos.z - at.z) <= r && Math.abs(w.pos.y - at.y) < 4) { this.rebuild(w); n++; }
    for (const ent of this.items) {
      if (!ent.alive || !(ent.crackStage > 0)) continue;
      const p = ent.body.translation();
      if (Math.hypot(p.x - at.x, p.z - at.z) <= r && Math.abs(p.y - at.y) < 4) { this.mend(ent); n++; }
    }
    return n;
  },

  /** Mend a cracked (still standing) pot: cracks turn to gold, and it's tougher. */
  mend(ent) {
    if (!ent.alive) return;
    const dark = ent.cracks?.dark || [];
    const gold = [...(ent.cracks?.gold || []), ...dark];
    ent.gold = Math.min(3, (ent.gold || 0) + 1);
    ent.maxHp = (ent.def.hp ?? PROFILES[ent.kind].hp ?? 100) * T.clappers.kintsugiHp;
    ent.hp = ent.maxHp;
    ent.crackStage = 0;
    ent.col.setContactForceEventThreshold(ent.body.mass() * 45);
    setCracks(ent, { dark: [], gold });
  },
};
