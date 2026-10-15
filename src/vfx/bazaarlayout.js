// ---------------------------------------------------------------------------------------
// THE TABLE'S LAYOUT (docs/plans/CASINO.md section 9; docs/plans/CASINO-CLARITY.md section 5): what a seat at Raku's tables may see
// (`T.game.view(S, 0)`, world/bazaar/session.js) laid out as the real pieces on the cloth (vfx/bazaarpieces.js), in the table's own frame
// (metres; y 0 the cloth, +z toward you, +x your right; the seat after yours on your right, as at a mahjong table). A piece that is
// yours to choose carries `act`, which makes the very move the table's page would (world/bazaar/views.js, kept as the fallback for the
// choices that are no piece: the Fate Clause, a win declared, standing, the Zodiac's lock and upgrade, "again", "rise").
//
// THE CLARITY CONTRACT (the owner, 2026-10-15; Dovina's coach, progress/casino/coach/): a layout never works out for itself what the coach
// gives (the hand's groups, the waits, a move's pieces, the odds); it reads `ctx.coach` and sizes each piece by the spec's ladder.
//   ctx = { zsel, t, coach, chosen: Set<pieceId>, seatColour(q) -> hex, legal: Set<pieceId> (what you may take now: every piece of every
//     move, or, with some chosen, the pieces still choosable: coach `selectable`), pick: selectable() }
//   each piece pushed carries its id (the coach's pieceIds: tile:q:t, h:r.s#nth, ed:q:sides:nth, top:q, deck, fool:id, rank:r), and
//     tier ('XL' | 'L' | 'M' | 'S': the ladder, section 5, scaling the piece), dim (the atlas's dim twin), role (goal, hand, moves, seats,
//     centre, dice, tiles, claim, tell: the how-to's targets), owner (a seat, for its rim), tip ({ label, line }: shown on hover)
//   out.anchors = [{ key, at: Vector3 (the table's frame), ...}]: 'seat:<q>' (a plate), 'goal', 'centre' (the shared numbers), and
//     any other key with `text` (+ `kind`: equation, need, odds, waits, arcana, bracket; `tone`; `to` the far end of a bracket; `sub`) is a
//     word the table view writes on the cloth. Words and numbers by the owner's exception, only inside the table view.
//   - QUERENT: your hand fanned toward you, its groups side by side under gold brackets, its pairs under a thin rim, the loose cards
//     after; a throw's waits a number on its card; each seat's top discard toward the middle (the one you could steal lifted and
//     big, the rest dim), the draw pile at your right hand, the others' hands small and face down, your Major Arcana in a column with
//     their one line, your fours set aside, the table's stakes as chips in the middle; the Fool's choice, the Hierophant's ranks and
//     the Hermit's nine laid out on the cloth when they are asked.
//   - ZODIAC: your twelve tiles big in a row (open standing, shut face down, locked face up in gold), theirs small, the two white dice
//     and the gold attack die big in the middle with the sum and the product written under them, the pot and each purse as chips.
//     Click tiles to choose them (only those that still lead to a move stay lit), then the dice to shut (or reopen) them.
//   - EVENT HORIZON: your dice big to pick from, the others small, those rolled in a cluster showing what they made, the dealer's
//     hidden handful under cups (lifted at the end), your total and what you need, and the chosen handful's odds beside your cup.
//   - SUPERNOVA RUN and NEBULA BLUFF: vfx/bazaarlayoutastroll.js, registered here (`registerLayout`). A game with no layout lays out
//     nothing (its page still plays it), so a new table opens safely.
// Dice values are the rules': a die shows what the table rolled; where the rules keep only a sum (Event Horizon), the faces are a split of
// that sum, each in its die's range.
//
// Prior art: the riichi table's seats and ponds (Mahjong Soul: the hand sorted into its melds), a Shut the Box board's row,
// Hearthstone's hand fanned at the bottom and its lit playable cards, the craps table's chip stacks, the poker clients' pot odds.
//
//   layoutTable(session, ctx) -> [{ id, tpl, p: [x, y, z], q, tier, dim, role, owner?, tip?, glaze?, act?, sel?, glow?, die?: { sides, value, skin },
//     from?, rollKey?, still? }] with .anchors   (a die whose rollKey changes tumbles onto its value; `still` holds it; `glow` lights it a beat)
//   registerLayout(id, fn(out, S, V, P, R, ctx, T))   splitSum(sum, sides[]) -> values   chipsOf(amount) -> [kinds]
//   helpers for the other layouts: qOf, seatAt, chips, die, anchor, dimmed
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { cardTpl, dieTpl, dieRest, chipTpl, tileTpl, cupTpl, PIECE, tierScale } from './bazaarpieces.js';
import { cardIndex, CARD_BACK } from './bazaarfaces.js';
import { seatColour } from './seatlook.js';
import { selectable } from '../progress/casino/coach/index.js';

