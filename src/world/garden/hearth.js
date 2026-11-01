// ---------------------------------------------------------------------------------------
// THE HEARTH: Spirit Cooking's cooking station in the Spirit Garden, on the Athanor's west shoulder, a few hops from the press where a
// served dish's draught is spent (docs/plans/SPIRIT-COOKING.md 3; South, 2026-11-01: "The Spirit garden is our facility hotspot where all
// the slice-of-life activities occur"). F there opens the cooking station's window (world/garden/kitchen.js). The model here is a
// placeholder (a clay fire bowl and a lidded pot), Calissa's to dress; it stands on the ground's own normal, as the mycelium's beds do.
//
// Prior art: the mycelium's places (world/garden/mycelium.js: a feature pushed to the site, F answered by `use`), the donabe on its
// konro (a clay pot over a clay brazier), Breath of the Wild's cooking pot (a place in the world, not a menu).
//
//   game.hearth = new Hearth(game.realm)   .use(feature) -> bool   .feature   .kitchen
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { dirOf } from './place.js';
import { Kitchen } from './kitchen.js';

const UP = new THREE.Vector3(0, 1, 0);
/** Where it stands on the Athanor (latitude, longitude, degrees: the west shoulder, opposite the plate shrine), and its placeholder's size. */
export const HEARTH = { at: [38, 270], r: 0.55, h: 0.45 };

export class Hearth {
  constructor(realm) {
    this.R = realm; this.game = realm.game; this.feature = null; this.mesh = null;
    this.kitchen = new Kitchen(this.game);
    this.game.events?.on?.('garden.enter', () => this.place());
  }
  /** The hearth stood on the Athanor, once (its feature pushed so the chevron offers it). */
  place() {
    const site = this.R.site, P = site?.by?.athanor; if (!P || this.feature) return;
    const d = dirOf(...HEARTH.at).normalize(), at = P.c.clone().addScaledVector(d, P.radiusAt(d));
    const g = new THREE.Group(); g.name = 'hearth'; g.position.copy(at); g.quaternion.setFromUnitVectors(UP, d);
    const clay = new THREE.MeshStandardMaterial({ color: 0x9a5a3a, roughness: 0.9 }), dark = new THREE.MeshStandardMaterial({ color: 0x3a2a22, roughness: 0.8 });
    const bowl = new THREE.Mesh(new THREE.CylinderGeometry(HEARTH.r, HEARTH.r * 0.8, HEARTH.h, 16), clay); bowl.position.y = HEARTH.h / 2;
    const pot = new THREE.Mesh(new THREE.SphereGeometry(HEARTH.r * 0.7, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.6), dark); pot.position.y = HEARTH.h + 0.05;
    const coals = new THREE.Mesh(new THREE.CircleGeometry(HEARTH.r * 0.75, 16).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xff8a40 })); coals.position.y = HEARTH.h + 0.01; // (the coals glow by their own colour: no lamp, so nothing goes round the light budget)
    g.add(bowl, coals, pot); bowl.castShadow = pot.castShadow = true;
    site.group.add(g); this.mesh = g;
    this.feature = { kind: 'hearth', planet: P, pos: at.clone(), mesh: g };
    site.features.push(this.feature);
  }
  /** F at a place: the hearth's is ours. */
  use(f) { if (f?.kind !== 'hearth') return false; this.kitchen.open(); return true; }
  update(dt) { this.kitchen.update(dt); }
}
