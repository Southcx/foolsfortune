// ---------------------------------------------------------------------------------------
// STRAWMAN'S WELL'S TRAINING TARGETS' MINDS: what each of the three targets wants (the house's AI parts, creatures/ai/, docs/AI.md; the
// straw dummy's mind is the pattern, world/strawmanwell/dummymind.js). The bodies' runtime (world/strawmanwell/targets.js) carries it out.
// Target practice first: each is small, slow to anger and shows its blow before it lands (a windup the parry answers).
//
// WHAT EACH DOES (scored by the reasoner, creatures/ai/utility.js; every one: stunned and tumbling as the dummy's)
//   the target hopper   hunt: hops at whoever it has seen, and in reach crouches and pounces (`D.swipe`); never hops off an edge
//                       idle: bounces about where it was set down
//   the quintain        it never hunts: struck, its arm swings round (the runtime's, on the blow); between, it rolls back to its spot
//                       on its spools and turns its shield to whoever it has seen
//   the gallery duck    patrol: flies to and fro over its stretch at its height; hunt: over whoever it has seen, tips and dives
//
// Prior art: Super Mario's hopping foes and Paratroopas (a patrol a flyer keeps, a swoop), the quintain's lesson (it answers only a
// blow), Super Smash Bros.' Subspace Emissary's crowd foes; built from the straw dummy's mind.
//
//   const M = targetMinds(bodies)   M.hopper / M.quintain / M.duck: { actions, drives, traits }   TARGET_MINDS (their numbers)
// ---------------------------------------------------------------------------------------
import { st } from '../../creatures/creatures.js';
import { AWARE } from '../../creatures/ai/index.js';
import { stream } from '../../core/rng.js';
const simRand = stream('world/strawmanwell/targetminds'); // (the simulation's chance: core/rng.js, the same twice)

/** Their numbers: how near (m) a foe is hunted, the pause between moves (s), the hopper's pounce reach and idle wander (m), the
 *  quintain's roll home (m/s, and the slack it allows, m), the duck's patrol half-span (m) and how near over a foe it dives (m). */
export const TARGET_MINDS = {
  hopper: { sees: 9, pounce: 3, cd: [0.7, 1.3], idle: [1.4, 2.4], wander: 1.6 },
  quintain: { roll: 0.8, slack: 0.15 },
  duck: { span: 3.5, over: 1.4, cd: [1.8, 2.8] },
};

const foeOf = (x) => { const f = x.mem.focus(); return f && f.kind === 'courier' && f.aware >= AWARE.SUSPECT * 0.5 ? f : null; };
const calm = (c) => st(c, 'calm') || st(c, 'charm');
const pause = ([a, b]) => a + simRand() * (b - a);
/** What is done to a target: stunned (a status) or tumbling (thrown by a blow). Every mind's first two. */
function done(act) {
  act({ id: 'stunned', weight: 5, urgent: true, when: (x) => st(x.c, 'stun') > 0, tick: (x) => { x.c.want.set(0, 0, 0); return st(x.c, 'stun') > 0 ? 'run' : 'done'; } });
  act({ id: 'tumbling', weight: 4.5, urgent: true, when: (x) => x.c.tumble > 0, tick: (x) => { x.c.want.set(0, 0, 0); return x.c.tumble > 0 ? 'run' : 'done'; } });
}

