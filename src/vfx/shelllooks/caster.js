// ---------------------------------------------------------------------------------------
// THE CASTER'S OWN LOOKS (the caster shells TYPE-91 to 99, tier IV: docs/plans/CASTER-SHELLS.md section 3). Rows for vfx/shelllooks.js,
// effects as data for vfx/library.js. The loudest are already the runner's, played where they happen: Inside Out's black hole (S6,
// shell.insideOut), Corrupt's broken body (S10, shell.corrupt), Thirteen's two bolts and the glitch, Zodiac's beams and Leyline's line
// to the stars (S3), the god hand's slam (shell.mallet.land). These are the rest: the rounds, the night over Zodiac, the RYNO's
// spiralling smoke, Leyline's pillar of stars, Thirteen's white, the god hand's hole in the sky, and the Fool's wheel of odds.
//
// Prior art: Ratchet & Clank's RYNO (the Itano circus of its volley: vfx/itano.js), Visibomb Gun and Zodiac, and its rule for the
// ludicrous pass (the owner, 2026-10-13): the weapon should look too big for the screen; Outlaw Star's Caster
// shells #4, #9, #13; .hack's data drain; the god hand of this game's own siege; the Lockheart's wheel of odds (The Fool).
//
//   LOOKS (by shell id)   EFFECTS (`shell.<id>.<moment>`)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { L, aimAt, groundRing, scorch, debris } from './kit.js';

const STAR = 0xfff4d6, GREEN = 0x9cff8a, GILT = 0xffd860;
const _n = new THREE.Vector3();
/** Zodiac's marks: the creatures on the screen, nearest its middle first, as the runner chooses them (tools/psygun/shellkit.js
 *  foesInView, without its line of sight: a look may fall on one behind a wall; the runner's beam will not). */
function onScreen(g, max, range = 60) {
  const cam = g.camera, P = g.player; if (!cam || !P) return [];
  const out = [];
  for (const c of g.creatures?.near?.(P.pos, range) || []) {
    if (!c.alive || c.ally) continue;
    _n.set(c.pos.x, c.pos.y + (c.height || 1) * 0.5, c.pos.z).project(cam);
    if (_n.z > 1 || Math.abs(_n.x) > 0.95 || Math.abs(_n.y) > 0.95) continue;
    out.push([Math.hypot(_n.x, _n.y), c]);
  }
  return out.sort((a, b) => a[0] - b[0]).slice(0, max).map((x) => x[1]);
}

export const LOOKS = {
  // 91 Zodiac: night over the whole fight and the twelve signs wheeling in it; where each beam falls (the runner's: half a real second, then
  // one every 0.15), a star bursts on the ground, a ring runs out from it and stardust lies there a while
  zodiac: { onFire(g, row) {
    const P = g.player; if (!P) return;
    const t = 1.4 + row.n.count * 0.15, marks = onScreen(g, row.n.count).map((c, i) => ({ c, at: 0.5 + i * 0.15 }));
    g.vfx.play('shell.zodiac.fire', { pos: P.pos, follow: (h) => {
      if (h.t > t) return false;
      h.pos.copy(P.pos);
      for (const m of marks) if (!m.done && h.t >= m.at) { m.done = true; g.vfx.play('shell.zodiac.strike', { pos: m.c.pos.clone(), floor: m.c.pos.y - 0.05 }); } // (where it stood: the beam may have felled it the frame before)
      return true;
    } });
  } },
  // 92 RYNO: rockets two and a half times the size, each its own blast ring and scorch where it lands
  ryno: { fire: true, kinds: { rocket: { body: 'rocket', fly: 'shell.ryno.fly', end: 'shell.ryno.end', ground: true, size: () => 2.5, scale: () => 2.5 } } },
  visibomb: { kinds: { visi: { body: 'visi', fly: 'shell.visibomb.fly' } } },
  // 94 Inside Out: a hole two and a half times the size in flight; where it lands the ground's own look (the hole is the runner's: shell.insideOut)
  insideOut: { body: 'void', size: () => 2.5, scale: () => 2.5, fly: 'shell.slingshot.fly', land: false, onLand(g, row, { at }) { if (at) g.vfx.play('shell.insideOut.land', { pos: at, floor: at.y - 0.05 }); } },
  leyline: { body: 'void', fly: 'shell.slingshot.fly', land: 'target', hold: (row) => row.n.dur },
  // 96 Thirteen: a bolt the size of a house, drawn the whole way to where it ends; there, the ground torn up and burnt
  thirteen: { onFire(g, row, { muzzle, ray }) {
    g.vfx.play('shell.thirteen.fire', { pos: muzzle, dir: ray?.dir });
    if (!ray || !muzzle) return;
    const { at, normal, hit } = aimAt(g, ray, 200);
    g.vfx.play('shell.thirteen.beam', { pos: muzzle, from: muzzle.clone(), to: at.clone() });
    if (hit) g.vfx.play('shell.thirteen.land', { pos: at, normal, dir: normal, floor: at.y - 0.05 });
  } },
  corrupt: { body: 'glitch', fly: true, land: false },
  godHand: { body: 'bead', land: 'point' },
  theFool: { fire: true },
};

