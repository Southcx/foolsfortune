// ---------------------------------------------------------------------------------------
// THE SOUL BRUSH, the object: a calligrapher's brush (a Japanese fude) grown to the size of a club, as long as the Courier's leg and
// arm together. Its weight is all in the head, so it swings like a hammer. Built from primitives (no imported asset), in the frame
// every held tool shares (tools/grip.js): +X along the haft toward the head, origin at the middle of the grip, +Z the way the palm faces.
//
//   butt cap and a cord loop . the haft (dark wood, bound in three places) . the grip wrap . a brass ferrule . the TUFT
//
// The tuft is two pieces, a root and a tip, so it can bend: it lags behind a swing and drags when it is pulled along the ground
// (`setBend`), which is most of what makes it read as hair and not as a cone. It is soaked in slip (the potter's liquid clay: the
// brush is a slip-trailer's brush, and slip is what it lays on the world), and the point darkens with Lachryma, the ink of the
// Celestial Brush, when the mind is in it (`setInk`).
//
// Prior art: Okami's Celestial Brush (Amaterasu's brush, a tail that is also a brush), Splatoon's Inkbrush and Octobrush (a brush as a
// melee weapon that paints what it passes over), and the shape of a real fude: a round, bellied tuft that comes to a fine point.
//
//   const m = new BrushModel(); scene.add(m.group)
//   m.setBend(y, z)   the tuft's lag (radians, about the haft's -Z and +Y)     m.setInk(0..1)   m.setWet(0..1)
//   m.tipWorld(out)  m.headWorld(out)  m.headSegment(a, b)   (after the group's matrix is set)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { PALETTE } from '../../core/config.js';
import { addOutline, OUTLINE_MAT_CHAR } from '../../render/outline.js';
import { mergeStatic } from '../../render/merge.js';

const _a = new THREE.Color(), _b = new THREE.Color();
export const BRUSH = { back: -0.3, ferrule: 0.78, root: 0.86, tip: 1.26, radius: 0.09 };
const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0.1, flatShading: true, ...o });

/** A bellied tuft as a lathe about +X, from x0 to x1 (the profile: r(u), u 0..1 along it). */
function tuft(x0, x1, r, seg = 10, rings = 7) {
  const pts = [];
  for (let i = 0; i <= rings; i++) { const u = i / rings; pts.push(new THREE.Vector2(Math.max(0.0005, r(u)), x0 + (x1 - x0) * u)); }
  const g = new THREE.LatheGeometry(pts, seg);
  g.rotateZ(-Math.PI / 2); // (the lathe's +Y along the tool's +X)
  // colour down its length: the slip's pale at the root, going dark toward the point where the ink gathers
  const pos = g.attributes.position, col = new Float32Array(pos.count * 3), a = new THREE.Color(PALETTE.cream), b = new THREE.Color(PALETTE.pale);
  for (let i = 0; i < pos.count; i++) { const u = (pos.getX(i) - BRUSH.root) / (BRUSH.tip - BRUSH.root); const c = a.clone().lerp(b, THREE.MathUtils.clamp(u * 1.4, 0, 1)); col.set([c.r, c.g, c.b], i * 3); }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return g;
}

