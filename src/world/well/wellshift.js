// ---------------------------------------------------------------------------------------
// THE WELL'S SHIFTING: what moves on a floor of the Great Dunemaw once it is built (docs/plans/DUNEMAW.md, "The shifting"). For now the
// SANDFALLS: on a side passage (never the guaranteed path), a curtain of sand pours from the lintel on a cycle, open 30 sim seconds and
// falling 12 (3 sim seconds of warning first: a trickle), each out of phase with the others. While it falls it is a wall (a collider in
// the doorway). It never closes on the Courier: if they stand in the doorway when it should fall, it waits until they are clear.
// Everything here runs on the sim clock it is handed (dt summed: stops when the game pauses, the same in a replay), seeded per floor by
// the plan (welllayout.js). Drift tides and the turning hall come later (phase 2).
//
// Its look is Calissa's (the spout's falling shader, vfx/): this module draws only a plain sand-coloured sheet as a stand-in, and says
// each change on the bus, `well.sandfall { floor, i, state: 'open' | 'warn' | 'falling', by: 'environment' }`, and in `list[i].state`.
//
// Prior art: Journey's sandfalls (thatgamecompany, 2012), and every platformer's timed door (a cycle with a tell before it shuts).
//
//   const S = new Sandfalls(game, floor, [{ pos: Vector3, yaw, phase }], { body, group })   S.update(dt, courierPos)   S.list   S.dispose()
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { RAPIER, GROUPS } from '../../core/physics.js';

export const SANDFALL = { open: 30, falling: 12, warn: 3, width: 4, height: 4, depth: 0.6 };
const CYCLE = SANDFALL.open + SANDFALL.falling;

export class Sandfalls {
  constructor(game, floor, spots, { body, group }) {
    this.game = game; this.floor = floor; this.t = 0;
    const W = game.physics.world, { width, height, depth } = SANDFALL;
    this.list = spots.map((s, i) => {
      const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), s.yaw);
      const col = W.createCollider(RAPIER.ColliderDesc.cuboid(width / 2, height / 2, depth / 2)
        .setTranslation(s.pos.x, s.pos.y + height / 2, s.pos.z).setRotation(q).setCollisionGroups(GROUPS.static).setFriction(0.9), body);
      col.setEnabled(false);
      const sheet = new THREE.Mesh(new THREE.PlaneGeometry(width, height), new THREE.MeshBasicMaterial({ color: 0xd8b07a, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide, name: 'well-sandfall-standin' })); // (each its own opacity)
      sheet.position.set(s.pos.x, s.pos.y + height / 2, s.pos.z); sheet.quaternion.copy(q); sheet.name = `sandfall-${i}`; sheet.visible = false;
      group.add(sheet);
      return { i, pos: s.pos.clone(), yaw: s.yaw, phase: s.phase * CYCLE, col, sheet, state: 'open', k: 0, held: false };
    });
  }

  /** Is this point in the doorway a sandfall fills (its frame: along the wall and across it)? */
  inside(s, p) {
    const dx = p.x - s.pos.x, dz = p.z - s.pos.z, c = Math.cos(s.yaw), n = Math.sin(s.yaw);
    const along = dx * c - dz * n, across = dx * n + dz * c; // (the sheet's own x and z)
    return Math.abs(along) < SANDFALL.width / 2 + 0.5 && Math.abs(across) < 1.1 && p.y > s.pos.y - 1 && p.y < s.pos.y + SANDFALL.height;
  }

  update(dt, courier) {
    this.t += dt;
    for (const s of this.list) {
      const u = (this.t + s.phase) % CYCLE, inDoor = courier && this.inside(s, courier);
      let state = u < SANDFALL.open - SANDFALL.warn ? 'open' : u < SANDFALL.open ? 'warn' : 'falling';
      if (state === 'falling' && (inDoor || (s.state !== 'falling' && s.held))) { state = 'warn'; s.held = inDoor; } // (never on the Courier: it waits)
      else if (state !== 'falling') s.held = false;
      if (state !== s.state) {
        s.state = state; s.col.setEnabled(state === 'falling');
        this.game.events?.emit('well.sandfall', { floor: this.floor, i: s.i, state, by: 'environment' });
      }
      // the stand-in's look: a trickle in the warning, the sheet while it falls (Calissa's shader replaces it)
      const want = state === 'falling' ? 0.85 : state === 'warn' ? 0.18 : 0;
      s.k += (want - s.k) * Math.min(1, dt * 6);
      s.sheet.material.opacity = s.k; s.sheet.visible = s.k > 0.01;
    }
  }

  dispose() { for (const s of this.list) { s.sheet.geometry.dispose(); s.sheet.material.dispose(); } } // (the colliders go with the floor's body)
}
