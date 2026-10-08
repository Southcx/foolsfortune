// ---------------------------------------------------------------------------------------
// THE ENCOUNTERS AT SEA ON THE WORKBENCH (`crossing:encounters`, and one alone: `crossing:encounters.<id>`; the group 'the crossing' on
// the MODELS tab): each encounter's tableau (vfx/encounters/tableaux.js) on a patch of the crude sea, a sloop flying the rail past it at the
// rail's own speed and height, and the camera its sequence's (vfx/encounters/sequences.js, sampled by cine/sequence.js cameraAt), so
// what is judged here is what plays at sea. Each film runs its five and a half real seconds and holds a beat (where the choice opens);
// the whole stage runs the seven in turn. The rail here is straight along +Z (a leg's), its frame the game's (x across mirrored).
// Prior art: the workbench's crossing stages (workbench/crossingstages.js), a storyboard's animatic (each shot played in turn).
//
//   encounterStage(id, game) -> Object3D (userData.tick, userData.shot, userData.dispose)   ENCOUNTER_STAGE_IDS
//   userData.view: a film's time to hold (a number of real seconds), for a still
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { CrudeSea } from '../vfx/crudesea.js';
import { Sloop } from '../vfx/sloop.js';
import { buildTableau, TABLEAU_IDS } from '../vfx/encounters/tableaux.js';
import { SEA_SEQUENCES, SEA_FILM } from '../vfx/encounters/sequences.js';
import { cameraAt } from '../cine/sequence.js';
import { mindTick } from '../vfx/labradorite.js';
import { COLOR } from '../progress/weather.js';

export const ENCOUNTER_STAGE_IDS = ['crossing:encounters', ...TABLEAU_IDS.map((e) => `crossing:encounters.${e}`)];
const SPEED = 26, CRUISE = 3, SCALE = 0.24, HOLD = 1.2; // (the rail's m/s, the ship's height, the rail's ship scale: courier/ship/ship.js; a beat held after each film)

export function encounterStage(id, game) {
  const wb = game.workbench, S = wb?.scene; if (!S) return null;
  const env = game.sky?.env || null, root = new THREE.Group(); root.userData.placed = true; root.userData.bare = true;
  const dome = new THREE.Mesh(new THREE.SphereGeometry(330, 32, 16), game.sky.domeMaterial(new THREE.Vector3(-0.55, 0.3, -0.78)));
  dome.frustumCulled = false; dome.renderOrder = -10; root.add(dome);
  const sea = new CrudeSea({ env, size: 300, cells: 120, y: 0 }); root.add(sea.mesh);
  const ship = new Sloop({ env }); ship.group.scale.setScalar(SCALE); ship.polarity(COLOR.wonder); root.add(ship.group);
  const ids = id === 'crossing:encounters' ? TABLEAU_IDS : [id.split('.')[1]];
  const sets = ids.map((e) => { const s = buildTableau(e, { env, hull: 'sloop', feel: 'wonder' }); s.holder = new THREE.Group(); s.holder.add(s.group); s.holder.visible = false; root.add(s.holder); return { id: e, s }; });
  const was = { fog: S.fog, bg: S.background };
  S.fog = new THREE.FogExp2(new THREE.Color(0xcbb9a6), 0.004); S.background = new THREE.Color(0x2a2230);
  // the rail: a point moving along +Z, its frame the game's (local x across = world -X)
  const Q = new THREE.Vector3(), toWorld = (l, out) => out.set(-l.x, l.y, l.z).add(Q);
  const shipAt = new THREE.Vector3(), subjectAt = new THREE.Vector3(), cam = { pos: new THREE.Vector3(), look: new THREE.Vector3(), fov: 0, roll: 0 };
  const per = SEA_FILM.dur + HOLD, local = new THREE.Vector3();
  let cur = null, last = -1, pt = 0;
  root.userData.tick = (time) => {
    const t = typeof root.userData.view === 'number' ? root.userData.view : time, dt = Math.min(0.1, Math.max(0, time - pt)); pt = time;
    const n = Math.floor(t / per) % sets.length, ft = t % per, k = Math.min(1, ft / SEA_FILM.dur);
    if (n !== last) { if (cur) cur.s.holder.visible = false; last = n; cur = sets[n]; cur.s.holder.visible = true; }
    const s = cur.s;
    Q.set(0, 0, SPEED * ft);
    // the tableau where the film puts it (vfx/encounters/film.js): carried alongside (its own pace, easing to the ship's) or lying on the water
    const ta = Math.min(ft, SEA_FILM.dur), drift = s.motion === 'alongside' ? s.vz * (ta - (ta * ta) / (2 * SEA_FILM.dur)) : -SPEED * ft;
    local.set(s.at[0], 0, s.at[1] + drift);
    toWorld(local, s.holder.position);
    toWorld(local.set(0.6 * Math.sin(ft * 0.7), CRUISE + 0.25 * Math.sin(ft * 1.3), 0), ship.group.position); shipAt.copy(ship.group.position);
    ship.group.rotation.set(0, 0, -0.1 * Math.cos(ft * 0.7)); ship.set({ sail: 1, side: 1, glow: 0.7, t: ft });
    s.tick(ft, { camera: wb.camera, k, bob: sea.heightAt(s.holder.position.x, s.holder.position.z) });
    sea.set({ calm: (s.calm ?? 0.7) * Math.min(1, ft * 1.5) });
    const anchors = { ship: shipAt, tableau: s.holder.position, subject: s.subject.getWorldPosition(subjectAt) };
    cameraAt(SEA_SEQUENCES[`sea.${cur.id}`].segments.arrive, Math.min(ft, SEA_FILM.dur), anchors, 0, cam);
    sea.update(time, cam.pos); mindTick(time); void dt;
  };
  root.userData.shot = (camera) => { camera.position.copy(cam.pos); camera.up.set(0, 1, 0); camera.lookAt(cam.look); camera.fov = 60 + cam.fov; camera.updateProjectionMatrix(); };
  root.userData.dispose = () => { S.fog = was.fog; S.background = was.bg; sea.dispose(); ship.dispose(); for (const { s } of sets) s.dispose(); dome.geometry.dispose(); dome.material.dispose(); };
  return root;
}
