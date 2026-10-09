// ---------------------------------------------------------------------------------------
// THE GREAT CAVERN: the Great Dunemaw's last place, under its third floor: the bowl (world/well/bowl.js) with its nursery (eight
// clutches in the rim shallows, two guards a quadrant: world/well/nursery.js) and the crowned FOE brooding in W0
// (creatures/jelly/greatjelly.js). It stands in for a floor in the Well's run (world/well/dunemaw.js holds it as `cur`: it has the
// floor's `arrive`, `up`, `cellAt`, `update` and `dispose`), and it has no way down. The way up is not there until the fight ends: the
// pale pool forms in W0 when the FOE bursts, in W2 when it is reprogrammed (it lies in W0 for good: the nursery is the Courier's).
// Arriving, the camera sweeps the bowl from over its far side back to the ledge (the flythrough: cine/flythrough.js), the reveal of
// DUNEMAW-ARENA.md: the FOE seen before it is faced.
//
// Prior art: Etrian Odyssey's FOEs (seen before you choose to face them), Dark Souls' boss rooms (an entrance that commits, a way out
// only after), Persona 3's Tartarus (the access point back up only past the guardian).
//
// The fight is a raid (world/well/raid.js): a wipe lays the cavern again (dunemaw.js wipe), the run's broken clutches (`run.broken`) kept.
//
//   const C = new Cavern(game, { run, onEnd(how, by) })   (the floor's contract, plus) C.foe   C.nursery   C.bowl   C.raid   C.isCavern
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { Bowl, BOWL_AT } from './bowl.js';
import { Nursery } from './nursery.js';
import { GreatJelly } from '../../creatures/jelly/greatjelly.js';
import { Raid } from './raid.js';
import { NURSERY, ARENA } from '../../progress/combat/dunemaw.js';

export class Cavern {
  constructor(game, { run, onEnd = null }) {
    this.game = game; this.run = run; this.onEnd = onEnd;
    this.bowl = new Bowl(game); game.bowl = this.bowl;
    this.group = this.bowl.group; this.floor = 3; this.isCavern = true;
    this.arrive = this.bowl.arrive; this.up = null; this.down = null; this.cells = []; this.path = [];
    // the guards: two a quadrant, between the clutches they keep (their leash: nursery.js)
    // (laid again after a wipe: the clutches broken in this run stay broken, and their guards are not set again: raid.js)
    const J = game.jellies, spots = this.bowl.clutchSpots, broken = run ? (run.broken ||= new Set()) : new Set();
    this.guards = J ? spots.filter((p, i) => !broken.has(i)).map((p) => J.spawn(p.clone().lerp(BOWL_AT.clone().setY(p.y), 2.2 / ARENA.clutches.r).setY(p.y + 0.05), { once: true })) : [];
    this.nursery = new Nursery(game, { floor: 3, spots: spots.slice(0, NURSERY.clutches[2]), skip: broken, guards: this.guards, haul: run?.haul });
    this.foe = J ? new GreatJelly(game, { bowl: this.bowl, nursery: this.nursery, at: this.bowl.pools[0].pos.clone().setY(this.bowl.pools[0].pos.y + 0.05) }) : null;
    this.raid = this.foe ? new Raid(game, { cavern: this }) : null; // (the fight as an extreme trial: its timeline, its casts, the wipe)
    this.ended = false;
  }

  /** In the bowl or its tunnel (the Well's safety net asks: off the plan for a second, back to the arrival). */
  cellAt(x, z) {
    const dx = x - BOWL_AT.x, dz = z - BOWL_AT.z;
    return Math.hypot(dx, dz) < ARENA.radius + 1 || (Math.abs(dx) < ARENA.ledge.width / 2 + 2 && dz > ARENA.ledge.z[0] - 6 && dz < ARENA.ledge.z[1] + 13) ? this : null; // (the tunnel behind the ledge)
  }
  ground(x, z) { return this.bowl.floorY(x - BOWL_AT.x, z - BOWL_AT.z); }

  /** The reveal: from high over the bowl's far side, over the FOE in W0, back to over the Courier's shoulder on the ledge. */
  reveal() {
    const g = this.game, P = g.player.pos, W = (x, y, z) => new THREE.Vector3(BOWL_AT.x + x, BOWL_AT.y + y, BOWL_AT.z + z);
    const K = ARENA.scale ?? 1; g.flythrough?.play([W(0, 20 * K, -24 * K), W(10 * K, 14 * K, -6 * K), W(4 * K, 9 * K, 10 * K), P.clone().add(new THREE.Vector3(1.6, 3, 3.4)), P.clone().add(new THREE.Vector3(0.4, 1.7, 3))],
      { look: W(0, 1 * K, 0) });
  }

  /** The pale pool, the way up, where the fight ended (as a floor's way up: wellkit.js's pool). */
  wayUp(poolIndex) {
    const w = this.bowl.pools[poolIndex], at = w.pos.clone();
    w.mouth.group.visible = false;
    const m = new THREE.Mesh(new THREE.CircleGeometry(1.4, 28), new THREE.MeshBasicMaterial({ color: 0xffe2b8, transparent: true, opacity: 0.8 }));
    m.rotation.x = -Math.PI / 2; m.position.set(at.x, at.y + 0.05, at.z); m.name = 'pool-up';
    const rim = new THREE.Mesh(new THREE.RingGeometry(1.4, 1.75, 28), new THREE.MeshBasicMaterial({ color: 0xffb27a, transparent: true, opacity: 0.7 }));
    rim.rotation.x = -Math.PI / 2; rim.position.set(at.x, at.y + 0.04, at.z); rim.name = 'rim-up';
    this.game.scene.add(m, rim); this.upMeshes = [m, rim];
    this.up = { pos: at, mesh: m, rim };
    // (the pools are slip no longer: the Courier walks to the pale one)
    this.bowl.pools.splice(poolIndex, 1, { ...w, r: 0 });
  }

  update(dt) {
    const F = this.foe;
    this.bowl.update(dt);
    this.nursery.update(dt);
    F?.update(dt);
    this.raid?.update(dt);
    if (F?.ended && !this.ended) {
      this.ended = true;
      this.wayUp(F.ended === 'reprogram' ? 2 : 0);
      this.onEnd?.(F.ended, F.by);
    }
    if (this.up) this.up.rim.material.opacity = 0.6 + 0.15 * Math.sin(this.bowl.t * 1.3);
  }

  dispose() {
    const g = this.game;
    this.raid?.dispose();
    this.foe?.dispose();
    for (const c of this.guards) g.jellies?.dispose(c);
    this.nursery.dispose();
    for (const m of this.upMeshes || []) { g.scene.remove(m); m.geometry.dispose(); m.material.dispose(); }
    this.bowl.dispose();
    if (g.bowl === this.bowl) g.bowl = null;
  }
}
