// ---------------------------------------------------------------------------
// HELD BY THE RHYTHM MODE (a tech that holds the body while a song is played: music/rhythm/rhythm.js, Wanda's): the rhythm mode has the
// digit keys and Esc; the Courier stands where they began it, the tools put away, and nothing else they do moves them until the song
// ends. Begun on the first frame the rhythm mode is active and they are standing, as the dialogue holds them (moves/talk.js), and ended
// the frame it stops. Nothing about the core movement changes: when the song is over, the core is exactly as it was.
//
//   new RhythmHold(techs)   (a tech: begins itself while game.rhythm.active; no key)
// ---------------------------------------------------------------------------
import { Tech } from './techs.js';

export class RhythmHold extends Tech {
  constructor(mgr) { super(mgr, 'rhythm'); this.blendIn = 8; }
  get enabled() { return true; }
  usable() { return true; }
  get handsBusy() { return true; }
  get blocksFire() { return true; }
  label() { return 'SONG'; }
  canStart() {
    const P = this.P, g = this.game;
    return !!g.rhythm?.active && P.grounded && !P.mantle && !g.god?.controlling && !g.dialogue?.open;
  }
  start() {
    const P = this.P, g = this.game;
    P.endCore?.(); P.vel.set(0, 0, 0);
    for (const t of g.belt?.tools || []) if (t.id !== 'psygun' && t.wants) t.stow();
  }
  update(dt) {
    if (!this.game.rhythm?.active) return false;
    const P = this.P;
    P.vel.set(0, -2, 0); P.move(dt);
    return true;
  }
}
