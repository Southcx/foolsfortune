// ---------------------------------------------------------------------------------------
// THE SONDELASS, the object: a telescoping rod that is also a cutlass and also throws a grapnel.
// Built from primitives (no imported asset), in its own frame so that everything else can treat it as one rigid thing:
//   +X along the tool toward the tip, origin at the middle of the grip; +Y toward the edge and the reel (down, as held);
//   +Z the flat of the blade (the way the right palm faces).
//
//   pommel . handle . guard | four nested sections (they slide out to a rod, in to a hilt) | tip
//   reel with a crank on the +Y side (spins while reeling); a knuckle bow; a curved blade that slides out of the last section
//   (the cutlass), a three-tined grapnel seated at the tip (the hook), a guide ring for the line.
//
// The sections are laid out by hand each time the extension or the bend changes (a chain of cylinders, each turned a
// little more than the last), so a rod under load bends along its length rather than the whole object tilting. The tip's
// place is what the line and the lure hang from.
//
//   const m = new SondelassModel(); scene.add(m.group)
//   m.setExtension(0..1)  m.setBend(radians, total along the sections)  m.setBlade(0..1)  m.setHook(bool)  m.setReel(angle)
//   m.tipLocal / m.tipDirLocal  ->  the guide ring at the end (tool frame)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { PALETTE } from '../../core/config.js';
import { addOutline, OUTLINE_MAT_CHAR } from '../../render/outline.js';
import { wearSkin } from '../../vfx/toolskinwear.js'; // (a tool's skin, looks only: Calissa's)

const SEG_MIN = 0.045;
const SEG_MAX = [0.62, 0.58, 0.52, 0.46];
const SEG_R = [0.0165, 0.0135, 0.0108, 0.0084];
const X0 = 0.25; // where the first section starts (past the guard)
export const BLADE_LEN = 0.82;
/** The handle (m along the tool from the palm's middle): `back` the rod's butt, `short` the butt slid in for the cutlass and the hook (the
 *  pommel just behind the fist: at the rod's 0.28 m it went 6 to 10 cm into the chest in the cutlass's strokes and lay inside the forearm
 *  in the hook's aim; the pose audit, 2026-10-11), between them by the extension past the hook's (`slide`). */
export const HANDLE = { back: -0.18, short: -0.1, front: 0.22, slide: [0.32, 1] };

const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0.15, flatShading: true, ...o });

function bladeGeometry() {
  // the curved cutlass blade in the XY plane, edge on +Y, the spine bending toward -Y at the tip
  const N = 20, spine = [], edge = [];
  for (let i = 0; i <= N; i++) {
    const s = i / N, x = BLADE_LEN * s, y = -0.075 * s * s * s - 0.02 * s * s;
    const w = 0.052 * (1 - 0.35 * s) * (s > 0.86 ? Math.max(0, (1 - s) / 0.14) ** 0.7 : 1);
    spine.push([x, y]); edge.push([x, y + w]);
  }
  const shape = new THREE.Shape();
  shape.moveTo(spine[0][0], spine[0][1]);
  for (let i = 1; i <= N; i++) shape.lineTo(spine[i][0], spine[i][1]);
  for (let i = N; i >= 0; i--) shape.lineTo(edge[i][0], edge[i][1]);
  shape.closePath();
  const g = new THREE.ExtrudeGeometry(shape, { depth: 0.011, bevelEnabled: false });
  g.translate(0, 0, -0.0055);
  return g;
}

