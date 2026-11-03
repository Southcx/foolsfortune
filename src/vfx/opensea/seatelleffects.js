// ---------------------------------------------------------------------------------------
// THE SMALL TELLS ON THE WATER, THEIR EFFECTS: the library's entries (vfx/library.js spreads them in) that vfx/opensea/seatells.js plays
// on the shared particle pools over the open sea's crude. Data only. Sized to read from the helm's chase camera, tens of metres off.
//   sea.tell.bubbles   a fishing spot: a few bubbles welling up and popping, a ring spreading flat on the crude, a fleck of spray
//   sea.tell.deep      over a lair that waits: one fat bubble breaking the surface slowly, a wide faint ring in the light's violet
//
// Prior art: DREDGE's fishing spots (bubbles and rings where the fish are), The Wind Waker's sea, a whale's boil before it surfaces.
// ---------------------------------------------------------------------------------------
const FILM = [0x8ac8d8, 0xb8e0e8, 0xd8f0f0]; // (pale bubbles: the light caught on them over the dark crude)

export const SEA_TELL_EFFECTS = {
  // a fishing spot at sea: bubbles welling up and popping, a ring spreading flat on the crude, a fleck of spray
  'sea.tell.bubbles': { layers: [
    { type: 'sprites', count: [3, 6], shape: 'bubble', spawn: 'disc', r: 1.4, dir: 'cone', axis: 'up', cone: 15, speed: [0.3, 0.7], size: [0.25, 0.55], sizeEnd: 0.6, life: [0.5, 0.9], drag: 1, color: FILM, powerSize: false },
    { type: 'shape', form: 'ring', ramp: 'tint', tint: 0xa8d8e0, main: 'ripple', tile: [6, 1], scroll: [0, 0.4], add: 0.6, glow: 0.6, dur: 1.4, scale: [[0, 0.6], [1, 3.6]], offset: [0, 0.08, 0], erode: [[0, 0], [0.6, 0.1], [1, 1]] },
    { type: 'sprites', pool: 'alpha', count: [2, 4], shape: 'drip', spawn: 'disc', r: 1, dir: 'cone', axis: 'up', cone: 25, speed: [1, 2], size: [0.06, 0.12], life: [0.35, 0.5], gravity: 9, color: 0xc8e8ec, alpha: 0.8 },
  ] },
  // over a lair that waits: one fat bubble breaking slowly, a wide faint ring in the light's violet
  'sea.tell.deep': { layers: [
    { type: 'sprites', count: 1, shape: 'bubble', size: 1.6, sizeEnd: 2.6, life: 1.1, color: 0xb8a8f0, powerSize: false },
    { type: 'shape', form: 'ring', ramp: 'tint', tint: 0x7c5cf0, main: 'ripple', tile: [8, 1], scroll: [0, 0.25], add: 0.7, glow: 0.8, dur: 2.6, scale: [[0, 1.5], [1, 11]], offset: [0, 0.1, 0], erode: [[0, 0], [0.5, 0.1], [1, 1]] },
  ] },
};
