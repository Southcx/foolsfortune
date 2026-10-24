// ---------------------------------------------------------------------------------------
// THE DUNES' DUST DEVILS (the owner, 2026-10-24: "more environment features"): a whirl of sand that wanders the open sand on a hot
// afternoon (game hour 13 to 18, fair or a light weather) and whenever Desire's wanting wind blows, a twisting column of grains narrow at
// the foot and flaring at the top, leaning downwind, a ground scuff of dust skirting its foot. Up to three at once, each its own life:
// born out on the sand (never on the oasis's flat, never in water), growing over a few real seconds, carried downwind with a meander,
// spun and shoved by the gusts that sweep the weather (vfx/weatherfx/gusts.js gustAt: a front passing spins it up and pushes it on),
// then thinning out. A look only: nothing is moved or hurt by one.
// THE GRAINS: one Points draw for all three (DEVILS x GRAINS), every grain's place worked out in the vertex shader from its seed and the
// devil's uniforms (where it stands, its strength, its lean, height and spin): rising up the funnel and round it, faster near the axis
// (a vortex keeps its angular momentum), a quarter of them low and wide as the skirt. Soft round dots of the Dunes' sand, lit by the
// hour, Desire's ember mixed in under its wind; their size floored at a pixel and their alpha by the pixel's share, so a far devil is
// a haze and never a crawl of single pixels. ONE PROGRAM ADDED ('dust-devil'), warmed at boot (prewarm()).
// THE SCUFF: the library's sprites on the shared pools (vfx/dunes/effects.js 'dunes.devil.scuff', a held stream following its foot).
//
// Prior art: real dust devils (a convective vortex over hot ground, its debris column flaring at the top, its skirt of dust; Sinclair's
// 1969 field studies: most under 10 m across, lasting minutes, drifting with the mean wind), Journey's sand and Breath of the Wild's
// Gerudo whirlwinds (a column of particles leaning in the wind), the house's own GPU particles (vfx/weatherfx/impacts.js: a pool of
// seeded points moved wholly in the shader, sized by the 480 lines' pixel).
//
//   const D = new DustDevils(game, parent)   D.update(dt, { want, desire, light, sand })   D.prewarm() -> undo   D.live (how many)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { gustAt, GUST_U } from '../weatherfx/gusts.js';
import { DUNE, OASIS, BARRIER, pondDepth } from '../../world/dunes/dunes.js';

/** The numbers: devils at once and grains each; a devil's life (real s), its growth in and out, its height and foot (m), its spin
 *  (rad a real second at the funnel's waist), its drift (m/s, its share of the wind and its meander), where it is born round the camera
 *  (m, and the share of births in view), its rest between births (real s, at full want). */
export const DEVIL = {
  n: 3, grains: 1100, life: [24, 46], grow: 3.5, fade: 5, height: [12, 26], spin: [2.4, 3.8], drift: [2.2, 4.2], meander: 1.6,
  born: [45, 150], ahead: 0.7, rest: [6, 16], gustSpin: 1.6, gustPush: 2.2,
};
const lerp = THREE.MathUtils.lerp, rnd = (a) => lerp(a[0], a[1], Math.random());