export class SondelassModel {
  constructor() {
    const g = (this.group = new THREE.Group());
    g.name = 'sondelass';
    const M = {
      wood: mat(PALETTE.dark, { roughness: 0.8, metalness: 0 }),
      wrap: mat(PALETTE.deep, { roughness: 0.9, metalness: 0 }),
      brass: mat(PALETTE.glow, { roughness: 0.35, metalness: 0.6 }),
      steel: mat(PALETTE.cream, { roughness: 0.3, metalness: 0.5 }),
      clay: mat(PALETTE.pot, { roughness: 0.7, metalness: 0 }),
      blade: mat(PALETTE.hot, { roughness: 0.22, metalness: 0.6, emissive: PALETTE.glow, emissiveIntensity: 0.28 }),
    };
    this.M = M;
    const add = (geo, m, parent = g, outline = true) => { const o = new THREE.Mesh(geo, m); o.castShadow = true; parent.add(o); if (outline) addOutline(o, OUTLINE_MAT_CHAR); return o; };
    const cylX = (r0, r1, len, seg = 8) => { const geo = new THREE.CylinderGeometry(r1, r0, len, seg); geo.rotateZ(-Math.PI / 2); return geo; };

    // the handle: a wrapped grip, a pommel, a shell guard, a knuckle bow
    // (the grip's wrap a unit long, scaled to the handle and the rings spread over it as the butt slides: layout())
    this.wrap = add(cylX(0.019, 0.019, 1), M.wrap);
    this.rings = Array.from({ length: 5 }, () => { const r = add(new THREE.TorusGeometry(0.02, 0.0035, 4, 10), M.brass, g, false); r.rotation.y = Math.PI / 2; return r; });
    this.pommel = add(new THREE.SphereGeometry(0.03, 8, 6), M.brass);
    const guard = add(new THREE.CylinderGeometry(0.075, 0.07, 0.012, 14), M.brass);
    guard.rotation.z = Math.PI / 2; guard.position.x = HANDLE.front + 0.012;
    const bow = add(new THREE.TorusGeometry(0.11, 0.0055, 5, 16, Math.PI), M.brass);
    bow.rotation.z = -Math.PI / 2; bow.rotation.x = 0; bow.position.set(-0.01, 0.028, 0); bow.scale.set(1.0, 1.45, 1); // (round the fist, its back end at the short pommel)
    // the reel: a spool low on the +Y side with a crank on the +Z side
    const reel = (this.reel = new THREE.Group());
    reel.position.set(0.09, 0.088, 0);
    g.add(reel);
    const spool = add(new THREE.CylinderGeometry(0.048, 0.048, 0.05, 14), M.clay); spool.rotation.x = Math.PI / 2;
    reel.add(spool);
    this.spool = new THREE.Group(); reel.add(this.spool);
    const arm = add(new THREE.BoxGeometry(0.075, 0.008, 0.008), M.brass, this.spool, false); arm.position.set(0.034, 0, 0.038);
    const knob = add(new THREE.SphereGeometry(0.011, 6, 5), M.wrap, this.spool, false); knob.position.set(0.07, 0, 0.038);
    const stem = add(new THREE.CylinderGeometry(0.006, 0.006, 0.05, 5), M.brass, g, false); stem.rotation.x = Math.PI / 2; stem.position.set(0.09, 0.05, 0.005);
    // the sections
    this.secs = SEG_R.map((r, i) => {
      const s = add(cylX(r, r * 0.86, 1, 8), i % 2 ? M.steel : M.wood);
      this.group.add(s);
      const ring = add(new THREE.TorusGeometry(r * 1.25, r * 0.28, 4, 9), M.brass, g, false); ring.rotation.y = Math.PI / 2;
      return { mesh: s, ring };
    });
    this.bladeGroup = new THREE.Group(); g.add(this.bladeGroup);
    this.blade = add(bladeGeometry(), M.blade, this.bladeGroup);
    // the guide ring at the tip, for the line
    this.tipRing = add(new THREE.TorusGeometry(0.02, 0.004, 4, 10), M.brass, g, false);
    // the grapnel, seated at the tip: a ring and three tines
    const hook = (this.hook = new THREE.Group()); g.add(hook);
    add(new THREE.TorusGeometry(0.03, 0.007, 5, 10), M.brass, hook, false).rotation.y = Math.PI / 2;
    for (let i = 0; i < 3; i++) {
      const pivot = new THREE.Group(); pivot.rotation.x = (i / 3) * Math.PI * 2; hook.add(pivot);
      const t = add(new THREE.ConeGeometry(0.011, 0.11, 5), M.steel, pivot);
      t.geometry.translate(0, 0.055, 0);
      t.rotation.z = -Math.PI / 2 - 0.4; // along +X, splayed out from the axis
      t.position.set(0.03, 0.02, 0);
    }
    hook.visible = false;
    this.ext = 0; this.bend = 0; this.bladeOut = 0; this.hookOn = false; this.spin = 0;
    this.tipLocal = new THREE.Vector3(); this.tipDirLocal = new THREE.Vector3(1, 0, 0);
    this.layout();
    wearSkin('sondelass', { wood: M.wood, steel: M.steel, wrap: M.wrap, brass: M.brass, clay: M.clay, blade: M.blade });
  }

