// ---------------------------------------------------------------------------------------
// A WARPED POCKET'S LOOK (plain name; docs/plans/DUNEMAW.md, "The finds and the warp": "near thick Lachryma, the place shows its data
// (the glitch's tear, on the objects themselves); sand falls upward; a pot floats"). One a floor of the Great Dunemaw: round the warped
// artifact Petra lays (world/well/finds.js, `game.well.finds.arts`, the one with `warped`), read only, never decided here:
//   THE TEAR      the objects themselves show their data: horizontal slices of each jump sideways in steps and light in the glitch's
//                 two fringes (cyan one way, magenta the other), a little always and in a burst every couple of real seconds. Worn by
//                 the artifact (its mesh dressed in the tear's material while the pocket stands: its own is Petra's and left as it was),
//                 the floating pot and the sherds.
//   SAND UPWARD   the library's held `well.warp.rise` at the pocket's foot: grains lifting off the sand and speeding up as they climb.
//   A POT FLOATS  a forgotten pot of the boomtown (world/well/finds.js's kinds, drawn here, no collider, not a breakable) hanging
//                 tipped on its side over the sand toward the room's middle, bobbing and turning; a ring of sherds orbiting the artifact.
//   LET GO        the artifact taken (the warp shifts the floor): the sand rains back (`well.warp.let`), the sherds go with it, the pot
//                 drops and breaks on the sand (`well.warp.pot`).
// One program added (the tear: MeshStandardMaterial with its vertex slices, lit like the cave), 3 draws a pocket, only in the Well.
//
// Prior art: Control's Altered World Events (objects hanging in the air round what is wrong), Stalker's anomalies (debris circling a
// point), the house's glitch (vfx/glitch.js) and the warped stalactite's tear (vfx/cavekit.js) brought onto lit objects; Spelunky's idol
// (the treasure that changes the room, read before it is taken).
//
//   game.wellWarp = new WellWarpLook(game)   (boot/world.js, after game.well)   .update(dt)   .dispose()   WARP_LOOK   tearMaterial(opts)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/** The numbers: the tear (slices a metre, how far a slice jumps in m, its steps a real second, the rest's and the burst's share, the burst's
 *  period and length in real s); the pot (its scale, how far toward the room's middle and how high it hangs, its bob); the sherds (count,
 *  orbit radius and height); how far off the camera the sand runs (m); the drop's gravity (m/s^2). */
export const WARP_LOOK = {
  tear: { bands: 9, shift: 0.09, steps: 10, rest: 0.3, burst: 2.3, burstLen: 0.32 },
  pot: { scale: 1.5, out: 1.9, up: 1.35, bob: 0.18, tip: 1.2, colour: 0xa8653c },
  sherds: { n: 6, r: 1.15, up: 0.9, colour: 0xc58a5c },
  near: 45, gravity: 9.8,
};

const shared = { uT: { value: 0 } };
/** The tear's material: a lit standard material whose slices jump in steps and light in the glitch's fringes (`u.uTear` 0..1). */
export function tearMaterial({ color = 0xffffff, emissive = 0x000000, emissiveIntensity = 1, metalness = 0, roughness = 0.85, bands = WARP_LOOK.tear.bands, side = THREE.FrontSide } = {}) {
  const m = new THREE.MeshStandardMaterial({ color, emissive, emissiveIntensity, metalness, roughness, side, name: 'well-warp-tear' });
  const u = m.userData.u = { uT: shared.uT, uTear: { value: WARP_LOOK.tear.rest }, uBands: { value: bands }, uShift: { value: WARP_LOOK.tear.shift }, uSteps: { value: WARP_LOOK.tear.steps } };
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, u);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uT, uTear, uBands, uShift, uSteps; varying float vTorn;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
{ float st = floor(uT * uSteps), band = floor(transformed.y * uBands);
  float h = fract(sin(band * 17.31 + st * 3.17) * 43758.55);
  float on = step(1.0 - 0.32 * uTear, h); // (more slices torn as the tear bursts)
  float s = fract(h * 91.7) < 0.5 ? -1.0 : 1.0;
  transformed.x += s * uShift * (0.4 + uTear) * on; vTorn = s * on; }`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying float vTorn; uniform float uT;')
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
totalEmissiveRadiance += (vTorn > 0.0 ? vec3(0.1, 0.85, 1.0) : vec3(1.0, 0.12, 0.75)) * abs(vTorn) * (1.1 + 0.5 * step(0.5, fract(gl_FragCoord.y * 0.25)));`);
  };
  m.customProgramCacheKey = () => 'well-warp-tear';
  return m;
}

/** A forgotten pot (a jar's profile, turned): its foot at the origin. */
function potGeometry() {
  const P = [[0, 0], [0.13, 0], [0.16, 0.04], [0.27, 0.22], [0.31, 0.36], [0.27, 0.54], [0.15, 0.68], [0.12, 0.74], [0.16, 0.8], [0.14, 0.82]];
  const g = new THREE.LatheGeometry(P.map(([r, y]) => new THREE.Vector2(r, y)), 14); g.computeVertexNormals(); return g;
}
/** The sherds: n curved flakes of a broken pot laid round a ring, one geometry. */
function sherdGeometry(n, r, rng) {
  const parts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + rng() * 0.6, g = new THREE.CylinderGeometry(0.3, 0.3, 0.1 + rng() * 0.08, 6, 1, true, 0, 0.6 + rng() * 0.6);
    g.scale(0.5 + rng() * 0.4, 1, 0.5 + rng() * 0.4);
    g.rotateX(rng() * 3); g.rotateZ(rng() * 3); g.translate(Math.cos(a) * r, (rng() - 0.5) * 0.5, Math.sin(a) * r); parts.push(g.toNonIndexed());
  }
  const m = mergeGeometries(parts); parts.forEach((g) => g.dispose()); m.computeVertexNormals(); return m;
}

