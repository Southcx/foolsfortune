// ---------------------------------------------------------------------------------------
// THE VANE ON THE COMPASS: what the Dreamvane adds to the wire compass while it is in the hands (vfx/wirecompass.js is its tape). No
// words, no numbers, drawn in lines like the tape, in the colour of what it is attuned to:
//
//   THE SIGIL     centred above the tape: which way the wheel has attuned it, as a line sigil (anything: an eight-rayed star;
//                 crystal: a cut stone; chests: a box and its lid; the living: a heart in a ripple; the loose: a drop). It turns in
//                 when the wheel changes it.
//   THE WEB       behind the sigil, a dreamcatcher's web (the vane's own hoop), faint, brightening as it hears more.
//   THE RESONANCE while dowsing, a standing wave on the tape at the bearing of what it hears: as tall as it sings, flashing on every
//                 tick of the bead (so the ticks are seen to quicken as they turn toward it).
//
// Prior art: Skyward Sword's dowsing (the screen-edge pulse that quickens as you face the thing), Metroid Prime's scan visor (the tool's
// own marks on its own visor), the dreamcatcher's web itself, and the radio-dial "tuning" of every scanner game (Fallout's Pip-Boy radio,
// Death Stranding's odradek).
//
//   const vh = new VaneHud(game, compass)    vh.update(dt)    (after the compass)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { ATTUNE } from '../tools/dreamvane/dreamvane.js';

const R = 10;         // (the tape's radius: wirecompass.js)
const SIGILS = {       // line pairs on a unit square (x, y in -1..1)
  any: (() => { const L = []; for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2, r = k % 2 ? 0.55 : 1; L.push([0, 0, Math.cos(a) * r, Math.sin(a) * r]); } return L; })(),
  crystal: [[0, 1, 0.7, 0.3], [0.7, 0.3, 0.45, -0.95], [0.45, -0.95, -0.45, -0.95], [-0.45, -0.95, -0.7, 0.3], [-0.7, 0.3, 0, 1], [-0.7, 0.3, 0.7, 0.3], [0, 1, -0.2, 0.3], [0, 1, 0.2, 0.3], [-0.2, 0.3, 0, -0.95], [0.2, 0.3, 0, -0.95]],
  chest: [[-0.9, -0.8, 0.9, -0.8], [0.9, -0.8, 0.9, 0.2], [0.9, 0.2, -0.9, 0.2], [-0.9, 0.2, -0.9, -0.8], [-0.9, 0.2, -0.6, 0.85], [-0.6, 0.85, 0.6, 0.85], [0.6, 0.85, 0.9, 0.2], [0, -0.1, 0, -0.45]],
  living: (() => { const L = [], heart = (t) => [0.16 * 16 * Math.pow(Math.sin(t), 3) / 3, (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 17 * 0.55 + 0.05];
    for (let i = 0; i < 24; i++) { const a = heart((i / 24) * Math.PI * 2), b = heart(((i + 1) / 24) * Math.PI * 2); L.push([a[0], a[1], b[0], b[1]]); }
    for (let i = 0; i < 32; i++) { const a = (i / 32) * Math.PI * 2, b = ((i + 1) / 32) * Math.PI * 2; if (i % 2) continue; L.push([Math.cos(a), Math.sin(a), Math.cos(b), Math.sin(b)]); } return L; })(),
  loose: (() => { const L = [], drop = (t) => { const a = t * Math.PI * 2; return [0.62 * Math.sin(a) * (1 - 0.35 * (1 + Math.cos(a)) / 2) , -Math.cos(a) * 0.75 - 0.15 + (Math.cos(a) > 0.6 ? 0 : 0)]; };
    for (let i = 0; i < 28; i++) { const a = drop(i / 28), b = drop((i + 1) / 28); L.push([a[0], a[1], b[0], b[1]]); } L.push([0, 0.9, -0.28, 0.35], [0, 0.9, 0.28, 0.35]); return L; })(),
};

const lines = (pairs, z = 0) => new THREE.BufferGeometry().setFromPoints(pairs.flatMap(([a, b, c, d]) => [new THREE.Vector3(a, b, z), new THREE.Vector3(c, d, z)]));
const mat = () => new THREE.LineBasicMaterial({ transparent: true, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, opacity: 0 });

