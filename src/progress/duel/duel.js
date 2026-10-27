// ---------------------------------------------------------------------------------------
// A PUZZLE DUEL (docs/plans/PUZZLE-DUELS.md section 3): two sides, one board, a line between them. A side spends its action points (5 a
// turn, a knob), each action followed by the settle (gravity, clears, what a clear sets off, again and again until nothing changes); its
// clears become junk, which cancels what is coming at it first and then waits to land on the other side at the end of that side's own
// turn. Junk landed pushes the line toward the receiver, one column for every 3. A side wins when the line reaches the other's back
// wall, when the other's side has no empty cell left after its junk lands, or by the finisher on a broken foe (duelbreak.js).
//
// Prior art: Puyo Puyo Tetris (chains, junk, offsetting, junk waiting a turn so it can be answered), Noon (the territories, a
// side filled to death), PuzzleScript (the settle loop run to a fixed point), Into the Breach (the turn as a plan of a few actions).
//
//   newDuel({ ruleset, seed, forms, ap, pool, tools }) -> state   act(state, action) -> events | null (illegal)   endTurn(state) -> events
//   ACTIONS (the board's, the Courier's, the finisher)   costOf(action)
//   settle(state, side) -> { steps, junk, events }   legalActions(state, side) -> actions   cloneState(state)
//   preview(state, action) -> { junk, steps, cleared } | null   (what one action would make, on a copy: shown before it is chosen)
//   newDuel's `board` ({ w, h, perColumn, landCap }) over the ruleset's, and `lesson` (lesson.js) for the first duel
//   undo(state) -> events | null (the last action this turn taken back)   marginOf(state) -> junk's multiplier now   weaknessOf(state) -> { weak, resists, k } | null   (PUZZLE-DUELS.md 19)
// ---------------------------------------------------------------------------------------
import { Board, COLOURS, DIRS, piece, hasTag } from './board.js';
import { fall, clears, resolve, pinch, ACTIONS as BOARD_ACTIONS } from './rules.js';
import { COURIER_ACTIONS, runPaths } from './couriertools.js';
import { onLanding, startTurn, endOwnTurn, FINISHER_ACTION } from './duelbreak.js';
import { emberKind, tickEmbers } from './dread.js';
import { FLEE_ACTION } from './flee.js';
import { lessonOf, lessonAct, lessonTurn } from './lesson.js';
import { seeded } from '../../core/rng.js';
import { OPPOSITE } from '../weather.js';
import { SKILL_ACTION, chargeFrom, skillActions } from './skills.js';
import { skyOf, skyfall, deficitOf } from './skyfall.js';

/** Every action a side may take: the board's (rules.js), the Courier's run and tools (couriertools.js), the god hand's finisher (duelbreak.js),
 *  and the flee (flee.js). */
export const ACTIONS = { ...BOARD_ACTIONS, ...COURIER_ACTIONS, finisher: FINISHER_ACTION, flee: FLEE_ACTION, skill: SKILL_ACTION };
/** The one-gesture duel's verbs (PUZZLE-DUELS.md 22): the drag, the worn pair's skills, the finisher and the flee; a swap is a drag of one step. */
const DRAG_VERBS = new Set(['drag', 'skill', 'finisher', 'flee']);
/** The kinds' first names, still taken while the room and the view move to the genre's words (the owner, 2026-10-19); to go once they have. */
const LEGACY = { glean: 'run', punt: 'kick', coup: 'finisher', hook: 'grab', toll: 'delay', hoover: 'hold', flail: 'send' };
export const costOf = (a) => { const A = ACTIONS[a.kind]; return typeof A.cost === 'function' ? A.cost(a) : A.cost; };

