// ---------------------------------------------------------------------------------------
// THE TELEGRAPHS' SHAPES: a telegraph (progress/combat/telegraphs.js `markOf`: { shape, area, ground, edge, fill, type, status,
// answer }) laid out as what the mark's one program draws (vfx/telegraphs/telegraphshader.js): a union of up to eight primitives in
// the maker's frame, the safe pockets cut out of a floor, the answer's chevrons laid flat on the ground, and the glyphs that stand
// over a point (the status, the high ground, the guard, the bait). Pure numbers, no three.js: what is drawn is the area's own
// numbers, so the drawn area is the true area (TELEGRAPHS.md section 3, rule 2; the workbench overlays the numbers to prove it).
//
// THE FRAME: the maker's (the creature's) feet at the origin, its facing +z, +x to its side; a bearing is from +z toward +x. Every
// primitive's fill runs AWAY from the maker (the fill is the clock: TELEGRAPHS.md step 2): a circle from its centre out, a ring from
// its inner edge out, a cone and a line from the body along their length, the floor from the maker across it, the arena's rim round
// from the maker's bearing both ways to the far side.
//
//   PRIM.circle  [x, z, -, r]                 PRIM.ring  [x, z, -, inner, outer]        PRIM.cone  [x, z, bearing, half-angle, length]
//   PRIM.rect    [x, z, bearing, width, length] (from x, z along the bearing)          PRIM.floor [x, z, -, radius, reach]
//   PRIM.rim     [x, z, start bearing, radius, band]
//
// Prior art: FFXIV's AoE vocabulary (circle, donut, cone, line, the floor with safe spots) and its head markers; WildStar's fill to
// the edge; Inigo Quilez's 2D signed distance functions (the pie, the box, the annulus) that the program draws them with.
//
//   frameOf(origin, facing) -> F      toLocal(F, x, z) -> [lx, lz]      toWorld(F, lx, lz) -> [x, z]
//   shapesOf(mark, F, opts) -> { prims, pockets, stamps, boards, far, bounds } | null   (opts: points, target, width, half, radius,
//     centre, pockets, rim, bait: world { x, z } (and y for a board); see TelegraphLook.show)
// ---------------------------------------------------------------------------------------

export const PRIM = { circle: 0, ring: 1, cone: 2, rect: 3, floor: 4, rim: 5 };
export const MAX = { prims: 8, pockets: 8, stamps: 12 };
const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

/** The maker's frame: its feet (world x, z) and which way it faces (a bearing in radians from +z toward +x, or a direction { x, z }). */
export function frameOf(origin = { x: 0, z: 0 }, facing = 0) {
  let fx, fz;
  if (typeof facing === 'number') { fx = Math.sin(facing); fz = Math.cos(facing); }
  else { const x = facing?.x || 0, z = facing?.z || 0, l = Math.hypot(x, z); fx = l > 1e-6 ? x / l : 0; fz = l > 1e-6 ? z / l : 1; }
  return { ox: origin.x || 0, oz: origin.z || 0, fx, fz };
}
export const toLocal = (F, x, z) => { const dx = x - F.ox, dz = z - F.oz; return [dx * F.fz - dz * F.fx, dx * F.fx + dz * F.fz]; };
export const toWorld = (F, lx, lz) => [F.ox + lx * F.fz + lz * F.fx, F.oz - lx * F.fx + lz * F.fz];
const bearing = (lx, lz) => Math.atan2(lx, lz);

/** The world box a primitive covers (x0, z0, x1, z1), from its local corners and arcs. */
function boxOf(F, p) {
  const pts = [];
  const add = (lx, lz) => pts.push(toWorld(F, lx, lz));
  const disc = (cx, cz, r) => { for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU; add(cx + Math.sin(a) * r * 1.09, cz + Math.cos(a) * r * 1.09); } };
  if (p.kind === PRIM.circle) disc(p.x, p.z, p.a);
  else if (p.kind === PRIM.ring || p.kind === PRIM.rim) disc(p.x, p.z, p.kind === PRIM.rim ? p.a : p.b);
  else if (p.kind === PRIM.floor) disc(p.x, p.z, p.a);
  else if (p.kind === PRIM.cone) { add(p.x, p.z); for (let i = 0; i <= 8; i++) { const a = p.rot - p.a + (2 * p.a * i) / 8; add(p.x + Math.sin(a) * p.b * 1.02, p.z + Math.cos(a) * p.b * 1.02); } }
  else if (p.kind === PRIM.rect) { const dx = Math.sin(p.rot), dz = Math.cos(p.rot), h = p.a / 2; for (const [s, l] of [[-h, 0], [h, 0], [-h, p.b], [h, p.b]]) add(p.x + dz * s + dx * l, p.z - dx * s + dz * l); }
  let x0 = Infinity, z0 = Infinity, x1 = -Infinity, z1 = -Infinity;
  for (const [x, z] of pts) { x0 = Math.min(x0, x); z0 = Math.min(z0, z); x1 = Math.max(x1, x); z1 = Math.max(z1, z); }
  return { x0, z0, x1, z1 };
}