export class VaneHud {
  constructor(game, compass) {
    this.game = game; this.compass = compass;
    this.group = new THREE.Group(); this.group.renderOrder = 36;
    this.sigil = new THREE.Group(); this.group.add(this.sigil);
    this.sigils = {};
    for (const [id, pairs] of Object.entries(SIGILS)) { const m = new THREE.LineSegments(lines(pairs), mat()); m.renderOrder = 36; m.frustumCulled = false; m.visible = false; this.sigil.add(m); this.sigils[id] = m; }
    // the web: spokes and three rings of a dreamcatcher, behind the sigil
    const web = [];
    for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; web.push([Math.cos(a) * 0.25, Math.sin(a) * 0.25, Math.cos(a) * 1.6, Math.sin(a) * 1.6]); }
    for (const r of [0.6, 1.05, 1.6]) for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2, b = ((k + 1) / 12) * Math.PI * 2; web.push([Math.cos(a) * r, Math.sin(a) * r, Math.cos(b) * r * 0.96, Math.sin(b) * r * 0.96]); }
    this.web = new THREE.LineSegments(lines(web), mat()); this.web.renderOrder = 35; this.web.frustumCulled = false; this.group.add(this.web);
    // the resonance: a standing wave between two brackets, on the tape
    const wave = [[-0.9, -0.6, -0.9, 0.6], [0.9, -0.6, 0.9, 0.6]];
    for (let i = 0; i < 24; i++) { const x0 = -0.8 + (i / 24) * 1.6, x1 = -0.8 + ((i + 1) / 24) * 1.6, f = (x) => Math.sin(x * Math.PI * 3) * Math.cos(x * Math.PI / 1.6); wave.push([x0, f(x0), x1, f(x1)]); }
    this.res = new THREE.LineSegments(lines(wave), mat()); this.res.renderOrder = 36; this.res.frustumCulled = false;
    game.scene.add(this.group, this.res);
    this.alpha = 0; this.resA = 0; this.flash = 0; this.turn = 0; this.lastAtt = -1; this.lastTick = 0;
    this.col = new THREE.Color();
  }

  update(dt) {
    const g = this.game, C = this.compass, dv = g.dreamvane, cam = g.camera;
    const on = !!(dv && dv.held && C?.tape?.visible);
    this.alpha += ((on ? 1 : 0) - this.alpha) * (1 - Math.exp(-dt * 6));
    this.group.visible = this.alpha > 0.01;
    this.res.visible = this.group.visible && this.resA > 0.01;
    if (!this.group.visible) return;
    const A = ATTUNE[dv.att] || ATTUNE[0];
    if (dv.att !== this.lastAtt) { this.lastAtt = dv.att; this.turn = 1; for (const [id, m] of Object.entries(this.sigils)) m.visible = id === A.id; }
    this.turn = Math.max(0, this.turn - dt * 3);
    this.col.setHex(A.color);
    // the sigil and the web, straight ahead above the tape, facing the eye
    const f = cam.getWorldDirection(new THREE.Vector3()); f.y = 0; f.normalize();
    this.group.position.set(cam.position.x + f.x * R, C.tape.position.y + 1.05, cam.position.z + f.z * R);
    this.group.quaternion.copy(cam.quaternion);
    this.group.scale.setScalar(0.3);
    this.sigil.rotation.z = this.turn * this.turn * Math.PI; this.sigil.scale.setScalar(1 - 0.4 * this.turn);
    const sig = this.sigils[A.id];
    sig.material.color.copy(this.col); sig.material.opacity = this.alpha * (0.85 + 0.15 * (dv.glow || 0));
    this.web.material.color.copy(this.col); this.web.material.opacity = this.alpha * (0.12 + 0.5 * (dv.glow || 0));
    this.web.rotation.z += dt * (0.1 + 0.6 * (dv.glow || 0));
    // the resonance: at what it hears, as tall as it sings, flashing on each tick
    const T = dv.dowsing ? dv.target : null;
    this.resA += ((T ? 1 : 0) - this.resA) * (1 - Math.exp(-dt * 6));
    if (dv.tickT > this.lastTick + 0.02) this.flash = 1; // (the bead's tick: its timer was just set again)
    this.lastTick = dv.tickT; this.flash = Math.max(0, this.flash - dt * 6);
    if (T) {
      const dx = T.pos.x - cam.position.x, dz = T.pos.z - cam.position.z, dl = Math.hypot(dx, dz) || 1;
      this.res.position.set(cam.position.x + (dx / dl) * R, C.tape.position.y, cam.position.z + (dz / dl) * R);
      this.res.quaternion.copy(cam.quaternion);
      this.res.scale.set(0.42, 0.12 + 0.5 * (dv.glow || 0), 1);
    }
    this.res.material.color.copy(this.col).lerp(new THREE.Color(1, 1, 1), this.flash * 0.6);
    this.res.material.opacity = this.alpha * this.resA * (0.5 + 0.5 * this.flash);
  }
}
