// ---------------------------------------------------------------------------------------
// THE VERITOME, the object: a thick book bound in red-brown leather, brass at its corners, held OPEN in both hands the way a tablet is
// held to take a picture with its rear camera. The LENS is set in the SPINE: open, the spine faces away from the reader, so the lens
// looks where she is looking while the pages face her (the left page carries the instruments in ink, the right shows the last
// photograph). The measuring instruments are on the FRONT COVER: a clock that keeps the tide, a compass rose, a sextant's arc and a
// spirit level. Shut, it hangs at the right hip, cover out.
//
// Its frame (shared by the holster, the hold and the hands, veritome/hold.js): +Y up the spine; the pages open to -X (the left half,
// the front cover's) and +X (the right half); +Z is the side the pages face (toward the reader when it is open), -Z the side the
// covers and the lens face. Shut, both halves lie along +X, the front cover facing +Z.
//
// Prior art: the user's concept art (a leather grimoire with a clock and brass instruments on its cover, the lens on its spine), the
// iPad held up to photograph (both hands on the edges, the screen toward the eye), Fatal Frame's Camera Obscura, the Sheikah Slate,
// and a sextant's and a pocket watch's brass.
//
//   const m = new VeritomeModel(); scene.add(m.group)   m.setOpen(0..1)   m.setTime(0..1)   m.setGlow(0..1)   m.setPhoto(img|canvas)
//   m.lensWorld(out)   m.edgeWorld('L' | 'R', outPos)   (where a hand holds the open book: the middle of each half's outer edge)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { addOutline, OUTLINE_MAT_CHAR } from '../outline.js';
import { mergeStatic } from '../render/merge.js';

export const BOOK = { len: 0.3, w: 0.22, pages: 0.032, cover: 0.01, tilt: 0.32 };
const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0.1, ...o });

