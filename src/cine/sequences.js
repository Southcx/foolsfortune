// ---------------------------------------------------------------------------------------
// THE SEQUENCES: every cinematic event's timeline, as data (cine/sequence.js plays them; the workbench's CINEMA tab shows, scrubs,
// edits and keys them). Points are `{ at: anchor, off: [right, up, forward] }` in metres, in the frame the sequence faces; times are
// real seconds from a segment's start. `preview` places the anchors on the workbench's stage.
// ---------------------------------------------------------------------------------------
export const SEQUENCES = {
  // THE LOCKHEART'S OPENING (tools/lockheart/ultimate.js says when each segment begins; the beats and their effects are here)
  'lockheart.opening': {
    anchors: ['courier', 'coffin', 'wheel'],
    preview: { courier: [0, 0, 0], coffin: [0, 1.5, 0.36], wheel: [0, 6.2, 1.2] },
    // (how the game strings the segments, for PLAY ALL in the workbench: [segment, seconds, times])
    order: [['invoke', 1.4], ['key', 0.32, 4], ['ascend', 1.4], ['wheel', 2.5], ['land', 1.6], ['back', 1.0]],
    start: 'invoke',
    segments: {
      // in low and close from the front, looking up past the joined hands at the coffin; a slow push in
      invoke: {
        camera: [
          { t: 0, pos: { at: 'courier', off: [-1.05, 0.35, 1.93] }, look: { at: 'coffin' }, fov: -6, roll: -0.06 },
          { t: 1.4, pos: { at: 'courier', off: [-0.82, 0.35, 1.5] }, look: { at: 'coffin' }, fov: -6, roll: -0.06 },
        ],
        fx: [{ t: 0, fx: 'ult.invoke', at: 'courier', until: 'back' }],
        mood: [{ t: 0, dim: 0.72, tint: 0x160a2e }],
        time: [{ t: 0, scale: 0.2 }],
      },
      // a cut for each key, round the Courier a quarter at a time (one camera place per key: offs)
      key: {
        camera: [
          { t: 0, cut: true, pos: { at: 'courier', offs: [[-1.64, 0.9, -0.96], [1.01, 1.7, -1.61], [1.58, 0.9, 1.06], [-1.09, 1.7, 1.56]] }, look: { at: 'coffin' }, fov: -10, roll: [-0.08, 0.08] },
        ],
        fx: [{ t: 0, fx: 'ult.key', at: 'coffin', tint: 'ctx' }],
      },
      // a crane: from low in front round and up over their shoulder as the coffin climbs
      ascend: {
        ease: 12,
        camera: [
          { t: 0, pos: { at: 'courier', off: [-2.11, 1.0, 3.86] }, look: { at: 'coffin', off: [0, -0.3, -0.1] }, fov: 6, roll: 0.05 },
          { t: 1.4, pos: { at: 'courier', off: [-0.18, 3.4, -4.4] }, look: { at: 'coffin', off: [0, -1.4, -0.1] }, fov: 12, roll: 0 },
        ],
        fx: [
          { t: 0, fx: 'ult.ascend', at: 'coffin' },
          { t: 0, fx: 'ult.pillar', at: 'courier', until: 'back', follow: true },
          { t: 0, fx: 'ult.crown', at: 'coffin', until: 'back', follow: true },
        ],
      },
      // from behind and below, looking up past them at the wheel in the sky, drifting round
      wheel: {
        ease: 6,
        camera: [
          { t: 0, pos: { at: 'courier', off: [0.8, 0.6, -2.27] }, look: { at: 'wheel' }, fov: 8, roll: -0.03 },
          { t: 10, pos: { at: 'courier', off: [2.19, 0.6, -0.98] }, look: { at: 'wheel' }, fov: 8, roll: -0.03 },
        ],
      },
      // the impact, wide; then back up at the wheel
      land: {
        camera: [
          { t: 0, cut: true, pos: { at: 'courier', off: [-3.53, 2.4, 2.8] }, look: { at: 'courier', off: [0, 1, 0] }, fov: 14 },
          { t: 0.5, pos: { at: 'courier', off: [-3.53, 2.4, 2.8] }, look: { at: 'courier', off: [0, 1, 0] }, fov: 14 },
          { t: 0.51, cut: true, pos: { at: 'courier', off: [0.8, 0.6, -2.27] }, look: { at: 'wheel' }, fov: 8, roll: -0.03 },
        ],
        fx: [{ t: 0, fx: 'ult.land', at: 'courier', off: [0, 1, 0] }],
        time: [{ t: 0, scale: 1 }],
      },
      // the camera goes home, the room comes back
      back: {
        mood: [{ t: 0, free: true }],
        time: [{ t: 0, scale: 1 }],
      },
    },
  },
  // A chest's opening (ceremony.js): the ceremony's own beats (approach, charge, burst, fountain, reveal, settle) say when; this says where
  // the camera is. `chest` is the chest's foot (z: the way it faces), `curio` where a curio is held up, `above` a point over the lid the
  // camera is kept clear of walls from. Charge, fountain and reveal are stretched to the tier's length (`len`). Effects added here play
  // in the tier's colour (`tint: 'ctx'`); the circle, shock and helix are vfx/chestfx.js's.
  'chest.open': {
    preview: { chest: [0, 0, 0], curio: [0, 1.85, 0], above: [0, 1.1, 0], courier: [0, 0, 1.1] },
    order: [['approach', 0.42], ['charge', 1.6], ['burst', 0.3], ['fountain', 1.5], ['reveal', 1.9], ['settle', 1.0]],
    start: 'approach',
    ease: 3,
    clearFrom: { at: 'above' },
    segments: {
      approach: {
        camera: [
          { t: 0, pos: { at: 'chest', off: [-3.2, 1.4, 2.05] }, look: { at: 'chest', off: [0, 0.4, 0] }, fov: 0 },
          { t: 0.42, pos: { at: 'chest', off: [-2.78, 1.2, 1.78] }, look: { at: 'chest', off: [0, 0.45, 0] }, fov: -4 },
        ],
      },
      charge: {
        len: 1,
        camera: [
          { t: 0, pos: { at: 'chest', off: [-2.78, 1.2, 1.78] }, look: { at: 'chest', off: [0, 0.45, 0] }, fov: -4 },
          { t: 0.5, pos: { at: 'chest', off: [-2.13, 0.98, 1.49] }, look: { at: 'chest', off: [0, 0.45, 0] }, fov: -8.5 },
          { t: 1, pos: { at: 'chest', off: [-1.99, 0.75, 1.51] }, look: { at: 'chest', off: [0, 0.45, 0] }, fov: -13 },
        ],
      },
      burst: {
        camera: [
          { t: 0, pos: { at: 'chest', off: [-1.99, 0.75, 1.51] }, look: { at: 'chest', off: [0, 0.45, 0] }, fov: -13 },
          { t: 0.06, pos: { at: 'chest', off: [-1.75, 0.78, 1.25] }, look: { at: 'chest', off: [0, 0.5, 0] }, fov: -14, cut: true },
          { t: 0.3, pos: { at: 'chest', off: [-1.91, 0.8, 1.37] }, look: { at: 'chest', off: [0, 0.55, 0] }, fov: -10 },
        ],
      },
      fountain: {
        len: 1,
        camera: [
          { t: 0, pos: { at: 'chest', off: [-1.91, 0.8, 1.37] }, look: { at: 'chest', off: [0, 0.55, 0] }, fov: -10 },
          { t: 0.5, pos: { at: 'chest', off: [-3.12, 1.76, 2.0] }, look: { at: 'chest', off: [0, 0.55, 0] }, fov: -4 },
          { t: 1, pos: { at: 'chest', off: [-3.48, 1.9, 1.77] }, look: { at: 'chest', off: [0, 0.55, 0] }, fov: -3 },
        ],
      },
      reveal: {
        len: 2,
        camera: [
          { t: 0, pos: { at: 'curio', off: [-2.2, -0.25, 1.57] }, look: { at: 'curio', off: [0, 0, 0] }, fov: -9 },
          { t: 2, pos: { at: 'curio', off: [-1.92, -0.2, 1.52] }, look: { at: 'curio', off: [0, 0, 0] }, fov: -11 },
        ],
      },
      settle: {}, // (no camera: the player's comes back)
    },
  },
  // THE OVERTURE'S TRAILER (cine/overture.js plays it, a segment a camera shot of docs/boards/OVERTURE.md, on the music). `here` is its place,
  // facing its yaw; `courier` is the Courier wherever they are. Every segment cuts in (ease 1000); the camera on the Courier's right
  // keeps them travelling left to right across the screen, as the board asks.
  overture: (() => {
    const C = (pos, look, fov = 0) => ({ pos: { at: pos[0], off: pos[1] }, look: { at: look[0], off: look[1] }, fov });
    const seg = (...keys) => ({ ease: 1000, camera: keys.map(([t, c, cut]) => ({ t, ...c, ...(cut ? { cut: true } : {}) })) });
    const cr = (o) => ['courier', o], here = (o) => ['here', o];
    return {
      anchors: ['here', 'courier'],
      preview: { here: [0, 0, 0], courier: [0, 0, 0] },
      order: [['fuse', 1.6], ['fuseHit', 0.8], ['fill', 0.8], ['wallrun', 1.6], ['slide', 1.6], ['dash', 1.6], ['mantle', 1.6]],
      start: 'fuse',
      bars: 0.6,
      clear: true,
      clearFrom: { at: 'courier', off: [0, 1.2, 0] },
      segments: {
        fuse: seg([0, C(cr([0.12, 1.56, 0.62]), cr([0, 1.52, 0]), -18)], [1.6, C(cr([0.08, 1.54, 0.5]), cr([0, 1.52, 0]), -20)]),
        fuseHit: seg([0, C(cr([0, 1.53, 0.42]), cr([0, 1.52, 0]), -22)], [0.8, C(cr([0, 1.53, 0.4]), cr([0, 1.52, 0]), -22)]),
        fill: seg([0, C(cr([0.35, 1.62, 0.7]), cr([0, 1.55, 0]), -20)], [0.2, C(cr([-0.3, 1.46, 0.6]), cr([0, 1.5, 0]), -22), true], [0.4, C(cr([0.05, 1.5, 0.52]), cr([0, 1.5, 0]), -24), true], [0.6, C(cr([0.22, 1.58, 0.48]), cr([0, 1.55, 0]), -26), true]),
        wallrun: seg([0, C(here([3.0, 0.9, 2.6]), cr([0, 1.2, 0]), -8)], [1.6, C(here([3.0, 1.1, 4.4]), cr([0, 1.3, 0.6]), -10)]),
        slide: seg([0, C(cr([1.7, 0.3, 0.5]), cr([0, 0.5, 0.7]), 4)], [1.6, C(cr([1.6, 0.28, 0.7]), cr([0, 0.45, 0.9]), 6)]),
        dash: seg([0, C(cr([2.4, 1.0, -0.4]), cr([0, 1.0, 0.8]), 0)], [1.6, C(cr([2.0, 1.2, 0.3]), cr([0, 1.1, 1.2]), 4)]),
        mantle: seg([0, C(here([2.6, 0.9, 0.2]), cr([0, 1.2, 0.3]), -4)], [1.6, C(here([2.4, 1.6, 0.8]), cr([0, 1.4, 0.3]), -6)]),
        kiln: seg([0, C(here([3.2, 1.3, 1.2]), here([-1.0, 1.0, 1.4]), -2)], [1.6, C(here([3.0, 1.3, 2.0]), here([-1.0, 1.0, 2.2]), -2)]),
        saggar: seg([0, C(cr([0.65, 1.6, -1.2]), here([0, 1.0, 2.0]), -6)], [1.6, C(cr([0.55, 1.55, -1.0]), here([0, 1.0, 2.0]), -8)]),
        folk: seg([0, C(cr([2.1, 1.3, 1.0]), cr([0, 1.1, 1.0]), -2)], [1.6, C(cr([2.0, 1.25, 1.4]), cr([0, 1.1, 1.2]), -2)]),
        dunes: seg([0, C(cr([6.5, 3.2, -4.0]), cr([0, 1.0, 6.0]), 6)], [1.6, C(cr([6.8, 3.6, -2.5]), cr([0, 1.0, 7.0]), 6)]),
        skiff: seg([0, C(cr([5.0, 1.4, 1.5]), cr([0, 0.8, 1.5]), 2)], [1.6, C(cr([4.6, 1.2, 2.5]), cr([0, 0.8, 2.5]), 2)]),
        weir: seg([0, C(here([3.0, 1.5, -1.0]), here([0, 0.6, 3.0]), 0)], [1.6, C(here([3.0, 1.7, -0.4]), here([0, 0.6, 3.4]), 0)]),
        basement: seg([0, C(cr([2.6, 0.5, 1.6]), cr([0, 1.6, 0.4]), 6)], [1.6, C(cr([2.4, 0.5, 2.2]), cr([0, 1.8, 0.6]), 6)]),
        dive: seg([0, C(here([2.4, -1.9, 1.2]), cr([0, 0.6, 0]), 6)], [1.6, C(here([2.0, -2.0, 1.0]), cr([0, 0.4, 0]), 8)]),
        climb: seg([0, C(cr([1.9, 1.2, 1.9]), cr([0, 1.1, 0]), -6)], [4.8, C(cr([-1.3, 1.0, 2.3]), cr([0, 1.1, 0]), -8)], [6.4, C(cr([-0.6, 1.0, 1.4]), cr([0, 1.1, 0]), -14)]),
        impact: seg([0, C(cr([1.4, 1.5, -1.6]), cr([0, 0.7, 3.2]), -6)], [1.6, C(cr([1.2, 1.4, -1.2]), cr([0, 0.7, 3.2]), -8)]),
        ego: seg([0, C(cr([-1.4, 1.4, -1.4]), cr([0, 0.7, 3.2]), -6)], [1.6, C(cr([-1.2, 1.3, -1.0]), cr([0, 0.7, 3.2]), -8)]),
        influence: seg([0, C(cr([2.2, 1.0, 1.6]), cr([0, 0.8, 2.6]), -4)], [1.6, C(cr([2.0, 1.0, 2.0]), cr([0, 0.8, 2.8]), -6)]),
        illusion: seg([0, C(cr([0.6, 1.7, -1.3]), cr([0, 0.8, 3.2]), -8)], [1.6, C(cr([0.5, 1.6, -1.0]), cr([0, 0.8, 3.2]), -10)]),
        delirium: seg([0, C(cr([-2.0, 0.6, 1.4]), cr([0, 0.9, 3.0]), -2)], [1.6, C(cr([-1.8, 0.7, 1.8]), cr([0, 0.9, 3.0]), -4)]),
        cut: seg([0, C(cr([1.8, 1.2, 2.6]), cr([0, 1.0, 1.2]), -4)], [1.6, C(cr([1.6, 1.1, 2.4]), cr([0, 1.0, 1.3]), -6)]),
        psygun: seg([0, C(cr([-1.6, 2.0, -2.5]), cr([0, 0.5, 5.0]), 0)], [1.6, C(cr([-1.8, 2.3, -3.0]), cr([0, 0.5, 5.0]), 2)]),
        lineup: seg([0, C(cr([0, 1.2, 3.2]), cr([0, 1.1, 0]), -4)], [1.6, C(cr([0, 1.15, 2.2]), cr([0, 1.15, 0]), -8)]),
        solo: {}, key1: {}, key2: {}, key3: {}, key4: {}, ascend: {}, wheel: {}, land: {}, // (the Lockheart's Opening holds the camera: its own sequence)
        deep: seg([0, C(cr([0.5, 26, -3.0]), cr([0, 0, 0.5]), 10)], [1.6, C(cr([0.4, 3.0, -1.0]), cr([0, 0.8, 0.3]), 4)]),
        still1: seg([0, C(here([2.6, 1.0, 0.4]), cr([0, 1.3, 0.3]), -6)]),
        still2: seg([0, C(cr([-1.1, 1.3, 1.6]), here([0, 1.0, 2.0]), -4)]),
        still3: seg([0, C(cr([5.5, 2.6, -3.0]), cr([0, 1.0, 5.0]), 6)]),
        still4: seg([0, C(here([3.0, 1.5, -1.0]), here([0, 0.6, 3.0]), 0)]),
        riffle: seg([0, C(here([3.0, 1.5, -1.0]), here([0, 0.6, 3.0]), 0)]),
        siege: seg([0, C(here([7.0, 4.5, 4.0]), here([0, 0, -8.0]), 6)], [1.6, C(here([6.0, 4.0, 6.0]), here([0, 0, -8.0]), 6)]),
        god: {}, // (the god hand's own camera)
        bell: seg([0, C(cr([1.6, 1.3, 1.8]), cr([0, 1.25, 0]), -4)], [1.6, C(cr([1.3, 1.25, 1.6]), cr([0, 1.25, 0]), -6)]),
        chest: seg([0, C(cr([1.7, 1.3, -0.9]), cr([0, 0.6, 2.2]), -4)], [1.6, C(cr([1.9, 1.6, -1.2]), cr([0, 0.9, 2.2]), -2)]),
        refire: seg([0, C(cr([0.35, 1.55, 1.35]), cr([0, 1.25, 0]), -4)], [1.6, C(cr([0.5, 1.5, 1.15]), cr([0, 1.25, 0]), -6)]),
        spire: seg([0, C(cr([-2.4, 1.4, -2.6]), cr([0, 2.4, 12.0]), 4)], [1.6, C(cr([-2.0, 1.2, -2.2]), cr([0, 3.0, 12.0]), 4)]),
        suits: seg([0, C(cr([0, 1.25, 2.7]), cr([0, 1.0, 0]), -2)], [1.6, C(cr([0.4, 1.3, 2.5]), cr([0, 1.0, 0]), -4)]),
        run: seg([0, C(cr([0, 1.1, 3.2]), cr([0, 1.0, 0]), 2)], [1.6, C(cr([0, 1.05, 2.6]), cr([0, 1.0, 0]), 4)]),
      },
    };
  })(),
};