export class WellWarpLook {
  constructor(game) {
    this.game = game; this.t = 0; this.finds = null; this.pockets = [];
    this.potMat = tearMaterial({ color: WARP_LOOK.pot.colour, roughness: 0.9, bands: 11 });
    this.sherdMat = tearMaterial({ color: WARP_LOOK.sherds.colour, roughness: 0.8, bands: 14, side: THREE.DoubleSide });
    this.artMat = tearMaterial({ color: 0x9a6bff, emissive: 0x5a2a9a, emissiveIntensity: 0.8, metalness: 0.6, roughness: 0.25, bands: 12 }); // (finds.js's warped glint, torn)
    this.potGeo = potGeometry();
  }

  /** The pockets of the floor now laid (finds.js's warped artifacts), built once a floor. */
  lay(F) {
    this.clear(); this.finds = F; if (!F) return;
    const W = WARP_LOOK, cells = F.cur?.cells || [];
    for (const a of F.arts || []) {
      if (!a.warped || a.taken) continue;
      let best = null, bd = Infinity; for (const c of cells) { const d = Math.hypot(c.x - a.pos.x, c.z - a.pos.z); if (d < bd) { bd = d; best = c; } }
      const to = best && bd > 0.5 ? new THREE.Vector2(best.x - a.pos.x, best.z - a.pos.z).normalize() : new THREE.Vector2(1, 0); // (toward the room's middle: off the wall)
      const root = new THREE.Group(); root.name = 'well-warp'; root.position.copy(a.pos); root.userData.zone = 'well';
      const pot = new THREE.Mesh(this.potGeo, this.potMat); pot.scale.setScalar(W.pot.scale); pot.castShadow = true;
      pot.position.set(to.x * W.pot.out, W.pot.up, to.y * W.pot.out); root.add(pot);
      const seed = Math.abs(Math.sin(a.pos.x * 12.9 + a.pos.z * 78.2)) * 1e4; let s = seed; const rng = () => { s = (s * 16807) % 2147483647 || 1; return (s % 10000) / 10000; };
      const sherds = new THREE.Mesh(sherdGeometry(W.sherds.n, W.sherds.r, rng), this.sherdMat); sherds.position.y = W.sherds.up; root.add(sherds);
      this.game.scene.add(root);
      this.pockets.push({ a, root, pot, sherds, rise: null, state: 'held', vy: 0, ph: rng() * 6.28, home: pot.position.clone(), artOwn: a.m.material });
      a.m.material = this.artMat; // (the artifact torn while it lies in the pocket; finds.js's own material is kept and put back)
    }
  }

  clear() {
    for (const p of this.pockets) {
      p.rise?.stop?.(); p.root.parent?.remove(p.root); p.sherds.geometry.dispose();
      if (p.a.m.material === this.artMat) p.a.m.material = p.artOwn;
    }
    this.pockets = []; this.finds = null;
  }

  update(dt) {
    const g = this.game, F = g.well?.active ? g.well.finds : null;
    if (F !== this.finds) this.lay(F);
    if (!this.pockets.length) return;
    const W = WARP_LOOK, t = (this.t += dt); shared.uT.value = t;
    const bt = t % W.tear.burst, burst = bt < W.tear.burstLen ? Math.sin((bt / W.tear.burstLen) * Math.PI) : 0, tear = W.tear.rest + (1 - W.tear.rest) * burst;
    for (const m of [this.potMat, this.sherdMat, this.artMat]) m.userData.u.uTear.value = tear;
    const cam = g.camera.position;
    for (const p of this.pockets) {
      if (p.state === 'held') {
        if (p.a.taken) { this.letGo(p); continue; }
        p.pot.position.y = p.home.y + W.pot.bob * Math.sin(t * 1.1 + p.ph);
        p.pot.rotation.set(W.pot.tip + 0.2 * Math.sin(t * 0.7 + p.ph), t * 0.35 + p.ph, 0.15 * Math.sin(t * 0.9));
        p.sherds.rotation.y = t * 0.45 + p.ph; p.sherds.position.y = W.sherds.up + 0.1 * Math.sin(t * 1.4 + p.ph);
        const near = cam.distanceTo(p.root.position) < W.near;
        if (near && !p.rise) p.rise = g.vfx?.play('well.warp.rise', { pos: p.root.position.clone() }) || null;
        else if (!near && p.rise) { p.rise.stop?.(); p.rise = null; }
      } else if (p.state === 'falling') {
        p.vy -= W.gravity * dt; p.pot.position.y += p.vy * dt; p.pot.rotation.x += dt * 2;
        if (p.pot.position.y <= 0.15) {
          p.state = 'done'; p.pot.visible = false;
          g.vfx?.play('well.warp.pot', { pos: p.pot.getWorldPosition(new THREE.Vector3()) });
        }
      }
    }
  }

  /** The artifact taken: the warp lets go (the sand rains back, the sherds go, the pot drops). */
  letGo(p) {
    p.state = 'falling'; p.vy = 0; p.rise?.stop?.(); p.rise = null; p.sherds.visible = false;
    this.game.vfx?.play('well.warp.let', { pos: p.root.position.clone() });
  }

  dispose() { this.clear(); this.potGeo.dispose(); for (const m of [this.potMat, this.sherdMat, this.artMat]) m.dispose(); }
}
