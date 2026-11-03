// ---------------------------------------------------------------------------------------
// THE ADOBE CITY'S DRESS (plain names; South, 2026-11-03: "Those buildings are still very placeholder, could you take a stab at drafting
// some adobe buildings? Make em super fancy"): the proving ground's toy city drawn as an earthen city wherever a building was made from
// an adobe blueprint (progress/mechs/adobe/blueprints.js: its cells carry a look role, `b.role`, and props, `b.props`). Over Dovina's runtime
// (world/hangar/city.js), looks only: nothing here carves, collapses or touches a collider.
//   THE CELLS    each building's mesh (hers: a face where a cell meets air) recoloured face by face from its cell's role in the Clay
//                dress's palette (ADOBE_LOOK: mud plaster in one of four earths a building, lime-wash, cedar, indigo and turquoise
//                paint, zellige and kashi, a little gold), and drawn in the plaster material: the hand-plastered mottle and its rain
//                streaks across the cells (so the grid fades into one wall), a soft trowelled normal, grime and darker cell joints at
//                its foot, a glaze's sheen and its four-tile grid on the tile roles, gold metallic; done again whenever she re-meshes it,
//                and on each chunk she flies off it
//   THE PROPS    vigas, canales, toron, ladders, ristras, pots and jars, bells, flags, crosses, finials, awnings and kilims
//                (dressprops.js), one instanced mesh a kind for the city, each hidden once the cell it hangs from is gone
// A phone keeps the plaster's colour work and drops the trowelled normal (`machine.mobile`: the desk's look as it is).
// Prior art: the house's split of rules from looks over a division's placeholders (vfx/mechs/fire/, vfx/mechs/challenges/), Teardown's
// and Minecraft shaders' world-space noise over voxels, the adobe and banco plasters of Taos, Djenné and the Draa (the colours sampled
// from photographs of their walls), Fez's zellige and Yazd's kashi for the glazes.
//
//   const D = new CityDress(game).attach(city)   D.update(dt)   D.refresh(rec)   D.dispose()   installCityDress(game) (the fx phase)
//   ADOBE_LOOK   cellColour(role, x, y, z, tint, up) -> hex   cellSheen(role) -> 0..1   adobeMaterial({ mobile }) -> material
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { ROLE as R } from '../../../progress/mechs/adobe/blueprintkit.js';
import { PROP_KINDS, propGeometry, propMatrix, propColour } from './dressprops.js';
import { PROVING } from '../../../world/hangar/layout.js';

/** The palette: four earths for a building's plaster (picked by its tint), what each role takes from it or has of its own, and the
 *  jitter a cell's lightness moves by (small: the plaster's own mottle does the rest). */
