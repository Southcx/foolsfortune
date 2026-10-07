// ---------------------------------------------------------------------------------------
// MARGARITE'S DOCK: where the Anagami run makes port (docs/plans/RAIL.md section 11, R4; docs/plans/SLICE.md, E4b; the island is Law:
// the King's, its lamp burning crude to keep the deep things back). The dock is a place of its own (render/zonemap.js 'margarite'),
// out on the crude at the dunes' layer, so its sky, sun and fog are the open sea's (world/dunes/dunes.js), and the crossing's own crude
// sea lies round it (world/emocean/stage.js shows it while the Courier is here). On it:
//
//   THE QUAY      a stone landing over the crude, its edges railed by the air (the crude is not swum), and the lamp's tower
//   THE PIER      a plank walk out to sea: F at its end is the pier's page (world/emocean/pier.js), the crossing home or onward
//   THE PEARL SHRINE  (world/shrines.js 'margarite') on the quay: found, rested at, travelled to, and where a broken crossing makes
//                 you whole if it is the last you rested at
//   THE PURSER    the King's buyer, at the counter; the posted board beside is the price (Margarite does not haggle): F at the board
//                 opens the Purser's counter (progress/shop/shops.js 'purser')
//   LETTY MARQUE  and her bounty board (the folk: npc/people.js; the board: Calissa's vfx/margarite.js)
// Built with the level's static geometry (merged per zone: world/level.js), before the level is finalised.
//
// Prior art: Wind Waker's island docks (a pier, a lamp, a shop on the quay: a port you read at a glance), Sunless Sea's London and its
// ports (the lamp against the dark zee), Skies of Arcadia's port towns, the harbour of a Law island as a ledger made of stone.
//
//   game.margarite = new Margarite(game)   .here (the Courier is on it)   .spot(id) -> { pos, yaw }   .pier -> { end, top, yaw }
//   .update(dt)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import { GROUPS } from '../../core/physics.js';
import { zoneOf } from '../../render/zonemap.js';
import { buildBountyBoard } from '../../vfx/margarite.js';

/** The quay's middle, at the crude's level (the crossing's sea is laid at the same height: stage.js SEA_AT). */
export const MARGARITE = { x: -4500, y: -420, z: 0, deck: 1.6, quay: [28, 18], pier: { len: 32, w: 3.2 } };
const C = { stone: 0xb9b2a4, kerb: 0x8f887a, plank: 0x8a6a48, post: 0x5e4632, lamp: 0xd8d0bc, glass: 0xffd87a };