const _e = new THREE.Euler();
export const qOf = (x, y, z, order = 'YXZ') => new THREE.Quaternion().setFromEuler(_e.set(x, y, z, order));
/** A card lying face up (its top away from you), face down, and turned by `yaw` about the vertical. */
const UP = (yaw = 0) => qOf(-Math.PI / 2, yaw, 0), DOWN = (yaw = 0) => qOf(Math.PI / 2, yaw, 0);
/** A point at a seat: `rho` metres out from the middle toward seat q of n, `x` along that seat's edge (to its right). */
export function seatAt(q, n, rho, x = 0) { const a = (q * Math.PI * 2) / n, c = Math.cos(a), s = Math.sin(a); return [x * c + rho * s, -x * s + rho * c]; }
/** The size of a card at a tier. */
const cardSize = (tier) => { const k = tierScale(tier); return [PIECE.card.w * k, PIECE.card.h * k]; };
/** The contract's fields on a piece (tier, dim, role, owner, tip), and the piece into `out`. */
function put(out, piece, o = {}) { out.push(Object.assign(piece, { tier: o.tier || 'L', dim: !!o.dim, role: o.role || null }, o.owner != null ? { owner: o.owner } : null, o.tip ? { tip: o.tip } : null)); return piece; }
/** A word or a mark on the cloth (the table view writes it): an anchor with `text`. */
export function anchor(out, key, x, y, z, extra = {}) { out.anchors.push({ key, at: new THREE.Vector3(x, y, z), ...extra }); }
/** Is this piece out of the pick being made (dim): it could be taken, but no longer with what you have chosen. */
export const dimmed = (ctx, id) => !!ctx.coach && ctx.chosen.size > 0 && !ctx.legal.has(id) && !ctx.chosen.has(id); // (only mid-pick: what can no longer join the pieces you have chosen)

/** A sum split over dice (each between 1 and its sides), as even as it goes: the faces shown where the rules keep only the total. */
export function splitSum(sum, sides) {
  const v = sides.map(() => 1); let left = Math.max(0, Math.min(sum, sides.reduce((a, s) => a + s, 0)) - v.length);
  while (left > 0) { let moved = false; for (let i = 0; i < v.length && left > 0; i++) if (v[i] < sides[i]) { v[i]++; left--; moved = true; } if (!moved) break; }
  return v;
}
/** An amount as chips, the biggest first (25, 5, 1), at most 40. */
export function chipsOf(amount) { const out = []; let a = Math.max(0, Math.floor(amount)); for (const [k, v] of [['25', 25], ['5', 5], ['1', 1]]) while (a >= v && out.length < 40) { out.push(k); a -= v; } return out; }

/** Stacks of chips at (x, z): a stack a value, ten at most a stack. `extra` (tier, role, ...) goes on every chip. */
export function chips(out, id, amount, x, z, kinds = chipsOf(amount), extra = {}) {
  const k = tierScale(extra.tier || 'M'), stacks = []; for (const kind of kinds) { let s = stacks.find((t) => t.k === kind && t.n < 10); if (!s) stacks.push((s = { k: kind, n: 0 })); s.n++; }
  let c = 0; stacks.forEach((s, j) => { for (let i = 0; i < s.n; i++, c++) put(out, { id: `${id}:${c}`, tpl: chipTpl(s.k, k), p: [x + (j % 4) * 0.092 * k - 0.14, i * PIECE.chip.h * k, z + Math.floor(j / 4) * 0.092 * k], q: qOf(0, i * 0.7, 0), glaze: true }, { tier: 'M', ...extra }); });
}
/** A die resting at (x, z) with `value` up. `extra` may carry tier, dim, role, owner, tip, act, sel, ... */
export function die(out, id, sides, value, x, z, skin = String(sides), extra = {}) {
  const { tier, dim, role, owner, tip, ...rest } = extra, k = tierScale(tier);
  const q = new THREE.Quaternion(), yaw = (hash(id) % 628) / 100, lift = dieRest(sides, value, yaw, q, k);
  put(out, { id, tpl: dieTpl(sides, skin, k, dim), p: [x, lift, z], q, glaze: true, die: { sides, value, skin }, ...rest }, { tier, dim, role, owner, tip });
}
const hash = (s) => { let h = 7; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; };

