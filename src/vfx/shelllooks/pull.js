// ---------------------------------------------------------------------------------------
// PULL'S LOOKS (the caster shells TYPE-42 to 50 still without one: docs/plans/CASTER-SHELLS.md section 3): gravity, space and portals,
// in the family's violet and crude's oil film. Rows for vfx/shelllooks.js, effects as data for vfx/library.js. Drawn already by the
// runner's parts: the Rift's eye on the ground and the Portal's linked pair (S5), the Moonlet's moon, the Lodestone's star.
//
// Prior art: Ratchet & Clank's Gravity Bomb and Vortex Cannon (a well that swings round and lets go), the shrink ray; the swapper of
// The Swapper (Facepalm Games, 2013: a pale clone left where you were); Super Mario Galaxy's gravity flips (rain falling up).
//
//   LOOKS (by shell id)   EFFECTS (`shell.<id>.<moment>`)
// ---------------------------------------------------------------------------------------
import { L, leaveGhost } from './kit.js';

const PULL = 0x8a7aff;

export const LOOKS = {
  slingshot: { kinds: { lobPart: { body: 'void', fly: 'shell.slingshot.fly', end: 'shell.slingshot.land', hold: (row) => row.n.dur + 0.5 } } },
  rift: { body: 'crude', fly: 'shell.slingshot.fly', land: false },
  portal: { fire: 'aim' },
  upfall: { land: 'point', hold: (row) => row.n.dur, r: (row) => row.n.r },
  moonlet: { fire: 'courier', hold: (row) => row.n.dur },
  // 49 Swap: a pale silhouette of you left where you stood (Blink Dash's afterimage), and one folding shut where it struck
  swap: { land: 'point', onLand(g) { leaveGhost(g, { life: 1.1, opacity: 0.5 }); if (g.player) g.vfx.play('shell.swap.land', { pos: g.player.pos.clone().setY(g.player.pos.y + 0.9) }); } },
  shrinker: { land: 'target', hold: () => 1 },
};

