// ---------------------------------------------------------------------------------------
// STRAWMAN: the Workshop's test dummy, drawn by the owner (source_assets/strawman/strawman_ref.png; docs/plans/STRAWMAN.md). Built to be
// knocked down and to stand up again, infinitely. This is its model and how it takes a blow; what it is to the game (a creature, its
// statuses, what the log says) is Dovina's and Petra's, and its story Espada's.
//
//   THE DOLL    a stitched burlap sack, pear-shaped, a three-ring target on its belly (the kiln's red on cream); a round sack head
//               with stitched X eyes and a stitched mouth; stubby stitched legs hanging; a cord round its neck with a lacquer heart
//   THE FRAME   a scarecrow's crossbar through two long charcoal sleeves, a cream spiral on each cuff; the post behind, its top a tall
//               block hat standing up behind the head; the post down to a glossy black BALL FOOT
//   THE BLOW    it rocks: the whole doll pivots on its ball foot, a spring and a damper (a roly-poly's weighted base: it always rights
//               itself), and the sack swings on its bar a beat behind (a second, softer spring); the target's ring that was hit
//               flashes; straw puffs out of the seams. Never a number: the blow is shown by the body (CLAUDE.md, marks in the world)
//
// Prior art: the scarecrow and the voodoo doll (the stitched sack, the X eyes: Tim Burton's and LittleBigPlanet's sackfolk), the
// roly-poly toy and the inflatable punching bag (a weighted round base that always stands back up: okiagari-koboshi, the Daruma that
// rises), the wing chun wooden dummy and the training dummies of every action game (Zelda's, Smash's sandbag: hit forever, never broken).
//
//   THE MOVES  it fights back without a skeleton (vfx/strawmanmoves.js: the table, the keys, the numbers): the rock on its ball, the
//               sleeves on their shoulders, the sack a beat behind on its neck, the hat nodding on its base, and a turn about the ball
//
//   const S = new StrawmanModel()   scene.add(S.group)   S.hit(point, dir, power = 1)   S.update(dt)   S.dispose()   (dt: sim seconds,
//   the clock the windups count in: creatures.js)
//   S.ring(point) -> 0 | 1 | 2 | 3   (which ring of the target a point is on: 1 the bull, 0 off it)   S.height (2.45 m)
//   S.setMode('still' | 'guard' | 'swing')   (the guard crosses the sleeves in an X in front of its chest, a boxer's cross-arm block:
//   SLEEVES.guard)   S.play(id, { onContact(blow, contact), onEnd })   S.breakOff(channels?)   S.playing (the move's id, or null)
//   S.parts.left | right | both | hat   (what strikes: the parry mark rides there)   S.yaw, S.yawTo (the facing, turned toward
//   yawTo between moves, held through one)   S.engaged (a string runs: the guard stays down)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { STRAWMAN_MOVES, SLEEVES, MOVE_EASE, CHANNELS, REST, poseAt } from './strawmanmoves.js';
export { SLEEVES };

const BODY_H = 0.95, TARGET_Y = -BODY_H + 0.44 * BODY_H; // (the sack's height; the target's middle, metres below the neck)
const C = { burlap: 0xcdb48c, seam: 0x6b5236, sleeve: 0x3a2f3a, cuff: 0xefe3c8, hat: 0x2c2731, band: 0x8d7f92, post: 0x3b2a1e, lacquer: 0x121014, red: 0xb8402e, cream: 0xf3e6c8, straw: 0xe0c070 };

