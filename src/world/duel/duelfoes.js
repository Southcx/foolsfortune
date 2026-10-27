// ---------------------------------------------------------------------------------------
// WHERE A PUZZLE DUEL IS MET (docs/plans/PUZZLE-DUELS.md sections 8 and 14; the owner, board v11: "the test enemy is an aberrant Lantern
// Wisp"). Three rules, all Dovina's ruling in section 14:
//   - how a Wisp goes aberrant: its lantern burns crude. At night (phaseAt, progress/weather.js) a Lantern Wisp drifting over a blot
//     (world/ground/stains.js) drinks it as a lamp drinks oil: it is aberrant (c.aberrant, dressed as a data bug, vfx/databug.js), the
//     weather's feeling where it drank is its grade, and the blot is spent (washed, by 'creature'). One Wisp a blot.
//   - how a duel opens: nearness, never a key or a blow (the owner, 2026-10-20; PUZZLE-DUELS.md 16.3). Inside `pull.near` m of an
//     aberrant a pull fills over `pull.fill` real s; outside `pull.far` it drains at twice that (the gap between keeps the edge from
//     flickering); at 1 the duel opens (world/duel/duelsession.js). A blow on an aberrant does no harm and opens nothing (creatures.js:
//     the resist mark). No pull in the god hand, the Spirit Garden, on the skiff or a ship, or while shattered. Any aberrant, the
//     blotlings too. `pull` (0..1) and `pullFoe` are what the pull's look and sound read (Calissa's, Wanda's).
//   - the test: one more Wisp kept by the Weir (DUEL_FOES.test, from the dunes' spawn), aberrant from the start and again each time it
//     forms after a mending, so the duel can be tried more than once; its debug chest (debug/kits.js 'duel') a few metres off. DEBUG only.
// - after a duel its foe is `rearm`: no pull from it until the Courier has stood past `pull.far` (a still-aberrant one, a fled Wisp or
//   Strawman in practice, would pull you straight back in). Any aberrant with `practice` (Strawman's) opens a practice duel.
// Nothing opens until the view exists (game.duelView), so a build without it shows no half of a duel.
//
// Prior art: the symbol encounter of the RPGs (the foe met on the field; EarthBound's and Pokemon's step into its sight and the battle
// takes you), Metal Gear's alert meter (a fill you can still walk out of), the will-o'-the-wisp's lamp (the light that leads you off the
// path), a lamp burning oil.
//
//   game.duelFoes = new DuelFoes(game)   .update()   .pull (0..1)   .pullFoe   .chestSpot()   DUEL_FOES
//   events: duel.pull { foe, by: 'creature' } (a pull begins)   duel.slip { by: 'courier' } (it drained away unfilled)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { phaseAt } from '../../progress/weather.js';
import { WEIR_SPAWN } from '../../tools/sondelass/angling/weir.js';

/** drinkY: how far above a blot (m) a Wisp drinks it; scan: real s between looks; test: the test Wisp's home and its chest, m from the
 *  dunes' spawn (south of the pond, short of the Dunes' own Wisps at 60 to 86 m). */
export const DUEL_FOES = { drinkY: 2.5, scan: 0.5, test: { dx: 18, dz: -24, chest: [12, -19] },
  pull: { near: 4, far: 6, fill: 1.5, drain: 0.75 } }; // (the pull: m, m, real s from 0 to 1 inside near, real s from 1 to 0 outside far: PUZZLE-DUELS.md 16.3)

export class DuelFoes {
  constructor(game) { this.game = game; this.scanT = 0; this.test = null; this.pull = 0; this.pullFoe = null; this.rearm = null; }

  /** The pull: nearness to an aberrant fills it, distance drains it, and at 1 its duel opens. */
  updatePull(raw) {
    const g = this.game, P = g.player, D = DUEL_FOES.pull;
    const barred = !P || !g.duelView || !g.duel || g.duel.active || g.duel.pending || g.god?.controlling || g.realm?.active || g.skiff?.active || g.emocean?.stage?.active || g.death?.active;
    if (barred) { this.pull = 0; this.pullFoe = null; return; }
    if (this.rearm && !(this.rearm.alive && this.rearm.pos.distanceTo(P.pos) <= D.far)) this.rearm = null; // (a duel's foe pulls again only once you have been past the far edge)
    const open = (c) => c?.alive && c.aberrant && !c.dataBugMended && !c.ally && !c.spirit && c !== this.rearm;
    let foe = open(this.pullFoe) ? this.pullFoe : null, d = foe ? foe.pos.distanceTo(P.pos) : Infinity;
    if (!foe) for (const c of g.creatures?.list || []) if (open(c)) { const k = c.pos.distanceTo(P.pos); if (k < d) { d = k; foe = c; } }
    if (d < D.near) {
      if (this.pull === 0) g.events?.emit('duel.pull', { foe: foe.kind, ...(foe.practice ? { practice: true } : {}), by: 'creature' });
      this.pullFoe = foe; this.pull = Math.min(1, this.pull + raw / D.fill);
      if (this.pull >= 1) { this.pull = 0; this.pullFoe = null; g.duel.begin(foe); }
    } else if (d > D.far && this.pull > 0) {
      this.pull = Math.max(0, this.pull - raw / D.drain);
      if (this.pull === 0) { this.pullFoe = null; g.events?.emit('duel.slip', { by: 'courier' }); }
    }
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
    this.updatePull(g.rawDt ?? 1 / 60);
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
