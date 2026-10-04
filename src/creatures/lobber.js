import * as THREE from 'three';
import { RAPIER, groups, G } from '../core/physics.js';
import { PALETTE, T } from '../core/config.js';
import { addOutline } from '../render/outline.js';
import { sfx } from '../audio/sfx.js';

// Lobbers: clay mortars in the handling lab that throw a glazed ball at the courier every few
// seconds. A ball that reaches you knocks you back (nothing worse: there's no damage yet); a
// ball you parry with a kick goes back the way you're looking, and a target it strikes rings.
// Balls are listed in `game.projectiles` so the parry can find them.
const BALL = groups(G.PROP, G.STATIC);

export class Lobbers {
  constructor(scene, physics) {
    this.scene = scene;
    this.physics = physics;
    this.list = [];
    this.balls = [];
    this.game = null;
    this.mat = new THREE.MeshStandardMaterial({ color: PALETTE.potLight, roughness: 0.5, emissive: 0xff5a14, emissiveIntensity: 0.35, flatShading: true });
    this.geo = new THREE.IcosahedronGeometry(0.22, 1);
  }

  /** A mortar at `pos` (its mouth), throwing at a player inside `zone` [x0, x1, z0, z1]. */
  add({ pos, zone, interval = 3.4, speed = 13, phase = 0 }) {
    const g = new THREE.Group();
    g.position.set(...pos);
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.42, 0.9, 10), new THREE.MeshStandardMaterial({ color: PALETTE.dark, roughness: 0.9, flatShading: true }));
    barrel.position.y = -0.2;
    addOutline(barrel);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.31, 0.06, 5, 12), new THREE.MeshStandardMaterial({ color: PALETTE.pot, roughness: 0.7 }));
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 0.25;
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.65, 0.5, 10), new THREE.MeshStandardMaterial({ color: PALETTE.mid, roughness: 0.9, flatShading: true }));
    base.position.y = -0.85;
    addOutline(base);
    g.add(barrel, rim, base);
    this.scene.add(g);
    const l = { pos: new THREE.Vector3(...pos), zone, interval, speed, cool: interval * 0.5 + phase, group: g, flash: 0 };
    this.list.push(l);
    return l;
  }

  update(dt) {
    const game = this.game;
    if (!game) return;
    const P = game.player;
    for (const l of this.list) {
      l.cool -= dt;
      l.flash = Math.max(0, l.flash - dt * 3);
      l.group.scale.y = 1 - l.flash * 0.12;
      const [x0, x1, z0, z1] = l.zone;
      const inside = P.pos.x > x0 && P.pos.x < x1 && P.pos.z > z0 && P.pos.z < z1 && Math.abs(P.pos.y - (l.pos.y - 1.5)) < 12;
      if (l.cool <= 0 && inside) { this.fire(l); l.cool = l.interval; }
    }
    this.balls = this.balls.filter((b) => this.tickBall(b, dt));
  }

  fire(l) {
    const P = this.game.player;
    const to = new THREE.Vector3(P.pos.x, P.pos.y + 1.05, P.pos.z).addScaledVector(new THREE.Vector3(P.vel.x, 0, P.vel.z), 0.35);
    const d = to.clone().sub(l.pos);
    const T = THREE.MathUtils.clamp(d.length() / l.speed, 0.6, 1.8);
    const v = d.divideScalar(T);
    v.y += 0.5 * 9.81 * T;
    const body = this.physics.world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(l.pos.x, l.pos.y + 0.3, l.pos.z).setLinvel(v.x, v.y, v.z).setCcdEnabled(true).setLinearDamping(0));
    this.physics.world.createCollider(RAPIER.ColliderDesc.ball(0.22).setDensity(20).setRestitution(0.2).setCollisionGroups(BALL), body);
    const mesh = new THREE.Mesh(this.geo, this.mat);
    mesh.castShadow = true;
    addOutline(mesh);
    mesh.position.set(l.pos.x, l.pos.y + 0.3, l.pos.z);
    this.scene.add(mesh);
    const sync = this.physics.addSynced(body, mesh);
    const b = { body, mesh, sync, t: 0, prev: v.length(), parried: false, reflected: false };
    this.balls.push(b);
    (this.game.projectiles ||= new Set()).add(b);
    l.flash = 1;
    sfx.thump?.();
    this.game.fx?.impact?.(l.pos.clone().setY(l.pos.y + 0.3), new THREE.Vector3(0, 1, 0), { sparks: 6, dust: 6 });
    this.game.events?.emit('lob.fire', {});
  }

  tickBall(b, dt) {
    const g = this.game, P = g.player;
    if (b.pinned || b.grabbed) return true; // (anchored, or in the god hand: it stays as it is)
    b.t += dt;
    const t = b.body.translation(), v = b.body.linvel();
    const at = new THREE.Vector3(t.x, t.y, t.z);
    const sp = Math.hypot(v.x, v.y, v.z);
    g.fx?.alpha?.emit({ pos: at.clone(), vel: new THREE.Vector3(), life: 0.3, size: 0.12, sizeEnd: 0.02, color: new THREE.Color(0xffa066), alpha: 0.4, drag: 2 });
    let done = b.t > 6;
    // a reflected ball rings the targets it strikes
    if (b.reflected && g.movers?.hitTargetsNear(new THREE.Vector3(t.x, t.y - 0.2, t.z), 0.6, { cause: 'parry', drop: 0 })) done = true;
    // one that reaches us knocks us back
    if (!b.reflected && g.god?.active && Math.hypot(t.x - P.pos.x, t.z - P.pos.z) < 0.6 && t.y > P.pos.y - 0.1 && t.y < P.pos.y + 1.4) {
      // (the Courier is a jar just now)
      g.god.hitJar(T.god.ballDamage, new THREE.Vector3(v.x, 0, v.z).normalize().negate(), 'ball');
      done = true;
    } else if (!b.reflected && !g.god?.active && Math.hypot(t.x - P.pos.x, t.z - P.pos.z) < 0.7 && t.y > P.pos.y - 0.1 && t.y < P.pos.y + 1.9) {
      if (P.invulnerable || P.guarding) { g.events?.emit('lob.dodged', {}); } // (a raised blade turns it: the guard's own check usually gets there first)
      else {
        const dir = new THREE.Vector3(v.x, 0, v.z).normalize();
        P.impulse(dir.multiplyScalar(6).setY(3), 'lobber');
        P.grounded = false;
        g.events?.emit('lob.hit', {});
      }
      done = true;
    }
    // it broke on the wall or floor
    if (!done && b.t > 0.1 && b.prev > 3 && sp < b.prev * 0.45) done = true;
    b.prev = sp;
    if (done) {
      g.fx?.impact?.(at, new THREE.Vector3(0, 1, 0), { sparks: 8, dust: 10 });
      sfx.pop?.(4);
      this.removeBall(b);
      return false;
    }
    return true;
  }

  removeBall(b) {
    this.physics.removeSynced(b.sync);
    this.physics.removeBody(b.body);
    this.scene.remove(b.mesh);
    this.game.projectiles?.delete(b);
  }

  clear() {
    for (const b of this.balls) this.removeBall(b);
    this.balls.length = 0;
    for (const l of this.list) l.cool = l.interval * 0.5;
  }
}
