// ---------------------------------------------------------------------------------------
// DATURA: the moonflower (the owner's playlist: Crywolf's "DATURA [paroxysm]"; docs/OST.md §6). Sacred datura (Datura wrightii) is a
// desert native, so it grows here at the oasis: a low sprawl of dark grey-green leaves and big white trumpets, each flared into five
// points, faintly lavender at the rim and green-gold down the throat. It keeps the real plant's hours: by day each flower is furled
// into a twisted bud; at dusk they open (a real datura opens in minutes, at sundown), stay open through the night, faintly lit as
// white flowers are under a moon (vfx/sky.js draws one now), and furl again in the morning. Beautiful and poisonous; the lore is
// Espada's to give it.
//
// Its hours are the sky's own (the day share of the sky's grade, vfx/sky.js G.uDay): no clock of its own to disagree with the sky.
// One instanced mesh for every flower and one for every leaf (two draws for all the clumps), the opening done in the vertex shader.
//
// Prior art: the plant itself (Datura wrightii's nightly opening, its spiral-furled bud, its five-toothed flared corolla), Okami's
// flowers that bloom as a sign, and the moonflowers of the night garden (a garden made for the evening, of white flowers).
//
//   game.daturas = new Daturas(game, spots)   (spots: [{ x, z, n }] in world metres: a clump of n flowers each)   .update(rawDt)
//   new Daturas(game, spots, { parent, heightAt })   elsewhere (the Shrine Garden: Petra places it)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

const LEN = 0.2; // (a trumpet's length, metres: the real ones are 15 to 20 cm)

/** The trumpet: a lathe along +y, a tube flaring to a five-toothed mouth; uv.y is the way up it (0 the base, 1 the rim). */
function trumpetGeo() {
  const pts = [];
  for (let i = 0; i <= 10; i++) { const t = i / 10; pts.push(new THREE.Vector2(0.012 + 0.006 * t + 0.07 * Math.pow(t, 3.2), t * LEN)); }
  const g = new THREE.LatheGeometry(pts, 20);
  return g;
}
function leafGeo() { // (an ovate leaf, a little cupped, along +z)
  const g = new THREE.BufferGeometry();
  const P = [0, 0, 0, 0.07, 0.015, 0.09, 0, 0.03, 0.24, -0.07, 0.015, 0.09];
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setIndex([0, 1, 2, 0, 2, 3]); g.computeVertexNormals();
  return g;
}

