// ---------------------------------------------------------------------------------------
// THE WAVE POOL'S EFFECTS: the library's entries (vfx/library.js spreads them in) for the wave pool's look (vfx/waves/spray.js plays
// them) on the shared particle pools. Data only: the numbers are the look. Spray is drawn as two-tone opaque blobs that shrink out
// (Breath of the Wild's and Sonic Riders' water: a white body and a pale teal shade, alpha held whole, the size taken away), on the
// alpha pool so it never glares; a mist puff beside them where the water turns to air.
//   wave.lip.spray     a stretch of the pitching lip throwing its sheet (`from` .. `to` its edge, `dir` its throw: forward and up)
//   wave.foamball      held at the tube's end: the foam ball's churn, blobs tumbling up and over and mist rolling off (h.k its size)
//   wave.rail.spray    held off the board's rail on the face (h.k the speed and the slip; `dir` out of the turn and back)
//   wave.spit          the barrel's spit: a cone burst out of its mouth along the crest (`dir`), blobs, mist and a ring of light
//   wave.skid.sand     the slope ride's edge let go (`skiff.edge.skid`): sand thrown off the edge in a fan (`power` the skid)
//
// Prior art: Breath of the Wild's and Wind Waker's water splashes (flat-shaded blobs, no alpha ramp), Sonic Riders' and Wave Race 64's
// rooster tails off a hull, a real barrel's spit (the air in the tube blown out of its mouth as the lip closes behind), the house's own
// spray (vfx/racewayeffects.js `skiff.water.spray`) and sand (`raceway.pit.slide`).
// ---------------------------------------------------------------------------------------
const WHITE = [0xf4fbf8, 0xe6f4f2], SHADE = [0xa8d6d4, 0x8cc4c8], MIST = 0xeef8f6;
const SAND = [0xc98a52, 0xb8834e, 0xf0c890], DUST = 0xe6c49a;
/** A blob: opaque, two-tone, shrinking out (the house's alpha pool, alpha held). */
const blob = (o) => ({ type: 'sprites', pool: 'alpha', shape: 'disc', alpha: 1, alphaEnd: 0.95, sizeEnd: 0.02, drag: 0.6, ...o });

export const WAVE_EFFECTS = {
  'wave.lip.spray': { layers: [
    blob({ count: [6, 9], spawn: 'line', r: 0.3, dir: 'cone', cone: 26, speed: [3, 7], size: [0.22, 0.42], life: [0.5, 0.9], gravity: 7, color: WHITE, colorEnd: SHADE[0], inherit: 0.4 }),
    blob({ count: [3, 5], spawn: 'line', r: 0.4, dir: 'cone', cone: 34, speed: [2, 5], size: [0.3, 0.55], life: [0.45, 0.75], gravity: 6, color: SHADE }),
    { type: 'sprites', pool: 'alpha', count: [1, 2], shape: 'puff', spawn: 'line', r: 0.6, dir: 'cone', cone: 30, speed: [1, 2.5], size: [1, 1.6], sizeEnd: 3.4, life: [0.7, 1.1], drag: 1.6, color: MIST, alpha: 0.32, spin: [-1, 1] },
  ] },
  'wave.foamball': { layers: [ // (h.k: the foam ball's size, its rate)
    blob({ rate: 36, dur: Infinity, spawn: 'sphere', r: 1.8, dir: 'cone', cone: 55, speed: [2, 5], size: [0.4, 0.8], life: [0.5, 0.9], gravity: 6, color: WHITE, colorEnd: SHADE[1] }),
    blob({ rate: 16, dur: Infinity, spawn: 'sphere', r: 2.2, dir: 'sphere', speed: [1, 3], size: [0.5, 0.9], life: [0.4, 0.7], gravity: 3, color: SHADE }),
    { type: 'sprites', pool: 'alpha', rate: 7, dur: Infinity, shape: 'puff', spawn: 'sphere', r: 2.4, dir: 'up', speed: [0.8, 2], size: [1.6, 2.4], sizeEnd: 5, life: [1, 1.6], drag: 1.2, color: MIST, alpha: 0.3, spin: [-0.8, 0.8] },
  ] },
  'wave.rail.spray': { layers: [ // (h.k: speed and slip, the rate follows it)
    blob({ rate: 70, dur: Infinity, dir: 'cone', cone: 22, speed: [3, 8], size: [0.12, 0.26], life: [0.35, 0.65], gravity: 9, color: WHITE, colorEnd: SHADE[0], inherit: 0.3 }),
    blob({ rate: 26, dur: Infinity, dir: 'cone', cone: 30, speed: [2, 5], size: [0.18, 0.32], life: [0.3, 0.5], gravity: 8, color: SHADE, inherit: 0.3 }),
    { type: 'sprites', pool: 'alpha', rate: 10, dur: Infinity, shape: 'puff', dir: 'cone', cone: 30, speed: [1, 2.5], size: [0.5, 0.8], sizeEnd: 2, life: [0.5, 0.8], drag: 2.2, color: MIST, alpha: 0.26, spin: [-1, 1], inherit: 0.3 },
  ] },
  'wave.spit': { layers: [
    blob({ count: [70, 90], spawn: 'sphere', r: 1.2, dir: 'cone', cone: 24, speed: [9, 20], size: [0.25, 0.55], life: [0.55, 1.0], gravity: 5, drag: 0.9, color: WHITE, colorEnd: SHADE[0] }),
    blob({ count: [30, 40], spawn: 'sphere', r: 1.4, dir: 'cone', cone: 32, speed: [6, 14], size: [0.3, 0.6], life: [0.45, 0.8], gravity: 5, drag: 1, color: SHADE }),
    { type: 'sprites', pool: 'alpha', count: [10, 14], shape: 'puff', spawn: 'sphere', r: 1.6, dir: 'cone', cone: 28, speed: [5, 11], size: [1.4, 2.2], sizeEnd: 5.5, life: [0.8, 1.3], drag: 2.2, color: MIST, alpha: 0.42, spin: [-1, 1] },
    { type: 'sprites', count: 1, shape: 'ring', size: 1.4, sizeEnd: 7, life: 0.35, color: 0xdff8ef, alpha: 0.5, alphaEnd: 0, powerCount: false },
  ] },
  'wave.skid.sand': { layers: [
    { type: 'sprites', pool: 'alpha', count: [10, 16], shape: 'chip', spawn: 'disc', r: 0.5, dir: 'cone', cone: 30, speed: [3, 7], size: [0.08, 0.16], sizeEnd: 0.04, life: [0.5, 0.9], gravity: 9, drag: 0.7, color: SAND, alpha: 1, alphaEnd: 0.7, spin: [-6, 6], inherit: 0.4 },
    blob({ count: [4, 7], spawn: 'disc', r: 0.6, dir: 'cone', cone: 40, speed: [2, 4], size: [0.22, 0.38], life: [0.4, 0.6], gravity: 6, color: SAND, inherit: 0.3 }),
    { type: 'sprites', pool: 'alpha', count: [2, 3], shape: 'puff', spawn: 'disc', r: 0.7, dir: 'cone', cone: 40, speed: [1, 2.5], size: [0.8, 1.2], sizeEnd: 2.8, life: [0.7, 1.1], drag: 1.8, color: DUST, alpha: 0.4, spin: [-1, 1], inherit: 0.2 },
  ] },
};
