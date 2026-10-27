// ---------------------------------------------------------------------------------------
// THE DRIFT BOTTLE'S LOOK (docs/plans/OPEN-SEA.md 14.7; Dovina's bottles: world/opensea/puzzlepieces.js `bottles[].mesh`, two a sea): each
// placeholder kept (the pieces still hide it once its note is read) and given its look at its real size, 0.4 m:
//   THE BOTTLE    green glass, a fresnel rim bright where it turns from the eye and clear where it faces it (glass's own falloff), a cork
//                 in its neck, the rolled note and its red ribbon seen through it; lying on the swell (the drawn sea's heightAt), rocked
//                 by its slope, turning slowly as it drifts
//   ITS GLINT     what finds it from afar (a world mark, no words): a soft halo over it that keeps about the same few pixels whatever
//                 the distance (from 25 m to 400 m), and every few real seconds the sun caught on its glass, a star flashed in the halo
//                 (`sea.bottle.glint`), each bottle on its own beat
//   ITS MOMENT    `sea.bottle` (F alongside at the helm, the note read): the bottle lifted out of the water to just before the eye
//                 (The Wind Waker's item held up), turned neck up; the cork drawn (`sea.bottle.cork`), the note slid out, its ribbon
//                 falling, the note unrolled across the view; held a beat, then the bottle let fall back and the note gone. The words
//                 are the log's (feedback/tracking/opensea.js), never drawn here.
// Cost: the glass is one program of its own (Standard, transparent, its fresnel in onBeforeCompile, key 'bottleglass'), compiled at
// boot by `prewarm()` (SeaLooks.prewarm asks); the cork, note and ribbon draw with the islet program; the halo is a sprite.
//
// Prior art: Sea of Thieves' messages in bottles (a green bottle bobbing, its glint, the note read in hand); The Wind Waker's item get;
// a glass's fresnel (Schlick); the house's islet dressing (isletlooks.js: a placeholder kept, its look laid over it).
//
//   game.bottleLooks = new BottleLooks(game)   .update(dt) (each frame: dresses the bottles once they exist, bobs and glints them,
//   plays a reading)   .prewarm() -> park (before the compile)   .dressed (the pieces dressed, or null)   BOTTLE (the numbers)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { isletMaterial } from './isletlooks.js';
import { bottleLook } from './salvagekit.js';
import { haloTexture } from '../lighthouselamp.js';
import { SEA } from '../../world/opensea/seaprops.js';

/** halo: its size a metre away (m), never under `min` m; seen: how far its glint and halo show (m); glint: real s between its flashes;
 *  read: the moment's beats (real s: lifted, the cork, the note out, unrolled, held, gone); before: m before the eye it is held. */
