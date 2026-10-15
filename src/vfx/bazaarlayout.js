// ---------------------------------------------------------------------------------------
// THE TABLE'S LAYOUT (docs/plans/CASINO.md section 9; Dovina's handoff of 2026-10-15, item 2): what a seat at Raku's tables may see
// (`T.game.view(S, 0)`, world/bazaar/session.js) laid out as the real pieces on the cloth (vfx/bazaarpieces.js), in the table's own frame
// (metres; y 0 the cloth, +z toward you, +x your right; the seat after yours on your right, as at a mahjong table). A piece that is
// yours to choose carries `act`, which makes the very move the table's page would (world/bazaar/views.js, kept as the fallback for the
// choices that are no piece: the Fate Clause, a win declared, standing, the Zodiac's lock and upgrade, "again", "rise").
//   - QUERENT: your hand fanned toward you, the draw pile at your right hand, each seat's top discard toward the middle (yours to steal
//     where a steal is open), the others' hands face down before them, the Major Arcana flipped beside each player (yours face up), your
//     fours set aside, the table's stakes as chips in the middle; the Fool's choice, the Hierophant's ranks and the Hermit's nine laid
//     out on the cloth when they are asked.
//   - ZODIAC: each player's twelve tiles in a row (open standing, shut face down, locked face up in gold), the two sealing dice and the
//     turn's attack die in the middle, the pot and each purse as chips, the lock tokens in gold. Click tiles to choose them, then the
//     dice to shut (or reopen) them.
//   - EVENT HORIZON: each seat's set, the dice still to roll in a row and those rolled in a cluster showing what they made, the dealer's
//     hidden handful under cups (lifted at the end), the pot as chips. Click your dice to choose them, then your cup to roll.
//   - SUPERNOVA RUN and NEBULA BLUFF: vfx/bazaarlayoutastroll.js, registered here (`registerLayout`). A game with no layout lays out
//     nothing (its page still plays it), so a new table opens safely.
// Dice values are the rules': a die shows what the table rolled; where the rules keep only a sum (Event Horizon), the faces are a split of
// that sum, each in its die's range.
//
// Prior art: the riichi table's seats and ponds (Mahjong Soul), a Shut the Box board's row, Hearthstone's hand fanned at the bottom and
// its lit playable cards, the craps table's chip stacks.
//
//   layoutTable(session, { zsel, t }) -> [{ id, tpl, p: [x, y, z], q, glaze?, act?, sel?, glow?, die?: { sides, value, skin }, from?,
//     rollKey?, still? }]   (a die whose rollKey changes tumbles onto its value; `still` holds it; `glow` lights it a beat)
//   registerLayout(id, fn(out, S, V, P, R, ctx))   splitSum(sum, sides[]) -> values   chipsOf(amount) -> [kinds]
//   helpers for the other layouts: qOf, seatAt, chips, die
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { cardTpl, dieTpl, dieRest, chipTpl, tileTpl, cupTpl, PIECE } from './bazaarpieces.js';
import { cardIndex, CARD_BACK } from './bazaarfaces.js';

const _e = new THREE.Euler();
export const qOf = (x, y, z, order = 'YXZ') => new THREE.Quaternion().setFromEuler(_e.set(x, y, z, order));
/** A card lying face up (its top away from you), face down, and turned by `yaw` about the vertical. */
const UP = (yaw = 0) => qOf(-Math.PI / 2, yaw, 0), DOWN = (yaw = 0) => qOf(Math.PI / 2, yaw, 0);
/** A point at a seat: `rho` metres out from the middle toward seat q of n, `x` along that seat's edge (to its right). */
export function seatAt(q, n, rho, x = 0) { const a = (q * Math.PI * 2) / n, c = Math.cos(a), s = Math.sin(a); return [x * c + rho * s, -x * s + rho * c]; }

/** A sum split over dice (each between 1 and its sides), as even as it goes: the faces shown where the rules keep only the total. */
export function splitSum(sum, sides) {
  const v = sides.map(() => 1); let left = Math.max(0, Math.min(sum, sides.reduce((a, s) => a + s, 0)) - v.length);
  while (left > 0) { let moved = false; for (let i = 0; i < v.length && left > 0; i++) if (v[i] < sides[i]) { v[i]++; left--; moved = true; } if (!moved) break; }
  return v;
}
/** An amount as chips, the biggest first (25, 5, 1), at most 40. */
export function chipsOf(amount) { const out = []; let a = Math.max(0, Math.floor(amount)); for (const [k, v] of [['25', 25], ['5', 5], ['1', 1]]) while (a >= v && out.length < 40) { out.push(k); a -= v; } return out; }

