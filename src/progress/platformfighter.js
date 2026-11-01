// ---------------------------------------------------------------------------------------
// THE PLATFORM FIGHTER'S RULES (docs/plans/FIGHTER.md; South, 2026-10-31: "adding all the other SSBM-like and platform fighter mechanics
// to include a shield and grab and beyond ... there is more valuable information on implementation specifics from the SSBM community,
// considering the game has been decompiled"). Pure numbers and functions for Strawman's Well's fighter kit (world/strawmanwell/fighter/):
// knockback, launch and its decay, hitstun and tumble, hitlag, DI and SDI, the shield, the dodges, landing and the L-cancel, the tech, the
// grab, the ledge, staling, the smash charge, and the Courier's move list with its frame data.
//
// Every number is Super Smash Bros. Melee's, from its decompilation (doldecomp/melee: the formulas' structure and the order of a frame)
// and the community's measurements (SmashWiki, libmelee's characterdata.csv and stages.py, Magus420's stage data); FIGHTER.md cites each.
// Times are frames at 60 a real second (FRAME), as Melee counts them; a frame count turns into real seconds by `secs(n)`. Melee's
// distances are in its own units: speeds convert by SV, the Courier's jump velocity over Mario's (6.4 m/s over 2.3 units a frame), so a
// launch, a fall and a jump keep Melee's proportions to each other at the Courier's size; the stage's geometry is laid to the Courier's
// body instead (FIGHTER.md 5).
//
// Prior art: Super Smash Bros. Melee (all of it); Super Smash Bros. Brawl's and Ultimate's changes where named; Sakurai's Famitsu columns.
//
//   FRAME   SV   SA   secs(frames)   knockback({ percent, damage, weight, growth, base, set, crouch })   launchSpeed(kb)   LAUNCH
//   hitstun(kb)   tumbles(kb)   sakurai(kb, grounded)   hitlag(damage, { electric, crouch })   diAngle(angle, stick)   SDI
//   SHIELD   shieldstun(damage)   shieldDamage(damage)   DODGE   LANDING   lCancel(lag)   TECH   GRAB   grabHold(percent)   LEDGE
//   STALE   stale(damage, queue, move)   SMASH   charged(damage, frames)   MOVES { id: { name, from, damage, angle, base, growth,
//   startup, active: [a, b], total, landing?, autoCancel?, charge?, hits?, special? } }   koPercent(move, weight, distance)
//   SNAP   fillKeys(move, keys) -> the keys with hold, snap and active filled from the frame data (KEY-POSES.md 6)
// ---------------------------------------------------------------------------------------

/** A frame: Melee counts in frames at 60 a real second; everything here does too. */
export const FRAME = 1 / 60;
export const secs = (frames) => frames * FRAME;
/** Speed and acceleration: m/s per Melee unit a frame (the Courier's jump velocity over Mario's), and m/s² per unit a frame². */
export const SV = 6.4 / 2.3;
export const SA = SV * 60;

/** Knockback (SmashWiki, Knockback; the decomp's KNOCKBACK macro, ft/ftcoll.c): p the victim's percent AFTER the hit, d its damage,
 *  w its weight (100 = Mario), s the growth, b the base; a set-knockback hit uses p = 10 and d = the set value; a throw is weight-blind
 *  (w = 100). Capped at 2500. A crouching victim takes 2/3 (the crouch cancel). */
export function knockback({ percent = 0, damage = 0, weight = 100, growth = 100, base = 0, set = null, crouch = false, throwBlind = false }) {
  const p = set != null ? 10 : percent, d = set != null ? set : damage, w = throwBlind ? 100 : weight;
  let kb = ((p / 10 + (p * d) / 20) * (200 / (w + 100)) * 1.4 + 18) * (growth / 100) + base;
  kb = Math.min(2500, kb);
  return crouch ? (kb * 2) / 3 : kb;
}
/** The launch: speed KB x 0.03 units a frame, decaying 0.051 units a frame² along its direction (gravity still on), in m/s and m/s². */
export const LAUNCH = { perKB: 0.03, decay: 0.051 * SA, landStop: 0.5 }; // (landStop: a non-tumble launch under 0.5 units a frame lands into a 4-frame landing)
export const launchSpeed = (kb) => kb * LAUNCH.perKB * SV;
/** Hitstun: int(KB x 0.4) frames, at least 1. Tumble from 80 KB (32 frames). */
export const hitstun = (kb) => Math.max(1, Math.floor(kb * 0.4));
export const tumbles = (kb) => kb >= 80;
/** The Sakurai angle (361): 45° on an airborne victim; on the ground 0° under 32 KB, 44° from 32.1 (decomp ftCo_Damage_CalcAngle). */
export const sakurai = (kb, grounded) => (!grounded ? 45 : kb < 32 ? 0 : 44);

