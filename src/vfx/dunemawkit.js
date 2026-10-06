// ---------------------------------------------------------------------------------------
// THE GREAT DUNEMAW'S KIT: what the Well's floors are made of (docs/plans/SLICE.md, E1: Petra lays the rooms with `level.box`; these are their
// materials). The island is the clay's place; the Great Dunemaw is Lachryma's own, in its two other states (docs/ART.md, section 3):
//
//   WALL   solid Lachryma: bismuth as architecture. The wall is a hopper crystal seen from inside: terraces stepping back as they rise,
//          each terrace's oxide film its own colour (gold, magenta, blue, green: vfx/bismuth.js's run), dark metal between, in the
//          world's own space so the steps run on unbroken from box to box and room to room
//   FLOOR  liquid Lachryma under dark glass: near-black and glossy, the labradorite's flash moving slowly deep under it (vfx/labradorite.js)
//          in broad slow bands, so a floor is a pane over the stuff of feeling and never a texture that crawls
//   TRIM   the edges and plinths: the bismuth's dark metal, plain
//   SAND   the Dunes' sand poured in, rippled, the Lachryma showing in the troughs (docs/plans/DUNEMAW.md)
//   MOOD   the verse into the wall: the colours at a third on floor 1, at full cry on the last, slammed to full when the FOE shows itself
// Each is one material for any number of boxes (a box's look is its material: render/merge.js merges them per zone).
//
// Prior art: bismuth's hopper crystals (the stair of square terraces, the oxide's thin-film colours), the ice and crystal caves of the
// sixth generation (Metroid Prime's Phendrana, Final Fantasy X's Macalania: a material-led place, light from the walls), and the
// labradorite already on the Mind's marks (one stone, one meaning).
//
//   const K = dunemawKit({ env })   level.box(..., K.wall)   K.floor   K.trim   K.sand (the heightfields' surface)   K.tick(t)
//   MOOD (the shared uniforms: uDepth, uSlam, uT)   dunemawMood(game).update(rawDt)   (the floor's depth and the FOE's slam, from the events)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { LAB_GLSL, mindTime } from './labradorite.js';
import { LIQUID_GLSL, liquidUniforms } from './liquid.js';

/** The Great Dunemaw's mood, shared by every floor's materials (docs/plans/DUNEMAW.md, the look): uDepth 0 on floor 1 (the soft verse:
 *  the colours at a third, everything slow) to 1 on floor 3 (the wall: full cry, drifting, the light climbing the terraces); uSlam
 *  0..1, the FOE's moment (everything to full at once, then easing back to the floor's own). Set by dunemawMood (below). */
export const MOOD = { uDepth: { value: 0 }, uSlam: { value: 0 }, uT: { value: 0 } };

const OXIDE = /* glsl */`
vec3 swOxide(float t) {
  t = fract(t) * 4.0;
  vec3 a = vec3(0.95, 0.75, 0.25), b = vec3(0.85, 0.20, 0.65), c = vec3(0.15, 0.40, 0.95), d = vec3(0.20, 0.85, 0.55);
  return t < 1.0 ? mix(a, b, smoothstep(0.0, 1.0, t)) : t < 2.0 ? mix(b, c, smoothstep(1.0, 2.0, t)) : t < 3.0 ? mix(c, d, smoothstep(2.0, 3.0, t)) : mix(d, a, smoothstep(3.0, 4.0, t));
}`;

