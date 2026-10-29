// ---------------------------------------------------------------------------------------
// PACE: how long play takes to reach its milestones, read from the ledger (docs/plans/GAPS.md 5, "pace, measured"; FIRST-HOUR.md). The
// ledger keeps the play time each achievement was earned at (`L.done[id]`, achievements.js) and each record was set at (`rec[k].t`), so
// time to the first fish, the first art or the first gold is a read of it: no new event. A milestone is an achievement that is the
// thing's first time (an Easy "do it once", or a first medal). The target is the design's own: where FIRST-HOUR.md and ECONOMY.md say
// the thing should land, in real minutes of play. A playtest's ledger is read by `scripts/pace.mjs`; the field report carries
// `paceOf(L)` from a phone (Petra's, debug/fieldreport.js).
//
// Prior art: GDC's "time to first fun" and funnel telemetry (Bungie's and King's milestone funnels), Hades' and Celeste's speedrun
// splits as a pace table, Nook Miles+ (a first's pointer), FIRST-HOUR.md's steps.
//
//   PACE [{ id, label, ach, target }]   (target: real minutes of play by when it should have happened, the design's own number)
//   paceOf(L) -> [{ id, label, at (real min | null), target, late (bool | null) }]
// ---------------------------------------------------------------------------------------

/** The milestones in the order a first session meets them (FIRST-HOUR.md's ten steps first, then the loops), each its achievement. */
export const PACE = [
  { id: 'wonder', label: 'awakened to Wonder (the first vantage)', ach: 'sk12', target: 10 },
  { id: 'shrine', label: 'rested at a Shrine', ach: 'sr1', target: 12 },
  { id: 'clapper', label: 'first clapperjar downed', ach: 'cl1', target: 15 },
  { id: 'chest', label: 'first chest opened', ach: 'tc1', target: 15 },
  { id: 'art', label: 'first Movement Art', ach: 'ar1', target: 20 },
  { id: 'fish', label: 'first fish landed', ach: 'ac1', target: 30 },
  { id: 'skiff', label: 'the Solar Skiff unfurled', ach: 'sf1', target: 35 },
  { id: 'firing', label: 'first firing at the kiln', ach: 'vf1', target: 45 },
  { id: 'duel', label: 'first puzzle duel won', ach: 'du1', target: 45 },
  { id: 'well', label: 'first time down a Well', ach: 'wl1', target: 60 },
  { id: 'race', label: 'first race finished', ach: 'rw1', target: 60 },
  { id: 'press', label: 'first firing at the press', ach: 'sa1', target: 90 },
  { id: 'bind', label: 'first spirit bound', ach: 'sv1', target: 90 },
  { id: 'hop', label: 'first crossing of the Emocean', ach: 'em1', target: 120 },
  { id: 'gold', label: 'first gold at the Raceway', ach: 'rw4', target: 240 },
];

/** Each milestone's play time (real minutes), from the ledger's achievement times; late if past its target, null if not yet reached. */
export function paceOf(L) {
  const done = L?.done || {};
  return PACE.map((P) => { const t = done[P.ach]; const at = t == null ? null : Math.round((t / 60) * 10) / 10; return { id: P.id, label: P.label, at, target: P.target, late: at == null ? null : at > P.target }; });
}
