// ---------------------------------------------------------------------------------------
// THE DUEL'S POWERS: THE GOD HAND'S SEVEN, AS PUZZLE MOVES (docs/plans/PUZZLE-DUELS.md 24; South, 2026-10-28, through Petra: "god hand
// powers in the duel ... one power per domain (seven), built on conventions we already have"; "Strawman drops all seven feelings' gems.
// That is harder, and the seven powers are what bring it back down"). In the PvE duel the hand has one power a domain, each the duel's
// form of a power it already has in the world (GOD_POWERS, progress/godpowers.js), fired before the turn's drag as a free action:
//   Swap       (Ouranurgy, the hand's Swap)          two 2 x 2 patches of your half trade places
//   Manifest   (Manifestation, Manifest)             the holes and junk in the 3 x 3 round a cell fill with gems of one colour
//   Scan       (Divination, Scan Intent)             the aberrant's soonest skill shown and put off two turns
//   Lift       (Psychokinesis, Lift Ground)          a row or a column of your half lifted and set down shifted, wrapping round
//   Herd       (Possession, Herd)                    gems of one colour within 2 of a row or column come onto it
//   Transmute  (Alteration, Transmute)               every gem of one colour on your half turns to another, and none of it falls for 2 turns
//   Miracle    (Spellscription, the miracles)        one colour's weather on your half: its gems clear at any 2 touching, this turn and your next
//   and a learned skill (learned.js, a row with `learned`): an aberrant's own, open once learned (Kindle, the Lantern Wisp's)
// Each is paid from the pool (the Courier's own, as the duel opened: the hand's powers cost Lachryma in the world too), which your clears
// fill (`drink`: a point a gem you clear, Puzzle Quest's mana) and your turn's regen tops up (duel.js PVE.regen), and each rests a few of
// your turns once used (`rest`: Puzzle & Dragons' cooldowns). As many a turn as the pool pays for, each once (South, 2026-10-29: "use
// multiple powers provided you have the resources for it"; one a turn until then: PUZZLE-DUELS.md 26.9). All seven are open from the first duel (the
// world's at-1 powers are open from the start too); a domain's level widens its power on the ramp's curve (`levels`, RAMP_CURVE): what it
// costs falls to 0.6 of itself at 99 (the duel's numbers stay readable: one rule, every power). The worn pair's skills (skills.js) are not
// in the PvE duel: the powers are its big plays (PUZZLE-DUELS.md 24.4).
//
// Prior art: Puzzle & Dragons' active skills (orb change, board change, delay, cooldowns in turns), Puzzle Quest's spells paid in mana
// from the gems you match, Chuzzle's row and column slides, Bejeweled's hypercube (a colour gone), Candy Crush's boosters, the house's
// own GOD_POWERS (one power, one domain, opened and widened by its level).
//
//   DUEL_POWERS[id] = { domain, label, line, cost, rest, target: 'cell' | 'two' | null, legal?(s, side, a), reach(s, side, a) -> cells, apply(s, side, a) -> events }
//   POWER_ACTION (duel.js ACTIONS.power: { kind: 'power', power, at?, to?, dir?, by?, colour? })   powersOf(s, side) -> [{ id, cost, rest, left, ready, ... }]
//   costOf(s, side, id)   powerActions(s, side, n, rng) -> a sample of legal power actions (the bot's, the measure's)   tickRests(s, side) (endTurn)
//   events: power { side, power, domain, cost, pool, at? }, then each power's own: swap { side, a, b, size, moved: [{ id, from, to }] }, manifest
//   { side, at, colour, cells: [{ at, id, was }] }, scan { side, skill, left, delay } (the room marks it seen: progress/foeseen.js), lift { side,
//   at, dir, by, moved }, herd { side, at, dir, colour, moved }, transmute { side, from, colour, turns, cells: [{ at, id }] }, miracle { side,
//   colour, need, turns } (its clears are the settle's, under the tune: rules.js clears)
// ---------------------------------------------------------------------------------------
import { paletteOf, piece, hasTag, KINDS } from './board.js';
import { RAMP_CURVE } from '../godpowers.js';
import { awake } from './foeskills.js';

