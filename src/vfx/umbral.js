// ---------------------------------------------------------------------------------------
// THE UMBRAL: the world below the Emocean's surface, where the ship fights in its Umbral form (the owner, 2026-10-08: "the colour
// flip becomes Astral/Umbral forms that rise above and dive below the Emocean"; docs/plans/RAIL-OVERHAUL.md sections 4 and 5). Above
// is the storm's light, gold-white and pale violet; below is black crude lit by its own oil film, and the light falls off with depth.
//
//   THE MENISCUS   the crude sea seen from below (vfx/crudesea.js `under`: the same mesh, its winding turned when the eye is under it,
//                  so no second sea and no second program): a dark mirror of the deep past the critical angle, and inside Snell's
//                  window the air above, refracted (the sky's light through the surface's own slopes); the oil film's colours leaking
//                  through in its bands; the bellies of things floating above as soft shadows on it (`above`)
//   THE COLUMN     the deep's fog, black-violet, close (the light gone by 60 m), and the deep's colour behind everything (the sky's
//                  dome and clouds stepped out while the eye is under); motes of Lachryma drifting up through it, a few at a time,
//                  swelling in (the VFX system's own sprites: no new program)
//   THE CAUSTICS   the net of light the surface throws down onto anything below it (`deepCaustics`, put into every material that comes
//                  through the storm warp's opt-in, vfx/stormwarp.js warpMaterial / deepMaterial, or laid over a thing as a caustic
//                  overlay, `causticsOn`): two slow Voronoi webs crossing, strongest just under the surface, gone by ~12 m down and
//                  beyond 45 m from the eye (before they could crawl)
//   THE SURFACE CROSSING   Q, a half-bar: a SPLASH RING spreading on the surface where the ship goes through (the wake's own foam program,
//                  vfx/rail.js) with a crown of crude thrown up and, below, a burst of motes; and the eye passing through the meniscus:
//                  the LINE of the surface wiped across the lens, the frame refracted at its lip, the veil's colour turning from the
//                  storm's gold-white to the Umbral's black-violet below it (the glitch's pass: vfx/glitch.js `veil`)
// The eye's side of the surface is measured, never assumed (the camera against the sea's drawn height under it: `surfaceAt`, the Umbral form's lift with it), so the meniscus
// is drawn exactly when the eye is under it; `set({ below })` steers the LOOK (the grade, the column, the caustics) for a runtime that
// wants it ahead of the camera, and `null` hands it back to the eye.
//
// Prior art: Snell's window and the total internal reflection beyond it (every underwater photograph looking up), Subnautica's and
// Abzu's water columns (fog as the light's falloff, motes for scale and current), the Voronoi caustic of the demo scene and Wind
// Waker's caustic floor, Ecco the Dolphin's surface line and the half-in, half-out lens of a diving camera, Sunless Sea's black zee.
//
//   game.umbral = new Umbral(game, { scene?, vfx?, sea?, hide?, anywhere? })   .update(rawDt, camera) (each frame)
//   .set({ below })        0 above .. 1 below (in between during the crossing); null (the default): the eye's own side of the surface
//   .splash(pos, { power = 1, dive = true })     the ring, the crown and the bubbles where something went through the surface
//   .above(obj, { r, len }) -> { remove() }       a thing floating above whose belly darkens the meniscus (a capsule along the rail, r and
//                                                 half-length in metres; up to six)
//   .below (the look, 0..1)   .eye (1: the eye is under the surface)   .dispose()
//   causticsOn(root)       the caustics on something built of the game's plain materials (the ship, a foe), without touching its
//                          programs: each opaque mesh under root gets a CAUSTIC OVERLAY, the same geometry drawn again in one shared
//                          additive program, shown only while the look is below (one program for all of them; a draw a mesh while under)
//   (the caustics' chunk and shared uniforms, DEEP_GLSL and DEEP_U, live with the opt-in that puts them into materials: vfx/stormwarp.js;
//   the Umbral writes DEEP_U once a frame)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { foamMaterial } from './rail.js';
import { DEEP_U, DEEP_GLSL, keepTrue } from './stormwarp.js';

/** The deep's colour and fog, the motes' rate, the ring's life (real seconds), the band of the lens's line (metres either side of the surface). */
export const UMBRAL = { deep: 0x1a0b28, density: 0.034, motes: 30, ring: 1.4, band: 0.9 };
const MOTE = [new THREE.Color(1.0, 0.8, 0.45), new THREE.Color(0.62, 0.5, 1.0), new THREE.Color(0.35, 0.62, 1.0)]; // (Lachryma's gold, the pale violet, labradorite's blue)
const CRUDE = new THREE.Color(0x231c2c), GLINT = new THREE.Color(1.0, 0.78, 0.4);

