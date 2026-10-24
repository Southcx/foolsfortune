// ---------------------------------------------------------------------------------------
// THE DUNES' MIRAGE (plain name; always "the Dunes' mirage": the Crucibelle's mirage is a decoy, game.mirage): the inferior mirage over
// the far flats at the hot of the day. Real air over sun-baked sand is hotter at the ground, light from the low sky bends up off it,
// and the far ground just under the horizon is replaced by a shimmering strip of sky, the far dunes' feet doubled upside down in it
// and wavering. Drawn here as exactly that, with no screen volume and nothing near the camera: a low band stood round the camera far
// out (RING.r metres), its foot on the sand at each bearing, painted with the sky inverted (the pale sky at its foot, the horizon's haze
// above), broken into pools along the horizon and shimmering in slow travelling waves, a dark wavering line near its top for the
// doubled far ground. It stands only where the sand there lies below the eye and runs flat (a mirage is seen at a grazing angle; a
// dune face seen square is not one), and it recedes as you go, since it is always RING.r away (as a real one does). Shown at noon
// (lightAt over NOON), fair or under Desire's dry wind; rain, hail, the pall and the miasma put it out, and so does climbing high.
// Its seam: every wave is a whole number of turns of the ring, so there is none. ONE PROGRAM ADDED ('dunes-mirage'), warmed at boot.
// The band is re-laid on the sand only when the camera has moved RING.relay metres (its far foot moves less than a pixel between).
//
// Prior art: the physics of the inferior mirage (Minnaert, "Light and Colour in the Outdoors", 1954, ch. 4: the sky below the horizon,
// the doubled images, the shimmer), Lawrence of Arabia's Omar Sharif riding out of one, Journey's and Red Dead Redemption's desert
// horizons (a bright strip, not a refraction pass), and the house's own sky (vfx/sky.js: the horizon's haze is the fog's colour).
//
//   const M = new DunesMirage(game, parent)   M.update(dt, { k, sky, haze, dark })   M.prewarm() -> undo
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { DUNE, BARRIER } from '../../world/dunes/dunes.js';

/** The numbers: the band's distance from the camera and its height (m), its columns round, how far the camera moves before it is
 *  re-laid (m); how high over the sand there the eye must be for it to stand (m: none at `eye[0]`, whole at `eye[1]`), how flat the sand
 *  must lie (the slope over 6 m: whole at `flat[0]`, none past `flat[1]`), and how high over the sand the camera may climb before it goes. */
export const RING = { r: 235, h: 6.5, cols: 192, relay: 2.5, eye: [0.5, 5], flat: [0.08, 0.3], climb: [18, 40] };

