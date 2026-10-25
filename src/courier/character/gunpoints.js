// ---------------------------------------------------------------------------------------
// THE PSYGUN MODEL'S POINTS (part of courier/character.js): where the parts of the psygun are on its model, in the model's own units
// (multiply by the Character's gunScale for metres): +X the barrel, +Y up, +Z right. The muzzle, the point a spent case is ejected from,
// the magazine well, the height of the sights, and the two grips the hands are fitted to (the right hand holds, the left supports). The
// Character places the gun and its hands by them; the weapon, the gun's moves and the psygun's models (which fit their grips to these
// and move the muzzle for a variant) read them, so there is one table and every reader holds the same object.
//
//   import { GUN_POINTS } from './character/gunpoints.js'     (courier/character.js exports it too: the tools import it from there)
//   GUN_POINTS.muzzle / .eject / .magwell / .gripR / .gripL (Vector3)   GUN_POINTS.sightY (a number)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

export const GUN_POINTS = {
  // in gun-model units (multiply by gunScale for metres); +X barrel, +Y up, +Z right
  muzzle: new THREE.Vector3(0.36, 0.027, 0),
  eject: new THREE.Vector3(0.0, 0.09, 0.03),
  magwell: new THREE.Vector3(-0.25, -0.18, 0),
  sightY: 0.118,
  gripR: new THREE.Vector3(-0.34, -0.13, 0.04),
  gripL: new THREE.Vector3(-0.27, -0.15, -0.075),
};
