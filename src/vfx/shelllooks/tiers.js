// ---------------------------------------------------------------------------------------
// A SHELL'S TIER LADDER: the caster shells' looks weighed by their tier (docs/plans/CASTER-SHELLS.md section 2: I common, II uncommon,
// III rare, IV the Caster's own), so the eye knows the tier before anything is read (the owner, 2026-10-24: "more interesting and
// intense, like tripling the effects on the top end of the rarity spectrum"). Two parts, both data:
//   THE LADDER   one row a tier, applied in one place (vfx/vfx.js, to every `shell.*` effect it plays): particle counts and streams,
//                particle size and life, a lamp's strength and reach, a decal's and an effect mesh's glow, how long a scorch lies, and the
//                screen's weight (shake, hitstop, a flash). What a look says about reach (a ring's radius, where a particle is born, how
//                fast it flies) is never scaled: a bigger tier is louder, never a lie about where it bites.
//   THE EXTRAS   what reads as rare at a glance, played over a shell's own look by tier at its moments (fly, fire, land, set):
//                II   a pale sparkle riding the round;
//                III  a gold halo and glints on the round, a gold ring at the muzzle, a gold afterburst ring where it lands; the
//                     strongest (CROWNED) leave a gold sunburst burnt into the ground a while;
//                IV   the Caster's own: the film (Lachryma's oil-film schiller, vfx/oxidation.js featTint: "every feat of the
//                     Courier's power wears the film") on the round in flight; at the muzzle a star and two rings, and the toll seen
//                     (clay chips and gold spalling off the Courier's vessel); where it lands a held beat (a hitstop, the light drawn
//                     IN to the point), then an afterburst a fifth of a real second later: the star, a film ring running out past the
//                     screen, gold leaf thrown up that lands and lies, a kiss of the time grade (S7) and the frame's smear, and a
//                     kintsugi sunburst burnt into the ground for twelve real seconds.
// A beam (Thirteen, Calm) has no landing of its own here: its extras are laid where the aim meets the world as it fires.
//
// Comfort (CLAUDE.md, Feel and comfort): one flash a moment, soft and in the budget (vfx.js BUDGETS), never a pulse; the time grade's
// kiss, the smear and the tier's flash are the big-moment screen passes, and the setting `visual.glitch` off drops them (there is no
// flash setting of its own); shake goes through the camera's `visual.shake`. A round's extras are throttled by shell id (a volley of
// 24 rockets wears three signatures, and lands one afterburst), so a swarm stays a swarm and the budget is not spent on the echo.
//
// Prior art: loot rarity as a look before a word (Diablo II's item colours, Borderlands' beams of rarity, Warframe's Riven glow and
// relic tiers' radiance), Monster Hunter's attack weights (a bigger blow holds the frame longer, shakes it harder: the ladder's screen
// row), the anime "tame" before an ultimate (the held beat, then the release: Outlaw Star's Caster loading a rare shell, Gurren
// Lagann's drill's charge), kintsugi's gold seam for the toll paid in the vessel.
//
//   SHELL_TIER_LADDER (by tier)   ladderOf(name, ctx) (vfx.js asks)   withTier(tier, fn) (shelllooks.js: the tier of the look it plays)
//   TIER_EXTRAS (by tier)   CROWNED (by shell id)   tierLook(game, moment, row, ctx)   EFFECTS (`shell.tier.<n>.<part>`)
// ---------------------------------------------------------------------------------------
import { T } from '../../core/config.js';
import { shellById } from '../../progress/combat/castershells.js';
import { L, aimAt, toGround, groundRing, scorch } from './kit.js';

/** The ladder, one row a tier. count: particles a burst and a stream's rate; size, life: each particle's; light: a lamp's strength,
 *  reach its range; glow: a decal's and an effect mesh's brightness, linger how long a burnt mark (a darkening decal) lies; shake,
 *  hitstop, flash: the screen's weight (each still under its budget and its cap: vfx.js). I is the look as written. */
