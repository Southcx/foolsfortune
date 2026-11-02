// ---------------------------------------------------------------------------------------
// A FEMININE MECH'S CORES (the part library's chests for the forms with `fem`, kit.js FORMS; asked for by cores.js `coreLook`): the
// same three cores (clayCore, kilnCore, lightCore) built as a feminine torso, never the hero's chest slimmed. The torso is the narrow
// top of a pear (South, 2026-11-02: "pear shape over hourglass ... the complement to the male mecha"): the ribcage and the shoulders
// narrower than the hips below them (femlegs.js), the waist drawn in, the weight low. One dense lathed profile pressed into its plan
// (`planOf`: an oval, the back flatter, a low swell where the chest plates sit), cut into a few long porcelain panels over the
// interstitial (a groove where Haydee has a panel line, and no more), the sockets ivory so any arms seat, the back closing round the
// cradle's boss as every core does. No neck socket: the head slot is a helm floating over the collar (femheads.js).
// THE CHEST PLATES (`bust`, South, 2026-11-02: kept at their size and given a spring "for comedic effect"): two armoured domes, each
// built in its own joint's frame (bustL/R off the chest, +Z out of the plate), so the parts body can bounce them on a damped spring
// (partsbody.js BUST_SPRING); plates and a gold rim, no anatomical detail.
//   haydee   (the `doll` form) Haydee's white android: the ribcage broad but still well inside the hips, the chest plates full, the
//            shoulder line falling to the caps, a low collar ring; under the ribcage the waist column, a jointed spine piece (a skin ball
//            in an ivory socket at each end, a porcelain drum between: `spine`)
//      clayCore   the plain shell: the chest, the ribs, the abdomen, a flank and a shoulder blade a side
//      kilnCore   a darker underbust band and the abdomen cut into three corset bands, a trim rim at the collar
//      lightCore  the flanks opened into four ribs over the lit core, a sternum strip
// (Drossel's corseted torso went with her form, 2026-11-02: her crinoline is a hip piece now, parts/hips.js, her sleeve a pauldron.)
// The waist column's two balls are the skin's (kit.js `jointBall`): the lower one the dantian (`dantian`: larger, a glow heart lit while
// sealed, a gold reticle) in the pelvis's sculpted socket, the upper one nested in the lower ribcage, a sculpt (`ribField`) whose
// wasp waist turns down and in round it over a socket cut into its foot; the collar a sculpt too (`collar`: the ring and clavicles).
// Prior art: Haydee (Haydee Interactive, 2016: the white android's sparse panel lines); Elemental Gearbolt (Alfa System, 1997: the
// mechanical girls' smooth porcelain torsos); the Venus of Willendorf and the Jomon dogu (the narrow top over the low weight); the
// ball-jointed doll's torso shell; the hero cores' sculpt (cores.js).
//
//   femCoreLook(id, F) -> the same contract as cores.js coreLook: { mounts, prof, plan, chest(S), waist(S), spine, bust: { at(s), rot(s), build(S, s) } }
//   (spine: Haydee's waist column's two balls { lo, hi, r, rt } in the waist's frame, for the parts body's crazing)
// ---------------------------------------------------------------------------------------
import { MECH_LOOK as L, band, profAt, panel, jointBall, shell, sculpt, tube } from './kit.js';
import * as THREE from 'three';
import { sphere, ellipsoid, cone, torus, blend, carve } from './sdf.js';
import { aoTone, surfAt, sculptSide, socketProf, bead, DANTIAN, figureOf } from './femlegs.js';

const PI = Math.PI;
const WIN = [1.32, 2.82]; // (the back's window round the cradle's boss: cores.js's own)
const G = 0.028; // (a groove's half-width in phi)
const bump = (y, a, b) => (y <= a || y >= b ? 0 : Math.sin((PI * (y - a)) / (b - a)));

