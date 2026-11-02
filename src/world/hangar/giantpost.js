// ---------------------------------------------------------------------------------------
// THE GIANT POST (docs/plans/MECHS.md 5.3, 11.2): a post in the proving ground near the giant's spot where F calls the next giant that is
// open (giants.js giantOpen: the straw giant always, the dune colossus once the straw giant has fallen three times or once on the
// battery alone), taking the one standing away. In the DEBUG save the Movement Arts lend opens them all (as mechtech.js `open`). Placeholder
// of boxes for Calissa to dress: `giant.post` (`giant.post.plinth`, `giant.post.pillar`, `giant.post.lamp`) and a floor sign.
//
// Prior art: Shadow of the Colossus' shrine (the idol that calls the next), Monster Hunter's quest board, the Sandbox's lecterns.
//
//   const P = new GiantPost(game)   P.build(into)   P.dispose()   P.offer(playerPos) -> an interact offer | null   P.next(standingId) -> id | null
//   GIANT_POST { x, z, reach }
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { label } from '../basement/basement.js';
import { GIANT_IDS, giantOpen } from '../../progress/mechs/giants.js';
import { PROVING } from './layout.js';

/** Where it stands (local metres from the yard's middle: west and north of the giant's spot, out of its way) and F's reach. */
export const GIANT_POST = { x: PROVING.giant.x - 16, z: PROVING.giant.z - 20, reach: 6 };
const C = { plinth: 0x5a4a3e, pillar: 0x8a6a48, lamp: 0xffb04a };

export class GiantPost {
  constructor(game) { this.game = game; this.group = null; this.geos = []; this.mats = []; this.sign = null; }

  build(into) {
    if (this.group || !into) return;
    const A = PROVING.at, g = this.group = new THREE.Group(); g.name = 'giant.post'; g.position.set(A.x + GIANT_POST.x, A.y, A.z + GIANT_POST.z);
    const box = (name, w, h, d, c, y, emissive = 0) => {
      const geo = new THREE.BoxGeometry(w, h, d), mat = new THREE.MeshStandardMaterial({ color: c, roughness: 0.9, flatShading: true });
      if (emissive) { mat.emissive = new THREE.Color(c); mat.emissiveIntensity = emissive; }
      this.geos.push(geo); this.mats.push(mat);
      const m = new THREE.Mesh(geo, mat); m.name = `giant.post.${name}`; m.position.y = y; m.castShadow = m.receiveShadow = true; g.add(m);
    };
    box('plinth', 4, 1.2, 4, C.plinth, 0.6); box('pillar', 1.4, 6, 1.4, C.pillar, 4.2); box('lamp', 2, 1.2, 2, C.lamp, 7.8, 1.1);
    into.add(g);
    this.sign = label(g, 'GIANT POST', [0, 0, 3.6], { width: 3.4, sub: 'F calls the next giant' });
  }
  dispose() {
    this.sign?.geometry?.dispose(); this.sign?.material?.dispose(); this.sign = null;
    for (const x of this.geos) x.dispose(); for (const x of this.mats) x.dispose();
    this.geos = []; this.mats = []; this.group?.parent?.remove(this.group); this.group = null;
  }

  /** F's offer to a Courier on foot beside it. */
  offer(p) {
    if (!this.group) return null;
    const A = PROVING.at, x = A.x + GIANT_POST.x, z = A.z + GIANT_POST.z, d = Math.hypot(p.x - x, p.z - z);
    return d < GIANT_POST.reach && Math.abs(p.y - A.y) < 3 ? { pos: new THREE.Vector3(x, A.y + 5, z), d, ref: 'giantpost' } : null;
  }

  /** The next open giant after the one standing (round the ids), or null when none but it is open. */
  next(standing) {
    const g = this.game, lent = !!g.lend?.has?.('arts'), open = (id) => lent || giantOpen(id, g.ledger);
    const at = GIANT_IDS.indexOf(standing);
    for (let i = 1; i < GIANT_IDS.length; i++) { const id = GIANT_IDS[(at + i) % GIANT_IDS.length]; if (open(id)) return id; }
    return null;
  }
}