export const DUEL = {
  ap: 5,           // action points a turn (the owner, 2026-10-19: "let's start with 5AP"; each player on a side has their own)
  pool: 30,        // the pool a side starts with, out of 100 (in play, the Courier's own pool as the duel opens)
  settleCap: 64,   // passes before a settle is stopped (and counted: a cascade that never ends is a bug in a ruleset)
  landCap: 9,      // (on a board of 20; a smaller board carries its own: rulesets.js `board`) junk that lands at once at most (3 columns of the Line); the rest waits a turn and can still be offset (Puyo Puyo's 30 at a time)
  perColumn: 3,    // junk landed that moves the line one column (4 at 3 AP; 3 since 5 AP made offsetting strong: the simulator)
  turnCap: 200,    // turns a side before the line's place decides it (a ply is one side's turn)
  fill: 0.4,       // each side's share of cells filled at the start
  // the genre's folds (PUZZLE-DUELS.md 19; a ruleset may set its own or `false`):
  refund: { size: 5, chain: 3, max: 1 }, // an action point back for a clear of `size` (5: a cluster of 4 is the Wisp's plain clear) or a chain step of `chain`, `max` a turn (Puzzle Quest's extra turn, Persona's One More)
  trickle: 2,      // pool to a side for each chain step past the first (Puzzle Quest's mana: the Courier's tools fed by play, not only by breaks)
  allClear: 6,     // junk for leaving no gem on your half (Puyo's all clear)
  weakness: { k: [1.5, 0.5] }, // a gem of the Figment's weak colour counts 1.5 in your clears, of its own feeling 0.5 (weaknessOf)
  margin: { after: 10, step: 0.25 }, // past `after` turns a side, junk counts `step` more a turn (Puyo Puyo Tetris's margin time: a duel ends)
  style: 'drag',   // 'drag': the one-gesture duel (PUZZLE-DUELS.md 22: the hand drags, the worn pair are charged skills, no Courier on the board); 'classic' the forms and the Courier's walk (sections 4 to 21), kept for the record and the measure
};

/** A junk count from one settle's chain steps: a step clearing n gems gives (n - 2) x 2^(step - 1) (Puyo's chain power, simplified),
 *  the doubling stopping at step CHAIN_CAP (x16: skyfall's free cascades must not make a lucky drag a win by itself, PUZZLE-DUELS.md 22.7). */
export const CHAIN_CAP = 5;
export const junkOf = (n, step) => Math.max(0, n - 2) * 2 ** (Math.min(step, CHAIN_CAP) - 1);

/** A new duel under a ruleset (rulesets.js). Each side's forms: the Courier, the god hand, or both (the owner, 2026-10-19); `ap` a number
 *  or one a side (a side of two players has two players' points: section 12); `tools` the tools a side wears (all, if not given). */
export function newDuel({ ruleset, seed = 1, style = null, forms = ['hand', 'courier'], board: boardOver = null, lesson = false, line, w, h, ap = DUEL.ap, pool = DUEL.pool, tools = null, finisher = [true, false], flee = [true, false], luck = [0, 0], rerolls = [0, 0] } = {}) {
  const rs = { match: 3, cluster: 0, blast: 2, colours: 5, drip: 2, bombs: 0, queue: 3, pincer: false, ...ruleset };
  style ??= rs.style ?? DUEL.style; if (style === 'drag') forms = ['hand']; // (the one-gesture duel: no Courier form, no walk)
  const bd = { w: 20, h: 20, perColumn: DUEL.perColumn, landCap: DUEL.landCap, ...rs.board, ...boardOver }; // (the board is the Figment's: PUZZLE-DUELS.md 17.4)
  w ??= bd.w; h ??= bd.h; line ??= w / 2;
  const r = seeded(seed);
  const board = new Board({ w, h, line });
  board.setGravity(rs.gravity || (() => [0, 1]));
  const aps = Array.isArray(ap) ? ap : [ap, ap], pools = Array.isArray(pool) ? pool : [pool, pool];
  const s = { board, rs, r, style, perColumn: bd.perColumn, landCap: bd.landCap, ply: 1, toMove: 0, winner: null, apLeft: 0, capHits: 0, log: [],
    sides: [0, 1].map((i) => ({ form: forms[0], forms: [...forms], at: null, queue: [], pending: 0, sent: 0, landed: 0, total: 0,
      ap: aps[i], pool: pools[i], tools: tools && (tools[i] || tools), charge: {}, emo: 0, depth: 0, stunLeft: 0, stagger: 0, coffin: 0, drunk: 0, breaks: 0, finisher: !!finisher[i], flee: !!flee[i], fleeFails: 0 })) };
  s.lesson = lessonOf(lesson); // (the first duel as a lesson: lesson.js)
  s.luck = luck; // (each side's Luck, -2..2: luck.js's sway, passed in by the room)
  s.rerolls = [...rerolls]; // (each side's re-rolls left this game day: a failed Flee is thrown again, flee.js; the room hands in game.rerolls.left())
  for (const side of [0, 1]) {
    fillSide(s, side);
    const spot = style === 'drag' && side === 0 ? null : courierSpot(s, side); // (in the one-gesture duel only the foe stands on its half: its lantern)
    if (spot) { board.set(spot[0], spot[1], piece('body', { side })); s.sides[side].at = spot; }
    topQueue(s, side);
  }
  const first = startTurn(s, 0); s.apLeft = first.ap; s.log.push(first.event);
  return s;
}

