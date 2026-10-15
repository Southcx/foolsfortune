// ---------------------------------------------------------------------------------------
// THE ASTROLL TABLES' LAYOUT (docs/plans/CASINO.md sections 6 and 9; Dovina's handoff of 2026-10-15, casino phase 2): Supernova Run and
// Nebula Bluff as real pieces on the cloth, registered with the table view's layout (vfx/bazaarlayout.js `registerLayout`). No words and
// no numbers but what a die face shows: the rules' state read as dice, chips, cups and gold.
//   - SUPERNOVA RUN: every player's hand as its dice before its seat (two rows of six), each on the face its last reaction settled on (a
//     die not rolled since shows its maximum: its size). The points as a gold token on a rail of ivory chips toward the threshold, three
//     lapis chips standing at its end. A reaction cascading, for a beat after it: the dice it kept tumble onto their faces; a die born
//     appears lit on its maximum (the face that duplicated it), then tumbles onto its own; a decaying die turns to spent clay (crazed
//     grey) and sinks into the cloth, its smaller self tumbling out of the same spot; a d4 lost slides off the cloth's edge and falls. A
//     Supernova: the d20 rises lit on its natural 20 in the middle, a ring of gold bursts out of it, every hand's dice blow outward as
//     spent clay and the new hands of four d6 tumble in from the middle. Your turn: your cup runs a reaction; click a die to see its
//     splits laid out before you (click one), or two or three to see what they fuse into (click it).
//   - NEBULA BLUFF: your dice face up on the faces you rolled; the others' as upturned cups, one a die (a player out of the round sits
//     theirs back); each purse as chips; the claim as gold d20s in a row whose faces add up to it, and a gold token before its claimant;
//     the pot as chips; the raises as notches against the limit (cinnabar spent, ivory left). Click the claim to call it out, your cup to
//     fold; the claims stay on the page (world/bazaar/views.js).
//   - THE TELL (`view.tell`): no folk sit at Raku's tables yet (the hall has no bodies at its seats: vfx/bazaarhall.js, world/bazaar/),
//     so the tell is worn by the claimant's purse: **a tell's riffle**, its top chip lifting and turning on the stack for a third of a
//     real second, every couple of real seconds, as a nervous hand riffles a chip. Readable to an eye that watches the purse, never
//     lit, never shouted. When bodies sit at the seats, the riffle moves to the body (a glance, a lid, a bead of glaze).
// The faces are always the rules': the cascade's order is invented, its outcome is the log's (`last`: faces, born, decayed, lost).
//
// Prior art: liar's dice's cups (Perudo; Pirates of the Caribbean's game), a cribbage board's peg rail for points, Balatro's and Slay
// the Spire's cascades read beat by beat, Red Dead's poker tells (a twitch the player learns to watch), a fission chain's picture.
//
// CLARITY PASS (docs/plans/CASINO-CLARITY.md section 5, 2026-10-15): each piece carries a `tier` (XL your dice, L what you act with, M a
// label's worth, S the others'), a `role` (goal, hand, moves, seats, centre, dice, claim, tell: the how-to's targets), and `dim` when it is
// not part of the choice being made (the atlas's dim twin); `out.anchors` lists where the HUD and how-to hang (`seat:<q>`, `goal`,
// `centre`, `role:<role>`). A die's id is the coach's own (`ed:<seat>:<sides>:<nth>`). The last reaction comes from `ctx.coach.extra.last`
// (a seat's resting faces still read the rules' log: the coach does not give them). Words and numbers belong to the HUD, not the cloth.
//
//   (no exports for the game: importing this registers 'supernova' and 'nebula')   ASTROLL_LOOK   assignFaces(hand, faces)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { dieTpl, dieRest, chipTpl, cupTpl, PIECE, tierScale } from './bazaarpieces.js';
import { registerLayout, qOf, seatAt, chips, die, splitSum } from './bazaarlayout.js';
import { SUPERNOVA_RULES } from '../progress/casino/supernova.js';

/** The numbers (real seconds; metres in the table's frame): a born die's pop, how long the spent dice last, the Supernova's burst and its
 *  ring, the tell's riffle; the rows, rails and spots of each table. */
