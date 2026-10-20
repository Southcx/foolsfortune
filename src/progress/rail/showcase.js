// ---------------------------------------------------------------------------------------
// THE CROSSING'S ROSTER AND THE SHOWCASE CROSSING'S LEGS (docs/plans/RAIL-MODULES.md section 6; the owner, 2026-10-20, through Calissa: "a
// feature-complete set of enemy ship types", then "a bespoke test crossing with every new element in one streamlined run"). ROSTER is
// section 6's table as data: each foe's class offset on the waypoint's base (econ/emocean.js ROLE_CLASS's way), its HP factor on
// WAVES.hp, what it fires (patterns.js names), its formation (world/emocean/waves.js PATHS) and the views it appears in. `showcase()`
// is the showcase crossing as five legs, one a hull, in the order the pier's SHOWCASE row boards them (Petra's plumbing, v240: the stage
// sails `showcasePassage()` as a passage with no sea chart, world/emocean/stage.js `sailShowcase`; the hull swapped in the turn between
// legs, the ship mended, the pool held full, the crossing's rules seeing the ledger held still: tracking/rules.js atSea). Each `show.*` leg is one view with no swing inside it, so every swing
// falls at a turn; legs.js `schedule` resolves a `show.*` type here:
//   show.forms   the forms and the roll on their own: a free stretch, a block of Astral volleys then of Umbral (Q: drink one, dodge the
//                other), then outlined volleys only the roll turns (E); the mast folding both ways (Calissa's look)
//   show.chase   every foe of the roster that flies in chase, alone, four bars each: it comes in, holds, fires its pattern once (a
//   show.above   carrier brings the pattern where the foe's own runtime is not built yet: legrunner.js), then the same overhead and
//   show.side    from the side (side needs the dive, so a hull that dives)
// DEBUG only, picked at the pier (Petra's); nothing it gives is counted (the DEBUG save).
//
// Prior art: a shmup's stage select and its practice mode (Ikaruga's, DoDonPachi's), the fighting game's training dummy that shows each
// move alone; Cave's wave tables.
//
//   ROSTER[foe] = { cls, hp, fires: [{ name, params? }], formation, count, views: 'COS', moves?, with?, spawns?, latch?, mine?,
//                   show? (bars), shown? }
//   moves: what it does beyond its formation's path (RAIL-MODULES.md 6's path column; bars unless said):
//     arc       in from an edge on an arc, never holds; fires once at the apex (swooper)
//     dash      dashes to a hold on a flank, holds `hold`, dashes out (darter)
//     charge    holds at range (at least `from` m off); glows aft `glow` beats, then charges at `speed` m/s the point you were at its
//               glow's start and passes through; downed in its glow it pays `windupPay` times (rammer). 34 m/s from 5 m or more: the
//               glow (0.375 real s) and the flight together give at least 0.5 real s to step off, the fairness rule's reaction
//               (patterns.js `fair`), and it still reads as a lunge
//     hold      holds at `at` (farEdge, edge, middle, broadside) for `hold` bars, or for its sweep's length (sniper, sweeper, heavy,
//               gunship, spawner)
//     overtake  comes from behind (side: the left edge; overhead: the bottom; chase: a flank), its edge mark `mark` beats before, and
//               leaves ahead (ambusher)
//     fixed     no motion of its own: it sits on wreckage and scrolls with the world, crossing the frame in `onScreen` bars, so its
//               windup and four volleys (3 real s) fit with a bar to shoot it (turret; a mine scrolls the same)
//     cross     crosses the frame once, side to side (mine-layer)
//     tether    flies `length` m off its charge (escort)
//     drift     drifts into the lane and closes `closes` of the frame for `hold` bars (blocker)
//     swing     swings in on a line from an edge, then latches (grappler)
//   mine: the mine-layer's mine, a foe of its own: dropped each `every` beats it crosses, HP `hp`, worth `pay`; it bursts into `burst`
//     after `fuse` bars or when the ship comes within `near` m; shot first, it never bursts. (near 8 m and a ring at speed 9: the
//     plan's 3 m gave 0.16 real s to react, the fairness rule wants 0.5; 8 m at speed 9 gives 0.63, patterns.js `fair`)
//   SHOWCASE = [{ leg, hull, feel?, mounts, note }] (feel: the waypoint's feeling, none if left out; mounts: the kit for that leg: Flash and Bomb where the blocker comes, Grapple for the grappler)
//   showLeg('show.<id>') -> plan (schedule's shape)   SHOW = { foeBars, lead, forms }
//   showcasePassage(rows?) -> a passage the trip runtime sails (world/emocean/triprun.js; a row whose leg or hull is unknown is left out)
// ---------------------------------------------------------------------------------------
import { LEGS } from './legs.js';
import { SHIPS } from './ships.js';

