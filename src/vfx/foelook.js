// ---------------------------------------------------------------------------------------
// THE GREAT SLIP JELLY'S WINDUPS: the fight read from the body (the owner, 2026-10-07: one difficulty, no floor markers, "the body's
// windup is the telegraph"; docs/plans/DUNEMAW-EXTREME.md; the casts' ids and windups: progress/combat/greatjelly.js CASTS). The log
// names a cast as it begins; this is what the body does from then to the blow, so a player who has learnt the fight reads it from the
// jelly alone. Each windup is one plain shape of the body, told apart at a glance:
//
//   crownBash   LIDFALL      it rears up tall and leans back, a glow climbing it: the lunge is coming (the parry's outline is the bus's)
//   brineLine   SHOULDER     it crouches and leans in, sand kicked up behind it (and the crown's own tell: UrnCrown.tell)
//   gelidRings  RINGS        it spreads wide and quivers, a ring of slip spikes rising round its foot; its crown TILTS out or in: the order
//   oozeRain    SLIP TRAIL   three beads of slip swell on its back, one for each drop
//   crownGlare  EYE CUP      an eye opens on the urn (the Greek eye-cup that stares back), its iris lit
//   slipNova    BLOWOUT      it swells and light presses out of it in cracks, brighter to a flash
//   sinkingSands CENTRING    it sinks a little and the sand round it spirals in, as clay is centred on a wheel
//   brineCascade DECANT      it leans toward you and its front swells into a lip, as a jug tips to pour
//   broodCall   BROODWAKE    it throbs, a violet pulse going out of it on every beat
//   calving     SHERDS       four seams of light run down it, quartering it; calve() the split: its calves wear sherds of the urn,
//                            and threads of slip between them tighten as the half-minute runs out (mend(k)): left alive, they re-merge
//   overflow    THE OVERFLOW slip pours off it, and the dish floods from the centre outward (overflow(k)): only the islands stand
//
// Prior art: Monster Hunter's tells (a monster rears, crouches, swells: the body says the move), FFXIV's cast bars (the name before the
// blow) without its floor markers (the owner's cut), Shadow of the Colossus' colossi (the body as the read), Okami's and the potter's
// wheel (centring), the Greek eye-cup (apotropaic eyes on a kylix), and kintsugi read backwards (the sherds held by threads).
//
// ITS SIZE: the Great Slip Jelly's body stands 21 m, 27.8 m with its crown (the owner, 2026-10-09: "about 12 Couriers tall"; its scale
// is the fight's, FOE.size in progress/combat/dunemaw.js). What is drawn in the body's space grows with it; the particles thrown here
// were drawn for the 2.4 m body it was, and grow as big things move (Froude scaling, the miniature effects' rule, taken from the
// model makers of Thunderbirds and the Toho kaiju films, who overcranked by the square root of the scale: sizes by k, speeds and times
// by √k, gravity left real), so a 21 m body's slip falls slow and heavy instead of a toy's quick spray.
//
//   const L = new FoeLook({ root, crown, fx, floor: { center, radius, depth } })   L.windup(cast, k 0..1, { order: 'out'|'in' })
//   L.blow(cast)   L.calve(calfRoots)   L.mend(k 0..1)   L.overflow(k 0..1)   L.update(rawDt)   L.dispose()
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { LAB_GLSL, mindTime } from './labradorite.js';
import { slipMaterial, froude } from './cavekit.js';

const REF_H = 2.4; // (the body's height, crown off, the particles below were drawn at: a class-2 slip jelly, 1.5 m x1.6)