const VERT = /* glsl */`
attribute float aV; attribute float aAng; attribute float aA;
varying float vV; varying float vAng; varying float vA;
void main() { vV = aV; vAng = aAng; vA = aA; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const FRAG = /* glsl */`
uniform float uT, uK; uniform vec3 uSky, uHaze, uDark;
varying float vV; varying float vAng; varying float vA;
void main() {
  float a0 = vAng;
  // the shimmer: the band's rows pushed up and down by slow travelling waves (whole turns of the ring: no seam), each its own pace
  float w = 0.5 * sin(a0 * 173.0 + uT * 0.9) + 0.3 * sin(a0 * 389.0 - uT * 1.4 + 1.7) + 0.2 * sin(a0 * 811.0 + uT * 2.1 + 0.4);
  float v = clamp(vV + w * 0.07, 0.0, 1.0);
  // the sky inverted: its paler blue at the foot, the horizon's haze above
  vec3 c = mix(uSky, uHaze, smoothstep(0.0, 0.85, v));
  // pools along the horizon (whole turns again), drifting slowly round
  float pool = 0.55 + 0.25 * sin(a0 * 7.0 + uT * 0.011) + 0.2 * sin(a0 * 19.0 - uT * 0.017 + 2.0) + 0.15 * sin(a0 * 43.0 + 1.1);
  pool = smoothstep(0.5, 0.85, pool);
  // the doubled far ground: a dark broken line near the top, wavering with the rows
  float brk = smoothstep(0.1, 0.6, 0.5 + 0.5 * sin(a0 * 97.0 + 0.3) * sin(a0 * 151.0 + 2.2));
  float dbl = smoothstep(0.5, 0.64, v) * (1.0 - smoothstep(0.7, 0.86, v)) * brk;
  c = mix(c, uDark, dbl * 0.55);
  float a = pool * (1.0 - smoothstep(0.45, 0.95, v)) * smoothstep(0.0, 0.12, vV);
  a = max(a, pool * dbl * 0.5);
  a *= uK * vA;
  if (a < 0.003) discard;
  gl_FragColor = vec4(c, a);
}`;

export class DunesMirage {
  constructor(game, parent) {
    this.game = game; this.t = 0; this.at = new THREE.Vector3(Infinity, 0, 0);
    const n = RING.cols + 1, pos = new Float32Array(n * 2 * 3), v = new Float32Array(n * 2), ang = new Float32Array(n * 2), al = new Float32Array(n * 2), idx = [];
    for (let i = 0; i < n; i++) { v[i * 2] = 0; v[i * 2 + 1] = 1; ang[i * 2] = ang[i * 2 + 1] = (i / RING.cols) * Math.PI * 2; if (i < RING.cols) { const a = i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); } }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('aV', new THREE.BufferAttribute(v, 1));
    geo.setAttribute('aAng', new THREE.BufferAttribute(ang, 1)); geo.setAttribute('aA', new THREE.BufferAttribute(al, 1)); geo.setIndex(idx);
    this.u = { uT: { value: 0 }, uK: { value: 0 }, uSky: { value: new THREE.Color(0xcfe6ea) }, uHaze: { value: new THREE.Color(0xe6b48c) }, uDark: { value: new THREE.Color(0x9a6a58) } };
    this.mat = new THREE.ShaderMaterial({ name: 'dunes-mirage', uniforms: this.u, vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false });
    this.obj = new THREE.Mesh(geo, this.mat); this.obj.name = 'dunes-mirage'; this.obj.frustumCulled = false; this.obj.visible = false; this.obj.renderOrder = 1;
    parent.add(this.obj);
  }

  prewarm() { const o = this.obj, v = o.visible; o.visible = true; this.u.uK.value = 0.001; return () => { o.visible = v; this.u.uK.value = 0; }; }

  /** `k` 0..1 how much mirage the hour and the weather allow (index.js); `haze` the horizon's colour (the fog's), `sky` the pale sky. */
  update(dt, { k = 0, sky = null, haze = null } = {}) {
    const g = this.game, cam = g.camera, D = g.dunes;
    this.t += dt;
    let kk = k;
    if (kk > 0.01 && D) { const climb = cam.position.y - D.heightAt(cam.position.x, cam.position.z); kk *= 1 - THREE.MathUtils.smoothstep(climb, RING.climb[0], RING.climb[1]); }
    this.u.uK.value += (kk - this.u.uK.value) * Math.min(1, dt * 0.8); // (eased: it comes up and goes over a few real seconds)
    this.obj.visible = this.u.uK.value > 0.01;
    if (!this.obj.visible) return;
    if (sky) this.u.uSky.value.copy(sky); if (haze) { this.u.uHaze.value.copy(haze); this.u.uDark.value.copy(haze).multiplyScalar(0.62); }
    this.u.uT.value = this.t;
    const p = cam.position;
    if (Math.hypot(p.x - this.at.x, p.z - this.at.z) > RING.relay || Math.abs(p.y - this.at.y) > RING.relay) this.relay(p, D);
  }

  /** The band laid on the sand round `p`: its foot on the ground at each bearing, its strength by how the sand lies there. */
  relay(p, D) {
    this.at.copy(p);
    const G = this.obj.geometry, P = G.attributes.position.array, A = G.attributes.aA.array, R = RING.r, n = RING.cols + 1;
    for (let i = 0; i < n; i++) {
      const a = (i / RING.cols) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a), x = p.x + c * R, z = p.z + s * R;
      const y = D.heightAt(x, z), y2 = D.heightAt(x + c * 6, z + s * 6), y3 = D.heightAt(x - s * 6, z + c * 6);
      const slope = Math.max(Math.abs(y2 - y), Math.abs(y3 - y)) / 6, eye = p.y - y;
      const inside = Math.hypot(x - DUNE.x, z - DUNE.z) < BARRIER + 260; // (the far high dunes past it close the horizon: none on them)
      const w = inside ? THREE.MathUtils.smoothstep(eye, RING.eye[0], RING.eye[1]) * (1 - THREE.MathUtils.smoothstep(slope, RING.flat[0], RING.flat[1])) : 0;
      const o = i * 6; P[o] = P[o + 3] = x; P[o + 1] = y - 0.4; P[o + 4] = y - 0.4 + RING.h; P[o + 2] = P[o + 5] = z; A[i * 2] = A[i * 2 + 1] = w;
    }
    G.attributes.position.needsUpdate = true; G.attributes.aA.needsUpdate = true;
  }
}