export class Margarite {
  constructor(game) {
    this.game = game;
    const M = MARGARITE, L = game.level, W = game.physics.world, body = W.createRigidBody(RAPIER.RigidBodyDesc.fixed());
    const top = M.y + M.deck, [qx, qz] = M.quay, x0 = M.x - qx / 2, x1 = M.x + qx / 2;
    this.top = top;
    // the quay: a slab of stone, a kerb round it, steps of nothing (the crude is not for swimming)
    L.box([M.x, top - 1.5, M.z], [qx, 3, qz], C.stone);
    for (const s of [-1, 1]) L.box([M.x, top + 0.2, M.z + s * (qz / 2 - 0.3)], [qx, 0.4, 0.6], C.kerb, { collide: false });
    L.box([x0 + 0.3, top + 0.2, M.z], [0.6, 0.4, qz], C.kerb, { collide: false });
    // the pier: out to sea from the quay's east side, where the ship comes in
    const pl = M.pier.len, pw = M.pier.w, px1 = x1 + pl;
    L.box([x1 + pl / 2, top - 0.15, M.z], [pl, 0.3, pw], C.plank);
    for (let x = x1 + 3; x < px1; x += 5) for (const s of [-1, 1]) L.box([x, top - 2.2, M.z + s * (pw / 2 - 0.2)], [0.35, 4.2, 0.35], C.post, { collide: false });
    // the air for rails: round the quay (but its pier gap) and along the pier
    const rail = (x, z, hx, hz) => W.createCollider(RAPIER.ColliderDesc.cuboid(hx, 2, hz).setTranslation(x, top + 1.5, z).setCollisionGroups(GROUPS.static).setFriction(0), body);
    for (const s of [-1, 1]) rail(M.x, M.z + s * (qz / 2 + 0.25), qx / 2, 0.25);
    rail(x0 - 0.25, M.z, 0.25, qz / 2);
    for (const s of [-1, 1]) rail(x1 + 0.25, M.z + s * ((qz / 2 + pw / 2) / 2 + 0.1), 0.25, (qz / 2 - pw / 2) / 2);
    for (const s of [-1, 1]) rail(x1 + pl / 2, M.z + s * (pw / 2 + 0.25), pl / 2, 0.25);
    rail(px1 + 0.25, M.z, 0.25, pw / 2 + 0.5);
    // the lamp: a tower at the quay's seaward corner, its crude flame a lamp of the light budget (render/lightbudget.js)
    const lx = x1 - 2.5, lz = M.z - qz / 2 + 2.5;
    L.box([lx, top + 4, lz], [2.2, 8, 2.2], C.lamp);
    L.box([lx, top + 8.4, lz], [2.8, 0.4, 2.8], C.kerb);
    this.flame = new THREE.Mesh(new THREE.OctahedronGeometry(0.7, 0), new THREE.MeshBasicMaterial({ color: C.glass }));
    this.flame.position.set(lx, top + 9.4, lz); game.scene.add(this.flame);
    this.light = new THREE.PointLight(0xffc670, 30, 40, 1.4); this.light.position.copy(this.flame.position); game.scene.add(this.light);
    // the Purser's counter and the posted board; the bounty board
    L.box([M.x - 6, top + 0.55, M.z + 4], [3.6, 1.1, 1.0], C.plank);
    L.box([M.x - 11.6, top + 1.4, M.z + 4.4], [0.2, 2.8, 2.2], C.post); // (the posted board: far enough from the Purser that F at it is the board's)
    this.board = new THREE.Vector3(M.x - 11.4, top, M.z + 4.4);
    try { const b = buildBountyBoard(); b.group.position.set(M.x + 4, top, M.z - 6); b.group.rotation.y = 0; game.scene.add(b.group); this.bounty = b; } catch (e) { console.warn('bounty board', e); }
    this.pierEnd = new THREE.Vector3(px1 - 2, top, M.z);
  }

  /** F at the posted board opens the Purser's counter (the price is the board). Wired on the first frame: the dock is built with the
   *  level, before the interact chevron exists. */
  wire() {
    const g = this.game; if (this.wired || !g.interact) return; this.wired = true;
    g.interact.add('purser', () => {
      if (g.dialogue?.open || g.shops?.cur || g.god?.controlling || !this.here) return null;
      const P = g.player, d = Math.hypot(this.board.x - P.pos.x, this.board.z - P.pos.z);
      return d < 2.4 ? { pos: this.board.clone().setY(this.top + 3.1), d, ref: 'board' } : null;
    });
  }

  /** Is the Courier on the dock (its zone)? */
  get here() { return zoneOf(this.game.player.pos) === 'margarite'; }

  /** Where things stand: the Pearl Shrine, the Purser, Letty, the landing. */
  spot(id) {
    const M = MARGARITE, t = this.top;
    const S = {
      shrine: { pos: new THREE.Vector3(M.x + 2, t, M.z + 5.5), yaw: Math.PI },
      purser: { pos: new THREE.Vector3(M.x - 6, t, M.z + 5.2), yaw: Math.PI },
      letty: { pos: new THREE.Vector3(M.x + 5, t, M.z - 4.6), yaw: 0 },
      landing: { pos: new THREE.Vector3(M.x + M.quay[0] / 2 + 2, t + 0.05, M.z), yaw: -Math.PI / 2 },
    };
    return S[id] || null;
  }
  /** The pier's end (the pier's page: world/emocean/pier.js). */
  get pier() { return { end: this.pierEnd, top: this.top, yaw: -Math.PI / 2 }; }

  update(dt) {
    this.wire();
    const t = (this.t = (this.t || 0) + dt);
    this.flame.rotation.y = t * 0.6;
    this.light.intensity = 26 + Math.sin(t * 3.1) * 3 + Math.sin(t * 7.3) * 1.5; // (a crude flame: it breathes)
    const P = this.game.player, it = this.game.interact?.cur;
    if (it?.id === 'purser' && P.peekLatch?.('KeyF')) { P.latch('KeyF'); this.game.shops?.open('purser'); }
  }
}
