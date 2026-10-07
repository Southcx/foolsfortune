// ---------------------------------------------------------------------------------------
// THE GREAT SLIP JELLY'S FIGHT, AS A SCRIPT (docs/plans/DUNEMAW-EXTREME.md; the owner, 2026-10-07: "like a raid boss, on the level of
// an FFXIV extreme trial"; one difficulty). A scripted fight is a TIMELINE of named CASTS, the same in the same order every pull and
// learned by wiping (FFXIV's trials), read by the timeline runner Petra builds once in creatures/ai/. Each cast says what its windup
// shows, what it covers, what it does, and how it is answered; the phases begin at a share of its health and remake the arena. Data
// and pure functions only; the crown, the nursery and the endings are progress/combat/dunemaw.js (DUNEMAW-SYSTEMS.md).
//
// Prior art: FFXIV's extreme trials (the cast bar named before the blow, the tankbuster, the raidwide, the adds that must die, the
// phase transition that remakes the arena, the hard enrage), Monster Hunter's tells read from the body, Dark Souls' boss phases, and
// Thunder Force's boss as a musical event (Wanda's cue turns on the casts).
//
//   HEALTH   ENRAGE   PHASES[{ id, from (health share), loop: [{ at, cast }] }]   CASTS[id] = { windup, area, effect, answer, parry? }
//   phaseOf(share) -> phase   timeline(phase, t0, until) -> [{ t, cast }]   DROPS   dropsFor(run) -> [cosmetic ids]
// ---------------------------------------------------------------------------------------

/** Health in plain blows (power 1; a slip jelly bursts at 8): seven minutes of a good player's sustained damage at about 2 blows a
 *  real second, so a good player meets the enrage and an expert clears with a minute spare. A placeholder until Strawman measures the
 *  sustained damage (`strawman.bout`'s perSecond): re-set it from the ledger, not from a guess. */
export const HEALTH = 840;
/** The hard enrage: at this many real seconds from the pull, The Dunemaw Swallows the bowl and the attempt ends. */
export const ENRAGE = 570;

/** What it does, cast by cast. `windup`: real seconds from the log naming it to the blow (the body shows it; parryable windups wear the
 *  outline: PARRY.md). `area`: what it covers. `effect`: what a hit costs (`pool`: a share of the Courier's Lachryma pool; `hits`: blows
 *  of its class). `answer`: what the player does. Names are placeholders for Espada's. */
export const CASTS = {
  crownBash:   { windup: 1.2, area: { shape: 'lunge', at: 'courier', reach: 9 }, effect: { pool: 0.6, soaked: 20 }, answer: 'parry (V) or roll', parry: true }, // (the tankbuster; soaked: the next hit doubled for 20 s)
  brineLine:   { windup: 1.0, area: { shape: 'line', at: 'courier', width: 4, length: 24 }, effect: { hits: 1, crown: 'pillar' }, answer: 'stand before a pillar and step aside: it cracks its own crown' }, // (the ram: DUNEMAW-SYSTEMS.md)
  gelidRings:  { windup: 1.5, area: { shape: 'out-in', inner: 6, outer: [6, 16] }, effect: { hits: 1, slow: 3 }, answer: 'out of the first ring, then back in' },
  oozeRain:    { windup: 0.6, area: { shape: 'baited', drops: 3, every: 1, radius: 2.5, lasts: 60 }, effect: { hits: 1 }, answer: 'lead the drops to the rim: each leaves a puddle for a real minute' },
  crownGlare:  { windup: 2.0, area: { shape: 'gaze' }, effect: { stunned: 3 }, answer: 'look away, or look through the Veritome: the lens turns the gaze back and stuns it 4 s', mirror: 4 },
  slipNova:    { windup: 3.0, area: { shape: 'raidwide' }, effect: { pool: 0.4 }, answer: 'unavoidable; guard (V held) at the flash for half' },
  sinkingSands:{ windup: 2.0, area: { shape: 'floor', slide: [0.8, 1.5] }, effect: { drag: true }, answer: 'stand on islands: rubble, fallen pillars' },
  surfaceSlam: { windup: 1.2, area: { shape: 'circle', at: 'courier', radius: 4 }, effect: { hits: 1 }, answer: 'off the rings: the slip rings before it surfaces' },
  brineCascade:{ windup: 1.5, area: { shape: 'cone', degrees: 120, length: 14 }, effect: { hits: 1 }, answer: 'get behind it: its maw swells for a bar' },
  broodCall:   { windup: 2.0, area: { shape: 'adds', perClutch: 2, heal: 0.02 }, effect: { adds: true }, answer: 'kill the brood before they reach it: each heals it 2% and grows a crown plate back' },
  calving:     { windup: 3.0, area: { shape: 'split', calves: 4, within: 30, heal: 0.1 }, effect: { split: true }, answer: 'kill all four calves within 30 s, or they re-merge and heal it' },
  overflow:    { windup: 3.0, area: { shape: 'floor', slip: 'all' }, effect: { slip: true, hatchAll: true }, answer: 'hold the islands; every clutch left hatches' },
  swallow:     { windup: 5.0, area: { shape: 'raidwide' }, effect: { wipe: true }, answer: 'none: it is the enrage' },
};

