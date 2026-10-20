// ---------------------------------------------------------------------------------------
// A MOUNT'S VIEWS, THE LOOPS: what each mount does in one loop of four real seconds, as a list of shapes in the rail's frame (x across,
// the right hand facing ahead; y up; z ahead; metres at the rail's size), a function of the loop's time t. The three views (TOP, SIDE,
// CHASE: ui/mountviews/draw.js) are three projections of the same list, so a shot drunk in one is drunk in all three at the same beat.
// Every number is read from the live tables, never retyped: the mount's row (ui/mountcards.js mountRow: range, angle, cooldown in real
// seconds, duration, charges, from MOUNTS, progress/rail/mounts.js, with its cuts and refill), the ship's locks (SHIPS[ship].locks,
// progress/rail/ships.js), the bar (BAR_S, progress/rail/crossing.js), the reticles (T.ship.reticles, core/config.js), the gun's needle
// (RAIL_SHOT, vfx/railshots.js), the looks and the nose (MOUNT_LOOK, AT_SEA, NOSE, vfx/mountpreview.js). Ported from the mount views mock
// Dovina approved against the rules (2026-10-20). The foes, the boarder, the cask and the creature are placeholders.
//
// Prior art: the Mega Man weapon-get demo (a short loop of the thing in use: CLARITY.md section 6), Into the Breach's previews (the
// action played on the board before you commit), RayStorm's and Itano's homing lances, Star Fox 64's two-square reticle.
//
//   const sim = mountSim(tool, { row, you, locks })   sim.run(t) -> { it: [shape], count: 'LOCK 3 / 8' }   sim.ticks [[t, kind]]   sim.col   sim.A
//   LOOP (real seconds)   S, N (the ship's middle and nose)   waterRing(c, R, o)   LANCE_COLOR   WARN_COLOR   MOUNT_SIM_TOOLS
// ---------------------------------------------------------------------------------------
import { MOUNTS } from '../../progress/rail/mounts.js';
import { BAR_S } from '../../progress/rail/crossing.js';
import { T } from '../../core/config.js';
import { RAIL_SHOT } from '../../vfx/railshots.js';
import { MOUNT_LOOK, AT_SEA, NOSE } from '../../vfx/mountpreview.js';
import { LANCE_COLOR as LANCE_HEX } from '../../courier/ship/shots.js';
import { TOLL_BEAT as TOLL, VANE_WARN_COLOR } from '../../courier/ship/mounts.js';

export const LOOP = 4;
const TAU = Math.PI * 2, D2R = Math.PI / 180;
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const sm = (a, b, x) => { const k = clamp((x - a) / (b - a)); return k * k * (3 - 2 * k); };
export const lerp = (a, b, k) => a + (b - a) * k;
const L3 = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
export const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const len = (a) => Math.hypot(a[0], a[1], a[2]);
export const norm = (a) => mul(a, 1 / (len(a) || 1));
export { sub, dot };
const easeOut = (x) => 1 - (1 - x) * (1 - x);
export const frac = (x) => x - Math.floor(x);
const hex = (n) => '#' + n.toString(16).padStart(6, '0');

// the rail's own constants, read where play reads them (courier/ship/shots.js, courier/ship/mounts.js: Petra's exports, adf2ae0)
export const LANCE_COLOR = hex(LANCE_HEX);
export const WARN_COLOR = hex(VANE_WARN_COLOR);
const TOLL_BEAT = TOLL.boost; // (the toll's ring on the beat)
const FISH_CUT = MOUNTS.soulbrush.cuts, GULP_REFILL = MOUNTS.lockheart.refill;
const LEAD_EARLIER = /half again/.test(MOUNTS.dreamvane.detail || '') ? 1.5 : 1; // (the vane's lead is still words in Dovina's line)
/** Each mount's look, its colour as CSS (null: the ship's own feeling, `you`). */
const LOOKS = Object.fromEntries(Object.entries(MOUNT_LOOK).map(([k, v]) => [k, { ...v, color: v.color == null ? null : hex(v.color) }]));
const colOf = (C, id) => LOOKS[id].color ?? C.you;
/** The ship's middle and its nose, at the rail. */
export const S = [0, 0.35, 0], N = [0, 0.35, NOSE];
const wrapA = (t) => sm(0, 0.25, t) * (1 - sm(LOOP - 0.25, LOOP, t)); // (what respawns fades at the loop's seam)