export const SHELL_TIER_LADDER = {
  1: { count: 1, size: 1, life: 1, light: 1, reach: 1, glow: 1, linger: 1, shake: 1, hitstop: 1, flash: 1 },
  2: { count: 1.5, size: 1.15, life: 1.1, light: 1.5, reach: 1.1, glow: 1.15, linger: 1.25, shake: 1.15, hitstop: 1.1, flash: 1 },
  3: { count: 2, size: 1.3, life: 1.25, light: 2, reach: 1.25, glow: 1.3, linger: 1.6, shake: 1.3, hitstop: 1.25, flash: 1.1 },
  4: { count: 3, size: 1.5, life: 1.5, light: 3, reach: 1.5, glow: 1.6, linger: 2.2, shake: 1.5, hitstop: 1.5, flash: 1.2 },
  5: { count: 2.5, size: 1.5, life: 1.4, light: 2.5, reach: 1.4, glow: 1.4, linger: 2.6, shake: 1.6, hitstop: 1.3, flash: 1 }, // (World: as heavy as IV, longer in the place, no film: what it pulled from the place is its own show, vfx/worldshells.js)
};
const PLAIN = SHELL_TIER_LADDER[1];

let NOW = 0; // (the tier of the shell whose look is being played, while shelllooks.js plays it)
/** Run `fn` with `tier` as the tier of every `shell.*` effect it plays (the shared looks, `shell.trail`, `shell.land`, carry no id). */
export function withTier(tier, fn) { const was = NOW; NOW = tier; try { return fn(); } finally { NOW = was; } }
/** The ladder row an effect is played at: the context's own (`ladder`, `tier`), the shell's whose look is playing, or the shell's its name
 *  names (`shell.<id>.<moment>`: the runner's own, played where they happen); null for anything that is not a shell's. */
export function ladderOf(name, ctx) {
  if (ctx.ladder) return ctx.ladder;
  if (typeof name !== 'string' || !name.startsWith('shell.')) return null;
  const tier = ctx.tier || NOW || shellById(name.split('.')[1])?.tier || 1;
  return SHELL_TIER_LADDER[tier] || PLAIN;
}

/** The extras by tier: an effect a moment (fly on the round, fire at the muzzle, land where it lands, mark on the ground under it), the
 *  toll at the Courier, screen the big-moment passes. Written at their own size: they are played on the plain row. */
export const TIER_EXTRAS = {
  2: { fly: 'shell.tier.2.fly' },
  3: { fly: 'shell.tier.3.fly', fire: 'shell.tier.3.fire', land: 'shell.tier.3.land', mark: 'shell.tier.3.mark' },
  4: { fly: 'shell.tier.4.fly', fire: 'shell.tier.4.fire', land: 'shell.tier.4.land', mark: 'shell.tier.4.mark', toll: 'shell.tier.4.toll', screen: 'shell.tier.4.screen' },
  5: { fly: 'shell.tier.3.fly', land: 'shell.tier.3.land', mark: 'shell.tier.3.mark' }, // (World: III's gold, never IV's film or toll; the draw is its own extra)
};
/** The strongest of the rare (tier III): they burn a gold sunburst into the ground where they land, as the Caster's own do. */
export const CROWNED = { stake: true, volcano: true, thunderhead: true, faradayCage: true, stasis: true, hydra: true, golem: true, prismatic: true, calm: true };

// (a round's extras throttled by key: at most `n` in a window of `win` real seconds)
const SEEN = new Map();
function allow(key, n, win) {
  const now = (globalThis.performance?.now?.() ?? Date.now()) / 1000, s = SEEN.get(key);
  if (!s || now - s.t > win) { SEEN.set(key, { t: now, n: 1 }); return true; }
  if (s.n >= n) return false;
  s.n++; return true;
}
const quiet = () => T.visual?.glitch === false;

/** Where a shell lands, its tier's extras: the burst at the point, the mark on the ground under it (and a crowned one's sunburst). */
function landing(g, row, X, at, normal) {
  if (!at || !allow(`${row.id}.land`, 1, 0.6)) return;
  const plain = { ladder: PLAIN, normal, dir: normal, floor: at.y - 0.05 };
  if (X.land) g.vfx.play(X.land, { ...plain, pos: at });
  const on = toGround(g, at.clone()), ground = { ...plain, pos: on, floor: on.y - 0.02 };
  if (X.mark) g.vfx.play(X.mark, ground);
  if (row.tier === 3 && CROWNED[row.id]) g.vfx.play('shell.tier.3.crown', ground);
  if (X.screen && !quiet()) g.vfx.play(X.screen, { ...plain, pos: at });
}