/** Stacks of chips at (x, z): a stack a value, ten at most a stack. */
export function chips(out, id, amount, x, z, kinds = chipsOf(amount)) {
  const stacks = []; for (const k of kinds) { let s = stacks.find((t) => t.k === k && t.n < 10); if (!s) stacks.push((s = { k, n: 0 })); s.n++; }
  let c = 0; stacks.forEach((s, j) => { for (let i = 0; i < s.n; i++, c++) out.push({ id: `${id}:${c}`, tpl: chipTpl(s.k), p: [x + (j % 4) * 0.092 - 0.14, i * PIECE.chip.h, z + Math.floor(j / 4) * 0.092], q: qOf(0, i * 0.7, 0), glaze: true }); });
}
/** A die resting at (x, z) with `value` up. */
export function die(out, id, sides, value, x, z, skin = String(sides), extra = {}) {
  const q = new THREE.Quaternion(), yaw = (hash(id) % 628) / 100, lift = dieRest(sides, value, yaw, q);
  out.push({ id, tpl: dieTpl(sides, skin), p: [x, lift, z], q, glaze: true, die: { sides, value, skin }, ...extra });
}
const hash = (s) => { let h = 7; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; };

export function layoutTable(S, ctx = {}) {
  const T = S.T, St = S.S, V = T.game.view(St, 0), R = T.game.result(St), P0 = R ? null : T.game.pending(St), P = P0 && P0.seat === 0 ? P0 : null;
  const out = [], fn = LAYOUTS.get(T.id);
  if (fn) fn(out, S, V, P, R, ctx, T); // (a game with no layout: nothing on the cloth, its page plays it)
  return out;
}
const LAYOUTS = new Map();
/** A game's layout: `fn(out, session, view, pending (yours), result, ctx, table)` pushes its pieces into `out`. */
export function registerLayout(id, fn) { LAYOUTS.set(id, fn); }

// ---------------------------------------------------------------- Querent
function querent(out, S, V, P, R, ctx, T) {
  const n = V.n, move = (m) => () => { S.sel = new Set(); S.move(m); }, find = (f) => P?.moves.find(f);
  const targetOf = (q) => { const m = P && /^(lovers|sun|judgment|ability\.downgrade)$/.test(P.kind) && find((x) => x.target === q); return m ? move(m) : null; };
  // your hand, fanned toward you
  const order = V.hand.map((_, i) => i).sort((a, b) => V.hand[a].r - V.hand[b].r || V.hand[a].s - V.hand[b].s), seen = {}, k = order.length, sel = (S.sel ||= new Set());
  order.forEach((i, j) => {
    const c = V.hand[i], key = `${c.r}.${c.s}`, o = (seen[key] = (seen[key] ?? -1) + 1), x = (j - (k - 1) / 2) * Math.min(0.15, 1.5 / Math.max(1, k));
    let act = null;
    if (P?.kind === 'discard' && find((m) => m.discard === i)) act = move({ discard: i });
    else if (P?.kind === 'wheel') act = () => { if (sel.has(i)) sel.delete(i); else sel.add(i); S.render(); };
    out.push({ id: `h:${key}#${o}`, tpl: cardTpl(cardIndex(c)), p: [x, 0.2 - Math.abs(x) * 0.12, 1.55 + j * 0.004], q: qOf(-0.85, 0, -x * 0.45, 'XYZ'), act, sel: sel.has(i), from: [1.0, 0.05, 0.9] });
  });
  // the draw pile at your right hand: a draw, or the Wheel's throw back
  let pile = null;
  if (P?.kind === 'acquire') { const m = find((x) => x.draw); if (m) pile = move(m); }
  else if (P?.kind === 'wheel') pile = () => { const ix = [...sel].sort((a, b) => a - b); S.sel = new Set(); S.move(P.moves.find((m) => m.throw.length === ix.length && m.throw.every((v, j) => v === ix[j])) || { throw: [] }); };
  for (let i = 0; i < 7; i++) out.push({ id: 'deck', tpl: cardTpl(CARD_BACK), p: [1.0, 0.004 + i * 0.006, 0.9], q: DOWN(0.1), act: pile });
  // each seat: its top discard toward the middle, its hand face down before it (shown if the Sun showed it), its Major Arcana beside it
  for (let q = 0; q < n; q++) {
    const top = V.tops[q], [dx, dz] = seatAt(q, n, 0.62);
    if (top) { const steal = P?.kind === 'acquire' && find((m) => m.steal === q); out.push({ id: `top:${q}`, tpl: cardTpl(top.hidden ? CARD_BACK : cardIndex(top)), p: [dx, 0.004, dz], q: top.hidden ? DOWN() : UP(), act: steal ? move(steal) : targetOf(q) }); }
    const Q = V.players[q], a = (q * Math.PI * 2) / n;
    if (q > 0) {
      const hs = Q.handSize; for (let i = 0; i < hs; i++) {
        const x = (i - (hs - 1) / 2) * 0.09, [hx, hz] = seatAt(q, n, 1.62, x), c = Q.hand?.[i];
        out.push({ id: `oh:${q}:${i}`, tpl: cardTpl(c ? cardIndex(c) : CARD_BACK), p: [hx, 0.004 + i * 0.002, hz], q: c ? UP(a) : DOWN(a + Math.PI), act: targetOf(q), from: [hx * 1.3, 0.3, hz * 1.3] });
      }
    }
    const ids = q === 0 ? V.mine : Array(Q.arcana).fill(CARD_BACK);
    ids.forEach((id, i) => { const [ax, az] = q === 0 ? [-1.25 + i * 0.17, 0.95] : seatAt(q, n, 1.25, -0.75 - i * 0.05); out.push({ id: `arc:${q}:${i}`, tpl: cardTpl(id === CARD_BACK ? CARD_BACK : id, 0.15, 0.244), p: [ax, 0.004 + i * 0.002, az], q: id === CARD_BACK ? DOWN(a + Math.PI) : UP(), act: q ? targetOf(q) : null }); });
  }
  // your fours, set aside
  V.quads.forEach((r, j) => { for (let s = 0; s < 4; s++) out.push({ id: `quad:${r}:${s}`, tpl: cardTpl(cardIndex({ r, s }), 0.13, 0.211), p: [1.35 + s * 0.035, 0.004 + s * 0.002, 0.5 - j * 0.24], q: UP(0.15) }); });
  // a choice laid out on the cloth: the Fool's Major Arcana, the Hierophant's ranks, the Hermit's nine
  if (P?.kind === 'fool') P.moves.forEach((m, j) => out.push({ id: `fool:${m.arcana}`, tpl: cardTpl(m.arcana, 0.15, 0.244), p: [((j % 7) - 3) * 0.17, 0.03, -0.45 + Math.floor(j / 7) * 0.27], q: UP(), act: move(m), from: [1.0, 0.05, 0.9] }));
  if (P?.kind === 'hierophant') P.moves.forEach((m, j) => out.push({ id: `rank:${m.rank}`, tpl: cardTpl(cardIndex({ r: m.rank, s: V.seatSuit }), 0.15, 0.244), p: [(j - (P.moves.length - 1) / 2) * 0.16, 0.03, 0.05], q: UP(), act: move(m), from: [1.0, 0.05, 0.9] }));
  if (P?.kind === 'hermit' && V.peek) V.peek.forEach((c, i) => { const m = find((x) => x.top.length === 1 && x.top[0] === i); out.push({ id: `peek:${i}`, tpl: cardTpl(cardIndex(c), 0.15, 0.244), p: [(i - (V.peek.length - 1) / 2) * 0.16, 0.03, 0.05], q: UP(), act: m ? move(m) : null, from: [1.0, 0.05, 0.9] }); });
  if (!R) chips(out, 'pot', T.stake * T.seats, -0.05, -0.08);
}

