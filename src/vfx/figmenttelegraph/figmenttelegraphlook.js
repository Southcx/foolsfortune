// ---------------------------------------------------------------------------------------
// THE FIGMENT ATTACK TELEGRAPHS' LOOK: how one Figment attack telegraph is drawn this frame, for the service that keeps them
// (vfx/figmenttelegraph.js `FigmentTelegraphs`). A slot is one draped ground mesh (step 1 the area's EDGE in the Mind's ink, step 2
// the FILL to the edge, step 3 the damage type's colours and motif); the glyphs are one batch of camera-facing quads shared by all of
// them (step 3 the STATUS glyph where the fill lands last, step 4 the ANSWER glyphs that stand; on a gazer the eye, over an add its
// marker, a pip a real second left from step 2). The program is figmenttelegraphshader.js; the shapes come from figmenttelegraphshapes.js.
//
// Prior art: FFXIV's ground markers and head markers (the shape, the answer drawn on it), WildStar's fill to the edge, WoW 11.1's
// crisp-edged swirlies; the glyph batch is the particle systems' one-draw quad buffer (three.js's own Points and sprite batches).
//
//   makeFigmentTelegraphSlot(atlas, i) -> { drape, mat, mesh, busy }      new FigmentTelegraphGlyphs(atlas)   .mesh   .begin()   .end(t, camera)
//   drawFigmentTelegraphGround(slot, T, S, F, prog, alpha, svc)            drawFigmentTelegraphGlyphs(glyphs, T, S, F, origin, prog, alpha, svc)
//     T: the service's record of one mark ({ mark, o, eta }); S: shapesOf(...); F: frameOf(...); prog: the fill 0..1 (-1 none);
//     svc: what the drawing asks of the service (heightAt, where, draughtHex, t)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { toWorld } from './figmenttelegraphshapes.js';
import { figmentTelegraphMaterial, TYPE_INDEX, TYPE_TINTS } from './figmenttelegraphshader.js';
import { cellOf } from './figmenttelegraphatlas.js';
import { FigmentTelegraphDrape } from './figmenttelegraphdrape.js';

const BOARDS = 96;
/** The light of each glyph: the answers the Mind's pale; a status its aura's colour (vfx/library.js `aura.<status>`). */
export const GLYPH_TINT = {
  answer: 0xe6dcff, figmentMark: 0xe6dcff, stun: 0xf2cc5a, doubt: 0x6a96f0, charm: 0xf4a6bc, blind: 0x9ad8f0, confusion: 0xb48ae0,
  slow: 0x7fb2ff, halt: 0xbfe6ff, sleep: 0xd9c8ff, soaked: 0x8fd0c8,
};
const _c = new THREE.Color(), _v = new THREE.Vector3();

/** One ground slot: a draped grid and its material (each its own uniforms over the one program). */
export function makeFigmentTelegraphSlot(atlas, i) {
  const drape = new FigmentTelegraphDrape(), mat = figmentTelegraphMaterial({ mode: 'ground', atlas });
  const mesh = new THREE.Mesh(drape.geometry, mat);
  mesh.name = `figmentTelegraph.mark.${i}`; mesh.frustumCulled = false; mesh.visible = false; mesh.renderOrder = 4; mesh.raycast = () => {};
  mesh.userData.zoneFree = true;
  return { drape, mat, mesh, busy: null };
}

/** The glyphs: one batch of camera-facing quads, filled afresh each frame. */
export class FigmentTelegraphGlyphs {
  constructor(atlas) {
    const n = BOARDS, g = new THREE.BufferGeometry();
    const at = (k) => new THREE.BufferAttribute(new Float32Array(n * 4 * k), k).setUsage(THREE.DynamicDrawUsage);
    g.setAttribute('position', at(3)); g.setAttribute('glyph', at(4)); g.setAttribute('shift', at(3)); g.setAttribute('tint', at(3));
    const corner = new Float32Array(n * 8), idx = new Uint16Array(n * 6);
    for (let i = 0; i < n; i++) {
      corner.set([-1, -1, 1, -1, 1, 1, -1, 1], i * 8);
      idx.set([i * 4, i * 4 + 1, i * 4 + 2, i * 4, i * 4 + 2, i * 4 + 3], i * 6);
    }
    g.setAttribute('corner', new THREE.BufferAttribute(corner, 2)); g.setIndex(new THREE.BufferAttribute(idx, 1)); g.setDrawRange(0, 0);
    this.g = g; this.mat = figmentTelegraphMaterial({ mode: 'glyphs', atlas }); this.n = 0;
    this.mesh = new THREE.Mesh(g, this.mat);
    this.mesh.name = 'figmentTelegraph.glyphs'; this.mesh.frustumCulled = false; this.mesh.visible = false; this.mesh.renderOrder = 44; this.mesh.raycast = () => {};
  }
  begin() { this.n = 0; }
  /** One glyph this frame: art id, where (world), size (m), alpha, tint (hex), stand (its foot on the point), shift [x, y, scale]. */
  add(art, p, size, alpha, tint, stand = 1, sx = 0, sy = 0, sc = 1) {
    if (this.n >= BOARDS) return;
    const g = this.g.attributes, k = this.n++;
    _c.setHex(tint);
    for (let v = 0; v < 4; v++) {
      const o = k * 4 + v;
      g.position.setXYZ(o, p.x, p.y, p.z); g.glyph.setXYZW(o, cellOf(art), size, alpha, stand);
      g.shift.setXYZ(o, sx, sy, sc); g.tint.setXYZ(o, _c.r, _c.g, _c.b);
    }
  }
  end(t, camera) {
    const a = this.g.attributes;
    this.mesh.visible = this.n > 0;
    if (this.n) { this.g.setDrawRange(0, this.n * 6); for (const k of ['position', 'glyph', 'shift', 'tint']) a[k].needsUpdate = true; }
    this.mat.uniforms.uT.value = t;
    if (camera?.fov) this.mat.uniforms.uPxK.value = (2 * Math.tan((camera.fov * Math.PI) / 360)) / 480;
  }
  dispose() { this.g.dispose(); this.mat.dispose(); }
}

