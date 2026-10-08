// ---------------------------------------------------------------------------------------
// A CASCADE, DRAWN (the glossary: a cascade; docs/plans/SPIRIT-GARDEN.md section 7, items 12 and 29): water held deep on the side of a
// planetoid that faces a linked one spills over and falls to it (world/garden/cascades.js, Petra's rule: which pair, how much, which
// feeling). This draws each running one as Lachryma in the air:
//
//   THE RIBBON   a strip along the fall's arc (the same curve the rule's stand-in drew: out from the rim, then down to the other's
//                ground), turned to the eye each frame, narrow where it leaves the rim and spreading as it falls; the liquid pack's
//                marbling scrolled down it (vfx/liquid.js), so it reads as water moving, never a texture sliding; its feeling's canon
//                colour (progress/weather.js COLOR) in the body, the film's colours in its veins, white at its frayed edges
//   THE SPRAY    where it lands: drops thrown up and out along the landing planetoid's up and falling back, each on its own clock,
//                in the same colours
// One material for every cascade's ribbon and spray (one program; cascadeParked for the warm-up).
//
// Prior art: Super Mario Galaxy's waterfalls between planetoids, scrolling-UV waterfalls of every console game since Ocarina of Time
// (two layers at different speeds, an alpha-eroded edge: Simon Trümpler's and Ryan Brucks' waterfall breakdowns), and From Dust's
// falls off a cliff's edge.
//
//   const L = new CascadeLook(group)   L.update(raw, running, camera)   (running: [{ from, to, at, land, feeling }], the rule's list)
//   cascadeParked() -> a mesh for the warm-up   CASCADE_LOOK (data)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { COLOR } from '../../progress/weather.js';
import { GROUND_UNIFORMS } from './gardengrounds.js';
import { liquidUniforms, LIQUID_GLSL } from '../liquid.js';

/** The look's numbers: `segs` along the arc, metres `width` (at the rim, at the foot), `lift` off the ground at each end, m/s `speed`
 *  (the marbling's scroll down the fall), `spray` drops, their `height` (metres) and `life` (real seconds). */
export const CASCADE_LOOK = { segs: 32, width: [1.1, 2.1], lift: 0.1, speed: 3.2, spray: 36, height: 1.8, life: 0.9 };

let MAT = null;
const VERT = /* glsl */`
attribute vec3 aQ;
attribute vec3 aBase;
uniform float uGTime;
varying vec3 vQ;
varying float vAge;
#include <common>
#include <fog_pars_vertex>
void main() {
  vQ = aQ; vAge = 0.0;
  vec3 wp = position;
  if (aQ.z > 0.5) {
    // a drop of the spray: aBase its landing point, position its up there, aQ.xy its corner and its seed in aQ.z - 1
    float seed = aQ.z - 1.0, t = fract(uGTime / ${CASCADE_LOOK.life.toFixed(2)} + seed * 7.13);
    vec3 up = normalize(position), side = normalize(cross(up, vec3(0.37, 0.81, 0.45))), side2 = cross(up, side);
    float a = seed * 40.0;
    vec3 c = aBase + up * (${CASCADE_LOOK.height.toFixed(2)} * 4.0 * t * (1.0 - t)) + (side * cos(a) + side2 * sin(a)) * (0.25 + 1.1 * t) * (0.5 + fract(seed * 13.7));
    vec3 right = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]), camUp = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);
    float s = 0.1 * (1.0 - 0.5 * t);
    wp = c + (right * aQ.x + camUp * aQ.y) * s;
    vAge = t;
  }
  vec4 mvPosition = viewMatrix * vec4(wp, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const FRAG = /* glsl */`