export const EFFECTS = {
  // 91 Zodiac: night over the whole fight, stars pricking out across it, the twelve signs wheeling overhead
  'shell.zodiac.fire': { layers: [
    L({ type: 'sprites', pool: 'alpha', rate: 9, dur: Infinity, shape: 'puff', spawn: 'disc', r: 28, offset: [0, 16, 0], size: [10, 14], sizeEnd: 16, life: [1.6, 2.2], color: [0x0a0818, 0x140c1e], alpha: 0.55 }),
    L({ type: 'sprites', rate: 90, dur: Infinity, shape: 'sparkle', spawn: 'disc', r: 34, offset: [0, 15, 0], size: [0.5, 1], sizeEnd: 0, life: [0.8, 1.4], color: [STAR, 'white', 0xbfd8ff], twinkle: 6 }),
    L({ type: 'sprites', rate: 24, dur: Infinity, shape: 'star4', spawn: 'ring', r: 14, offset: [0, 14, 0], dir: 'swirl', lift: 0, speed: [3, 3.5], size: [1, 1.4], sizeEnd: 0.4, life: [1.2, 1.5], color: ['gold', STAR], twinkle: 4 }),
  ] },
  'shell.zodiac.strike': { layers: [
    L({ type: 'sprites', count: 1, shape: 'star4', size: 9, sizeEnd: 1, life: 0.3, color: 'white', colorEnd: STAR, powerCount: false }),
    L({ type: 'sprites', count: 1, shape: 'core', size: 5, sizeEnd: 0.5, life: 0.35, color: STAR, powerCount: false }),
    groundRing({ to: 16, from: 1, dur: 0.6, tint: STAR, k: 1.4 }),
    scorch({ size: 3.6, dur: 5, tint: 0x9aa0b4 }),
    L({ type: 'sprites', count: 24, shape: 'sparkle', dir: 'cone', axis: 'up', cone: 70, speed: [6, 14], drag: 1.5, gravity: 6, size: [0.4, 0.7], sizeEnd: 0, life: [0.6, 1], color: [STAR, 'white', 0xbfd8ff], twinkle: 10, powerCount: false }),
    debris({ pool: 'add', shape: 'sparkle', count: 18, speed: [2, 6], size: [0.25, 0.4], life: [3, 4.5], color: [STAR, 0xbfd8ff, 'gold'] }),
    L({ type: 'light', color: STAR, k: 50, range: 14, dur: 0.5 }),
  ] },
  // 92 RYNO: the volley out of the muzzle in a wall of smoke; each rocket a spiralling smoke tail and an ember; a blast ring and scorch each
  'shell.ryno.fire': { layers: [
    L({ type: 'sprites', pool: 'alpha', count: 30, shape: 'puff', dir: 'cone', cone: 75, speed: [3, 7], size: [1.2, 1.8], sizeEnd: 3.4, life: [1, 1.5], drag: 2.6, color: [0xd8d0c4, 0xa89c8c], alpha: 0.6, powerCount: false }),
    L({ type: 'sprites', count: 1, shape: 'core', size: 3.5, sizeEnd: 0.4, life: 0.18, color: 0xffd08a, powerCount: false }),
    L({ type: 'shake', k: 0.3 }),
  ] },
  'shell.ryno.fly': { layers: [
    L({ type: 'sprites', pool: 'alpha', rate: 26, dur: Infinity, shape: 'puff', size: [0.14, 0.2], sizeEnd: 0.5, life: [0.6, 0.9], drag: 1.5, color: [0xd8d0c4, 0xb8ac9c], alpha: 0.5, spin: [-2, 2] }),
    L({ type: 'sprites', rate: 30, dur: Infinity, shape: 'soft', size: 0.14, sizeEnd: 0.02, life: 0.12, color: 0xffd08a, colorEnd: 'ember' }),
  ] },
  'shell.ryno.end': { layers: [ // (written at size 1, played at 2.5: shelllooks/caster.js's row)
    L({ type: 'sprites', count: 1, shape: 'core', size: 1.6, sizeEnd: 0.2, life: 0.22, color: 'white', colorEnd: 'ember', powerCount: false }),
    L({ type: 'sprites', count: 8, shape: 'soft', spawn: 'sphere', r: 0.3, dir: 'sphere', speed: [1, 3], drag: 2, size: [0.5, 0.8], sizeEnd: 0.1, life: [0.3, 0.5], color: 0xffd08a, colorEnd: [0xff7a2a, 0xc8401a], powerCount: false }),
    groundRing({ to: 4.4, from: 0.3, dur: 0.4, tint: 'ember', y: 0.02 }),
    scorch({ size: 1.3, dur: 5, y: 0.016 }),
    L({ type: 'sprites', pool: 'alpha', count: 4, shape: 'puff', dir: 'up', speed: [1, 2], drag: 1, size: [0.4, 0.6], sizeEnd: 1.2, life: [1.2, 1.8], color: [0x3a302a, 0x5b4c40], alpha: 0.5, powerCount: false }),
    debris({ count: 7, speed: [3, 7], size: [0.06, 0.12], life: [3, 4.5], color: [0x2a1e18, 0x8c4a33, 0xd9b89a] }),
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
  // 96 Thirteen: the screen goes white with it, green and gold at the muzzle; a bolt as wide as a house the whole way out; where it ends,
  // the ground torn up, burnt and glinting
  'shell.thirteen.fire': { layers: [
    L({ type: 'flash', color: 0xffffff, k: 0.8, dur: 0.5 }),
    L({ type: 'sprites', count: 1, shape: 'core', size: 9, sizeEnd: 1, life: 0.45, color: 'white', colorEnd: GREEN, powerCount: false }),
    L({ type: 'sprites', count: 1, shape: 'star4', size: 14, sizeEnd: 2, life: 0.3, color: 'white', powerCount: false }),
    L({ type: 'sprites', count: 40, shape: 'streak', dir: 'cone', cone: 12, speed: [40, 70], size: [1, 1.6], sizeEnd: 0.1, life: 0.4, stretch: 2.5, color: [GREEN, GILT, 'white'], powerCount: false }),
    L({ type: 'shake', k: 0.8 }),
    L({ type: 'hitstop', dur: 0.08 }),
  ] },
  'shell.thirteen.beam': { layers: [ // (ctx from, to: the muzzle and where it ends)
    L({ type: 'sprites', count: 240, shape: 'soft', spawn: 'line', r: 2.4, size: [1.6, 3], sizeEnd: 0, life: [0.4, 0.8], color: [GREEN, GILT, 'white'], powerCount: false }),
    L({ type: 'sprites', count: 80, shape: 'streak', spawn: 'line', r: 1.2, dir: 'line', speed: [30, 60], size: [0.6, 1], sizeEnd: 0.1, life: [0.3, 0.5], stretch: 3, color: ['white', GREEN], powerCount: false }),
    L({ type: 'sprites', count: 60, shape: 'sparkle', spawn: 'line', r: 3.2, dir: 'sphere', speed: [2, 6], size: [0.4, 0.8], sizeEnd: 0, life: [0.6, 1.1], color: [GILT, 'white'], twinkle: 12, powerCount: false }),
  ] },
  'shell.thirteen.land': { layers: [
    L({ type: 'sprites', count: 1, shape: 'core', size: 10, sizeEnd: 1, life: 0.4, color: 'white', colorEnd: GREEN, powerCount: false }),
    groundRing({ to: 34, from: 2, dur: 0.8, tint: GREEN, k: 1.6 }),
    groundRing({ to: 20, from: 1, dur: 1, tint: GILT, at: 0.1, k: 1.1 }),
    scorch({ size: 9, dur: 9 }),
    L({ type: 'sprites', count: 50, shape: 'streak', dir: 'cone', axis: 'up', cone: 70, speed: [16, 30], drag: 1.2, gravity: 8, size: [0.5, 0.8], sizeEnd: 0.05, life: [0.6, 1], stretch: 2, color: [GREEN, GILT, 'white'], powerCount: false }),
    debris({ count: 50, speed: [8, 16], size: [0.25, 0.6], life: [5, 7], color: [0x2a1e18, 0x4a3226, 0x8c4a33] }),
    L({ type: 'sprites', pool: 'alpha', count: 18, shape: 'puff', spawn: 'disc', r: 2, dir: 'cone', axis: 'up', cone: 35, speed: [4, 9], drag: 1.2, size: [2, 3], sizeEnd: 6, life: [2, 3], color: [0x3a302a, 0x5b4c40], alpha: 0.55, powerCount: false }),
    L({ type: 'sprites', rate: 16, dur: 6, shape: 'glint', spawn: 'disc', r: 4, size: [0.3, 0.5], sizeEnd: 0, life: 0.45, color: [GREEN, GILT], twinkle: 10 }),
  ] },
  // 94 Inside Out, on the ground: a ring closing in on the hole, the ground's chips drawn up into it; then spat out, a ring running out
  // past the screen, the turned-out shards lying where they fell
  'shell.insideOut.land': { layers: [
    L({ type: 'decal', tex: 'shockring', dur: 2.6, scale: [[0, 22], [1, 1]], k: [[0, 0], [0.15, 1.3], [1, 0.8]], tint: 0x8a7aff, glow: 1.4, offset: [0, 0.07, 0] }),
    L({ type: 'sprites', pool: 'alpha', rate: 40, dur: 2.4, shape: 'chip', spawn: 'ring', r: 9, dir: 'in', speed: [6, 8], size: [0.15, 0.35], life: [1.1, 1.4], color: [0xb4603f, 0xd9b89a, 0x8c4a33], alpha: 1, alphaEnd: 0.6, spin: [-12, 12] }),
    groundRing({ to: 40, from: 2, dur: 0.9, tint: 'lach', at: 2.6, k: 1.8 }),
    scorch({ size: 6, dur: 8, tint: 0xb8c0a0, at: 2.6 }),
    debris({ at: 2.6, shape: 'shard', count: 50, speed: [8, 18], cone: 75, size: [0.3, 0.6], life: [5, 7], color: [0x140c1e, 0x2a1e3a, 'labradorite'] }),
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
