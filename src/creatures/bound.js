// ---------------------------------------------------------------------------------------
// THE BOUND: the Figments the Courier has caught, waiting in the Pneuka Jar until they next enter their Inner Realm, where they hop out
// into the Grove (docs/plans/SPIRIT-GARDEN.md, section 5a; the garden itself is Round 2's). A Figment is caught two ways, one a gamble and
// one a skill: the Lockheart's summoning coffin opened on it while it lies critically stunned (the catch wheel at `catchOdds`:
// tools/lockheart/lockheart.js), or the god hand holding it, stunned, over the Jar's mouth through its struggle (godhand/catch.js).
// Either way it is BOUND: taken out of the world whole (no burst: `jellies.take`), written here, kept in the save, and never lost: a
// spirit is bound until it is released (the owner).
//
// Prior art: Pokemon's party box (a caught creature waits in storage until it is wanted), Jade Cocoon's cocoons, and the jar spirits of
// folklore (a genie, a spirit sealed in a vessel).
//
//   game.bound = new Bound(game)   .bind(creature, from, by?) -> entry   .list   .release(i)
//   events: spirit.bind { from: 'lockheart' | 'hand', kind, cls, spirit, by }, spirit.release { kind, spirit, by }
// ---------------------------------------------------------------------------------------
import { now as calNow } from '../core/calendar.js';

export class Bound {
  constructor(game) {
    this.game = game; this.list = [];
    game.save?.section('bound', { scope: 'player', version: 1, dump: () => this.list, load: (d) => { this.list = Array.isArray(d) ? d : []; }, reset: () => { this.list = []; } });
  }

  /** Can this be caught at all? A Figment (a creature with a mind), never a FOE, an ally, a nest, or a thing in training. */
  catchable(c) { return !!c?.alive && c.type === 'creature' && !c.ally && !c.inert && !c.foeOf && !c.training && !!c.brain; }

  /** Caught: out of the world whole, into the Jar. */
  bind(c, from, by = 'courier') {
    const g = this.game;
    if (!this.catchable(c)) return null;
    const e = { kind: c.kind, name: c.name, cls: c.cls || 0, from, emo: +(c.emo || 0).toFixed(2), mind: +(c.mind || 0).toFixed(2), traits: c.traits ? { ...c.traits } : null, at: calNow() };
    this.list.push(e);
    g.save?.dirty('bound');
    if (c.kind === 'slipjelly' || c.kind === 'spirit') g.jellies?.take(c, by); else { c.alive = false; c.root && (c.root.visible = false); g.creatures.remove(c); }
    g.events?.emit('spirit.bind', { from, kind: e.kind, cls: e.cls, spirit: e.name || null, by }); // (`spirit`: its name; the bus's `name` is the event's)
    return e;
  }

  /** Let one go (the garden's hand will do it; Pokemon never release themselves). */
  release(i) {
    const e = this.list.splice(i, 1)[0]; if (!e) return null;
    this.game.save?.dirty('bound');
    this.game.events?.emit('spirit.release', { kind: e.kind, spirit: e.name || null, by: 'courier' });
    return e;
  }
}
