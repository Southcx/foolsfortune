// ---------------------------------------------------------------------------------------
// CRYSTAL FRETS: the stave of a Lachrymite crystal (its main spire: world/dunes/crystals.js) drawn in its five frets, foot to point,
// each in the colour of the note it sounds (tools/crucibelle/songs.js DEGREE_COLOR: the root gold at the foot, then rose, green, blue,
// and the minor seventh violet at the point): the Crucibelle's keys 1 to 5 stood on end, so which height sounds which note is seen as
// well as heard (world/dunes/crystaltuning.js fretAt). The lesser spires stay lilac: the note is read on the stave alone.
//
// Pale colours vanish on bright sand, so the note colours are deepened (stained glass, not pastel), glow more by night than by day
// (the gold most by day, where sand would swallow it), and the frets are LEADED: a dark Lachrymite-violet line between each two, faded
// by how much of a pixel it covers, so a line thinner than a pixel greys the pixel a little and never crawls. A strike lights its fret
// in its own colour and eases out over half a second (the glow replaced by the colour, never added to it: the glow's ACES curve turns
// a bright sum white); a sweet strike runs the frets foot to point, a fret every 0.07 s, as the bloom's sparkle runs up the scale
// (audio/crystal.js crystalSweet). One program: the plain lilac's, patched.
//
// Prior art: the rainbow glockenspiel and Boomwhackers (a colour for each tuned bar, so a child finds the note by eye), colour zoning
// in tourmaline and ametrine (one crystal grown in layers of colour along its length), stained-glass leading (the dark line between
// panes is what makes pale glass read), Guitar Hero's lane colours, and three.js's own onBeforeCompile chunks (as vfx/bismuth.js).
//
//   const mat = crystalFretMaterial({ ...MeshStandardMaterial params }, baseColor)   the material (its uniforms: mat.userData.frets)
//   const frets = new CrystalFrets(instancedMesh)   frets.set(i, floorY, span, k)   (k: 0 none .. 1 drawn; span: the five frets' height)
//   frets.strike(i, fret)   frets.run(i)   frets.update(dt, day)   (day: the daytime share, game.daylight.k.day: the glow by the hour)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { DEGREE_COLOR } from '../tools/crucibelle/songs.js';

const FRETS = 5, FADE = 0.5, STAGGER = 0.07; // (a struck fret's light, in real seconds; the sweet run's step)
// (the note colours deepened, each linear channel to this power, and dimmed as glass: measured at a game noon, the pastel ones vanished
//  on the sand under the sun; their glow by day and by night; the gold's own share of it by day and by night; a struck fret's light)
const PUSH = 2.0, DIM = 0.32, GLOW_DAY = 0.1, GLOW_NIGHT = 0.6, GOLD_DAY = 2.5, GOLD_NIGHT = 1, FLASH = 1.15;
const LEAD = 0x2a1450, SEAM = 0.008; // (the leading: Lachrymite violet; its half width, in shares of the frets' span: 2 to 3 cm)