export const ASTROLL_LOOK = {
  pop: 0.55, fade: 1.5, nova: 1.8, burst: 16,
  riffle: { every: 2.3, dur: 0.34, lift: 0.024, tilt: 0.32 },
  sn: { rows: [1.32, 1.12], gap: 0.15, perRow: 6, rail: 0.78, railW: 0.56, ties: 10, cup: [1.05, 1.22], options: 0.5 },
  nb: { row: 1.3, gap: 0.21, cupGap: 0.12, back: 0.22, purse: [1.58, 0.72], cup: [-0.95, 1.18], claimZ: 0.14, raiseZ: -0.42, pot: [-0.55, -0.12], token: 0.84 },
};
const L = ASTROLL_LOOK, SIZES = SUPERNOVA_RULES.sizes;
const decay = (s) => SIZES[Math.max(0, SIZES.indexOf(s) - 2)];
/** Tag the pieces pushed since `from` with a tier, a role and (a die swaps to the atlas's dim twin) dim. */
function mark(out, from, tier, role, dim = false) {
  for (let i = from; i < out.length; i++) {
    const e = out[i]; e.tier ??= tier; e.role ??= role;
    if (dim) { e.dim = true; if (e.die) e.tpl = dieTpl(e.die.sides, e.die.skin, tierScale(e.tier), true); }
  }
}
/** Anchors: a point in the table's frame for the HUD and the how-to; each role's anchor is the middle of its pieces. */
function anchor(out, key, x, z, y = 0.05) { (out.anchors ||= []).push({ key, at: new THREE.Vector3(x, y, z) }); }
function roleAnchors(out) {
  const sum = new Map();
  for (const e of out) { if (!e.role) continue; const a = sum.get(e.role) || { x: 0, y: 0, z: 0, k: 0 }; a.x += e.p[0]; a.y += e.p[1]; a.z += e.p[2]; a.k++; sum.set(e.role, a); }
  for (const [r, a] of sum) anchor(out, `role:${r}`, a.x / a.k, a.z / a.k, a.y / a.k + 0.05);
}
const ordinals = (hand) => { const c = {}; return hand.map((s) => (c[s] = (c[s] ?? -1) + 1)); };

/** A reaction's faces on a hand's dice (the rules keep them apart): the highest face first, each on the smallest die that could show it
 *  without having duplicated (a face below its maximum), else the smallest that can show it. Returns a value (or null) a die. */
export function assignFaces(hand, faces) {
  const vals = hand.map(() => null), free = new Set(hand.keys());
  for (const v of faces.slice().sort((a, b) => b - a)) {
    let best = -1;
    for (const strict of [true, false]) { for (const i of free) if ((strict ? hand[i] > v : hand[i] >= v) && (best < 0 || hand[i] < hand[best])) best = i; if (best >= 0) break; }
    if (best >= 0) { vals[best] = v; free.delete(best); }
  }
  return vals;
}

// ---------------------------------------------------------------- Supernova Run
/** What the layout remembers of a session between frames: the hands of the last frame (a reaction's "before") and its moment. */
function memo(S, St, V, last, t) {
  let M = S.astroll;
  if (!M || M.S !== St) M = S.astroll = { S: St, seen: last ?? null, ix: 0, hands: V.hands.map((h) => h.slice()), moment: null };
  if (last && last !== M.seen) {
    M.seen = last; M.ix++;
    if (last.react != null || last.nova != null) M.moment = { at: t, x: last, ix: M.ix, nova: last.nova != null, before: M.hands };
  }
  M.hands = V.hands.map((h) => h.slice());
  return M;
}
/** A seat's last reaction (its log index and faces on its hand), if its hand is still the one that reaction left. */
function lastReaction(log, q, hand) {
  for (let i = log.length - 1; i >= 0; i--) {
    const e = log[i];
    if (e.nova != null) return { ix: i, vals: hand.map(() => null) };
    if (e.seat !== q) continue;
    if (e.react != null) return { ix: i, vals: e.hand.length === hand.length && e.hand.every((s, k) => s === hand[k]) ? assignFaces(hand, e.faces) : hand.map(() => null) };
    if (e.split != null || e.fuse) return { ix: i, vals: hand.map(() => null) };
  }
  return { ix: -1, vals: hand.map(() => null) };
}
/** Where the i-th of k dice of a seat's hand rests: two rows of six, the outer first. */
function handSlot(q, n, i, k) {
  const row = Math.min(1, Math.floor(i / L.sn.perRow)), inRow = Math.min(L.sn.perRow, k - row * L.sn.perRow), j = i % L.sn.perRow;
  return seatAt(q, n, L.sn.rows[row], (j - (inRow - 1) / 2) * L.sn.gap);
}
/** A die of spent clay at (x, z), lifted by `dy` (below the cloth: sunk). */
function spent(out, id, sides, x, z, dy) { die(out, id, sides, 1, x, z, 'ash', { still: true }); out[out.length - 1].p[1] += dy; }