const VERT = /* glsl */`
attribute vec4 aSeed; // (devil, its height phase, its angle, its own random)
uniform vec4 uDev[${DEVIL.n}]; uniform vec4 uLean[${DEVIL.n}]; uniform float uT, uPx;
varying float vA; varying float vTone;
#include <fog_pars_vertex>
void main() {
  int i = int(aSeed.x + 0.5);
  vec4 D = uDev[i], L = uLean[i];
  float k = D.w, H = L.z, rn = aSeed.w;
  float skirt = step(rn, 0.25);
  float h = fract(aSeed.y + uT * (0.07 + 0.09 * rn) * (1.0 - 0.6 * skirt));
  float hs = mix(h, h * 0.12, skirt);                                    // (the skirt keeps low)
  float r = mix(0.35, 2.4, pow(hs, 1.5)) * (0.75 + 0.5 * fract(rn * 7.3)) * (0.55 + 0.45 * k);
  r = mix(r, 2.2 + 2.6 * fract(rn * 13.1), skirt);
  float ang = aSeed.z + uT * L.w * (1.3 / (0.45 + r));                   // (faster near the axis)
  float y = hs * H;
  vec3 p = D.xyz;
  p.xz += L.xy * (y * y) / max(1.0, H);                                  // (bent downwind with height)
  p.xz += vec2(sin(y * 0.31 + uT * 1.3 + float(i)), cos(y * 0.27 + uT * 1.1)) * 0.7 * hs; // (its wobble)
  p += vec3(cos(ang) * r, y, sin(ang) * r);
  vec4 mvPosition = viewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  float px = (0.12 + 0.34 * hs + 0.5 * skirt) * (0.6 + rn) * uPx / max(0.1, -mvPosition.z);
  gl_PointSize = clamp(px, 1.0, 9.0);
  vA = k * smoothstep(0.0, 0.06, h) * (1.0 - smoothstep(0.6, 1.0, h)) * (0.35 + 0.4 * rn) * min(1.0, px * px) * mix(1.0, 0.55, skirt);
  vTone = fract(rn * 3.7);
  #include <fog_vertex>
}`;
const FRAG = /* glsl */`
uniform vec3 uCol, uCol2;
varying float vA; varying float vTone;
#include <fog_pars_fragment>
void main() {
  float m = 1.0 - smoothstep(0.15, 0.5, length(gl_PointCoord - 0.5));
  float a = m * vA; if (a < 0.004) discard;
  gl_FragColor = vec4(mix(uCol, uCol2, vTone), a);
  #include <fog_fragment>
}`;

const SAND_LIT = new THREE.Color(0xe9c89c), SAND_SHADE = new THREE.Color(0xb98a62), DESIRE = new THREE.Color(0xff7a4a), NIGHT = new THREE.Color(0x5a4a5e);
const _v = new THREE.Vector3(), _f = new THREE.Vector2(1, 0);

