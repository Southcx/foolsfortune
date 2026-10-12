// ---------------------------------------------------------------------------------------
// THE CASTER'S OWN LOOKS (the caster shells TYPE-91 to 99, tier IV: docs/plans/CASTER-SHELLS.md section 3). Rows for vfx/shelllooks.js,
// effects as data for vfx/library.js. The loudest are already the runner's, played where they happen: Inside Out's black hole (S6,
// shell.insideOut), Corrupt's broken body (S10, shell.corrupt), Thirteen's two bolts and the glitch, Zodiac's beams and Leyline's line
// to the stars (S3), the god hand's slam (shell.mallet.land). These are the rest: the rounds, the night over Zodiac, the RYNO's
// spiralling smoke, Leyline's pillar of stars, Thirteen's white, the god hand's hole in the sky, and the Fool's wheel of odds.
//
// Prior art: Ratchet & Clank's RYNO (the Itano circus of its volley: vfx/itano.js), Visibomb Gun and Zodiac; Outlaw Star's Caster
// shells #4, #9, #13; .hack's data drain; the god hand of this game's own siege; the Lockheart's wheel of odds (The Fool).
//
//   LOOKS (by shell id)   EFFECTS (`shell.<id>.<moment>`)
// ---------------------------------------------------------------------------------------
import { L } from './kit.js';

const STAR = 0xfff4d6;

export const LOOKS = {
  zodiac: { fire: 'courier', hold: (row) => 1.4 + row.n.count * 0.15 },
  ryno: { fire: true, kinds: { rocket: { body: 'rocket', fly: 'shell.ryno.fly' } } },
  visibomb: { kinds: { visi: { body: 'visi', fly: 'shell.visibomb.fly' } } },
  insideOut: { body: 'void', fly: 'shell.slingshot.fly', land: false },
  leyline: { body: 'void', fly: 'shell.slingshot.fly', land: 'target', hold: (row) => row.n.dur },
  thirteen: { fire: true },
  corrupt: { body: 'glitch', fly: true, land: false },
  godHand: { body: 'bead', land: 'point' },
  theFool: { fire: true },
};