uniform vec3 uCColor;
uniform float uGTime, uGNight;
varying vec3 vQ;
varying float vAge;
#include <common>
#include <fog_pars_fragment>
//LIQUID
void main() {
  vec3 col; float a;
  if (vQ.z > 0.5) {
    float r = length(vQ.xy); if (r > 1.0) discard;
    col = mix(vec3(0.95, 0.97, 1.0), uCColor, 0.45); a = (1.0 - smoothstep(0.4, 1.0, r)) * (1.0 - vAge) * 0.85;
  } else {
    // the ribbon: vQ.x across (-1..1), vQ.y metres down the fall
    float s = vQ.y - uGTime * ${CASCADE_LOOK.speed.toFixed(2)}, x = vQ.x;
    vec2 p1 = vec2(x * 0.35, s * 0.18), p2 = vec2(x * 0.5 + 0.3, s * 0.11 - uGTime * 0.4);
    float m = liqTap(p1).r * 0.6 + liqTap(p2).r * 0.4, vein = liqTap(p1 * 1.3 + 0.2).a;
    float edge = 1.0 - smoothstep(0.55 + 0.35 * m, 1.0, abs(x)); // (its edges frayed by the marbling, never a straight line)
    col = mix(uCColor * (0.75 + 0.6 * m), vec3(0.95, 0.97, 1.0), smoothstep(0.62, 0.9, m) * 0.7 + (1.0 - edge) * 0.4);
    col += liqFilm(m * 1.4 + s * 0.05) * pow(vein, 2.0) * 0.25;
    col *= 1.0 + 0.7 * uGNight;
    a = edge * (0.72 + 0.28 * m);
  }
  if (a < 0.01) discard;
  gl_FragColor = vec4(col, a);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  #include <fog_fragment>
}`;

/** The one material every cascade is drawn with (made on first need; shared, never disposed). */
export function cascadeMaterial() {
  if (MAT) return MAT;
  MAT = new THREE.ShaderMaterial({ name: 'garden-cascade', vertexShader: VERT, fragmentShader: FRAG.replace('//LIQUID', LIQUID_GLSL), transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: true,
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog]) });
  Object.assign(MAT.uniforms, liquidUniforms(), { uCColor: { value: new THREE.Color(COLOR.wonder) }, uGTime: GROUND_UNIFORMS.uGTime, uGNight: GROUND_UNIFORMS.uGNight });
  MAT.userData.shared = true;
  return MAT;
}

/** One cascade's geometry: the ribbon's two rows of points along the arc, and the spray's quads at the foot. */
function cascadeGeometry() {
  const L = CASCADE_LOOK, nr = (L.segs + 1) * 2, ns = L.spray * 4, n = nr + ns, g = new THREE.BufferGeometry();
  const Q = new Float32Array(n * 3), idx = [];
  for (let s = 0; s <= L.segs; s++) { Q.set([-1, 0, 0], (s * 2) * 3); Q.set([1, 0, 0], (s * 2 + 1) * 3); if (s < L.segs) { const a = s * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } }
  for (let d = 0; d < L.spray; d++) { const o = nr + d * 4, seed = 1 + (d + 0.5) / L.spray; [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([x, y], k) => Q.set([x, y, seed], (o + k) * 3)); idx.push(o, o + 1, o + 2, o + 1, o + 3, o + 2); }
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3).setUsage(THREE.DynamicDrawUsage));
  g.setAttribute('aQ', new THREE.BufferAttribute(Q, 3).setUsage(THREE.DynamicDrawUsage));
  g.setAttribute('aBase', new THREE.BufferAttribute(new Float32Array(n * 3), 3).setUsage(THREE.DynamicDrawUsage));
  g.setIndex(idx); g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
  return g;
}

/** A small cascade of the material for the warm-up (parked hidden; never disposed). */
export function cascadeParked() { const m = new THREE.Mesh(cascadeGeometry(), cascadeMaterial()); m.name = 'garden-cascade-parked'; m.frustumCulled = false; return m; }

export class CascadeLook {
  constructor(group) { this.group = group; this.looks = new Map(); this.curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()); }

  /** A frame: a mesh for each running cascade (made as one starts, taken away as it stops), laid along its arc and turned to the eye. */
  update(raw, running = [], camera = null) {
    const live = new Set(), L = CASCADE_LOOK, eye = camera?.position;
    for (const c of running) {
      const key = `${c.from.id}>${c.to.id}`; live.add(key);
      let m = this.looks.get(key);
      if (!m) { m = new THREE.Mesh(cascadeGeometry(), cascadeMaterial()); m.name = 'garden-cascade'; m.frustumCulled = false; m.renderOrder = 2; this.group.add(m); this.looks.set(key, m); }
      if (c.feeling && COLOR[c.feeling] != null) cascadeMaterial().uniforms.uCColor.value.setHex(COLOR[c.feeling]); // (one colour for the falls: the last running one's feeling)
      const a = c.from.c.clone().addScaledVector(c.at, c.from.radiusAt(c.at) + L.lift), b = c.to.c.clone().addScaledVector(c.land, c.to.radiusAt(c.land) + L.lift);
      const mid = a.clone().lerp(b, 0.5).add(a.clone().sub(c.from.c).normalize().multiplyScalar(a.distanceTo(b) * 0.25)); // (it leaves outward, then falls: the rule's own arc)
      this.curve.v0.copy(a); this.curve.v1.copy(mid); this.curve.v2.copy(b);
      const P = m.geometry.attributes.position, Q = m.geometry.attributes.aQ, B = m.geometry.attributes.aBase, len = this.curve.getLength();
      for (let s = 0; s <= L.segs; s++) {
        const t = s / L.segs, p = this.curve.getPoint(t, _p), tan = this.curve.getTangent(t, _t), to = eye ? _e.copy(eye).sub(p).normalize() : _e.set(0, 0, 1);
        const side = _s.crossVectors(tan, to).normalize(), w = (L.width[0] + (L.width[1] - L.width[0]) * t * t) / 2;
        P.setXYZ(s * 2, p.x - side.x * w, p.y - side.y * w, p.z - side.z * w); P.setXYZ(s * 2 + 1, p.x + side.x * w, p.y + side.y * w, p.z + side.z * w);
        Q.setY(s * 2, t * len); Q.setY(s * 2 + 1, t * len); // (metres down the fall: the marbling scrolls along it)
      }
      const up = _u.copy(c.land).normalize(), nr = (L.segs + 1) * 2;
      for (let v = nr; v < P.count; v++) { P.setXYZ(v, up.x, up.y, up.z); B.setXYZ(v, b.x, b.y, b.z); }
      P.needsUpdate = Q.needsUpdate = B.needsUpdate = true;
    }
    for (const [key, m] of this.looks) if (!live.has(key)) { this.group.remove(m); m.geometry.dispose(); this.looks.delete(key); }
  }
}
const _p = new THREE.Vector3(), _t = new THREE.Vector3(), _e = new THREE.Vector3(), _s = new THREE.Vector3(), _u = new THREE.Vector3();
