// ---------------------------------------------------------------------------------------
// THE MASK'S FACE: the Courier's mask as an E-ink display (the owner, 2026-10-06: "treat the Courier mask like an E-ink display, that
// matches the physical digital ancient magic tech vibe"). The eyes and brows of the maker's painting are a screen of two inks, cream on
// the mask's oxblood, and they change the way paper-ink does:
//
//   THE FACES    eight cells painted from the maker's own eyes and brows (scripts/bake_mask_faces.py -> courier_mask_faces.png):
//                neutral, happy, sad, angry, surprised, hurt, focused, sleepy
//   A REFRESH    a change of face is not a fade: the old face and the new flash up together in cream for a moment, are wiped to ink,
//                then the new face is there, with a GHOST of the old one left under it and fading over two real seconds
//                (the e-reader's full refresh and its ghosting)
//   THE BLINK    a lid of ink swept down and back in three steps (a partial refresh: no flash), every three to six real seconds
//   THE PUPILS   (PUPILS: one switch, for the owner's roll-back) a dot of ink in each eye with a pinprick of cream, following what the
//                Courier looks at (the lock-on's mark, else where they are facing and the camera when it is in front of them), moving in
//                whole steps of the painting's pixels, a few times a real second: an e-ink screen cannot glide
//
// Prior art: the e-reader's refresh flash and ghosting (Kindle, reMarkable), Kirby's and Mega Man Legends' texture-swapped faces (an
// atlas of eyes on a simple head), Splatoon's and Wind Waker's eyes drawn on top of the face, Persona 5's Morgana mask; and the MGS
// Raiden's visor readouts as "a face that is a screen".
//
//   dressMaskFace(material) -> uniforms        game.maskFace = new MaskFace(game)   .set(name, holdSec)   .update(rawDt)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import facesB64 from '../assets/courier/courier_mask_faces.png?b64';

export const PUPILS = true; // (the owner's roll-back: false, and the eyes are the maker's, unpupilled)

export const FACES = ['neutral', 'happy', 'sad', 'angry', 'surprised', 'hurt', 'focused', 'sleepy'];
// per face: the pupil's radius in the painting's pixels (0: none: a smile's arch, a hurt chevron and a sleepy lid have no room for one)
const PUPIL_R = { neutral: 15, happy: 0, sad: 15, angry: 11, surprised: 9, hurt: 0, focused: 13, sleepy: 0 };

// the region of the 512 px mask painting the faces replace, and the maker's eyes in it (found by the bake)
const REGION = [12, 200, 336, 372];
const EYES = [[26, 260, 142, 358], [207, 260, 323, 358]];
const lin = (r, g, b) => new THREE.Color().setRGB(r / 255, g / 255, b / 255, THREE.SRGBColorSpace);
const INK = lin(80, 19, 19), CREAM = lin(221, 190, 158);

const DECL = /* glsl */ `
uniform sampler2D uFaceAtlas; uniform vec4 uFace; uniform vec4 uFaceLook; uniform vec3 uFaceInk, uFaceCream;
// uFace: x the face's cell, y the face before it, z real seconds since the change, w the blink (0 open .. 1 shut)
// uFaceLook: xy the pupils' offset (painting pixels, stepped), z the pupils' radius, w on
vec3 faceCell(float i, vec2 cu) {
  cu = clamp(cu, vec2(0.002, 0.003), vec2(0.998, 0.997)); // (never a neighbour's edge)
  return texture2D(uFaceAtlas, vec2((mod(i, 4.0) + cu.x) / 4.0, (floor(i / 4.0) + cu.y) / 2.0)).rgb;
}
float faceCreamness(vec3 c) { return smoothstep(0.25, 0.75, dot(c - uFaceInk, vec3(0.333)) / max(1e-3, dot(uFaceCream - uFaceInk, vec3(0.333)))); }
`;

