// ---------------------------------------------------------------------------------------
// THE WELL'S BOARD, ITS RULES (docs/plans/WELL-BOARD.md; ENDGAME.md 3.1): a Well run as a board game, a rules module in the table
// engine's shape (progress/casino/table.js: setup, pending, apply, result, view), so the same module is played in the Well, by bots
// headless (scripts/wellboard.mjs) and by an agent (every decision is a list of moves with ids: AGENT-INTERFACE.md).
//
// A TURN. You hold the standard set's six dice that move (d4 .. d20: your stones, DICE.md). Pick ONE that is not spent and throw it;
// you move that many spaces and the die is spent. When all six are spent the set is cast again. So the choice is which die: the d4
// to land exactly, the d20 to cross a floor, and each only once a cast. A failed-looking throw may be thrown again with Luck's
// re-roll while one is left. At a fork you pick the line. A DOOR and the FOE's space stop you whatever is left of the throw. A floor
// of the board is a ring: a door opens down (and a FOE wakes) only once BOARD.need floors of its depth are cleared; until then it
// sends you round again. Standing on a floor not yet cleared, you may play it again in place of a throw. Only the space you LAND on
// does anything (layout.js KINDS):
//   a fight or a trial is a FLOOR: it is played (the runtime's: an action floor, a genre floor), and its outcome is handed back as
//   a move, `clear` or `fail`. Cleared, it gives a material of its depth's tier into the haul, and is cleared for everyone. Failed,
//   you take a crack and drop the newest piece of the haul. A cache gives a material once. A spring mends a crack. A hazard throws
//   the fate die (the d%) against its save. A shift moves you the spaces printed on it. A rest brings every spent die back.
// THE HAUL comes home only up the way up: from a door (or the mouth) you may LEAVE with all of it; the Wake Whistle leaves from
// anywhere with ECON.escape.keep of it; at BOARD.bears cracks you FALL and it is lost. The FOE's space cleared ends a story run
// with the haul and the FOE's own piece; in the endless Well it opens the floor below.
//
// What is the runtime's and never the kernel's: how a floor is played, the pool, the vessel's real cracks (the runtime tells the
// kernel a floor's outcome; a crack here is the count the board keeps), what a material is (the kernel says a tier; the runtime
// rolls the kind by the Well: progress/econ/materials.js).
//
// Prior art: Mario Party and Dokapon Kingdom (a board whose spaces hold other games); Culdcept and Fortune Street (the route as
// the decision); Mario Party's dice blocks and Machi Koro's choice of die (which die is the play, not whether to roll); Yahtzee's
// and Can't Stop's push-your-luck (leave with what you hold, or go on and risk it); Darkest Dungeon's retreat (the way out is a
// place, not a button); boardgame.io and OpenSpiel through the table engine.
//
//   WELL_BOARD (the game)   reach(state, seat, sides) -> [{ face, lands: [{ id, kind, via }] }]   landsFrom(state, at, steps)   readout(state, seat) -> the turn as data
//   opts: { seed, floors, endless, sight, rerolls, whistle, bears }
//   moves: { id: 'throw', sides } { id: 'keep' } { id: 'again' } { id: 'fork', to } { id: 'clear', grade? } { id: 'fail' }
//          { id: 'leave' } { id: 'whistle' } { id: 'retry' }   keysAt(state, depth)
// ---------------------------------------------------------------------------------------
import { die } from '../casino/table.js';
import { BOARD, KINDS, MOUTH, layOut, tierAt } from './layout.js';

const B = BOARD;

/** The floor at a depth, laid when first asked for. The last floor of a story run ends on the FOE's space; in the endless Well every
 *  `foeEvery`th floor does. */
function floorAt(S, depth) {
  if (!S.floors[depth]) {
    const last = S.endless ? (depth + 1) % B.foeEvery === 0 : depth === S.nFloors - 1;
    S.floors[depth] = layOut(S.seed, depth, { last });
  }
  return S.floors[depth];
}
const spaceOf = (S, id) => (id === MOUTH ? S.mouth : floorAt(S, +id.split('.')[0]).spaces[id]);
/** A depth's door is open (its FOE awake) once `need` of its floors are cleared, by anyone. */
export const keysAt = (S, depth) => Object.keys(S.cleared).filter((id) => id.startsWith(`${depth}.`) && spaceOf(S, id).kind !== 'foe').length;
const openAt = (S, depth) => keysAt(S, depth) >= B.need;
/** Where a space leads: its own `next`; an open door (in the endless Well, a FOE's space cleared) leads to the floor below's first
 *  space; a shut door, and a FOE's space asleep or not yet beaten, lead round the ring to their own floor's first. */
