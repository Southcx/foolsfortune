// ---------------------------------------------------------------------------------------
// THE ISLAND'S MATTER, IN THE WORLD (docs/plans/GODHAND.md section 3): owns the one MatterField (godhand/matter.js) laid round where the
// god hand works, and gives it a body: a mesh for the matter laid on the ground, one for the Lachryma standing on it, and a height-field
// collider so the Courier, the creatures and the props stand on what the hand built. The field is laid (its authored ground sampled by
// rays, once) when the hand first works a place; a hand working somewhere more than FIELD.relay metres away lays a new one there. It
// keeps stepping after the god hand is put away (the water still runs, the mending still heals), and is dropped once it has healed.
// The looks are Calissa's (vfx/godhand/matterlook.js): the layers dressed by island, the Lachryma the house's liquid, tinted by its
// leading feeling; this file writes their attributes (the loose share and thickness a cell; the Lachryma's depth and tint code).
// What the ray did not find (a hole, a drop off the island) is void: matter poured there falls away.
//
// Prior art: From Dust's layered terrain mesh and its liquids drawn as a second skin; Rapier's height field (one collider, rebuilt a few
// times a real second, rather than a box a cell); marching squares' edge interpolation for where the skin ends (its alpha the thickness).
//
//   game.matter = new IslandMatter(game)   matter.ensure(at) -> field   matter.field   matter.update(dt)   matter.surfaceAt(x, z)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { RAPIER, GROUPS } from '../core/physics.js';
import { MatterField, FEELINGS } from './matter.js';
import { matterMaterial, matterAttrs, lachrymaSkin, liquidDepth } from '../vfx/godhand/matterlook.js';

/** `relay`: how far from the field's centre the hand may work before a new field is laid; `lookHz` and `colliderHz`: how often the
 *  meshes and the collider follow the simulation (a few times a real second is enough for ground that flows at walking pace);
 *  `sampleUp`/`sampleDown`: the ray's start above the jar and its reach (a roof higher than `sampleUp` is skipped, as the god hand's
 *  cutaway skips it). `edge`: metres of thickness over which the skin's alpha runs 0.5 to 1.5 (the cut at `show`); `step`: the most the
 *  authored ground may rise or fall between an empty cell and its neighbour with matter for the skin to feather onto it (more, a wall
 *  or a crate's side, and the empty cell's vertex stays under the ground, as before). */
export const FIELD = { relay: 22, lookHz: 12, colliderHz: 3, mendColliderEvery: 5, sampleUp: 6, sampleDown: 18, show: 0.02, hide: 0.12, edge: 0.04, step: 0.25 };


export class IslandMatter {
  constructor(game) {
    this.game = game; this.field = null; this.mesh = null; this.liquid = null; this.collider = null; this.body = null;
    this.lookT = 0; this.colT = 0; this.seenV = -1; this.seenW = -1; this.colV = -1; this.colM = -1; this.lastBb = null;
  }

  /** The field round a point, laid now if there is none near enough. */
  ensure(at) {
    const F = this.field;
    if (F && Math.hypot(at.x - F.cx, at.z - F.cz) < FIELD.relay) return F;
    this.drop();
    const g = this.game, f = new MatterField({ ox: at.x, oz: at.z });
    const top = at.y + FIELD.sampleUp, DOWN = { x: 0, y: -1, z: 0 };
    f.sampleBase((x, z) => {
      const hit = g.physics.raycast({ x, y: top, z }, DOWN, FIELD.sampleDown, g.player?.collider, undefined, (c) => !c.isSensor() && !c.parent()?.isDynamic() && c !== this.collider);
      return hit ? hit.point.y : NaN;
    });
    this.field = f;
    this.build();
    this.game.events?.emit('god.field', { x: at.x, z: at.z, by: 'courier' });
    return f;
  }

  drop() {
    if (!this.field) return;
    const g = this.game;
    if (this.body) g.physics.world.removeRigidBody(this.body);
    for (const m of [this.mesh, this.liquid]) if (m) { g.scene.remove(m); m.geometry.dispose(); if (!m.material.userData.shared) m.material.dispose(); }
    this.field = this.mesh = this.liquid = this.body = this.collider = null;
    this.seenV = this.seenW = this.colV = this.colM = -1; this.lastBb = null; this.wj0 = this.wj1 = undefined;
  }

