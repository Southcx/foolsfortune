// ---------------------------------------------------------------------------------------
// THE FIGHTER KIT'S MOVES BY THE TOOL IN HAND (South, 2026-11-01, through Calissa: "synergize the existing melee weapon combos with
// the two button system of Super Smash Bros and its attack button and special button ... You have my permission to come up with new
// moves and chains to facilitate testing the movekits"; FIGHTER.md 8). In the Arena, the tool in the hands decides what fills each of
// the kit's slots (jab .. down special). The slot ids stay platformfighter.js's, so the kernel, the picks and the key poses stay keyed
// as they are; a tool fills the slots it has moves for, and the rest stay the bare set's (Mario's).
//
// HOW A TOOL'S MOVE BECOMES A SLOT (one rule for every tool, so a new move in combat/moves.js arrives in the Arena by itself):
//   damage    5% a power (Mario's jab is 3% and the bare fist's combo1 is 0.6 power: 3 / 0.6); a multi-hit's power is each hit's
//   frames    the slot's shape is Mario's (when its blow comes out, how long it stays out, its landing lag, its auto-cancel), stretched
//             to the tool's move's own length (its `time` x 60 frames): a slow tool keeps a slot's feel and takes its own time over it
//   knockback the slot's angle and growth (Mario's), its base by the move's status: a launcher's lift sends up (angle 88), a trip
//             sends low (angle 20), a stagger keeps the slot's; a move's own `shatter` rides along for the vessel's rule (SUBSTRATE.md F5b)
//   reach     the slot's boxes pushed out along the facing by the tool's reach (a blade's 1.35 x the fist's)
//   open      every move of the tool in hand is open in the Arena, earned or not: it is a test room (STRAWMANS-WELL.md), and nothing the
//             kit lends is counted outside it (the Well's own events count its own)
// The cutlass's slots follow your melee loadout: the string's slots 1 to 3 are the jabs, slot 4 the forward tilt, the RMB specials
// (tapped, with W, with S) the neutral, up and down specials. The up special is always a recovery (special 'recover'): whatever fills
// it rises, as Fox's Firefox is a lunge aimed up. The brawler is a second bare set (Closers' J, Calissa's take): a rapid jab that loops
// while LMB is held and a finisher on its release (Ultimate's rapid jab), a rising uppercut and a dash straight.
//
// Prior art: Super Smash Bros. (the two buttons: attack and special, each by the stick's way; Melee's frame data, Mario's as the
// base); Ultimate's rapid jab and its finisher; Fox's Firefox (a directional lunge as the recovery); Samus's charge shot (a special
// held to charge); Marth's tipper and the Ice Climbers' reach (a tool changes a slot's reach, not its grammar); Closers' J (the brawler).
//
//   PCT   CAP   REACH[tool]   SLOTS[tool]   BRAWLER   RULE_TOOL[beltId]   kitFor(tool, { string, specials, variant }) -> { moves, reach, tool } | null
//   slotMove(slot, row, extra?) -> a move in platformfighter.js's shape
// ---------------------------------------------------------------------------------------
import { MOVES as BASE } from './platformfighter.js';
import { MOVES as RULES } from './combat/moves.js';

/** % a power (Mario's jab 3% on the bare fist's 0.6), and the most one blow may deal (Ganondorf's Warlock Punch, Melee's heaviest
 *  single blow, about 30%: the Tidecutter's 7 power would be 35). */
export const PCT = 5;
export const CAP = 30;

/** A tool's reach against the fist's: how far its boxes stand out along the facing (the blade's 0.7 m past the hand, the pole's
 *  1.05 m tip, the chain's coffin, the brush's head, the bell's mouth, the book's spine, the gun's butt). */
export const REACH = { sondelass: 1.35, dreamvane: 1.5, lockheart: 1.6, brush: 1.3, crucibelle: 1.1, veritome: 1.05, psygun: 1.0, unarmed: 1 };

/** The belt's tool ids to combat/moves.js's tables (the Soul Brush's moves are the brush's). */
export const RULE_TOOL = { sondelass: 'sondelass', soulbrush: 'brush', dreamvane: 'dreamvane', crucibelle: 'crucibelle', lockheart: 'lockheart',
  veritome: 'veritome', psygun: 'psygun' };