/** THE CAUSTIC OVERLAY: the caustics laid over a mesh as light, the same geometry drawn again additively (one shared material and program). */
const OVER_V = /* glsl */`varying vec3 vOverW, vOverN;
void main() { vOverW = (modelMatrix * vec4(position, 1.0)).xyz; vOverN = normalize(normalMatrix * normal); gl_Position = projectionMatrix * (modelViewMatrix * vec4(position, 1.0)); }`;
const OVER_F = /* glsl */`${DEEP_GLSL}
varying vec3 vOverW, vOverN;
void main() { gl_FragColor = vec4(deepCaustics(vOverW, normalize(vOverN)) * 0.7, 1.0); }`;
let overMat = null;
const OVERLAYS = new Set();
export function causticMaterial() {
  if (!overMat) { overMat = new THREE.ShaderMaterial({ name: 'umbral-caustics', uniforms: DEEP_U, vertexShader: OVER_V, fragmentShader: OVER_F, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }); overMat.userData.shared = true; keepTrue(overMat); } // (what wears one is the danger or the ship: the veil leaves it true)
  return overMat;
}
/** Every opaque, unskinned, uninstanced mesh under root (not an outline, not a material that moves its vertices unless marked
 *  `userData.causticSafe`) gets a caustic overlay as its child. Shown at first (so the warm-up compiles it), then only while the look is below. */
export function causticsOn(root) {
  const hosts = [];
  root?.traverse((o) => {
    if (!o.isMesh || o.isSkinnedMesh || o.isInstancedMesh || o.userData.isOutline || o.userData.caustics) return;
    const m = Array.isArray(o.material) ? null : o.material;
    if (!m || m.transparent || m.isShaderMaterial || (m.onBeforeCompile !== THREE.Material.prototype.onBeforeCompile && !m.userData.causticSafe)) return;
    hosts.push(o);
  });
  for (const o of hosts) {
    const c = new THREE.Mesh(o.geometry, causticMaterial()); c.userData.caustics = true; c.renderOrder = o.renderOrder + 1; c.frustumCulled = o.frustumCulled;
    c.onBeforeRender = o.onBeforeRender; c.onAfterRender = o.onAfterRender; // (a seated host's shift rides along: vfx/stormwarp.js warpObject)
    o.add(c); OVERLAYS.add(c);
  }
  return hosts.length;
}