// ---- shapes in the ship's frame --------------------------------------------------------------------------------------------------
const poly = (pts, o = {}) => ({ type: 'poly', pts, ...o });
function arcPts(c, r, a0, a1, n, plane) { // plane 'h': in y = c.y from ahead toward +x; 'v': in x = c.x from ahead toward +y; 'w': on the water
  const out = [];
  for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * (i / n), s = Math.sin(a), co = Math.cos(a);
    out.push(plane === 'v' ? [c[0], c[1] + r * s, c[2] + r * co] : plane === 'w' ? [c[0] + r * s, 0, c[2] + r * co] : [c[0] + r * s, c[1], c[2] + r * co]); }
  return out;
}
/** A cone from the nose along +z (3D, as courier/ship/mounts.js inCone): edges, its range's arcs in both planes, its cap. */
function cone(half, R, o = {}) {
  const a = o.a ?? 1, col = o.col, out = [], h = half * D2R;
  const tip = (sx, sy) => [N[0] + sx * R * Math.sin(h), N[1] + sy * R * Math.sin(h), N[2] + R * Math.cos(h)];
  out.push(poly([N, ...arcPts(N, R, -h, h, 28, 'h'), N], { col, a: a * 0.16, fill: true, only: 'top' }));
  out.push(poly([N, ...arcPts(N, R, -h, h, 28, 'v'), N], { col, a: a * 0.16, fill: true, only: 'side' }));
  for (const s of [-1, 1]) { out.push(poly([N, tip(s, 0)], { col, a, w: 2, only: 'top chase' })); out.push(poly([N, tip(0, s)], { col, a, w: 2, only: 'side chase' })); }
  out.push(poly(arcPts(N, R, -h, h, 28, 'h'), { col, a, w: 2, only: 'top chase' }));
  out.push(poly(arcPts(N, R, -h, h, 28, 'v'), { col, a, w: 2, only: 'side chase' }));
  const cap = [], cz = N[2] + R * Math.cos(h), cr = R * Math.sin(h);
  for (let i = 0; i <= 40; i++) { const b = (i / 40) * TAU; cap.push([N[0] + cr * Math.cos(b), N[1] + cr * Math.sin(b), cz]); }
  out.push(poly(cap, { col, a: a * 0.85, w: 1.5, only: 'chase' }));
  out.push(poly(cap, { col, a: a * 0.12, fill: true, only: 'chase' }));
  for (const r of o.arcs || []) { // (the moving arcs: out for a spray, in for a draw)
    out.push(poly(arcPts(N, r.r, -h, h, 18, 'h'), { col, a: r.a, w: 1.2, only: 'top' }));
    out.push(poly(arcPts(N, r.r, -h, h, 18, 'v'), { col, a: r.a, w: 1.2, only: 'side' }));
    const c2 = []; for (let i = 0; i <= 28; i++) { const b = (i / 28) * TAU; c2.push([N[0] + r.r * Math.sin(h) * Math.cos(b), N[1] + r.r * Math.sin(h) * Math.sin(b), N[2] + r.r * Math.cos(h)]); }
    out.push(poly(c2, { col, a: r.a, w: 1.2, only: 'chase' }));
  }
  return out;
}
const inCone = (p, half, R) => { const d = sub(p, N), l = len(d); return l <= R && l > 1e-3 && d[2] / l >= Math.cos(half * D2R); };
/** A sphere round the ship (the toll's): its horizontal and vertical great circles, and its line on the water for the chase. */
function sphere(R, o = {}) {
  const col = o.col, a = o.a ?? 1, w = o.w ?? 2, dash = o.dash;
  return [
    poly(arcPts(S, R, 0, TAU, 96, 'h'), { col, a, w, dash, only: 'top' }),
    poly(arcPts(S, R, 0, TAU, 96, 'v'), { col, a, w, dash, only: 'side', under: true }),
    poly(arcPts([0, 0, 0], Math.sqrt(Math.max(0, R * R - S[1] * S[1])), 0, TAU, 120, 'w'), { col, a, w, dash, only: 'chase' }),
  ];
}
/** A ring on the water (the radar's): a circle seen from above and behind, a line seen from the side. */
export const waterRing = (c, R, o) => poly(arcPts([c[0], 0, c[2]], R, 0, TAU, 96, 'w'), o);

// ---- the mounts' loops ------------------------------------------------------------------------------------------------------------
const BUILD = {};
const pop = (p, col, f, size = 1) => ({ type: 'pop', p, col, f, size });

