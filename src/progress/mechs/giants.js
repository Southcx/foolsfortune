// ---------------------------------------------------------------------------------------
// GIANTS (docs/plans/MECHS.md 5.3): creatures at a mech's scale, built as every creature is (a body and a mind of data from creatures/ai/),
// each with a barrier (rules.js BARRIER), a stagger gauge (rules.js STAGGER) and a vessel of form `giant` (progress/combat/vessel.js).
// v1 holds the straw giant, the hangar's training body; the Dunes' colossus waits for the mech in the world (MECHS.md 5.4).
//
// Prior art: Ratchet & Clank's Giant Clank kaiju (a slow body with a few big, readable blows), Shadow of the Colossus (a giant's moves
// read from far off), Pacific Rim's kaiju, Strawman's family (Pip's tries: vfx/strawmanwell/dummies.js).
//
//   GIANTS[id] = { id, label, line, height (m), reach (m), speed (m/s), barrier (bool), wakes ('staggered' | 'near'), moves { id: { k, every, windup, reach, region } } }   (its drops: DROP_TABLES.giant, progress/creaturedrops.js)
//   giantOf(id)
// ---------------------------------------------------------------------------------------

export const GIANTS = {
  straw: {
    id: 'straw', label: 'Straw giant', line: 'Pip\'s biggest try at Strawman, stitched on a scaffold. It waits to be hit.',
    height: 16, reach: 14, speed: 2.2, barrier: true, wakes: 'staggered',
    // its moves on the mech (k a full blow on the mech's vessel; every real s; windup real s before it lands, the answer's window)
    moves: {
      swipe: { k: 0.7, every: 4, windup: 1.1, reach: 14, region: 'core', answer: 'boost' },   // an arm swung across: dash out or through
      slam:  { k: 1.2, every: 9, windup: 1.8, reach: 10, region: 'head', answer: 'back' },    // both arms down: step back out of it
    },
  },
};
export const giantOf = (id) => GIANTS[id] || null;
