// ---------------------------------------------------------------------------------------
// THE NET (plain name; South, 2026-11-22: "the Dreamvane needs a Butterfly Net/Dreamcatcher mode with a very cool flowing articulated
// bubblewand net at the top of the staff. We're gonna be emulating the feel of Ape Escape 2 strongly in the hunting down and capturing of
// Figments. Stealth is going to become a big part of the identity of the Dreamvane"): a mode of the Dreamvane, Q while it is drawn.
//   - The dreamcatcher in the crook grows into a bubble wand: a brass hoop 0.26 m across the crook with a soap film stretched in it, and
//     under it a bag of the film's thread, 16 threads round and 6 knots down, hung from the hoop and swung in the world (Verlet, Jakobsen's
//     constraints), so it trails and billows behind every swing and sags at rest.
//   - LMB is the SWING (0.42 real s): the staff tipped forward and swept across in front of them (about the right hand, after the clip's
//     pose: the twirl's way, so no clip is changed). Through its middle, the hoop catches: a Figment within 1.25 m of it that is stunned, or
//     that never knew they were there (its mind's awareness of the Courier under 0.5, creatures/ai/memory.js), is caught whole into the
//     Pneuka Jar (game.bound.bind, from 'net': the bound spirits' one way in). One that knows of them DODGES: it is shoved aside and made
//     to flee (Ape Escape's monkeys: you sneak up, or you stun them first). The FOE, allies and training bodies are never caught.
//   - Q again, or putting the Dreamvane away, folds the net back into the dreamcatcher.
//   While the net is out, each Figment within 25 m wears its awareness lamp (vfx/awarelamps.js): the net is a stealth tool.
// Events: dreamvane.net { on, by }, dreamvane.netswing { by }, dreamvane.capture { kind, cls, stunned, by }, dreamvane.dodge { kind, by }.
//
// Prior art: Ape Escape 2's Time Net (the swing, the sneak, the siren's lamp over a monkey's head), Animal Crossing's and Pokémon's bug
// nets (the swing's arc), the bubble wand's soap film (thin-film interference), Thomas Jakobsen's position-based cloth (Hitman, 2001).
//
//   new DreamNet(dreamvane)   .on   .toggle()   .swing()   .bend(ch, M) (the swing's turn of the tool's matrix)   .update(dt)   NET
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { HOOK } from './model.js';
import { sfx } from '../../audio/sfx.js';

export const NET = { hoop: 0.26, round: 16, rows: 6, row: 0.085, swing: 0.42, catchAt: [0.28, 0.82], reach: 1.25, aware: 0.5, cool: 0.2, dodge: 5, key: 'KeyQ' };
const N = NET.round, R = NET.rows, TAU = Math.PI * 2;
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Vector3(), _f = new THREE.Vector3(), _l = new THREE.Vector3(), _u = new THREE.Vector3(0, 1, 0);
const _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _m = new THREE.Matrix4(), _t = new THREE.Matrix4();

// the film: thin-film interference by the view's angle (the hue turns as the soap's thickness does), nearly clear face on
const FILM_V = `varying vec3 vN; varying vec3 vV; varying vec2 vUv;
void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vN = normalize(mat3(modelMatrix) * normal); vV = cameraPosition - w.xyz; vUv = uv; gl_Position = projectionMatrix * viewMatrix * w; }`;
const FILM_F = `uniform float uTime; uniform float uFlash; uniform float uA; varying vec3 vN; varying vec3 vV; varying vec2 vUv;
void main(){ float c = abs(dot(normalize(vN), normalize(vV))); float th = 1.0 - c;
  float swirl = sin(vUv.x * 9.0 + uTime * 1.3) * 0.15 + sin(vUv.y * 13.0 - uTime * 0.9) * 0.12;
  vec3 film = 0.55 + 0.45 * cos(6.2832 * (th * 1.6 + swirl + vec3(0.0, 0.33, 0.67)));
  float a = (0.06 + 0.5 * pow(th, 1.6)) * uA; vec3 col = film * (0.8 + 0.6 * th) + uFlash * vec3(0.8, 0.95, 1.0);
  gl_FragColor = vec4(col, clamp(a + uFlash * 0.4, 0.0, 0.9)); }`;