export const BOTTLE = { halo: 0.016, min: 0.5, seen: 420, glint: 3.6, read: { lift: 0.9, cork: 1.0, out: 1.45, unroll: 2.0, hold: 3.6, gone: 4.2 }, before: 1.35 };
const _v = new THREE.Vector3(), _w = new THREE.Vector3(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _up = new THREE.Vector3(0, 1, 0);
const ease = (t) => t * t * (3 - 2 * t), clamp01 = (t) => Math.max(0, Math.min(1, t));

let glassMat = null;
/** The bottle's glass: bottle green, half clear, a fresnel rim (bright and opaque where the glass turns from the eye). */
export function bottleGlass(env = null) {
  if (glassMat) return glassMat;
  const m = glassMat = new THREE.MeshStandardMaterial({ color: 0x2f8a52, roughness: 0.08, metalness: 0, transparent: true, opacity: 0.42, depthWrite: false, envMap: env, envMapIntensity: 1.2, emissive: 0x0c2a18 });
  m.onBeforeCompile = (sh) => {
    sh.fragmentShader = sh.fragmentShader.replace('#include <opaque_fragment>', `#include <opaque_fragment>
float glassFr = pow(1.0 - abs(dot(normalize(vViewPosition), normal)), 3.0); // (Schlick's falloff: clear where it faces the eye)
gl_FragColor.rgb += vec3(0.55, 0.95, 0.7) * glassFr * 0.7; gl_FragColor.a = mix(gl_FragColor.a, 0.95, glassFr);`);
  };
  m.customProgramCacheKey = () => 'bottleglass';
  m.userData.shared = true;
  return m;
}

export class BottleLooks {
  constructor(game) { this.game = game; this.dressed = null; this.parts = null; this.reads = []; this.t = 0; this.off = game.events?.on?.('sea.bottle', (e) => this.read(e)); }
  get mat() { return this.game.seaLooks?.mat || (this.own ||= isletMaterial()); }
  get look() { return (this.parts ||= bottleLook()); }

  /** One bottle 50 m under the world for main.js's compile; returns what hides it again. */
  prewarm() {
    const b = this.body(); b.position.set(0, -50, 0); b.userData.zoneFree = true; this.game.scene.add(b);
    return () => { b.visible = false; };
  }

  /** A bottle's body: the glass, the cork, the rolled note (in its own frame, along +Z). */
  body(glassMesh = null) {
    const L = this.look, g = glassMesh || new THREE.Mesh(L.glass, bottleGlass(this.game.sky?.env || null));
    if (glassMesh) { const old = [g.geometry, g.material]; g.geometry = L.glass; g.material = bottleGlass(this.game.sky?.env || null); old[0].dispose(); if (!old[1].userData?.shared) old[1].dispose(); }
    g.renderOrder = 2; g.castShadow = false;
    const cork = new THREE.Mesh(L.cork, this.mat), roll = new THREE.Mesh(L.roll, this.mat); cork.name = 'cork'; roll.name = 'roll';
    g.add(cork, roll);
    return g;
  }

  update(dt) {
    this.t += dt;
    const P = this.game.opensea?.pieces;
    if (P && this.dressed !== P) { this.dress(P); this.dressed = P; }
    if (!P) this.dressed = null;
    const cam = this.game.camera, sea = this.game.emocean?.sea, seaT = this.game.emocean?.seaT ?? this.t;
    if (P && this.game.opensea?.active) for (const B of P.bottles || []) if (B.mesh.visible) this.bob(B, sea, seaT, cam);
    for (let i = this.reads.length - 1; i >= 0; i--) if (!this.reading(this.reads[i], dt, cam)) this.reads.splice(i, 1);
  }

  dress(P) {
    for (const B of P.bottles || []) {
      this.body(B.mesh); B.mesh.rotation.set(0, 0, 0);
      const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTexture(), color: 0xc8ffd8, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, fog: false, opacity: 0.5 }));
      halo.renderOrder = 3; halo.name = 'halo'; B.mesh.add(halo);
      const h = [...String(B.id)].reduce((a, c) => a * 31 + c.charCodeAt(0), 7) >>> 0;
      B.look = { halo, phase: (h % 1000) / 1000, spin: ((h >> 10) % 2 ? 1 : -1) * (0.12 + ((h >> 12) % 7) * 0.02), yaw: (h % 628) / 100, glintT: (h % 360) / 100 };
    }
  }

  /** On the swell: its height and slope from the drawn sea, rocked and turned slowly; its halo held a few pixels wide; its glint. */
  bob(B, sea, seaT, cam) {
    const L = B.look; if (!L) return;
    const x = B.at.x, z = B.at.z, h = (px, pz) => (sea ? sea.heightAt(px, pz, seaT) : SEA.y);
    const y = h(x, z), sx = (h(x + 0.6, z) - h(x - 0.6, z)) / 1.2, sz = (h(x, z + 0.6) - h(x, z - 0.6)) / 1.2;
    L.yaw += L.spin * this.game.rawDt * 0.3;
    B.mesh.position.set(x, y + 0.025, z);
    B.mesh.quaternion.setFromEuler(_e.set(-Math.atan(sz) * 0.8 - 0.12 + Math.sin(this.t * 1.3 + L.phase * 6) * 0.08, L.yaw, Math.atan(sx) * 0.8 + Math.sin(this.t * 0.9 + L.phase * 9) * 0.25, 'YXZ'));
    const d = cam ? cam.position.distanceTo(B.mesh.position) : 50, near = d < BOTTLE.seen;
    L.halo.visible = near && d > 4;
    if (!near) return;
    const s = Math.max(BOTTLE.min, d * BOTTLE.halo), flash = Math.max(0, 1 - Math.abs(((this.t + L.glintT) % BOTTLE.glint) - 0.2) / 0.2);
    L.halo.scale.setScalar(s * (1 + 0.8 * flash)); L.halo.position.set(0, 0.05, 0); L.halo.material.opacity = 0.32 + 0.1 * Math.sin(this.t * 2 + L.phase * 6) + 0.55 * flash;
    if ((L.lastGlint ?? -1) !== Math.floor((this.t + L.glintT) / BOTTLE.glint)) {
      L.lastGlint = Math.floor((this.t + L.glintT) / BOTTLE.glint);
      this.game.vfx?.play?.('sea.bottle.glint', { pos: _v.copy(B.mesh.position).setY(B.mesh.position.y + 0.08), scale: Math.max(1, d * 0.025) });
    }
  }

  // ---------------------------------------------------------------- the note read
  read(e) {
    const P = this.game.opensea?.pieces, B = P?.bottles?.find((b) => b.id === e?.id); if (!B?.look) return;
    const g = new THREE.Group(), bottle = this.body(); g.add(bottle); bottle.rotation.x = 0;
    const L = this.look, note = new THREE.Group(), sheet = new THREE.Mesh(L.sheet, this.mat), rollEnd = new THREE.Mesh(L.roll, this.mat), ribbon = new THREE.Mesh(L.ribbon, this.mat);
    note.add(sheet, rollEnd); g.add(note, ribbon); note.visible = false; ribbon.visible = false;
    g.position.copy(B.mesh.position); g.quaternion.copy(B.mesh.quaternion); g.userData.zone = 'opensea'; this.game.scene.add(g);
    this.reads.push({ g, bottle, note, sheet, rollEnd, ribbon, t: 0, from: B.mesh.position.clone(), fromQ: B.mesh.quaternion.clone(), corked: false });
  }

  /** One frame of a reading; false when it is over (taken out of the scene). */
  reading(R, dt, cam) {
    const T = BOTTLE.read; R.t += dt;
    if (R.t > T.gone || !cam) { this.game.scene.remove(R.g); return false; }
    const fwd = cam.getWorldDirection(_v), before = _w.copy(cam.position).addScaledVector(fwd, BOTTLE.before).addScaledVector(_up, -0.12);
    const k = ease(clamp01(R.t / T.lift)), back = ease(clamp01((R.t - T.hold) / (T.gone - T.hold)));
    R.g.position.copy(R.from).lerp(before, k * (1 - back)); R.g.position.y -= back * 1.5;
    _q.setFromRotationMatrix(cam.matrixWorld); // (held square to the view: the bottle upright in it, neck up, a little turned)
    const held = _e.set(-Math.PI / 2 + 0.25, 0, 0.35); R.g.quaternion.copy(R.fromQ).slerp(_q.clone().multiply(new THREE.Quaternion().setFromEuler(held)), k);
    const cork = R.bottle.getObjectByName('cork');
    if (!R.corked && R.t > T.cork) { R.corked = true; this.game.vfx?.play?.('sea.bottle.cork', { pos: cork.getWorldPosition(new THREE.Vector3()) }); }
    if (R.corked) { const c = clamp01((R.t - T.cork) / 0.4); cork.position.set(0.02 * c, 0, 0.06 * c + 0.12 * c * c); cork.rotation.x = c * 2; cork.visible = c < 1; }
    // the note out of the neck, its ribbon off, then unrolled across the view, held square to it
    const out = clamp01((R.t - T.cork - 0.1) / (T.out - T.cork - 0.1)), un = ease(clamp01((R.t - T.out) / (T.unroll - T.out)));
    const inner = R.bottle.getObjectByName('roll'); inner.visible = out <= 0;
    R.note.visible = out > 0 && back < 0.6;
    if (R.note.visible) {
      R.note.position.set(0, 0, -0.05 + out * 0.32 + un * 0.05); // (slid out along the neck: the bottle's +Z)
      R.note.rotation.set(un * Math.PI / 2, 0, 0); // (turned to face the eye as it opens)
      R.sheet.scale.set(0.02 + 0.22 * un, 1, 1); R.sheet.position.set(-0.11 * un, 0, 0);
      R.rollEnd.position.set(0.11 * un + 0.01, 0.05, 0); R.rollEnd.scale.setScalar(1 - 0.6 * un); R.rollEnd.rotation.set(-Math.PI / 2, 0, 0); // (what is still rolled, at its free edge, upright)
      R.note.scale.setScalar(1 - back);
    }
    R.ribbon.visible = out > 0.6 && R.t < T.unroll + 0.8;
    if (R.ribbon.visible) { const f = R.t - (T.cork + 0.1 + (T.out - T.cork - 0.1) * 0.6); R.ribbon.position.set(0.02, -0.6 * f * f - 0.03, 0.2 + 0.1 * f); R.ribbon.rotation.set(f * 3, f * 2, 0); }
    return true;
  }

  dispose() { this.off?.(); for (const R of this.reads) this.game.scene.remove(R.g); this.reads = []; }
}