export function layoutTable(S, ctx = {}) {
  const T = S.T, St = S.S, V = T.game.view(St, 0), R = T.game.result(St), P0 = R ? null : T.game.pending(St), P = P0 && P0.seat === 0 ? P0 : null;
  const out = [], fn = LAYOUTS.get(T.id), coach = ctx.coach || null;
  out.anchors = [];
  ctx.chosen ||= new Set(); ctx.coach = coach; ctx.seatColour ||= (q) => seatColour(coach?.seats?.[q]?.colourId ?? 'white');
  const sel = (ctx.pick = selectable(coach?.moves || [], [...ctx.chosen]));
  ctx.legal = new Set(ctx.chosen.size ? sel.still : (coach?.moves || []).flatMap((m) => m.pieceIds || [])); // (what you may take now)
  for (let q = 0; q < V.n; q++) { const [x, z] = seatAt(q, V.n, T.r * 0.8, q === 0 ? -1.15 : 0); anchor(out, `seat:${q}`, x, 0, z); } // (each seat's plate)
  anchor(out, 'goal', 0, 0, -T.r * 0.9);
  if (fn) fn(out, S, V, P, R, ctx, T); // (a game with no layout: nothing on the cloth, its page plays it)
  return out;
}
const LAYOUTS = new Map();
/** A game's layout: `fn(out, session, view, pending (yours), result, ctx, table)` pushes its pieces into `out` (and its anchors). */
export function registerLayout(id, fn) { LAYOUTS.set(id, fn); }