/** Hitlag (the freeze both bodies take at a hit): floor(floor(floor(d/3 + 3) x e) x c), electric 1.5 and crouching 2/3 on the victim,
 *  capped at 20 frames (SmashWiki, Hitlag; decomp ftCommon_CalcHitlag). A 15% hit freezes 8 frames. */
export function hitlag(damage, { electric = false, crouch = false } = {}) {
  return Math.min(20, Math.floor(Math.floor(Math.floor(damage / 3 + 3) * (electric ? 1.5 : 1)) * (crouch ? 2 / 3 : 1)));
}

/** DI, read on hitlag's last frame (decomp ftCo_8008E5A4): the launch turned by 18° x (the stick's part across it)², toward the stick.
 *  angle in degrees (0 = right, 90 = up), stick [x, y] in -1..1. Speed unchanged. */
export function diAngle(angle, [sx, sy]) {
  const a = (angle * Math.PI) / 180, kx = Math.cos(a), ky = Math.sin(a);
  const perp = ky * sx - kx * sy, cross = kx * sy - ky * sx;
  return angle + 18 * perp * perp * Math.sign(cross);
}
/** SDI: during hitlag, each new stick push nudges the body 6 units; on hitlag's end, ASDI nudges 3 (m here: units x SV/60). No SDI on
 *  a hitlag under 2 frames. */
export const SDI = { push: 6 * (SV / 60), asdi: 3 * (SV / 60), minHitlag: 2 };

/** The shield (SmashWiki, Shield and Shieldstun; decomp ftCo_Guard.c): 60 HP, a full press drains 0.28 a frame and a dropped shield
 *  regrows 0.07; an attack takes 0.7 x its damage; at 0 it breaks: HP back to 30, the body launched up and stunned (400 - percent) + 90
 *  frames. A powershield is a press in the 4 frames before a hit (2 for a projectile): no shield damage, a projectile sent back. Dropping
 *  a shield costs 15 frames; it is held 8 at least. */
export const SHIELD = { max: 60, drain: 0.28, regen: 0.07, takes: 0.7, reset: 30, breakStun: (percent) => Math.max(90, 400 - percent + 90), powershield: 4, powershieldShot: 2, drop: 15, minHold: 8 };
/** Shieldstun on a full shield: floor((d x 0.45 + 2) x 200/201), about 0.45d + 2 frames. */
export const shieldstun = (damage) => Math.floor((damage * 0.45 + 2) * (200 / 201));
export const shieldDamage = (damage) => damage * SHIELD.takes;

/** The dodges, frames: intangible [from, to] and total (Mario's and Fox's). The air dodge goes at a fixed speed the stick's way and
 *  slows each frame, into special fall; landing from it lags 10 frames; into the ground it is a wavedash (its sideways speed kept as the
 *  ground's, traction doubled above walk speed). The air dodge's own speed and decay are not in the sources: ours are chosen (FIGHTER.md). */
export const DODGE = {
  spot: { intangible: [2, 15], total: 22 },
  roll: { intangible: [4, 19], total: 31, distance: 2.6 }, // (distance: m, about a body and a half: a roll's reach in the Courier's size, ours)
  air: { intangible: [4, 29], total: 49, speed: 2.75 * SV, decay: 0.9, landing: 10 }, // (speed and decay: ours, a dodge of about 2.2 m, between Melee's Fox's and Mario's wavedash lengths)
};
/** Landing: 4 frames plain; an aerial's own lag halved by an L-cancel (a shield press up to 7 frames before landing); landing inside an
 *  aerial's auto-cancel window is the plain 4. */
export const LANDING = { plain: 4, lCancelWindow: 7 };
export const lCancel = (lag) => Math.floor(lag / 2);
/** The tech: a shield press up to 20 frames before hitting the floor or a wall, while tumbling: tech in place, or roll with the stick;
 *  a press locks another out for 40 frames; missed, a knockdown (getup options). */
