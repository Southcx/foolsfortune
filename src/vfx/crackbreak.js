// ---------------------------------------------------------------------------------------
// THE CRACKLE BREAK (working name, Espada's to rule): the shell a stunned Figment shows before its data can be drained, crazing and
// bursting in about 0.3 real seconds (.hack//Infection's Protect Break: the polygonal shield shown, then shattered, and only then the
// Data Drain). Ours is a glaze, not a hex shield (hex is Ego's motif): guan ware's crackle (the bubble's 'crackle' face,
// vfx/caster/bubble.js) blown round the body, its iron-wire net opening where three blows land, a breath of swell, and it pops into
// glaze shards (cream, celadon, the iron line) that fly out and fall; the body squashes at the pop. The drain plays after it
// (vfx/datadrain.js). Its sound is Wanda's to make: a placeholder for now (none).
//
// Prior art: .hack//Infection's Protect Break (CyberConnect2, 2002), guan and ge ware's crackle (the Song kilns' jinsi tiexian), and
// a soap bubble's pop (the film gone in a frame, the drops thrown out).
//
//   const b = new CrackleBreak(game)   b.play(creature | { pos, radius, height }, dur = 0.3)   b.update(rawDt)   .active   b.prewarm() -> park
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { Bubble } from './caster/bubble.js';

const SHARDS = 40, GRAV = 9.8;
const GLAZE = [new THREE.Color(0xe9e1cc), new THREE.Color(0xa9c2b2), new THREE.Color(0xc9d6cc), new THREE.Color(0x3b322c)]; // (cream, celadon, its pale, the iron line)
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _p = new THREE.Vector3(), _e = new THREE.Euler();

export class CrackleBreak {
  constructor(game) { this.game = game; this.run = null; this.made = false; }

  make() {
    if (this.made) return; this.made = true;
    this.bubble = new Bubble({ shape: 'sphere', radius: 1, cell: 0.3, pattern: 'crackle', tint: 0xbfd2c6, rim: 0xf4ecd8, film: 0.25, k: 0 });
    this.bubble.object.visible = false;
    // (the shards: solid and unlit, as the drain's cubes are, so the same program draws both)
    this.shards = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ name: 'crackbreak-shards', toneMapped: false }), SHARDS);
    this.shards.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(SHARDS * 3), 3);
    this.shards.frustumCulled = false; this.shards.visible = false;
    for (let i = 0; i < SHARDS; i++) this.shards.setColorAt(i, GLAZE[i % GLAZE.length]);
    this.game.scene?.add(this.bubble.object, this.shards);
  }

  get active() { return !!this.run; }

  play(target, dur = 0.3) {
    if (!target?.pos) return;
    this.make();
    const r = Math.max((target.radius || 0.5) * 1.5, (target.height || 1) * 0.62), c = target.pos.clone().setY(target.pos.y + (target.height || 1) * 0.5);
    const P = this.game.player?.pos, toward = P ? new THREE.Vector3(P.x - c.x, 0, P.z - c.z).normalize() : new THREE.Vector3(0, 0, 1);
    const flying = Array.from({ length: SHARDS }, (_, i) => { // (each from its place on the shell, out and up)
      const d = new THREE.Vector3().randomDirection(); d.y = Math.abs(d.y) * 0.8 + 0.1; d.normalize();
      return { at: d.clone().multiplyScalar(r).add(c), v: d.multiplyScalar(2.6 + 2 * Math.random()).add(_p.set(0, 1.4, 0)), spin: new THREE.Vector3().randomDirection().multiplyScalar(14), size: 0.07 + 0.08 * Math.random(), turn: new THREE.Euler(Math.random() * 6, Math.random() * 6, 0) };
    });
    this.run = { target, c, r, dur, t: 0, toward, flying, hits: 0, popped: false };
    this.bubble.set({ pos: c, radius: r * 0.92, k: 0, crack: 0 });
    this.bubble.object.visible = true;
  }

  update(raw) {
    const R = this.run; if (!R) return;
    R.t += raw;
    const x = R.t / R.dur, B = this.bubble;
    if (!R.popped) {
      // up in a blink, crazing as three blows land on the side the Courier stands on, a breath of swell, then gone
      const grow = Math.min(1, x / 0.18), swell = Math.max(0, (x - 0.8) / 0.2);
      B.set({ k: grow, crack: Math.min(1, Math.max(0, (x - 0.12) / 0.6)), radius: R.r * (0.92 + 0.08 * grow + 0.1 * swell * swell), pos: R.c });
      while (R.hits < 3 && x > 0.12 + R.hits * 0.22) {
        const a = (R.hits - 1) * 0.6, d = _p.copy(R.toward).applyAxisAngle(THREE.Object3D.DEFAULT_UP, a); d.y = 0.2 * (R.hits - 1);
        B.hit(d.normalize().multiplyScalar(R.r).add(R.c)); R.hits++;
      }
      B.update(raw);
      if (x >= 1) { // the pop
        R.popped = true; R.t = 0; B.set({ k: 0 }); B.object.visible = false; this.shards.visible = true;
        R.target.deform?.kick?.(-2.6, null, 0.22); // (the body squashes at the pop: a jelly's spring)
      }
      return;
    }
    // the shards: out, spinning, falling; gone in under half a real second
    const life = 0.45, u = R.t / life;
    if (u >= 1) { this.stop(); return; }
    R.flying.forEach((f, i) => {
      f.at.addScaledVector(f.v, raw); f.v.y -= GRAV * raw;
      f.turn.x += f.spin.x * raw; f.turn.y += f.spin.y * raw;
      const sz = f.size * (1 - u * u);
      this.shards.setMatrixAt(i, _m.compose(f.at, _q.setFromEuler(_e.copy(f.turn)), _s.set(sz, sz * 0.75, sz * 0.12)));
    });
    this.shards.instanceMatrix.needsUpdate = true;
  }

  stop() { this.run = null; if (!this.made) return; this.bubble.object.visible = false; this.shards.visible = false; }

  /** For the boot's warm-up: shown, so the shards' instancing compiles with the rest (the bubble's program is warmed by the caster
   *  warm-up, vfx/caster/warmups1tos5.js); returns what hides them again. */
  prewarm() {
    this.make(); this.shards.visible = true; this.bubble.object.visible = true; this.bubble.set({ k: 1, pos: _p.set(0, -50, 0) });
    return () => { if (!this.run) { this.shards.visible = false; this.bubble.object.visible = false; this.bubble.set({ k: 0 }); } };
  }
}