BUILD.psygun = (C) => {
  const col = C.you, [d1, d2] = T.ship.reticles, speed = 70, every = BAR_S / 16; // (the gun: a shot each sixteenth, 70 m/s: courier/ship/shots.js)
  const first = [0, 0.55, 11.5], hitFirst = 0.15 + (first[2] - N[2]) / speed;
  const TG = [[-3, 1.5, 9], [2.6, 0.9, 13], [-1.6, 2.6, 16.5], [4.2, 1.9, 8.2], [1.2, 3.2, 19]];
  const lockAt = (i) => 1.35 + i * 0.16, REL = 2.3, fly = 0.45, hitAt = (i) => REL + fly + i * 0.04;
  const bob = (p, t, i) => [p[0], p[1] + 0.15 * Math.sin(t * 2.4 + i), p[2] + 0.2 * Math.sin(t * 1.3 + i)];
  const ticks = [[hitFirst, 'hit'], ...TG.map((_, i) => [lockAt(i), 'lock']), [REL, 'go'], ...TG.map((_, i) => [hitAt(i), 'hit'])];
  return { col, ticks, run(t) {
    const it = [], sq = (d, s, a) => { const x = s / 2, h = N[1]; return poly([[-x, h - x, d], [x, h - x, d], [x, h + x, d], [-x, h + x, d], [-x, h - x, d]], { col, a, w: 2 }); };
    it.push(poly([N, [0, N[1], 40]], { col, a: 0.55, w: 1.5 }));
    it.push(sq(d1, 0.72, 0.95), sq(d2, 1.1, 0.8)); // (the two reticles, Star Fox 64's: mountpreview.js's sizes at the rail's)
    for (let k = 0; ; k++) { const tk = 0.15 + k * every; if (tk > 1.25) break; const z = N[2] + (t - tk) * speed; if (t < tk || z - RAIL_SHOT.gunLength > 40) continue;
      it.push({ type: 'needle', a: [0, N[1], Math.max(N[2], z - RAIL_SHOT.gunLength)], b: [0, N[1], z], col }); }
    if (t < hitFirst) it.push({ type: 'fish', p: bob(first, t, 9), v: [0, 0, -1], lit: true });
    else if (t < hitFirst + 0.45) it.push(pop(bob(first, hitFirst, 9), col, (t - hitFirst) / 0.45));
    else if (t > 3.5) it.push({ type: 'fish', p: bob(first, t, 9), v: [0, 0, -1], lit: true, a: sm(3.5, 3.9, t) });
    let locked = 0;
    TG.forEach((p0, i) => {
      const p = bob(p0, t, i), h = hitAt(i);
      if (t < h) { it.push({ type: 'fish', p, v: [0, 0, -1], lit: true, a: t < 0.3 ? sm(0, 0.25, t) : 1 });
        if (t >= lockAt(i)) { it.push({ type: 'lock', p, col: LANCE_COLOR, f: sm(lockAt(i), lockAt(i) + 0.12, t) }); if (t < REL) locked++; } }
      else if (t < h + 0.45) it.push(pop(bob(p0, h, i), LANCE_COLOR, (t - h) / 0.45));
      else if (t > 3.5) it.push({ type: 'fish', p, v: [0, 0, -1], lit: true, a: sm(3.5, 3.9, t) });
      const t0 = REL + i * 0.04, u = (t - t0) / fly; // (a lance: fanned out, turning onto its target: RayStorm's, Itano's)
      if (u > 0 && u < 1) { const side = i % 2 ? 1 : -1, c = add(N, [side * (2 + i * 0.4), 2.2, 2]), e = bob(p0, h, i), pts = [];
        for (let j = 0; j <= 10; j++) { const v = clamp(u - 0.3 + 0.3 * (j / 10)), q = L3(L3(N, c, v), L3(c, e, v), v); pts.push(q); }
        it.push(poly(pts, { col: LANCE_COLOR, a: 1, w: 2.2 }), { type: 'dot', p: pts[pts.length - 1], col: '#ffffff', r: 0.12 }); }
    });
    // what the gun does not answer: a foe's shots fly on (dim)
    const s1 = (t - 0.4) / 2.2; if (s1 > 0 && s1 < 1) it.push({ type: 'shot', p: L3([4.2, 1.9, 8.2], [1.0, 0.6, -6], s1), v: [-1.5, -0.6, -6.4], kind: 'other', lit: false });
    const s2 = (t - 1.0) / 2.2; if (s2 > 0 && s2 < 1) it.push({ type: 'shot', p: L3([-3, 1.5, 9], [-1.2, 0.5, -6], s2), v: [0.8, -0.5, -6.8], kind: 'mine', outlined: true, lit: false });
    const n = t < REL ? locked : 0;
    return { it, count: `LOCK ${n} / ${C.locks}` };
  } };
};

