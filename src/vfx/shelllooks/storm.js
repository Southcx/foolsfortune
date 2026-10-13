// ---------------------------------------------------------------------------------------
// STORM'S LOOKS (the caster shells TYPE-31 to 40 still without one: docs/plans/CASTER-SHELLS.md section 3): lightning and charge, white
// blue and violet. Rows for vfx/shelllooks.js, effects as data for vfx/library.js. Every bolt between two points is already the runner's
// (S3, `caster.lightning`, the chain's `zap`; the Faraday Cage's four posts; Twelve's pulse), so these are the rest: the rounds, the
// node's live tip, the cloud's own rain, the charge's scorch, the magnet's ring.
//
// Prior art: Ratchet & Clank's Tesla Claw, Shock Cannon and Plasma Coil (a violet orb feeling for targets); Nikola Tesla's insulators
// (a stack of glazed discs); St Elmo's fire on a conductor; Outlaw Star's #12 (a gold shell).
//
//   LOOKS (by shell id)   EFFECTS (`shell.<id>.<moment>`)
// ---------------------------------------------------------------------------------------
import { L, aimAt, groundRing, scorch, debris } from './kit.js';

const BLUE = 0x9fd0ff, VIOLET = 0xc49bff;
const foeMax = (g, at, r) => (g.creatures?.near?.(at, r) || []).filter((c) => c.alive && !c.ally).reduce((a, b) => (!a || (b.emo ?? 0) > (a.emo ?? 0) ? b : a), null);

export const LOOKS = {
  teslaNode: { kinds: { lobPart: { body: 'insulator', end: 'shell.teslaNode.land', hold: (row) => row.n.dur } } },
  chainBolt: { body: 'spark', fly: true, land: 'point' },
  ballLightning: { kinds: { orb: { body: 'orb', fly: 'shell.ballLightning.fly' } } },
  // 34 Thunderhead: a storm three times the runner's cloud and its own rain, kept over the creature the cloud is after (the runner moves the
  // cloud on its strikes); where each bolt falls (the runner's, every `every` real s from the first frame), the ground's own look
  thunderhead: { onFire(g, row, { ray }) {
    const pos = aimAt(g, ray).at, t = row.n.dur, every = row.n.every ?? 1.5;
    pos.y += 7;
    let next = 0;
    g.vfx.play('shell.thunderhead.fire', { pos, follow: (h, raw) => {
      if (h.t > t) return false;
      const c = g.player && foeMax(g, g.player.pos, 20);
      if (c) { const k = Math.min(1, raw * 4); h.pos.x += (c.pos.x - h.pos.x) * k; h.pos.z += (c.pos.z - h.pos.z) * k; h.pos.y += (c.pos.y + 7 - h.pos.y) * k; }
      if (h.t >= next) { next += every; if (c) g.vfx.play('shell.thunderhead.strike', { pos: c.pos.clone(), floor: c.pos.y - 0.05 }); }
      return true;
    } });
  } },
  faradayCage: { land: 'point', hold: DURN },
  capacitor: { fire: 'aim', power: (g, row) => 0.6 + 1.4 * Math.min(1, (g.shells?.runner?.capCharge ?? 0) / row.n.charge) },
  lodestone: { fire: 'aim', lift: 0.6, hold: DURN },
  twelve: { body: 'twelve', fly: true, land: 'point' },
};
function DURN(row) { return row.n.dur; }

