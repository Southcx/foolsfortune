// ---------------------------------------------------------------------------------------
// EACH SIDE OF THE TSUITATE ITS OWNER'S (plain name; South, 2026-10-29: "the sides tsuitate should take on the shape of the aesthetic of
// the courier or aberrant respectively. More thematic resonance doubled by the backgrounds"): the clay frame (board.js) dressed on each
// side by whoever holds that end, the same world its half of the domains' clash shows behind it.
//   YOURS        your Spirit Garden's (gardenground.js reads it): a vine wound up your post in the season's leaf, its flowers in the
//                garden's bloom, a briar's thorns where it is overgrown; while the garden is bare, Lachrymite grown out of the clay in the
//                film (the deep and the film, your half's own)
//   THE WISP'S   the fens (aberrants/wisp.js): iron bands strapped round its post, reeds and cattails standing up its outer side, a little
//                lantern hung from an iron hook, lit amber
//   THE JELLY'S  the bog (aberrants/jelly.js): its slime run down its post in long drops, beading on the frame's corners, a pool at its foot
//   STRAWMAN'S   its sparring yard's (aberrants/strawmanyard.js `strawmanPost`): its post bound in burlap round the EmO column and the
//                kintsugi seam, patched and cross-stitched, straw out of the cut edges, a stuffed target bolted on, a card tag swinging
//   ANY OTHER    the frame as made
// One merged mesh a material a side, made at the duel's open in the frame's own programs (the clay's, the slime's, the glow's): nothing new.
// Prior art: the decorated arcade cabinet of Puzzle Fighter (each well's side its fighter's), Persona's All-Out Attack frames, the
// tsuitate painted panel by panel; the garden's own pieces (vfx/garden/).
//
//   const F = new FrameDress(view)   F.open(state, foe)   F.update(dt)   F.close()   FRAME_DRESS (the knobs)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { DUEL_VIEW, feelColour } from './layout.js';
import { duelMaterials } from './pieces.js';
import { featTint } from '../oxidation.js';
import { WispElite } from './aberrants/wisp.js';
import { JellyElite } from './aberrants/jelly.js';
import { StrawmanElite } from './aberrants/strawman.js';
import { strawmanPost } from './aberrants/strawmanyard.js';

/** leaves: on your vine; flowers among them; reeds by the Wisp's post; drops down the jelly's; flicker: the lantern's (real s). */
export const FRAME_DRESS = { leaves: 34, flowers: 7, crystals: 9, reeds: 9, drops: 11, flicker: 7 };
const IRON = 0x232022, REED = 0x5a5a30, CATTAIL = 0x4a2e1c, LAMP = 0xffb060;
const _c = new THREE.Color(), _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _s = new THREE.Vector3(), _p = new THREE.Vector3();
const hsh = (i, k) => { const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };

/** A geometry painted one colour (the clay's vertex colours). */
function paint(g, hex) { const n = g.attributes.position.count, c = new Float32Array(n * 3); _c.set(hex); for (let i = 0; i < n; i++) c.set([_c.r, _c.g, _c.b], i * 3); g.setAttribute('color', new THREE.BufferAttribute(c, 3)); return g.index ? g.toNonIndexed() : g; }
/** A part placed: turned, scaled, moved. */
function put(g, x, y, z, rx = 0, ry = 0, rz = 0, sx = 1, sy = sx, sz = sx) { _e.set(rx, ry, rz); _q.setFromEuler(_e); return g.applyMatrix4(_m.compose(_p.set(x, y, z), _q, _s.set(sx, sy, sz))); }
const merge = (parts) => { if (!parts.length) return null; const g = mergeGeometries(parts.map((p) => (p.index ? p.toNonIndexed() : p))); g.computeVertexNormals(); return g; };

export class FrameDress {
  constructor(view) { this.view = view; this.group = new THREE.Group(); this.group.name = 'duel-framedress'; view.frame.add(this.group); this.lamp = null; this.t = 0; }

