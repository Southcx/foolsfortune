// ---------------------------------------------------------------------------------------
// THE SHORE'S LOOK: where Anagami's sand meets the Emocean (Petra's beach, world/dunes/beach.js: the ground, the waterline, the wall and
// the jetty; this is what is seen there). Crude is liquid Lachryma (docs/ART.md, section 3), so the shore is not water on sand:
//
//   THE SEA        the same crude sea the ships sail (vfx/crudesea.js), laid at the shore's level, its swells lowered near land, and
//                  drawn only in the shore's sector (the dunes stand everywhere else); it replaces the beach's placeholder sheet
//   THE SWASH      a ribbon along the waterline where the crude comes up the sand and draws back, slowly, on two low waves along the
//                  shore (real movement: the edge travels, nothing flickers), the oil film's colours bright in a thin band at its lip,
//                  never white foam (it is not water)
//   THE WET SAND   behind the swash the sand is dark and glossy where the crude has been, drying back to the dunes' own colour a few
//                  metres up the beach
//   THE MOOD'S EDGE  the island's weather ends at the waterline (Dovina's: the Emocean has no ego, so no mood): what falls is told where
//                  the shore is (`weatherLook.shoreline`), and fades out over the crude
//
// Prior art: Wind Waker's shorelines (a scrolled foam band, the swash read from a distance), the swash zone itself (uprush and
// backwash, the wet line left behind), the oil-on-sand of a tar seep (Rancho La Brea's black pools, their rainbow skin), and the
// thin-film colours already on Lachryma (vfx/crudesea.js, world/treasure/cubes.js).
//
//   game.shore = new Shore(game)   game.shore.update(t, camera)   (it builds itself once the dunes' beach exists; off the dunes it hides)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { CrudeSea } from './crudesea.js';
import { SHORE } from '../world/dunes/beach.js';

/** The shore's sea as its own shape: a ring sector from just inside the waterline out past the dunes' far plane, its rows packed
 *  toward the shore (where the eye is) and thinning out to sea; laid in world xz (about 9,200 triangles). */
