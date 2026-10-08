// ---------------------------------------------------------------------------------------
// THE CROSSING'S STAGES ON THE WORKBENCH (the group 'the crossing' on the MODELS tab): the looks the rail's runtime does not drive yet,
// shown by the game's own modules on a loop, so they can be judged before the forms and the legs exist (docs/plans/RAIL-OVERHAUL.md
// sections 4 and 5).
//
//   crossing:surface   the sloop (the flying submarine, the owner's keeper) cruising, DIVING through the meniscus into the Umbral,
//                      running below, BREACHING back into the storm's light, on a 15 real-second loop; the camera rides behind it and
//                      passes through the surface a beat after it (the lens's line, the splash ring, the colour turning); above: the
//                      False Light at anchor and two labradorite monoliths standing out of the crude (their feet and the brig's keel
//                      seen from below); below: Old Nobody gliding through the column. The storm at 0.5.
//   crossing:storm     the same sea and things, the sloop cruising, the storm's strength swelling 0 -> 1 -> 0 over 16 real seconds
//
// A stage here drives its own camera (`userData.shot`: behind the ship, or ahead of it with `userData.view = 'front'`) until it is dragged, keeps its own scene's fog and sky (`userData.placed`,
// `userData.bare`: the workbench leaves it where it stands and steps its floor out), and puts everything back on `userData.dispose`.
// Prior art: the workbench's other stages (workbench/stages.js), a flight sim's attract-mode chase camera.
//
//   crossingStage(id, game) -> Object3D | null
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { CrudeSea } from '../vfx/crudesea.js';
import { Sloop } from '../vfx/sloop.js';
import { BrigLook } from '../vfx/brig.js';
import { LeviathanLook } from '../vfx/leviathan.js';
import { Umbral } from '../vfx/umbral.js';
import { warpMaterial, warpObject } from '../vfx/stormwarp.js';
import { mindLineMaterial, mindTick } from '../vfx/labradorite.js';
import { COLOR } from '../progress/weather.js';

const LOOP = 15, SPEED = 8, CRUISE = 3, DEEP = -5.5, HALF_BAR = 0.75; // (real seconds; m/s; metres; the crossing takes half a bar)
const ease = (k) => k * k * (3 - 2 * k);

/** The sloop's height on the loop: cruising, the dive (a half-bar), running below, the breach (a half-bar), cruising again. */
function heightAt(k, dives) {
  if (!dives) return CRUISE + 0.3 * Math.sin(k * 1.3);
  const d0 = 4, b0 = 9.5;
  if (k < d0) return CRUISE + 0.3 * Math.sin(k * 1.3);
  if (k < d0 + HALF_BAR) return CRUISE + (DEEP - CRUISE) * ease((k - d0) / HALF_BAR);
  if (k < b0) return DEEP + 0.6 * Math.sin((k - d0) * 1.1);
  if (k < b0 + HALF_BAR) return DEEP + 0.6 * Math.sin((b0 - d0) * 1.1) * (1 - ease((k - b0) / HALF_BAR)) + (CRUISE - DEEP) * ease((k - b0) / HALF_BAR);
  return CRUISE + 0.3 * Math.sin(k * 1.3);
}