/** The torsos (r m, y m over the chest's base; the profile runs down past the base to cover the wasp waist). */
const TORSO = {
  // Haydee's (South, 2026-11-02: "add the appropriate ball joints for the elbows and waist column, broaden the chest and increase the
  // size of the chest, and slope the shoulders slightly down"): the shell closes at the ribcage's foot over the waist column's top ball
  // (`spine`), the ribcage ~15% broader (`wide`, eased in up the ribs), the chest plates 1.25x, the shoulder line falling to the caps
  haydee: { prof: [[0.3, 0.5], [0.42, 0.6], [0.58, 0.86], [0.78, 1.25], [0.92, 1.65], [0.97, 2.05], [0.95, 2.28], [0.85, 2.56], [0.66, 2.82], [0.46, 2.99], [0.3, 3.08]],
    d: 0.78, back: 0.68, wide: 1.15, bust: { x: 0.52, y: 2.02, s: 0.2, amp: 0.27, r: 0.62, h: 0.62 }, under: 1.68, shoulderY: 2.38, cup: 0.42,
    spine: { lo: DANTIAN.lo, hi: 1.24, r: DANTIAN.r, rt: 0.3 }, ribs: { top: 1.36, cell: 0.058 } },
};

/** A torso in a figure (femlegs.js FIGURES): its chest plates the figure's, its wasp waist drawn in or let out by `waistK`, eased
 *  back to the profile as drawn up the ribs. */
const figured = (T, fig) => ({ ...T, fig: fig.id, bust: { ...T.bust, ...fig.bust },
  prof: T.prof.map(([r, y]) => [r * (fig.waistK + (1 - fig.waistK) * Math.min(1, Math.max(0, (y - 0.5) / 1.0))), y]) });
/** How much broader the ribcage is drawn than its profile at height y (T.wide eased in over the ribs, 1 at the waist). */
const wideAt = (T, y) => 1 + ((T.wide || 1) - 1) * Math.min(1, Math.max(0, (y - 0.6) / 0.8)) ** 0.7;
function planOf(T) {
  const B = T.bust;
  return (x, y, z) => {
    const r = Math.hypot(x, z); if (r < 1e-5) return [x, y, z];
    const c = z / r, f = Math.max(0, c), wx = wideAt(T, y), X = x * wx;
    let zz = z > 0 ? z * T.d : z * T.back;
    zz += f ** 1.5 * B.amp * Math.exp(-(((Math.abs(X) - B.x) ** 2) + ((y - B.y) * 0.8) ** 2) / B.s); // (a low swell where each chest plate sits)
    zz -= (z < 0 ? 1 : 0) * 0.08 * bump(y, 1.4, 2.9); // (the back flatter between the blades)
    return [X * (1 - 0.05 * f * bump(y, 0.4, 1.6)), y, zz];
  };
}

/** The lower ribcage as a sculpt (South, 2026-11-02: "the female mech's lower ribcage should have improved geometry to nest the waist
 *  joint"): the torso's own barrel (its profile pressed into its plan, read back as a field: the plan inverted, so the sculpt meets the
 *  panels above it at their groove) from the waist column's top ball up to `ribs.top`; the profile's wasp waist already turning down
 *  and in round the ball, a spherical socket cut into its foot over the ball, the costal arch cut up into its front (a shallow
 *  epigastric hollow framed by the rib margins), the floating ribs' two lobes swelling down the flanks toward the ball, the margins'
 *  lines grooved. `bands` (heights) grooves round it for the kiln's corset and the light core's ribs. */
