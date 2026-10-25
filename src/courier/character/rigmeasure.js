// ---------------------------------------------------------------------------------------
// THE RIG MEASURED (part of courier/character.js): what is read off the Courier's skeleton and clips, once, so the rest can be placed to
// it. `analyseGait` plays a locomotion loop on the body and measures it: its ground speed (the speed the planted foot slides back under
// the hips, so played at speed / ground speed the feet stay put), where the left heel strikes (so every loop can share one phase) and
// each foot's contact curve over the cycle (for foot locking); `contactAt` reads that curve. `measureSoles` reads each foot's soles off
// the skin (the foot IK keeps their lowest point on the floor). `computeSockets` measures the right hand's gun socket and the left
// hand's support grip, and the same mirrored for the gun in the left hand, from the pistol aim pose; `computeHolster` the holster
// socket on the pelvis, across the small of the back.
//
// Prior art: a locomotion clip's ground speed and phase taken from its planted foot and shared by the whole blend (Unreal's sync groups
// and distance matching), footplants found by height and speed (the footskate cleanup of Kovar, Schreiner and Gleicher, 2002).
//
//   analyseGait(ch, name) -> { speed, dur, cycle, off, contact, n }     measureSoles(ch) -> { rest, L, R }
//   contactAt(ch, gait, side, u) -> 0..1     computeSockets(ch)     computeHolster(ch)
//   (ch: the Character, which has a method of each name that calls these)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { T, DEG } from '../../core/config.js';
import { GUN_POINTS } from './gunpoints.js';
import { LR, _m1, smooth } from './scratch.js';

/**
 * Measure a locomotion loop on the Courier. An in-place clip is authored so the
 * planted foot slides back under the hips at the speed the character is meant to
 * travel, so that's the clip's ground speed: played at speed / groundSpeed the feet
 * stay put. Also records where the left heel strikes (so every loop can share one
 * phase) and each foot's contact curve over the cycle (for foot locking).
 */
export function analyseGait(ch, name) {
  const C = ch.clips, c = C.clips[name], B = ch.bones, p = ch.P.tmp;
  ch.root.position.set(0, 0, 0); ch.root.rotation.set(0, 0, 0);
  ch.soles ||= ch.measureSoles(); // (footIK's soles: read once, in the rest pose)
  const fr = [];
  for (let f = 0; f < c.n - 1; f++) {
    ch.applyPose(C.sample(name, f / C.fps, p));
    ch.root.updateMatrixWorld(true);
    const g = (b) => b.getWorldPosition(new THREE.Vector3());
    fr.push({ L: g(B.footL), R: g(B.footR), tL: g(B.toeL), tR: g(B.toeR) });
  }
  const n = fr.length, contact = {};
  let best = -1e9, off = 0, vsum = 0, wsum = 0;
  for (const s of LR) {
    // planted: the lowest point of the foot (heel or toe) near its lowest, and the foot
    // travelling backward under the body (a foot coming down at the end of a swing is
    // low too, but still moving forward)
    const h = fr.map((f) => Math.min(f[s].y - ch.ankleRest, f['t' + s].y - ch.toeRest));
    const lo = Math.min(...h);
    const raw = h.map((y, f) => {
      const dz = fr[(f + 1) % n][s].z - fr[(f + n - 1) % n][s].z;
      return (1 - smooth(0.04, 0.09, y - lo)) * smooth(0, -0.01, dz);
    });
    contact[s] = raw.map((c, f) => (raw[(f + n - 1) % n] + 2 * c + raw[(f + 1) % n]) / 4); // soften the edges
    for (let f = 0; f < n; f++) {
      const w = contact[s][f] > 0.9 ? 1 : 0; // mid-stance only
      if (!w) continue;
      vsum += w * -(fr[(f + 1) % n][s].z - fr[(f + n - 1) % n][s].z) * C.fps / 2;
      wsum += w;
    }
  }
  for (let f = 0; f < n; f++) if (fr[f].L.z - fr[f].R.z > best) { best = fr[f].L.z - fr[f].R.z; off = f / n; }
  const speed = wsum > 0 ? vsum / wsum : 1;
  ch.resetPose();
  return { speed, dur: c.dur, cycle: speed * c.dur, off, contact, n };
}

