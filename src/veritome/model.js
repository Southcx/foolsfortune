// ---------------------------------------------------------------------------------------
// THE VERITOME, the object: a thick book bound in red-brown leather, brass at its corners and on its spine, a strap and clasp across
// the fore-edge, a ribbon, and on the cover a CLOCK whose glass is a lens (the camera) and whose hands keep the tide. Built from
// primitives in the frame every held tool shares (tools/grip.js): +X along the spine (the hand closes round it), +Y toward the
// fore-edge (the book hangs from the hand by its spine), +Z the front cover (away from the palm).
//
// Prior art: the user's sketch (a leather grimoire with a clock set in its cover and brass corner-pieces), the Sheikah Slate (a book of
// the world that is also a camera and a map), Fatal Frame's Camera Obscura (an old instrument whose lens sees what is true), and a
// sextant's and a pocket watch's brass.
//
//   const m = new VeritomeModel(); scene.add(m.group)    m.setOpen(0..1)    m.setTime(0..1: round the dial)    m.setGlow(0..1)
//   m.lensWorld(out)   (the lens's centre, world)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { addOutline, OUTLINE_MAT_CHAR } from '../outline.js';
import { mergeStatic } from '../render/merge.js';

export const BOOK = { len: 0.3, w: 0.22, t: 0.075, cover: 0.012 };
const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0.1, flatShading: true, ...o });

export class VeritomeModel {
  constructor() {
    const g = (this.group = new THREE.Group());
    g.name = 'veritome';
    const M = {
      leather: mat(0x6e2f1d, { roughness: 0.85, metalness: 0 }),
      dark: mat(0x3b1a10, { roughness: 0.9, metalness: 0 }),
      brass: mat(0xd9a04a, { roughness: 0.35, metalness: 0.7 }),
      pages: mat(0xf1dfba, { roughness: 0.95, metalness: 0 }),
      face: mat(0xf6ead0, { roughness: 0.5, metalness: 0 }),
      lens: new THREE.MeshStandardMaterial({ color: 0x9fb8ff, roughness: 0.05, metalness: 0.4, transparent: true, opacity: 0.55, emissive: 0x6c8cff, emissiveIntensity: 0.1 }),
      ribbon: mat(0xc9923e, { roughness: 0.7, metalness: 0 }),
    };
    M.lens.userData.noMerge = true;
    this.M = M;
    const add = (geo, m, parent = g, outline = true) => { const o = new THREE.Mesh(geo, m); o.castShadow = true; parent.add(o); if (outline) addOutline(o, OUTLINE_MAT_CHAR); return o; };
    const { len, w, t, cover } = BOOK;
    // the spine (what the hand holds) and the page block; the covers are on hinges so the book can open
    add(new THREE.BoxGeometry(len, 0.03, t), M.leather).position.set(0, -0.005, 0);
    for (const x of [-len / 2 + 0.03, len / 2 - 0.03]) add(new THREE.BoxGeometry(0.02, 0.035, t + 0.006), M.brass, g, false).position.set(x, -0.005, 0);
    add(new THREE.BoxGeometry(len - 0.02, w - 0.02, t - cover * 2 - 0.004), M.pages).position.set(0, w / 2, 0);
    // the ribbon, hanging out of the foot of the pages
    const rib = add(new THREE.BoxGeometry(0.012, 0.09, 0.002), M.ribbon, g, false); rib.position.set(len / 2 + 0.04, w * 0.7, 0); rib.rotation.z = 0.5;
    this.covers = [1, -1].map((side) => {
      const hinge = new THREE.Group(); hinge.position.set(0, 0, side * (t / 2 - cover / 2)); g.add(hinge);
      add(new THREE.BoxGeometry(len + 0.008, w, cover), M.leather, hinge).position.set(0, w / 2, 0);
      // brass corner-pieces on the outer corners
      for (const [x, y] of [[-1, 1], [1, 1]]) {
        const c = add(new THREE.BoxGeometry(0.045, 0.045, 0.006), M.brass, hinge, false);
        c.position.set(x * (len / 2 - 0.018), w - 0.018, side * (cover / 2 + 0.002)); c.rotation.z = Math.PI / 4 * 0.2 * x;
      }
      return hinge;
    });
    // the clock on the front cover: a brass bezel, a face, two hands, the glass (the lens)
    const front = this.covers[0];
    const clock = (this.clock = new THREE.Group()); clock.position.set(0, w * 0.52, cover / 2 + 0.004); front.add(clock);
    const bez = add(new THREE.TorusGeometry(0.058, 0.009, 6, 20), M.brass, clock); bez.position.z = 0.002;
    add(new THREE.CylinderGeometry(0.056, 0.056, 0.004, 20).rotateX(Math.PI / 2), M.face, clock, false);
    for (let i = 0; i < 4; i++) { const s = add(new THREE.BoxGeometry(0.03, 0.012, 0.005), M.brass, clock, false); const a = (i / 4) * Math.PI * 2 + Math.PI / 4; s.position.set(Math.cos(a) * 0.072, Math.sin(a) * 0.072, 0.002); s.rotation.z = a; }
    this.hands = [0.04, 0.028].map((l, i) => { const h = new THREE.Group(); h.position.z = 0.004; clock.add(h); const m = add(new THREE.BoxGeometry(0.004 + i * 0.002, l, 0.002), M.dark, h, false); m.position.y = l / 2; return h; });
    this.glass = add(new THREE.SphereGeometry(0.05, 14, 6, 0, Math.PI * 2, 0, Math.PI / 2).rotateX(Math.PI / 2).scale(1, 1, 0.35), M.lens, clock, false);
    this.glass.position.z = 0.004;
    // the strap and clasp across the fore-edge
    add(new THREE.BoxGeometry(0.03, 0.03, t + 0.012), M.dark).position.set(0, w + 0.008, 0);
    add(new THREE.BoxGeometry(0.036, 0.02, 0.01), M.brass, g, false).position.set(0, w + 0.004, t / 2 + 0.008);
    mergeStatic(g);
    this.open = 0;
    this.lensLocal = new THREE.Vector3();
  }

  /** Open the covers (0 shut, 1 open flat, as when it is read). */
  setOpen(k) {
    this.open = k;
    this.covers[0].rotation.x = -k * 1.4; this.covers[1].rotation.x = k * 1.4;
  }
  /** The clock's hands: u is how far round the dial (one turn of the long hand is the tide's whole cycle). */
  setTime(u) { this.hands[0].rotation.z = -u * Math.PI * 2 * 4; this.hands[1].rotation.z = -u * Math.PI * 2; }
  setGlow(k) { this.M.lens.emissiveIntensity = 0.1 + 1.2 * k; }
  lensWorld(out) { this.glass.updateWorldMatrix(true, false); return out.setFromMatrixPosition(this.glass.matrixWorld); }
}