BUILD.soulbrush = (C) => {
  const R0 = C.row, col = C.you, half = R0.angle / 2, R = R0.range, A = [1.0, 2.6];
  const mine = [[0.8, 0.9, 14, 6], [-1.6, 0.6, 17, 6], [2.0, 1.5, 22, 6]], other = [-0.9, 0.8, 19, 6], outl = [1.3, 0.6, 16, 5];
  const at = (s, t) => [s[0], s[1], s[2] - s[3] * t];
  const drink = mine.map((s) => { for (let t = A[0]; t <= A[1]; t += 0.01) if (inCone(at(s, t), half, R)) return t; return null; });
  const fish = [[-1.0, 0.5, 6.8], [1.6, 0.8, 8.2], [0.4, 1.3, 5.6], [-2.4, 0.6, 8.6]], far = [0.5, 0.9, 13.5];
  const fishAt = (p, t, i) => [p[0] + 0.25 * Math.sin(t * 2 + i), p[1] + 0.12 * Math.sin(t * 3 + i * 2), p[2] - 0.5 * t];
  const order = fish.map((p, i) => [len(sub(fishAt(p, 1.2, i), N)), i]).sort((a, b) => a[0] - b[0]).map((x) => x[1]);
  const cutAt = {}; order.slice(0, FISH_CUT).forEach((i, k) => { cutAt[i] = A[0] + 0.2 + k * 0.25; });
  const ticks = [...drink.filter((x) => x != null).map((x) => [x, 'take']), ...Object.values(cutAt).map((x) => [x, 'cut']), [A[0], 'on'], [A[1], 'off']];
  return { col, ticks, A, run(t) {
    const it = [], on = t >= A[0] && t <= A[1];
    const arcs = on ? [0, 1, 2].map((i) => { const f = frac((t - A[0]) / 0.6 + i / 3); return { r: R * (0.06 + 0.94 * f), a: 0.8 * Math.sin(Math.PI * f) }; }) : [];
    it.push(...cone(half, R, { col, a: on ? 1 : 0.42, arcs }));
    mine.forEach((s, i) => { const d = drink[i];
      if (d == null || t < d) it.push({ type: 'shot', p: at(s, t), v: [0, 0, -s[3]], kind: 'mine', lit: on && inCone(at(s, t), half, R) ? true : null, a: wrapA(t) });
      else if (t < d + 0.18) it.push({ type: 'shot', p: L3(at(s, d), N, (t - d) / 0.18), v: [0, 0, -1], kind: 'mine', lit: true });
      else if (t < d + 0.6) it.push(pop(N, col, (t - d - 0.18) / 0.42, 0.7)); });
    it.push({ type: 'shot', p: at(other, t), v: [0, 0, -other[3]], kind: 'other', lit: false, a: wrapA(t) });
    it.push({ type: 'shot', p: at(outl, t), v: [0, 0, -outl[3]], kind: 'mine', outlined: true, lit: false, a: wrapA(t) });
    let cut = 0;
    fish.forEach((p0, i) => { const p = fishAt(p0, t, i), c = cutAt[i];
      if (c != null && t >= c) { cut++; if (t < c + 0.45) it.push(pop(fishAt(p0, c, i), col, (t - c) / 0.45, 0.9), { type: 'slash', p: fishAt(p0, c, i), col, f: (t - c) / 0.45 });
        else if (t > 3.5) it.push({ type: 'fish', p, v: [0, 0, -1], lit: null, a: sm(3.5, 3.9, t) }); return; }
      const inside = inCone(p, half, R); it.push({ type: 'fish', p, v: [0, 0, -1], lit: c != null ? (on && inside ? true : null) : on ? false : null, a: wrapA(t) }); });
    it.push({ type: 'fish', p: fishAt(far, t, 7), v: [0, 0, -1], lit: on ? false : null, a: wrapA(t) });
    return { it, count: `CUT ${cut} / ${FISH_CUT}` };
  } };
};

