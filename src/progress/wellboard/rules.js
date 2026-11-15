// ---------------------------------------------------------------------------------------
// THE WELL'S BOARD, ITS RULES (docs/plans/WELL-BOARD.md; ENDGAME.md 3.1): a Well run as a board game, a rules module in the table
// engine's shape (progress/casino/table.js: setup, pending, apply, result, view), so the same module is played in the Well, by bots
// headless (scripts/wellboard.mjs) and by an agent (every decision is a list of moves with ids).
//
// A TURN. You hold the standard set's six dice that move (d4 .. d20: your stones, DICE.md). You may first USE one item; then pick
// ONE die that is not spent and throw it: you move that many spaces and the die is spent. When all six are spent the set is cast
// again. A throw may be thrown again with Luck's re-roll while one is left. At a fork you pick the line. A floor of the board is a
// ring: its DOOR stops you, and opens down (its FOE wakes) only once BOARD.need floors of its depth are cleared; until then it sends
// you round again. Standing on a floor not yet cleared, you may play it again in place of a throw. Only the space you LAND on acts:
//   a fight or a trial is a FLOOR: it is played (the runtime's), and its outcome handed back as a move, `clear` or `fail`. Cleared,
//   it gives a material and cubes, and is cleared for everyone. Failed, a crack and your newest material dropped. A cache gives a
//   material once. A spring mends a crack. A hazard throws the fate die (the d%) against its save. A shift moves you the spaces
//   printed on it. A rest brings every spent die back. A shop sells one item. An item space gives one. An arcana space draws a
//   Major Arcana, which does what it says.
// THE BOARD GAME'S OWN (WELL-BOARD.md 11; Mario Party's and Dokapon Kingdom's):
//   RIVALS    up to four seats on one board, in turn, racing down it: each seat clears its own floors and opens its own doors; a
//             cache is taken once, for all.
//   THE PURSE cubes this run has found, spent at a shop, robbed in a duel, home with the haul.
//   ITEMS     three held at most, one used a turn before the throw (items.js).
//   A DUEL    landing on a rival's space: each picks a stance in secret; the winner takes the loser's newest material, or cubes.
//             A seat that has just duelled is left alone for BOARD.duelRest rounds.
//   A SNARE   set on a space by an item: the next rival to land there pays its setter.
//   THE STRAY one a ring, walking a d4 a round. Land on it, or have it walk onto you, and it must be fought: down, it pays; lost, a
//             crack.
//   THE END   a story run ends for every seat when the FOE falls. The standings add cubes, the haul and the bonus awards (most
//             floors cleared, furthest walked, most duels won).
// THE DICE DO THREE THINGS (WELL-BOARD.md 12; Dicey Dungeon's): a die of the cast is spent once, on a MOVE, or set into a POWER's slot
// (items.js POWERS: Ward, Push, Transmute; one a turn, before the throw); and the dice still unspent are your hand in a BATTLE
// (battle.js): a fight, a stray and the FOE are fought with them, set into your tools' slots round by round. A battle spends no die.
// THE HAUL comes home only up the way up: from a door (or the mouth) you may LEAVE with all of it; the Wake Whistle leaves from
// anywhere with ECON.escape.keep of it; at the board's bears of cracks you FALL and it is lost.
//
// What is the runtime's and never the kernel's: how a floor is played, the pool, the vessel's real cracks, what a material is.
//
// Prior art: Mario Party (a board whose spaces hold other games, items, the shop, Chance Time, the bonus stars), Dokapon Kingdom
// (rivals fought where they stand, the guessed stances, wandering monsters on the board), Culdcept and Fortune Street (the route as
// the decision), Machi Koro's choice of die, Can't Stop's push-your-luck, boardgame.io and OpenSpiel through the table engine.
//
//   WELL_BOARD (the game)   reach(state, seat, sides, twin?)   landsFrom(state, at, steps)   readout(state, seat)   keysAt(state, depth)
//   standings(state) -> [{ seat, score, cubes, haul, awards, out }] best first   opts: { seed, floors, endless, rerolls, whistle, bears, names }
//   moves: throw { sides } · use { item } · power { power, sides } · push { seat | stray } · place { die, gear } · end · face { face } · target { seat } · keep · again · fork { to } · clear { grade? } · fail ·
//          fate · draw · buy { item } · pass · stance { stance } · leave · whistle · retry
// ---------------------------------------------------------------------------------------
import { die } from '../casino/table.js';
import { BOARD, KINDS, MOUTH, layOut, tierAt } from './layout.js';
import { ITEMS, ITEM_IDS, ARCANA, STANCES, beats, POWERS, POWER_IDS } from './items.js';
import { newBattle, battleMoves, battleApply } from './battle.js';
import { cubesFor, scoreOf } from './pay.js';