  open(state, foe) {
    this.close(); const V = this.view, B = V.board; if (!B?.W) return;
    const { base, border: b, lip, depth } = DUEL_VIEW, W = B.W, H = B.H, L = { x: -W / 2 - b / 2, base, H, b, lip, depth, W };
    this.yours(L); if (StrawmanElite.fits(state, foe)) strawmanPost(this, L); else if (WispElite.fits(state, foe)) this.fens(L); else if (JellyElite.fits(state, foe)) this.bog(L); // (Strawman's first: a practice duel on another's board is still its own)
  }

  add(geo, mat) { if (!geo) return; const m = new THREE.Mesh(geo, mat); m.castShadow = true; m.renderOrder = 1; this.group.add(m); return m; }

  /** Your post: your garden's vine, or the film's Lachrymite while it is bare. */
  yours(L) {
    const M = duelMaterials(), mood = this.view.garden?.mood, x0 = L.x, F = FRAME_DRESS, leaves = [], flowers = [];
    if (!mood) { // (a bare garden: Lachrymite out of the clay, in the film)
      for (let i = 0; i < F.crystals; i++) { const y = L.base + L.H * (0.08 + 0.85 * hsh(i, 1)), side = hsh(i, 2) < 0.5 ? -1 : 1, h = 0.06 + 0.08 * hsh(i, 3);
        featTint(hsh(i, 4) * 3, _c, { bright: 1.2 }); const g = paint(new THREE.OctahedronGeometry(0.03, 0), _c.getHex());
        leaves.push(put(g, x0 + side * L.b * 0.45, y, L.lip * 0.5 + 0.01, 0, 0, side * (0.5 + 0.5 * hsh(i, 5)), 1, h / 0.03, 1)); }
      this.add(merge(leaves), M.clayVc); return; }
    const leaf = (mood.leaf || mood.grass), bloom = mood.flowers?.length ? mood.flowers : [mood.blossom || leaf], briar = mood.briar || 0;
    for (let i = 0; i < F.leaves; i++) { const u = i / (F.leaves - 1), y = L.base - L.b * 0.3 + (L.H + L.b * 1.2) * u, a = u * Math.PI * 7 + hsh(i, 1) * 0.6; // (the vine winding up the post)
      const px = x0 + Math.sin(a) * L.b * 0.62, pz = L.lip * 0.5 + Math.cos(a) * L.depth * 0.6 + 0.02;
      _c.copy(leaf).lerp(new THREE.Color(0x3a2a18), briar * 0.6 * hsh(i, 2)); const g = paint(new THREE.CircleGeometry(0.035, 5), _c.getHex()); g.scale(0.6, 1, 1);
      leaves.push(put(g, px, y, pz, 0, a, 1.2 * (hsh(i, 3) - 0.5), 1 + 0.5 * hsh(i, 4)));
      if (briar > 0.35 && i % 4 === 0) leaves.push(put(paint(new THREE.ConeGeometry(0.008, 0.04, 4), 0x2a1a10), px, y + 0.02, pz, 0, 0, 1.3)); } // (thorns, overgrown)
    for (let i = 0; i < Math.round(F.flowers * (1 - briar * 0.7)); i++) { const u = 0.1 + 0.85 * hsh(i, 6), a = u * Math.PI * 7, c = bloom[i % bloom.length];
      const g = paint(new THREE.IcosahedronGeometry(0.026, 0), c.getHex ? c.getHex() : c); flowers.push(put(g, x0 + Math.sin(a) * L.b * 0.66, L.base + L.H * u, L.lip * 0.5 + Math.cos(a) * L.depth * 0.6 + 0.035)); }
    this.add(merge(leaves), M.clayVc); this.add(merge(flowers), M.clayVc);
  }

