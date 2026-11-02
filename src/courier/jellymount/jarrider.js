// ---------------------------------------------------------------------------------------
// THE PNEUKA JAR ON THE SLIP JELLY MOUNT (South, 2026-11-02: "moving forward I vote we have the Pneuka Jar in a cradle/saddle riding stuff
// instead of the Courier model, with the exception being the Solar Skiffing module where we want to see the Courier"). While the mount is
// out, the Courier folds into the Pneuka Jar as a cradle's seal folds them (world/cradles.js: the body hidden, the god hand's Jar shown),
// and the Jar sits in a saddle on the jelly's crown, turned with its heading, hopping with its hops and landing with its landings. The
// tools go away with the hands (the mount's `handsBusy`, as swimming puts the gun away). The Jar is only taken while nothing else holds it
// (a seal, the god hand, the Spirit Garden, a puzzle duel's form dive): those set it themselves.
//   THE SADDLE  a placeholder: a ring of clay and a pad under the Jar's foot, on the crown. Its look is Calissa's to draw (it rides on
//               `rider.saddle`, a Group: dress it there).
//
// Prior art: the cradle's own fold (world/cradles.js), Yoshi's saddle (Super Mario World), Dragon Quest's slime knight.
//
//   rider = new JarRider(game)   .on()   .off()   .place(pos, yaw)   .hop()   .land(speed)   .shown   .saddle
//   (made by courier/jellymount/jellymount.js; the Jar's clip chosen by godhand/pneukajarclips.js while `game.jellyMount.jarRides`)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

/** The saddle's placeholder size (m: the Jar's foot is about 0.5 across) and how high the Jar's foot sits over the crown. */
const SADDLE = { ring: 0.34, tube: 0.07, pad: 0.3, lift: 0.04, clay: 0x9a5b3c, padTone: 0x6b3a2a };

export class JarRider {
  constructor(game) { this.game = game; this.shown = false; this.saddle = null; }
  get jar() { return this.game.god?.jar; }
  /** True while something else draws the Jar (they place it and choose its clips). */
  get claimed() { const g = this.game; return !!(g.cradles?.sealed || g.god?.active || g.realm?.active || g.duel?.active); }

  on() {
    const g = this.game, J = this.jar; if (!J || this.shown || this.claimed) return false;
    this.shown = true;
    g.character?.setHidden(true); g.belt?.hideWorn();
    J.group.visible = true; J.clips?.R.start('summon');
    this.ensureSaddle(); this.saddle.visible = true;
    return true;
  }
  off() {
    const g = this.game, J = this.jar; if (!this.shown) return;
    this.shown = false;
    if (this.saddle) this.saddle.visible = false;
    if (J && !this.claimed) J.group.visible = false;
    if (!g.god?.active && !g.cradles?.sealed) g.character?.setHidden(false); // (the belt's worn tools come back on its own tick)
  }
  /** The Jar on the crown: `pos` the seat (the rider's feet), `yaw` the jelly's heading. */
  place(pos, yaw) {
    const J = this.jar; if (!this.shown || !J || this.claimed) return;
    J.group.position.set(pos.x, pos.y + SADDLE.lift, pos.z); J.group.rotation.set(0, yaw, 0); J.pos.copy(J.group.position);
    this.saddle.position.set(pos.x, pos.y, pos.z); this.saddle.rotation.set(0, yaw, 0);
  }
  hop() { if (this.shown && !this.claimed) this.jar?.clips?.hop(); }
  land(speed) { if (this.shown && !this.claimed) this.jar?.clips?.land(speed); }

  ensureSaddle() {
    if (this.saddle) return;
    const root = new THREE.Group(); root.name = 'jarSaddle'; root.visible = false;
    const clay = new THREE.MeshStandardMaterial({ color: SADDLE.clay, roughness: 0.85 }), pad = new THREE.MeshStandardMaterial({ color: SADDLE.padTone, roughness: 0.95 });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(SADDLE.ring, SADDLE.tube, 8, 24), clay); ring.rotation.x = Math.PI / 2; ring.position.y = SADDLE.tube;
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(SADDLE.pad, SADDLE.pad * 1.1, 0.05, 20), pad); disc.position.y = 0.02;
    for (const m of [ring, disc]) { m.castShadow = true; root.add(m); }
    this.game.scene.add(root); this.saddle = root;
  }
}