export class BrushModel {
  constructor() {
    const g = (this.group = new THREE.Group());
    g.name = 'soulbrush';
    const M = {
      wood: mat(PALETTE.deep, { roughness: 0.75, metalness: 0 }),
      wrap: mat(PALETTE.dark, { roughness: 0.95, metalness: 0 }),
      bind: mat(PALETTE.pot, { roughness: 0.8, metalness: 0 }),
      brass: mat(PALETTE.glow, { roughness: 0.35, metalness: 0.6 }),
      hair: mat(0xffffff, { vertexColors: true, roughness: 0.5, metalness: 0 }),
    };
    M.hair.emissive = new THREE.Color(0x3a1f5a); M.hair.emissiveIntensity = 0;
    M.hair.userData.noMerge = true;
    this.M = M;
    const add = (geo, m, parent = g, outline = true) => { const o = new THREE.Mesh(geo, m); o.castShadow = true; parent.add(o); if (outline) addOutline(o, OUTLINE_MAT_CHAR); return o; };
    const cylX = (r0, r1, len, seg = 8) => { const geo = new THREE.CylinderGeometry(r1, r0, len, seg); geo.rotateZ(-Math.PI / 2); return geo; };
    const at = (o, x) => { o.position.x = x; return o; };

    // the haft: tapering a little toward the ferrule, a grip wrap where the hand is, three bindings, a butt cap and a cord loop
    const hl = BRUSH.ferrule - BRUSH.back;
    at(add(cylX(0.021, 0.026, hl), M.wood), (BRUSH.back + BRUSH.ferrule) / 2);
    at(add(cylX(0.025, 0.025, 0.3), M.wrap), -0.02);
    for (const x of [-0.19, 0.15, 0.46]) at(add(cylX(0.029, 0.029, 0.03), M.bind, g, false), x);
    at(add(new THREE.SphereGeometry(0.03, 8, 6), M.brass), BRUSH.back);
    const loop = add(new THREE.TorusGeometry(0.05, 0.006, 4, 12), M.bind, g, false);
    loop.position.set(BRUSH.back - 0.06, 0, 0); loop.rotation.y = Math.PI / 2; loop.rotation.x = 0.3;
    // the ferrule: brass, flaring to hold the tuft
    at(add(cylX(0.028, 0.05, BRUSH.root - BRUSH.ferrule + 0.02, 10), M.brass), (BRUSH.ferrule + BRUSH.root) / 2);
    mergeStatic(g);
    // the tuft: a root (bellied) and a tip (the point), the tip on a pivot so it can lag
    const R = BRUSH.radius, split = BRUSH.root + (BRUSH.tip - BRUSH.root) * 0.42;
    this.head = new THREE.Group(); this.head.position.x = BRUSH.root; g.add(this.head);
    const body = (u) => R * (0.62 + 0.38 * Math.sin(Math.PI * Math.min(1, u * 0.9 + 0.1)));
    const rootGeo = tuft(BRUSH.root, split, (u) => body(u * 0.42), 10, 5);
    rootGeo.translate(-BRUSH.root, 0, 0);
    this.root = add(rootGeo, M.hair, this.head);
    this.tipPivot = new THREE.Group(); this.tipPivot.position.x = split - BRUSH.root; this.head.add(this.tipPivot);
    const tipGeo = tuft(split, BRUSH.tip, (u) => body(0.42 + 0.58 * u) * Math.pow(1 - u, 0.8), 10, 6);
    tipGeo.translate(-split, 0, 0);
    this.tip = add(tipGeo, M.hair, this.tipPivot);
    this.bendY = 0; this.bendZ = 0; this.ink = 0; this.wet = 1; this.inkSet = false;
    this.tipLocal = new THREE.Vector3(BRUSH.tip, 0, 0);
    this.setInk(0);
  }

  /** The tuft's lag: y bends the head toward -Y (the way a downswing leaves it), z toward +Z. */
  setBend(y, z = 0) {
    this.bendY = y; this.bendZ = z;
    this.head.rotation.set(0, -z * 0.35, -y * 0.35);
    this.tipPivot.rotation.set(0, -z * 0.65, -y * 0.65);
  }
  /** How much of the point is dark with Lachryma (0: all slip, 1: the ink up to the belly and glowing). */
  setInk(k) {
    if (Math.abs(k - this.ink) < 0.01 && this.inkSet) return;
    this.ink = k; this.inkSet = true;
    // (the tuft's colours, again: the ink creeps from the point back toward the belly as it fills, oil-dark with a violet sheen)
    const up = (mesh, u0, u1) => {
      const pos = mesh.geometry.attributes.position, col = mesh.geometry.attributes.color;
      let x0 = Infinity, xmax = -Infinity; for (let i = 0; i < pos.count; i++) { x0 = Math.min(x0, pos.getX(i)); xmax = Math.max(xmax, pos.getX(i)); }
      for (let i = 0; i < pos.count; i++) {
        const u = u0 + (u1 - u0) * ((pos.getX(i) - x0) / (xmax - x0 || 1));
        const c = _a.set(PALETTE.cream).lerp(_b.set(PALETTE.pale), THREE.MathUtils.clamp(u * 1.4, 0, 1));
        const inked = THREE.MathUtils.smoothstep(u, 1 - (0.12 + 0.6 * k), 1.02 - (0.1 + 0.6 * k));
        c.lerp(_b.set(0x17111a), inked * 0.95);
        col.setXYZ(i, c.r, c.g, c.b);
      }
      col.needsUpdate = true;
    };
    up(this.root, 0, 0.42); up(this.tip, 0.42, 1);
    this.M.hair.emissiveIntensity = 0.5 * k;
  }
  /** Loaded with slip or wrung out (the hair's sheen). */
  setWet(k) { this.wet = k; this.M.hair.roughness = 0.75 - 0.5 * k; }

  /** The point's world position (after the group's world matrix is set; the lag included). */
  tipWorld(out) { this.tipPivot.updateWorldMatrix(true, false); return out.set(BRUSH.tip - (BRUSH.root + (BRUSH.tip - BRUSH.root) * 0.42), 0, 0).applyMatrix4(this.tipPivot.matrixWorld); }
  /** The belly of the head, where a blow lands. */
  headWorld(out) { this.head.updateWorldMatrix(true, false); return out.set((BRUSH.tip - BRUSH.root) * 0.3, 0, 0).applyMatrix4(this.head.matrixWorld); }
  /** From the ferrule to the point (world): the part that strikes. */
  headSegment(a, b) { a.set(BRUSH.ferrule, 0, 0).applyMatrix4(this.group.matrixWorld); this.tipWorld(b); return a; }
}
