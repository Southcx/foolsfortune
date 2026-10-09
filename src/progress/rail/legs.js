// ---------------------------------------------------------------------------------------
// THE LEGS' SCHEDULES: what each waypoint's leg throws at the ship, bar by bar (docs/plans/RAIL-OVERHAUL.md sections 2 and 6; the trip's
// pressures, PASSAGE.md section 14). Data and pure functions: `schedule` turns a leg's cues into a list of events on the leg's bars,
// shaped by the waypoint (its Figment class, its feeling, a storm), and `idle` holds it to the pacing law (no 2-bar window without a
// threat or a target). The runtime that plays it is world/emocean/legrunner.js; the patterns are patterns.js's; the waves' formations
// and roles are world/emocean/waves.js's; a leg's big object is its set piece's director (shoal.js, pirates.js, leviathan.js: Petra's).
//
// Every leg is a curve (the law's second rule): OPEN shows one idea alone, BUILD mixes it with one other, PEAK is the big object whose
// parts pay, RELEASE is the parts falling and lights to lock. The bars are the ones Wanda's cues share (`music/legs.js`).
//
// READABILITY (the owner, 2026-10-09, QAIS R17: "impossible to know what is spawning what projectile, and from what frame of
// reference"; "extend the length of all legs by double"). Three laws on top of the pacing law, applied in `schedule`:
//   - STRETCH: every phase is twice the bars it was (a leg of 48 bars is 96, about 2.4 real minutes), so each idea has time to read;
//   - CLEAR SWINGS: no pattern fires in the SWING_CLEAR bars before a change of view, nor in the first bar after one (a breath): no
//     shot fired in one view is still flying when the camera turns to the next;
//   - ONE WORLD AT A TIME: a leg's shots are Astral or Umbral in blocks of WORLD_BLOCK bars (by the waypoint's feeling's skew), never mixed
//     within a block, so the Q you need is a beat you can feel, not a coin toss each shot (the graveyard, "both worlds at once", swaps
//     every 4 bars instead of 8). A 'gift' (the ship's own form, absorbed) is untouched.
//
// Prior art: the shmup stage script (Cave's and Treasure's, a wave table on the beat), Rez's areas (layers stacked on the music's
// phrase, a boss at the peak), Ikaruga's chapters (one idea a chapter, taught alone then mixed), Elemental Gearbolt's pacing (packed and
// open spaces in turn), and Slay the Spire's burning elite for the storm's weight.
//
//   LEGS[type] = { bars, phases: { open, build, peak, release }, views, cues: [cue] }   schedule(type, { strength, feel, storm }) -> plan
//   cue = { phase, at, every?, until?, wave?: { role, formation, count, cls?, lane? } | pattern?: { name, params?, from, kind?, mode? }
//          | targets?: n | director?: setPiece }      plan = { type, bars, phases: [{ id, from, to, view }], events: [{ bar, ... }] }
//   idle(plan) -> [[from, to]] (the windows of two bars or more with nothing in reach: the law wants none)   kindFor(kind, feel, r) -> 'astral' | 'umbral'
// ---------------------------------------------------------------------------------------
import { STORM } from '../econ/passage.js';
import { formSkew } from './trip.js';

/** How long a thing stays in reach once it enters (bars): a wave crosses the frame in about six; a pattern lasts its volleys and a bar
 *  of flight; lights to lock drift by for four; a director's peak is in reach throughout. */
export const REACH = { wave: 6, heavyWave: 14, pattern: 1, targets: 4 };
/** The bar in seconds (the cue's: progress/rail/crossing.js BAR_S), to turn a pattern's seconds into bars. */
const BAR = 1.5;

/** The readability laws' numbers (above): phases doubled; no pattern in the 3 bars before a swing (a shot lives up to about 6 s, 4 bars,
 *  but most are gone in 2) nor the first bar after; shots of one world in blocks of 8 bars (4 in the graveyard). */
export const STRETCH = 2, SWING_CLEAR = 3, SWING_BREATH = 1, WORLD_BLOCK = 8;
const P = (open, build, peak, release) => ({ open: open * STRETCH, build: build * STRETCH, peak: peak * STRETCH, release: release * STRETCH });