/** Section 6's roster: class offset, HP factor, what it fires, its formation and count, its views (C chase, O overhead, S side). */
export const ROSTER = {
  school:     { cls: 0, hp: 1, fires: [{ name: 'aimedBurst', params: { n: 1, volleys: 2 } }], formation: 'line', count: 8, views: 'COS' },
  swooper:    { cls: 0, hp: 1, fires: [{ name: 'oddFan', params: { n: 3, volleys: 1 } }], formation: 'pincer', count: 2, views: 'OS', moves: { kind: 'arc', fireAt: 'apex' } },
  darter:     { cls: 1, hp: 1, fires: [{ name: 'mixed', params: { of: 'aimedBurst', share: 1 } }], formation: 'dash', count: 2, views: 'CS', moves: { kind: 'dash', hold: 2, side: 'flank' } },
  rammer:     { cls: 1, hp: 2, fires: [{ name: 'frenzyDash', params: { n: 1, volleys: 2 } }], formation: 'dash', count: 1, views: 'COS', moves: { kind: 'charge', glow: 1, speed: 34, from: 5, at: 'last', through: true, windupPay: 1.5 } },
  sniper:     { cls: 1, hp: 1, fires: [{ name: 'sweepBeam', params: { from: 0, to: 0, warn: 1.5, burn: 0.5, volleys: 1 } }], formation: 'hold', count: 1, views: 'COS', moves: { kind: 'hold', at: 'farEdge', hold: 4 } },
  ambusher:   { cls: 1, hp: 1, fires: [{ name: 'oddFan', params: { n: 5, volleys: 1 } }], formation: 'dash', count: 2, views: 'COS', moves: { kind: 'overtake', from: 'behind', mark: 4 } },
  turret:     { cls: 1, hp: 2, fires: [{ name: 'rotatingRing', params: { volleys: 4 } }], formation: 'hold', count: 1, views: 'OS', moves: { kind: 'fixed', onScreen: 3 } },
  'mine-layer': { cls: 1, hp: 1, fires: [], formation: 'line', count: 1, views: 'OS', moves: { kind: 'cross' }, mine: { every: 1, hp: 1, pay: 50, fuse: 2, near: 8, burst: { name: 'rotatingRing', params: { n: 8, speed: 9, volleys: 1 } } } }, // (its mines: shells that stop and burst, until the mine is a foe of its own)
  escort:     { cls: 1, hp: 2, fires: [{ name: 'aimedBurst', params: { n: 1, volleys: 2 } }], formation: 'hold', count: 2, views: 'COS', with: 'gunship', show: 10, moves: { kind: 'tether', length: 4 } }, // (shown with its gunship: the shield, the escort down, then both guns and the core: 10 bars)
  carrier:    { cls: 1, hp: 2, fires: [], formation: 'hold', count: 1, views: 'COS' }, // (seen in every other foe's stretch: it brings what has no thrower)
  sweeper:    { cls: 2, hp: 1, fires: [{ name: 'sweepBeam', params: { volleys: 1 } }], formation: 'hold', count: 1, views: 'COS', moves: { kind: 'hold', at: 'edge', hold: 'sweep' } },
  heavy:      { cls: 2, hp: 1, fires: [{ name: 'rotatingRing', params: { volleys: 4 } }], formation: 'hold', count: 1, views: 'OCS', moves: { kind: 'hold', at: 'middle', hold: 8 } },
  gunship:    { cls: 2, hp: 1, fires: [{ name: 'stackFan', params: { volleys: 2 } }, { name: 'splitShell', params: { volleys: 2 } }], formation: 'hold', count: 1, views: 'COS', shown: 'escort', moves: { kind: 'hold', at: 'broadside', hold: 8 } }, // (its stretch is its escort's)
  blocker:    { cls: 2, hp: 2, fires: [], formation: 'hold', count: 1, views: 'OS', moves: { kind: 'drift', closes: 1 / 3, hold: 4 } }, // (24 hp, full blows while held open: 24 hits, 2.25 real s of the gun's 10.7 a second, so a sharp opening kills it and two always do)
  spawner:    { cls: 1, hp: 3, fires: [], formation: 'hold', count: 1, views: 'OS', spawns: { role: 'school', count: 4, every: 2 }, moves: { kind: 'hold', at: 'edge', hold: 8 } }, // (a hatch: its schools until it is downed)
  grappler:   { cls: 1, hp: 1, fires: [], formation: 'dash', count: 1, views: 'CS', latch: { pace: 0.8 }, moves: { kind: 'swing', from: 'edge' } }, // (latches and drags until the roll, the Grapple mount or a shot shakes it)
};