// ---------------------------------------------------------------- Querent
const ARCANA_COLUMN = [-1.62, 0.62, 0.3]; // (x of the column, z of the first, the step down it)
function querent(out, S, V, P, R, ctx, T) {
  const n = V.n, C = ctx.coach, move = (m) => () => { S.sel = new Set(); S.move(m); }, find = (f) => P?.moves.find(f);
  const targetOf = (q) => { const m = P && /^(lovers|sun|judgment|ability\.downgrade)$/.test(P.kind) && find((x) => x.target === q); return m ? move(m) : null; };
  const sel = (S.sel ||= new Set()), hand = V.hand, k = hand.length, byRank = (a, b) => hand[a].r - hand[b].r || hand[a].s - hand[b].s;
  // your hand, its groups found for you (the coach's shape) and laid side by side: groups, then pairs, then the loose cards
  let shape = C?.extra?.shape; const all = hand.map((_, i) => i);
  if (!shape || shape.groups.length * 3 + shape.pairs.length * 2 + shape.loose.length !== k) shape = { groups: [], pairs: [], loose: all };
  const rankOf = (cl) => byRank(cl.idx[0], cl.idx[0]) || hand[cl.idx[0]].r;
  const clusters = [...shape.groups.map((g) => ({ kind: 'group', idx: g.slice().sort(byRank) })), ...shape.pairs.map((p) => ({ kind: 'pair', idx: p.slice().sort(byRank) })), { kind: 'loose', idx: shape.loose.slice().sort(byRank) }]
    .filter((c) => c.idx.length).sort((a, b) => (a.kind === 'loose') - (b.kind === 'loose') || (a.kind === 'pair') - (b.kind === 'pair') || rankOf(a) - rankOf(b));
  const step = Math.min(0.17, 1.55 / Math.max(1, k)), gap = clusters.length > 1 ? 0.05 : 0, width = (k - 1) * step + (clusters.length - 1) * gap, seen = {};
  const [cw, ch] = cardSize('XL'); let cx = -width / 2;
  const waits = {}; for (const m of C?.moves || []) if (m.card != null) waits[m.card] = m.waits;
  clusters.forEach((cl, ci) => {
    const x0 = cx;
    cl.idx.forEach((i) => {
      const c = hand[i], key = `${c.r}.${c.s}`, o = (seen[key] = (seen[key] ?? -1) + 1), x = cx, grouped = cl.kind === 'group';
      let act = null;
      if (P?.kind === 'discard' && find((m) => m.discard === i)) act = move({ discard: i });
      else if (P?.kind === 'wheel') act = () => { if (sel.has(i)) sel.delete(i); else sel.add(i); S.render(); };
      put(out, { id: `h:${key}#${o}`, tpl: cardTpl(cardIndex(c), cw, ch), p: [x, 0.2 - Math.abs(x) * 0.12 + (grouped ? 0.025 : 0), 1.32 + (x + width / 2) * 0.004], q: qOf(-0.85, 0, -x * 0.45, 'XYZ'), act, sel: sel.has(i), from: [1.0, 0.05, 0.9] }, { tier: 'XL', role: 'hand' });
      if (P?.kind === 'discard' && waits[i] != null) anchor(out, `waits:${i}`, x, 0.36, 1.12, { kind: 'waits', text: String(waits[i]), tone: waits[i] > 0 ? 'good' : 'dim' });
      cx += step;
    });
    const x1 = cx - step;
    if (cl.kind !== 'loose') anchor(out, `bracket:${ci}`, x0 - step * 0.45, 0.012, 1.55, { kind: 'bracket', tone: cl.kind === 'group' ? 'gold' : 'rim', to: new THREE.Vector3(x1 + step * 0.45, 0.012, 1.55) });
    cx += gap;
  });
  if (P?.kind === 'discard') anchor(out, 'legend:waits', 0, 0.4, 0.92, { kind: 'legend', text: 'The number: how many cards would win if you throw this one', tone: 'dim' });
  // the draw pile at your right hand: a draw, or the Wheel's throw back
  let pile = null;
  if (P?.kind === 'acquire') { const m = find((x) => x.draw); if (m) pile = move(m); }
  else if (P?.kind === 'wheel') pile = () => { const ix = [...sel].sort((a, b) => a - b); S.sel = new Set(); S.move(P.moves.find((m) => m.throw.length === ix.length && m.throw.every((v, j) => v === ix[j])) || { throw: [] }); };
  const [dw, dh] = cardSize('L');
  for (let i = 0; i < 7; i++) put(out, { id: 'deck', tpl: cardTpl(CARD_BACK, dw, dh), p: [1.0, 0.004 + i * 0.006, 0.9], q: DOWN(0.1), act: pile }, { role: 'moves', tip: { label: 'YOUR PILE', line: 'Cards you draw come from the top. A surprise.' } });
  // each seat: its top discard toward the middle (the one you may steal, big and lifted; the others dim), its hand face down before it
  // (shown if the Sun showed it), its Major Arcana beside it
  for (let q = 0; q < n; q++) {
    const top = V.tops[q], [dx, dz] = seatAt(q, n, 0.62);
    if (top) {
      const steal = P?.kind === 'acquire' && find((m) => m.steal === q), [tw, th] = cardSize(steal ? 'XL' : 'L');
      put(out, { id: `top:${q}`, tpl: cardTpl(top.hidden ? CARD_BACK : cardIndex(top), tw, th), p: [dx, steal ? 0.03 : 0.004, dz], q: top.hidden ? DOWN() : UP(), act: steal ? move(steal) : targetOf(q) },
        { tier: steal ? 'XL' : 'L', role: 'moves', owner: q, dim: P?.kind === 'acquire' && !steal, tip: { label: q ? `${T.names[q]}'S LAST THROW` : 'YOUR LAST THROW', line: 'The card on top of their throw-away pile. Stealing it gives them a Major Arcana.' } });
    }
    const Q = V.players[q], a = (q * Math.PI * 2) / n;
    if (q > 0) {
      const hs = Q.handSize, [sw, sh] = cardSize('S'); for (let i = 0; i < hs; i++) {
        const x = (i - (hs - 1) / 2) * 0.07, [hx, hz] = seatAt(q, n, 1.62, x), c = Q.hand?.[i];
        put(out, { id: `oh:${q}:${i}`, tpl: cardTpl(c ? cardIndex(c) : CARD_BACK, sw, sh), p: [hx, 0.004 + i * 0.002, hz], q: c ? UP(a) : DOWN(a + Math.PI), act: targetOf(q), from: [hx * 1.3, 0.3, hz * 1.3] }, { tier: 'S', role: 'seats' });
      }
    }
    const ids = q === 0 ? V.mine : Array(Q.arcana).fill(CARD_BACK), mine = C?.extra?.arcana || [];
    ids.forEach((id, i) => {
      const [ax, az] = q === 0 ? [ARCANA_COLUMN[0], ARCANA_COLUMN[1] - i * ARCANA_COLUMN[2]] : seatAt(q, n, 1.25, -0.75 - i * 0.05), tier = q === 0 ? 'M' : 'S', [aw, ah] = cardSize(tier);
      put(out, { id: `arc:${q}:${i}`, tpl: cardTpl(id === CARD_BACK ? CARD_BACK : id, aw, ah), p: [ax, 0.004 + i * 0.002, az], q: id === CARD_BACK ? DOWN(a + Math.PI) : UP(), act: q ? targetOf(q) : null },
        { tier, role: 'seats', owner: q, tip: id === CARD_BACK ? { label: `${T.names[q]}'S MAJOR ARCANA`, line: 'Power-ups they won when someone stole from them.' } : null });
      if (q === 0 && mine[i]) anchor(out, `arcana:${i}`, ax + aw / 2 + 0.03, 0.01, az, { kind: 'arcana', text: mine[i].name, sub: mine[i].does });
    });
  }
  // your fours, set aside
  const [qw, qh] = cardSize('S');
  V.quads.forEach((r, j) => { for (let s = 0; s < 4; s++) put(out, { id: `quad:${r}:${s}`, tpl: cardTpl(cardIndex({ r, s }), qw, qh), p: [1.35 + s * 0.035, 0.004 + s * 0.002, 0.5 - j * 0.24], q: UP(0.15) }, { tier: 'S', role: 'hand' }); });
  // a choice laid out on the cloth: the Fool's Major Arcana, the Hierophant's ranks, the Hermit's nine
  const [fw, fh] = cardSize('M');
  if (P?.kind === 'fool') P.moves.forEach((m, j) => put(out, { id: `fool:${m.arcana}`, tpl: cardTpl(m.arcana, fw, fh), p: [((j % 7) - 3) * 0.18, 0.03, -0.45 + Math.floor(j / 7) * 0.27], q: UP(), act: move(m), from: [1.0, 0.05, 0.9] }, { tier: 'M', role: 'moves' }));
  if (P?.kind === 'hierophant') P.moves.forEach((m, j) => put(out, { id: `rank:${m.rank}`, tpl: cardTpl(cardIndex({ r: m.rank, s: V.seatSuit }), fw, fh), p: [(j - (P.moves.length - 1) / 2) * 0.17, 0.03, 0.05], q: UP(), act: move(m), from: [1.0, 0.05, 0.9] }, { tier: 'M', role: 'moves' }));
  if (P?.kind === 'hermit' && V.peek) V.peek.forEach((c, i) => { const m = find((x) => x.top.length === 1 && x.top[0] === i); put(out, { id: `peek:${i}`, tpl: cardTpl(cardIndex(c), fw, fh), p: [(i - (V.peek.length - 1) / 2) * 0.17, 0.03, 0.05], q: UP(), act: m ? move(m) : null, from: [1.0, 0.05, 0.9] }, { tier: 'M', role: 'moves' }); });
  if (!R) chips(out, 'pot', T.stake * T.seats, -0.05, -0.08, undefined, { role: 'centre' });
  anchor(out, 'centre', 0, 0, 0.02);
}