function nextOf(S, id) {
  const s = spaceOf(S, id);
  if (s.next.length) return s.next;
  if (s.kind === 'door') return [floorAt(S, openAt(S, s.depth) ? s.depth + 1 : s.depth).first];
  if (s.kind === 'foe') return S.cleared[id] ? (S.endless ? [floorAt(S, s.depth + 1).first] : []) : [floorAt(S, s.depth).first];
  return [];
}
const stops = (S, s) => s.kind === 'door' || (s.kind === 'foe' && !S.cleared[s.id]);
/** A floor space a seat may play where it stands: not cleared, and a FOE's only awake. */
const playable = (S, s) => KINDS[s.kind].lands === 'floor' && !S.cleared[s.id] && (s.kind !== 'foe' || openAt(S, s.depth));
const seatIn = (S, p) => S.seats[p].out == null;
const say = (S, x) => { S.log.push(x); };

function setup({ seats = 1, r, opts = {} }) {
  const S = {
    n: seats, seed: (opts.seed ?? Math.floor(r() * 2 ** 31)) >>> 0, nFloors: opts.floors ?? B.floors, endless: !!opts.endless,
    sight: opts.sight ?? Infinity, bears: opts.bears ?? B.bears,
    floors: [], cleared: {}, taken: {}, mouth: { id: MOUTH, kind: 'mouth', depth: -1, next: [], x: -1, y: 0 },
    seats: [], turn: 0, turns: 0, pending: [], log: [], move: null,
  };
  S.mouth.next = [floorAt(S, 0).first];
  for (let p = 0; p < seats; p++) S.seats.push({ at: MOUTH, spent: [], cracks: 0, haul: [], rerolls: opts.rerolls ?? B.rerolls, whistle: opts.whistle ?? 1, deepest: 0, floors: 0, foes: 0, out: null });
  ask(S);
  return S;
}

/** The turn's first decision: which die, or the way up where one is. */
function ask(S) {
  if (S.pending.length) return;
  if (!S.seats.some((_, p) => seatIn(S, p))) return;
  while (!seatIn(S, S.turn)) S.turn = (S.turn + 1) % S.n;
  const p = S.turn, me = S.seats[p], here = spaceOf(S, me.at);
  if (me.spent.length >= B.dice.length) { me.spent = []; say(S, { recast: p }); }
  const moves = B.dice.filter((d) => !me.spent.includes(d)).map((sides) => ({ id: 'throw', sides }));
  if (here.kind === 'door' || here.kind === 'mouth' || (here.kind === 'foe' && S.cleared[here.id])) moves.push({ id: 'leave' });
  else if (me.whistle > 0) moves.push({ id: 'whistle' });
  if (playable(S, here)) moves.push({ id: 'retry' }); // (stand and play the floor under you again, or throw and move on)
  S.pending.push({ seat: p, kind: 'throw', moves });
}

function endTurn(S) { S.move = null; S.turns++; S.turn = (S.turn + 1) % S.n; ask(S); }

/** Walk the throw: a step at a time, stopping at a fork to ask, at a stop space, or when the throw runs out; then land. */
function walk(S) {
  const M = S.move, me = S.seats[M.seat];
  while (M.left > 0) {
    const here = spaceOf(S, me.at);
    if (M.moved && stops(S, here)) { M.left = 0; break; }
    const next = nextOf(S, me.at);
    if (!next.length) { M.left = 0; break; }
    if (next.length > 1 && !M.fork) { S.pending.push({ seat: M.seat, kind: 'fork', left: M.left, moves: next.map((to) => ({ id: 'fork', to, lands: landsFrom(S, to, M.left - 1) })) }); return; }
    me.at = M.fork || next[0]; M.fork = null; M.left--; M.moved = true;
    me.deepest = Math.max(me.deepest, spaceOf(S, me.at).depth);
  }
  land(S, M.seat);
}

function gain(S, p, depth, why, up = 0) { const piece = { tier: Math.min(4, tierAt(depth) + up), depth, why }; S.seats[p].haul.push(piece); say(S, { haul: p, ...piece }); }
function crack(S, p, why) {
  const me = S.seats[p]; me.cracks++; say(S, { crack: p, cracks: me.cracks, why });
  if (me.cracks >= S.bears) { me.out = 'fall'; say(S, { fall: p, lost: me.haul.length }); me.haul = []; }
}