/** The showcase crossing's measures (bars): each foe's stretch, the bar before the first, the forms' leg. */
export const SHOW = { foeBars: 4, lead: 5, forms: 16 }; // (lead: each foe leg opens with an outlined volley for E and a block of each form for Q, Calissa's must-see 1 and 2)
/** The order the pier's SHOWCASE row boards (Petra's plumbing reads it): a leg and the hull it is sailed in. */
export const SHOWCASE = [
  { leg: 'show.forms', hull: 'sloop', mounts: ['crucibelle', 'lockheart'], note: 'Q and E alone: Astral volleys, Umbral volleys, outlined ones only the roll turns; the mast folding both ways, the periscope stub in Umbral' },
  { leg: 'show.chase', hull: 'galleon', mounts: ['sondelass'], note: 'every chase foe alone, four bars each, on the heaviest hull: the big hurtbox, four locks' },
  { leg: 'show.above', hull: 'destroyer', mounts: ['veritome', 'crucibelle'], note: 'every overhead foe alone, on the quickest hull: twin-stick, no lock-on, the forms drinking rings; Flash and Bomb for the blocker; the blade mast hinging on Q and E' },
  { leg: 'show.side', hull: 'frigate', mounts: ['veritome', 'crucibelle', 'sondelass'], note: 'every side foe alone, on a hull that dives: the waterline crossed under the broadside; Flash and Bomb for the blocker, Grapple for the grappler' },
  { leg: 'show.forms', hull: 'tanker', mounts: ['crucibelle'], note: 'the forms again on a hull that cannot dive: Q refused, the short mast dropping into its house on E' },
];
const VIEW = { 'show.chase': ['C', 'chase'], 'show.above': ['O', 'above'], 'show.side': ['S', 'side'] };
const modeOf = (view) => (view === 'chase' ? 'cone' : 'plane');
// (the cue's four phases, all in one view so no swing falls inside a leg: the trip runtime and the cue lay a leg's length from them, triprun.js legOf)
const plan = (type, cuts, view, events) => { const [a, b, c] = cuts; return { type, bars: c, phases: [['open', 0, a], ['build', a, b], ['peak', b, c]].filter(([, f, t]) => t > f).map(([id, from, to]) => ({ id, from, to, view })),
  events: events.map((e) => ({ ...e, phase: e.bar < a ? 'open' : e.bar < b ? 'build' : 'peak' })).sort((x, y) => x.bar - y.bar), feel: null, storm: false, strength: 1, swings: [] }; };

