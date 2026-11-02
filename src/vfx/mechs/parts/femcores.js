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
// The waist column's two balls are the skin's (kit.js `jointBall`), a little larger, in their ivory sockets.
// Prior art: Haydee (Haydee Interactive, 2016: the white android's sparse panel lines); Elemental Gearbolt (Alfa System, 1997: the
// mechanical girls' smooth porcelain torsos); the Venus of Willendorf and the Jomon dogu (the narrow top over the low weight); the
// ball-jointed doll's torso shell; the hero cores' sculpt (cores.js).
//
//   femCoreLook(id, F) -> the same contract as cores.js coreLook: { mounts, prof, plan, chest(S), waist(S), spine, bust: { at(s), rot(s), build(S, s) } }
//   (spine: Haydee's waist column's two balls { lo, hi, r, rt } in the waist's frame, for the parts body's crazing)
// ---------------------------------------------------------------------------------------
import { MECH_LOOK as L, band, profAt, panel, cup, jointBall, shell, sculpt, tube } from './kit.js';

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
    spine: { lo: 0.35, hi: 1.22, r: 0.33, rt: 0.3 } },
};

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

export function femCoreLook(id, F) {
  const T = TORSO[F.fem] || TORSO.haydee, P = band(T.prof, T.prof[0][1], T.prof[T.prof.length - 1][1], 1, 40), W = planOf(T);
  const top = P[P.length - 1][1], depth = (y) => profAt(P, y) * T.back, wide = (y) => profAt(P, y);
  const gap = Math.asin(Math.min(0.9, 0.5 / profAt(P, 2.1)));
  const mounts = {
    neck: [top - 0.04, 0.06], shoulder: [wide(T.shoulderY) * wideAt(T, T.shoulderY) * 0.98 + (T.wide ? 0.08 : 0.04), T.shoulderY], back: [1.05, -(depth(1.05) + 0.5)], gen: [0.62, -(depth(0.62) + 0.5)],
    boost: [0.32, -(depth(0.32) + 0.5), Math.max(0.5, wide(0.32) * 0.8)], plug: [0.4, -(depth(0.4) + 0.6)], cradleZ: -depth(L.cradleY) + 0.06,
  };
  const on = (phi, y, k = 1.04) => { const r = profAt(P, y) * k; return W(Math.sin(phi) * r, y, Math.cos(phi) * r); };
  /** Panels: [y0, y1, a0, a1, tone, k], mirrored when a0 > 0 (a centre panel spans -a1..a1 when a0 < 0). */
  const panels = (S, list, piece = S.p) => {
    for (const [y0, y1, a0, a1, c, k = 1.03] of list) {
      const one = (b0, b1) => piece.geo(sculpt(panel(band(P, y0, y1, k, 14), b0, b1, 22), W), { c });
      one(a0, a1); if (a0 > 0) one(-a1, -a0);
    }
  };
  const inner = (S) => S.core.geo(sculpt(shell(band(P, P[0][1], top, 0.95, 30), 40), W), { c: L.core });
  const hoop = (S, y, h, k = 1.05, c = L.trimM, piece = S.trim) => piece.geo(sculpt(shell(band(P, y - h, y + h, k, 2), 44), W), { c });
  const backPlates = (S, y0, y1, a, c = L.pale) => panels(S, [[y0, y1, a, PI - gap - G, c], [y0, WIN[0], PI - gap - G, PI - G, c], [WIN[1], y1, PI - gap - G, PI - G, c]]);
  const sockets = (S) => {
    for (const s of [-1, 1]) S.p.geo(cup(T.cup).rotateZ(s * PI / 2), { at: [s * mounts.shoulder[0], mounts.shoulder[1], 0], c: L.ivory });
  };
  const U = T.under;

  const B0 = P[0][1] + 0.06; // (the shell's foot: Haydee's ribcage closes over the waist column's top ball)
  const haydee = {
    clayCore(S) {
      inner(S);
      panels(S, [[U + 0.04, top - 0.06, -1.5, 1.5, L.pale], [B0, U - 0.04, -1.35, 1.35, L.pale]]); // (the chest shell; the ribs in one)
      panels(S, [[B0 + 0.04, top - 0.18, 1.5 + 2 * G, 2.05, L.pale]]); // (the flanks)
      backPlates(S, B0 + 0.04, top - 0.2, 2.05 + 2 * G);
    },
    kilnCore(S) {
      inner(S);
      panels(S, [[U + 0.16, top - 0.06, -1.5, 1.5, L.pale], [1.4, U - 0.04, -1.4, 1.4, L.mid]]); // (the chest; the darker underbust band)
      for (const [y0, y1] of [[1.0, 1.36], [B0, 0.96]]) panels(S, [[y0, y1, -1.3, 1.3, L.pale, 1.035]]); // (two corset bands over the ribs)
      panels(S, [[B0 + 0.04, top - 0.18, 1.5 + 2 * G, 2.05, L.pale]]);
      backPlates(S, B0 + 0.04, top - 0.2, 2.05 + 2 * G, L.mid);
      hoop(S, U + 0.1, 0.035, 1.06, L.trimM); hoop(S, top - 0.16, 0.04, 1.03, L.trimL);
    },
    lightCore(S) {
      inner(S);
      panels(S, [[U + 0.04, top - 0.06, -1.3, 1.3, L.pale], [B0, U - 0.04, -0.75, 0.75, L.pale]]);
      for (let i = 0; i < 4; i++) { const a = 0.85 + i * 0.32; panels(S, [[B0 + 0.06 + i * 0.1, U - 0.04, a, a + 0.12, L.mid, 1.02]]); } // (the ribs, the core lit between)
      panels(S, [[0.95, top - 0.18, 2.1, 2.4, L.pale]]);
      backPlates(S, B0 + 0.1, top - 0.2, 2.4 + 2 * G);
      panels(S, [[B0 + 0.06, U + 0.5, -0.06, 0.06, L.trimL, 1.07]], S.trim); // (the sternum strip)
    },
  };
  const build = haydee[id] || haydee.clayCore;
  /** The chest plates: a dome each in its joint's frame (+Z out), seated on the shell's front at the plate's height. */
  const B = T.bust, front = (x) => T.d * Math.sqrt(Math.max(0.05, profAt(P, B.y) ** 2 - (x / wideAt(T, B.y)) ** 2)) + B.amp * 0.8;
  const bust = {
    at: (s) => [s * B.x, B.y, front(B.x) - B.h * 0.3],
    rot: (s) => [0.12, s * 0.32, 0],
    build(S, s) {
      const r = B.r, h = B.h, dome = shell([[0.001, h], [r * 0.45, h * 0.9], [r * 0.8, h * 0.6], [r * 0.98, h * 0.22], [r, 0.0], [r * 0.9, -0.12]], 32).rotateX(PI / 2);
      S.p.geo(dome, { sc: [1, 0.94, 1], c: L.pale });
      S.g.ring(r * 0.99, 0.035, { at: [0, 0, 0.02], sc: [1, 0.94, 1], c: L.gold }, 36, 4); // (the plate's rim)
      if (id === 'kilnCore') S.trim.geo(shell([[r * 0.62, h * 0.72], [r * 0.7, h * 0.66], [r * 0.62, h * 0.6]], 32).rotateX(PI / 2), { sc: [1, 0.94, 1], c: L.trimM });
      S.core.geo(shell([[r * 0.9, -0.1], [r * 0.8, 0.0]], 24).rotateX(PI / 2), { c: L.coreD }); // (the gap under the rim)
    },
  };
  return {
    mounts, prof: P, plan: W, bust,
    chest(S) {
      build(S); sockets(S);
      { // Haydee's collar ring and the panel line from the underbust round to the blade
        S.trim.geo(sculpt(shell([[0.32, top - 0.1], [profAt(P, top - 0.1) * 0.92, top - 0.09], [profAt(P, top - 0.1) * 0.96, top + 0.02], [0.36, top + 0.1]], 32), W), { c: L.trimL });
        for (const s of [-1, 1]) tube(S.core, [on(s * 0.2, B0 + 0.12, 1.045), on(s * 0.8, 1.0, 1.045), on(s * 1.25, 1.6, 1.04)], 0.022, L.coreD, 16);
        S.p.geo(cup(T.spine.rt), { at: [0, T.spine.hi - L.chestBase, 0], c: L.ivory }); // (the ribcage's socket over the column's top ball)
      }
    },
    /** The waist column (in the waist's frame). Haydee's: a jointed spine piece, a skin ball at each end in its ivory socket (the
     *  pelvis's below, the ribcage's above), a porcelain drum between with a trim band. */
    spine: T.spine,
    waist(S) {
      const Sp = T.spine;
      {
        jointBall(S, Sp.r, [0, Sp.lo, 0]); jointBall(S, Sp.rt, [0, Sp.hi, 0]);
        S.core.lathe([[0.19, Sp.lo], [0.19, Sp.hi]], { c: L.core }, 18);
        const a = Sp.lo + Sp.r * 0.7, b = Sp.hi - Sp.rt * 0.75, m = (a + b) / 2;
        S.p.lathe([[0.2, a], [0.29, a + 0.05], [0.33, m - 0.08], [0.33, m + 0.08], [0.29, b - 0.05], [0.2, b]], { c: L.pale }, 32); // (the drum)
        S.trim.lathe([[0.335, m - 0.045], [0.36, m], [0.335, m + 0.045]], { c: L.trimM }, 32);
        for (const y of [a + 0.02, b - 0.02]) S.p.lathe([[0.22, y - 0.03], [0.25, y], [0.22, y + 0.03]], { c: L.ivory }, 24); // (the drum's lips)
      }
    },
  };
}
