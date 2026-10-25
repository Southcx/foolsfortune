// ---------------------------------------------------------------------------------------
// THE CHARACTER'S SCRATCH (part of courier/character.js): the vectors, quaternions and matrix the Character's methods work in, made once
// (they run every tick, and a literal in a loop is an object a frame), and the three small things every part reads: up, the sides and the
// smoothstep. One set shared by the class and all its parts, as when they were one file: a call from one part into another touches the
// same scratch it always did.
//
//   import { _v1, _q1, _m1, UP, LR, smooth } from './character/scratch.js'
//   _v1 .. _v6 (Vector3)   _q1, _q2 (Quaternion)   _m1 (Matrix4)   UP (0, 1, 0: read only)   LR (the sides, ['L', 'R'])   smooth(a, b, t) -> 0..1
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

export const UP = new THREE.Vector3(0, 1, 0);
export const LR = ['L', 'R']; // (the sides, made once: a literal in a loop is an object a frame)
export const _v1 = new THREE.Vector3(), _v2 = new THREE.Vector3(), _v3 = new THREE.Vector3(), _v4 = new THREE.Vector3();
export const _v5 = new THREE.Vector3(), _v6 = new THREE.Vector3();
export const _q1 = new THREE.Quaternion(), _q2 = new THREE.Quaternion();
export const _m1 = new THREE.Matrix4();

export function smooth(a, b, t) { const x = THREE.MathUtils.clamp((t - a) / (b - a), 0, 1); return x * x * (3 - 2 * x); }
