// ---------------------------------------------------------------------------------------
// THE ANIMATION'S SETUP (part of courier/character.js): what the Character's animation is built from, once, at the end of its
// constructor, and the two pose helpers that go with it. `initAnim` makes the clip set and the poses blended through, the masks (the
// upper body; one arm and the head, for the moves that hold the body to something with the other hand), the modules that each own a
// layer (the air, the idle and its breaks, a blow taken, the lent gesture, the mantle, the prowl, the crawl), the legs and each palm's
// centre, measures every gait, and has the clips the libraries lack authored and each tool's stance baked. `initMirror` and
// `mirrorPose` reflect a pose across the body's midplane (the gun in the left hand, and anything else that wants a mirrored clip);
// `applyPose` writes a pose to the bones.
//
// Prior art: clips blended by per-bone masks with a mirrored pose, as Unreal's Layered Blend per Bone and Mirror Data Tables and
// Unity's humanoid mirror.
//
//   initAnim(ch, pack)   initMirror(ch)   mirrorPose(ch, src, dst) -> dst   applyPose(ch, pose)
//   (ch: the Character, which has a method of each name that calls these)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { Clips, Track } from '../anim/animator.js';
import { authorAll } from '../anim/authored.js';
import { bakeStances } from '../anim/stances.js';
import { Airborne } from '../anim/airborne.js';
import { IdleBreaks } from '../anim/idlebreak.js';
import { Hurt } from '../anim/hurt.js';
import { LendGesture } from '../anim/lendgesture.js';
import { MantleClips } from '../anim/mantle.js';
import { Prowl, PROWL } from '../anim/prowl.js';
import { Crawl } from '../anim/crawl.js';
import { LR, _q1 } from './scratch.js';

export function initAnim(ch, pack) {
  const C = (ch.clips = new Clips(pack));
  const B = ch.bones;
  ch.driven = C.bones.map((n) => B[n]);
  ch.P = { base: C.pose(), tmp: C.pose(), tmp2: C.pose(), air: C.pose(), up: C.pose(), up2: C.pose() };
  ch.MASK_UPPER = C.mask({ spine001: 0.3, spine002: 0.65, spine003: 1, spine004: 0.6, spine005: 0.55, head: 0.5, 'upper_arm*': 1, 'forearm*': 1, 'hand*': 1, 'f_*': 1, 'thumb*': 1 });
  // (one arm and the head: for the moves that hold the body to something with the other hand)
  ch.MASK_ARM = {};
  for (const s of LR) {
    const t = { head: 0.35, spine005: 0.3, spine004: 0.25 };
    for (const n of C.bones) if (n.endsWith(s) && /^(upper_arm|forearm|hand|f_|thumb)/.test(n)) t[n] = 1;
    ch.MASK_ARM[s] = C.mask(t);
  }
  ch.initMirror(); // (before the idles: the baked upright's right arm is its left's mirror)
  ch.air = new Airborne(ch); // (the air: take-off, fall, flip, kick-off, dash, landings: anim/airborne.js)
  ch.airTrack = ch.air.track;
  ch.idles = new IdleBreaks(ch); // (the idle, the fighting stance, the idle breaks: anim/idlebreak.js)
  ch.hurt = new Hurt(ch); // (a blow taken: anim/hurt.js)
  ch.lendGesture = new LendGesture(ch); // (the sub's verb lent on R: anim/lendgesture.js)
  ch.mantle = new MantleClips(ch); // (over a ledge: anim/mantle.js)
  ch.slideTrack = new Track(C, new Set(['slideLoop']));
  ch.prowl = new Prowl(ch); // (the crouch on the move: its loop, the hips' lift and the cat's still head: anim/prowl.js)
  const L = (a, b) => ch.restPos.get(B[a]).distanceTo(ch.restPos.get(B[b]));
  ch.leg = {
    L: { thigh: B.thighL, shin: B.shinL, foot: B.footL, a: L('thighL', 'shinL'), b: L('shinL', 'footL') },
    R: { thigh: B.thighR, shin: B.shinR, foot: B.footR, a: L('thighR', 'shinR'), b: L('shinR', 'footR') },
  };
  // palm centre of each hand, in the hand's own frame (the gun grip and wall contacts use it)
  for (const s of LR) {
    const a = ch.arm[s];
    const h = ch.restPos.get(a.hand), m = ch.restPos.get(B[`f_middle01${s}`]);
    const n = new THREE.Vector3(0, -1, 0); // T-pose palms face down
    const w = h.clone().lerp(m, 0.6).addScaledVector(n, 0.025);
    a.palmPt = w.sub(h).applyQuaternion(ch.restCharInv.get(a.hand));
  }
  ch.ankleRest = ch.restPos.get(B.footL).y;
  ch.toeRest = ch.restPos.get(B.toeL).y;
  ch.gait = {};
  for (const n of ['walk', 'jog', 'sprint', PROWL.clip]) ch.gait[n] = ch.analyseGait(n);
  ch.crawl = new Crawl(ch); // (on all fours, when player.js has a body for it: anim/crawl.js)
  ch.lock = { L: { w: 0, on: false, lost: false, p: new THREE.Vector3() }, R: { w: 0, on: false, lost: false, p: new THREE.Vector3() } };
  ch.st = { phi: 0, gs: 0, warp: 0, theta: 0, turn: 0, dip: 0, dipV: 0, sliding: false, yawOff: 0 };
  ch.airT = 0;
  ch.resetPose();
  authorAll(ch); // (clips the libraries lack: built once here, from key poses solved on this very skeleton)
  bakeStances(ch); // (each Lachryma tool's own idle: UAL idles modified, courier/anim/stances.js)
}

