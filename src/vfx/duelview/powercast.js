// ---------------------------------------------------------------------------------------
// THE POWERS' CASTS (plain name; the PvE duel's seven, Dovina's progress/duel/powers.js, PUZZLE-DUELS.md 24; South, 2026-10-28: "god hand
// powers in the duel"): each power's kernel events drawn on the tsuitate in its domain's colour (DOMAIN_LOOK's glaze), as beats.
//   POWER      `power`: a ring of the domain's glaze where it lands (the board's middle for Scan), its label rising over it in the System's
//              type, the pool's cost run down the spiritual link as a bead
//   SWAP       the two patches lifted and crossed over each other on raised arcs, a puff of celadon where each sets down
//   MANIFEST   the junk at each cell broken to dust and a gem grown up out of it in its colour, shino sparks round it
//   SCAN       the aberrant's countdowns knocked back, the delay over its head, a tenmoku glint off the scanned badge
//   LIFT       the row or column raised a little and slid along, a piece that wraps round hopping over the rest
//   HERD       each gem drawn onto the line along the ground, Jun's purple trailing it
//   TRANSMUTE  a wave of flambe out from the first gem through every gem of its colour, each turning as it reaches it (on slime,
//              `from: 'slime'`: every slime on your half swelling into a gem where it lies)
//   MIRACLE    the cobalt's rings and the colour's hum on your half (the tune's own: glows.js), held until `tune.end`
//   KINDLE     (a learned power, the Lantern Wisp's) a flame run down the row or column from where it was cast, each junk lit into an ember
//   DRINK      `drink`: the pool your clears filled, a bead up the link
// Programs: the bursts' and the words' (bursts.js, juice.js): nothing new.
// Prior art: Puzzle & Dragons' active skills (the board changed under a flash in the leader's colour), Puzzle Quest's spell casts, Bejeweled's
// hypercube spiral, the house's own skill casts (skillcast.js) and the god hand's powers in the world (vfx/godhand/marks.js: a domain's circle).
//
//   POWER_EVENTS (the types it draws)   powerBeat(beats, e) -> phase   POWER_CAST (the knobs)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { DOMAIN_LOOK } from '../../ui/domainlook.js';
import { DUEL_POWERS } from '../../progress/duel/powers.js';
import { DUEL_VIEW, cellLocal, sm, lerp, clamp01 } from './layout.js';
import { gemColour } from './pieces.js';

export const POWER_EVENTS = new Set(['power', 'swap', 'manifest', 'scan', 'lift', 'herd', 'transmute', 'transmute.end', 'miracle', 'drink', 'kindle']);
/** The beats' lengths (real s) and the cast's stagger between pieces. */
export const POWER_CAST = { ring: 0.32, slide: 0.42, per: 0.02, grow: 0.36, spiral: 0.4, miracle: 0.6, arc: 1.1, kindle: { fly: 0.32, per: 0.06 } };
const EMBER = 0xff6a2a;
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Color();
const domainHex = (d) => parseInt((DOMAIN_LOOK[d]?.colours?.accent || DOMAIN_LOOK[d]?.iconHex || '#ffd36a').slice(1), 16);
const DOMAIN_OF = (id) => DUEL_POWERS[id]?.domain;

/** The pieces a move carries, slid from their cells to their new ones (the model's move at once, the drawing over the beat). */
function slide(T, e, { arc = 0, hop = 0.6, hex }) {
  const V = T.view, P = V.pieces, B = V.board3, items = [];
  for (const m of e.moved || []) { const v = P.byId(m.id); if (v) items.push({ v, from: m.from, to: m.to, d: items.length * POWER_CAST.per, far: Math.abs(m.to[0] - m.from[0]) + Math.abs(m.to[1] - m.from[1]) }); }
  for (const q of items) P.move(q.v, q.to[0], q.to[1]);
  const dur = POWER_CAST.slide + items.length * POWER_CAST.per + DUEL_VIEW.ma, wrap = e.type === 'lift' ? (e.by || 1) + 0.5 : Infinity;
  return { events: [e], dur, step: (u, age) => { for (const q of items) {
    const f = sm(clamp01((age - q.d) / POWER_CAST.slide)); q.v.x = lerp(q.from[0], q.to[0], f); q.v.y = lerp(q.from[1], q.to[1], f);
    q.v.lift = Math.sin(Math.PI * f) * (arc + (q.far > wrap ? hop * 2 : 0)); if (f >= 1 && !q.down) { q.down = true; V.bursts.burst(cellLocal(q.to[0], q.to[1], B, _a), hex, 2, { speed: 0.3, life: 0.3, fall: 0, size: 0.02 }); } } },
    end: () => { for (const q of items) { q.v.x = q.to[0]; q.v.y = q.to[1]; q.v.lift = 0; } } };
}