const colourOf = (s) => COLOURS[s.r.int(Math.min(COLOURS.length, s.rs.colours))];
const gemOf = (s) => (s.rs.bombs && s.r.chance(s.rs.bombs) ? piece('bomb') : piece('gem', { colour: colourOf(s) }));

/** A side filled to DUEL.fill with gems, settled, and recoloured until nothing on it would clear at once. */
function fillSide(s, side) {
  const b = s.board, cells = b.empty(side);
  for (let n = Math.round(cells.length * (skyOf(s)?.to ?? DUEL.fill)); n > 0; n--) { // (under skyfall, its waterline: skyfall.js)
    const [x, y] = cells.splice(s.r.int(cells.length), 1)[0];
    b.set(x, y, piece('gem', { colour: colourOf(s) }));
  }
  fall(b);
  for (let tries = 0; tries < 20; tries++) {
    const hot = clears(b, s.rs); if (!hot.size) break;
    for (const k of hot) { const [x, y] = k.split(',').map(Number); b.at(x, y).colour = colourOf(s); }
  }
}

/** Where a side's Courier stands: the empty cell of its side nearest its middle. */
function courierSpot(s, side) {
  const b = s.board, mid = side === 0 ? b.line / 2 : (b.line + b.w) / 2;
  let best = null, bd = Infinity;
  for (const [x, y] of b.empty(side)) { const d = Math.abs(x + 0.5 - mid) + Math.abs(y - b.h / 2); if (d < bd) { bd = d; best = [x, y]; } }
  return best;
}

const topQueue = (s, side) => { const Q = s.sides[side].queue; while (Q.length < s.rs.queue) Q.push(gemOf(s)); };

/** The settle (PuzzleScript's loop): fall, then clear, again until nothing changes; each pass that clears is a chain step. Capped at
 *  DUEL.settleCap passes, and stopped if it sees one board twice. Junk is credited to the side the clears were on. */
export function settle(s) {
  const events = [], junk = [0, 0], steps = s.chainFrom ? [...s.chainFrom] : [0, 0], seen = new Set(), tune = s.sides.map((S) => S.tune || null);
  s.chainFrom = null; // (a shot's pop of your own was the chain's first step: what falls after it counts on from there)
  const sky = skyOf(s); let holes = s.skyHoles || [[], []]; s.skyHoles = null; // (a skill's blast leaves its holes for this settle: skills.js)
  for (let pass = 0; ; pass++) {
    if (pass >= DUEL.settleCap) { s.capHits++; events.push({ type: 'settle.cap' }); break; }
    events.push(...fall(s.board));
    if (sky) { events.push(...skyfall(s, holes, gemOf)); holes = [[], []]; } // (skyfall.js: the cleared gems back in from the far edge, to the waterline)
    const hot = clears(s.board, s.rs, tune); if (!hot.size) break;
    const { cleared, events: ev } = resolve(s.board, hot, s.rs);
    events.push(...ev);
    if (sky) for (const e of ev) if (e.type === 'clear' && e.colour) holes[e.side].push(e.at);
    const weak = weaknessOf(s), hit = [0, 0], eff = [...cleared];
    if (weak) for (const e of ev) if (e.type === 'clear' && e.side === 0 && (e.colour === weak.weak || e.colour === weak.resists)) { const k = e.colour === weak.weak ? weak.k[0] : weak.k[1]; eff[0] += k - 1; if (k > 1) hit[0]++; }
    for (const side of [0, 1]) if (cleared[side]) { steps[side]++; junk[side] += junkOf(eff[side], steps[side]); events.push({ type: 'chain', side, step: steps[side], cleared: cleared[side], ...(hit[side] ? { weak: hit[side] } : {}) }); }
    const h = s.board.hash(); if (seen.has(h)) { s.capHits++; events.push({ type: 'settle.loop' }); break; } seen.add(h);
  }
  const mk = marginOf(s), trickle = s.rs.trickle ?? DUEL.trickle;
  for (const side of [0, 1]) {
    s.sides[side].sent += Math.round(junk[side] * mk);
    if (trickle && steps[side] >= 2) { const S = s.sides[side]; S.pool = Math.min(100, S.pool + trickle * (steps[side] - 1)); events.push({ type: 'trickle', side, pool: S.pool, n: trickle * (steps[side] - 1) }); }
  }
  return { steps, junk, events };
}

