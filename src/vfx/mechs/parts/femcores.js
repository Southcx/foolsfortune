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
//   haydee   (the `doll` form) Haydee's white android: the ribcage narrow and the waist pinched, the chest plates full, the abdomen one
//            smooth plate, a low collar ring
//      clayCore   the plain shell: the chest, the ribs, the abdomen, a flank and a shoulder blade a side
//      kilnCore   a darker underbust band and the abdomen cut into three corset bands, a trim rim at the collar
//      lightCore  the flanks opened into four ribs over the lit core, a sternum strip
//   drossel  Drossel von Flügel's: narrow and corseted, small chest plates, sloping shoulders, a high Medici collar standing at the
//            collar (no neck under it), a stepped stomacher down the front to a point, fine gold bands, a brooch at the throat
//      clayCore   the corset's panels and its stomacher in trim, two gold bands
//      kilnCore   the corset boned: eight trim bones round it, three gold bands, its lacing up the back in gold
//      lightCore  a birdcage: the flanks openwork, thin ribs over the lit core, the stomacher and the collar kept
// Prior art: Haydee (Haydee Interactive, 2016: the white android's sparse panel lines); Elemental Gearbolt (Alfa System, 1997: the
// mechanical girls' smooth porcelain torsos); Drossel von Flügel of Fireball (Jinni's Animation Studios for Disney Japan, 2008: the
// robot duchess's corseted white body); the Venus of Willendorf and the Jomon dogu (the narrow top over the low weight); the
// Victorian corset's busk, boning and stomacher, the Medici collar, the cameo brooch; the ball-jointed doll's torso shell; the hero
// cores' sculpt (cores.js).
//
//   femCoreLook(id, F) -> the same contract as cores.js coreLook: { mounts, prof, plan, chest(S), waist(S), bust: { at(s), rot(s), build(S, s) } }
// ---------------------------------------------------------------------------------------
import { MECH_LOOK as L, band, profAt, panel, cup, ball, shell, sculpt, labTone, tube } from './kit.js';

const PI = Math.PI;
const WIN = [1.32, 2.82]; // (the back's window round the cradle's boss: cores.js's own)
const G = 0.028; // (a groove's half-width in phi)
const bump = (y, a, b) => (y <= a || y >= b ? 0 : Math.sin((PI * (y - a)) / (b - a)));

/** The torsos (r m, y m over the chest's base; the profile runs down past the base to cover the wasp waist). */
const TORSO = {
  haydee: { prof: [[0.46, -0.78], [0.4, -0.5], [0.38, -0.2], [0.42, 0.2], [0.56, 0.7], [0.76, 1.2], [0.9, 1.65], [0.97, 2.05], [0.97, 2.4], [0.9, 2.66], [0.74, 2.9], [0.5, 3.06], [0.3, 3.12]],
    d: 0.78, back: 0.68, bust: { x: 0.42, y: 2.06, s: 0.16, amp: 0.22, r: 0.5, h: 0.5 }, under: 1.72, shoulderY: 2.56, cup: 0.4 },
  drossel: { prof: [[0.44, -0.55], [0.34, -0.25], [0.33, 0.1], [0.42, 0.5], [0.6, 1.0], [0.75, 1.5], [0.85, 1.95], [0.86, 2.3], [0.78, 2.56], [0.62, 2.8], [0.4, 2.96], [0.26, 3.02]],
    d: 0.74, back: 0.7, bust: { x: 0.33, y: 2.04, s: 0.08, amp: 0.1, r: 0.37, h: 0.3 }, under: 1.68, shoulderY: 2.44, cup: 0.34 },
};

function planOf(T) {
  const B = T.bust;
  return (x, y, z) => {
    const r = Math.hypot(x, z); if (r < 1e-5) return [x, y, z];
    const c = z / r, f = Math.max(0, c);
    let zz = z > 0 ? z * T.d : z * T.back;
    zz += f ** 1.5 * B.amp * Math.exp(-(((Math.abs(x) - B.x) ** 2) + ((y - B.y) * 0.8) ** 2) / B.s); // (a low swell where each chest plate sits)
    zz -= (z < 0 ? 1 : 0) * 0.08 * bump(y, 1.4, 2.9); // (the back flatter between the blades)
    return [x * (1 - 0.05 * f * bump(y, 0.4, 1.6)), y, zz];
  };
}

