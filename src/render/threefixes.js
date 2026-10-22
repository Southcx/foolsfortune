// ---------------------------------------------------------------------------------------
// THREE FIXES: shims for bugs in the three.js the game pins (0.170.0), each with what it stands in for. Delete one when three is
// upgraded past the bug (check the code it names first).
//
//   BATCH COLOUR. WebGLRenderer's setProgram asks a BatchedMesh for `colorTexture` (`object.colorTexture !== null`) to see if its
//   colours have changed, but a BatchedMesh keeps them as `_colorsTexture` (what WebGLPrograms reads for the program itself). So the
//   answer is undefined, `undefined !== null`, and every draw of every batch re-chose its program: a parameters object, a key built
//   and joined, the uniform list rebuilt. Measured in the workshop (v258): all 41 program checks a frame (32 in the main pass, 9 in
//   the shadow's), every one a batch's draw (the props', their outlines', the shards'). The getter answers with the texture three keeps.
//
//   installThreeFixes()    (once, before the first frame)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

let installed = false;
export function installThreeFixes() {
  if (installed) return; installed = true;
  if (!('colorTexture' in THREE.BatchedMesh.prototype)) {
    Object.defineProperty(THREE.BatchedMesh.prototype, 'colorTexture', { configurable: true, get() { return this._colorsTexture ?? null; } });
  }
}
