// ---------------------------------------------------------------------------------------
// WHERE A PUZZLE DUEL IS MET (docs/plans/PUZZLE-DUELS.md sections 8 and 14; the owner, board v11: "the test enemy is an aberrant Lantern
// Wisp"). Three rules, all Dovina's ruling in section 14:
//   - how a Wisp goes aberrant: its lantern burns crude. At night (phaseAt, progress/weather.js) a Lantern Wisp drifting over a blot
//     (world/ground/stains.js) drinks it as a lamp drinks oil: it is aberrant (c.aberrant, dressed as a data bug, vfx/databug.js), the
//     weather's feeling where it drank is its grade, and the blot is spent (washed, by 'creature'). One Wisp a blot.
//   - how a duel opens: the first blow that lands on an aberrant Figment (creatures.strike asks `provoke`), never a key. The blow does
//     no harm: two minds meet and the domains expand (world/duel/duelsession.js). Any aberrant, the blotlings too.
//   - the test: one more Wisp kept by the Weir (DUEL_FOES.test, from the dunes' spawn), aberrant from the start and again each time it
//     forms after a mending, so the duel can be tried more than once; its debug chest (debug/kits.js 'duel') a few metres off. DEBUG only.
// Nothing opens until the view exists (game.duelView), so a build without it shows no half of a duel.
//
// Prior art: the symbol encounter of the RPGs (the foe met on the field, struck first to fight: Chrono Trigger, Persona's ambush), the
// will-o'-the-wisp's lamp (the light that leads you off the path), a lamp burning oil.
//
//   game.duelFoes = new DuelFoes(game)   .update()   .provoke(c) -> true when the blow opened (or is in) a duel   .chestSpot()   DUEL_FOES
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { phaseAt } from '../../progress/weather.js';
import { WEIR_SPAWN } from '../../tools/sondelass/angling/weir.js';

/** drinkY: how far above a blot (m) a Wisp drinks it; scan: real s between looks; test: the test Wisp's home and its chest, m from the
 *  dunes' spawn (south of the pond, short of the Dunes' own Wisps at 60 to 86 m). */
export const DUEL_FOES = { drinkY: 2.5, scan: 0.5, test: { dx: 18, dz: -24, chest: [12, -19] } };

export class DuelFoes {
  constructor(game) { this.game = game; this.scanT = 0; this.test = null; }

  /** A blow that lands on an aberrant Figment opens its duel, and does no harm (creatures.strike asks this first). */
  provoke(c) {
    const g = this.game;
    if (c.dueling) return true; // (the board stands: no blow reaches it in the world)
    if (!c.aberrant || c.dataBugMended || c.ally || c.spirit || !g.duelView || !g.duel || g.duel.active || g.duel.pending) return false;
    if (g.god?.controlling || g.realm?.active) return false;
    g.duel.begin(c); return true;
  }

  /** The test Wisp's debug chest: a few metres from its home, facing it (debug/debugchest.js 'oasis.duel'). */
  chestSpot() {
    const g = this.game, T = DUEL_FOES.test, x = WEIR_SPAWN.pos[0] + T.chest[0], z = WEIR_SPAWN.pos[2] + T.chest[1];
    const y = (X, Z) => g.dunes?.heightAt?.(X, Z) ?? WEIR_SPAWN.pos[1];
    const hx = WEIR_SPAWN.pos[0] + T.dx, hz = WEIR_SPAWN.pos[2] + T.dz;
    return { pos: new THREE.Vector3(x, y(x, z), z), face: new THREE.Vector3(hx, y(hx, hz), hz) };
  }

  update() {
    const g = this.game, W = g.wisps;
    if (!W) return;
    // the test Wisp, by the Weir (DEBUG): stood once, kept aberrant each time it forms again
    if (!this.test && g.mode === 'debug' && g.dunes) {
      const T = DUEL_FOES.test, x = WEIR_SPAWN.pos[0] + T.dx, z = WEIR_SPAWN.pos[2] + T.dz;
      this.test = W.spawn(new THREE.Vector3(x, g.dunes.heightAt?.(x, z) ?? WEIR_SPAWN.pos[1], z)); this.test.duelTest = true;
    }
    const t = this.test;
    if (t?.alive && (!t.aberrant || t.dataBugMended) && !t.dueling && !g.duel?.active) this.goWrong(t, g.weather?.here?.(t.pos)?.aspect || null);
    // the night's drinking: a Wisp over a blot drinks it and goes wrong
    if ((this.scanT -= g.rawDt ?? 1 / 60) > 0) return;
    this.scanT = DUEL_FOES.scan;
    const S = g.stains; if (!S?.list?.length || phaseAt() !== 'night') return;
    for (const c of W.list) {
      if (!c.alive || c.dueling || (c.aberrant && !c.dataBugMended)) continue;
      const s = S.list.find((b) => c.pos.y - b.y > -1 && c.pos.y - b.y < DUEL_FOES.drinkY && Math.hypot(b.x - c.pos.x, b.z - c.pos.z) < S.reach(b));
      if (!s) continue;
      const at = new THREE.Vector3(s.x, s.y, s.z);
      this.goWrong(c, g.weather?.here?.(at)?.aspect || null);
      S.wash(s, 'creature'); // (the blot spent: drunk, not mopped, so the ledger never counts it)
      g.events?.emit('wisp.drink', { field: s.field, aspect: c.grade, at: [s.x, s.y, s.z], by: 'creature' });
    }
  }

  /** Its flame goes wrong: aberrant (a data bug again if it was mended), its grade the weather's feeling where it drank. */
  goWrong(c, aspect) { c.aberrant = true; c.dataBugMended = false; c.grade = aspect; c.name = 'Aberrant Lantern Wisp'; } // (Espada names it)
}