export function femCoreLook(id, F) {
  const T = TORSO[F.fem] || TORSO.haydee, D = F.fem === 'drossel', P = band(T.prof, T.prof[0][1], T.prof[T.prof.length - 1][1], 1, 40), W = planOf(T);
  const top = P[P.length - 1][1], depth = (y) => profAt(P, y) * T.back, wide = (y) => profAt(P, y);
  const gap = Math.asin(Math.min(0.9, 0.5 / profAt(P, 2.1)));
  const mounts = {
    neck: [top - 0.04, 0.06], shoulder: [wide(T.shoulderY) * 0.98 + 0.04, T.shoulderY], back: [1.05, -(depth(1.05) + 0.5)], gen: [0.62, -(depth(0.62) + 0.5)],
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

  const haydee = {
    clayCore(S) {
      inner(S);
      panels(S, [[U + 0.04, top - 0.06, -1.5, 1.5, L.pale], [-0.76, U - 0.04, -1.35, 1.35, L.pale]]); // (the chest shell; the ribs and abdomen in one)
      panels(S, [[-0.3, top - 0.18, 1.5 + 2 * G, 2.05, L.pale]]); // (the flanks)
      backPlates(S, -0.2, top - 0.2, 2.05 + 2 * G);
    },
    kilnCore(S) {
      inner(S);
      panels(S, [[U + 0.16, top - 0.06, -1.5, 1.5, L.pale], [1.15, U - 0.04, -1.4, 1.4, L.mid]]); // (the chest; the darker underbust band)
      for (const [y0, y1] of [[0.6, 1.1], [0.05, 0.55], [-0.76, 0.0]]) panels(S, [[y0, y1, -1.3, 1.3, L.pale, 1.035]]); // (three corset bands)
      panels(S, [[-0.3, top - 0.18, 1.5 + 2 * G, 2.05, L.pale]]);
      backPlates(S, -0.2, top - 0.2, 2.05 + 2 * G, L.mid);
      hoop(S, U + 0.1, 0.035, 1.06, L.trimM); hoop(S, top - 0.16, 0.04, 1.03, L.trimL);
    },
    lightCore(S) {
      inner(S);
      panels(S, [[U + 0.04, top - 0.06, -1.3, 1.3, L.pale], [-0.76, U - 0.04, -0.75, 0.75, L.pale]]);
      for (let i = 0; i < 4; i++) { const a = 0.85 + i * 0.32; panels(S, [[0.3 + i * 0.12, U - 0.04, a, a + 0.12, L.mid, 1.02]]); } // (the ribs, the core lit between)
      panels(S, [[0.9, top - 0.18, 2.1, 2.4, L.pale]]);
      backPlates(S, 0.3, top - 0.2, 2.4 + 2 * G);
      panels(S, [[0.2, U + 0.5, -0.06, 0.06, L.trimL, 1.07]], S.trim); // (the sternum strip)
    },
  };
  /** Drossel's stomacher: a stepped V of trim down the front to a point, a gold line on each step's foot. */
  const stomacher = (S, n = 7) => {
    for (let i = 0; i < n; i++) {
      const y0 = -0.5 + i * ((U + 0.3) / n), y1 = y0 + (U + 0.3) / n - 0.02, h = 0.1 + 0.07 * i;
      panels(S, [[y0, y1, -h, h, i % 2 ? L.trimM : L.trimL, 1.045]], S.trim);
      if (i) S.g.geo(sculpt(panel(band(P, y0 - 0.025, y0, 1.05, 1), -h, h, 22), W), { c: L.gold });
    }
  };
  /** The Medici collar: a fan of trim standing up and out behind the neck, its edge gilt. */
  const collar = (S) => {
    const y = top - 0.12, prof = [[0.42, y], [0.5, y + 0.25], [0.72, y + 0.62], [0.98, y + 0.9]];
    S.trim.geo(shell(prof, 28, PI / 2 + 0.25, PI - 0.5), { c: L.trimL });
    S.g.geo(shell([[0.98, y + 0.88], [1.02, y + 0.93]], 28, PI / 2 + 0.25, PI - 0.5), { c: L.gold });
    S.trim.geo(shell([[0.44, y - 0.04], [0.48, y + 0.06], [0.44, y + 0.14]], 28), { c: L.trimM }); // (the choker round the neck's foot)
    const at = on(0, top - 0.25, 1.05);
    S.g.ring(0.15, 0.035, { at, rot: [PI / 2 - 0.5, 0, 0], c: L.gold }, 20, 4); // (the brooch)
    S.l.ball(0.12, { at: [at[0], at[1], at[2] + 0.03], sc: [1, 1, 0.5], c: labTone(0.3, 0.2) }, 16, 10);
  };
  const drossel = {
    clayCore(S) {
      inner(S);
      panels(S, [[U, top - 0.1, -1.45, 1.45, L.pale], [-0.5, U - 0.04, -1.3, 1.3, L.pale]]);
      backPlates(S, -0.3, top - 0.2, 1.45 + 2 * G);
      stomacher(S); collar(S);
      hoop(S, U + 0.02, 0.025, 1.06, L.gold, S.g); hoop(S, -0.32, 0.03, 1.07, L.gold, S.g);
    },
    kilnCore(S) {
      inner(S);
      panels(S, [[U, top - 0.1, -1.45, 1.45, L.pale], [-0.5, U - 0.04, -1.3, 1.3, L.mid]]);
      backPlates(S, -0.3, top - 0.2, 1.45 + 2 * G, L.mid);
      for (let i = 0; i < 8; i++) { const a = 0.45 + i * 0.32; if (a < PI - gap - 0.1) panels(S, [[-0.45, U + 0.2, a, a + 0.05, L.trimM, 1.05]], S.trim); } // (the boning)
      for (const y of [-0.3, 0.55, U + 0.02]) hoop(S, y, 0.025, 1.06, L.gold, S.g);
      for (let i = 0; i < 6; i++) { const y = 0.0 + i * 0.22; for (const s of [-1, 1]) S.g.ball(0.04, { at: on(PI - gap - 0.05 * s - 0.02, y, 1.06), c: L.gold }, 8, 6); } // (the lacing's eyelets up the back)
      stomacher(S, 6); collar(S);
    },
    lightCore(S) {
      inner(S);
      panels(S, [[U, top - 0.1, -1.0, 1.0, L.pale], [-0.5, U - 0.04, -0.5, 0.5, L.pale]]);
      for (let i = 0; i < 6; i++) { const a = 0.6 + i * 0.3; if (a < PI - gap - 0.1) panels(S, [[-0.4, top - 0.4, a, a + 0.06, L.mid, 1.03]]); } // (the birdcage's bars)
      for (const y of [0.0, 0.8, 1.6]) hoop(S, y, 0.03, 1.04, L.trimM);
      panels(S, [[1.0, top - 0.2, PI - gap - G - 0.35, PI - gap - G, L.pale]]);
      panels(S, [[1.0, WIN[0], PI - gap - G, PI - G, L.pale], [WIN[1], top - 0.15, PI - gap - G, PI - G, L.pale]]);
      stomacher(S, 5); collar(S);
    },
  };
  const build = (D ? drossel : haydee)[id] || (D ? drossel : haydee).clayCore;
  /** The chest plates: a dome each in its joint's frame (+Z out), seated on the shell's front at the plate's height. */
  const B = T.bust, front = (x) => T.d * Math.sqrt(Math.max(0.05, profAt(P, B.y) ** 2 - x * x)) + B.amp * 0.8;
  const bust = {
    at: (s) => [s * B.x, B.y, front(B.x) - B.h * 0.3],
    rot: (s) => [0.12, s * 0.32, 0],
    build(S, s) {
      const r = B.r, h = B.h, dome = shell([[0.001, h], [r * 0.45, h * 0.9], [r * 0.8, h * 0.6], [r * 0.98, h * 0.22], [r, 0.0], [r * 0.9, -0.12]], 32).rotateX(PI / 2);
      S.p.geo(dome, { sc: [1, 0.94, 1], c: L.pale });
      S.g.ring(r * 0.99, D ? 0.03 : 0.035, { at: [0, 0, 0.02], sc: [1, 0.94, 1], c: L.gold }, 36, 4); // (the plate's rim)
      if (id === 'kilnCore') S.trim.geo(shell([[r * 0.62, h * 0.72], [r * 0.7, h * 0.66], [r * 0.62, h * 0.6]], 32).rotateX(PI / 2), { sc: [1, 0.94, 1], c: L.trimM });
      if (D) S.trim.geo(shell([[0.001, h * 1.02], [r * 0.25, h * 0.98], [r * 0.3, h * 0.9]], 20).rotateX(PI / 2), { c: L.trimL }); // (a lace boss)
      S.core.geo(shell([[r * 0.9, -0.1], [r * 0.8, 0.0]], 24).rotateX(PI / 2), { c: L.coreD }); // (the gap under the rim)
    },
  };
  return {
    mounts, prof: P, plan: W, bust,
    chest(S) {
      build(S); sockets(S);
      if (!D) { // Haydee's collar ring and the panel line from the underbust round to the blade
        S.trim.geo(sculpt(shell([[0.32, top - 0.1], [profAt(P, top - 0.1) * 0.92, top - 0.09], [profAt(P, top - 0.1) * 0.96, top + 0.02], [0.36, top + 0.1]], 32), W), { c: L.trimL });
        for (const s of [-1, 1]) tube(S.core, [on(s * 0.2, 0.25, 1.045), on(s * 0.8, 0.9, 1.045), on(s * 1.25, 1.6, 1.04)], 0.022, L.coreD, 16);
      }
    },
    waist(S) {
      ball(S.g, 0.5 * F.joint);
      S.core.lathe([[0.36, -0.05], [0.33, 0.4], [0.36, L.chestBase + 0.1]], { c: L.core }, 24);
      S.trim.lathe([[0.4, 0.18], [0.44, 0.24], [0.4, 0.3]], { c: L.trimM }, 28); // (a thin ring at the wasp waist)
    },
  };
}
