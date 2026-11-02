// ---------------------------------------------------------------------------------------
// A MECH'S LEGS (the part library: progress/mechs/parts.js slot `legs`, one look a leg type, LEG_TYPES): the pelvis and the legs under
// it, each built on joints the legs' rig makes (`ctx.joint`) and posed by its own walk (`pose`), laid out so the hip stands at the
// part's own height (`leg`, or 3 m for treads: world/hangar/mech.js hipOf) and the feet on the ground. Hard surface over a gold ball in
// an ivory cup at every joint (vfx/mechs/parts/kit.js), the limbs lathed over the interstitial's column, their plates curved round them.
//   clayLegs    biped: lathed thighs and thick calves, a knee cop, a curved greave wrapping the shin, a rounded sabaton of lames with its
//               toe cap; swung as two pendulums on the stride; the kusazuri riding the thighs; the codpiece a Lachryma tank in its guard
//   springLegs  reverse joint: a thigh thrown forward, a long shin back to a high heel, the metatarsal down to three toes and a spur;
//               a coiled bronze spring round the knee's axle, its piston beside it
//   crabLegs    tetrapod: four legs off a broad pelvis plate, their knees raised above the body, tapering to points; a crawl, the
//               diagonal pairs stepping together
//   treadLegs   tank: two tread pods under porcelain skirts, gold road wheels turning by the ground covered, a turret ring between
// The refire (South, 2026-11-02): every articulation ball the Courier's skin under a clear shell (kit.js `jointBall`), each registered
// with the body (`ballAt`) so its Lachryma stands in it (vfx/mechs/hydraulics.js); the pelvis's top a socket with a trim lip the dantian
// sits in, seen whole from the front, the belt lowered and opened under it; the biped's knee cop sculpted (parts/sdf.js: a central ridge between two
// concave wings, a boss at its heart); the calves (the lower leg's girth) 15% slimmer, so the hero reads top-heavy.
// The feminine forms' legs are their own (femlegs.js FEM_LEGS, every type rebuilt in each).
// Prior art: Armored Core's four leg types (biped, reverse joint, tetrapod, tank); Medabots' leg parts; ED-209's and the Zoids'
// reverse joints; the Tachikoma's and the Spider Tank's splayed legs (Ghost in the Shell; Metal Gear's Gekko for the crawl); a Bandai
// model kit's tread pods; the ō-yoroi's kusazuri and the Gothic sabaton and greave.
//
//   LEG_LOOKS[id](ctx) -> { pose({ gait, walk, kneel, travel }), drop(kneel) (m the body sinks) }
//   ctx = { H, F (the form), pelvis, joint(name, parent, at, rot) -> Object3D, put(joint, build), ballAt(jointId, obj, r, at?), mats, owned }
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { Piece } from '../../garden/decorpieces/kit.js';
import { MECH_LOOK as L, plate, sidePlate, shell, seam, ball, jointBall, aimOf, threadGeometry, band, curved } from './kit.js';
import { blend, carve, meet, ellipsoid, capsule } from './sdf.js';
import { sideSculpt, aoTone, socket, limbS } from './arms.js';
import { DANTIAN } from './cores.js';

const PI = Math.PI;
const SIDES = [[1, 'L'], [-1, 'R']];
/** The calves' girth on the hero (South, 2026-11-02: 15% slimmer, his top-heaviness): the lower leg's radii, never its length. */
const CALF = 0.85;
const up = (prof) => [...prof].reverse();
/** A plate curved round a limb's front (phi 0 +- half), from its own unit profile, between unit heights y0 and y1, scaled sc. */
const wrap = (P, prof, y0, y1, half, sc, c, k = 1.1, th = 0.09, mid = 0) => P.geo(curved(band(up(prof), y0, y1, k, 8), th, mid - half, mid + half, 14), { sc, c });