const mineIn = (b, side, x, y) => b.in(x, y) && b.mine(side, x);
const slimeAt = (b, side, at) => (at && mineIn(b, side, at[0], at[1]) && b.at(at[0], at[1])?.slime ? b.at(at[0], at[1]) : null);
const gemAt = (b, side, at) => (at && mineIn(b, side, at[0], at[1]) && hasTag(b.at(at[0], at[1]), 'matches') ? b.at(at[0], at[1]) : null);
const movable = (p) => !p || hasTag(p, 'swappable'); // (an empty cell moves with its patch; a body or an orb does not)
const colours = (s) => paletteOf(s.rs);
const DIR = { E: [1, 0], W: [-1, 0], S: [0, 1], N: [0, -1] };

/** The cells of a side's row or column through a cell (in order: west to east, north to south). */
function lineOf(b, side, at, dir) {
  const out = [];
  if (dir === 'E' || dir === 'W' || dir === 'H') { for (let x = 0; x < b.w; x++) if (mineIn(b, side, x, at[1])) out.push([x, at[1]]); } else for (let y = 0; y < b.h; y++) if (mineIn(b, side, at[0], y)) out.push([at[0], y]);
  return out;
}
const patch = (at, n) => { const out = []; for (let dy = 0; dy < n; dy++) for (let dx = 0; dx < n; dx++) out.push([at[0] + dx, at[1] + dy]); return out; };
const ring = (at, r) => { const out = []; for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) out.push([at[0] + dx, at[1] + dy]); return out; };

/** Herd's moves: for each cell of the line not already the colour, the nearest gem of it within `span` across the line comes in. */
function herded(s, side, a) {
  const b = s.board, colour = b.at(...a.at).colour, H = a.dir === 'H', moves = [], taken = new Set(), R = DUEL_POWERS.herd.span;
  for (const [x, y] of lineOf(b, side, a.at, a.dir)) {
    const here = b.at(x, y); if (here && hasTag(here, 'matches') && here.colour === colour) continue; if (!movable(here)) continue;
    let got = null;
    for (let d = 1; d <= R && !got; d++) for (const sg of [1, -1]) { const fx = H ? x : x + d * sg, fy = H ? y + d * sg : y, k = fx + ',' + fy, p = mineIn(b, side, fx, fy) && b.at(fx, fy);
      if (p && !taken.has(k) && hasTag(p, 'matches') && p.colour === colour) { got = [fx, fy]; taken.add(k); break; } }
    if (got) moves.push({ from: got, to: [x, y] });
  }
  return { colour, moves };
}

/** Manifest's colour: the one asked, else the colour most found round the cells it fills (so what it raises joins what is there). */
function manifestColour(s, side, cells) {
  const b = s.board, n = {};
  for (const [x, y] of cells) for (const [dx, dy] of Object.values(DIR)) { const p = gemAt(b, side, [x + dx, y + dy]); if (p) n[p.colour] = (n[p.colour] || 0) + 1; }
  const best = Object.entries(n).sort((p, q) => q[1] - p[1])[0]; return best ? best[0] : colours(s)[0];
}
/** Manifest's cells: junk and embers first, then holes, in the 3 x 3 round the cell, at most `max` (nearest the cell first). */
const filled = (s, side, at) => { const b = s.board, junk = [], holes = [];
  for (const [x, y] of ring(at, 1)) { if (!mineIn(b, side, x, y)) continue; const p = b.at(x, y); if (!p) holes.push([x, y]); else if (p.kind === 'junk' || p.kind === 'ember') junk.push([x, y]); } // (slime is junk: Manifest takes it too)
  const near = (c) => Math.abs(c[0] - at[0]) + Math.abs(c[1] - at[1]); return [...junk.sort((p, q) => near(p) - near(q)), ...holes.sort((p, q) => near(p) - near(q))].slice(0, DUEL_POWERS.manifest.max); };

