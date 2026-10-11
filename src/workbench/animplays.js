// ---------------------------------------------------------------------------------------
// THE ANIM LAB'S PLAYS: everything the Anim Lab can play on its Courier (workbench/animrig.js), as a list, and how each is driven: the
// way the game drives it, through the game's own interfaces, never by setting a pose.
//
//   STANCE   the body's state held (the idle A and its B, the walk, the run, the sprint, the crouch, the prowl, the belly crawl, the drawn
//            run and sprint): the stance's speed is the core movement's wish (the pinned body's treadmill), its posture C's
//   MOVE     a move of the tool in the hands, begun through its own combo engine (tools/moveset.js `begin(id, kind, n)`, `special(dir)`)
//            or pressed on the lab's keys where the game reads a hold (the charge, the guard, the iaido and blade mode, the counter,
//            ADS); with nothing in the hands, the kick's moveset. Read off the engine, so a tool's new move is listed with no line here:
//            each ground string slot (the loadout's), the pause strings, the launcher, the air string, the dash, the charge, the
//            specials (the loadout's slots, and R's), and every other move of its table
//   EMOTE    every emote (courier/emotes.js), asked of the emote tech as /wave asks it; a loop or a hold left by a step (W), as a person
//            leaves it
//   CLIP     any clip of the suite by name, raw: sampled onto the bones as captured (no layers, no IK), the tool in the hand still
//            carried by it
//
// A play: { kind, id, grp, label, tool? ('sondelass:cutlass': the drawn run's), pin: { y, speed, posture }, drive: [[s, fn(R)]],
// len? (s, or until it is over), min?, clip? }. Prior art: Unreal's Persona asset browser and its preview of a montage section by name;
// a fighting game's training mode move list (every move of the character, played on the dummy on its own).
//
//   playsFor(R) -> [play]    (R: the AnimRig, its tool worn: what it can play now)       quiet(R) -> bool (nothing is playing)
// ---------------------------------------------------------------------------------------
import { T } from '../core/config.js';
import { EMOTES } from '../courier/emotes.js';

const tap = (code) => (R) => R.keys.tap(code);
const hold = (code, on = true) => (R) => R.keys.hold(code, on);
const AIR = 1.6; // (m: where an air blow is begun over the floor, as after a jump)

/** Nothing of the take is playing any more: no move, no carry, no stance of a tool's own easing out, no emote fading. */
export function quiet(R) {
  const M = R.moveset, t = R.tool, W = R.own.weapon;
  if (M?.busy || M?.playing || M?.drop) return false;
  if (R.techs.active || (R.techs.get('launch')?.w || 0) > 0.02) return false;
  if (t?.cutlass?.playing || t?.club?.playing || R.techs.get('emote')?.tail) return false;
  if (W && (W.moves.busy || W.moves.weight > 0.01 || W.reloading)) return false;
  return true;
}

const STANCES = [
  { id: 'idleA', label: 'idle A (one loop)', len: 'loop' },
  { id: 'idleB', label: 'idle B (a break: empty-handed only)', drive: [[0, (R) => { R.rig.idles.stillT = 1e3; }]], len: null, min: 1, idle: (R) => !R.rig.idles.playing }, // (its still spell counted out at once)
  { id: 'walk', label: `walk (${T.movement.walkSlowSpeed} m/s)`, speed: T.movement.walkSlowSpeed, len: 2.4 },
  { id: 'run', label: `run (${T.movement.walkSpeed} m/s)`, speed: T.movement.walkSpeed, len: 2 },
  { id: 'sprint', label: `sprint (${T.movement.sprintSpeed} m/s)`, speed: T.movement.sprintSpeed, len: 2 },
  { id: 'crouch', label: 'crouch', posture: 'crouch', len: 3 },
  { id: 'prowl', label: `the prowl (${T.movement.crouchSpeed} m/s)`, posture: 'crouch', speed: T.movement.crouchSpeed, len: 2.5 },
  { id: 'crawl', label: `the belly crawl (${T.movement.proneSpeed} m/s)`, posture: 'prone', speed: T.movement.proneSpeed, len: 3 },
  { id: 'drawnRun', label: 'the drawn run (the cutlass)', tool: 'sondelass:cutlass', speed: T.movement.walkSpeed, len: 2 },
  { id: 'drawnSprint', label: 'the drawn sprint (the cutlass)', tool: 'sondelass:cutlass', speed: T.movement.sprintSpeed, len: 2 },
];