/** A Figment's weakness (PUZZLE-DUELS.md 19.2; Persona's, Puzzle & Dragons' wheel): the feeling opposite its own (the wheel of feelings'
 *  OPPOSITE) when that colour is on its board, and its own feeling it resists. Your clears of the weak colour count `k[0]` gems each,
 *  of the resisted `k[1]` (side 0 is the Courier's: the ruleset is the Figment's). A ruleset may name its own (`weak`, `resists`) or `weak: false`. */
export function weaknessOf(s) {
  const rs = s.rs, D = DUEL.weakness; if (rs.weak === false || !D) return null;
  const on = COLOURS.slice(0, Math.min(COLOURS.length, rs.colours)), weak = rs.weak ?? OPPOSITE[rs.feeling], resists = rs.resists ?? rs.feeling;
  const w = on.includes(weak) ? weak : null, r = on.includes(resists) ? resists : null;
  return w ? { weak: w, resists: r, k: D.k } : null; // (no weak colour on its board, no resisting either: a weakness is the pair or nothing)
}

/** Margin time's multiplier on junk now: 1 until `after` turns a side, then `step` more each turn (PUZZLE-DUELS.md 19). */
export function marginOf(s) {
  const M = s.rs.margin === false ? null : s.rs.margin ?? DUEL.margin; if (!M) return 1;
  return 1 + M.step * Math.max(0, Math.floor((s.ply - 1) / 2) - M.after);
}

/** The turn as it stood before the last action: a copy kept for undo (no draw from the stream: nothing hidden is learned by it). */
function snapOf(s) {
  return { board: s.board.clone(), sides: s.sides.map((S) => ({ ...S, forms: [...S.forms], at: S.at && [...S.at], queue: S.queue.map((p) => ({ ...p })) })),
    apLeft: s.apLeft, winner: s.winner, lesson: s.lesson && { ...s.lesson }, refunded: s.refunded || 0, chainFrom: s.chainFrom };
}

/** Undo the side's last action this turn (Into the Breach's reset, a step at a time): free, until the turn ends or a die is thrown. */
export function undo(s) {
  const u = s.undo?.pop(); if (!u) return null;
  Object.assign(s, u);
  return [{ type: 'undo', side: s.toMove, left: s.undo.length }];
}

/** One action by the side to move: refused (null) if it is not legal, not its form's, or costs more than the points left. */
export function act(s, a) {
  if (s.winner !== null) return null;
  if (LEGACY[a.kind]) a = { ...a, kind: LEGACY[a.kind] };
  if (s.style === 'drag') { if (a.kind === 'swap' && a.at && DIRS[a.dir]) a = { kind: 'drag', path: [a.at, [a.at[0] + DIRS[a.dir][0], a.at[1] + DIRS[a.dir][1]]] }; if (!DRAG_VERBS.has(a.kind)) return null; } // (a swap is a one-step drag)
  const side = s.toMove, A = ACTIONS[a.kind]; if (!A) return null;
  if (A.form && A.form !== s.sides[side].form) return null;
  const cost = costOf(a); if (cost > s.apLeft || !A.legal(s, side, a)) return null;
  (s.undo ||= []).push(snapOf(s));
  s.apLeft -= cost;
  const before = s.sides[side].pool, events = A.apply(s, side, a);
  if (!events.length) events.push({ type: a.kind, side });
  if (s.sides[side].pool < before) Object.assign(events[0], { spent: before - s.sides[side].pool, pool: s.sides[side].pool }); // (what a spend cost, on its own event)
  if (s.rs.pincer) events.push(...pinch(s.board, side));
  events.push(...settle(s).events);
  events.push(...chargeFrom(s, events, weaknessOf(s)));
  events.push(...bonusOf(s, side, events));
  if (a.kind === 'flee' || s.winner !== null) s.undo = []; // (a die thrown, or the duel decided: no taking it back)
  if (s.lesson) events.push(...lessonAct(s, side, a, events));
  return events;
}

