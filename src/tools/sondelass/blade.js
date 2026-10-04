// ---------------------------------------------------------------------------------------
// BLADE MODE: hold RMB with the cutlass out and the world all but stops (a twentieth of its speed, and a low-passed hush under it),
// the frame closes to bars, and the blade is yours to place. The mouse turns a line of light through the thing you are locked to
// (its angle is the direction you last moved the mouse); LMB cuts along it, as many times as you like while the mind holds out, and
// what is cut comes apart in the slow air: every pot and every piece of a pot the line passes through is sliced by the same mesh
// slicer the slicer shell uses. A clapperjar has a bright line of its own (its Lachryma core is exposed along it): cut along THAT
// and the cut is a ZANDATSU: three cuts at once, the jar into chunks, the core (a cube of condensed Lachryma) taken and the mind
// refilled.
//
// Prior art, and what was taken:
//  - Metal Gear Rising: Revengeance's Blade Mode and Zandatsu: the near-stop, the cut angle set by the stick (here, the mouse) and shown
//    as a line through the target, a highlighted line on an enemy where the cut takes the core, the refill for a clean one. The time
//    is a request to the time service (core/time.js: `game.time.slow('blade', 0.05)`), so the same call slows anything else, and the
//    audio follows it.
//  - The plane through the target that contains the view ray and the line's direction, so the cut on the screen is exactly the line
//    on the screen: it appears edge-on as a line, and slices like a sheet.
//  - Fruit Ninja's chained cuts, and Superhot's time that only moves when you do (the blade is read in real seconds: `game.rawDt`).
// A CREATURE (creatures.js) is a mind, and a mind sees a blade coming: while it is itself, every cut is RESISTED (a ward, a ring barred
// across, flashes where the blade met it, and the blade rings off). Stunned (stun.js), asleep, held or melted, it is open: a cut lands
// in full, and its own bright line shows as a clapperjar's does; cut along that and the zandatsu takes it apart, and the pieces come
// undone into Lachryma, liquid and solid, drawn to the Courier (vfx/dissolve.js). A creature that cannot be cut at all (not
// 'sliceable') always resists.
// ---------------------------------------------------------------------------------------
import { ECON } from '../../progress/econ/table.js';
import * as THREE from 'three';
import { planeFrom } from '../slicing.js';
import { sfx } from '../../audio/sfx.js';
import { PALETTE, T } from '../../core/config.js';
import { hasTag } from '../../core/tags.js';

const SLOW = 0.05, DRAIN = 4, ENTER_MIN = 8, ZAN_TOL = 0.24, REACH = 1.6;
const _r = new THREE.Vector3(), _u = new THREE.Vector3(), _v = new THREE.Vector3(), _n = new THREE.Vector3(), _p = new THREE.Vector3(), _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Vector3();
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion();
const wrapPi = (a) => { a = a % Math.PI; return a < -Math.PI / 2 ? a + Math.PI : a > Math.PI / 2 ? a - Math.PI : a; }; // (a line has no direction: angles are mod pi)