/** Each tool's slots: a slot -> its row in combat/moves.js (or `{ row, ...extra }`). The cutlass's jabs, forward tilt and specials come
 *  from the loadout (kitFor's `string` and `specials`); what is listed here are the rest. */
export const SLOTS = {
  sondelass: {
    utilt: { row: 'launcher' }, dtilt: { row: 'lowSweep' }, dash: { row: 'dash' },
    fsmash: { row: 'charge', shatter: 0.4 }, usmash: { row: 'risingCut' }, dsmash: { row: 'spinSlash' },
    nair: { row: 'air1' }, fair: { row: 'air2' }, bair: { row: 'backhand' }, uair: { row: 'quickSlash', angle: 80 }, dair: { row: 'plunge', angle: 290 },
    sspecial: null, // (the hook: the bare set's tether stays, the Sondelass's own hook form)
    dspecialEmpty: 'special', // (an empty S slot: the Tidecutter, the Sondelass mastered)
  },
  psygun: {
    jab1: { row: 'whip' },
    nspecial: { keep: true, charge: 1, chargeShot: true }, // (the shot as built, held to charge: Samus's charge shot)
    sspecial: { row: 'special', special: null }, // (Fan the Hammer: six shots' worth in one blow out front)
  },
  brush: {
    jab1: { row: 'combo1' }, jab2: { row: 'combo2' }, ftilt: { row: 'combo3' }, dash: { row: 'dash' }, dsmash: { row: 'spin' },
    nair: { row: 'air1' }, fair: { row: 'air2' }, uair: { row: 'air3', angle: 80 }, dair: { row: 'airSlam', angle: 290 },
  },
  dreamvane: {
    jab1: { row: 'combo1' }, jab2: { row: 'combo2' }, jab3: { row: 'combo3' }, ftilt: { row: 'pause3' }, utilt: { row: 'launcher' },
    fsmash: { row: 'charge', shatter: 0.4 }, nspecial: { row: 'special', special: null },
  },
  crucibelle: { jab1: { row: 'toll1' }, jab2: { row: 'toll2' }, ftilt: { row: 'toll3' }, nspecial: { row: 'feverPeak', special: null } },
  lockheart: { jab1: { row: 'flail1' }, jab2: { row: 'flail2' }, ftilt: { row: 'flail3' } },
  veritome: { jab1: { row: 'bash1' }, ftilt: { row: 'bash2' } },
};

/** The brawler (Closers' J): a second bare set. Numbers ours, each against Mario's: the jabs lighter and the barrage the damage; the
 *  uppercut a heavier up tilt; the straight a dash attack that sends out, not up. */
export const BRAWLER = {
  jab1: { name: 'Jab', from: 'the brawler (Closers\' J)', damage: 2, angle: 83, base: 0, growth: 50, startup: 2, active: [2, 3], total: 14 },
  jab2: { name: 'Jab 2', from: 'the brawler', damage: 2, angle: 83, base: 0, growth: 50, startup: 3, active: [3, 4], total: 16 },
  jab3: { name: 'Barrage', from: 'the brawler (Ultimate\'s rapid jab)', damage: 1, angle: 361, base: 5, growth: 20, startup: 4, active: [4, 7], total: 12, loop: [4, 7], every: 4, then: 'jabEnd' },
  jabEnd: { name: 'Barrage finisher', from: 'the brawler', damage: 5, angle: 361, base: 50, growth: 110, startup: 5, active: [5, 7], total: 30 },
  utilt: { name: 'Rising uppercut', from: 'the brawler', damage: 11, angle: 88, base: 40, growth: 100, startup: 6, active: [6, 10], total: 34 },
  dash: { name: 'Dash straight', from: 'the brawler', damage: 10, angle: 40, base: 60, growth: 70, startup: 7, active: [7, 11], total: 40 },
  uspecial: { name: 'Uppercut rising', from: 'the brawler (the recovery)', damage: 10, angle: 85, base: 35, growth: 70, startup: 4, active: [4, 9], total: 32, special: 'recover' },
  sspecial: { name: 'Straight lunge', from: 'the brawler (a 4 m lunge)', damage: 9, angle: 361, base: 45, growth: 60, startup: 9, active: [9, 16], total: 42, special: 'lunge', lunge: 4 },
};
/** The brawler's boxes the bare set has not got (its finisher's is a jab's, a step further). */
export const BRAWLER_BOXES = { jabEnd: [[0.82, 1.1, 0.42]] };

