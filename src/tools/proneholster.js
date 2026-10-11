// ---------------------------------------------------------------------------------------
// THE PRONE HOLSTER: lying down, the hands are on the floor (the owner, 2026-10-11: "when going prone all active tools should be
// sheathed. it looks SUPER goofy otherwise"). Going prone (player.posture 'prone', from the stand or the crouch) puts the tool in the
// hands back in its holster through the belt, as its own key would (its stow, which plays the stow), while the body goes down. (A pot in
// the hands keeps them off the belly altogether: C from the crouch stands them up, player.js; set down on the way, it read as a stoop and
// a flop, measured.) While prone no tool comes out: a worn tool's key is spent here, before the tools read it, and
// the log says why (once in a while). The psygun hears none of its own keys while `busy` (the fire button, a shell, the aim, a reload:
// tools/psygun/weapon.js reads it as another tool out) and lets go of what its trigger held, so nothing pressed lying down fires once
// up; `busy` is also the passive techs' "both hands taken" (courier/moves/techs.js), as for a ladder or a swim. Once up (the getting up
// played out: player.postureT), the tool that was in the hands is drawn again through the belt, so the hands are as they were left; one
// put away by hand while it was still going back (its key pressed then) stays away.
//
// Prior art: Metal Gear Solid's crawl (nothing drawn on the belly; the gun along the body), The Last of Us's and Uncharted's holster on a
// climb (put away for it and taken out again after), and this game's own psygun, which goes away for a ladder or a swim and comes back
// (tools/psygun/weapon.js, `handsBusy`), as the tools' own `resume` does for a carried pot (tools/heldtool.js).
//
//   game.proneHolster = techs.add(new ProneHolster(techs))   (main.js: a passive tech, for `busy`)
//   proneHolster.update()   once a frame, before the psygun's own (main.js): the stow, the spent keys, the draw again
//   proneHolster.busy       lying down or getting up (both hands taken)     proneHolster.memo   the tool to draw again once up, or null
// ---------------------------------------------------------------------------------------
import { Tech } from '../courier/moves/techs.js';

/** What the log says to a draw key pressed lying down (the words a placeholder for Espada's). */
export const PRONE_REFUSAL = "You can't draw a tool lying down.";

export class ProneHolster extends Tech {
  constructor(mgr) {
    super(mgr, 'proneHolster');
    this.passive = true;
    this.down = false; // lying down, or getting up from it
    this.memo = null; // the id of the tool that was in the hands as they went down
  }
  get busy() { return this.down; }
  reset() { this.down = false; this.memo = null; }

  update() {
    const P = this.P, g = this.game, belt = g.belt, inp = P.input;
    if (!belt) return;
    const down = P.posture === 'prone' || P.postureT > 0; // (postureT runs only getting down onto the belly or up from it: player.js setPosture; read so, a seam's reset mid-way leaves the getting up refused)
    if (down && !this.down) { this.memo = null; this.stowAll(); } // (the one asked out is remembered; one already going back is not)
    this.down = down;
    if (down) {
      if (inp.enabled) for (const t of belt.tools) {
        if (!inp.wasPressed(t.key) || !belt.isWorn(t.id)) continue;
        inp.spend(t.key); // (the tools and the psygun read their keys after this: they never see it)
        if (t.id === this.memo && t.drawT > 0.02) this.memo = null; // (put away by hand as it went back: it stays away)
        else g.log?.say('warn', PRONE_REFUSAL, { key: 'prone.draw', throttle: 2 });
      }
      this.stowAll(); // (anything asked out some other way, a scripted draw say: remembered if nothing is, and put back)
      belt.get('psygun')?.stow(); // (its key held off too, the aim held say; its trigger's queue is let go in weapon.js, which reads `busy`)
      return;
    }
    if (!this.memo) return;
    const t = belt.get(this.memo), held = belt.inHand;
    if (held && held !== t) { this.memo = null; return; } // (they took another out themselves)
    if (this.mgr.active || g.god?.controlling) return; // (a ladder, a talk: the tool waits for the hands, as a tool's own `resume` does)
    this.memo = null;
    if (t && belt.isWorn(t.id) && !held) belt.draw(t);
  }

  /** Every tool out, or asked out, put back through the belt; the first one met is remembered if nothing is yet. */
  stowAll() {
    for (const t of this.game.belt.tools) {
      if (!t.wants && t.drawT <= 0.02) continue;
      if (!this.memo && t.wants) this.memo = t.id;
      if (t.wants) t.stow();
    }
  }
}
