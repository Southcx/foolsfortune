// ---------------------------------------------------------------------------------------
// THE TOOLS THAT BEND THE CLEARING (the duel's view: vfx/duelview/beats.js plays them; PUZZLE-DUELS.md 18.1, couriertools.js): the moves
// the owner asked for on 2026-10-27 ("utilize the lachryma tools to help dictate how the tile clearing mechanics work"), each one motion
// on the tsuitate that shows the rule it bends:
//   SHOOT  (the psygun)       a round of Lachryma flies from the Courier's figurine down its row or column to the first piece; the pop
//                             runs out through the group it hit, cell by cell by distance (0.045 apart), a bomb's cross where one goes
//                             off, and a pop of your own of 3 or more counts the chain's first step (its numeral, Puyo's chain voice)
//   PAINT  (the Soul Brush)   a stroke of sumi sweeps the reach (4 cells walking) outward from the figurine, and each gem it reaches
//                             is re-glazed from `from` to `colour` as the wave passes it (0.07 a cell); none in reach, a dry stroke
//   TUNE   (the Crucibelle)   three rings in the note's colour run out from the figurine; every gem of that colour on your half hums
//                             (glows.js) until `tune.end`, when the hum dies away
//   READ   (the Veritome)     the lens's flash at the figurine, then the plate's four corners sweep the foe's half from the Line to its
//                             back wall (0.5) and a white glint where they close: the fog lifts under it (dread.js visibleTo)
// A spend runs down the spiritual link as a bead (the first event's `spent`).
//
// Prior art: SameGame and Collapse (a pop that takes the whole touching group), Columns' magic jewel (a whole class repainted), Puyo
// Puyo's chain voice, the Dunes' crystal frets (a note is a colour: the hum in time), the Veritome's lens frame (vfx/veritomeframe.js).
//
//   TOOL_BEATS2 (event types)   shotBeat(T, shot, pops, chains)   paintBeat(T, recolour, paints)   tuneBeat(T, e)   tuneEndBeat(T, e)
//   readBeat(T, e)   (each returns a phase in beats.js's form)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { junkOf } from '../../progress/duel/duel.js';
import { DUEL_VIEW, cellLocal, feelColour, sm, lerp } from './layout.js';
import { Strokes } from './intent.js';

export const TOOL_BEATS2 = new Set(['shot', 'recolour', 'tune', 'tune.end', 'read']);
const CLAY = 0x93552f, SUMI = 0x17111f, DV = { N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0] };
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Color();
const bodyCell = (V, side) => { const b = V.pieces.bodyAt(side); return b ? [b.cx, b.cy] : V.state?.sides?.[side]?.at || [0, 0]; };

