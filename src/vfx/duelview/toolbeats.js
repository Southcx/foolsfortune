// ---------------------------------------------------------------------------------------
// THE TOOLS ON THE DUEL'S BOARD (the duel's view: vfx/duelview/beats.js plays them): each tool the Courier wears is a special attack
// that goes round the puzzle (PUZZLE-DUELS.md section 11, couriertools.js), and each is one small motion here (board v11, figure 14):
//   SHOOT  (the psygun)       a round of Lachryma runs the row across the Line and the first piece bursts (0.4)
//   HOOK   (the Sondelass)    the line flies out, bites, and the piece is reeled back to the cell nearest the Line on your side (0.55)
//   DRILL  (the Dreamvane)    the bit bores through up to three pieces, each crumbling as it passes, 0.1 apart (0.45)
//   PAINT  (the Soul Brush)   the ensō sweeps the 3 x 3 and everything in it, junk too, flashes into one feeling (0.5)
//   TOLL   (the Crucibelle)   three rings run out across the board, 0.07 apart, and the foe staggers (its beads crack at its turn) (0.6)
//   HOOVER (the Lockheart)    the junk beside spirals into the coffin at the figurine's side (0.5)
//   FLAIL  (the Lockheart)    the coffin swings and throws all it holds over the Line as junk, joining the send (0.55)
// A spend runs down the spiritual link as a bead (the view's `spend`, from the event's `spent` or the price table).
//
// Prior art, tool by tool (the kernel's): Meteos' launch, Magical Drop's grab, Mr. Driller, Columns' magic jewel, Tetris 99's attack
// badges, Tetris's hold.
//
//   toolBeat(beats, events) -> a phase (beats.js's form)   TOOL_EVENTS
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { DUEL_VIEW, cellLocal, sm, lerp } from './layout.js';
import { gemColour } from './pieces.js';

export const TOOL_EVENTS = new Set(['shot', 'grab', 'drill', 'paint', 'delay', 'hold', 'hold.send']);
const CLAY = 0x93552f;
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Color();