/** The legs. `at` is a bar within the cue's phase; `every` repeats it to the phase's end (or `until`). `from` names who fires a pattern:
 *  'ahead' (a point 60 m up the rail), or the newest live foe of a role ('school', 'darter', 'heavy'), or the leg's 'object' (its
 *  director's big thing); `kind` is 'astral', 'umbral', 'feel' (by the waypoint's feeling: trip.formSkew) or 'gift' (the ship's own
 *  form: absorbed, it fills the surge). */
export const LEGS = {
  shoal: { bars: 96, phases: P(8, 18, 18, 4), views: P('chase', 'above', 'free', 'chase'), cues: [
    { phase: 'open', at: 0, every: 3, wave: { role: 'school', formation: 'line', count: 8 } },
    { phase: 'open', at: 1, every: 4, pattern: { name: 'offsetTwins', from: 'ahead', kind: 'feel', params: { volleys: 4 } } },
    { phase: 'build', at: 0, every: 4, wave: { role: 'school', formation: 'vee', count: 7 } },
    { phase: 'build', at: 2, every: 6, wave: { role: 'school', formation: 'pincer', count: 8 } },
    { phase: 'build', at: 4, wave: { role: 'heavy', formation: 'hold', count: 1, cls: 2 } },
    { phase: 'build', at: 5, every: 4, until: 34, pattern: { name: 'rotatingRing', from: 'heavy', kind: 'feel' } },
    { phase: 'build', at: 1, every: 6, pattern: { name: 'sineCurtain', from: 'ahead', kind: 'feel' } },
    { phase: 'peak', at: 0, director: 'shoal' },
    { phase: 'peak', at: 2, every: 4, pattern: { name: 'cageRing', from: 'school', kind: 'feel' } },
    { phase: 'peak', at: 1, every: 3, pattern: { name: 'frenzyDash', from: 'school', kind: 'feel' } },
    { phase: 'release', at: 0, every: 4, targets: 8 },
  ] },
  wreckers: { bars: 112, phases: P(8, 20, 24, 4), views: P('chase', 'side', 'side', 'astern'), cues: [
    { phase: 'open', at: 0, every: 3, wave: { role: 'darter', formation: 'dash', count: 2 } },
    { phase: 'open', at: 1, every: 2, pattern: { name: 'aimedBurst', from: 'darter', kind: 'feel', params: { volleys: 2 } } },
    { phase: 'build', at: 0, every: 4, wave: { role: 'school', formation: 'vee', count: 6 } },
    { phase: 'build', at: 2, every: 5, wave: { role: 'darter', formation: 'dash', count: 2 } },
    { phase: 'build', at: 1, every: 5, pattern: { name: 'gapWall', from: 'ahead', kind: 'feel' } },
    { phase: 'build', at: 3, every: 5, pattern: { name: 'homingSalvo', from: 'darter', kind: 'umbral' } },
    { phase: 'peak', at: 0, director: 'pirates' },
    { phase: 'peak', at: 2, every: 4, pattern: { name: 'stackFan', from: 'object', kind: 'feel' } },
    { phase: 'peak', at: 4, every: 6, pattern: { name: 'splitShell', from: 'object', kind: 'umbral' } },
    { phase: 'release', at: 0, every: 4, targets: 8 },
  ] },
  leviathan: { bars: 128, phases: P(8, 24, 28, 4), views: P('chase', 'above', 'free', 'astern'), cues: [
    { phase: 'open', at: 0, every: 3, wave: { role: 'school', formation: 'line', count: 8 } },
    { phase: 'open', at: 1, every: 4, pattern: { name: 'accelRain', from: 'ahead', kind: 'feel', params: { volleys: 5 } } },
    { phase: 'build', at: 0, every: 4, wave: { role: 'school', formation: 'ring', count: 8 } },
    { phase: 'build', at: 2, wave: { role: 'heavy', formation: 'hold', count: 1, cls: 2 } },
    { phase: 'build', at: 3, every: 4, until: 32, pattern: { name: 'multiSpiral', from: 'heavy', kind: 'feel' } },
    { phase: 'build', at: 32, every: 3, pattern: { name: 'doubleHelix', from: 'ahead', kind: 'feel' } },
    { phase: 'peak', at: 0, director: 'leviathan' },
    { phase: 'peak', at: 2, every: 5, pattern: { name: 'rose', from: 'object', kind: 'feel' } },
    { phase: 'peak', at: 4, every: 7, pattern: { name: 'sweepBeam', from: 'object', kind: 'umbral' } },
    { phase: 'release', at: 0, every: 4, targets: 8 },
  ] },
  eyewall: { bars: 80, phases: P(8, 12, 16, 4), views: P('chase', 'free', 'chase', 'chase'), cues: [ // (few foes, all dodging: the rollercoaster itself)
    { phase: 'open', at: 0, every: 4, pattern: { name: 'sweepBeam', from: 'ahead', kind: 'feel', params: { volleys: 1 } } },
    { phase: 'open', at: 2, every: 4, wave: { role: 'darter', formation: 'dash', count: 2 } },
    { phase: 'build', at: 0, every: 3, pattern: { name: 'gapWall', from: 'ahead', kind: 'feel' } },
    { phase: 'build', at: 1, every: 4, pattern: { name: 'snakeLaser', from: 'ahead', kind: 'umbral' } },
    { phase: 'build', at: 2, every: 4, wave: { role: 'darter', formation: 'dash', count: 2 } },
    { phase: 'peak', at: 0, every: 4, pattern: { name: 'crossGate', from: 'ahead', kind: 'feel' } },
    { phase: 'peak', at: 2, every: 4, pattern: { name: 'itano', from: 'ahead', kind: 'astral' } },
    { phase: 'peak', at: 1, every: 5, pattern: { name: 'sweepBeam', from: 'ahead', kind: 'umbral' } },
    { phase: 'peak', at: 0, every: 4, wave: { role: 'school', formation: 'ring', count: 6 } },
    { phase: 'release', at: 0, every: 4, targets: 6 },
  ] },
  graveyard: { bars: 96, phases: P(8, 18, 18, 4), views: P('chase', 'side', 'free', 'chase'), cues: [ // (both worlds at once: kinds mixed)
    { phase: 'open', at: 0, every: 3, wave: { role: 'school', formation: 'line', count: 6 } },
    { phase: 'open', at: 1, every: 4, pattern: { name: 'decelBurst', from: 'ahead', kind: 'umbral', params: { volleys: 2 } } },
    { phase: 'build', at: 0, every: 4, wave: { role: 'school', formation: 'ring', count: 8 } },
    { phase: 'build', at: 2, every: 6, wave: { role: 'darter', formation: 'dash', count: 2 } },
    { phase: 'build', at: 1, every: 4, pattern: { name: 'fragmentRing', from: 'ahead', kind: 'astral' } },
    { phase: 'build', at: 3, every: 4, pattern: { name: 'curving', from: 'ahead', kind: 'umbral' } },
    { phase: 'peak', at: 0, wave: { role: 'heavy', formation: 'hold', count: 1, cls: 3 } }, // (the Drowned Light: a placeholder heavy until it has a director)
    { phase: 'peak', at: 1, every: 4, pattern: { name: 'rose', from: 'heavy', kind: 'feel' } },
    { phase: 'peak', at: 3, every: 4, pattern: { name: 'mixed', from: 'heavy', kind: 'umbral', params: { of: 'oddFan', share: 0.3 } } },
    { phase: 'peak', at: 2, every: 4, wave: { role: 'school', formation: 'vee', count: 6 } },
    { phase: 'release', at: 0, every: 4, targets: 8 },
  ] },
  maelstrom: { bars: 96, phases: P(8, 12, 24, 4), views: P('chase', 'free', 'free', 'chase'), cues: [ // (Charybdis: a heavy placeholder until its director)
    { phase: 'open', at: 0, every: 3, wave: { role: 'school', formation: 'ring', count: 8 } },
    { phase: 'open', at: 1, every: 3, pattern: { name: 'curving', from: 'ahead', kind: 'feel' } },
    { phase: 'build', at: 0, wave: { role: 'heavy', formation: 'hold', count: 1, cls: 3 } },
    { phase: 'build', at: 1, every: 3, pattern: { name: 'accelSpiral', from: 'heavy', kind: 'feel' } },
    { phase: 'build', at: 2, every: 4, wave: { role: 'school', formation: 'pincer', count: 8 } },
    { phase: 'peak', at: 0, wave: { role: 'heavy', formation: 'hold', count: 1, cls: 4 } },
    { phase: 'peak', at: 1, every: 4, pattern: { name: 'doubleHelix', from: 'heavy', kind: 'feel' } },
    { phase: 'peak', at: 3, every: 6, pattern: { name: 'itano', from: 'heavy', kind: 'umbral' } },
    { phase: 'peak', at: 2, every: 4, wave: { role: 'darter', formation: 'dash', count: 2 } },
    { phase: 'release', at: 0, every: 4, targets: 8 },
  ] },
  bounty: { bars: 112, phases: P(8, 20, 24, 4), views: P('chase', 'above', 'free', 'chase'), cues: [
    { phase: 'open', at: 0, every: 3, wave: { role: 'school', formation: 'vee', count: 7 } },
    { phase: 'open', at: 1, every: 4, pattern: { name: 'oddFan', from: 'ahead', kind: 'feel' } },
    { phase: 'build', at: 0, every: 4, wave: { role: 'darter', formation: 'dash', count: 2 } },
    { phase: 'build', at: 2, every: 4, wave: { role: 'school', formation: 'line', count: 8 } },
    { phase: 'build', at: 1, every: 4, pattern: { name: 'stratRain', from: 'ahead', kind: 'feel' } },
    { phase: 'peak', at: 0, wave: { role: 'heavy', formation: 'hold', count: 1, cls: 3 } }, // (the posted stray, until its director)
    { phase: 'peak', at: 1, every: 4, pattern: { name: 'multiSpiral', from: 'heavy', kind: 'feel' } },
    { phase: 'peak', at: 3, every: 4, pattern: { name: 'splitShell', from: 'heavy', kind: 'umbral' } },
    { phase: 'peak', at: 2, every: 4, wave: { role: 'school', formation: 'ring', count: 6 } },
    { phase: 'release', at: 0, every: 4, targets: 8 },
  ] },
  calm: { bars: 48, phases: P(8, 12, 0, 4), views: P('chase', 'above', 'above', 'chase'), cues: [ // (a breath that still scores: lights, and shots of your own form to drink)
    { phase: 'open', at: 0, every: 3, targets: 6 },
    { phase: 'open', at: 1, every: 4, pattern: { name: 'ring', from: 'ahead', kind: 'gift', params: { volleys: 1, speed: 9 } } },
    { phase: 'build', at: 0, every: 3, targets: 6 },
    { phase: 'build', at: 2, every: 4, pattern: { name: 'rose', from: 'ahead', kind: 'gift', params: { volleys: 1, n: 18 } } },
    { phase: 'release', at: 0, every: 4, targets: 6 },
  ] },
};
/** The encounter is no leg (its sequence and choice: encounters.js); the turn of the rail between legs is the stage's (4 bars). */
export const NOT_A_LEG = ['encounter'];