/** The ground mark of one Figment attack telegraph: the drape laid, the shape's primitives, pockets and stamps, its fill and type. */
export function drawFigmentTelegraphGround(slot, T, S, F, prog, alpha, svc, originY) {
  const { mesh, mat, drape } = slot, U = mat.uniforms, o = T.o, mark = T.mark;
  drape.lay(S.bounds, (x, z) => svc.heightAt(x, z, originY));
  U.uFrame.value.set(F.ox, F.oz, F.fx, F.fz);
  S.prims.forEach((p, i) => { U.uPrimA.value[i].set(p.kind, p.x, p.z, p.rot || 0); U.uPrimB.value[i].set(p.a, p.b); });
  U.uPrimN.value = S.prims.length;
  S.pockets.forEach((k, i) => U.uPocket.value[i].set(k.x, k.z, k.r)); U.uPocketN.value = S.pockets.length;
  S.stamps.forEach((s, i) => { U.uStamp.value[i].set(s.x, s.z, s.angle, s.size); U.uStampCell.value[i] = cellOf(s.art); }); U.uStampN.value = S.stamps.length;
  const friendly = !!o.friendly;
  U.uFriendly.value = friendly ? 1 : 0;
  if (friendly) U.uFriend.value.setHex(o.color ?? (typeof o.friendly === 'number' ? o.friendly : svc.draughtHex()));
  U.uFill.value = friendly ? -1 : prog;
  const ty = friendly || !mark.type ? -1 : TYPE_INDEX[mark.type] ?? -1;
  U.uType.value = ty;
  if (ty >= 0) { const [a, b] = TYPE_TINTS[mark.type]; U.uTintA.value.setHex(a); U.uTintB.value.setHex(b); }
  U.uCaution.value = mark.shape === 'tracked' ? 1 : 0; U.uLocked.value = o.locked ? 1 : 0;
  U.uT.value = svc.t; U.uAlpha.value = alpha;
  mesh.visible = true;
}

/** The glyphs of one Figment attack telegraph: the status (step 3), the answers that stand (step 4), and the shapes with no ground. */
export function drawFigmentTelegraphGlyphs(G, T, S, F, origin, prog, alpha, svc) {
  const o = T.o, mark = T.mark;
  if (o.friendly) return;
  const lift = (lx, lz, y = null) => { const [x, z] = toWorld(F, lx, lz); return new THREE.Vector3(x, y ?? svc.heightAt(x, z, origin.y), z); };
  // the status the blow builds, where its fill lands last (step 3)
  const statuses = mark.status ? [].concat(mark.status) : [];
  const statusAt = (p, size, dx = 0) => statuses.forEach((s, i) => G.add(`status.${s}`, p, size, alpha, GLYPH_TINT[s] ?? GLYPH_TINT.answer, 1, dx + (i - (statuses.length - 1) / 2) * 1.05, 0, 1));
  if (S?.far && statuses.length) statusAt(lift(S.far[0], S.far[1]), 1.6);
  // the answer's glyphs that stand (the guard on the rim, the high ground, the bait)
  for (const b of S?.boards || []) {
    const p = b.local ? lift(b.local[0], b.local[1]) : new THREE.Vector3(b.world.x, b.world.y ?? svc.heightAt(b.world.x, b.world.z, origin.y), b.world.z);
    G.add(b.art, p, b.size, alpha, GLYPH_TINT.answer, b.stand);
  }
  // the shapes with no ground: on the thing itself
  const pips = (p, seconds, size) => { const n = Math.min(10, Math.max(0, Math.ceil(seconds - 1e-3))); for (let i = 0; i < n; i++) G.add('figmentMark.pip', p, size, alpha, GLYPH_TINT.figmentMark, 1, (i - (n - 1) / 2) * 0.34, 1.05, 0.34); };
  if (mark.shape === 'gaze') {
    const p = svc.where(o.on, origin.clone()).add(_v.set(0, o.height ?? (o.on ? 0 : 2), 0)), size = o.glyphSize ?? 2.2;
    G.add(mark.answer === 'lookAway' ? 'answer.lookAway' : 'figmentMark.eye', p, size, alpha, GLYPH_TINT.answer, 1);
    if (prog >= 0) pips(p, Math.max(0, T.eta), size);
    if (statuses.length) statusAt(p.clone(), size * 0.6, 1.45); // (beside the eye, never over it)
  } else if (mark.shape === 'adds' || mark.shape === 'split') {
    for (const a of o.adds || []) {
      const p = svc.where(a, new THREE.Vector3()).add(_v.set(0, o.addHeight ?? 1.4, 0)), size = o.glyphSize ?? 1.4;
      G.add(mark.answer === 'killFirst' ? 'answer.killFirst' : 'figmentMark.add', p, size, alpha, GLYPH_TINT.answer, 1);
      if (prog >= 0) pips(p, o.left ?? Math.max(0, T.eta), size);
    }
  }
}
