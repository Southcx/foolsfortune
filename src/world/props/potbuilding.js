// ---------------------------------------------------------------------------------------
// POT BUILDING: a pot built into the world, and re-formed in it. `spawn(def)` makes the lathe mesh of pottery.js (a profile by segments,
// lobes, twist and flame crests) in its clay body with its colour in the vertices, the decorations that break off as chunks (sculpture
// arms and the like), an ember urn's glyph bands and a lantern's core and halo; then the body with a convex-hull collider, gold seams
// if it is a rebuilt one, and a rope if it hangs (potropes.js). `reshape(ent, ...)` re-forms an intact pot in place: a new scale, a
// twist about its axis, scalloped lobes (the god arts Swell and Wring), its mesh and collider rebuilt under the same body.
//
// Laid onto Breakables (world/props/breakables.js) as methods of the class (`this` is the Breakables), the way tools/stringrun.js is
// laid onto the Moveset; split out of breakables.js to keep it under the module contract's 800 lines.
//
//   POT_BUILDING: spawn(def) -> ent   reshape(ent, { scale, twist, lobe }) -> bool
//   def: { kind, pos:[x,y,z], scale, color, hp, mat, ember, lantern, target, facing:[x,y,z], hang:{anchor:[x,y,z]}, respawn }
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { RAPIER, GROUPS } from '../../core/physics.js';
import { T, PALETTE } from '../../core/config.js';
import { addOutline, ensureSmoothNormals } from '../../render/outline.js';
import { PROFILES, prepProfile, buildPotGeometry, hullPoints, DECOR } from './pottery.js';
import { randomPaths, setCracks } from './potcracks.js';
import { wareGlossy } from '../../vfx/roomglazes.js';
import { stream } from '../../core/rng.js';
import { potMat, glazeMat } from './potmaterials.js';
import { FRAGILE } from './potdamage.js';
const simRand = stream('world/props/breakables'); // (the simulation's chance: core/rng.js, the same twice; the breakables' one stream, drawn from by every part)

const glyphMat = new THREE.MeshBasicMaterial({ color: PALETTE.glow });
const coreMat = new THREE.MeshBasicMaterial({ color: PALETTE.hot });
let haloTex = null;
function halo() {
  if (!haloTex) {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const g = c.getContext('2d');
    const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grd.addColorStop(0, 'rgba(255,220,180,0.9)');
    grd.addColorStop(0.3, 'rgba(255,170,110,0.35)');
    grd.addColorStop(1, 'rgba(255,140,80,0)');
    g.fillStyle = grd;
    g.fillRect(0, 0, 64, 64);
    haloTex = new THREE.CanvasTexture(c);
  }
  return new THREE.SpriteMaterial({ map: haloTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true });
}

const UP = new THREE.Vector3(0, 1, 0);