BUILD.crucibelle = (C) => {
  const R0 = C.row, col = colOf(C, 'crucibelle'), R = R0.range, Rb = R * TOLL_BEAT, TT = BAR_S; // (tolled on the bar: on the beat)
  const wave = (t) => { const f = (t - TT) / 0.5; return f < 0 ? -1 : lerp(0.85, Rb, easeOut(clamp(f))); };
  const SH = [[20, 6, 0.6, 'mine'], [70, 9, 1.6, 'other'], [115, 12.5, 0.9, 'mine'], [160, 7.5, 2.2, 'other'], [205, 11, 0.7, 'mine'], [250, 16.5, 1.3, 'other'], [300, 8.5, 1.8, 'mine'], [335, 18, 0.8, 'mine'], [140, 19, 1.1, 'other']];
  const shotAt = (s, t) => { const a = s[0] * D2R, d = s[1] + 3.5 - 2.4 * t; return [Math.sin(a) * d, s[2], Math.cos(a) * d]; };
  const clearAt = SH.map((s) => { for (let t = TT; t <= TT + 0.5; t += 0.005) if (wave(t) >= len(sub(shotAt(s, t), S))) return t; return null; });
  const outl = [55, 7, 1.0];
  const boarder = (t) => [3.0, 0.35, 5.6 - 0.6 * t];
  const shoal = [0, 1, 2, 3, 4].map((i) => [-4.6 + (i % 3) * 0.6, 0.5 + (i % 2) * 0.4, 7 + i * 0.5]);
  const ticks = [[TT, 'toll'], ...clearAt.filter((x) => x != null).map((x) => [x, 'clear'])];
  return { col, ticks, run(t) {
    const it = [], w = wave(t), done = t >= TT;
    it.push(...sphere(R, { col, a: 1, w: 2 }), ...sphere(Rb, { col, a: 0.28 + 0.18 * (0.5 + 0.5 * Math.cos(frac(t / (BAR_S / 4)) * TAU)), w: 1.2, dash: [3, 4] }));
    if (w > 0 && t < TT + 0.5) it.push(...sphere(w, { col: '#ffe1cf', a: 0.9 * (1 - ((t - TT) / 0.5) ** 2), w: 2.5 }));
    if (t >= TT && t < TT + 0.18) it.push({ type: 'tint', col, a: 0.22 * (1 - (t - TT) / 0.18) });
    SH.forEach((s, i) => { const c = clearAt[i];
      if (c != null && t >= c) { if (t < c + 0.4) it.push(pop(shotAt(s, c), col, (t - c) / 0.4, 0.6)); else if (t > 3.5) it.push({ type: 'shot', p: shotAt(s, t), v: mul(norm(sub(S, shotAt(s, t))), 2.4), kind: s[3], lit: true, a: sm(3.5, 3.9, t) }); return; }
      it.push({ type: 'shot', p: shotAt(s, t), v: mul(norm(sub(S, shotAt(s, t))), 2.4), kind: s[3], lit: c != null ? true : done ? false : null, a: wrapA(t) }); });
    it.push({ type: 'shot', p: shotAt(outl, t), v: mul(norm(sub(S, shotAt(outl, t))), 2.4), kind: 'other', outlined: true, lit: false, a: wrapA(t) });
    const bHit = (() => { for (let x = TT; x < TT + 0.5; x += 0.005) if (wave(x) >= len(sub(boarder(x), S))) return x; return TT + 0.5; })();
    if (t < bHit) it.push({ type: 'boarder', p: boarder(t), lit: true, a: wrapA(t) });
    else if (t < bHit + 0.7) { const u = (t - bHit) / 0.7, b = boarder(bHit), dir = norm([b[0], 0, b[2]]); it.push({ type: 'boarder', p: [b[0] + dir[0] * 4 * u, b[1] + 1.6 * Math.sin(Math.PI * u), b[2] + dir[2] * 4 * u], lit: true, spin: u * 5 }); }
    else if (t < bHit + 1.3) it.push({ type: 'splash', p: add(boarder(bHit), mul(norm([boarder(bHit)[0], 0, boarder(bHit)[2]]), 4)), f: (t - bHit - 0.7) / 0.6 });
    else if (t > 3.5) it.push({ type: 'boarder', p: boarder(t), lit: true, a: sm(3.5, 3.9, t) });
    shoal.forEach((p0, i) => { let p = [p0[0], p0[1], p0[2] - 0.4 * t];
      const reach = len(sub(p0, S)), hit = TT + 0.5 * (reach / Rb);
      if (t > hit) { const away = norm(sub([p0[0], 0, p0[2]], [S[0], 0, S[2]])), u = easeOut(clamp((t - hit) / 0.8)); p = add(p, mul(away, 5 * u)); }
      it.push({ type: 'fish', p, v: t > hit ? sub([p0[0], 0, p0[2]], [0, 0, 0]) : [0, 0, -1], lit: true, a: wrapA(t) }); });
    return { it, count: `CHARGES ×${t >= TT ? R0.charges - 1 : R0.charges}` };
  } };
};

BUILD.lockheart = (C) => {
  const R0 = C.row, col = colOf(C, 'lockheart'), half = R0.angle / 2, R = R0.range, A = [1.2, 1.2 + R0.duration];
  const shots = [[0.3, 0.7, 13.5, 5, 'mine', false], [-0.6, 0.9, 16, 5, 'other', false], [0.5, 0.45, 11.5, 4, 'other', true], [3.6, 0.6, 12, 5, 'mine', false]];
  const at = (s, t) => [s[0], s[1], s[2] - s[3] * t];
  const small = [[-0.8, 0.6, 6.5], [0.9, 1.0, 5.2]], big = [0.2, 0.8, 7.6];
  const fishAt = (p, t, i) => [p[0] + 0.2 * Math.sin(t * 2.2 + i), p[1] + 0.1 * Math.sin(t * 3 + i), p[2] - 0.6 * t];
  const took = (fn) => { for (let t = A[0]; t <= A[1]; t += 0.01) if (inCone(fn(t), half, R)) return t; return null; };
  const sT = shots.map((s) => (s[5] ? null : took((t) => at(s, t)))), fT = small.map((p, i) => took((t) => fishAt(p, t, i)));
  const ticks = [[A[0], 'on'], [A[1], 'off'], ...[...sT, ...fT].filter((x) => x != null).map((x) => [x, 'take'])];
  const PULL = 0.3;
  return { col, ticks, A, run(t) {
    const it = [], on = t >= A[0] && t <= A[1];
    const arcs = on ? [0, 1, 2].map((i) => { const f = frac((t - A[0]) / 0.5 + i / 3); return { r: R * (0.06 + 0.94 * (1 - f)), a: 0.8 * Math.sin(Math.PI * f) }; }) : [];
    it.push(...cone(half, R, { col, a: on ? 1 : 0.42, arcs }));
    let n = 0;
    const eat = (p0, d, mk) => { if (t < d + PULL) { const u = (t - d) / PULL; it.push(mk(L3(p0, N, u * u), 1 - 0.5 * u)); } else { n++; if (t < d + 1.1) it.push(pop(N, col, (t - d - PULL) / 0.5, 0.6), { type: 'num', p: add(N, [0.4, 0.8 + 1.4 * (t - d - PULL), 0]), text: `+${GULP_REFILL}`, col, a: 1 - sm(d + 0.7, d + 1.1, t) }); } };
    shots.forEach((s, i) => { const d = sT[i], v = [0, 0, -s[3]];
      if (d != null && t >= d) return eat(at(s, d), d, (p) => ({ type: 'shot', p, v, kind: s[4], lit: true }));
      const ignored = s[5] || !inCone(at(s, t), half, R) && !(d != null);
      it.push({ type: 'shot', p: at(s, t), v, kind: s[4], outlined: s[5], lit: s[5] ? false : on && inCone(at(s, t), half, R) ? true : on && ignored ? false : null, a: wrapA(t) }); });
    small.forEach((p0, i) => { const d = fT[i];
      if (d != null && t >= d) { if (t > 3.5) it.push({ type: 'fish', p: fishAt(p0, t, i), v: [0, 0, -1], size: 0.75, lit: null, a: sm(3.5, 3.9, t) }); return eat(fishAt(p0, d, i), d, (p, k) => ({ type: 'fish', p, v: sub(N, p), size: 0.75 * k, lit: true })); }
      it.push({ type: 'fish', p: fishAt(p0, t, i), v: [0, 0, -1], size: 0.75, lit: on ? true : null, a: wrapA(t) }); });
    it.push({ type: 'fish', p: fishAt(big, t, 5), v: [0, 0, -1], size: 1.7, lit: on ? false : null, a: wrapA(t) });
    return { it, count: `ENERGY +${n * GULP_REFILL}` };
  } };
};

