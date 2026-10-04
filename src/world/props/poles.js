// ---------------------------------------------------------------------------------------
// KNEE POLES, PER STATE. A two-bone IK solve says where a foot goes, and a "pole" says which way the knee
// bends on the way: with one shared, unopinionated pole (the knee where the clip had it, nudged forward) a leg
// can flare wherever the clip's pose or a stretched stride pushes it. So each animation state has its own
// pole offset (in the body's frame: +X is the Courier's left, +Y up, +Z forward) and its own limit on how far a
// knee may sit to the outside of the hip-to-foot line. The guard is geometric: it looks at where the knee is, not at
// a joint's rig axes, so it holds on whatever put the limb there (a clip, a stretched stride, a tech), and
// it is the same idea as a Control Rig / Final IK "bend goal" plus a swing limit, kept per state.
//
// Prior art: the pole vector / bend goal every DCC and engine IK node has (Blender IK constraints, Unreal Control Rig
// two-bone IK, Unity Animation Rigging's "hint"), and the practice of animating the pole per action.
//
//   kneeProfile({ air, sl, cr })  the blended profile for the frame: { fwd, out, up, maxOut }
//   fwd, out, up   where the pole sits relative to the knee (out: away from the body's middle line)
//   maxOut         the most the knee may stand outside the hip-foot line, metres (the guard re-solves the leg past it)
// Restrictions: outward flare is what reads wrong most, so `out` is zero or slightly inward everywhere.
// ---------------------------------------------------------------------------------------
export const KNEE_STATES = {
  gait: { fwd: 0.10, out: 0.0, up: 0.0, maxOut: 0.10 },   // walk, jog, sprint, idle: the knee follows the toes
  crouch: { fwd: 0.10, out: 0.0, up: 0.0, maxOut: 0.14 }, // deeper bends may stand a little wider
  air: { fwd: 0.14, out: -0.02, up: 0.0, maxOut: 0.06 },  // jumps: knees forward and close, not flared
  slide: { fwd: 0.0, out: -0.01, up: 0.16, maxOut: 0.08 } // lying back on the slope: the knees rise, they do not swing out
};

const mix = (a, b, k) => a + (b - a) * k;

export function kneeProfile({ air = 0, sl = 0, cr = 0 }) {
  const S = KNEE_STATES;
  const out = { ...S.gait };
  const blend = (t, k) => { if (k <= 0) return; for (const key of ['fwd', 'out', 'up', 'maxOut']) out[key] = mix(out[key], t[key], Math.min(1, k)); };
  blend(S.crouch, cr);
  blend(S.air, air);
  blend(S.slide, sl);
  return out;
}