/** The codpiece tank (South, 2026-11-02: "making the male mecha's secondary lachryma tank a codpiece? I think its only fair we make
 *  both genders of mecha exaggerated"): a glass Lachryma tank (its radius, its centre in the pelvis's frame) cupped in a heavy
 *  sculpted porcelain guard and seen through an almond window in its front; well below the dantian's lip, so the two never read as
 *  one. The legs register it (`codpiece`) so the hydraulics fill and slosh it. */
export const COD_TANK = { r: 0.44, at: [0, -0.46, 1.3] };
/** The guard as one sculpt: a teardrop cup swelling down out of the hip shell and narrowing below (so the thighs pass it at full
 *  stride), a fauld's lip flared round its top under the belt, a keel down its middle below the window, its lower tip rolled; the tank
 *  seen through an almond window cut in its front, a bead round the window. */
export const COD_GUARD = (() => {
  const [, ty, tz] = COD_TANK.at, r = COD_TANK.r;
  const narrow = (y) => 1 - 0.6 * Math.min(1, Math.max(0, -(y - ty) / (r + 0.2))); // (its width falling away below the tank's middle)
  const cupE = ellipsoid([0, ty - 0.04, tz - 0.06], [r + 0.11, r + 0.24, r + 0.16]);
  const outer = (x, y, z) => { const k = narrow(y); return cupE(x / k, y, z) * k; };
  let f = blend(0.16, outer, ellipsoid([0, -0.08, 0.92], [0.46, 0.26, 0.32])); // (swelling down out of the hip shell)
  f = blend(0.06, f, ellipsoid([0, -0.02, 0.98], [0.64, 0.08, 0.4])); // (the fauld's lip, flared under the belt)
  f = blend(0.06, f, capsule([0, ty - r * 0.75, tz + r + 0.04], [0, ty - r - 0.24, tz + 0.06], 0.065)); // (the keel)
  f = blend(0.05, f, ellipsoid([0, ty - r - 0.26, tz + 0.02], [0.17, 0.07, 0.17])); // (its lower tip, rolled)
  f = meet(0.06, f, (x, y, z) => (y < -0.25 ? 1.02 - z : -1)); // (its back cut away below the hip shell: the thighs swing past it)
  const almond = (x, y) => Math.max(Math.hypot(x - 0.13, y - ty) - 0.4, Math.hypot(x + 0.13, y - ty) - 0.4); // (a vesica 0.54 wide, 0.76 high)
  const bead = (x, y, z) => Math.max(Math.abs(almond(x, y)) - 0.04, Math.abs(outer(x, y, z)) - 0.055, tz - z);
  f = blend(0.025, f, bead); // (the bezel's bead round the window)
  f = carve(0.03, f, (x, y, z) => Math.max(almond(x, y), tz + 0.05 - z)); // (the window)
  return carve(0.03, f, (x, y, z) => Math.hypot(x, y - ty, z - tz) - r - 0.025); // (the tank's seat)
})();
/** The codpiece: the guard (one sculpt) and the tank in it (the skin's heart, the glass). */
function codpiece(S) {
  const { r, at } = COD_TANK;
  sideSculpt(S.p, COD_GUARD, [[-0.7, -1.25, 0.6], [0.7, 0.12, 1.95]], 0.05, { key: 'legs.codguard5', tone: aoTone(COD_GUARD, L.pale, L.mid, 0.07) });
  S.core.ball(r * 0.36, { at, c: 0xffffff }, 18, 12); S.j.ball(r, { at, c: 0xffffff }, 30, 20);
}

/** The biped's and the reverse joint's pelvis: a rounded hip shell with its belt, the codpiece tank, the hips' sculpted sockets. (The
 *  kusazuri ride the thighs: `faulds`.) */
