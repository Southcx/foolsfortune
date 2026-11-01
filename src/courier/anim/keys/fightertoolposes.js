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
  soulbrush: {
    jab1: R('Brush_Combo1'), jab2: R('Brush_Combo2'), jab3: R('Brush_Spin'), ftilt: R('Brush_Combo3'), utilt: R('Brush_Flick'), dtilt: R('Brush_BrushSlide'),
    dash: R('Brush_Dive'), nspecial: R('Brush_Flick'), sspecial: R('Brush_Paint'), bspecial: R('Brush_Spin'), uspecial: R('Brush_ChargeHold'),
    dspecial: R('Brush_ChargeSlam'), dsmash: R('Brush_Spin'), nair: R('Brush_Combo1'), fair: R('Brush_Combo2'), uair: R('Brush_Flick'), dair: R('Brush_AirSlam'),
  },
  dreamvane: {
    jab1: R('Vane_Combo1'), jab2: R('Vane_Combo2'), jab3: R('Vane_Combo3'), ftilt: R('Vane_JrpgCombo3'), utilt: R('Vane_Thrust'), dtilt: R('Vane_SpinSweep'),
    dash: R('Vane_JrpgCombo1'), fsmash: R('Vane_PickStrike'), nspecial: R('Vane_SpecialDreamquake'), sspecial: R('Vane_ForkThrow'), bspecial: R('Vane_PickStrike'),
    uspecial: R('Vane_Vault'), dspecial: R('Vane_Dowse'),
  },
  crucibelle: {
    jab1: R('Bell_TollCombo1'), jab2: R('Bell_TollCombo2'), ftilt: R('Bell_TollCombo3'), utilt: R('Bell_NoteHigh'), dtilt: R('Bell_Note1'), dash: R('Bell_Toll'),
    nspecial: R('Bell_FeverPeak'), sspecial: R('Bell_Note3'), bspecial: R('Bell_TollCombo3'), uspecial: R('Bell_SongCast'), dspecial: R('Bell_Toll'),
  },
  // (the psygun's and the Veritome's: keyed whole, keys/psygun.js and veritome.js FIGHTER)
  lockheart: { bspecial: { clip: 'Lock_FlailCombo2', limb: 'L' } }, // (the rest keyed: keys/lockheart.js FIGHTER; the Vampire Killer the overhead crack, turned)
};
