import { Tech } from './techs.js';

// ---------------------------------------------------------------------------
// TALKING (a tech that holds the body while a conversation lasts): F at one of the clay folk (npc/folk.js) begins the dialogue
// (npc/dialogue.js); the Courier stands, turns to the speaker and puts away what was in her hands, and the step is hers until the
// talk ends. Nothing about the core movement changes: when the talk is over, the core is exactly as it was.
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
  end() { if (this.game.dialogue.open) this.game.dialogue.end(); this.npc = null; }
  faceYaw() { const n = this.npc; if (!n) return null; const P = this.P; return Math.atan2(n.pos.x - P.pos.x, n.pos.z - P.pos.z); }
}