const B = BOARD;
let R = null; // (the game's stream for the move being applied: set at apply's door, so the helpers below need not carry it)

// ---------------------------------------------------------------- the board
function floorAt(S, depth) {
  if (!S.floors[depth]) {
    const last = S.endless ? (depth + 1) % B.foeEvery === 0 : depth === S.nFloors - 1;
    const F = (S.floors[depth] = layOut(S.seed, depth, { last }));
    S.stray[depth] = `${depth}.${B.stray.from[0] + ((S.seed >>> (depth % 16)) % (B.stray.from[1] - B.stray.from[0] + 1))}`;
    if (F.spaces[S.stray[depth]]?.kind === 'door') S.stray[depth] = `${depth}.5`;
  }
  return S.floors[depth];
}
const spaceOf = (S, id) => (id === MOUTH ? S.mouth : floorAt(S, +id.split('.')[0]).spaces[id]);
/** A depth's door is open to a seat (its FOE awake for it) once that seat has cleared `need` of its floors; a door pick or the Hermit
 *  counts as one. */
export const keysAt = (S, depth, p = 0) => Object.keys(C(S, p)).filter((id) => id.startsWith(`${depth}.`) && spaceOf(S, id).kind !== 'foe').length + (S.seats[p].picks[depth] || 0);
/** What a seat has cleared: each seat opens its own doors (a race down the same board), a cache alone is taken for all. */
const C = (S, p) => S.seats[p].cleared;
const openAt = (S, depth, p) => keysAt(S, depth, p) >= B.need;
function nextOf(S, id, p) {
  const s = spaceOf(S, id);
  if (s.next.length) return s.next;
  if (s.kind === 'door') return [floorAt(S, openAt(S, s.depth, p) ? s.depth + 1 : s.depth).first];
  if (s.kind === 'foe') return C(S, p)[id] ? (S.endless ? [floorAt(S, s.depth + 1).first] : []) : [floorAt(S, s.depth).first];
  return [];
}
const stops = (S, s, p) => s.kind === 'door' || (s.kind === 'foe' && !C(S, p)[s.id]);
const playable = (S, s, p) => KINDS[s.kind].lands === 'floor' && !C(S, p)[s.id] && (s.kind !== 'foe' || openAt(S, s.depth, p));
const seatIn = (S, p) => S.seats[p].out == null;
const say = (S, x) => { S.log.push(x); };
const rivalsOf = (S, p) => S.seats.map((_, q) => q).filter((q) => q !== p && seatIn(S, q));

function setup({ seats = 1, r, opts = {} }) {
  const S = {
    n: seats, seed: (opts.seed ?? Math.floor(r() * 2 ** 31)) >>> 0, nFloors: opts.floors ?? B.floors, endless: !!opts.endless, bears: opts.bears ?? B.bears,
    floors: [], taken: {}, snares: {}, stray: {}, mouth: { id: MOUTH, kind: 'mouth', depth: -1, next: [], x: -1, y: 0 },
    seats: [], turn: 0, turns: 0, round: 1, pending: [], log: [], move: null, duel: null, fight: null, battles: opts.battles !== false, over: false,
  };
  S.mouth.next = [floorAt(S, 0).first];
  for (let p = 0; p < seats; p++) S.seats.push({ name: opts.names?.[p] ?? (p ? `Rival ${p}` : 'You'), at: MOUTH, spent: [], cracks: 0, haul: [], cubes: 0, items: [], cleared: {}, picks: {}, rerolls: p ? 0 : opts.rerolls ?? B.rerolls, whistle: p ? 0 : opts.whistle ?? 1,
    deepest: 0, floors: 0, foes: 0, walked: 0, duels: 0, saves: 0, used: false, cast: false, ward: false, powers: 0, duelled: -9, twin: false, loaded: false, skip: 0, ambush: false, out: null });
  R = r; ask(S);
  return S;
}

