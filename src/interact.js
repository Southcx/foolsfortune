// ---------------------------------------------------------------------------------------
// INTERACT: what the Courier could use right now. Anything that can be acted on with F (lifting a pot, taking hold of a crate, the
// index console, a chest) registers a source here: a function that says which one thing it would act on, if any, from where she is.
// The nearest of them gets the chevron (vfx/chevron.js). Nothing here acts: the modules act, on their own keys; this only points.
//
//   game.interact.add('carry', () => ({ pos: Vector3 (the marker's place), d: distance }) | null)
// ---------------------------------------------------------------------------------------
import { Chevron } from './vfx/chevron.js';

export class Interact {
  constructor(game) {
    this.game = game;
    this.sources = [];
    this.chevron = new Chevron(game.scene);
    this.cur = null;
    this.throttle = 0;
  }

  add(id, fn) { this.sources.push({ id, fn }); }

  update(dt) {
    const g = this.game, P = g.player;
    // (only a few times a second: the searches walk lists)
    this.throttle -= dt;
    if (this.throttle <= 0) {
      this.throttle = 0.08;
      let best = null;
      const hidden = g.god?.controlling || g.techs?.active?.id === 'surfer' || g.techs?.active?.id === 'swim' || g.codex?.open || g.cinema?.active; // (a shot that is framed has no markers in it)
      if (!hidden) for (const s of this.sources) {
        let r = null;
        try { r = s.fn(P); } catch { r = null; }
        if (r && (!best || r.d < best.d)) best = { ...r, id: s.id };
      }
      this.cur = best;
      this.chevron.target(best ? best.pos : null);
    }
    this.chevron.update(dt);
  }
}
