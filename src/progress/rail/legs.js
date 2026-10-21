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
// THE FLOW (the owner, 2026-10-21: "an awful staccato [...] followed by multiple seconds of dead air"; docs/plans/RAIL-FLOW.md). The
// pacing law above assumed a wave lingers six bars; a school falls to the gun in about one, so a wave every three or four bars left
// two of nothing. Now: a phase's waves are its QUEUE, each at the latest bar it may enter (a `cycle` lays a list of waves round and
// round, a bar or so apart), and its FLOOR (`FLOORS`) the fewest foes in frame it allows: the runtime pulls the next queued wave
// forward to the next beat whenever the live count falls under the floor (world/emocean/legrunner.js), so clearing fast brings the
// next fast (Ikaruga's chain waves, Star Fox 64's stream). A swing carries a FLOURISH (lights to lock flown through the turn), and the
// check (`deadBeats`) holds every leg, with a good player's kill model, to no beat without a target in frame.
//
//   LEGS[type] = { bars, phases: { open, build, peak, release }, views, floors?, cues: [cue] }   schedule(type, { strength, feel, storm }) -> plan
//   cue = { phase, at, every?, until?, wave?: { role, formation, count, cls?, lane? } | cycle?: [wave] | pattern?: { name, params?, from,
//          kind?, mode? } | targets?: n | director?: setPiece }      plan = { type, bars, phases: [{ id, from, to, view, floor }], events: [{ bar, ... }] }
//   deadBeats(plan) -> [bar] with .runs (two empty beats or more in a row: the flow wants none) and .perMinute   flow(plan) -> events retimed
//   aliveBars(event, strength?) -> [from, to]   kindFor(kind, feel, r) -> 'astral' | 'umbral'
// ---------------------------------------------------------------------------------------
import { STORM } from '../econ/passage.js';
import { formSkew } from './trip.js';
import { showLeg, ROSTER } from './showcase.js';
import { WAVES } from './setpieces.js';

/** The kill model the flow is judged by (RAIL-FLOW.md 0, cause 1). A GOOD player lands 24 shots a bar (six tenths of the scripted
 *  expert's 39.5 a bar: Petra's charybdistest); a foe is in frame from half a bar after its bar (its entrance from the edge) until it
 *  is shot down or its path takes it off (`PATH` bars: a formation crosses in six, a roster foe that holds, its hold and two); lights
 *  to lock live a third of a bar (a good player clears eight in about 0.5 real s: Petra's v255 headless); a director holds the whole of its phase (a boss leaves only beaten). */
export const KILL = { good: 24, each: 1 / 6, flock: 1 / 12, enter: 0.5, path: 6, lights: 1 / 3 };
/** The floor pulls no sooner than half a bar after a queue's last pull (an entrance needs room to be read: Galaga's dives come in
 *  turn, not at once); one pull brings as many of the queue's next waves as fill the shortfall (floor less live), so a queue of ones
 *  and twos keeps its floor too (Petra's v255 headless: one wave a pull left the build at 5.6 live of 10, the peak 3.5 of 8). */
export const PULL_GAP = 0.5;
/** Each phase's floor: the fewest foes in frame it allows before the runtime pulls the next queued wave forward (first guesses: the open
 *  teaches, so few; the build presses; beside a boss, its adds; the release is a shower of lights). */
export const FLOORS = { open: 6, build: 10, peak: 8, release: 12 };
/** The lights a swing carries through its turn (they cannot fire: the camera's move is shot through). */
export const FLOURISH = 6;
/** The bar in seconds (the cue's: progress/rail/crossing.js BAR_S), to turn a pattern's seconds into bars. */
const BAR = 1.5;

/** The readability laws' numbers (above): phases doubled; no pattern in the 3 bars before a swing (a shot lives up to about 6 s, 4 bars,
 *  but most are gone in 2) nor the first bar after; shots of one world in blocks of 8 bars (4 in the graveyard). */
export const STRETCH = 2, SWING_CLEAR = 3, SWING_BREATH = 1, WORLD_BLOCK = 8;
const P = (open, build, peak, release) => ({ open: open * STRETCH, build: build * STRETCH, peak: peak * STRETCH, release: release * STRETCH });
const V = (open, build, peak, release) => ({ open, build, peak, release });
/** A queue laid round and round: the waves of `list` in turn, from bar `at` every `every` bars (to `until`). */
const Q = (phase, at, every, list, until) => ({ phase, at, every, cycle: list, ...(until != null ? { until } : {}) });
const W = (role, formation, count, cls) => ({ role, formation, count, ...(cls != null ? { cls } : {}) }); // (a phase's view: a name, not stretched: P('chase', ...) made NaN of every view, Petra's catch)

