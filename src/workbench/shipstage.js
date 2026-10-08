// ---------------------------------------------------------------------------------------
// THE SHIP CLASSES ON THE WORKBENCH (`ships:classes`, the group 'ships' on the MODELS tab): the five hulls of the Vessoul's ship form
// (vfx/shipclasses.js) in echelon on a patch of the crude sea, sailing in place, each its own feeling's drive; the camera goes round them:
// from ahead, from the side, from astern and above, four real seconds each (`userData.view` holds one: 'front' | 'side' | 'stern' |
// 'top', or one hull: 'tanker.front' | '.side' | '.stern'). At their life size (the sloop 7 m); at the rail they fly at a quarter of it (courier/ship/ship.js SCALE).
// Prior art: the workbench's crossing stages (workbench/crossingstages.js: a sky, a sea and a camera of its own), a shipyard's
// line-up of a class's hulls, the model sheet's front-side-top.
//
//   shipStage(game) -> Object3D (userData.tick, userData.shot, userData.dispose)   SHIP_ORDER
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { CrudeSea } from '../vfx/crudesea.js';
import { shipLook } from '../vfx/shipclasses.js';
import { COLOR } from '../progress/weather.js';
import { mindTick } from '../vfx/labradorite.js';

export const SHIP_ORDER = ['sloop', 'frigate', 'destroyer', 'galleon', 'tanker'];
const FEEL = { sloop: 'wonder', frigate: 'mirth', destroyer: 'dread', galleon: 'desire', tanker: 'grief' };
const VIEWS = ['front', 'side', 'stern', 'top'];
const _v = new THREE.Vector3();

export function shipStage(game) {
  const wb = game.workbench, S = wb?.scene; if (!S) return null;
  const env = game.sky?.env || null, root = new THREE.Group(); root.userData.placed = true; root.userData.bare = true;
  const dome = new THREE.Mesh(new THREE.SphereGeometry(330, 32, 16), game.sky.domeMaterial(new THREE.Vector3(-0.55, 0.3, -0.78)));
  dome.frustumCulled = false; dome.renderOrder = -10; root.add(dome);
  const sea = new CrudeSea({ env, size: 200, cells: 90, y: 0 }); sea.set({ calm: 0.7 }); root.add(sea.mesh);
  const ships = SHIP_ORDER.map((id, i) => { const s = shipLook(id, { env }); s.polarity(COLOR[FEEL[id]]); s.group.position.set((i - 2) * 9, 0, (2 - i) * 14); root.add(s.group); return s; });
  const was = { fog: S.fog, bg: S.background };
  S.fog = new THREE.FogExp2(new THREE.Color(0xcbb9a6), 0.006); S.background = new THREE.Color(0x2a2230);
  const at = new THREE.Vector3(), look = new THREE.Vector3();
  root.userData.tick = (t) => {
    ships.forEach((s, i) => {
      const { x, z } = s.group.position, y = sea.heightAt(x, z) * 0.6;
      s.group.position.y = y; s.group.rotation.set(0.03 * Math.sin(t * 0.9 + i), 0, 0.04 * Math.sin(t * 0.7 + i * 2));
      s.set({ sail: 1, side: 1, glow: 0.7, t });
    });
    const v = root.userData.view || VIEWS[Math.floor(t / 4) % VIEWS.length];
    const [one, ang] = v.split('.'), k = SHIP_ORDER.indexOf(one); // (a hull alone: 'tanker.front', 'tanker.side', 'tanker.stern')
    if (k >= 0) { const s = ships[k], P = s.group.position, L = s.length; look.set(P.x, P.y + L * 0.12, P.z); at.copy(look).add(ang === 'side' ? _v.set(-L * 1.25, L * 0.12, 0) : ang === 'stern' ? _v.set(L * 0.6, L * 0.35, -L * 1.0) : _v.set(-L * 0.75, L * 0.18, L * 0.95)); }
    else if (v === 'front') { at.set(-14, 4, 46); look.set(0, 1.5, 0); }
    else if (v === 'side') { at.set(-46, 3, -6); look.set(0, 1.8, 0); }
    else if (v === 'stern') { at.set(10, 7, -50); look.set(0, 1.2, 0); }
    else { at.set(0, 70, 8); look.set(0, 0, 0); }
    sea.update(t, at); mindTick(t);
  };
  root.userData.shot = (camera) => { camera.position.copy(at); camera.up.set(0, 1, 0); camera.lookAt(look); camera.fov = 50; camera.updateProjectionMatrix(); };
  root.userData.dispose = () => { S.fog = was.fog; S.background = was.bg; sea.dispose(); for (const s of ships) s.dispose(); dome.geometry.dispose(); dome.material.dispose(); };
  return root;
}
