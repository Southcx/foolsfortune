// ---------------------------------------------------------------------------------------
// THE FIGHTER KIT'S MOVE GEOMETRY AND KEY POSES (docs/plans/FIGHTER.md 2, 4, 6; KEY-POSES.md 2): what platformfighter.js's MOVES do not
// carry, as data. The rules and frame data stay there (damage, angles, knockback, startup, active, total, landing lag, auto-cancel,
// charge); here is where each move's hit boxes stand off the body, which of the controls table's inputs picks it, and what the drawn body
// shows for it. Gameplay reads the move's data and these boxes, never the drawn pose (KEY-POSES.md 2).
//   BOXES     a move's hit boxes: spheres [ox, oy, r] in metres for a body BODY m tall, ox along the facing, oy up from the feet; scaled
//             by the fighter's own height. Ours (Melee's are in its units on its rigs): each laid where the Courier's clip strikes
//   POSES     the Courier's clip for each move (an existing clip of the suite: UAL, the Fist_ set, the tools' sets) and the limb its
//             strike is measured on (tools/melee.js measureSwing); the three key poses (lead, strike, follow) are read off it
//   HOLDS     the Courier's held pose for every other kit state (a clip and a time, or a span played through the state, or a loop)
//   FOE_POSES the straw fighters' moves as Strawman's own (vfx/strawmanmoves.js: it has no skeleton), and its strike's moment
//   pick*     the controls table (FIGHTER.md 2): a stick and a button to a move id
//   KIT       the numbers the kit needed that platformfighter.js does not give, each ours and said why
//
// Prior art: Melee's hit bubbles (spheres off a bone, the decomp's ftHit) and its control scheme read as a table (SmashWiki, Controls);
// Super Smash Bros. Ultimate's training mode's hitbox view; Sakurai's three-beat attack (lead-in, impact, recovery).
//
//   BOXES[id] -> [[ox, oy, r]]   POSES[id] -> { clip, limb }   HOLDS[state] -> { clip, at | span | loop }   FOE_POSES[id] -> { move, at }
//   pickGround(I, F) / pickAir(I, F) / pickSmash(I, F) / pickSpecial(I, F) -> move id   dirOf(I, F) -> 'fwd'|'back'|'up'|'down'|null   KIT
// ---------------------------------------------------------------------------------------

/** The height the boxes are laid for (the Courier standing: courier/player/capsule.js's capsule, 1.7 m). */
export const BODY = 1.7;

/** Each move's hit boxes. Numbers ours (a move's reach is where the Courier's clip strikes, laid by eye on the contact sheet of
 *  its key poses); the specials' boxes are placeholders until their looks are built. */
export const BOXES = {
  jab1: [[0.62, 1.2, 0.32]], jab2: [[0.66, 1.15, 0.32]], jab3: [[0.78, 0.8, 0.38]],
  ftilt: [[0.82, 0.85, 0.4]], utilt: [[0.25, 1.85, 0.42], [0.5, 1.45, 0.32]], dtilt: [[0.85, 0.22, 0.38]],
  dash: [[0.78, 0.9, 0.44]],
  fsmash: [[0.98, 1.0, 0.46]], usmash: [[0.1, 2.0, 0.52]], dsmash: [[0.82, 0.22, 0.42], [-0.82, 0.22, 0.42]],
  nair: [[0.45, 0.85, 0.52]], fair: [[0.72, 1.05, 0.46]], bair: [[-0.78, 0.85, 0.44]], uair: [[0.1, 1.95, 0.5]], dair: [[0.1, -0.05, 0.46]],
  nspecial: [], // (a shot: projectiles.js carries its own box)
  sspecial: [[0.7, 1.0, 0.3], [1.4, 1.0, 0.3], [2.1, 1.0, 0.3], [2.8, 1.0, 0.3]], // (the hook's line, a tether's reach)
  uspecial: [[0.3, 1.7, 0.44]], dspecial: [[0, 0.9, 0.8]], bspecial: [[-0.8, 1.0, 0.45]],
  ledgeAttack: [[0.85, 0.5, 0.46]], getupAttack: [[0.85, 0.3, 0.5], [-0.85, 0.3, 0.5]],
};
/** The grab's box (GRAB.reach is its farthest point: 1.2 m). */
export const GRAB_BOX = [0.68, 1.0, 0.52];

