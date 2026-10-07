// The authored clips (see authoring.js): what the free libraries don't have. Body space: root at
// the feet, facing +Z, Y up, the character's left is +X. Each clip is built from the geometry
// the level gives its contacts (a ladder's rungs, a ledge's lip, a pole's radius), so a tech
// only has to place the body relative to the thing it holds.
import * as THREE from 'three';
import { T } from '../../core/config.js';
import { Author, V3, lerp, smooth, tri } from './authoring.js';
import { authorSkiff } from '../skiff/clips.js';
import { authorBrush } from '../../tools/soulbrush/clips.js';


const DEG = Math.PI / 180;

/** Where the ladder's rungs sit relative to the body: the rung centres are this far in front of the feet. */
export const LADDER = { standoff: 0.42, handX: 0.2, footX: 0.12, handTop: 1.86 };

/** Hanging: the palms are this high above the feet (the body hangs from its hands), and a ledge's face is this far in front of the body. */
export const HANG = { drop: 1.66, wall: 0.24, handX: 0.22, over: 0.05, shimmyCycle: 0.4, barCycle: 0.6 };

/** Poles and ropes: the axis is this far in front of the body's feet (the tech holds the body at pole.r + 0.3 from it), for a 0.08 m radius; a cycle climbs `cycle` metres. */
export const POLE = { axis: 0.38, r: 0.08, cycle: 0.9 };
/** Grate walls: the wall face is at the ladder's distance; a sideways cycle covers `side` metres. */
export const GRATE = { wall: 0.42, side: 0.4 };

export function authorAll(ch) {
  const A = new Author(ch);
  ladder(A, ch);
  hang(A, ch);
  pole(A, ch);
  grate(A, ch);
  authorSkiff(A, ch);
  authorBrush(A, ch);
}

// ---------------------------------------------------------------------------------------
// LADDER: one cycle is two rungs of climbing. Each limb holds a rung (STANCE of the cycle,
// sliding down the body as the body climbs) and then reaches for the rung two above; hands and
// feet run half a cycle apart, the right hand with the left foot. The clip's rate is exactly the
// rate of the climb, so a limb in stance stays on its rung: the tech plays it at
// phase = (climbed height) / (two rung pitches), forward or backward (going down is the same
// cycle in reverse: the planted limbs slide up the body, the swinging ones step down a rung).
// ---------------------------------------------------------------------------------------
function ladder(A, ch) {
  const p = T.tech.ladder.rung, D = LADDER.standoff;
  const STANCE = 0.6; // of a cycle, so all four limbs hold at once around phases 0.05 and 0.55
  const HAND_TOP = LADDER.handTop, FOOT_TOP = HAND_TOP - 4 * p; // (hand and foot rungs are 4 pitches apart)
  const limb = (ph, off) => {
    const s = (((ph - off) % 1) + 1) % 1; // 0 at the start of this limb's stance
    if (s < STANCE) return { h: -2 * p * s, swing: 0, s }; // sliding down the body with the climb
    const k = (s - STANCE) / (1 - STANCE); // 0..1 through the reach
    const e = smooth(0, 1, k);
    return { h: lerp(-2 * p * STANCE, 0, e), swing: Math.sin(Math.PI * k), s };
  };
  const build = function (u) {
    const ph = u;
    // hands: L and R half a cycle apart; feet: the right foot with the left hand
    const lh = limb(ph, 0), rh = limb(ph, 0.5), rf = limb(ph, 0), lf = limb(ph, 0.5);
    const sway = Math.sin(ph * Math.PI * 2); // + when the left hand / right foot are planted high
    // the hips: closer to the ladder, a little lower on the planted side, swaying toward the
    // planted foot, and rising through each push
    this.hips(-sway * 0.025, -0.04 + Math.abs(Math.sin(ph * Math.PI * 2 + 0.6)) * 0.02, 0.24);
    // spine: lean in, twist the shoulders toward the reaching hand
    this.chain([['spine001', 0.34], ['spine002', 0.33], ['spine003', 0.33]], 'x', 12);
    this.chain([['spine001', 0.2], ['spine002', 0.3], ['spine003', 0.5]], 'y', -sway * 7);
    this.chain([['spine004', 0.5], ['head', 0.5]], 'x', -30); // look up the ladder
    this.turn('spine', 'z', sway * 2.5);
    const hand = (side, L) => {
      const sg = side === 'L' ? 1 : -1;
      const pos = V3(sg * LADDER.handX, HAND_TOP + L.h, D - 0.03 - L.swing * 0.06);
      const pole = V3(sg * 0.62, pos.y - 0.42, pos.z - 0.4);
      this.hand(side, pos, pole, V3(0, -0.25, 1), V3(0, -1, 0.25));
      this.curl(side, 0.9 - L.swing * 0.5);
    };
    const foot = (side, L) => {
      const sg = side === 'L' ? 1 : -1;
      const rung = FOOT_TOP + L.h; // the top of the rung under the ball of the foot
      const ankle = V3(sg * LADDER.footX, rung + 0.1, D - 0.14 - L.swing * 0.05);
      const pole = V3(sg * 0.25, ankle.y + 0.35, ankle.z + 0.6);
      this.foot(side, ankle, pole, V3(0, 0.08, 1), 18);
    };
    foot('L', lf); foot('R', rf);
    hand('L', lh); hand('R', rh);
  };
  A.clip('ladderUp', { dur: 1.2, loop: true, base: 'idle', build });

  // the slide: hands and feet on the rails outside the rungs, leaning back a little, dropping
  A.clip('ladderSlide', {
    dur: 0.5, loop: true, base: 'idle',
    build(u) {
      const b = Math.sin(u * Math.PI * 2) * 0.01;
      this.hips(0, -0.1 + b, 0.2);
      this.chain([['spine001', 0.34], ['spine002', 0.33], ['spine003', 0.33]], 'x', 4);
      this.chain([['spine004', 0.5], ['head', 0.5]], 'x', -22);
      for (const side of ['L', 'R']) {
        const sg = side === 'L' ? 1 : -1;
        this.hand(side, V3(sg * 0.3, 1.7, D - 0.05), V3(sg * 0.6, 1.2, D - 0.5), V3(0, 1, 0.3), V3(-sg, 0, 0.2));
        this.curl(side, 1);
        this.foot(side, V3(sg * 0.3, 0.32 + Math.sin(u * 6.28 + sg) * 0.01, D - 0.2), V3(sg * 0.3, 0.6, D + 0.4), V3(0, 0.05, 1), 20);
      }
    },
  });
}

