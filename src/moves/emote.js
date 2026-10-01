import { Tech } from './techs.js';
import { EMOTES } from '../emotes.js';

// ---------------------------------------------------------------------------
// THE EMOTE (a tech that owns the body while it lasts): stand where you are and play the emote's clips (emotes.js) through their
// phases: in -> the loop (or the one-shot, held or not) -> out. Moving ends it: through its way out if it has one (sitting stands
// up first), straight away if not. It is asked for (`request(id)`) and begins on the next step it can: on the ground, the hands
// free of anything heavy, nothing else going on.
// ---------------------------------------------------------------------------
const MOVE_KEYS = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space'];

export class Emote extends Tech {
  constructor(mgr) {
    super(mgr, 'emote');
    this.want = null; this.cur = null; this.phase = null; this.ct = 0; this.blendIn = 9;
  }
  get enabled() { return true; }
  usable() { return true; }
  get overrides() { return this.cur ? 1 : 0; }
  get handsBusy() { return true; } // (the gun goes away for it)
  label() { return this.cur ? this.cur.toUpperCase() : 'EMOTE'; }

  /** Ask for an emote by id; false (and a reason) if it cannot begin now. */
  request(id) {
    const P = this.P, g = this.game;
    if (!EMOTES[id]) return 'unknown';
    if (this.active && this.cur === id) return 'already';
    if (g.god?.controlling || g.techs.active && !this.active) return 'busy';
    if (!P.grounded || P.sliding || P.wallrun || g.techs.get('carry')?.item) return 'busy';
    if (this.active) this.mgr.stop(); // (one emote straight into another)
    this.want = id;
    return true;
  }
  stop() { if (this.active) this.leaving(); }

  canStart() { return !!this.want && this.P.grounded; }
  start() {
    const P = this.P, g = this.game, E = EMOTES[this.want];
    this.cur = this.want; this.want = null;
    P.endCore?.(); P.vel.set(0, 0, 0);
    this.yaw = P.yaw;
    for (const t of g.belt?.tools || []) if (t.id !== 'psygun' && t.wants) t.stow();
    this.set(E.enter ? 'enter' : E.loop ? 'loop' : 'once');
    g.events.emit('emote', { emote: this.cur, by: 'courier' });
  }
  set(phase) { this.phase = phase; this.ct = 0; }
  clipOf() {
    const E = EMOTES[this.cur];
    return this.phase === 'enter' ? E.enter : this.phase === 'loop' ? E.loop : this.phase === 'exit' ? E.exit : E.once;
  }
  dur(name) { return this.game.character?.clips?.clips?.[name]?.dur || 1; }
  leaving() {
    const E = EMOTES[this.cur];
    if (this.phase === 'exit') return;
    if (E.exit) this.set('exit'); else this.phase = 'done';
  }
  update(dt) {
    const P = this.P, inp = this.game.input, E = EMOTES[this.cur];
    if (!E) return false;
    P.vel.set(0, -2, 0); P.move(dt);
    this.ct += dt;
    if (!P.grounded && this.t > 0.2) return false; // (knocked off a ledge: it ends)
    if (MOVE_KEYS.some((k) => inp.isDown(k))) this.leaving();
    const name = this.clipOf(), d = this.dur(name);
    if (this.phase === 'enter' && this.ct >= d) this.set('loop');
    else if (this.phase === 'once' && this.ct >= d && !E.hold) return false;
    else if (this.phase === 'exit' && this.ct >= d) return false;
    return this.phase !== 'done';
  }
  end() { this.game.events.emit('emote.end', { emote: this.cur, by: 'courier' }); this.cur = null; this.phase = null; }
  animate(ch, base) {
    if (!this.cur || this.phase === 'done') return;
    const C = ch.clips, name = this.clipOf(), d = this.dur(name);
    const t = this.phase === 'loop' ? this.ct % d : Math.min(this.ct, d - 0.001);
    C.blend(base, C.sample(name, t, ch.P.tmp, this.phase === 'loop'), this.w);
  }
  faceYaw() { return this.cur ? this.yaw : null; }
}