/** The legs. `at` is a bar within the cue's phase; `every` repeats it to the phase's end (or `until`). `from` names who fires a pattern:
 *  'ahead' (a carrier that comes in, holds and leaves: world/emocean/legrunner.js), or a live foe of a role in frame ('school',
 *  'darter', 'heavy'; the shoal's peak fish are 'glint'), or the leg's 'object' (its director's big thing), a carrier where there is
 *  none; `kind` is 'astral', 'umbral', 'feel' (by the waypoint's feeling: trip.formSkew) or 'gift' (the ship's own
 *  form: absorbed, it fills the surge). */
export const LEGS = {
  // THE SHOAL: the swarm's own leg. Rammers and darters taught in chase; swoopers, mine-layers and a turret overhead with a spawner's
  // hatch and the heavy the school was fleeing; the bait ball at the peak with darters at its edge.
  shoal: { bars: 96, phases: P(8, 18, 18, 4), views: V('chase', 'above', 'free', 'chase'), cues: [
    Q('open', 0, 1, [W('school', 'line', 8), W('school', 'vee', 7), W('rammer', 'dash', 1), W('school', 'line', 8), W('darter', 'dash', 2)]),
    { phase: 'open', at: 6, wave: W('swarm', 'river', 24) },
    { phase: 'open', at: 1, every: 4, pattern: { name: 'offsetTwins', from: 'ahead', kind: 'feel', params: { volleys: 4 } } },
    Q('build', 0, 1, [W('school', 'vee', 7), W('swooper', 'pincer', 2), W('school', 'ring', 8), W('mine-layer', 'line', 1), W('school', 'line', 8), W('turret', 'hold', 1)]),
    { phase: 'build', at: 4, wave: W('heavy', 'hold', 1, 2) },
    { phase: 'build', at: 18, wave: W('spawner', 'hold', 1) },
    { phase: 'build', at: 10, every: 16, wave: W('swarm', 'ribbon', 32) },
    { phase: 'build', at: 5, every: 4, until: 34, pattern: { name: 'rotatingRing', from: 'heavy', kind: 'feel' } },
    { phase: 'build', at: 1, every: 6, pattern: { name: 'sineCurtain', from: 'ahead', kind: 'feel' } },
    { phase: 'peak', at: 0, director: 'shoal' },
    Q('peak', 2, 3, [W('darter', 'dash', 2), W('rammer', 'dash', 1), W('school', 'vee', 6)]),
    { phase: 'peak', at: 2, every: 4, pattern: { name: 'cageRing', from: 'glint', kind: 'feel' } },
    { phase: 'peak', at: 1, every: 3, pattern: { name: 'frenzyDash', from: 'glint', kind: 'feel' } },
    { phase: 'release', at: 0, every: 1, targets: 8 },
    Q('release', 0, 2, [W('swarm', 'river', 24), W('school', 'line', 8), W('school', 'vee', 7)]), // (the release is a lap of honour: lights and fodder, never dead: Petra's v255 found it 16 beats of 32 empty)
  ] },
  // THE WRECKERS: darters and an ambusher in chase; the side view's sniper, sweeper and grappler among schools; the brig with boarders,
  // ambushers and swoopers round her.
  wreckers: { bars: 112, phases: P(8, 20, 24, 4), views: V('chase', 'side', 'side', 'astern'), cues: [
    Q('open', 0, 1, [W('darter', 'dash', 2), W('school', 'line', 8), W('ambusher', 'dash', 2), W('school', 'vee', 6)]),
    { phase: 'open', at: 8, wave: W('swarm', 'river', 24) },
    { phase: 'open', at: 1, every: 2, pattern: { name: 'aimedBurst', from: 'darter', kind: 'feel', params: { volleys: 2 } } },
    Q('build', 0, 1, [W('school', 'vee', 6), W('darter', 'dash', 2), W('sniper', 'hold', 1), W('school', 'line', 8), W('swooper', 'pincer', 2), W('grappler', 'dash', 1), W('school', 'ring', 8), W('sweeper', 'hold', 1)]),
    { phase: 'build', at: 14, every: 16, wave: W('swarm', 'ribbon', 32) },
    { phase: 'build', at: 1, every: 5, pattern: { name: 'gapWall', from: 'ahead', kind: 'feel' } },
    { phase: 'build', at: 3, every: 5, pattern: { name: 'homingSalvo', from: 'darter', kind: 'umbral' } },
    { phase: 'peak', at: 0, director: 'pirates' },
    Q('peak', 2, 3, [W('ambusher', 'dash', 2), W('school', 'vee', 6), W('swooper', 'pincer', 2), W('grappler', 'dash', 1)]),
    { phase: 'peak', at: 2, every: 4, pattern: { name: 'stackFan', from: 'object', kind: 'feel' } },
    { phase: 'peak', at: 4, every: 6, pattern: { name: 'splitShell', from: 'object', kind: 'umbral', params: { T: 0.5 } } }, // (splits sooner since the side camera came closer, 2026-10-20: from 15 m a 0.9 s flight split 1.6 m off the ship)
    { phase: 'release', at: 0, every: 1, targets: 8 },
    Q('release', 0, 2, [W('swarm', 'river', 24), W('school', 'line', 8), W('school', 'vee', 7)]), // (the release is a lap of honour: lights and fodder, never dead: Petra's v255 found it 16 beats of 32 empty)
  ] },
  // THE ROGUE LEVIATHAN: rammers and rings in chase; overhead the heavy, a turret, a blocker (Flash or Bomb) and a mine-layer with a
  // spawner; Old Nobody in the side view with schools, swoopers and a sniper at its flanks, and a swarm through its breath.
  leviathan: { bars: 128, phases: P(8, 24, 28, 4), views: V('chase', 'above', 'side', 'astern'), cues: [
    Q('open', 0, 1, [W('school', 'line', 8), W('rammer', 'dash', 1), W('school', 'ring', 8), W('darter', 'dash', 2)]),
    { phase: 'open', at: 6, wave: W('swarm', 'river', 24) },
    { phase: 'open', at: 1, every: 4, pattern: { name: 'accelRain', from: 'ahead', kind: 'feel', params: { volleys: 5 } } },
    Q('build', 0, 1, [W('school', 'ring', 8), W('swooper', 'pincer', 2), W('turret', 'hold', 1), W('school', 'vee', 7), W('blocker', 'hold', 1), W('mine-layer', 'line', 1), W('school', 'line', 8)]),
    { phase: 'build', at: 2, wave: W('heavy', 'hold', 1, 2) },
    { phase: 'build', at: 20, wave: W('spawner', 'hold', 1) },
    { phase: 'build', at: 12, every: 24, wave: W('swarm', 'bloom', 32) },
    { phase: 'build', at: 3, every: 4, until: 32, pattern: { name: 'multiSpiral', from: 'heavy', kind: 'feel' } },
    { phase: 'build', at: 32, every: 3, pattern: { name: 'doubleHelix', from: 'ahead', kind: 'feel' } },
    { phase: 'peak', at: 0, director: 'leviathan' },
    Q('peak', 2, 3, [W('school', 'vee', 6), W('swooper', 'pincer', 2), W('sniper', 'hold', 1), W('darter', 'dash', 2)]),
    { phase: 'peak', at: 20, wave: W('swarm', 'ribbon', 48) },
    { phase: 'peak', at: 2, every: 5, pattern: { name: 'rose', from: 'object', kind: 'feel', params: { n: 30, speed: 7, swell: 7 } } }, // (for the nearer frames, 2026-10-20: slowed from 9, 0.42 real s to react from 15 m, the rule's 0.5; 30 petals not 36, its gap 3.26 m under three ship widths)
    { phase: 'peak', at: 4, every: 7, pattern: { name: 'sweepBeam', from: 'object', kind: 'umbral' } },
    { phase: 'release', at: 0, every: 1, targets: 8 },
    Q('release', 0, 2, [W('swarm', 'river', 24), W('school', 'line', 8), W('school', 'vee', 7)]), // (the release is a lap of honour: lights and fodder, never dead: Petra's v255 found it 16 beats of 32 empty)
  ] },
  // THE EYEWALL: the rollercoaster itself (dodging walls and beams), and now targets through it: darters and schools, ambushers in the
  // peak and a swarm thrown round the eye.
  eyewall: { bars: 80, phases: P(8, 12, 16, 4), views: V('chase', 'free', 'chase', 'chase'), floors: { open: 6, build: 6, peak: 8, release: 10 }, cues: [
    { phase: 'open', at: 0, every: 4, pattern: { name: 'sweepBeam', from: 'ahead', kind: 'feel', params: { volleys: 1 } } },
    Q('open', 1, 1.5, [W('darter', 'dash', 2), W('school', 'line', 6)]),
    { phase: 'build', at: 0, every: 3, pattern: { name: 'gapWall', from: 'ahead', kind: 'feel' } },
    { phase: 'build', at: 1, every: 4, pattern: { name: 'snakeLaser', from: 'ahead', kind: 'umbral' } },
    Q('build', 0, 1.5, [W('darter', 'dash', 2), W('school', 'vee', 6), W('rammer', 'dash', 1)]),
    { phase: 'peak', at: 0, every: 4, pattern: { name: 'crossGate', from: 'ahead', kind: 'feel' } },
    { phase: 'peak', at: 2, every: 4, pattern: { name: 'itano', from: 'ahead', kind: 'astral' } },
    { phase: 'peak', at: 1, every: 5, pattern: { name: 'sweepBeam', from: 'ahead', kind: 'umbral' } },
    Q('peak', 0, 1.5, [W('school', 'ring', 6), W('ambusher', 'dash', 2), W('school', 'line', 8)]),
    { phase: 'peak', at: 10, wave: W('swarm', 'ribbon', 32) },
    { phase: 'release', at: 0, every: 1, targets: 6 },
    Q('release', 0, 2, [W('swarm', 'river', 24), W('school', 'line', 8), W('school', 'vee', 7)]), // (the release is a lap of honour: lights and fodder, never dead: Petra's v255 found it 16 beats of 32 empty)
  ] },
  // THE GRAVEYARD: both worlds at once. Schools, darters and rammers in chase; the side view's sniper, swoopers and a mine-layer; the
  // Drowned Light (a heavy until its director) with escorts, ambushers and a grappler, and a swarm blooming from the wrecks.
  graveyard: { bars: 96, phases: P(8, 18, 18, 4), views: V('chase', 'side', 'free', 'chase'), cues: [
    Q('open', 0, 1, [W('school', 'line', 6), W('darter', 'dash', 2), W('school', 'vee', 6), W('rammer', 'dash', 1)]),
    { phase: 'open', at: 8, wave: W('swarm', 'river', 24) },
    { phase: 'open', at: 1, every: 4, pattern: { name: 'decelBurst', from: 'ahead', kind: 'umbral', params: { volleys: 2 } } },
    Q('build', 0, 1, [W('school', 'ring', 8), W('sniper', 'hold', 1), W('darter', 'dash', 2), W('swooper', 'pincer', 2), W('mine-layer', 'line', 1), W('school', 'line', 8)]),
    { phase: 'build', at: 18, wave: W('swarm', 'ribbon', 32) },
    { phase: 'build', at: 1, every: 4, pattern: { name: 'fragmentRing', from: 'ahead', kind: 'astral' } },
    { phase: 'build', at: 3, every: 4, pattern: { name: 'curving', from: 'ahead', kind: 'umbral' } },
    { phase: 'peak', at: 0, wave: W('heavy', 'hold', 1, 3) }, // (the Drowned Light: a placeholder heavy until it has a director)
    Q('peak', 1, 2, [W('school', 'vee', 6), W('escort', 'hold', 2), W('ambusher', 'dash', 2), W('grappler', 'dash', 1)]),
    { phase: 'peak', at: 16, wave: W('swarm', 'bloom', 48) },
    { phase: 'peak', at: 1, every: 4, pattern: { name: 'rose', from: 'heavy', kind: 'feel' } },
    { phase: 'peak', at: 3, every: 4, pattern: { name: 'mixed', from: 'heavy', kind: 'umbral', params: { of: 'oddFan', share: 0.3 } } },
    { phase: 'release', at: 0, every: 1, targets: 8 },
    Q('release', 0, 2, [W('swarm', 'river', 24), W('school', 'line', 8), W('school', 'vee', 7)]), // (the release is a lap of honour: lights and fodder, never dead: Petra's v255 found it 16 beats of 32 empty)
  ] },
  // THE MAELSTROM: rings and rammers in chase; the whirl's ambushers round the first heavy; Charybdis (a heavy until its director) with
  // darters, rammers and a grappler, and a swarm the whirlpool throws up.
  maelstrom: { bars: 96, phases: P(8, 12, 24, 4), views: V('chase', 'free', 'free', 'chase'), cues: [
    Q('open', 0, 1, [W('school', 'ring', 8), W('darter', 'dash', 2), W('school', 'line', 8), W('rammer', 'dash', 1)]),
    { phase: 'open', at: 6, wave: W('swarm', 'river', 24) },
    { phase: 'open', at: 1, every: 3, pattern: { name: 'curving', from: 'ahead', kind: 'feel' } },
    { phase: 'build', at: 0, wave: W('heavy', 'hold', 1, 3) },
    Q('build', 1, 1.5, [W('school', 'pincer', 8), W('ambusher', 'dash', 2), W('school', 'vee', 7)]),
    { phase: 'build', at: 12, wave: W('swarm', 'ribbon', 32) },
    { phase: 'build', at: 1, every: 3, pattern: { name: 'accelSpiral', from: 'heavy', kind: 'feel' } },
    { phase: 'peak', at: 0, wave: W('heavy', 'hold', 1, 4) },
    Q('peak', 1, 2, [W('darter', 'dash', 2), W('school', 'ring', 8), W('rammer', 'dash', 1), W('grappler', 'dash', 1)]),
    { phase: 'peak', at: 24, wave: W('swarm', 'bloom', 48) },
    { phase: 'peak', at: 1, every: 4, pattern: { name: 'doubleHelix', from: 'heavy', kind: 'feel' } },
    { phase: 'peak', at: 3, every: 6, pattern: { name: 'itano', from: 'heavy', kind: 'umbral' } },
    { phase: 'release', at: 0, every: 1, targets: 8 },
    Q('release', 0, 2, [W('swarm', 'river', 24), W('school', 'line', 8), W('school', 'vee', 7)]), // (the release is a lap of honour: lights and fodder, never dead: Petra's v255 found it 16 beats of 32 empty)
  ] },
  // THE BOUNTY: vees and darters in chase; overhead swoopers, a turret, a mine-layer and a blocker with a spawner; the posted stray (a
  // heavy until its director) beside a gunship and its escort, with schools, ambushers, darters and a sniper.
  bounty: { bars: 112, phases: P(8, 20, 24, 4), views: V('chase', 'above', 'free', 'chase'), cues: [
    Q('open', 0, 1, [W('school', 'vee', 7), W('darter', 'dash', 2), W('school', 'line', 8), W('rammer', 'dash', 1)]),
    { phase: 'open', at: 8, wave: W('swarm', 'river', 24) },
    { phase: 'open', at: 1, every: 4, pattern: { name: 'oddFan', from: 'ahead', kind: 'feel' } },
    Q('build', 0, 1, [W('swooper', 'pincer', 2), W('school', 'line', 8), W('turret', 'hold', 1), W('school', 'ring', 8), W('mine-layer', 'line', 1), W('blocker', 'hold', 1)]),
    { phase: 'build', at: 16, wave: W('spawner', 'hold', 1) },
    { phase: 'build', at: 24, wave: W('swarm', 'ribbon', 32) },
    { phase: 'build', at: 1, every: 4, pattern: { name: 'stratRain', from: 'ahead', kind: 'feel' } },
    { phase: 'peak', at: 0, wave: W('heavy', 'hold', 1, 3) }, // (the posted stray, until its director)
    { phase: 'peak', at: 8, wave: W('gunship', 'hold', 1) },
    { phase: 'peak', at: 8, wave: W('escort', 'hold', 2) },
    Q('peak', 2, 2, [W('school', 'ring', 6), W('ambusher', 'dash', 2), W('darter', 'dash', 2), W('sniper', 'hold', 1)]),
    { phase: 'peak', at: 28, wave: W('swarm', 'bloom', 48) },
    { phase: 'peak', at: 1, every: 4, pattern: { name: 'multiSpiral', from: 'heavy', kind: 'feel' } },
    { phase: 'peak', at: 3, every: 4, pattern: { name: 'splitShell', from: 'heavy', kind: 'umbral' } },
    { phase: 'release', at: 0, every: 1, targets: 8 },
    Q('release', 0, 2, [W('swarm', 'river', 24), W('school', 'line', 8), W('school', 'vee', 7)]), // (the release is a lap of honour: lights and fodder, never dead: Petra's v255 found it 16 beats of 32 empty)
  ] },
  // THE CALM: a breath that still scores: lights to lock, shots of your own form to drink, and a swarm that does not fire drifting by.
  calm: { bars: 48, phases: P(8, 12, 0, 4), views: V('chase', 'above', 'above', 'chase'), floors: { open: 6, build: 6, peak: 0, release: 8 }, cues: [
    { phase: 'open', at: 0, every: 1, targets: 6 },
    Q('open', 0.5, 4, [W('swarm', 'river', 24), W('swarm', 'ribbon', 24), W('swarm', 'bloom', 24)]),
    { phase: 'open', at: 1, every: 4, pattern: { name: 'ring', from: 'ahead', kind: 'gift', params: { volleys: 1, speed: 9 } } },
    { phase: 'build', at: 0, every: 1, targets: 6 },
    Q('build', 0.5, 4, [W('swarm', 'ribbon', 32), W('swarm', 'bloom', 24), W('swarm', 'river', 32)]),
    { phase: 'build', at: 2, every: 4, pattern: { name: 'rose', from: 'ahead', kind: 'gift', params: { volleys: 1, n: 18, speed: 7, swell: 7 } } }, // (slowed from 9 when the overhead frame halved, 2026-10-20: from 15 m it gave 0.42 real s to react, the rule's 0.5)
    { phase: 'release', at: 0, every: 1, targets: 6 },
    Q('release', 0, 2, [W('swarm', 'river', 24), W('school', 'line', 8), W('school', 'vee', 7)]), // (the release is a lap of honour: lights and fodder, never dead: Petra's v255 found it 16 beats of 32 empty)
  ] },
};

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
  if (String(type).startsWith('show.')) return showLeg(type); // (the showcase crossing's legs: progress/rail/showcase.js)
  const L = LEGS[type]; if (!L) return null;
  const phases = [], at = {}; let b = 0;
  for (const id of ['open', 'build', 'peak', 'release']) { const n = L.phases[id]; if (!n) continue; at[id] = b; phases.push({ id, from: b, to: b + n, view: L.views[id], floor: (L.floors || FLOORS)[id] ?? FLOORS[id] }); b += n; }
  const events = [], dens = storm ? STORM.density : 1;
  for (const c of L.cues) {
    const ph = phases.find((p) => p.id === c.phase); if (!ph) continue;
    const end = c.until != null ? Math.min(ph.to, ph.from + c.until) : ph.to;
    const every = c.every ? c.every / (c.pattern ? dens : 1) : 0;
    for (let bar = ph.from + c.at, k = 0; bar < end; bar = every ? bar + every : end, k++) {
      const e = { bar: +bar.toFixed(3), phase: c.phase }, wave = c.wave || (c.cycle && c.cycle[k % c.cycle.length]);
      if (wave) Object.assign(e, { wave: { ...wave, cls: Math.max(0, Math.min(4, (wave.cls ?? 0) + strength - 1 + (storm ? STORM.strength : 0))) }, ...(c.cycle ? { queue: c.phase } : {}) });
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
  // THE FLOURISH: a swing is flown through, never waited out: lights to lock through its bar (RAIL-FLOW.md 1, law 2)
  for (const w of swings) clear.push({ bar: Math.max(0, w - 1), phase: phases.find((p) => w - 1 >= p.from && w - 1 < p.to)?.id || phases[0].id, targets: FLOURISH, flourish: true });
  clear.sort((a, b2) => a.bar - b2.bar);
  return { type, bars: L.bars, phases, events: clear, feel, storm: !!storm, strength, swings };
}
/** The nearest a thrower may stand to the ship, in the view's plane (m), when it fires: what legs.mjs judges every pattern from (the
 *  carrier's hold, about 15 m). A set piece's body ('object') nearer than this, or outside its view's CARRIER_AT box, hands its volley to a
 *  carrier (legrunner.js `throws`), so no shot is ever thrown from on top of the ship (the brig abeam in the side view stood 1.4 m off in plane). */
export const THROW_MIN = 15;
/** Where a pattern's carrier holds in each view (rail frame), where it comes in from (an offset), and the box a role's thrower must be
 *  in to throw (in frame: courier/ship/views.js VIEW_RIGS). The ship rests near (0, 3, 0). */
export const CARRIER_AT = {
  chase:  { at: [0, 5, 55], from: [0, 2, 50], box: { x: 24, y: [0, 14], z: [12, 70] } },
  free:   { at: [0, 5, 55], from: [0, 2, 50], box: { x: 26, y: [0, 15], z: [12, 70] } },
  above:  { at: [0, 4, 15], from: [0, 0, 12], box: { x: 14, y: [-5, 20], z: [-5, 20] } }, // (the mock's overhead rig, ruled 2026-10-20: the ship's box x ±14.5, z -5.4 to 20.5; the carrier holds 5 m inside the far edge and comes from just beyond it)
  side:   { at: [0, 5, 15], from: [0, 0, 12], box: { x: 6, y: [-2, 12.5], z: [-14, 19.5] } }, // (the side camera a quarter closer, ruled 2026-10-20: the frame less 8% on the wall plane, Petra's measure; the carrier holds 4.5 m inside the far edge and comes from just beyond it)
  astern: { at: [0, 5, -30], from: [0, 2, -40], box: { x: 24, y: [0, 14], z: [-60, -10] } },
};
/** A view's way of firing: in its plane (above, side, astern: a ring reads as a ring), or in a cone at the ship (chase, free). */
export const modeOf = (view) => (view === 'chase' || view === 'free' ? 'cone' : 'plane');

/** When an event's targets are in frame (bars): as the stream played them (`flow` sets `alive`), else alone, a good player killing them
 *  as they come (KILL): a wave from its entrance until found and shot down or off its path; lights a third of a bar; a director the
 *  rest of its phase. Null for a pattern. */
export function aliveBars(e, plan) {
  if (e.alive) return e.alive;
  if (e.wave) { const k = killOf(e); return [e.bar + KILL.enter, e.bar + KILL.enter + Math.min(k.path, k.each * k.n)]; }
  if (e.targets) return [e.bar + KILL.enter, e.bar + KILL.enter + KILL.lights];
  if (e.director) { const ph = plan.phases.find((p) => p.id === e.phase); return [e.bar, ph.to]; }
  return null;
}
/** What one event asks of the gun: how many, the bars to find and down each, the bars before it leaves. */
function killOf(e) {
  if (e.targets) return { n: e.targets, each: KILL.lights / 8, path: KILL.path };
  const w = e.wave, R = ROSTER[w.role], hp = (WAVES.hp[Math.max(0, Math.min(4, w.cls ?? 0))] || 1) * (R?.hp ?? 1);
  const path = R?.moves?.kind === 'hold' && typeof R.moves.hold === 'number' ? R.moves.hold + 2 : KILL.path;
  return { n: w.count || 1, each: Math.max(hp / KILL.good, R?.moves?.kind === 'flock' ? KILL.flock : KILL.each), path };
}
/** The stream as the runtime plays it (RAIL-FLOW.md 1, law 1), beat by beat, against one good player's one gun: in each phase, whenever
 *  fewer foes are alive (or entering) than its floor, its next queued waves (a `cycle`'s), enough to fill the shortfall, enter on that
 *  beat instead of their bars (no sooner than PULL_GAP after that queue's last pull), and the rest of that queue moves up by as much (a
 *  queue keeps its spacing: its bars are the latest a wave may wait); a queue run dry before its phase ends goes round its cycle again.
 *  The gun works the oldest foe in frame first, a beat's time at a time (KILL), so the stream runs at the player's kill rate. Returns the
 *  plan's events retimed, each with `alive` [from, to] bars. */
export function flow(plan) {
  const ev = plan.events.map((e) => ({ ...e })), queues = new Map(), STEP = 0.25;
  for (const e of ev) if (e.queue) { if (!queues.has(e.phase)) queues.set(e.phase, []); queues.get(e.phase).push(e); }
  for (const q of queues.values()) q.sort((a, b) => a.bar - b.bar);
  const shootable = (e) => e.wave || e.targets;
  const live = (t) => { // (as it will stand half a bar on, when a wave pulled now enters: what is entering counts, what the gun will have downed by then does not)
    let n = 0, gun = KILL.enter;
    for (const e of ev.filter((e) => shootable(e) && !e.alive?.done && e.bar + KILL.enter <= t + KILL.enter).sort((a, b) => a.bar - b.bar)) {
      if (e.k && t + KILL.enter >= e.alive[0] + e.k.path) continue;
      const k = e.k || { ...killOf(e), prog: 0, left: e.wave?.count || e.targets }, entered = e.bar + KILL.enter <= t;
      const downed = entered ? Math.min(k.left, Math.floor((gun + k.prog) / k.each)) : 0; gun -= downed * k.each;
      n += k.left - downed;
    }
    return n;
  };
  for (let t = 0; t < plan.bars; t += STEP) {
    const ph = plan.phases.find((p) => t >= p.from && t < p.to), q = ph && queues.get(ph.id);
    if (q?.length && t - (q.last ?? -9) >= PULL_GAP) {
      let short = (ph.floor ?? 0) - live(t);
      if (short > 0) q.last = t;
      while (short > 0) { // (one pull fills the shortfall: its waves enter together on this beat)
        const i = q.findIndex((e) => e.bar > t);
        if (i >= 0) { const d = q[i].bar - t; for (let j = i; j < q.length; j++) q[j].bar = +(q[j].bar - d).toFixed(3); short -= q[i].wave.count || 1; continue; }
        // the queue has run dry before its phase ends: the cycle goes round again (a cycle is a source, not a list)
        const c = q.cycle || (q.cycle = q.map((e) => e.wave)), n = q.length, e = { ...q[n - 1], bar: t, wave: { ...c[n % c.length], cls: q[n - 1].wave.cls }, k: null, alive: null };
        q.push(e); ev.push(e); short -= e.wave.count || 1;
      }
    }
    // the gun: the oldest foe in frame first, this beat's time spent finding and downing
    let budget = STEP;
    const now = ev.filter((e) => shootable(e) && !e.alive?.done && e.bar + KILL.enter <= t).sort((a, b) => a.bar - b.bar);
    for (const e of now) {
      if (!e.k) { e.k = { ...killOf(e), prog: 0 }; e.k.left = e.k.n; e.alive = [e.bar + KILL.enter, 0]; }
      if (t >= e.alive[0] + e.k.path) { e.alive[1] = e.alive[0] + e.k.path; e.alive.done = true; } // (off its path: escaped)
    }
    for (const e of now) {
      if (e.alive.done) continue;
      while (budget > 0 && e.k.left > 0) {
        const need = e.k.each - e.k.prog;
        if (need <= budget) { budget -= need; e.k.prog = 0; e.k.left--; } else { e.k.prog += budget; budget = 0; }
      }
      if (e.k.left <= 0) { e.alive[1] = t + STEP - budget; e.alive.done = true; }
      if (budget <= 0) break;
    }
  }
  for (const e of ev) if (e.alive && !e.alive.done) e.alive[1] = Math.min(plan.bars, e.alive[0] + e.k.path);
  return ev.sort((a, b) => a.bar - b.bar);
}
/** The beats (quarter bars) with nothing alive to shoot (aliveBars), the stream played (`flow`), from the first entrance on, and their
 *  runs (`runs`: [bar, beats] of two beats or more in a row). One empty beat is the breath after a wave cleared fast (Ikaruga's reward);
 *  two in a row is dead air, and the flow wants no run. Also what it feeds: foes a real minute. */
export function deadBeats(plan) {
  const ev = flow(plan), cover = ev.map((e) => aliveBars(e, plan)).filter(Boolean).sort((a, b) => a[0] - b[0]), dead = [];
  const start = cover.length ? cover[0][0] : 0;
  for (let q = Math.ceil(start * 4); q < plan.bars * 4; q++) { const t = q / 4; if (!cover.some(([a, b]) => t >= a && t < b)) dead.push(t); }
  dead.runs = []; for (let i = 0, r = 1; i < dead.length; i++) { if (dead[i + 1] === dead[i] + 0.25) r++; else { if (r > 1) dead.runs.push([dead[i] - (r - 1) * 0.25, r]); r = 1; } } // (two or more empty beats in a row: dead air; one is the breath after a wave cleared)
  dead.foes = ev.reduce((n, e) => n + (e.wave && e.bar < plan.bars ? e.wave.count : 0), 0); dead.perMinute = Math.round(dead.foes / (plan.bars * BAR / 60));
  return dead;
}
