// ---------------------------------------------------------------------------------------
// THE FEELINGS' LOOKS ON THE COURIER: the drink, seen. When the Courier's pool drinks Lachryma from the world (the pool's `gain` from a
// drink: a bauble taken in, a shot absorbed at sea, the gulp, a parry's soak; never its regeneration, a refund or a jackpot), the
// feeling it drank is the weather's where they stand, as their draught is (courier/mind.js reads it the same way), and that feeling's
// `feeling.<f>.drink` (vfx/library/feelings/) is drawn into them at the chest: gathered from round them, made visible, taken in, glowing
// a breath. The Lockheart's hoover drawing a laid-low mind's Lachryma out (`lockheart.drain { feeling }`) is drawn into them the same way,
// a little quieter (the coffin is in their hands). Fair weather (no feeling) draws nothing: the plain absorb's sparkle is the bauble's own.
//
// A run of drinks is one look a beat, never a stack: a combo of baubles in half a second is one drink, its strength the amount taken in
// that beat (vfx/vfx.js `power`). The Lachrymato Bottle's slow feed below half is not drawn here (its own looks show it draining: the
// bottle's arc and the spiritual link). It follows the Courier while it plays; its motes, once thrown, are the world's.
//
// Prior art: Shintaro Takai on Cure (VFX director, Final Fantasy VII Remake; CGWorld, 2018: energy gathered, made visible, absorbed into
// the body, then glowing); Brave Fencer Musashi's (Square, 1998) absorbing: a pull-in, then the borrowed colour worn (docs/ref/VFX-PRIOR-
// ART.md 1.8, 1.18).
//
//   game.feelingLooks = new FeelingLooks(game)   .drink(feeling, { power }) -> handle | null (the look alone: nothing drunk, nothing
//   counted)   DRINK (its sources, its beat and the chest's height)
// ---------------------------------------------------------------------------------------
import { ASPECTS } from '../progress/weather.js';

/** The drink's numbers: which of the pool's gains are a drink drawn here, the beat a run of them shares, how high the chest is. */
export const DRINK = {
  sources: new Set(['bauble', 'absorb', 'gulp', 'parry']), // (courier/mind.js's drinks but the Bottle's feed: its own looks draw it)
  beat: 0.45, // (real s: drinks inside one beat are one look, its strength their sum)
  per: 12, // (the pool's units that make a drink of full strength)
  power: [0.6, 1.4], // (a drink's strength, least and most)
  chest: 1.05, // (m over the feet the drink is drawn into)
  drain: 0.7, // (the hoover's drain drawn quieter: the coffin drinks it)
};
const FEELINGS = new Set(ASPECTS);

export class FeelingLooks {
  constructor(game) {
    this.game = game;
    this.last = -Infinity; this.held = 0; // (when the last drink was drawn, real s; what has been drunk since, held for the next beat)
    game.lachryma?.on?.('gain', (e) => { if (DRINK.sources.has(e?.source)) this.drank(e.amount || 0); });
    game.events?.on?.('lockheart.drain', (e) => { if (e?.by === 'courier' && FEELINGS.has(e.feeling)) this.drink(e.feeling, { power: DRINK.drain }); });
  }

  /** A drink from the world: the feeling of the weather where they stand, drawn in once a beat with the beat's amount. */
  drank(amount) {
    const g = this.game, w = g.weather?.here?.(g.player?.pos);
    if (!FEELINGS.has(w?.aspect)) return;
    if (performance.now() / 1000 - this.last > DRINK.beat * 3) this.held = 0; // (what was held over belongs to a run that has ended)
    this.held += amount;
    const [lo, hi] = DRINK.power, power = Math.min(hi, lo + (hi - lo) * Math.min(1, this.held / DRINK.per));
    if (this.drink(w.aspect, { power })) this.held = 0;
  }

  /** The feeling's drink drawn into the Courier at the chest, following them (null inside a beat of the last, or with no Courier). */
  drink(feeling, { power = 1 } = {}) {
    const g = this.game, P = g.player?.pos, now = performance.now() / 1000;
    if (!P || !g.vfx || !FEELINGS.has(feeling) || now - this.last < DRINK.beat) return null;
    this.last = now;
    return g.vfx.play(`feeling.${feeling}.drink`, { pos: P.clone().setY(P.y + DRINK.chest), floor: P.y, power, follow: (h) => {
      const p = g.player?.pos; if (p) { h.pos.set(p.x, p.y + DRINK.chest, p.z); h.ctx.floor = p.y; }
      return true;
    } });
  }
}