// ---------------------------------------------------------------- Zodiac
function zodiac(out, S, V, P, R, ctx) {
  const zsel = ctx.zsel, turn = S.S.turn, d = V.dice;
  const pick = (kind, q) => (t) => {
    if (P?.kind !== kind) return null;
    const ok = P.moves.some((m) => (kind === 'attack' ? m.target === q && m.tiles : m.tiles)?.includes(t));
    return ok ? () => { const k = `${q}:${t}`; if (zsel.has(k)) zsel.delete(k); else zsel.add(k); } : null;
  };
  for (let q = 0; q < V.n; q++) {
    const z = q === 0 ? 0.92 : -0.92, act = q === 0 ? pick('seal', 0) : pick('attack', q);
    for (let t = 1; t <= 12; t++) {
      const shut = V.tiles[q][t - 1], locked = V.locked[q][t - 1], x = (t - 6.5) * 0.125, a = act(t);
      const state = locked ? 'locked' : 'open', q2 = shut ? qOf(locked ? -Math.PI / 2 : Math.PI / 2, 0, 0, 'XYZ') : qOf(0, 0, 0);
      const half = PIECE.tile.h / 2; // (a tile lies down about its foot: face down toward you when shut, face up away from you when locked)
      out.push({ id: `tile:${q}:${t}`, tpl: tileTpl(t, state), p: [x, shut ? PIECE.tile.d / 2 : 0, z + (shut ? (locked ? half : -half) : 0)], q: q2, glaze: true, act: a, sel: zsel.has(`${q}:${t}`) });
    }
    // the purse, the lock tokens, the attack die's size (a die of it at rest, its top face its sides)
    chips(out, `purse:${q}`, V.chips[q], 1.15, q === 0 ? 0.55 : -0.75);
    for (let i = 0; i < V.tokens[q]; i++) out.push({ id: `token:${q}:${i}`, tpl: chipTpl('gold'), p: [-1.2 + i * 0.1, 0, q === 0 ? 0.6 : -0.6], q: qOf(0, i, 0), glaze: true });
    if (q !== turn) die(out, `atkrest:${q}`, V.attack[q], V.attack[q], -1.05, q === 0 ? 0.35 : -0.35, `atk${V.attack[q]}`);
  }
  // the dice in the middle: shut the chosen tiles (a seal or an attack), or the free reroll
  const chosen = (q) => [...zsel].filter((k) => k.startsWith(`${q}:`)).map((k) => +k.split(':')[1]).sort((a, b) => a - b);
  const same = (a, b) => a && a.length === b.length && a.slice().sort((x, y) => x - y).every((v, i) => v === b[i]);
  let roll = null;
  if (P?.kind === 'seal') { const c = chosen(0), m = P.moves.find((x) => x.by === 'sum' && same(x.tiles, c)) || P.moves.find((x) => same(x.tiles, c)); if (m) roll = () => { zsel.clear(); S.move(m); }; }
  else if (P?.kind === 'attack') { const m = P.moves.find((x) => x.tiles && same(x.tiles, chosen(x.target))); if (m) roll = () => { zsel.clear(); S.move(m); }; }
  else if (P?.kind === 'ability.reroll') { const m = P.moves.find((x) => x.reroll); if (m) roll = () => S.move(m); }
  const side = turn === 0 ? 0.32 : -0.32;
  die(out, 'zd:a', 6, d.a, -0.18, side, '6', { act: roll });
  die(out, 'zd:b', 6, d.b, 0.0, side + 0.02, '6', { act: roll });
  die(out, 'zd:atk', V.attack[turn], d.atk, 0.2, side - 0.01, `atk${V.attack[turn]}`, { act: P?.kind === 'attack' ? roll : null });
  if (V.pot > 0) chips(out, 'pot', V.pot, -0.5, -0.05);
}