// each windup as a shape of the body: stretch (y), spread (xz), lean (forward + / back -), glow, and its glow's pattern
const SHAPE = {
  crownBash: { y: 1.28, xz: 0.9, lean: -0.32, glow: 0.8, pat: 0, col: 0xffc65c },
  brineLine: { y: 0.82, xz: 1.08, lean: 0.28, glow: 0.2, pat: 0, col: 0xffc65c },
  gelidRings: { y: 0.8, xz: 1.22, lean: 0, glow: 0.35, pat: 0, col: 0x9ad8e8, quiver: 1 },
  oozeRain: { y: 1.05, xz: 1, lean: 0, glow: 0.2, pat: 0, col: 0xd9c8ff },
  crownGlare: { y: 1.08, xz: 0.96, lean: -0.08, glow: 0.15, pat: 0, col: 0xffffff },
  slipNova: { y: 1.18, xz: 1.18, lean: 0, glow: 1.2, pat: 2, col: 0xe8dcff, quiver: 0.6 },
  sinkingSands: { y: 0.78, xz: 1.1, lean: 0, glow: 0.2, pat: 0, col: 0xd9c8ff },
  brineCascade: { y: 1.0, xz: 1.0, lean: 0.36, glow: 0.3, pat: 0, col: 0x9ad8e8 },
  broodCall: { y: 1.06, xz: 1.06, lean: 0, glow: 0.5, pat: 3, col: 0xb49be6 },
  calving: { y: 1.0, xz: 1.08, lean: 0, glow: 0.9, pat: 1, col: 0xffe2a0, quiver: 0.4 },
  overflow: { y: 0.9, xz: 1.15, lean: 0, glow: 0.6, pat: 2, col: 0xb49be6, quiver: 0.3 },
};

