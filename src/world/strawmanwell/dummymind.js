// ---------------------------------------------------------------------------------------
// A STRAW DUMMY'S MIND: what one of Strawman's fellow dummies wants in The Brawl (docs/plans/STRAWMANS-WELL.md 3.4; the house's AI parts,
// creatures/ai/, docs/AI.md). The body (dummy.js) carries it out. A dummy is a rehearsal of being struck: it walks at whoever it has
// seen and swipes when they are in reach, on the plane of the stage. Small on purpose: the Brawl is a test of the Courier's strings and
// of the percent, not of a foe's wits.
//
// WHAT IT DOES (scored by the reasoner, creatures/ai/utility.js)
//   what is done to it   stunned (a status: creatures.js), tumbling (thrown by a blow: the body flies, the mind waits)
//   fighting             hunt: walks along the plane at the one it knows of, swipes in reach (the body's `swipe`: a windup the parry answers)
//   living               idle: stands, a little sway
//
// Prior art: the Primid of Super Smash Bros. Brawl's Subspace Emissary (a crowd foe that walks at you and swings), Smash's sandbag; built
// from the Lantern Wisp's mind (creatures/wisp/mind.js), smaller.
//
//   const M = dummyMind(bodies)   M.actions   M.drives   M.traits   DUMMY_MIND (its numbers)
// ---------------------------------------------------------------------------------------
import { st } from '../../creatures/creatures.js';
import { AWARE } from '../../creatures/ai/index.js';
import { stream } from '../../core/rng.js';
const simRand = stream('world/strawmanwell/dummymind'); // (the simulation's chance: core/rng.js, the same twice)

/** Its numbers: walk (m/s), reach (m along the plane it swipes from), the pause between swipes (s), how far inside the stage's edges it stops. */
export const DUMMY_MIND = { walk: 1.7, reach: 1.45, cd: [1.1, 1.9], edge: 0.8 };

export function dummyMind(D) {
  const C = DUMMY_MIND, A = [];
  const act = (a) => { A.push(a); return a; };
  const foe = (x) => { const f = x.mem.focus(); return f && f.kind === 'courier' && f.aware >= AWARE.SUSPECT * 0.5 ? f : null; };
  act({ id: 'stunned', weight: 5, urgent: true, when: (x) => st(x.c, 'stun') > 0, tick: (x) => { x.c.want.set(0, 0, 0); return st(x.c, 'stun') > 0 ? 'run' : 'done'; } });
  act({ id: 'tumbling', weight: 4.5, urgent: true, when: (x) => x.c.tumble > 0, tick: (x) => { x.c.want.set(0, 0, 0); return x.c.tumble > 0 ? 'run' : 'done'; } });
  act({
    id: 'hunt', hunt: true, weight: 1.6,
    when: (x) => !!foe(x) && !st(x.c, 'calm') && !st(x.c, 'charm'),
    consider: [() => 0.9],
    lock: (x) => !!x.c.attack,
    enter: (x) => { x.c.cd = C.cd[0]; },
    tick: (x, dt) => {
      const c = x.c, f = foe(x); if (!f) return c.attack ? 'run' : 'done';
      const dx = f.pos.x - c.pos.x; c.face = Math.sign(dx) || c.face || 1;
      if (c.attack) { c.want.set(0, 0, 0); return 'run'; }
      const near = Math.abs(dx) < C.reach && Math.abs(f.pos.y - c.pos.y) < 1.2;
      const lo = c.arena.x0 + C.edge, hi = c.arena.x1 - C.edge, ahead = c.pos.x + Math.sign(dx) * 0.6;
      c.want.set(near || ahead < lo || ahead > hi ? 0 : Math.sign(dx) * C.walk, 0, 0);
      c.cd -= dt * (st(c, 'doubt') ? 0.6 : 1);
      if (near && c.cd <= 0 && c.grounded) { D.swipe(c); c.cd = C.cd[0] + simRand() * (C.cd[1] - C.cd[0]); }
      return 'run';
    },
  });
  act({ id: 'idle', weight: 0.4, consider: [() => 0.8], tick: (x) => { x.c.want.set(0, 0, 0); return 'run'; } });
  return { actions: A, drives: {}, traits: { bold: [0.85, 1.2] } };
}
