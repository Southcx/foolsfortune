// ---------------------------------------------------------------------------------------
// GIANTS (docs/plans/MECHS.md 5.3): creatures at a mech's scale, built as every creature is (a body and a mind of data from creatures/ai/),
// each with a barrier (rules.js BARRIER), a stagger gauge (rules.js STAGGER) and a vessel of form `giant` (progress/combat/vessel.js).
// The straw giant, the hangar's training body; the dune colossus, the Dunes' sand risen, met first in the proving ground and opened by
// deeds (giantOpen). Giant wrestling's numbers (GRAPPLE): a staggered giant grabbed and thrown into the toy city.
//
// Prior art: Ratchet & Clank's Giant Clank kaiju (a slow body with a few big, readable blows), Shadow of the Colossus (a giant's moves
// read from far off), Pacific Rim's kaiju, Strawman's family (Pip's tries: vfx/strawmanwell/dummies.js); the colossus's burrow is Tremors'
// and Dune's sandworm (the ground rings before it erupts), its hurl Monster Hunter's ranged roar-and-throw; the wrestling Ultimate Destruction's
// and the kaiju films' (a monster thrown through a building).
//
//   GIANTS[id] = { id, label, line, height (m), reach (m), speed (m/s), barrier (bool), wakes ('staggered' | 'near'), moves { id: { k, every, windup, reach, region } } }   (its drops: DROP_TABLES.giant, progress/creaturedrops.js)
//   giantOf(id)   GIANT_IDS   giantOpen(id, L)   GRAPPLE   giantMass(G)   canLift(load, G)
//   a move: { kind ('melee' | 'ring' | 'hurl' | 'wave'), k, every, windup, reach, region, answer, ... its kind's own }
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
  // the dune colossus (MECHS.md 5.3, 11.2): a Figment of the Dunes' sand risen in Fury's weather, brought into the proving ground's arena
  // first. It wakes as you come near, fights from range as well as close, and goes under the sand: a giant that makes you move.
  colossus: {
    id: 'colossus', label: 'Dune colossus', line: 'The Dunes\' sand risen into a body in Fury\'s weather. It hears you coming.',
    height: 22, reach: 16, speed: 3.2, barrier: true, wakes: 'near', wakeAt: 90, body: 'sand',
    opens: { count: ['giant.down.straw', 3], feat: ['giant.down.offcable', 1] }, // (the straw giant felled three times, or once on the battery alone)
    moves: {
      // kind: 'melee' strikes what is in reach at the windup's end (the straw giant's own); 'ring' erupts under where the mech stood at the
      // windup's start (step out of the ring); 'hurl' throws a clod at the mech from range (dash sideways); 'wave' a cone of sand in front.
      sweep:  { kind: 'melee', k: 0.8, every: 5, windup: 1.2, reach: 16, region: 'legs', answer: 'jump' },     // a low arm through the legs: jump it
      burrow: { kind: 'ring', k: 1.4, every: 14, windup: 2.4, reach: 120, radius: 12, region: 'core', answer: 'boost', sinks: 3 }, // it sinks (3 s gone), the ring under you, then it erupts
      hurl:   { kind: 'hurl', k: 0.9, every: 7, windup: 1.4, reach: 140, min: 30, speed: 45, region: 'head', answer: 'boost' },    // a clod of sand from 30 to 140 m: dash across its line
      wave:   { kind: 'wave', k: 0.6, every: 10, windup: 1.6, reach: 40, angle: 0.6, region: 'core', answer: 'back', slow: 2 },  // a cone of sand: back out of it, or it slows you 2 s
    },
  },
};
export const giantOf = (id) => GIANTS[id] || null;
export const GIANT_IDS = Object.keys(GIANTS);

const got = (L, k) => L?.get?.(k) || 0;
/** Is a giant there to be faced: the straw giant always; one with `opens` by its count way or its feat way (the DEBUG save's lend opens all). */
export function giantOpen(id, L) {
  const G = GIANTS[id]; if (!G) return false; if (!G.opens) return true;
  return got(L, G.opens.count[0]) >= G.opens.count[1] || got(L, G.opens.feat[0]) >= G.opens.feat[1];
}

/** GIANT WRESTLING (MECHS.md 11.2; Ultimate Destruction's grab-and-throw on its biggest foes, God of War's grab on a stunned foe, the
 *  kaiju films' throw into a building): a giant staggered (rules.js STAGGER) and within `reach` of the mech's hands is grabbed with F, held
 *  up to `hold` real s (it struggles: every `shake` s it drains `drain` of the battery), and thrown along the aim with RMB at `speed` m/s
 *  and `up` rad, or slammed down with LMB. In flight it is an Impact blow on the toy city where it lands (a carve of `carve` cells' radius,
 *  scaled by its height), and on itself a fall: `selfK` a full blow on its body, plus the building's (a giant thrown through a tower is
 *  hurt by the tower). The slam is the short way: `slamK` on the giant where it stands, a Ground Pound's ring round it. Paid from the
 *  battery (kJ), opened as a technique (techniques.js `giantThrow`). A light frame cannot lift a giant: the mech's load (frame.js) must
 *  hold `load` x the giant's height in tonnes (clay legs' 60 t and spring legs' 48 lift the straw giant's 48; only crab legs' 72 and the tread's
 *  95 lift the colossus's 66): the build decides who can be thrown. */
export const GRAPPLE = { reach: 18, hold: 3, shake: 0.5, drain: 150, speed: 20, up: 0.5, carve: 5, selfK: 1.2, slamK: 1.6, kJ: 2500, load: 3 };
/** A giant's mass for the throw (t, by its height: the straw giant's 16 m about 1,000 t of sack and scaffold; the colossus's sand far more). */
export const giantMass = (G) => (G?.body === 'sand' ? 4 : 2.5) * (G?.height ?? 16) ** 2;
/** Can this frame lift that giant (frame.js stats.load, t)? */
export const canLift = (load, G) => (load ?? 0) >= GRAPPLE.load * (G?.height ?? 16);