/** The psygun's shot and the pop it makes (the clears and breaks marked `by: 'shot'`, the blasts beside them, its chain's first step). */
export function shotBeat(T, e, pops, chains) {
  const V = T.view, P = V.pieces, B = V.board3, X = V.bursts, [bx, by] = bodyCell(V, e.side), d = DV[e.dir] || [e.side === 0 ? 1 : -1, 0];
  const dist = Math.max(1, Math.abs(e.at[0] - bx) + Math.abs(e.at[1] - by)), fly = Math.min(0.32, 0.06 + dist * 0.025), hex = V.filmHex(0.15);
  const q = pops.filter((p) => p.type !== 'blast').map((p) => { const v = P.at(p.at[0], p.at[1]) || P.byId(p.id); if (v) P.move(v, -1, -1); return { p, v, t: fly + (Math.abs(p.at[0] - e.at[0]) + Math.abs(p.at[1] - e.at[1])) * 0.045, done: false }; });
  const blasts = pops.filter((p) => p.type === 'blast').map((p) => ({ p, t: fly + (Math.abs(p.at[0] - e.at[0]) + Math.abs(p.at[1] - e.at[1])) * 0.045, done: false }));
  const last = Math.max(fly, ...q.map((r) => r.t), ...blasts.map((r) => r.t)); let trail = -1, shown = false;
  const mid = (() => { const own = q.filter((r) => r.p.type === 'clear' && r.p.side === e.side), n = Math.max(1, own.length); return own.length ? cellLocal(own.reduce((s, r) => s + r.p.at[0], 0) / n, own.reduce((s, r) => s + r.p.at[1], 0) / n, B, new THREE.Vector3()) : cellLocal(e.at[0], e.at[1], B, new THREE.Vector3()); })();
  const popOne = (r) => { r.done = true; const v = r.v; cellLocal(r.p.at[0], r.p.at[1], B, _a);
    if (r.p.type === 'break') X.burst(_a, CLAY, 6, { speed: 0.7, life: 0.5, fall: 6, size: 0.03 });
    else { X.burst(_a, v?.kind === 'gem' || r.p.colour ? feelColour(r.p.colour || v?.colour, _c).getHex() : 0xe8dcc8, 6, { speed: 1.2, life: 0.42 }); X.burst(_a, 0xffffff, 2, { speed: 0.3, life: 0.16, fall: 0, size: 0.03 }); }
    if (v) P.remove(v); };
  return { events: [e, ...pops, ...chains], dur: last + 0.42 + DUEL_VIEW.ma, step: (u, age) => {
    const f = Math.min(1, age / fly), x = lerp(bx + d[0] * 0.4, e.at[0], f), y = lerp(by + d[1] * 0.4, e.at[1], f), k = Math.floor(f * dist * 2);
    if (f < 1 && k !== trail) { trail = k; cellLocal(x, y, B, _a); X.burst(_a, hex, 2, { speed: 0.12, life: 0.28, fall: 0, spread: 0.06, size: 0.028 }); X.burst(_a, 0xffffff, 1, { speed: 0, life: 0.1, fall: 0, spread: 0, size: 0.04 }); }
    for (const r of blasts) if (!r.done && age >= r.t) { r.done = true; cellLocal(r.p.at[0], r.p.at[1], B, _a);
      for (const [dx, dy] of Object.values(DV)) for (let s = 0; s <= (V.state?.rs?.blast || 2); s++) { _b.copy(_a); _b.x += dx * s * DUEL_VIEW.cs; _b.y -= dy * s * DUEL_VIEW.cs; X.burst(_b, s ? 0xc8402a : 0xfff2e0, 3, { speed: 0.6, life: 0.32, fall: 0 }); } }
    for (const r of q) if (!r.done && age >= r.t) popOne(r);
    if (!shown && chains.length && age >= last) { shown = true; for (const ch of chains) { V.marks.numeral(String(ch.step), mid, V.sideHex(ch.side)); V.sent[ch.side] += junkOf(ch.cleared, ch.step); } V.showCounts(); }
  }, end: () => { for (const r of q) if (!r.done) popOne(r); if (!shown) { for (const ch of chains) V.sent[ch.side] += junkOf(ch.cleared, ch.step); V.showCounts(); } } };
}

/** The Soul Brush's Paint: the sumi wave out over the reach, each gem re-glazed as it passes. */
export function paintBeat(T, e, paints) {
  const V = T.view, P = V.pieces, B = V.board3, X = V.bursts, [bx, by] = bodyCell(V, e.side), R = 4, per = 0.07, hex = feelColour(e.colour, _c).getHex();
  const q = paints.map((p) => ({ p, v: P.byId(p.id) || P.at(p.at[0], p.at[1]), t: 0.1 + (Math.abs(p.at[0] - bx) + Math.abs(p.at[1] - by)) * per, done: false })).filter((r) => r.v);
  const ring = []; for (let d = 1; d <= R; d++) for (let i = 0; i < d * 4; i++) { const s = i / (d * 4), a = s * Math.PI * 2; ring.push({ x: bx + Math.cos(a) * d * 0.95, y: by + Math.sin(a) * d * 0.95, t: 0.1 + d * per, done: false }); }
  const flip = (r) => { r.done = true; r.v.kind = 'gem'; r.v.colour = r.p.colour; r.v.flash = 0.9; cellLocal(r.v.x, r.v.y, B, _a); X.burst(_a, hex, 3, { speed: 0.4, life: 0.3, fall: 0, size: 0.024 }); };
  return { events: [e, ...paints], dur: 0.1 + R * per + 0.38 + DUEL_VIEW.ma, step: (u, age) => {
    for (const r of ring) if (!r.done && age >= r.t) { r.done = true; if (r.x < 0 || r.y < 0 || r.x > B.w - 1 || r.y > B.h - 1) continue; cellLocal(r.x, r.y, B, _a); _a.z += 0.02;
      X.burst(_a, SUMI, 1, { speed: 0.04, life: 0.5, fall: 0, spread: 0.02, size: 0.05 }); if (q.length) X.burst(_a, hex, 1, { speed: 0.08, life: 0.35, fall: 0, spread: 0.03, size: 0.022 }); }
    for (const r of q) { if (!r.done && age >= r.t) flip(r); if (r.done) r.v.flash = Math.max(0, r.v.flash - 0.06); } },
    end: () => { for (const r of q) { if (!r.done) flip(r); r.v.flash = 0; } } };
}