// ---------------------------------------------------------------------------------------
// HANGING: from a ledge (both palms on its top, fingers over the lip, the wall a hand's breadth
// in front of the chest), or from an overhead bar (both hands on it, fingers curled over).
//   hangLedge   idle: a slow dangle, the legs swinging a little
//   hangShimmy  along the ledge to the character's left (mirror it for the right): hands take
//               turns, the planted one sliding back relative to the body; one cycle is
//               HANG.shimmyCycle of travel, so it plays by distance like the ladder
//   hangBar     under a bar, facing along it: idle
//   hangBarGo   hand over hand forward along the bar: HANG.barCycle a cycle
// ---------------------------------------------------------------------------------------
function hang(A, ch) {
  const H = HANG, sw = (u, k = 1) => Math.sin(u * Math.PI * 2 * k);
  // the body common to every hang: stretched from the shoulders, chest toward what it holds
  const body = function (u, sway, lean, twist = 0) {
    this.hips(0, 0.0 - Math.abs(sway) * 0.008, 0.06);
    this.chain([['spine001', 0.34], ['spine002', 0.33], ['spine003', 0.33]], 'x', lean);
    this.chain([['spine001', 0.2], ['spine002', 0.3], ['spine003', 0.5]], 'y', twist);
    this.chain([['spine004', 0.5], ['head', 0.5]], 'x', -12 - lean);
    this.turn('spine', 'z', sway * 1.2);
  };
  const legs = function (u, amp = 1) {
    for (const [side, sg, ph] of [['L', 1, 0], ['R', -1, 0.5]]) {
      const s = sw(u + ph);
      this.foot(side, V3(sg * 0.11, 0.13 + 0.03 * s * amp, -0.05 - 0.06 * s * amp), V3(sg * 0.2, 0.5, 0.6), V3(0, -0.5, 1), -25);
    }
  };
  const ledgeHand = function (side, x, z, curl = 1, lift = 0) {
    const sg = side === 'L' ? 1 : -1;
    this.hand(side, V3(x, H.drop + lift, z), V3(sg * 0.55, 1.15, -0.25), V3(0, -0.15, 1), V3(0, -1, 0.1));
    this.curl(side, curl);
  };

  A.clip('hangLedge', {
    dur: 3, loop: true, base: 'idle',
    build(u) {
      body.call(this, u, sw(u), 16);
      legs.call(this, u, 1);
      ledgeHand.call(this, 'L', H.handX, H.wall + H.over, 0.8);
      ledgeHand.call(this, 'R', -H.handX, H.wall + H.over, 0.8);
    },
  });

  // shimmy: to the character's left (+X). x(planted) slides -X relative to the body.
  A.clip('hangShimmy', {
    dur: 0.9, loop: true, base: 'idle',
    build(u) {
      const S = 0.6, L = H.shimmyCycle; // stance share of a cycle, and the distance one cycle covers
      const hand = (side, off) => {
        const sg = side === 'L' ? 1 : -1;
        const s = (((u - off) % 1) + 1) % 1;
        // planted: slides back by L * S; then reaches forward again by the same
        const x = s < S ? -L * s : lerp(-L * S, 0, smooth(0, 1, (s - S) / (1 - S)));
        const swing = s < S ? 0 : Math.sin(Math.PI * (s - S) / (1 - S));
        ledgeHand.call(this, side, sg * H.handX * 0.9 + x + L * 0.25, H.wall + H.over - swing * 0.04, 1 - swing * 0.6, swing * 0.02);
      };
      body.call(this, u, sw(u), 16, sw(u) * 3);
      this.hips(sw(u) * 0.02, 0, 0);
      legs.call(this, u * 2, 1.6);
      hand('L', 0.5); hand('R', 0);
    },
  });

  // under a bar (facing along it): both hands on it, fingers over
  const barIdle = function (u, sway) {
    body.call(this, u, sway, 9);
    for (const [side, sg] of [['L', 1], ['R', -1]]) {
      this.hand(side, V3(sg * 0.14, H.drop, 0.27 + sg * 0.02), V3(sg * 0.6, 1.2, -0.3), V3(0, 0.2, 1), V3(0, -1, 0.2));
      this.curl(side, 1);
    }
  };
  A.clip('hangBar', {
    dur: 3, loop: true, base: 'idle',
    build(u) {
      barIdle.call(this, u, sw(u));
      legs.call(this, u, 1.2);
    },
  });

  // hand over hand forward: the hands leapfrog along the bar; the body pitches with each reach
  A.clip('hangBarGo', {
    dur: 0.9, loop: true, base: 'idle',
    build(u) {
      const S = 0.55, L = H.barCycle;
      body.call(this, u, sw(u), 9, sw(u) * 6);
      legs.call(this, u * 2, 1.8);
      const hand = (side, off) => {
        const sg = side === 'L' ? 1 : -1;
        const s = (((u - off) % 1) + 1) % 1;
        const z = s < S ? 0.4 - L * s : lerp(0.4 - L * S, 0.4, smooth(0, 1, (s - S) / (1 - S)));
        const swing = s < S ? 0 : Math.sin(Math.PI * (s - S) / (1 - S));
        this.hand(side, V3(sg * 0.1, H.drop + swing * 0.03, z), V3(sg * 0.6, 1.2, z - 0.4), V3(0, 0.2, 1), V3(0, -1, 0.2));
        this.curl(side, 1 - swing * 0.5);
      };
      hand('L', 0); hand('R', 0.5);
    },
  });
}