/** The Courier's clip for each move, and the limb its strike is measured on ('auto': whichever moves fastest, melee.js). The
 *  specials take the tools' verbs' clips: the psygun's shot, the Sondelass's cast for the hook, the Crucibelle's toll. */
export const POSES = {
  jab1: { clip: 'Fist_Combo1', limb: 'auto' }, jab2: { clip: 'Fist_Combo2', limb: 'auto' }, jab3: { clip: 'Fist_Combo3', limb: 'auto' },
  ftilt: { clip: 'Fist_Kick', limb: 'auto' }, utilt: { clip: 'Fist_Uppercut', limb: 'auto' }, dtilt: { clip: 'Fist_Sweep', limb: 'auto' },
  dash: { clip: 'Fist_FlyingKick', limb: 'auto' },
  fsmash: { clip: 'Fist_Roundhouse', limb: 'auto' }, usmash: { clip: 'Fist_Uppercut', limb: 'auto' }, dsmash: { clip: 'Fist_Sweep', limb: 'auto' },
  nair: { clip: 'Fist_Kick', limb: 'auto' }, fair: { clip: 'Fist_Combo3', limb: 'auto' }, bair: { clip: 'Fist_Roundhouse', limb: 'auto' },
  uair: { clip: 'Fist_Uppercut', limb: 'auto' }, dair: { clip: 'Fist_GroundPound', limb: 'auto' },
  nspecial: { clip: 'Gun_Shoot', limb: 'R' }, sspecial: { clip: 'Sond_Cast', limb: 'R' }, uspecial: { clip: 'Fist_Uppercut', limb: 'auto' },
  dspecial: { clip: 'Bell_Toll', limb: 'R' },
  grab: { clip: 'Fist_Shove', limb: 'auto' }, pummel: { clip: 'Fist_Combo1', limb: 'auto' },
  fthrow: { clip: 'Fist_Shove', limb: 'auto' }, bthrow: { clip: 'Fist_Roundhouse', limb: 'auto' }, uthrow: { clip: 'Fist_Uppercut', limb: 'auto' },
  dthrow: { clip: 'Fist_GroundPound', limb: 'auto' },
  ledgeAttack: { clip: 'Fist_Sweep', limb: 'auto' }, getupAttack: { clip: 'Fist_Sweep', limb: 'auto' },
};

/** The Courier's pose for every other state: `at` a held frame (s), `span` [t0, t1] played across the state's frames, `loop` played on
 *  at 1x. The jumpsquat and the landing are held crouches (KEY-POSES.md 5); hitlag holds whatever the body was (pose.js). */
export const HOLDS = {
  jumpsquat: { clip: 'crouchIdle', at: 0.3 }, land: { clip: 'crouchIdle', at: 0.3 },
  shield: { clip: 'Sond_Block', at: 0.45 }, shieldstun: { clip: 'Sond_Block', at: 0.5 }, shielddrop: { clip: 'Sond_Block', span: [0.6, 1.1] },
  spotdodge: { clip: 'crouchIdle', at: 0.8 }, roll: { clip: 'roll', span: [0, 1.4] }, airdodge: { clip: 'Air_AirDash', span: [0.05, 0.7] },
  fall: { clip: 'Air_FallLoop', loop: true }, hitstun: { clip: 'Sond_HitReact', at: 0.22 }, tumble: { clip: 'Skiff_Bail', loop: true },
  tech: { clip: 'crouchIdle', at: 0.3 }, techroll: { clip: 'roll', span: [0, 1.4] },
  down: { clip: 'Loco_CrawlProne', at: 0 }, getup: { clip: 'Loco_CrawlExit', span: [0, 0.66] }, getuproll: { clip: 'roll', span: [0, 1.4] },
  ledge: { clip: 'Trav_LedgeHang', loop: true }, ledgeclimb: { clip: 'Trav_LedgeClimbUp', span: [0, 1.3] }, ledgeroll: { clip: 'roll', span: [0, 1.4] },
  ledgejump: { clip: 'Air_JumpStart', span: [0.1, 0.6] },
  hold: { clip: 'Fist_Shove', at: 0.32 }, held: { clip: 'Sond_HitReact', at: 0.18 }, release: { clip: 'Sond_HitReact', at: 0.4 },
  broken: { clip: 'Skiff_Bail', loop: true }, dizzy: { clip: 'Loco_IdleLookAround', loop: true },
};

