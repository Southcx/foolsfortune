// ---------------------------------------------------------------------------------------
// THE WAVE POOL (plain name; South's ask, 2026-11-06: "expand the solar skiff racing module to encapsulate wave rider, snowboarding and
// surfing mechanics, and especially the feeling of going through a wave barrel"). One long basin at the Raceway park whose machine runs a
// foil down its length and back: each pass raises one wave that breaks along the reef line and peels down the pool, a barrel behind its
// break point, whitewater behind that; between passes the pool lies in a swell, bigger toward its deep side (wave riding's chop).
//
// This is the one source of truth for the water: the board rides it (heightAt, normalAt, carry, push), the riding rules ask it where you
// are (frameAt, barrelAt), and the look draws exactly the same surface on the GPU (WAVEPOOL_GLSL, fed by uniformsOf). Pure numbers, no
// three.js, as park.js: the game, the workbench and the Node tools read the same water.
//
// The model (Surf Ranch's foil-driven pool, made a solitary wave): in the pool's own frame (u along its length, v across it, the beach at
// v = 0, the machine's wall at v = W) a wave crest is a straight line travelling toward the beach at cw, oblique to the reef line v = vb so
// that where it crosses that line (the break point) runs down the pool at the peel speed c = cw / |nu|. Along the crest, s is the distance
// from the break point toward the shoulder (s > 0: still unbroken, deeper) or back into the broken water (s < 0); across it, d is the
// distance ahead of the crest in its travel (d > 0: the face and the trough before it; d < 0: its back).
//   the shoulder (s > 0)   the wave shoaling up toward the break, its face convex and wider
//   the pocket             just ahead of the break point: the face steepest, where the wave gives you the most (`push`)
//   the barrel (-tube < s < 0)  the face still standing, the lip thrown forward over it (lipCurve: the look's tube and the cover test)
//   the whitewater (s < -tube)  the broken bore, lower, foamy and slow, running on to the beach
// The board's speed is relative to the water and the water on the wave moves with it (`carry`): ride the face and the wave takes you;
// gravity down the face (the board's own slope code, on `normalAt`) is the drop; the pocket's `push` is the wave's power.
//
// Prior art: Kelly Slater's Surf Ranch (the foil's pass, the peel along a reef contour), Tessendorf's and GPU Gems ch. 1's sums of
// sharpened sines (the swell), Fournier and Reeves 1986 "A simple model of ocean waves" (the crest's profile steepening over the shoaling
// floor, the curl as an ellipse thrown off the crest), Surf World Series' and the tube in Treyarch's Kelly Slater game (2002) (the pocket, the foam ball,
// the cover); the house's own park.js (a pure height function shared by game and tools).
//
//   const S = wavePool()   S.inPool(x, z)   S.surfaceY(x, z, t) | null   S.normalAt(x, z, t, out)   S.carry(x, z, t, out) -> {x, z}
//   S.push(x, z, t) -> { x, z, k }   S.frameAt(x, z, t) -> { s, d, H, F, zone, ... }   S.barrelAt(x, y, z, t) -> { k, cover, ... }
//   S.foamAt(x, z, t)   S.state(t)   POOL WAVE SWELL   lipCurve(H, F, tau, a)   uniformsOf(S, t, out)   WAVEPOOL_GLSL
// ---------------------------------------------------------------------------------------

/** The basin, park-local metres (park.js's frame): its middle, its long axis's yaw (0: u runs along +x), its length L and width W, its
 *  still water's height `y` over the layer's floor, the reef line `vb` (where the wave breaks), its depths (at the beach's foot, over the
 *  reef, at the deep wall) and the beach's run up out of it. The machine's wall stands along v = W. */
export const POOL = { x: -500, z: 790, yaw: 0, L: 600, W: 150, y: 14, vb: 62, beach: 18, depth: { foot: 1.2, reef: 2.4, deep: 6 }, rim: 3 };

/** The wave a pass raises: its height H (m) at the break, the peel speed c (m/s down the pool: the board's cruise is 24), the crest's
 *  travel cw toward the beach, the back's e-fold, the face's width at the break and out on the shoulder, how far the shoulder runs before
 *  it is half its height, the pocket's centre and width ahead of the break (s), the tube's length behind the break and how long the lip
 *  takes to throw, the whitewater's share of H and its decay, and the pass's clock: its ramp in and out, the lull between passes. */
