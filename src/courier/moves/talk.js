// ---------------------------------------------------------------------------
// TALKING (a tech that holds the body while a conversation lasts): F at one of the clay folk (npc/folk.js) begins the dialogue
// (npc/dialogue.js); the Courier stands, turns to the speaker and puts away what was in their hands, and the step is theirs until the
// talk ends. Nothing about the core movement changes: when the talk is over, the core is exactly as it was.
//
// They answer with their body, over the upper body only (the legs stand as they were; the hips are not moved): when they say
// something (a choice is made) they talk (UAL's Idle_Talking_Loop, CC0); as each line of the folk's begins they answer its mood with
// one of their own suite's gestures (the social pack, courier/anim/suite.js): a nod to the glad, the calm and the awed, a scratch of
// the head at the muddled, a smug look at the sly, a shaken fist at anger, a tremble at fear, a sorry bow of the head at sadness, a
// gasp at surprise, a finger to the lips at a whisper; otherwise they listen, still. Before the pack has landed (it is fetched when a
// talk begins) the moods that had a gesture before keep their old UAL one (Yes, Idle_No_Loop, Idle_FoldArms_Loop).
//
// Prior art: the listener's reactions of Mass Effect's and The Witcher 3's dialogue (a gesture keyed to a line's tone, layered over the
// standing body), and Animal Crossing's (a feeling answered with a feeling).
// ---------------------------------------------------------------------------
import { Tech } from './techs.js';

// a line's mood -> [the suite's clip, the old one while the pack is not in (or null), seconds, how much, the clip second to begin at]
const ANSWER = {
  joy: ['Emote_Nod', 'nod', 1.1, 0.6, 0], calm: ['Emote_Nod', 'nod', 1.1, 0.5, 0], awe: ['Emote_Nod', 'nod', 1.1, 0.5, 0],
  confused: ['Emote_HeadScratch', 'shakeHead', 1.8, 0.75, 0.15],
  sly: ['Emote_SmugLoop', 'foldArms', 2.4, 0.7, 0],
  anger: ['Emote_FistShake', null, 1.6, 0.7, 0.1],
  fear: ['Emote_TrembleLoop', null, 1.6, 0.75, 0],
  sad: ['Emote_Sorry', null, 1.8, 0.65, 0.1],
  surprise: ['Emote_Gasp', null, 1.3, 0.8, 0.05],
  whisper: ['Emote_Shush', null, 1.5, 0.7, 0.1],
};

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
    void g.clipPack?.social; // (the gestures are the suite's: fetched now if nothing has asked yet)
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
      const A = ANSWER[D.mood], clip = A && (C.clips[A[0]] ? A[0] : A[1]);
      if (clip && (!this.react || this.react.clip !== 'talk')) this.react = { clip, t: clip === A[0] ? A[4] : 0, dur: A[2], k: A[3], age: 0 };
    }
    const r = this.react;
    if (!r || !C.clips[r.clip]) return;
    r.t += dt; r.age = (r.age || 0) + dt;
    if (r.age >= r.dur) { this.react = null; return; }
    const e = Math.min(1, r.age / 0.18) * Math.min(1, (r.dur - r.age) / 0.3);
    C.blend(base, C.sample(r.clip, r.t, ch.P.tmp, true), this.w * r.k * e * e * (3 - 2 * e), ch.MASK_UPPER, 0); // (the hips stay the body's own)
  }
  faceYaw() { const n = this.npc; if (!n) return null; const P = this.P; return Math.atan2(n.pos.x - P.pos.x, n.pos.z - P.pos.z); }
}