function supernova(out, S, V, P, R, ctx) {
  const St = S.S, n = V.n, t = ctx.t ?? 0, M = memo(S, St, V, ctx.coach?.extra?.last ?? V.last, t), mo = M.moment, age = mo ? t - mo.at : 1e9;
  const nova = mo?.nova && age < L.nova, sel = (S.ssel ||= new Set()), mine = new Map();
  if (!P) sel.clear();
  const picked = (id) => sel.has(id) || !!ctx.chosen?.has(id), picking = sel.size > 0 || !!ctx.chosen?.size;
  for (let q = 0; q < n; q++) {
    const hand = V.hands[q], ords = ordinals(hand), last = lastReaction(St.log, q, hand);
    const mine0 = q === 0, tier = mine0 ? 'XL' : 'S', role = mine0 ? 'dice' : 'seats', from0 = out.length;
    const live = mo && !mo.nova && age < L.fade && mo.x.seat === q, before = live ? mo.before[q] || [] : null;
    // the cascade: what the reaction added and took away (counted by size: a die's identity is its size and its place among its size)
    const added = new Map(), products = new Map();
    if (live) {
      const bc = {}, ac = {}; before.forEach((s) => (bc[s] = (bc[s] ?? 0) + 1)); hand.forEach((s) => (ac[s] = (ac[s] ?? 0) + 1));
      const bo = ordinals(before), gone = [];
      before.forEach((s, i) => { if (bo[i] >= (ac[s] ?? 0)) gone.push({ s, i }); });
      hand.forEach((s, i) => { if (ords[i] >= (bc[s] ?? 0)) added.set(i, s); });
      for (const g of gone) { // (a decay's origin: its smaller self comes out of its spot; a d4 gone was lost)
        const [x, z] = handSlot(q, n, g.i, before.length), u = Math.min(1, age / L.fade);
        if (g.s === 4) { const a = (q * Math.PI * 2) / n, out2 = u * 1.1; spent(out, `snx:${q}:${mo.ix}:${g.s}:${g.i}`, 4, x + Math.sin(a) * out2, z + Math.cos(a) * out2, -Math.max(0, u - 0.55) * 1.4); continue; }
        spent(out, `snx:${q}:${mo.ix}:${g.s}:${g.i}`, g.s, x, z, -u * 0.13);
        for (const [i, s] of added) if (!products.has(i) && (decay(g.s) === s || decay(decay(g.s)) === s)) { products.set(i, [x, 0.06, z]); break; }
      }
    }
    hand.forEach((s, i) => {
      const id = `ed:${q}:${s}:${ords[i]}`, [x, z] = handSlot(q, n, i, hand.length), v = last.vals[i] ?? s;
      const extra = { rollKey: `${V.round}:${last.ix}` };
      if (nova) extra.from = [0, 0.3, 0];
      else if (products.has(i)) extra.from = products.get(i);
      else if (added.has(i) && age < L.pop) Object.assign(extra, { still: true, glow: true, rollKey: `pop:${mo.ix}`, from: [x, 0.24, z] });
      else if (added.has(i)) extra.from = [x, 0.24, z];
      if (q === 0 && P) { mine.set(id, s); extra.act = () => { if (sel.has(id)) sel.delete(id); else sel.add(id); }; extra.sel = picked(id); }
      die(out, id, s, added.has(i) && age < L.pop && !products.has(i) ? s : v, x, z, String(s), extra);
    });
    // (your dice not among those picked step back while you pick)
    mark(out, from0, tier, role);
    if (mine0 && P && picking) for (let i = from0; i < out.length; i++) { const e = out[i]; if (e.die && e.id.startsWith('ed:') && !picked(e.id)) { e.dim = true; e.tpl = dieTpl(e.die.sides, e.die.skin, 1, true); } }
    // the points: a gold token on a rail of ivory chips, the threshold three lapis chips at its end
    const railFrom = out.length;
    const a = (q * Math.PI * 2) / n, { rail, railW, ties } = L.sn, f = Math.min(1, V.points[q] / V.threshold);
    for (let i = 0; i <= ties; i++) { const [x, z] = seatAt(q, n, rail, -railW + (i * 2 * railW) / ties); out.push({ id: `snr:${q}:${i}`, tpl: chipTpl('1'), p: [x, 0, z], q: qOf(0, a + i, 0), glaze: true }); }
    for (let j = 0; j < 3; j++) { const [x, z] = seatAt(q, n, rail, railW + 0.1); out.push({ id: `snt:${q}:${j}`, tpl: chipTpl('25'), p: [x, j * PIECE.chip.h, z], q: qOf(0, a + j * 0.6, 0), glaze: true }); }
    const [px, pz] = seatAt(q, n, rail, -railW + f * 2 * railW); out.push({ id: `snp:${q}`, tpl: chipTpl('gold'), p: [px, PIECE.chip.h, pz], q: qOf(0, a, 0), glaze: true });
    // (your reaction, if rolled: where its expected points would put the token, a ghost on the rail)
    const odds = mine0 && P ? ctx.coach?.moves?.find((m) => m.move?.react)?.odds : null;
    if (odds && odds.points > 0) { const [gx, gz] = seatAt(q, n, rail, -railW + Math.min(1, (V.points[q] + odds.points) / V.threshold) * 2 * railW); out.push({ id: `snghost:${q}`, tpl: chipTpl('gold'), p: [gx, PIECE.chip.h, gz], q: qOf(0, a, 0), glow: true }); }
    mark(out, railFrom, mine0 ? 'L' : 'S', mine0 ? 'goal' : 'seats');
    const [ax, az] = seatAt(q, n, 1.95, 0); anchor(out, `seat:${q}`, ax, az);
    if (mine0) { const [gx, gz] = seatAt(0, n, rail, 0); anchor(out, 'goal', gx, gz); }
  }
  anchor(out, 'centre', 0, 0);
  if (nova) { const b0 = out.length; burst(out, mo, age, n); for (let i = b0; i < out.length; i++) { const e = out[i]; if (e.id.startsWith('snn:')) { e.tier = 'XL'; e.role = 'centre'; } else if (e.id.startsWith('snb:')) { e.tier = 'M'; e.role = 'centre'; } } }
  roleAnchors(out);
  if (!P) return;
  // your turn: the cup reacts; a die chosen shows its splits, two or three what they fuse into
  for (const id of [...sel]) if (!mine.has(id)) sel.delete(id);
  const react = P.moves.find((m) => m.react);
  const m0 = out.length;
  out.push({ id: 'sncup', tpl: cupTpl(0.085, 0.13, true), p: [L.sn.cup[0], 0, L.sn.cup[1]], q: qOf(0, 0, 0), glaze: true, act: react ? () => { sel.clear(); S.move(react); } : null });
  const chosen = [...sel].map((id) => mine.get(id)).sort((a, b) => a - b), go = (m) => () => { sel.clear(); S.move(m); };
  if (chosen.length === 1) {
    const splits = P.moves.filter((m) => m.split === chosen[0]);
    splits.forEach((m, j) => { const x0 = (j - (splits.length - 1) / 2) * 0.42; m.into.forEach((s, k) => die(out, `snsplit:${m.into.join('+')}:${k}`, s, s, x0 + (k - 0.5) * 0.16, L.sn.options, String(s), { act: go(m), from: [0, 0.2, 1.1] })); });
  } else if (chosen.length >= 2) {
    const m = P.moves.find((x) => x.fuse && x.fuse.length === chosen.length && x.fuse.every((s, i) => s === chosen[i]));
    if (m) die(out, `snfuse:${m.into}`, m.into, m.into, 0, L.sn.options, String(m.into), { act: go(m), from: [0, 0.2, 1.1] });
  }
  mark(out, m0, 'L', 'moves');
  for (let i = m0; i < out.length; i++) if (out[i].id.startsWith('sn') && out[i].id !== 'sncup') out[i].tier = 'M'; // (the results of a choice sit third on the ladder, below your dice (XL) and your points (L))
  const mv = out.slice(m0); if (mv.length) { const c = mv.reduce((a, e) => [a[0] + e.p[0] / mv.length, a[1] + e.p[2] / mv.length], [0, 0]); anchor(out, 'role:moves', c[0], c[1]); }
}
/** The Supernova: the d20 risen lit on its 20, a ring of gold bursting from it, the old hands blown outward as spent clay. */
function burst(out, mo, age, n) {
  const u = Math.min(1, age / L.nova), rise = Math.sin(Math.min(1, u * 1.6) * Math.PI * 0.5) * 0.22 * (1 - Math.max(0, u - 0.75) * 4);
  const q20 = qOf(0, 0, 0), lift = dieRest(20, 20, u * 2, q20);
  out.push({ id: `snn:${mo.ix}`, tpl: dieTpl(20, 'atk20'), p: [0, lift + rise, 0], q: q20, glow: true, glaze: true, die: { sides: 20, value: 20, skin: 'atk20' }, from: [0, 0.05, 0] });
  for (let k = 0; k < L.burst; k++) {
    const a = (k / L.burst) * Math.PI * 2, r = 0.12 + u * 1.7;
    out.push({ id: `snb:${mo.ix}:${k}`, tpl: chipTpl('gold'), p: [Math.cos(a) * r, 0.02 + Math.sin(u * Math.PI) * 0.18, Math.sin(a) * r], q: qOf(1.2, a, 0), glow: true, from: [0, 0.1, 0] });
  }
  for (let q = 0; q < n; q++) {
    const before = mo.before[q] || [];
    before.forEach((s, i) => {
      const [x, z] = handSlot(q, n, i, before.length), d = Math.hypot(x, z) || 1, o = u * 1.3;
      spent(out, `snx:${q}:${mo.ix}:${s}:${i}`, s, x + (x / d) * o, z + (z / d) * o, Math.sin(u * Math.PI) * 0.2 - Math.max(0, u - 0.6) * 0.8);
      out[out.length - 1].tier = q === 0 ? 'XL' : 'S'; out[out.length - 1].role = q === 0 ? 'dice' : 'seats';
    });
  }
}