export const POT_BUILDING = {
  /**
   * def: { kind, pos:[x,y,z], scale, color, hp, mat, ember, lantern, target, facing:[x,y,z],
   *        hang:{anchor:[x,y,z]}, respawn }
   */
  spawn(def) {
    const kind = def.ember ? 'ember' : def.kind;
    const scale = def.scale ?? 1;
    const P = prepProfile(kind, scale, { mat: def.mat });
    const color = def.color ?? (def.ember ? PALETTE.dark : P.mat === 'porcelain' ? PALETTE.cream : PALETTE.pot);
    const mesh = new THREE.Mesh(buildPotGeometry(P, color), P.mat === 'porcelain' || wareGlossy(color) ? glazeMat : potMat); // (a glossy room glaze on any body: vfx/roomglazes.js)
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    addOutline(mesh);
    if (def.ember) {
      for (const [y, s] of [[0.42, 1], [0.62, 0.93]]) {
        const band = new THREE.Mesh(new THREE.TorusGeometry(P.rMax * 1.01, P.rMax * 0.07, 3, P.segs), glyphMat);
        band.rotation.x = Math.PI / 2;
        band.position.y = P.height * y;
        band.scale.setScalar(s);
        mesh.add(band);
      }
    }
    let extras = null;
    if (DECOR[kind]) {
      extras = DECOR[kind](P, color, def.variant || 0);
      for (const x of extras) { x.castShadow = true; addOutline(x); mesh.add(x); }
    }
    if (def.lantern) {
      const core = new THREE.Mesh(new THREE.IcosahedronGeometry(P.rMax * 0.45, 0), coreMat);
      core.position.y = P.height * 0.45;
      const h = new THREE.Sprite(halo());
      h.scale.setScalar(P.height * 3.2);
      h.position.y = P.height * 0.5;
      h.renderOrder = 3;
      mesh.add(core, h);
    }
    this.scene.add(mesh);

    const rot = new THREE.Quaternion();
    if (def.facing) rot.setFromUnitVectors(UP, new THREE.Vector3(...def.facing).normalize());
    else if (def.yaw !== undefined) rot.setFromAxisAngle(UP, def.yaw);
    else if (!def.hang) rot.setFromAxisAngle(UP, simRand() * Math.PI * 2);

    const fixed = !!def.target;
    const bd = (fixed ? RAPIER.RigidBodyDesc.fixed() : RAPIER.RigidBodyDesc.dynamic())
      .setTranslation(def.pos[0], def.pos[1], def.pos[2])
      .setRotation(rot)
      .setCanSleep(true);
    if (!fixed && !def.hang) bd.setSleeping(true);
    if (!fixed) bd.setAngularDamping(0.4).setLinearDamping(0.05);
    const body = this.physics.world.createRigidBody(bd);
    const cd = (RAPIER.ColliderDesc.convexHull(hullPoints(P)) || RAPIER.ColliderDesc.cylinder(P.height / 2, P.rMax))
      .setDensity(P.M.density)
      .setFriction(0.8)
      .setRestitution(0.1)
      .setCollisionGroups(GROUPS.prop)
      .setActiveEvents(RAPIER.ActiveEvents.CONTACT_FORCE_EVENTS);
    const col = this.physics.world.createCollider(cd, body);
    col.setContactForceEventThreshold(body.mass() * 45);
    // (Rapier wakes a body at the next step when a collider is attached to it: a pot set down at rest is put back to sleep after that
    //  step (preStep, in breakables.js), so it is parked in its prop batch at once instead of every pot in the room simulating for two seconds: R40)
    const settle = !fixed && !def.hang && !def.popIn;

    const size = Math.max(P.fullHeight, P.rMax * 2);
    const gold = def.gold || 0;
    const hp = (def.hp ?? PROFILES[kind].hp ?? 100) * (gold ? T.clappers.kintsugiHp : 1);
    const ent = {
      type: 'breakable', def, kind, P, mesh, body, col, alive: true,
      hp, maxHp: hp, crackStage: 0, gold,
      size, color: new THREE.Color(color), extras,
      prevVel: new THREE.Vector3(), sleepAfter: settle,
    };
    // rebuilt by a clapperjar: gold seams where it broke
    if (gold) setCracks(ent, { gold: randomPaths(P, 3 + gold * 2, size * 0.55) });
    this.physics.register(col, ent);
    ent.sync = this.physics.addSynced(body, mesh);
    mesh.position.set(...def.pos);
    mesh.quaternion.copy(rot);

    if (def.hang) this.buildRope(ent, def.hang.anchor, P.fullHeight * 0.95);
    if (def.popIn) { mesh.scale.setScalar(0.01); ent.popIn = 0; }
    this.items.add(ent);
    return ent;
  },

  /**
   * Re-form an intact pot: a new scale (of its own original), a twist about its axis, scalloped
   * lobes (the god arts Swell and Wring). Rebuilds the mesh and its collider in place; the body,
   * its motion and its identity stay. Returns false if it can't be (not a pot, or gone).
   */
  reshape(ent, { scale = 1, twist = 0, lobe = 0 } = {}) {
    if (ent?.type !== 'breakable' || !ent.alive || ent.def.hang || ent.def.target) return false;
    const base = ent.shape || (ent.shape = { scale: ent.def.scale ?? 1, twist: PROFILES[ent.kind].twist || 0, lobes: PROFILES[ent.kind].lobes || null, hp: ent.maxHp });
    const P = prepProfile(ent.kind, base.scale * scale, { mat: ent.def.mat });
    P.twist = base.twist + twist;
    if (lobe > 0.01) { P.lobes = { n: 5, amp: lobe, from: 0.12, to: 0.92 }; P.rMax *= 1 + lobe; }
    else P.lobes = base.lobes;
    // the look
    const old = ent.mesh.geometry;
    ent.mesh.geometry = buildPotGeometry(P, ent.color);
    ensureSmoothNormals(ent.mesh.geometry);
    if (ent.mesh.userData.outline) ent.mesh.userData.outline.geometry = ent.mesh.geometry;
    old.dispose();
    if (ent.cracks) { for (const k of ['darkMesh', 'goldMesh']) if (ent.cracks[k]) { ent.mesh.remove(ent.cracks[k]); ent.cracks[k].geometry.dispose(); ent.cracks[k] = null; } ent.cracks.dark = []; ent.cracks.gold = []; }
    if (ent.extras) {
      for (const x of ent.extras) ent.mesh.remove(x);
      ent.extras = DECOR[ent.kind] ? DECOR[ent.kind](P, ent.color, ent.def.variant || 0) : null;
      for (const x of ent.extras || []) { x.castShadow = true; addOutline(x); ent.mesh.add(x); }
    }
    // the body: a new hull under the same body (the mass follows the volume)
    this.physics.byCollider.delete(ent.col.handle);
    this.physics.world.removeCollider(ent.col, false);
    const cd = (RAPIER.ColliderDesc.convexHull(hullPoints(P)) || RAPIER.ColliderDesc.cylinder(P.height / 2, P.rMax))
      .setDensity(P.M.density).setFriction(0.8).setRestitution(0.1).setCollisionGroups(GROUPS.prop).setActiveEvents(RAPIER.ActiveEvents.CONTACT_FORCE_EVENTS);
    ent.col = this.physics.world.createCollider(cd, ent.body);
    ent.col.setContactForceEventThreshold(ent.body.mass() * 45 * FRAGILE[0]);
    this.physics.register(ent.col, ent);
    ent.P = P;
    ent.size = Math.max(P.fullHeight, P.rMax * 2);
    const k = ent.hp / ent.maxHp;
    ent.maxHp = base.hp * Math.pow(scale, 1.5);
    ent.hp = ent.maxHp * Math.max(0.5, k);
    ent.crackStage = 0;
    ent.body.wakeUp();
    return true;
  },
};
