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
//   NAMES[cast]   STATES   SUSTAINED   HEALTH   clearAt(uptime)   ENRAGE   PHASES[{ id, from (health share), loop: [{ at, cast }] }]   CASTS[id] = { windup, area, effect, answer, parry? }
//   phaseOf(share) -> phase   timeline(phase, t0, until) -> [{ t, cast }]   DROPS   dropsFor(run) -> [cosmetic ids]
// ---------------------------------------------------------------------------------------

/** THE COURIER'S SUSTAINED DAMAGE, read from the tools' own numbers (core/config.js, the strike calls), in power a real second at full
 *  uptime, for a player who lands what they swing: the psygun 1 a shot at its 0.16 s cap, about 3 clicks a second really (3.0); the
 *  club's combo of three (1.68, 1.8 and 2.4 power in 2.26 s: 2.6); the cutlass's chain (about 2.7); the charged shot 3.0 every 0.85 s
 *  while the pool lasts (24 Lachryma each). So about 2.6 a second at full uptime, whatever the tool: the tools are balanced, so the
 *  fight need not ask which one is carried. UPTIME is the share of the fight a player spends hitting it (the rest is reading,
 *  dodging, the brood, the untouchable transition): a good player 0.6, an expert 0.8. */
export const SUSTAINED = { perSecond: 2.6, uptime: { good: 0.6, expert: 0.8 }, untouchable: 50 }; // (untouchable: real seconds it cannot be struck: the transition, the sinkings)
/** Health in plain blows, set so an EXPERT clears at about 8:00 (480 s, less the untouchable 50: 430 s of fight at 2.6 x 0.8 = 894)
 *  and a GOOD player meets the enrage (570 s, less 50: 520 s at 2.6 x 0.6 = 811, short of 900: they must play better to clear). The
 *  crown's quarter in phase 1 and the core's double in phase 2 roughly cancel (a crown broken by the third ram, at about 1:30).
 *  Re-measure from the ledger once players have fought Strawman (`strawman.bout`'s perSecond) and the Great Slip Jelly (`foe.end`'s
 *  seconds): it is a model until then. */
export const HEALTH = 900;
/** What the model says each player meets: the seconds to clear, or null for the enrage. */
export const clearAt = (uptime, perSecond = SUSTAINED.perSecond) => { const t = HEALTH / (perSecond * uptime) + SUSTAINED.untouchable; return t <= ENRAGE ? Math.round(t) : null; };
/** The hard enrage: at this many real seconds from the pull, The Dunemaw Swallows the bowl and the attempt ends. */
export const ENRAGE = 570;

/** What it does, cast by cast. `windup`: real seconds from the log naming it to the blow (the body shows it; parryable windups wear the
 *  outline: PARRY.md). `area`: what it covers. `effect`: what a hit costs (`pool`: a share of the Courier's Lachryma pool; `hits`: blows
 *  of its class). `answer`: what the player does. Names are placeholders for Espada's. */
/** The casts' names as the log says them (Espada's, 2026-10-07, docs/LORE.md: each a jar's part or a potter's step, each telling
 *  you what to do). The log: "The Great Slip Jelly readies <name>." */
export const NAMES = { crownBash: 'Lidfall', brineLine: 'Shoulder Charge', gelidRings: 'Throwing Rings', oozeRain: 'Slip Trail',
  crownGlare: 'Eye Cup', slipNova: 'Blowout', sinkingSands: 'Centring', surfaceSlam: 'Wedge', brineCascade: 'Decant', broodCall: 'Broodwake',
  calving: 'Sherds', overflow: 'The Overflow', swallow: 'The Dunemaw Swallows' };
/** The transition is Unstopped; Brine Soaked is Sodden; Submerge is Slake; the calves are sherds, and "the sherds mend" when they re-merge. */
export const STATES = { clutch: 'Unstopped', soaked: 'Sodden', submerge: 'Slake', calf: 'sherd' };
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
  { id: 'glaze.jellycrown', ach: 'gj1', met: (r) => r.how === 'burst' || r.how === 'reprogram',     // (beat it)
    name: 'the Jelly-crown glaze', give: { glaze: 'jellycrown', label: 'JELLY-CROWN', blurb: 'placeholder: a slip-green celadon that pools thick and wet, as the crown sat in the jelly' } },
  { id: 'curio.crown', ach: 'gj2', met: (r) => r.win && !(r.hitBy?.crownBash > 0),                   // (never hit by a Lidfall: cast id crownBash)
    name: 'the Crown of the Dunemaw', give: { curio: 'crown', tier: 4, glyph: '♛', chest: false, blurb: 'placeholder: the broken urn it wore, whole again in your hands, and lighter than it looked' } },
  { id: 'mount.slipjelly', ach: 'gj3', met: (r) => r.win && r.clutchesLeft === 0,                    // (every clutch broken before the pull)
    name: 'a slip jelly to ride', give: { mount: 'slipjelly', open: true } },
  { id: 'title.jellybane', ach: 'gj4', met: (r) => r.win && r.seconds <= ENRAGE - 60,                 // (the enrage a minute away)
    name: 'the title Jellybane', give: { title: 'Jellybane' } },
  { id: 'pattern.crowneye', ach: 'gj5', met: (r) => r.win && (r.mirrored || 0) > 0,                   // (its gaze turned back with the Veritome)
    name: 'the Eye Cup glaze, its kiln pattern the crown\'s eye', give: { glaze: 'eyecup', label: 'EYE CUP', pattern: 'eye', blurb: 'placeholder: black-figure, a staring eye on every part, the evil looked back at' } },
];
/** HOW EACH IS GIVEN (Dovina's definitions; the drop is the boss's, the keeping is the achievement's, so it is never a flag):
 *  - a glaze (`give.glaze`) is a rare glaze gated by its achievement, as the medal glazes are (`courier/vessel/glazes.js`
 *    `{ ach }`): it opens at the kiln the moment `foe.drop.<id>` completes the achievement. The Eye Cup carries a sixth kiln pattern,
 *    the eye (`vfx/finish.js` PATTERN 6: Calissa's).
 *  - a curio (`give.curio`) is a CURIOS entry (`world/treasure/treasure.js`) of the top chest tier that no chest gives (`chest: false`),
 *    put into the Pneuka Box on `foe.end` (once: a second clear that meets it again gives nothing, as a held curio's dupe would).
 *  - a title (`give.title`) is the achievement's own title (`achievements.js` `{ title }`), as FFXIV's.
 *  - the mount (`give.mount`) is open: a slip jelly ridden in the Dunes is a feature of its own (its body, its controls, its place
 *    beside the Solar Skiff); until it is built, the achievement and the drop's line in the log stand, and nothing is put in the box.
 *  The log says each as it drops (`tracking/dunemaw.js`: "It drops <name>."). */
/** The cosmetics this fight drops: every one whose criteria the run met (the boss drops them, directly). */
export const dropsFor = (run = {}) => DROPS.filter((d) => d.met({ win: run.how === 'burst' || run.how === 'reprogram', ...run })).map((d) => d.id);
