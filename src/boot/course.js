// ---------------------------------------------------------------------------------------
// BOOT COURSE: the course and what is counted over it. The trial's runner, the basement's course with the Gate's hoops and the lap
// circuits, the map's named places (Mind Mapping), the Weir, the Treasury's plinths and two first chests; then the rules that say what
// happened (the Tracking rules) and the achievements over the counts.
//
// Prior art: the staged start of an engine (Unreal's FEngineLoop::PreInit then Init, Unity's Awake then Start): one function a stage, run
// in order by main.js, each handed `made`, what the stages before it made, and returning what the stages after it read.
//
//   bootCourse(game, made) -> { trial, course }
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { Trial } from '../world/trial.js';
import { Course } from '../world/basement/course.js';
import { Circuits } from '../world/basement/circuits.js';
import { Tracking } from '../feedback/tracking.js';
import { Achievements } from '../progress/achievements.js';
import { Weir } from '../tools/sondelass/angling/weir.js';
import { stockTreasury } from '../world/treasury.js';
import { GateRing } from '../vfx/gatering.js';

export function bootCourse(game, made) {
  const { mark, treasuryAt, clappers, input, cursorFree } = made;
  const trial = new Trial(game);
  game.trial = trial;
  mark('misc');
  const course = new Course(game);
  mark('course');
  game.course = course;
  game.gateRing = new GateRing(game); // (the Index's hoops and the gate-out under the seam: vfx/gatering.js)
  game.circuits = new Circuits(game); // (timed laps through the gymnasium's pieces)
  course.menu.onClose = () => { if (input.enabled && !cursorFree()) input.requestLock(); };
  // Mind Mapping: the map and compass, and the named places in them
  const carto = game.cartography;
  carto.onClose = () => { if (input.enabled && !cursorFree()) input.requestLock(); };
  {
    const v = (a) => new THREE.Vector3(...a);
    carto.addAnchor('WORKSHOP', 'workshop', v([0, 0, 0]), 'ground');
    carto.addAnchor('GALLERY', 'gallery', v([0, clappers.floors[1]?.y ?? 4.6, 0]), 'upper');
    carto.addAnchor('THE HUB', 'hub', course.hubSpawn.v);
    for (const r of course.rooms) {
      const at = r.spawn === 'lab' ? course.labSpawn.v : r.spawn === 'mill' ? course.millSpawn.v : r.spawn === 'dunes' ? game.dunes.spawnPoint() : r.spawn === 'shore' ? game.dunes.beach?.landing().pos : r.spawn === 'siege' ? course.siegeSpawn.v : r.spawn === 'weir' ? course.weirSpawn.v : course.cps[r.cp]?.v;
      if (at) carto.addAnchor(r.name, r.id, at);
    }
    carto.addAnchor('THE SPIRE', 'spire', game.dunes.spire.clone().setY(game.dunes.heightAt(game.dunes.spire.x, game.dunes.spire.z) + 1));
    carto.restoreAnchors();
  }
  // what is counted and what is said about it, then the achievements over the counts
  mark('circuits+carto');
  game.weir = new Weir(game); // (the Sondelass's own room: the tide and the shoals)
  stockTreasury(game, treasuryAt); // (a chest of each tier on the Treasury's plinths, and the Tithe's console: in Raku's bazaar since 2026-10-15)
  {
    // a common chest in the hub, off to one side of where you arrive, on whatever floor is there; a rare one on a dune, half in the sand
    // (the hub's floor is flat; a ray here would see nothing yet, the physics world has not stepped)
    const hub = course.hubSpawn.v;
    game.chests.spawn(0, new THREE.Vector3(hub.x + 5, hub.y, hub.z + 3), { yaw: Math.atan2(-5, -3), id: 'hub.1' });
    const dn = game.dunes.spawnPoint();
    const cx = dn.x + 66, cz = dn.z - 40; // (out past the oasis, on the first of the dunes)
    game.chests.spawn(2, new THREE.Vector3(cx, game.dunes.heightAt(cx, cz) - 0.12, cz), { yaw: Math.atan2(dn.x - cx, dn.z - cz), id: 'dunes.1' });
  }
  game.tracking = new Tracking(game);
  game.achievements = new Achievements(game);
  mark('weir+treasure+ach');
  return { trial, course };
}