/** A shot's kind: a fixed one, the waypoint's feeling's share of astral (`feel`), or the ship's own form (`gift`, resolved at the
 *  shot: 'gift' passes through). */
export function kindFor(kind, feel, r = () => 0.5) { // (the runtime passes its seeded stream: core/rng.js)
  if (kind === 'feel') return r() < formSkew(feel) ? 'astral' : 'umbral';
  return kind || 'astral';
}

/** A leg's plan for a waypoint: its phases on the leg's bars (with the view each asks), and every event (a wave, a pattern, lights, the
 *  director's entrance) on its bar. A storm repeats patterns a share more often (STORM.density: their volleys, never their gaps, so a
 *  fair pattern stays fair) and a wave's class rises with the waypoint's strength. */
export function schedule(type, { strength = 1, feel = null, storm = false } = {}) {
  const L = LEGS[type]; if (!L) return null;
  const phases = [], at = {}; let b = 0;
  for (const id of ['open', 'build', 'peak', 'release']) { const n = L.phases[id]; if (!n) continue; at[id] = b; phases.push({ id, from: b, to: b + n, view: L.views[id] }); b += n; }
  const events = [], dens = storm ? STORM.density : 1;
  for (const c of L.cues) {
    const ph = phases.find((p) => p.id === c.phase); if (!ph) continue;
    const end = c.until != null ? Math.min(ph.to, ph.from + c.until) : ph.to;
    const every = c.every ? c.every / (c.pattern ? dens : 1) : 0;
    for (let bar = ph.from + c.at; bar < end; bar = every ? bar + every : end) {
      const e = { bar: +bar.toFixed(3), phase: c.phase };
      if (c.wave) Object.assign(e, { wave: { ...c.wave, cls: Math.max(0, Math.min(4, (c.wave.cls ?? 0) + strength - 1 + (storm ? STORM.strength : 0))) } });
      else if (c.pattern) Object.assign(e, { pattern: { ...c.pattern, params: { ...(c.pattern.params || {}) }, mode: c.pattern.mode || modeOf(ph.view) } });
      else if (c.targets) e.targets = c.targets;
      else if (c.director) e.director = c.director;
      events.push(e);
    }
  }
  events.sort((a, b2) => a.bar - b2.bar);
  // CLEAR SWINGS: a change of view at a phase's start bars patterns from SWING_CLEAR bars before it to SWING_BREATH after
  const swings = phases.filter((p, i) => i > 0 && p.view !== phases[i - 1].view).map((p) => p.from);
  const clear = events.filter((e) => !(e.pattern && e.pattern.kind !== 'gift' && swings.some((w) => e.bar >= w - SWING_CLEAR && e.bar < w + SWING_BREATH)));
  // ONE WORLD AT A TIME: 'feel' and the fixed kinds alike take their block's world (the feeling's skew, spread evenly by the golden ratio)
  const block = type === 'graveyard' ? WORLD_BLOCK / 2 : WORLD_BLOCK, skew = formSkew(feel);
  const worldAt = (bar) => (((Math.floor(bar / block) + 1) * 0.6180339887) % 1 < skew ? 'astral' : 'umbral');
  for (const e of clear) if (e.pattern && e.pattern.kind !== 'gift') e.pattern.kind = worldAt(e.bar);
  return { type, bars: L.bars, phases, events: clear, feel, storm: !!storm, strength, swings };
}
/** A view's way of firing: in its plane (above, side, astern: a ring reads as a ring), or in a cone at the ship (chase, free). */
export const modeOf = (view) => (view === 'chase' || view === 'free' ? 'cone' : 'plane');

