// ---------------------------------------------------------------------------------------
// THE GREAT DUNEMAW'S MOUTH: where the Well in Anagami's Dunes opens (docs/plans/SLICE.md, E1: "a Lachryma distortion: a spinning dark pool, a
// signature the Dreamvane can dowse"). Not water and not a hole: Lachryma swallowing the sand, so it is the Mind's stone made liquid
// (vfx/labradorite.js): black ink in a funnel that sinks toward its eye, spiral arms of the labradorite's flash wound into it and
// turning inward, an iridescent lip where it meets the sand, and motes drawn in off the dunes (the library's 'dunemaw.motes'). It
// darkens what it covers (normal blending): an additive glow could not make a pool black. Its depth is painted (the arms tighten and
// darken toward the eye), as the sand is not cut for it; a real funnel waits on the ground being opened there (Petra's).
//
// Prior art: the maelstrom (Poe's "A Descent into the Maelström", the Corryvreckan's whirlpool: a funnel that steepens toward its eye,
// the spiral arms of foam), the black pool of Silent Hill's and Okami's "other places" opened in the ground, and the labradorite's
// schiller already on the Mind's marks (one stone, one meaning: the Mind's things are labradorite). The maw round it (Espada's reading of
// the name): the sand drawn in, in darker streaks spiralling toward the pool.
//
//   const m = new DunemawMouth({ radius, maw, spout, pit, crown })   (maw: the colour of what it draws in; pit: the antlion pit's sand, once the ground
//     is carved with pitDepth; crown: the Prince's crown round it, the landmark; spout: a slip geyser's column)   PIT, pitDepth(r) (the pit's shape: Petra's heightAt)   scene.add(m.group)   m.update(t, open 0..1)   m.dispose()
//   (its own frame: centred on the sand's surface, Y up; Petra places it, its zone and its signature)
//   const f = new Sandfall({ width, height })   group.add(f.group)   f.update(t, 'open' | 'warn' | 'falling', rawDt)   f.dispose()   (a floor's shifting door)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { LAB_GLSL, mindTime } from './labradorite.js';
import { LIQUID_GLSL, liquidUniforms } from './liquid.js';

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

// the maw: the sand round it drawn in, darker streaks spiralling toward the pool and the sand sinking in its colour as it goes
const MAW_F = `varying vec2 vP; uniform float uT, uOpen; uniform vec3 uMaw;
void main() {
  float r = length(vP); if (r < 1.0 || r > 1.9) discard;
  float a = atan(vP.y, vP.x);
  float streak = 0.5 + 0.5 * sin(a * 11.0 + log(r) * 14.0 + uT * 0.9);
  float pull = 1.0 - smoothstep(1.0, 1.9, r);
  vec3 sand = uMaw * (0.55 + 0.45 * smoothstep(1.0, 1.6, r));
  gl_FragColor = vec4(sand * (0.7 + 0.3 * streak), pull * (0.35 + 0.4 * smoothstep(0.55, 0.9, streak)) * uOpen);
  #include <colorspace_fragment>
}`;