function ribField(T, P) {
  const B = T.bust, Sp = T.spine, hi = Sp.hi - L.chestBase, top = T.ribs.top, y0 = P[0][1], N = 96;
  const R = new Float32Array(N + 1), WX = new Float32Array(N + 1); // (the profile and the widening tabled: the field reads them a sample)
  const foot = hi + 0.3 * Sp.rt, flare = Sp.rt + 0.21; // (the foot's lip 0.3 of the ball over its equator, flared to a thick rim round it)
  for (let i = 0; i <= N; i++) {
    const y = y0 + ((top - y0) * i) / N; WX[i] = wideAt(T, y);
    R[i] = Math.max(profAt(P, y) * (1.03 - 0.035 * Math.min(1, Math.max(0, (y - top + 0.18) / 0.18))), flare - 0.55 * Math.max(0, y - foot - 0.04)); // (drawn in under the panels' lap at its top)
  }
  const tab = (A, y) => { const u = Math.max(0, Math.min(N, ((y - y0) / (top - y0)) * N)), i = Math.min(N - 1, u | 0), t = u - i; return A[i] + (A[i + 1] - A[i]) * t; };
  const barrel = (X, y, Z) => {
    const wx = tab(WX, y), r0 = Math.hypot(X / wx, Z), c = r0 > 1e-5 ? Z / r0 : 0, f = Math.max(0, c);
    const x0 = X / (wx * (1 - 0.05 * f * bump(y, 0.4, 1.6)));
    const z0 = Z > 0 ? (Z - f ** 1.5 * B.amp * Math.exp(-(((Math.abs(X) - B.x) ** 2) + ((y - B.y) * 0.8) ** 2) / B.s)) / T.d : (Z + 0.08 * bump(y, 1.4, 2.9)) / T.back;
    const side = (Math.hypot(x0, z0) - tab(R, y)) * 0.66, cap = y - top, h = Math.min(1, Math.max(0, 0.5 + (cap - side) / 0.12)); // (its top rounded)
    const d = side + (cap - side) * h + 0.06 * h * (1 - h), lo = foot - y, g = Math.min(1, Math.max(0, 0.5 + (lo - d) / 0.12)); // (its foot rounded too)
    return d + (lo - d) * g + 0.06 * g * (1 - g);
  };
  let f = blend(0.12, barrel, ellipsoid([0.5, 0.86, -0.04], [0.2, 0.36, 0.36]), ellipsoid([-0.5, 0.86, -0.04], [0.2, 0.36, 0.36])); // (the floating ribs)
  f = carve(0.07, f, sphere([0, hi, 0], Sp.rt + 0.05), ellipsoid([0, 0.62, 0.66], [0.38, 0.56, 0.3])); // (the ball's socket; the costal arch)
  return f;
}
/** A line laid on a sculpt's surface: each point the ray's hit from inside (from, dir pairs), pressed a hair in. */
const onSurf = (f, rays, k = 1.0) => rays.map(([o, d]) => surfAt(f, o, d)).filter(Boolean).map(([x, y, z]) => [x * k, y, z * k]);