/** One leg of the showcase crossing, in schedule()'s shape (one view, no swing): the forms' open, build and peak; a foe leg's E and Q
 *  block its open, the roster its build, the escort and its gunship (the longest stretch) its peak. */
export function showLeg(type) {
  if (type === 'show.forms') {
    const e = (bar, kind, name, params) => ({ bar, pattern: { name, params, from: 'ahead', kind, mode: 'cone' } });
    return plan(type, [4, 12, SHOW.forms], 'chase', [
      e(4, 'astral', 'oddFan', { volleys: 2 }), e(6, 'astral', 'rotatingRing', { volleys: 3 }), // (Astral: in the Astral form, drunk)
      e(8, 'umbral', 'oddFan', { volleys: 2 }), e(10, 'umbral', 'rotatingRing', { volleys: 3 }), // (Umbral: flip, or dodge)
      e(12, 'astral', 'mixed', { of: 'aimedBurst', share: 1 }), e(14, 'umbral', 'mixed', { of: 'aimedBurst', share: 1 }), // (outlined: only the roll)
    ]);
  }
  const V = VIEW[type]; if (!V) return null;
  const [v, view] = V, mode = modeOf(view), events = [];
  const open = (bar, kind, name, params) => events.push({ bar, pattern: { name, params, from: 'ahead', kind, mode } });
  open(1, 'astral', 'mixed', { of: 'aimedBurst', share: 1 }); // (an outlined volley: E, the mast folding on every hull)
  open(2, 'astral', 'oddFan', { volleys: 2 }); open(3, 'umbral', 'oddFan', { volleys: 2 }); // (a block of each form: Q)
  let b = SHOW.lead, peak = null;
  for (const [foe, R] of Object.entries(ROSTER)) {
    if (!R.views.includes(v) || foe === 'carrier' || R.shown) continue;
    if (R.with) peak = b;
    if (R.with) events.push({ bar: b, wave: { role: R.with, formation: 'hold', count: 1, cls: ROSTER[R.with].cls } });
    events.push({ bar: b, wave: { role: foe, formation: R.formation, count: R.count, cls: R.cls } });
    if (R.spawns) for (let t = 1; t < (R.show || SHOW.foeBars); t += R.spawns.every) events.push({ bar: b + t, wave: { role: R.spawns.role, formation: 'line', count: R.spawns.count, cls: ROSTER[R.spawns.role].cls, from: foe } });
    R.fires.forEach((f, i) => events.push({ bar: b + 1 + i, pattern: { name: f.name, params: { ...(f.params || {}) }, from: foe, kind: i % 2 ? 'umbral' : 'astral', mode: modeOf(view) } }));
    b += R.show || SHOW.foeBars;
  }
  return plan(type, [SHOW.lead - 1, peak ?? b, b], view, events);
}

/** The rows as a passage (the trip runtime's waypoints, with no sea chart): a row whose leg or hull is unknown is left out (Petra's). */
export function showcasePassage(rows = SHOWCASE) {
  const known = (leg) => LEGS[leg] || (String(leg).startsWith('show.') && showLeg(leg));
  const waypoints = rows.filter((r) => known(r.leg) && SHIPS[r.hull])
    .map((r, i) => ({ id: `showcase.${i}`, type: r.leg, strength: 1, feel: r.feel ?? null, storm: false, hull: r.hull, mounts: r.mounts || null, note: r.note || '' }));
  return { showcase: true, ids: waypoints.map((w) => w.id), legs: waypoints.map((w) => w.type), waypoints, chart: null, route: 'showcase', read: 0, pieces: null };
}