function land(S, p, set = false) {
  const me = S.seats[p], s = spaceOf(S, me.at), L = KINDS[s.kind].lands;
  say(S, { land: p, at: s.id, kind: s.kind, set });
  if (set) { endTurn(S); return; } // (set down by a shift: the space under you does nothing)
  if (s.kind === 'foe' && !S.cleared[s.id] && !openAt(S, s.depth)) say(S, { asleep: p, at: s.id, keys: keysAt(S, s.depth) });
  if (playable(S, s)) { S.pending.push({ seat: p, kind: 'floor', space: s.id, floor: s.kind, depth: s.depth, moves: [{ id: 'clear' }, { id: 'fail' }] }); return; }
  if (L === 'take' && !S.taken[s.id]) { S.taken[s.id] = true; gain(S, p, s.depth, 'cache'); }
  else if (L === 'mend') {
    if (me.cracks > 0) { me.cracks--; say(S, { mend: p, cracks: me.cracks }); }
    else if (me.spent.length) { const d = Math.min(...me.spent); me.spent.splice(me.spent.indexOf(d), 1); say(S, { back: p, sides: d }); }
  } else if (L === 'recast') { me.spent = []; say(S, { recast: p, rest: true }); }
  else if (L === 'save') { S.pending.push({ seat: p, kind: 'fate', space: s.id, odds: s.odds, moves: [{ id: 'fate' }] }); return; }
  else if (L === 'move' && s.shift) {
    const n = +s.id.split('.')[1] + s.shift; me.at = `${s.depth}.${n}`; say(S, { shift: p, by: s.shift, to: me.at });
    land(S, p, true); return;
  }
  endTurn(S);
}

function apply(S, m, r) {
  const P = S.pending.shift(); if (!P) return S.log;
  const p = P.seat, me = S.seats[p];
  if (P.kind === 'throw') {
    if (m.id === 'leave' || m.id === 'whistle') {
      if (m.id === 'whistle') me.whistle--;
      me.out = m.id === 'leave' ? 'up' : 'whistle'; say(S, { out: p, how: me.out, haul: me.haul.length });
      endTurn(S); return S.log;
    }
    if (m.id === 'retry') { const s = spaceOf(S, me.at); S.pending.push({ seat: p, kind: 'floor', space: s.id, floor: s.kind, depth: s.depth, moves: [{ id: 'clear' }, { id: 'fail' }] }); return S.log; }
    const face = die(r, m.sides);
    me.spent.push(m.sides); S.move = { seat: p, sides: m.sides, face, left: face, moved: false, fork: null };
    say(S, { throw: p, sides: m.sides, face });
    if (me.rerolls > 0) S.pending.push({ seat: p, kind: 'reroll', sides: m.sides, face, reach: reach(S, p, m.sides), moves: [{ id: 'keep' }, { id: 'again' }] });
    else walk(S);
  } else if (P.kind === 'reroll') {
    if (m.id === 'again') { me.rerolls--; const face = die(r, P.sides); S.move.face = S.move.left = face; say(S, { throw: p, sides: P.sides, face, reroll: P.face }); }
    walk(S);
  } else if (P.kind === 'fork') { S.move.fork = m.to; walk(S); }
  else if (P.kind === 'fate') {
    const face = Math.floor(r() * B.fate), saved = face < P.odds * B.fate; // (the d%: 00 .. 99; under the save, saved)
    say(S, { fate: p, face, odds: P.odds, saved });
    if (!saved) crack(S, p, 'hazard');
    endTurn(S);
  } else if (P.kind === 'floor') {
    const s = spaceOf(S, P.space);
    if (m.id === 'clear') {
      S.cleared[s.id] = true; me.floors++;
      if (s.kind === 'foe') { me.foes++; gain(S, p, s.depth, 'foe', 1); say(S, { foe: p, depth: s.depth }); if (!S.endless) { me.out = 'foe'; say(S, { out: p, how: 'foe', haul: me.haul.length }); } }
      else gain(S, p, s.depth, s.kind, (s.kind === 'genre' ? 1 : 0) + (m.grade === 'true' ? 1 : 0));
    } else {
      const lost = me.haul.pop(); say(S, { failed: p, at: s.id, lost: lost ? lost.tier : null });
      crack(S, p, s.kind);
    }
    endTurn(S);
  }
  return S.log;
}

const pending = (S) => S.pending[0] || null;