/** The one call (shelllooks.js, after a shell's own look): its tier's extras at this moment. */
export function tierLook(g, moment, row, ctx = {}) {
  const X = TIER_EXTRAS[row.tier || 1];
  if (!X) return;
  if (moment === 'fly') {
    const m = ctx.mesh;
    if (!X.fly || !m || !allow(`${row.id}.fly`, 3, 0.4)) return;
    g.vfx.play(X.fly, { ladder: PLAIN, pos: m.position, follow: (h) => !!m.parent && (h.pos.copy(m.position), true) });
  } else if (moment === 'fire') {
    const P = g.player, at = ctx.muzzle || P?.pos;
    if (X.fire && at) g.vfx.play(X.fire, { ladder: PLAIN, pos: at, dir: ctx.ray?.dir });
    if (X.toll && P) g.vfx.play(X.toll, { ladder: PLAIN, pos: P.pos.clone().setY(P.pos.y + 1.1), floor: P.pos.y - 0.02 });
    if (row.carrier === 'beam' && ctx.ray && row.tier >= 3) { const { at: end, normal, hit } = aimAt(g, ctx.ray, 200); if (hit) landing(g, row, X, end, normal); }
  } else if (moment === 'land') landing(g, row, X, ctx.at, ctx.normal);
  else if (moment === 'set' && ctx.obj && X.mark && allow(`${row.id}.set`, 1, 0.6)) g.vfx.play(X.mark, { ladder: PLAIN, pos: ctx.obj.position, floor: ctx.obj.position.y - 0.02 });
}

