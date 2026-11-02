// ---------------------------------------------------------------------------------------
// A MECH'S LEGS (the part library: progress/mechs/parts.js slot `legs`, one look a leg type, LEG_TYPES): the pelvis and the legs under
// it, each built on joints the legs' rig makes (`ctx.joint`) and posed by its own walk (`pose`), laid out so the hip stands at the
// part's own height (`leg`, or 3 m for treads: world/hangar/mech.js hipOf) and the feet on the ground. Hard surface over a gold ball in
// an ivory cup at every joint (vfx/mechs/parts/kit.js).
//   clayLegs    biped: lathed thighs and thick calves, a knee cop, a terracotta greave, a wedge foot whose toe cap is its own plate;
//               swung as two pendulums on the stride
//   springLegs  reverse joint: a thigh thrown forward, a long shin back to a high heel, the metatarsal down to three toes and a spur;
//               a coiled bronze spring round the knee's axle, its piston beside it
//   crabLegs    tetrapod: four legs off a broad pelvis plate, their knees raised above the body, tapering to points; a crawl, the
//               diagonal pairs stepping together
//   treadLegs   tank: two tread pods under porcelain skirts, gold road wheels turning by the ground covered, a turret ring between
// Prior art: Armored Core's four leg types (biped, reverse joint, tetrapod, tank); Medabots' leg parts (a Medabot's legs its whole way
// of moving: the tank and the multi-legged among them); ED-209's and the Zoids' reverse joints; the Tachikoma's and the Spider Tank's
// splayed legs (Ghost in the Shell; Metal Gear's Gekko for the crawl); a Bandai model kit's tread pods.
//
//   LEG_LOOKS[id](ctx) -> { pose({ gait, walk, kneel, travel }), drop(kneel) (m the body sinks) }
//   ctx = { H, pelvis, joint(name, parent, at, rot) -> Object3D, put(joint, build), ballAt(jointId, obj, r, at?), mats, owned }
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { Piece } from '../../garden/decorpieces/kit.js';
import { MECH_LOOK as L, plate, sidePlate, cup, limb, seam, ball, aimOf, threadGeometry } from './kit.js';

const PI = Math.PI;
const SIDES = [[1, 'L'], [-1, 'R']];
const TASSET = [[-0.38, 0], [0.38, 0], [0.32, -1.15], [-0.27, -1.26]];

/** The biped's and the reverse joint's pelvis: a plate with its belt, the codpiece, the kusazuri's tassets, the hips' cups. */
function pelvis(S, hipX) {
  const { p, g } = S;
  p.geo(plate([[-1.2, 0.38], [1.2, 0.38], [1.32, 0.08], [0.78, -0.58], [-0.78, -0.58], [-1.32, 0.08]], 1.7, 0.12), { c: L.bone });
  p.geo(plate([[-1.26, 0.44], [1.26, 0.44], [1.2, 0.62], [-1.2, 0.62]], 1.82, 0.05), { c: L.terracotta });
  p.geo(plate([[-0.34, 0.3], [0.34, 0.3], [0.27, -0.64], [0, -0.78], [-0.27, -0.64]], 0.22, 0.06), { at: [0, 0, 0.93], c: L.ivory });
  p.geo(cup(0.5), { at: [0, 0.45, 0], c: L.ivory }); // (the waist's cup)
  for (const [s] of SIDES) {
    p.geo(cup(0.58), { at: [s * hipX, -0.35, 0], c: L.ivory });
    p.geo(plate(TASSET, 0.12), { at: [s * 0.8, 0.3, 0.95], rot: [-0.3, s * 0.3, 0], c: L.terracotta });
    p.geo(plate(TASSET, 0.12), { at: [s * 1.42, 0.34, 0.05], rot: [-0.3, s * PI / 2, 0], c: L.ochre });
    p.geo(plate(TASSET, 0.12), { at: [s * 0.76, 0.3, -0.93], rot: [-0.3, PI + s * -0.3, 0], c: L.terracotta });
  }
  seam(g, [[0.1, 0.28, 1.07], [-0.07, 0.0, 1.07], [0.09, -0.32, 1.07], [-0.03, -0.64, 1.02]], 0.03);
}

