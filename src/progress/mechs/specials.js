// ---------------------------------------------------------------------------------------
// A PART'S SPECIAL (plain name; South, 2026-11-02: "the mechs don't need access to all the lachryma tools. A blade and a blaster is more
// than enough for now, we can bake special moves into a per-part basis, and amplify/modify existing God Art abilities"): every head, core,
// arms and legs part carries one move, a god power of the hand's (progress/godpowers.js GOD_POWERS) made at the frame's scale, on the
// key its slot owns. Its strength grows with the domain's level (amplified: x `amp` at 99), its battery cost fixed. Worn with the part,
// never earned apart from it: a part is the way to a move (Medabots' medaparts: a head part's own action, an arm's own attack).
//
//   the head's on E, the arms' on Q, the legs' on R, the core's on Y. Kinds the runtime knows (world/hangar/mechspecials.js):
//     scan    the giant's weak point marked for `for` s (blows land on its head) and its next blow read
//     gust    a cone of wind ahead `reach` m: the giant staggered, glass and timber carved in the cone
//     sunder  a blade of the island's clay drawn out of the arm, `reach` m long: a line carved, the giant struck on it
//     pull    the nearest loose thing within `reach` m drawn into the right hand (Telekinesis at the frame's scale)
//     quake   the ground heaved round the feet, `r` m: carved, the giant's legs struck and staggered in reach
//     blink   a portal opened `reach` m ahead and stepped through (a gap carved where it closes, nothing struck)
//     ward    a barrier's circle round the frame for `for` s: every blow on the frame at `k` of itself
//     hasten  the frame's own time run fast for `for` s: its walk and its arms' cooling at `k`
// Prior art: Medabots (each part a medapart with its own action: the head's, the arms' attacks, the legs' movement), Armored Core's
// inside parts and extensions (a part a capability), Zone of the Enders' sub-weapons, the god hand's own powers (GODHAND.md 8) as the
// vocabulary, so a move the hand already knows reads the same at the frame's scale.
//
//   SPECIAL_KEYS   PART_SPECIALS[partId] = { power, domain, kind, label, line, kJ, rest, ...the kind's numbers }   specialsOf(stats)
//   specialK(special, level) -> the strength multiplier at a domain level   SPECIAL_AMP
// ---------------------------------------------------------------------------------------

/** Which key each slot's special is on (the mech's claimed keys: world/hangar/mechpilot.js CLAIM). */
export const SPECIAL_KEYS = { head: 'KeyE', arms: 'KeyQ', legs: 'KeyR', core: 'KeyY' };
/** At a domain's level 1 a special is as written; at 99 its strength (k, stagger, reach, duration) x `amp`, linear between. */
export const SPECIAL_AMP = { amp: 1.6 };

export const PART_SPECIALS = {
  // heads: Divination's sight
  clayHead: { power: 'strata', domain: 'divination', kind: 'scan', label: 'Layer View', line: "Mark the giant's weak point for 6 s.", kJ: 400, rest: 12, for: 6 },
  watcherHead: { power: 'read', domain: 'divination', kind: 'scan', label: 'Scan Intent', line: "Mark the giant's weak point for 12 s and read its next blow.", kJ: 600, rest: 14, for: 12, read: true },
  // cores: Spellscription's and Ouranurgy's holds on the frame itself
  clayCore: { power: 'ward', domain: 'spellscription', kind: 'ward', label: 'Barrier', line: 'For 6 s every blow on the frame lands at half.', kJ: 1500, rest: 20, for: 6, k: 0.5 },
  kilnCore: { power: 'ward', domain: 'spellscription', kind: 'ward', label: 'Barrier', line: 'For 8 s every blow on the frame lands at a third.', kJ: 2200, rest: 24, for: 8, k: 0.33 },
  lightCore: { power: 'hasten', domain: 'ouranurgy', kind: 'hasten', label: 'Hasten', line: "For 6 s the frame's walk and arms run at 1.5x.", kJ: 1800, rest: 22, for: 6, k: 1.5 },
  // arms: Alteration's blade and Psychokinesis' reach
  clayArms: { power: 'sunder', domain: 'alteration', kind: 'sunder', label: 'Sunder', line: 'A clay blade 30 m long drawn from the arm: everything on its line cut.', kJ: 900, rest: 8, reach: 30, k: 0.9, stagger: 18, r: 2 },
  strongArms: { power: 'telekinesis', domain: 'psychokinesis', kind: 'pull', label: 'Telekinesis', line: 'Draw the nearest loose thing within 60 m into your hand.', kJ: 500, rest: 6, reach: 60 },
  quickArms: { power: 'gust', domain: 'psychokinesis', kind: 'gust', label: 'Gust', line: 'A cone of wind 45 m ahead: staggers the giant, breaks glass and timber.', kJ: 700, rest: 7, reach: 45, k: 0.25, stagger: 28, angle: 0.55 },
  // legs: Alteration's ground and Ouranurgy's step
  clayLegs: { power: 'shape', domain: 'alteration', kind: 'quake', label: 'Shape', line: 'Heave the ground round your feet: 12 m carved, the giant knocked off balance.', kJ: 1100, rest: 10, r: 12, k: 0.5, stagger: 32 },
  springLegs: { power: 'portal', domain: 'ouranurgy', kind: 'blink', label: 'Portal', line: 'Step through a portal 40 m ahead.', kJ: 1200, rest: 9, reach: 40 },
  crabLegs: { power: 'slab', domain: 'psychokinesis', kind: 'quake', label: 'Lift Ground', line: 'Lift the ground in a 16 m ring and drop it: the giant staggered.', kJ: 1400, rest: 12, r: 16, k: 0.4, stagger: 40 },
  treadLegs: { power: 'carve', domain: 'alteration', kind: 'quake', label: 'Carve', line: 'Cut the ground open round the treads, 10 m: a heavy blow on the giant\'s legs.', kJ: 1000, rest: 9, r: 10, k: 0.7, stagger: 24 },
};

/** The specials a frame carries, by slot: { head, core, arms, legs } (each { id: partId, ...row } or null). */
export function specialsOf(stats) {
  const sel = stats?.sel || {}, out = {};
  for (const slot of Object.keys(SPECIAL_KEYS)) { const id = sel[slot]; out[slot] = id && PART_SPECIALS[id] ? { id, ...PART_SPECIALS[id] } : null; }
  return out;
}
/** A special's strength at a domain's level (1..99). */
export const specialK = (special, level = 1) => 1 + (SPECIAL_AMP.amp - 1) * Math.max(0, Math.min(1, ((level || 1) - 1) / 98));
