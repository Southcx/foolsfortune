// ---------------------------------------------------------------------------------------
// THE DATA DRAIN: a creature's data pulled out of it, as Skeith pulled Orca's in .hack (the owner, 2026-10-06: "think about the opening
// scene where Orca gets data drained! SO COOL!!"). Played when a mind is rewritten (the Veritome's reprogramming: reprogram.run). It is
// a ceremony, the same every time, in beats (DRAIN_BEATS, real seconds from the run):
//
//   BREAK   0.00  the crackle break (vfx/crackbreak.js): its glaze shell crazes and pops
//   FREEZE  0.30  the world held and the glitch's DROP (the beat of silence: vfx/glitch.js)
//   PAGES   0.45  the Veritome's pages fan open at the Courier's hands and its lens fixes on the creature (rings closing to focus)
//   BEAM    0.75  the beam, from the lens to the creature, growing along its length; the screen's DRAIN pulls toward it
//   STRIP   1.00  the body stripped to its polygons: cubes laid on its own surface lift off in a spiral down the beam into the lens, the
//                 body held a hand off the ground and blinking out in steps (8 a real second, the glitch's band)
//   SET     1.70  set down changed, and the pages close: smaller (x0.88, to 0.7 at the least), a step paler (vfx/databug.js's tint),
//                 and calm (one soft squash, no bounce of joy); a data bug is mended (.hack's drain repairs one)
// 1.90 the end. Nothing of it ever touches the Courier's body (the owner: the drain never corrupts the Courier).
//
// THE CAMERA is Petra's (cine/): DRAIN_SEQUENCE below is the shot list written in cine/sequences.js's own format, for her to wire.
// `visual.glitch` off: no DROP, no screen DRAIN, no blinking (the body stays, the polygons stream off it without stutter); the
// break, the pages, the beam and the change still play (the change is the creature's, not a glitch).
//
// Prior art: .hack//Infection's Data Drain (CyberConnect2, 2002: the field frozen, the bracelet opening, the beam, the target held up
// and stripped to polygons, dropped back weaker and smaller), Tron's derezzing, Rez's wireframe data-space, and a camera's iris.
//
//   game.dataDrain = new DataDrain(game)   .play(creature | { pos, radius, height, root? }, from?: Vector3)   .update(rawDt)
//   .active   .run   .prewarm() -> park()   .bugs (vfx/databug.js)   .crackle (vfx/crackbreak.js)   .lensAt(out)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { T } from '../core/config.js';
import { ribbonLightMaterial } from './ribbonlight.js';
import { CrackleBreak } from './crackbreak.js';
import { DataBugs } from './databug.js';

export const DRAIN_BEATS = { break: 0, freeze: 0.3, pages: 0.45, beam: 0.75, strip: 1.0, set: 1.7, end: 1.9 };
const B = DRAIN_BEATS;

/** The camera Petra is asked to wire (cine/sequences.js's format: points in metres in the frame facing from the Courier to the
 *  creature, x right, y up, z toward it; fov a change from the player's; times real seconds within each segment). Anchors:
 *  courier (their feet), veritome (game.dataDrain.lensAt), creature (its feet). Segments in order: the beats above. */