export const WAVE = {
  H: 6.2, c: 15, cw: 7.5, back: 13, face: 7, faceShoulder: 15, shoulder: 70, pocket: 4, pocketW: 9,
  tube: 26, throwLen: 5, ww: 0.38, wwDecay: 60, ramp: 4, lull: 16, margin: 40,
};

/** The pool's swell: sharpened sines (GPU Gems ch. 1, eq. 8: exp(sin) - 1, crests peaked, troughs broad), its amplitude rising toward the
 *  deep wall (wave riding's chop is out there), calmed while a wave runs. dir in radians in the pool's frame, len the wavelength (m). */
export const SWELL = {
  calm: 0.35, // (the share left while a pass runs)
  near: 0.25, far: 1.0, // (the amplitude's scale at the beach and at the deep wall)
  waves: [{ dir: -1.2, len: 34, amp: 0.55 }, { dir: -1.55, len: 21, amp: 0.38 }, { dir: -0.9, len: 13, amp: 0.2 }, { dir: -1.9, len: 8, amp: 0.1 }],
};

const G = 9.81, E1 = Math.E - 1;
const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

/** A pass's length (s of the clock), and a whole cycle (a pass one way, the lull, a pass back, the lull). */
export const passTime = () => (POOL.L + 2 * WAVE.margin) / WAVE.c;
export const cycleTime = () => 2 * (passTime() + WAVE.lull);

/** The lip's arc in the wave's frame (d ahead of the crest, h over the still water), a in 0..1 from the crest to its tip: an ellipse
 *  thrown off the crest over the face (Fournier and Reeves' curl), tau the throw (0 feathering .. 1 the tube formed). The tube's opening is
 *  under it: the face below, the lip above, about F wide and 0.8 H tall. */
export function lipCurve(H, F, tau, a) {
  const rx = F * (0.35 + 0.7 * tau), ry = H * 0.46, phi = a * tau * Math.PI * 0.82;
  return { d: rx * Math.sin(phi), h: H - ry + ry * Math.cos(phi) };
}

