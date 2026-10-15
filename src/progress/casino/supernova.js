// ---------------------------------------------------------------------------------------
// ASTROLL: SUPERNOVA RUN (docs/plans/CASINO.md section 6; the owner's design doc: "the dice equivalent of nuclear fission and fusion"):
// each player starts with four six-sided dice and makes more. A turn is one of three things:
//   RUN A REACTION   every die in your hand is rolled. A die showing its MAXIMUM is duplicated (the copy joins your hand for good) and both
//                    roll again; a die showing a natural 1 DECAYS two steps (a d12 to a d8; a d6 or d8 to a d4) and rolls again, and a d4
//                    showing a 1 is lost. The reaction runs until no die shows a maximum or a 1; the faces it settled on are your points.
//   SPLIT            one die into two whose sides add up to it, each a real die (a d12 into a d8 and a d4, or two d6).
//   FUSE             two or three dice into one whose sides they add up to (two d6 into a d12; a d4 and a d6 into a d10).
// Points are kept, and the first to the THRESHOLD wins the pot (the owner's "hit a threshold of points"). A natural 20 on a d20 in a
// reaction is a SUPERNOVA: the reaction stops there, that player's points are doubled, and the ROUND ends: every hand goes back to four
// six-sided dice (the engines everyone built are spent). A player with no dice sits the round out. So the game is a race between running
// reactions for points and spending turns fusing a d20, a doubling that also wipes the table's engines.
// Decided here where the doc was open (the owner said go, 2026-10-15; CASINO.md 6 lists each): duplicates stay in the hand, which holds
// 12 dice at most (a maximum past that settles); a d6's 1 decays to a d4 (the floor), not out; fusing takes two or three dice; a round in
// which every hand is gone ends without a doubling; a game past its turn cap goes to the most points.
//
// Prior art: the owner's design doc; Button Men and Dice Masters (dice that change size), Machi Koro's dice as an engine, a fission chain
// (each neutron splitting another) as the reaction's shape: it converges because a die doubles only on its maximum.
//
//   SUPERNOVA (the game: table.js's interface)   SUPERNOVA_RULES   splitsOf(sides)   fusesOf(hand)   supernovaBot(view, pending, r, style?)
// ---------------------------------------------------------------------------------------
import { die } from './table.js';

/** The numbers: the starting hand, the hand's cap, the points that win, the turns before a game goes to the most points, the sizes, the
 *  Supernova's multiplier, the reaction's step guard. */
export const SUPERNOVA_RULES = { start: [6, 6, 6, 6], maxDice: 12, threshold: 500, cap: 240, sizes: [4, 6, 8, 10, 12, 20], nova: 2, guard: 400 };
const R = SUPERNOVA_RULES, SIZES = R.sizes;
const decay = (s) => SIZES[Math.max(0, SIZES.indexOf(s) - 2)];

/** The ways one die splits into two real dice: [[a, b]] with a <= b. */
export function splitsOf(s) { const out = []; for (const a of SIZES) { const b = s - a; if (a <= b && SIZES.includes(b)) out.push([a, b]); } return out; }
/** The ways two or three dice of a hand fuse into one real die, by their sides (deduplicated): [{ parts, into }]. */
export function fusesOf(hand) {
  const out = [], seen = new Set(), n = hand.length;
  const add = (parts) => { const into = parts.reduce((a, b) => a + b, 0), k = parts.slice().sort((a, b) => a - b).join('+'); if (SIZES.includes(into) && !seen.has(k)) { seen.add(k); out.push({ parts: parts.slice().sort((a, b) => a - b), into }); } };
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) { add([hand[i], hand[j]]); for (let k = j + 1; k < n; k++) add([hand[i], hand[j], hand[k]]); }
  return out;
}
const take = (hand, parts) => { for (const s of parts) hand.splice(hand.indexOf(s), 1); };

function alive(S) { return [...Array(S.n).keys()].filter((q) => S.hands[q].length); }
function newRound(S) { S.round++; S.hands = [...Array(S.n)].map(() => R.start.slice()); }
function next(S) {
  if (S.points.some((x) => x >= R.threshold)) return end(S);
  if (S.turnsTotal >= R.cap) return end(S);
  if (!alive(S).length) { S.log.push({ fizzle: S.round }); newRound(S); }
  for (let k = 1; k <= S.n; k++) { const q = (S.turn + k) % S.n; if (S.hands[q].length) { S.turn = q; return queue(S); } }
  end(S);
}
function queue(S) {
  const h = S.hands[S.turn], moves = [{ react: true }];
  for (const s of [...new Set(h)]) for (const into of splitsOf(s)) if (h.length < R.maxDice) moves.push({ split: s, into });
  for (const f of fusesOf(h)) moves.push({ fuse: f.parts, into: f.into });
  S.pending.push({ seat: S.turn, kind: 'turn', moves });
}
function end(S) {
  S.done = true;
  let w = 0; for (let q = 0; q < S.n; q++) if (S.points[q] > S.points[w]) w = q;
  S.winner = w; S.log.push({ win: w, points: S.points[w] });
}

