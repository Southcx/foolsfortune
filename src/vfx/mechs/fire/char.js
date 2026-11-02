// ---------------------------------------------------------------------------------------
// CHAR (plain name; the city's fire's look, vfx/mechs/fire/): a cell's fire state worn on the building, drawn as a shell a hair
// larger than the cell (FIRE_LOOK.char.size) over each cell with a face to the air, so only what shows is drawn: SCORCHED brick or
// stone soot-blackened, SOFT steel glowing a dull red that breathes, WET darkened and glossy, a BURNING cell charring toward charcoal
// as its fuel goes, an ember's light running in its cracks. A cell burned away is emptied by the runtime and drawn by nothing.
// One InstancedMesh, lit (so a wet face catches the sun), its per-cell colour the instance colour and its glow and roughness one
// small attribute; written only when the burning set is read again (index.js), never a frame.
// Why a shell: the city's own mesh (Dovina's world/hangar/city.js) is one merged mesh a building, vertex-coloured by material at its
// re-mesh, with no per-cell colour to tint; a shell draws the state without touching her file (the handoff asks for a cell's state
// in her vertex colour, docs/handoffs/dovina/2026-11-02-from-calissa-fire-looks.md).
// Prior art: Far Cry 2's burnt ground and Red Faction Guerrilla's scorched walls (a char decal by heat), Battlefield's wet decals
// (a darker, glossier surface), the forge's colour of hot steel (a dull cherry red long before it is soft).
//
//   const C = new CharShell(parent, max)   C.begin()   C.add(x, y, z, yaw, colour (a THREE.Color), glow, rough)   C.end()   C.mesh   C.dispose()
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { FIRE_LOOK } from './table.js';
import { FLAME_TIME } from './flames.js';

const K = FIRE_LOOK.char;
const _c = new THREE.Color();

/** The shell's material: the standard one, its glow and roughness read from the instance (an ember's crackle in world space). */
function charMaterial() {
  const m = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, metalness: 0, name: 'fire-char' });
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = FLAME_TIME; sh.uniforms.uEmber = { value: new THREE.Color(K.ember) };
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec2 aChar; varying vec2 vChar; varying vec3 vCW;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvChar = aChar; vCW = (modelMatrix * instanceMatrix * vec4(position, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
uniform float uTime; uniform vec3 uEmber; varying vec2 vChar; varying vec3 vCW;
float chash(vec3 p) { return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }
float cnoise(vec3 p) { vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(chash(i), chash(i + vec3(1,0,0)), f.x), mix(chash(i + vec3(0,1,0)), chash(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(chash(i + vec3(0,0,1)), chash(i + vec3(1,0,1)), f.x), mix(chash(i + vec3(0,1,1)), chash(i + vec3(1,1,1)), f.x), f.y), f.z); }`)
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = vChar.y;')
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
{ float cr = 1.0 - abs(cnoise(vCW * 2.3) * 2.0 - 1.0); cr = smoothstep(0.82, 0.97, cr);
  float br = 0.75 + 0.25 * sin(uTime * 2.2 + dot(vCW, vec3(0.7, 1.3, 0.9)));
  totalEmissiveRadiance += uEmber * vChar.x * br * (0.18 + 2.4 * cr); }`);
  };
  return m;
}

export class CharShell {
  constructor(parent, max) {
    this.max = max; this.n = 0;
    const geo = new THREE.BoxGeometry(K.size, K.size, K.size);
    this.attr = new THREE.InstancedBufferAttribute(new Float32Array(max * 2), 2); geo.setAttribute('aChar', this.attr);
    this.mesh = new THREE.InstancedMesh(geo, charMaterial(), max);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); this.mesh.count = 0; this.mesh.name = 'fire.char';
    this.mesh.setColorAt(0, _c.setRGB(1, 1, 1)); // (the instance colour made now, so the program is built with it)
    this.mesh.frustumCulled = false; this.mesh.castShadow = false; this.mesh.receiveShadow = true;
    parent.add(this.mesh);
  }
  begin() { this.n = 0; }
  /** One cell's shell: its centre, its lot's turn, its colour, the glow in its cracks (0..1) and its roughness. Past `max`, nothing. */
  add(x, y, z, yaw, col, glow, rough) {
    if (this.n >= this.max) return false;
    const i = this.n++, m = this.mesh.instanceMatrix.array, o = i * 16, c = Math.cos(yaw), s = Math.sin(yaw);
    m[o] = c; m[o + 1] = 0; m[o + 2] = -s; m[o + 3] = 0; m[o + 4] = 0; m[o + 5] = 1; m[o + 6] = 0; m[o + 7] = 0;
    m[o + 8] = s; m[o + 9] = 0; m[o + 10] = c; m[o + 11] = 0; m[o + 12] = x; m[o + 13] = y; m[o + 14] = z; m[o + 15] = 1;
    const C = this.mesh.instanceColor.array; C[i * 3] = col.r; C[i * 3 + 1] = col.g; C[i * 3 + 2] = col.b;
    const a = this.attr.array; a[i * 2] = glow; a[i * 2 + 1] = rough;
    return true;
  }
  end() {
    const n = this.n; this.mesh.count = n; this.mesh.visible = n > 0;
    if (!n) return;
    for (const [A, w] of [[this.mesh.instanceMatrix, 16], [this.mesh.instanceColor, 3], [this.attr, 2]]) { A.clearUpdateRanges(); A.addUpdateRange(0, n * w); A.needsUpdate = true; }
  }
  dispose() { this.mesh.removeFromParent(); this.mesh.geometry.dispose(); this.mesh.material.dispose(); }
}
