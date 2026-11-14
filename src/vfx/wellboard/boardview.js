// ---------------------------------------------------------------------------------------
// THE WELL'S BOARD'S VIEW (docs/plans/WELL-BOARD.md 10; South, 2026-11-14: Mario Party's and Dokapon Kingdom's board in 3D space,
// "taken to a psychedelic esoteric extreme", "the Pneuka Jar as the player's boardgame piece"): the board drawn in a scene of its
// own in place of the world while its page is open (boot/frame.js draws it while `.active`, as it does the reading view's scene),
// through the game's own glow and grade. A DRAFT LOOK, a free hand's; it draws the rules' state and plays the rules' log, and
// decides nothing.
//
//   THE VOID     the sky dome (boardkit.js): the eye above, the Well's spiral below
//   THE RINGS    a wheel a floor (boardring.js), stacked down the shaft; the floor below is seen through the one you stand on
//   THE PIECE    your Pneuka Jar: the owner's model cloned and fired in your vessel's glazes (vfx/pneukajar/dress.js, as a guest's
//                Jar is), hopping pad to pad with a squash on each landing; a turned stand-in until the owner's model has loaded
//   THE DICE     your six in a tray before the camera, each its solid in its suit's ink; a click picks one (its reach rings the
//                pads), a second click on it throws it: it tumbles out over the Jar and its face is said big, then counts down a hop
//   THE TURN     the rules' log played as a queue of beats: the throw, each step, the landing, a piece of haul, a crack, a mend,
//                the fate die, the door, the way out. The page waits while it plays (`busy`).
//
// Prior art: Mario Party (the dice block's number over the head, the hop a space, the camera riding the piece), Dokapon Kingdom
// (the spinner's reach lit on the board), Super Mario Galaxy (a small body on a small world in a big sky), the reading view's
// scene (render/readingscene.js: a scene in place of the world, through game.post).
//
//   new WellBoardView(game, session)   .open()   .close()   .active   .busy   .play(logEntries)   .sync()   .render()   (boot/frame.js)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { clone as cloneSkinned } from 'three/addons/utils/SkeletonUtils.js';
import { BOARD, MOUTH } from '../../progress/wellboard/layout.js';
import { JarMaterials } from '../pneukajar/dress.js';
import { DEFAULT_LOOK } from '../../courier/vessel/glazes.js';
import { BoardRing, RING, ringY } from './boardring.js';
import { skyMaterial, toy, dieGeometry, DIE_COLOUR, PAD, textSprite, haloTex, tick } from './boardkit.js';

const CAM = { r: 25, h: 14, fov: 44, toJar: 0.55, ease: 3.2 };
const TRAY = { z: -11, y: 3.5, gap: 1.45, s: 0.44, pick: 0.64 }; // (along the top: the log and the Lachrimeter keep the bottom corners)
const BEAT = { hop: 0.2, plunge: 1.1, throw: 0.85, hold: 0.45, land: 0.22, haul: 0.4, crack: 0.45, slide: 0.55, fate: 0.9, out: 1.2 };
const JAR = { s: 2.3 }; // (the owner's Jar is small beside a pad: a piece should fill its space, as Mario Party's do)
const _v = new THREE.Vector3(), _a = new THREE.Vector3(), _b = new THREE.Vector3(), _ray = new THREE.Raycaster(), _ndc = new THREE.Vector2();
const ease = (k) => k * k * (3 - 2 * k), depthOf = (id) => (id === MOUTH ? 0 : +id.split('.')[0]);

export class WellBoardView {
  constructor(game, session) {
    this.game = game; this.B = session; this.active = false; this.rings = new Map(); this.q = []; this.now = null; this.t = 0; this.last = 0;
    this.yaw = -Math.PI / 2; this.camY = 0; this.shake = 0; this.left = null; this.built = false;
  }
  get busy() { return this.active && (this.q.length > 0 || !!this.now); }