export const DRAIN_SEQUENCE = {
  anchors: ['courier', 'veritome', 'creature'],
  preview: { courier: [0, 0, 0], veritome: [0.2, 1.2, 0.35], creature: [0, 0, 4] },
  order: [['break', 0.3], ['freeze', 0.15], ['pages', 0.3], ['beam', 0.25], ['strip', 0.7], ['set', 0.2]],
  start: 'break',
  segments: {
    // the world's camera, pushed in a little on the shell
    break: { ease: 30, camera: [
      { t: 0, pos: { at: 'courier', off: [0.9, 1.8, -2.6] }, look: { at: 'creature', off: [0, 0.7, 0] }, fov: 0 },
      { t: 0.3, pos: { at: 'courier', off: [0.8, 1.7, -2.2] }, look: { at: 'creature', off: [0, 0.7, 0] }, fov: -4 }] },
    // a cut, over the right shoulder, the creature on the left third, held for the drop
    freeze: { camera: [{ t: 0, cut: true, pos: { at: 'courier', off: [0.55, 1.5, -0.95] }, look: { at: 'creature', off: [-0.6, 0.75, 0] }, fov: -8, roll: 0.03 }] },
    // a push in on the book as its pages fan and its lens fixes
    pages: { ease: 24, camera: [
      { t: 0, cut: true, pos: { at: 'veritome', off: [0.55, 0.12, -0.8] }, look: { at: 'veritome' }, fov: -14, roll: -0.04 },
      { t: 0.3, pos: { at: 'veritome', off: [0.4, 0.08, -0.58] }, look: { at: 'veritome' }, fov: -17, roll: -0.04 }] },
    // whip down the beam to the creature
    beam: { ease: 18, camera: [
      { t: 0, pos: { at: 'veritome', off: [0.5, 0.3, -0.45] }, look: { at: 'creature', off: [0, 0.7, 0] }, fov: -6 },
      { t: 0.25, pos: { at: 'creature', off: [1.6, 1.15, -2.3] }, look: { at: 'creature', off: [0, 0.75, 0] }, fov: -4 }] },
    // a slow quarter-orbit round the creature, low, as it is stripped
    strip: { ease: 30, camera: [
      { t: 0, pos: { at: 'creature', off: [1.6, 1.15, -2.3] }, look: { at: 'creature', off: [0, 0.8, 0] }, fov: -4, roll: 0.04 },
      { t: 0.7, pos: { at: 'creature', off: [2.2, 0.85, -1.4] }, look: { at: 'creature', off: [0, 0.8, 0] }, fov: -9, roll: 0.04 }] },
    // and back to the player's camera as it is set down
    set: { ease: 10, camera: [{ t: 0, pos: { at: 'creature', off: [2.2, 0.85, -1.4] }, look: { at: 'creature', off: [0, 0.6, 0] }, fov: -6 }] },
  },
};

const N = 360, PAGES = 9, SHRINK = 0.88, SMALLEST = 0.7;
const CYAN = new THREE.Color(0x46f0ff), MAGENTA = new THREE.Color(0xff3fd2), WHITE = new THREE.Color(0xffffff);
const PAPER = 0xf1e7d0, GILT = 0xd9a04a; // (the paper, and the gilt of its edges: the Veritome's brass, tools/veritome/model.js)
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _v = new THREE.Vector3(), _w = new THREE.Vector3(), _f = new THREE.Vector3(), _z = new THREE.Vector3(), _c = new THREE.Color(), _e = new THREE.Euler();
const clamp01 = (x) => Math.min(1, Math.max(0, x)), ease = (x) => { x = clamp01(x); return x * x * (3 - 2 * x); };
const hash = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

/** Points on a creature's surface: its meshes' vertices where they are now (a skinned or deformed mesh: its rest shape, placed). */
function surfacePoints(target, n) {
  const pts = [], src = [];
  target.root?.updateMatrixWorld(true); // (where its meshes are now, not where they were last drawn)
  target.root?.traverse((o) => { if (o.isMesh && o.geometry?.attributes?.position && o.visible !== false) src.push(o); });
  for (let i = 0; i < n * 2 && src.length && pts.length < n; i++) {
    const o = src[i % src.length], P = o.geometry.attributes.position, k = Math.floor(Math.random() * P.count);
    const q = new THREE.Vector3().fromBufferAttribute(P, k).applyMatrix4(o.matrixWorld);
    if (q.distanceTo(target.pos) < 3 * ((target.radius || 0.5) + (target.height || 1))) pts.push(q); // (a vertex far off is a mesh drawn elsewhere: left out)
  }
  while (pts.length < n) { // (no mesh to read: a capsule round its position)
    const a = Math.random() * Math.PI * 2, y = Math.random() * (target.height || 1), r = (target.radius || 0.5) * (0.7 + 0.3 * Math.random());
    pts.push(new THREE.Vector3(target.pos.x + Math.cos(a) * r, target.pos.y + y, target.pos.z + Math.sin(a) * r));
  }
  return pts;
}