// ---------------------------------------------------------------- what happens to a seat
function gainCubes(S, p, n, why) { const me = S.seats[p]; n = Math.max(-me.cubes, Math.round(n)); if (!n) return 0; me.cubes += n; say(S, { cubes: p, n, why, has: me.cubes }); return n; }
function gain(S, p, depth, why, up = 0) { const piece = { tier: Math.min(4, tierAt(depth) + up), depth, why }; S.seats[p].haul.push(piece); say(S, { haul: p, ...piece }); }
function crack(S, p, why) {
  const me = S.seats[p]; if (me.ward) { me.ward = false; say(S, { warded: p, why }); return; }
  me.cracks++; say(S, { crack: p, cracks: me.cracks, why });
  if (me.cracks >= S.bears) { me.out = 'fall'; say(S, { fall: p, lost: me.haul.length }); me.haul = []; me.cubes = 0; }
}
function mend(S, p, n = 1) { const me = S.seats[p], k = Math.min(n, me.cracks); if (k) { me.cracks -= k; say(S, { mend: p, cracks: me.cracks }); } return k; }
function giveItem(S, p, id = null) {
  const me = S.seats[p];
  if (me.items.length >= B.hold) { gainCubes(S, p, 10, 'item'); return null; }
  if (!id) { let w = ITEM_IDS.reduce((a, k) => a + ITEMS[k].weight, 0) * R(); id = ITEM_IDS.find((k) => (w -= ITEMS[k].weight) < 0) || ITEM_IDS[0]; }
  me.items.push(id); say(S, { item: p, got: id }); return id;
}
/** Carried along the main line by `d` spaces (a shift, the Chariot, the Moon, a Push): never past the door, never before the first space,
 *  and set down without the space acting. Off the main line, nothing moves. */
function carry(S, p, d) {
  const me = S.seats[p], m = /^(\d+)\.(\d+)$/.exec(me.at); if (!m || !d) return false;
  const i = Math.max(0, Math.min(B.main - 1, +m[2] + d)); if (i === +m[2]) return false;
  me.at = `${m[1]}.${i}`; say(S, { shift: p, by: i - +m[2], to: me.at }); say(S, { land: p, at: me.at, kind: spaceOf(S, me.at).kind, set: true });
  return true;
}

/** A floor is to be played. A floor of creatures (a fight, a stray, the FOE) is a battle (battle.js), fought with the dice the seat
 *  has not spent; a trial is the runtime's own game, handed back as `clear` or `fail`. `S.battles` off: every floor is handed back. */
function openFloor(S, P) {
  if (!S.battles || !(P.stray || P.floor === 'fight' || P.floor === 'foe')) { S.pending.push(P); return; }
  const me = S.seats[P.seat], kind = P.stray ? 'stray' : P.floor;
  S.fight = { P, B: newBattle(R, { dice: B.dice.filter((d) => !me.spent.includes(d)), cracks: me.cracks, kind, depth: P.depth }) };
  say(S, { bout: P.seat, open: kind, depth: P.depth, hp: S.fight.B.foe.hp, dice: S.fight.B.pool.slice() });
  askBattle(S);
}
function askBattle(S) { const F = S.fight; S.pending.push({ seat: F.P.seat, kind: 'battle', floor: F.P.floor, depth: F.P.depth, stray: F.P.stray, battle: F.B, moves: battleMoves(F.B) }); }

