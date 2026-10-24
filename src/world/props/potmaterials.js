// ---------------------------------------------------------------------------------------
// THE POTS' MATERIALS: the three vertex-coloured materials every pot, sliced piece and shard of the breakables is drawn with, made once
// because several parts of Breakables (the pot*.js modules) and its shard batches all use the same three. The colour is in the vertices,
// so one material serves every colour of ware.
//   potMat    a pot standing: the lathe mesh, matte and flat shaded
//   shardMat  an earthenware or stoneware shard, and a sliced piece
//   glazeMat  glazed ware: a porcelain pot, a pot in a glossy room glaze (vfx/roomglazes.js), and glass shards
// Split out of breakables.js (the module contract's 800 lines); they are the materials that stood at its top.
//
//   import { potMat, shardMat, glazeMat } from './potmaterials.js'
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

export const potMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.82, metalness: 0, flatShading: true });
export const shardMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, flatShading: true });
export const glazeMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.35, metalness: 0.05, flatShading: true });