// ---------------------------------------------------------------------------------------
// POLE / ROPE: a climb in the manner of a rope climb: the hands take turns reaching up the pole
// (fingers round it), the feet clamp it (soles flat against it, knees out) and take turns
// pushing. One cycle is POLE.cycle of climb, played by distance, so the gripping limbs stay put
// on the pole and the body rises past them (backward to descend).
//   poleUp     the climb cycle
//   poleSlide  both hands high and the legs locked round it, dropping
// ---------------------------------------------------------------------------------------
function pole(A, ch) {
  const { axis, r, cycle } = POLE, p = cycle / 2;
  const STANCE = 0.6, HAND_TOP = 1.94, FOOT_TOP = 0.9;
  const surf = axis - r;
  const limb = (ph, off) => {
    const s = (((ph - off) % 1) + 1) % 1;
    if (s < STANCE) return { h: -cycle * s, swing: 0 };
    const k = (s - STANCE) / (1 - STANCE), e = smooth(0, 1, k);
    return { h: lerp(-cycle * STANCE, 0, e), swing: Math.sin(Math.PI * k) };
  };
  const handAt = function (side, L, up) {
    const sg = side === 'L' ? 1 : -1;
    const pos = V3(sg * 0.07, up + L.h, surf - 0.01 - L.swing * 0.05);
    this.hand(side, pos, V3(sg * 0.55, pos.y - 0.4, pos.z - 0.35), V3(sg * 0.3, 1, 0.1), V3(0, 0, 1));
    this.curl(side, 1 - L.swing * 0.5);
  };
  const footAt = function (side, L, up) {
    const sg = side === 'L' ? 1 : -1;
    const ankle = V3(sg * 0.09, up + L.h, surf - 0.09 - L.swing * 0.04);
    this.foot(side, ankle, V3(sg * 0.5, ankle.y + 0.15, surf + 0.1), V3(sg * 0.1, 1, 0.25), 0);
  };
  A.clip('poleUp', {
    dur: 1.2, loop: true, base: 'idle',
    build(u) {
      const sway = Math.sin(u * Math.PI * 2);
      this.hips(0, -0.05 + Math.abs(sway) * 0.02, 0.15);
      this.chain([['spine001', 0.34], ['spine002', 0.33], ['spine003', 0.33]], 'x', 8);
      this.chain([['spine001', 0.2], ['spine002', 0.3], ['spine003', 0.5]], 'y', -sway * 6);
      this.chain([['spine004', 0.5], ['head', 0.5]], 'x', -26);
      this.turn('spine', 'z', sway * 2);
      // (the right hand with the left foot: opposite limbs push together, as in any climb)
      footAt.call(this, 'L', limb(u, 0.5), FOOT_TOP);
      footAt.call(this, 'R', limb(u, 0), FOOT_TOP);
      handAt.call(this, 'L', limb(u, 0), HAND_TOP);
      handAt.call(this, 'R', limb(u, 0.5), HAND_TOP);
    },
  });
  A.clip('poleSlide', {
    dur: 0.6, loop: true, base: 'idle',
    build(u) {
      this.hips(0, -0.1, 0.1);
      this.chain([['spine001', 0.34], ['spine002', 0.33], ['spine003', 0.33]], 'x', 6);
      this.chain([['spine004', 0.5], ['head', 0.5]], 'x', -22);
      for (const side of ['L', 'R']) {
        const sg = side === 'L' ? 1 : -1, hi = side === 'L' ? 0.04 : -0.02;
        handAt.call(this, side, { h: hi, swing: 0 }, 1.9);
        footAt.call(this, side, { h: sg * 0.04 + Math.sin(u * 6.28 + sg) * 0.01, swing: 0 }, 0.5);
      }
    },
  });
}