  /** The Wisp's post: iron bands, reeds and cattails up its outer side, a little lantern on a hook, lit. */
  fens(L) {
    const M = duelMaterials(), x0 = -L.x, F = FRAME_DRESS, iron = [], reeds = [];
    for (const k of [0.18, 0.5, 0.82]) iron.push(put(paint(new THREE.BoxGeometry(L.b * 1.12, 0.035, L.depth + L.lip + 0.02), IRON), x0, L.base + L.H * k, (L.lip - L.depth) / 2));
    iron.push(put(paint(new THREE.BoxGeometry(0.18, 0.018, 0.018), IRON), x0 + L.b * 0.5 + 0.08, L.base + L.H * 0.7, L.lip * 0.3)); // (the hook's arm)
    iron.push(put(paint(new THREE.BoxGeometry(0.012, 0.06, 0.012), IRON), x0 + L.b * 0.5 + 0.16, L.base + L.H * 0.7 - 0.03, L.lip * 0.3));
    for (let i = 0; i < F.reeds; i++) { const h = L.H * (0.35 + 0.5 * hsh(i, 1)), x = x0 + L.b * 0.5 + 0.03 + 0.12 * hsh(i, 2), z = -0.05 + 0.12 * hsh(i, 3), lean = (hsh(i, 4) - 0.5) * 0.25;
      reeds.push(put(paint(new THREE.CylinderGeometry(0.006, 0.01, h, 4), REED), x, L.base - L.b + h / 2, z, 0, 0, lean));
      if (i % 2 === 0) reeds.push(put(paint(new THREE.CapsuleGeometry(0.016, 0.06, 2, 6), CATTAIL), x - Math.sin(lean) * h * 0.5, L.base - L.b + h - 0.02, z, 0, 0, lean)); }
    this.add(merge(iron), M.clayVc); this.add(merge(reeds), M.clayVc);
    const cage = put(paint(new THREE.CylinderGeometry(0.03, 0.035, 0.08, 6, 1, true), IRON), x0 + L.b * 0.5 + 0.16, L.base + L.H * 0.7 - 0.1, L.lip * 0.3);
    this.add(merge([cage]), M.clayVc);
    this.lamp = new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 8), new THREE.MeshBasicMaterial({ name: 'duel-glow', color: LAMP, toneMapped: false })); // (the glow's program)
    this.lamp.position.set(x0 + L.b * 0.5 + 0.16, L.base + L.H * 0.7 - 0.1, L.lip * 0.3); this.group.add(this.lamp);
  }

  /** The jelly's post: its slime run down in long drops, beads on the corners, a pool at the foot. */
  bog(L) {
    const M = duelMaterials(), x0 = -L.x, F = FRAME_DRESS, drops = [];
    for (let i = 0; i < F.drops; i++) { const y = L.base + L.H * (0.1 + 0.9 * hsh(i, 1)), len = 0.06 + 0.16 * hsh(i, 2), x = x0 + (hsh(i, 3) - 0.5) * L.b * 0.9;
      const g = new THREE.SphereGeometry(0.028, 8, 6); g.scale(1, len / 0.028 * 0.5, 0.7); drops.push(put(g, x, y - len * 0.4, L.lip + 0.005)); }
    for (const [x, y] of [[x0, L.base + L.H + L.b * 0.5], [x0, L.base - L.b * 0.5], [x0 - L.W * 0.2, L.base + L.H + L.b]]) { const g = new THREE.SphereGeometry(0.05, 10, 8); g.scale(1.3, 0.8, 0.8); drops.push(put(g, x, y, L.lip)); }
    const pool = new THREE.CylinderGeometry(0.28, 0.32, 0.02, 18); drops.push(put(pool, x0 + 0.05, 0.012, 0.05));
    const mat = M.slime.clone(); feelColour('gall', mat.color); this.slimeMat = mat; // (the slime's program, its colour Gall)
    this.add(merge(drops), mat);
  }

  update(dt) {
    this.t += dt; if (!this.lamp) return; const k = 0.75 + 0.25 * Math.sin(this.t * FRAME_DRESS.flicker) * Math.sin(this.t * 3.1 + 1);
    this.lamp.material.color.setHex(LAMP).multiplyScalar(1.4 * k); const W = this.view.elite?.on && this.view.elite.dark != null ? 1 - 0.85 * this.view.elite.dark : 1; this.lamp.material.color.multiplyScalar(W); // (dimming with the Wisp's own lantern as its fuel goes)
  }

  close() {
    for (const m of [...this.group.children]) { this.group.remove(m); m.geometry?.dispose(); if (m === this.lamp) m.material.dispose(); }
    this.slimeMat?.dispose(); this.slimeMat = null; this.lamp = null;
  }
}