export const TECH = { window: 20, lockout: 40, roll: 2.6, getup: { stand: 30, roll: 36, attack: 30 } }; // (getup frames: ours, Melee's floor options not found)
/** The grab: standing grab out on frames 7-8 of 30; the hold floor(76 + 1.6p) frames, each mash input 6 less; a pummel; four throws. */
export const GRAB = { startup: 7, active: [7, 8], total: 30, reach: 1.2, mash: 6, pummel: { damage: 3, total: 24 } };
export const grabHold = (percent) => Math.floor(76 + 1.6 * percent);
/** The ledge: caught facing it while falling, 7 frames to catch and 30 intangible after; a regrab locked 29 frames after letting go
 *  (Melee's: no penalty beyond that, so ledge stalling is allowed); held 11 real s at most under 100% (8 at 100%+). Getups (Fox's, under
 *  / over 100%): climb 34 / 59, jump 51, roll 49 / 79, attack 54 / 69 frames, each intangible most of the way. */
export const LEDGE = { catch: 7, intangible: 30, regrab: 29, maxHang: [11, 8], getup: { climb: [34, 59], jump: [51, 51], roll: [49, 79], attack: [54, 69] } };
/** Staling: the last 9 moves that hit; each copy of a move in the queue takes a share off its damage (the newest 0.09 .. the oldest
 *  0.01); a KO clears it. */
export const STALE = { size: 9, cut: [0.09, 0.08, 0.07, 0.06, 0.05, 0.04, 0.03, 0.02, 0.01] };
export function stale(damage, queue, move) {
  let k = 1; queue.forEach((m, i) => { if (m === move) k -= STALE.cut[i] || 0; });
  return damage * k;
}
/** A smash charged up to 60 frames: damage x 1.3671 at full, the share between in line. */
export const SMASH = { charge: 60, most: 1.3671 };
export const charged = (damage, frames) => damage * (1 + (SMASH.most - 1) * Math.min(1, frames / SMASH.charge));

/** The Courier's moves, frames at 60 a real second (Mario's in Melee unless said; the Courier is our Mario, movementprofiles.js). Each:
 *  damage %, angle (deg, 361 = Sakurai), base and growth knockback, startup (the first active frame), active [first, last], total,
 *  and for an aerial its landing lag and auto-cancel windows; `hits` for a multi-hit; `charge` for a smash; `special` for the specials
 *  (the kit's own behaviour). Where the Courier's move is its own (the tools' verbs), `from` says so. */
