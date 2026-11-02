// ---------------------------------------------------------------------------------------
// THE HANGAR'S LAYOUT (docs/plans/MECHS.md 5.1, 5.2): where the hangar and the proving ground stand, and what stands in them, as plain
// numbers (no three.js), so the room's builders, the mech's controller and a Node script read one table. Local metres from each place's
// `at` (x east, z south, y up from its floor). The zone tests repeat the boxes as numbers (render/zonemap.js imports nothing from the world).
//
// Prior art: the Sandbox's and the Touchstone's tables (progress/sandbox.js SANDBOX, world/touchstone/touchstone.js TOUCHSTONE): a room
// as one object of spots, read by its builder and its runtime alike.
//
//   HANGAR { at, w, d, h, gantry, walkY, walk, ramp, lectern, door, arrive, lift, hole }
//   PROVING { at, half, wall, launch, sockets, giant, door, blocks [{ x, z, w, d }], ring { x, z, half } }   SOCKET_REACH   inProving(p)   clampProving(p, r)
// ---------------------------------------------------------------------------------------

/** The hangar: a tall hall (60 x 60 m, a 40 m roof) far east of the Sandbox (x 3080), Strawman's Well (x 3350 .. 3700) and the Touchstone
 *  (x 3000). The gantry against its north wall with the mech standing in it facing the hall (yaw 0: +z); the walkway at the clay frame's
 *  chest, reached up a ramp along the west; the lectern at the gantry's foot; the door back to the hub in the south wall. `lift`: the
 *  launch's ride up the shaft (real s, m); `hole`: the roof's opening over the gantry (half its side, m). */
export const HANGAR = {
  at: { x: 3800, y: 200, z: -3000 }, w: 60, d: 60, h: 40,
  gantry: { x: 0, z: -16, yaw: 0 },
  walkY: 8.4, // (the walkway's top: the clay frame's seat stands at 9 m, MECH_BODY in mech.js; a frame of other legs is raised or lowered on the lift to meet it)
  walk: { x0: -2.5, x1: 2.5, z0: -13.6, z1: -10.6 }, // (the walkway before the chest; the cradle reached from its middle)
  ramp: { x0: -26.5, x1: -2.5, z: -12.1, w: 3 }, // (from the floor up to the walkway's west edge: 8.4 m over 24 m, about 19 degrees)
  lectern: { x: 10, z: -8 },
  door: { x: 0, z: 29.5 },
  arrive: { x: 0, z: 22, yaw: Math.PI },
  lift: { t: 4, rise: 34 },
  hole: 11,
};

/** The proving ground: an open yard at the mech's scale beside the hangar (360 m square, its centre 300 m east), at the hangar's height.
 *  Knee-high clay blocks to step round, two sockets for the cable, the straw giant's spot, the door back to the hub on the west wall. */
export const PROVING = {
  at: { x: 4100, y: 200, z: -3000 }, half: 180, wall: 4,
  launch: { x: -130, z: 0, yaw: Math.PI / 2 }, // (where the lift sets the mech down, facing east toward the giant)
  sockets: [{ x: -145, z: -32 }, { x: 35, z: 78 }],
  giant: { x: 70, z: 0, yaw: -Math.PI / 2 },
  door: { x: -179, z: -60 },
  blocks: [ // (the knee-high blocks, 3 m tall: things a 14 m frame steps round, or jumps onto)
    { x: -90, z: -50, w: 14, d: 10 }, { x: -70, z: 45, w: 10, d: 18 }, { x: -30, z: -20, w: 8, d: 8 }, { x: -20, z: 95, w: 18, d: 10 },
    { x: 10, z: -90, w: 12, d: 12 }, { x: 20, z: 40, w: 8, d: 14 }, { x: 120, z: -60, w: 16, d: 8 }, { x: 130, z: 70, w: 10, d: 10 },
    { x: 150, z: -130, w: 20, d: 12 }, { x: -120, z: 120, w: 12, d: 16 }, { x: 90, z: 140, w: 14, d: 10 }, { x: -150, z: -120, w: 10, d: 10 },
  ],
  blockH: 3,
  ring: { x: 90, z: 130, half: 18 }, // (the ring's square, reserved (MECHS.md 9.4): no lot of the toy city stands in it)
};
/** Metres from a socket (to the mech's middle) within which F plugs the cable. */
export const SOCKET_REACH = 14;

/** Is a world point in the proving ground's square? */
export const inProving = (p) => Math.abs(p.x - PROVING.at.x) < PROVING.half && Math.abs(p.z - PROVING.at.z) < PROVING.half;
/** A world point kept `r` m inside the proving ground's walls (mutates and returns p). */
export function clampProving(p, r = 0) {
  const A = PROVING.at, m = PROVING.half - 1 - r;
  p.x = Math.max(A.x - m, Math.min(A.x + m, p.x)); p.z = Math.max(A.z - m, Math.min(A.z + m, p.z));
  return p;
}