export const LEG_LOOKS = {
  clayLegs(ctx) {
    const { H, joint, put, ballAt } = ctx, F = 0.52, A = [-0.2, 0.38, -0.18], hipX = 1.0;
    const len = (H - 0.35 - F - 0.1) / (Math.cos(A[0]) + Math.cos(A[0] + A[1])), T = len, Sh = len;
    put(ctx.pelvis, (S) => pelvis(S, hipX));
    const legs = {};
    for (const [s, k] of SIDES) {
      const hip = joint(`hip${k}`, ctx.pelvis, [s * hipX, -0.35, 0], [A[0], 0, s * 0.04]);
      const knee = joint(`knee${k}`, hip, [0, -T, 0], [A[1], 0, 0]);
      const ankle = joint(`ankle${k}`, knee, [0, -Sh, 0], [A[2], 0, -s * 0.04]);
      put(hip, (S) => {
        ball(S.g, 0.58);
        limb(S.p, [[0.5, -0.12], [0.84, -0.22], [0.92, -0.42], [0.86, -0.56], [0.76, -0.58], [0.76, -0.62], [0.84, -0.64], [0.74, -0.88], [0.58, -1.0]], L.bone, T, 0.58, [1, T, 1]);
        S.p.geo(plate([[-0.48, -0.25 * T], [0.48, -0.25 * T], [0.42, -0.82 * T], [0, -0.92 * T], [-0.42, -0.82 * T]], 0.16), { at: [0, 0, 0.84], rot: [0.05, 0, 0], c: L.ivory });
        seam(S.g, [[s * 0.9, -0.3 * T, 0.12], [s * 0.88, -0.5 * T, -0.12], [s * 0.82, -0.75 * T, 0.05]], 0.028);
      });
      put(knee, (S) => {
        ball(S.g, 0.58);
        S.p.geo(plate([[-0.46, 0.32], [0.46, 0.32], [0.52, -0.12], [0, -0.5], [-0.52, -0.12]], 0.18, 0.07), { at: [0, 0, 0.72], rot: [0.15, 0, 0], c: L.ivory });
        limb(S.p, [[0.46, -0.12], [0.78, -0.22], [0.96, -0.42], [0.9, -0.6], [0.78, -0.62], [0.78, -0.66], [0.84, -0.68], [0.66, -0.9], [0.46, -1.0]], L.bone, Sh, 0.46, [1, Sh, 1]);
        S.p.geo(plate([[-0.54, -0.25 * Sh], [0.54, -0.25 * Sh], [0.42, -0.84 * Sh], [-0.42, -0.84 * Sh]], 0.16), { at: [0, 0, 0.86], rot: [-0.06, 0, 0], c: L.terracotta });
      });
      put(ankle, (S) => {
        ball(S.g, 0.46);
        S.p.geo(sidePlate([[-0.8, -F], [0.8, -F], [0.8, -0.1], [0.32, -0.02], [-0.5, -0.1], [-0.8, -0.38]], 1.36, 0.1), { c: L.bone });
        S.p.geo(sidePlate([[0.9, -F], [1.9, -F], [2.02, -0.36], [1.72, -0.24], [0.9, -0.14]], 1.26, 0.1), { c: L.ivory });
        S.p.slab(1.4, 0.1, 2.85, { at: [0, -F - 0.02, 0.6], c: L.slate });
      });
      ballAt(`hip${k}`, hip, 0.58);
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
    const { H, joint, put, ballAt } = ctx, F = 0.36, A = [-0.65, 1.45, -1.05], T = 2.3, M = 1.9, hipX = 1.05;
    const Sh = (H - 0.35 - F - 0.09 - T * Math.cos(A[0]) - M * Math.cos(A[0] + A[1] + A[2])) / Math.cos(A[0] + A[1]);
    put(ctx.pelvis, (S) => pelvis(S, hipX));
    const legs = {};
    for (const [s, k] of SIDES) {
      const hip = joint(`hip${k}`, ctx.pelvis, [s * hipX, -0.35, 0], [A[0], 0, s * 0.05]);
      const knee = joint(`knee${k}`, hip, [0, -T, 0], [A[1], 0, 0]);
      const ankle = joint(`ankle${k}`, knee, [0, -Sh, 0], [A[2], 0, 0]);
      const toe = joint(`toe${k}`, ankle, [0, -M, 0], [-(A[0] + A[1] + A[2]), 0, -s * 0.05]);
      put(hip, (S) => {
        ball(S.g, 0.6);
        limb(S.p, [[0.5, -0.1], [0.92, -0.25], [0.98, -0.5], [0.84, -0.62], [0.84, -0.68], [0.9, -0.72], [0.7, -0.92], [0.56, -1.0]], L.bone, T, 0.55, [1.05, T, 1.1]);
        S.p.geo(plate([[-0.5, -0.2 * T], [0.5, -0.2 * T], [0.4, -0.85 * T], [-0.4, -0.85 * T]], 0.16), { at: [0, 0, -0.95], c: L.ochre }); // (the haunch's plate, behind)
      });
      put(knee, (S) => {
        ball(S.g, 0.55);
        S.g.geo(threadGeometry(0.72, 4, 0.22, 0.07).rotateY(PI / 2), { at: [0.44, 0, 0], c: L.bronze }); // (the spring, coiled round the knee's axle)
        S.g.cyl(0.08, 0.08, Sh * 0.65, { at: [0, -Sh * 0.4, -0.62], c: L.gold }, 10); // (its piston)
        S.p.cyl(0.18, 0.2, Sh * 0.35, { at: [0, -Sh * 0.62, -0.62], c: L.slate }, 14);
        limb(S.p, [[0.44, -0.08], [0.66, -0.2], [0.62, -0.55], [0.5, -0.6], [0.5, -0.65], [0.55, -0.68], [0.44, -0.92], [0.38, -1.0]], L.bone, Sh, 0.42, [1, Sh, 1]);
        S.p.geo(plate([[-0.4, -0.15 * Sh], [0.4, -0.15 * Sh], [0.3, -0.88 * Sh], [-0.3, -0.88 * Sh]], 0.14), { at: [0, 0, 0.6], c: L.terracotta });
      });
      put(ankle, (S) => {
        ball(S.g, 0.42);
        limb(S.p, [[0.36, -0.1], [0.5, -0.3], [0.44, -0.8], [0.32, -1.0]], L.ivory, M, 0.36, [1, M, 1]);
      });
      put(toe, (S) => {
        ball(S.g, 0.36);
        for (const a of [-0.45, 0, 0.45]) S.p.geo(sidePlate([[0, -F], [1.5, -F], [1.62, -0.18], [0.2, 0.12]], 0.36, 0.08), { rot: [0, a, 0], c: L.bone });
        S.p.geo(sidePlate([[0, -F], [-0.9, -F], [-0.4, 0.05]], 0.3, 0.06), { c: L.ivory }); // (the spur)
      });
      ballAt(`hip${k}`, hip, 0.6);
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
    const { H, joint, put, ballAt } = ctx, hy = -0.2, up = [1.1, 1.9], out = 2.7;
    put(ctx.pelvis, (S) => {
      const { p, g } = S;
      p.lathe([[0.001, -0.55], [1.2, -0.5], [1.7, -0.25], [1.75, 0.1], [1.4, 0.4], [0.6, 0.55], [0.001, 0.58]], { sc: [1, 1, 0.85], c: L.bone }, 32); // (the pelvis's shell)
      p.ring(1.74, 0.06, { at: [0, -0.08, 0], sc: [1, 1, 0.85], c: L.umber }, 36, 4);
      p.geo(cup(0.5), { at: [0, 0.45, 0], c: L.ivory });
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
        put(root, (S) => { S.p.geo(cup(0.5).rotateX(-PI / 2), { at: [0, 0, -0.1], c: L.ivory }); });
        put(upper, (S) => {
          ball(S.g, 0.5);
          limb(S.p, [[0.45, -0.1], [0.7, -0.3], [0.66, -0.7], [0.5, -1.0]], L.bone, Lu, 0.45, [1, Lu, 0.9]);
          S.p.geo(plate([[-0.32, -0.2 * Lu], [0.32, -0.2 * Lu], [0.24, -0.8 * Lu], [-0.24, -0.8 * Lu]], 0.12), { at: [0, 0, 0.6], c: L.terracotta });
        });
        put(lower, (S) => {
          ball(S.g, 0.45);
          S.p.lathe([[0.45, -0.1], [0.62, -0.5], [0.55, -1.4], [0.36, -Ll * 0.75], [0.18, -Ll + 0.3], [0.001, -Ll + 0.05]], { c: L.ivory }, 28);
          S.p.ring(0.6, 0.05, { at: [0, -0.95, 0], c: L.umber }, 28, 4);
          ball(S.g, 0.22, [0, -Ll + 0.2, 0], L.bronze);
        });
        ballAt(`hip${k}`, upper, 0.5);
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
      p.lathe([[0.001, -0.6], [1.5, -0.55], [1.7, -0.3], [1.6, 0.25], [0.8, 0.45], [0.001, 0.5]], { c: L.bone }, 32); // (the turret's base)
      g.ring(1.62, 0.07, { at: [0, -0.05, 0], c: L.gold }, 40, 5); // (the turret ring)
      p.geo(cup(0.5), { at: [0, 0.45, 0], c: L.ivory });
      for (const [s] of SIDES) { p.geo(plate([[-0.5, 0.2], [0.5, 0.2], [0.4, -0.3], [-0.4, -0.3]], 1.4, 0.08), { at: [s * 1.5, -0.6, 0], rot: [0, PI / 2, 0], c: L.slate }); p.geo(cup(0.42).rotateZ(-s * PI / 2), { at: [s * 1.7, -0.75, 0], c: L.ivory }); }
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
        p.geo(sidePlate(stad, w, 0.1), { c: L.umber }); // (the tread)
        p.geo(sidePlate(stad.map(([z, y]) => [z * 0.94, y * 0.9]), w + 0.1, 0.04), { c: L.slate }); // (its links' face)
        for (let i = 0; i < 14; i++) p.slab(w + 0.16, 0.08, 0.22, { at: [0, R + 0.02, -len / 2 + R + i * ((len - 2 * R) / 13)], c: L.umber }); // (cleats on top)
        p.geo(sidePlate([[-len / 2 + 0.3, 0.1], [len / 2 - 0.1, 0.1], [len / 2 + 0.25, 0.75], [len / 2 - 0.4, 1.45], [-len / 2 + 0.6, 1.45], [-len / 2 - 0.1, 0.8]], 0.16, 0.06), { at: [s * (w / 2 + 0.2), 0, 0], c: L.bone }); // (the skirt)
        p.geo(sidePlate([[-len / 2 + 0.6, 1.3], [len / 2 - 0.4, 1.3], [len / 2 - 0.7, 1.6], [-len / 2 + 0.9, 1.6]], w + 0.5, 0.06), { at: [s * 0.1, 0, 0], c: L.ivory }); // (the fender)
        p.slab(0.18, 0.08, len - 1.2, { at: [s * (w / 2 + 0.3), 0.55, 0], c: L.umber }); // (a groove along the skirt)
        ball(g, 0.42, [-s * 0.5, 1.0, 0]); S.p.slab(0.5, 0.5, 1.2, { at: [-s * 0.4, 1.0, 0], c: L.slate }); // (the axle's block)
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