function pelvis(S, hipX, F) {
  const { p } = S, w = F.hips;
  p.lathe([[0.001, -0.62], [0.8, -0.58], [1.22, -0.3], [1.32, 0.05], [1.24, 0.3], [1.12, 0.4], [1.02, 0.37], [0.88, 0.2], [0.62, -0.05], [0.001, -0.12]], { sc: [w, 1, 0.72], c: L.pale }, 32); // (the hip shell, its top a socket the dantian sits in)
  S.trim.ring(1.08, 0.04, { at: [0, 0.4, 0], sc: [w, 1, 0.73], c: L.trimM }, 40, 5); // (the socket's lip, in trim: no gold wire round the dantian)
  S.trim.geo(curved([[1.3, 0.14], [1.34, 0.24], [1.28, 0.34]], 0.1, 0.42, PI * 2 - 0.42, 6), { sc: [w, 1, 0.74], c: L.trimM }); // (the belt, open at the front under the dantian)
  codpiece(S);
  for (const [s] of SIDES) socket(p, 0.58 * F.joint, { at: [s * hipX, -0.35, 0] });
}
/** The kusazuri as three lames hung on the outside of a thigh, riding its joint (so the stride never drives one into the thigh or
 *  the hip ball: South, 2026-11-02, "the tassets are clipping into the hips"), each curved round the thigh rad out from the joint's
 *  axis, flaring as it falls and lapping the one below, its foot rimmed in gold; the top lame starts at the belt's height. */
function faulds(S, s, rad = 1.12) {
  const mid = s * PI / 2, half = 0.9;
  for (let i = 0; i < 3; i++) {
    const y0 = 0.35 - i * 0.42, y1 = y0 - 0.58, r0 = rad + i * 0.05, T = [[r0, y0], [r0 + 0.06, (y0 + y1) / 2], [r0 + 0.13, y1]];
    S.trim.geo(curved(T, 0.08, mid - half, mid + half, 12), { c: i % 2 ? L.trimM : L.trimL });
    S.g.geo(curved([[r0 + 0.14, y1 - 0.01], [r0 + 0.145, y1 + 0.05]], 0.03, mid - half, mid + half, 12), { c: L.gold });
  }
}
/** A rounded sabaton: a sole, three overlapping lames over the instep and a toe cap, the ankle's guard. */
function foot(S, F, fh) {
  const { p, g } = S;
  p.geo(shell([[0.001, -0.08], [0.98, -0.06], [1.0, 0.1], [0.82, 0.55], [0.4, 0.86], [0.001, 0.92]], 28), { at: [0, -fh, 0.45], sc: [0.66, 0.6, 1.5], c: L.mid }); // (the sole's shell)
  for (let i = 0; i < 3; i++) p.geo(curved([[0.95, 0], [1.0, 0.25], [0.86, 0.55]], 0.08, -PI / 2 - 0.1, PI / 2 + 0.1, 12), { at: [0, -fh + 0.1 + i * 0.08, 0.5 + i * 0.36], rot: [-0.35 - i * 0.18, 0, 0], sc: [0.68, 0.7, 0.7], c: i % 2 ? L.mid : L.pale }); // (the lames)
  p.geo(shell([[0.001, 0], [0.62, 0.02], [0.66, 0.25], [0.5, 0.5], [0.001, 0.62]], 24), { at: [0, -fh + 0.05, 1.55], rot: [PI / 2 - 0.25, 0, 0], sc: [1.0, 0.9, 0.75], c: L.pale }); // (the toe cap)
  g.geo(curved([[0.64, 0.02], [0.67, 0.08]], 0.04, 0, PI * 2, 8), { at: [0, -fh + 0.05, 1.55], rot: [PI / 2 - 0.25, 0, 0], sc: [1.0, 0.9, 0.75], c: L.gold });
  S.trim.geo(curved([[0.62, -0.25], [0.68, 0.05], [0.6, 0.3]], 0.08, 0, PI * 2, 6), { c: L.trimM }); // (the ankle's guard)
  S.p.slab(1.25, 0.1, 2.7, { at: [0, -fh - 0.02, 0.6], c: L.dark }); // (the sole)
}

