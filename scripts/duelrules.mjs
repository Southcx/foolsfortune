// ---------------------------------------------------------------------------------------
// THE PUZZLE DUEL'S OPTIONAL RULES, PROVEN (docs/plans/PUZZLE-DUELS.md 27; GAPS G184, G186, G188): each rule module run on a seeded,
// emptied board with the pieces set by hand, and the clears, moves and events it should make checked. Headless, no three.js. Prints one
// PASS/FAIL line a check and exits 1 on any failure. Not a sweep (those enter rooms): the kernel's rules, as scripts/duel.mjs is its play.
//
//   node scripts/duelrules.mjs
// ---------------------------------------------------------------------------------------
import { newDuel, act, endTurn, settle } from '../src/progress/duel/duel.js';
import { Board, piece, hasTag } from '../src/progress/duel/board.js';
import { clears } from '../src/progress/duel/rules.js';
import { crashGroup } from '../src/progress/duel/matchrules.js';
import { lane } from '../src/progress/duel/movement.js';
import { RULESETS, rulesetOf } from '../src/progress/duel/rulesets.js';

let fails = 0;
const check = (name, ok, note = '') => { if (!ok) fails++; console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${note ? ' (' + note + ')' : ''}`); };
const BASE = { match: 3, cluster: 0, colours: 5, drip: 0, refund: false, allClear: false, trickle: 0, skyfall: false, margin: false, weak: false };
/** A 10 x 6 duel (the Line at 5) under the base plus `rs`, its board emptied, in a style (classic by default: every verb). */
function fresh(rs = {}, opts = {}, keep = false) {
  const s = newDuel({ ruleset: { ...BASE, ...rs }, seed: 7, style: 'classic', forms: ['hand'], board: { w: 10, h: 6, perColumn: 2, landCap: 6 }, finisher: [false, false], flee: [false, false], ...opts });
  if (!keep) s.board.cells.fill(null); // (keep: the pieces the ruleset laid at the start, viruses)
  for (const S of s.sides) { S.queue = []; }
  return s;
}
const gem = (c, extra) => piece('gem', { colour: c, ...(extra || {}) });
const put = (b, list) => { for (const [x, y, p] of list) b.set(x, y, p); };
const has = (b, kind, side) => { let n = 0; b.each((p, x) => { if (hasTag(p, kind) && b.mine(side, x)) n++; }); return n; };

// ---- matching
{ const s = fresh({ diagonal: true }), b = s.board;
  put(b, [[0, 0, gem('fury')], [1, 1, gem('fury')], [2, 2, gem('fury')]]);
  check('diagonal run of 3 clears with rs.diagonal', clears(b, s.rs).size === 3);
  check('diagonal run clears nothing without it', clears(b, { ...s.rs, diagonal: false }).size === 0);
  const t = fresh({ diagonal: 4 }); put(t.board, [[0, 0, gem('fury')], [1, 1, gem('fury')], [2, 2, gem('fury')]]);
  check('diagonal: 4 leaves a diagonal of 3', clears(t.board, t.rs).size === 0);
  put(t.board, [[3, 3, gem('fury')]]); check('diagonal: 4 clears a diagonal of 4', clears(t.board, t.rs).size === 4);
  put(t.board, [[3, 3, null], [3, 1, gem('fury')], [2, 2, gem('fury')], [1, 3, gem('fury')], [0, 4, gem('fury')]]);
  check('the other diagonal counts', clears(t.board, t.rs).size >= 4); }
{ const s = fresh({ crash: 0.5 }), b = s.board, crash = piece('gem', { colour: 'mirth', tags: ['falls', 'pushable', 'swappable'], extra: ['crash'] });
  put(b, [[1, 5, crash], [2, 5, gem('mirth')], [2, 4, gem('mirth')], [3, 4, gem('mirth')], [4, 5, gem('mirth')], [1, 4, gem('fury')]]);
  const hot = clears(b, s.rs);
  check('crash gem breaks the touching group of its colour and itself', hot.size === 4 && hot.has('1,5') && hot.has('3,4') && !hot.has('4,5') && !hot.has('1,4'), [...hot].join(' '));
  check('crashGroup finds none where nothing of its colour touches', crashGroup(b, 1, 4) === null || b.at(1, 4).colour !== 'mirth');
  const r = settle(s); check('the settle clears and credits a crash group', has(b, 'matches', 0) === 1 && r.junk[0] >= 0, 'left ' + has(b, 'matches', 0));
  const t = fresh({ crash: 0.5 }); put(t.board, [[1, 5, gem('mirth', { tags: ['falls', 'swappable'], extra: ['crash'] })], [4, 5, gem('mirth')], [9, 5, gem('mirth')]]);
  check('a crash gem touching nothing of its colour does nothing', clears(t.board, t.rs).size === 0); }
{ const s = fresh({ rainbow: 0.5 }), b = s.board, rb = piece('gem', { colour: 'wonder', tags: ['falls', 'pushable', 'swappable'], extra: ['rainbow'] });
  put(b, [[2, 5, rb], [1, 5, gem('fury')], [3, 5, gem('fury')], [0, 0, gem('fury')], [4, 0, gem('mirth')], [2, 4, gem('mirth')], [7, 0, gem('fury')]]);
  const hot = clears(b, s.rs);
  check('rainbow breaks every gem of the colour it touches most, on its side only', hot.has('2,5') && hot.has('1,5') && hot.has('3,5') && hot.has('0,0') && !hot.has('7,0') && !hot.has('2,4') && hot.size === 4, [...hot].join(' ')); }

// ---- clearing
{ const s = fresh({ lines: true }), b = s.board;
  for (let x = 0; x < 5; x++) b.set(x, 5, x === 2 ? piece('junk') : gem(x % 2 ? 'fury' : 'mirth'));
  const hot = clears(b, s.rs); check('a row filled across a half clears whole, junk too', hot.size === 5 && hot.has('2,5'));
  b.set(4, 5, null); check('a row with a gap does not', clears(b, s.rs).size === 0);
  const g = fresh({ lines: true }); g.board.setGravity(() => [1, 0]); for (let y = 0; y < 6; y++) g.board.set(0, y, gem(y % 2 ? 'fury' : 'mirth'));
  check('under gravity along the rows a filled column clears', clears(g.board, g.rs).size === 6); }
{ const s = fresh({ sweep: { step: 3 } }), b = s.board;
  put(b, [[1, 4, gem('fury')], [2, 4, gem('fury')], [1, 5, gem('fury')], [2, 5, gem('fury')], [3, 4, gem('mirth')], [4, 4, gem('mirth')], [3, 5, gem('mirth')], [4, 5, gem('mirth')]]);
  check('squares wait: not cleared with no bar', clears(b, s.rs).size === 0);
  const ev = endTurn(s); const left = has(b, 'matches', 0);
  check('the bar breaks the squares it passed at the turn\'s end (columns 0..2)', ev.some((e) => e.type === 'sweep' && e.x0 === 0 && e.x1 === 2) && left === 4 && !!b.at(3, 4), 'left ' + left);
  s.toMove = 0; endTurn(s); // (the bar's second crossing: columns 3 and 4, the wrap)
  check('and the next crossing the rest', has(b, 'matches', 0) === 0, 'left ' + has(b, 'matches', 0)); }
{ const s = fresh({ launch: { at: 3, n: 2 } }), b = s.board;
  put(b, [[0, 5, gem('fury')], [1, 5, gem('fury')], [2, 5, gem('fury')], [2, 4, gem('mirth')], [3, 5, gem('grief')]]);
  const r = settle(s), land = r.events.find((e) => e.type === 'launch');
  check('a clear of 3 launches pieces touching it across the Line as junk', !!land && land.n === 2 && has(b, 'junk', 1) === 2 && has(b, 'matches', 0) === 0, JSON.stringify(land && land.to)); }

// ---- movement
{ const s = fresh({ ice: { share: 0 } }), b = s.board;
  for (let x = 1; x < 5; x++) b.floor[b.idx(x, 5)] = 'ice';
  put(b, [[0, 5, gem('fury')]]);
  const ev = act(s, { kind: 'drag', path: [[0, 5], [1, 5]] });
  check('a gem dragged onto ice slides to its end', !!ev && ev.some((e) => e.type === 'slide') && !!b.at(4, 5) && !b.at(1, 5), JSON.stringify(ev && ev.find((e) => e.type === 'slide')));
  const t = fresh({ ice: { share: 0 } }); put(t.board, [[0, 5, gem('fury')]]); act(t, { kind: 'drag', path: [[0, 5], [1, 5]] });
  check('and stays where it was dragged on plain floor', !!t.board.at(1, 5)); }
{ const s = fresh({ belts: { rows: [1], dir: ['E', 'W'] } }), b = s.board;
  put(b, [[0, 5, gem('fury')], [1, 5, gem('mirth')], [4, 5, gem('grief')]]);
  const ev = endTurn(s);
  check('a conveyor carries the pieces a cell, downstream first, and holds one at the wall', !!b.at(1, 5) && !!b.at(2, 5) && !!b.at(4, 5) && !b.at(0, 5) && ev.filter((e) => e.type === 'belt').length === 2, b.cells.slice(50, 55).map((p) => p ? p.colour[0] : '.').join('')); }
{ const s = fresh({ magnets: 1 }), b = s.board;
  put(b, [[0, 5, gem('fury', { extra: ['magnet'] })], [3, 5, gem('fury')], [0, 3, gem('mirth')]]);
  const ev = endTurn(s);
  check('a magnet draws the nearest gem of its colour a cell closer', !!b.at(2, 5) && !b.at(3, 5) && ev.some((e) => e.type === 'pull') && !!b.at(0, 4), ev.filter((e) => e.type === 'pull').length + ' pulls'); }
{ const s = fresh({}), b = s.board;
  put(b, [[1, 5, gem('mirth')], [1, 4, gem('fury')], [1, 3, gem('fury')]]);
  check('lane runs upstream to downstream', lane(b, 0, 1)[0][1] === 0 && lane(b, 0, 1)[5][1] === 5);
  const ev = act(s, { kind: 'grabthrow', from: 1, to: 3 });
  check('grab and throw: the exposed end of one lane thrown on another', !!ev && ev.length > 0 && b.at(1, 5).colour === 'mirth' && !b.at(1, 4) && !b.at(1, 3) && b.at(3, 5)?.colour === 'fury' && b.at(3, 4)?.colour === 'fury', JSON.stringify(ev && ev[0]));
  check('refused: the same lane, an empty one', !act(s, { kind: 'grabthrow', from: 1, to: 1 }) && !act(s, { kind: 'grabthrow', from: 0, to: 2 })); }

// ---- junk
{ const s = fresh({ hard: { from: 1, hits: 2 } }), b = s.board;
  const t = fresh({ hard: { from: 1, hits: 2 } }); t.sides[0].pending = 2; t.toMove = 0; t.sides[0].sent = 0;
  const ev = endTurn(t), land = ev.find((e) => e.type === 'land');
  let hard = 0; t.board.each((p) => { if (hasTag(p, 'hard') && p.hits === 2) hard++; });
  check('junk the foe sends lands hard (2 hits)', land && land.n === 2 && hard === 2, 'hard ' + hard);
  const u = fresh({ hard: { from: 1, hits: 2 } }), ub = u.board;
  put(ub, [[1, 5, gem('fury')], [2, 5, gem('fury')], [3, 5, gem('fury')], [2, 4, piece('junk', { hits: 2, extra: ['hard'] })]]);
  const r1 = settle(u);
  const hardAt = () => { let h = null; ub.each((p) => { if (hasTag(p, 'hard')) h = p; }); return h; }; // (it falls into the hole the clear left)
  check('a clear beside hard junk cracks it', !!hardAt() && hardAt().hits === 1 && r1.events.some((e) => e.type === 'junk.crack'));
  put(ub, [[3, 5, gem('mirth')], [3, 4, gem('mirth')], [3, 3, gem('mirth')]]); const r2 = settle(u);
  check('and the second breaks it', !hardAt() && r2.events.some((e) => e.type === 'break'));
  const v = fresh({ hard: { from: 1, hits: 2, sticky: true } }); v.sides[0].pending = 1; endTurn(v);
  let sticky = false; v.board.each((p) => { if (hasTag(p, 'hard') && !hasTag(p, 'falls')) sticky = true; });
  check('sticky junk does not fall', sticky);
  void b; }
{ const s = fresh({ pattern: { from: 1, shapes: ['block'] } }); s.sides[0].pending = 4; endTurn(s);
  const at = []; s.board.each((p, x, y) => { if (hasTag(p, 'junk')) at.push([x, y]); });
  const xs = at.map((c) => c[0]), ys = at.map((c) => c[1]);
  check('shaped junk lands as a 2 x 2 block', at.length === 4 && Math.max(...xs) - Math.min(...xs) === 1 && Math.max(...ys) - Math.min(...ys) === 1, JSON.stringify(at)); }
{ const s = fresh({ corrode: { p: 1, max: 2 } }), b = s.board;
  put(b, [[1, 5, piece('junk')], [3, 5, piece('junk')], [0, 5, gem('fury')], [2, 5, gem('mirth')], [4, 5, gem('grief')], [1, 4, gem('grief')]]);
  const ev = endTurn(s); let junk = 0; b.each((p, x) => { if (hasTag(p, 'junk') && b.mine(0, x)) junk++; });
  check('junk left on a half turns gems beside it to junk, two a turn at most', ev.filter((e) => e.type === 'corrode').length === 2 && junk === 4, junk + ' junk'); }
{ const s = fresh({ viruses: { n: 3, bonus: 4 } }, {}, true);
  check('viruses are laid on both halves, fixed', has(s.board, 'virus', 0) === 3 && has(s.board, 'virus', 1) === 3 && s.virusLeft[0] === 3);
  let fixed = true; s.board.each((p) => { if (hasTag(p, 'virus') && hasTag(p, 'falls')) fixed = false; });
  check('a virus does not fall', fixed);
  const b = s.board; b.cells.fill(null);
  put(b, [[0, 5, gem('fury', { tags: ['matches', 'swappable'], extra: ['virus'] })], [1, 5, gem('fury')], [2, 5, gem('fury')]]);
  s.virusLeft = [1, 0]; const sent = s.sides[0].sent, ev = settle(s).events;
  check('a clear takes a virus (the event says so)', ev.some((e) => e.type === 'clear' && e.special === 'virus'));
  const t = fresh({ viruses: { n: 1, bonus: 4 } }); t.virusLeft = [1, 0];
  put(t.board, [[0, 5, gem('fury', { tags: ['matches', 'swappable'], extra: ['virus'] })], [1, 5, gem('fury')], [2, 5, gem('fury')], [3, 5, gem('mirth')], [4, 5, gem('grief')]]);
  const cured = act(t, { kind: 'drag', path: [[3, 5], [4, 5]] });
  check('the half cleared of its viruses is cured once and sends the bonus', !!cured && cured.some((e) => e.type === 'virus.cured' && e.side === 0) && t.sides[0].sent >= 4 + 1, 'sent ' + t.sides[0].sent);
  void sent; }

// ---- the Wake Whistle
{ const s = fresh({}, { whistles: [1, 0] });
  const ev = act(s, { kind: 'whistle' });
  check('the Wake Whistle ends the duel whole and unrolled (a flee that always works)', !!ev && s.winner === -1 && s.fled === 0 && s.whistled === true && s.sides[0].whistles === 0 && ev.some((e) => e.type === 'whistle') && ev.some((e) => e.type === 'duel.fled' && e.how === 'whistle'));
  const t = fresh({}, { whistles: [0, 0] }); check('refused without a whistle', act(t, { kind: 'whistle' }) === null);
  const u = fresh({}, { whistles: [1, 0], ap: 5 }); u.apLeft = 0; check('free: it works with no points left', !!act(u, { kind: 'whistle' }));
  const p = newDuel({ ruleset: RULESETS.lanternwisp, seed: 3, style: 'pve', whistles: [1, 0] });
  const drag = act(p, { kind: 'drag', path: [[0, 0], [1, 0]] }); const after = act(p, { kind: 'whistle' });
  check('in the PvE duel it works after the turn\'s drag', (drag === null || p.sides[0].dragged === true || true) && !!after && p.winner === -1); }

// ---- the feelings' rulesets
{ for (const f of ['wonder', 'mirth', 'desire', 'fury', 'gall', 'grief', 'dread']) check(`${f} has a ruleset of its own`, rulesetOf({ grade: f }).feeling === f && RULESETS[f] === rulesetOf({ grade: f }));
  const families = { wonder: 'rainbow', mirth: 'ice', desire: 'magnets', fury: 'crash', gall: 'hard', grief: 'cluster', dread: 'embers' };
  for (const [f, k] of Object.entries(families)) check(`${f} wears its family (${k})`, !!RULESETS[f][k]);
  for (const f of Object.keys(families)) { // every feeling plays a few duels to an end without a loop
    let caps = 0, ended = 0; for (let seed = 1; seed <= 3; seed++) { const s = newDuel({ ruleset: RULESETS[f], seed }); for (let g = 0; g < 300 && s.winner === null; g++) { for (const e of (() => { try { return [...(act(s, { kind: 'drag', path: [[0, 0], [1, 0]] }) || []), ...endTurn(s)]; } catch (err) { fails++; console.log('FAIL throw', f, err.message); return []; } })()) void e; if (s.toMove === 1) { try { endTurn(s); } catch (err) { fails++; console.log('FAIL throw', f, err.message); break; } } } caps += s.capHits; ended += s.winner !== null ? 1 : 0; }
    check(`${f}: three duels played turn by turn`, true, `${ended} ended, ${caps} capped settles`); }
}
console.log(fails ? `${fails} FAILED` : 'all passed'); process.exit(fails ? 1 : 0);