/** The sack's cloth, painted on a canvas: a burlap weave, its seams, and on the front the target (three rings). */
function sackTexture({ target = false, face = false } = {}) {
  const S = 256, cv = document.createElement('canvas'); cv.width = cv.height = S;
  const g = cv.getContext('2d');
  g.fillStyle = '#' + C.burlap.toString(16).padStart(6, '0'); g.fillRect(0, 0, S, S);
  // the weave: crossed threads, a little uneven
  for (let i = 0; i < S; i += 3) {
    g.fillStyle = `rgba(80,55,30,${0.08 + 0.06 * Math.sin(i * 1.7)})`; g.fillRect(i, 0, 1, S);
    g.fillStyle = `rgba(255,240,210,${0.06 + 0.05 * Math.sin(i * 2.3)})`; g.fillRect(0, i, S, 1);
  }
  g.strokeStyle = '#' + C.seam.toString(16).padStart(6, '0'); g.lineWidth = 2;
  const stitches = (x0, y0, x1, y1, n) => { for (let k = 0; k < n; k++) { const t = (k + 0.5) / n, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t; g.beginPath(); g.moveTo(x - 4, y - 3); g.lineTo(x + 4, y + 3); g.stroke(); } };
  stitches(0, 8, S, 8, 24); stitches(S - 8, 0, S - 8, S, 24); // (a seam round the top and one down the back: u wraps)
  if (target) { // (the front is u 0.5: the middle of the canvas; drawn as an ellipse, narrow across, so it reads round on the sack)
    const cx = S * 0.5, cy = S * 0.56;
    for (const [r, col] of [[60, C.red], [46, C.cream], [32, C.red], [19, C.cream], [8, C.red]]) { g.fillStyle = '#' + col.toString(16).padStart(6, '0'); g.beginPath(); g.ellipse(cx, cy, r * 0.42, r, 0, 0, Math.PI * 2); g.fill(); }
    g.strokeStyle = '#' + C.sleeve.toString(16).padStart(6, '0'); g.lineWidth = 3; // (the spiral patches on its sides, as drawn)
    for (const [u, v, k] of [[0.22, 0.62, 1], [0.8, 0.78, 0.6]]) { g.beginPath(); for (let a = 0; a < Math.PI * 5; a += 0.12) { const r = (2 + a * 1.9) * k; const x = S * u + Math.cos(a) * r * 0.45, y = S * v + Math.sin(a) * r; a ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); }
  }
  if (face) { // the stitched X eyes (a big one and a small one, as drawn) and a stitched mouth
    g.strokeStyle = '#2a1d14'; g.lineWidth = 6; g.lineCap = 'round';
    const X = (x, y, s) => { g.beginPath(); g.moveTo(x - s, y - s); g.lineTo(x + s, y + s); g.moveTo(x + s, y - s); g.lineTo(x - s, y + s); g.stroke(); };
    X(S * 0.42, S * 0.46, 14); X(S * 0.6, S * 0.43, 9);
    g.lineWidth = 3; g.beginPath(); g.moveTo(S * 0.42, S * 0.64); g.lineTo(S * 0.6, S * 0.62); g.stroke();
    for (let k = 0; k < 5; k++) { const x = S * 0.43 + k * S * 0.04; g.beginPath(); g.moveTo(x, S * 0.6); g.lineTo(x + 2, S * 0.67); g.stroke(); }
  }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}
