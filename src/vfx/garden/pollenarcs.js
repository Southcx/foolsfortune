// ---------------------------------------------------------------------------------------
// THE POLLEN ARCS: between a launch lotus and the one it throws to, a faint arc of drifting pollen along the very flight the Pneuka Jar
// takes (world/garden/planetbody.js launch: a quadratic arc from the Jar to the landing, its control lifted along both ups by 0.45 of
// the span), so the way between two planetoids is seen before it is flown: a world mark, no words. The motes drift slowly along it both
// ways and wander round it; the arc of the lotus the Jar stands near brightens; at a launch a bright head runs along it with the Jar and
// leaves a trail in the film's colours behind it, fading after the landing.
//
// One THREE.Points for every arc (one draw call, one program): each mote carries its arc's three points and its own seed, and is placed
// on the GPU, so nothing moves on the CPU but a few uniforms. The motes are gold, blended over what is behind them (not added), so the
// arc still reads against the garden's pale day sky.
//
// Prior art: Super Mario Galaxy's launch star (its flight shown by the star's sparkle path), Okami's brush-drawn paths of light, Journey's
// glowing cloth trails, and the drifting pollen of Ghibli's meadows.
//
//   const A = new PollenArcs()   A.build([{ a, c, b }], parent)   A.light(id, dir)   A.follow(k)   A.fade()   A.near(id, k)
//   A.update(rawDt, lamps)   A.dispose()   POLLEN
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

/** Motes an arc, their drift (arc lengths a real second), how far they wander off the path (m), their size (m) and least size (pixels of
 *  the drawn frame), how much of them shows by day and by night, and the light's fade (real s). */
export const POLLEN = { perArc: 72, drift: [0.006, 0.016], wander: 0.55, size: 0.12, minPx: 2.4, day: 0.5, night: 0.8, fadeOut: 1.2 };

const VERT = /* glsl */`
attribute vec3 aA; attribute vec3 aB; attribute vec3 aC; attribute vec4 aSeed;
uniform float uTime; uniform float uPx; uniform float uLitArc; uniform float uLitS; uniform float uLitDir; uniform float uLitA;
uniform float uNearArc; uniform float uNearK; uniform float uBase; uniform float uSize; uniform float uWander; uniform float uMinPx;
varying vec3 vCol; varying float vA;
vec3 arcAt(float s) { float u = 1.0 - s; return aA * (u * u) + aB * (2.0 * u * s) + aC * (s * s); }
vec3 film(float t) {
  float x = fract(t) * 4.0;
  vec3 a = vec3(0.30, 0.06, 0.70), b = vec3(0.04, 0.55, 0.75), c = vec3(0.95, 0.72, 0.18), d = vec3(0.85, 0.10, 0.50);
  return x < 1.0 ? mix(a, b, x) : x < 2.0 ? mix(b, c, x - 1.0) : x < 3.0 ? mix(c, d, x - 2.0) : mix(d, a, x - 3.0);
}
void main() {
  float s = fract(aSeed.x + uTime * aSeed.y);
  vec3 p = arcAt(s);
  vec3 tg = normalize((aB - aA) * (2.0 * (1.0 - s)) + (aC - aB) * (2.0 * s));
  vec3 sd = normalize(cross(tg, abs(tg.y) < 0.95 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0)));
  vec3 bn = cross(sd, tg);
  float ph = aSeed.z * 6.2832 + uTime * (0.45 + 0.4 * fract(aSeed.z * 3.7));
  p += (sd * sin(ph) + bn * cos(ph * 1.37)) * uWander * (0.35 + 0.65 * sin(3.14159 * s)) * fract(aSeed.z * 7.13);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  float ends = smoothstep(0.0, 0.04, s) * smoothstep(1.0, 0.96, s);
  float isLit = (1.0 - step(0.5, abs(aSeed.w - uLitArc))) * uLitA;
  float isNear = (1.0 - step(0.5, abs(aSeed.w - uNearArc))) * uNearK;
  float d = (s - uLitS) * uLitDir;
  float head = exp(-d * d * 300.0) * isLit;
  float trail = (d < 0.0 ? exp(d * 4.0) : 0.0) * isLit;
  float tw = 0.6 + 0.4 * sin(ph * 2.7);
  vA = ends * (uBase * tw + isNear * 0.55 + head * 3.0 + trail * 1.3);
  vCol = mix(vec3(1.0, 0.76, 0.3), film(aSeed.z * 0.31 + uTime * 0.04 + s * 0.8) * 1.3, 0.3 + 0.5 * clamp(trail + isNear * 0.5, 0.0, 1.0)) + vec3(0.8) * head;
  float px = uPx * uSize * (1.0 + 1.6 * head + 0.4 * isNear) / max(0.1, -mv.z);
  vA *= clamp(px / uMinPx, 0.45, 1.0);
  gl_PointSize = max(px, uMinPx);
}`;
const FRAG = /* glsl */`
varying vec3 vCol; varying float vA;
void main() { vec2 q = gl_PointCoord * 2.0 - 1.0; float r = dot(q, q); if (r > 1.0) discard; gl_FragColor = vec4(vCol * (1.0 + 0.35 * max(0.0, vA - 1.0)), clamp(vA, 0.0, 1.0) * (1.0 - r * r) * 0.85); }`;

