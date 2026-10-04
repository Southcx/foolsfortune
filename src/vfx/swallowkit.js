// ---------------------------------------------------------------------------------------
// THE SWALLOW'S KIT: what the Well's floors are made of (docs/plans/SLICE.md, E1: Petra lays the rooms with `level.box`; these are their
// materials). The island is the clay's place; the Swallow is Lachryma's own, in its two other states (docs/ART.md, section 3):
//
//   WALL   solid Lachryma: bismuth as architecture. The wall is a hopper crystal seen from inside: terraces stepping back as they rise,
//          each terrace's oxide film its own colour (gold, magenta, blue, green: vfx/bismuth.js's run), dark metal between, in the
//          world's own space so the steps run on unbroken from box to box and room to room
//   FLOOR  liquid Lachryma under dark glass: near-black and glossy, the labradorite's flash moving slowly deep under it (vfx/labradorite.js)
//          in broad slow bands, so a floor is a pane over the stuff of feeling and never a texture that crawls
//   TRIM   the edges and plinths: the bismuth's dark metal, plain
// Each is one material for any number of boxes (a box's look is its material: render/merge.js merges them per zone).
//
// Prior art: bismuth's hopper crystals (the stair of square terraces, the oxide's thin-film colours), the ice and crystal caves of the
// sixth generation (Metroid Prime's Phendrana, Final Fantasy X's Macalania: a material-led place, light from the walls), and the
// labradorite already on the Mind's marks (one stone, one meaning).
//
//   const K = swallowKit({ env })   level.box(..., K.wall)   K.floor   K.trim   K.tick(t)   (once a frame, for the floor's drift)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { LAB_GLSL, mindTime } from './labradorite.js';

const OXIDE = /* glsl */`
vec3 swOxide(float t) {
  t = fract(t) * 4.0;
  vec3 a = vec3(0.95, 0.75, 0.25), b = vec3(0.85, 0.20, 0.65), c = vec3(0.15, 0.40, 0.95), d = vec3(0.20, 0.85, 0.55);
  return t < 1.0 ? mix(a, b, smoothstep(0.0, 1.0, t)) : t < 2.0 ? mix(b, c, smoothstep(1.0, 2.0, t)) : t < 3.0 ? mix(c, d, smoothstep(2.0, 3.0, t)) : mix(d, a, smoothstep(3.0, 4.0, t));
}`;

function wallMaterial(env) {
  const m = new THREE.MeshStandardMaterial({ color: 0x4a4250, metalness: 0.85, roughness: 0.3, envMap: env, envMapIntensity: 0.4, flatShading: true });
  m.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vSwW;')
      .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvSwW = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>\nvarying vec3 vSwW;\n${OXIDE}`)
      .replace('#include <color_fragment>', `#include <color_fragment>
{ // the terraces: a step every 0.6 m up the wall, each a film of its own thickness (its colour), a dark seam at each riser
  float step = floor(vSwW.y / 0.6), f = fract(vSwW.y / 0.6);
  float film = fract(sin(step * 12.9898 + floor(dot(vSwW.xz, vec2(0.11, 0.07))) * 4.1) * 43758.5453);
  vec3 ox = pow(swOxide(film + step * 0.13), vec3(1.7)) * 2.2;
  float riser = smoothstep(0.0, 0.06, f) * (1.0 - smoothstep(0.94, 1.0, f));
  diffuseColor.rgb *= mix(vec3(0.25), ox, riser);
}`)
      .replace('#include <normal_fragment_begin>', `#include <normal_fragment_begin>
{ // the steps, told by the light: on an upright face, each terrace's normal leans up toward the sky across its height (a tread
  // sloping back into the wall), so the light breaks on every step as it does on a hopper's stair; the box stays a box
  float f = fract(vSwW.y / 0.6);
  vec3 upV = normalize((viewMatrix * vec4(0.0, 1.0, 0.0, 0.0)).xyz);
  float upright = 1.0 - smoothstep(0.4, 0.7, abs(dot(normal, upV)));
  normal = normalize(normal + upV * upright * (0.15 + 0.9 * (1.0 - f)));
}`);
  };
  m.customProgramCacheKey = () => 'swallow-wall';
  return m;
}

function floorMaterial(env, u) {
  const m = new THREE.MeshStandardMaterial({ color: 0x030206, metalness: 0.5, roughness: 0.12, envMap: env, envMapIntensity: 0.25 });
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, u);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vSwW;')
      .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvSwW = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>\nvarying vec3 vSwW;\n${LAB_GLSL}`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
{ // under the glass: the flash in broad slow bands, seen through it (deeper where the eye looks down, a mirror where it grazes)
  vec3 V = normalize(vViewPosition); float down = clamp(abs(dot(normalize(normal), V)), 0.0, 1.0);
  float ph = dot(vSwW.xz, vec2(0.05, 0.035)) + uMindT * 0.03 + sin(vSwW.x * 0.21 + uMindT * 0.05) * 0.2;
  float band = smoothstep(0.25, 0.85, 0.5 + 0.5 * sin(ph * 9.0));
  totalEmissiveRadiance += labSoft(ph) * band * (0.3 + 0.7 * down) * 0.3;
}`);
  };
  m.customProgramCacheKey = () => 'swallow-floor';
  return m;
}

export function swallowKit({ env = null } = {}) {
  const u = { uMindT: mindTime };
  return {
    wall: wallMaterial(env),
    floor: floorMaterial(env, u),
    trim: new THREE.MeshStandardMaterial({ color: 0x2c2832, metalness: 0.9, roughness: 0.35, envMap: env, envMapIntensity: 0.4, flatShading: true }),
    tick() { /* (the floor drifts on the Mind's shared clock: labradorite.js mindTick, which anyone may call once a frame) */ },
  };
}
