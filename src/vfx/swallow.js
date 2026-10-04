// ---------------------------------------------------------------------------------------
// THE SWALLOW'S MOUTH: where the Well in Anagami's Dunes opens (docs/plans/SLICE.md, E1: "a Lachryma distortion: a spinning dark pool, a
// signature the Dreamvane can dowse"). Not water and not a hole: Lachryma swallowing the sand, so it is the Mind's stone made liquid
// (vfx/labradorite.js): black ink in a funnel that sinks toward its eye, spiral arms of the labradorite's flash wound into it and
// turning inward, an iridescent lip where it meets the sand, and motes drawn in off the dunes (the library's 'swallow.motes'). It
// darkens what it covers (normal blending): an additive glow could not make a pool black. Its depth is painted (the arms tighten and
// darken toward the eye), as the sand is not cut for it; a real funnel waits on the ground being opened there (Petra's).
//
// Prior art: the maelstrom (Poe's "A Descent into the Maelström", the Corryvreckan's whirlpool: a funnel that steepens toward its eye,
// the spiral arms of foam), the black pool of Silent Hill's and Okami's "other places" opened in the ground, and the labradorite's
// schiller already on the Mind's marks (one stone, one meaning: the Mind's things are labradorite).
//
//   const m = new SwallowMouth({ radius })   scene.add(m.group)   m.update(t, open 0..1)   m.dispose()
//   (its own frame: centred on the sand's surface, Y up; Petra places it, its zone and its signature)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { LAB_GLSL, mindTime } from './labradorite.js';

const V = `varying vec2 vP; varying vec3 vW; uniform float uDepth, uOpen;
void main() { vP = position.xz; vec3 p = position; float r = clamp(length(p.xz), 0.0, 1.0);
  p.y += 0.0 * uDepth; // (no real sinking: the sand would cover the eye; the depth is painted, below, until the ground is cut for it)
  vec4 w = modelMatrix * vec4(p, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;
const F = `varying vec2 vP; varying vec3 vW; uniform float uT, uOpen;
${LAB_GLSL}
void main() {
  float r = length(vP); if (r > 1.0) discard;
  float a = atan(vP.y, vP.x);
  // the arms: a logarithmic spiral turning inward with time (three of them, as a whirlpool has a few)
  float arm = 0.5 + 0.5 * sin(a * 3.0 + log(max(r, 0.02)) * 7.0 + uT * 1.4);
  float arms = smoothstep(0.62, 0.95, arm) * smoothstep(0.05, 0.4, r) * (1.0 - smoothstep(0.85, 1.0, r));
  vec3 viewDir = normalize(vW - cameraPosition);
  float ph = labPhase(vW, viewDir) + a * 0.16 + r * 0.6;
  vec3 col = mix(LAB_INK, labSoft(ph) * 0.9, arms * 0.85);
  // the lip: an iridescent rim where it meets the sand; the eye: the deepest black
  float lip = smoothstep(0.8, 0.93, r) * (1.0 - smoothstep(0.93, 1.0, r));
  col = mix(col, labradorite(ph + 0.3) * 1.2, lip * 0.9);
  // the depth, painted: the arms tighten and darken toward the eye, the eye a black that swallows the light
  col *= 0.15 + 0.85 * smoothstep(0.0, 0.55, r);
  float alpha = (1.0 - smoothstep(0.94, 1.0, r)) * uOpen;
  gl_FragColor = vec4(col, alpha);
  #include <colorspace_fragment>
}`;

export class SwallowMouth {
  constructor({ radius = 4.5, depth = 2.2 } = {}) {
    this.u = { uT: { value: 0 }, uOpen: { value: 1 }, uDepth: { value: depth / radius }, uMindT: mindTime };
    const geo = new THREE.CircleGeometry(1, 64, 0, Math.PI * 2);
    // (rings of vertices, so the funnel can bend: a circle of one ring could not sink)
    const rings = new THREE.RingGeometry(0.001, 1, 64, 24); rings.rotateX(-Math.PI / 2);
    geo.dispose();
    this.mat = new THREE.ShaderMaterial({ uniforms: this.u, vertexShader: V, fragmentShader: F, transparent: true, depthWrite: false, side: THREE.DoubleSide,
      polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
    this.mesh = new THREE.Mesh(rings, this.mat);
    this.mesh.scale.setScalar(radius); this.mesh.position.y = 0.04; this.mesh.renderOrder = 2;
    this.group = new THREE.Group(); this.group.add(this.mesh);
    this.radius = radius;
  }

  /** Per frame: the time, and how open it is (0 shut: the sand is sand; 1 open: it swallows). */
  update(t, open = 1) {
    this.u.uT.value = t; this.u.uOpen.value = open;
    this.mesh.visible = open > 0.01;
  }

  dispose() { this.group.parent?.remove(this.group); this.mesh.geometry.dispose(); this.mat.dispose(); }
}