BUILD.veritome = (C) => {
  const R0 = C.row, L = LOOKS.veritome, col = colOf(C, 'veritome'), K = AT_SEA;
  const Dz = L.at, Wd = L.w, Ht = L.h, base = 0.4 * K, apex = [0, 1.2 * K, N[2]], ST = 0.5, dur = R0.duration;
  const span = Dz - apex[2];
  const inView = (p) => { const dz = p[2] - apex[2]; if (dz <= 0) return false; const k = dz / span; return Math.abs(p[0]) <= (Wd / 2) * k && p[1] >= apex[1] + (base - apex[1]) * k && p[1] <= apex[1] + (base + Ht - apex[1]) * k; };
  const WP = [[-0.6, 2.2, 12.2], [2.0, 1.3, 11.4], [8.2, 1.0, 7.0]];
  const shotsAt = [[1.1, 0], [1.25, 0], [1.4, 0], [2.1, 1], [2.25, 1], [2.4, 1]];
  const ticks = [[ST, 'snap'], [ST + dur, 'shut'], ...shotsAt.map((s) => [s[0] + 0.17, 'hit'])];
  return { col, ticks, run(t) {
    const it = [], f = clamp(t / ST), s = 1 + 0.12 * (1 - easeOut(f)), cy = base + Ht / 2;
    const hw = (Wd / 2) * s, hh = (Ht / 2) * s, arm = Wd * 0.16, ext = (24 - apex[2]) / span;
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
      const x = sx * hw, y = cy + sy * hh;
      it.push(poly([[x - sx * arm, y, Dz], [x, y, Dz], [x, y - sy * arm, Dz]], { col, a: 1, w: 2.2 }));
      const corner = [sx * (Wd / 2), cy + sy * (Ht / 2), Dz];
      it.push(poly([apex, add(apex, mul(sub(corner, apex), ext))], { col, a: 0.32, w: 1, only: sy > 0 || sx > 0 ? 'top side chase' : 'top side' }));
    }
    it.push(poly([[-Wd / 2, base + 0.001, Dz], [Wd / 2, base, Dz]], { col, a: 0.6, w: 1, only: 'top' }));
    // what is in view: the frustum's floor, lit faint on the sea (top) and its wedge (side)
    const k1 = ext, fl = (sx) => add(apex, mul(sub([sx * Wd / 2, base, Dz], apex), k1));
    it.push(poly([apex, [fl(-1)[0], 0, fl(-1)[2]], [fl(1)[0], 0, fl(1)[2]], apex], { col, a: 0.08, fill: true, only: 'top' }));
    const tt = add(apex, mul(sub([0, base + Ht, Dz], apex), k1)), bb = add(apex, mul(sub([0, base, Dz], apex), k1));
    it.push(poly([apex, tt, bb, apex], { col, a: 0.08, fill: true, only: 'side' }));
    if (t >= ST && t < ST + 0.16) it.push({ type: 'tint', col: '#ffffff', a: 0.55 * (1 - (t - ST) / 0.16) });
    it.push({ type: 'creature', p: [0.8, 0, 14.2], R: 3.4, a: 1 });
    it.push({ type: 'creature', p: [8.6, 0, 7.6], R: 1.2, a: 1 });
    let left = 0;
    WP.forEach((p, i) => { const v = inView(p), open = v && t >= ST && t < ST + dur ? 1 - (t - ST) / dur : 0; if (open) left = (ST + dur - t);
      it.push({ type: 'weak', p, open, lit: v ? (open ? true : null) : t >= ST ? false : null }); });
    for (const [t0, w] of shotsAt) { const u = (t - t0) / 0.17; if (u > 0 && u < 1) it.push({ type: 'needle', a: L3(N, WP[w], Math.max(0, u - 0.25)), b: L3(N, WP[w], u), col: C.you }); else if (u >= 1 && u < 2.5) it.push(pop(WP[w], col, (u - 1) / 1.5, 0.6)); }
    return { it, count: `OPEN ${left.toFixed(1)} s` };
  } };
};

