// ---------------------------------------------------------------------------------------
// STRAWMAN'S MOVES AND ATTACK STRINGS: what the Workshop's dummy does with its body when it fights back, as data (the owner, 2026-10-10:
// "animate ALL the moves"; docs/plans/COMBAT-LAB.md section 6). Calissa's: the design, the poses and the numbers (the owner put Strawman
// wholly in Calissa's hands). Strawman has no skeleton, so a move is keyed on the few things that move (vfx/strawman.js):
//
//   lean   the rock on its ball foot, forward (+) and back (-)        tilt   the rock to its side (+: the left sleeve's side dips)
//   turn   the whole doll about the ball (+: the left sleeve comes forward), over the facing it was aimed with
//   lf lu lo ls / rf ru ro rs   each sleeve on its shoulder: swung forward from straight out to its side (pi/2 straight ahead), tipped up
//          (-: down), the shoulder pushed out (m, + forward), the sleeve stretched (0 its own length; a cartoon's sleeve unrolling)
//   hat    the tall block nodding on its base (+ forward)            look   the head tipping up (+)
//   tell   the sack's amber pulse (0..1, at the move's own `pulse`)  dark   the sack dimmed (0..1): a held breath
//
// A move is a windup (the tell's poses keyed over time, eased), its blows (each strikes at `at`, with the part that carries the parry
// mark and the area a Figment attack telegraph draws: the drawn area is the hit area), and the recovery to rest (the punish). The springs
// the doll already has carry the follow-through (`kicks`: an impulse to the rock, the sack or the hat at a time). Every number here is at
// 1x; the parry's window (its last 0.25 s before a strike) is the parry's rule (courier/parry.js), not a move's.
// No blow strikes sooner than 0.75 s after its move (or its last blow) begins: the mark runs hot half a second before a strike (the window
// and a press's quarter second), so a shorter wind-up would glint from its first frame and teach nothing (casebook 2026-10-10, rule 185).
//
// Prior art: Punch-Out!!'s tells (each opponent's wind-up a picture readable before the blow, the same picture every time, the delayed
// one a held pose), Sekiro's and Dark Souls' readable wind-ups (a long, still telegraph; a delayed swing that punishes the panic press;
// the low sweep jumped over), the wing chun wooden dummy (arms that come at you on fixed lines), and fighting games' training dummies
// with recorded strings (Street Fighter's and Tekken's record and playback: a fixed sequence, played back on a loop for practice).
//
//   STRAWMAN_MOVES[id] = { label, end, pulse, blows: [{ at, also?, part, area, owns? }], keys: [[t, ease, pose]], kicks?, clear? }
//   STRAWMAN_STRINGS[id] = { label, line, steps: [{ move } | { pause } | { keepOut }], shuffle? }
//   poseAt(move, t, out?) -> the pose at t (every channel)   REST   CHANNELS   reachOf(area)   inArea(area, along, across)   SLEEVES   MOVE_EASE   PUSH
//   KEEP_OUT (Keep out's two moves: near, far)
// ---------------------------------------------------------------------------------------

/** Every channel a move keys, each 0 at rest. */
export const CHANNELS = ['lean', 'tilt', 'turn', 'lf', 'lu', 'lo', 'ls', 'rf', 'ru', 'ro', 'rs', 'hat', 'look', 'tell', 'dark'];
export const REST = Object.freeze(Object.fromEntries(CHANNELS.map((c) => [c, 0])));
const LEFT = ['lf', 'lu', 'lo', 'ls'];

/** Strawman's sleeves held still (radians from a sleeve standing straight out to its side; pi/2 is straight ahead). `guard`: the
 *  shoulders brought forward (`reach`, m), each sleeve swung forward past straight ahead (`forward`) and tipped down, so the two cross in
 *  an X over its chest, 0.3 m in front of it, clear of the head and the sack; the right tipped a little lower, lying over the left.
 *  `swing`: the right sleeve in the swing's wind-up held up (`up`) and a little back (`back`), high beside the head where the striker
 *  sees it, and the parry mark on it (a sleeve drawn straight back hid behind the head from in front); then swept `through`. */