export const DUEL_POWERS = {
  swap: { domain: 'ouranurgy', label: 'Swap', line: 'Two 2 x 2 patches of your half trade places', cost: 10, rest: 1, target: 'two', size: 2,
    legal: (s, side, a) => { const n = DUEL_POWERS.swap.size, A = patch(a.at || [], n), B = patch(a.to || [], n); if (!a.at || !a.to) return false;
      if (Math.abs(a.at[0] - a.to[0]) < n && Math.abs(a.at[1] - a.to[1]) < n) return false; // (the two patches may not overlap)
      return [...A, ...B].every(([x, y]) => mineIn(s.board, side, x, y) && movable(s.board.at(x, y))) && [...A, ...B].some(([x, y]) => s.board.at(x, y)); },
    reach: (s, side, a) => [...patch(a.at, DUEL_POWERS.swap.size), ...(a.to ? patch(a.to, DUEL_POWERS.swap.size) : [])],
    apply: (s, side, a) => { const b = s.board, n = DUEL_POWERS.swap.size, A = patch(a.at, n), B = patch(a.to, n), moved = [];
      for (let i = 0; i < A.length; i++) { const p = b.at(...A[i]), q = b.at(...B[i]); if (p) moved.push({ id: p.id, from: A[i], to: B[i] }); if (q) moved.push({ id: q.id, from: B[i], to: A[i] }); b.swap(A[i], B[i]); }
      return [{ type: 'swap', side, a: a.at, b: a.to, size: n, moved }]; } },
  manifest: { domain: 'manifestation', label: 'Manifest', line: 'Turns up to 3 junk or holes in a 3 x 3 into gems of the colour you pick, or the one most round them', cost: 20, rest: 2, target: 'cell', max: 3,
    legal: (s, side, a) => mineIn(s.board, side, ...(a.at || [-1, -1])) && filled(s, side, a.at).length > 0 && (!a.colour || colours(s).includes(a.colour)),
    reach: (s, side, a) => filled(s, side, a.at),
    apply: (s, side, a) => { const b = s.board, cells = filled(s, side, a.at), colour = a.colour || manifestColour(s, side, cells), ev = { type: 'manifest', side, at: a.at, colour, cells: [] };
      for (const [x, y] of cells) { const was = b.at(x, y)?.kind || null, p = piece('gem', { colour }); b.set(x, y, p); ev.cells.push({ at: [x, y], id: p.id, was }); }
      return [ev]; } },
  scan: { domain: 'divination', label: 'Scan', line: 'Shows the aberrant\'s next skill and puts it off 2 turns', cost: 15, rest: 3, target: null, delay: 2,
    legal: (s) => (s.foe?.moves || []).some((m) => awake(s, m)),
    reach: () => [],
    apply: (s, side) => { const m = s.foe.moves.filter((q) => awake(s, q)).sort((p, q) => p.left - q.left)[0]; m.left += DUEL_POWERS.scan.delay; return [{ type: 'scan', side, skill: m.skill, left: m.left, delay: DUEL_POWERS.scan.delay }]; } },
  lift: { domain: 'psychokinesis', label: 'Lift', line: 'Lifts a row or a column of your half and sets it down shifted', cost: 10, rest: 1, target: 'cell',
    legal: (s, side, a) => { if (!DIR[a.dir] || !mineIn(s.board, side, ...(a.at || [-1, -1]))) return false; const L = lineOf(s.board, side, a.at, a.dir), by = a.by ?? 1;
      return by >= 1 && by < L.length && L.every(([x, y]) => movable(s.board.at(x, y))) && L.some(([x, y]) => s.board.at(x, y)); },
    reach: (s, side, a) => lineOf(s.board, side, a.at, a.dir || 'E'),
    apply: (s, side, a) => { const b = s.board, L = lineOf(b, side, a.at, a.dir), n = L.length, by = ((a.dir === 'E' || a.dir === 'S' ? 1 : -1) * (a.by ?? 1) % n + n) % n, was = L.map((c) => b.at(...c)), moved = [];
      L.forEach((c, i) => { const p = was[(i - by + n) % n]; b.set(c[0], c[1], p); if (p) moved.push({ id: p.id, from: L[(i - by + n) % n], to: c }); });
      return [{ type: 'lift', side, at: a.at, dir: a.dir, by: a.by ?? 1, moved }]; } },
  herd: { domain: 'possession', label: 'Herd', line: 'Gems of one colour within 2 of the row or column you draw come onto it', cost: 20, rest: 2, target: 'cell', span: 2,
    legal: (s, side, a) => (a.dir === 'H' || a.dir === 'V') && !!gemAt(s.board, side, a.at) && herded(s, side, a).moves.length > 0,
    reach: (s, side, a) => lineOf(s.board, side, a.at, a.dir || 'H'),
    apply: (s, side, a) => { const b = s.board, { colour, moves } = herded(s, side, a), moved = [];
      for (const m of moves) { const p = b.at(...m.from), q = b.at(...m.to); b.swap(m.from, m.to); moved.push({ id: p.id, from: m.from, to: m.to }); if (q) moved.push({ id: q.id, from: m.to, to: m.from }); }
      return [{ type: 'herd', side, at: a.at, dir: a.dir, colour, moved }]; } },
  transmute: { domain: 'alteration', label: 'Transmute', line: 'Every gem of one colour on your half turns to another, and none of the old colour falls for 2 turns', cost: 25, rest: 3, target: 'cell', turns: 2,
    // (on slime, an aberrant slip jelly's junk: every slime on your half turns to gems of the colour you pick, or the one most on your
    // half; nothing lingers. The jelly's weakness: let it pile, then turn it all at once: ABERRANTS.md 5, secrets.js `dissolve`)
    legal: (s, side, a) => { const p = gemAt(s.board, side, a.at) || slimeAt(s.board, side, a.at); return !!p && (!a.colour || ((p.slime || a.colour !== p.colour) && colours(s).includes(a.colour))); },
    reach: (s, side, a) => { const p = gemAt(s.board, side, a.at) || slimeAt(s.board, side, a.at), out = []; if (p) s.board.each((q, x, y) => { if (s.board.mine(side, x) && (p.slime ? q.slime : hasTag(q, 'matches') && q.colour === p.colour)) out.push([x, y]); }); return out; },
    apply: (s, side, a) => { const b = s.board, cells = [];
      if (slimeAt(b, side, a.at)) { const colour = a.colour || mostOf(s, side, null);
        b.each((p, x, y) => { if (b.mine(side, x) && p.slime) { Object.assign(p, { kind: 'gem', tags: KINDS.gem, colour, slime: undefined, extra: undefined, born: 'slime' }); cells.push({ at: [x, y], id: p.id }); } });
        return [{ type: 'transmute', side, from: 'slime', colour, turns: 0, cells }]; }
      const from = b.at(...a.at).colour, colour = a.colour || mostOf(s, side, from);
      b.each((p, x, y) => { if (b.mine(side, x) && hasTag(p, 'matches') && p.colour === from) { p.colour = colour; cells.push({ at: [x, y], id: p.id }); } });
      s.sides[side].transmute = { from, to: colour, left: DUEL_POWERS.transmute.turns }; // (a new object each time: a copy of the side shares the old one)
      return [{ type: 'transmute', side, from, colour, turns: DUEL_POWERS.transmute.turns, cells }]; } },
  miracle: { domain: 'spellscription', label: 'Miracle', line: 'One colour\'s gems on your half clear at any 2 touching, this turn and your next', cost: 35, rest: 4, target: 'cell', need: 2, turns: 2,
    legal: (s, side, a) => !!gemAt(s.board, side, a.at) && !s.sides[side].tune,
    reach: (s, side, a) => DUEL_POWERS.transmute.reach(s, side, a),
    apply: (s, side, a) => { const S = s.sides[side], colour = s.board.at(...a.at).colour, M = DUEL_POWERS.miracle; S.tune = colour; S.tuneLeft = M.turns; S.tuneNeed = M.need;
      return [{ type: 'miracle', side, at: a.at, colour, need: M.need, turns: M.turns }]; } },
  // A LEARNED SKILL (learned.js; South, 2026-10-29: "I'm all for learning abilities from enemies"): an aberrant's own skill turned to
  // your hand, open only once learned (`learned`: newDuel's list). The Lantern Wisp's Kindle, yours: junk lit into embers that cool into
  // gems at your turn's end (the Wisp burns your gems down; you burn its junk up). For a half buried in junk; Manifest is three cells at
  // once, Kindle a whole line a turn later.
  kindle: { domain: 'alteration', label: 'Kindle', line: 'Every junk in a row or column of your half lights into an ember that cools into a gem at your turn\'s end', cost: 15, rest: 3, target: 'cell', learned: true,
    legal: (s, side, a) => (a.dir === 'H' || a.dir === 'V') && mineIn(s.board, side, ...(a.at || [-1, -1])) && lineOf(s.board, side, a.at, a.dir).some(([x, y]) => s.board.at(x, y)?.kind === 'junk'),
    reach: (s, side, a) => lineOf(s.board, side, a.at, a.dir || 'H').filter(([x, y]) => s.board.at(x, y)?.kind === 'junk'),
    apply: (s, side, a) => { const b = s.board, cells = [];
      for (const [x, y] of lineOf(b, side, a.at, a.dir)) { const p = b.at(x, y); if (p?.kind !== 'junk') continue; Object.assign(p, { kind: 'ember', tags: KINDS.ember, count: 1, slime: undefined, extra: undefined }); cells.push({ at: [x, y], id: p.id }); }
      return [{ type: 'kindle', side, at: a.at, dir: a.dir, cells }]; } },
};
export const POWER_IDS = Object.keys(DUEL_POWERS);