const STATUS_ANGLE = { airborne: 88, trip: 20 };
const r1 = (x) => Math.round(x * 10) / 10;

/** A tool's move (its combat/moves.js row) as the kit's slot: Mario's slot stretched to its length (see the header). */
export function slotMove(slot, row, extra = {}) {
  const B = BASE[slot]; if (!B || !row) return null;
  const n = Math.max(B.startup + 4, Math.round(row.time * 60)), k = n / B.total, f = (x) => Math.max(1, Math.round(x * k));
  const startup = extra.startup || f(B.startup), last = Math.max(startup, f(B.active[1]));
  const m = {
    ...B, name: extra.name || B.name, from: extra.from || `the ${extra.tool || 'tool'}'s ${extra.rowId || slot}`, damage: Math.min(CAP, r1((row.power || 0) * PCT)),
    startup, active: [startup, Math.min(n - 1, extra.activeFrames ? startup + extra.activeFrames - 1 : last)], total: n,
  };
  if (row.hits > 1) m.hits = row.hits; else delete m.hits;
  if (row.status && STATUS_ANGLE[row.status]) m.angle = STATUS_ANGLE[row.status];
  if (B.landing) { m.landing = f(B.landing); m.autoCancel = (B.autoCancel || []).map(([a, b]) => [f(a), b >= 99 ? 99 : f(b)]); }
  if (B.charge) m.charge = Math.min(startup - 1, f(B.charge));
  for (const key of ['angle', 'special', 'shatter', 'lunge']) if (key in extra) m[key] = extra[key];
  if (m.special == null) delete m.special;
  return m;
}

/** The kit's moves while `tool` (a belt id, or null for bare hands) is in hand: `string` the cutlass's loadout string as combat/moves.js
 *  rows (slots 1 to 4), `specials` its { tap, forward, back } as rows; `variant` the bare set's ('standard' | 'brawler'). Null when the
 *  bare set's standard is all there is (the kit reads platformfighter.js's MOVES as before). */
export function kitFor(tool, { string = null, specials = null, variant = 'standard' } = {}) {
  const rt = tool ? RULE_TOOL[tool] : null;
  if (!rt) return variant === 'brawler' ? { tool: 'unarmed', reach: 1, moves: { ...BRAWLER }, boxes: BRAWLER_BOXES } : null;
  const R = RULES[rt] || {}, S = SLOTS[rt] || {}, moves = {};
  const put = (slot, rowId, extra = {}) => { const m = slotMove(slot, R[rowId], { ...extra, tool: rt, rowId }); if (m) moves[slot] = m; };
  if (rt === 'sondelass') {
    const str = string || ['combo1', 'combo2', 'combo3', 'combo4'];
    ['jab1', 'jab2', 'jab3', 'ftilt'].forEach((slot, i) => str[i] && put(slot, str[i], slot === 'ftilt' ? { shatter: 0.25 } : {}));
    const sp = specials || { tap: 'stinger' };
    if (sp.tap) put('nspecial', sp.tap, sp.tap === 'stinger' ? { special: 'lunge', lunge: 8, activeFrames: 10 } : { special: null }); // (the stinger: its 8 m lunge over 10 frames)
    put('uspecial', sp.forward || sp.tap || 'stinger', { special: 'recover' }); // (the up special always recovers: the W slot, else the tap's aimed up)
    put('dspecial', sp.back || S.dspecialEmpty, sp.back ? { special: null } : { special: null, shatter: 0.3, startup: 108, activeFrames: 8 }); // (the Tidecutter's wave at its clip's 1.80 real s)
  }
  for (const [slot, def] of Object.entries(S)) {
    if (!def || typeof def !== 'object') continue;
    if (def.keep) { moves[slot] = { ...BASE[slot], ...(def.charge ? { charge: Math.max(1, BASE[slot].startup - 4) } : {}), chargeShot: !!def.chargeShot }; continue; }
    const { row, ...extra } = def; put(slot, row, extra);
  }
  for (const m of Object.values(moves)) if (m.lunge === undefined) delete m.lunge;
  return { tool: rt, reach: REACH[rt] || 1, moves };
}
