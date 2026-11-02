// ---------------------------------------------------------------------------------------
// THE HANGAR'S DRESS: ITS KIT (plain name; docs/plans/MECHS.md 5.1, 5.2): what the hall's, the gantry's and the yard's dressing are built
// with, one job: a holder for one room's dressed meshes (`Dress`: its group in its zone, its materials, its outlines, the placeholders
// it hides, all let go at teardown) and the shapes they are made of, laid into vertex-coloured triangle lists (the raceway park's `Tris`)
// so a whole room's dressing is a handful of draws. Looks only: no collider is made here.
//
// Prior art: the Sandbox's hall dressing (vfx/sandbox/hall.js: her merged meshes found by colour and hidden, the level's dressed
// materials, a vertex-coloured kit mesh, outlines kept and let go); the raceway park's triangle builder (vfx/racewaypark.js Tris).
//
//   const D = new Dress(game, zone)   D.glazed(colourId)   D.kitMat()   D.glowMat()   D.put(geo, mat, { outline, shadow })   D.hide(mesh)
//   D.find(root, { key: hex })   D.lamp(x, y, z, colour, intensity, distance, decay)   D.teardown()
//   bx(Tr, x, y, z, w, h, d, col, rotY?)   cyl(Tr, a, b, r0, r1, col, seg?)   tube(Tr, pts, r, col, seg?)   chain(Tr, top, len, col)
//   lantern(Kit, Glow, at, r)   shideStrip(at, len, w)   canvasTex(w, h, paint)   V   hash
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { Tris } from '../../racewaypark.js';
import { dress } from '../../surfaces.js';
import { addOutline, OUTLINES } from '../../../render/outline.js';
import { T } from '../../../core/config.js';

export { Tris };
export const V = (x, y, z) => new THREE.Vector3(x, y, z);
export const hash = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

/** A box laid into a triangle list (its middle, size, colour, a turn about Y). */
export function bx(Tr, x, y, z, w, h, d, col, rotY = 0) {
  const g = new THREE.BoxGeometry(w, h, d); if (rotY) g.rotateY(rotY); g.translate(x, y, z); Tr.add(g, col); g.dispose();
}
/** A tapered cylinder from a to b (its foot r0, its top r1), `seg` sides, capped. */
export function cyl(Tr, a, b, r0, r1, col, seg = 8) {
  const ax = new THREE.Vector3().subVectors(b, a), len = ax.length(); if (len < 1e-4) return;
  const g = new THREE.CylinderGeometry(r1, r0, len, seg, 1, false);
  g.translate(0, len / 2, 0).applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), ax.normalize())).translate(a.x, a.y, a.z);
  Tr.add(g, col); g.dispose();
}
/** A tube along points (a rope, a cable, a rail), `r` its radius. */
export function tube(Tr, pts, r, col, seg = 5) {
  const g = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), Math.max(4, pts.length * 2), r, seg, false); Tr.add(g, col); g.dispose();
}
/** A hanging chain: links (thin tori turned a quarter each) from `top` down `len` m, a hook at its foot. */
export function chain(Tr, top, len, col, link = 0.42) {
  const n = Math.floor(len / (link * 0.78)), g0 = new THREE.TorusGeometry(link / 2, link * 0.09, 4, 8).scale(0.62, 1, 1);
  for (let i = 0; i < n; i++) {
    const g = g0.clone(); if (i % 2) g.rotateY(Math.PI / 2); g.translate(top.x, top.y - i * link * 0.78 - link / 2, top.z); Tr.add(g, col); g.dispose();
  }
  g0.dispose();
  const y = top.y - n * link * 0.78 - link * 0.4, hook = new THREE.TorusGeometry(0.42, 0.11, 5, 10, Math.PI * 1.35).rotateZ(Math.PI * 0.95).translate(top.x + 0.1, y - 0.4, top.z);
  Tr.add(hook, col); hook.dispose();
  cyl(Tr, V(top.x, y + 0.1, top.z), V(top.x, y - 0.4, top.z), 0.12, 0.12, col, 6);
}
/** A paper lantern (a chōchin): its glowing body into `Glow`, its black lacquer caps and the cord into `Kit`; `at` its middle. */
export function lantern(Kit, Glow, at, r = 0.45, paper = 0xffc46a, cap = 0x1a1210) {
  const b = new THREE.SphereGeometry(r, 10, 7).scale(1, 1.35, 1).translate(at.x, at.y, at.z); Glow.add(b, paper); b.dispose();
  for (const s of [-1, 1]) { const c = new THREE.CylinderGeometry(r * 0.62, r * 0.62, r * 0.22, 10).translate(at.x, at.y + s * r * 1.32, at.z); Kit.add(c, cap); c.dispose(); }
  cyl(Kit, V(at.x, at.y + r * 1.4, at.z), V(at.x, at.y + r * 1.4 + 0.6, at.z), 0.025, 0.025, cap, 4);
}
/** A shide: the zigzag paper lightning hung from a shimenawa, as quads [{ a, b, c, d, k }] down `len` (k: how far down, 0..1, its sway). */
export function shideStrip(at, len = 1.6, w = 0.28) {
  const out = [], steps = 4, dy = len / steps;
  for (let i = 0; i < steps; i++) {
    const x = (i % 2 ? -1 : 1) * w * 0.35, y0 = at.y - i * dy, y1 = y0 - dy * 0.92;
    out.push({ p: [V(at.x + x - w / 2, y0, at.z), V(at.x + x + w / 2, y0, at.z), V(at.x - x + w / 2, y1, at.z), V(at.x - x - w / 2, y1, at.z)], k: [i / steps, i / steps, (i + 1) / steps, (i + 1) / steps] });
  }
  return out;
}
/** A canvas texture painted once (sRGB, mipmapped, anisotropic). */
export function canvasTex(w, h, paint) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; paint(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}