  build() {
    if (this.built) return; this.built = true;
    const S = (this.scene = new THREE.Scene());
    this.camera = new THREE.PerspectiveCamera(CAM.fov, innerWidth / innerHeight, 0.1, 900);
    S.add(new THREE.HemisphereLight(0xcdb8ff, 0x2a1040, 0.75)); const key = new THREE.DirectionalLight(0xfff0d8, 1.0); key.position.set(4, 10, 5); S.add(key); // (the Jar's own materials are lit; the toy shading lights itself)
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(400, 48, 32), skyMaterial()); S.add(this.sky);
    // the piece
    this.piece = new THREE.Group(); this.piece.name = 'WellBoardPiece'; S.add(this.piece); this.squash = 0; this.squashV = 0;
    this.glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTex(), color: 0xffd36a, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false })); this.glow.scale.set(3.4, 3.4, 1); this.glow.position.y = 0.9; this.piece.add(this.glow);
    this.number = textSprite(); S.add(this.number.sprite);
    // the dice
    this.dice = BOARD.dice.map((sides, i) => {
      const mesh = new THREE.Mesh(dieGeometry(sides), toy({ color: DIE_COLOUR[sides], film: 0.2, flat: true })); mesh.userData.sides = sides; S.add(mesh);
      const label = textSprite(); label.set(`d${sides}`, '#fff1d6'); label.sprite.scale.set(0.9, 0.45, 1); label.sprite.visible = true; S.add(label.sprite); mesh.userData.label = label.sprite;
      return { sides, i, mesh, spent: false, s: TRAY.s, fly: null, spin: new THREE.Vector3(0.6 + i * 0.13, 0.9 - i * 0.07, 0.3) };
    });
    // motes
    this.motes = [...Array(56)].map(() => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTex(), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })); s.visible = false; S.add(s); return { s, v: new THREE.Vector3(), life: 0, dur: 1 }; });
    this.onDown = (e) => this.pointer(e);
  }

  /** Your Pneuka Jar as the piece: the owner's model in your glazes, or a turned stand-in while it has not loaded. */
  makePiece() {
    if (this.jar) return;
    const g = this.game, V = g.god?.jar || g.realm?.god?.jar, src = V?.group?.children?.[0];
    try {
      if (src && V.jarMat && V.jarBody) {
        const model = cloneSkinned(src), body = V.jarBody.geometry; let core = g.pneukaJarLook?.core?.geometry || null;
        if (!core) V.group.traverse((o) => { if (o.isSkinnedMesh && o.material === V.coreMat) core = o.geometry; });
        const drop = []; model.traverse((o) => { if (o.isSprite || (o.isMesh && o.geometry !== body && o.geometry !== core)) drop.push(o); });
        for (const o of drop) o.parent?.remove(o); // (only the clay and its gems: the god hand's halo and cracks stay the god hand's)
        this.mats = new JarMaterials(V.jarMat.map); const M = this.mats.m;
        model.traverse((o) => { if (o.isMesh) { o.material = o.geometry === core ? M.stones : [M.body, M.trim, M.mask]; o.frustumCulled = false; } if (o.isSkinnedMesh) o.skeleton.pose(); }); // (its bind pose: the god hand's clips own the original's squash and scale, and a clone is taken mid-clip)
        this.mats.dress(g.vessel?.look || DEFAULT_LOOK, g.vessel?.glazeOf ? (id) => g.vessel.glazeOf(id) : undefined);
        model.scale.setScalar(1); model.position.set(0, 0, 0); model.rotation.set(0, 0, 0); model.visible = true;
        this.jar = model; this.jar.userData.owner = true;
      }
    } catch (e) { this.jar = null; }
    if (!this.jar) { // (the stand-in: a jar turned on a lathe, in the toy shading)
      const pts = [[0, 0], [0.34, 0], [0.42, 0.08], [0.5, 0.4], [0.44, 0.74], [0.24, 0.95], [0.22, 1.05], [0.3, 1.12], [0.0, 1.12]].map(([x, y]) => new THREE.Vector2(x, y));
      this.jar = new THREE.Mesh(new THREE.LatheGeometry(pts, 28), toy({ color: 0xc8552e, film: 0.15 }));
    }
    const hold = new THREE.Group(); hold.add(this.jar); hold.scale.setScalar(JAR.s); this.hold = hold; this.piece.add(hold);
  }

  open() {
    this.build(); this.makePiece();
    for (const R of this.rings.values()) R.dispose(); this.rings.clear();
    this.q.length = 0; this.now = null; this.left = null; this.number.sprite.visible = false; this.ended = false;
    this.active = true; this.last = performance.now(); this.sync(true);
    const P = this.where(this.B.S.seats[0].at); this.yaw = Math.atan2(P.z, P.x); this.camY = P.y;
    removeEventListener('pointerdown', this.onDown, true); addEventListener('pointerdown', this.onDown, true);
  }
  close() { if (!this.active) return; this.active = false; removeEventListener('pointerdown', this.onDown, true); }

  ring(depth) {
    const S = this.B.S, F = S.floors[depth]; if (!F) return null;
    let R = this.rings.get(depth);
    if (!R) { R = new BoardRing(F, depth, { need: BOARD.need, mouth: depth === 0 ? S.mouth : null }); this.rings.set(depth, R); this.scene.add(R.group); R.sync(S); }
    return R;
  }
  where(id, out = new THREE.Vector3()) { return this.ring(depthOf(id))?.at(id, out) || out.set(0, 0, 0); }

  /** The rules' state worn at once: every laid floor a ring, the pads' states, the dice spent, the Jar where its seat stands. */
  sync(place = false) {
    const S = this.B.S; if (!S || !this.built) return;
    for (const F of S.floors) this.ring(F.depth)?.sync(S);
    const me = S.seats[0]; for (const d of this.dice) d.spent = me.spent.includes(d.sides);
    if (place) { this.where(me.at, this.piece.position); this.at = me.at; }
    this.reach();
  }
  /** The picked die's reach (or the waiting decision's landings) ringed on the pads. */
  reach() {
    const B = this.B, R = B.readout?.(), P = R?.pending, map = {};
    if (R && !this.busy && !B.done) {
      const pick = P?.kind === 'throw' ? R.dice.find((d) => d.sides === B.hover && !d.spent) : null;
      const src = pick ? pick.reach : P?.kind === 'reroll' ? P.reach.filter((f) => f.face === P.face) : P?.kind === 'fork' ? P.moves.map((m) => ({ lands: m.lands })) : [];
      for (const f of src) for (const l of f.lands) map[l.id] = Math.min(1, (map[l.id] || 0) + 1 / Math.max(1, src.length));
    }
    for (const R2 of this.rings.values()) R2.reach(map);
  }

  // ------------------------------------------------------------------ the turn, played
  /** The rules' log since the last look, as beats. Only your seat's are drawn. */
  play(entries) {
    if (!this.active) return;
    const Q = this.q, push = (dur, o = {}) => Q.push({ dur, ...o });
    for (const x of entries) {
      if (x.throw === 0) { const d = this.dice.find((y) => y.sides === x.sides); push(BEAT.throw, { start: () => this.throwStart(d), tick: (k) => this.throwTick(d, k), end: () => this.throwEnd(d, x.face) }); push(BEAT.hold); }
      else if (x.step === 0) { const cross = depthOf(x.at) !== depthOf(this.qAt ?? this.at); this.qAt = x.at; push(cross ? BEAT.plunge : BEAT.hop, { start: (b) => this.hopStart(b, x.at, cross), tick: (k, b) => this.hopTick(b, k), end: (b) => this.hopEnd(b, x.left) }); }
      else if (x.shift === 0) { this.qAt = x.to; push(BEAT.slide, { start: (b) => this.hopStart(b, x.to, false, 3.2), tick: (k, b) => { this.hopTick(b, k); this.hold.rotation.y += 0.5; }, end: (b) => this.hopEnd(b, null) }); }
      else if (x.land === 0) push(BEAT.land, { start: () => { this.number.sprite.visible = false; this.burst(this.piece.position, PAD[x.kind]?.color ?? 0xffffff, 8, 3); } });
      else if (x.haul === 0 && x.tier != null) push(BEAT.haul, { start: () => { this.say('+1', '#ffd36a'); this.burst(this.piece.position, 0xffd36a, 16, 5, 4); this.sync(); }, end: () => { this.number.sprite.visible = false; } });
      else if (x.crack === 0) push(BEAT.crack, { start: () => { this.shake = 0.6; this.say('CRACK', '#ff4a4a'); this.burst(this.piece.position, 0xff2a2a, 18, 6); }, end: () => { this.number.sprite.visible = false; } });
      else if (x.mend === 0 || x.back === 0) push(BEAT.haul, { start: () => { this.burst(this.piece.position, 0x1fd6b4, 14, 3, 4); this.sync(); } });
      else if (x.recast === 0) push(0.3, { start: () => { for (const d of this.dice) d.spent = false; this.burst(this.trayAt(2.5, _a), 0xffffff, 14, 4); } });
      else if (x.fate === 0) push(BEAT.fate, { start: () => { this.say(String(x.face).padStart(2, '0'), x.saved ? '#7dffb0' : '#ff4a4a'); this.burst(this.piece.position, x.saved ? 0x7dffb0 : 0xff2a2a, 10, 4); }, end: () => { this.number.sprite.visible = false; } });
      else if (x.failed === 0 || x.foe === 0) push(0.15, { start: () => this.sync() });
      else if (x.out === 0 || x.fall === 0) { const how = x.fall === 0 ? 'fall' : x.how; if (!this.ended) { this.ended = true; push(BEAT.out, { start: (b) => { b.from = this.piece.position.clone(); this.burst(this.piece.position, how === 'fall' ? 0xff2a2a : 0xffd36a, 30, 7, how === 'fall' ? 0 : 6); }, tick: (k, b) => { this.piece.position.y = b.from.y + (how === 'fall' ? -1 : 1) * ease(k) * 16; this.hold.rotation.y += 0.4; } }); } }
    }
    this.reach();
  }
  say(text, colour) { this.number.set(text, colour); this.number.sprite.visible = true; }
  throwStart(d) { d.spent = true; d.fly = { from: this.trayAt(d.i, new THREE.Vector3()), k: 0 }; this.number.sprite.visible = false; }
  throwTick(d, k) { d.fly.k = k; }
  throwEnd(d, face) { d.fly = null; this.left = face; this.say(String(face), '#' + new THREE.Color(DIE_COLOUR[d.sides]).getHexString()); this.burst(_a.copy(this.piece.position).setY(this.piece.position.y + 3.4), DIE_COLOUR[d.sides], 14, 5); }
  hopStart(b, to, cross, high = 1.5) { b.from = this.piece.position.clone(); b.to = this.where(to, new THREE.Vector3()); b.high = cross ? 3 : high; this.at = to; const dx = b.to.x - b.from.x, dz = b.to.z - b.from.z; if (dx * dx + dz * dz > 0.01) this.hold.rotation.y = Math.atan2(dx, dz); this.sync(); }
  hopTick(b, k) { const e = ease(k); this.piece.position.lerpVectors(b.from, b.to, e); this.piece.position.y += Math.sin(Math.PI * k) * b.high; }
  hopEnd(b, left) { this.piece.position.copy(b.to); this.squashV = -7; this.burst(b.to, 0xfff1d6, 5, 2); if (left != null) { if (left > 0) this.say(String(left), '#ffffff'); else this.number.sprite.visible = false; } }

  burst(at, colour, n = 10, speed = 4, up = 1.5) {
    let made = 0;
    for (const m of this.motes) { if (m.life > 0 || made >= n) continue; made++;
      m.s.position.copy(at); m.s.position.y += 0.4; m.v.set((Math.random() - 0.5) * speed, Math.random() * speed * 0.6 + up, (Math.random() - 0.5) * speed);
      m.life = m.dur = 0.5 + Math.random() * 0.5; m.s.material.color.setHex(colour); m.s.visible = true; m.size = 0.5 + Math.random() * 0.6; }
  }
  /** A tray slot's place in the world, before the camera. */
  trayAt(i, out) { return this.camera.localToWorld(out.set((i - 2.5) * TRAY.gap, TRAY.y, TRAY.z)); }

  /** A click in the view: a die picked, and thrown on its second click. */
  pointer(e) {
    if (!this.active || e.target?.closest?.('.im') || this.busy || this.B.done) return;
    const P = this.B.pending(); if (P?.kind !== 'throw') return;
    _ndc.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); this.frame(); this.camera.updateMatrixWorld(); _ray.setFromCamera(_ndc, this.camera);
    const hit = _ray.intersectObjects(this.dice.filter((d) => !d.spent).map((d) => d.mesh), false)[0]; if (!hit) return;
    const sides = hit.object.userData.sides; e.preventDefault(); e.stopPropagation();
    if (this.B.hover === sides) this.B.take({ id: 'throw', sides }); else { this.B.hover = sides; this.B.render(); }
  }

  /** The camera's frame: the page set aside at the right, so the view's middle is moved left of it (the cooking stage's way). */
  frame() {
    const W = innerWidth, H = innerHeight, im = document.querySelector('#indexmenu.open[data-aside] .im'), pw = im ? im.getBoundingClientRect().width + 24 : 0;
    this.camera.aspect = W / H; if (pw && pw < W * 0.6) this.camera.setViewOffset(W, H, pw / 2, 0, W, H); else this.camera.clearViewOffset(); this.camera.updateProjectionMatrix();
  }

  update(dt) {
    const t = (this.t += dt); tick(t);
    // the queue
    let left = dt;
    while (left > 0 && (this.now || this.q.length)) {
      if (!this.now) { this.now = this.q.shift(); this.now.t = 0; this.now.start?.(this.now); }
      const b = this.now, use = Math.min(left, b.dur - b.t); b.t += use; left -= use; b.tick?.(b.dur > 0 ? Math.min(1, b.t / b.dur) : 1, b);
      if (b.t >= b.dur - 1e-6) { b.end?.(b); this.now = null; if (!this.q.length) { this.qAt = null; this.sync(!this.ended); this.B.render(); } } else break;
    }
    // the piece: a squash on landing, a breath at rest
    this.squashV += (-this.squash * 90 - this.squashV * 9) * dt; this.squash += this.squashV * dt;
    const sq = THREE.MathUtils.clamp(this.squash, -0.45, 0.45); this.hold.scale.set(JAR.s * (1 - sq * 0.6), JAR.s * (1 + sq), JAR.s * (1 - sq * 0.6));
    this.glow.material.opacity = 0.22 + 0.08 * Math.sin(t * 2.2);
    if (!this.busy) this.hold.position.y = Math.abs(Math.sin(t * 2.4)) * 0.12; else this.hold.position.y = 0;
    this.number.sprite.position.copy(this.piece.position).y += 5.4 + Math.sin(t * 6) * 0.08;
    // the camera rides the piece round the wheel
    const p = this.piece.position, want = Math.atan2(p.z, p.x); let d = want - this.yaw; d = Math.atan2(Math.sin(d), Math.cos(d));
    const k = Math.min(1, dt * CAM.ease); this.yaw += d * k * 0.8; this.camY += (ringY(depthOf(this.at ?? MOUTH)) - this.camY) * k;
    this.shake = Math.max(0, this.shake - dt * 1.6);
    const sh = this.shake * this.shake, C = this.camera;
    C.position.set(Math.cos(this.yaw) * CAM.r + (Math.random() - 0.5) * sh, this.camY + CAM.h + (Math.random() - 0.5) * sh, Math.sin(this.yaw) * CAM.r);
    C.lookAt(_v.set(p.x * CAM.toJar, this.camY + 0.5 + (p.y - this.camY) * 0.3, p.z * CAM.toJar)); C.updateMatrixWorld();
    this.sky.position.copy(C.position); this.sky.material.uniforms.uDepth.value = -this.camY / RING.drop;
    // the rings, the dice, the motes
    for (const R of this.rings.values()) R.update(t, dt);
    const pick = this.B.pending()?.kind === 'throw' && !this.busy ? this.B.hover : null;
    for (const D of this.dice) {
      const m = D.mesh, home = this.trayAt(D.i, _a), on = pick === D.sides && !D.spent, want2 = D.spent && !D.fly ? TRAY.s * 0.55 : on ? TRAY.pick : TRAY.s;
      D.s += (want2 - D.s) * Math.min(1, dt * 12);
      if (D.fly) { const k2 = D.fly.k, over = _b.copy(this.piece.position); over.y += 4.4; m.position.lerpVectors(D.fly.from, over, ease(k2)); m.position.y += Math.sin(Math.PI * k2) * 3; m.rotation.x += dt * 17; m.rotation.z += dt * 13; m.scale.setScalar(TRAY.s + k2 * 0.5); }
      else { m.position.copy(home); if (on) m.position.addScaledVector(_b.set(0, 1, 0).applyQuaternion(C.quaternion), 0.35 + Math.sin(t * 5) * 0.06); const w = on ? 2.4 : D.spent ? 0.15 : 0.7; m.rotation.x += D.spin.x * w * dt; m.rotation.y += D.spin.y * w * dt; m.scale.setScalar(D.s); }
      const u = m.material.uniforms; u.uDim.value += ((D.spent && !D.fly ? 0.9 : 0) - u.uDim.value) * Math.min(1, dt * 8); u.uGlow.value = on ? 0.7 : 0; u.uFilm.value = on ? 0.7 : 0.2;
      const lb = m.userData.label; lb.position.copy(home).addScaledVector(_b.set(0, -1, 0).applyQuaternion(C.quaternion), 0.8); lb.material.opacity = D.spent ? 0.3 : 1;
    }
    for (const m of this.motes) { if (m.life <= 0) continue; m.life -= dt; if (m.life <= 0) { m.s.visible = false; continue; } m.v.y -= 6 * dt; m.s.position.addScaledVector(m.v, dt); const k3 = m.life / m.dur; m.s.material.opacity = k3; m.s.scale.setScalar(m.size * (0.4 + k3)); }
  }

  render() {
    const B = this.B, menu = B.menu;
    if (!menu?.open || menu.page?.name !== 'well.board' || !B.S) { this.close(); return false; }
    const now = performance.now(), dt = this.fixedDt ?? Math.min(0.05, (now - this.last) / 1000); this.last = now; // (`fixedDt`: a shot script's own clock)
    this.frame(); this.update(dt);
    this.game.post.render(this.scene, this.camera);
    return true;
  }
}