/** The pacing law's first rule: the windows of two bars or more in which nothing is in reach (no foe crossing the frame, no pattern
 *  in the air, no lights to lock, no director's peak). `lasting(name)` is a pattern's length in seconds (patterns.js; the runtime and
 *  the check pass it). */
export function idle(plan, lasting = () => 3) {
  const cover = [];
  for (const e of plan.events) {
    if (e.wave) cover.push([e.bar, e.bar + (e.wave.role === 'heavy' ? REACH.heavyWave : REACH.wave)]);
    else if (e.pattern) cover.push([e.bar, e.bar + lasting(e.pattern.name, e.pattern.params) / BAR + REACH.pattern]);
    else if (e.targets) cover.push([e.bar, e.bar + REACH.targets]);
    else if (e.director) { const ph = plan.phases.find((p) => p.id === e.phase); cover.push([e.bar, ph.to]); }
  }
  cover.sort((a, b) => a[0] - b[0]);
  const gaps = []; let reach = 0;
  for (const [a, b] of cover) { if (a - reach >= 2) gaps.push([+reach.toFixed(2), +a.toFixed(2)]); reach = Math.max(reach, b); }
  if (plan.bars - reach >= 2) gaps.push([+reach.toFixed(2), plan.bars]);
  return gaps;
}