// ---------------------------------------------------------------- Zodiac
function zodiac(out, S, V, P, R, ctx) {
  const zsel = ctx.zsel, turn = S.S.turn, d = V.dice;
  const pick = (kind, q) => (t) => {
    if (P?.kind !== kind) return null;
    const id = `tile:${q}:${t}`, ok = ctx.coach ? ctx.legal.has(id) || ctx.chosen.has(id) : P.moves.some((m) => (kind === 'attack' ? m.target === q && m.tiles : m.tiles)?.includes(t));
    return ok ? () => { const k = `${q}:${t}`; if (zsel.has(k)) zsel.delete(k); else zsel.add(k); } : null;
  };
  for (let q = 0; q < V.n; q++) {
    const z = q === 0 ? 0.92 : -0.92, act = q === 0 ? pick('seal', 0) : pick('attack', q), tier = q === 0 ? 'XL' : 'M', k = tierScale(tier), gap = q === 0 ? 0.158 : 0.105;
    const domain = (q === 0 && P?.kind === 'seal') || (q !== 0 && P?.kind === 'attack'); // (the tiles this pick is made among)
    for (let t = 1; t <= 12; t++) {
      const shut = V.tiles[q][t - 1], locked = V.locked[q][t - 1], x = (t - 6.5) * gap, a = act(t), id = `tile:${q}:${t}`, dim = domain && !locked && dimmed(ctx, id);
      const state = locked ? 'locked' : 'open', q2 = shut ? qOf(locked ? -Math.PI / 2 : Math.PI / 2, 0, 0, 'XYZ') : qOf(0, 0, 0);
      const half = (PIECE.tile.h * k) / 2; // (a tile lies down about its foot: face down toward you when shut, face up away from you when locked)
      put(out, { id, tpl: tileTpl(t, state, k, dim), p: [x, shut ? (PIECE.tile.d * k) / 2 : 0, z + (shut ? (locked ? half : -half) : 0)], q: q2, glaze: true, act: a, sel: zsel.has(`${q}:${t}`) },
        { tier, dim, role: 'tiles', owner: q, tip: locked ? { label: `TILE ${t}: LOCKED`, line: 'Shut for good. It can never be reopened.' } : null });
    }
    // the purse, the lock tokens, the attack die's size (a die of it at rest, its top face its sides)
    chips(out, `purse:${q}`, V.chips[q], 1.15, q === 0 ? 0.55 : -0.75, undefined, { role: 'seats' });
    for (let i = 0; i < V.tokens[q]; i++) put(out, { id: `token:${q}:${i}`, tpl: chipTpl('gold', 0.8), p: [-1.2 + i * 0.1, 0, q === 0 ? 0.6 : -0.6], q: qOf(0, i, 0), glaze: true }, { tier: 'M', role: 'seats' });
    if (q !== turn) die(out, `atkrest:${q}`, V.attack[q], V.attack[q], -1.05, q === 0 ? 0.35 : -0.35, `atk${V.attack[q]}`, { tier: 'M', role: 'dice', tip: { label: q ? 'THEIR ATTACK DIE' : 'YOUR ATTACK DIE', line: "Rolled on a turn to reopen the other seat's shut tiles." } });
  }
  // the dice in the middle: shut the chosen tiles (a seal or an attack), or the free reroll
  const chosen = (q) => [...zsel].filter((k) => k.startsWith(`${q}:`)).map((k) => +k.split(':')[1]).sort((a, b) => a - b);
  const same = (a, b) => a && a.length === b.length && a.slice().sort((x, y) => x - y).every((v, i) => v === b[i]);
  let roll = null;
  if (P?.kind === 'seal') { const c = chosen(0), m = P.moves.find((x) => x.by === 'sum' && same(x.tiles, c)) || P.moves.find((x) => same(x.tiles, c)); if (m) roll = () => { zsel.clear(); S.move(m); }; }
  else if (P?.kind === 'attack') { const m = P.moves.find((x) => x.tiles && same(x.tiles, chosen(x.target))); if (m) roll = () => { zsel.clear(); S.move(m); }; }
  else if (P?.kind === 'ability.reroll') { const m = P.moves.find((x) => x.reroll); if (m) roll = () => S.move(m); }
  const side = turn === 0 ? 0.32 : -0.32, white = { tier: 'XL', role: 'dice', tip: { label: 'THE TWO WHITE DICE', line: 'Shut tiles that add up to their sum, or to their product.' } };
  die(out, 'zd:a', 6, d.a, -0.2, side, '6', { act: roll, ...white });
  die(out, 'zd:b', 6, d.b, 0.0, side + 0.02, '6', { act: roll, ...white });
  die(out, 'zd:atk', V.attack[turn], d.atk, 0.22, side - 0.01, `atk${V.attack[turn]}`, { act: P?.kind === 'attack' ? roll : null, tier: 'XL', role: 'dice', tip: { label: 'THE GOLD ATTACK DIE', line: 'It reopens shut tiles of the other seat that add up to its roll.' } });
  if (d.a) anchor(out, 'equation', 0, 0.04, side + (turn === 0 ? 0.2 : -0.2), { kind: 'equation', text: `${d.a} + ${d.b} = ${d.a + d.b}   ·   ${d.a} × ${d.b} = ${d.a * d.b}` });
  if (V.pot > 0) chips(out, 'pot', V.pot, -0.5, -0.05, undefined, { role: 'centre' });
  anchor(out, 'centre', 0, 0, 0.04);
}

