// ---------------------------------------------------------------------------------------
// THE TROUPE'S WALKER'S MIND: what one of Strawman's dummies on The Troupe's boards wants (docs/plans/STRAWMANS-WELL.md 3.10; the house's AI
// parts, creatures/ai/, docs/AI.md). The plan says the jobs are reprogramming's Functions and the dummy is the mind: here a job is a
// directive written into the walker's Brain (`brain.force`, the same door a reprogrammed order comes in by: tools/veritome/mind/macros.js),
// and the mind's actions are the jobs. The body (troupewalkers.js) carries each out on the boards; the mind only says which.
//
// WHAT IT DOES (scored by the reasoner, creatures/ai/utility.js)
//   what is done to it   falling (urgent: off the boards, its body drops; a floater's drifts)
//   a job given it       block (stands, arms out, and turns the others), dig (down through soft clay), build (a stair of planks ahead),
//                        climbing (a climber at a wall goes up it; climbing and floating are kept, Lemmings' permanent skills)
//   living               walk: on and on the way it faces, turning at a wall
// The bomber's fuse is the body's (it counts down whatever the mind is doing, as Lemmings' does).
//
// Prior art: Lemmings' lemmings (walk, turn at walls, a skill given, a few kept for good), Pikmin's and LittleBigPlanet's creatinator's
// small minds; built from the straw dummy's mind (dummymind.js), smaller.
//
//   const M = walkerMind()   M.actions   M.traits   JOBS (the keys' order)
// ---------------------------------------------------------------------------------------

/** The jobs, in the keys' order (1 to 6), and the ones a walker keeps for good. */
export const JOBS = ['block', 'dig', 'build', 'climb', 'float', 'bomb'];
export const KEPT = new Set(['climb', 'float']);

export function walkerMind() {
  const A = [];
  const act = (a) => { A.push(a); return a; };
  const mode = (m) => (x) => { x.c.mode = m; return x.c.job === m || m === 'fall' || m === 'climb' ? 'run' : 'done'; };
  act({ id: 'fall', weight: 5, urgent: true, when: (x) => !x.c.grounded && x.c.mode !== 'climb', tick: (x) => { x.c.mode = 'fall'; return x.c.grounded ? 'done' : 'run'; } });
  act({ id: 'climb', weight: 4, urgent: true, when: (x) => x.c.climber && (x.c.atWall || x.c.mode === 'climb'), lock: (x) => x.c.mode === 'climb', tick: (x) => (x.c.mode === 'climb' ? 'run' : 'done'), enter: (x) => { x.c.mode = 'climb'; } });
  act({ id: 'block', weight: 3, when: (x) => x.c.job === 'block', tick: mode('block') });
  act({ id: 'dig', weight: 3, when: (x) => x.c.job === 'dig' && x.c.grounded, tick: mode('dig') });
  act({ id: 'build', weight: 3, when: (x) => x.c.job === 'build' && x.c.grounded, tick: mode('build') });
  act({ id: 'walk', weight: 1, consider: [() => 0.9], tick: (x) => { x.c.mode = 'walk'; return x.c.job && x.c.job !== 'bomb' ? 'done' : 'run'; } });
  return { actions: A, traits: {} };
}