const DIFFUSE = /* glsl */ `
  vec3 faceC = vec3(0.0); bool faceIn = false;
  {
    vec2 fpx = vMapUv * 512.0;
    if (fpx.x > ${REGION[0]}.0 && fpx.x < ${REGION[2]}.0 && fpx.y > ${REGION[1]}.0 && fpx.y < ${REGION[3]}.0) {
      faceIn = true;
      vec2 cu = (fpx - vec2(${REGION[0]}.0, ${REGION[1]}.0)) / vec2(${REGION[2] - REGION[0]}.0, ${REGION[3] - REGION[1]}.0);
      vec3 cur = faceCell(uFace.x, cu), prev = faceCell(uFace.y, cu);
      float t = uFace.z;
      float both = max(faceCreamness(cur), faceCreamness(prev));     // (the pixels the refresh changes: the old face and the new)
      if (t < 0.07) faceC = mix(prev, uFaceCream, both);            // (the refresh: both faces flashed up at once)
      else if (t < 0.13) faceC = mix(prev, uFaceInk, both);         //  (then wiped to ink)
      else {
        faceC = cur;
        float ghost = 0.12 * exp(-(t - 0.13) * 1.6);                //  (then the new face, the old one's ghost under it)
        faceC = mix(faceC, prev, ghost * (1.0 - faceCreamness(cur)) * faceCreamness(prev));
        float cr = faceCreamness(cur);
        // the pupils: a dot of ink in each eye, a pinprick of cream in it
        if (uFaceLook.w > 0.5 && uFaceLook.z > 0.0) {
          ${EYES.map(([x0, y0, x1, y1]) => `{
            vec2 d = fpx - (vec2(${(x0 + x1) / 2}.0, ${(y0 + y1) / 2 + 2}.0) + uFaceLook.xy);
            float dot0 = 1.0 - smoothstep(uFaceLook.z - 0.8, uFaceLook.z + 0.8, length(d));
            float glint = 1.0 - smoothstep(2.2, 3.4, length(d - vec2(-0.32, -0.32) * uFaceLook.z));
            faceC = mix(faceC, uFaceInk, dot0 * cr * (1.0 - glint));
          }`).join('')}
        }
        // the blink: a lid of ink down over the eyes (only the eyes: the brows stay)
        if (uFace.w > 0.0) {
          ${EYES.map(([x0, y0, x1, y1]) => `if (fpx.x > ${x0 - 6}.0 && fpx.x < ${x1 + 6}.0 && fpx.y > ${y0 - 14}.0 && fpx.y < ${y1 + 8}.0 && fpx.y < mix(${y0 - 14}.0, ${y1 + 8}.0, uFace.w)) faceC = mix(faceC, uFaceInk, cr);`).join('\n          ')}
        }
      }
      diffuseColor.rgb = diffuse * faceC;
    }
  }
`;
// the painting also glows back a share of itself (courier/character.js PAINT_LIGHT): the face's light is the face's, not the painting's
// (put before the emissive map's include, so a finish laid after it still adds its own light: vfx/finish.js)
const EMISSIVE = /* glsl */ `
  if (faceIn) totalEmissiveRadiance *= faceC / max(texture2D(emissiveMap, vEmissiveMapUv).rgb, vec3(1e-3));
`;

let ATLAS = null;
function atlas() {
  if (ATLAS) return ATLAS;
  ATLAS = new THREE.TextureLoader().load(`data:image/png;base64,${facesB64}`);
  ATLAS.colorSpace = THREE.SRGBColorSpace; ATLAS.flipY = false; ATLAS.anisotropy = 4;
  return ATLAS;
}

/** Make the mask's material (CourierMask) an E-ink face; returns its uniforms. */
export function dressMaskFace(material) {
  if (material.userData.maskFace) return material.userData.maskFace;
  const u = { uFaceAtlas: { value: atlas() }, uFace: { value: new THREE.Vector4(0, 0, 9, 0) }, uFaceLook: { value: new THREE.Vector4(0, 0, PUPIL_R.neutral, PUPILS ? 1 : 0) },
    uFaceInk: { value: new THREE.Vector3(INK.r, INK.g, INK.b) }, uFaceCream: { value: new THREE.Vector3(CREAM.r, CREAM.g, CREAM.b) } };
  const prev = material.onBeforeCompile, prevKey = material.customProgramCacheKey?.bind(material);
  material.onBeforeCompile = (sh, r) => {
    prev?.call(material, sh, r);
    Object.assign(sh.uniforms, u);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>\n${DECL}`)
      .replace('#include <map_fragment>', `#include <map_fragment>\n${DIFFUSE}`)
      .replace('#include <emissivemap_fragment>', `${EMISSIVE}\n#include <emissivemap_fragment>`);
  };
  material.customProgramCacheKey = () => `${prevKey ? prevKey() : ''}-maskface`;
  material.needsUpdate = true;
  return (material.userData.maskFace = u);
}

const _v = new THREE.Vector3(), _h = new THREE.Vector3(), _f = new THREE.Vector3(), _d = new THREE.Vector3(), _m = new THREE.Matrix4();
const STEP = 4;        // (the pupils move in steps of 4 of the painting's pixels)
const LOOK_HZ = 6;     // (and a few times a real second)

export class MaskFace {
  constructor(game) {
    this.game = game; this.u = null;
    this.face = 'neutral'; this.hold = 0; this.since = 9;
    this.blinkIn = 3 + Math.random() * 3; this.blinkT = -1;
    this.lookT = 0; this.idle = 0; this.rank = 0;
    this.find();
    const on = (name, fn) => game.events?.on(name, fn);
    on('courier.impulse', ({ why }) => { if (why === 'jelly' || why === 'lobber' || why === 'explosion') this.set('hurt', 1.2, 3); });
    on('courier.shatter', () => this.set('hurt', 3, 4));
    on('vessel.crack', () => this.set('sad', 2.5, 2));
    on('jelly.burst', ({ by }) => { if (by === 'courier') this.set('happy', 1.4, 1); });
    on('achievement.unlock', () => this.set('happy', 2.5, 2));
    on('well.foe', () => this.set('surprised', 2, 2));
    on('well.floor', () => this.set('surprised', 1.4, 1));
  }