function sectorGeo(C, angle, half, r0, r1, na = 72, nr = 64) { // (64 rings: fewer and the fan triangles grew so long and thin the film read as spokes from the jetty)
  const pos = [], idx = [];
  for (let i = 0; i <= nr; i++) {
    const r = r0 + (r1 - r0) * Math.pow(i / nr, 2);
    for (let j = 0; j <= na; j++) { const a = angle - half + (2 * half) * (j / na); pos.push(C.x + Math.cos(a) * r, 0, C.z + Math.sin(a) * r); }
  }
  for (let i = 0; i < nr; i++) for (let j = 0; j < na; j++) { const a = i * (na + 1) + j, b = a + na + 1; idx.push(a, a + 1, b, a + 1, b + 1, b); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  if (g.attributes.normal.getY(0) < 0) { g.index.array.reverse(); g.computeVertexNormals(); } // (facing up, whichever way the sector winds)
  return g;
}
const ACROSS = [-4, -2, -1, -0.4, 0, 0.6, 1.4, 2.4, 3.6, 5]; // (metres from the waterline, inland positive: the ribbon's rows)

export class Shore {
  constructor(game) { this.game = game; this.built = false; this.t = 0; }

  build(beach) {
    const g = this.game, C = beach.center, seaY = beach.seaY;
    // the sea: the crude, in the shore's sector, quieter near land
    this.sea = new CrudeSea({ env: g.sky?.env || null, y: seaY, geometry: sectorGeo(C, SHORE.angle, SHORE.half + SHORE.fade * 1.5, SHORE.r - 30, SHORE.r + 520) });
    this.sea.clipSector({ center: C, angle: SHORE.angle, half: SHORE.half + SHORE.fade * 1.5, r0: SHORE.from });
    this.sea.set({ swell: 0.16, calm: 0.3, current: new THREE.Vector2(-Math.sin(SHORE.angle), Math.cos(SHORE.angle)) }); // (a longshore current: its streaks run along the coast, not out to the horizon, where they converged into spokes)
    this.sea.mesh.userData.zoneFree = true;
    g.scene.add(this.sea.mesh);
    if (beach.sea) beach.sea.visible = false; // (the placeholder sheet, replaced)

    // the swash and the wet sand: a ribbon along the waterline, its rows across it
    const P = beach.shore, n = P.length, m = ACROSS.length, pos = new Float32Array(n * m * 3), across = new Float32Array(n * m), along = new Float32Array(n * m);
    let L = 0;
    for (let i = 0; i < n; i++) {
      if (i) L += P[i].distanceTo(P[i - 1]);
      const d = new THREE.Vector2(P[i].x - C.x, P[i].z - C.z).normalize();
      for (let j = 0; j < m; j++) {
        const a = ACROSS[j], x = P[i].x - d.x * a, z = P[i].z - d.y * a, k = i * m + j;
        pos.set([x, Math.max(beach.heightAt(x, z), seaY) + 0.05, z], k * 3); across[k] = a; along[k] = L;
      }
    }
    const idx = [];
    const wet = P.map((p) => Math.abs(beach.heightAt(p.x, p.z) - seaY) < 0.5); // (only where the ground truly meets the crude: the sector's ends rise into dunes)
    for (let i = 0; i < n - 1; i++) if (wet[i] && wet[i + 1]) for (let j = 0; j < m - 1; j++) { const a = i * m + j, b = a + m; idx.push(a, a + 1, b, a + 1, b + 1, b); } // (wound to face up)
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('aAcross', new THREE.BufferAttribute(across, 1)); geo.setAttribute('aAlong', new THREE.BufferAttribute(along, 1));
    geo.setIndex(idx); geo.computeVertexNormals();
    this.u = { uT: { value: 0 } };
    const mat = new THREE.MeshStandardMaterial({ name: 'shore-swash', color: 0xffffff, roughness: 0.5, metalness: 0.05, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, envMap: g.sky?.env || null, envMapIntensity: 0.5 });
    mat.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, this.u);
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nattribute float aAcross, aAlong; varying float vAc, vAl;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvAc = aAcross; vAl = aAlong;');
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', `#include <common>
uniform float uT; varying float vAc, vAl; float swCrude, swWet, swBand;
vec3 swFilm(float t) { return 0.5 + 0.5 * cos(6.2832 * (t + vec3(0.0, 0.33, 0.67))); }`)
        .replace('#include <color_fragment>', `#include <color_fragment>
  // the swash: where the crude's edge is now (metres inland), two slow waves travelling along the shore
  float edge = 0.55 * sin(uT * 0.5 + vAl * 0.05) + 0.35 * sin(uT * 0.83 + vAl * 0.13 + 1.7) - 0.15;
  swCrude = 1.0 - smoothstep(edge - 0.1, edge + 0.1, vAc);
  swBand = exp(-pow((vAc - edge) / 0.22, 2.0));
  float reach = 1.3 + 0.25 * sin(vAl * 0.071); // (the high-water line, a little ragged along the shore)
  swWet = (1.0 - smoothstep(edge, edge + reach + 2.6, vAc)) * (1.0 - swCrude);
  diffuseColor.rgb = mix(vec3(0.42, 0.3, 0.19), vec3(0.025, 0.02, 0.035), swCrude);            // (wet sand, darkened; the crude itself)
  diffuseColor.a = max(swCrude * 0.96, swWet * 0.5) * (1.0 - smoothstep(4.0, 5.0, vAc));`)
        .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\n  roughnessFactor = mix(0.85, 0.12, max(swCrude, swWet * 0.8));')
        .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
  totalEmissiveRadiance += swFilm(vAl * 0.015 + uT * 0.04 + vAc * 0.3) * swBand * 0.22; // (the oil film at the lip, never white foam)`);
    };
    mat.customProgramCacheKey = () => 'shore-swash';
    this.swash = new THREE.Mesh(geo, mat); this.swash.renderOrder = 2; this.swash.userData.zoneFree = true; this.swash.frustumCulled = false;
    g.scene.add(this.swash);
    // the island's weather ends at the waterline
    g.weatherLook?.shoreline?.({ center: C, angle: SHORE.angle, half: SHORE.half + SHORE.fade, r: SHORE.r });
    this.built = true;
  }

  update(t, camera) {
    const D = this.game.dunes;
    const on = !!D && (D.mix ?? 1) > 0.01; // (only from the dunes: the camera far plane opens there, and the sea is theirs)
    if (!this.built) { if (on && D.beach) this.build(D.beach); else return; } // (built the first time the Dunes are seen: nothing compiled before)
    this.sea.mesh.visible = this.swash.visible = on;
    if (!on) return;
    this.t = t; this.u.uT.value = t;
    this.sea.update(t, camera.position);
  }

  dispose() { this.sea?.dispose(); if (this.swash) { this.swash.parent?.remove(this.swash); this.swash.geometry.dispose(); this.swash.material.dispose(); } }
}
