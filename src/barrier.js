// ---------------------------------------------------------------------------------------
// THE BARRIER: the edge of an open place. The dunes used to end in a bowl of mountains, a wall you could see; now the sand runs on to
// the horizon and the edge is a circle you cannot see until you touch it. It is a ring of tall thin colliders (so the Courier, the skiff,
// a thrown pot and a fish-flung body all stop at it the same way), and where something runs into it, the air there shows itself for a
// moment: a ring of light spreading on the curve of the wall, a few lines of a glassy lattice, a puff of sand, a soft glass note.
// It is a mark in the world, not a message (CLAUDE.md: marks are not text).
//
// Prior art: the invisible walls of open games that own up to themselves: Journey's wind that turns you back, Breath of the Wild's
// edge-of-map haze, and the force-field ripples of shield walls (Halo's, the "hex" hits of a sci-fi dome) where contact is drawn
// at the point of contact and nowhere else.
//
//   const b = new Barrier(game, { center: Vector3, radius, y0, y1, color })     b.update(dt)      b.inside(pos)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { RAPIER, GROUPS } from './physics.js';
import { sfx } from './audio.js';

const FRAG = `varying vec2 vUv; uniform float uAge; uniform float uPower; uniform vec3 uColor;
void main() {
  vec2 p = vUv - 0.5; p.x *= 1.6;
  float r = length(p) * 2.0;
  float ring = smoothstep(0.1, 0.0, abs(r - (0.15 + uAge * 1.1))) * 0.9;           // a ring spreading from the touch
  vec2 g = abs(fract(vec2(p.x * 7.0 + p.y * 4.0, p.x * -7.0 + p.y * 4.0)) - 0.5);   // a glassy lattice, only near the touch
  float lat = smoothstep(0.46, 0.5, max(g.x, g.y)) * (1.0 - smoothstep(0.0, 0.85, r)) * 0.35;
  float a = (ring + lat + (1.0 - smoothstep(0.0, 0.35, r)) * 0.25) * (1.0 - smoothstep(0.75, 1.0, r));
  a *= pow(1.0 - uAge, 1.6) * (0.5 + 0.5 * uPower);
  gl_FragColor = vec4(uColor * (0.7 + 0.6 * ring), a);
}`;

export class Barrier {
  constructor(game, { center, radius, y0, y1, color = 0xffe6b8, segments = 128 }) {
    this.game = game; this.center = center.clone(); this.radius = radius;
    // the wall: a ring of thin boxes, each a little longer than its share of the circle so there is no gap between them
    const W = game.physics.world, h = (y1 - y0) / 2, len = ((2 * Math.PI * (radius + 0.5)) / segments) * 0.55;
    for (let i = 0; i < segments; i++) {
      const a = (i / segments) * Math.PI * 2, x = center.x + Math.cos(a) * (radius + 0.5), z = center.z + Math.sin(a) * (radius + 0.5);
      const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -a);
      const b = W.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(x, y0 + h, z).setRotation(q));
      W.createCollider(RAPIER.ColliderDesc.cuboid(0.5, h, len).setCollisionGroups(GROUPS.static).setFriction(0), b);
    }
    // the touch marks: a few pooled patches of the wall, lit for a moment where it was touched
    this.pool = [];
    const geo = new THREE.PlaneGeometry(1, 1);
    for (let i = 0; i < 4; i++) {
      const mat = new THREE.ShaderMaterial({
        uniforms: { uAge: { value: 1 }, uPower: { value: 1 }, uColor: { value: new THREE.Color(color) } },
        vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
        fragmentShader: FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false,
      });
      const m = new THREE.Mesh(geo, mat);
      m.visible = false; m.userData.zoneFree = true; m.renderOrder = 6;
      game.scene.add(m);
      this.pool.push({ m, age: 1 });
    }
    this.next = 0; this.cd = 0; this.prevR = null; this.approach = 0;
  }

  inside(p, pad = 0) { return Math.hypot(p.x - this.center.x, p.z - this.center.z) < this.radius - pad; }

  /** Light the wall at a point on it (world), with a strength 0..1. */
  touch(at, power = 1) {
    const e = this.pool[this.next++ % this.pool.length];
    const out = new THREE.Vector3(at.x - this.center.x, 0, at.z - this.center.z).normalize();
    e.m.position.set(this.center.x + out.x * this.radius, at.y, this.center.z + out.z * this.radius);
    e.m.lookAt(this.center.x, at.y, this.center.z);
    const s = 2.2 + 1.8 * power; // (a little mark: about the Courier's own size)
    e.m.scale.set(s * 1.6, s, 1);
    e.m.material.uniforms.uPower.value = power;
    e.age = 0; e.m.visible = true;
    const g = this.game;
    g.fx?.impact?.(new THREE.Vector3(at.x, at.y - 0.8, at.z), out.clone().negate(), { sparks: 0, dust: 8 + Math.round(power * 10) });
    sfx.barrier?.(power);
    g.events?.emit('dunes.barrier', { power });
  }

  update(dt) {
    for (const e of this.pool) if (e.m.visible) { e.age += dt / 0.8; e.m.material.uniforms.uAge.value = Math.min(1, e.age); if (e.age >= 1) e.m.visible = false; }
    const P = this.game.player, p = P.pos;
    const r = Math.hypot(p.x - this.center.x, p.z - this.center.z);
    // how fast the Courier was closing on the wall just now (the wall itself stops the body: what is left to show is the arrival)
    if (this.prevR !== null && dt > 0) this.approach = Math.max(this.approach * Math.exp(-dt * 6), (r - this.prevR) / dt);
    this.prevR = r;
    this.cd -= dt;
    if (r > this.radius - 1.1 && this.cd <= 0 && this.approach > 1.2) {
      this.touch(new THREE.Vector3(p.x, p.y + 1.0, p.z), Math.min(1, this.approach / 14));
      this.cd = 0.4; this.approach = 0;
    }
  }
}
