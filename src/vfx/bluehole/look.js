// ---------------------------------------------------------------------------------------
// THE BLUE HOLE'S LOOK (plain names; Petra's first pass, Calissa's to take further: docs/handoffs/calissa/bluehole.md; South,
// 2026-11-22: "go wild with the procedural generation of psychedelic seaweed and warped coral walls"). Built with the room
// (world/bluehole/bluehole.js) inside its group, in the room's own frame (y 0 the water), and disposed with it. What it draws:
//   - the walls: the shaft's triangles (world/bluehole/shaft.js) in one glowing standard material, pale limestone over the water
//     turning to coral rock under it, banded in slow drifting hues that glow brighter the deeper they lie (the psychedelic, earned
//     by depth: the light from above gives out and the walls' own light takes over);
//   - the coral: branching colonies grown off the walls (recursive tubes, fans and bushes) and lathe sponges on the shelves, merged;
//   - the kelp: ribbons rooted on every upward shelf and the floor, swaying, twisting and cycling hue in the vertex and fragment
//     shaders, specked with sparkle; the cenote's roots hung from the lip to the water the same way, upside down;
//   - the light shafts: two turning cones of rays from the opening, fading with depth (god rays);
//   - the water's face: a disc at y 0, teal from above, a bright silver ceiling from below (Snell's window);
//   - the motes: drifting specks through the whole shaft; the schools: small fish circling the axis in three bands;
//   - the dock, its door home (a glowing arch) and its lantern; a cyan lamp in the bell and a violet one at the floor (the light budget's).
//
// Prior art: abyssal-garden (Maksymilian Dendura, MIT, github.com/Noniv/abyssal-garden): its kelp leaves (ribbons bent by height,
// swayed by sin(t * 0.5 + phase + h * 0.09) at amplitude 0.024 h^1.25, twisted, sparkle specks, gold/green/cyan/magenta types, emissive),
// its meshCoral (recursive branching tubes, fan or bush) and meshLathe (lumped, ribbed profile rings) for the sponges, its god rays and
// per-channel absorption (the fog's colours, bluehole.js DEEP_AIR); Ecco the Dolphin's and Subnautica's glowing deep, Abzu's schools,
// Dave the Diver's blue hole.
//
//   new BlueHoleLook(game, group, shaft, { dock, door })   .update(dt, depth)   .dispose()   BLUE_LOOK (the numbers)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { wallAt, radiusAt, fbm, CLIFF, FLOOR } from '../../world/bluehole/shaft.js';
import { cityPlan, CITY } from '../../world/bluehole/city.js';
import { CityLook } from './city.js';

/** The look's numbers: how many of each thing, and its glow. */
export const BLUE_LOOK = { kelp: 900, roots: 220, corals: 70, sponges: 46, motes: 1400, schools: [[-8, 40, 0xbff4ff], [-26, 56, 0xffd36a], [-46, 40, 0xff7ad9]], wallGlow: 0.9, absorb: [0.058, 0.0235, 0.0195] }; // (absorb: per metre under the water, red, green, blue: abyssal-garden's SIG)

let seed = 1;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const HSV = /* glsl */`vec3 hsv(float h, float s, float v) { vec3 k = clamp(abs(fract(h + vec3(0.0, 2.0 / 3.0, 1.0 / 3.0)) * 6.0 - 3.0) - 1.0, 0.0, 1.0); return v * mix(vec3(1.0), k, s); }`;

/** A standard material whose vertices carry a glow (aGlow) and a hue (aHue): the glow drifts in hue with height and time and pulses
 *  slowly, added to the emissive light (fog and the lamps as any standard surface). */