function hopperMind(D) {
  const C = TARGET_MINDS.hopper, A = [], act = (a) => { A.push(a); return a; };
  done(act);
  act({
    id: 'hunt', hunt: true, weight: 1.6,
    when: (x) => { const f = foeOf(x); return !!f && !calm(x.c) && Math.abs(f.pos.x - x.c.pos.x) < C.sees; },
    consider: [() => 0.9], lock: (x) => !!x.c.attack, enter: (x) => { x.c.cd = 0.4; },
    tick: (x, dt) => {
      const c = x.c, f = foeOf(x); if (!f) return c.attack ? 'run' : 'done';
      const dx = f.pos.x - c.pos.x; c.face = Math.sign(dx) || c.face || 1; c.want.set(0, 0, 0);
      if (c.attack || !c.grounded || (c.cd -= dt * (st(c, 'doubt') ? 0.6 : 1)) > 0) return 'run';
      c.cd = pause(C.cd); c.foeX = f.pos.x;
      if (Math.abs(dx) < C.pounce && Math.abs(f.pos.y - c.pos.y) < 1.5 && D.safe(c, c.face, 'leap')) D.swipe(c);
      else if (D.safe(c, c.face, 'hop')) D.hop(c, c.face);
      return 'run';
    },
  });
  act({
    id: 'idle', weight: 0.4, consider: [() => 0.8], enter: (x) => { x.c.cd = pause(C.idle); },
    tick: (x, dt) => {
      const c = x.c; c.want.set(0, 0, 0);
      if (!c.grounded || (c.cd -= dt) > 0) return 'run';
      c.cd = pause(C.idle);
      const away = c.pos.x - c.home.x, dir = Math.abs(away) > C.wander ? -Math.sign(away) : simRand() < 0.5 ? -1 : 1;
      c.face = dir; if (D.safe(c, dir, 'hop')) D.hop(c, dir, 0.6);
      return 'run';
    },
  });
  return { actions: A, drives: {}, traits: { bold: [0.85, 1.2] } };
}

function quintainMind() {
  const C = TARGET_MINDS.quintain, A = [], act = (a) => { A.push(a); return a; };
  done(act);
  act({
    id: 'stand', weight: 0.6, consider: [() => 0.8],
    tick: (x) => {
      const c = x.c, f = foeOf(x), home = c.home.x - c.pos.x;
      if (f && !c.attack) c.face = Math.sign(f.pos.x - c.pos.x) || c.face;
      c.want.set(c.attack || Math.abs(home) < C.slack ? 0 : Math.sign(home) * C.roll, 0, 0);
      return 'run';
    },
  });
  return { actions: A, drives: {}, traits: { bold: [1, 1] } };
}

function duckMind(D) {
  const C = TARGET_MINDS.duck, A = [], act = (a) => { A.push(a); return a; };
  done(act);
  act({
    id: 'hunt', hunt: true, weight: 1.6,
    when: (x) => { const f = foeOf(x); return !!f && !calm(x.c) && Math.abs(f.pos.x - x.c.home.x) < C.span + 2; },
    consider: [() => 0.9], lock: (x) => !!x.c.attack, enter: (x) => { x.c.cd = 0.8; },
    tick: (x, dt) => {
      const c = x.c, f = foeOf(x); if (!f) return c.attack ? 'run' : 'done';
      const dx = f.pos.x - c.pos.x; c.face = Math.sign(dx) || c.face;
      if (c.attack) { c.want.set(0, 0, 0); return 'run'; }
      const lo = c.home.x - C.span, hi = c.home.x + C.span, to = Math.max(lo, Math.min(hi, f.pos.x));
      c.want.set(Math.abs(to - c.pos.x) > 0.3 ? Math.sign(to - c.pos.x) * c.K.fly : 0, 0, 0);
      c.cd -= dt * (st(c, 'doubt') ? 0.6 : 1);
      if (c.cd <= 0 && Math.abs(dx) < C.over && f.pos.y < c.pos.y - 0.6) { D.swipe(c); c.cd = pause(C.cd); }
      return 'run';
    },
  });
  act({
    id: 'patrol', weight: 0.5, consider: [() => 0.8], enter: (x) => { x.c.way = x.c.way || 1; },
    tick: (x) => {
      const c = x.c, off = c.pos.x - c.home.x;
      if (off > C.span) c.way = -1; else if (off < -C.span) c.way = 1;
      c.face = c.way; c.want.set(c.way * c.K.fly * 0.6, 0, 0);
      return 'run';
    },
  });
  return { actions: A, drives: {}, traits: { bold: [0.9, 1.1] } };
}

export function targetMinds(D) { return { hopper: hopperMind(D), quintain: quintainMind(D), duck: duckMind(D) }; }