const SHELL_V = /* glsl */`varying vec3 vN, vW, vP; void main() { vP = position; vN = normalize(mat3(modelMatrix) * normal); vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;
const SHELL_F = /* glsl */`varying vec3 vN, vW, vP; uniform float uK, uT, uPat; uniform vec3 uC;
${LAB_GLSL}
void main() {
  vec3 V = normalize(cameraPosition - vW); float f = 1.0 - abs(dot(V, vN)), a = atan(vP.z, vP.x);
  float rim = pow(f, 3.0) * 0.5;                                                                            // (a glow from inside, at its edges)
  float seams = (1.0 - smoothstep(0.0, 0.06, abs(sin(a * 2.0)))) * step(0.5, uPat) * step(uPat, 1.5);        // (four seams, quartering it)
  float cracks = (1.0 - smoothstep(0.0, 0.08, abs(sin(a * 5.0 + vP.y * 7.0) + 0.4 * sin(vP.y * 13.0 + a * 3.0)))) * step(1.5, uPat) * step(uPat, 2.5);
  float pulse = step(2.5, uPat) * smoothstep(0.6, 1.0, sin(uT * 7.0 - length(vP) * 6.0));                  // (a beat going out of it)
  float k = uK * (rim + 1.6 * seams + 1.4 * cracks + 0.8 * pulse);
  gl_FragColor = vec4(mix(uC, labradorite(vP.y * 0.8 + uMindT * 0.2), 0.35) * k * 0.6, 1.0);
}`;

export class FoeLook {
  constructor({ root, crown = null, fx = null, floor = null, size = null } = {}) {
    this.root = root; this.crown = crown; this.fx = fx; this.floor = floor; this.t = 0;
    root.rotation.order = 'YXZ'; // (its yaw first, then the lean about its own x: so it leans the way it faces)
    this.base = { scale: root.scale.clone(), rx: root.rotation.x, rz: root.rotation.z };
    // its size, from the body as it stands (the crown left out: Box3.setFromObject counts hidden meshes too, so the crown's subtree is
    // skipped by hand; counted, the urn made the shell a bubble 40% wider than the body and hid the beads inside the urn)
    if (!size) {
      root.updateWorldMatrix(true, true);
      const skip = crown?.group, b = new THREE.Box3(), bb = new THREE.Box3(), ws = root.getWorldScale(new THREE.Vector3());
      const walk = (o) => { if (o === skip) return; if (o.isMesh && o.geometry) { if (!o.geometry.boundingBox) o.geometry.computeBoundingBox(); b.union(bb.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld)); } for (const ch of o.children) walk(ch); };
      walk(root);
      size = { r: Math.max(0.5, (b.max.x - b.min.x) / 2 / ws.x), h: Math.max(0.6, (b.max.y - b.min.y) / ws.y) };
      if (!Number.isFinite(size.r) || !Number.isFinite(size.h)) size = { r: 1, h: 1.5 };
    }
    this.size = size;
    this.g = new THREE.Group(); this.g.name = 'foe-look'; root.add(this.g);
    // the glow from inside: a shell round the body, additive
    this.su = { uK: { value: 0 }, uT: { value: 0 }, uPat: { value: 0 }, uC: { value: new THREE.Color() }, uMindT: mindTime };
    this.shell = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), new THREE.ShaderMaterial({ name: 'foe-shell', uniforms: this.su, vertexShader: SHELL_V, fragmentShader: SHELL_F, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    this.shell.scale.set(size.r * 1.01, size.h * 0.52, size.r * 1.01); this.shell.position.y = size.h * 0.45; this.shell.visible = false; this.g.add(this.shell);
    const slip = new THREE.MeshStandardMaterial({ name: 'foe-slip', color: 0x7a5434, roughness: 0.12, metalness: 0.1, emissive: 0x2a1a44, emissiveIntensity: 0.3 }); // (wet slip, a little of the Lachryma's violet in it)
    this.slipMat = slip;
    // the beads of Slip Trail
    this.beads = [0, 1, 2].map((i) => { const m = new THREE.Mesh(new THREE.SphereGeometry(size.r * 0.26, 12, 8), slip); const a = -Math.PI / 2 + (i - 1) * 0.6; m.position.set(Math.cos(a) * size.r * 0.98, size.h * (0.7 - 0.06 * Math.abs(i - 1)), Math.sin(a) * size.r * 0.98); m.visible = false; this.g.add(m); return m; }); // (on its back, -z: swelling out of the skin)
    // the spikes of Throwing Rings, round its foot
    this.spikes = new THREE.InstancedMesh(new THREE.ConeGeometry(0.1, 0.7, 6).translate(0, 0.35, 0), slip, 18); this.spikes.visible = false; this.g.add(this.spikes);
    // the lip of Decant, at its front
    this.lipMat = new THREE.MeshStandardMaterial({ name: 'foe-lip', color: 0xa8805a, roughness: 0.06, metalness: 0.15, emissive: 0x2a1a44, emissiveIntensity: 0.3 }); // (the lip runs wet: the pour, about to come)
    this.lip = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 10), this.lipMat); this.lip.position.set(0, size.h * 0.5, size.r * 0.95); this.lip.visible = false; this.g.add(this.lip); // (a jug's pouring lip, pulled out of its front)
    // the Eye Cup on the urn
    if (crown) {
      this.eye = new THREE.Group(); crown.group.add(this.eye); this.eye.position.set(0, crown.radius * 0.12, crown.radius * 1.08); this.eye.rotation.x = -0.21; this.eye.visible = false; // (on the urn's belly, facing as it does: seen from the floor under a 28 m jelly, never floating over the shoulder)
      const white = new THREE.Mesh(new THREE.CircleGeometry(crown.radius * 0.42, 20), new THREE.MeshBasicMaterial({ color: 0xf2ead8 })); white.scale.y = 0.62; this.eye.add(white);
      this.iris = new THREE.Mesh(new THREE.CircleGeometry(crown.radius * 0.2, 18), new THREE.MeshBasicMaterial({ color: 0x1a4a8a })); this.iris.position.z = 0.004; this.eye.add(this.iris);
      const pupil = new THREE.Mesh(new THREE.CircleGeometry(crown.radius * 0.09, 14), new THREE.MeshBasicMaterial({ color: 0x050308 })); pupil.position.z = 0.008; this.eye.add(pupil);
      const ring = new THREE.Mesh(new THREE.RingGeometry(crown.radius * 0.42, crown.radius * 0.5, 24), new THREE.MeshBasicMaterial({ color: 0x0d1a2a })); ring.scale.y = 0.62; ring.position.z = -0.002; this.eye.add(ring); // (painted round, as the eye-cups' eyes are)
    }
    // the threads between calves
    this.threadMat = new THREE.MeshBasicMaterial({ color: 0xffe2a0, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
    this.threads = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.06, 0.06, 1, 5).translate(0, 0.5, 0).rotateX(Math.PI / 2), this.threadMat, 6); this.threads.count = 0; this.threads.frustumCulled = false; this.threads.name = 'calf-threads';
    // the flood of The Overflow: a sheet of slip rising in the dish
    if (floor) {
      this.floodMat = slipMaterial({ flow: new THREE.Vector2(0.3, 1), speed: 1.2 }); this.floodMat.color.setHex(0x4a3428); // (wet slip, darker than the dry sand it covers)
      this.flood = new THREE.Mesh(new THREE.CircleGeometry(floor.radius ?? 22, 64).rotateX(-Math.PI / 2), this.floodMat); this.flood.name = 'foe-flood'; this.flood.visible = false; this.flood.frustumCulled = false;
    }
    this.cast = null; this.k = 0; this.opts = {}; this.blowT = 0; this.flood_k = 0; this.calves = null; this.mendK = 0; this.acc = 0;
  }

  /** A cast's windup, k from 0 (the log names it) to 1 (the blow). Call with k each frame; `blow(cast)` (or k back to 0) ends it. */
  windup(cast, k, opts = {}) { this.cast = SHAPE[cast] ? cast : null; this.k = THREE.MathUtils.clamp(k, 0, 1); this.opts = opts; if (cast === 'brineLine') this.crown?.tell?.(this.k); }
  /** The blow lands: the shape lets go in a snap. */
  blow(cast = this.cast) { this.blowT = 1; this.blowCast = cast; this.cast = null; this.k = 0; this.crown?.tell?.(0); if (cast === 'slipNova') this.burstFx(40, 0xe8dcff); }

  /** Sherds: the split. `calfRoots` are the calves' bodies (Petra's); each wears a sherd of the urn, and threads of slip join them. */
  calve(calfRoots) {
    this.burstFx(30, 0xffe2a0); this.calves = calfRoots.map((r, i) => { const s = sherd(i); s.position.y = this.size.h * 0.55; r.add(s); return { r, s }; });
    if (!this.threads.parent) this.root.parent?.add(this.threads);
  }
  /** The calves' half-minute: 0 just split .. 1 they re-merge. The threads tighten and brighten; a calf killed drops out of them. */
  mend(k) { this.mendK = THREE.MathUtils.clamp(k, 0, 1); }
  /** The Overflow: 0 dry .. 1 the whole dish under slip (the islands stand out of it). */
  overflow(k) { this.flood_k = THREE.MathUtils.clamp(k, 0, 1); if (this.flood && !this.flood.parent) this.root.parent?.add(this.flood); }

  /** How much bigger the body stands than the jelly the particles were drawn for (its base scale, not a windup's stretch). */
  grown() { const ps = this.root.parent ? this.root.parent.getWorldScale(_ws).x : 1; return Math.max(0.2, this.size.h * this.base.scale.x * ps / REF_H); }
  /** A particle of its furniture, grown to the body (Froude: sizes by k, speeds and times by √k, real gravity). */
  emit(o) { this.fx.alpha.emit(froude(o, this.grown())); }

  /** A point kept inside the floor's dish (a 21 m body's spiral of sand would reach past the bowl's wall). */
  onFloor(p) { const F = this.floor; if (!F) return p; const dx = p.x - F.center.x, dz = p.z - F.center.z, d = Math.hypot(dx, dz), R = (F.radius ?? 22) * 0.92; if (d > R) { p.x = F.center.x + dx * R / d; p.z = F.center.z + dz * R / d; } return p; }

  burstFx(n, col) {
    const fx = this.fx; if (!fx?.alpha) return; this.root.updateWorldMatrix(true, false); const c = this.root.localToWorld(_v.set(0, this.size.h * 0.5, 0)).clone();
    for (let i = 0; i < n; i++) this.emit({ pos: c.clone(), vel: new THREE.Vector3((Math.random() - 0.5) * 9, 2 + Math.random() * 6, (Math.random() - 0.5) * 9), life: 1.2, size: 0.16, sizeEnd: 0.06, color: new THREE.Color(i % 3 ? 0x8a6440 : col), alpha: 0.95, drag: 0.5, gravity: 10 });
  }

  update(raw = 1 / 60) {
    this.t += raw; const t = this.t, S = this.cast ? SHAPE[this.cast] : null, k = this.k, e = k * k * (3 - 2 * k), R = this.size.r, Hh = this.size.h;
    this.blowT = Math.max(0, this.blowT - raw * 5);
    // the body's shape: eased toward the windup's, snapping back past rest at the blow
    const sy = S ? 1 + (S.y - 1) * e : 1 - 0.12 * this.blowT, sxz = S ? 1 + (S.xz - 1) * e : 1 + 0.1 * this.blowT;
    const q = S?.quiver ? 1 + 0.03 * S.quiver * e * Math.sin(t * 40) : 1;
    this.root.scale.set(this.base.scale.x * sxz * q, this.base.scale.y * sy / q, this.base.scale.z * sxz * q);
    this.root.rotation.x = this.base.rx + (S ? S.lean * e : 0); // (its yaw is the body's own; the lean is about its own x: + leans its front down)
    // the glow from inside
    this.shell.visible = !!S && S.glow > 0 && e > 0.02;
    if (S) { this.su.uK.value = S.glow * e * (S.pat === 2 ? 0.6 + 0.6 * e : 1); this.su.uPat.value = S.pat; this.su.uC.value.setHex(S.col); }
    this.su.uT.value = t;
    // each cast's own furniture
    const c = this.cast;
    this.beads.forEach((b, i) => { b.visible = c === 'oozeRain'; if (b.visible) b.scale.setScalar(Math.max(0.01, THREE.MathUtils.clamp(e * 3 - i, 0, 1)) * (1 + 0.08 * Math.sin(t * 9 + i))); });
    this.spikes.visible = c === 'gelidRings';
    if (this.spikes.visible) {
      for (let i = 0; i < 18; i++) { const a = (i / 18) * Math.PI * 2, h = (0.3 + 0.9 * e) * (0.7 + 0.3 * Math.sin(t * 14 + i * 2.3)); _m.compose(_v.set(Math.cos(a) * R * 1.3, 0, Math.sin(a) * R * 1.3), _q.setFromEuler(_e.set(Math.sin(a) * 0.25, 0, -Math.cos(a) * 0.25)), _s.set(1, h, 1)); this.spikes.setMatrixAt(i, _m); }
      this.spikes.instanceMatrix.needsUpdate = true;
    }
    if (this.crown) { // the crown tilts out or in for Throwing Rings (the order), and opens its eye for the Eye Cup
      const tilt = c === 'gelidRings' ? (this.opts.order === 'in' ? -0.35 : 0.35) * e : 0; this.crown.group.rotation.x = tilt;
      if (this.eye) { this.eye.visible = c === 'crownGlare' || (this.blowCast === 'crownGlare' && this.blowT > 0); const open = c === 'crownGlare' ? e : this.blowT;
        this.eye.scale.set(1, 0.05 + 0.95 * open, 1); this.iris.material.color.setRGB(0.1 + 0.5 * open, 0.3 + 0.5 * open, 0.55 + 0.45 * open); }
    }
    this.lip.visible = c === 'brineCascade'; if (this.lip.visible) this.lip.scale.set(R * 0.38 * e + 0.01, R * 0.16 * e + 0.01, R * 0.32 * e + 0.01); // (a swelling pout at its front: wide, shallow, wet)
    // the dust and the slip each one throws
    const fx = this.fx; if (fx?.alpha && c && e > 0.1) {
      this.acc += raw * (c === 'brineLine' ? 30 : c === 'sinkingSands' ? 40 : c === 'overflow' ? 30 : c === 'broodCall' ? 6 : 0) * e;
      this.root.updateWorldMatrix(true, false);
      while (this.acc >= 1) {
        this.acc -= 1;
        if (c === 'brineLine') { const at = this.root.localToWorld(_v.set((Math.random() - 0.5) * R, 0.1, -R * 1.1)); this.emit({ pos: at.clone(), vel: this.root.localToWorld(_w.set(0, 0, 0)).sub(at).normalize().multiplyScalar(-3).setY(1.5 + Math.random() * 2), life: 0.8, size: 0.3, sizeEnd: 1.2, color: new THREE.Color(0xc9a77a), alpha: 0.5, drag: 2, gravity: 2 }); }
        else if (c === 'sinkingSands') { const a = Math.random() * Math.PI * 2, r = R * (2 + Math.random() * 4), at = this.root.localToWorld(_v.set(Math.cos(a) * r, 0.1, Math.sin(a) * r)), ctr = this.root.getWorldPosition(_w); this.onFloor(at); const tang = _u.set(-(at.z - ctr.z), 0, at.x - ctr.x).normalize(); this.emit({ pos: at.clone(), vel: ctr.clone().sub(at).normalize().multiplyScalar(2).addScaledVector(tang, 3).setY(0.2), life: 1.2, size: 0.12, sizeEnd: 0.05, color: new THREE.Color(0xc9a77a), alpha: 0.8, drag: 0.4, gravity: 0 }); }
        else if (c === 'overflow') { const a = Math.random() * Math.PI * 2, at = this.root.localToWorld(_v.set(Math.cos(a) * R * 0.9, Hh * (0.3 + Math.random() * 0.5), Math.sin(a) * R * 0.9)); this.emit({ pos: at.clone(), vel: new THREE.Vector3(Math.cos(a) * 2, 0.5, Math.sin(a) * 2), life: 1, size: 0.14, sizeEnd: 0.1, color: new THREE.Color(0x8a6440), alpha: 0.9, drag: 0.3, gravity: 9 }); }
        else if (c === 'broodCall') this.burstFx(4, 0xb49be6);
      }
    }
    // the calves' threads: a cat's cradle between them, tightening
    if (this.calves) {
      const live = this.calves.filter((x) => x.r.visible && x.r.parent); let n = 0; const sag = 1 - this.mendK; // (slack at first, drawn taut as they come to mend)
      for (let i = 0; i < live.length; i++) for (let j = i + 1; j < live.length; j++) { const a = live[i].r.getWorldPosition(_v).setY(live[i].r.getWorldPosition(_v).y + this.size.h * 0.35), b = live[j].r.getWorldPosition(_w); b.y += this.size.h * 0.35; const par = this.threads.parent; if (par) { par.worldToLocal(a); par.worldToLocal(b); } const L = a.distanceTo(b); _m.lookAt(b, a, _up); /* (z from a toward b) */ _q.setFromRotationMatrix(_m); _m.compose(a, _q, _s.set(1 + sag, 1 + sag, L)); this.threads.setMatrixAt(n++, _m); }
      this.threads.count = n; this.threads.instanceMatrix.needsUpdate = true;
      this.threadMat.opacity = 0.15 + 0.7 * this.mendK * (0.75 + 0.25 * Math.sin(t * (4 + 10 * this.mendK)));
      this.threadMat.color.setHex(0xffe2a0).multiplyScalar(0.5 + this.mendK);
    }
    // the flood
    if (this.flood) {
      const f = this.flood_k, F = this.floor; this.flood.visible = f > 0.01;
      if (this.flood.visible) { this.flood.position.set(F.center.x, F.center.y - (F.depth ?? 1.5) * (1 - f) + 0.04 * f, F.center.z); this.flood.parent?.worldToLocal(this.flood.position); /* (the floor's centre is in the world: the sheet lives in the body's parent) */ this.floodMat.userData.u.uT.value = t; }
    }
  }

  dispose() {
    this.root.scale.copy(this.base.scale); this.root.rotation.x = this.base.rx; this.g.parent?.remove(this.g); this.eye?.parent?.remove(this.eye);
    this.threads.parent?.remove(this.threads); this.flood?.parent?.remove(this.flood);
    this.g.traverse((o) => o.geometry?.dispose?.()); this.shell.material.dispose(); this.slipMat.dispose(); this.lipMat.dispose(); this.threadMat.dispose(); this.floodMat?.dispose();
    for (const x of this.calves || []) x.r.remove(x.s);
  }
}

/** A sherd of the urn: a curved piece of its ru celadon, worn on a calf's back. */
function sherd(i) {
  const g = new THREE.SphereGeometry(0.5, 8, 4, i * 1.6, 0.9 + (i % 2) * 0.3, 0.3, 0.8);
  const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: 0x5f939c, roughness: 0.3, side: THREE.DoubleSide, emissive: 0x2a3a3c, emissiveIntensity: 0.4 }));
  m.name = 'calf-sherd'; m.rotation.set(0.3 * (i % 2 ? 1 : -1), i, 0.2); return m;
}
const _up = new THREE.Vector3(0, 1, 0), _ws = new THREE.Vector3(), _v = new THREE.Vector3(), _w = new THREE.Vector3(), _u = new THREE.Vector3(), _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _s = new THREE.Vector3();