/** One reaction: the hand rolled until nothing shows a maximum or a 1. Returns { points, nova, faces, born, lost }. */
function react(S, p, r) {
  const hand = S.hands[p], work = hand.map((s, i) => ({ s, i })), faces = [];
  let born = 0, lost = 0, decayed = 0, steps = 0, nova = false;
  // the hand is rebuilt from what settles (a die that decays or is lost changes it; a duplicate joins it)
  const settled = [];
  while (work.length && steps++ < R.guard) {
    const d = work.pop(), v = die(r, d.s);
    if (d.s === 20 && v === 20) { nova = true; faces.push(20); settled.push(20); break; }
    if (v === d.s) {
      if (settled.length + work.length + 1 < R.maxDice) { born++; work.push({ s: d.s }, { s: d.s }); continue; }
      faces.push(v); settled.push(d.s); continue; // (the hand is full: a maximum settles)
    }
    if (v === 1) { if (d.s === 4) { lost++; continue; } decayed++; work.push({ s: decay(d.s) }); continue; }
    faces.push(v); settled.push(d.s);
  }
  for (const d of work) settled.push(d.s); // (a Supernova stops the reaction: the dice still rolling stay as they are)
  S.hands[p] = settled.sort((a, b) => a - b);
  const points = faces.reduce((a, b) => a + b, 0);
  return { points, nova, faces, born, lost, decayed };
}

export const SUPERNOVA = {
  id: 'supernova', seats: [1, 6],
  setup({ seats, r, opts = {} }) {
    const S = { n: seats, hands: [...Array(seats)].map(() => R.start.slice()), points: Array(seats).fill(0), turns: Array(seats).fill(0), turnsTotal: 0, round: 1, novas: Array(seats).fill(0), turn: (opts.first ?? 0) % seats, pending: [], log: [], done: false };
    queue(S);
    return S;
  },
  pending: (S) => S.pending[0] || null,
  apply(S, m, r) {
    const P = S.pending.shift(), p = P.seat, h = S.hands[p];
    S.turns[p]++; S.turnsTotal++;
    if (m.split != null) { take(h, [m.split]); h.push(...m.into); h.sort((a, b) => a - b); S.log.push({ seat: p, split: m.split, into: m.into }); return next(S); }
    if (m.fuse) { take(h, m.fuse); h.push(m.into); h.sort((a, b) => a - b); S.log.push({ seat: p, fuse: m.fuse, into: m.into }); return next(S); }
    const x = react(S, p, r);
    S.points[p] += x.points;
    S.log.push({ seat: p, react: x.points, faces: x.faces, born: x.born, lost: x.lost, decayed: x.decayed, hand: S.hands[p].slice() });
    if (x.nova) { S.points[p] *= R.nova; S.novas[p]++; S.log.push({ nova: p, points: S.points[p], round: S.round }); newRound(S); }
    next(S);
  },
  result: (S) => (S.done ? { winner: S.winner, novas: S.novas.slice(), points: S.points.slice(), scores: S.points.slice(), turns: S.turnsTotal, rounds: S.round } : null),
  view: (S, seat) => ({ seat, n: S.n, hands: S.hands, points: S.points, turns: S.turns, mine: S.hands[seat], threshold: R.threshold, round: S.round, last: S.log[S.log.length - 1] }),
};

/** A bot. With a d20 it runs the reaction (the Supernova is a roll of it); otherwise it fuses toward a d20 when `style.build` (0..1) says
 *  so, preferring a fuse straight into a d20, then one that makes a d12, d10 or d8 it can fuse again; else it runs the reaction. Behind,
 *  it builds harder (a doubling is the way back); near the threshold, it only reacts. */
export function supernovaBot(V, P, r, style = {}) {
  const me = V.seat, hand = V.mine, build = style.build ?? 0.5, react = P.moves[0];
  if (hand.includes(20)) return react;
  const best = Math.max(...V.points.filter((_, q) => q !== me), 0), behind = best - V.points[me], near = V.points[me] > V.threshold * 0.75;
  const lean = near ? 0 : build + (behind > 60 ? 0.3 : 0) - (behind < -60 ? 0.3 : 0);
  if (r() > lean) return react;
  const fuses = P.moves.filter((m) => m.fuse);
  const to20 = fuses.find((m) => m.into === 20); if (to20) return to20;
  // a step toward a d20: make the die whose partner is already in hand (d12 with a d8, d10 with a d10, d8 with a d12)
  const partner = { 12: 8, 8: 12, 10: 10 };
  const step = fuses.filter((m) => m.into !== 20 && partner[m.into] && hand.includes(partner[m.into]) && !m.fuse.includes(partner[m.into])).sort((a, b) => b.into - a.into)[0];
  if (step) return step;
  const grow = fuses.filter((m) => m.into >= 8 && m.fuse.length === 2).sort((a, b) => b.into - a.into)[0];
  return grow && hand.length > 3 ? grow : react;
}