/** What a big play earns the mover at once (PUZZLE-DUELS.md 19): an action point back for a clear of `refund.size` or a chain step of
 *  `refund.chain` (at most `refund.max` a turn), and junk for an all clear (no gem left on your half after a clear). */
function bonusOf(s, side, events) {
  const out = [], R = s.rs.refund === false ? null : s.rs.refund ?? DUEL.refund, mine = events.filter((e) => e.type === 'chain' && e.side === side);
  if (R && mine.length && (s.refunded || 0) < R.max && mine.some((e) => e.cleared >= R.size || e.step >= R.chain)) {
    s.refunded = (s.refunded || 0) + 1; s.apLeft += 1; out.push({ type: 'refund', side, ap: 1, why: mine.some((e) => e.step >= R.chain) ? 'chain' : 'size' });
  }
  const AC = s.rs.allClear === false ? 0 : s.rs.allClear ?? DUEL.allClear;
  if (AC && mine.length) { let left = 0; s.board.each((p, x) => { if (s.board.mine(side, x) && hasTag(p, 'matches')) left++; }); if (!left) { s.sides[side].sent += AC; out.push({ type: 'allclear', side, n: AC }); } }
  return out;
}

/** The turn's end: the mover's junk cancels what waits for it, the rest waits for the other side; what still waits for the mover
 *  lands now (it had its turn to answer), the line moves, and the wins are checked. Then the other side's turn begins (its drip). */
export function endTurn(s) {
  const events = [], side = s.toMove, foe = 1 - side, S = s.sides[side], F = s.sides[foe];
  events.push(...tickEmbers(s, side), ...endOwnTurn(s, side)); // (its embers burn down; its orbs fade, its EmO settles, its stun counts down: before what lands on it can break it again)
  const off = Math.min(S.sent, S.pending); S.sent -= off; S.pending -= off;
  if (off) events.push({ type: 'offset', side, n: off });
  F.pending += S.sent; S.total += S.sent; if (S.sent) events.push({ type: 'send', side, n: S.sent }); S.sent = 0;
  if (S.pending) { const n = Math.min(S.pending, s.landCap); events.push(...land(s, side, n)); S.pending -= n; } // (the rest waits: it can still be offset)
  if (S.tune && !(--S.tuneLeft > 0)) { events.push({ type: 'tune.end', side, colour: S.tune }); S.tune = null; S.tuneLeft = 0; } // (a song lasts the turns it was sung for, the landing included: one, or a skill's two)
  for (const X of s.sides) if (X.read > 0) X.read--;
  if (s.winner === null) {
    s.ply++;
    if (s.ply > DUEL.turnCap * 2) { const d = s.board.line - s.board.w / 2; s.winner = d > 0 ? 0 : d < 0 ? 1 : -1; events.push({ type: 'duel.cap', winner: s.winner }); }
  }
  S.fired = []; // (each skill once a turn: skills.js)
  s.toMove = foe; s.undo = []; s.refunded = 0; const next = startTurn(s, foe); s.apLeft = next.ap; events.push(next.event);
  if (s.lesson) events.push(...lessonTurn(s, foe));
  if (s.winner === null) events.push(...drip(s, foe));
  events.push(...chargeFrom(s, events, weaknessOf(s))); // (what landed and dripped and cleared charges too: Puzzle & Dragons' skyfall counts)
  topQueue(s, foe);
  s.log.push(...events);
  return events;
}