/** One room's dressing: its own group (tagged with its zone), what it made and what of the placeholder it hid. */
export class Dress {
  constructor(game, zone) {
    this.game = game; this.zone = zone; this.group = new THREE.Group(); this.group.name = `${zone}.dress`; this.group.userData.zone = zone;
    this.mats = []; this.geos = []; this.tex = []; this.outlines = []; this.hidden = []; this.lamps = []; this.extra = []; this.disposers = [];
    game.scene?.add(this.group);
  }
  /** A dressed material of a colour id (the level's: a room glaze or a palette colour, vfx/surfaces.js). */
  glazed(color) {
    const m = new THREE.MeshStandardMaterial({ color, roughness: 0.92, metalness: 0, flatShading: true });
    const out = dress(m, color); this.mats.push(out); return out;
  }
  kitMat(name = 'kit') { const m = new THREE.MeshStandardMaterial({ name: `${this.zone}-${name}`, color: 0xffffff, vertexColors: true, roughness: 0.82, metalness: 0.05, flatShading: true }); this.mats.push(m); return m; }
  /** An unlit vertex-coloured material (a glow: lanterns, kiln mouths, sockets); its colour multiplies it (a flare). */
  glowMat(name = 'glow', o = {}) { const m = new THREE.MeshBasicMaterial({ name: `${this.zone}-${name}`, color: 0xffffff, vertexColors: true, toneMapped: false, side: THREE.DoubleSide, ...o }); this.mats.push(m); return m; }
  put(geo, mat, { outline = false, shadow = false, parent = this.group, order = 0 } = {}) {
    const m = new THREE.Mesh(geo, mat); m.castShadow = shadow; m.receiveShadow = !mat.isMeshBasicMaterial; m.renderOrder = order;
    parent.add(m); this.geos.push(geo); if (parent !== this.group) this.extra.push(m);
    if (mat.isMeshStandardMaterial) this.game.present?.shadeOne?.(m, true, T.visual.smooth !== false);
    if (outline) { const o = addOutline(m); if (o) this.outlines.push(o); }
    return m;
  }
  /** A placeholder's mesh hidden while dressed (shown again at teardown). */
  hide(m) { if (m?.visible) { m.visible = false; this.hidden.push(m); } }
  /** The placeholder's merged meshes by their colours: { key: [mesh] }. */
  find(root, colours) {
    const out = {};
    for (const m of root?.children || []) {
      if (!m.isMesh || m.userData.isOutline || !m.material?.color) continue;
      const hex = m.material.color.getHex(), k = Object.keys(colours).find((key) => colours[key] === hex);
      if (k) (out[k] ||= []).push(m);
    }
    return out;
  }
  /** A lamp (a plain PointLight the light budget lends a slot: adopted at once, render/lightbudget.js). */
  lamp(x, y, z, colour, intensity, distance, decay = 1.4) {
    const l = new THREE.PointLight(colour, intensity, distance, decay); l.position.set(x, y, z); l.userData.base = intensity;
    this.group.add(l); this.game.lights?.adopt?.(l); this.lamps.push(l); return l;
  }
  teardown() {
    for (const o of this.outlines) OUTLINES.delete(o);
    for (const m of this.extra) m.removeFromParent();
    this.group.removeFromParent();
    for (const g of this.geos) g.dispose();
    for (const m of this.mats) m.dispose();
    for (const t of this.tex) t.dispose();
    for (const f of this.disposers) f();
    for (const m of this.hidden) m.visible = true;
    this.mats = []; this.geos = []; this.tex = []; this.outlines = []; this.hidden = []; this.lamps = []; this.extra = []; this.disposers = [];
  }
}
