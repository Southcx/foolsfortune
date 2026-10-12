// ---------------------------------------------------------------------------------------
// WILL'S LOOKS (the caster shells TYPE-63, 65 and 69 still without one: docs/plans/CASTER-SHELLS.md section 3): Ego, Influence and
// Illusion, in the family's mauve. Rows for vfx/shelllooks.js, effects as data for vfx/library.js. The Double's hologram body and Mind
// Swap's thread between the heads are the runner's (its capsule; S3's bolt); these are the marks round them.
//
// Prior art: Ratchet & Clank's Decoy Glove (a flicker of scanlines as it appears) and the Brainwash mod (a halo over the turned one);
// Psychonauts' thought threads (a mind's line drawn to the head).
//
//   LOOKS (by shell id)   EFFECTS (`shell.<id>.<moment>`)
// ---------------------------------------------------------------------------------------
import { L } from './kit.js';

const WILL = 0xc890d8, HOLO = 0x8fd0ff;

export const LOOKS = {
  // 63 Double: where your hologram stands up, a blink of scanlines and hard light
  double: { onFire(g, row, { ray }) {
    const P = g.player; if (!P || !ray) return;
    const flat = ray.dir.clone().setY(0).normalize();
    g.vfx.play('shell.double.fire', { pos: P.pos.clone().addScaledVector(flat, 1.5) });
  } },
  // 65 Brainwash: a halo of gold over the turned one, while it fights for you
  brainwash: { body: 'bead', land: 'target', over: true, hold: () => 600, until: (c, h) => h.t > 0.5 && !c.fighting },
  mindSwap: { body: 'bead', land: 'target', over: true, hold: () => 1.5 },
};

export const EFFECTS = {
  'shell.double.fire': { layers: [
    L({ type: 'sprites', count: 14, shape: 'streak', spawn: 'column', r: 0.3, height: 1.8, dir: 'cone', axis: 'up', cone: 90, speed: [1, 3], size: [0.3, 0.45], sizeEnd: 0.05, life: 0.3, stretch: 3, color: [HOLO, 'white'], powerCount: false }),
    L({ type: 'sprites', count: 8, shape: 'hex', spawn: 'column', r: 0.4, height: 1.8, size: [0.18, 0.28], sizeEnd: 0, life: 0.5, color: HOLO, alpha: 0.8, powerCount: false }),
    L({ type: 'sprites', count: 1, shape: 'ringthin', offset: [0, 0.05, 0], size: 0.3, sizeEnd: 1.8, life: 0.4, color: HOLO, rot: 0, powerCount: false }),
  ] },
  'shell.brainwash.land': { layers: [
    L({ type: 'sprites', count: 1, shape: 'star4', size: 0.8, sizeEnd: 0.1, life: 0.2, color: 'gold', powerCount: false }),
    L({ type: 'sprites', rate: 3, dur: Infinity, shape: 'ring', size: [0.5, 0.55], sizeEnd: 0.55, life: 0.5, color: 'gold', alpha: 0.85, rot: 0 }),
    L({ type: 'sprites', rate: 6, dur: Infinity, shape: 'glint', spawn: 'ring', r: 0.3, size: [0.1, 0.16], sizeEnd: 0, life: 0.4, color: ['gold', 'white'], twinkle: 14 }),
  ] },
  // 69 Mind Swap: a thread of light marked over the head it struck (the trade between two heads is S3's bolt)
  'shell.mindSwap.land': { layers: [
    L({ type: 'sprites', count: 1, shape: 'swirl', size: 0.9, sizeEnd: 0.3, life: 0.5, spin: [8, 10], color: 0x9fe8ff, powerCount: false }),
    L({ type: 'sprites', rate: 14, dur: Infinity, shape: 'sparkle', spawn: 'shell', r: 0.35, dir: 'swirl', lift: 0.2, speed: [1, 1.6], size: [0.1, 0.16], sizeEnd: 0, life: 0.5, color: [0x9fe8ff, WILL], twinkle: 14 }),
  ] },
};