export const ADOBE_LOOK = {
  earth: [0xc08a5a, 0xb4704f, 0xcfa477, 0xa98666],   // Taos ochre, Marrakech rose, Djenné sand, the Draa's grey-brown
  lime: 0xece3d1, rose: 0xb05e46, roofEarth: 0x8f6a4a, stone: 0x8d8473, glass: 0x9cc4d4, gold: 0xd4a640, thatch: 0xb89a55,
  wood: 0x7a5636, viga: 0x6b4a2e, lintel: 0x5e3f28, lattice: 0x5a3a22,
  door: [0x24508f, 0x2b9aa0, 0x2f6e8e, 0x3e7d5a],        // indigo, turquoise, a Taos blue, a Fez green
  shutter: [0x3aa6a8, 0x2a5f9e, 0x5b8c3a],
  tile: [0x2f8a6a, 0x1f6f8f, 0xe9e2cf, 0x2f8a6a],       // zellige: green, teal, white
  cobalt: [0x1f3f9a, 0x1f3f9a, 0xdfe6ef],              // kashi: cobalt and white
  awning: [0xc0392b, 0xe9dcc0],
  goods: [0x8c5a3c, 0x6a3f9a, 0xc9a13a, 0x2f7f6f, 0xa8322a],
  jitter: 0.045,
  sheen: { [R.tile]: 0.8, [R.cobalt]: 0.8, [R.gold]: 1, [R.door]: 0.4, [R.shutter]: 0.4, [R.glass]: 0.9, [R.lime]: 0.12 },
};
const L = ADOBE_LOOK;
const hash = (x, y, z) => { let h = (x * 374761393 + y * 668265263 + z * 2147483647) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const _c = new THREE.Color(), _k = new THREE.Color();
const shade = (hex, k) => _k.setHex(hex).multiplyScalar(k).getHex();
const at = (list, k) => list[Math.floor(k * list.length) % list.length];

/** A cell's colour by its role: its building's earth (tint 0..1) for the plaster kinds, the role's own otherwise; `up` its top face
 *  (a flat roof's packed earth shows on top). */
export function cellColour(role, x, y, z, tint = 0, up = false) {
  const earth = at(L.earth, tint), h = hash(x, y, z);
  switch (role) {
    case R.plaster: case R.crenel: case R.toron: return up ? shade(earth, 0.93) : earth;
    case R.dome: return shade(earth, 1.05);
    case R.trim: return shade(earth, 1.13);
    case R.relief: return (x + y + z) % 5 === 0 ? shade(at(L.door, tint), 1.1) : shade(earth, 1.18);
    case R.lime: return L.lime;
    case R.rose: return up ? shade(L.rose, 0.93) : L.rose;
    case R.roofEarth: return up ? L.roofEarth : shade(L.viga, 1.05);
    case R.stone: return L.stone;
    case R.glass: return L.glass;
    case R.gold: return L.gold;
    case R.thatch: return L.thatch;
    case R.viga: case R.floor: return L.viga;
    case R.lintel: return L.lintel;
    case R.wood: return L.wood;
    case R.lattice: return L.lattice;
    case R.door: return at(L.door, tint * 0.7 + h * 0.3);
    case R.shutter: return at(L.shutter, tint);
    case R.tile: return at(L.tile, h);
    case R.cobalt: return at(L.cobalt, h);
    case R.awning: return L.awning[x % 2];
    case R.goods: return at(L.goods, h);
    default: return earth;
  }
}
/** A role's sheen (0 matte plaster .. 0.8 a glaze, 1 gold). */
export const cellSheen = (role) => L.sheen[role] || 0;

const NOISE = /* glsl */ `
  float aH(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
  float aN(vec3 x) { vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(aH(i), aH(i + vec3(1, 0, 0)), f.x), mix(aH(i + vec3(0, 1, 0)), aH(i + vec3(1, 1, 0)), f.x), f.y),
               mix(mix(aH(i + vec3(0, 0, 1)), aH(i + vec3(1, 0, 1)), f.x), mix(aH(i + vec3(0, 1, 1)), aH(i + vec3(1, 1, 1)), f.x), f.y), f.z); }
  float aF(vec3 p) { return 0.55 * aN(p) + 0.3 * aN(p * 2.07 + 3.1) + 0.15 * aN(p * 4.3 + 7.7); }`;

/** The plaster: vertex-coloured, flat, its mottle, streaks, grime, joints, glaze and gold worked in the program (world-space noise). */
export function adobeMaterial({ mobile = false } = {}) {
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.92, metalness: 0 });
  m.name = 'adobe-plaster';
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uGround = { value: PROVING.at.y };
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', `#include <common>
        attribute float aSheen; attribute vec3 aCell; varying float vSheen; varying vec3 vCell; varying vec3 vWPos; varying vec3 vWNor;`)
      .replace('#include <fog_vertex>', `#include <fog_vertex>
        vSheen = aSheen; vCell = aCell; vWPos = (modelMatrix * vec4(transformed, 1.0)).xyz; vWNor = normalize(mat3(modelMatrix) * objectNormal);`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
        uniform float uGround; varying float vSheen; varying vec3 vCell; varying vec3 vWPos; varying vec3 vWNor; ${NOISE}`)
      .replace('#include <color_fragment>', `#include <color_fragment>
        vec3 aP = vWPos; float aPl = 1.0 - smoothstep(0.3, 0.6, vSheen);                  // (plaster: not a glaze, a paint or gold)
        float aMot = aF(aP * vec3(0.42, 0.55, 0.42)), aFine = aN(aP * 3.1);
        float aStreak = aN(vec3(aP.x * 1.9, aP.y * 0.09, aP.z * 1.9));
        float aH0 = aP.y - uGround;
        vec3 aA = abs(vWNor), aE3 = abs(vCell - 0.5);
        float aEdge = aA.x > 0.5 ? max(aE3.y, aE3.z) : aA.y > 0.5 ? max(aE3.x, aE3.z) : max(aE3.x, aE3.y);
        float aLow = 1.0 - smoothstep(0.0, 2.6, aH0);
        diffuseColor.rgb *= mix(1.0, 0.84 + 0.26 * aMot + 0.07 * (aFine - 0.5), aPl);
        diffuseColor.rgb *= 1.0 - aPl * 0.09 * smoothstep(0.58, 0.9, aStreak) * step(aA.y, 0.5);
        diffuseColor.rgb *= 1.0 - aPl * (0.24 * aLow * (0.6 + 0.4 * aN(aP * 1.7)) + 0.16 * aLow * smoothstep(0.4, 0.5, aEdge));
        diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(0.86, 0.72, 0.6), aPl * aLow * 0.35);
        if (vSheen > 0.6 && vSheen < 0.95) {                                                // (a glaze: four tiles a cell, grouted, crazed a little)
          vec2 aUV = aA.x > 0.5 ? vCell.zy : aA.y > 0.5 ? vCell.xz : vCell.xy;
          vec2 aG = abs(fract(aUV * 2.0) - 0.5); float aGrout = smoothstep(0.42, 0.48, max(aG.x, aG.y));
          diffuseColor.rgb = mix(diffuseColor.rgb * (0.92 + 0.16 * aN(aP * 7.0)), vec3(0.78, 0.74, 0.66), aGrout * 0.8);
        }`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
        roughnessFactor = mix(roughnessFactor * (0.9 + 0.2 * aMot), 0.2, smoothstep(0.3, 0.8, vSheen));`)
      .replace('#include <metalnessmap_fragment>', `#include <metalnessmap_fragment>
        metalnessFactor = mix(metalnessFactor, 0.85, step(0.95, vSheen));`);
    if (!mobile) sh.fragmentShader = sh.fragmentShader.replace('#include <normal_fragment_begin>', `#include <normal_fragment_begin>
        { vec3 aQ = vWPos * 1.25, aD = vec3(0.0); const float aS = 0.18;
          aD.x = aF(aQ + vec3(aS, 0, 0)) - aF(aQ - vec3(aS, 0, 0)); aD.y = aF(aQ + vec3(0, aS, 0)) - aF(aQ - vec3(0, aS, 0)); aD.z = aF(aQ + vec3(0, 0, aS)) - aF(aQ - vec3(0, 0, aS));
          float aK = 0.55 * (1.0 - smoothstep(0.3, 0.6, vSheen));
          vec3 aVn = (viewMatrix * vec4(aD, 0.0)).xyz; normal = normalize(normal - (aVn - normal * dot(aVn, normal)) * aK); }`);
  };
  m.customProgramCacheKey = () => `adobe-plaster-${mobile ? 'm' : 'd'}`;
  return m;
}

/** A mesh of hers (four vertices a face, a face where a cell meets air: city.js meshCells) recoloured from its cells' roles: `cellOf`
 *  (the face's cell from its middle and normal) -> [x, y, z]; adds aSheen and aCell (where in its cell a vertex is). */
function recolour(geo, b, cellOf) {
  const P = geo.attributes.position, N = geo.attributes.normal, n = P.count;
  const col = new Float32Array(n * 3), sheen = new Float32Array(n), cell = new Float32Array(n * 3);
  for (let v = 0; v < n; v += 4) {
    let mx = 0, my = 0, mz = 0; for (let k = 0; k < 4; k++) { mx += P.getX(v + k); my += P.getY(v + k); mz += P.getZ(v + k); }
    mx /= 4; my /= 4; mz /= 4;
    const nx = N.getX(v), ny = N.getY(v), nz = N.getZ(v), [x, y, z, ox, oy, oz] = cellOf(mx - nx * 0.5, my - ny * 0.5, mz - nz * 0.5);
    const i = x + b.w * (z + b.d * y), role = (x >= 0 && y >= 0 && z >= 0 && x < b.w && y < b.h && z < b.d && b.role[i]) || R.plaster;
    _c.setHex(cellColour(role, x, y, z, b.tint, ny > 0.5)).multiplyScalar(1 + L.jitter * (hash(x, y, z) * 2 - 1));
    const s = cellSheen(role);
    for (let k = 0; k < 4; k++) {
      const j = v + k; col[j * 3] = _c.r; col[j * 3 + 1] = _c.g; col[j * 3 + 2] = _c.b; sheen[j] = s;
      cell[j * 3] = P.getX(j) - ox + 0.5; cell[j * 3 + 1] = P.getY(j) - oy + 0.5; cell[j * 3 + 2] = P.getZ(j) - oz + 0.5;
    }
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3)); geo.setAttribute('aSheen', new THREE.BufferAttribute(sheen, 1)); geo.setAttribute('aCell', new THREE.BufferAttribute(cell, 3));
}

const _m = new THREE.Matrix4(), _r = new THREE.Matrix4(), ZERO = new THREE.Matrix4().makeScale(0, 0, 0);

export class CityDress {
  constructor(game) { this.game = game; this.city = null; this.recs = null; this.seen = new WeakMap(); this.chunks = new WeakSet(); this.pools = {}; this.group = null; this.mat = null; }

  /** Dress a city (Dovina's ToyCity, built): its adobe buildings' meshes and their props. */
  attach(city) {
    if (this.city) this.detach();
    this.city = city; this.recs = city.recs;
    this.mat = adobeMaterial({ mobile: !!this.game?.graphics?.machine?.mobile });
    this.group = new THREE.Group(); this.group.name = 'adobedress'; (city.group || city.into)?.add(this.group);
    const want = {}; for (const rec of this.adobe()) for (const p of rec.b.props || []) want[p.kind] = (want[p.kind] || 0) + 1;
    for (const k of PROP_KINDS) {
      if (!want[k]) continue;
      const mesh = new THREE.InstancedMesh(propGeometry(k), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: k === 'finial' || k === 'bell' ? 0.35 : 0.8, metalness: k === 'bell' ? 0.6 : k === 'finial' ? 0.4 : 0, side: k === 'flag' || k === 'awning' || k === 'rug' ? THREE.DoubleSide : THREE.FrontSide }), want[k]);
      mesh.name = `adobedress.${k}`; mesh.castShadow = k !== 'rug'; mesh.receiveShadow = true; mesh.frustumCulled = false;
      this.pools[k] = { mesh, n: 0 }; this.group.add(mesh);
    }
    for (const rec of this.adobe()) {
      rec.dressProps = (rec.b.props || []).map((p) => { const P = this.pools[p.kind], slot = P.n++; P.mesh.setColorAt(slot, _c.setHex(propColour(p))); return { p, P, slot, host: p.x + rec.b.w * (p.z + rec.b.d * p.y) }; });
    }
    for (const k in this.pools) if (this.pools[k].mesh.instanceColor) this.pools[k].mesh.instanceColor.needsUpdate = true;
    this.update(0);
    return this;
  }
  /** The buildings of the city that came from a blueprint. */
  adobe() { return (this.recs || []).filter((r) => r.b?.role); }

  update() {
    const C = this.game?.hangar?.city;
    if (C && C !== this.city && C.built) this.attach(C);
    if (!this.city) return;
    if (!this.city.built || this.city.recs !== this.recs) { if (this.city.built && this.city.recs !== this.recs) this.attach(this.city); else { this.detach(); return; } }
    for (const rec of this.adobe()) if (rec.mesh && this.seen.get(rec) !== rec.mesh.geometry) this.refresh(rec);
    for (const ch of this.city.chunks || []) if (!this.chunks.has(ch) && ch.rec?.b?.role) this.dressChunk(ch);
  }

  /** A building's mesh recoloured and put in the plaster, its props placed again (hidden where their cell is gone). */
  refresh(rec) {
    const b = rec.b, o = [0.5 - b.w / 2, 0.5, 0.5 - b.d / 2];
    recolour(rec.mesh.geometry, b, (x, y, z) => { const X = Math.round(x - o[0]), Y = Math.round(y - o[1]), Z = Math.round(z - o[2]); return [X, Y, Z, X + o[0], Y + o[1], Z + o[2]]; });
    rec.mesh.material = this.mat; this.seen.set(rec, rec.mesh.geometry);
    _r.makeRotationY(rec.yaw || 0).setPosition(rec.cx, PROVING.at.y, rec.cz);
    const dirty = new Set();
    for (const d of rec.dressProps || []) {
      if (b.mat[d.host]) d.P.mesh.setMatrixAt(d.slot, _m.multiplyMatrices(_r, propMatrix(d.p, b, _m.identity()))); else d.P.mesh.setMatrixAt(d.slot, ZERO);
      dirty.add(d.P);
    }
    for (const P of dirty) P.mesh.instanceMatrix.needsUpdate = true;
  }
  /** A chunk she flies off an adobe building, recoloured from its cells' roles (its mesh about its centre of mass: the offset found
   *  from its lowest cell and its lowest vertex). */
  dressChunk(ch) {
    this.chunks.add(ch); const geo = ch.mesh?.geometry; if (!geo?.attributes?.position) return;
    const b = ch.rec.b; geo.computeBoundingBox(); const bb = geo.boundingBox; let lx = Infinity, ly = Infinity, lz = Infinity;
    for (const [x, y, z] of ch.cells) { lx = Math.min(lx, x); ly = Math.min(ly, y); lz = Math.min(lz, z); }
    const off = [bb.min.x + 0.5 - lx, bb.min.y + 0.5 - ly, bb.min.z + 0.5 - lz];
    recolour(geo, b, (x, y, z) => { const X = Math.round(x - off[0]), Y = Math.round(y - off[1]), Z = Math.round(z - off[2]); return [X, Y, Z, X + off[0], Y + off[1], Z + off[2]]; });
    ch.mesh.material = this.mat;
  }

  detach() {
    for (const k in this.pools) { const P = this.pools[k]; P.mesh.geometry.dispose(); P.mesh.material.dispose(); }
    this.group?.parent?.remove(this.group); this.mat?.dispose();
    this.pools = {}; this.group = null; this.mat = null; this.city = null; this.recs = null; this.seen = new WeakMap(); this.chunks = new WeakSet();
  }
  dispose() { this.detach(); }
}

/** The dress installed and stepped in the `fx` phase on the real clock; it dresses the city whenever the proving ground builds one. */
export function installCityDress(game) {
  const D = game.cityDress = new CityDress(game);
  game.systems?.add('fx', D, { clock: 'raw', name: 'cityDress' });
  return D;
}