// ---------------------------------------------------------------- Event Horizon
// The ids: a die still to roll is `ed:<seat>:<sides>:<nth among those left>` (the coach's pieceIds); one rolled is `ex:` and the same.
function horizon(out, S, V, P, R, ctx) {
  const n = V.n, St = S.S, dsel = (S.dsel ||= []);
  for (let q = 0; q < n; q++) {
    const used = V.used[q], left = V.left[q], faces = splitSum(V.sums[q], used), cu = {}, cl = {}, mine = q === 0;
    used.forEach((s, i) => {
      const [x, z] = seatAt(q, n, 0.62, (i - (used.length - 1) / 2) * (mine ? 0.2 : 0.15)), [fx, fz] = seatAt(q, n, 1.08, 0);
      die(out, `ex:${q}:${s}:${(cu[s] = (cu[s] ?? -1) + 1)}`, s, faces[i], x, z, String(s), { roll: q, tier: mine ? 'L' : 'M', role: 'hand', owner: q, from: [fx, 0.2, fz] });
    });
    left.forEach((s, i) => {
      const id = `ed:${q}:${s}:${(cl[s] = (cl[s] ?? -1) + 1)}`, [x, z] = seatAt(q, n, 1.08, (i - (left.length - 1) / 2) * (mine ? 0.22 : 0.15));
      const act = mine && P?.kind === 'roll' && (!ctx.coach || ctx.legal.has(id) || ctx.chosen.has(id)) ? () => { const k = dsel.indexOf(i); if (k >= 0) dsel.splice(k, 1); else dsel.push(i); S.render(); } : null;
      die(out, id, s, s, x, z, String(s), { act, sel: mine && dsel.includes(i), roll: q, tier: mine ? 'XL' : 'S', role: 'dice', owner: q, dim: mine && P?.kind === 'roll' && dimmed(ctx, id), tip: mine ? { label: `A d${s}`, line: 'Pick it to throw it. Each die is thrown once a round.' } : null });
    });
  }
  // your cup: roll the dice you chose; your last roll answers the free reroll
  let roll = null;
  if (P?.kind === 'roll' && dsel.length) { const dice = dsel.map((i) => V.mine[i]).sort((a, b) => a - b), m = P.moves.find((x) => x.dice && x.dice.slice().sort((a, b) => a - b).join() === dice.join()); if (m) roll = () => { S.dsel = []; S.move(m); }; }
  put(out, { id: 'cup:mine', tpl: cupTpl(0.085, 0.13, true), p: [1.05, 0, 0.62], q: qOf(0, 0, 0), glaze: true, act: roll }, { role: 'moves', tip: { label: 'YOUR CUP', line: 'Throws the dice you picked.' } });
  if (P?.kind === 'reroll') { const m = P.moves.find((x) => x.reroll); for (const e of out) if (e.roll === 0 && e.die) e.act = () => S.move(m); }
  // your total and what you need; the chosen handful's odds beside the cup
  const need = ctx.coach?.extra?.need ?? V.total - V.sums[0];
  if (!R) anchor(out, 'need', 0, 0.04, 0.95, { kind: 'need', text: `You have ${V.sums[0]}  ·  you need ${need}` });
  const done = ctx.pick?.complete;
  if (!R && P?.kind === 'roll' && done?.preview) anchor(out, 'odds', 1.05, 0.04, 0.34, { kind: 'odds', text: done.preview });
  // the dealer's handful: under cups until the round is done, then shown
  const D = St.dealer;
  if (!R) for (let i = 0; i < V.par; i++) put(out, { id: `dealer:cup:${i}`, tpl: cupTpl(), p: [(i - (V.par - 1) / 2) * 0.2, 0, -0.1], q: qOf(0, i, 0), glaze: true }, { tier: 'M', role: 'centre', tip: i ? null : { label: "THE HOUSE'S DICE", line: `The house threw ${V.par} dice under the cups. Their total is the target.` } });
  else { const f = splitSum(D.total, D.dice); D.dice.forEach((s, i) => die(out, `dealer:die:${i}`, s, f[i], (i - (D.dice.length - 1) / 2) * 0.2, -0.1, String(s), { tier: 'M', role: 'centre' })); }
  if (!R && St.pot > 0) chips(out, 'pot', St.pot, -0.05, 0.22, undefined, { role: 'centre' });
  anchor(out, 'centre', 0, 0, 0.3);
}

registerLayout('querent', querent);
registerLayout('zodiac', zodiac);
registerLayout('eventhorizon', horizon);
