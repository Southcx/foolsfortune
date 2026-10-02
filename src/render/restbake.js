// ---------------------------------------------------------------------------------------
// REST BAKE: an articulated model at rest, drawn as one mesh per material. A tool on the Courier's back (the Sondelass's nested
// sections, reel and crank; the Veritome's boards, clasp and lens; the Soul Brush's ferrule and bristles) is forty parts and their
// outlines: eighty draws, and forty more for its shadow, every frame, in every room, for a thing that hangs still almost all the time.
// mergeStatic (merge.js) cannot help, because the parts DO move against each other when the tool is out.
//
// So while the model is at rest, its visible parts are baked, in the model's own frame, into one geometry per material (and one per
// outline material), and the parts are put on a layer no camera draws; the moment it stirs, the parts come back and the bake is
// hidden. The baked meshes share the parts' materials, so a colour or a glow set on a material while the tool rests still shows.
// Nothing else in the game needs to know: the parts keep their own `visible`, which the tool goes on setting as it likes.
//
// Prior art: the "sleeping prop" batching of prop batch (propbatch.js: batch until disturbed, then hand the object back), applied to a
// model's own parts; and the console practice of collapsing a holstered weapon into a single static mesh on the character.
//
//   const rb = new RestBake(model.group)
//   rb.update(dt, atRest, sig?)    every frame: baked once it has rested, its `sig` (its pose's numbers, rounded: Math.round, so a
//                                  spring settling about zero does not flip between -0.00 and 0.00) unchanged, for
//                                  `settle` seconds; a new sig wakes it, and a new resting one rebakes
//   rb.wake()                      the parts, now (also what update does when it is not at rest)        rb.dispose()
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const OFF = 31; // (the layer no camera, and no shadow camera, has enabled)
const _m = new THREE.Matrix4(), _n = new THREE.Matrix3(), _v = new THREE.Vector3();

export class RestBake {
  constructor(group, { settle = 0.3 } = {}) {
    this.group = group; this.settle = settle;
    this.holder = new THREE.Group(); this.holder.name = 'restbake'; this.holder.visible = false;
    group.add(this.holder);
    this.parts = []; this.on = false; this.t = 0; this.sig = null; this.made = false;
  }

  update(dt, rest, sig = '') {
    if (sig !== this.lastSig) { this.lastSig = sig; this.t = 0; } // (still moving: it has to hold a pose a while before it is baked)
    if (!rest) { this.t = 0; if (this.on) this.wake(); return; }
    this.t += dt;
    if (this.t < this.settle) { if (this.on && sig !== this.sig) this.wake(); return; }
    if (!this.made || sig !== this.sig) { this.wake(); this.bake(sig); }
    if (!this.on) this.sleep();
  }

  dispose() { this.wake(); for (const c of this.holder.children) c.geometry.dispose(); this.holder.clear(); this.holder.removeFromParent(); this.parts = []; this.made = false; }

  sleep() {
    for (const p of this.parts) p.layers.set(OFF);
    this.holder.visible = true; this.on = true;
  }
  wake() {
    for (const p of this.parts) p.layers.mask = p.userData.restMask ?? 1;
    this.holder.visible = false; this.on = false;
  }

  bake(sig) {
    for (const c of this.holder.children) c.geometry.dispose();
    this.holder.clear();
    this.parts = []; this.sig = sig; this.made = true;
    const g = this.group;
    g.updateMatrixWorld(true);
    const inv = new THREE.Matrix4().copy(g.matrixWorld).invert();
    const sets = new Map(); // material and attributes -> { mat, outline, shadow, geos, parts }
    const walk = (o) => {
      if (o === this.holder || !o.visible || o.userData.noBake) return; // (a part that moves at rest, a clock's hand, stays live)
      if (o.isMesh && !o.isSkinnedMesh && !o.isInstancedMesh && !o.isBatchedMesh && o.geometry && !Array.isArray(o.material) && !o.material.userData?.noBake) {
        const outline = !!o.userData.isOutline;
        _m.multiplyMatrices(inv, o.matrixWorld);
        const geo = this.copy(o.geometry, o.material, outline, _m);
        const key = `${o.material.uuid}|${Object.keys(geo.attributes).sort().join(',')}`; // (only like geometries merge)
        let s = sets.get(key);
        if (!s) sets.set(key, (s = { mat: o.material, outline, shadow: false, recv: false, order: o.renderOrder, geos: [], parts: [] }));
        s.shadow ||= o.castShadow; s.recv ||= o.receiveShadow;
        s.geos.push(geo);
        s.parts.push(o);
      }
      for (const c of o.children) walk(c);
    };
    walk(g);
    for (const s of sets.values()) {
      const mat = s.mat;
      const merged = s.geos.length === 1 ? s.geos[0] : mergeGeometries(s.geos, false);
      if (s.geos.length > 1) for (const x of s.geos) x.dispose();
      if (!merged) continue; // (parts whose geometries cannot be merged stay live)
      for (const o of s.parts) { o.userData.restMask = o.layers.mask; this.parts.push(o); }
      const m = new THREE.Mesh(merged, mat);
      m.castShadow = s.shadow; m.receiveShadow = s.recv; m.renderOrder = s.order;
      if (s.outline) m.userData.isOutline = true;
      this.holder.add(m);
    }
  }

  /** The part's geometry in the model's frame, with only what its material reads (and the outline's smoothed normal, turned too). */
  copy(src, mat, outline, M) {
    let g = src.index ? src.toNonIndexed() : src.clone();
    const keep = new Set(['position', 'normal']);
    if (mat.map || mat.alphaMap) keep.add('uv');
    if (mat.vertexColors) keep.add('color');
    if (outline) keep.add('smoothNormal');
    for (const k of Object.keys(g.attributes)) if (!keep.has(k)) g.deleteAttribute(k);
    for (const k of Object.keys(g.morphAttributes)) delete g.morphAttributes[k];
    g.clearGroups();
    if (!g.attributes.normal) g.computeVertexNormals();
    g.applyMatrix4(M);
    const sn = g.attributes.smoothNormal;
    if (sn) {
      _n.getNormalMatrix(M);
      for (let i = 0; i < sn.count; i++) { _v.fromBufferAttribute(sn, i).applyMatrix3(_n).normalize(); sn.setXYZ(i, _v.x, _v.y, _v.z); }
    }
    // (a mirrored part turns its faces inside out: applyMatrix4 leaves the winding, so put it right)
    if (M.determinant() < 0) {
      const p = g.attributes;
      for (const k of Object.keys(p)) {
        const a = p[k], n = a.itemSize, arr = a.array;
        for (let i = 0; i < a.count; i += 3) for (let c = 0; c < n; c++) { const t = arr[(i + 1) * n + c]; arr[(i + 1) * n + c] = arr[(i + 2) * n + c]; arr[(i + 2) * n + c] = t; }
      }
    }
    return g;
  }
}