// THE SPOUT: the landmark (Petra's ask: seen from the oasis, 180 m off, and told apart from the spire's straight violet beam). The maw
// does not only swallow: it pours. A dust devil of sand stands up out of the pool, 70 m tall, narrow over the eye and flaring at the top
// like a cup, its sand streaked in a spiral that climbs, the labradorite's colours wound through the streaks (Lachryma in the sand: the
// psychedelic thread, brighter the higher it goes), and over its lip a SANDFALL spills back down and out, a skirt of sand falling
// (the owner's playlist: "Waterfalls Coming Out Your Mouth"). It sways: its axis wanders on two slow waves, so it is alive from afar.
// Prior art: the dust devil (a column narrow at the ground, widening and fraying aloft; its sand is the liquid pack's marbling, vfx/liquid.js), Dune's sandfalls off the shield wall, Journey's
// sand that flows like water, and the fountain's silhouette (up through the middle, down round the outside), which no other landmark has.
const SPOUT_V = `varying vec3 vW, vN; varying float vY, vA; uniform float uT, uH, uFall;
float rOf(float y) { return uFall > 0.5 ? mix(1.0, 1.9, y) : 2.4 - 1.3 * smoothstep(0.0, 0.18, y) + 8.0 * pow(smoothstep(0.1, 1.0, y), 1.6); }
void main() {
  float y = position.y, a = atan(position.z, position.x);
  float r = uFall > 0.5 ? 9.1 * rOf(y) : rOf(y); // (the sandfall leaves from the cup's rim: rOf(1) of the column is 9.1)
  float h = uFall > 0.5 ? uH * (1.0 - 0.5 * y) : y * uH;
  vec3 p = vec3(cos(a) * r, h, sin(a) * r);
  float hy = h / uH; // (the sway: the axis wanders, more the higher it is)
  p.x += (sin(uT * 0.31 + hy * 2.7) * 3.0 + sin(uT * 0.17 + 1.3) * 1.5) * hy * hy;
  p.z += (cos(uT * 0.23 + hy * 2.1) * 3.0) * hy * hy;
  vY = y; vA = a;
  vec4 w = modelMatrix * vec4(p, 1.0); vW = w.xyz; vN = normalize(mat3(modelMatrix) * vec3(cos(a), 0.0, sin(a)));
  gl_Position = projectionMatrix * viewMatrix * w;
}`;
const SPOUT_F = `varying vec3 vW, vN; varying float vY, vA; uniform float uT, uFall; uniform vec3 uSand;
${LAB_GLSL}
${LIQUID_GLSL}
void main() {
  // the sand: the marbling and the bubbles (the liquid pack: vfx/liquid.js) wound round the column and scrolled up it (down the sandfall),
  // two layers at different pitches, so the streaks are sand's, not stripes
  float dir = uFall > 0.5 ? 1.0 : -1.0, u = vA / 6.2832;
  vec2 p1 = vec2(u * 3.0 + vY * 0.9, vY * 2.2 + dir * uT * 0.09), p2 = vec2(u * 5.0 - vY * 1.4, vY * 3.7 + dir * uT * 0.14);
  float m = liqTap(p1).r, b = liqTap(p2).g, v = liqTap(p2 * 0.7 + 0.31).a;
  float streak = m * 0.65 + b * 0.35;
  vec3 V = normalize(cameraPosition - vW);
  float edge = 1.0 - abs(dot(V, vN)); // (dust is thicker seen edge-on: the silhouette holds, the middle is a veil)
  float body = uFall > 0.5 ? (1.0 - smoothstep(0.15, 1.0, vY)) * smoothstep(0.0, 0.06, vY) : (1.0 - smoothstep(0.7, 1.0, vY)) * (0.7 + 0.3 * smoothstep(0.0, 0.1, vY));
  float fray = smoothstep(0.2, 0.55, streak + (uFall > 0.5 ? 0.0 : 0.35 * (1.0 - vY))); // (the dust frays to nothing between the grains, more aloft)
  float alpha = min(1.0, body * fray * (0.65 + 0.6 * edge));
  vec3 col = uSand * (0.55 + 0.6 * streak) * (uFall > 0.5 ? 0.85 : 0.45 + 0.6 * smoothstep(0.0, 0.9, vY)); // (darker toward the ground)
  // the labradorite in the sand: the marbling's veins lit in the Mind's colours, more the higher (the foot is sand, the crown Lachryma)
  float lab = smoothstep(0.55, 0.9, v) * smoothstep(0.08, 0.6, vY) * (uFall > 0.5 ? 0.7 : 1.0);
  col = mix(col, labradorite(labPhase(vW, -V) + vY * 1.3 + vA * 0.16) * 1.6, lab * 0.9);
  gl_FragColor = vec4(col, max(alpha, lab * body * 0.85));
  #include <colorspace_fragment>
}`;