export class DataDrain {
  constructor(game) {
    this.game = game; this.made = false; this.run = null;
    this.crackle = new CrackleBreak(game);
    this.bugs = game.dataBugs = new DataBugs(game);
    game.events?.on?.('reprogram.run', (e) => { // (a mind rewritten: drained into the Veritome; a refusal shows the resist mark instead, not this)
      const c = game.reprogram?.c;
      if (!c?.pos || e.refused?.length >= (e.effects?.length || 1)) return;
      this.play(c);
    });
  }

  make() {
    if (this.made) return; this.made = true;
    const g = new THREE.Group(); g.name = 'datadrain'; g.userData.zoneFree = true; g.visible = false;
    this.cubes = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ name: 'datadrain-cubes', fog: false, toneMapped: false }), N); // (solid, unlit: it reads on white sand as on a dark Well)
    this.cubes.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(N * 3), 3);
    this.cubes.frustumCulled = false;
    // the beam: a flat ribbon along +z, its stripes scrolling inward
    this.beamU = { uT: { value: 0 }, uK: { value: 0 } }; // (uK: the beam's alpha)
    const beamGeo = new THREE.PlaneGeometry(1, 1, 1, 1); beamGeo.translate(0, 0.5, 0); beamGeo.rotateX(Math.PI / 2);
    this.beam = new THREE.Mesh(beamGeo, ribbonLightMaterial('beam', this.beamU, { name: 'datadrain-beam', toneMapped: false })); // (the ribbons' one program: vfx/ribbonlight.js)
    this.beam.frustumCulled = false;
    // the Veritome's pages: leaves hinged at the lens, fanning open round the beam's axis like a riffled book stood on its spine, and
    // cupped toward the creature (so the fan reads from behind the Courier and from the side); the lens at the hinge, two rings closing to focus
    const plain = (color, opacity = 1) => new THREE.MeshBasicMaterial({ name: 'datadrain-page', color, transparent: true, opacity, depthWrite: false, fog: false, toneMapped: false, side: THREE.DoubleSide });
    const leaf = new THREE.PlaneGeometry(0.3, 0.42); leaf.translate(0, 0.25, 0);
    const edge = new THREE.PlaneGeometry(0.3, 0.03); edge.translate(0, 0.455, 0.001);
    this.book = new THREE.Group(); this.pages = [];
    for (let i = 0; i < PAGES; i++) {
      const p = new THREE.Group(), m = new THREE.Mesh(leaf, plain(PAPER)), e = new THREE.Mesh(edge, plain(GILT));
      p.add(m, e); this.book.add(p); this.pages.push({ g: p, mats: [m.material, e.material] });
    }
    this.lens = new THREE.Group();
    this.lensRings = [new THREE.Mesh(new THREE.RingGeometry(0.075, 0.09, 40), plain(CYAN)), new THREE.Mesh(new THREE.RingGeometry(0.035, 0.043, 32), plain(MAGENTA))];
    this.lens.add(...this.lensRings);
    g.add(this.cubes, this.beam, this.book, this.lens);
    this.group = g;
    this.game.scene?.add(g);
  }

  /** For the boot's warm-up (main.js): shown, so its programs compile with the rest; returns what hides it again. */
  prewarm() {
    this.make(); this.group.visible = true;
    const parks = [this.crackle.prewarm(), this.bugs.prewarm()];
    return () => { this.group.visible = !!this.run; for (const p of parks) p(); };
  }

  get active() { return !!this.run; }

  /** Where the Veritome's lens is: the book in the Courier's hands, or before their chest when it is not drawn. */
  lensAt(out = new THREE.Vector3()) {
    const g = this.game, M = g.veritome?.model?.group, P = g.player;
    if (M?.visible && g.veritome.held) { M.getWorldPosition(out); return out.setY(out.y + 0.05); } // (in the hands; on the hip it is not where the lens is aimed from)
    if (!P?.pos) return out.set(0, 1.2, 0);
    const C = this.run?.target?.pos, dx = C ? C.x - P.pos.x : 0, dz = C ? C.z - P.pos.z : 1, l = Math.hypot(dx, dz) || 1; // (toward what is drained)
    return out.set(P.pos.x + (dx / l) * 0.4, P.pos.y + 1.15, P.pos.z + (dz / l) * 0.4);
  }

  /** Drain a creature (or anything with pos, radius, height and a root) into the Veritome. `from`: a fixed point instead of the lens. */
  play(target, from = null) {
    if (!target?.pos) return;
    this.make();
    this.stop();
    const root = target.root;
    this.run = { target, from: from?.clone() || null, t: 0, pts: null, seed: null, spin: Math.random() * 6.28, was: root?.visible, glitch: T.visual.glitch !== false,
      hold: null, s0: root ? root.scale.x : 1, changed: false, flags: {} };
    this.crackle.play(target, B.freeze);
  }

  stop() {
    const R = this.run; if (!R) return;
    if (R.target.root) R.target.root.visible = R.was ?? true;
    if (R.t >= B.strip && !R.changed) this.change(R);
    this.crackle.stop(); this.run = null; if (this.group) this.group.visible = false;
  }

  /** Set down changed: smaller, a step paler, calm; a data bug mended. */
  change(R) {
    R.changed = true;
    const C = R.target, root = C.root;
    if (root) { root.userData.drainScale0 ??= R.s0; root.scale.setScalar(Math.max(root.userData.drainScale0 * SMALLEST, R.s0 * SHRINK)); }
    if (C.type === 'creature' || C.mat) { this.bugs.drained(C); this.bugs.mend(C); }
    C.deform?.kick?.(-1.6, null, 0.06);
  }

  update(raw) {
    this.crackle.update(raw);
    this.bugs.update(raw);
    const R = this.run; if (!R) return;
    R.t += raw;
    if (R.t >= B.end) { this.stop(); return; }
    if (R.t < B.freeze) return; // (the crackle break plays first)
    const g = this.game, C = R.target, root = C.root, d = R.t;
    const once = (k, fn) => { if (!R.flags[k]) { R.flags[k] = true; fn(); } };
    once('freeze', () => {
      this.group.visible = true;
      R.hold = root ? root.position.clone() : null;
      R.pts = surfacePoints(C, N); R.seed = R.pts.map(() => Math.random());
      for (const q of R.pts) { const dx = q.x - C.pos.x, dz = q.z - C.pos.z, r = Math.hypot(dx, dz) || 1; q.x += (dx / r) * 0.12; q.z += (dz / r) * 0.12; } // (a hair out from the body)
      g.time?.pulse?.('drain.freeze', 0.03, B.pages - B.freeze, { release: 0.35 });
      if (R.glitch) g.glitch?.drop?.(9); // (0.15 real s at 60 frames a second: the beat of silence)
    });
    const to = _v.copy(C.pos).setY(C.pos.y + (C.height || 1) * 0.5);
    const from = R.from || this.lensAt(_f);
    // the body held where it was, lifted a hand as it is stripped, set down at the end where it now is
    if (root && R.hold) {
      const lift = 0.14 * ease((d - B.beam) / 0.4) * (1 - ease((d - B.set) / (B.end - B.set)));
      if (d < B.set) root.position.copy(R.hold).setY(R.hold.y + lift);
      else root.position.lerpVectors(R.hold, C.pos, ease((d - B.set) / (B.end - B.set))).setY(root.position.y + lift);
    }
    if (d >= B.set) once('set', () => this.change(R));
    // the pages: fanned open over PAGES, held, shut again as it is set down
    const open = ease((d - B.pages) / 0.25) * (1 - ease((d - B.set) / (B.end - B.set)));
    this.book.position.copy(from); this.book.lookAt(to);
    this.pages.forEach((p, i) => {
      const f = (i / (PAGES - 1)) * 2 - 1, wave = 0.05 * Math.sin(d * 9 + i);
      p.g.rotation.set(-0.6 * open, 0, f * 1.5 * open + wave * open); p.g.scale.setScalar(0.4 + 0.6 * open);
      p.mats[0].opacity = 0.92 * open; p.mats[1].opacity = open;
    });
    // the lens: rings wide and loose, closing to focus with a catch at the end of the beat, then fixed on it
    const fix = ease((d - B.pages) / (B.beam - B.pages)), catchK = Math.max(0, 1 - Math.abs(d - B.beam) / 0.05);
    this.lens.position.copy(from); this.lens.lookAt(to);
    this.lens.scale.setScalar((2.8 - 1.8 * fix) * (1 - 0.08 * catchK));
    this.lensRings[0].rotation.z = -d * 2.4 * (1 - fix); this.lensRings[1].rotation.z = d * 3.1 * (1 - fix);
    for (const r of this.lensRings) r.material.opacity = open * (0.5 + 0.5 * fix);
    // the beam: from the lens to the creature, growing along its length, held, gone with the last of the data
    if (d >= B.beam) once('beam', () => { if (R.glitch) g.glitch?.pulse?.({ drain: 1, split: 0.4, crush: 0.6, dur: B.set - B.beam, at: to.clone() }); });
    const reach = ease((d - B.beam) / 0.2), len = from.distanceTo(to);
    this.beam.position.copy(from); this.beam.lookAt(to);
    this.beam.scale.set(0.3 + 0.06 * Math.sin(R.t * 40), 1, Math.max(0.001, len * reach));
    this.beamU.uT.value = R.t; this.beamU.uK.value = reach * (1 - ease((d - (B.set - 0.1)) / 0.25));
    // the body blinks out in steps while its data goes (8 a real second, by a hash of the step: never a per-frame flicker)
    if (root) {
      const step = Math.floor(d * 8), keep = d < B.strip ? 1 : d >= B.set ? 1 : 0.75 - 0.6 * ease((d - B.strip) / (B.set - B.strip));
      root.visible = !R.glitch ? true : hash(step + R.spin) < keep;
    }
    // the polygons: laid on its surface at the beam, flickering in steps; each lifts at its own moment and spirals down the beam
    const axis = _s.subVectors(from, to).normalize(), ax = axis.x, az = axis.z;
    const shown = ease((d - B.beam) / 0.15), tick = Math.floor(d * 8);
    for (let i = 0; i < N; i++) {
      const s = R.seed[i], go = clamp01((d - B.strip - s * 0.45) / 0.3), e = go * go * (3 - 2 * go);
      const p = _w.copy(R.pts[i]).lerp(from, e);
      const sw = Math.sin(e * Math.PI) * 0.6 * (C.radius || 0.5), a = R.spin + s * 40 + e * 9; // (the spiral round the beam)
      p.x += Math.cos(a) * sw * (1 - Math.abs(ax)); p.z += Math.sin(a) * sw * (1 - Math.abs(az)); p.y += Math.sin(a * 1.3) * sw * 0.5;
      const flick = R.glitch && hash(i * 0.37 + tick) < 0.12 + 0.4 * (1 - e) ? 0 : 1; // (stuttering in the glitch's steps, more before they go)
      const size = (0.08 + 0.13 * s) * (1 - e * 0.8) * flick * shown * (e >= 0.999 ? 0 : 1);
      _q.setFromEuler(_e.set(s * 6 + R.t * 4, s * 9, 0));
      this.cubes.setMatrixAt(i, _m.compose(p, _q, _z.set(size, size, size)));
      this.cubes.setColorAt(i, _c.copy(s < 0.45 ? CYAN : s < 0.8 ? MAGENTA : WHITE).multiplyScalar(1.3));
    }
    this.cubes.instanceMatrix.needsUpdate = true; this.cubes.instanceColor.needsUpdate = true;
  }
}