/**
 * Left/right mirroring of poses (for the gun in the left hand, and anything else that
 * wants a mirrored clip). Works in character space: each bone takes its partner's
 * rotation reflected across the body's midplane, corrected so the rest pose maps to
 * itself (the rig's left and right bones don't share axis conventions).
 */
export function initMirror(ch) {
  const d = ch.driven, idx = new Map(d.map((b, i) => [b, i]));
  const partner = (n) => (/L$/.test(n) ? n.slice(0, -1) + 'R' : /R$/.test(n) ? n.slice(0, -1) + 'L' : n);
  const M = (q) => new THREE.Quaternion(q.x, -q.y, -q.z, q.w); // reflect x
  ch.mir = d.map((b, i) => {
    const j = idx.get(ch.bones[partner(b.name)]) ?? i;
    const par = idx.has(b.parent) ? idx.get(b.parent) : -1;
    const parentRest = par < 0 ? b.parent.getWorldQuaternion(new THREE.Quaternion()) : null; // (root at identity here)
    const C = M(ch.restCharQ.get(d[j])).invert().multiply(ch.restCharQ.get(b));
    return { j, par, parentRest, C };
  });
  ch._mq = d.map(() => new THREE.Quaternion());
  ch._mq2 = d.map(() => new THREE.Quaternion());
}

export function mirrorPose(ch, src, dst) {
  const d = ch.driven, mir = ch.mir, cq = ch._mq, cq2 = ch._mq2;
  // FK: character-space rotations of the source pose (bones are in parent-first order)
  for (let i = 0; i < d.length; i++) {
    const m = mir[i];
    _q1.fromArray(src.q, i * 4);
    cq[i].copy(m.par < 0 ? m.parentRest : cq[m.par]).multiply(_q1);
  }
  for (let i = 0; i < d.length; i++) {
    const m = mir[i], q = cq[m.j];
    cq2[i].set(q.x, -q.y, -q.z, q.w).multiply(m.C);
  }
  for (let i = 0; i < d.length; i++) {
    const m = mir[i];
    _q1.copy(m.par < 0 ? m.parentRest : cq2[m.par]).invert().multiply(cq2[i]);
    _q1.toArray(dst.q, i * 4);
  }
  dst.p[0] = -src.p[0]; dst.p[1] = src.p[1]; dst.p[2] = src.p[2];
  return dst;
}

export function applyPose(ch, pose) {
  const d = ch.driven, q = pose.q;
  for (let i = 0; i < d.length; i++) d[i].quaternion.fromArray(q, i * 4);
  ch.bones.spine.position.fromArray(pose.p);
}