// ---------------------------------------------------------------- Event Horizon
function horizon(out, S, V, P, R) {
  const n = V.n, St = S.S, dsel = (S.dsel ||= []);
  for (let q = 0; q < n; q++) {
    const used = V.used[q], left = V.left[q], faces = splitSum(V.sums[q], used), count = {};
    const idOf = (s) => `ed:${q}:${s}:${(count[s] = (count[s] ?? -1) + 1)}`;
    used.forEach((s, i) => { const [x, z] = seatAt(q, n, 0.62, (i - (used.length - 1) / 2) * 0.17); die(out, idOf(s), s, faces[i], x, z, String(s), { roll: q }); });
    left.forEach((s, i) => {
      const [x, z] = seatAt(q, n, 1.08, (i - (left.length - 1) / 2) * 0.18);
      const act = q === 0 && P?.kind === 'roll' ? () => { const k = dsel.indexOf(i); if (k >= 0) dsel.splice(k, 1); else dsel.push(i); S.render(); } : null;
      die(out, idOf(s), s, s, x, z, String(s), { act, sel: q === 0 && dsel.includes(i) });
    });
  }
  // your cup: roll the dice you chose; your last roll answers the free reroll
  let roll = null;
  if (P?.kind === 'roll' && dsel.length) { const dice = dsel.map((i) => V.mine[i]).sort((a, b) => a - b), m = P.moves.find((x) => x.dice && x.dice.slice().sort((a, b) => a - b).join() === dice.join()); if (m) roll = () => { S.dsel = []; S.move(m); }; }
  out.push({ id: 'cup:mine', tpl: cupTpl(0.085, 0.13, true), p: [1.05, 0, 0.62], q: qOf(0, 0, 0), glaze: true, act: roll });
  if (P?.kind === 'reroll') { const m = P.moves.find((x) => x.reroll); for (const e of out) if (e.roll === 0 && e.die) e.act = () => S.move(m); }
  // the dealer's handful: under cups until the round is done, then shown
  const D = St.dealer;
  if (!R) for (let i = 0; i < V.par; i++) out.push({ id: `dealer:cup:${i}`, tpl: cupTpl(), p: [(i - (V.par - 1) / 2) * 0.2, 0, -0.1], q: qOf(0, i, 0), glaze: true });
  else { const f = splitSum(D.total, D.dice); D.dice.forEach((s, i) => die(out, `dealer:die:${i}`, s, f[i], (i - (D.dice.length - 1) / 2) * 0.2, -0.1, String(s))); }
  if (!R && St.pot > 0) chips(out, 'pot', St.pot, -0.05, 0.22);
}

registerLayout('querent', querent);
registerLayout('zodiac', zodiac);
registerLayout('eventhorizon', horizon);