/** The colour a Transmute turns one into when none is asked: the one most on your half (the turn that makes the most to match). */
function mostOf(s, side, from) {
  const n = {}; s.board.each((p, x) => { if (s.board.mine(side, x) && hasTag(p, 'matches') && p.colour !== from) n[p.colour] = (n[p.colour] || 0) + 1; });
  return Object.entries(n).sort((p, q) => q[1] - p[1])[0]?.[0] || colours(s).find((c) => c !== from);
}

/** What a power costs a side now: its cost, falling to 0.6 of it as its domain's level goes 1 to 99 (the ramp's curve). */
export function powerCost(s, side, id) {
  const P = DUEL_POWERS[id], lv = s.sides[side].levels?.[P.domain] ?? 1, t = Math.pow(Math.max(0, Math.min(1, (lv - 1) / 98)), RAMP_CURVE);
  return Math.round(P.cost * (1 - 0.4 * t));
}

/** The cells a power would touch for an action (the view's reach under the finger). */
export function powerReach(s, side, a) {
  const P = DUEL_POWERS[a.power]; if (!P) return [];
  return a.at || !P.target ? P.reach(s, side, a) : [];
}

/** The powers a side has now, each with its cost, its rest and whether it can fire (the view's tiles; the bot's choices). */
export function powersOf(s, side) {
  const S = s.sides[side]; if (!S.powers) return [];
  return POWER_IDS.filter((id) => !DUEL_POWERS[id].learned || S.learned?.includes(id)).map((id) => { const P = DUEL_POWERS[id], cost = powerCost(s, side, id), left = S.powerRest?.[id] || 0, used = (S.powerUsed || []).includes(id);
    return { id, domain: P.domain, label: P.label, line: P.line, target: P.target, cost, rest: P.rest, left, used, ready: !left && !used && S.pool >= cost }; });
}