/** The soles as the skin has them: each foot's skinned vertices (by their strongest bone: foot, toe, heel), those within 4 cm of the
 *  rest pose's lowest densely and the rest thinly, in that bone's own frame, so a posed foot's lowest point is read where the mesh is (a heel struck toe-up goes lower
 *  than its ankle bone says), and `rest`, that lowest point at rest. Read once, in the rest pose. */
export function measureSoles(ch) {
  ch.resetPose();
  ch.root.position.set(0, 0, 0); ch.root.rotation.set(0, 0, 0);
  ch.root.updateMatrixWorld(true);
  const all = { L: [], R: [] }, v = new THREE.Vector3();
  ch.root.traverse((m) => {
    if (!m.isSkinnedMesh || m.userData.isOutline) return;
    const si = m.geometry.attributes.skinIndex, sw = m.geometry.attributes.skinWeight;
    if (!si) return;
    for (let i = 0; i < si.count; i++) {
      let b = -1, w = 0;
      for (let k = 0; k < 4; k++) { const x = sw.getComponent(i, k); if (x > w) { w = x; b = si.getComponent(i, k); } }
      const bone = m.skeleton.bones[b], side = /^(foot|toe|heel02)([LR])$/.exec(bone?.name || '')?.[2];
      if (!side) continue;
      m.getVertexPosition(i, v); v.applyMatrix4(m.matrixWorld);
      all[side].push([bone, v.clone()]);
    }
  });
  let rest = 1e9;
  for (const s of LR) for (const [, w] of all[s]) rest = Math.min(rest, w.y);
  const out = { rest };
  for (const s of LR) {
    // (the sole densely, and the rest of the foot thinly: a foot pointed back in a kneel lies on its instep and toes' tops, which stand
    //  over 4 cm up at rest; read only the sole, the back toe went 4.5 cm into the floor getting up from the set-down's knee)
    const near = all[s].filter(([, w]) => w.y < rest + 0.04), top = all[s].filter(([, w]) => w.y >= rest + 0.04);
    const thin = (a, n) => { const step = Math.max(1, Math.floor(a.length / n)); return a.filter((_, i) => i % step === 0); };
    out[s] = [...thin(near, 120), ...thin(top, 60)].map(([b, w]) => [b, w.applyMatrix4(_m1.copy(b.matrixWorld).invert())]);
  }
  return out;
}

/** Contact weight (0..1) of foot s at loop phase u (0..1 of the clip). */
export function contactAt(ch, g, s, u) {
  const f = ((u % 1) + 1) % 1 * g.n;
  const i = Math.floor(f), k = f - i;
  const a = g.contact[s][i % g.n], b = g.contact[s][(i + 1) % g.n];
  return a + (b - a) * k;
}

