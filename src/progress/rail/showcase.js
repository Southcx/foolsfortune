// ---------------------------------------------------------------------------------------
// THE CROSSING'S ROSTER AND ITS TEST CROSSING (docs/plans/RAIL-MODULES.md section 6; the owner, 2026-10-20, through Calissa: "a
// feature-complete set of enemy ship types", then "a bespoke test crossing with every new element in one streamlined run"). ROSTER is
// section 6's table as data: each foe's class offset on the waypoint's base (econ/emocean.js ROLE_CLASS's way), its HP factor on
// WAVES.hp, what it fires (patterns.js names), its formation (world/emocean/waves.js PATHS) and the views it appears in. `showcase()`
// is the test crossing as one leg's plan, in schedule()'s own shape, so the leg runner plays it as it plays any waypoint:
//   1. the forms and the roll: eight bars with nothing to shoot, for Q and E (the mast folding is seen);
//   2. a breather: a refit (`refit` cue: the stage changes the hull; the five hulls, one a breather, sloop first);
//   3. every foe alone in chase, four bars each: it comes in, holds, fires its pattern once (a carrier brings the pattern where the
//      foe's own runtime is not built yet: legrunner.js);
//   4. a refit, then the same in overhead; a refit, then the same in side;
//   5. a last refit (the galleon) and the forms again: a heavy hull rides the surface (ships.js dive: Q is refused).
// DEBUG only, picked at the pier (Petra's); nothing it gives is counted (the DEBUG save).
//
// Prior art: a shmup's stage select and its practice mode (Ikaruga's, DoDonPachi's), the fighting game's training dummy that shows each
// move alone; Cave's wave tables.
//
//   ROSTER[foe] = { cls, hp, fires: [{ name, params? }], formation, count, views: 'COS', with? }   showcase() -> plan (schedule's shape)
//   SHOWCASE = { foeBars, stretch, breather, hulls }
// ---------------------------------------------------------------------------------------
import { SWING_CLEAR, SWING_BREATH } from './legs.js';

/** Section 6's roster: class offset, HP factor, what it fires, its formation and count, its views (C chase, O overhead, S side). */
export const ROSTER = {
  school:     { cls: 0, hp: 1, fires: [{ name: 'aimedBurst', params: { n: 1, volleys: 2 } }], formation: 'line', count: 8, views: 'COS' },
  swooper:    { cls: 0, hp: 1, fires: [{ name: 'oddFan', params: { n: 3, volleys: 1 } }], formation: 'pincer', count: 2, views: 'OS' },
  darter:     { cls: 1, hp: 1, fires: [{ name: 'mixed', params: { of: 'aimedBurst', share: 1 } }], formation: 'dash', count: 2, views: 'CS' },
  rammer:     { cls: 1, hp: 2, fires: [{ name: 'frenzyDash', params: { n: 1, volleys: 2 } }], formation: 'dash', count: 1, views: 'COS' },
  sniper:     { cls: 1, hp: 1, fires: [{ name: 'sweepBeam', params: { from: 0, to: 0, warn: 1.5, burn: 0.5, volleys: 1 } }], formation: 'hold', count: 1, views: 'COS' },
  ambusher:   { cls: 1, hp: 1, fires: [{ name: 'oddFan', params: { n: 5, volleys: 1 } }], formation: 'dash', count: 2, views: 'COS' },
  turret:     { cls: 1, hp: 2, fires: [{ name: 'rotatingRing', params: { volleys: 4 } }], formation: 'hold', count: 1, views: 'OS' },
  'mine-layer': { cls: 1, hp: 1, fires: [{ name: 'decelBurst', params: { volleys: 2 } }], formation: 'line', count: 1, views: 'OS' }, // (its mines: shells that stop and burst, until the mine is a foe of its own)
  escort:     { cls: 1, hp: 2, fires: [{ name: 'aimedBurst', params: { n: 1, volleys: 2 } }], formation: 'hold', count: 2, views: 'COS', with: 'gunship' },
  carrier:    { cls: 1, hp: 2, fires: [], formation: 'hold', count: 1, views: 'COS' }, // (seen in every other foe's stretch: it brings what has no thrower)
  sweeper:    { cls: 2, hp: 1, fires: [{ name: 'sweepBeam', params: { volleys: 1 } }], formation: 'hold', count: 1, views: 'COS' },
  heavy:      { cls: 2, hp: 1, fires: [{ name: 'rotatingRing', params: { volleys: 4 } }], formation: 'hold', count: 1, views: 'OCS' },
  gunship:    { cls: 2, hp: 1, fires: [{ name: 'stackFan', params: { volleys: 2 } }, { name: 'splitShell', params: { volleys: 2 } }], formation: 'hold', count: 1, views: 'COS' },
  blocker:    { cls: 2, hp: 3, fires: [], formation: 'hold', count: 1, views: 'OS' },
};

/** The test crossing's measures (bars): each foe's stretch, the forms' stretch, a breather; the hulls in order, one a refit. */
export const SHOWCASE = { foeBars: 4, stretch: 8, breather: 4, hulls: ['sloop', 'frigate', 'tanker', 'destroyer', 'galleon'] };
const VIEW_OF = { C: 'chase', O: 'above', S: 'side' };
const modeOf = (view) => (view === 'chase' ? 'cone' : 'plane');

/** The test crossing as a leg's plan: { type: 'showcase', bars, phases: [{ id, from, to, view }], events, swings }. */
export function showcase() {
  const S = SHOWCASE, phases = [], events = [];
  let b = 0, k = 0;
  const phase = (id, view, n) => { phases.push({ id, from: b, to: b + n, view }); b += n; };
  const refit = () => { const hull = S.hulls[Math.min(k++, S.hulls.length - 1)]; events.push({ bar: b, phase: `refit.${hull}`, refit: hull }); phase(`refit.${hull}`, phases.at(-1)?.view || 'chase', S.breather); };
  events.push({ bar: 0, phase: 'forms', refit: S.hulls[k++] }); // (the sloop from the start)
  phase('forms', 'chase', S.stretch);
  for (const v of ['C', 'O', 'S']) {
    refit();
    const view = VIEW_OF[v];
    if (phases.at(-1).view !== view) phase(`swing.${v}`, view, 1); // (the swing on its own bar: nothing enters or fires across it)
    for (const [foe, R] of Object.entries(ROSTER)) {
      if (!R.views.includes(v) || foe === 'carrier') continue;
      const at = b;
      if (R.with) events.push({ bar: at, phase: foe, wave: { role: R.with, formation: 'hold', count: 1, cls: ROSTER[R.with].cls } });
      events.push({ bar: at, phase: foe, wave: { role: foe, formation: R.formation, count: R.count, cls: R.cls } });
      R.fires.forEach((f, i) => events.push({ bar: at + 1 + i, phase: foe, pattern: { name: f.name, params: { ...(f.params || {}) }, from: foe, kind: i % 2 ? 'umbral' : 'astral', mode: modeOf(view) } }));
      phase(foe, view, S.foeBars);
    }
  }
  refit();
  phase('forms.heavy', phases.at(-1).view, S.stretch);
  events.sort((a, c) => a.bar - c.bar);
  const swings = phases.filter((p, i) => i > 0 && p.view !== phases[i - 1].view).map((p) => p.from);
  const clear = events.filter((e) => !(e.pattern && swings.some((w) => e.bar >= w - SWING_CLEAR && e.bar < w + SWING_BREATH)));
  return { type: 'showcase', bars: b, phases, events: clear, feel: null, storm: false, strength: 1, swings };
}