const GOLD = 'gold', PALE = 0xfff0c0, CLAY = [0xb4603f, 0x8c4a33, 0xd9b89a];
const FILM = ['film', 'film', 'film', GOLD];
export const EFFECTS = {
  // ---- II: a pale sparkle riding the round
  'shell.tier.2.fly': { layers: [
    L({ type: 'sprites', rate: 14, dur: Infinity, shape: 'sparkle', spawn: 'shell', r: 0.12, size: [0.06, 0.1], sizeEnd: 0, life: [0.25, 0.4], color: [0xe8eef4, 'white'], alpha: 0.8, twinkle: 10 }),
  ] },
  // ---- III: gold
  'shell.tier.3.fly': { layers: [
    L({ type: 'sprites', rate: 30, dur: Infinity, shape: 'soft', size: 0.3, sizeEnd: 0.06, life: 0.1, color: GOLD, alpha: 0.55 }),
    L({ type: 'sprites', rate: 26, dur: Infinity, shape: 'glint', spawn: 'shell', r: 0.18, size: [0.09, 0.14], sizeEnd: 0, life: [0.35, 0.55], color: [GOLD, PALE], twinkle: 12 }),
  ] },
  'shell.tier.3.fire': { layers: [
    L({ type: 'sprites', count: 1, shape: 'ring', size: 0.15, sizeEnd: 1.1, life: 0.22, color: GOLD, rot: 0, powerCount: false }),
    L({ type: 'sprites', count: 8, shape: 'glint', dir: 'cone', cone: 30, speed: [3, 6], drag: 3, size: [0.1, 0.16], sizeEnd: 0, life: [0.25, 0.4], color: [GOLD, 'white'], twinkle: 12, powerCount: false }),
    L({ type: 'light', color: GOLD, k: 18, range: 6, dur: 0.25 }),
  ] },
  'shell.tier.3.land': { layers: [ // (the afterburst: a beat after the shell's own landing, a gold ring and glints)
    L({ type: 'sprites', at: 0.12, count: 1, shape: 'ringthin', size: 0.4, sizeEnd: 4, life: 0.32, color: GOLD, rot: 0, powerCount: false }),
    L({ type: 'sprites', at: 0.12, count: 16, shape: 'glint', spawn: 'sphere', r: 0.6, dir: 'sphere', speed: [2, 5], drag: 2, size: [0.12, 0.2], sizeEnd: 0, life: [0.5, 0.8], color: [GOLD, PALE], twinkle: 12, powerCount: false }),
    L({ type: 'light', at: 0.12, color: GOLD, k: 25, range: 8, dur: 0.4 }),
  ] },
  'shell.tier.3.mark': { layers: [groundRing({ to: 7, from: 0.4, dur: 0.5, tint: GOLD, at: 0.12, k: 1.1 })] },
  'shell.tier.3.crown': { layers: [ // (the strongest rare: a gold sunburst burnt in, lying eight real seconds)
    L({ type: 'decal', tex: 'scorch', at: 0.12, dur: 8, scale: [[0, 1.6], [0.04, 3.2], [1, 3.2]], k: [[0, 0], [0.04, 0.55], [0.6, 0.35], [1, 0]], tint: GOLD, glow: 1.2, offset: [0, 0.05, 0] }),
  ] },
  // ---- IV: the Caster's own, the film
  'shell.tier.4.fly': { layers: [
    L({ type: 'sprites', rate: 40, dur: Infinity, shape: 'soft', size: 0.45, sizeEnd: 0.1, life: 0.09, color: 'film', alpha: 0.6 }),
    L({ type: 'sprites', rate: 40, dur: Infinity, shape: 'sparkle', spawn: 'shell', r: 0.3, dir: 'sphere', speed: [0.3, 0.8], drag: 2, size: [0.1, 0.18], sizeEnd: 0, life: [0.5, 0.8], color: FILM, twinkle: 14 }),
    L({ type: 'sprites', rate: 10, dur: Infinity, shape: 'diamond', spawn: 'shell', r: 0.2, gravity: 3, size: [0.06, 0.1], sizeEnd: 0.02, life: [0.6, 0.9], color: [GOLD, PALE], spin: [-6, 6] }),
  ] },
  'shell.tier.4.fire': { layers: [
    L({ type: 'sprites', count: 1, shape: 'star4', size: 2.2, sizeEnd: 0.2, life: 0.3, color: 'white', colorEnd: 'film', powerCount: false }),
    L({ type: 'sprites', count: 1, shape: 'ring', size: 0.2, sizeEnd: 2.4, life: 0.35, color: 'film', rot: 0, powerCount: false }),
    L({ type: 'sprites', at: 0.08, count: 1, shape: 'ringthin', size: 0.2, sizeEnd: 3.4, life: 0.4, color: GOLD, rot: 0, powerCount: false }),
    L({ type: 'sprites', count: 24, shape: 'streak', dir: 'cone', cone: 20, speed: [10, 22], drag: 2, stretch: 2, size: [0.15, 0.25], sizeEnd: 0.03, life: [0.2, 0.35], color: [...FILM, 'white'], powerCount: false }),
    L({ type: 'light', color: 'film', k: 40, range: 10, dur: 0.4 }),
    L({ type: 'shake', k: 0.25 }),
  ] },
  'shell.tier.4.toll': { layers: [ // (the toll seen: the vessel's clay spalling off the Courier, the gold of its mending in the cracks)
    L({ type: 'sprites', pool: 'alpha', count: 10, shape: 'chip', spawn: 'sphere', r: 0.25, dir: 'sphere', speed: [1.5, 3.5], gravity: 9, drag: 0.5, size: [0.05, 0.09], life: [0.7, 1], color: CLAY, alpha: 3, alphaEnd: 0, floor: 'ground', spin: [-10, 10], powerCount: false }),
    L({ type: 'sprites', count: 12, shape: 'glint', spawn: 'sphere', r: 0.3, size: [0.06, 0.1], sizeEnd: 0, life: [0.4, 0.7], color: [GOLD, PALE], twinkle: 10, powerCount: false }),
    L({ type: 'sprites', count: 1, shape: 'ringthin', size: 0.3, sizeEnd: 1.4, life: 0.3, color: GOLD, rot: 0, powerCount: false }),
  ] },
  'shell.tier.4.land': { layers: [ // (the held beat, then the afterburst at 0.2)
    L({ type: 'hitstop', dur: 0.07, scale: 0.05 }),
    L({ type: 'sprites', count: 36, shape: 'streak', spawn: 'shell', r: 3.2, dir: 'in', speed: [14, 18], size: [0.14, 0.22], sizeEnd: 0.05, stretch: 2, life: [0.16, 0.2], color: [...FILM, 'white'], powerCount: false }),
    L({ type: 'sprites', count: 1, shape: 'ring', size: 4, sizeEnd: 0.3, life: 0.2, color: 'film', rot: 0, powerCount: false }),
    L({ type: 'sprites', at: 0.2, count: 1, shape: 'star4', size: 5, sizeEnd: 0.5, life: 0.4, color: 'white', colorEnd: 'film', powerCount: false }),
    L({ type: 'sprites', at: 0.2, count: 1, shape: 'core', size: 3, sizeEnd: 0.3, life: 0.35, color: GOLD, powerCount: false }),
    L({ type: 'sprites', at: 0.2, count: 50, shape: 'sparkle', dir: 'sphere', speed: [6, 14], drag: 1.6, gravity: 3, size: [0.2, 0.35], sizeEnd: 0, life: [0.7, 1.1], color: [...FILM, 'white'], twinkle: 10, powerCount: false }),
    L({ type: 'sprites', at: 0.2, pool: 'alpha', count: 24, shape: 'diamond', dir: 'cone', axis: 'up', cone: 70, speed: [5, 10], gravity: 9, drag: 0.5, size: [0.08, 0.14], life: [1.6, 2.2], color: [GOLD, PALE, 0xc89a3a], alpha: 3, alphaEnd: 0, floor: 'ground', spin: [-8, 8], powerCount: false }),
    L({ type: 'light', at: 0.2, color: 'film', k: 70, range: 18, dur: 0.6 }),
    L({ type: 'shake', at: 0.2, k: 0.45 }),
  ] },
  'shell.tier.4.mark': { layers: [ // (the film ring running out past the screen, a gold one after it, and the kintsugi sunburst burnt in)
    L({ type: 'decal', tex: 'shockring', blend: 'darken', order: 3, at: 0.2, dur: 0.8, scale: [[0, 0.9], [1, 16.5]], k: [[0, 1], [0.5, 0.75], [1, 0]], tint: 0x9a968e, glow: 0.85, offset: [0, 0.055, 0] }),
    L({ type: 'decal', tex: 'shockring', at: 0.2, dur: 0.8, scale: [[0, 1], [1, 18]], k: [[0, 1.7], [0.5, 0.9], [1, 0]], tint: GOLD, labradorite: 1, glow: 1.4, offset: [0, 0.06, 0] }),
    groundRing({ to: 11, from: 0.5, dur: 0.9, tint: GOLD, at: 0.32, k: 1.2, y: 0.065 }),
    scorch({ size: 5, dur: 12, at: 0.2 }),
    L({ type: 'decal', tex: 'scorch', at: 0.2, dur: 12, scale: [[0, 2.5], [0.02, 5.2], [1, 5.2]], k: [[0, 0], [0.02, 0.7], [0.5, 0.4], [1, 0]], tint: GOLD, labradorite: 0.7, glow: 1.2, offset: [0, 0.05, 0] }),
    L({ type: 'sprites', at: 0.2, rate: 6, dur: 6, shape: 'glint', spawn: 'disc', r: 2.5, offset: [0, 0.1, 0], size: [0.15, 0.25], sizeEnd: 0, life: 0.5, color: ['film', GOLD], twinkle: 10 }),
  ] },
  'shell.tier.4.screen': { layers: [ // (the big-moment screen passes: off with `visual.glitch`)
    L({ type: 'flash', at: 0.2, color: 0xfff0d8, k: 0.2, dur: 0.35 }),
    L({ type: 'smear', at: 0.2, amt: 0.35, zoom: 0.004, dur: 0.5 }),
    L({ type: 'caster', shader: 'timegrade', at: 0.2, dur: 0.55, radius: 3.5, drain: 0.75, grain: 0.3, rim: 0.6, k: [[0, 0], [0.1, 1], [0.5, 0.6], [1, 0]] }),
  ] },
};
