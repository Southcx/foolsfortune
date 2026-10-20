// ---------------------------------------------------------------------------------------
// THE CROSSING'S ROSTER AND THE SHOWCASE CROSSING'S LEGS (docs/plans/RAIL-MODULES.md section 6; the owner, 2026-10-20, through Calissa: "a
// feature-complete set of enemy ship types", then "a bespoke test crossing with every new element in one streamlined run"). ROSTER is
// section 6's table as data: each foe's class offset on the waypoint's base (econ/emocean.js ROLE_CLASS's way), its HP factor on
// WAVES.hp, what it fires (patterns.js names), its formation (world/emocean/waves.js PATHS) and the views it appears in. `showcase()`
// is the test crossing as five legs, one a hull, in the order the pier's SHOWCASE row boards them (Petra's plumbing: the hull swapped in
// the turn between legs, the pool held full, nothing counted). Each `show.*` leg is one view with no swing inside it, so every swing
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
//   ROSTER[foe] = { cls, hp, fires: [{ name, params? }], formation, count, views: 'COS', with?, spawns?, latch?, show? (bars), shown? }
//   SHOWCASE = [{ leg, hull, mounts, note }] (mounts: the kit for that leg: Flash and Bomb where the blocker comes, Grapple for the grappler)
//   showLeg('show.<id>') -> plan (schedule's shape)   SHOW = { foeBars, lead, forms }
// ---------------------------------------------------------------------------------------
/** Section 6's roster: class offset, HP factor, what it fires, its formation and count, its views (C chase, O overhead, S side). */
export const ROSTER = {
  school:     { cls: 0, hp: 1, fires: [{ name: 'aimedBurst', params: { n: 1, volleys: 2 } }], formation: 'line', count: 8, views: 'COS' },
  swooper:    { cls: 0, hp: 1, fires: [{ name: 'oddFan', params: { n: 3, volleys: 1 } }], formation: 'pincer', count: 2, views: 'OS' },
  darter:     { cls: 1, hp: 1, fires: [{ name: 'mixed', params: { of: 'aimedBurst', share: 1 } }], formation: 'dash', count: 2, views: 'CS' },
  rammer:     { cls: 1, hp: 2, fires: [{ name: 'frenzyDash', params: { n: 1, volleys: 2 } }], formation: 'dash', count: 1, views: 'COS' },
  sniper:     { cls: 1, hp: 1, fires: [{ name: 'sweepBeam', params: { from: 0, to: 0, warn: 1.5, burn: 0.5, volleys: 1 } }], formation: 'hold', count: 1, views: 'COS' },
  ambusher:   { cls: 1, hp: 1, fires: [{ name: 'oddFan', params: { n: 5, volleys: 1 } }], formation: 'dash', count: 2, views: 'COS' },
  turret:     { cls: 1, hp: 2, fires: [{ name: 'rotatingRing', params: { volleys: 4 } }], formation: 'hold', count: 1, views: 'OS' },
  'mine-layer': { cls: 1, hp: 1, fires: [{ name: 'decelBurst', params: { volleys: 2, m: 8 } }], formation: 'line', count: 1, views: 'OS' }, // (its mines: shells that stop and burst, until the mine is a foe of its own)
  escort:     { cls: 1, hp: 2, fires: [{ name: 'aimedBurst', params: { n: 1, volleys: 2 } }], formation: 'hold', count: 2, views: 'COS', with: 'gunship', show: 10 }, // (shown with its gunship: the shield, the escort down, then both guns and the core: 10 bars)
  carrier:    { cls: 1, hp: 2, fires: [], formation: 'hold', count: 1, views: 'COS' }, // (seen in every other foe's stretch: it brings what has no thrower)
  sweeper:    { cls: 2, hp: 1, fires: [{ name: 'sweepBeam', params: { volleys: 1 } }], formation: 'hold', count: 1, views: 'COS' },
  heavy:      { cls: 2, hp: 1, fires: [{ name: 'rotatingRing', params: { volleys: 4 } }], formation: 'hold', count: 1, views: 'OCS' },
  gunship:    { cls: 2, hp: 1, fires: [{ name: 'stackFan', params: { volleys: 2 } }, { name: 'splitShell', params: { volleys: 2 } }], formation: 'hold', count: 1, views: 'COS', shown: 'escort' }, // (its stretch is its escort's)
  blocker:    { cls: 2, hp: 3, fires: [], formation: 'hold', count: 1, views: 'OS' },
  spawner:    { cls: 1, hp: 3, fires: [], formation: 'hold', count: 1, views: 'OS', spawns: { role: 'school', count: 4, every: 2 } }, // (a hatch: its schools until it is downed)
  grappler:   { cls: 1, hp: 1, fires: [], formation: 'dash', count: 1, views: 'CS', latch: { pace: 0.8 } }, // (latches and drags until the roll, the Grapple mount or a shot shakes it)
};