export class BladeMode {
  constructor(cutlass) {
    this.cut = cutlass;
    this.active = false;
    this.k = 0;
    this.ang = 0; this.cursor = new THREE.Vector2(1, 0);
    this.target = null; this.pt = new THREE.Vector3(); this.size = 0.6;
    this.weak = 0; this.weakFor = null;
    this.cuts = 0; this.zan = 0; this.queue = []; this.swing = 0; this.swingKind = 0;
    const g = cutlass.game;
    // the line of the cut, drawn as a bar that faces the camera (so it is a line on the screen, whatever the camera does): bright at its
    // core, a soft glow around it, fading at its ends. The plane that actually cuts is worked out separately (`basis`).
    const mk = (color) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.ShaderMaterial({
        uniforms: { uColor: { value: new THREE.Color(color) }, uA: { value: 0 } },
        vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
        fragmentShader: `varying vec2 vUv; uniform vec3 uColor; uniform float uA;
          void main() {
            float x = abs(vUv.x * 2.0 - 1.0), y = abs(vUv.y * 2.0 - 1.0);
            float along = 1.0 - pow(x, 4.0);
            float core = smoothstep(0.075, 0.0, y);
            float glow = exp(-y * 5.5);
            gl_FragColor = vec4(uColor * (1.0 + 1.5 * core), uA * along * (0.16 * glow + 0.85 * core));
          }`,
        transparent: true, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false,
      }));
      m.renderOrder = 36; m.visible = false; m.frustumCulled = false;
      g.scene.add(m);
      return m;
    };
    this.guide = mk(0xfff1dc); // the line you cut along
    this.zline = mk(0xff5a3c); // the line that takes the core
  }
  get game() { return this.cut.game; }
  get P() { return this.cut.tool.P; }

  // ---------------------------------------------------------------- in and out
  canEnter() { return this.game.lachryma.available >= ENTER_MIN && !this.game.god?.controlling; }

  enter() {
    const g = this.game, P = this.P;
    this.active = true; this.cuts = 0; this.zan = 0;
    this.cursor.set(1, 0.001); this.ang = 0;
    g.time.slow('blade', SLOW);
    P.lookScale.blade = 0;
    // a target: what is locked to, or what is nearest the middle of the screen
    if (!g.lock.active) g.lock.acquire();
    this.pickTarget();
    g.cinema.frame('blade', { bars: 1, yaw: 0, pitch: -0.02, dist: 0.82, fov: -7, roll: 0, ease: 6 });
    sfx.bladeIn?.();
    g.events?.emit('blade.enter', { target: this.target?.type || 'none' });
  }

  exit(why = 'let go') {
    if (!this.active) return;
    const g = this.game;
    this.active = false;
    g.time.free('blade');
    g.cinema.free('blade');
    this.P.lookScale.blade = 1;
    this.guide.visible = false; this.zline.visible = false;
    sfx.bladeOut?.();
    g.events?.emit('blade.exit', { cuts: this.cuts, zandatsu: this.zan, why });
  }

  /** The thing the line goes through. */
  pickTarget() {
    const g = this.game;
    const t = g.lock.target;
    this.target = t || null;
    if (t) {
      g.lock.pointOf(t, this.pt);
      this.size = t.type === 'clapper' ? 0.5 : t.type === 'creature' ? (t.ref.height ?? 1) * 0.45 : Math.max(0.35, (t.ref.P?.height ?? 0.6) * 0.7);
      if (this.weakFor !== t.ref) { this.weakFor = t.ref; this.weak = (Math.random() - 0.5) * Math.PI * 0.8; } // (its line: a different angle for each)
    } else {
      // nothing locked: the line goes through where the crosshair points, a few metres out
      g.camera.getWorldPosition(_a); g.camera.getWorldDirection(_b);
      this.pt.copy(_a).addScaledVector(_b, 3.2);
      this.size = 0.8; this.weakFor = null;
    }
  }

  // ---------------------------------------------------------------- the frame (real time: `raw` seconds)
  update(dt, inp) {
    const g = this.game, P = this.P, raw = g.rawDt || dt;
    // the queued cuts of a zandatsu (and the frame's release), in real time: they play out even if blade mode is let go meanwhile
    for (let i = this.queue.length - 1; i >= 0; i--) { const q = this.queue[i]; q.t -= raw; if (q.t <= 0) { this.queue.splice(i, 1); q.fn(); } }
    if (!this.active) {
      this.k = Math.max(0, this.k - raw * 6);
      this.guide.visible = this.zline.visible = this.k > 0.02;
      return;
    }
    this.k = Math.min(1, this.k + raw * 7);
    // the mind pays for the time it holds
    const took = g.lachryma.drain(DRAIN * raw, 'blade');
    if (took < DRAIN * raw * 0.5 || !inp.isDown('Mouse2')) return this.exit(took < DRAIN * raw * 0.5 ? 'empty' : 'let go');
    // the mouse sets the line
    this.cursor.x += inp.dx * 0.006; this.cursor.y -= inp.dy * 0.006;
    if (this.cursor.length() > 1) this.cursor.setLength(1);
    if (this.cursor.length() > 0.3) {
      const want = wrapPi(Math.atan2(this.cursor.y, this.cursor.x));
      this.ang = wrapPi(this.ang + wrapPi(want - this.ang) * (1 - Math.exp(-raw * 18)));
    }
    this.hold = Math.max(0, (this.hold || 0) - raw);
    if (this.hold > 0) { /* (the cinematic holds where it was) */ }
    else if (!this.target || !g.lock.alive(this.target) || this.target.ref !== g.lock.target?.ref) { if (!g.lock.active) g.lock.acquire(); this.pickTarget(); } else g.lock.pointOf(this.target, this.pt);
    this.placeGuide();
    this.swing = Math.max(0, this.swing - raw * 3.2);
    if (inp.wasPressed('Mouse0')) this.doCut();
  }

  /** The screen-space line as a plane through the point that contains the view ray and the line's direction. */
  basis() {
    const cam = this.game.camera;
    _r.set(1, 0, 0).applyQuaternion(cam.quaternion); _u.set(0, 1, 0).applyQuaternion(cam.quaternion);
    cam.getWorldPosition(_a);
    const view = _v.copy(this.pt).sub(_a).normalize();
    return { line: (ang, out) => out.copy(_r).multiplyScalar(Math.cos(ang)).addScaledVector(_u, Math.sin(ang)), view };
  }

  placeGuide() {
    const B = this.basis();
    const show = (mesh, ang, len, op) => {
      const line = B.line(ang, _n), up = _p.crossVectors(line, B.view).normalize(); // (X = the line, Z = back toward the camera, so Y = Z x X)
      _m.makeBasis(line, up, B.view.clone().negate());
      mesh.quaternion.setFromRotationMatrix(_m);
      mesh.position.copy(this.pt);
      mesh.scale.set(len, 0.5, 1);
      mesh.material.uniforms.uA.value = op * this.k;
      mesh.visible = true;
    };
    const len = this.size * 3.4 + 1.2;
    show(this.guide, this.ang, len, 0.9);
    if (this.target?.type === 'clapper' || this.open(this.target)) show(this.zline, this.weak, len * 0.8, 0.7 + 0.25 * Math.sin(performance.now() * 0.004));
    else this.zline.visible = false;
  }

  /** A creature open to the blade: one that can be cut, and is in no state to see it coming (stun.js). */
  open(t) { return t?.type === 'creature' && hasTag(t.ref, 'sliceable') && !!this.game.stun?.vulnerable(t.ref); }

  /** The blade turned aside: a ward flashes where it met the creature, and it rings off. Nothing is cut. */
  resist(c, at, dir) {
    const g = this.game;
    g.glyphs?.pop('ward', at.clone(), { color: 0xffffff, size: 0.7, life: 0.7, float: 0.25, burst: true, ring: true });
    g.fx?.impact?.(at.clone(), dir.clone().negate(), { sparks: 10, dust: 0 });
    sfx.parry?.();
    this.P.shake = Math.max(this.P.shake, 0.2);
    c.mem?.see(g.player, 'courier', g.player.pos, 1); c.brain?.signal(); // (and it knows what tried)
    g.events?.emit('blade.resist', { kind: c.kind, why: hasTag(c, 'sliceable') ? 'aware' : 'uncuttable' });
  }

  // ---------------------------------------------------------------- the cut
  doCut() {
    const g = this.game, B = this.basis();
    if (!this.target && !g.breakables.items.size) return;
    const line = B.line(this.ang, _c.set(0, 0, 0)).clone(), nrm = new THREE.Vector3().crossVectors(line, B.view).normalize();
    const plane = planeFrom(nrm, this.pt);
    const onLine = Math.abs(wrapPi(this.ang - this.weak)) < ZAN_TOL;
    const isZan = (this.target?.type === 'clapper' || this.open(this.target)) && onLine;
    this.cuts++;
    this.swing = 1; this.swingKind = (this.swingKind + 1) % 3;
    g.time.pulse('cut', 0.012, 0.09, { release: 0.25 });
    _a.copy(this.pt).addScaledVector(line, -REACH * (0.6 + this.size)); _b.copy(this.pt).addScaledVector(line, REACH * (0.6 + this.size));
    g.fx.slash?.(_a.clone(), _b.clone(), line);
    sfx.slice();
    this.P.shake = Math.max(this.P.shake, 0.1);
    let pieces = 0;
    if (isZan && this.target.type === 'creature') pieces += this.zandatsuCreature(this.target.ref, line, nrm, B.view);
    else if (isZan) pieces += this.zandatsu(this.target.ref, line, nrm, B.view);
    else pieces += this.slicePlane(plane, line);
    g.events?.emit('blade.cut', { pieces, zandatsu: isZan });
  }

  /** Every pot and piece of a pot the plane goes through. */
  slicePlane(plane, dir) {
    const g = this.game, B = g.breakables;
    let n = 0;
    const ents = [...B.items, ...B.slices];
    for (const ent of ents) {
      if (!ent.alive && ent.type === 'breakable') continue;
      if (!ent.body || !ent.body.isValid?.() || ent.def?.trial) continue;
      const t = ent.body.translation();
      _p.set(t.x, t.y, t.z);
      if (_p.distanceTo(this.pt) > this.size * 2.4 + 0.8) continue;
      const half = (ent.size ?? 0.5) * 0.55;
      if (Math.abs(plane.n.dot(_p) - plane.d) > half) continue;
      const out = B.slice(ent, plane, dir);
      if (out?.length) n += out.length;
    }
    // (a creature the plane goes through: cut if it is open to it, the blade turned aside if not)
    for (const c of [...(g.creatures?.list || [])]) {
      if (!c.alive) continue;
      c.center(_p);
      if (_p.distanceTo(this.pt) > this.size * 2.4 + 0.8 || Math.abs(plane.n.dot(_p) - plane.d) > (c.radius ?? 0.5) + 0.2) continue;
      if (this.open({ type: 'creature', ref: c })) { g.creatures.strike(c, _p.clone(), dir, 3, 'sliced', 'courier'); n += 1; }
      else this.resist(c, _p.clone().addScaledVector(plane.n, 0), dir);
    }
    // (a clapper the line goes through, cut off the line: it falls apart in two)
    for (const c of [...g.clappers.list]) {
      if (!c.alive) continue;
      _p.copy(c.pos).setY(c.pos.y + 0.35);
      if (_p.distanceTo(this.pt) > 0.9 || Math.abs(plane.n.dot(_p) - plane.d) > 0.3) continue;
      g.clappers.hit(c, _p.clone(), dir, 1.2, 'sliced');
      n += 2;
    }
    return n;
  }

  /** A creature cut along its own line while it is open: three cuts, a beat apart, and its pieces come undone into Lachryma. */
  zandatsuCreature(c, line, nrm, view) {
    const g = this.game;
    this.zan++;
    const at = c.center(new THREE.Vector3());
    g.time.pulse('zandatsu', 0.008, 0.5, { release: 0.7 });
    this.hold = 1.3;
    g.cinema.frame('zandatsu', { bars: 1, yaw: 0.12, pitch: 0.03, dist: 0.95, fov: -22, roll: 0.02, ease: 8, ttl: 1.1 });
    sfx.zandatsu?.();
    // its body as it stands, in the world (the deformer's shape is the shader's: the cut is of the rest shape, which is near enough)
    c.root.updateMatrixWorld(true);
    const geo = c.body.geometry.clone().applyMatrix4(c.body.matrixWorld);
    const planes = [0, Math.PI / 3, -Math.PI / 3].map((da) => { const l = _u.copy(line).applyAxisAngle(view, da).clone(); return planeFrom(new THREE.Vector3().crossVectors(l, view).normalize(), at); });
    planes.forEach((pl, i) => this.queue.push({ t: 0.07 * i, fn: () => { const l = _u.copy(line).applyAxisAngle(view, [0, Math.PI / 3, -Math.PI / 3][i]).clone(); g.fx.slash?.(at.clone().addScaledVector(l, -1), at.clone().addScaledVector(l, 1), l); } }));
    this.queue.push({ t: 0.16, fn: () => {
      c.vanish?.('courier', 'zandatsu'); // (gone from the world without a burst: its body is the pieces now)
      g.dissolve?.cut(geo, planes, { centre: at, color: 0xd9b48a, worth: 8 + (c.stash || 0), mp: 10 });
      c.stash = 0;
      g.lachryma.gain?.(18);
      g.glyphs.pop('star', at.clone().setY(at.y + 0.6), { color: 0xd9c8ff, size: 1.0, burst: true, ring: true, life: 1.6 });
    } });
    g.events?.emit('creature.zandatsu', { kind: c.kind, by: 'courier' });
    return 6;
  }

  /** The clapperjar cut along its own line: three cuts, the jar into chunks, the core taken. */
  zandatsu(c, line, nrm, view) {
    const g = this.game;
    this.zan++;
    const at = new THREE.Vector3().copy(c.pos).setY(c.pos.y + 0.35);
    const s = T.clappers.scale * (1 + Math.min(8, c.stash) * 0.045);
    g.time.pulse('zandatsu', 0.008, 0.5, { release: 0.7 });
    this.hold = 1.3; // (the frame stays on the jar for the moment: no new target until it has been seen to fall)
    g.cinema.frame('zandatsu', { bars: 1, yaw: 0.12, pitch: 0.03, dist: 0.95, fov: -22, roll: 0.02, ease: 8, ttl: 1.1 }); // (a long lens on the jar: the cut, close)
    sfx.zandatsu?.();
    // the jar becomes a jar's worth of clay, sliceable, and is cut three times, a beat apart
    g.clappers.hit(c, at.clone(), line, 1.0, 'sliced', () => {
      const ent = g.breakables.spawn({ kind: 'clapper', scale: s, pos: [at.x, at.y - 0.35, at.z], yaw: c.heading, color: PALETTE.mid, proxy: true }); // (a proxy: the jar's own death has been counted; this is only its clay)
      ent.body.wakeUp();
      const cuts = [0, Math.PI / 3, -Math.PI / 3];
      cuts.forEach((da, i) => {
        this.queue.push({
          t: 0.07 * i, fn: () => {
            const l = _u.copy(line).applyAxisAngle(view, da).clone(), pl = planeFrom(new THREE.Vector3().crossVectors(l, view).normalize(), at);
            g.fx.slash?.(at.clone().addScaledVector(l, -0.9), at.clone().addScaledVector(l, 0.9), l);
            // (everything that is still there of the jar: the proxy while it is whole, its pieces after)
            const list = [...g.breakables.slices, ent].filter((e) => e && e.body && e.body.isValid?.() && (e.type === 'slice' || (e === ent && e.alive)));
            for (const e of list) {
              const t = e.body.translation();
              if (Math.hypot(t.x - at.x, t.y - at.y, t.z - at.z) > 1.2) continue;
              g.breakables.slice(e, pl, l);
            }
          },
        });
      });
    });
    // the core: what a jar is full of, taken
    this.queue.push({ t: 0.32, fn: () => {
      g.baubles?.spawn(at.clone(), 10 + c.stash);
      g.cubes?.burst?.(at.clone(), ECON.jelly.core + Math.min(6, c.stash), { from: 'zandatsu' });
      g.lachryma.gain?.(28);
      g.glyphs.pop('star', at.clone().setY(at.y + 0.5), { color: 0xffd76a, size: 1.0, burst: true, ring: true, life: 1.6 });
      g.fx.embers?.(at.clone(), 24);
    } });
    g.events?.emit('blade.zandatsu', { stash: c.stash });
    return 6;
  }
}