export const MOVES = {
  jab1: { name: 'Jab', from: 'Mario', damage: 3, angle: 83, base: 0, growth: 50, startup: 2, active: [2, 3], total: 15 },
  jab2: { name: 'Jab 2', from: 'Mario', damage: 2, angle: 83, base: 0, growth: 50, startup: 3, active: [3, 4], total: 18 },
  jab3: { name: 'Jab 3', from: 'Mario', damage: 5, angle: 361, base: 10, growth: 100, startup: 5, active: [5, 9], total: 22 },
  ftilt: { name: 'Forward tilt', from: 'Mario', damage: 10, angle: 361, base: 6, growth: 100, startup: 5, active: [5, 7], total: 32 },
  utilt: { name: 'Up tilt', from: 'Mario', damage: 8, angle: 96, base: 26, growth: 125, startup: 4, active: [4, 12], total: 30 },
  dtilt: { name: 'Down tilt', from: 'Mario', damage: 9, angle: 80, base: 10, growth: 100, startup: 5, active: [5, 8], total: 34 },
  dash: { name: 'Dash attack', from: 'Mario', damage: 9, angle: 110, base: 70, growth: 50, startup: 6, active: [6, 9], total: 48 },
  fsmash: { name: 'Forward smash', from: 'Mario', damage: 19, angle: 361, base: 25, growth: 95, startup: 12, active: [12, 16], total: 41, charge: 5 },
  usmash: { name: 'Up smash', from: 'Mario', damage: 15, angle: 83, base: 32, growth: 97, startup: 9, active: [9, 11], total: 39, charge: 7 },
  dsmash: { name: 'Down smash', from: 'Mario', damage: 16, angle: 361, base: 40, growth: 75, startup: 5, active: [5, 6], total: 37, charge: 3 },
  nair: { name: 'Neutral air', from: 'Mario', damage: 12, angle: 361, base: 10, growth: 100, startup: 3, active: [3, 6], total: 45, landing: 16, autoCancel: [[1, 2], [36, 99]] },
  fair: { name: 'Forward air', from: 'Mario', damage: 16, angle: 290, base: 10, growth: 80, startup: 18, active: [18, 22], total: 74, landing: 21, autoCancel: [[1, 2], [43, 99]] },
  bair: { name: 'Back air', from: 'Mario', damage: 14, angle: 361, base: 10, growth: 100, startup: 6, active: [6, 8], total: 28, landing: 15, autoCancel: [[1, 5], [19, 99]] },
  uair: { name: 'Up air', from: 'Mario', damage: 11, angle: 70, base: 15, growth: 100, startup: 4, active: [4, 9], total: 33, landing: 15, autoCancel: [[1, 1], [16, 99]] },
  dair: { name: 'Down air', from: 'Mario', damage: 2, angle: 70, base: 0, growth: 100, startup: 10, active: [10, 29], total: 38, landing: 23, autoCancel: [[1, 5], [33, 99]], hits: 7 },
  // the specials: the Courier's own verbs in the four special slots (the kit's behaviour; the numbers are its hit)
  nspecial: { name: 'Neutral special', from: 'the psygun\'s shot (Mario\'s fireball\'s timing)', damage: 5, angle: 361, base: 0, growth: 50, startup: 14, active: [14, 14], total: 43, special: 'shot' },
  sspecial: { name: 'Side special', from: 'the Sondelass\'s hook (a tether, Link\'s and Samus\'s grapple)', damage: 4, angle: 361, base: 20, growth: 40, startup: 10, active: [10, 18], total: 40, special: 'hook' },
  uspecial: { name: 'Up special', from: 'Mario\'s Super Jump Punch: the recovery, into special fall', damage: 9, angle: 80, base: 30, growth: 60, startup: 3, active: [3, 6], total: 30, special: 'recover' },
  dspecial: { name: 'Down special', from: 'the Crucibelle\'s toll (Fox\'s reflector\'s place: it sends shots back)', damage: 5, angle: 361, base: 40, growth: 50, startup: 1, active: [1, 4], total: 30, special: 'reflect' },
  // the throws (Mario's): weight-blind knockback, the victim let go on the release frame
  fthrow: { name: 'Forward throw', from: 'Mario', damage: 9, angle: 45, base: 60, growth: 65, startup: 12, active: [12, 12], total: 27, throw: true },
  bthrow: { name: 'Back throw', from: 'Mario', damage: 12, angle: 135, base: 80, growth: 65, startup: 12, active: [12, 12], total: 30, throw: true },
  uthrow: { name: 'Up throw', from: 'Mario', damage: 8, angle: 90, base: 70, growth: 72, startup: 18, active: [18, 18], total: 39, throw: true },
  dthrow: { name: 'Down throw', from: 'Mario', damage: 6, angle: 90, base: 75, growth: 30, startup: 12, active: [12, 12], total: 30, throw: true },
};

/** The percent at which a move sends a victim of this weight `distance` m (straight, gravity ignored): for laying a blast line where a
 *  fresh, fully charged forward smash KOs at about Melee's 110% from mid-stage (FIGHTER.md 5). */
export function koPercent(move, weight, distance) {
  for (let p = 0; p <= 999; p += 1) {
    const m = MOVES[move], d = m.charge ? charged(m.damage, SMASH.charge) : m.damage;
    const v = launchSpeed(knockback({ percent: p + d, damage: d, weight, growth: m.growth, base: m.base }));
    if ((v * v) / (2 * LAUNCH.decay) >= distance) return p;
  }
  return Infinity;
}

/** The key poses' timing from the frame data (KEY-POSES.md 6, 7): a fighter's key names only its pose; its hold, snap and active come
 *  from MOVES, so a contact sheet shows the rule's own timing. Keys named 'lead', 'strike', 'follow' take frames 1..startup-1, the
 *  active frames and the rest to `total`; each span is its snap (into the pose, at most SNAP's) and then its hold. A key with any other
 *  name keeps what it was given. For `registerKeys('fighter', KEYS, fillKeys)` (courier/anim/keyposes.js): cached, the same array a call. */
export const SNAP = { lead: 2, strike: 1, follow: 3 };
const _filled = new WeakMap();
export function fillKeys(move, keys) {
  const m = MOVES[move]; if (!m || !Array.isArray(keys)) return keys;
  const hit = _filled.get(keys); if (hit) return hit;
  const [a0, a1] = m.active, span = { lead: Math.max(0, m.startup - 1), strike: a1 - a0 + 1, follow: Math.max(0, m.total - a1) };
  const out = keys.map((k) => {
    const n = span[k.pose]; if (n == null) return k;
    const snap = Math.min(SNAP[k.pose], n);
    return { ...k, snap, hold: n - snap, active: k.pose === 'strike' };
  });
  _filled.set(keys, out); return out;
}