// ---------------------------------------------------------------------------------------
// GRATE WALL, sideways: the hands and feet take turns stepping along the grating toward the
// character's left (play it backward to go right); the planted limbs slide the other way
// relative to the body, one cycle GRATE.side of travel. (Up and down is the ladder cycle:
// the grating has no rungs, but the hands and feet hook it just the same.)
// ---------------------------------------------------------------------------------------
function grate(A, ch) {
  const D = GRATE.wall, L = GRATE.side, S = 0.6;
  const limb = (ph, off) => {
    const s = (((ph - off) % 1) + 1) % 1;
    if (s < S) return { x: -L * s, swing: 0 };
    const k = (s - S) / (1 - S), e = smooth(0, 1, k);
    return { x: lerp(-L * S, 0, e), swing: Math.sin(Math.PI * k) };
  };
  A.clip('grateSide', {
    dur: 1.0, loop: true, base: 'idle',
    build(u) {
      const sway = Math.sin(u * Math.PI * 2);
      this.hips(sway * 0.02, -0.05, 0.2);
      this.chain([['spine001', 0.34], ['spine002', 0.33], ['spine003', 0.33]], 'x', 12);
      this.chain([['spine001', 0.2], ['spine002', 0.3], ['spine003', 0.5]], 'y', sway * 6);
      this.chain([['spine004', 0.5], ['head', 0.5]], 'x', -22);
      for (const [side, sg, off] of [['L', 1, 0], ['R', -1, 0.5]]) {
        const h = limb(u, off), f = limb(u, off + 0.5);
        // (hands and feet on opposite phases: the left hand goes with the right foot)
        const hx = sg * 0.17 + h.x + L * 0.5 - L * 0.28 * 0; // centred around each side
        this.hand(side, V3(sg * 0.17 + h.x + L * 0.3, 1.62, D - 0.03 - h.swing * 0.06), V3(sg * 0.6, 1.2, D - 0.4), V3(0, 1, 0.25), V3(0, 0, 1));
        this.curl(side, 0.9 - h.swing * 0.5);
        const ankle = V3(sg * 0.13 + f.x + L * 0.3, 0.56, D - 0.14 - f.swing * 0.05);
        this.foot(side, ankle, V3(sg * 0.3, ankle.y + 0.3, ankle.z + 0.6), V3(0, 0.1, 1), 18);
      }
    },
  });
}