export const EFFECTS = {
  // 42 Slingshot: a well drawing dust and light round and in; at its end, everything flung out of it
  'shell.slingshot.fly': { layers: [
    L({ type: 'sprites', rate: 30, dur: Infinity, shape: 'soft', spawn: 'shell', r: 0.4, dir: 'in', speed: [1.5, 2.5], size: [0.06, 0.1], sizeEnd: 0.01, life: 0.2, color: [PULL, 'lach'] }),
  ] },
  'shell.slingshot.land': { layers: [
    L({ type: 'sprites', rate: 4, dur: Infinity, shape: 'swirl', offset: [0, 1, 0], size: [1.8, 2.2], sizeEnd: 0.6, life: 0.5, spin: [6, 8], color: PULL, alpha: 0.6 }),
    L({ type: 'sprites', pool: 'alpha', rate: 30, dur: Infinity, shape: 'puff', spawn: 'disc', r: 5, dir: 'swirl', lift: 0.3, speed: [2, 4], size: [0.25, 0.4], sizeEnd: 0.1, life: [0.6, 1], color: 0xd9b89a, alpha: 0.45 }),
    L({ type: 'sprites', rate: 24, dur: Infinity, shape: 'glint', spawn: 'shell', r: 3, offset: [0, 1, 0], dir: 'in', speed: [3, 5], size: [0.12, 0.2], sizeEnd: 0, life: 0.5, color: ['lach', 'white'], twinkle: 14 }),
    L({ type: 'sprites', at: 1.5, count: 24, shape: 'streak', offset: [0, 1, 0], dir: 'sphere', speed: [10, 16], size: [0.2, 0.32], sizeEnd: 0.04, life: 0.3, drag: 3, stretch: 2, color: ['white', PULL], powerCount: false }),
    L({ type: 'sprites', at: 1.5, count: 1, shape: 'ring', offset: [0, 1, 0], size: 0.5, sizeEnd: 4, life: 0.3, color: PULL, powerCount: false }),
  ] },
  // 44 Portal: crude splashed where each end opens (the ovals and their views are S5's)
  'shell.portal.fire': { layers: [
    L({ type: 'sprites', count: 12, shape: 'drip', dir: 'cone', axis: 'normal', cone: 70, speed: [2, 4], size: [0.1, 0.16], life: [0.5, 0.8], gravity: 10, color: ['film0', 'film1', 'film2', 'film3'], floor: 'ground', powerCount: false }),
    L({ type: 'sprites', count: 6, shape: 'ripple', spawn: 'disc', r: 0.6, size: [0.4, 0.6], sizeEnd: 1.4, life: 0.6, color: ['film0', 'film2'], alpha: 0.6, powerCount: false }),
  ] },
  // 45 Upfall: dust and drops falling up a faint pillar of inverted rain
  'shell.upfall.land': { layers: [
    L({ type: 'sprites', count: 1, shape: 'ringthin', size: 0.3, sizeEnd: 12, life: 0.45, color: PULL, rot: 0, powerCount: false }),
    L({ type: 'sprites', rate: 50, dur: Infinity, shape: 'streak', spawn: 'disc', r: 'r', dir: 'up', speed: [5, 8], size: 0.18, sizeEnd: 0.1, stretch: 2.4, life: [0.6, 1.2], color: [0xc8d8f0, PULL], alpha: 0.55 }),
    L({ type: 'sprites', pool: 'alpha', rate: 14, dur: Infinity, shape: 'puff', spawn: 'disc', r: 'r', dir: 'up', speed: [1, 2], size: [0.2, 0.3], sizeEnd: 0.5, life: [1.2, 1.8], drag: 0.4, color: 0xd9b89a, alpha: 0.4 }),
    L({ type: 'sprites', pool: 'alpha', rate: 10, dur: Infinity, shape: 'drip', spawn: 'disc', r: 'r', dir: 'up', speed: [2, 4], size: [0.06, 0.1], life: 1.2, gravity: -3, color: 0xbfe8ff, alpha: 0.85 }),
  ] },
  // 48 Moonlet: what it catches circling you like rings round a moon
  'shell.moonlet.fire': { layers: [
    L({ type: 'sprites', rate: 20, dur: Infinity, shape: 'soft', spawn: 'ring', r: 3, offset: [0, 1.4, 0], dir: 'swirl', lift: 0, speed: [3, 4], size: [0.06, 0.1], sizeEnd: 0.02, life: [0.6, 0.9], color: [0xd8d2c8, 'lach'] }),
  ] },
  // 49 Swap: a pale fold shutting where you were and where it struck
  'shell.swap.land': { layers: [
    L({ type: 'sprites', count: 1, shape: 'core', size: [1.6, 1.8], sizeEnd: 0.05, life: 0.35, color: 0xe8e4f4, alpha: 0.6, powerCount: false }),
    L({ type: 'sprites', count: 1, shape: 'ringthin', size: 1.8, sizeEnd: 0.1, life: 0.35, color: PULL, powerCount: false }),
    L({ type: 'sprites', count: 10, shape: 'sparkle', spawn: 'shell', r: 0.8, dir: 'in', speed: [2, 3], size: [0.14, 0.2], sizeEnd: 0, life: 0.35, color: ['white', PULL], twinkle: 18, powerCount: false }),
  ] },
  // 50 Shrinker: rings closing in on the body as it goes small
  'shell.shrinker.land': { layers: [
    L({ type: 'sprites', rate: 6, dur: Infinity, shape: 'ringthin', size: 2.2, sizeEnd: 0.2, life: 0.4, color: [PULL, 'white'], rot: 0 }),
    L({ type: 'sprites', count: 12, shape: 'sparkle', spawn: 'shell', r: 1, dir: 'in', speed: [2, 3], size: [0.14, 0.2], sizeEnd: 0, life: 0.4, color: ['white', PULL], twinkle: 18, powerCount: false }),
  ] },
};