export const EFFECTS = {
  // 31 Tesla Node: a glazed insulator; its tip lit and fizzing while it lives
  'shell.teslaNode.land': { layers: [
    L({ type: 'sprites', count: 1, shape: 'ring', size: 0.3, sizeEnd: 1.4, life: 0.25, color: BLUE, rot: 0, powerCount: false }),
    L({ type: 'sprites', rate: 6, dur: Infinity, shape: 'core', offset: [0, 0.55, 0], size: [0.25, 0.35], sizeEnd: 0.1, life: 0.2, color: 'white', colorEnd: BLUE }),
    L({ type: 'sprites', rate: 14, dur: Infinity, shape: 'streak', spawn: 'shell', r: 0.15, offset: [0, 0.55, 0], dir: 'out', speed: [1, 2.5], size: [0.08, 0.14], sizeEnd: 0.02, life: 0.12, stretch: 1.6, color: [BLUE, 'white'] }),
  ] },
  // 32 Chain Bolt: a white-blue spark crackling in flight, a star where it first bites (the jumps are S3's)
  'shell.chainBolt.fly': { layers: [
    L({ type: 'sprites', rate: 40, dur: Infinity, shape: 'streak', spawn: 'shell', r: 0.12, dir: 'out', speed: [1, 3], size: [0.1, 0.16], sizeEnd: 0.02, life: 0.08, stretch: 1.8, color: [BLUE, 'white'] }),
    L({ type: 'sprites', rate: 30, dur: Infinity, shape: 'soft', size: 0.14, sizeEnd: 0.02, life: 0.12, color: BLUE }),
  ] },
  'shell.chainBolt.land': { layers: [
    L({ type: 'sprites', count: 1, shape: 'star4', size: 1.1, sizeEnd: 0.1, life: 0.16, color: 'white', colorEnd: BLUE, powerCount: false }),
    L({ type: 'light', color: BLUE, k: 20, range: 6, dur: 0.25 }),
  ] },
  // 33 Ball Lightning: a violet orb, its tendrils feeling about it
  'shell.ballLightning.fly': { layers: [
    L({ type: 'sprites', rate: 30, dur: Infinity, shape: 'streak', spawn: 'shell', r: 0.3, dir: 'out', speed: [2, 4], size: [0.16, 0.26], sizeEnd: 0.02, life: [0.08, 0.14], stretch: 2, color: [VIOLET, 'white'] }),
    L({ type: 'sprites', rate: 12, dur: Infinity, shape: 'core', size: [0.6, 0.8], sizeEnd: 0.4, life: 0.2, color: VIOLET, alpha: 0.6 }),
  ] },
  // 34 Thunderhead: a low black cloud's own rain under it
  'shell.thunderhead.fire': { layers: [
    L({ type: 'sprites', pool: 'alpha', rate: 16, dur: Infinity, shape: 'puff', spawn: 'disc', r: 5, size: [3, 4.5], sizeEnd: 5.5, life: [1.4, 2], color: [0x1e1a24, 0x2a2630, 0x3a3644], alpha: 0.6, spin: [-0.3, 0.3] }),
    L({ type: 'sprites', pool: 'alpha', rate: 8, dur: Infinity, shape: 'puff', spawn: 'disc', r: 3.5, offset: [0, 1.2, 0], size: [3.5, 5], sizeEnd: 6, life: [1.6, 2.2], color: [0x2a2630, 0x4a4656], alpha: 0.5, spin: [-0.3, 0.3] }),
    L({ type: 'sprites', rate: 150, dur: Infinity, shape: 'streak', spawn: 'disc', r: 5, offset: [0, -0.8, 0], dir: 'up', speed: [-13, -10], size: 0.26, sizeEnd: 0.18, stretch: 2.6, life: 0.6, color: 0x9fb4d0, alpha: 0.6 }),
    L({ type: 'sprites', rate: 10, dur: Infinity, shape: 'glint', spawn: 'disc', r: 4, size: [0.5, 0.8], sizeEnd: 0, life: 0.2, color: [BLUE, 'white'], twinkle: 20 }),
  ] },
  // where a bolt falls: a white star, a blue ring out along the ground, the sand fused black and fizzing a while
  'shell.thunderhead.strike': { layers: [
    L({ type: 'sprites', count: 1, shape: 'core', size: 5, sizeEnd: 0.5, life: 0.22, color: 'white', colorEnd: BLUE, powerCount: false }),
    groundRing({ to: 14, from: 0.8, dur: 0.5, tint: BLUE, k: 1.6 }),
    scorch({ size: 3.4, dur: 6 }),
    L({ type: 'sprites', count: 24, shape: 'streak', dir: 'cone', axis: 'up', cone: 70, speed: [8, 16], drag: 2, size: [0.3, 0.5], sizeEnd: 0.04, life: [0.25, 0.45], stretch: 2, color: [BLUE, 'white'], powerCount: false }),
    debris({ count: 16, speed: [4, 9], size: [0.12, 0.26], life: [3.5, 5], color: [0x1e1a24, 0x3a3644, 0xd9b89a] }),
    L({ type: 'sprites', rate: 14, dur: 3, shape: 'glint', spawn: 'disc', r: 1.4, size: [0.2, 0.34], sizeEnd: 0, life: 0.25, color: [BLUE, 'white'], twinkle: 24 }),
  ] },
  // 36 Faraday Cage: its edges humming, sparks running up the corners (the arcs are S3's)
  'shell.faradayCage.land': { layers: [
    L({ type: 'sprites', rate: 30, dur: Infinity, shape: 'glint', spawn: 'column', r: 2.1, height: 3, size: [0.14, 0.24], sizeEnd: 0, life: 0.2, color: [BLUE, 'white'], twinkle: 30 }),
  ] },
  // 37 Capacitor: where the pillar falls, a white scorch ring and the charge thrown up (bigger, the longer it charged: `power`)
  'shell.capacitor.fire': { layers: [
    L({ type: 'sprites', count: 1, shape: 'core', size: 1.6, sizeEnd: 0.2, life: 0.25, color: 'white' }),
    L({ type: 'sprites', count: 1, shape: 'ring', size: 0.4, sizeEnd: 3, life: 0.35, color: BLUE, rot: 0 }),
    L({ type: 'sprites', count: 16, shape: 'streak', dir: 'cone', axis: 'up', cone: 30, speed: [6, 12], size: [0.2, 0.3], sizeEnd: 0.03, life: 0.3, drag: 3, stretch: 2, color: ['white', BLUE] }),
    L({ type: 'flash', color: 0xe8f4ff, k: 0.2, dur: 0.15 }),
  ] },
  // 39 Lodestone: the floating iron star rung by slow rings, iron glints drawn in to it
  'shell.lodestone.fire': { layers: [
    L({ type: 'sprites', rate: 1.2, dur: Infinity, shape: 'ringthin', size: 1.6, sizeEnd: 0.4, life: 0.8, color: 0xd0d6e0, alpha: 0.8, rot: 0 }),
    L({ type: 'sprites', rate: 6, dur: Infinity, shape: 'glint', spawn: 'shell', r: 0.9, dir: 'in', speed: [0.6, 1.1], size: [0.1, 0.16], sizeEnd: 0, life: 0.8, color: [0xd0d6e0, 'gold'], twinkle: 10 }),
  ] },
  // 40 Twelve: a gold shell with a blue band; a blue wave out to its reach where it bursts (the sleep's pulse is the runner's)
  'shell.twelve.fly': { layers: [
    L({ type: 'sprites', rate: 30, dur: Infinity, shape: 'soft', size: [0.12, 0.16], sizeEnd: 0.02, life: 0.18, color: ['gold', BLUE] }),
  ] },
  'shell.twelve.land': { layers: [
    L({ type: 'mesh', mesh: 'chest_shock', dur: 0.8, scale: [[0, 0.4], [1, 6.5]], stretch: [1, [[0, 0.8], [1, 0.12]], 1], k: [[0, 1.4], [1, 0]], tint: BLUE, labradorite: 0.2 }),
    L({ type: 'sprites', count: 20, shape: 'sparkle', spawn: 'ring', r: 1, dir: 'out', lift: 0.1, speed: [5, 7], size: [0.2, 0.3], sizeEnd: 0, life: 0.6, drag: 1.5, color: [BLUE, 'white'], twinkle: 16, powerCount: false }),
  ] },
};