function cuffTexture() { // a cream spiral on charcoal
  const S = 128, cv = document.createElement('canvas'); cv.width = cv.height = S;
  const g = cv.getContext('2d');
  g.fillStyle = '#' + C.sleeve.toString(16).padStart(6, '0'); g.fillRect(0, 0, S, S);
  g.strokeStyle = '#' + C.cuff.toString(16).padStart(6, '0'); g.lineWidth = 5; g.beginPath();
  for (let a = 0; a < Math.PI * 6; a += 0.1) { const r = 4 + a * 2.6, x = S / 2 + Math.cos(a) * r, y = S / 2 + Math.sin(a) * r; a ? g.lineTo(x, y) : g.moveTo(x, y); }
  g.stroke();
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function heartShape() {
  const s = new THREE.Shape();
  s.moveTo(0, -0.05); s.bezierCurveTo(-0.07, 0.0, -0.06, 0.06, 0, 0.035); s.bezierCurveTo(0.06, 0.06, 0.07, 0.0, 0, -0.05);
  return s;
}

/** An angle brought into -pi..pi (a whole turn is no turn). */
const wrap = (a) => a - Math.PI * 2 * Math.round(a / (Math.PI * 2));

export class StrawmanModel {
  constructor() {
    const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.85, ...o });
    this.mats = [];
    const M = (m) => { this.mats.push(m); return m; };
    const root = this.group = new THREE.Group(); root.name = 'strawman';
    // the ball foot (stays on the floor); everything above rocks on it
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.19, 24, 16), M(std(C.lacquer, { roughness: 0.18, metalness: 0.1 })));
    ball.position.y = 0.19; root.add(ball);
    const turn = this.turn = new THREE.Group(); root.add(turn); // (the turn about the ball: its facing and a move's spin; the ball is round, so it stays)
    const rock = this.rock = new THREE.Group(); rock.position.y = 0.19; turn.add(rock); // (the pivot: the ball's centre)
    // the post: from the ball up behind the doll, banded, to the hat
    const postM = M(std(C.post, { roughness: 0.7 }));
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.06, 2.0, 10), postM); post.position.set(0, 1.0, -0.12); rock.add(post);
    for (const y of [0.24, 0.42]) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.05, 12), M(std(C.band, { roughness: 0.5, metalness: 0.3 }))); b.position.set(0, y, -0.12); rock.add(b); }
    // the hat: a tall block standing up behind the head, its top rim a lighter band
    const hatPivot = this.hatPivot = new THREE.Group(); hatPivot.position.set(0, 1.84, -0.16); rock.add(hatPivot); // (its base on the post: it nods there)
    const hat = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.48, 0.26), M(std(C.hat, { roughness: 0.6 })));
    hat.position.set(0, 0.24, 0); hat.rotation.z = 0.06; hatPivot.add(hat);
    const rim = new THREE.Mesh(new THREE.BoxGeometry(0.37, 0.05, 0.29), M(std(C.band, { roughness: 0.5 }))); rim.position.set(0, 0.24, 0); hat.add(rim);
    // the crossbar and its sleeves (charcoal, tapered, the cuffs flared with the cream spiral)
    // (the bar between the shoulders; each sleeve carries the rest of it, so a sleeve folded into the guard never leaves a bare stick out)
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.34, 8), postM); bar.rotation.z = Math.PI / 2; bar.position.set(0, 1.52, -0.1); rock.add(bar);
    const sleeveM = M(std(C.sleeve)), cuffM = M(std(0xffffff, { map: cuffTexture() }));
    this.arms = [];
    const halfG = new THREE.CylinderGeometry(0.03, 0.03, 0.68, 8); // (one geometry, both halves)
    for (const s of [-1, 1]) { // (each sleeve on its own shoulder: they fold into a guard, and one rises for the swing)
      const arm = new THREE.Group(); arm.position.set(s * 0.17, 1.5, -0.08); rock.add(arm); this.arms.push(arm);
      const half = new THREE.Mesh(halfG, postM); half.rotation.z = Math.PI / 2; half.position.set(s * 0.34, 0.02, -0.02); arm.add(half);
      const sl = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.19, 0.66, 12, 1, true), sleeveM); sl.material.side = THREE.DoubleSide; // (puffy, flaring to the cuff)
      sl.rotation.z = s * Math.PI / 2; sl.position.set(s * 0.33, 0, 0); arm.add(sl);
      const cuff = new THREE.Mesh(new THREE.CircleGeometry(0.2, 20), cuffM); cuff.position.set(s * 0.67, 0, 0); cuff.rotation.y = s * Math.PI / 2; arm.add(cuff);
      const lip = new THREE.Mesh(new THREE.TorusGeometry(0.195, 0.025, 6, 20), sleeveM); lip.position.copy(cuff.position); lip.rotation.y = s * Math.PI / 2; arm.add(lip);
    }
    this.mode = 'still'; this.pose = 0; // (the guard's weight 0..1)
    this.p = { ...REST }; this.want = { ...REST }; this.mv = null; this.yaw = 0; this.yawTo = 0; this.engaged = false; // (the pose as drawn, a move's under way, the facing)
    this.hatA = 0; this.hatV = 0; this.lastLean = 0; this.lastTilt = 0; // (the hat's own spring; the rock's last keyed lean, which swings the sack)
    // the sack: hangs on the bar, swings a beat behind (its own pivot at the neck)
    const sack = this.sack = new THREE.Group(); sack.position.set(0, 1.45, 0); rock.add(sack);
    const prof = []; for (let i = 0; i <= 14; i++) { const t = i / 14; prof.push(new THREE.Vector2(0.07 + 0.42 * Math.sin(Math.PI * Math.pow(t, 0.72)) * (1 - 0.3 * t), -BODY_H + t * BODY_H)); } // (a fat pear, as drawn: twice the head's width)
    this.bodyMat = M(std(0xffffff, { map: sackTexture({ target: true }), emissive: 0x000000 }));
    const body = new THREE.Mesh(new THREE.LatheGeometry(prof, 28), this.bodyMat); body.rotation.y = Math.PI; body.scale.set(1, 1, 0.85); sack.add(body); // (the lathe's u 0.5 is at -z: turned, the target faces +z, the front)
    this.body = body;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.23, 24, 16), M(std(0xffffff, { map: sackTexture({ face: true }) })));
    head.position.set(0.03, 0.24, 0.04); head.scale.set(1, 0.92, 0.9); head.rotation.set(0.05, -Math.PI / 2, -0.12); sack.add(head); this.head = head;
    // the cord and the heart
    const cord = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.008, 6, 24), M(std(0x1c1418))); cord.rotation.x = Math.PI / 2 - 0.35; cord.position.set(0, 0.0, 0.03); sack.add(cord);
    const heart = new THREE.Mesh(new THREE.ExtrudeGeometry(heartShape(), { depth: 0.02, bevelEnabled: true, bevelSize: 0.006, bevelThickness: 0.006, bevelSegments: 2 }), M(std(C.lacquer, { roughness: 0.15, metalness: 0.2 })));
    heart.position.set(0.04, -0.12, 0.2); heart.rotation.set(-0.15, 0, 0.2); sack.add(heart);
    // the legs: stubby stitched sacks hanging below
    for (const s of [-1, 1]) {
      const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.08, 4, 10), this.legMat ||= M(std(0xb39a72))); leg.position.set(s * 0.16, -BODY_H - 0.06, 0.06); leg.rotation.z = s * 0.15; sack.add(leg); // (stubby lumps)
      this.legs = (this.legs || []).concat(leg);
    }
    // straw at the seams: a few tufts at the neck and the cuffs, and the puffs a blow knocks out (a small pool of motes)
    this.puffs = new THREE.InstancedMesh(new THREE.BoxGeometry(0.012, 0.09, 0.012), M(std(C.straw, { roughness: 1 })), 60);
    this.puffs.frustumCulled = false; this.puffs.count = 0; root.add(this.puffs);
    this.motes = [];
    for (const m of this.mats) m.name ||= 'strawman';
    this.height = 2.45;
    // the rock: two angles (x, z) on a spring round the ball; the sack's swing: two more, softer, a beat behind
    this.a = new THREE.Vector2(); this.av = new THREE.Vector2(); this.s = new THREE.Vector2(); this.sv = new THREE.Vector2();
    this.flash = 0;
    // what strikes, each worn with the parry mark while its blow can be answered: a sleeve, the hat, or both sleeves at once (one mark
    // over the two: a stand-in outside the scene graph whose traverse visits both and whose frame is a point between the shoulders, so
    // the window's glint finds the higher cuff: vfx/parrymark.js reads only traverse, matrixWorld and worldToLocal)
    const mid = new THREE.Object3D(); mid.position.set(0, 1.6, -0.08); rock.add(mid);
    const both = new THREE.Object3D(); both.name = 'strawman-sleeves';
    both.traverse = (fn) => { fn(both); this.arms[0].traverse(fn); this.arms[1].traverse(fn); };
    both.updateWorldMatrix = () => { mid.updateWorldMatrix(true, false); both.matrixWorld.copy(mid.matrixWorld); };
    this.parts = { left: this.arms[0], right: this.arms[1], hat: hatPivot, both };
  }

  /** The mode F cycles (Dovina's, docs/plans/STRAWMAN.md): 'still', 'guard' (the sleeves fold into an X across its front: it blocks from
   *  the front), 'swing' (the room's clock plays the swing every 3 sim seconds: world/testroom/strawmanstrings.js). */
  setMode(m) { this.mode = m; }
  /** A move from the table (vfx/strawmanmoves.js), from its first frame: `onContact(blow, contact)` at each moment a blow's part meets
   *  the air in front (contact 0 is the strike; a spin's second sleeve is contact 1), `onEnd()` when it is back at rest. Its facing is
   *  held from here: the aim it was begun with is the aim it lands on. */
  play(id, { onContact = null, onEnd = null } = {}) {
    const M = STRAWMAN_MOVES[id]; if (!M) return false;
    const at = [];
    M.blows.forEach((B, blow) => [B.at, ...(B.also || [])].forEach((t, contact) => at.push({ t, blow, contact })));
    for (const K of M.kicks || []) at.push({ t: K.at, kick: K });
    at.sort((x, y) => x.t - y.t);
    this.mv = { id, M, t: 0, at, i: 0, mask: new Set(), onContact, onEnd };
    return true;
  }
  /** A blow a parry broke off: what it moved eases back to rest (MOVE_EASE). With `channels`, only those (the jab of a one-two, so the
   *  second blow still comes); without, the whole move. */
  breakOff(channels = null) {
    if (!this.mv) return;
    if (channels) for (const c of channels) this.mv.mask.add(c);
    else { this.mv = null; this.p.turn = wrap(this.p.turn); }
  }
  get playing() { return this.mv?.id ?? null; }

  /** Which ring of the target a world point is on (1 the bull's-eye, 2 and 3 the rings, 0 off the target). */
  ring(point) {
    const p = this.body.worldToLocal(point.clone()), d = Math.hypot(p.x, p.y - TARGET_Y); // (the body's own frame: its front is -z, turned)
    if (p.z > 0) return 0; // (round the back)
    return d < 0.07 ? 1 : d < 0.15 ? 2 : d < 0.23 ? 3 : 0;
  }

  /** A blow: it rocks away from it, the sack swings, the ring hit flashes, straw puffs out. `dir` the way the blow travels. */
  hit(point, dir, power = 1) {
    const k = Math.min(2, power);
    const local = this.turn.worldToLocal(point.clone().add(dir)).sub(this.turn.worldToLocal(point.clone())); // (in the rock's own frame: it is turned)
    this.av.x += local.z * 3.2 * k; this.av.y -= local.x * 3.2 * k; // (a push toward +z tips it about x: forward)
    this.sv.x += local.z * 4.5 * k; this.sv.y -= local.x * 4.5 * k;
    if (this.ring(point)) this.flash = 1;
    for (let i = 0; i < 6 + 6 * k; i++) {
      const v = new THREE.Vector3((Math.random() - 0.5) * 2, Math.random() * 2 + 0.5, (Math.random() - 0.5) * 2).add(dir.clone().multiplyScalar(1.5));
      this.motes.push({ p: this.group.worldToLocal(point.clone()), v, r: new THREE.Euler(Math.random() * 6, Math.random() * 6, 0), w: (Math.random() - 0.5) * 12, t: 0, life: 0.8 + Math.random() * 0.6 });
    }
    if (this.motes.length > 60) this.motes.splice(0, this.motes.length - 60);
  }

  update(raw = 1 / 60) {
    const dt = Math.min(raw, 0.05); // (the springs' step; a move's clock takes the whole frame, as the windup's does)
    // a move under way: its contacts and kicks as their moments pass, then its pose; a blow broken off eases back on its own
    const mv = this.mv, p = this.p, want = this.want;
    if (mv) {
      mv.t += raw;
      while (mv.i < mv.at.length && mv.at[mv.i].t <= mv.t) {
        const e = mv.at[mv.i++];
        if (e.kick) this.kick(e.kick); else mv.onContact?.(e.blow, e.contact);
        if (this.mv !== mv) break; // (a contact may end it)
      }
      if (this.mv === mv) poseAt(mv.M, mv.t, want);
      if (this.mv === mv && mv.t >= mv.M.end) { this.mv = null; Object.assign(want, REST); p.turn = wrap(p.turn); mv.onEnd?.(); }
    }
    const live = this.mv, k = 1 - Math.exp(-dt * MOVE_EASE);
    for (const c of CHANNELS) {
      if (live && !live.mask.has(c)) p[c] = want[c];
      else p[c] += (0 - p[c]) * k;
    }
    // the facing: turned toward yawTo between moves (a body turning on its ball, not a snap), held through one
    if (!live) { const d = wrap(this.yawTo - this.yaw); this.yaw = wrap(this.yaw + Math.sign(d) * Math.min(Math.abs(d), 5 * dt, Math.abs(d) * 8 * dt + 0.002)); }
    // the roly-poly: a stiff spring (the weight low in the ball) with a little damping, the swing softer and slower; the sack is also
    // swung by the keyed lean and tilt, a beat behind them (the follow-through), and the hat bounces on its own spring
    this.av.addScaledVector(this.a, -38 * dt).multiplyScalar(Math.exp(-dt * 3.2)); this.a.addScaledVector(this.av, dt);
    this.a.clampScalar(-0.75, 0.75);
    this.sv.x -= (p.lean - this.lastLean) * 2; this.sv.y -= (p.tilt - this.lastTilt) * 2; this.lastLean = p.lean; this.lastTilt = p.tilt;
    this.sv.addScaledVector(this.s, -16 * dt).addScaledVector(this.av, -0.4 * dt * 10).multiplyScalar(Math.exp(-dt * 2.2)); this.s.addScaledVector(this.sv, dt);
    this.s.clampScalar(-0.6, 0.6);
    this.hatV += -this.hatA * 320 * dt; this.hatV *= Math.exp(-dt * 5); this.hatA = THREE.MathUtils.clamp(this.hatA + this.hatV * dt, -0.5, 0.5);
    // the guard: the sleeves fold forward into an X across the front (and stay down while a string runs or a move is under way)
    this.pose += ((this.mode === 'guard' && !this.engaged && !live ? 1 : 0) - this.pose) * (1 - Math.exp(-dt * 8));
    const g = this.pose, GD = SLEEVES.guard;
    // (a sleeve on side s swings forward, toward +z, the way it faces, by rotation.y = -s * forward, and tips up by rotation.z = s * up.
    // The signs were the other way round, and the guard and the swing pointed backwards: the owner's T51, v133)
    const [L, R] = this.arms;
    L.position.z = -0.08 + g * GD.reach + p.lo; R.position.z = -0.08 + g * GD.reach + p.ro;
    L.rotation.set(0, g * GD.forward + p.lf, g * GD.tipL - p.lu);
    R.rotation.set(0, -g * GD.forward - p.rf, -g * GD.tipR + p.ru);
    L.scale.x = 1 + p.ls; R.scale.x = 1 + p.rs;
    this.turn.rotation.y = this.yaw + p.turn;
    this.rock.rotation.set(this.a.x + p.lean, 0, this.a.y + p.tilt);
    this.hatPivot.rotation.x = p.hat + this.hatA;
    this.head.rotation.x = 0.05 - p.look;
    this.sack.rotation.set(this.s.x * 0.7, 0, this.s.y * 0.7);
    for (const l of this.legs) l.rotation.x = -this.s.x * 1.4; // (the legs dangle after)
    const tell = p.tell > 0.01 ? p.tell * (0.5 + 0.5 * Math.sin((mv?.t ?? 0) * (mv?.M.pulse ?? 26))) : 0;
    this.bodyMat.color.setScalar(1 - 0.38 * p.dark); // (a held breath: the sack dims, its pulse gone dark)
    // the ring that was hit: a flash on the target, fading
    this.flash = Math.max(0, this.flash - dt * 2.5);
    this.bodyMat.emissive.setRGB(0.9, 0.35, 0.2).multiplyScalar(this.flash * 0.6);
    if (tell > 0) this.bodyMat.emissive.setRGB(1.0, 0.6, 0.1).multiplyScalar(0.35 * tell); // (a move's tell: amber, pulsing, on the whole sack)
    // the straw: falls, tumbles, and is gone
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), one = new THREE.Vector3(1, 1, 1);
    let n = 0;
    for (const s of this.motes) {
      s.t += dt; if (s.t > s.life) continue;
      s.v.y -= 6 * dt; s.v.multiplyScalar(Math.exp(-dt * 1.5)); s.p.addScaledVector(s.v, dt); if (s.p.y < 0.01) { s.p.y = 0.01; s.v.set(0, 0, 0); }
      s.r.x += s.w * dt; q.setFromEuler(s.r);
      this.puffs.setMatrixAt(n++, m.compose(s.p, q, one.setScalar(1 - Math.max(0, (s.t - s.life + 0.3) / 0.3))));
    }
    this.motes = this.motes.filter((s) => s.t <= s.life);
    this.puffs.count = n; this.puffs.instanceMatrix.needsUpdate = true;
  }

  /** A move's follow-through: an impulse to the rock's spring (`rock`, and `tip`, a push off upright), the sack's, the hat's. */
  kick(K) {
    if (K.rock) { this.av.x += K.rock[0]; this.av.y += K.rock[1]; }
    if (K.tip) { this.a.x += K.tip[0]; this.a.y += K.tip[1]; }
    if (K.sack) { this.sv.x += K.sack[0]; this.sv.y += K.sack[1]; }
    if (K.hat) this.hatV += K.hat;
  }

  dispose() {
    this.group.parent?.remove(this.group);
    this.group.traverse((o) => { o.geometry?.dispose?.(); });
    for (const m of this.mats) { m.map?.dispose?.(); m.dispose(); }
  }
}