export const SLEEVES = {
  guard: { reach: 0.16, forward: 2.25, tipL: 0.5, tipR: 0.65 },
  swing: { back: 0.15, up: 1.15, through: 1.6 },
};
/** A blow a parry broke off: what it moved eases back to rest at this rate (1/s). */
export const MOVE_EASE = 12;
/** A blow that lands shoves the Courier this fast (m/s; Strawman never hurts: STRAWMAN.swing.harm 0). */
export const PUSH = 4;

const SW = SLEEVES.swing;
const swingCone = { shape: 'cone', degrees: 140, length: 2.6 }; // (the swing's reach: 2.6 m, 70 degrees either side of where it faces)
const jabLunge = { shape: 'lunge', reach: 1.9, width: 0.9 };
// the jab, keyed once and shared by the one-two: the left shoulder drawn back, the sleeve levelled at you (its cream spiral facing you,
// a target looking back), held a beat, then thrust: the shoulder driven forward, the sleeve unrolling to half again its length
const JAB = [
  [0, 'lin', { tell: 1 }],
  [0.58, 'out', { turn: -0.28, lf: 1.75, lu: 0.06, lo: -0.12, lean: -0.06 }],
  [0.66, 'io', { turn: -0.3, lf: 1.8, lo: -0.15 }],
  [0.75, 'in', { turn: 0.16, lf: 1.41, lu: 0, lo: 0.24, ls: 0.6, lean: 0.12, tell: 0 }],
];