/** The moves of the tool in the hands (or the kick's), read off its combo engine; then the tool's own (the cutlass's, the psygun's). */
function moves(R) {
  const M = R.moveset, out = [], seen = new Set();
  if (!M) return ownMoves(R, seen); // (the rod and the hook: their own, no string)
  const S = M.S.strings || {}, clip = (id) => M.def(id)?.clip || '';
  const add = (grp, key, id, label, drive, extra = {}) => { seen.add(id); out.push({ kind: 'move', grp, id: `move:${key}`, label: `${label}  (${clip(id)})`, drive, ...extra }); }; // (`key`: the slot, stable whatever it holds)
  M.string.forEach((id, i) => add('the string', `string.${i + 1}`, id, `${i + 1}: ${id}`, [[0, () => M.begin(id, 'ground', i)]]));
  for (const b of M.branches()) b.to.forEach((id, j) => add('the pause strings', `pause.${b.at + 1}.${j + 1}`, id, `after ${b.at + 1}, ${j + 1}: ${id}`, [[0, () => M.begin(id, 'pause', j)]]));
  if (S.launcher) add('the launcher and the air', 'launcher', S.launcher, `launcher: ${S.launcher}`, [[0, () => M.begin(S.launcher, 'launcher')]]);
  (S.air || []).forEach((id, i) => add('the launcher and the air', `air.${i + 1}`, id, `air ${i + 1}: ${id}`, [[0, () => M.begin(id, 'air', i)]], { pin: { y: AIR } }));
  if (S.dash) add('the dash', 'dash', S.dash, `the dash: ${S.dash}`, [[0, () => M.begin(S.dash, 'dash')]]);
  if (S.charge) { // (held as the game reads it: the opener held past its hold, the hold looping, let go into the release)
    const B = M.S.button || 'Mouse0';
    seen.add(S.charge.hold); if (S.charge.release) seen.add(S.charge.release);
    out.push({ kind: 'move', grp: 'the charge', id: 'move:charge', label: `the charge: ${S.charge.hold} held 1.2 s, ${S.charge.release || 'let go'}  (${clip(S.charge.hold)})`, drive: [[0, hold(B)], [1.2, hold(B, false)]] });
  }
  const sp = M.loadout?.specials;
  if (sp) for (const dir of ['tap', 'forward', 'back']) { const r = M.specialOf(dir); if (r && (dir === 'tap' || sp[dir])) { seen.add(r.id); out.push({ kind: 'move', grp: 'the specials', id: `move:special.${dir}`, label: `special (${dir}): ${r.id}  (${r.clip || ''})`, drive: [[0, () => M.special(dir)]] }); } }
  if (S.special) add('the specials', 'special.R', S.special, `special (R): ${S.special}`, [[0, () => M.begin(S.special, 'special')]]);
  out.push(...ownMoves(R, seen));
  for (const id of Object.keys(M.table)) if (!seen.has(id)) add('other moves', `other.${id}`, id, id, [[0, () => M.begin(id, 'move')]]);
  return out;
}

