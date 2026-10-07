// ---------------------------------------------------------------------------------------
// INTERACT: what the Courier could use right now. Anything that can be acted on with F (lifting a pot, taking hold of a crate, the
// index console, a chest) registers a source here: a function that says which one thing it would act on, if any, from where they are.
// The nearest of them gets the chevron (vfx/chevron.js). Nothing here acts: the modules act, on their own keys; this only points.
//
//   game.interact.add('carry', () => ({ pos: Vector3 (the marker's place), d: distance, up?: Vector3 (where up is not the world's) }) | null)
//   .cur (the one with the chevron)   .offers (every source's one thing, this sweep)   .pin(ref, secs) (that one wins while it is offered:
//   an agent naming what it means, docs/plans/COOP.md; nearest-wins chose a pot over the folk beside it)
// ---------------------------------------------------------------------------------------
import { Chevron } from '../vfx/chevron.js';


export class Interact {
  constructor(game) {
    this.game = game;
    this.sources = [];
    this.chevron = new Chevron(game.scene);
    this.cur = null;
    this.throttle = 0;
    this.lost = 0;
    this.offers = [];
    this.pinned = null; // { ref, t }
  }

  add(id, fn) { this.sources.push({ id, fn }); }
  pin(ref, secs = 0.5) { this.pinned = { ref, t: secs }; this.throttle = 0; }

  update(dt) {
    const g = this.game, P = g.player;
    // (only a few times a second: the searches walk lists)
    this.throttle -= dt;
    if (this.throttle <= 0) {
      this.throttle = 0.08;
      let best = null, keep = null, pin = null;
      this.offers = [];
      if (this.pinned && (this.pinned.t -= 0.08) <= 0) this.pinned = null;
      const hidden = g.god?.controlling || g.techs?.active?.id === 'skiff' || g.techs?.active?.id === 'swim' || g.codex?.open || g.cinema?.active; // (a shot that is framed has no markers in it)
      if (!hidden) for (const s of this.sources) {
        let r = null;
        try { r = s.fn(P); } catch { r = null; }
        if (!r) continue;
        r = { ...r, id: s.id, ref: r.ref ?? s.id };
        this.offers.push(r);
        if (this.pinned && r.ref === this.pinned.ref) pin = r;
        if (this.cur && r.ref === this.cur.ref) keep = r;
        if (!best || r.d < best.d) best = r;
      }
      // hysteresis: the thing it is on keeps it unless another is clearly nearer, and a moment's absence (a step back across the
      // edge of reach) does not take it away
      if (keep && best !== keep && best.d > keep.d - 0.4) best = keep;
      if (pin) best = pin;
      if (!best && this.cur && !hidden && !g.techs?.active && !g.techs?.get('carry')?.item && (this.lost += 0.08) < 0.24) best = this.cur;
      else if (best) this.lost = 0;
      this.cur = best;
      this.chevron.target(best ? best.pos : null, best?.up); // (a source may give its up: the garden's planetoids, GARDEN-SWEEP #4)
    }
    this.chevron.update(dt); // (it turns and bobs along the offer's up itself: vfx/chevron.js)
  }
}
