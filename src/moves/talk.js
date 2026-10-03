import { Tech } from './techs.js';

// ---------------------------------------------------------------------------
// TALKING (a tech that holds the body while a conversation lasts): F at one of the clay folk (npc/folk.js) begins the dialogue
// (npc/dialogue.js); the Courier stands, turns to the speaker and puts away what was in their hands, and the step is theirs until the
// talk ends. Nothing about the core movement changes: when the talk is over, the core is exactly as it was.
//
// They answer with their body, from UAL's clips (CC0) over the upper body: when they say something (a choice is made) they talk
// (Idle_Talking_Loop); as each line of theirs begins they nod to the glad and the calm (Yes), shakes their head at the muddled
// (Idle_No_Loop), and folds their arms at the sly (Idle_FoldArms_Loop); otherwise they listen, still.
// ---------------------------------------------------------------------------
export class Talk extends Tech {
  constructor(mgr) { super(mgr, 'talk'); this.blendIn = 8; }
  get enabled() { return true; }
  usable() { return true; }
  get handsBusy() { return true; }
  get blocksFire() { return true; }
  label() { return 'TALK'; }
  canStart() {
    const P = this.P, g = this.game;
    if (!g.dialogue || !g.folk || g.interact?.cur?.id !== 'npc' || !P.peekLatch('KeyF')) return false;
    if (!P.grounded || P.mantle || P.sliding || g.god?.controlling || g.techs.get('carry')?.item) return false;
    this.npc = g.folk.byId[g.interact.cur.ref];
    return !!this.npc;
  }
  start() {
    const P = this.P, g = this.game;
    P.latch('KeyF'); P.endCore?.(); P.vel.set(0, 0, 0);
    for (const t of g.belt?.tools || []) if (t.id !== 'psygun' && t.wants) t.stow();
    if (!g.dialogue.begin(this.npc)) this.npc = null;
  }
  update(dt) {
    const P = this.P;
    if (!this.npc || !this.game.dialogue.open) return false;
    P.vel.set(0, -2, 0); P.move(dt);
    return true;
  }
  end() { if (this.game.dialogue.open) this.game.dialogue.end(); this.npc = null; this.react = null; this.lastLine = null; }

  /** What they do with their body: a reaction (clip, seconds, how long, how much), played over the upper body and eased. */
  animate(ch, base, dt) {
    const D = this.game.dialogue, C = ch.clips;
    if (!D?.open) return;
    if (!this.heard) { this.heard = true; this.game.events.on('npc.choose', () => { this.react = { clip: 'talk', t: 0, dur: 1.6, k: 0.85 }; }); }
    if (D.cur && D.cur !== this.lastLine) {
      this.lastLine = D.cur;
      const m = D.mood, clip = { joy: 'nod', calm: 'nod', awe: 'nod', confused: 'shakeHead', sly: 'foldArms' }[m];
      if (clip && (!this.react || this.react.clip !== 'talk')) this.react = { clip, t: 0, dur: clip === 'foldArms' ? 2.4 : 1.1, k: clip === 'nod' ? 0.6 : 0.7 };
    }
    const r = this.react;
    if (!r || !C.clips[r.clip]) return;
    r.t += dt;
    if (r.t >= r.dur) { this.react = null; return; }
    const e = Math.min(1, r.t / 0.18) * Math.min(1, (r.dur - r.t) / 0.3);
    C.blend(base, C.sample(r.clip, r.t, ch.P.tmp, true), this.w * r.k * e * e * (3 - 2 * e), ch.MASK_UPPER);
  }
  faceYaw() { const n = this.npc; if (!n) return null; const P = this.P; return Math.atan2(n.pos.x - P.pos.x, n.pos.z - P.pos.z); }
}