export function wavePool() {
  const P = POOL, Wv = WAVE, cy = Math.cos(P.yaw), sy = Math.sin(P.yaw);
  const nuAbs = Wv.cw / Wv.c, nvAbs = Math.sqrt(1 - nuAbs * nuAbs);
  const swl = SWELL.waves.map((w) => { const k = (2 * Math.PI) / w.len; return { kx: k * Math.cos(w.dir), kz: k * Math.sin(w.dir), w: Math.sqrt(G * k), amp: w.amp }; });
  const st = { t: NaN, on: false, env: 0, dir: 1, ub: 0, nu: 0, nv: -1, tu: 1, tv: 0, swell: 1, k: 0, tp: 0 };

  /** The pass's state at time t (real seconds of the pool's clock): which way it peels, where its break point is, how strong. */
  function state(t) {
    if (t === st.t) return st;
    st.t = t;
    const pt = passTime(), half = pt + Wv.lull, cyc = 2 * half, tc = ((t % cyc) + cyc) % cyc, k = tc < half ? 0 : 1, tp = tc - k * half;
    st.k = k; st.tp = tp; st.dir = k ? -1 : 1; st.on = tp < pt;
    st.env = st.on ? sstep(0, Wv.ramp, tp) * (1 - sstep(pt - Wv.ramp, pt, tp)) : 0;
    st.ub = st.dir > 0 ? -Wv.margin + Wv.c * tp : P.L + Wv.margin - Wv.c * tp;
    st.nu = st.dir * nuAbs; st.nv = -nvAbs; // (the crest's travel: toward the beach, leaning down the pool with the peel)
    st.tu = st.dir * nvAbs; st.tv = nuAbs; // (along the crest toward the shoulder: down the pool and out into the deep)
    st.swell = 1 - (1 - SWELL.calm) * st.env;
    return st;
  }

  const toU = (x, z) => { const dx = x - P.x, dz = z - P.z; return dx * cy - dz * sy + P.L / 2; };
  const toV = (x, z) => { const dx = x - P.x, dz = z - P.z; return dx * sy + dz * cy + P.W / 2; };
  /** Is this park-local point over the basin's water (the beach's run-up included)? */
  const inPool = (x, z) => { const u = toU(x, z), v = toV(x, z); return u >= 0 && u <= P.L && v >= -P.beach && v <= P.W; };

  /** The wave's own height at (u, v) and its frame: s along the crest, d across it, H here, the face's width. */
  const fr = { s: 0, d: 0, H: 0, F: 0, h: 0, zone: 'flat', face: 0, env: 0 };
  function waveAt(u, v, t) {
    const S = state(t);
    fr.env = S.env; fr.h = 0; fr.face = 0;
    if (S.env <= 0) { fr.s = 0; fr.d = 0; fr.H = 0; fr.F = Wv.face; fr.zone = 'flat'; return fr; }
    const pu = u - S.ub, pv = v - P.vb, s = pu * S.tu + pv * S.tv, d = pu * S.nu + pv * S.nv;
    fr.s = s; fr.d = d;
    // the height along the crest: shoaling up out of the deep to the break; standing through the tube; the whitewater behind
    const shoal = s > 0 ? 0.42 + 0.58 * Math.exp(-s / Wv.shoulder) : 1;
    const broke = s < -Wv.tube ? Wv.ww + (1 - Wv.ww) * Math.exp((s + Wv.tube) / 6) : 1;
    const decay = s < -Wv.tube ? Math.exp((s + Wv.tube) / Wv.wwDecay) * 0.65 + 0.35 : 1;
    const walls = sstep(-2, 12, v + P.beach * 0.3) * sstep(0, 25, u) * sstep(0, 25, P.L - u) * sstep(0, 18, P.W - v);
    const H = Wv.H * shoal * broke * decay * walls * S.env;
    const F = s > 0 ? Wv.face + (Wv.faceShoulder - Wv.face) * (1 - Math.exp(-s / 30)) : s < -Wv.tube ? Wv.face * 1.6 : Wv.face;
    fr.H = H; fr.F = F;
    let h;
    if (d < 0) h = H * Math.exp(-(d * d) / (Wv.back * Wv.back));
    else if (d < F) {
      const x = d / F, p = s > 0 ? 0.75 + 0.6 * clamp(s / 40, 0, 1) : 0.72; // (concave and steep at the break: its top nearly sheer; rolling out on the shoulder)
      h = H * (1 - Math.pow(x, p)); fr.face = 1 - x;
    } else { const e = (d - F) / F; h = -0.08 * H * Math.exp(-e * e); } // (the trough before it, drawn down)
    fr.h = h;
    fr.zone = d < -Wv.back * 1.4 || d > F * 2 || H < 0.4 ? 'flat' : s > Wv.pocket + Wv.pocketW ? 'shoulder' : s > 0 ? 'pocket' : s > -Wv.tube ? 'barrel' : 'whitewater';
    return fr;
  }

  function swellAt(u, v, t) {
    const S = state(t), deep = SWELL.near + (SWELL.far - SWELL.near) * sstep(P.vb * 0.5, P.W, v);
    let h = 0;
    for (let i = 0; i < swl.length; i++) { const w = swl[i], ph = w.kx * u + w.kz * v - w.w * t; h += w.amp * ((Math.exp(Math.sin(ph)) - 1) / E1 - 0.33); }
    return h * deep * S.swell * sstep(-P.beach, 4, v);
  }

  /** The water's surface (world height over the layer's floor: add RW.y) at park-local x, z, or null off the basin. */
  function surfaceY(x, z, t) {
    if (!inPool(x, z)) return null;
    const u = toU(x, z), v = toV(x, z);
    return P.y + swellAt(u, v, t) + waveAt(u, v, t).h;
  }
  function normalAt(x, z, t, out = { x: 0, y: 1, z: 0 }) {
    const e = 0.4, a = surfaceY(x + e, z, t), b = surfaceY(x - e, z, t), c = surfaceY(x, z + e, t), d = surfaceY(x, z - e, t);
    if (a == null || b == null || c == null || d == null) { out.x = 0; out.y = 1; out.z = 0; return out; }
    const nx = -(a - b) / (2 * e), nz = -(c - d) / (2 * e), l = Math.sqrt(nx * nx + 1 + nz * nz);
    out.x = nx / l; out.y = 1 / l; out.z = nz / l; return out;
  }
  // the pool's frame's axes in the park's: u and v as (x, z)
  const ux = cy, uz = -sy, vx = sy, vz = cy;
  /** The water's own velocity at the surface (park x, z, m/s): on the wave it moves with it toward the beach (the board's speed is
   *  relative to it, so a board held on the face is carried by the wave); elsewhere still. */
  function carry(x, z, t, out = { x: 0, z: 0 }) {
    out.x = 0; out.z = 0;
    if (!inPool(x, z)) return out;
    const u = toU(x, z), v = toV(x, z), w = waveAt(u, v, t), S = st;
    if (w.H <= 0) return out;
    const k = clamp(w.h / Math.max(0.5, w.H), 0, 1) * (w.zone === 'whitewater' ? 0.8 : 1) * Wv.cw;
    const cu = S.nu * k, cv = S.nv * k;
    out.x = cu * ux + cv * vx; out.z = cu * uz + cv * vz; return out;
  }
  /** The wave's power where you are: a push along the crest toward the shoulder (park x, z unit) and its strength 0..1, strongest in the
   *  pocket on the face, nothing on the flats or its back. */
  const pushOut = { x: 0, z: 0, k: 0 };
  function push(x, z, t) {
    pushOut.k = 0;
    if (!inPool(x, z)) return pushOut;
    const u = toU(x, z), v = toV(x, z), w = waveAt(u, v, t), S = st;
    if (w.H <= 0 || w.d < 0) return pushOut;
    const e = (w.s - Wv.pocket) / Wv.pocketW;
    pushOut.k = Math.exp(-e * e) * w.face * clamp(w.H / Wv.H, 0, 1) + (w.zone === 'shoulder' ? 0.15 * w.face : 0);
    pushOut.x = S.tu * ux + S.tv * vx; pushOut.z = S.tu * uz + S.tv * vz;
    return pushOut;
  }
  /** Where on the wave this point is (a copy: safe to keep for a frame). */
  function frameAt(x, z, t) {
    if (!inPool(x, z)) return null;
    const u = toU(x, z), v = toV(x, z), w = waveAt(u, v, t), S = st;
    return { u, v, s: w.s, d: w.d, H: w.H, F: w.F, h: w.h, face: w.face, zone: w.zone, env: w.env, dir: S.dir, on: S.on,
      crest: { x: S.tu * ux + S.tv * vx, z: S.tu * uz + S.tv * vz }, travel: { x: S.nu * ux + S.nv * vx, z: S.nu * uz + S.nv * vz } };
  }
  /** In the barrel? k 0..1 how deep (0 the mouth at the break point .. 1 the foam ball's end), cover 0..1 how covered by the lip over a
   *  body standing `y` (park-local, the layer's floor at 0) here, hr the body's height over the still water as a share of H, lipOver how
   *  far the lip's tip hangs over the body's d (m; > 0 the lip is over you). */
  function barrelAt(x, y, z, t) {
    const f = frameAt(x, z, t);
    if (!f || f.H < 1.5 || f.zone !== 'barrel' && !(f.zone === 'pocket' && f.s < 2)) return { k: 0, cover: 0, hr: 0, lipOver: -99, frame: f };
    const tau = sstep(0, Wv.throwLen, -f.s), gone = sstep(-Wv.tube * 0.88, -Wv.tube, f.s);
    const tip = lipCurve(f.H, f.F, tau, 1), hr = (y - P.y) / f.H;
    const inside = f.d > 0.08 * f.F && f.d < f.F * 1.05 && hr < 0.88;
    const cover = inside ? tau * (1 - gone) * sstep(-0.2 * f.F, 0.25 * f.F, tip.d - f.d * 0.6) : 0;
    return { k: clamp(-f.s / Wv.tube, 0, 1), cover, hr, lipOver: tip.d - f.d, frame: f };
  }
  /** The surface's foam 0..1 for the look and the grip: the whitewater, the crest pitching, the lip's landing line, the beach's wash. */
  function foamAt(x, z, t) {
    if (!inPool(x, z)) return 0;
    const u = toU(x, z), v = toV(x, z), w = waveAt(u, v, t);
    let f = 0;
    if (w.H > 0.3) {
      if (w.zone === 'whitewater') f = Math.max(f, sstep(-Wv.back, 0, w.d) * (1 - sstep(w.F, w.F * 2.2, w.d)) * 0.95);
      if (w.zone === 'barrel') f = Math.max(f, Math.exp(-((w.d - w.F) ** 2) / 6) * 0.85, sstep(-2, 0.5, w.d) * (1 - sstep(0.5, 2.5, w.d)) * 0.5);
      if (w.zone === 'pocket') f = Math.max(f, sstep(-1.2, 0.3, w.d) * (1 - sstep(0.3, 1.6, w.d)) * 0.45 * (1 - w.s / (Wv.pocket + Wv.pocketW)));
    }
    return Math.max(f, (1 - sstep(-P.beach, 6, v)) * 0.6);
  }
  /** The pool bed's depth under the still water at (u, v): the beach's foot, shelving to the reef, falling to the deep wall. */
  function bedAt(x, z) {
    const u = toU(x, z), v = toV(x, z);
    if (u < 0 || u > P.L || v > P.W) return null;
    if (v < 0) return P.y + (-v / P.beach) * P.rim - P.depth.foot * (1 - sstep(-P.beach, 0, v)); // (the beach rising out of it)
    const D = P.depth, d = v < P.vb ? D.foot + (D.reef - D.foot) * sstep(0, P.vb, v) : D.reef + (D.deep - D.reef) * sstep(P.vb, P.vb + 30, v);
    return P.y - d;
  }
  return { POOL: P, WAVE: Wv, state, inPool, surfaceY, normalAt, carry, push, frameAt, barrelAt, foamAt, bedAt, toU, toV, axes: { ux, uz, vx, vz } };
}

