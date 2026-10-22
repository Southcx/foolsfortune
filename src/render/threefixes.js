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
//   import './render/threefixes.js'    (first, in main.js: it installs itself before any module builds a geometry)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

const _offset = new THREE.Matrix4(), _identity = new THREE.Matrix4();
/** Sixteen numbers into a Float32Array: this store sees nothing else, so it stays unboxed (MATRIX COPY). */
function put16(out, at, e) { for (let k = 0; k < 16; k++) out[at + k] = e[k]; }

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
  THREE.BufferGeometry.prototype.deleteAttribute = function deleteAttribute(name) {
    const was = this.attributes, table = {};
    for (const k in was) if (k !== name) table[k] = was[k];
    this.attributes = table;
    return this;
  };
}
installThreeFixes();