BUILD.sondelass = (C) => {
  const R0 = C.row, col = colOf(C, 'sondelass'), R = R0.range, half = R0.angle / 2, CD = R0.cooldown;
  const T1 = 0.3, T2 = T1 + CD + 0.1;
  const cask1 = (t) => [-1.8, 0.2 + 0.06 * Math.sin(t * 3), 10];
  const boarder = (t) => L3([2.6, 0.35, 8], [1.0, 0.35, 1.6], clamp(t / 2.2));
  const fling = (u, b) => [b[0] + 4.5 * u, b[1] + 1.8 * Math.sin(Math.PI * u), b[2] - 1.5 * u];
  const ticks = [[T1, 'throw'], [T1 + 1.2, 'aboard'], [T2, 'throw'], [T2 + 0.9, 'off']];
  return { col, ticks, run(t) {
    const it = [], tip = [0, N[1], N[2] + R];
    it.push(poly([N, tip], { col, a: 0.7, w: 2 }));
    for (const s of [-1, 1]) it.push(poly([tip, add(tip, [s * 0.3, 0, -0.1]), add(tip, [s * 0.5, 0, -0.4]), add(tip, [s * 0.4, 0, -0.75])], { col, a: 0.9, w: 2, only: 'top chase' }), poly([tip, add(tip, [0, s * 0.3, -0.1]), add(tip, [0, s * 0.5, -0.4]), add(tip, [0, s * 0.4, -0.75])], { col, a: 0.9, w: 2, only: 'side' }));
    it.push(...cone(half, R, { col, a: 0.3 }).filter((x) => !x.fill || x.only !== 'chase'));
    // throw one: the cask reeled aboard
    const c = cask1(t);
    if (t < T1 + 0.42) it.push({ type: 'cask', p: c, lit: t >= T1 ? true : null, a: wrapA(t) });
    if (t >= T1 && t < T1 + 0.3) { const p = L3(N, c, easeOut((t - T1) / 0.3)); it.push(poly([N, p], { col, a: 1, w: 2 }), { type: 'hook', p, col }); }
    else if (t >= T1 + 0.3 && t < T1 + 1.2) { const u = sm(T1 + 0.42, T1 + 1.2, t), p = L3(cask1(T1 + 0.42), S, u); it.push(poly([N, p], { col, a: 1, w: 2 }), { type: 'cask', p, lit: true }); }
    else if (t >= T1 + 1.2 && t < T1 + 1.7) it.push(pop(S, '#ffd46a', (t - T1 - 1.2) / 0.5, 0.8));
    // throw two: the boarder yanked off
    const b = boarder(t), bH = boarder(T2 + 0.2);
    if (t < T2 + 0.2) { it.push({ type: 'boarder', p: b, lit: t >= T2 ? true : null, a: wrapA(t) }); if (t >= T2) { const p = L3(N, b, easeOut((t - T2) / 0.2)); it.push(poly([N, p], { col, a: 1, w: 2 }), { type: 'hook', p, col }); } }
    else if (t < T2 + 0.9) { const u = (t - T2 - 0.2) / 0.7, p = fling(u, bH); it.push({ type: 'boarder', p, lit: true, spin: u * 6 }); if (u < 0.35) it.push(poly([N, p], { col, a: 1 - u / 0.35, w: 2 })); }
    else if (t < T2 + 1.5) it.push({ type: 'splash', p: [fling(1, bH)[0], 0, fling(1, bH)[2]], f: (t - T2 - 0.9) / 0.6 });
    else if (t > 3.55) it.push({ type: 'boarder', p: b, lit: null, a: sm(3.55, 3.9, t) });
    // out of reach, and off the aim: dim
    it.push({ type: 'cask', p: [1.0, 0.2 + 0.06 * Math.sin(t * 2.6), N[2] + R + 2.6], lit: false });
    it.push({ type: 'cask', p: [-7.5, 0.2 + 0.06 * Math.sin(t * 2.9 + 1), 6], lit: false });
    const last = t >= T2 ? T2 : t >= T1 ? T1 : null, cd = last == null ? 0 : Math.max(0, CD - (t - last));
    return { it, count: cd > 0 ? `COOLDOWN ${cd.toFixed(1)} s` : 'READY' };
  } };
};