/** The Crucibelle's Tune: rings in the note's colour, and the colour's hum on your half held (the view's `tune`, glows.js). */
export function tuneBeat(T, e) {
  const V = T.view, B = V.board3, [bx, by] = bodyCell(V, e.side), hex = feelColour(e.colour, _c).getHex(); let rang = 0;
  V.tune[e.side] = e.colour;
  return { events: [e], dur: 0.5 + DUEL_VIEW.ma, step: (u, age) => { while (rang < 3 && age >= rang * 0.1) { rang++; cellLocal(bx, by, B, _a); V.bursts.burst(_a, hex, 22, { speed: 1.4 + rang * 0.5, life: 0.5, fall: 0, spread: 0 }); } } };
}
export function tuneEndBeat(T, e) { T.view.tune[e.side] = null; return { events: [e], dur: 0.12 }; }

/** The Veritome's Read: the lens's flash, the plate's corners swept over the foe's half. */
export function readBeat(T, e) {
  const V = T.view, B = V.board3, cs = DUEL_VIEW.cs, [bx, by] = bodyCell(V, e.side), foe = 1 - e.side, L = V.lineCol ?? B.line;
  const x0 = foe === 1 ? L : 0, x1 = foe === 1 ? B.w : L, mat = new THREE.MeshBasicMaterial({ name: 'duel-read', color: 0xfff6e0, transparent: true, opacity: 0.9, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
  let mesh = null, flashed = false;
  const frameAt = (xa, xb) => { const S = new Strokes(), z = DUEL_VIEW.front + 0.07, w = cs * 0.16, arm = cs * 1.6;
    const c = [[xa, 0, 1, 1], [xb, 0, -1, 1], [xb, B.h, -1, -1], [xa, B.h, 1, -1]];
    for (const [x, y, sx, sy] of c) { cellLocal(x - 0.5, y - 0.5, B, _a).setZ(z); _b.copy(_a); _b.x += sx * arm; S.seg(_a.clone(), _b.clone(), w); _b.copy(_a); _b.y -= sy * arm; S.seg(_a.clone(), _b.clone(), w); }
    return S.geometry(); };
  return { events: [e], dur: 0.62 + DUEL_VIEW.ma, step: (u, age) => {
    if (!flashed) { flashed = true; cellLocal(bx, by, B, _a); V.bursts.burst(_a, 0xffffff, 14, { speed: 1.1, life: 0.25, fall: 0, spread: 0.04, size: 0.03 }); }
    const f = sm(Math.min(1, age / 0.5)), xa = foe === 1 ? x0 : lerp(x1 - 1, x0, f), xb = foe === 1 ? lerp(x0 + 1, x1, f) : x1;
    if (mesh) { V.frame.remove(mesh); mesh.geometry.dispose(); } mesh = new THREE.Mesh(frameAt(xa, xb), mat); mesh.renderOrder = 7; mesh.frustumCulled = false; V.frame.add(mesh);
    mat.opacity = age < 0.5 ? 0.9 : Math.max(0, 0.9 * (1 - (age - 0.5) / 0.12));
    if (age >= 0.5 && !mesh.userData.glint) { mesh.userData.glint = true; cellLocal(foe === 1 ? x1 - 1 : x0, 0, B, _a); V.bursts.burst(_a, 0xffffff, 6, { speed: 0.5, life: 0.3, fall: 0, size: 0.03 }); } },
    end: () => { if (mesh) { V.frame.remove(mesh); mesh.geometry.dispose(); } mat.dispose(); } };
}
