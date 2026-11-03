// ---------------------------------------------------------------------------------------
// A MECH'S KEY POSES (the mech layer: what no clip of the Courier's has; KEY-POSES.md's idea, courier/anim/keyposes.js, played by a
// player of the mech's own): strong held poses laid over the retargeted clip as turns added to joints (radians about each joint's own
// X, Y, Z: X pitches a limb, +X sends a hanging limb's foot back and a torso's top forward; Y twists; Z rolls, +Z tips a top toward the
// frame's right), each drawn in by a weight the animator eases.
//   SKATE    the skate stance: knees bent and the left foot forward, the hips turned to it, the chest leaning into the boost, the lead
//            arm forward and the trailing arm back (Armored Core's boosting stance; a speed skater's crouch)
//   ASSAULT  the assault boost's tuck: folded at the hips and knees, the torso over the knees, the arms swept back, the head up
//   SQUASH   the landing's heavy squash at k 1: hips and knees folded deep, the chest down over them, the arms thrown out for balance
//   LURCH    the quick boost's lurch, by its direction (body frame, f the forward share, l the left): the torso left behind by the push
//            and the legs braced, then the recovery's overshoot (lurchAt: a damped swing, its time the feel's)
//   PIVOT    a turn's pivot: the hips swung round ahead of the chest (side +1 to the left), the inside knee loaded
//   DOLL     her own layer (South, 2026-11-02; tasteful and strong, a figure skater's, never comic): contrapposto at rest (the weight on
//            one leg, the hip up on that side, the shoulders countering), the hip's sway over the walk, a wider stance, the arms carried
//            off her hips; on the skate the pelvis swung to the lead foot and the arms opened in a skater's line
// Prior art: limited animation's held keys (Guilty Gear Xrd, GDC 2015), Armored Core's quick-boost lean, Polykleitos's Doryphoros
// (contrapposto), the figure skater's spiral and the speed skater's crouch.
//
//   SKATE ASSAULT SQUASH PIVOT DOLL   addKey(joints, KEY, w)   lurchAt(t, recov) -> { push, back }   addLurch(joints, f, l, a, w)
// ---------------------------------------------------------------------------------------

export const SKATE = {
  pelvis: [0.1, -0.16, 0], waist: [0.16, 0.06, 0], chest: [0.08, 0.06, 0], neck: [-0.18, 0, 0], head: [-0.06, 0.04, 0],
  hipL: [-0.62, 0, 0.04], kneeL: [0.85, 0, 0], ankleL: [-0.25, 0, 0],
  hipR: [0.05, 0, -0.1], kneeR: [0.95, 0, 0], ankleR: [-0.6, 0, 0],
  shoulderL: [-0.35, 0, 0.05], elbowL: [-0.5, 0, 0], shoulderR: [0.38, 0, -0.06], elbowR: [-0.35, 0, 0],
};
export const ASSAULT = { // (a forward-leaning sprint glide, never a crouch: the second firing halved the hips' and waist's lean, lifted the head)
  pelvis: [0.11, 0, 0], waist: [0.21, 0, 0], chest: [0.12, 0, 0], neck: [-0.3, 0, 0], head: [-0.18, 0, 0],
  hipL: [-0.45, 0, 0.05], kneeL: [0.6, 0, 0], ankleL: [-0.15, 0, 0], hipR: [-0.2, 0, -0.05], kneeR: [0.7, 0, 0], ankleR: [-0.5, 0, 0],
  shoulderL: [0.75, 0, 0.18], elbowL: [-0.45, 0, 0], shoulderR: [0.75, 0, -0.18], elbowR: [-0.45, 0, 0],
};
export const SQUASH = { // (a heavy knee bend under an upright torso: hip, knee and ankle summing to nothing, so the shin leans and the sole stays flat)
  pelvis: [0.04, 0, 0], waist: [0.08, 0, 0], chest: [0, 0, 0], neck: [-0.05, 0, 0],
  hipL: [-0.62, 0, 0.1], kneeL: [1.15, 0, 0], ankleL: [-0.53, 0, 0], hipR: [-0.62, 0, -0.1], kneeR: [1.15, 0, 0], ankleR: [-0.53, 0, 0],
  shoulderL: [-0.15, 0, 0.18], elbowL: [-0.3, 0, 0], shoulderR: [-0.15, 0, -0.18], elbowR: [-0.3, 0, 0],
};
export const PIVOT = {
  pelvis: [0.06, 0.45, 0], waist: [0.1, -0.2, 0], chest: [0.05, -0.18, 0],
  hipL: [-0.3, 0, 0.12], kneeL: [0.7, 0, 0], ankleL: [-0.3, 0, 0], hipR: [-0.1, 0, -0.05], kneeR: [0.45, 0, 0], ankleR: [-0.25, 0, 0],
  shoulderL: [-0.2, 0, 0.3], shoulderR: [0.25, 0, -0.3],
};
/** Her own layer: `rest` at rest and under every state, `walk` scaled by the hip's sway (a stride's sine), `skate` on the skate. */
export const DOLL = {
  rest: { pelvis: [0, 0, 0.05], waist: [0, 0, -0.03], chest: [0, 0.03, -0.04], head: [0, -0.04, 0.03], hipL: [0, 0, 0.07], hipR: [0, 0, -0.07],
    kneeR: [0.12, 0, 0], ankleR: [-0.06, 0, 0], shoulderL: [0.05, 0, 0.2], shoulderR: [0.05, 0, -0.2], elbowL: [-0.28, 0, 0], elbowR: [-0.28, 0, 0] },
  walk: { pelvis: [0, 0.12, 0.08], waist: [0, -0.06, -0.05], chest: [0, -0.07, -0.04] },
  skate: { pelvis: [0.04, -0.24, 0.06], waist: [0, 0.12, -0.04], chest: [-0.04, 0.12, -0.03], head: [-0.05, -0.08, 0],
    shoulderL: [-0.42, 0, -0.1], elbowL: [-0.6, 0, 0], shoulderR: [0.5, 0, 0.06], elbowR: [-0.45, 0, 0], hipL: [0, 0, 0.03], hipR: [0.1, 0, -0.08] }, // (a speed skater's arms: the lead forward and the trail back, elbows bent, held in off the T)
};