BUILD.dreamvane = (C) => {
  const col = colOf(C, 'dreamvane'), L = LOOKS.dreamvane, R = L.range, SURF = 3.2, lead = BAR_S * LEAD_EARLIER, base = BAR_S;
  const tw = SURF - lead, tb = SURF - base, CR = [3.4, 0, 10.5], CRr = 2.0;
  const depth = (t) => (t < 2.4 ? -3.4 : t < SURF ? lerp(-3.4, -0.6, sm(2.4, SURF, t)) : t < 3.5 ? -0.6 : lerp(-0.6, -3.4, sm(3.5, 4, t)));
  const ticks = [[tw, 'warn'], [tb, 'ghost'], [SURF, 'rise']];
  return { col, ticks, run(t) {
    const it = [], th = (t / L.turn) * TAU, r0 = 1.2;
    it.push(waterRing([0, 0, 0], R, { col, a: 0.9, w: 2 }), waterRing([0, 0, 0], R / 3, { col, a: 0.3, w: 1 }), waterRing([0, 0, 0], (2 * R) / 3, { col, a: 0.3, w: 1 }));
    for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU, l = i % 3 === 0 ? 0.09 : 0.05; it.push(poly([[R * Math.sin(a), 0, R * Math.cos(a)], [R * (1 + l) * Math.sin(a), 0, R * (1 + l) * Math.cos(a)]], { col, a: 0.6, w: 1, only: 'top chase' })); }
    it.push(poly([[r0 * Math.sin(th), 0, r0 * Math.cos(th)], [R * Math.sin(th), 0, R * Math.cos(th)]], { col, a: 1, w: 2 }));
    for (let i = 1; i <= 10; i++) { const a = th - i * 3.2 * D2R; it.push(poly([[r0 * Math.sin(a), 0, r0 * Math.cos(a)], [R * Math.sin(a), 0, R * Math.cos(a)]], { col, a: 0.5 * (1 - i / 11) ** 2, w: 1.5, only: 'top chase' })); }
    // the shoal: its leader marked
    const lead0 = [-1.6 + 0.8 * Math.sin(t * 1.6), 0.9 + 0.2 * Math.sin(t * 2.2), 15.5 - 0.6 * t];
    const OFF = [[0, 0, 0], [-0.7, 0.2, 0.9], [0.7, -0.1, 0.9], [-1.3, 0.3, 1.8], [0.1, 0.4, 1.7], [1.2, 0.1, 1.9], [-0.5, -0.1, 2.7]];
    OFF.forEach((o, i) => { const p = add(lead0, add(o, [0.15 * Math.sin(t * 3 + i), 0.1 * Math.sin(t * 4 + i), 0])); it.push({ type: 'fish', p, v: [0.8 * Math.cos(t * 1.6), 0, -1], lit: i === 0 ? true : null, a: wrapA(t) }); if (i === 0) it.push({ type: 'leader', p, col }); });
    // a big creature about to surface: marked from the vane's warning, half again as early
    const y = depth(t);
    it.push({ type: 'creature', p: [CR[0], y, CR[2]], R: CRr, lit: t >= tw && t < 3.6 ? true : null, a: 1 });
    if (t >= tw && t < SURF + 0.1) { const k = frac((t - tw) / 0.6); it.push(waterRing(CR, CRr * (1 + 0.35 * k), { col: WARN_COLOR, a: 0.9 * (1 - k), w: 2 }), waterRing(CR, CRr, { col: WARN_COLOR, a: 0.8, w: 1.5, dash: [4, 3] }), { type: 'bang', p: [0, 1.9, 0], col: WARN_COLOR, f: sm(tw, tw + 0.15, t) }); }
    if (t >= tb && t < tb + 0.5) it.push(waterRing(CR, CRr * 0.6, { col: '#ffffff', a: 0.25 * (1 - (t - tb) / 0.5), w: 1, dash: [2, 3] }));
    if (t >= SURF && t < SURF + 0.6) it.push({ type: 'splash', p: [CR[0], 0, CR[2]], f: (t - SURF) / 0.6, big: true });
    const marked = t >= tw && t < SURF;
    return { it, count: marked ? `WARNED ${(SURF - t).toFixed(1)} s` : 'SCANNING' };
  } };
};

/** One mount's loop: C = { row (mountRow's), you (the ship's feeling, CSS), locks (SHIPS[ship].locks) }; null for a tool with none. */
export function mountSim(tool, C) { return BUILD[tool] ? BUILD[tool](C) : null; }
/** The tools that have a loop. */
export const MOUNT_SIM_TOOLS = Object.keys(BUILD);
