// ---------------------------------------------------------------------------------------
// THE AI: the parts every creature's mind is built from, and the world they share. One of these lives on the game (`game.ai`):
//
//   game.ai.stimuli    what happens that could be noticed (stimuli.js): shots, blasts, calls, deaths, food
//   game.ai.eco        what the world offers and what each kind is to each other (ecology.js)
//   game.ai.add(brain) / game.ai.brains    every mind, for the F3 panel and the stress test
//
// A creature's own mind is a Brain (brain.js) of Senses (senses.js), Memory (memory.js), Drives (drives.js) and a list of actions
// scored by the Reasoner (utility.js), moving with the steering behaviours (steer.js). The whole of it, and how to make a new creature
// from it, is in docs/AI.md.
// ---------------------------------------------------------------------------------------
import { Stimuli } from './stimuli.js';
import { Ecology } from './ecology.js';

export { Brain } from './brain.js';
export { Senses } from './senses.js';
export { Memory, AWARE } from './memory.js';
export { Drives, rollTraits } from './drives.js';
export { Reasoner, curve, norm, consider } from './utility.js';
export { REL, kindOf } from './ecology.js';
export * as steer from './steer.js';

export class AI {
  constructor(game) {
    this.game = game;
    this.stimuli = new Stimuli(game);
    this.eco = new Ecology(game);
    this.brains = new Set();
  }
  add(b) { this.brains.add(b); return b; }
  remove(b) { this.brains.delete(b); }
  update(dt) { this.stimuli.update(dt); }
  /** One line per mind near the Courier (the F3 panel). */
  describe(max = 6) {
    const P = this.game.player.pos, out = [];
    for (const b of this.brains) { if (!b.c.alive) continue; const d = b.c.pos.distanceTo(P); if (d < 60) out.push([d, `${b.c.kind}#${b.c.id ?? ''} ${d.toFixed(0)}m ${b.describe()}`]); }
    return out.sort((a, b) => a[0] - b[0]).slice(0, max).map((x) => x[1]);
  }
}