/** The test crossing's measures (bars): each foe's stretch, the bar before the first, the forms' leg. */
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
const plan = (type, bars, view, events) => ({ type, bars, phases: [{ id: 'show', from: 0, to: bars, view }], events: events.sort((a, b) => a.bar - b.bar), feel: null, storm: false, strength: 1, swings: [] });

/** One leg of the test crossing, in schedule()'s shape (one phase, one view, no swing). */
export function showLeg(type) {
  if (type === 'show.forms') {
    const e = (bar, kind, name, params) => ({ bar, phase: 'show', pattern: { name, params, from: 'ahead', kind, mode: 'cone' } });
    return plan(type, SHOW.forms, 'chase', [
      e(4, 'astral', 'oddFan', { volleys: 2 }), e(6, 'astral', 'rotatingRing', { volleys: 3 }), // (Astral: in the Astral form, drunk)
      e(8, 'umbral', 'oddFan', { volleys: 2 }), e(10, 'umbral', 'rotatingRing', { volleys: 3 }), // (Umbral: flip, or dodge)
      e(12, 'astral', 'mixed', { of: 'aimedBurst', share: 1 }), e(14, 'umbral', 'mixed', { of: 'aimedBurst', share: 1 }), // (outlined: only the roll)
    ]);
  }
  const V = VIEW[type]; if (!V) return null;
  const [v, view] = V, mode = modeOf(view), events = [];
  const open = (bar, kind, name, params) => events.push({ bar, phase: 'show', pattern: { name, params, from: 'ahead', kind, mode } });
  open(1, 'astral', 'mixed', { of: 'aimedBurst', share: 1 }); // (an outlined volley: E, the mast folding on every hull)
  open(2, 'astral', 'oddFan', { volleys: 2 }); open(3, 'umbral', 'oddFan', { volleys: 2 }); // (a block of each form: Q)
  let b = SHOW.lead;
  for (const [foe, R] of Object.entries(ROSTER)) {
    if (!R.views.includes(v) || foe === 'carrier' || R.shown) continue;
    if (R.with) events.push({ bar: b, phase: 'show', wave: { role: R.with, formation: 'hold', count: 1, cls: ROSTER[R.with].cls } });
    events.push({ bar: b, phase: 'show', wave: { role: foe, formation: R.formation, count: R.count, cls: R.cls } });
    if (R.spawns) for (let t = 1; t < (R.show || SHOW.foeBars); t += R.spawns.every) events.push({ bar: b + t, phase: 'show', wave: { role: R.spawns.role, formation: 'line', count: R.spawns.count, cls: ROSTER[R.spawns.role].cls } });
    R.fires.forEach((f, i) => events.push({ bar: b + 1 + i, phase: 'show', pattern: { name: f.name, params: { ...(f.params || {}) }, from: foe, kind: i % 2 ? 'umbral' : 'astral', mode: modeOf(view) } }));
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