/** The pool's uniforms for the look's shader at time t (WAVEPOOL_GLSL): a = (x, z, yaw, y), b = (L, W, vb, beach), c = (on env, dir, ub,
 *  swell), d = (nu, nv, tu, tv), e = (H, cw, back, face), f = (faceShoulder, shoulder, tube, throwLen), g = (ww, wwDecay, t, 0). */
export function uniformsOf(S, t, out = { a: [0, 0, 0, 0], b: [0, 0, 0, 0], c: [0, 0, 0, 0], d: [0, 0, 0, 0], e: [0, 0, 0, 0], f: [0, 0, 0, 0], g: [0, 0, 0, 0] }) {
  const P = S.POOL, W = S.WAVE, s = S.state(t);
  out.a[0] = P.x; out.a[1] = P.z; out.a[2] = P.yaw; out.a[3] = P.y;
  out.b[0] = P.L; out.b[1] = P.W; out.b[2] = P.vb; out.b[3] = P.beach;
  out.c[0] = s.env; out.c[1] = s.dir; out.c[2] = s.ub; out.c[3] = s.swell;
  out.d[0] = s.nu; out.d[1] = s.nv; out.d[2] = s.tu; out.d[3] = s.tv;
  out.e[0] = W.H; out.e[1] = W.cw; out.e[2] = W.back; out.e[3] = W.face;
  out.f[0] = W.faceShoulder; out.f[1] = W.shoulder; out.f[2] = W.tube; out.f[3] = W.throwLen;
  out.g[0] = W.ww; out.g[1] = W.wwDecay; out.g[2] = t; out.g[3] = 0;
  return out;
}