/** The straw fighters' moves as Strawman's (vfx/strawmanmoves.js), and the moment of its strike there (s): the doll has no skeleton, so
 *  its key poses are read off its own moves at lead, strike and follow around `at`. */
export const FOE_POSES = {
  jab: { move: 'jab', at: 0.75 }, swing: { move: 'swing', at: 0.925 }, hat: { move: 'hatButt', at: 0.75 }, spin: { move: 'spinSweep', at: 0.85 },
  chop: { move: 'overheadChop', at: 1.15 },
};
export const FOE_POSE_OF = {
  jab1: 'jab', jab2: 'jab', jab3: 'jab', ftilt: 'jab', dash: 'jab', fair: 'jab', nspecial: 'jab', sspecial: 'jab', grab: 'jab', pummel: 'jab', fthrow: 'jab',
  fsmash: 'swing', bthrow: 'swing', ledgeAttack: 'swing',
  utilt: 'hat', usmash: 'hat', uair: 'hat', uspecial: 'hat', uthrow: 'hat',
  dtilt: 'spin', dsmash: 'spin', nair: 'spin', bair: 'spin', dspecial: 'spin', getupAttack: 'spin',
  dair: 'chop', dthrow: 'chop',
};

/** The two blows platformfighter.js's MOVES do not list (Melee's floor and ledge attacks, Mario's, as near as the sources give: the
 *  ledge attack 8% under 100% and the getup attack 6%; their knockback ours, sending away from the stage), in MOVES' shape. */
export const KIT_MOVES = {
  ledgeAttack: { name: 'Ledge attack', from: 'Mario (Melee), ours for its knockback', damage: 8, angle: 361, base: 40, growth: 40, startup: 1, active: [1, 4], total: 4 },
  getupAttack: { name: 'Getup attack', from: 'Mario (Melee), ours for its knockback', damage: 6, angle: 361, base: 60, growth: 40, startup: 17, active: [17, 21], total: 30 },
};

