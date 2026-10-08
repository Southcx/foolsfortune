// ---------------------------------------------------------------------------------------
// THE COURIER'S MENTAL STATE AND DRAUGHT, KEPT (the glossary: mental state, one word for the Courier's and the creatures'; Dovina's
// numbers, progress/stones.js COURIER_MIND and DRAUGHT; SPIRIT-GARDEN.md section 7, "the keeper"). The mind is a number on the creatures'
// own scale (progress/combat/mind.js: -2 Stoic .. 0 Balanced .. +2 Prismatic, one whole state is 1), so the same `stateOf`, `pushed` and
// `settle` serve both. A drink of Lachryma from the world (a bauble, the Lachrymato Bottle, a shot absorbed at sea, the gulp, a parry's
// soak: the pool's `gain` events, never its regeneration) pushes it by COURIER_MIND.perDrink x the stone's `heady` x the amount; a drink
// past full (the pool's `overflow`) by perOverflow, and leaves you **brimming** for BRIM real seconds. After QUIET real seconds with no
// drink it settles back toward Balanced at settlePerSec. The **draught** is the feeling of the Lachryma last drunk: the weather where it
// was drunk, by the stone's tint (`draughtOf`), fading over a real minute. Kept in one save section with the pool's level ('pool').
// `game.courierMind` { mind, v (0..1, Dovina's view: 0.5 at rest), state ('Stoic' .. 'Prismatic'), brimming } is what the garden's rain
// reads (world/garden/waterworks.js); `game.draught` { aspect: share } is what the garden's lake, the music and the sky read.
// Events: mind.state { state, by }, mind.brim { by }, mind.settle { by } (the log says them: tracking.js).
//
// Prior art: Darkest Dungeon's stress (a meter moved by what you do, settled by rest), and the creatures' own mental state here.
//
//   const M = new CourierMind(game)   M.update(dt)   M.mind   M.v   M.state   M.brimming   game.draught
// ---------------------------------------------------------------------------------------
import { COURIER_MIND, DRAUGHT, stoneOf, draughtOf } from '../progress/stones.js';
import { stateOf, pushed, settle } from '../progress/combat/mind.js';

const DRINKS = new Set(['bauble', 'bottle', 'absorb', 'gulp', 'parry']); // (what is drunk from the world; a refill from a jackpot or a wave is not a drink)
const BRIM = 2, QUIET = 5; // (real seconds brimming after an overflow; real seconds of quiet before it settles)

export class CourierMind {
  constructor(game) {
    this.game = game; this.mind = 0; this.brimT = 0; this.quiet = Infinity; this.lastState = 'Balanced';
    game.draught = {};
    const pool = game.lachryma;
    pool?.on('gain', (e) => { if (DRINKS.has(e.source)) this.drink(e.amount, false); });
    pool?.on('overflow', (e) => { if (DRINKS.has(e.source)) this.drink(e.amount, true); });
    game.save?.section('pool', { scope: 'player', version: 1, // (the pool's level, the mind and the draught: one record, so they never disagree)
      dump: () => ({ value: +(pool?.value ?? 0).toFixed(2), mind: +this.mind.toFixed(3), draught: game.draught }),
      load: (d) => { if (pool && Number.isFinite(d?.value)) pool.value = Math.min(pool.max, d.value); this.mind = Number.isFinite(d?.mind) ? d.mind : 0; game.draught = d?.draught && typeof d.draught === 'object' ? d.draught : {}; this.lastState = this.state; },
      reset: () => { this.mind = 0; this.brimT = 0; game.draught = {}; this.lastState = 'Balanced'; } });
    game.courierMind = this;
  }

  get stone() { return this.game.vessel?.look?.stones; }
  get state() { return stateOf(this.mind).name; }
  get v() { return (this.mind + 2) / 4; } // (Dovina's 0..1 view: 0.5 Balanced)
  get brimming() { return this.brimT > 0; }

  /** A drink: the mind pushed by the stone's headiness, the draught set by the weather where it was drunk. */
  drink(amount, over) {
    const g = this.game, S = stoneOf(this.stone);
    this.mind = pushed(this.mind, S.heady * (over ? COURIER_MIND.perOverflow : COURIER_MIND.perDrink) * amount);
    this.quiet = 0;
    if (over) { if (!this.brimming) g.events?.emit('mind.brim', { by: 'courier' }); this.brimT = BRIM; }
    const w = g.weather?.here?.(g.player?.pos);
    if (w?.aspect) { const d = draughtOf(this.stone, w.aspect, w.strength, w.second || null, w.secondStrength || 0); if (Object.keys(d).length) g.draught = d; }
    this.dirty();
  }

  update(dt) {
    const g = this.game;
    this.quiet += dt;
    if (this.brimT > 0 && (this.brimT -= dt) <= 0) g.events?.emit('mind.settle', { by: 'courier' });
    if (this.quiet > QUIET && this.mind !== 0) { this.mind = settle(this.mind, dt, 0); if (this.mind === 0) this.dirty(); }
    for (const k of Object.keys(g.draught)) { g.draught[k] -= DRAUGHT.fadePerSec * dt; if (g.draught[k] <= 0) delete g.draught[k]; }
    const s = this.state;
    if (s !== this.lastState) { this.lastState = s; g.events?.emit('mind.state', { state: s, by: 'courier' }); this.dirty(); }
  }
  dirty() { this.game.save?.dirty('pool'); }
}
