// ---------------------------------------------------------------------------------------
// THE KEEPSAKE POTS: a spirit let go leaves something behind (docs/plans/MYCELIUM.md section 5; the owner, 2026-10-08: "keep the pots").
// When you release a bound spirit, it is fired at the Chimney into a KEEPSAKE POT (Espada's look: a white-ground lekythos, the Greek oil
// flask for the remembered) that stands in your Inner Realm for good, holding its name, its kind, its colour and a line of its song
// (Wanda's). Release stays yours and stays literal ("bound until released"); it is no longer only a loss.
//
// Prior art: Spiritfarer's Everdoor (care that ends as a gift), the Chao Garden's reincarnation (a trace kept), Monster Rancher's
// memorials, and the white-ground lekythoi of Athens.
//
//   game.keepsakes = new Keepsakes(game)   .pots -> [{ spirit, kind, colour, at }]   (made on spirit.release; placed by the world)
// events: keepsake.pot { spirit, kind, pot }, with `by`
// ---------------------------------------------------------------------------------------
import * as calendar from '../core/calendar.js';

const fresh = () => ({ pots: [] });

export class Keepsakes {
  constructor(game) {
    this.game = game; this.s = fresh();
    game.save?.section('keepsakes', { scope: 'player', version: 1, dump: () => this.s, load: (d) => { this.s = { ...fresh(), ...(d || {}) }; }, reset: () => { this.s = fresh(); } });
    game.events?.on?.('spirit.release', (e) => { if (e.by === 'courier') this.make(e); });
  }
  get pots() { return this.s.pots; }
  /** A pot fired for a spirit let go: its name and kind, and the colour it had taken (its body's, when the raising keeps one). */
  make(e) {
    const pot = { spirit: e.spirit || null, kind: e.kind || null, colour: e.colour || null, at: calendar.now() };
    this.s.pots.push(pot); this.game.save?.dirty('keepsakes');
    this.game.events?.emit('keepsake.pot', { spirit: pot.spirit, kind: pot.kind, pot: this.s.pots.length - 1, by: 'courier' });
    return pot;
  }
}