  /** How long the shaft is at extension e (grip and guard not counted). */
  shaftLength(e = this.ext) { return SEG_MAX.reduce((n, m) => n + THREE.MathUtils.lerp(SEG_MIN, m, e), 0); }
  /** Overall reach from the middle of the grip to the tip, blade included. */
  reach() { return X0 + this.shaftLength() + this.bladeOut * BLADE_LEN; }

  setExtension(e) { if (Math.abs(e - this.ext) > 1e-4) { this.ext = e; this.layout(); } }
  setBend(b) { if (Math.abs(b - this.bend) > 1e-4) { this.bend = b; this.layout(); } }
  setBlade(s) { if (Math.abs(s - this.bladeOut) > 1e-4) { this.bladeOut = s; this.layout(); } }
  setHook(on) { this.hookOn = on; this.hook.visible = on; }
  setReel(a) { this.spin = a; this.spool.rotation.z = a; }

  /** Where the butt ends at extension e (m along the tool, negative). */
  handleBack(e = this.ext) { const [a, b] = HANDLE.slide, k = THREE.MathUtils.clamp((e - a) / (b - a), 0, 1); return THREE.MathUtils.lerp(HANDLE.short, HANDLE.back, k * k * (3 - 2 * k)); }

  layout() {
    // the handle: the butt slid out with the rod, in for the cutlass and the hook
    const back = this.handleBack(), hl = HANDLE.front - back;
    this.wrap.position.x = (back + HANDLE.front) / 2; this.wrap.scale.set(hl, 1, 1);
    this.rings.forEach((r, i) => { r.position.x = back + 0.08 + (i / 4) * (hl - 0.16); });
    this.pommel.position.x = back - 0.01;
    let x = X0, y = 0, ang = 0;
    const n = this.secs.length;
    this.secs.forEach((sec, i) => {
      const L = THREE.MathUtils.lerp(SEG_MIN, SEG_MAX[i], this.ext);
      // a rod bends more toward the tip: each section turns by its share of the bend, weighted toward the far end
      ang += this.bend * (i + 1) / (n * (n + 1) / 2);
      const dx = Math.cos(ang), dy = Math.sin(ang);
      sec.mesh.position.set(x + dx * L / 2, y + dy * L / 2, 0);
      sec.mesh.rotation.set(0, 0, ang);
      sec.mesh.scale.set(L, 1, 1);
      x += dx * L; y += dy * L;
      sec.ring.position.set(x, y, 0);
      sec.ring.rotation.set(0, Math.PI / 2, ang);
    });
    this.tipLocal.set(x, y, 0);
    this.tipDirLocal.set(Math.cos(ang), Math.sin(ang), 0);
    this.tipRing.position.copy(this.tipLocal);
    this.tipRing.rotation.set(0, Math.PI / 2, ang);
    this.bladeGroup.position.copy(this.tipLocal).addScaledVector(this.tipDirLocal, -0.06);
    this.bladeGroup.rotation.set(0, 0, ang);
    this.bladeGroup.scale.set(Math.max(0.001, this.bladeOut), 1, 1);
    this.bladeGroup.visible = this.bladeOut > 0.01;
    this.hook.position.copy(this.tipLocal).addScaledVector(this.tipDirLocal, 0.01);
    this.hook.rotation.set(0, 0, ang);
  }

  /** The tip's world position (call after the group's transform is set). */
  tipWorld(out) { return out.copy(this.tipLocal).applyMatrix4(this.group.matrixWorld); }
  /** The blade's base and point in world space. */
  bladeSegment(a, b) {
    const base = this.tipLocal.clone().addScaledVector(this.tipDirLocal, -0.06);
    a.copy(base).applyMatrix4(this.group.matrixWorld);
    b.copy(base).addScaledVector(this.tipDirLocal, BLADE_LEN * this.bladeOut).applyMatrix4(this.group.matrixWorld);
    return a;
  }
}
