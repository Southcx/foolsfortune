// ---------------------------------------------------------------------------------------
// THE TYPE CHART'S TELLS (SUBSTRATE.md F3; GAPS G269): the type chart read in play. A blow whose damage type trumps the body it struck
// (progress/combat/types.js TRUMPS against the body's affinity, progress/combat/constitution.js: the same two the strike's multiplier
// reads) shows a trump's flash at the hit: a small sharp star in the type's colour (DAMAGE_TINT) over a cracked-glass star, and, now and
// then, the status that type builds as its glyph over the body (`status.<id>`, the Figment telegraphs' own pictures: the type's sign, as
// those telegraphs show it). A blow the body turns aside by type (the multiplier under 1) shows the dull deflect and the resist mark.
// One language with the puzzle duel's WEAK and RESIST (vfx/duelview/juice.js): the sharp spark and the cracked-glass star, the dull grey
// deflect; in the world without the word (a world mark: CLAUDE.md), the glyph saying which type it was.
// Looks only: it reads the rule, never moves a number. Asked by vfx.hit (vfx/vfx.js), which every typed blow on a creature passes through.
//
// Prior art: Pokemon's "super effective" spark and Shin Megami Tensei's and Persona's WEAK / RESIST (scouting a weakness is the play);
// the duel's juice (the house's own form of them).
//
// A status a creature resists (`creature.resist { at }`) shows the same deflect at its chest.
//
//   const tells = new TypeTells(game)   tells.hit(ent, type, point)   TYPE_TELL (its numbers)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { TRUMPS, TYPES, multiplier } from '../progress/combat/types.js';
import { affinityOf } from '../progress/combat/constitution.js';
import { DAMAGE_TINT } from './library/damage.js';

/** `glyphEvery`: real s between one body's type glyphs (a fast tool's every shot still sparks; its sign is said once a while);
 *  `glyphSize`, `glyphUp` (m over the body's height). */
export const TYPE_TELL = { glyphEvery: 1.6, glyphSize: 0.42, glyphUp: 0.35 };

const _v = new THREE.Vector3();

export class TypeTells {
  constructor(game) {
    this.game = game; this.said = new WeakMap();
    // A status the creature shrugged off (creatures.js's `creature.resist`, carrying `at`): the same dull deflect at its chest.
    game.events?.on?.('creature.resist', (e) => { if (e?.at && game.vfx) game.vfx.play('tell.resist', { pos: _v.set(e.at.x, e.at.y + 1, e.at.z).clone() }); });
  }

  /** A typed blow landed on `ent` at `point`: its trump's flash or its resist, if the chart says either. */
  hit(ent, type, point) {
    const g = this.game; if (!type || !point || ent?.type !== 'creature' || !g.vfx) return;
    const aff = affinityOf(ent); if (!aff) return;
    const k = multiplier(type, aff).dmg;
    if (TRUMPS[type] === aff) {
      g.vfx.play('tell.trump', { pos: point, tint: DAMAGE_TINT[type] ?? 0xffffff });
      const now = performance.now() / 1000, last = this.said.get(ent) ?? -99, id = TYPES[type]?.builds;
      if (id && now - last > TYPE_TELL.glyphEvery && g.glyphs && ent.pos) {
        this.said.set(ent, now);
        g.glyphs.pop(`status.${id}`, _v.set(ent.pos.x, ent.pos.y + (ent.height ?? 1.2) + TYPE_TELL.glyphUp, ent.pos.z), { color: DAMAGE_TINT[type], size: TYPE_TELL.glyphSize, burst: true, ring: false });
      }
    } else if (k < 1) g.vfx.play('tell.resist', { pos: point });
  }
}