export function toolBeat(T, it) {
  const V = T.view, P = V.pieces, B = V.board3, X = V.bursts, e = it[0], body = P.bodyAt(e.side), bx = body ? body.cx : 0, by = body ? body.cy : 0, ma = DUEL_VIEW.ma;
  const pop = (v, hex = null) => { if (!v) return; cellLocal(v.x, v.y, B, _a); X.burst(_a, hex ?? (v.kind === 'gem' ? gemColour(v.colour, _c).getHex() : CLAY), 5, { speed: 1, life: 0.4 }); P.remove(v); };
  if (e.type === 'shot') {
    const v = P.byId(e.id) || P.at(e.at[0], e.at[1]); if (v) P.move(v, -1, -1); let popped = false, last = -1;
    return { events: it, dur: 0.4 + ma, step: (u, age) => { const f = Math.min(1, age / 0.22), x = lerp(bx, e.at[0], f), k = Math.floor(f * 8);
      if (k !== last) { last = k; cellLocal(x, by, B, _a); X.burst(_a, V.filmHex(f * 0.3), 2, { speed: 0.15, life: 0.25, fall: 0, spread: 0.1, size: 0.025 }); }
      if (f >= 1 && !popped) { popped = true; pop(v); } }, end: () => { if (!popped) pop(v); } };
  }
  if (e.type === 'grab') {
    const v = P.byId(e.id) || P.at(e.from[0], e.from[1]); if (v) P.move(v, e.to[0], e.to[1]);
    return { events: it, dur: 0.55 + ma, step: (u, age) => {
      const out = Math.min(1, age / 0.19), back = Math.max(0, (age - 0.19) / 0.28), tip = back > 0 ? lerp(e.from[0], e.to[0], sm(back)) : lerp(bx, e.from[0], out);
      for (let k = 0; k <= 4; k++) { if ((Math.floor(age * 60) + k) % 5) continue; cellLocal(lerp(bx, tip, k / 4), by, B, _a); X.burst(_a, 0xd9c8ff, 1, { speed: 0.02, life: 0.12, fall: 0, spread: 0, size: 0.014 }); }
      if (v && back > 0) { v.x = lerp(e.from[0], e.to[0], sm(back)); v.y = e.from[1]; v.lift = Math.sin(Math.PI * Math.min(1, back)) * 0.8; } },
      end: () => { if (v) { v.x = e.to[0]; v.y = e.to[1]; v.lift = 0; } } };
  }
  if (e.type === 'drill') {
    const vs = it.map((d, k) => { const v = P.byId(d.id) || P.at(d.at[0], d.at[1]); if (v) P.move(v, -1, -1); return { v, d: 0.08 + k * 0.1, done: false }; });
    return { events: it, dur: 0.45 + ma, step: (u, age) => { for (const q of vs) if (!q.done && age >= q.d) { q.done = true; if (q.v) { cellLocal(q.v.x, q.v.y, B, _a); X.burst(_a, CLAY, 4, { speed: 0.6, life: 0.4, fall: 6, size: 0.022 }); } pop(q.v); } },
      end: () => { for (const q of vs) if (!q.done) pop(q.v); } };
  }
  if (e.type === 'paint') {
    const vs = it.map((d) => ({ d, v: P.byId(d.id) || P.at(d.at[0], d.at[1]) })).filter((q) => q.v); let swept = false;
    return { events: it, dur: 0.5 + ma, step: (u, age) => {
      if (!swept && age >= 0.0) { swept = true; for (let i = 0; i < 18; i++) { const a = (i / 18) * Math.PI * 2; cellLocal(bx + Math.cos(a) * 1.5, by + Math.sin(a) * 1.5, B, _a); X.burst(_a, gemColour(e.colour, _c).getHex(), 1, { speed: 0.1, life: 0.35, fall: 0, spread: 0, size: 0.03 }); } }
      const f = Math.max(0, (age - 0.3) / 0.2); for (const q of vs) { q.v.flash = f < 0.5 ? f * 2 : 2 - f * 2; if (f >= 0.5) { q.v.kind = 'gem'; q.v.colour = q.d.colour; } } },
      end: () => { for (const q of vs) { q.v.kind = 'gem'; q.v.colour = q.d.colour; q.v.flash = 0; } } };
  }
  if (e.type === 'delay') {
    let rang = 0;
    return { events: it, dur: 0.6 + ma, step: (u, age) => { while (rang < 3 && age >= rang * 0.07) { const r = rang++; cellLocal(bx, by, B, _a); X.burst(_a, V.filmHex(r * 0.25), 20, { speed: 2.2 + r * 0.4, life: 0.45, fall: 0, spread: 0 }); } } };
  }
  if (e.type === 'hold') {
    const vs = it.map((d) => { const v = P.byId(d.id) || P.at(d.at[0], d.at[1]); if (v) P.move(v, -1, -1); return { v, from: d.at }; }).filter((q) => q.v);
    return { events: it, dur: 0.5 + ma, step: (u) => { const s = sm(u); for (const q of vs) { const a = s * 6; q.v.x = lerp(q.from[0], bx + 0.6, s) + Math.cos(a) * 0.3 * (1 - s); q.v.y = lerp(q.from[1], by, s) + Math.sin(a) * 0.3 * (1 - s); q.v.s = 1 - 0.85 * s; q.v.spin = a; } },
      end: () => { for (const q of vs) P.remove(q.v); } };
  }
  if (e.type === 'hold.send') {
    V.sent[e.side] += e.n || 0; V.showCounts(); let thrown = false;
    return { events: it, dur: 0.55 + ma, step: (u, age) => { if (!thrown && age >= 0.15) { thrown = true; cellLocal(bx, by, B, _a); cellLocal(V.lineCol ?? B.line, -1, B, _b);
      for (let i = 0; i < Math.min(12, e.n || 4); i++) { V.bursts.spiral(_a, _b.clone(), CLAY, i * 0.025, 0.4); } } } };
  }
  return { events: it, dur: 0.3 };
}