export const EFFECTS = {
  // 91 Zodiac: night over the fight, stars pricking out across it as the beams fall
  'shell.zodiac.fire': { layers: [
    L({ type: 'sprites', pool: 'alpha', rate: 6, dur: Infinity, shape: 'puff', spawn: 'disc', r: 10, offset: [0, 11, 0], size: [4, 5], sizeEnd: 6, life: [1.5, 2], color: [0x0a0818, 0x140c1e], alpha: 0.5 }),
    L({ type: 'sprites', rate: 40, dur: Infinity, shape: 'sparkle', spawn: 'disc', r: 12, offset: [0, 10, 0], size: [0.2, 0.4], sizeEnd: 0, life: [0.8, 1.4], color: [STAR, 'white', 0xbfd8ff], twinkle: 6 }),
  ] },
  // 92 RYNO: the volley out of the muzzle in a burst of smoke; each rocket a spiralling smoke tail and an ember
  'shell.ryno.fire': { layers: [
    L({ type: 'sprites', pool: 'alpha', count: 16, shape: 'puff', dir: 'cone', cone: 70, speed: [2, 5], size: [0.4, 0.6], sizeEnd: 1.2, life: [0.8, 1.2], drag: 3, color: [0xd8d0c4, 0xa89c8c], alpha: 0.6, powerCount: false }),
    L({ type: 'sprites', count: 1, shape: 'core', size: 1.2, sizeEnd: 0.2, life: 0.15, color: 0xffd08a, powerCount: false }),
    L({ type: 'shake', k: 0.3 }),
  ] },
  'shell.ryno.fly': { layers: [
    L({ type: 'sprites', pool: 'alpha', rate: 26, dur: Infinity, shape: 'puff', size: [0.14, 0.2], sizeEnd: 0.5, life: [0.6, 0.9], drag: 1.5, color: [0xd8d0c4, 0xb8ac9c], alpha: 0.5, spin: [-2, 2] }),
    L({ type: 'sprites', rate: 30, dur: Infinity, shape: 'soft', size: 0.14, sizeEnd: 0.02, life: 0.12, color: 0xffd08a, colorEnd: 'ember' }),
  ] },
  // 93 Visibomb: a chrome-cyan eye in flight, a trail of hard-light cells
  'shell.visibomb.fly': { layers: [
    L({ type: 'sprites', rate: 20, dur: Infinity, shape: 'hex', size: [0.12, 0.18], sizeEnd: 0.02, life: 0.4, color: [0x9fe8ff, 'white'], alpha: 0.8 }),
    L({ type: 'sprites', rate: 30, dur: Infinity, shape: 'soft', size: 0.2, sizeEnd: 0.03, life: 0.2, color: 0x9fe8ff }),
  ] },
  // 95 Leyline: a pillar of stars from where it struck to the sky while the creature is up there
  'shell.leyline.land': { layers: [
    L({ type: 'sprites', rate: 60, dur: Infinity, shape: 'sparkle', spawn: 'column', r: [0, 0.5], height: 30, offset: [0, -0.5, 0], dir: 'up', speed: [1, 3], size: [0.15, 0.3], sizeEnd: 0, life: [0.6, 1.2], color: [STAR, 'white', 0xd8d0ff], twinkle: 8 }),
    L({ type: 'sprites', count: 1, shape: 'ring', size: 0.5, sizeEnd: 3, life: 0.4, color: 0xd8d0ff, rot: 0, powerCount: false }),
  ] },
  // 96 Thirteen: the screen goes white with it, green and gold at the muzzle
  'shell.thirteen.fire': { layers: [
    L({ type: 'flash', color: 0xffffff, k: 0.8, dur: 0.5 }),
    L({ type: 'sprites', count: 1, shape: 'core', size: 3, sizeEnd: 0.5, life: 0.4, color: 'white', colorEnd: 0x9cff8a, powerCount: false }),
    L({ type: 'sprites', count: 24, shape: 'streak', dir: 'cone', cone: 10, speed: [30, 50], size: [0.4, 0.6], sizeEnd: 0.05, life: 0.35, stretch: 2.5, color: [0x9cff8a, 0xffd860, 'white'], powerCount: false }),
    L({ type: 'shake', k: 0.8 }),
    L({ type: 'hitstop', dur: 0.08 }),
  ] },
  // 97 Corrupt: a round of broken cells, magenta and cyan
  'shell.corrupt.fly': { layers: [
    L({ type: 'sprites', rate: 30, dur: Infinity, shape: 'hex', spawn: 'shell', r: 0.12, size: [0.08, 0.14], sizeEnd: 0.02, life: 0.25, color: [0xff3cc8, 0x3cf0ff, 'white'] }),
  ] },
  // 98 God Hand: a dark hole torn in the sky over where it lands, the hand's reach falling out of it (the slam is the hand's own)
  'shell.godHand.land': { layers: [
    L({ type: 'sprites', count: 1, shape: 'ring', offset: [0, 8, 0], size: 2, sizeEnd: 4, life: 0.8, color: 'lach', alpha: 0.9, powerCount: false }),
    L({ type: 'sprites', pool: 'alpha', count: 10, shape: 'puff', spawn: 'disc', r: 1.2, offset: [0, 8, 0], size: [1.2, 1.6], sizeEnd: 2, life: 0.9, color: [0x140c1e, 0x2a1e3a], alpha: 0.7, powerCount: false }),
    L({ type: 'sprites', count: 16, shape: 'streak', spawn: 'disc', r: 1.2, offset: [0, 7.5, 0], dir: 'up', speed: [-14, -10], size: [0.4, 0.6], sizeEnd: 0.1, stretch: 3, life: 0.5, color: ['lach', 'white'], powerCount: false }),
  ] },
  // 99 The Fool: the wheel of odds spun at the muzzle, all seven colours round it
  'shell.theFool.fire': { layers: [
    L({ type: 'sprites', count: 1, shape: 'swirl', size: 1.2, sizeEnd: 0.4, life: 0.45, spin: [14, 16], color: 'gold', powerCount: false }),
    L({ type: 'sprites', count: 1, shape: 'ring', size: 0.4, sizeEnd: 1.4, life: 0.35, color: 'gold', powerCount: false }),
    L({ type: 'sprites', count: 14, shape: 'diamond', spawn: 'ring', r: 0.5, dir: 'swirl', lift: 0, speed: [3, 4], size: [0.14, 0.2], sizeEnd: 0, life: 0.45, color: [0xf2c84a, 0x5ec8e0, 0xff7a4a, 0x8fb0ff, 0x3f6a4a, 0x8a5ac8, 0xc80018], powerCount: false }),
  ] },
};