/** The free action that fires a power: worn by the side (the PvE duel's hand), rested, paid for, its target good. */
export const POWER_ACTION = { form: null, cost: 0,
  legal: (s, side, a) => { const S = s.sides[side], P = DUEL_POWERS[a.power]; if (!P || !S.powers || (P.learned && !S.learned?.includes(a.power)) || S.powerRest?.[a.power] || (S.powerUsed || []).includes(a.power) || S.pool < powerCost(s, side, a.power)) return false;
    return P.legal ? P.legal(s, side, a) : true; },
  apply: (s, side, a) => { const S = s.sides[side], P = DUEL_POWERS[a.power], cost = powerCost(s, side, a.power);
    S.pool -= cost; S.powerRest = { ...S.powerRest, [a.power]: P.rest }; S.powerUsed = [...(S.powerUsed || []), a.power]; S.powersUsed = (S.powersUsed || 0) + 1; // (new objects: a lookahead's copy of the side shares the old ones)
    return [{ type: 'power', side, power: a.power, domain: P.domain, cost, pool: S.pool, at: a.at || null }, ...P.apply(s, side, a)]; } };

/** A good drag's reward (PUZZLE-DUELS.md 26.2): every resting power `n` turns nearer, said once. */
export function cutRests(s, side, n) {
  const S = s.sides[side]; if (!S.powerRest || n <= 0) return [];
  let any = false; const R = {}; for (const [k, v] of Object.entries(S.powerRest)) { R[k] = Math.max(0, v - n); if (R[k] !== v) any = true; }
  S.powerRest = R; return any ? [{ type: 'rest.cut', side, n }] : [];
}

