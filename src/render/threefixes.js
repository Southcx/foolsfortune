// ---------------------------------------------------------------------------------------
// THREE FIXES: shims for bugs and slow paths in the three.js the game pins (0.170.0), each with what it stands in for. Delete one when
// three is upgraded past it (check the code it names first).
//
//   BATCH COLOUR. WebGLRenderer's setProgram asks a BatchedMesh for `colorTexture` (`object.colorTexture !== null`) to see if its
//   colours have changed, but a BatchedMesh keeps them as `_colorsTexture` (what WebGLPrograms reads for the program itself). So the
//   answer is undefined, `undefined !== null`, and every draw of every batch re-chose its program: a parameters object, a key built
//   and joined, the uniform list rebuilt. Measured in the workshop (v258): all 41 program checks a frame (32 in the main pass, 9 in
//   the shadow's), every one a batch's draw (the props', their outlines', the shards'). The getter answers with the texture three keeps.
//
//   ATTRIBUTE TABLE. BufferGeometry's deleteAttribute is `delete this.attributes[name]`, which leaves the table in V8's dictionary
//   mode, and three walks it with `for...in` for every draw of the geometry in every pass (WebGLGeometries.update): on a dictionary,
//   a new list of its keys each time. The world's painted kit takes the uv off (world/level.js, dunes.js, the Well's, the Raceway's, the
//   rest bakes, the garden's): 109 of the workshop's 4,106 geometries were dictionaries. The shim builds the table afresh without it.
//
//   MATRIX COPY. Matrix4.toArray writes its sixteen numbers through one store that sees every kind of array in the game (plain arrays,
//   Float32Arrays, Float64Arrays), so V8 makes it a generic store, and a generic store takes each number boxed: sixteen small objects a
//   matrix. three copies with it every bone of every skeleton in every pass (Skeleton.update, from WebGLObjects.update) and every
//   instance it is given (InstancedMesh and BatchedMesh setMatrixAt). The same three methods here copy with a store that only ever sees
//   a Float32Array, which V8 keeps unboxed. Measured (the heap sampled, 240 frames): garbage a frame 723 KB to 574 in the Dunes, 731
//   to 638 in the workshop (found with V8's inlining off, which shows an allocation in the function that makes it).
//
//   USERDATA COPY. Object3D.copy deep-copies userData as JSON.parse(JSON.stringify(userData)), so a userData that keeps a mesh, a
//   material or a texture (the reading view's cards keep their face, edge and edge material there: vfx/readingview.js) has every one
//   serialized on a clone, and every image through a canvas into a data URL: measured at boot (2026-10-24), 14 clones of a card
//   encoded the house deck's 2048 x 2304 atlas to a JPEG each, 66 Mpx and 1.3 real s on a desktop's CPU, 8 MB of strings thrown away
//   (a phone's memory: the build would not open on the owner's iPhone). The copy is plain JSON's for plain data, as before; a three.js
//   object (a mesh, a material, a texture, a geometry, an attribute) is kept as itself and never serialized. Before, a clone's
//   userData held JSON dumps of them, of no use to anyone.
//
//   import './render/threefixes.js'    (first, in main.js: it installs itself before any module builds a geometry)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

const _offset = new THREE.Matrix4(), _identity = new THREE.Matrix4();
/** Sixteen numbers into a Float32Array: this store sees nothing else, so it stays unboxed (MATRIX COPY). */
function put16(out, at, e) { for (let k = 0; k < 16; k++) out[at + k] = e[k]; }

/** A three.js object a userData may keep: kept by reference in a copy, never serialized (USERDATA COPY). */
const isThree = (v) => !!(v.isObject3D || v.isMaterial || v.isTexture || v.isBufferGeometry || v.isBufferAttribute || v.isInterleavedBuffer);
/** Whether a userData keeps a three.js object anywhere in it (a little way down: what a module puts there is shallow). */
function keepsThree(v, depth = 0) {
  if (!v || typeof v !== 'object' || depth > 4) return false;
  if (isThree(v)) return true;
  if (ArrayBuffer.isView(v)) return false;
  for (const k in v) { const x = v[k]; if (x && typeof x === 'object' && keepsThree(x, depth + 1)) return true; }
  return false;
}
/** JSON's copy of plain data (functions and undefined dropped, a value with toJSON as JSON makes it), a three.js object as itself. */
function copyKeeping(v) {
  if (v === null || typeof v !== 'object') return typeof v === 'function' ? undefined : typeof v === 'number' && !Number.isFinite(v) ? null : v;
  if (isThree(v)) return v;
  if (typeof v.toJSON === 'function' || ArrayBuffer.isView(v)) return JSON.parse(JSON.stringify(v));
  if (Array.isArray(v)) return v.map((x) => { const c = copyKeeping(x); return c === undefined ? null : c; });
  const out = {};
  for (const k of Object.keys(v)) { const c = copyKeeping(v[k]); if (c !== undefined) out[k] = c; }
  return out;
}

let installed = false;
function installThreeFixes() {
  if (installed) return; installed = true;
  if (!('colorTexture' in THREE.BatchedMesh.prototype)) {
    Object.defineProperty(THREE.BatchedMesh.prototype, 'colorTexture', { configurable: true, get() { return this._colorsTexture ?? null; } });
  }
  THREE.Skeleton.prototype.update = function update() {
    const bones = this.bones, inverses = this.boneInverses, out = this.boneMatrices, tex = this.boneTexture;
    for (let i = 0, n = bones.length; i < n; i++) {
      _offset.multiplyMatrices(bones[i] ? bones[i].matrixWorld : _identity, inverses[i]);
      put16(out, i * 16, _offset.elements);
    }
    if (tex !== null) tex.needsUpdate = true;
  };
  THREE.InstancedMesh.prototype.setMatrixAt = function setMatrixAt(index, matrix) { put16(this.instanceMatrix.array, index * 16, matrix.elements); };
  THREE.BatchedMesh.prototype.setMatrixAt = function setMatrixAt(instanceId, matrix) {
    const info = this._instanceInfo, tex = this._matricesTexture;
    if (instanceId >= info.length || info[instanceId].active === false) return this;
    put16(tex.image.data, instanceId * 16, matrix.elements);
    tex.needsUpdate = true;
    return this;
  };
  const copy0 = THREE.Object3D.prototype.copy;
  THREE.Object3D.prototype.copy = function copy(source, recursive = true) {
    const ud = source.userData;
    if (!keepsThree(ud)) return copy0.call(this, source, recursive);
    source.userData = {}; // (three's own JSON copy, of nothing; the real one below)
    try { copy0.call(this, source, recursive); } finally { source.userData = ud; }
    this.userData = copyKeeping(ud);
    return this;
  };
  THREE.BufferGeometry.prototype.deleteAttribute = function deleteAttribute(name) {
    const was = this.attributes, table = {};
    for (const k in was) if (k !== name) table[k] = was[k];
    this.attributes = table;
    return this;
  };
}
installThreeFixes();