/** Over when every seat is out: how each left, how deep, and what came home. */
function result(S) {
  if (S.seats.some((s) => s.out == null)) return null;
  return { turns: S.turns, seats: S.seats.map((s) => ({ out: s.out, deepest: s.deepest + 1, floors: s.floors, foes: s.foes, cracks: s.cracks, haul: s.haul.slice() })) };
}

/** What a seat sees: every floor anyone has come down to, a space past its sight read as unknown (kind '?': Divination's widening
 *  and a Cogitomap are the runtime's `sight`), the seats, and whose decision it is. Nothing here is hidden from a player's page. */
function view(S, seat) {
  const me = S.seats[seat], depthNow = me.at === MOUTH ? 0 : spaceOf(S, me.at).depth, dist = distances(S, me.at);
  const floors = S.floors.map((F) => ({ depth: F.depth, side: F.side.which, spaces: Object.values(F.spaces).map((s) => {
    const seen = F.depth < depthNow || (dist[s.id] ?? Infinity) <= S.sight || S.cleared[s.id] || S.taken[s.id];
    return seen ? { ...s, cleared: !!S.cleared[s.id], taken: !!S.taken[s.id] } : { id: s.id, kind: '?', depth: s.depth, next: s.next, x: s.x, y: s.y };
  }) }));
  return { seat, floors, seats: S.seats.map((s) => ({ ...s, haul: s.haul.slice(), spent: s.spent.slice() })), turn: S.turn, turns: S.turns, keys: S.floors.map((F) => keysAt(S, F.depth)), need: B.need, bears: S.bears, endless: S.endless, pending: pending(S), readout: readout(S, seat) };
}

/** Steps from a space to every space ahead of it on floors already laid. */
function distances(S, from) {
  const d = { [from]: 0 }, q = [from];
  while (q.length) { const a = q.shift(); const s = spaceOf(S, a); const nx = s.next.length ? s.next : (s.kind === 'door' && S.floors[s.depth + 1] ? [S.floors[s.depth + 1].first] : []); for (const b of nx) if (d[b] == null) { d[b] = d[a] + 1; q.push(b); } }
  return d;
}

/** Where a die could set a seat down: for each face, every space it could land on (one a line taken at a fork), with the fork
 *  that leads there. The coach's preview, the bot's reading and an agent's readout are all this. */
export function reach(S, seat, sides) {
  const out = [];
  for (let face = 1; face <= sides; face++) out.push({ face, lands: landsFrom(S, S.seats[seat].at, face, false) });
  return out;
}
/** Every space `left` more steps could end on from `at` (`moved`: the throw has already left its first space). */
export function landsFrom(S, from, steps, started = true) {
  const lands = [];
  (function go(at, left, moved, via) {
    const s = spaceOf(S, at);
    if (left === 0 || (moved && stops(S, s))) { lands.push({ id: at, kind: s.kind, via, shift: s.shift, odds: s.odds, cleared: !!S.cleared[at], taken: !!S.taken[at], open: s.kind === 'door' || s.kind === 'foe' ? openAt(S, s.depth) : undefined }); return; }
    const next = nextOf(S, at);
    if (!next.length) { lands.push({ id: at, kind: s.kind, via }); return; }
    for (const to of next) go(to, left - 1, true, next.length > 1 ? (via || to) : via);
  })(from, steps, started, null);
  return lands;
}

/** The turn as data, for any view and any agent (the casino's coach's shape): where the seat stands, its dice with each one's
 *  reach, its cracks and haul, and the decision waiting with its moves. Labels are the kinds' (layout.js). */
export function readout(S, seat = 0) {
  const me = S.seats[seat], here = spaceOf(S, me.at), P = pending(S);
  return {
    at: { id: here.id, kind: here.kind, label: KINDS[here.kind].label, depth: here.depth + 1, cleared: !!S.cleared[here.id] },
    keys: here.depth >= 0 ? keysAt(S, here.depth) : 0, need: B.need,
    cracks: me.cracks, bears: S.bears, haul: me.haul.slice(), rerolls: me.rerolls, whistle: me.whistle, out: me.out,
    dice: B.dice.map((sides) => ({ sides, spent: me.spent.includes(sides), reach: me.spent.includes(sides) || me.out ? null : reach(S, seat, sides) })),
    pending: P && { seat: P.seat, kind: P.kind, yours: P.seat === seat, moves: P.moves, face: P.face, sides: P.sides, odds: P.odds, left: P.left, reach: P.reach, floor: P.floor, depth: P.depth != null ? P.depth + 1 : undefined },
  };
}

export const WELL_BOARD = { id: 'wellboard', seats: [1, 4], setup, pending, apply, result, view };