function wallMaterial(env) {
  const m = new THREE.MeshStandardMaterial({ color: 0x4a4250, metalness: 0.85, roughness: 0.3, envMap: env, envMapIntensity: 0.4, flatShading: true });
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, MOOD);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vSwW;')
      .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvSwW = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>\nvarying vec3 vSwW;\nuniform float uDepth, uSlam, uT;\nvec3 swClimb = vec3(0.0);\n${OXIDE}`)
      .replace('#include <color_fragment>', `#include <color_fragment>
{ // the terraces: a step every 0.6 m up the wall, each a film of its own thickness (its colour), a dark seam at each riser
  float step = floor(vSwW.y / 0.6), f = fract(vSwW.y / 0.6);
  float film = fract(sin(step * 12.9898 + floor(dot(vSwW.xz, vec2(0.11, 0.07))) * 4.1) * 43758.5453);
  float cry = max(uDepth, uSlam); // (how loud the floor is: a third on floor 1, full on the last, full at the FOE)
  vec3 ox = pow(swOxide(film + step * 0.13 + uT * 0.015 * uDepth), vec3(1.7)) * 2.2; // (the colours drift up the stair, deeper down)
  ox = mix(vec3(dot(ox, vec3(0.3, 0.55, 0.15))), ox, 0.33 + 0.67 * cry);
  float riser = smoothstep(0.0, 0.06, f) * (1.0 - smoothstep(0.94, 1.0, f));
  diffuseColor.rgb *= mix(vec3(0.25), ox, riser);
  swClimb = ox * riser * smoothstep(0.8, 1.0, sin(step * 0.9 - uT * 1.6)) * (0.35 * uDepth * uDepth + 0.4 * uSlam); // (a light climbing the terraces in waves, an equalizer's)
}`)
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n  totalEmissiveRadiance += swClimb;')
      .replace('#include <normal_fragment_begin>', `#include <normal_fragment_begin>
{ // the steps, told by the light: on an upright face, each terrace's normal leans up toward the sky across its height (a tread
  // sloping back into the wall), so the light breaks on every step as it does on a hopper's stair; the box stays a box
  float f = fract(vSwW.y / 0.6);
  vec3 upV = normalize((viewMatrix * vec4(0.0, 1.0, 0.0, 0.0)).xyz);
  float upright = 1.0 - smoothstep(0.4, 0.7, abs(dot(normal, upV)));
  normal = normalize(normal + upV * upright * (0.15 + 0.9 * (1.0 - f)));
}`);
  };
  m.customProgramCacheKey = () => 'dunemaw-wall';
  return m;
}

function floorMaterial(env, u) {
  const m = new THREE.MeshStandardMaterial({ color: 0x030206, metalness: 0.5, roughness: 0.12, envMap: env, envMapIntensity: 0.25 });
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, u, MOOD);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vSwW;')
      .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvSwW = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>\nvarying vec3 vSwW;\nuniform float uDepth, uSlam, uT;\n${LAB_GLSL}`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
{ // under the glass: the flash in broad slow bands, seen through it (deeper where the eye looks down, a mirror where it grazes);
  // quicker and brighter the deeper the floor (the verse into the wall)
  vec3 V = normalize(vViewPosition); float down = clamp(abs(dot(normalize(normal), V)), 0.0, 1.0);
  float pace = 1.0 + 2.5 * uDepth;
  float ph = dot(vSwW.xz, vec2(0.05, 0.035)) + uMindT * 0.03 * pace + sin(vSwW.x * 0.21 + uMindT * 0.05 * pace) * (0.2 + 0.25 * uDepth);
  float band = smoothstep(0.25, 0.85, 0.5 + 0.5 * sin(ph * 9.0));
  totalEmissiveRadiance += labSoft(ph) * band * (0.3 + 0.7 * down) * (0.3 + 0.35 * uDepth + 0.35 * uSlam);
}`);
  };
  m.customProgramCacheKey = () => 'dunemaw-floor';
  return m;
}

// SAND: the Dunes' sand poured into the mind (docs/plans/DUNEMAW.md: the heightfields' surface, one merged mesh a floor). The dunes' own
// colour, rippled by the owner's sand-ripple photograph (the liquid pack's B channel) along the floor, and in the troughs the Lachryma
// shows through: the labradorite's colours in the hollows, more the deeper the floor.
function sandMaterial(u) {
  const m = new THREE.MeshStandardMaterial({ color: 0xe8b070, roughness: 0.92, metalness: 0 });
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, u, MOOD, liquidUniforms());
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vSwW;')
      .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvSwW = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>\nvarying vec3 vSwW;\nuniform float uDepth, uSlam, uT;\n${LAB_GLSL}\n${LIQUID_GLSL}\nfloat sdTrough;`)
      .replace('#include <color_fragment>', `#include <color_fragment>
{ float rip = liqTap(vSwW.xz * 0.11 + vec2(0.0, uT * 0.004 * uDepth)).b; // (the ripples creep, deeper down: the sand is moving)
  sdTrough = 1.0 - smoothstep(0.15, 0.45, rip);
  diffuseColor.rgb *= 0.78 + 0.32 * rip; }`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
  totalEmissiveRadiance += labSoft(dot(vSwW.xz, vec2(0.04, 0.03)) + uMindT * 0.02) * sdTrough * (0.04 + 0.2 * uDepth + 0.25 * uSlam);`);
  };
  m.customProgramCacheKey = () => 'dunemaw-sand';
  return m;
}

export function dunemawKit({ env = null } = {}) {
  const u = { uMindT: mindTime };
  return {
    wall: wallMaterial(env),
    floor: floorMaterial(env, u),
    sand: sandMaterial(u),
    trim: new THREE.MeshStandardMaterial({ color: 0x2c2832, metalness: 0.9, roughness: 0.35, envMap: env, envMapIntensity: 0.4, flatShading: true }),
    tick() { /* (the floor drifts on the Mind's shared clock: labradorite.js mindTick, which anyone may call once a frame) */ },
  };
}

/** The Great Dunemaw's mood, driven by its events: the floor sets the depth (1 → 0, 2 → 0.55, 3 → 1); the FOE slams it to full (then it
 *  eases back over 6 real seconds to the floor's own); leaving the Dunemaw quiets it. Call update(rawDt) each frame. */
export function dunemawMood(game) {
  const DEPTH = [0, 0, 0.55, 1];
  let target = 0;
  game.events?.on?.('well.floor', (e) => { target = DEPTH[Math.min(3, e.floor || 1)]; });
  game.events?.on?.('well.foe', () => { MOOD.uSlam.value = 1; });
  game.events?.on?.('well.leave', () => { target = 0; MOOD.uSlam.value = 0; });
  return {
    mood: MOOD, // (the shared uniforms: read here, so a test or the workbench sets the very ones the floors use)
    update(raw) {
      MOOD.uT.value += raw;
      MOOD.uDepth.value += (target - MOOD.uDepth.value) * (1 - Math.exp(-raw * 1.5));
      MOOD.uSlam.value = Math.max(0, MOOD.uSlam.value - raw / 6);
    },
  };
}