export class DunemawSpout {
  constructor({ height = 70, sand = 0xb8834e } = {}) {
    this.u = { uT: { value: 0 }, uH: { value: height }, uFall: { value: 0 }, uSand: { value: new THREE.Color(sand) }, uMindT: mindTime, ...liquidUniforms() };
    const col = new THREE.CylinderGeometry(1, 1, 1, 48, 40, true); col.translate(0, 0.5, 0); // (y 0..1: the shader shapes it)
    const mk = (fall) => new THREE.ShaderMaterial({ name: fall ? 'dunemaw-sandfall' : 'dunemaw-spout', uniforms: { ...this.u, uFall: { value: fall } }, vertexShader: SPOUT_V, fragmentShader: SPOUT_F,
      transparent: true, depthWrite: false, side: THREE.DoubleSide });
    this.column = new THREE.Mesh(col, mk(0)); this.column.name = 'dunemaw-spout';
    const fallG = new THREE.CylinderGeometry(1, 1, 1, 48, 14, true); fallG.translate(0, 0.5, 0);
    this.fall = new THREE.Mesh(fallG, mk(1)); this.fall.name = 'dunemaw-sandfall'; this.fall.renderOrder = 1;
    for (const m of [this.column, this.fall]) { m.geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, height * 0.6, 0), height); } // (the shader moves it: a sphere that holds it all)
    this.group = new THREE.Group(); this.group.add(this.column, this.fall); this.group.name = 'dunemaw-spout';
  }
  update(t) { for (const m of [this.column, this.fall]) m.material.uniforms.uT.value = t; }
  dispose() { for (const m of [this.column, this.fall]) { m.geometry.dispose(); m.material.dispose(); } }
}

// A SANDFALL (docs/plans/DUNEMAW.md): the shifting door of a side passage, a curtain of sand pouring from above. Petra's collider and
// cycle decide when; this is how it looks, in three states it blends between: OPEN (nothing but a few grains), the WARNING (a trickle
// down the middle, 3 sim seconds before it falls) and FALLING (a full curtain, its streaks pouring, frayed at its edges, the Lachryma
// glinting in it as in the spout's crown). Prior art: Journey's sunken city, its sand pouring from the broken ceilings; Uncharted 3's
// sand pouring through Iram; an hourglass's neck.
const FALL_V = 'varying vec2 vU; varying vec3 vW; void main() { vU = uv; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }';
const FALL_F = `varying vec2 vU; varying vec3 vW; uniform float uT, uAmt, uWarn, uW; uniform vec3 uSand;
${LAB_GLSL}
${LIQUID_GLSL}
void main() {
  float x = vU.x * uW; // (metres across)
  // (threads, not blobs: the noise stretched down the fall, fine across it, two layers falling at different speeds)
  vec2 p1 = vec2(x * 1.1, vU.y * 0.3 + uT * 0.5), p2 = vec2(x * 2.3 + 0.4, vU.y * 0.55 + uT * 0.85);
  float m = liqTap(p1).r, b = liqTap(p2).g, v = liqTap(p2 * vec2(0.5, 1.0)).a;
  float grains = m * 0.6 + b * 0.4;
  float across = 1.0 - abs(vU.x - 0.5) * 2.0;
  float curtain = uAmt * smoothstep(0.0, 0.4, across) * smoothstep(0.38, 0.72, grains + 0.15 * uAmt); // (frayed hard at its sides, thin between its threads)
  float trickle = uWarn * smoothstep(0.86, 0.97, across) * smoothstep(0.3, 0.5, grains); // (the warning: a thin stream down the middle)
  float a = max(curtain, trickle) * smoothstep(0.0, 0.06, vU.y) * smoothstep(1.0, 0.92, vU.y);
  vec3 col = uSand * (0.55 + 0.6 * grains) * (0.6 + 0.4 * vU.y);
  float lab = smoothstep(0.7, 0.95, v) * uAmt;
  col = mix(col, labradorite(labPhase(vW, normalize(cameraPosition - vW)) + vU.y) * 1.4, lab * 0.7);
  gl_FragColor = vec4(col, a);
  #include <colorspace_fragment>
}`;