// ---------------------------------------------------------------- Nebula Bluff
function nebula(out, S, V, P, R, ctx) {
  const n = V.n, t = ctx.t ?? 0, N = L.nb, find = (f) => P?.moves.find(f), folded = V.inRound ? !V.inRound[0] : false;
  for (let q = 0; q < n; q++) {
    const a = (q * Math.PI * 2) / n, inRound = !!V.inRound?.[q], rho = N.row + (inRound ? 0 : N.back), from0 = out.length;
    if (q === 0) {
      const ords = ordinals(V.mine);
      V.mine.forEach((s, i) => { const [x, z] = seatAt(0, n, rho, (i - (V.mine.length - 1) / 2) * N.gap); die(out, `ed:0:${s}:${ords[i]}`, s, V.faces?.[i] ?? s, x, z, String(s), { tier: 'XL', rollKey: V.round, from: [N.cup[0], 0.2, N.cup[1]] }); });
      mark(out, from0, 'XL', 'hand', folded); // (a hand you folded sits back, dim)
    } else {
      const k = V.counts[q];
      for (let i = 0; i < k; i++) { const [x, z] = seatAt(q, n, rho, (i - (k - 1) / 2) * N.cupGap); out.push({ id: `nbc:${q}:${i}`, tpl: cupTpl(0.045, 0.07), p: [x, 0, z], q: qOf(0, a + i, 0), glaze: true }); }
      mark(out, from0, 'M', 'seats');
    }
    const [px, pz] = seatAt(q, n, N.purse[0], N.purse[1]), p0 = out.length;
    chips(out, `nbp:${q}`, V.chips[q], px, pz);
    mark(out, p0, q === 0 ? 'L' : 'S', 'seats'); // (your purse L, the others' S: a stack keeps its chips' own height, the HUD's plate carries the count)
    const [ax, az] = seatAt(q, n, 1.95, 0); anchor(out, `seat:${q}`, ax, az);
  }
  // your cup: fold
  const fold = find((m) => m.fold), c0 = out.length;
  out.push({ id: 'nbcup', tpl: cupTpl(0.085, 0.13, true), p: [N.cup[0], 0, N.cup[1]], q: qOf(0, 0, 0), glaze: true, act: fold ? () => S.move(fold) : null });
  mark(out, c0, 'L', 'moves');
  // the claim: gold d20s whose faces add up to it, the claimant's token; calling it out is clicking it
  const k0 = out.length;
  if (V.claim != null && V.claimant != null) {
    const k = Math.max(1, Math.ceil(V.claim / 20)), faces = splitSum(V.claim, Array(k).fill(20)), call = find((m) => m.callout), act = call ? () => S.move(call) : null;
    faces.forEach((v, i) => die(out, `nbclaim:${i}`, 20, v, (i - (k - 1) / 2) * 0.17, N.claimZ, 'atk20', { rollKey: `${V.round}:${V.claim}`, act, from: [0, 0.25, 0] }));
    const [tx, tz] = seatAt(V.claimant, n, N.token, 0);
    out.push({ id: 'nbtoken', tpl: chipTpl('gold'), p: [tx, 0, tz], q: qOf(0, 0, 0), glaze: true, act });
  }
  mark(out, k0, 'L', 'claim');
  const z0 = out.length;
  if (V.pot > 0) chips(out, 'nbpot', V.pot, N.pot[0], N.pot[1]);
  mark(out, z0, 'M', 'centre');
  const r0 = out.length;
  for (let i = 0; i < V.limit; i++) out.push({ id: `nbr:${i}`, tpl: chipTpl(i < V.raises ? '5' : '1'), p: [(i - (V.limit - 1) / 2) * 0.1, 0, N.raiseZ], q: qOf(0, i * 0.9, 0), glaze: true });
  mark(out, r0, 'S', 'centre');
  const tell = V.tell && V.claimant != null && V.claimant !== 0 ? riffle(out, V.chips[V.claimant] > 0 ? `nbp:${V.claimant}:` : 'nbtoken', t, V.claimant) : null;
  roleAnchors(out);
  const [hx, hz] = seatAt(0, n, N.row, 0); anchor(out, 'goal', hx, hz); anchor(out, 'centre', 0, 0);
  if (!tell && V.claimant != null && V.claimant !== 0) { const [tx, tz] = seatAt(V.claimant, n, N.purse[0], N.purse[1]); anchor(out, 'role:tell', tx, tz); } // (the purse, to point at before it riffles)
}
/** A tell's riffle: the top chip of the first stack (or the piece) lifting and turning a beat, every couple of real seconds. */
function riffle(out, prefix, t, q) {
  const all = out.filter((e) => e.id.startsWith(prefix)); if (!all.length) return null;
  const f = all[0], top = all.filter((e) => e.p[0] === f.p[0] && e.p[2] === f.p[2]).reduce((a, e) => (e.p[1] > a.p[1] ? e : a), f);
  top.role = 'tell'; top.tier = 'S'; // (the how-to's tell: the claimant's top chip, riffling or not)
  const { every, dur, lift, tilt } = L.riffle, ph = (t + q * 0.77) % every; if (ph > dur) return top;
  const s = Math.sin((ph / dur) * Math.PI);
  top.p = [top.p[0], top.p[1] + lift * s, top.p[2]]; top.q = qOf(tilt * s, (ph / dur) * 1.4, tilt * 0.4 * s);
  return top;
}

registerLayout('supernova', supernova);
registerLayout('nebula', nebula);