/** The biped's knee cop as one sculpt: a shield over the knee's front, a ridge down its middle between two concave wings that turn
 *  back round the joint, a boss swelling at its heart. */
const KNEE_COP = (() => {
  const cop = carve(0.05, ellipsoid([0, 0.0, 0.12], [0.56, 0.48, 0.42]), ellipsoid([0, -0.02, -0.06], [0.5, 0.44, 0.4])); // (a cupped shell)
  let f = blend(0.06, cop, capsule([0, 0.42, 0.42], [0, -0.42, 0.42], 0.06), ellipsoid([0, 0.02, 0.5], [0.13, 0.15, 0.08]));
  f = carve(0.06, f, ellipsoid([0.3, 0, 0.62], [0.17, 0.34, 0.14]), ellipsoid([-0.3, 0, 0.62], [0.17, 0.34, 0.14])); // (the wings' hollows)
  return f;
})();

export const LEG_LOOKS = {
  clayLegs(ctx) {
    const { H, F, joint, put, ballAt } = ctx, FH = 0.52, A = [-0.2, 0.38, -0.18], hipX = 1.0, j = F.joint, r = F.limb;
    const len = (H - 0.35 - FH - 0.1) / (Math.cos(A[0]) + Math.cos(A[0] + A[1])), T = len, Sh = len;
    const TH = [[0.5, -0.12], [0.84, -0.22], [0.92, -0.42], [0.86, -0.56], [0.76, -0.58], [0.76, -0.62], [0.84, -0.64], [0.74, -0.88], [0.58, -1.0]];
    const SH = [[0.46, -0.12], [0.78, -0.22], [0.96, -0.42], [0.9, -0.6], [0.78, -0.62], [0.78, -0.66], [0.84, -0.68], [0.66, -0.9], [0.46, -1.0]];
    put(ctx.pelvis, (S) => pelvis(S, hipX, F)); ballAt('codpiece', ctx.pelvis, COD_TANK.r, COD_TANK.at); // (the codpiece's tank: the hydraulics fill it)
    const legs = {};
    for (const [s, k] of SIDES) {
      const hip = joint(`hip${k}`, ctx.pelvis, [s * hipX, -0.35, 0], [A[0], 0, s * 0.04]);
      const knee = joint(`knee${k}`, hip, [0, -T, 0], [A[1], 0, 0]);
      const ankle = joint(`ankle${k}`, knee, [0, -Sh, 0], [A[2], 0, -s * 0.04]);
      put(hip, (S) => {
        jointBall(S, 0.58 * j);
        limbS(S.p, TH, L.pale, T, 0.58 * j, [r, T, r], true, S);
        faulds(S, s);
        if (F.grooves) { wrap(S.p, TH, -0.86, -0.24, 0.85, [r, T, r], L.mid); seam(S.g, [[s * 0.9 * r, -0.3 * T, 0.12], [s * 0.88 * r, -0.5 * T, -0.12], [s * 0.82 * r, -0.75 * T, 0.05]], 0.028); }
      });
      put(knee, (S) => {
        jointBall(S, 0.58 * j);
        sideSculpt(S.trim, KNEE_COP, [[-0.62, -0.5, -0.1], [0.62, 0.55, 0.78]], 0.065, { key: 'legs.clay.kneecop', at: [0, 0, 0.16 * r], tone: aoTone(KNEE_COP, L.trimL, L.trimD, 0.06) }); // (the knee cop)
        const c = r * CALF;
        limbS(S.p, SH, L.pale, Sh, 0.46 * j, [c, Sh, c], true, S);
        wrap(S.p, SH, -0.86, -0.18, 1.15, [c, Sh, c], L.mid, 1.08, 0.1); // (the greave)
        if (F.grooves) wrap(S.trim, SH, -0.84, -0.8, 1.2, [c, Sh, c], L.trimM, 1.12, 0.05);
      });
      put(ankle, (S) => { jointBall(S, 0.46 * j); foot(S, F, FH); });
      ballAt(`hip${k}`, hip, 0.58 * j); ballAt(`knee${k}`, knee, 0.58 * j); ballAt(`ankle${k}`, ankle, 0.46 * j);
      legs[k] = { hip, knee, ankle };
    }
    return {
      drop: (kn) => kn * H * 0.42,
      pose({ gait, walk, kneel }) {
        const sw = 0.38 * walk * Math.sin(PI * gait);
        for (const [s, k] of SIDES) {
          const { hip, knee, ankle } = legs[k], phase = s > 0 ? sw : -sw, lead = s > 0 ? 1 : 0;
          hip.rotation.x = A[0] - phase - kneel * (lead ? 1.1 : 0.3);
          knee.rotation.x = A[1] + Math.max(0, phase) * 0.9 + kneel * (lead ? 1.5 : 1.9);
          ankle.rotation.x = A[2] - Math.max(0, phase) * 0.3 - kneel * (lead ? 0.4 : 0.6);
        }
      },
    };
  },

  springLegs(ctx) {
    const { H, joint, put, ballAt } = ctx, FF = ctx.F, F = 0.36, A = [-0.65, 1.45, -1.05], T = 2.3, M = 1.9, hipX = 1.05, r = FF.limb, j = FF.joint;
    const Sh = (H - 0.35 - F - 0.09 - T * Math.cos(A[0]) - M * Math.cos(A[0] + A[1] + A[2])) / Math.cos(A[0] + A[1]);
    put(ctx.pelvis, (S) => pelvis(S, hipX, FF)); ballAt('codpiece', ctx.pelvis, COD_TANK.r, COD_TANK.at);
    const legs = {};
    for (const [s, k] of SIDES) {
      const hip = joint(`hip${k}`, ctx.pelvis, [s * hipX, -0.35, 0], [A[0], 0, s * 0.05]);
      const knee = joint(`knee${k}`, hip, [0, -T, 0], [A[1], 0, 0]);
      const ankle = joint(`ankle${k}`, knee, [0, -Sh, 0], [A[2], 0, 0]);
      const toe = joint(`toe${k}`, ankle, [0, -M, 0], [-(A[0] + A[1] + A[2]), 0, -s * 0.05]);
      put(hip, (S) => {
        jointBall(S, 0.6 * j);
        const TH = [[0.5, -0.1], [0.92, -0.25], [0.98, -0.5], [0.84, -0.62], [0.84, -0.68], [0.9, -0.72], [0.7, -0.92], [0.56, -1.0]];
        limbS(S.p, TH, L.pale, T, 0.55 * j, [1.05 * r, T, 1.1 * r], true, S);
        wrap(S.trim, TH, -0.85, -0.2, 0.9, [1.05 * r, T, 1.1 * r], L.trimM, 1.1, 0.1, PI); // (the haunch's plate, behind)
        faulds(S, s, 1.2);
      });
      put(knee, (S) => {
        jointBall(S, 0.55 * j);
        S.g.geo(threadGeometry(0.72 * r, 4, 0.22, 0.07).rotateY(PI / 2), { at: [0.44 * r, 0, 0], c: L.bronze }); // (the spring, coiled round the knee's axle)
        S.g.cyl(0.08, 0.08, Sh * 0.65, { at: [0, -Sh * 0.4, -0.62], c: L.gold }, 10); // (its piston)
        S.core.cyl(0.18, 0.2, Sh * 0.35, { at: [0, -Sh * 0.62, -0.62], c: L.coreD }, 14);
        const SH = [[0.44, -0.08], [0.66, -0.2], [0.62, -0.55], [0.5, -0.6], [0.5, -0.65], [0.55, -0.68], [0.44, -0.92], [0.38, -1.0]];
        limbS(S.p, SH, L.pale, Sh, 0.42 * j, [r * CALF, Sh, r * CALF], true, S);
        wrap(S.p, SH, -0.88, -0.15, 1.0, [r * CALF, Sh, r * CALF], L.mid, 1.1, 0.1); // (the greave)
      });
      put(ankle, (S) => {
        jointBall(S, 0.42 * j);
        limbS(S.p, [[0.36, -0.1], [0.5, -0.3], [0.44, -0.8], [0.32, -1.0]], L.mid, M, 0.36 * j, [r, M, r], true, S);
      });
      put(toe, (S) => {
        jointBall(S, 0.36 * j);
        for (const a of [-0.45, 0, 0.45]) S.p.geo(sidePlate([[0, -F], [1.5, -F], [1.62, -0.18], [0.2, 0.12]], 0.36 * r, 0.08), { rot: [0, a, 0], c: L.pale });
        S.trim.geo(sidePlate([[0, -F], [-0.9, -F], [-0.4, 0.05]], 0.3 * r, 0.06), { c: L.trimM }); // (the spur)
      });
      ballAt(`hip${k}`, hip, 0.6 * j); ballAt(`knee${k}`, knee, 0.55 * j); ballAt(`ankle${k}`, ankle, 0.42 * j); ballAt(`toe${k}`, toe, 0.36 * j);
      legs[k] = { hip, knee, ankle, toe };
    }
    return {
      drop: (kn) => kn * H * 0.35,
      pose({ gait, walk, kneel }) {
        const sw = 0.32 * walk * Math.sin(PI * gait);
        for (const [s, k] of SIDES) {
          const { hip, knee, ankle, toe } = legs[k], ph = s > 0 ? sw : -sw;
          hip.rotation.x = A[0] - ph - kneel * 0.5;
          knee.rotation.x = A[1] + Math.max(0, ph) * 0.6 + kneel * 0.6;
          ankle.rotation.x = A[2] - Math.max(0, ph) * 0.4 - kneel * 0.3;
          toe.rotation.x = -(hip.rotation.x + knee.rotation.x + ankle.rotation.x);
        }
      },
    };
  },

  crabLegs(ctx) {
    const { H, joint, put, ballAt } = ctx, r = ctx.F.limb, j = ctx.F.joint, hy = -0.2, up = [1.1, 1.9], out = 2.7;
    put(ctx.pelvis, (S) => {
      const { p, g } = S;
      p.lathe([[0.001, -0.55], [1.2, -0.5], [1.7, -0.25], [1.75, 0.1], [1.4, 0.4], [0.6, 0.55], [0.001, 0.58]], { sc: [ctx.F.hips ** 0.5, 1, 0.85], c: L.pale }, 32); // (the pelvis's shell)
      g.ring(1.745, 0.018, { at: [0, -0.08, 0], sc: [ctx.F.hips ** 0.5, 1, 0.85], c: L.gold }, 48, 4); // (a fine gold inlay)
      socket(p, DANTIAN.r * 0.95, { at: [0, 0.45 - DANTIAN.r * 0.3, 0], rot: [PI, 0, 0] }); // (the dantian's socket)
      g.ring(1.0, 0.05, { at: [0, 0.5, 0], sc: [1, 1, 0.85], c: L.gold }, 32, 4);
    });
    const legs = [];
    for (const [s, k] of SIDES) {
      const side = joint(`hip${k}`, ctx.pelvis, [0, 0, 0]);
      for (const f of [1, -1]) {
        const at = [s * 1.2, hy, f * 1.0], yaw = Math.atan2(at[0], at[2]);
        const root = joint(`leg${k}${f > 0 ? 'F' : 'B'}`, side, at, [0, yaw, 0]);
        const Lu = Math.hypot(...up), a1 = aimOf(up[0], up[1]);
        const upper = joint(`upper${k}${f > 0 ? 'F' : 'B'}`, root, [0, 0, 0], [a1, 0, 0]);
        const kneeY = H + hy + up[0], dz = out - up[1], Ll = Math.hypot(kneeY - 0.25, dz), a2 = aimOf(-(kneeY - 0.25), dz);
        const lower = joint(`lower${k}${f > 0 ? 'F' : 'B'}`, upper, [0, -Lu, 0], [a2 - a1, 0, 0]);
        put(root, (S) => { socket(S.p, 0.5, { at: [0, 0, -0.1], rot: [-PI / 2, 0, 0] }); });
        put(upper, (S) => {
          jointBall(S, 0.5 * j);
          const UP = [[0.45, -0.1], [0.7, -0.3], [0.66, -0.7], [0.5, -1.0]];
          limbS(S.p, UP, L.pale, Lu, 0.45 * j, [r, Lu, 0.9 * r], true, S);
          wrap(S.trim, UP, -0.8, -0.2, 0.9, [r, Lu, 0.9 * r], L.trimM);
        });
        put(lower, (S) => {
          jointBall(S, 0.45 * j);
          S.p.lathe([[0.45, -0.1], [0.62, -0.5], [0.55, -1.4], [0.36, -Ll * 0.75], [0.18, -Ll + 0.3], [0.001, -Ll + 0.05]], { sc: [r * CALF, 1, r * CALF], c: L.mid }, 28);
          S.trim.ring(0.6 * r * CALF, 0.05, { at: [0, -0.95, 0], c: L.trimD }, 28, 4);
          ball(S.g, 0.22, [0, -Ll + 0.2, 0], L.bronze);
        });
        ballAt(`hip${k}`, upper, 0.5 * j); ballAt(`knee${k}`, lower, 0.45 * j);
        legs.push({ root, upper, lower, yaw, a1, a2, pair: (s > 0) === (f > 0) ? 0 : 1 });
      }
    }
    return {
      drop: (kn) => kn * 0.8,
      pose({ gait, walk, kneel }) {
        const ph = Math.sin(PI * gait);
        for (const Lg of legs) {
          const w = (Lg.pair ? ph : -ph) * walk;
          Lg.root.rotation.y = Lg.yaw + 0.22 * w;
          Lg.upper.rotation.x = Lg.a1 - 0.22 * Math.max(0, w) + kneel * 0.15;
          Lg.lower.rotation.x = Lg.a2 - Lg.a1 + 0.1 * Math.max(0, w) - kneel * 0.1;
        }
      },
    };
  },

  treadLegs(ctx) {
    const { H, joint, put, ballAt, mats, owned } = ctx, len = 6.2, R = 1.2, w = 1.5, podX = 2.2, podY = 1.25 - H;
    put(ctx.pelvis, (S) => {
      const { p, g } = S;
      p.lathe([[0.001, -0.6], [1.5, -0.55], [1.7, -0.3], [1.6, 0.25], [0.8, 0.45], [0.001, 0.5]], { c: L.pale }, 32); // (the turret's base)
      g.ring(1.62, 0.07, { at: [0, -0.05, 0], c: L.gold }, 40, 5); // (the turret ring)
      socket(p, DANTIAN.r * 0.95, { at: [0, 0.45 - DANTIAN.r * 0.3, 0], rot: [PI, 0, 0] }); // (the dantian's socket)
      for (const [s] of SIDES) { S.core.geo(plate([[-0.5, 0.2], [0.5, 0.2], [0.4, -0.3], [-0.4, -0.3]], 1.4, 0.08), { at: [s * 1.5, -0.6, 0], rot: [0, PI / 2, 0], c: L.coreD }); socket(p, 0.42, { at: [s * 1.7, -0.75, 0], rot: [0, 0, -s * PI / 2] }); }
    });
    const wheel = new Piece();
    wheel.cyl(0.5, 0.5, 0.22, { rot: [0, 0, PI / 2], c: L.gold }, 20); wheel.cyl(0.2, 0.2, 0.32, { rot: [0, 0, PI / 2], c: L.bronze }, 12);
    for (let i = 0; i < 6; i++) { const a = (i / 6) * PI * 2; wheel.slab(0.26, 0.06, 0.66, { at: [0.12, 0, 0], rot: [a, 0, 0], c: L.bronze }); }
    const wg = wheel.done(), pods = [], WZ = [-2.2, -1.1, 0, 1.1, 2.2];
    for (const [s, k] of SIDES) {
      const pod = joint(`hip${k}`, ctx.pelvis, [s * podX, podY, 0]);
      const stad = [];
      for (let i = 0; i <= 10; i++) { const a = -PI / 2 + (i / 10) * PI; stad.push([len / 2 - R + Math.cos(a) * R, Math.sin(a) * R]); }
      for (let i = 0; i <= 10; i++) { const a = PI / 2 + (i / 10) * PI; stad.push([-len / 2 + R + Math.cos(a) * R, Math.sin(a) * R]); }
      put(pod, (S) => {
        const { p, g } = S;
        S.core.geo(sidePlate(stad, w, 0.1), { c: L.coreD }); // (the tread)
        p.geo(sidePlate(stad.map(([z, y]) => [z * 0.94, y * 0.9]), w + 0.1, 0.04), { c: L.dark }); // (its links' face)
        for (let i = 0; i < 14; i++) p.slab(w + 0.16, 0.08, 0.22, { at: [0, R + 0.02, -len / 2 + R + i * ((len - 2 * R) / 13)], c: L.dark }); // (cleats on top)
        p.geo(sidePlate([[-len / 2 + 0.3, 0.1], [len / 2 - 0.1, 0.1], [len / 2 + 0.25, 0.75], [len / 2 - 0.4, 1.45], [-len / 2 + 0.6, 1.45], [-len / 2 - 0.1, 0.8]], 0.16, 0.06), { at: [s * (w / 2 + 0.2), 0, 0], c: L.pale }); // (the skirt)
        p.geo(sidePlate([[-len / 2 + 0.6, 1.3], [len / 2 - 0.4, 1.3], [len / 2 - 0.7, 1.6], [-len / 2 + 0.9, 1.6]], w + 0.5, 0.06), { at: [s * 0.1, 0, 0], c: L.mid }); // (the fender)
        S.trim.slab(0.18, 0.08, len - 1.2, { at: [s * (w / 2 + 0.3), 0.55, 0], c: L.trimM }); // (a trim band along the skirt)
        jointBall(S, 0.42, [-s * 0.5, 1.0, 0]); S.core.slab(0.5, 0.5, 1.2, { at: [-s * 0.4, 1.0, 0], c: L.coreD }); // (the axle's block)
        seam(g, [[s * (w / 2 + 0.29), 1.2, -1.6], [s * (w / 2 + 0.29), 0.9, -1.2], [s * (w / 2 + 0.29), 1.0, -0.7]], 0.03);
      });
      const inst = new THREE.InstancedMesh(wg, mats.g, WZ.length); inst.castShadow = true; inst.name = `mech.wheels${k}`; pod.add(inst); owned.push(inst);
      ballAt(`hip${k}`, pod, 0.42, [-s * 0.5, 1.0, 0]);
      pods.push({ s, inst });
    }
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), X = new THREE.Vector3(1, 0, 0), one = new THREE.Vector3(1, 1, 1), at = new THREE.Vector3();
    const spin = (a) => { for (const P of pods) { WZ.forEach((z, i) => { m.compose(at.set(P.s * (w / 2 + 0.12), -0.55, z), q.setFromAxisAngle(X, a), one); P.inst.setMatrixAt(i, m); }); P.inst.instanceMatrix.needsUpdate = true; } };
    spin(0);
    return { drop: () => 0, pose({ travel = 0 }) { spin(travel / 0.5); } };
  },
};