/** Junk landing on a side: junk at random empty cells of it, then the settle; the line moves one column toward it for every
 *  perColumn landed (the board's: DUEL's on a board of 20). A side that cannot take it all has lost (Noon). */
function land(s, side, n) {
  const b = s.board, at = [], kind = emberKind(s, 1 - side), events = [{ type: 'land', side, n, at, kind }], cells = b.empty(side);
  let placed = 0;
  for (; placed < n && cells.length; placed++) { const [x, y] = cells.splice(s.r.int(cells.length), 1)[0]; b.set(x, y, piece(kind, kind === 'ember' ? { count: s.rs.embers.count } : {})); at.push([x, y]); }
  events.push(...settle(s).events);
  if (placed < n || !b.empty(side).length) { s.winner = 1 - side; events.push({ type: 'duel.full', side, winner: s.winner }); return events; }
  const S = s.sides[side]; S.landed += n;
  const broke = onLanding(s, side, n); if (broke.length) { S.breaks += broke[0].type === 'duelBreak' ? 1 : 0; events.push(...broke); }
  while (S.landed >= s.perColumn && s.winner === null) { S.landed -= s.perColumn; events.push(...moveLine(s, side === 0 ? -1 : 1)); }
  return events;
}

/** The line moves a column; a Courier left on the other side steps to the nearest empty cell of its own; gravity follows the sides. */
function moveLine(s, by) {
  const b = s.board; b.line += by;
  const events = [{ type: 'line', line: b.line, w: b.w, side: by < 0 ? 1 : 0 }]; // (side: whose junk pushed it; the room maps it to `by`)
  if (b.line <= 0 || b.line >= b.w) { s.winner = b.line <= 0 ? 1 : 0; events.push({ type: 'duel.line', winner: s.winner }); return events; }
  if (s.rs.gravity) b.setGravity(s.rs.gravity);
  for (const side of [0, 1]) {
    const S = s.sides[side]; if (!S.at || b.mine(side, S.at[0])) continue;
    const spot = courierSpot(s, side); const body = b.at(...S.at); b.set(S.at[0], S.at[1], null);
    if (spot) { b.set(spot[0], spot[1], body); S.at = spot; events.push({ type: 'shift', side, to: spot }); } else S.at = null;
  }
  events.push(...settle(s).events);
  return events;
}

/** A side's drip at the start of its turn: rs.drip new pieces at random empty cells of it (the well never runs dry). */
function drip(s, side) {
  const b = s.board, cells = b.empty(side), events = [], n = Math.min(s.rs.drip, deficitOf(s, side)); // (under skyfall, only to the waterline)
  for (let i = 0; i < n && cells.length; i++) {
    const [x, y] = cells.splice(s.r.int(cells.length), 1)[0], p = gemOf(s); b.set(x, y, p); events.push({ type: 'drip', side, id: p.id, at: [x, y] });
  }
  events.push(...settle(s).events);
  return events;
}