// ---------------------------------------------------------------- the turn
function ask(S) {
  if (S.pending.length || S.over) return;
  if (!S.seats.some((_, p) => seatIn(S, p))) return;
  for (let guard = 0; guard < S.n * 2; guard++) {
    while (!seatIn(S, S.turn)) advance(S);
    const me = S.seats[S.turn]; if (!me.skip) break;
    me.skip--; say(S, { skip: S.turn }); advance(S);
    if (!S.seats.some((_, p) => seatIn(S, p))) return;
  }
  const p = S.turn, me = S.seats[p], here = spaceOf(S, me.at);
  if (me.ambush) { me.ambush = false; if (S.stray[here.depth] === me.at) { openFloor(S, { seat: p, kind: 'floor', space: me.at, floor: 'stray', depth: here.depth, stray: true, then: 'ask', moves: [{ id: 'clear' }, { id: 'fail' }] }); return; } }
  if (me.spent.length >= B.dice.length) { me.spent = []; say(S, { recast: p }); }
  const moves = B.dice.filter((d) => !me.spent.includes(d)).map((sides) => ({ id: 'throw', sides }));
  if (!me.used) for (const item of new Set(me.items)) if (usable(S, p, item)) moves.push({ id: 'use', item });
  if (!me.cast) for (const power of POWER_IDS) if (castable(S, p, power)) for (const sides of B.dice) if (!me.spent.includes(sides) && (POWERS[power].slot !== 'big' || sides >= 12)) moves.push({ id: 'power', power, sides });
  if (here.kind === 'door' || here.kind === 'mouth' || (here.kind === 'foe' && C(S, p)[here.id])) moves.push({ id: 'leave' });
  else if (me.whistle > 0) moves.push({ id: 'whistle' });
  if (playable(S, here, p)) moves.push({ id: 'retry' });
  S.pending.push({ seat: p, kind: 'throw', moves });
}
function usable(S, p, item) {
  const me = S.seats[p], here = spaceOf(S, me.at);
  if (item === 'kit') return me.cracks > 0;
  if (item === 'recast') return me.spent.length > 0;
  if (item === 'pick') return here.depth >= 0 && !openAt(S, here.depth, p);
  if (item === 'swap') return rivalsOf(S, p).some((q) => S.seats[q].at !== me.at);
  if (item === 'snare') return !['mouth', 'door', 'foe'].includes(here.kind) && S.snares[me.at] == null;
  if (item === 'twin') return !me.twin && !me.loaded;
  if (item === 'loaded') return !me.twin && !me.loaded;
  return false;
}
function castable(S, p, power) {
  const me = S.seats[p], here = spaceOf(S, me.at); if (here.depth < 0) return false;
  if (power === 'ward') return !me.ward;
  if (power === 'push') return pushable(S, p).length > 0;
  if (power === 'transmute') return Object.values(floorAt(S, here.depth).spaces).some((s) => s.kind === 'hazard');
  return false;
}
/** What a Push may carry back: a rival standing on your ring's main line, or the ring's stray. */
function pushable(S, p) {
  const depth = spaceOf(S, S.seats[p].at).depth, out = rivalsOf(S, p).filter((q) => new RegExp(`^${depth}\\.\\d+$`).test(S.seats[q].at) && !S.seats[q].at.endsWith(`.${B.main - 1}`)).map((seat) => ({ id: 'push', seat }));
  if (S.stray[depth]) out.push({ id: 'push', stray: true });
  return out;
}
/** The turn passes on; when it comes back round to the first seat still in, the round ends: the strays walk. */
function advance(S) {
  const was = S.turn; let wrapped = false;
  do { S.turn = (S.turn + 1) % S.n; if (S.turn <= was) wrapped = true; } while (!seatIn(S, S.turn) && S.turn !== was);
  if (wrapped) roundEnd(S);
}
function roundEnd(S) {
  S.round++; say(S, { round: S.round });
  for (const F of S.floors) {
    const at = S.stray[F.depth]; if (!at || !S.seats.some((s) => s.out == null && s.at !== MOUTH && spaceOf(S, s.at).depth === F.depth)) continue;
    let i = +at.split('.')[1]; for (let k = die(R, B.stray.steps); k > 0; k--) { i = (i + 1) % B.main; if (i === B.main - 1) i = 0; }
    const to = `${F.depth}.${i}`; S.stray[F.depth] = to; say(S, { stray: F.depth, to });
    const q = S.seats.findIndex((s) => s.out == null && s.at === to); if (q >= 0) S.seats[q].ambush = true;
  }
}
function endTurn(S) { S.move = null; S.turns++; const me = S.seats[S.turn]; me.used = false; me.cast = false; if (S.over) return; advance(S); ask(S); }

/** Walk the throw: a step at a time, stopping at a fork to ask, at a stop space, or when the throw runs out; then land. */
function walk(S) {
  const M = S.move, me = S.seats[M.seat];
  while (M.left > 0) {
    const here = spaceOf(S, me.at);
    if (M.moved && stops(S, here, M.seat)) { M.left = 0; break; }
    const next = nextOf(S, me.at, M.seat);
    if (!next.length) { M.left = 0; break; }
    if (next.length > 1 && !M.fork) { S.pending.push({ seat: M.seat, kind: 'fork', left: M.left, moves: next.map((to) => ({ id: 'fork', to, lands: landsFrom(S, to, M.left - 1, true, M.seat) })) }); return; }
    me.at = M.fork || next[0]; M.fork = null; M.left--; M.moved = true; me.walked++;
    say(S, { step: M.seat, at: me.at, left: M.left });
    me.deepest = Math.max(me.deepest, spaceOf(S, me.at).depth);
  }
  land(S, M.seat);
}