/** The primitives of a shape, local. */
function primsOf(mark, F, o) {
  const A = mark.area || {}, sh = mark.shape, P = [];
  const local = (w) => (w ? toLocal(F, w.x, w.z) : [0, 0]);
  const pts = (o.points?.length ? o.points : o.target ? [o.target] : null);
  const at = A.at === 'courier' || sh === 'tracked' ? pts?.[0] : null; // (a shape laid where the Courier stands, or on the maker)
  const circle = ([x, z], r) => P.push({ kind: PRIM.circle, x, z, rot: 0, a: r, b: 0 });
  if (sh === 'circle' || sh === 'tracked') circle(local(at), A.radius ?? o.radius ?? 3);
  else if (sh === 'baited' || sh === 'left') for (const w of (pts || [null]).slice(0, MAX.prims)) circle(local(w), A.radius ?? o.radius ?? 3);
  else if (sh === 'ring') { const [x, z] = local(at), inn = A.inner ?? 0, out = Array.isArray(A.outer) ? A.outer[1] : A.outer ?? inn + 4; P.push({ kind: PRIM.ring, x, z, rot: 0, a: inn, b: out }); }
  else if (sh === 'out-in') {
    const [x, z] = local(at), inn = A.inner ?? 4, out = Array.isArray(A.outer) ? A.outer : [inn, A.outer ?? inn + 6];
    if (o.half === 1) P.push({ kind: PRIM.ring, x, z, rot: 0, a: out[0], b: out[1] }); // (the second half: the band, the centre safe)
    else circle([x, z], inn); // (the first: the disc under it)
  } else if (sh === 'cone') P.push({ kind: PRIM.cone, x: 0, z: 0, rot: o.rot ?? 0, a: ((A.degrees ?? 90) / 2) * (Math.PI / 180), b: A.length ?? 10 });
  else if (sh === 'line') P.push({ kind: PRIM.rect, x: 0, z: 0, rot: o.rot ?? 0, a: A.width ?? o.width ?? 4, b: A.length ?? 20 });
  else if (sh === 'lunge') {
    const t = pts?.[0] ? local(pts[0]) : null, rot = t && Math.hypot(t[0], t[1]) > 0.1 ? bearing(t[0], t[1]) : o.rot ?? 0, reach = A.reach ?? A.length ?? 6;
    P.push({ kind: PRIM.rect, x: 0, z: 0, rot, a: A.width ?? o.width ?? Math.max(2, reach * 0.3), b: reach });
  } else if (sh === 'floor') {
    const [x, z] = o.centre ? local(o.centre) : [0, 0], r = o.radius ?? A.radius ?? 30;
    P.push({ kind: PRIM.floor, x, z, rot: 0, a: r, b: r + Math.hypot(x, z) });
  } else if (sh === 'raidwide') {
    const R = o.rim || {}, [x, z] = R.centre ? local(R.centre) : [0, 0], r = R.radius ?? A.radius ?? 30;
    const start = Math.hypot(x, z) > 0.5 ? bearing(-x, -z) : 0; // (the maker's bearing as seen from the rim's centre)
    P.push({ kind: PRIM.rim, x, z, rot: start, a: r, b: R.band ?? clamp(r * 0.05, 1.5, 4) });
  }
  return P;
}

/** Where the fill lands last (the status glyph stands there): the far edge from the maker. */
function farOf(p) {
  if (p.kind === PRIM.circle) { const d = Math.hypot(p.x, p.z), ux = d > 0.3 ? p.x / d : 0, uz = d > 0.3 ? p.z / d : 1; return [p.x + ux * p.a, p.z + uz * p.a]; }
  if (p.kind === PRIM.ring) return [p.x, p.z + p.b];
  if (p.kind === PRIM.cone || p.kind === PRIM.rect) return [p.x + Math.sin(p.rot) * p.b, p.z + Math.cos(p.rot) * p.b];
  if (p.kind === PRIM.floor) return [p.x, p.z + p.a];
  if (p.kind === PRIM.rim) { const a = p.rot + Math.PI; return [p.x + Math.sin(a) * p.a, p.z + Math.cos(a) * p.a]; }
  return [0, 0];
}