/** The moves a tool keeps for itself, beside its engine: the cutlass's RMB and V, the psygun's aim, draw, rack and flourish. */
function ownMoves(R, seen) {
  const out = [], t = R.tool, add = (grp, id, label, drive, extra = {}) => out.push({ kind: 'move', grp, id: `move:${id}`, label, drive, ...extra });
  if (R.toolId === 'sondelass' && R.form === 'cutlass' && t?.cutlass) {
    const crouch = { posture: 'crouch' };
    seen.add('iai'); seen.add('spin');
    add('the cutlass', 'iaido', 'the iaido\'s charge (crouched, RMB held: its pose)', [[0, hold('Mouse2')]], { pin: crouch, len: 0.45 });
    add('the cutlass', 'drawcut', 'the draw cut (the iaido let go at 0.3 s)  (Sond_Combo2)', [[0, hold('Mouse2')], [0.3, hold('Mouse2', false)]], { pin: crouch });
    add('the cutlass', 'blademode', 'blade mode\'s stance (the iaido held through its charge)  (Sond_ChargeHold)', [[0, hold('Mouse2')], [1.5, hold('Mouse2', false)]], { pin: crouch });
    add('the cutlass', 'guard', 'the guard (V held 1.2 s)  (Sond_Block)', [[0, hold('KeyV')], [1.2, hold('KeyV', false)]]);
    add('the cutlass', 'parry', 'the parry (V as a shot comes in: the deflect)  (Sond_Parry)', [[0, (R) => R.shoot({ from: 1.4, speed: 7 })], [0.05, hold('KeyV')], [0.6, hold('KeyV', false)]]); // (met in the guard's first 0.28 s: cutlass.js guardUpdate, courier/parry.js deflect)
    add('the cutlass', 'counter', 'the counter (V, then LMB)  (Sond_SpinSlash)', [[0, hold('KeyV')], [0.4, tap('Mouse0')], [0.45, hold('KeyV', false)]]);
  }
  if (R.toolId === 'sondelass' && R.form === 'rod') add('the rod', 'cast', 'the cast (LMB held 0.8 s, let go)  (Sond_CastIdle, the cast)', [[0, hold('Mouse0')], [0.8, hold('Mouse0', false)]], { len: 2.4 });
  if (R.toolId === 'sondelass' && R.form === 'hook') add('the hook', 'grapnel', 'the grapnel fired (LMB: nothing to bite here)', [[0, tap('Mouse0')]], { len: 1.6 });
  if (R.toolId === 'psygun' && R.own.weapon) {
    const W = R.own.weapon;
    add('the psygun', 'ads', 'aim down the sights (RMB held 1.5 s)', [[0, hold('Mouse2')], [1.5, hold('Mouse2', false)]]);
    add('the psygun', 'quickdraw', 'put away and drawn again (X, X): the quick draw  (Gun_QuickDraw)', [[0, tap('KeyX')], [0.5, tap('KeyX')]], { min: 1 });
    add('the psygun', 'rack', 'the rack  (Gun_Reload)', [[0, () => W.startRack()]]);
    add('the psygun', 'flourish', 'a shot, then the flourish  (Gun_Shoot, Gun_Twirl)', [[0, () => W.moves.shot()], [0.4, () => W.moves.flourish(R.body)]]);
  }
  return out;
}

const emotes = () => Object.entries(EMOTES).map(([id, E]) => ({
  kind: 'emote', grp: `emote: ${E.family}`, id: `emote:${id}`, label: `/${id}`, max: 16,
  drive: [[0, (R) => R.techs.get('emote').request(id)], ...(E.loop || E.hold ? [[E.loop ? 4 : 3, tap('KeyW')]] : [])], // (a loop or a hold left by a step, through its way out)
}));

/** Everything the rig can play now (its tool worn): the stances, the tool's moves, the emotes, every clip. */
export function playsFor(R) {
  const C = R.rig.clips.clips;
  return [
    ...STANCES.map((s) => ({ kind: 'stance', grp: 'stances', ...s, id: `stance:${s.id}`, pin: { speed: s.speed || 0, posture: s.posture || 'stand' } })),
    ...moves(R),
    ...emotes(),
    ...Object.keys(C).sort().map((n) => ({ kind: 'clip', grp: 'clips (raw)', id: `clip:${n}`, label: n, clip: n })),
  ];
}