/** Landed: a snare springs, a rival there is duelled, then the space (or the stray on it) acts. */
function land(S, p) {
  const me = S.seats[p], s = spaceOf(S, me.at);
  say(S, { land: p, at: s.id, kind: s.kind });
  const owner = S.snares[s.id];
  if (owner != null && owner !== p && me.ward) { delete S.snares[s.id]; me.ward = false; say(S, { warded: p, why: 'snare' }); }
  else if (owner != null && owner !== p) { delete S.snares[s.id]; const n = -gainCubes(S, p, -B.snare, 'snare'); say(S, { snared: p, by: owner, n }); if (n && seatIn(S, owner)) gainCubes(S, owner, n, 'snare'); }
  const q = s.kind === 'mouth' ? -1 : rivalsOf(S, p).find((x) => S.seats[x].at === me.at && S.round - S.seats[x].duelled >= B.duelRest);
  if (q != null && q >= 0) { S.duel = { a: p, b: q }; const moves = Object.keys(STANCES).map((stance) => ({ id: 'stance', stance })); S.pending.push({ seat: p, kind: 'duel', vs: q, moves }, { seat: q, kind: 'duel', vs: p, defend: true, moves }); return; }
  effect(S, p);
}
function effect(S, p) {
  const me = S.seats[p], s = spaceOf(S, me.at), L = KINDS[s.kind].lands;
  if (S.stray[s.depth] === s.id) { openFloor(S, { seat: p, kind: 'floor', space: s.id, floor: 'stray', depth: s.depth, stray: true, moves: [{ id: 'clear' }, { id: 'fail' }] }); return; }
  if (s.kind === 'foe' && !C(S, p)[s.id] && !openAt(S, s.depth, p)) say(S, { asleep: p, at: s.id, keys: keysAt(S, s.depth, p) });
  if (playable(S, s, p)) { openFloor(S, { seat: p, kind: 'floor', space: s.id, floor: s.kind, depth: s.depth, moves: [{ id: 'clear' }, { id: 'fail' }] }); return; }
  if (L === 'take' && !S.taken[s.id]) { S.taken[s.id] = true; gain(S, p, s.depth, 'cache'); gainCubes(S, p, cubesFor('cache', s.depth), 'cache'); }
  else if (L === 'mend') { if (!mend(S, p) && me.spent.length) { const d = Math.min(...me.spent); me.spent.splice(me.spent.indexOf(d), 1); say(S, { back: p, sides: d }); } }
  else if (L === 'recast') { me.spent = []; say(S, { recast: p, rest: true }); }
  else if (L === 'save') { S.pending.push({ seat: p, kind: 'fate', space: s.id, odds: s.odds, moves: [{ id: 'fate' }] }); return; }
  else if (L === 'move') carry(S, p, s.shift);
  else if (L === 'item') giveItem(S, p);
  else if (L === 'arcana') { S.pending.push({ seat: p, kind: 'arcana', moves: [{ id: 'draw' }] }); return; }
  else if (L === 'shop') {
    const stock = stockOf(S, s.id), room = me.items.length < B.hold, moves = stock.filter((id) => room && me.cubes >= ITEMS[id].cost).map((item) => ({ id: 'buy', item, cost: ITEMS[item].cost }));
    S.pending.push({ seat: p, kind: 'shop', stock, moves: [...moves, { id: 'pass' }] }); return;
  }
  endTurn(S);
}
/** A shop's three items, fixed by the board's seed and its space. */
export function stockOf(S, id) { let h = (S.seed ^ Math.imul(id.length * 131 + id.charCodeAt(0) * 31 + id.charCodeAt(id.length - 1), 0x9e3779b1)) >>> 0; const pool = ITEM_IDS.slice(), out = []; while (out.length < 3) { h = (Math.imul(h, 1664525) + 1013904223) >>> 0; out.push(pool.splice(h % pool.length, 1)[0]); } return out; }

function drawArcana(S, p) {
  const me = S.seats[p], card = ARCANA[Math.floor(R() * ARCANA.length)], rivals = rivalsOf(S, p), pickRival = () => rivals[Math.floor(R() * rivals.length)], depth = Math.max(0, spaceOf(S, me.at).depth);
  say(S, { arcana: p, card: card.id });
  switch (card.id) {
    case 'magician': giveItem(S, p); break;
    case 'lovers': gain(S, p, depth, 'arcana'); if (rivals.length) gain(S, pickRival(), depth, 'arcana'); break;
    case 'chariot': carry(S, p, die(R, 6)); break;
    case 'moon': carry(S, p, -die(R, 6)); break;
    case 'hermit': me.picks[depth] = (me.picks[depth] || 0) + 1; say(S, { key: p, depth }); break;
    case 'wheel': if (rivals.length) { const q = pickRival(), a = me.cubes, b = S.seats[q].cubes; me.cubes = b; S.seats[q].cubes = a; say(S, { cubes: p, n: b - a, why: 'wheel', has: b }); say(S, { cubes: q, n: a - b, why: 'wheel', has: a }); } else gainCubes(S, p, 10, 'arcana'); break;
    case 'justice': { const live = S.seats.map((_, q) => q).filter((q) => seatIn(S, q)); if (live.length > 1) { const rich = live.reduce((a, q) => (S.seats[q].cubes > S.seats[a].cubes ? q : a)), poor = live.reduce((a, q) => (S.seats[q].cubes < S.seats[a].cubes ? q : a)); if (rich !== poor) gainCubes(S, poor, -gainCubes(S, rich, -10, 'justice'), 'justice'); } break; }
    case 'hanged': me.skip = 1; break;
    case 'death': { mend(S, p, me.cracks); const lost = me.haul.pop(); if (lost) say(S, { failed: p, at: me.at, lost: lost.tier }); break; }
    case 'temperance': mend(S, p, 2); break;
    case 'devil': if (rivals.length) for (const q of rivals) gainCubes(S, p, -gainCubes(S, q, -8, 'devil'), 'devil'); else gainCubes(S, p, 8, 'arcana'); break;
    case 'tower': gainCubes(S, p, -Math.ceil(me.cubes / 2), 'tower'); crack(S, p, 'arcana'); break;
    case 'star': gainCubes(S, p, 20, 'arcana'); break;
    case 'sun': me.spent = []; say(S, { recast: p, rest: true }); gainCubes(S, p, 10, 'arcana'); break;
  }
}