export class DreamNet {
  constructor(tool) {
    this.tool = tool; this.game = tool.game; this.on = false; this.w = 0; this.swingT = -1; this.cool = 0; this.caught = new WeakSet(); this.flash = 0;
    this.uni = { uTime: { value: 0 }, uFlash: { value: 0 }, uA: { value: 1 } };
    const film = new THREE.ShaderMaterial({ uniforms: this.uni, vertexShader: FILM_V, fragmentShader: FILM_F, transparent: true, depthWrite: false, side: THREE.DoubleSide });
    // the hoop and its film, in the tool's frame at the crook (the dreamcatcher's place: model.js), so it turns with the staff
    const hoop = (this.hoop = new THREE.Group()); hoop.position.set(1.0, 0.11 * HOOK, 0); hoop.visible = false;
    const brass = new THREE.MeshStandardMaterial({ color: 0xd8b25a, metalness: 0.85, roughness: 0.3, emissive: 0x3a2a08 });
    hoop.add(new THREE.Mesh(new THREE.TorusGeometry(NET.hoop, 0.011, 6, 32), brass));
    const disc = new THREE.Mesh(new THREE.CircleGeometry(NET.hoop * 0.99, 32), film); hoop.add(disc);
    for (let i = 0; i < 8; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.016, 6, 4), brass); const a = (i / 8) * TAU; b.position.set(Math.cos(a) * NET.hoop, Math.sin(a) * NET.hoop, 0); hoop.add(b); }
    tool.model.group.add(hoop);
    // the bag: Verlet knots in the world, a ring of N at each of R+1 rows (row 0 is the hoop's own, pinned)
    this.p = new Float32Array((R + 1) * N * 3); this.o = new Float32Array((R + 1) * N * 3); this.set = false;
    const geo = (this.geo = new THREE.BufferGeometry()); geo.setAttribute('position', new THREE.BufferAttribute(this.p, 3));
    const uv = new Float32Array((R + 1) * N * 2); for (let r = 0; r <= R; r++) for (let i = 0; i < N; i++) { uv[(r * N + i) * 2] = i / N; uv[(r * N + i) * 2 + 1] = r / R; }
    geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    const idx = []; for (let r = 0; r < R; r++) for (let i = 0; i < N; i++) { const a = r * N + i, b = r * N + ((i + 1) % N), c = a + N, d = b + N; idx.push(a, c, b, b, c, d); }
    geo.setIndex(idx); geo.computeVertexNormals();
    this.bag = new THREE.Mesh(geo, film); this.bag.frustumCulled = false; this.bag.visible = false; this.game.scene.add(this.bag);
    const lines = []; for (let r = 0; r <= R; r++) for (let i = 0; i < N; i++) { const a = r * N + i; lines.push(a, r * N + ((i + 1) % N)); if (r < R) lines.push(a, a + N); }
    const lg = new THREE.BufferGeometry(); lg.setAttribute('position', geo.getAttribute('position')); lg.setIndex(lines);
    this.thread = new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: 0xcdb8f2, transparent: true, opacity: 0.75 })); this.thread.frustumCulled = false; this.thread.visible = false;
    this.game.scene.add(this.thread);
  }
  get swinging() { return this.swingT >= 0; }
  toggle() { if (this.on) this.end(); else this.begin(); }
  begin() { this.on = true; this.set = false; this.game.events?.emit('dreamvane.net', { on: true, by: 'courier' }); sfx.click?.(); }
  end() { if (!this.on) return; this.on = false; this.swingT = -1; this.game.events?.emit('dreamvane.net', { on: false, by: 'courier' }); }

  swing() {
    if (!this.on || this.swinging || this.cool > 0) return;
    this.swingT = 0; sfx.whoosh?.(1.1); this.game.events?.emit('dreamvane.netswing', { by: 'courier' });
  }

  /** The swing's turn of the placed matrix about the right hand (heldtool.js's twirl hook, before the off-body turn): the staff tipped
   *  forward and swept from their right to their left; at rest with the net out, tipped forward a little so the bag hangs before them. */
  bend(ch, M) {
    if (this.w < 0.01) return;
    const hand = ch.bones?.handR; if (!hand) return;
    const q = ch.root.getWorldQuaternion(_q); _f.set(0, 0, 1).applyQuaternion(q).setY(0).normalize(); _l.set(1, 0, 0).applyQuaternion(q).setY(0).normalize();
    const k = this.swinging ? Math.min(1, this.swingT / NET.swing) : -1, e = k < 0 ? 0 : k * k * (3 - 2 * k), arc = k < 0 ? 0 : Math.sin(k * Math.PI);
    const tip = (0.35 + 0.75 * arc) * this.w, yaw = k < 0 ? 0 : (1.25 - 2.5 * e) * this.w;
    _q.setFromAxisAngle(_l, tip); _q2.setFromAxisAngle(_u, yaw); _q2.multiply(_q);
    hand.getWorldPosition(_a);
    _m.makeRotationFromQuaternion(_q2); _t.makeTranslation(_a.x, _a.y, _a.z); _m.premultiply(_t); _t.makeTranslation(-_a.x, -_a.y, -_a.z); _m.multiply(_t);
    M.premultiply(_m);
  }

  update(dt) {
    const T = this.tool, g = this.game;
    if (this.on && (!T.held || !T.worn)) this.end();
    this.w = THREE.MathUtils.damp(this.w, this.on ? 1 : 0, 9, dt);
    this.cool -= dt; this.uni.uTime.value += dt; this.flash = Math.max(0, this.flash - dt * 2.5); this.uni.uFlash.value = this.flash;
    const shown = this.w > 0.03;
    this.hoop.visible = shown; this.bag.visible = this.thread.visible = shown; T.model.catcher.visible = !shown;
    this.hoop.scale.setScalar(0.3 + 0.7 * this.w); this.uni.uA.value = this.w;
    if (!shown) { this.set = false; return; }
    if (this.swinging) {
      this.swingT += dt; const k = this.swingT / NET.swing;
      if (k >= NET.catchAt[0] && k <= NET.catchAt[1]) this.sweep();
      if (k >= 1) { this.swingT = -1; this.cool = NET.cool; }
    }
    this.cloth(dt);
  }

  /** The hoop's catch this frame: what it meets is caught, or dodges. */
  sweep() {
    const g = this.game, B = g.bound, P = g.player; if (!B) return;
    this.hoop.getWorldPosition(_c);
    for (const c of g.creatures?.near?.(_c, NET.reach + 1) || []) {
      if (this.caught.has(c) || !B.catchable(c)) continue;
      c.center?.(_a) || _a.copy(c.pos).setY(c.pos.y + (c.height || 0.6) * 0.5);
      if (_a.distanceTo(_c) > NET.reach + (c.radius || 0.3)) continue;
      this.caught.add(c);
      const stunned = !!g.stun?.vulnerable?.(c), aware = c.brain?.memory?.fact?.(P)?.aware ?? 0;
      if (stunned || aware < NET.aware) {
        const e = B.bind(c, 'net', 'courier'); if (!e) continue;
        this.flash = 1; sfx.chime?.(0.9);
        g.events?.emit('dreamvane.capture', { kind: e.kind, cls: e.cls, stunned, by: 'courier' });
      } else {
        _b.copy(c.pos).sub(P.pos).setY(0).normalize().multiplyScalar(NET.dodge).setY(2.5);
        c.knock?.(_b); c.brain?.force?.('flee', 'net');
        g.events?.emit('dreamvane.dodge', { kind: c.kind, by: 'courier' });
      }
    }
  }

  /** The bag: Verlet knots, row 0 pinned to the hoop's rim, the rest under gravity and drag, kept to their neighbours' lengths. */
  cloth(dt) {
    const p = this.p, o = this.o, h = this.hoop, s = this.hoop.scale.x;
    h.updateMatrixWorld(true);
    const rim = (i, out) => out.set(Math.cos((i / N) * TAU) * NET.hoop, Math.sin((i / N) * TAU) * NET.hoop, 0).applyMatrix4(h.matrixWorld);
    // the hoop's facing, for where the bag hangs from it when first set
    _f.set(0, 0, -1).transformDirection(h.matrixWorld);
    if (!this.set) {
      for (let r = 0; r <= R; r++) for (let i = 0; i < N; i++) { rim(i, _a).addScaledVector(_f, r * NET.row * s).addScaledVector(_u, -r * NET.row * 0.5 * s); const j = (r * N + i) * 3; p[j] = o[j] = _a.x; p[j + 1] = o[j + 1] = _a.y; p[j + 2] = o[j + 2] = _a.z; }
      this.set = true;
    }
    const h2 = Math.min(dt, 1 / 30) ** 2, drag = 0.93;
    for (let r = 1; r <= R; r++) for (let i = 0; i < N; i++) {
      const j = (r * N + i) * 3;
      for (let a = 0; a < 3; a++) { const v = (p[j + a] - o[j + a]) * drag; o[j + a] = p[j + a]; p[j + a] += v; }
      p[j + 1] -= 6.5 * h2;
    }
    for (let i = 0; i < N; i++) { rim(i, _a); const j = i * 3; p[j] = _a.x; p[j + 1] = _a.y; p[j + 2] = _a.z; }
    for (let it = 0; it < 4; it++) {
      for (let r = 1; r <= R; r++) {
        const ring = 2 * Math.sin(Math.PI / N) * NET.hoop * (1 - 0.78 * (r / R)) * s, down = NET.row * s;
        for (let i = 0; i < N; i++) { this.keep(r * N + i, (r - 1) * N + i, down, r === 1); this.keep(r * N + i, r * N + ((i + 1) % N), ring, false); }
      }
    }
    this.geo.attributes.position.needsUpdate = true; this.geo.computeVertexNormals(); this.geo.computeBoundingSphere();
  }
  keep(a, b, len, pinB) {
    const p = this.p, ja = a * 3, jb = b * 3, dx = p[jb] - p[ja], dy = p[jb + 1] - p[ja + 1], dz = p[jb + 2] - p[ja + 2], d = Math.hypot(dx, dy, dz) || 1e-6;
    const k = (d - len) / d, wa = pinB ? 1 : 0.5, wb = pinB ? 0 : 0.5;
    p[ja] += dx * k * wa; p[ja + 1] += dy * k * wa; p[ja + 2] += dz * k * wa;
    p[jb] -= dx * k * wb; p[jb + 1] -= dy * k * wb; p[jb + 2] -= dz * k * wb;
  }
}
