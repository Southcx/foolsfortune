// ---------------------------------------------------------------------------------------
// PROGRAM KEYS: where two of three's material classes compile the same shader under different program keys, the key is evened out here
// so they share one program (the program audit, 2026-10-25: scripts/programcensus.mjs). Imported first by main.js, before any material
// is made. Nothing here changes a pixel.
//   LineBasicMaterial   draws with MeshBasicMaterial's 'basic' shader, but carries no `combine`, so every line compiled a twin of the
//                       mesh program beside it (three's getProgramCacheKey reads parameters.combine). `combine` only picks the env map's
//                       blend (ENVMAP_BLENDING_*), and a line has no env map: given MeshBasicMaterial's default, a line shares its program.
// Prior art: three.js's own program cache key (WebGLPrograms.getProgramCacheKey); Unity's shader variant stripping.
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

if (THREE.LineBasicMaterial.prototype.combine === undefined) THREE.LineBasicMaterial.prototype.combine = THREE.MultiplyOperation;