export function femCoreLook(id, F) {
  const T = figured(TORSO[F.fem] || TORSO.haydee, figureOf(F)), P = band(T.prof, T.prof[0][1], T.prof[T.prof.length - 1][1], 1, 40), W = planOf(T);
  const top = P[P.length - 1][1], depth = (y) => profAt(P, y) * T.back, wide = (y) => profAt(P, y);
  const gap = Math.asin(Math.min(0.9, 0.5 / profAt(P, 2.1)));
  const mounts = {
    neck: [top - 0.04, 0.06], shoulder: [wide(T.shoulderY) * wideAt(T, T.shoulderY) * 0.98 + (T.wide ? 0.08 : 0.04), T.shoulderY], back: [1.5, -(depth(1.5) + 0.5)], gen: [1.12, -(depth(1.12) + 0.42)],
    boost: [1.45, -(depth(1.45) + 0.42), Math.max(0.5, wide(1.45) * 0.62)], plug: [1.0, -(depth(1.0) + 0.5)], cradleZ: -depth(L.cradleY) + 0.06,
    // (the back's hardware all on the upper back with the cradle, square between the shoulder blades, never down at the waist and hips:
    // the doll's waist is narrow, and anything hung there showed beside it from the front: South, 2026-11-02)
  };
  const on = (phi, y, k = 1.04) => { const r = profAt(P, y) * k; return W(Math.sin(phi) * r, y, Math.cos(phi) * r); };
  /** Panels: [y0, y1, a0, a1, tone, k], mirrored when a0 > 0 (a centre panel spans -a1..a1 when a0 < 0). */
  const panels = (S, list, piece = S.p) => {
    for (const [y0, y1, a0, a1, c, k = 1.03] of list) {
      const one = (b0, b1) => piece.geo(sculpt(panel(band(P, y0, y1, k, 14), b0, b1, 22), W), { c });
      one(a0, a1); if (a0 > 0) one(-a1, -a0);
    }
  };
  const R0 = T.ribs.top - 0.1; // (the panels begin lapped over the sculpted lower ribcage's top, a plate's edge over it, never a ledge)
  const inner = (S) => S.core.geo(sculpt(shell(band(P, T.ribs.top - 0.06, top, 0.95, 30), 40), W), { c: L.core });
  const hoop = (S, y, h, k = 1.05, c = L.trimM, piece = S.trim) => piece.geo(sculpt(shell(band(P, y - h, y + h, k, 2), 44), W), { c });
  const backPlates = (S, y0, y1, a, c = L.pale) => panels(S, [[y0, y1, a, PI - gap - G, c], [y0, WIN[0], PI - gap - G, PI - G, c], [WIN[1], y1, PI - gap - G, PI - G, c]]);
  const sockets = (S) => {
    // the shoulder's socket in the chest's side: a cup round the ball opening outward along the arm's hang (its axis the arm's rest
    // splay, femlimbs.js), its rolled lip just past the ball's equator, its back a dome sunk into the chest; mostly under the pauldron
    const R = T.cup / 1.05, prof = socketProf(R, R * 0.35, -R * 1.15, false, -0.1), splay = 0.48;
    for (const s of [-1, 1]) S.p.geo(new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r, y)), 36).rotateZ(s * splay), { at: [s * mounts.shoulder[0], mounts.shoulder[1], 0], c: L.pale });
  };
  const U = T.under;
  /** The sculpted lower ribcage (ribField), one mesh a core's grooves; `c` the core's shade of it. */
  const ribs = (S, bands, c = null) => {
    const f = ribField(T, P), lo = P[0][1] - 0.1, Wd = profAt(P, T.ribs.top) * 1.3;
    sculptSide(S.p, f, [[-Wd, lo, -Wd * 0.8], [Wd, T.ribs.top + 0.02, Wd * 0.9]], T.ribs.cell, { key: `fem.ribs.${F.fem}.${T.fig}.${c ?? 0}`, tone: aoTone(f, L.dark, c ?? L.pale) });
    // the rib margins (sunk lines from the arch's top down and out to the flanks) and the core's bands round the ribs
    for (const s of [1, -1]) {
      const m = onSurf(f, [0, 1, 2, 3, 4].map((i) => { const u = i / 4; return [[0, 1.14 - 0.42 * u, 0], [s * (0.12 + 0.9 * u), 0, 1 - 0.55 * u]]; }));
      if (m.length > 3) bead(S, m, 0.016);
    }
    for (const y of bands) {
      const ring = onSurf(f, Array.from({ length: 41 }, (_, i) => { const a = (i / 40) * PI * 2; return [[0, y, 0], [Math.sin(a), 0, Math.cos(a)]]; }));
      if (ring.length > 30) bead(S, ring, 0.018, L.trimM, 80);
    }
  };

  const haydee = {
    clayCore(S) {
      inner(S); ribs(S, []);
      panels(S, [[U + 0.04, top - 0.06, -1.5, 1.5, L.pale], [R0, U - 0.04, -1.35, 1.35, L.pale]]); // (the chest shell; the upper ribs)
      panels(S, [[R0, top - 0.18, 1.5 + 2 * G, 2.05, L.pale]]); // (the flanks)
      backPlates(S, R0, top - 0.2, 2.05 + 2 * G);
    },
    kilnCore(S) {
      inner(S); ribs(S, [0.98, 1.18], L.mid); // (the corset's two bands grooved round the lower ribs)
      panels(S, [[U + 0.16, top - 0.06, -1.5, 1.5, L.pale], [R0, U - 0.04, -1.4, 1.4, L.mid]]); // (the chest; the darker underbust band)
      panels(S, [[R0, top - 0.18, 1.5 + 2 * G, 2.05, L.pale]]);
      backPlates(S, R0, top - 0.2, 2.05 + 2 * G, L.mid);
      hoop(S, U + 0.1, 0.035, 1.06, L.trimM); hoop(S, top - 0.16, 0.04, 1.03, L.trimL);
    },
    lightCore(S) {
      inner(S); ribs(S, [0.8, 0.95, 1.1, 1.25]); // (the ribs grooved round, the core's light between)
      panels(S, [[U + 0.04, top - 0.06, -1.3, 1.3, L.pale], [R0, U - 0.04, -0.75, 0.75, L.pale]]);
      for (let i = 0; i < 3; i++) { const a = 0.85 + i * 0.32; panels(S, [[R0 + 0.02, U - 0.04, a, a + 0.12, L.mid, 1.02]]); }
      panels(S, [[R0, top - 0.18, 2.1, 2.4, L.pale]]);
      backPlates(S, R0, top - 0.2, 2.4 + 2 * G);
      panels(S, [[R0, U + 0.5, -0.06, 0.06, L.trimL, 1.07]], S.trim); // (the sternum strip)
    },
  };
  /** Haydee's collar, sculpted: a socket for the neck's ball (a rolled rim round a cup, rising off the chest's top on a short flare),
   *  so the gap to the floating helm reads as a neck; the two clavicles running out of it to the shoulders, blended into it. */
  const collar = (S) => {
    const ends = [on(0.5, top - 0.14, 1.02), on(1.25, T.shoulderY + 0.24, 1.01)];
    const nk = [0, mounts.neck[0], mounts.neck[1]], rn = 0.21; // (the neck's ball: the head's, at the neck joint, the helm floating over it)
    const f0 = blend(0.12, torus([nk[0], nk[1] - 0.07, nk[2]], rn + 0.1, 0.075), cone([0, top - 0.16, 0.02], [0, nk[1] - 0.1, nk[2]], 0.46, rn + 0.12), cone(ends[0], ends[1], 0.075, 0.05));
    const f = carve(0.05, (x, y, z) => f0(Math.abs(x), y, z), sphere(nk, rn + 0.05)); // (the neck's socket: a rolled rim round a cup under the gap)
    sculptSide(S.trim, f, [[-1.15, T.shoulderY + 0.1, -0.6], [1.15, top + 0.12, 0.62]], 0.04, { key: `fem.collar.${F.fem}.2`, tone: aoTone(f, L.trimD, L.trimL) });
  };
  /** The waist column's lower ball made the dantian, a target point (South, 2026-11-02: "Think of the waist joint like the dantian.
   *  Its a target point!"): larger than the other balls, a heart of the glow (lit while sealed) round the skin's, its shell bare glass
   *  (no gold wire on it: South, 2026-11-02). */
  const dantian = (S, r, at) => {
    jointBall(S, r, at); S.e.ball(r * 0.42, { at, c: 0xffffff }, 20, 14);
  };
  const build = haydee[id] || haydee.clayCore;
  /** The chest plates: a dome each in its joint's frame (+Z out), seated on the shell's front at the plate's height. */
  const B = T.bust, front = (x) => T.d * Math.sqrt(Math.max(0.05, profAt(P, B.y) ** 2 - (x / wideAt(T, B.y)) ** 2)) + B.amp * 0.8;
  /** The halter (South, 2026-11-02: "the gold rings on the bust should be sloped outwards like a halter top, coming to a point like a
   *  gorget/choker"): each plate's gold line run under it from its outer top round to its inner top (an underwire), then from both
   *  tops up and in over the chest to one point at the collar, so the lines slope outward going down from the neck; drawn in the
   *  plate's own frame so it rides the plate's spring, the point a little gold drop where the two meet. */
  const choker = new THREE.Vector3(0, top - 0.2, profAt(P, top - 0.2) * T.d + 0.07);
  const halter = (S, s, r, h) => {
    const at = new THREE.Vector3(...bust.at(s)), q = new THREE.Quaternion().setFromEuler(new THREE.Euler(...bust.rot(s))).invert();
    const local = (v) => v.clone().sub(at).applyQuaternion(q), rim = (a, z = 0.03) => [Math.cos(a) * r * 0.99, Math.sin(a) * r * 0.94, z];
    const out = s > 0 ? 0 : PI, inA = s > 0 ? PI : 0; // (the outer side +X on the left plate)
    const a0 = out + (s > 0 ? 0.95 : -0.95), a1 = inA + (s > 0 ? -1.15 : 1.15), wire = [];
    const sweep = (s > 0 ? -1 : 1) * (2 * PI - Math.abs(a1 - a0)); // (the long way round, through the plate's foot)
    for (let i = 0; i <= 24; i++) wire.push(rim(a0 + sweep * (i / 24)));
    tube(S.g, wire, 0.035, L.gold, 40);
    const C = local(choker), lift = (p0, k) => { const m = new THREE.Vector3(...p0).lerp(C, k); m.z += 0.12 * Math.sin(PI * k); return m.toArray(); };
    for (const end of [wire[0], wire[wire.length - 1]]) tube(S.g, [end, lift(end, 0.35), lift(end, 0.7), C.toArray()], 0.03, L.gold, 16);
    S.g.ball(0.07, { at: C.toArray(), c: L.gold }, 12, 8);
  };
  const bust = {
    at: (s) => [s * B.x, B.y, front(B.x) - B.h * 0.3],
    rot: (s) => [0.12, s * 0.32, 0],
    build(S, s) {
      const r = B.r, h = B.h, dome = shell([[0.001, h], [r * 0.45, h * 0.9], [r * 0.8, h * 0.6], [r * 0.98, h * 0.22], [r, 0.0], [r * 0.9, -0.12]], 32).rotateX(PI / 2);
      S.p.geo(dome, { sc: [1, 0.94, 1], c: L.pale });
      halter(S, s, r, h); // (the plate's rim as a halter's line, run up to the gorget's point at the collar)
      if (id === 'kilnCore') S.trim.geo(shell([[r * 0.62, h * 0.72], [r * 0.7, h * 0.66], [r * 0.62, h * 0.6]], 32).rotateX(PI / 2), { sc: [1, 0.94, 1], c: L.trimM });
      S.core.geo(shell([[r * 0.9, -0.1], [r * 0.8, 0.0]], 24).rotateX(PI / 2), { c: L.core }); // (the gap under the rim)
    },
  };
  return {
    mounts, prof: P, plan: W, bust,
    chest(S) {
      build(S); sockets(S);
      collar(S);
    },
    /** The waist column (in the waist's frame). Haydee's: a jointed spine piece, a skin ball at each end in its ivory socket (the
     *  pelvis's below, the ribcage's above), a porcelain drum between with a trim band. */
    spine: T.spine,
    waist(S) {
      const Sp = T.spine;
      {
        dantian(S, Sp.r, [0, Sp.lo, 0]); jointBall(S, Sp.rt, [0, Sp.hi, 0]);
        // the drum between them lathed with a socket at each end (femlegs.js socketProf): a cup over the dantian, a lip under the upper ball
        const a = Sp.lo + Sp.r * 0.95, b = Sp.hi - Sp.rt * 0.95, m = (a + b) / 2, rd = 0.33;
        S.p.lathe([[rd, a], [rd + 0.01, m], [rd, b]], { c: L.pale }, 36);
        S.p.lathe(socketProf(Sp.r, rd, -Sp.r * 0.95, false).map(([r, y]) => [r, y + Sp.lo]), { c: L.pale }, 36);
        S.p.lathe(socketProf(Sp.rt, rd, -Sp.rt * 0.95).map(([r, y]) => [r, y + Sp.hi]), { c: L.pale }, 36);
        S.trim.ring(rd + 0.012, 0.016, { at: [0, m, 0], c: L.trimM }, 48, 5); // (a fine trim bead round the drum)
      }
    },
  };
}