/** The answer laid flat (stamps: chevrons and the way round) and stood up (boards), for the shape's primitives. */
function answerOf(answer, P, F, o, stamps, boards) {
  const S = (x, z, angle, size, art) => { if (stamps.length < MAX.stamps) stamps.push({ x, z, angle, size, art }); };
  const share = Math.max(1, P.length);
  const rays = (p, outward) => { // (chevrons round a circle's edge, pointing out of it, or in toward its centre)
    const r = p.a, size = clamp(r * 0.24, 0.9, 3.4);
    const n = clamp(Math.round((TAU * r) / (size * 3.2)), 3, Math.max(3, Math.floor(8 / share)));
    for (let i = 0; i < n; i++) { const a = (i / n) * TAU + Math.PI / n, rr = r - size * 0.72; S(p.x + Math.sin(a) * rr, p.z + Math.cos(a) * rr, outward ? a : a + Math.PI, size, 'answer.out'); }
  };
  const sides = (p) => { // (two chevrons across a line, either side, pointing off it)
    const size = clamp(p.a * 0.28, 0.9, 3.4), dx = Math.sin(p.rot), dz = Math.cos(p.rot), pairs = clamp(Math.round(p.b / (size * 5)), 1, 3);
    for (let k = 0; k < pairs; k++) {
      const l = (p.b * (k + 0.5)) / pairs, h = p.a / 2 - size * 0.72;
      for (const s of [-1, 1]) S(p.x + dz * s * h + dx * l, p.z - dx * s * h + dz * l, p.rot + (s * Math.PI) / 2, size, 'answer.out');
    }
  };
  for (const p of P) {
    if (answer === 'out' || (answer === 'bait' && !o.bait?.length)) { // (a bait with nothing named to bait it into: the shape's own way out)
      if (p.kind === PRIM.circle) rays(p, true);
      else if (p.kind === PRIM.ring) rays({ ...p, a: p.b }, true);
      else if (p.kind === PRIM.rect) sides(p);
      else if (p.kind === PRIM.cone) { const size = clamp(p.b * 0.12, 0.9, 3.4); for (const k of [-0.6, 0, 0.6]) { const a = p.rot + k * p.a, rr = p.b - size * 0.72; S(p.x + Math.sin(a) * rr, p.z + Math.cos(a) * rr, a, size, 'answer.out'); } }
    } else if (answer === 'in' && (p.kind === PRIM.ring || p.kind === PRIM.rim)) {
      const size = clamp((p.b - p.a) * 0.3, 0.9, 3.4), n = clamp(Math.round((TAU * p.a) / (size * 4)), 3, 8);
      for (let i = 0; i < n; i++) { const a = (i / n) * TAU, rr = p.a + size * 0.72; S(p.x + Math.sin(a) * rr, p.z + Math.cos(a) * rr, a + Math.PI, size, 'answer.out'); }
    } else if (answer === 'sidestep' && p.kind === PRIM.rect) sides(p);
    else if (answer === 'sidestep') rays(p.kind === PRIM.ring ? { ...p, a: p.b } : p, true);
    else if (answer === 'behind' && p.kind === PRIM.cone) { const size = clamp(p.b * 0.2, 1.6, 6), back = (o.body ?? 1) + size * 0.6; S(p.x - Math.sin(p.rot) * back, p.z - Math.cos(p.rot) * back, p.rot, size, 'answer.behind'); } // (behind the maker's body: o.body its radius)
    else if (answer === 'guard' && p.kind === PRIM.rim) for (let i = 0; i < 6; i++) { const a = p.rot + (i / 6) * TAU + Math.PI / 6; boards.push({ art: 'answer.guard', local: [p.x + Math.sin(a) * p.a, p.z + Math.cos(a) * p.a], size: 2.4, stand: 1 }); }
  }
  if (answer === 'highGround') for (const k of o.pockets || []) boards.push({ art: 'answer.highGround', world: k, size: clamp((k.r ?? 3) * 0.5, 1.2, 3), stand: 1 });
  if (answer === 'bait') for (const b of o.bait || []) boards.push({ art: 'answer.bait', world: b, size: b.size ?? 2.4, stand: 0 });
}

/** A telegraph laid out: null for a shape with nothing to draw. `F`: frameOf(origin, facing). */
export function shapesOf(mark, F, o = {}) {
  if (!mark) return null;
  const P = primsOf(mark, F, o).slice(0, MAX.prims);
  const pockets = (mark.shape === 'floor' ? o.pockets || [] : []).slice(0, MAX.pockets).map((k) => { const [x, z] = toLocal(F, k.x, k.z); return { x, z, r: k.r ?? 3 }; });
  const stamps = [], boards = [];
  if (mark.answer && !o.friendly) answerOf(mark.answer, P, F, o, stamps, boards);
  const far = P.length ? farOf(P[P.length - 1]) : null;
  let bounds = null;
  for (const p of P) {
    const b = boxOf(F, p);
    bounds = bounds ? { x0: Math.min(bounds.x0, b.x0), z0: Math.min(bounds.z0, b.z0), x1: Math.max(bounds.x1, b.x1), z1: Math.max(bounds.z1, b.z1) } : b;
  }
  if (bounds) { const m = 0.6 + 0.02 * Math.max(bounds.x1 - bounds.x0, bounds.z1 - bounds.z0); bounds.x0 -= m; bounds.z0 -= m; bounds.x1 += m; bounds.z1 += m; } // (the edge's keyline and its anti-aliasing lie just outside the area)
  for (const t of stamps) { const [x, z] = toWorld(F, t.x, t.z), r = t.size * 0.75; if (bounds) { bounds.x0 = Math.min(bounds.x0, x - r); bounds.z0 = Math.min(bounds.z0, z - r); bounds.x1 = Math.max(bounds.x1, x + r); bounds.z1 = Math.max(bounds.z1, z + r); } } // (a stamp laid outside the area, the way round a cone's maker, lies on the grid too)
  return { prims: P, pockets, stamps, boards, far, bounds };
}