/** Each joint the key names turned by its values x w. */
export function addKey(joints, K, w) {
  if (!(w > 0.001)) return;
  for (const id in K) { const o = joints[id]; if (!o) continue; const v = K[id]; o.rotation.x += v[0] * w; o.rotation.y += v[1] * w; o.rotation.z += v[2] * w; }
}
/** The lurch's swing a time `t` (s) after a quick boost, its recovery `recov` (s): `push` the torso left behind (1 at once, then
 *  overshooting forward), `back` the legs' brace; both gone by the recovery's end. */
const OUT = { push: 0, brace: 0 };
export function lurchAt(t, recov) {
  if (t < 0 || t > recov * 1.4) { OUT.push = 0; OUT.brace = 0; return OUT; }
  const snap = Math.min(1, t / 0.05), w = (Math.PI * 1.5) / recov, d = Math.exp(-t * (3.2 / recov));
  OUT.push = snap * d * Math.cos(w * t); OUT.brace = snap * Math.exp(-t * (2.4 / recov));
  return OUT;
}
/** The lurch laid on: f, l the push's direction in the body (forward, left), a its swing (lurchAt().push), b its brace. */
export function addLurch(joints, f, l, a, b, w = 1) {
  const j = joints, A = 0.32 * a * w, B = b * w;
  if (j.waist) { j.waist.rotation.x -= f * A; j.waist.rotation.z += l * A; }
  if (j.chest) { j.chest.rotation.x -= f * A * 0.6; j.chest.rotation.z += l * A * 0.6; }
  if (j.neck) j.neck.rotation.x += f * A * 0.8;
  for (const [s, k] of [[1, 'L'], [-1, 'R']]) {
    if (j[`hip${k}`]) { j[`hip${k}`].rotation.x -= 0.35 * B; j[`hip${k}`].rotation.z += s * 0.08 * B + l * 0.12 * B; }
    if (j[`knee${k}`]) j[`knee${k}`].rotation.x += 0.6 * B;
    if (j[`ankle${k}`]) j[`ankle${k}`].rotation.x -= 0.25 * B;
    if (j[`shoulder${k}`]) { j[`shoulder${k}`].rotation.x += f * 0.5 * A; j[`shoulder${k}`].rotation.z += s * 0.12 * Math.abs(A) + l * 0.18 * A; }
    if (j[`elbow${k}`]) j[`elbow${k}`].rotation.x -= 0.4 * B; // (the arms tucked in with the brace, never flung out)
  }
}
