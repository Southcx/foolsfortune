// ---------------------------------------------------------------------------------------
// A PART'S CRAZING: the skin a boss part wears as it is hurt (docs/plans/RAIL-FLOW.md section 4, Dovina's: "a part lined in gold while
// it can be hit, crazing as it is hurt, gone when broken"; vfx/bossparts.js wears it). A crackle net of cells (Voronoi cell edges in the
// part's own object space, so the net is fixed to the part and turns with it) opens from the middle of the part outward as `hurt` (0..1:
// 1 - hp / hpMax) rises: hairline at first, the lines widening and a finer net splitting the big cells past half, and near the end
// the cracks lit GOLD from within (kintsugi's seam, the part's own gold line running into it), a faint ember over the whole crazed face.
// Every crack has a dark shoulder beside it, so it reads on pale ivory as on a dark hide. Under about three pixels a cell the net fades
// out rather than crawl (no aliasing crawl: CLAUDE.md); the gold line and the hit's flash are the read at that size.
//
// It draws as a second skin over each of the part's meshes (the mesh's own geometry, pushed out a hair along its normals, a child of the
// mesh so it moves, hides and swaps geometry with it): one draw a skin, only while the part is hurt and alive. One program for every
// skin of every part (a material a skin, its uniforms its state: the same source, so three builds the program once).
//
// Prior art: vfx/caster/frostbisque.js's 'craze' skin (the same cell net and its pixel fade, built once there and taken here as the
// part's own: a fixed origin, no front noise, gold not clay); guan and ge ware's crackle (the net's two sizes: the "gold thread and
// iron wire" of ge ware, big cells split by fine ones); kintsugi (cracks lit in gold); Shadow of the Colossus's weak points glowing on
// a body, Star Fox 64's and Einhander's bosses whose parts show their hurt before they come off.
//
//   const S = new PartCraze(mesh)   S.object (the skin)   S.set(hurt 0..1, flash 0..1)   S.follow() (the mesh's geometry, if it swapped)
//   S.dispose()   CRAZE_GOLD (the gold, one with the rail's world marks: 0xffd36a)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

export const CRAZE_GOLD = 0xffd36a;

const VERT = /* glsl */`
uniform float uInflate;
varying vec3 vO;
void main() {
  vO = position;
  vec3 p = position + normalize(normal) * uInflate;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}`;
const FRAG = /* glsl */`
uniform float uHurt, uFlash, uScale, uReach, uInvR;
uniform vec3 uOrigin, uGold;
varying vec3 vO;
float hash3(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float cells(vec3 p) { // (F2 - F1 of a cell net: 0 on an edge)
  vec3 i = floor(p), f = fract(p); float f1 = 9.0, f2 = 9.0;
  for (int x = -1; x <= 1; x++) for (int y = -1; y <= 1; y++) for (int z = -1; z <= 1; z++) {
    vec3 g = vec3(x, y, z), o = vec3(hash3(i + g), hash3(i + g + 17.3), hash3(i + g + 41.9));
    float d = length(g + o - f); if (d < f1) { f2 = f1; f1 = d; } else if (d < f2) f2 = d;
  }
  return f2 - f1;
}
float lineOf(float e, float w) { float aa = max(fwidth(e), 1e-5), lw = max(w, aa * 1.2); return 1.0 - smoothstep(lw - aa, lw + aa, e); }
void main() {
  float k = uHurt;
  vec3 p = vO * uScale; // (about two cells across the part's radius)
  float px = 1.0 / max(length(fwidth(p)), 1e-5); // (pixels a cell)
  float reach = k * uReach - distance(vO, uOrigin) * uInvR; // (it opens from the middle out, over the part's bounding radius: all of it by k 0.36)
  if (reach < 0.0) discard;
  float seen = smoothstep(2.5, 5.0, px), seen2 = smoothstep(2.5, 5.0, px / 2.3);
  float e1 = cells(p), e2 = cells(p * 2.3 + 7.1);
  float w1 = mix(0.006, 0.04, k), w2 = mix(0.0, 0.014, smoothstep(0.6, 0.95, k)); // (hairlines, never lacework: the plate still reads as the plate)
  float l1 = lineOf(e1, w1) * seen, l2 = lineOf(e2, w2) * seen2 * step(0.001, w2);
  float crack = max(l1, l2), sh = max(lineOf(e1, w1 * 2.6 + 0.02) * seen, lineOf(e2, w2 * 2.4 + 0.012) * seen2 * step(0.001, w2)) - crack;
  float lit = smoothstep(0.62, 0.95, k), ember = 0.14 * smoothstep(0.7, 1.0, k) * smoothstep(0.0, 0.3, reach);
  vec3 ochre = vec3(0.62, 0.46, 0.26), gold = uGold * (1.6 + 1.6 * lit); // (iron wire first, a warm ochre that reads on ivory and hide alike; gold thread near the end)
  vec3 cc = mix(ochre, gold, lit);
  cc = mix(cc, vec3(1.0, 0.95, 0.85) * 3.0, uFlash * 0.7); // (a hit lights the net for a fifth of a real second)
  float a = crack * smoothstep(0.0, 0.08, reach);
  vec3 col = cc * a + vec3(0.02, 0.015, 0.01) * sh * (1.0 - a) + uGold * ember * (1.0 - a - sh);
  float alpha = max(a, max(sh * 0.45, ember));
  if (alpha < 0.01) discard;
  gl_FragColor = vec4(col / max(alpha, 1e-3), alpha);
}`;

export class PartCraze {
  constructor(target) {
    this.target = target;
    const geo = target.geometry; geo.boundingSphere || geo.computeBoundingSphere();
    const R = Math.max(1e-3, geo.boundingSphere.radius);
    this.mat = new THREE.ShaderMaterial({
      name: 'part-craze', vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false, fog: false, side: THREE.FrontSide,
      polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2,
      uniforms: { uHurt: { value: 0 }, uFlash: { value: 0 }, uScale: { value: 2 / R }, uReach: { value: 2.8 }, uInvR: { value: 1 / R }, uInflate: { value: R * 0.006 }, uOrigin: { value: geo.boundingSphere.center.clone() }, uGold: { value: new THREE.Color(CRAZE_GOLD) } },
    });
    this.object = new THREE.Mesh(geo, this.mat); this.object.name = 'part-craze';
    this.object.renderOrder = 3; this.object.castShadow = false; this.object.userData.moodExempt = true; this.object.raycast = () => {};
    this.object.visible = true; // (shown until the first set: so the parked warm-up draw compiles its program; its hurt 0 discards every pixel)
    target.add(this.object);
  }
  /** How far it is crazed (0..1) and the hit's flash (0..1); hidden at 0. */
  set(hurt, flash = 0) {
    const u = this.mat.uniforms; u.uHurt.value = THREE.MathUtils.clamp(hurt, 0, 1); u.uFlash.value = THREE.MathUtils.clamp(flash, 0, 1);
    this.object.visible = u.uHurt.value > 0.001; this.follow(); return this;
  }
  /** A look that swaps its mesh's geometry (a comb's stubs, a torn sail) is followed. */
  follow() { const g = this.target.geometry; if (this.object.geometry !== g) { this.object.geometry = g; g.boundingSphere || g.computeBoundingSphere(); this.mat.uniforms.uOrigin.value.copy(g.boundingSphere.center); this.mat.uniforms.uInvR.value = 1 / Math.max(1e-3, g.boundingSphere.radius); } }
  dispose() { this.object.parent?.remove(this.object); this.mat.dispose(); }
}