function apply(S, m, r) {
  R = r;
  const P = S.pending.shift(); if (!P) return S.log;
  const p = P.seat, me = S.seats[p];
  if (P.kind === 'throw') {
    if (m.id === 'leave' || m.id === 'whistle') { if (m.id === 'whistle') me.whistle--; me.out = m.id === 'leave' ? 'up' : 'whistle'; say(S, { out: p, how: me.out, haul: me.haul.length }); endTurn(S); return S.log; }
    if (m.id === 'retry') { const s = spaceOf(S, me.at); openFloor(S, { seat: p, kind: 'floor', space: s.id, floor: s.kind, depth: s.depth, moves: [{ id: 'clear' }, { id: 'fail' }] }); return S.log; }
    if (m.id === 'use') { useItem(S, p, m.item); return S.log; }
    if (m.id === 'power') {
      me.spent.push(m.sides); me.cast = true; me.powers++; say(S, { power: p, cast: m.power, sides: m.sides });
      const depth = spaceOf(S, me.at).depth;
      if (m.power === 'ward') me.ward = true;
      else if (m.power === 'transmute') { let n = 0; for (const s of Object.values(floorAt(S, depth).spaces)) if (s.kind === 'hazard') { s.kind = 'spring'; delete s.odds; n++; } say(S, { transmute: p, depth, n }); }
      else if (m.power === 'push') { S.pending.push({ seat: p, kind: 'push', sides: m.sides, moves: pushable(S, p) }); return S.log; }
      ask(S); return S.log;
    }
    me.spent.push(m.sides); S.move = { seat: p, sides: m.sides, face: 0, left: 0, moved: false, fork: null };
    if (me.loaded) { me.loaded = false; S.pending.push({ seat: p, kind: 'face', sides: m.sides, moves: [...Array(m.sides)].map((_, i) => ({ id: 'face', face: i + 1, lands: landsFrom(S, me.at, i + 1, false, p) })) }); return S.log; }
    const twin = me.twin; me.twin = false;
    const face = die(r, m.sides) + (twin ? die(r, m.sides) : 0); S.move.face = S.move.left = face;
    say(S, { throw: p, sides: m.sides, face, twin });
    if (me.rerolls > 0 && !twin) S.pending.push({ seat: p, kind: 'reroll', sides: m.sides, face, reach: reach(S, p, m.sides), moves: [{ id: 'keep' }, { id: 'again' }] });
    else walk(S);
  } else if (P.kind === 'face') { S.move.face = S.move.left = m.face; say(S, { throw: p, sides: P.sides, face: m.face, loaded: true }); walk(S); }
  else if (P.kind === 'reroll') {
    if (m.id === 'again') { me.rerolls--; const face = die(r, P.sides); S.move.face = S.move.left = face; say(S, { throw: p, sides: P.sides, face, reroll: P.face }); }
    walk(S);
  } else if (P.kind === 'fork') { S.move.fork = m.to; walk(S); }
  else if (P.kind === 'push') {
    const face = die(r, P.sides), depth = spaceOf(S, me.at).depth;
    say(S, { push: p, face, seat: m.seat ?? null, stray: !!m.stray });
    if (m.stray) { const i = Math.max(0, +S.stray[depth].split('.')[1] - face); S.stray[depth] = `${depth}.${i}`; say(S, { stray: depth, to: S.stray[depth] }); const q = S.seats.findIndex((x) => x.out == null && x.at === S.stray[depth]); if (q >= 0) S.seats[q].ambush = true; }
    else carry(S, m.seat, -face);
    ask(S);
  }
  else if (P.kind === 'battle') {
    const F = S.fight; for (const x of battleApply(F.B, m, r)) say(S, { bout: p, ...x });
    if (!F.B.over) { askBattle(S); return S.log; }
    S.fight = null; resolveFloor(S, F.P, { id: F.B.won ? 'clear' : 'fail', grade: F.B.flawless ? 'true' : undefined });
  }
  else if (P.kind === 'swap') { const q = m.seat, a = me.at; me.at = S.seats[q].at; S.seats[q].at = a; say(S, { swap: p, with: q }); ask(S); }
  else if (P.kind === 'duel') {
    const D = S.duel; if (!P.defend) { D.sa = m.stance; return S.log; }
    const w = beats(D.sa, m.stance), win = w > 0 ? D.a : w < 0 ? D.b : null, lose = w > 0 ? D.b : w < 0 ? D.a : null; let took = null;
    if (win != null && S.seats[lose].ward) { S.seats[lose].ward = false; S.seats[win].duels++; say(S, { warded: lose, why: 'duel' }); took = { warded: true }; }
    else if (win != null) { const L = S.seats[lose], W = S.seats[win]; W.duels++; const piece = L.haul.pop(); if (piece) { W.haul.push(piece); took = { tier: piece.tier }; } else took = { cubes: 0 }; }
    say(S, { duel: D.a, vs: D.b, sa: D.sa, sb: m.stance, win, took });
    if (win != null && took.cubes != null) { const n = -gainCubes(S, lose, -B.duel, 'duel'); gainCubes(S, win, n, 'duel'); }
    S.seats[D.a].duelled = S.seats[D.b].duelled = S.round; S.duel = null; effect(S, D.a);
  } else if (P.kind === 'fate') {
    const face = Math.floor(r() * B.fate), saved = face < P.odds * B.fate;
    say(S, { fate: p, face, odds: P.odds, saved });
    if (saved) me.saves++; else crack(S, p, 'hazard');
    endTurn(S);
  } else if (P.kind === 'arcana') { drawArcana(S, p); endTurn(S); }
  else if (P.kind === 'shop') { if (m.id === 'buy') { gainCubes(S, p, -ITEMS[m.item].cost, 'shop'); me.items.push(m.item); say(S, { item: p, got: m.item, bought: true }); } endTurn(S); }
  else if (P.kind === 'floor') resolveFloor(S, P, m);
  return S.log;
}
/** A floor's outcome, from the runtime (a trial) or from its battle: cleared, it pays; failed, a crack and the newest material. */
function resolveFloor(S, P, m) {
  const p = P.seat, me = S.seats[p];
  const s = spaceOf(S, P.space);
  if (P.stray) {
    if (m.id === 'clear') { S.stray[s.depth] = null; me.floors++; say(S, { strayDown: p, depth: s.depth }); gainCubes(S, p, B.stray.cubes, 'stray'); } else crack(S, p, 'stray');
  } else if (m.id === 'clear') {
    C(S, p)[s.id] = true; me.floors++;
    if (s.kind === 'foe') { me.foes++; gain(S, p, s.depth, 'foe', 1); gainCubes(S, p, cubesFor('foe', s.depth), 'foe'); say(S, { foe: p, depth: s.depth }); if (!S.endless) finish(S, p); }
    else { gain(S, p, s.depth, s.kind, (s.kind === 'genre' ? 1 : 0) + (m.grade === 'true' ? 1 : 0)); gainCubes(S, p, cubesFor(s.kind, s.depth), s.kind); }
  } else { const lost = me.haul.pop(); say(S, { failed: p, at: s.id, lost: lost ? lost.tier : null }); crack(S, p, s.kind); }
  if (P.then === 'ask' && seatIn(S, p) && !S.over) ask(S); else endTurn(S);
}
function useItem(S, p, item) {
  const me = S.seats[p], depth = spaceOf(S, me.at).depth; me.items.splice(me.items.indexOf(item), 1); me.used = true; say(S, { use: p, item });
  if (item === 'kit') mend(S, p);
  else if (item === 'recast') { me.spent = []; say(S, { recast: p, rest: true }); }
  else if (item === 'pick') { me.picks[depth] = (me.picks[depth] || 0) + 1; say(S, { key: p, depth }); }
  else if (item === 'snare') { S.snares[me.at] = p; say(S, { snare: p, at: me.at }); }
  else if (item === 'twin') me.twin = true;
  else if (item === 'loaded') me.loaded = true;
  else if (item === 'swap') { S.pending.push({ seat: p, kind: 'swap', moves: rivalsOf(S, p).filter((q) => S.seats[q].at !== me.at).map((seat) => ({ id: 'target', seat })) }); return; }
  ask(S);
}
/** The FOE is down: a story run is over for every seat. The slayer walks up; the rest come up with what they hold. */
function finish(S, p) { S.over = true; S.pending.length = 0; S.seats.forEach((s, q) => { if (s.out == null) { s.out = q === p ? 'foe' : 'over'; say(S, { out: q, how: s.out, haul: s.haul.length }); } }); }