export class Sandfall {
  /** A curtain `width` by `height` metres, its foot at the group's origin, facing +z (both sides drawn). */
  constructor({ width = 4, height = 5, sand = 0xb8834e } = {}) {
    this.u = { uT: { value: 0 }, uAmt: { value: 0 }, uWarn: { value: 0 }, uW: { value: width }, uSand: { value: new THREE.Color(sand) }, uMindT: mindTime, ...liquidUniforms() };
    const g = new THREE.PlaneGeometry(width, height); g.translate(0, height / 2, 0);
    this.mesh = new THREE.Mesh(g, new THREE.ShaderMaterial({ name: 'dunemaw-sandfall-door', uniforms: this.u, vertexShader: FALL_V, fragmentShader: FALL_F, transparent: true, depthWrite: false, side: THREE.DoubleSide }));
    this.mesh.name = 'sandfall';
    this.group = new THREE.Group(); this.group.add(this.mesh);
    this.amt = 0; this.warn = 0;
  }
  /** state: 'open' | 'warn' | 'falling'. The look eases toward it (a curtain thickens over about a second and thins as fast). */
  update(t, state, raw = 1 / 60) {
    const tA = state === 'falling' ? 1 : 0, tW = state === 'warn' ? 1 : 0;
    this.amt += (tA - this.amt) * (1 - Math.exp(-raw * 3)); this.warn += (tW - this.warn) * (1 - Math.exp(-raw * 4));
    this.u.uT.value = t; this.u.uAmt.value = this.amt; this.u.uWarn.value = this.warn;
    this.mesh.visible = this.amt > 0.01 || this.warn > 0.01;
  }
  dispose() { this.mesh.geometry.dispose(); this.mesh.material.dispose(); }
}

// THE PIT (the owner, 2026-10-06: "a sinkhole like an antlion trap"; docs/plans/DUNEMAW.md): the mouth sits at the bottom of a cone of
// sand. Its shape is one function shared by the ground and the look: Petra carves the Dunes' heightAt with pitDepth, and the sliding
// sand here is laid on the same profile, so they never disagree. The sand on its slope slides toward the eye in streaks that spiral
// inward and darken as they go down. Prior art: the antlion's pit (Myrmeleon: a cone dug at the angle of repose, so the sand gives way
// under anything at its lip), the Sarlacc's, and the sand of an hourglass running out at its neck.
export const PIT = { radius: 16, depth: 8, eye: 1.5 };
/** How far below the surrounding sand the pit's ground is at a distance r from its middle (0 outside it; PIT.depth at the eye). An
 *  S-curve, steepest at about 40 degrees at mid-slope (near the angle of repose), soft at the lip and at the eye. */
