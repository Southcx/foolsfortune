// ---------------------------------------------------------------------------------------
// A MECH'S BACK PIECE'S KNOBS (CAPE_CLOTH; re-exported by vfx/mechs/capes.js): the cloth's one table, its shared numbers and each
// cloth back piece's own, in metres, real seconds and m/s^2. Looks only.
//   gravity     the pull down (a mech is big: real gravity reads as heavy cloth at its scale)
//   damping     the share of a particle's speed lost a substep (air drag)
//   iterations  how many times the constraints and the spheres are relaxed a substep
//   substep     the longest substep; maxDt the longest frame stepped (a hitch is not a gale); reprime: a frame longer than this (a
//               teleport, a tab come back) lays the cloth at rest again
//   margin      how far off a collider's sphere the cloth is kept (its thickness)
//   per cloth   lift (m/s^2 up, against gravity), wind (m/s^2 off the frame's back, gusting), shape (the pull a substep toward the rest
//               shape: a stiffened sash or a bag held open), bend (the skip-one constraints' stiffness), damping (its own)
// ---------------------------------------------------------------------------------------
export const CAPE_CLOTH = {
  gravity: 9.8, damping: 0.02, iterations: 5, substep: 1 / 90, maxDt: 1 / 20, reprime: 0.5, margin: 0.14,
  knight: { cols: 9, rows: 12, lift: 0, wind: 0.8, shape: 0.002, bend: 0.25, damping: 0.03 },
  tenne: { cols: 3, rows: 14, lift: 3.5, wind: 2.2, shape: 0.006, bend: 0.12, damping: 0.02 },
  kazebukuro: { cols: 6, rows: 18, lift: 8.5, wind: 3.5, shape: 0.03, bend: 0.3, damping: 0.025 },
};