const pending = (S) => S.pending[0] || null;
function result(S) {
  if (S.seats.some((s) => s.out == null)) return null;
  return { turns: S.turns, rounds: S.round, seats: S.seats.map((s) => ({ name: s.name, out: s.out, deepest: s.deepest + 1, floors: s.floors, foes: s.foes, cracks: s.cracks, cubes: s.cubes, haul: s.haul.slice() })), standings: standings(S) };
}

/** The standings, best first: cubes and haul as they would come home, and the bonus awards (Mario Party's bonus stars), each to
 *  every seat that leads its count, with two seats or more. */
export function standings(S) {
  const awards = S.seats.map(() => []);
  if (S.n > 1) for (const [key, label] of [['floors', 'Most floors cleared'], ['walked', 'Furthest walked'], ['duels', 'Most duels won']]) {
    const top = Math.max(...S.seats.map((s) => s[key])); if (top > 0) S.seats.forEach((s, q) => { if (s[key] === top) awards[q].push(label); });
  }
  return S.seats.map((s, seat) => ({ seat, name: s.name, out: s.out, cubes: s.cubes, haul: s.haul.length, awards: awards[seat], score: scoreOf(s) + awards[seat].length * B.award }))
    .sort((a, b) => b.score - a.score || a.seat - b.seat);
}