// ---------------------------------------------------------------------------------------
// Runtime helpers shared by the techs that hold a wall (grate walls, the wall latch).
// ---------------------------------------------------------------------------------------
const wrap1 = (x) => ((x % 1) + 1) % 1;
const _n = new THREE.Vector3(), _q = new THREE.Quaternion(), _p = new THREE.Vector3(), _w = new THREE.Vector3();

/**
 * Play the wall climb on a tech `t` (state kept on it): the ladder cycle by height climbed, the
 * sideways cycle by distance along the wall (vx to the character's left), mixed by which way it
 * is going. Still, the cycle eases to the nearest phase where every limb holds.
 */
export function wallClimb(t, ch, base, dt, active, vx, vy) {
  const C = ch.clips, lad = T.tech.ladder.rung * 2;
  t.cu = (t.cu || 0) + vy * dt / lad;
  t.cs = (t.cs || 0) + vx * dt / GRATE.side;
  if (Math.abs(vy) < 0.1 && Math.abs(vx) < 0.1) {
    const settle = (v) => THREE.MathUtils.damp(v, Math.round((v - 0.05) * 2) / 2 + 0.05, 6, dt);
    t.cu = settle(t.cu); t.cs = settle(t.cs);
  }
  const sh = Math.abs(vx) / (Math.abs(vx) + Math.abs(vy) + 1e-3);
  t.sideW = THREE.MathUtils.damp(t.sideW || 0, sh > 0.05 ? sh : 0, 12, dt);
  const up = C.clips.ladderUp, sd = C.clips.grateSide;
  const pose = C.sample('ladderUp', wrap1(t.cu) * up.dur, ch.P.tmp, true);
  if (t.sideW > 0.001) C.blend(pose, C.sample('grateSide', wrap1(t.cs) * sd.dur, ch.P.tmp2, true), t.sideW);
  C.blend(base, pose, t.w);
}

/** Correct the hands and feet onto a wall (a point on it, and its outward normal) along the normal only: the palms 3 cm off it, the ankles 14 cm. */
export function wallContacts(t, ch, n, wp) {
  const w = t.w;
  const off = (p, gap) => _n.copy(n).multiplyScalar(THREE.MathUtils.clamp(gap - _w.copy(p).sub(wp).dot(n), -0.07, 0.07)).clone();
  for (const s of ['L', 'R']) {
    if (!(s === 'R' && ch.gunHeld)) {
      const arm = ch.arm[s];
      const palm = arm.palmPt.clone().applyMatrix4(arm.hand.matrixWorld);
      arm.hand.getWorldQuaternion(_q);
      ch.reachHand(s, arm.hand.getWorldPosition(_p).add(off(palm, 0.03)), _q.clone(), w);
    }
    const leg = ch.leg[s];
    const foot = leg.foot.getWorldPosition(new THREE.Vector3());
    const fq = leg.foot.getWorldQuaternion(new THREE.Quaternion());
    ch.solveLeg(leg, foot.clone().add(off(foot, 0.14)), leg.shin.getWorldPosition(new THREE.Vector3()));
    ch.setWorldQuat(leg.foot, fq);
  }
}