export class VeritomeModel {
  constructor() {
    const g = (this.group = new THREE.Group());
    g.name = 'veritome';
    const M = (this.M = {
      leather: mat(0x6e2f1d, { roughness: 0.85, metalness: 0 }),
      spine: mat(0x5a2616, { roughness: 0.85, metalness: 0, side: THREE.DoubleSide }),
      dark: mat(0x3b1a10, { roughness: 0.9, metalness: 0 }),
      brass: mat(0xd9a04a, { roughness: 0.35, metalness: 0.7 }),
      pages: mat(0xf1dfba, { roughness: 0.95, metalness: 0 }),
      face: mat(0xf6ead0, { roughness: 0.5, metalness: 0 }),
      lens: new THREE.MeshStandardMaterial({ color: 0x9fb8ff, roughness: 0.05, metalness: 0.4, transparent: true, opacity: 0.7, emissive: 0x6c8cff, emissiveIntensity: 0.1 }),
    });
    M.lens.userData.noMerge = true;
    const add = (geo, m, parent, outline = true) => { const o = new THREE.Mesh(geo, m); o.castShadow = true; parent.add(o); if (outline) addOutline(o, OUTLINE_MAT_CHAR); return o; };
    const { len, w, pages, cover } = BOOK;
    // the page surfaces: canvases (the left page the instruments in ink, the right the last photograph)
    this.pageCv = [0, 1].map(() => { const c = document.createElement('canvas'); c.width = 128; c.height = 176; return c; });
    this.pageTex = this.pageCv.map((c) => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; });
    this.drawInk(this.pageCv[0]); this.drawPhoto(null);
    // the two halves, each on a hinge about the spine (Y)
    this.halves = [-1, 1].map((s, i) => {
      const h = new THREE.Group(); g.add(h);
      add(new THREE.BoxGeometry(w - 0.01, len - 0.016, pages), M.pages, h).position.set(s * (w / 2 - 0.002), 0, -pages / 2);
      add(new THREE.BoxGeometry(w + 0.008, len + 0.01, cover), M.leather, h).position.set(s * (w / 2 + 0.004), 0, -pages - cover / 2);
      const face = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.03, len - 0.04), new THREE.MeshStandardMaterial({ map: this.pageTex[i], roughness: 0.95 }));
      face.material.userData.noMerge = true; face.position.set(s * (w / 2 + 0.002), 0, 0.0008); h.add(face);
      for (const y of [-1, 1]) { // brass corners on the outer corners of the cover
        const c = add(new THREE.BoxGeometry(0.04, 0.04, 0.005), M.brass, h, false);
        c.position.set(s * (w - 0.014), y * (len / 2 - 0.014), -pages - cover - 0.002);
      }
      return h;
    });
    // the instruments on the front cover (the left half's outside: -Z when open, the face of the book when shut)
    const front = this.halves[0], oz = -pages - cover - 0.003, ix = -w / 2;
    const inst = (this.instruments = new THREE.Group()); inst.position.set(ix, 0, oz); inst.rotation.y = Math.PI; front.add(inst);
    const clock = (this.clock = new THREE.Group()); clock.position.set(0, 0.02, 0); inst.add(clock);
    add(new THREE.TorusGeometry(0.052, 0.008, 6, 20), M.brass, clock);
    add(new THREE.CylinderGeometry(0.05, 0.05, 0.004, 20).rotateX(Math.PI / 2), M.face, clock, false);
    this.hands = [0.038, 0.026].map((l, i) => { const hh = new THREE.Group(); hh.position.z = 0.004; clock.add(hh); const m = add(new THREE.BoxGeometry(0.004 + i * 0.002, l, 0.002), M.dark, hh, false); m.position.y = l / 2; return hh; });
    // a compass rose below it, a sextant's arc above, a spirit level along the foot
    const rose = new THREE.Group(); rose.position.set(-0.05, -0.095, 0); inst.add(rose);
    add(new THREE.TorusGeometry(0.022, 0.004, 5, 14), M.brass, rose, false);
    for (let i = 0; i < 4; i++) { const p = add(new THREE.ConeGeometry(0.006, 0.03, 4).rotateZ(-Math.PI / 2), M.brass, rose, false); p.rotation.z = (i * Math.PI) / 2; p.position.set(Math.cos((i * Math.PI) / 2) * 0.016, Math.sin((i * Math.PI) / 2) * 0.016, 0.002); }
    this.needle = new THREE.Group(); this.needle.position.z = 0.004; rose.add(this.needle);
    add(new THREE.BoxGeometry(0.003, 0.034, 0.002), M.dark, this.needle, false);
    add(new THREE.TorusGeometry(0.075, 0.004, 4, 18, Math.PI * 0.5).rotateZ(Math.PI * 0.25), M.brass, inst, false).position.set(0, 0.02, 0);
    add(new THREE.BoxGeometry(0.06, 0.012, 0.008), M.brass, inst, false).position.set(0.045, -0.1, 0);
    this.bubble = add(new THREE.SphereGeometry(0.004, 6, 4), M.lens, inst, false); this.bubble.position.set(0.045, -0.1, 0.005);
    // the spine: a half-round of leather about the hinge (it bulges to -X shut, to -Z open), and in it the lens
    const RS = pages + cover + 0.006;
    this.spine = new THREE.Group(); g.add(this.spine);
    add(new THREE.CylinderGeometry(RS, RS, len + 0.01, 12, 1, true, Math.PI, Math.PI), M.spine, this.spine, false);
    for (const y of [-1, 1]) add(new THREE.TorusGeometry(RS, 0.004, 4, 12, Math.PI).rotateX(Math.PI / 2).rotateY(-Math.PI / 2), M.brass, this.spine, false).position.y = y * (len / 2 - 0.02);
    const lens = (this.lens = new THREE.Group()); lens.position.set(-RS, 0.02, 0); this.spine.add(lens);
    add(new THREE.CylinderGeometry(0.03, 0.034, 0.024, 16).rotateZ(Math.PI / 2), M.brass, lens).position.x = -0.008;
    add(new THREE.CylinderGeometry(0.024, 0.024, 0.006, 14).rotateZ(Math.PI / 2), M.dark, lens, false).position.x = -0.018;
    this.glass = add(new THREE.SphereGeometry(0.022, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2).rotateZ(Math.PI / 2).scale(0.4, 1, 1), M.lens, lens, false);
    this.glass.position.x = -0.021;
    mergeStatic(g, { deep: true });
    this.open = -1; this.setOpen(0);
  }

  /** 0 shut, 1 held open (the halves a little toward the reader, as hands hold a book). */
  setOpen(k) {
    if (k === this.open) return;
    this.open = k;
    const t = BOOK.tilt;
    this.halves[1].rotation.y = -t * k;
    this.halves[0].rotation.y = Math.PI + (t - Math.PI) * k;
    this.spine.rotation.y = -(Math.PI / 2) * k;
    this.spine.scale.x = this.spine.scale.z = 1 - 0.25 * k;
  }
  /** The clock's hands: u is how far round the dial (one turn of the long hand is the tide's whole cycle). */
  setTime(u) { this.hands[0].rotation.z = -u * Math.PI * 2 * 4; this.hands[1].rotation.z = -u * Math.PI * 2; }
  /** The compass needle: the heading (radians, as the player's yaw). */
  setHeading(yaw) { this.needle.rotation.z = yaw; }
  setGlow(k) { this.M.lens.emissiveIntensity = 0.1 + 1.2 * k; }
  lensWorld(out) { this.glass.updateWorldMatrix(true, false); return out.setFromMatrixPosition(this.glass.matrixWorld); }
  /** Where a hand holds the open book (the middle of a half's outer edge, a little behind the pages). */
  edgeWorld(side, out) {
    const h = this.halves[side === 'L' ? 0 : 1], s = side === 'L' ? -1 : 1;
    h.updateWorldMatrix(true, false);
    return out.set(s * (BOOK.w - 0.01), -0.03, -BOOK.pages * 0.5).applyMatrix4(h.matrixWorld);
  }

  /** The left page: the instruments drawn in ink (a compass card, a scale, the margins ruled). */
  drawInk(c) {
    const g = c.getContext('2d'), W = c.width, H = c.height;
    g.fillStyle = '#f1dfba'; g.fillRect(0, 0, W, H);
    g.strokeStyle = 'rgba(70,40,24,.75)'; g.fillStyle = 'rgba(70,40,24,.75)'; g.lineWidth = 1.2;
    g.strokeRect(8, 8, W - 16, H - 16);
    const cx = W / 2, cy = H * 0.42, R = W * 0.3;
    g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.stroke();
    for (let i = 0; i < 32; i++) { const a = (i / 32) * Math.PI * 2, r0 = i % 8 ? R * 0.9 : R * 0.75; g.beginPath(); g.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0); g.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); g.stroke(); }
    g.beginPath(); g.moveTo(cx, cy - R * 0.7); g.lineTo(cx + 6, cy); g.lineTo(cx, cy + R * 0.7); g.lineTo(cx - 6, cy); g.closePath(); g.fill();
    for (let i = 0; i <= 10; i++) { const x = 18 + (i / 10) * (W - 36); g.beginPath(); g.moveTo(x, H - 30); g.lineTo(x, H - (i % 5 ? 36 : 42)); g.stroke(); }
    g.beginPath(); g.moveTo(18, H - 30); g.lineTo(W - 18, H - 30); g.stroke();
    for (let y = H * 0.72; y < H - 50; y += 7) { g.globalAlpha = 0.35; g.beginPath(); g.moveTo(18, y); g.lineTo(W - 18 - Math.random() * 30, y); g.stroke(); }
    g.globalAlpha = 1;
  }
  /** The right page: the last photograph, mounted in its corners (or a blank plate). */
  drawPhoto(img) {
    const c = this.pageCv[1], g = c.getContext('2d'), W = c.width, H = c.height;
    g.fillStyle = '#f1dfba'; g.fillRect(0, 0, W, H);
    const pw = W - 24, ph = pw * (120 / 192), px = 12, py = H * 0.2;
    g.fillStyle = img ? '#000' : 'rgba(60,40,30,.25)'; g.fillRect(px, py, pw, ph);
    if (img) try { g.drawImage(img, px, py, pw, ph); } catch { /* not ready */ }
    g.fillStyle = 'rgba(70,40,24,.85)';
    for (const [x, y, sx, sy] of [[px, py, 1, 1], [px + pw, py, -1, 1], [px, py + ph, 1, -1], [px + pw, py + ph, -1, -1]]) { g.beginPath(); g.moveTo(x - sx * 3, y - sy * 3); g.lineTo(x + sx * 14, y - sy * 3); g.lineTo(x - sx * 3, y + sy * 14); g.closePath(); g.fill(); }
    g.strokeStyle = 'rgba(70,40,24,.4)';
    for (let y = py + ph + 16; y < H - 14; y += 7) { g.beginPath(); g.moveTo(14, y); g.lineTo(W - 14 - Math.random() * 40, y); g.stroke(); }
    this.pageTex[1].needsUpdate = true;
  }
  setPhoto(src) {
    if (!src) return this.drawPhoto(null);
    if (typeof src === 'string') { const im = new Image(); im.onload = () => this.drawPhoto(im); im.src = src; } else this.drawPhoto(src);
  }
}
