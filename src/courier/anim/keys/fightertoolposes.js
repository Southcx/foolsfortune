// ---------------------------------------------------------------------------------------
// EACH TOOL'S MOVEKIT, POSED (South, 2026-11-01; progress/fightertoolkits.js the moves, FIGHTER.md 9): the clip each slot of a tool's
// Arena kit is drawn from, the tool's own where it has one (CLAUDE.md: an existing clip for every movement), its three key moments
// measured off the clip as the bare set's are (fighter/pose.js keyTimes: the lead-in, the strike round the limb's fastest, the
// follow-through). A slot a key table already keys (keys/fighterkits.js SONDELASS, keys/lockheart.js FIGHTER) keeps its table's keys.
// The back special is drawn turned (pose.js: the body faced away for its frames, Smash's B-reverse), so its clip is a forward strike.
//
//   TOOL_POSES[beltId][slot] = { clip, limb }   (limb: the hand measured, or 'auto' the fastest)
// ---------------------------------------------------------------------------------------

const R = (clip) => ({ clip, limb: 'R' });

export const TOOL_POSES = {
  sondelass: { sspecial: R('Sond_Hookshot'), bspecial: R('Sond_Cast') },
  // (the psygun, the Soul Brush, the Veritome, the Dreamvane and the Crucibelle: keyed whole, keys/<tool>.js FIGHTER)
  lockheart: { bspecial: { clip: 'Lock_FlailCombo2', limb: 'L' } }, // (the rest keyed: keys/lockheart.js FIGHTER; the Vampire Killer the overhead crack, turned)
};
