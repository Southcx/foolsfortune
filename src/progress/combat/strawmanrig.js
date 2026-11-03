// ---------------------------------------------------------------------------------------
// STRAWMAN'S RIG: the tunable Strawman (docs/plans/DUNEMAW-SYSTEMS.md 5; GAPS G25, G80, G81, G293; the owner, 2026-10-06: "improve Strawman's
// ability to be tuned to test various combat interactions"). Strawman is a creature like any other whose health never falls; the rig sets the
// TEST'S conditions on it, never the game's tuning (so the tuned warning is not raised): its grain (the five dials), its mental state (held at
// one of the five, or free), its body's affinity (the damage type that bites it), its poise and each status's build-up, whether a blow from
// an ally is cut to a fifth (friendly-fire tolerance on), its guard's arc and its behaviour (still, guard, or one of the sparring circle's
// attack strings). Presets mirror real creatures, each from its source's own numbers; the bout's line names the setting, and a QAIS report
// filed in the Throwing Room carries it. A scripted run is a preset and a fixed sequence of blows, so a division measures a change against
// the same bout. Data and pure functions; the world side (the console, the application, `/strawman`) is world/throwingroom/strawmanrig.js.
//
// Prior art: fighting games' training modes (Street Fighter's and Tekken's dummy settings, saved and recorded), Apex's firing range dummy
// (health and armour set at a console), Monster Hunter's status build-up tables, Elden Ring's poise and build-up bars.
//
//   RIG (the defaults)   OPTIONS (the console's rows)   PRESETS[id] = { label, line, ...settings }   SCRIPTS[id] = { label, blows: [{ at, type, power }] }
//   rigOf(preset, over?) -> a complete rig   labelOf(rig) -> the bout line's name   diffOf(rig) -> the settings off the defaults   scriptOf(id)
// ---------------------------------------------------------------------------------------
import { TYPE_IDS } from './types.js';
import { STATES } from './mind.js';
import { SPECIES } from './temperament.js';

/** The defaults: Strawman as it stands (poise 1, stunFor 4 are room.js's own). `mind`: 'free' (it settles as any creature's) or a state's id
 *  held; `build`: a multiplier on each of the four statuses' build-up; `friendly`: tolerance on; `guard`: the half-angle of the arc a
 *  guarding Strawman blocks (degrees); `behaviour`: 'still', 'guard' or an attack string's id. */
export const RIG = {
  preset: 'plain', grain: { o: 0, c: 0, e: 0, a: 0, n: 0 }, mind: 'free', affinity: 'impact', poise: 1, stunFor: 4,
  build: { ego: 1, influence: 1, illusion: 1, delirium: 1 }, friendly: false, guard: 60, behaviour: 'still',
};

/** What the console offers a row. */
export const OPTIONS = {
  grain: [-1, -0.5, 0, 0.5, 1],
  mind: ['free', ...STATES.map((s) => s.id)],
  affinity: TYPE_IDS,
  poise: [0.5, 1, 2, 3, 5],
  stunFor: [0, 2, 4, 5, 8],
  build: [0.5, 1, 2],
  friendly: [false, true],
  guard: [30, 60, 90, 180],
};

/** The presets (each says which real creature it mirrors, and by which numbers). A slip jelly: its species' mean grain, poise 1, stunned 5 s
 *  (creatures/jelly/slipjelly.js JELLY); a bold one: the same, bold (e 1), poise 1.2; the Great Slip Jelly crowned: the FOE's class 2, poise
 *  x3 (slipjelly.js `c.poise *= 1 + cls`), Resolved and guarding the front; bare: the crown burst, the same poise, its mind loosed to free. */
export const PRESETS = {
  plain: { label: 'Plain', line: 'Strawman as it stands.' },
  slipjelly: { label: 'Slip jelly', line: "A slip jelly's grain, poise and stun.", grain: { ...SPECIES.slipjelly }, poise: 1, stunFor: 5, mind: 'free' },
  boldjelly: { label: 'Bold jelly', line: 'A slip jelly at the bold end: harder to stun.', grain: { ...SPECIES.slipjelly, e: 1 }, poise: 1.2, stunFor: 5, mind: 'free' },
  crowned: { label: 'Great Slip Jelly, crowned', line: 'The FOE under its crown: poise x3, Resolved, guarding.', grain: { ...SPECIES.slipjelly, e: 1 }, poise: 3, stunFor: 5, mind: 'resolved', behaviour: 'guard', guard: 90 },
  bare: { label: 'Great Slip Jelly, bare', line: 'The FOE with its crown burst: poise x3, its mind loosed.', grain: { ...SPECIES.slipjelly, e: 1 }, poise: 3, stunFor: 5, mind: 'free' },
};

/** Fixed blow sequences: `at` real s from the start, a damage `type` and a `power`. The same every run. */
const every = (n, gap, type, power = 1) => Array.from({ length: n }, (_, i) => ({ at: +(i * gap).toFixed(2), type, power }));
export const SCRIPTS = {
  light: { label: 'Twelve light blows', line: 'Twelve power-1 Impact blows, one every 0.5 s.', blows: every(12, 0.5, 'impact') },
  burst: { label: 'A burst', line: 'Twenty power-1 Impact blows, one every 0.15 s.', blows: every(20, 0.15, 'impact') },
  heavy: { label: 'Five heavy blows', line: 'Five power-3 Impact blows, one every 1.2 s.', blows: every(5, 1.2, 'impact', 3) },
  types: { label: 'Each type', line: 'Four power-1 blows of each damage type, one every 0.4 s.', blows: TYPE_IDS.flatMap((t, k) => every(4, 0.4, t).map((b) => ({ ...b, at: +(b.at + k * 1.8).toFixed(2) }))) },
  status: { label: 'Build a status', line: 'Ten power-1 blows of each non-Impact type, one every 0.3 s, a type after a type.', blows: ['ego', 'influence', 'illusion', 'delirium'].flatMap((t, k) => every(10, 0.3, t).map((b) => ({ ...b, at: +(b.at + k * 3.6).toFixed(2) }))) },
};
export const scriptOf = (id) => SCRIPTS[id] || null;

/** A complete rig: the defaults, a preset over them, `over` (a few settings) over that. */
export function rigOf(preset = 'plain', over = {}) {
  const P = PRESETS[preset] || PRESETS.plain, { label, line, ...set } = P; void label; void line;
  return { ...RIG, ...set, ...over, preset: PRESETS[preset] ? preset : 'plain', grain: { ...RIG.grain, ...(set.grain || {}), ...(over.grain || {}) }, build: { ...RIG.build, ...(set.build || {}), ...(over.build || {}) } };
}

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
/** The settings that are off the preset it was made from (the console marks them; the bout's line adds them). */
export function diffOf(rig) {
  const base = rigOf(rig.preset), out = [];
  for (const k of Object.keys(RIG)) if (k !== 'preset' && !same(rig[k], base[k])) out.push(k);
  return out;
}
/** The bout line's name for a rig: the preset, and "+ <settings>" for what was changed from it; empty for Strawman as it stands. */
export function labelOf(rig) {
  const d = diffOf(rig), name = PRESETS[rig.preset]?.label || 'Plain';
  if (rig.preset === 'plain' && !d.length) return '';
  return d.length ? `${name} + ${d.join(', ')}` : name;
}