export class PollenArcs {
  constructor() {
    this.u = { uTime: { value: 0 }, uPx: { value: 300 }, uLitArc: { value: -1 }, uLitS: { value: 0 }, uLitDir: { value: 1 }, uLitA: { value: 0 },
      uNearArc: { value: -1 }, uNearK: { value: 0 }, uBase: { value: POLLEN.day }, uSize: { value: POLLEN.size }, uWander: { value: POLLEN.wander }, uMinPx: { value: POLLEN.minPx } };
    this.mat = new THREE.ShaderMaterial({ name: 'garden-pollen-arcs', uniforms: this.u, vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false }); // (blended over, not added: gold motes read on the garden's pale day sky, where added light vanished)
    this.points = null; this.lit = null; this.t = 0;
  }

  /** The arcs: each { a, c, b } (the flight's start, its control and its landing, world points), into `parent`. */
  build(arcs, parent) {
    this.dispose(false);
    const N = POLLEN.perArc, n = arcs.length * N, A = new Float32Array(n * 3), B = new Float32Array(n * 3), C = new Float32Array(n * 3), S = new Float32Array(n * 4);
    let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    arcs.forEach((arc, id) => {
      for (let i = 0; i < N; i++) {
        const k = id * N + i; arc.a.toArray(A, k * 3); arc.c.toArray(B, k * 3); arc.b.toArray(C, k * 3);
        const sp = POLLEN.drift[0] + rnd() * (POLLEN.drift[1] - POLLEN.drift[0]);
        S[k * 4] = (i + rnd()) / N; S[k * 4 + 1] = i % 2 ? sp : -sp; S[k * 4 + 2] = rnd(); S[k * 4 + 3] = id;
      }
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(A, 3)); g.setAttribute('aA', new THREE.BufferAttribute(A, 3)); g.setAttribute('aB', new THREE.BufferAttribute(B, 3));
    g.setAttribute('aC', new THREE.BufferAttribute(C, 3)); g.setAttribute('aSeed', new THREE.BufferAttribute(S, 4));
    const P = (this.points = new THREE.Points(g, this.mat)); P.name = 'garden-pollen-arcs'; P.frustumCulled = false; P.renderOrder = 3;
    P.onBeforeRender = (r, sc, cam) => { const t = r.getRenderTarget(); this.u.uPx.value = (t ? t.height : r.getDrawingBufferSize(_s).y) * 0.5 * cam.projectionMatrix.elements[5]; };
    parent.add(P);
    return P;
  }

  /** A launch along arc `id` (dir +1 from its start, -1 from its landing): its head runs with the Jar. */
  light(id, dir) { this.lit = { id, dir, k: 0, out: 0 }; this.u.uLitArc.value = id; this.u.uLitDir.value = dir; this.u.uLitA.value = 1; this.follow(0); }
  /** The Jar's share of its flight (0 .. 1, eased as the body flies it). */
  follow(k) { const L = this.lit; if (!L) return; L.k = k; this.u.uLitS.value = L.dir > 0 ? k : 1 - k; }
  /** The flight is over: the trail fades. */
  fade() { if (this.lit) this.lit.out = POLLEN.fadeOut; }
  /** The arc of the lotus the Jar stands near, and how near (0 .. 1). */
  near(id, k) { this.u.uNearArc.value = id ?? -1; this.u.uNearK.value = k; }

  update(raw, lamps = 0) {
    this.t += raw; this.u.uTime.value = this.t % 3600; this.u.uBase.value = POLLEN.day + (POLLEN.night - POLLEN.day) * lamps;
    const L = this.lit; if (L?.out > 0) { L.out -= raw; this.u.uLitA.value = Math.max(0, L.out / POLLEN.fadeOut); if (L.out <= 0) { this.lit = null; this.u.uLitArc.value = -1; } }
  }
  dispose(all = true) { if (this.points) { this.points.removeFromParent(); this.points.geometry.dispose(); this.points = null; } if (all) this.mat.dispose(); }
}
const _s = new THREE.Vector2();