export class Daturas {
  constructor(game, spots = [], { parent = null, heightAt = null } = {}) {
    this.game = game;
    this.u = { uOpen: { value: 0 } };
    const H = heightAt || ((x, z) => game.dunes?.heightAt?.(x, z) ?? 0);
    const flowers = [], leaves = [];
    let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (const S of spots) {
      const y0 = H(S.x, S.z);
      for (let i = 0; i < (S.n || 7); i++) {
        const a = rnd() * Math.PI * 2, r = 0.15 + rnd() * 0.45, x = S.x + Math.cos(a) * r, z = S.z + Math.sin(a) * r;
        flowers.push({ p: new THREE.Vector3(x, y0 + 0.3 + rnd() * 0.25, z), tilt: 0.5 + rnd() * 0.7, yaw: a + (rnd() - 0.5), phase: rnd() });
      }
      for (let i = 0; i < 70; i++) { // (a dense low mound of leaves, the flowers held up out of it)
        const a = rnd() * Math.PI * 2, r = Math.sqrt(rnd()) * 0.6;
        leaves.push({ p: new THREE.Vector3(S.x + Math.cos(a) * r, y0 + 0.04 + (0.42 - r * 0.5) * rnd(), S.z + Math.sin(a) * r), yaw: a + (rnd() - 0.5) * 0.8, pitch: -0.05 - rnd() * 0.35, s: 0.8 + rnd() * 0.5 });
      }
    }
    // the flowers: white, lavender at the rim, green-gold down the throat; furled and twisted by day, flared by night
    const fm = new THREE.MeshStandardMaterial({ name: 'datura-flower', color: 0xffffff, roughness: 0.55, side: THREE.DoubleSide, emissive: 0xffffff, emissiveIntensity: 0 });
    fm.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, this.u);
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nuniform float uOpen; attribute float aPhase; varying float vUp, vOp;')
        .replace('#include <begin_vertex>', `#include <begin_vertex>
{ float up = transformed.y / ${LEN.toFixed(3)}, op = clamp(uOpen * 1.25 - aPhase * 0.25, 0.0, 1.0); // (each opens in its own moment)
  float a = atan(transformed.z, transformed.x), r = length(transformed.xz);
  float teeth = 1.0 + 0.22 * pow(max(0.0, cos(a * 5.0)), 3.0) * smoothstep(0.75, 1.0, up); // (the five points of the rim)
  float flare = mix(0.22 + 0.25 * (1.0 - up), 1.0, op);     // (a bud: the mouth closed down to the tube)
  a += (1.0 - op) * up * 2.4;                                 // (and twisted, as the bud furls in a spiral)
  r *= mix(1.0, teeth, op) * mix(flare, 1.0, 1.0 - smoothstep(0.3, 1.0, up));
  transformed.x = cos(a) * r; transformed.z = sin(a) * r;
  transformed.y *= mix(0.8, 1.0, op);
  vUp = up; vOp = op; }`);
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', '#include <common>\nvarying float vUp, vOp;')
        .replace('#include <color_fragment>', `#include <color_fragment>
  diffuseColor.rgb = mix(vec3(0.62, 0.72, 0.42), vec3(1.0), smoothstep(0.1, 0.55, vUp)); // (green-gold down the throat)
  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.86, 0.78, 1.0), smoothstep(0.8, 1.0, vUp) * 0.8); // (lavender at the rim)`)
        .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n  totalEmissiveRadiance = diffuseColor.rgb * 0.16 * vOp * smoothstep(0.35, 1.0, vUp); // (a white flower at night holds what light there is)');
    };
    fm.customProgramCacheKey = () => 'datura-flower';
    const fg = trumpetGeo();
    fg.setAttribute('aPhase', new THREE.InstancedBufferAttribute(new Float32Array(flowers.map((f) => f.phase)), 1));
    this.flowers = new THREE.InstancedMesh(fg, fm, Math.max(1, flowers.length));
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), one = new THREE.Vector3(1, 1, 1);
    flowers.forEach((f, i) => { e.set(f.tilt, f.yaw, 0, 'YXZ'); q.setFromEuler(e); this.flowers.setMatrixAt(i, m.compose(f.p, q, one)); });
    // the leaves: dark grey-green, velvet (the real leaf is downy)
    const lm = new THREE.MeshStandardMaterial({ name: 'datura-leaf', color: 0x7a8a5c, roughness: 0.95, side: THREE.DoubleSide }); // (grey-green and downy)
    this.leaves = new THREE.InstancedMesh(leafGeo(), lm, Math.max(1, leaves.length));
    const s = new THREE.Vector3();
    leaves.forEach((l, i) => { e.set(l.pitch, l.yaw, 0, 'YXZ'); q.setFromEuler(e); this.leaves.setMatrixAt(i, m.compose(l.p, q, s.setScalar(l.s))); }); // (17 to 26 cm, as the real leaf is)
    for (const o of [this.flowers, this.leaves]) { o.castShadow = false; o.receiveShadow = true; o.computeBoundingSphere?.(); }
    this.group = new THREE.Group(); this.group.name = 'daturas'; this.group.add(this.flowers, this.leaves);
    if (!parent) this.group.userData.zoneFree = true;
    (parent || game.scene)?.add(this.group);
    this.open = 0;
  }

  update(raw = 1 / 60) {
    const D = this.game.dunes, on = !D || (D.mix ?? 1) > 0.01;
    this.group.visible = on; if (!on) return;
    const day = this.game.sky?.G?.uDay?.value ?? 0, want = 1 - Math.min(1, day * 1.6); // (open as the day goes: at dusk, through the night)
    this.open += (want - this.open) * (1 - Math.exp(-raw * 0.4)); // (a minute or so to open, as the real flower does)
    this.u.uOpen.value = this.open;
  }
}