/** Right-hand gun socket and left-hand support grip, measured from the pistol aim pose. */
export function computeSockets(ch) {
  const C = ch.clips, B = ch.bones;
  ch.root.updateMatrixWorld(true);
  const saveP = ch.root.position.clone(), saveQ = ch.root.quaternion.clone();
  ch.root.position.set(0, 0, 0); ch.root.quaternion.identity();
  ch.resetPose();
  ch.applyPose(C.sample('aimMid', 0, ch.P.tmp));
  ch.root.updateMatrixWorld(true);
  const gunQ = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(
    new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 1, 0), new THREE.Vector3(-1, 0, 0)));
  const palm = (s) => ch.arm[s].palmPt.clone().applyMatrix4(ch.arm[s].hand.matrixWorld);
  const gunPos = palm('R').sub(GUN_POINTS.gripR.clone().multiplyScalar(ch.gunScale).applyQuaternion(gunQ));
  const G = new THREE.Matrix4().compose(gunPos, gunQ, new THREE.Vector3(1, 1, 1));
  ch.socketR = new THREE.Matrix4().copy(B.handR.matrixWorld).invert().multiply(G);
  ch.socketRInv = ch.socketR.clone().invert();
  // support hand: the clip's hand orientation, palm centred on the gun's support grip
  const lq = B.handL.getWorldQuaternion(new THREE.Quaternion());
  const gl = GUN_POINTS.gripL.clone().multiplyScalar(ch.gunScale).applyMatrix4(G);
  const lp = gl.sub(ch.arm.L.palmPt.clone().applyQuaternion(lq));
  ch.socketL = G.clone().invert().multiply(new THREE.Matrix4().compose(lp, lq, new THREE.Vector3(1, 1, 1)));
  // the same grip mirrored: gun in the left hand, right hand supporting. The gun itself
  // isn't mirrored (it's the same gun), so its side axis flips back: S * G * D
  ch.resetPose();
  ch.applyPose(ch.mirrorPose(C.sample('aimMid', 0, ch.P.tmp), ch.P.tmp2));
  ch.root.updateMatrixWorld(true);
  const S = new THREE.Matrix4().makeScale(-1, 1, 1), D = new THREE.Matrix4().makeScale(1, 1, -1);
  const GL = S.clone().multiply(G).multiply(D);
  ch.socketLH = new THREE.Matrix4().copy(B.handL.matrixWorld).invert().multiply(GL);
  ch.socketLHInv = ch.socketLH.clone().invert();
  const rq = B.handR.getWorldQuaternion(new THREE.Quaternion());
  const gr = GUN_POINTS.gripL.clone().setZ(-GUN_POINTS.gripL.z).multiplyScalar(ch.gunScale).applyMatrix4(GL);
  const rp = gr.sub(ch.arm.R.palmPt.clone().applyQuaternion(rq));
  ch.socketRS = GL.clone().invert().multiply(new THREE.Matrix4().compose(rp, rq, new THREE.Vector3(1, 1, 1)));
  ch.resetPose();
  ch.root.position.copy(saveP); ch.root.quaternion.copy(saveQ);
  ch.root.updateMatrixWorld(true);
}

/**
 * Holster socket relative to the pelvis bone: across the small of the back like a
 * fanny pack, barrel to the left (muzzle dipped), grip out on the right where the
 * drawing hand finds it. Defined by where the grip sits (arms this short reach the
 * back only up at the lumbar).
 */
export function computeHolster(ch) {
  const H = T.weapon.holster;
  ch.resetPose();
  const saveP = ch.root.position.clone(), saveQ = ch.root.quaternion.clone();
  ch.root.position.set(0, 0, 0); ch.root.quaternion.identity();
  ch.root.updateMatrixWorld(true);
  const pelvisInv = new THREE.Matrix4().copy(ch.bones.spine.matrixWorld).invert();
  // gun frame: +X barrel to the character's left, +Y the gun's top up, side plate against the back
  const xg = new THREE.Vector3(1, 0, 0), yg = new THREE.Vector3(0, 1, 0), zg = new THREE.Vector3(0, 0, 1);
  const q = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(xg, yg, zg));
  q.premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), -H.tilt * DEG)); // muzzle dips
  q.premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), H.wrap * DEG)); // hugs the waist
  const grip = GUN_POINTS.gripR.clone().multiplyScalar(ch.gunScale).applyQuaternion(q);
  const pos = new THREE.Vector3(H.x, H.y, H.z).sub(grip);
  ch.holsterLocal = pelvisInv.multiply(new THREE.Matrix4().compose(pos, q, new THREE.Vector3(1, 1, 1)));
  ch.root.position.copy(saveP); ch.root.quaternion.copy(saveQ);
  ch.root.updateMatrixWorld(true);
}