/** What a seat sees. Nothing on the board is hidden but a duel's first stance. */
function view(S, seat) {
  return { seat, seats: S.seats.map((s) => ({ ...s, haul: s.haul.slice(), spent: s.spent.slice(), items: s.items.slice() })), turn: S.turn, turns: S.turns, round: S.round,
    keys: S.floors.map((F) => keysAt(S, F.depth, seat)), need: B.need, bears: S.bears, endless: S.endless, pending: pending(S), readout: readout(S, seat) };
}

/** Where a die could set a seat down: for each face, every space it could land on, with the fork that leads there. `twin`: the die
 *  thrown twice and added (faces 2 .. twice its sides). */
export function reach(S, seat, sides, twin = false) {
  const out = [];
  for (let face = twin ? 2 : 1; face <= (twin ? 2 * sides : sides); face++) out.push({ face, lands: landsFrom(S, S.seats[seat].at, face, false, seat) });
  return out;
}
export function landsFrom(S, from, steps, started = true, p = 0) {
  const lands = [];
  (function go(at, left, moved, via) {
    const s = spaceOf(S, at);
    if (left === 0 || (moved && stops(S, s, p))) { lands.push({ id: at, kind: s.kind, via, shift: s.shift, odds: s.odds, cleared: !!C(S, p)[at], taken: !!S.taken[at], open: s.kind === 'door' || s.kind === 'foe' ? openAt(S, s.depth, p) : undefined,
      stray: S.stray[s.depth] === at, rival: S.seats.some((x) => x.out == null && x.at === at && at !== from), snare: S.snares[at] }); return; }
    const next = nextOf(S, at, p);
    if (!next.length) { lands.push({ id: at, kind: s.kind, via }); return; }
    for (const to of next) go(to, left - 1, true, next.length > 1 ? (via || to) : via);
  })(from, steps, started, null);
  return lands;
}

/** The turn as data, for any view and any agent: where the seat stands, its dice with each one's reach, its purse, items, cracks
 *  and haul, the rivals, the strays and snares, and the decision waiting with its moves. */
export function readout(S, seat = 0) {
  const me = S.seats[seat], here = spaceOf(S, me.at), P = pending(S);
  return {
    at: { id: here.id, kind: here.kind, label: KINDS[here.kind].label, depth: here.depth + 1, cleared: !!C(S, seat)[here.id] },
    keys: here.depth >= 0 ? keysAt(S, here.depth, seat) : 0, need: B.need, round: S.round,
    cracks: me.cracks, bears: S.bears, cubes: me.cubes, ward: me.ward, items: me.items.slice(), haul: me.haul.slice(), rerolls: me.rerolls, whistle: me.whistle, out: me.out, twin: me.twin, loaded: me.loaded,
    dice: B.dice.map((sides) => ({ sides, spent: me.spent.includes(sides), reach: me.spent.includes(sides) || me.out ? null : reach(S, seat, sides, me.twin) })),
    seats: S.seats.map((s, q) => ({ seat: q, name: s.name, at: s.at, depth: s.at === MOUTH ? 1 : spaceOf(S, s.at).depth + 1, cubes: s.cubes, haul: s.haul.length, cracks: s.cracks, items: s.items.length, ward: s.ward, out: s.out })),
    strays: { ...S.stray }, snares: { ...S.snares }, turn: S.turn,
    pending: P && { ...P, yours: P.seat === seat, depth: P.depth != null ? P.depth + 1 : undefined },
  };
}

export const WELL_BOARD = { id: 'wellboard', seats: [1, 4], setup, pending, apply, result, view };