/** The phases, by the share of its health left. Each loops its casts (`at`: real seconds into the loop) until the next phase begins;
 *  each loop runs a fifth faster than the last (the fight tightens as it goes). The transitions are casts of their own. */
export const PHASES = [
  { id: 'crown', from: 1, loop: 120, casts: [[8, 'crownBash'], [20, 'brineLine'], [35, 'gelidRings'], [50, 'oozeRain'], [65, 'brineLine'], [68, 'brineLine'], [90, 'crownGlare'], [105, 'crownBash']] },
  { id: 'clutch', from: 0.65, loop: 30, casts: [[0, 'slipNova'], [4, 'broodCall'], [18, 'broodCall']], untouchable: true, once: true }, // (the transition: it sinks into the dish)
  { id: 'bare', from: 0.65, loop: 90, casts: [[6, 'sinkingSands'], [15, 'surfaceSlam'], [28, 'brineCascade'], [40, 'crownBash'], [42, 'gelidRings'], [60, 'broodCall'], [75, 'surfaceSlam']] },
  { id: 'calving', from: 0.3, loop: 75, casts: [[0, 'calving'], [36, 'crownBash'], [44, 'brineLine'], [52, 'oozeRain'], [60, 'gelidRings'], [68, 'broodCall']] },
  { id: 'overflow', from: 0.05, loop: 60, casts: [[0, 'overflow'], [10, 'crownBash'], [20, 'brineCascade'], [30, 'gelidRings']], once: false },
];
export const NOVA_AT = 0.15; // (a second Slip Nova at 15% of its health)

/** The phase at a share of its health (1 .. 0); the clutch transition is entered once, as the crown phase ends. */
export function phaseOf(share, clutchDone = false) {
  if (share <= 0.05) return PHASES[4];
  if (share <= 0.3) return PHASES[3];
  if (share <= 0.65) return clutchDone ? PHASES[2] : PHASES[1];
  return PHASES[0];
}
/** The casts of a phase from `t0` (real seconds since the pull) up to `until`, loop after loop, each a fifth faster than the last. */
export function timeline(phase, t0 = 0, until = ENRAGE) {
  const out = [];
  let start = t0, speed = 1;
  for (let k = 0; start < until && k < 50; k++) {
    for (const [at, cast] of phase.casts) { const t = start + at / speed; if (t < until) out.push({ t: +t.toFixed(2), cast }); }
    if (phase.once) break;
    start += phase.loop / speed; speed *= 1.2;
  }
  return out;
}

/** COSMETICS BY ACHIEVEMENT (the owner, 2026-10-07: "when achievement criteria is met during a bossfight, it will guarantee that the
 *  cosmetic item drops directly from the boss"; no tokens, no second currency, no odds). `met(run)`: the run's own record, as the fight
 *  emits it on `foe.end`. The achievement of the same name (achievements.js, THE WELLS) reads the ledger the drop is counted in. */
export const DROPS = [
  { id: 'glaze.jellycrown', ach: 'gj1', met: (r) => r.how === 'burst' || r.how === 'reprogram' }, // (beat it: the Jelly-crown glaze)
  { id: 'curio.crown', ach: 'gj2', met: (r) => r.win && !(r.hitBy?.crownBash > 0) },                 // (never hit by a Crown Bash: the Crown of the Dunemaw)
  { id: 'mount.slipjelly', ach: 'gj3', met: (r) => r.win && r.clutchesLeft === 0 },                  // (every clutch broken before the pull: a slip jelly to ride)
  { id: 'title.jellybane', ach: 'gj4', met: (r) => r.win && r.seconds <= ENRAGE - 60 },               // (the enrage a minute away: a title)
  { id: 'pattern.crowneye', ach: 'gj5', met: (r) => r.win && (r.mirrored || 0) > 0 },                 // (its gaze turned back with the Veritome: a kiln pattern)
];
/** The cosmetics this fight drops: every one whose criteria the run met (the boss drops them, directly). */
export const dropsFor = (run = {}) => DROPS.filter((d) => d.met({ win: run.how === 'burst' || run.how === 'reprogram', ...run })).map((d) => d.id);