  /** The grid's two skins: one vertex a cell centre, two triangles a cell. */
  build() {
    const F = this.field, n = F.n, N = n * n, g = this.game;
    const idx = new Uint32Array((n - 1) * (n - 1) * 6);
    let o = 0;
    for (let j = 0; j < n - 1; j++) for (let i = 0; i < n - 1; i++) { const a = j * n + i, b = a + 1, c = a + n, d = c + 1; idx[o++] = a; idx[o++] = c; idx[o++] = b; idx[o++] = b; idx[o++] = c; idx[o++] = d; }
    const skin = (mat, liquid) => {
      const geo = new THREE.BufferGeometry();
      const pos = new Float32Array(N * 3);
      for (let k = 0; k < N; k++) { pos[k * 3] = F.xOf(k); pos[k * 3 + 2] = F.zOf(k); pos[k * 3 + 1] = F.base[k] - 1; }
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      if (liquid) geo.setAttribute('aDepth', new THREE.BufferAttribute(new Float32Array(N).fill(liquidDepth(0, -1, 0, true)), 1));
      else { matterAttrs(geo, N); geo.attributes.color.array.fill(0); }
      geo.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(N * 3).fill(0).map((_, i) => (i % 3 === 1 ? 1 : 0)), 3));
      geo.setIndex(new THREE.BufferAttribute(idx, 1));
      geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(F.cx, F.base[(N / 2 + n / 2) | 0] || 0, F.cz), n * F.cell);
      geo.setDrawRange(0, 0);
      const m = new THREE.Mesh(geo, mat);
      m.frustumCulled = true;
      g.scene.add(m);
      return m;
    };
    this.mesh = skin(matterMaterial('ground'));
    this.mesh.receiveShadow = true; this.mesh.castShadow = true;
    this.liquid = skin(lachrymaSkin(g) || new THREE.MeshStandardMaterial({ color: 0x0a0812, roughness: 0.15, transparent: true, opacity: 0.9, depthWrite: false }), true);
    this.liquid.renderOrder = 2;
  }

  update(dt) {
    const F = this.field;
    if (!F) return;
    F.step(dt);
    this.lookT += dt; this.colT += dt;
    if (this.lookT >= 1 / FIELD.lookHz) { this.lookT = 0; this.redraw(); }
    // the collider follows the hand's acts at colliderHz, the mending's slow drift every few real seconds (a rebuild wakes every body
    // touching it: measured, rebuilding at 3 a real second cost the physics more than the whole simulation)
    const due = this.colV !== F.version ? 1 / FIELD.colliderHz : this.colM !== F.mendV ? FIELD.mendColliderEvery : Infinity;
    if (this.colT >= due) { this.colT = 0; this.rebuildCollider(); }
    // healed and dry, and the hand not out: the field is let go
    if (this.game.god?.active || F.bb || F.water > 1e-3) this.idleT = 0;
    else if ((this.idleT = (this.idleT || 0) + dt) > 5) this.drop();
  }

  /** The skins follow the field, only over the box that may hold matter (and the rows that hold Lachryma), with normals taken from
   *  the heights there (cheaper than three.js's walk over every triangle). */
  redraw() {
    const F = this.field, n = F.n, c = F.cell;
    const gv = F.version + F.mendV * 1e6;
    const b = F.bb || this.lastBb;
    if (b && gv !== this.seenV) {
      this.seenV = gv;
      const geo = this.mesh.geometry, P = geo.attributes.position.array, C = geo.attributes.color.array, NR = geo.attributes.normal.array, ML = geo.attributes.aMl.array;
      const lb = this.lastBb, i0 = Math.min(b[0], lb?.[0] ?? b[0]), i1 = Math.max(b[1], lb?.[1] ?? b[1]), j0 = Math.min(b[2], lb?.[2] ?? b[2]), j1 = Math.max(b[3], lb?.[3] ?? b[3]);
      const on = (k) => F.amount(k) > FIELD.show && !F.void[k];
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
        const k = j * n + i, a = F.amount(k), shown = on(k);
        // the edge (CASEBOOK NEW:matter-edge-iso): an empty cell beside matter on level ground lies on the authored ground, not under
        // it, and the alpha is the thickness itself (0.5 at FIELD.show, unclamped), so the cut runs where the thickness crosses it,
        // interpolated across each triangle (marching squares' edge interpolation, done by the rasterizer) instead of a staircase
        let edge = false;
        if (!shown && !F.void[k]) for (let dj = -1; dj <= 1 && !edge; dj++) for (let di = -1; di <= 1; di++) {
          const ii = i + di, jj = j + dj, q = jj * n + ii;
          if (ii >= 0 && jj >= 0 && ii < n && jj < n && on(q) && Math.abs(F.base[q] - F.base[k]) < FIELD.step) { edge = true; break; }
        }
        P[k * 3 + 1] = shown || edge ? F.base[k] + a : F.base[k] - FIELD.hide;
        C[k * 4 + 3] = F.void[k] ? 0 : 0.5 + (a - FIELD.show) / FIELD.edge;
        ML[k * 4] = a > 0 ? F.loose[k] / a : 0; ML[k * 4 + 1] = Math.min(1, a / 0.3); // (the loose share; the thickness, for the lip)
      }
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
        const k = j * n + i, hl = P[(i > 0 ? k - 1 : k) * 3 + 1], hr = P[(i < n - 1 ? k + 1 : k) * 3 + 1], ht = P[(j > 0 ? k - n : k) * 3 + 1], hb = P[(j < n - 1 ? k + n : k) * 3 + 1];
        const nx = hl - hr, nz = ht - hb, ny = 2 * c, l = Math.hypot(nx, ny, nz);
        NR[k * 3] = nx / l; NR[k * 3 + 1] = ny / l; NR[k * 3 + 2] = nz / l;
      }
      geo.attributes.position.needsUpdate = geo.attributes.color.needsUpdate = geo.attributes.normal.needsUpdate = geo.attributes.aMl.needsUpdate = true;
      this.lastBb = F.bb ? [...F.bb] : null;
      this.rows(geo, F.bb ? F.bb[2] : 0, F.bb ? F.bb[3] : -1); // (only the rows that hold matter are drawn)
    }
    if (F.wversion !== this.seenW) {
      this.seenW = F.wversion;
      const geo = this.liquid.geometry, P = geo.attributes.position.array, D = geo.attributes.aDepth.array, M = F.mix, NF = FEELINGS.length;
      const r0 = Math.min(F.j0, this.wj0 ?? F.j0), r1 = Math.max(F.j1, this.wj1 ?? F.j1);
      this.wj0 = F.j0; this.wj1 = F.j1;
      if (r1 >= r0) for (let k = Math.max(0, r0) * n, ke = (Math.min(n - 1, r1) + 1) * n; k < ke; k++) {
        const w = F.w[k], shown = w > FIELD.show && !F.void[k], ground = F.base[k] + F.amount(k);
        P[k * 3 + 1] = shown ? ground + w : ground - 0.05;
        let lead = -1, lv = 0; for (let f = 0; f < NF; f++) { const v = M[k * NF + f]; if (v > lv) { lv = v; lead = f; } } // (its leading feeling)
        D[k] = F.ice[k] > 0 ? liquidDepth(w, 7, 1, !shown) : liquidDepth(w, lead, lv, !shown);
      }
      geo.attributes.position.needsUpdate = geo.attributes.aDepth.needsUpdate = true;
      this.rows(geo, F.j0, F.j1);
    }
  }

  /** Draw only the triangles of rows j0..j1 (the index runs a row at a time). */
  rows(geo, j0, j1) {
    const per = (this.field.n - 1) * 6, a = Math.max(0, j0 - 1), b = Math.min(this.field.n - 2, j1);
    if (b < a) geo.setDrawRange(0, 0); else geo.setDrawRange(a * per, (b - a + 1) * per);
  }

  /** One height field over the box that may hold matter (a cell's margin round it): the matter's top where there is matter (or ice),
   *  and a hand's breadth under the authored ground where there is none, so the authored colliders stay the ones walked on. Rapier's
   *  samples are column-major (x major, z minor), its field centred on its body. */
  rebuildCollider() {
    const F = this.field, n = F.n, g = this.game, b = F.bb;
    this.colV = F.version; this.colM = F.mendV;
    if (this.body) { g.physics.world.removeRigidBody(this.body); this.body = this.collider = null; }
    if (!b) return;
    const ni = b[1] - b[0] + 1, nj = b[3] - b[2] + 1;
    if (ni < 2 || nj < 2) return;
    const H = new Float32Array(ni * nj);
    let any = false;
    for (let j = 0; j < nj; j++) for (let i = 0; i < ni; i++) {
      const k = (b[2] + j) * n + b[0] + i, a = F.amount(k), solid = (a > FIELD.show || F.ice[k] > 0) && !F.void[k];
      H[i * nj + j] = solid ? F.top(k) : F.void[k] ? F.base[k] : F.base[k] - FIELD.hide;
      if (solid) any = true;
    }
    if (!any) return;
    const cx = (F.xOf(b[2] * n + b[0]) + F.xOf(b[2] * n + b[1])) / 2, cz = (F.zOf(b[2] * n) + F.zOf(b[3] * n)) / 2;
    this.body = g.physics.world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(cx, 0, cz));
    this.collider = g.physics.world.createCollider(RAPIER.ColliderDesc.heightfield(nj - 1, ni - 1, H, { x: (ni - 1) * F.cell, y: 1, z: (nj - 1) * F.cell }).setFriction(0.9).setCollisionGroups(GROUPS.static), this.body);
  }

  /** The top of whatever the hand can work at a point: matter, else the authored ground (NaN off the field). */
  surfaceAt(x, z) { return this.field ? this.field.groundAt(x, z) : NaN; }
}