/** Every legal action for a side now (within its points), for bots and the view's hints. Drags are sampled (paths of 2 to 4 steps). */
export function legalActions(s, side = s.toMove, { drags = 24 } = {}) {
  const b = s.board, S = s.sides[side], out = [], dirs = ['N', 'S', 'E', 'W'], dr = quietStream(s, 'drags'); // (the drags sampled from a quiet stream: asking what is legal draws nothing from the duel)
  const ok = (a) => { const A = ACTIONS[a.kind]; if (A.form && A.form !== S.form) return; if (costOf(a) <= s.apLeft && A.legal(s, side, a)) out.push(a); };
  if (s.style === 'drag') { // (the one-gesture duel: every one-step drag, longer drags sampled, the ready skills at each cell they take)
    for (const a of skillActions(s, side)) ok(a);
    ok({ kind: 'finisher' }); ok({ kind: 'flee' });
    for (let y = 0; y < b.h; y++) for (let x = 0; x < b.w; x++) if (b.mine(side, x)) for (const [dx, dy] of [[1, 0], [0, 1]]) ok({ kind: 'drag', path: [[x, y], [x + dx, y + dy]] });
    const own = []; b.each((p, x, y) => { if (b.mine(side, x) && hasTag(p, 'swappable')) own.push([x, y]); });
    for (let i = 0; i < drags && own.length; i++) { const path = [dr.pick(own)]; for (let n = 2 + dr.int(4); n > 0; n--) { const [x, y] = path[path.length - 1], d = dr.pick([[1, 0], [-1, 0], [0, 1], [0, -1]]); path.push([x + d[0], y + d[1]]); } ok({ kind: 'drag', path }); }
    return out;
  }
  for (const to of S.forms) if (to !== S.form) ok({ kind: 'form', to });
  if (S.form === 'courier' && S.at) {
    for (const path of runPaths(s, side)) ok({ kind: 'run', path });
    for (const dir of dirs) for (const kind of ['push', 'kick', 'drill', 'shoot']) ok({ kind, dir });
    for (const kind of ['grab', 'delay', 'hold', 'send', 'read']) ok({ kind });
    const cs = COLOURS.slice(0, s.rs.colours);
    for (const colour of cs) { ok({ kind: 'tune', colour }); for (const from of cs) if (from !== colour) ok({ kind: 'paint', from, colour }); }
  }
  if (S.form === 'hand') ok({ kind: 'finisher' });
  ok({ kind: 'flee' });
  if (S.form === 'hand') {
    for (let y = 0; y < b.h; y++) for (let x = 0; x < b.w; x++) {
      if (!b.mine(side, x)) continue;
      const p = b.at(x, y);
      if (p) { ok({ kind: 'swap', at: [x, y], dir: 'E' }); ok({ kind: 'swap', at: [x, y], dir: 'S' }); }
      else ok({ kind: 'drop', at: [x, y] });
      ok({ kind: 'rotate', at: [x, y] });
    }
    for (let i = 0; i < drags; i++) {
      const own = []; b.each((p, x, y) => { if (b.mine(side, x) && hasTag(p, 'swappable')) own.push([x, y]); });
      if (!own.length) break;
      const path = [dr.pick(own)];
      for (let n = 1 + dr.int(3); n > 0; n--) { const [x, y] = path[path.length - 1], d = dr.pick([[1, 0], [-1, 0], [0, 1], [0, -1]]); path.push([x + d[0], y + d[1]]); }
      ok({ kind: 'drag', path });
    }
  }
  return out;
}

/** A stream for a lookahead, seeded from the duel as it stands (its board, ply, points and a salt), so a preview, an intent or the
 *  bot's search never draws from the duel's own stream: hovering cannot change the duel's chances, and a replay replays (Calissa's
 *  builder found it, 2026-10-27). */
export function quietStream(s, salt = '') {
  let h = 2166136261; const key = `${salt}|${s.ply}|${s.toMove}|${s.apLeft}|${s.board.hash()}`;
  for (let i = 0; i < key.length; i++) { h ^= key.charCodeAt(i); h = Math.imul(h, 16777619); }
  return seeded(h >>> 0);
}

/** A copy of a duel to try actions on (a bot's lookahead), with a stream of its own seeded from the real one's next draw. */
export function cloneState(s) {
  const c = { ...s, board: s.board.clone(), sides: s.sides.map((S) => ({ ...S, forms: [...S.forms], at: S.at && [...S.at], queue: S.queue.map((p) => ({ ...p })) })), log: [], undo: [], lesson: s.lesson && { ...s.lesson } }; // (its own undo: a lookahead never writes into the real turn's)
  c.r = quietStream(s, 'clone'); // (its own stream, read from the duel as it stands: the real one is never drawn by a lookahead)
  return c;
}

/** What one action by the side to move would make, tried on a copy (the duel is not changed): its junk, its chain's steps and the gems it
 *  clears, or null if it is not legal now. For the view to show a move's worth before it is chosen (PUZZLE-DUELS.md 17: the owner could
 *  not see why the Figment scored so much; a chain's doubling is easier to learn shown than told). */
export function preview(s, a) {
  const c = cloneState(s), side = c.toMove, before = c.sides[side].sent, ev = act(c, a); if (!ev) return null;
  let steps = 0, cleared = 0; for (const e of ev) if (e.type === 'chain' && e.side === side) { steps = Math.max(steps, e.step); cleared += e.cleared; }
  return { junk: c.sides[side].sent - before, steps, cleared };
}