/** A side's turn ending: each power resting a turn less, the turn's used list cleared, a transmute's turns counted down. */
export function tickRests(s, side) {
  const S = s.sides[side], out = [];
  if (S.powerRest) S.powerRest = Object.fromEntries(Object.entries(S.powerRest).map(([k, v]) => [k, Math.max(0, v - 1)]));
  S.powerUsed = [];
  if (S.transmute) { const left = S.transmute.left - 1; if (left > 0) S.transmute = { ...S.transmute, left }; else { out.push({ type: 'transmute.end', side, from: S.transmute.from }); S.transmute = null; } }
  return out;
}

/** A gem new to a side (the drip, skyfall) under its transmute: the colour it took away comes in as the one it became. */
export function underTransmute(s, side, p) {
  const T = side != null && s.sides[side]?.transmute; if (T && p?.colour === T.from) p.colour = T.to; return p;
}

/** A sample of the legal power actions for a side now (each ready power at up to `n` targets; its colour left to the power's own pick). */
export function powerActions(s, side, n, rng) { // (rng: a quiet stream, never the duel's own: duel.js quietStream)
  const out = [], b = s.board, cells = []; for (let y = 0; y < b.h; y++) for (let x = 0; x < b.w; x++) if (b.mine(side, x)) cells.push([x, y]);
  const pick = () => cells[Math.floor(rng() * cells.length)];
  for (const P of powersOf(s, side)) {
    if (!P.ready) continue;
    if (!P.target) { const a = { kind: 'power', power: P.id }; if (POWER_ACTION.legal(s, side, a)) out.push(a); continue; }
    for (let i = 0, got = 0; i < n * 4 && got < n; i++) {
      const a = { kind: 'power', power: P.id, at: pick() };
      if (P.id === 'swap') a.to = pick(); if (P.id === 'lift') { a.dir = 'ESWN'[Math.floor(rng() * 4)]; a.by = 1 + Math.floor(rng() * 2); } if (P.id === 'herd' || P.id === 'kindle') a.dir = rng() < 0.5 ? 'H' : 'V';
      if (POWER_ACTION.legal(s, side, a)) { out.push(a); got++; }
    }
  }
  return out;
}