/** A ring of foam lying flat (uv.x round it, uv.y across it), its age one attribute: the wake's own program. */
function ringGeometry(n = 48) {
  const pos = new Float32Array((n + 1) * 2 * 3), uv = new Float32Array((n + 1) * 2 * 2), age = new Float32Array((n + 1) * 2), idx = [];
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
    pos.set([c * 0.82, 0, s * 0.82, c, 0, s], i * 6); uv.set([i / n, 0, i / n, 1], i * 4);
    if (i < n) { const k = i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  g.setAttribute('aAge', new THREE.BufferAttribute(age, 1).setUsage(THREE.DynamicDrawUsage)); g.setIndex(idx);
  return g;
}

const _p = new THREE.Vector3(), _v = new THREE.Vector3(), _q = new THREE.Vector3();
const rnd = (a, b) => a + Math.random() * (b - a);
/** The surface as DRAWN (the Umbral form's lift with it: vfx/crudesea.js surfaceAt), else the one the logic rides. */
const surf = (sea, x, z) => (sea.surfaceAt ? sea.surfaceAt(x, z) : sea.heightAt(x, z));

export class Umbral {
  constructor(game, { scene = null, vfx = null, sea = null, hide = null, anywhere = false } = {}) {
    this.game = game; this.scene0 = scene; this.vfx0 = vfx; this.sea0 = sea; this.hide0 = hide; this.anywhere = anywhere;
    this.forced = null; this.below = 0; this.eye = 0; this.line = -1; this.t = 0; this.acc = 0;
    this.deep = new THREE.Color(UMBRAL.deep);
    this.things = []; this.rings = []; this.fog = null; this.hidden = null;
    this.ringU = { uT: { value: 0 } };
  }
  get scene() { return this.scene0 || this.game.scene; }
  get sea() { return this.sea0 || this.game.emocean?.sea || null; }
  get vfx() { return this.vfx0 || this.game.vfx || null; }

  /** The look's side of the surface: a number steers it (the runtime's form), null hands it back to the eye. */
  set({ below } = {}) { if (below !== undefined) this.forced = below == null ? null : THREE.MathUtils.clamp(+below || 0, 0, 1); }

  /** A thing above the surface whose belly shows from below (a soft shadow on the meniscus, a capsule along the rail). */
  above(obj, { r = 3, len = 0 } = {}) {
    const h = { obj, r, len, remove: () => { const i = this.things.indexOf(h); if (i >= 0) this.things.splice(i, 1); } };
    if (this.things.length < 6) this.things.push(h);
    return h;
  }

  /** Something went through the surface at `pos`: a ring spreads, a crown of crude is thrown up, and bubbles of Lachryma rise below. */
  splash(pos, { power = 1, dive = true } = {}) {
    const sea = this.sea, y = sea ? surf(sea, pos.x, pos.z) : pos.y, P = THREE.MathUtils.clamp(power, 0.3, 2);
    let R = this.rings.find((r) => r.t >= UMBRAL.ring);
    if (!R && this.rings.length < 4) {
      const m = new THREE.Mesh(ringGeometry(), foamMaterial(this.ringU)); m.frustumCulled = false; m.renderOrder = 3; m.userData.zoneFree = true;
      this.scene.add(m); R = { m, t: UMBRAL.ring }; this.rings.push(R);
    }
    if (R) { R.t = 0; R.p = P; R.m.position.set(pos.x, y + 0.06, pos.z); R.m.visible = true; }
    const V = this.vfx; if (!V?.alpha) return;
    const n = Math.round(22 * P);
    for (let i = 0; i < n; i++) { // (the crown: crude flung up and out, falling back; a few glints of Lachryma in it)
      const a = (i / n) * Math.PI * 2 + Math.random() * 0.3, r = rnd(0.3, 0.7) * P, up = rnd(2.5, 5) * P * (dive ? 0.8 : 1.2);
      _p.set(pos.x + Math.cos(a) * r, y + 0.05, pos.z + Math.sin(a) * r); _v.set(Math.cos(a) * rnd(1.2, 2.6), up, Math.sin(a) * rnd(1.2, 2.6));
      const glint = i % 5 === 0;
      (glint ? V.add : V.alpha).emit({ pos: _p, vel: _v, life: rnd(0.6, 1.0), size: glint ? 0.09 : 0.14, sizeEnd: 0.05, color: glint ? GLINT : CRUDE, alpha: glint ? 0.9 : 0.85, alphaEnd: 0, drag: 0.8, gravity: 9.8, shape: glint ? 'core' : 'soft', floor: y - 0.4 });
    }
    for (let i = 0; i < Math.round(16 * P); i++) { // (below: the air and Lachryma the hull dragged down, rising)
      _p.set(pos.x + rnd(-1, 1) * P, y - rnd(0.4, 2.2), pos.z + rnd(-1, 1) * P); _v.set(rnd(-0.6, 0.6), rnd(0.8, 2.2), rnd(-0.6, 0.6));
      V.add.emit({ pos: _p, vel: _v, life: rnd(1.0, 1.8), size: rnd(0.05, 0.1), sizeEnd: 0.03, color: MOTE[i % 3], alpha: 0.7, alphaEnd: 0, drag: 1.5, gravity: -1.2, shape: 'bubble', grow: 4, floor: -1e9 });
    }
  }

  /** Each frame: the eye's side measured, the meniscus turned to face it, the look eased, the column, the caustics, the motes, the rings
   *  and the veil's share written. */
  update(raw = 1 / 60, camera = this.game.camera) {
    this.t += raw;
    const sea = this.sea, inSea = sea?.mesh?.visible !== false && (this.anywhere || this.game.emocean?.stage?.active || this.game.emocean?.seaAshore);
    let d = Infinity;
    if (sea && camera && inSea) d = camera.position.y - surf(sea, camera.position.x, camera.position.z);
    const eye = d < 0 ? 1 : 0;
    if (eye !== this.eye) { this.eye = eye; sea?.under?.(!!eye); }
    const want = this.forced ?? eye;
    this.below = Math.abs(this.below - want) < 1e-3 ? want : THREE.MathUtils.damp(this.below, want, 10, raw);
    // the line of the surface across the lens: while the eye is within the band, it rises up the frame as the eye goes down
    this.line = Math.abs(d) < UMBRAL.band ? THREE.MathUtils.clamp(0.5 - d / (2 * UMBRAL.band), 0, 1) : -1;
    if (this.forced != null && this.line < 0 && this.forced > 0.3 && this.forced < 0.7) this.line = (this.forced - 0.3) / 0.4; // (a runtime's crossing the eye does not make)
    this.column(eye);
    DEEP_U.uDeepOn.value = this.below; DEEP_U.uDeepY.value = (sea?.y ?? 0) + (sea?.lift ?? 0); DEEP_U.uDeepT.value = this.t;
    const lit = this.below > 0.01;
    for (const c of OVERLAYS) { if (!c.parent) OVERLAYS.delete(c); else c.visible = lit; }
    if (sea?.silhouettes) sea.silhouettes(this.things);
    if (this.below > 0.5 && camera) this.motes(raw, camera);
    this.ringU.uT.value = this.t;
    for (const R of this.rings) {
      if (R.t >= UMBRAL.ring) continue;
      R.t += raw; const k = Math.min(1, R.t / UMBRAL.ring), s = (0.4 + 4.2 * (1 - (1 - k) * (1 - k))) * R.p;
      R.m.scale.set(s, 1, s); R.m.geometry.attributes.aAge.array.fill(k); R.m.geometry.attributes.aAge.needsUpdate = true;
      if (sea) R.m.position.y = surf(sea, R.m.position.x, R.m.position.z) + 0.06;
      if (R.t >= UMBRAL.ring) R.m.visible = false;
    }
    const V = this.game.glitch?.veil;
    if (V) { V.below = this.below; V.line = this.line; V.deep.copy(this.deep); }
  }

  /** The water column: the deep's fog and colour over whatever the place set this frame (kept, and given back as the eye surfaces), and
   *  the sky's dome and clouds stepped out while the eye is under (the meniscus and the deep stand in for them). */
  column(eye) {
    const S = this.scene, k = this.below;
    if (S.fog && k > 0.001) {
      const F = S.fog, mine = this.fog && F.color.equals(this.fog.wrote) && Math.abs((F.density ?? 0) - this.fog.wroteD) < 1e-6;
      if (!mine) this.fog = { color: F.color.clone(), density: F.density ?? 0, bg: S.background?.isColor ? S.background.clone() : null, wrote: new THREE.Color(), wroteD: 0 };
      F.color.copy(this.fog.color).lerp(this.deep, k); if (F.density !== undefined) F.density = THREE.MathUtils.lerp(this.fog.density, UMBRAL.density, k);
      if (this.fog.bg && S.background?.isColor) S.background.copy(this.fog.bg).lerp(this.deep, k);
      this.fog.wrote.copy(F.color); this.fog.wroteD = F.density ?? 0;
    } else if (this.fog) { // (surfaced: what the place had is put back once; it writes its own again next frame anyway)
      if (S.fog) { S.fog.color.copy(this.fog.color); if (S.fog.density !== undefined) S.fog.density = this.fog.density; }
      if (this.fog.bg && S.background?.isColor) S.background.copy(this.fog.bg);
      this.fog = null;
    }
    if (eye && !this.hidden) {
      const list = this.hide0 || [this.game.dunes?.sky, this.game.dunes?.clouds?.mesh].filter(Boolean);
      this.hidden = list.map((o) => [o, o.visible]); for (const o of list) o.visible = false;
    } else if (!eye && this.hidden) { for (const [o, v] of this.hidden) o.visible = v; this.hidden = null; }
  }

  /** Motes of Lachryma drifting up round the eye, ahead of it, a few at a time; each swells in and fades as it rises. */
  motes(raw, camera) {
    const V = this.vfx; if (!V?.add) return;
    this.acc += raw * UMBRAL.motes;
    camera.getWorldDirection(_q);
    while (this.acc >= 1) {
      this.acc -= 1;
      const ahead = rnd(3, 16);
      _p.copy(camera.position).addScaledVector(_q, ahead).add(_v.set(rnd(-1, 1) * ahead * 0.7, rnd(-1, 0.6) * ahead * 0.45, rnd(-1, 1) * ahead * 0.7));
      const top = this.sea ? this.sea.y + (this.sea.lift || 0) - 0.6 : _p.y; if (_p.y > top) _p.y = top - rnd(0, 3);
      _v.set(rnd(-0.15, 0.15), rnd(0.25, 0.6), rnd(-0.15, 0.15));
      V.add.emit({ pos: _p, vel: _v, life: rnd(4, 7), size: rnd(0.07, 0.12) * (0.6 + ahead / 12), sizeEnd: 0.02, color: MOTE[(Math.random() * 3) | 0], alpha: 0.75, alphaEnd: 0, drag: 0.6, gravity: -0.12, shape: 'soft', grow: 1.2, floor: -1e9 });
    }
  }

  /** Back as it was: the place's fog and sky, the meniscus facing up, the caustics off, the rings taken down. */
  dispose() {
    this.forced = 0; this.below = 0; this.column(0); if (this.eye) { this.eye = 0; this.sea?.under?.(false); }
    DEEP_U.uDeepOn.value = 0;
    const V = this.game.glitch?.veil; if (V) { V.below = 0; V.line = -1; }
    for (const R of this.rings) { R.m.parent?.remove(R.m); R.m.geometry.dispose(); R.m.material.dispose(); }
    this.rings = []; this.things = [];
  }
}
