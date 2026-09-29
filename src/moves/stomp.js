import * as THREE from 'three';
import { Tech } from './techs.js';
import { sfx } from '../audio.js';
import { T } from '../config.js';

// Stomp: come down on a pot from above and it shatters under you and throws you
// back up (with your air jump back); a clapperjar's lid works too. Never takes over
// the step - it just watches landings and falls.
export class Stomp extends Tech {
  constructor(mgr) { super(mgr, 'stomp'); }

  bounce(what) {
    const P = this.P, c = this.cfg;
    P.vel.y = c.bounce;
    P.grounded = false;
    P.airJumps = T.movement.airJumps;
    P.dashCharges = T.movement.dashCharges;
    P.jumpFx(0.8);
    sfx.boing?.(4, 1);
    this.game.hud?.popup(what);
    this.game.events?.emit('stomp', { what });
  }

  onLand(fallSpeed, under) {
    const P = this.P, c = this.cfg;
    if (fallSpeed < c.minSpeed) return;
    // what the controller landed on (a jar's rim counts, not just dead centre)
    const ent = under.map((col) => P.physics.entityOf?.(col)).find((e) => e?.type === 'breakable' && e.alive);
    if (!ent) return;
    const t = ent.body.translation();
    this.game.breakables.damage(ent, 1e6, new THREE.Vector3(t.x, P.pos.y, t.z), new THREE.Vector3(0, -1, 0), 1.2);
    this.bounce('STOMP');
  }

  // (not a takeover: watches for landing on a clapperjar's lid while falling)
  canStart() {
    const P = this.P, cl = this.game.clappers;
    if (!cl || P.grounded || P.vel.y > -2) return false;
    const top = 0.5 * T.clappers.scale;
    for (const cr of cl.list) {
      if (!cr.alive || cr.state === 'knocked') continue;
      const dy = P.pos.y - (cr.pos.y + top);
      if (dy > 0.25 || dy < -0.2) continue;
      if (Math.hypot(P.pos.x - cr.pos.x, P.pos.z - cr.pos.z) > 0.45) continue;
      cl.knock(cr, new THREE.Vector3(P.vel.x * 0.3, -3, P.vel.z * 0.3));
      this.bounce('LID HOP');
      return false;
    }
    return false;
  }
}