export const STRAWMAN_MOVES = {
  /** The swing (the first move, the owner's T51): it leans back, the right sleeve rises beside the head, the sack pulses; then it sweeps. */
  swing: {
    label: 'swing', end: 1.6, pulse: 26,
    blows: [{ at: 0.925, part: 'right', area: swingCone }],
    keys: [
      [0, 'lin', { tell: 1 }],
      [0.8, 'io', { lean: -0.22, rf: -SW.back, ru: SW.up, tell: 1 }],
      [1.05, 'lin', { lean: 0.28, rf: SW.through, ru: 0, tell: 0 }], // (the sweep: its middle, 0.925, the strike)
      [1.6, 'io', REST],
    ],
    kicks: [{ at: 0.925, sack: [0.5, -0.9] }],
  },
  /** The jab: a short tell, a straight thrust of the left cuff. */
  jab: {
    label: 'jab', end: 1.1, pulse: 30,
    blows: [{ at: 0.75, part: 'left', area: jabLunge }],
    keys: [...JAB, [1.1, 'out', REST]],
    kicks: [{ at: 0.75, rock: [0.9, 0], sack: [1.2, 0] }], // (the rock wobbles as the sleeve springs back)
  },
  /** The one-two: the jab, and through its recovery the right sleeve already up beside the head (the swing's picture, held short). */
  oneTwo: {
    label: 'one-two', end: 1.85, pulse: 30,
    blows: [{ at: 0.75, part: 'left', area: jabLunge, owns: LEFT }, { at: 1.3, part: 'right', area: swingCone }],
    keys: [
      ...JAB,
      [1.07, 'out', { turn: -0.05, lf: 0.35, lo: 0, ls: 0.1, lean: -0.16, rf: -SW.back, ru: SW.up, tell: 1 }],
      [1.17, 'io', { lf: 0.1, ls: 0, lean: -0.2, ru: SW.up + 0.05 }],
      [1.42, 'lin', { lean: 0.28, rf: SW.through, ru: 0, turn: 0.1, tell: 0 }], // (the sweep: its middle, 1.295, the second strike)
      [1.85, 'io', REST],
    ],
    kicks: [{ at: 0.75, rock: [0.6, 0] }, { at: 1.3, rock: [0.5, -0.4], sack: [0.6, -0.8] }],
  },
  /** The overhead chop: both sleeves rise together above the hat (a tall silhouette), it leans far back, a long slow pulse; then both
   *  come down in front at once. The longest punish: the sleeves down, the doll rocking hard. */
  overheadChop: {
    label: 'overhead chop', end: 1.95, pulse: 11,
    blows: [{ at: 1.15, part: 'both', area: { shape: 'line', width: 1.0, length: 2.2 } }],
    keys: [
      [0, 'lin', { tell: 1 }],
      [0.55, 'io', { lu: 1.3, ru: 1.3, lf: 0.55, rf: 0.55, ls: 0.3, rs: 0.3, lean: -0.28, look: 0.25, hat: -0.12 }],
      [1.0, 'io', { lu: 1.4, ru: 1.4, lean: -0.34, look: 0.3 }], // (held, creeping higher: alive, and still the same picture)
      [1.15, 'in', { lu: -0.75, ru: -0.75, lf: 1.4, rf: 1.4, ls: 0.45, rs: 0.45, lean: 0.36, look: -0.1, hat: 0.2, tell: 0 }],
      [1.55, 'out', { lu: -0.65, ru: -0.65, lean: 0.26, hat: 0.05 }],
      [1.95, 'io', REST],
    ],
    kicks: [{ at: 1.15, rock: [1.6, 0], sack: [2.2, 0], hat: 3 }],
  },
  /** The spin sweep (the roly-poly's): it leans back on its ball until the lacquer shows, both sleeves out straight, cocked a turn the
   *  wrong way; then it whirls once on the ball, wobbling, each sleeve dipping knee high as it passes the front (the left, then the
   *  right a half turn later). A jump that clears it takes nothing (`clear`: the feet that far up); one parry breaks off the whole spin.
   *  Then dizzy: it circles on its ball. */
  spinSweep: {
    label: 'spin sweep', end: 1.9, pulse: 22, clear: 0.35,
    blows: [{ at: 0.85, also: [1.0], part: 'both', area: { shape: 'circle', radius: 2.0 } }], // (the cuff passes 1.5 m out, the sleeve 0.2 thick, the Courier 0.35)
    keys: [
      [0, 'lin', { tell: 1 }],
      [0.6, 'io', { turn: -0.55, lean: -0.34, lu: 0.04, ru: 0.04, ls: 0.15, rs: 0.15 }],
      [0.72, 'io', { turn: -0.6, lean: -0.38 }],
      [0.85, 'in', { turn: Math.PI / 2, lean: 0.04, tilt: 0.55, lu: -0.45, ru: -0.45, ls: 0.5, rs: 0.5, tell: 0 }], // (the left cuff in front, knee high)
      [1.0, 'lin', { turn: (3 * Math.PI) / 2, tilt: -0.55 }], // (the right, a half turn later)
      [1.22, 'out', { turn: 2 * Math.PI + 0.35, tilt: 0.08, lu: 0, ru: 0, ls: 0.1, rs: 0.1, lean: 0 }],
      [1.9, 'io', { ...REST, turn: 2 * Math.PI }],
    ],
    kicks: [{ at: 1.22, tip: [0.16, 0], rock: [0, 1.0] }], // (a push across a lean: the spring circles, the dizzy top)
  },
  /** The hat-butt: the sleeves swept back like wings, the hat tipping back first, the X eyes looking up; then it nods the hat's front edge
   *  down at you. Short: it punishes hugging it inside the swing. */
  hatButt: {
    label: 'hat-butt', end: 1.35, pulse: 28,
    blows: [{ at: 0.75, part: 'hat', area: { shape: 'lunge', reach: 1.4, width: 1.0 } }],
    keys: [
      [0, 'lin', { tell: 1 }],
      [0.37, 'out', { hat: -0.32 }],
      [0.57, 'io', { hat: -0.38, lf: -0.75, rf: -0.75, lu: 0.3, ru: 0.3, lean: -0.1, look: 0.3 }], // (tipped back no further: past 0.6 rad, with a lean, the head hid the hat from in front: rule 161)
      [0.63, 'io', { hat: -0.42, lean: -0.12 }],
      [0.75, 'in', { hat: 0.95, lean: 0.42, look: -0.25, lf: -0.4, rf: -0.4, lu: 0.1, ru: 0.1, tell: 0 }],
      [1.35, 'io', REST],
    ],
    kicks: [{ at: 0.75, rock: [1.3, 0], hat: 6 }], // (the hat wobbling on its bounce)
  },
  /** The delayed swing: the swing's picture exactly, then a hold at the top with the pulse gone dark (a held breath), then the sweep. A
   *  press on the swing's timing is half a second early and answers nothing. */
  delayedSwing: {
    label: 'delayed swing', end: 1.975, pulse: 26,
    blows: [{ at: 1.425, part: 'right', area: swingCone }],
    keys: [
      [0, 'lin', { tell: 1 }],
      [0.8, 'io', { lean: -0.22, rf: -SW.back, ru: SW.up, tell: 1 }],
      [0.86, 'out', { tell: 0, dark: 1 }],
      [1.3, 'io', { lean: -0.25, rf: -SW.back - 0.03, ru: SW.up + 0.07 }],
      [1.55, 'lin', { lean: 0.28, rf: SW.through, ru: 0, dark: 0 }], // (the sweep: its middle, 1.425, the strike)
      [1.975, 'io', REST],
    ],
    kicks: [{ at: 1.425, sack: [0.5, -0.9] }],
  },
};