export function pitDepth(r) {
  const x = Math.min(1, Math.max(0, (PIT.radius - r) / (PIT.radius - PIT.eye)));
  return PIT.depth * x * x * (3 - 2 * x);
}
const PIT_V = `varying vec2 vP; varying vec3 vW; void main() { vP = position.xz; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;
const PIT_F = `varying vec2 vP; varying vec3 vW; uniform float uT, uR; uniform vec3 uSand;
${LIQUID_GLSL}
void main() {
  float r = length(vP), a = atan(vP.y, vP.x), x = r / uR;
  // the streaks: the sand's grain wound in a spiral that turns inward and slides down (log-polar: the same streak at every size)
  vec2 lp = vec2(a / 6.2832 * 3.0 + log(max(r, 0.3)) * 0.9, log(max(r, 0.3)) * 1.6 + uT * 0.12);
  float g1 = liqTap(lp).b, g2 = liqTap(lp * vec2(2.0, 1.4) + 0.37).r;
  float streak = g1 * 0.6 + g2 * 0.4;
  vec3 col = uSand * (0.62 + 0.45 * streak) * mix(0.42, 1.0, smoothstep(0.08, 0.8, x)); // (darker down toward the eye)
  float alpha = (1.0 - smoothstep(0.88, 1.0, x)) * smoothstep(0.05, 0.12, x); // (faded into the dunes' own sand at the lip; the eye is the pool's)
  gl_FragColor = vec4(col, alpha);
  #include <colorspace_fragment>
}`;
export class DunemawPit {
  constructor({ sand = 0xd8a868 } = {}) {
    this.u = { uT: { value: 0 }, uR: { value: PIT.radius }, uSand: { value: new THREE.Color(sand) }, ...liquidUniforms() };
    const g = new THREE.RingGeometry(PIT.eye * 0.5, PIT.radius, 64, 24); g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) { const r = Math.hypot(pos.getX(i), pos.getZ(i)); pos.setY(i, PIT.depth - pitDepth(r) + 0.06); } // (the group's origin is the eye: the bottom)
    g.computeVertexNormals();
    this.mesh = new THREE.Mesh(g, new THREE.ShaderMaterial({ name: 'dunemaw-pit', uniforms: this.u, vertexShader: PIT_V, fragmentShader: PIT_F, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
    this.mesh.name = 'dunemaw-pit';
  }
  update(t) { this.u.uT.value = t; }
  dispose() { this.mesh.geometry.dispose(); this.mesh.material.dispose(); }
}

// THE PRINCE'S CROWN (Espada's canon proposal: the town raised a statue to the Prince of Clay in the boom, and when the town fell he went
// into the sand face first; LORE.md): the landmark round the pit is the points of his headpiece, which reads as crown, top hat and kiln
// chimney at once, with molten drip glaze under its rim. Seven chimney points lean out of the sand round the pit, 13 to 19 m tall, the
// clay of the island, a run of glaze dripping under each rim. Seen from the oasis, they are a crown on the horizon. Prior art: the Cave
// of Wonders' tiger head rising from the dunes (Aladdin), Ozymandias' "two vast and trunkless legs of stone" (a fallen king's statue in
// the sand), and the Statue of Liberty's crown in the sand at the end of Planet of the Apes.
function chimneyPoint(h) {
  const g = new THREE.CylinderGeometry(1.2, 2.3, h, 4, 6); g.rotateY(Math.PI / 4); g.translate(0, h / 2, 0); // (a square stack, tapering)
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) { const y = pos.getY(i); pos.setX(i, pos.getX(i) * (1 + 0.07 * Math.sin(y * 0.9))); pos.setZ(i, pos.getZ(i) * (1 + 0.07 * Math.cos(y * 0.8))); } // (hand-built: not quite straight)
  g.computeVertexNormals();
  return g;
}
export class PrinceCrown {
  /** The crown's band rings the pit, tilted and half sunk (one side rises out of the sand, the other is under it), its chimney points
   *  along the band: the pit is the inside of the crown, the Prince's own head under it. */
  constructor({ radius = 19, points = 7, tilt = 0.24 } = {}) {
    const clay = new THREE.MeshStandardMaterial({ name: 'prince-crown', color: 0xc77f5a, roughness: 0.85, flatShading: true, side: THREE.DoubleSide });
    const glaze = new THREE.MeshStandardMaterial({ name: 'prince-crown-glaze', color: 0x3b2a5a, roughness: 0.18, metalness: 0.1, emissive: 0x150a24 });
    this.group = new THREE.Group(); this.group.name = 'prince-crown';
    const tilted = new THREE.Group(); tilted.rotation.x = tilt; tilted.position.y = -1.2; this.group.add(tilted);
    const BH = 3.6;
    tilted.add(new THREE.Mesh(new THREE.CylinderGeometry(radius, radius * 1.03, BH, 48, 1, true), clay)); // (the band)
    const drip = new THREE.Mesh(new THREE.CylinderGeometry(radius + 0.06, radius + 0.06, 0.9, 48, 1, true), glaze); drip.position.y = BH / 2 - 0.5; tilted.add(drip); // (the molten drip glaze under the rim)
    for (let k = 0; k < 28; k++) { const a = (k / 28) * Math.PI * 2, d = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.5 + (k % 4) * 0.4, 3, 6), glaze); d.position.set(Math.cos(a) * (radius + 0.08), BH / 2 - 1.2 - (k % 4) * 0.2, Math.sin(a) * (radius + 0.08)); tilted.add(d); }
    for (let i = 0; i < points; i++) {
      const a = (i / points) * Math.PI * 2, h = 13 + 6 * Math.abs(Math.sin(i * 1.7 + 0.4)), pt = new THREE.Group(); // (13 to 19 m: a crown on the horizon from the oasis)
      pt.position.set(Math.cos(a) * radius, BH / 2, Math.sin(a) * radius); pt.rotation.y = -a;
      const lean = new THREE.Group(); lean.rotation.z = -0.22; pt.add(lean); // (leaning out, as a crown's points flare)
      lean.add(new THREE.Mesh(chimneyPoint(h), clay));
      const rim = new THREE.Mesh(new THREE.CylinderGeometry(1.55, 1.45, 0.6, 4), clay); rim.rotation.y = Math.PI / 4; rim.position.y = h + 0.1; lean.add(rim);
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.4, 1.6, 4, 1, true), glaze); cap.rotation.y = Math.PI / 4; cap.position.y = h - 0.9; lean.add(cap);
      tilted.add(pt);
    }
  }
  dispose() { this.group.traverse((o) => { o.geometry?.dispose?.(); }); }
}

export class DunemawMouth {
  constructor({ radius = 4.5, depth = 2.2, maw = 0x6b4c2e, spout = false, pit = false, crown = false } = {}) {
    this.u = { uT: { value: 0 }, uOpen: { value: 1 }, uDepth: { value: depth / radius }, uMindT: mindTime, uMaw: { value: new THREE.Color(maw) } };
    const geo = new THREE.CircleGeometry(1, 64, 0, Math.PI * 2);
    // (rings of vertices, so the funnel can bend: a circle of one ring could not sink)
    const rings = new THREE.RingGeometry(0.001, 1, 64, 24); rings.rotateX(-Math.PI / 2);
    geo.dispose();
    this.mat = new THREE.ShaderMaterial({ uniforms: this.u, vertexShader: V, fragmentShader: F, transparent: true, depthWrite: false, side: THREE.DoubleSide,
      polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
    this.mesh = new THREE.Mesh(rings, this.mat);
    this.mesh.scale.setScalar(radius); this.mesh.position.y = 0.04; this.mesh.renderOrder = 2;
    this.group = new THREE.Group(); this.group.add(this.mesh);
    const mawG = new THREE.RingGeometry(1, 1.9, 64, 4); mawG.rotateX(-Math.PI / 2);
    this.mawMat = new THREE.ShaderMaterial({ uniforms: this.u, vertexShader: V, fragmentShader: MAW_F, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
    this.maw = new THREE.Mesh(mawG, this.mawMat); this.maw.scale.setScalar(radius); this.maw.position.y = 0.03; this.maw.renderOrder = 1; this.group.add(this.maw);
    this.radius = radius;
    if (spout) { this.spout = new DunemawSpout(spout === true ? {} : spout); this.group.add(this.spout.group); } // (a slip geyser's look: the Dunes, docs/plans/DUNES.md)
    if (pit) { this.pit = new DunemawPit(); this.group.add(this.pit.mesh); } // (the antlion pit's sliding sand: only once the ground is carved to PIT, else it would stand as a mound)
    if (crown) { this.crown = new PrinceCrown(); this.crown.group.position.y = pit ? PIT.depth : 0; this.group.add(this.crown.group); } // (the landmark: the Prince's crown in the sand)
  }

  /** Per frame: the time, and how open it is (0 shut: the sand is sand; 1 open: it swallows). */
  update(t, open = 1) {
    this.u.uT.value = t; this.u.uOpen.value = open;
    this.mesh.visible = open > 0.01;
    this.spout?.update(t); this.pit?.update(t);
  }

  dispose() { this.spout?.dispose(); this.pit?.dispose(); this.crown?.dispose(); this.group.parent?.remove(this.group); this.mesh.geometry.dispose(); this.mat.dispose(); this.maw.geometry.dispose(); this.mawMat.dispose(); }
}