/** A power's moment: its ring where it lands, its label over it, the pool's bead down the link. */
function powerMoment(T, e) {
  const V = T.view, B = V.board3, hex = domainHex(e.domain), at = e.at ? cellLocal(e.at[0], e.at[1], B, new THREE.Vector3()) : cellLocal((V.lineCol ?? B.line) / 2, B.h / 2, B, new THREE.Vector3());
  V.game.spiritualLink?.bead?.({ amount: e.cost || 0 });
  V.bursts.burst(at, hex, 18, { speed: 0.9, life: 0.4, fall: 0, spread: 0, size: 0.022 }); V.bursts.burst(at, 0xffffff, 5, { speed: 0.4, life: 0.3, fall: 0, size: 0.04 });
  V.juice.word((DUEL_POWERS[e.power]?.label || e.power || '').toUpperCase(), _b.copy(at).add(_a.set(0, 0.22, 0.06)), hex, { h: 0.11, dur: 0.9 });
  V.stage?.jolt?.(0.2);
  return { events: [e], dur: POWER_CAST.ring };
}

/** The kernel's power events as beats (beats.js hands them here). */
export function powerBeat(T, e) {
  const V = T.view, P = V.pieces, B = V.board3, hex = domainHex(e.domain || DOMAIN_OF(e.type));
  if (e.type === 'power') return powerMoment(T, e);
  if (e.type === 'drink') { V.drink?.(e); return { events: [e], dur: 0 }; }
  if (e.type === 'transmute.end') return { events: [e], dur: 0 };
  if (e.type === 'swap') return slide(T, e, { arc: POWER_CAST.arc * 0.5, hex: domainHex('ouranurgy') });
  if (e.type === 'lift') return slide(T, e, { arc: 0.25, hop: 0.6, hex: domainHex('psychokinesis') });
  if (e.type === 'herd') return slide(T, e, { arc: 0, hex: domainHex('possession') });
  if (e.type === 'manifest') {
    const H = domainHex('manifestation'), items = (e.cells || []).map((c, i) => ({ c, d: i * 0.06, done: false }));
    return { events: [e], dur: POWER_CAST.grow + items.length * 0.06 + DUEL_VIEW.ma, step: (u, age) => { for (const q of items) {
      if (!q.done && age >= q.d) { q.done = true; const old = P.at(q.c.at[0], q.c.at[1]); cellLocal(q.c.at[0], q.c.at[1], B, _a);
        if (old) { V.bursts.burst(_a, 0x4a3326, 5, { speed: 0.5, life: 0.35, fall: 3, size: 0.02 }); P.remove(old); }
        q.v = P.byId(q.c.id) || P.add('gem', { id: q.c.id, colour: e.colour, side: e.side }, q.c.at[0], q.c.at[1]); q.v.s = 0.01; V.bursts.burst(_a, H, 8, { speed: 0.7, life: 0.4, fall: -0.5, size: 0.02 }); }
      if (q.v) q.v.s = Math.max(0.01, sm(clamp01((age - q.d) / POWER_CAST.grow)) * (1 + 0.25 * Math.sin(Math.PI * clamp01((age - q.d) / POWER_CAST.grow)))); } },
      end: () => { for (const q of items) { if (!q.done) { const old = P.at(q.c.at[0], q.c.at[1]); if (old) P.remove(old); q.v = P.byId(q.c.id) || P.add('gem', { id: q.c.id, colour: e.colour, side: e.side }, q.c.at[0], q.c.at[1]); } q.v.s = 1; } } };
  }
  if (e.type === 'transmute') {
    const H = domainHex('alteration'), to = gemColour(e.colour, _c).getHex(), c0 = e.cells?.[0]?.at || [0, 0];
    const items = (e.cells || []).map((c) => ({ c, v: P.byId(c.id) || P.at(c.at[0], c.at[1]), d: 0.04 * Math.hypot(c.at[0] - c0[0], c.at[1] - c0[1]), done: false })).filter((q) => q.v); // (a wave out from the first, each gem turning as it reaches it)
    const flip = (q) => { q.done = true; if (q.v.kind !== 'gem') { P.remove(q.v); q.v = P.add('gem', { id: q.c.id, colour: e.colour, side: e.side }, q.c.at[0], q.c.at[1]); q.v.s = 0.6; } q.v.colour = e.colour; q.v.flash = 0.9; // (on slime, the slip jelly's: the junk itself turned a gem where it lies, same id)
      cellLocal(q.c.at[0], q.c.at[1], B, _a); V.bursts.burst(_a, H, 4, { speed: 0.5, life: 0.3, fall: 0, size: 0.02 }); V.bursts.burst(_a, to, 3, { speed: 0.3, life: 0.35, fall: 0, size: 0.022 }); };
    return { events: [e], dur: POWER_CAST.spiral + Math.max(0, ...items.map((q) => q.d)) + DUEL_VIEW.ma, step: (u, age) => { for (const q of items) { if (!q.done && age >= q.d + 0.05) flip(q); if (q.done) { q.v.flash = Math.max(0, q.v.flash - 0.05); q.v.s = Math.min(1, q.v.s + 0.06); } } },
      end: () => { for (const q of items) { if (!q.done) flip(q); q.v.flash = 0; q.v.s = 1; } } };
  }
  if (e.type === 'kindle') { // (a learned power, the Lantern Wisp's own turned to your hand: a flame run down the line from where it was cast, each junk lit into an ember)
    const from = cellLocal(...(e.at || [0, 0]), B, new THREE.Vector3()), a0 = e.at || [0, 0], K = POWER_CAST.kindle;
    const items = (e.cells || []).map((c) => ({ c, d: K.per * Math.hypot(c.at[0] - a0[0], c.at[1] - a0[1]), done: false }));
    const light = (q) => { q.done = true; const v = P.byId(q.c.id) || P.at(q.c.at[0], q.c.at[1]); if (v) P.remove(v); P.add('ember', { id: q.c.id, count: 1, side: e.side }, q.c.at[0], q.c.at[1]);
      cellLocal(q.c.at[0], q.c.at[1], B, _a); V.bursts.burst(_a, EMBER, 8, { speed: 0.8, life: 0.45, fall: -1.5, size: 0.022 }); V.bursts.burst(_a, hex, 3, { speed: 0.4, life: 0.35, fall: 0, size: 0.02 }); };
    for (const q of items) V.foeCast.fling(from, cellLocal(q.c.at[0], q.c.at[1], B, new THREE.Vector3()), EMBER, { delay: q.d, life: K.fly, size: 0.026, arc: 0.25 });
    return { events: [e], dur: K.fly + Math.max(0, ...items.map((q) => q.d)) + DUEL_VIEW.ma, step: (u, age) => { for (const q of items) if (!q.done && age >= q.d + K.fly) light(q); },
      end: () => { for (const q of items) if (!q.done) light(q); } };
  }
  if (e.type === 'miracle') {
    const at = cellLocal(...(e.at || [(V.lineCol ?? B.line) / 2, B.h / 2]), B, new THREE.Vector3()), C = domainHex('spellscription'), G = gemColour(e.colour, _c).getHex(); let rang = 0;
    V.tune[e.side] = e.colour; // (its colour's hum on your half while the weather holds: the tune's, glows.js; tune.end lets it go)
    return { events: [e], dur: POWER_CAST.miracle, step: (u, age) => { while (rang < 4 && age >= rang * 0.1) { rang++; V.bursts.burst(at, rang % 2 ? C : G, 24, { speed: 1.2 + rang * 0.5, life: 0.55, fall: 0, spread: 0 }); } } };
  }
  if (e.type === 'scan') {
    const F = V.foeCast, at = F.head(new THREE.Vector3()), D = domainHex('divination');
    F.knock = 1; V.bursts.burst(at, D, 16, { speed: 1.1, life: 0.5, fall: 0, spread: 0.3 }); V.bursts.burst(at, 0xb9b4e8, 6, { speed: 0.4, life: 0.4, fall: 0, size: 0.04 });
    V.juice.word(`+${e.delay || 2}`, _a.copy(at).add(_b.set(0, 0.32, 0.05)), D, { h: 0.12, dur: 1 });
    return { events: [e], dur: 0.55 };
  }
  return { events: [e], dur: 0 };
}