/** The crystal's own material with its frets patched in: frets drawn where the instance's `aFret.z` is above nothing. */
export function crystalFretMaterial(params, base = 0xcdb8f2) {
  const b = new THREE.Color(base);
  const fret = DEGREE_COLOR.map((hex) => { const c = new THREE.Color(hex); c.r **= PUSH; c.g **= PUSH; c.b **= PUSH; return c; });
  const uni = {
    uFret: { value: fret }, uLead: { value: new THREE.Color(LEAD) }, uDim: { value: DIM }, uSeam: { value: SEAM }, uFlash: { value: FLASH },
    uGlow: { value: GLOW_NIGHT }, uGold: { value: GOLD_NIGHT }, uBaseL: { value: 0.2126 * b.r + 0.7152 * b.g + 0.0722 * b.b },
  };
  const mat = new THREE.MeshStandardMaterial(params);
  mat.userData.frets = uni;
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, uni);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute vec4 aFret;\nattribute vec4 aLit;\nvarying float vFretU;\nvarying float vFretK;\nvarying vec4 vLit;\nvarying float vLit4;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
{ vec4 fw = vec4(transformed, 1.0);
#ifdef USE_INSTANCING
  fw = instanceMatrix * fw;
#endif
  fw = modelMatrix * fw; vFretU = (fw.y - aFret.x) / aFret.y; vFretK = aFret.z; vLit = aLit; vLit4 = aFret.w; }`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
uniform vec3 uFret[5]; uniform vec3 uLead; uniform float uDim; uniform float uSeam; uniform float uFlash; uniform float uGlow; uniform float uGold; uniform float uBaseL;
varying float vFretU; varying float vFretK; varying vec4 vLit; varying float vLit4;`)
      .replace('#include <color_fragment>', `#include <color_fragment>
float fW = max(fwidth(vFretU), 1e-4);
float fLit[5] = float[5](vLit.x, vLit.y, vLit.z, vLit.w, vLit4);
vec3 fC = uFret[0]; float fL = fLit[0], fG = uGold;
for (int i = 1; i < 5; i++) { float s = smoothstep(-fW, fW, vFretU - float(i) * 0.2); fC = mix(fC, uFret[i], s); fL = mix(fL, fLit[i], s); fG = mix(fG, 1.0, s); }
float fB = dot(diffuseColor.rgb, vec3(0.2126, 0.7152, 0.0722)) / uBaseL;
diffuseColor.rgb = mix(diffuseColor.rgb, fC * (uDim * fB * (1.0 - 0.5 * fL)), vFretK);
float fD = abs(fract(vFretU * 5.0 + 0.5) - 0.5) * 0.2, fH = 0.5 * fW;
float fSeam = clamp((uSeam + fH - fD) / (2.0 * min(uSeam, fH)), 0.0, 1.0) * min(1.0, uSeam / fH) * step(0.1, vFretU) * step(vFretU, 0.9) * vFretK;
diffuseColor.rgb = mix(diffuseColor.rgb, uLead, fSeam);`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
vec3 fGlow = fC * (uGlow * fG);
totalEmissiveRadiance = mix(totalEmissiveRadiance, mix(fGlow, max(fGlow, fC * uFlash), fL), vFretK * (1.0 - fSeam));`);
  };
  mat.customProgramCacheKey = () => 'crystalfrets';
  return mat;
}

/** The frets of every spire of one InstancedMesh: where they stand, whether drawn, and what is lit. */
export class CrystalFrets {
  constructor(mesh) {
    const n = mesh.count;
    this.fret = new THREE.InstancedBufferAttribute(new Float32Array(n * 4), 4); // (floor y, span, drawn 0..1, the fifth fret's light)
    this.lit = new THREE.InstancedBufferAttribute(new Float32Array(n * 4), 4); // (the light of the first four frets)
    for (let i = 0; i < n; i++) this.fret.array[i * 4 + 1] = 1; // (never a span of nothing: the shader divides by it)
    mesh.geometry.setAttribute('aFret', this.fret);
    mesh.geometry.setAttribute('aLit', this.lit);
    this.uni = mesh.material.userData.frets;
    this.age = new Map(); // (spire -> each fret's real seconds since it was lit; below nought, waiting its turn in a run)
  }

  /** Where spire `i`'s frets stand (the world height of the first's foot, the five's span) and how much they are drawn. */
  set(i, floorY, span, k) {
    const a = this.fret.array, o = i * 4;
    if (a[o] === floorY && a[o + 1] === span && a[o + 2] === k) return;
    a[o] = floorY; a[o + 1] = Math.max(1e-3, span); a[o + 2] = k;
    this.fret.needsUpdate = true;
  }

  /** A strike on `fret` (0 the foot .. 4 the point) of spire `i`: it lights in its colour and eases out. */
  strike(i, fret) { this.ages(i)[Math.max(0, Math.min(FRETS - 1, fret))] = 0; }

  /** The sweet run: every fret of spire `i` lit in turn, foot to point. */
  run(i) { const t = this.ages(i); for (let f = 0; f < FRETS; f++) t[f] = -f * STAGGER; }

  ages(i) {
    let t = this.age.get(i);
    if (!t) { t = new Float32Array(FRETS).fill(FADE); this.age.set(i, t); }
    return t;
  }

  /** Each tick: the struck frets' light eased out, and the glow for the hour (`day`: render/daylight.js's daytime share, 0 .. 1). */
  update(dt, day = 0) {
    if (this.uni) { this.uni.uGlow.value = GLOW_NIGHT + (GLOW_DAY - GLOW_NIGHT) * day; this.uni.uGold.value = GOLD_NIGHT + (GOLD_DAY - GOLD_NIGHT) * day; }
    if (!this.age.size) return;
    const F = this.fret.array, L = this.lit.array;
    for (const [i, t] of this.age) {
      let on = false;
      for (let f = 0; f < FRETS; f++) {
        t[f] = Math.min(FADE, t[f] + dt);
        const x = t[f] < 0 ? 0 : 1 - t[f] / FADE, v = x * x; // (eased out: bright at once, then lingering)
        if (f < 4) L[i * 4 + f] = v; else F[i * 4 + 3] = v;
        if (t[f] < FADE) on = true;
      }
      if (!on) this.age.delete(i);
    }
    this.lit.needsUpdate = true; this.fret.needsUpdate = true;
  }
}
