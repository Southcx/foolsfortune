// ---------------------------------------------------------------------------------------
// PAINT THE LINE (G312; docs/plans/TRACK-EDITOR.md 9.2): the Soul Brush's feeling, laid on the paint map (world/ground/paintmap.js: the
// one store of Lachryma on surfaces) across the Raceway's sand, changes what the Solar Skiff's runners grip. Wonder's frost grips, Grief's
// streaks are slick; the rest lie between. It is the paint map's own data, already there: nothing new is stored. The rule is a grip
// multiplier on the sand, a modifier with a source you can see (the paint, in its feeling's colour and motif: the paint look is Calissa's),
// asked by the traps' `gripAt` (world/raceway/traps.js), the board's one door for a surface's grip (boardrules.js surfaceGrip). It is
// asked in PRACTICE and outside any race (a free ride, the build lot's test ride): a race keeps the house's rules, so no paint wins a
// medal, and a sibling painting against you is the party mode's (W4). The Soul Brush's own code is untouched.
//
// Prior art: Mario Kart's oil and mud patches (a ground that grips less), Splatoon's ink (your colour is fast, theirs is slow), Super Mario
// Sunshine's goop (paint is a surface the body asks), the house's gusher (a slick lowers the grip through the same door).
//
//   LINE_PAINT[aspect] = { grip, note }   paintGrip(cell) -> multiplier (1 for none)   paintActive({ running, modeId }) -> bool
//   cell = what paintmap.at(x, y, z) returns ({ k, aspect, crude } | null)
// ---------------------------------------------------------------------------------------

/** Each feeling's paint on the sand: the grip multiplier at full coverage (eased by the cell's coverage k). Wonder grips, Grief is slick. */
export const LINE_PAINT = {
  wonder: { grip: 1.25, note: 'frost grips' },
  mirth: { grip: 1.1, note: 'dots spring' },
  desire: { grip: 1.15, note: 'ripples catch' },
  fury: { grip: 0.85, note: 'cracks loosen' },
  dread: { grip: 0.8, note: 'marbling drags' },
  gall: { grip: 0.7, note: 'curds slide' },
  grief: { grip: 0.55, note: 'streaks are slick' },
};
/** Crude (a field's, oil on the sand) is slicker than any feeling. */
export const CRUDE_GRIP = 0.5;

/** The grip multiplier of a cell of paint under the board (null cell: 1). */
export function paintGrip(cell) {
  if (!cell) return 1;
  const full = cell.crude ? CRUDE_GRIP : LINE_PAINT[cell.aspect]?.grip ?? 1, k = Math.max(0, Math.min(1, cell.k ?? 1));
  return 1 + (full - 1) * k;
}
/** Whether painted ground changes the grip now: practice, or no race under way (not a race, a hot lap, a cup, the escape ...). */
export function paintActive({ running, modeId }) { return !running || modeId === 'practice'; }