  /** Find the mask on the Courier's model (done again if the model is swapped). */
  find() {
    const model = this.game.character?.model; if (!model || model === this.model) return;
    this.model = model;
    model.traverse((o) => { if (o.isMesh && o.name === 'Courier_Mask') this.u = dressMaskFace(o.material); });
    // the face's own axes in the head bone's frame (the model faces +Z, glTF's way), taken once
    const head = this.game.character?.bones?.head; if (!head) return;
    model.updateMatrixWorld(true);
    const inv = new THREE.Quaternion(); head.getWorldQuaternion(inv).invert();
    const toHead = (x, y, z) => new THREE.Vector3(x, y, z).transformDirection(model.matrixWorld).applyQuaternion(inv).normalize();
    const fwd = toHead(0, 0, 1), up = toHead(0, 1, 0);
    this.axes = { fwd, up, right: new THREE.Vector3().crossVectors(fwd, up).normalize() }; // (the Courier's own right, seen from in front: the painting's left)
  }

  /** Show a face for `holdSec` real seconds (0: until another); a lower `rank` does not interrupt a higher one still held. */
  set(name, holdSec = 0, rank = 0) {
    if (!FACES.includes(name)) return false;
    if (this.hold > 0 && rank < this.rank) return false;
    this.rank = rank; this.hold = holdSec;
    if (name === this.face) return true;
    if (this.u) { this.u.uFace.value.y = FACES.indexOf(this.face); this.u.uFace.value.x = FACES.indexOf(name); }
    this.face = name; this.since = 0;
    if (this.u) this.u.uFaceLook.value.z = PUPIL_R[name];
    return true;
  }

  /** The face when nothing is held: focused in a fight, sleepy after a real minute standing idle, else neutral. */
  rest() {
    const g = this.game;
    if (g.lock?.active || g.combat?.engaged) return 'focused';
    return this.idle > 60 ? 'sleepy' : 'neutral';
  }

  update(raw = 1 / 60) {
    this.find(); if (!this.u) return;
    const g = this.game, p = g.player;
    const moving = p?.vel ? Math.hypot(p.vel.x, p.vel.z) > 0.3 : true;
    this.idle = moving ? 0 : this.idle + raw;
    if (this.hold > 0) { this.hold -= raw; if (this.hold <= 0) this.rank = 0; }
    else this.set(this.rest(), 0, 0);
    this.since += raw; this.u.uFace.value.z = this.since;
    // the blink: three steps down, three up (a partial refresh); none mid-refresh or on a face without open eyes
    this.blinkIn -= raw;
    if (this.blinkIn <= 0 && this.since > 0.4) { this.blinkT = 0; this.blinkIn = 3 + Math.random() * 3; }
    let w = 0;
    if (this.blinkT >= 0) {
      this.blinkT += raw; const k = Math.floor(this.blinkT / 0.045); // (each step one e-ink partial update)
      w = [0.4, 0.75, 1, 1, 0.75, 0.4][k] ?? 0; if (k >= 6) this.blinkT = -1;
    }
    this.u.uFace.value.w = this.face === 'sleepy' ? Math.max(w, 0.15) : w;
    // the pupils: toward what the Courier looks at, stepped
    this.lookT += raw;
    if (this.lookT >= 1 / LOOK_HZ) { this.lookT = 0; this.aim(); }
  }

  /** Where the pupils point: the lock-on's mark, else ahead (and at the camera when it is in front of the face), in the painting's pixels. */
  aim() {
    const g = this.game, head = g.character?.bones?.head; if (!head) return;
    head.getWorldPosition(_h);
    let target = g.lock?.point?.(_v);
    if (!target) {
      const cam = g.camera; _v.copy(cam.position).sub(_h);
      const fwd = this.forward(head);
      if (_v.normalize().dot(fwd) > 0.2) target = _v.copy(cam.position);                     // (the camera in front: they look at you)
      else { target = _v.copy(_h).addScaledVector(fwd, 10); target.x += Math.sin(performance.now() / 2300) * 2.5; } // (else ahead, wandering a little)
    }
    // the target in the head's frame: right and up of the face's own forward
    _m.copy(head.matrixWorld).invert(); const d = _d.copy(target).applyMatrix4(_m).normalize();
    const L = this.axes; if (!L) return;
    const sx = THREE.MathUtils.clamp(d.dot(L.right) * 2.2, -1, 1), sy = THREE.MathUtils.clamp(d.dot(L.up) * 2.2, -1, 1);
    const q = (v) => Math.round(v / STEP) * STEP;
    this.u.uFaceLook.value.x = q(-sx * this.reach.x); // (their right is the painting's left) this.u.uFaceLook.value.y = q(-sy * this.reach.y);
  }

  get reach() { return { x: 22, y: 12 }; } // (how far a pupil may go from the eye's middle, in the painting's pixels)

  forward(head) { const L = this.axes; return _f.copy(L ? L.fwd : _f.set(0, 0, 1)).transformDirection(head.matrixWorld); }
}