/** The same surface in GLSL (a vertex shader's include): `vec4 wpSurface(vec2 parkXZ)` -> (height over the layer's floor, s, d, zone code:
 *  0 flat, 1 shoulder, 2 pocket, 3 barrel, 4 whitewater); uniforms uWP[7] as uniformsOf's a .. g. The swell's four waves are baked in as
 *  constants from SWELL. Kept beside the JS so the two cannot drift: change one, change the other. */
export const WAVEPOOL_GLSL = (() => {
  const sw = SWELL.waves.map((w) => { const k = (2 * Math.PI) / w.len; return `vec4(${(k * Math.cos(w.dir)).toFixed(6)}, ${(k * Math.sin(w.dir)).toFixed(6)}, ${Math.sqrt(G * k).toFixed(6)}, ${w.amp.toFixed(4)})`; });
  return /* glsl */ `
uniform vec4 uWP[7];
const float WP_E1 = ${E1.toFixed(6)};
float wpS(float a, float b, float x) { return smoothstep(a, b, x); }
vec2 wpUV(vec2 p) { vec2 q = p - uWP[0].xy; float c = cos(uWP[0].z), s = sin(uWP[0].z); return vec2(q.x * c - q.y * s + uWP[1].x * 0.5, q.x * s + q.y * c + uWP[1].y * 0.5); }
float wpSwell(vec2 uv, float t) {
  float deep = ${SWELL.near.toFixed(3)} + ${(SWELL.far - SWELL.near).toFixed(3)} * wpS(uWP[1].z * 0.5, uWP[1].y, uv.y), h = 0.0;
  ${sw.map((v, i) => `{ vec4 w = ${v}; h += w.w * ((exp(sin(dot(w.xy, uv) - w.z * t)) - 1.0) / WP_E1 - 0.33); }`).join('\n  ')}
  return h * deep * uWP[2].w * wpS(-uWP[1].w, 4.0, uv.y);
}
// x: the wave's height, y: s, z: d, w: zone (0 flat .. 4 whitewater); also writes the face's width and H through out params
vec4 wpWave(vec2 uv, out float H, out float F) {
  H = 0.0; F = uWP[4].w;
  float env = uWP[2].x; if (env <= 0.0) return vec4(0.0);
  vec2 pr = vec2(uv.x - uWP[2].z, uv.y - uWP[1].z);
  float s = dot(pr, uWP[3].zw), d = dot(pr, uWP[3].xy);
  float Hb = uWP[4].x, tube = uWP[5].z;
  float shoal = s > 0.0 ? 0.42 + 0.58 * exp(-s / uWP[5].y) : 1.0;
  float broke = s < -tube ? uWP[6].x + (1.0 - uWP[6].x) * exp((s + tube) / 6.0) : 1.0;
  float decay = s < -tube ? exp((s + tube) / uWP[6].y) * 0.65 + 0.35 : 1.0;
  float walls = wpS(-2.0, 12.0, uv.y + uWP[1].w * 0.3) * wpS(0.0, 25.0, uv.x) * wpS(0.0, 25.0, uWP[1].x - uv.x) * wpS(0.0, 18.0, uWP[1].y - uv.y);
  H = Hb * shoal * broke * decay * walls * env;
  F = s > 0.0 ? uWP[4].w + (uWP[5].x - uWP[4].w) * (1.0 - exp(-s / 30.0)) : (s < -tube ? uWP[4].w * 1.6 : uWP[4].w);
  float h;
  if (d < 0.0) h = H * exp(-(d * d) / (uWP[4].z * uWP[4].z));
  else if (d < F) { float x = d / F, p = s > 0.0 ? 0.75 + 0.6 * clamp(s / 40.0, 0.0, 1.0) : 0.72; h = H * (1.0 - pow(x, p)); }
  else { float e = (d - F) / F; h = -0.08 * H * exp(-e * e); }
  float pocketEnd = ${WAVE.pocket + WAVE.pocketW}.0;
  float zone = (d < -uWP[4].z * 1.4 || d > F * 2.0 || H < 0.4) ? 0.0 : s > pocketEnd ? 1.0 : s > 0.0 ? 2.0 : s > -tube ? 3.0 : 4.0;
  return vec4(h, s, d, zone);
}
vec4 wpSurface(vec2 p) {
  vec2 uv = wpUV(p); float H, F; vec4 w = wpWave(uv, H, F);
  return vec4(uWP[0].w + wpSwell(uv, uWP[6].z) + w.x, w.yzw);
}
`;
})();