/** The numbers the kit chose (FIGHTER.md: "where nothing was found, the number is ours and marked so"), each with its reason. */
export const KIT = {
  dashTap: 14, // frames between two taps of A or D for a dash (Melee reads a smashed stick; a key's tap twice in about a quarter second)
  smashWindow: 8, // frames after a flick's second tap inside which LMB is its smash (Melee reads the stick's smash within about 3 frames of the A; a key's second tap and a click are two fingers, so more)
  stick: 0.3, // the stick's share past which a direction counts (Melee's tilt threshold, 0.2875)
  jumpH: 0.8, // the jump's sideways speed off the stick, a share of the walk (Melee gives each character its own; ours keeps the run's)
  hopKeep: 0.6, // the share of the ground's speed a jump keeps (Melee's jump momentum multiplier is 0.6 to 0.8 a character)
  landSpecial: 10, // special fall's landing lag (the air dodge's 10: Melee's varies by move)
  grabRelease: 30, grabPush: 2.4, // a grab broken out of: the grabber's lag (frames) and the push (m/s) on both (Melee's release is about 30)
  pummelAt: 8, // the pummel's hit frame within its 24
  tether: 3.0, // the hook's ledge reach (m): the line's last box and a little
  recover: 1.3, recoverX: 1.6, // the up special's rise (x the jump's velocity: about two jumps' height) and its drift (m/s)
  shot: { speed: 13, life: 70, r: 0.2, reflectSpeed: 1.25, reflectDamage: 1.5 }, // the psygun's shot (m/s, frames, m) and a reflected one's (Fox's reflector)
  reflect: [1, 20], // the toll's reflecting frames (Fox's reflector holds while the button does; ours is a window)
  shieldR: [0.38, 0.95], // the shield's radius at none and at full (m): Melee shrinks it with its health
  pushback: [0.8, 0.09], // a shielded hit's pushback, m/s + per % (Melee's is (0.195d + 1.6) x 0.6 units a frame, about this here)
  techIntan: 20, // frames a tech is intangible (Melee's tech in place: 1 to 20)
  techNear: 1.6, // m over the floor under it inside which a tumbling body's Shift is the tech, not an air dodge (Melee's 20-frame window at the fall's speed)
  downBounce: 26, downMax: 120, // a missed tech: frames bouncing before a getup can be chosen, and lying before standing anyway
  getupAttackAt: [17, 21], // the getup attack's active frames, out of TECH.getup.attack's 30
  ledgeJump: 12, // frames the ledge jump takes to rise over the edge before it leaves as a jump
  ledgeUp: 0.7, // the share of a ledge getup the body is moving onto the stage (the rest is its recovery)
  getupIntan: 0.66, // the share of a getup (ledge or floor) that is intangible (Melee's: most of the way)
  ledgeAttackAt: 0.6, // where a ledge attack's hit is out (a share of its frames)
  catchBox: [0.15, 1.05, -0.55, 0.65], // the ledge catch: out from the corner (m, near and far) and the body's top from the corner's height
  dead: 60, respawnHold: 300, invincible: 120, respawnUp: 4.2, // frames out after a KO, at most on the platform, invincible after it; the platform's height (m)
  breakUp: 9, // a broken shield's launch (m/s up: Melee's is a big pop)
  smashFlash: 0.5, // the charging smash's glow (the pose's)
  shake: [0.07, 0.05], // hitlag's shake of the drawn body at its start (m): side to side on the ground, up and down in the air (KEY-POSES.md 3)
  credit: 6, // real s after a blow the Courier keeps a KO's credit (dummy.js's)
};

const DIRS = { fwd: 'fwd', back: 'back', up: 'up', down: 'down' };
/** The stick read against the facing: up and down win over the side (Melee's tilt angles, a diagonal up is an up). */
export function dirOf(I, F) {
  const t = KIT.stick, ax = Math.abs(I.x), ay = Math.abs(I.y);
  if (ay > t && ay >= ax * 0.8) return I.y > 0 ? DIRS.up : DIRS.down;
  if (ax > t) return Math.sign(I.x) === F.face ? DIRS.fwd : DIRS.back;
  return null;
}
/** LMB on the ground: running, the dash attack; up, the up tilt; down or crouched, the down tilt; a side, the forward tilt (turned that way). */
export function pickGround(I, F) {
  if (F.running) return 'dash';
  const d = dirOf(I, F);
  if (d === 'up') return 'utilt';
  if (d === 'down' || F.crouch) return 'dtilt';
  if (d === 'fwd' || d === 'back') return 'ftilt';
  return 'jab1';
}
/** LMB in the air (a smash's flick there is an aerial too): by the stick against the facing (no turning in the air). */
export function pickAir(I, F) {
  const d = dirOf(I, F);
  return d === 'fwd' ? 'fair' : d === 'back' ? 'bair' : d === 'up' ? 'uair' : d === 'down' ? 'dair' : 'nair';
}
/** A flick and LMB on the ground (FIGHTER.md 8): the smash the held way (none held: forward). */
export function pickSmash(I, F) {
  const d = dirOf(I, F);
  return d === 'up' ? 'usmash' : d === 'down' ? 'dsmash' : 'fsmash';
}
/** RMB: neutral, side (turned that way on the ground), up, down; away from the facing, the back special where the kit has one
 *  (progress/fightertoolkits.js: the five specials), else the side special turned. */
export function pickSpecial(I, F) {
  const d = dirOf(I, F);
  if (d === 'back' && F.kit?.moves?.bspecial) return 'bspecial';
  return d === 'up' ? 'uspecial' : d === 'down' ? 'dspecial' : d ? 'sspecial' : 'nspecial';
}
/** Which throw the held way picks, against the grabber's facing. */
export function pickThrow(d) { return d === 'back' ? 'bthrow' : d === 'up' ? 'uthrow' : d === 'down' ? 'dthrow' : 'fthrow'; }
