// ---------------------------------------------------------------------------------------
// THE GAPS (docs/plans/SKIFF-RACING.md section 12): Tony Hawk's gaps, in the park. A gap is a named jump: off one stretch of a track
// and down on another, in one flight (the lip to past the landing hill's foot, the whoops skipped whole, a kicker cleared to its far
// side). Found anywhere at the Raceway, in a race or out; each one found is said by name, worth points to the trick combo, and kept
// on the ledger, so the list of gaps is a map of the park's best lines to hunt (the Collection Log's way: a slot by thing).
// Event: skiff.gap { gap, points } (with `by`). Names: working names, Espada's to rule.
//
// Prior art: Tony Hawk's Pro Skater's gaps (named, listed, found by riding the level), SSX's named jumps, Skate's spots.
//
//   GAPS [{ id, label, track, off: [cp, from, to], on: [cp, from, to], points }]   const G = new Gaps(raceway)   G.update(dt)
// ---------------------------------------------------------------------------------------

/** The gaps: taken off between `off`'s two places (a control point and metres from it), landed between `on`'s. */
export const GAPS = [
  { id: 'sun.lip', label: 'Over the Edge', track: 'sun', off: [18, -12, 8], on: [19, 25, 300], points: 300 },
  { id: 'sun.whoops', label: 'Whoop Skip', track: 'sun', off: [5, 0, 30], on: [6, -25, 30], points: 250 },
  { id: 'sun.tall', label: 'Tall Order', track: 'sun', off: [6, 40, 58], on: [6, 90, 220], points: 200 },
  { id: 'gorge.leap', label: 'Gorge Leap', track: 'gorge', off: [5, -8, 6], on: [5, 40, 260], points: 300 },
  { id: 'gorge.second', label: 'Second Drop', track: 'gorge', off: [11, -6, 4], on: [11, 25, 220], points: 250 },
  { id: 'coaster.station', label: 'Station Drop', track: 'coaster', off: [8, 28, 46], on: [8, 90, 260], points: 250 },
  { id: 'coaster.kicker', label: 'Lift Hill Hop', track: 'coaster', off: [14, 18, 32], on: [14, 60, 200], points: 200 },
];

export class Gaps {
  constructor(R) { this.R = R; this.off = null; }
  get game() { return this.R.game; }
  /** Is s between a place's two marks on track T (metres along, wrapping)? */
  within(T, [cp, a, b], s) { const L = T.length, s0 = T.sOf(cp, a), u = ((s - s0) % L + L) % L; return u <= b - a; }
  update() {
    const R = this.R, g = this.game, S = g.techs?.active?.id === 'skiff' ? g.techs.active : null;
    if (!S || S.phase !== 'ride' || R.line !== 'main') { this.off = null; this.air = false; return; }
    const air = !!S.air && !S.grind?.on;
    if (air && !this.air) this.off = { track: R.track.id, s: R.s };
    if (!air && this.air && this.off && this.off.track === R.track.id) {
      const T = R.track;
      for (const G of GAPS) if (G.track === T.id && this.within(T, G.off, this.off.s) && this.within(T, G.on, R.s)) {
        S.combo?.add?.('gap', G.points);
        g.events?.emit('skiff.gap', { gap: G.id, label: G.label, points: G.points, by: 'courier' });
      }
      this.off = null;
    }
    this.air = air;
  }
}
