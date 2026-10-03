// ---------------------------------------------------------------------------------------
// THE SEQUENCES: every cinematic event's timeline, as data (cine/sequence.js plays them; the workbench's CINEMA tab shows, scrubs,
// edits and keys them). Points are `{ at: anchor, off: [right, up, forward] }` in metres, in the frame the sequence faces; times are
// real seconds from a segment's start. `preview` places the anchors on the workbench's stage.
// ---------------------------------------------------------------------------------------
export const SEQUENCES = {
  // THE LOCKHEART'S OPENING (lockheart/ultimate.js says when each segment begins; the beats and their effects are here)
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
};