export function glowMaterial(uTime, { rough = 0.85, glow = 1, metal = 0 } = {}) {
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: rough, metalness: metal });
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = uTime;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float aGlow;\nattribute float aHue;\nvarying float vGlow;\nvarying float vHue;\nvarying float vY;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvGlow = aGlow; vHue = aHue; vY = position.y;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>\nuniform float uTime;\nvarying float vGlow;\nvarying float vHue;\nvarying float vY;\n${HSV}`)
      .replace('#include <color_fragment>', `#include <color_fragment>
        diffuseColor.rgb *= exp(-vec3(${BLUE_LOOK.absorb.join(', ')}) * max(0.0, -vY) * 2.6); // (the light from above loses red first, then green)`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        float band = 0.5 + 0.5 * sin(vY * 0.9 - uTime * 0.7 + vHue * 12.0);
        totalEmissiveRadiance += hsv(vHue + vY * 0.012 + uTime * 0.015, 0.8, 1.0) * vGlow * ${glow.toFixed(2)} * (0.45 + 0.55 * band);`);
  };
  m.customProgramCacheKey = () => `bluehole-glow-${glow}`;
  return m;
}

/** Colour, glow and hue attributes on a geometry from a function of the vertex (x, y, z) -> [r, g, b, glow, hue]. */
export function paint(geo, fn) {
  const p = geo.attributes.position, n = p.count, col = new Float32Array(n * 3), gl = new Float32Array(n), hu = new Float32Array(n);
  for (let i = 0; i < n; i++) { const o = fn(p.getX(i), p.getY(i), p.getZ(i), i); col[i * 3] = o[0]; col[i * 3 + 1] = o[1]; col[i * 3 + 2] = o[2]; gl[i] = o[3]; hu[i] = o[4]; }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3)); geo.setAttribute('aGlow', new THREE.BufferAttribute(gl, 1)); geo.setAttribute('aHue', new THREE.BufferAttribute(hu, 1));
  return geo;
}

export class BlueHoleLook {
  constructor(game, group, shaft, { dock, door }) {
    this.game = game; this.group = group; seed = 20261122;
    this.uTime = { value: 0 };
    this.disposables = [];
    const keep = (o) => { this.disposables.push(o); return o; };
    this.walls(shaft, keep);
    this.lip(shaft, keep);
    this.corals(keep);
    this.kelp(keep);
    this.rays(keep);
    this.surface(keep);
    this.motes(keep);
    this.schools(keep);
    this.dock(dock, door, keep);
    this.city = new CityLook(group, this.uTime, keep); // (the sunken city on the bell's floor: vfx/bluehole/city.js)
    // the sky over the cenote: the game's own painted dome (vfx/sky.js), the dunes' sun on it, following the camera
    if (game.sky?.domeMaterial) {
      this.domeMat = keep(game.sky.domeMaterial(game.dunes?.sunDir?.clone?.() ?? new THREE.Vector3(0.18, 0.96, 0.22)));
      this.dome = new THREE.Mesh(keep(new THREE.SphereGeometry(330, 32, 16)), this.domeMat); this.dome.frustumCulled = false; this.dome.renderOrder = -10;
      this.dome.userData.zone = 'bluehole'; game.scene.add(this.dome);
    }
  }

  // ---- the walls: limestone over the water, coral rock under it, glowing in bands that brighten with depth
  walls(S, keep) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(S.pos.slice(), 3)); g.setIndex(new THREE.BufferAttribute(S.idx, 1)); g.computeVertexNormals();
    paint(g, (x, y, z) => {
      const n = fbm(x * 0.35, y * 0.35, z * 0.35, 3), deep = Math.min(1, Math.max(0, -y / 40));
      const lime = [0.86 + n * 0.08, 0.8 + n * 0.08, 0.66 + n * 0.06], coral = [0.62 + n * 0.25, 0.5 + 0.2 * n, 0.46 + 0.1 * deep];
      const k = Math.min(1, Math.max(0, (0.5 - y) / 4));
      const strata = 0.82 + 0.18 * Math.sin(y * 2.6 + n * 5); // (bedding planes in the limestone)
      const stain = Math.max(0, fbm(x * 0.5, y * 0.04, z * 0.5, 2)) * 1.4; // (dark streaks run down from the lip: water and roots)
      const algae = Math.max(0, 1 - Math.abs(y - 0.6) / 1.6); // (green at the waterline)
      const c = lime.map((v, i) => (v + (coral[i] - v) * k) * strata * (1 - 0.45 * stain * (1 - k)) * (i === 1 ? 1 : 1 - 0.35 * algae));
      const vein = Math.pow(Math.max(0, n * 1.6 + 0.2), 3); // (glowing veins in the rock, more of them below)
      return [c[0], c[1], c[2], y > 0 ? 0 : BLUE_LOOK.wallGlow * (0.1 + 0.9 * deep) * vein, 0.5 + n * 0.6];
    });
    this.wallMesh = new THREE.Mesh(keep(g), keep(glowMaterial(this.uTime, { rough: 0.9, glow: 1 })));
    this.wallMesh.receiveShadow = true; this.group.add(this.wallMesh);
  }

  // ---- the lip: the ground round the opening at the cliff's top, from the shaft's top ring out to the horizon's sand
  lip(S, keep) {
    const n = S.nTheta, R = 70, pos = [], idx = [];
    for (let i = 0; i < n; i++) { pos.push(S.pos[i * 3], CLIFF, S.pos[i * 3 + 2]); const a = (i / n) * Math.PI * 2; pos.push(Math.cos(a) * R, CLIFF - 0.4, Math.sin(a) * R); }
    for (let i = 0; i < n; i++) { const a = i * 2, b = ((i + 1) % n) * 2; idx.push(a, b, a + 1, b, b + 1, a + 1); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    paint(g, (x, y, z) => { const r = Math.hypot(x, z), k = Math.min(1, (r - 10) / 6), n = fbm(x * 0.2, 0, z * 0.2, 2); return [0.84 - 0.2 * (1 - k) + n * 0.05, 0.74 - 0.1 * (1 - k) + n * 0.05, 0.55, 0, 0]; });
    const m = new THREE.Mesh(keep(g), keep(glowMaterial(this.uTime, { rough: 1, glow: 0 }))); m.receiveShadow = true; this.group.add(m);
  }

  // ---- the coral: colonies of branching tubes grown off the walls, and lathe sponges on the shelves
  corals(keep) {
    const geos = [], up = new THREE.Vector3(0, 1, 0), q = new THREE.Quaternion();
    const PAL = [0.92, 0.5, 0.13, 0.78, 0.33, 0.6]; // (the colonies' hues: magenta, cyan, gold, violet, lime, blue)
    const seg = (a, b, r0, r1, hue, tip) => {
      const d = b.clone().sub(a), L = d.length(); if (L < 0.05) return;
      const c = new THREE.CylinderGeometry(r1, r0, L, 6, 1, true); c.translate(0, L / 2, 0);
      c.applyQuaternion(q.setFromUnitVectors(up, d.normalize())); c.translate(a.x, a.y, a.z);
      paint(c, (x, y, z, i) => { const t = i < 7 ? 1 : 0; const v = 0.55 + 0.35 * t; const h = hue; const rgb = new THREE.Color().setHSL(h, 0.7, 0.35 + 0.25 * t); return [rgb.r * v + 0.1, rgb.g * v + 0.1, rgb.b * v + 0.1, 0.25 + (tip ? 1.1 : 0.3) * t, h]; });
      geos.push(c.toNonIndexed()); c.dispose();
    };
    const grow = (a, dir, len, r, depth, hue, fan) => {
      const b = a.clone().addScaledVector(dir, len);
      seg(a, b, r, r * 0.72, hue, depth === 0);
      if (depth === 0) return;
      const kids = fan ? 2 : 2 + Math.floor(rnd() * 2);
      for (let k = 0; k < kids; k++) {
        const nd = dir.clone().add(new THREE.Vector3(rnd() - 0.5, rnd() * 0.6, rnd() - 0.5).multiplyScalar(fan ? 0.9 : 1.3));
        if (fan) nd.y += 0.3;
        grow(b, nd.normalize(), len * (0.7 + rnd() * 0.15), r * 0.72, depth - 1, hue + (rnd() - 0.5) * 0.06, fan);
      }
    };
    for (let i = 0; i < BLUE_LOOK.corals; i++) {
      const th = rnd() * Math.PI * 2, y = -2 - rnd() * (-CITY.y - 4), r = wallAt(th, y) - 0.15; // (above the sunken city's plaza: below it is sealed)
      const a = new THREE.Vector3(Math.cos(th) * r, y, Math.sin(th) * r), inward = new THREE.Vector3(-Math.cos(th), 0.9, -Math.sin(th)).normalize();
      grow(a, inward, 0.5 + rnd() * 0.7, 0.09 + rnd() * 0.08, 3 + Math.floor(rnd() * 2), PAL[i % PAL.length], rnd() < 0.4);
    }
    // the sponges: lumped, ribbed vases (meshLathe's way) on the shelves and the floor
    for (let i = 0; i < BLUE_LOOK.sponges; i++) {
      const floor = i < 16, th = rnd() * Math.PI * 2, st = cityPlan().streets[i % cityPlan().streets.length];
      const y = floor ? CITY.y + 0.1 : [-12, -14, -20, -38, -42][i % 5] + rnd() * 2;
      const rr = floor ? 0 : wallAt(th, y) - 0.8;
      const h = 0.5 + rnd() * 0.9, w = 0.18 + rnd() * 0.25, pts = [];
      for (let k = 0; k <= 8; k++) { const t = k / 8; pts.push(new THREE.Vector2(w * (0.6 + 0.6 * Math.sin(t * 2.4) + 0.25 * t), t * h)); }
      const L = new THREE.LatheGeometry(pts, 12), hue = 0.05 + rnd() * 0.9;
      const P = L.attributes.position;
      for (let k = 0; k < P.count; k++) { const x = P.getX(k), yy = P.getY(k), z = P.getZ(k), a = Math.atan2(z, x), s = 1 + 0.18 * Math.sin(a * 7) + 0.25 * fbm(x * 3, yy * 3, z * 3, 2); P.setXYZ(k, x * s, yy, z * s); }
      L.computeVertexNormals();
      if (floor) L.translate(st.x + (rnd() - 0.5) * 2, y, st.z + (rnd() - 0.5) * 2); else L.translate(Math.cos(th) * rr, y - 0.1, Math.sin(th) * rr);
      paint(L, (x, yy) => { const c = new THREE.Color().setHSL(hue, 0.65, 0.4); const t = (yy - y) / h; return [c.r, c.g, c.b, 0.2 + 0.9 * Math.max(0, t - 0.7) * 3, hue]; });
      geos.push(L.toNonIndexed()); L.dispose();
    }
    const g = mergeGeometries(geos); for (const x of geos) x.dispose();
    g.computeVertexNormals();
    this.group.add(new THREE.Mesh(keep(g), keep(glowMaterial(this.uTime, { rough: 0.6, glow: 1.2 }))));
  }

  // ---- the kelp and the cenote's roots: instanced ribbons, swayed, twisted and hue-cycled on the GPU
  kelp(keep) {
    const SEG = 14, pos = [], idx = [], uv = [];
    for (let j = 0; j <= SEG; j++) { const t = j / SEG; pos.push(-0.5, t, 0, 0.5, t, 0); uv.push(0, t, 1, t); }
    for (let j = 0; j < SEG; j++) { const a = j * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    const base = new THREE.InstancedBufferGeometry();
    base.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); base.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); base.setIndex(idx);
    const n = BLUE_LOOK.kelp + BLUE_LOOK.roots, root = new Float32Array(n * 3), shape = new Float32Array(n * 4);
    let k = 0;
    const plant = (x, y, z, h, w, hue) => { root.set([x, y, z], k * 3); shape.set([h, w, rnd() * 6.283, hue], k * 4); k++; };
    // shelves (where the wall slopes inward going down: an upward face), the bell's floor slope and the bowl
    const shelves = [[-6, -17], [-38, -46], null]; // (the throat's shelf, the bell's above the city, the city's streets: world/bluehole/city.js)
    for (let i = 0; i < BLUE_LOOK.kelp; i++) {
      const hue = [0.13, 0.33, 0.5, 0.88][Math.floor(rnd() * 4)] + (rnd() - 0.5) * 0.08; // (gold, green, cyan, magenta: abyssal-garden's four)
      if (i % 3 === 2) { const S = cityPlan().streets, st = S[Math.floor(rnd() * S.length)], c = CITY.cell * 0.32; plant(st.x + (rnd() - 0.5) * 2 * c, CITY.y, st.z + (rnd() - 0.5) * 2 * c, 2.5 + rnd() * 7, 0.35 + rnd() * 0.45, hue); continue; }
      const [y0, y1] = shelves[i % 3], y = y0 + (y1 - y0) * rnd(), th = rnd() * Math.PI * 2;
      const r = Math.max(0, wallAt(th, y) - 0.25 - rnd() * 0.6);
      plant(Math.cos(th) * r, y, Math.sin(th) * r, 3 + rnd() * (y < -30 ? 8 : 6), 0.35 + rnd() * 0.5, hue);
    }
    for (let i = 0; i < BLUE_LOOK.roots; i++) { const th = rnd() * Math.PI * 2, y = CLIFF - 0.2, r = wallAt(th, y) - 0.1; plant(Math.cos(th) * r, y, Math.sin(th) * r, -(2 + rnd() * 6), 0.05 + rnd() * 0.05, 0.08 + rnd() * 0.05); }
    base.setAttribute('aRoot', new THREE.InstancedBufferAttribute(root, 3)); base.setAttribute('aShape', new THREE.InstancedBufferAttribute(shape, 4));
    base.instanceCount = k;
    const mat = new THREE.ShaderMaterial({
      name: 'bluehole-kelp', side: THREE.DoubleSide, fog: true,
      uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uTime: { value: 0 } }]),
      vertexShader: /* glsl */`
        attribute vec3 aRoot; attribute vec4 aShape;
        uniform float uTime;
        varying vec2 vUv; varying float vHue; varying float vH; varying float vRoot; varying float vDepth;
        #include <common>
        #include <fog_pars_vertex>
        void main() {
          float H = aShape.x, Wd = aShape.y, ph = aShape.z, h = position.y * abs(H);
          vRoot = H < 0.0 ? 1.0 : 0.0;
          float sw = (vRoot > 0.5 ? 0.04 : 0.11) * pow(h, 1.25);
          float tw = h * 0.35 + ph + sin(uTime * 0.6 + ph) * 0.4;
          vec3 side = vec3(cos(tw), 0.0, sin(tw)) * position.x * Wd * (1.0 - position.y * 0.55) * (1.0 + 0.4 * sin(h * 1.7 + ph));
          vec3 p = aRoot + vec3(0.0, sign(H) * h, 0.0) + side;
          p.x += sin(uTime * 0.5 + ph + h * 0.29) * sw; p.z += cos(uTime * 0.43 + ph * 1.3 + h * 0.23) * sw;
          vUv = uv; vHue = aShape.w; vH = h; vDepth = max(0.0, -p.y);
          vec4 mvPosition = modelViewMatrix * vec4(p, 1.0); // (in the room's frame: its group stands at BLUE_HOLE)
          gl_Position = projectionMatrix * mvPosition;
          #include <fog_vertex>
        }`,
      fragmentShader: /* glsl */`
        uniform float uTime;
        varying vec2 vUv; varying float vHue; varying float vH; varying float vRoot; varying float vDepth;
        #include <common>
        #include <fog_pars_fragment>
        ${HSV}
        void main() {
          float edge = abs(vUv.x - 0.5) * 2.0;
          if (edge > 0.98 - 0.25 * smoothstep(0.85, 1.0, vUv.y)) discard; // (a leaf's tip comes to a point)
          float spk = step(0.985, fract(sin(dot(floor(vec2(vUv.x * 6.0, vH * 9.0)), vec2(12.9898, 78.233))) * 43758.5453)) * (0.5 + 0.5 * sin(uTime * 3.0 + vH * 4.0));
          vec3 c = hsv(vHue + vH * 0.035 + uTime * 0.02, 0.85 - 0.25 * edge, 0.4 + 0.55 * vUv.y);
          c += hsv(vHue + 0.5, 0.4, 1.0) * pow(edge, 3.0) * 0.6 + spk * vec3(1.0, 0.95, 0.8);
          c *= mix(vec3(1.0), exp(-vec3(${BLUE_LOOK.absorb.join(', ')}) * vDepth * 1.6), 0.5); // (the kelp glows: its light is mostly its own)
          if (vRoot > 0.5) c = mix(vec3(0.24, 0.17, 0.1), vec3(0.42, 0.32, 0.2), vUv.y);
          gl_FragColor = vec4(c, 1.0);
          #include <fog_fragment>
        }`,
    });
    this.kelpMat = keep(mat);
    const m = new THREE.Mesh(keep(base), mat); m.frustumCulled = false; this.group.add(m);
  }

  // ---- the light shafts: two turning cones of rays from the opening, fading as they go down
  rays(keep) {
    const g = keep(new THREE.CylinderGeometry(8.5, 3.5, 46, 40, 1, true)); g.translate(0, -23, 0);
    const mat = keep(new THREE.ShaderMaterial({
      name: 'bluehole-rays', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      uniforms: { uTime: { value: 0 }, uK: { value: 1 } },
      vertexShader: 'varying vec2 vUv; varying float vFace; void main(){ vUv = uv; vec4 mv = modelViewMatrix * vec4(position,1.0); vec3 n = normalize(normalMatrix * normal); vFace = abs(dot(n, normalize(-mv.xyz))); gl_Position = projectionMatrix * mv; }',
      fragmentShader: /* glsl */`uniform float uTime, uK; varying vec2 vUv; varying float vFace;
        void main(){ float a = vUv.x * 6.2832; float s = 0.5 + 0.5 * sin(a * 7.0 + uTime * 0.3) * sin(a * 11.0 - uTime * 0.21 + 1.3);
          float r = pow(s, 3.0) * pow(vUv.y, 2.2) * (1.0 - vFace * 0.6) * uK; gl_FragColor = vec4(vec3(0.55, 0.85, 1.0) * r * 0.22, 1.0); }`,
    }));
    this.rayMat = mat; this.rayMeshes = [];
    for (const s of [1, 0.75]) { const m = new THREE.Mesh(g, mat); m.scale.set(s, 1, s); m.renderOrder = 3; m.frustumCulled = false; this.group.add(m); this.rayMeshes.push(m); }
  }

  // ---- the water's face: teal from above, Snell's silver ceiling from below
  surface(keep) {
    const g = keep(new THREE.CircleGeometry(15, 64)); g.rotateX(-Math.PI / 2);
    const mat = keep(new THREE.ShaderMaterial({
      name: 'bluehole-surface', transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: true,
      uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uTime: { value: 0 } }]),
      vertexShader: '#include <common>\n#include <fog_pars_vertex>\nvarying vec3 vW; void main(){ vW = (modelMatrix * vec4(position,1.0)).xyz; vec4 mvPosition = viewMatrix * vec4(vW,1.0); gl_Position = projectionMatrix * mvPosition;\n#include <fog_vertex>\n}',
      fragmentShader: /* glsl */`uniform float uTime; varying vec3 vW;
        #include <common>
        #include <fog_pars_fragment>
        void main(){ vec2 p = vW.xz * 0.6; float w = sin(p.x * 1.7 + uTime * 0.9) * sin(p.y * 1.3 - uTime * 0.7) + 0.5 * sin((p.x + p.y) * 3.1 + uTime * 1.6);
          vec3 c; float a;
          if (gl_FrontFacing) { c = mix(vec3(0.05, 0.42, 0.55), vec3(0.6, 0.95, 1.0), smoothstep(0.6, 1.4, w)); a = 0.72; }
          else { c = mix(vec3(0.35, 0.8, 0.95), vec3(1.0), smoothstep(0.2, 1.3, w)); a = 0.8; }
          gl_FragColor = vec4(c, a);
          #include <fog_fragment>
        }`,
    }));
    this.surfMat = mat;
    const m = new THREE.Mesh(g, mat); m.position.y = 0.02; m.renderOrder = 2; this.group.add(m);
  }

  // ---- the motes: specks drifting up through the shaft
  motes(keep) {
    const n = BLUE_LOOK.motes, p = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { const y = -rnd() * FLOOR, th = rnd() * 6.283, r = Math.sqrt(rnd()) * (radiusAt(y) - 0.8); p.set([Math.cos(th) * r, y, Math.sin(th) * r], i * 3); }
    const g = keep(new THREE.BufferGeometry()); g.setAttribute('position', new THREE.BufferAttribute(p, 3));
    const mat = keep(new THREE.ShaderMaterial({
      name: 'bluehole-motes', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 } },
      vertexShader: 'uniform float uTime; varying float vA; void main(){ vec3 q = position; q.y = mod(q.y + uTime * 0.12 + ' + FLOOR.toFixed(1) + ', ' + FLOOR.toFixed(1) + ') - ' + FLOOR.toFixed(1) + '; q.x += sin(uTime * 0.3 + position.z) * 0.3; vec4 mv = modelViewMatrix * vec4(q, 1.0); vA = clamp(1.0 - (-mv.z) / 40.0, 0.0, 1.0); gl_PointSize = clamp(60.0 / -mv.z, 1.0, 6.0); gl_Position = projectionMatrix * mv; }',
      fragmentShader: 'varying float vA; void main(){ float d = length(gl_PointCoord - 0.5); if (d > 0.5) discard; gl_FragColor = vec4(vec3(0.7, 0.95, 1.0) * (1.0 - d * 2.0) * vA * 0.7, 1.0); }',
    }));
    this.moteMat = mat;
    const m = new THREE.Points(g, mat); m.frustumCulled = false; this.group.add(m);
  }

  // ---- the schools: small fish circling the axis in three bands (Abzu's)
  schools(keep) {
    const fish = keep(new THREE.OctahedronGeometry(0.16, 0)); fish.scale(1, 0.55, 2.6);
    this.flocks = [];
    for (const [y, n, col] of BLUE_LOOK.schools) {
      const mat = keep(new THREE.MeshBasicMaterial({ color: col, fog: true }));
      const M = new THREE.InstancedMesh(fish, mat, n); M.frustumCulled = false; this.group.add(M);
      const f = []; for (let i = 0; i < n; i++) f.push({ a: rnd() * 0.9, r: rnd() * 1.6 - 0.8, h: (rnd() - 0.5) * 2.2, s: 0.8 + rnd() * 0.4, p: rnd() * 6.283 });
      this.flocks.push({ M, y, f, R: radiusAt(y) * 0.6, dir: this.flocks.length % 2 ? -1 : 1 });
    }
  }

  // ---- the dock, its door home and its lantern; the lamps of the deep
  dock(D, door, keep) {
    const stone = (w, h, d, x, y, z) => { const g = new THREE.BoxGeometry(w, h, d); g.translate(x, y, z); return paint(g, (vx, vy, vz) => { const n = fbm(vx, vy, vz, 2); return [0.78 + n * 0.08, 0.7 + n * 0.08, 0.56, 0, 0]; }); };
    const zc = (D.z0 + D.z1) / 2, geos = [stone(D.x * 2, 1.6, D.z1 - D.z0, 0, D.top - 0.8, zc)];
    geos.push(stone(0.5, 3.4, 0.5, door.x - 1.3, D.top + 1.7, door.z), stone(0.5, 3.4, 0.5, door.x + 1.3, D.top + 1.7, door.z), stone(3.1, 0.5, 0.6, door.x, D.top + 3.6, door.z));
    for (const x of [-D.x + 0.4, D.x - 0.4]) geos.push(stone(0.3, 0.9, 0.3, x, D.top + 0.45, D.z0 + 0.3)); // (bollards at the water's edge)
    const g = mergeGeometries(geos.map((x) => x.toNonIndexed())); for (const x of geos) x.dispose();
    this.group.add(new THREE.Mesh(keep(g), keep(glowMaterial(this.uTime, { rough: 0.95, glow: 0 }))));
    // the door's light: a soft glowing pane in the arch (the way home)
    const pane = new THREE.Mesh(keep(new THREE.PlaneGeometry(2.1, 3.1)), keep(new THREE.MeshBasicMaterial({ color: 0xffe2b0, transparent: true, opacity: 0.55, side: THREE.DoubleSide, fog: true })));
    pane.position.set(door.x, D.top + 1.6, door.z + 0.05); this.group.add(pane);
    const lamp = (c, i, r, x, y, z) => { const L = new THREE.PointLight(c, i, r, 1.3); L.position.set(x, y, z); this.group.add(L); return L; };
    lamp(0xffc58a, 14, 26, 0, D.top + 2.6, D.z0 + 0.8); // (the dock's lantern)
    this.deepLamps = [lamp(0x40e0ff, 30, 50, 0, -30, 0), lamp(0xc46aff, 30, 40, 7, CITY.y + 6, -7)]; // (the violet one over the sunken city: world/bluehole/city.js)
  }

  update(dt, depth) {
    const t = (this.uTime.value += dt);
    if (this.dome) { this.dome.position.copy(this.game.camera.position); this.domeMat.uniforms.uTime && (this.domeMat.uniforms.uTime.value = t); }
    if (this.kelpMat) this.kelpMat.uniforms.uTime.value = t;
    if (this.surfMat) this.surfMat.uniforms.uTime.value = t;
    if (this.moteMat) this.moteMat.uniforms.uTime.value = t;
    if (this.rayMat) { this.rayMat.uniforms.uTime.value = t; const day = this.game.daylight?.sun ?? 1; this.rayMat.uniforms.uK.value = 0.6 + 0.4 * Math.min(1, day); }
    this.rayMeshes?.forEach((m, i) => { m.rotation.y = t * (i ? -0.03 : 0.02); });
    const o = new THREE.Object3D();
    for (const F of this.flocks || []) {
      F.f.forEach((f, i) => {
        const a = f.a + t * 0.12 * F.dir * f.s + Math.sin(t * 0.7 + f.p) * 0.05, r = F.R + f.r + Math.sin(t * 0.5 + f.p) * 0.4;
        o.position.set(Math.cos(a) * r, F.y + f.h + Math.sin(t + f.p) * 0.3, Math.sin(a) * r);
        o.lookAt(Math.cos(a + 0.1 * F.dir) * r, o.position.y, Math.sin(a + 0.1 * F.dir) * r);
        o.updateMatrix(); F.M.setMatrixAt(i, o.matrix);
      });
      F.M.instanceMatrix.needsUpdate = true;
    }
    this.city?.update(t);
    this.deepLamps?.forEach((L, i) => { L.intensity = (depth > 2 ? 30 : 8) * (0.85 + 0.15 * Math.sin(t * (0.6 + i * 0.3))); });
  }

  dispose() {
    if (this.dome) { this.game.scene.remove(this.dome); this.dome = null; }
    for (const d of this.disposables) d.dispose?.();
    this.disposables = []; this.flocks = null;
  }
}