/** The strings, each a row on the sparring circle's lectern: moves and pauses (Strawman standing still, a breath to reset), played in
 *  order on a loop while the Courier is inside the circle. The labels and lines are placeholders for Espada's. */
export const STRAWMAN_STRINGS = {
  footwork: {
    label: 'Footwork', line: 'Jab, jab, swing: the same window after a short tell and a long one.',
    steps: [{ move: 'jab' }, { pause: 1.0 }, { move: 'jab' }, { pause: 1.0 }, { move: 'swing' }, { pause: 1.6 }],
  },
  oneTwoChop: {
    label: 'One-two, chop', line: 'Two parries 0.4 s apart, then the long punish of the chop.',
    steps: [{ move: 'oneTwo' }, { pause: 0.6 }, { move: 'overheadChop' }, { pause: 1.6 }],
  },
  mixUp: {
    label: 'The mix-up', line: 'Two swings and a delayed swing, in a random order: read the hold.',
    steps: [{ move: 'swing' }, { pause: 1.2 }, { move: 'delayedSwing' }, { pause: 1.2 }, { move: 'swing' }, { pause: 1.6 }], shuffle: true,
  },
  keepOut: {
    label: 'Keep out', line: 'Inside 1.6 m the hat-butt, beyond it the spin sweep: jump it or parry it.',
    steps: [{ keepOut: 1.6 }, { pause: 0.8 }], // (the hat-butt within that many metres of its ball, else the spin sweep)
  },
};
export const KEEP_OUT = { near: 'hatButt', far: 'spinSweep' };

const EASE = {
  lin: (u) => u,
  io: (u) => u * u * (3 - 2 * u),
  in: (u) => u * u,
  out: (u) => 1 - (1 - u) * (1 - u),
};
const full = new WeakMap(); // (each key's whole pose, every channel carried from the key before it: worked out once a move)
function fullKeys(M) {
  let F = full.get(M);
  if (F) return F;
  let prev = REST;
  F = M.keys.map(([t, ease, pose]) => { prev = { ...prev, ...pose }; return { t, e: EASE[ease] || EASE.io, p: prev }; });
  if (F[0].t > 0) F.unshift({ t: 0, e: EASE.lin, p: REST });
  full.set(M, F);
  return F;
}
/** A move's pose at t seconds (every channel, into `out`): between two keys, eased by the later key's curve; past the last, the last. */
export function poseAt(M, t, out = {}) {
  const F = fullKeys(M);
  let k = 1;
  while (k < F.length && F[k].t <= t) k++;
  if (k >= F.length) { Object.assign(out, F[F.length - 1].p); return out; }
  const a = F[k - 1], b = F[k], u = b.e(Math.min(1, Math.max(0, (t - a.t) / Math.max(1e-6, b.t - a.t))));
  for (const c of CHANNELS) out[c] = a.p[c] + (b.p[c] - a.p[c]) * u;
  return out;
}

/** How far an area reaches from Strawman's ball (m). */
export const reachOf = (A) => (A.shape === 'circle' ? A.radius : A.shape === 'lunge' ? A.reach : A.length);
/** Is a point inside an area, given how far it lies along the facing and across it (m): the same shapes the Figment attack telegraph
 *  draws (vfx/figmenttelegraph/figmenttelegraphshapes.js: a lunge and a line are a strip from the feet, a cone a wedge, a circle a disc). */
export function inArea(A, along, across) {
  const d = Math.hypot(along, across);
  if (A.shape === 'circle') return d <= A.radius;
  if (A.shape === 'cone') return d <= A.length && Math.atan2(Math.abs(across), along) <= ((A.degrees / 2) * Math.PI) / 180;
  const len = A.shape === 'lunge' ? A.reach : A.length;
  return along >= 0 && along <= len && Math.abs(across) <= A.width / 2;
}