export function crossingStage(id, game) {
  if (id !== 'crossing:surface' && id !== 'crossing:storm') return null;
  const wb = game.workbench, S = wb?.scene; if (!S) return null;
  const dives = id === 'crossing:surface', env = game.sky?.env || null;
  const root = new THREE.Group(); root.userData.placed = true; root.userData.bare = true;
  // the sky (the game's own dome, so it bends with the storm as the game's does) and the storm's light
  const dome = new THREE.Mesh(new THREE.SphereGeometry(330, 32, 16), game.sky.domeMaterial(new THREE.Vector3(-0.55, 0.3, -0.78)));
  dome.frustumCulled = false; dome.renderOrder = -10; root.add(dome);
  const sea = new CrudeSea({ env, size: 300, cells: 120, y: 0 }); root.add(sea.mesh);
  // the ship: the sloop at half its sea size, its glow the feeling's
  const ship = new Sloop({ env }); ship.group.scale.setScalar(0.45); ship.polarity(COLOR.wonder); root.add(ship.group);
  // above: the False Light at anchor (its keel under the crude), two monoliths of labradorite standing out of it, wired in the Mind's line
  const brig = new BrigLook({ env }); brig.group.scale.setScalar(0.6); brig.group.position.set(15, 0, 34); brig.group.rotation.y = 0.25; root.add(brig.group); warpObject(brig.group);
  const stone = warpMaterial(new THREE.MeshStandardMaterial({ color: 0x0d0b13, roughness: 0.3, metalness: 0.5, envMap: env, envMapIntensity: 0.6 }));
  const wire = warpMaterial(mindLineMaterial({ opacity: 0.9, depthTest: true, bright: 1.2 }));
  for (const [x, z, h, yaw] of [[-9, 12, 16, 0.4], [-14, 58, 22, -0.3], [11, 76, 13, 0.9]]) {
    const g = new THREE.BoxGeometry(2.6, h, 2.6), m = new THREE.Mesh(g, stone); m.position.set(x, h * 0.5 - h * 0.42, z); m.rotation.y = yaw; root.add(m);
    const e = new THREE.LineSegments(new THREE.EdgesGeometry(g), wire); m.add(e);
  }
  // below: Old Nobody, far down, gliding across the column
  const nobody = new LeviathanLook({ env }); nobody.group.scale.setScalar(0.5); root.add(nobody.group); warpObject(nobody.group);
  const U = new Umbral(game, { scene: S, vfx: wb.vfx, sea, hide: [dome], anywhere: true });
  U.above(brig.group, { r: 2.6, len: 5 });
  // the stage's own air: the storm's haze over the sea, the dark kept for the deep
  const was = { fog: S.fog, bg: S.background };
  S.fog = new THREE.FogExp2(new THREE.Color(0xcbb9a6), 0.004); S.background = new THREE.Color(0x2a2230);
  const W = game.stormWarp; W?.set({ storm: dives ? 0.5 : 0, weather: 0, mind: 0, anywhere: true }); if (W) W.k = dives ? 0.5 : 0;
  const cam = { y: CRUISE + 1.8 }, at = new THREE.Vector3(), look = new THREE.Vector3();
  let pt = 0, side = 1;
  root.userData.tick = (t) => {
    const dt = Math.min(0.1, Math.max(0, t - pt)); pt = t;
    const k = t % LOOP, z = -40 + SPEED * k, y = heightAt(k, dives), x = 1.2 * Math.sin(k * 0.6);
    const dy = (heightAt(k + 0.05, dives) - y) / 0.05;
    ship.group.position.set(x, y, z); ship.group.rotation.set(-Math.atan2(dy, SPEED), 0, -0.12 * Math.cos(k * 0.6));
    ship.set({ sail: 1, heel: 0, side: 1, glow: 0.8, t });
    const s = y - sea.heightAt(x, z), sd = Math.sign(s) || 1;
    if (sd !== side && k > 0.2) { side = sd; U.splash(ship.group.position, { power: 1.1, dive: sd < 0 }); } else side = sd;
    if (k < dt + 1e-3) cam.y = y + 1.8; // (the loop starts again: the camera cut back with the ship)
    cam.y = THREE.MathUtils.damp(cam.y, y + 1.8, 3.2, dt);
    if (root.userData.view === 'front') { at.set(x + 1.5, y + 0.9, z + 8); look.set(x, y + 0.6, z); } // (from ahead, looking back at the bow)
    else { at.set(x * 0.4, cam.y, z - 8); look.set(x * 0.6, y + 0.4, z + 12); }
    nobody.group.position.set(-26 + 3.5 * k, -15, 40 + 2 * k); nobody.group.rotation.set(0, 1.1, 0); nobody.set({ swim: 1, bend: 0.2, t }); nobody.update(dt, null);
    brig.set({ heel: 0.03 * Math.sin(t * 0.7), pitch: 0.02 * Math.sin(t * 0.5), t }); brig.update(dt);
    sea.update(t, at); mindTick(t);
    if (!dives && W) W.set({ storm: 0.5 - 0.5 * Math.cos((t / 16) * Math.PI * 2) });
    W?.update(dt, wb.camera); U.update(dt, wb.camera);
  };
  root.userData.shot = (camera) => { camera.position.copy(at); camera.up.set(0, 1, 0); camera.lookAt(look); camera.fov = 60; camera.updateProjectionMatrix(); };
  root.userData.dispose = () => {
    U.dispose(); W?.set({ storm: 0, mind: null, anywhere: false }); // (mind back to the Courier's own, not the stage's 0)
    if (W) { W.k = 0; W.update(0, wb.camera); }
    S.fog = was.fog; S.background = was.bg;
    sea.dispose(); ship.dispose(); brig.dispose(); nobody.dispose(); stone.dispose(); wire.dispose(); dome.geometry.dispose(); dome.material.dispose();
  };
  return root;
}