export class DustDevils {
  constructor(game, parent) {
    this.game = game; this.t = 0; this.restT = 3; this.live = 0;
    const N = DEVIL.n * DEVIL.grains, seed = new Float32Array(N * 4), pos = new Float32Array(N * 3);
    for (let d = 0, j = 0; d < DEVIL.n; d++) for (let g = 0; g < DEVIL.grains; g++, j++) seed.set([d, Math.random(), Math.random() * Math.PI * 2, Math.random()], j * 4);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 4));
    this.u = {
      uDev: { value: Array.from({ length: DEVIL.n }, () => new THREE.Vector4()) }, uLean: { value: Array.from({ length: DEVIL.n }, () => new THREE.Vector4(0, 0, 18, 3)) },
      uT: { value: 0 }, uPx: { value: 480 }, uCol: { value: SAND_LIT.clone() }, uCol2: { value: SAND_SHADE.clone() },
    };
    this.mat = new THREE.ShaderMaterial({ name: 'dust-devil', uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {}]), vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false, fog: true });
    Object.assign(this.mat.uniforms, this.u); // (the arrays shared, not copied: merge clones)
    this.obj = new THREE.Points(geo, this.mat); this.obj.name = 'dust-devils'; this.obj.frustumCulled = false; this.obj.visible = false; this.obj.renderOrder = 2;
    parent.add(this.obj);
    this.devils = Array.from({ length: DEVIL.n }, (_, i) => ({ i, on: false, x: 0, z: 0, t: 0, life: 0, k: 0, H: 18, spin: 3, drift: 3, ph: Math.random() * 9, scuff: null, gy: 0 }));
  }

  /** Shown for the boot's compile (its one program), then hidden again. */
  prewarm() { const o = this.obj, v = o.visible; o.visible = true; this.u.uDev.value[0].set(DUNE.x, DUNE.y, DUNE.z, 1); return () => { o.visible = v; this.u.uDev.value[0].w = 0; }; }

  /** `want` 0..1: how much the hour and the weather call for devils (index.js); `desire` 0..1 Desire's share; `light` the hour's
   *  (lightAt); `sand` true while the camera is on the Dunes' open ground. */
  update(dt, { want = 0, desire = 0, light = 1, sand = false } = {}) {
    const g = this.game, cam = g.camera, D = g.dunes;
    this.t += dt;
    if (sand && want > 0.05 && (this.restT -= dt * want) <= 0) { this.restT = rnd(DEVIL.rest); this.spawn(cam, D); }
    let any = false; this.live = 0;
    const wd = D?.wind?.dir || _f, wx = wd.x, wz = wd.y;
    for (const v of this.devils) {
      const U = this.u.uDev.value[v.i], L = this.u.uLean.value[v.i];
      if (!v.on) { U.w = 0; continue; }
      v.t += dt;
      const gust = gustAt(v.x, v.z) * Math.min(1, GUST_U.uGust.value.z / 2), meander = Math.sin(v.t * 0.21 + v.ph) * DEVIL.meander;
      const sp = v.drift + gust * DEVIL.gustPush;
      v.x += (wx * sp - wz * meander) * dt; v.z += (wz * sp + wx * meander) * dt;
      const r = Math.hypot(v.x - DUNE.x - OASIS.x, v.z - DUNE.z - OASIS.z);
      const end = v.t > v.life || !sand || r > BARRIER - 20 || r < OASIS.flat + 10 || want < 0.02;
      if (end && v.t < v.life) v.life = v.t; // (hurried out: it fades from here)
      const kIn = Math.min(1, v.t / DEVIL.grow), kOut = Math.max(0, 1 - (v.t - v.life) / DEVIL.fade);
      v.k = kIn * (v.t > v.life ? kOut : 1) * Math.min(1, 0.4 + want);
      if (v.k <= 0.001 && v.t > v.life) { this.retire(v); U.w = 0; continue; }
      v.gy += (D.heightAt(v.x, v.z) - v.gy) * Math.min(1, dt * 4); // (the foot follows the sand, eased over a crest)
      U.set(v.x, v.gy - 0.2, v.z, v.k);
      L.set(wx * (0.35 + 0.5 * gust), wz * (0.35 + 0.5 * gust), v.H, v.spin * (1 + gust * DEVIL.gustSpin));
      any = true; this.live++;
    }
    this.obj.visible = any;
    if (!any) return;
    // the grains lit by the hour, Desire's ember in them under its wind
    const day = THREE.MathUtils.smoothstep(light, 0.12, 0.55);
    this.u.uCol.value.copy(NIGHT).lerp(SAND_LIT, day).lerp(DESIRE, 0.3 * desire);
    this.u.uCol2.value.copy(NIGHT).multiplyScalar(0.7).lerp(SAND_SHADE, day).lerp(DESIRE, 0.18 * desire);
    this.u.uT.value = this.t;
    this.u.uPx.value = 480 / (2 * Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)));
  }

  /** A devil born out on the open sand, most often where the camera looks. */
  spawn(cam, D) {
    const v = this.devils.find((d) => !d.on); if (!v || !D) return;
    cam.getWorldDirection(_v);
    const look = Math.atan2(_v.z, _v.x);
    for (let tries = 0; tries < 8; tries++) {
      const a = Math.random() < DEVIL.ahead ? look + (Math.random() - 0.5) * 1.6 : Math.random() * Math.PI * 2, d = rnd(DEVIL.born);
      const x = cam.position.x + Math.cos(a) * d, z = cam.position.z + Math.sin(a) * d, lx = x - DUNE.x, lz = z - DUNE.z, r = Math.hypot(lx - OASIS.x, lz - OASIS.z);
      if (r < OASIS.flat + 25 || Math.hypot(lx, lz) > BARRIER - 40 || pondDepth(lx, lz) > -0.5) continue;
      Object.assign(v, { on: true, x, z, t: 0, life: rnd(DEVIL.life), k: 0, H: rnd(DEVIL.height), spin: rnd(DEVIL.spin) * (Math.random() < 0.5 ? -1 : 1), drift: rnd(DEVIL.drift), gy: D.heightAt(x, z) });
      const at = (v.at ||= new THREE.Vector3());
      v.scuff = this.game.vfx?.play('dunes.devil.scuff', { pos: at.set(x, v.gy, z), follow: (h) => v.on && (h.pos.set(v.x, v.gy + 0.1, v.z), h.k = v.k, h.ctx.power = 0.4 + 0.8 * v.k, true) }) || null;
      return;
    }
  }
  retire(v) { v.on = false; v.k = 0; v.scuff?.stop?.(); v.scuff = null; }
  clear() { for (const v of this.devils) if (v.on) this.retire(v); this.obj.visible = false; }
}
