// ---------------------------------------------------------------------------------------
// THE GIANTS' PLACEHOLDER BODIES (docs/plans/MECHS.md 5.3): each giant of progress/mechs/giants.js drawn as boxes for Calissa to dress,
// built on one skeleton the runtime (giant.js) poses: `body` (tilted when it slumps or staggers, sunk when it burrows), `head`, `arms[0]`
// its right and `arms[1]` its left (each an upper arm; `fore[i]` the forearm and fist hung from it), `legs.L` / `legs.R` (+x its left: it
// faces +z), and `shell`, the barrier's sphere. Parts are named plainly (`straw.head`, `colossus.armL` ...) so the art division finds them.
//   straw     group `giant.straw`    16 m: a sack body on a scaffold of poles, straw bursting from its head and fists, stitched eyes
//   colossus  group `giant.colossus` 22 m: the Dunes' sand risen, a body of piled dunes with rock shoulders, a ridge down its back,
//             two ember eyes in a blank face, fists of packed sand; sand colours (dune, deep sand, rock), nothing glows but the eyes
// Prior art: Shadow of the Colossus (a body of piled stone and moss, a face with no features but its eyes), Ratchet & Clank's Giant Clank,
// Strawman's family (vfx/strawman.js: Pip's sack and straw).
//
//   makeMats(id) -> { colour: MeshStandardMaterial ..., barrier }   buildBody(S)   (S: a Giant: G, mats, geos; sets S.group, .body, .head,
//   .legs, .arms, .fore, .shell)   PALETTE
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

/** The placeholder colours (hex) a giant is drawn in; `barrier` is the shell's gold; `eye` is lit. */
export const PALETTE = {
  straw: { sack: 0xc9a46a, straw: 0xe3c66a, wood: 0x6b4a2a, stitch: 0x5a2a1a, barrier: 0xffd36a },
  colossus: { dune: 0xd8b878, deep: 0xb88a4c, rock: 0x7a5a38, ridge: 0xe8cf94, eye: 0xffa040, barrier: 0xffd36a },
};

export function makeMats(id) {
  const mats = Object.fromEntries(Object.entries(PALETTE[id] || PALETTE.straw).map(([k, c]) => [k, new THREE.MeshStandardMaterial({ color: c, roughness: 0.95, flatShading: true })]));
  Object.assign(mats.barrier, { transparent: true, opacity: 0.2, depthWrite: false, side: THREE.DoubleSide, emissive: new THREE.Color(PALETTE[id]?.barrier ?? 0xffd36a), emissiveIntensity: 0.7 });
  if (mats.eye) Object.assign(mats.eye, { emissive: new THREE.Color(PALETTE[id].eye), emissiveIntensity: 1.6 });
  return mats;
}

/** A box into a group, named, with its geometry kept for disposal. */
function boxer(S) {
  return (name, w, h, d, m, x, y, z, into) => {
    const g = new THREE.BoxGeometry(w, h, d); S.geos.push(g);
    const o = new THREE.Mesh(g, S.mats[m]); o.name = name; o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; into.add(o); return o;
  };
}

/** The straw giant: exactly as the training body was. */
function buildStraw(S) {
  const H = S.G.height, root = S.group = new THREE.Group(); root.name = 'giant.straw';
  S.body = new THREE.Group(); S.body.name = 'straw.body'; root.add(S.body);
  const b = boxer(S), box = (w, h, d, m, x, y, z, into = S.body) => b('straw.part', w, h, d, m, x, y, z, into);
  for (const [x, z] of [[-3, -2], [3, -2], [-3, 2], [3, 2]]) box(0.5, H * 0.85, 0.5, 'wood', x, H * 0.425, z); // (the scaffold's poles)
  box(7.2, 0.4, 0.4, 'wood', 0, H * 0.3, 2.1); box(7.2, 0.4, 0.4, 'wood', 0, H * 0.3, -2.1);
  S.legs = {}; for (const s of [-1, 1]) { const l = S.legs[s > 0 ? 'L' : 'R'] = box(2.2, 5.2, 2.2, 'sack', s * 1.8, 2.6, 0); l.name = `straw.leg${s > 0 ? 'L' : 'R'}`; } // (its sack legs)
  box(7, 8, 5, 'sack', 0, 9, 0).name = 'straw.torso'; // (the sack body)
  box(7.2, 0.3, 5.2, 'stitch', 0, 11, 0);
  S.head = new THREE.Group(); S.head.name = 'straw.head'; S.head.position.y = H - 3.4; S.body.add(S.head);
  box(4, 3.4, 3.6, 'straw', 0, 1.7, 0, S.head); // (its head, straw bursting)
  box(0.6, 0.6, 0.2, 'stitch', -0.9, 2, 1.85, S.head); box(0.6, 0.6, 0.2, 'stitch', 0.9, 2, 1.85, S.head); // (stitched eyes)
  S.arms = []; S.fore = [];
  for (const s of [-1, 1]) { // (arms[0] its right, arms[1] its left; each an upper arm and, past the elbow, a forearm and its straw fist)
    const side = s > 0 ? 'L' : 'R';
    const p = new THREE.Group(); p.name = `straw.arm${side}`; p.position.set(s * 4.4, 12.4, 0); S.body.add(p); box(1.8, 4, 1.8, 'sack', 0, -2, 0, p);
    const f = new THREE.Group(); f.name = `straw.forearm${side}`; f.position.y = -4; p.add(f); box(1.7, 4, 1.7, 'sack', 0, -2, 0, f); box(2.4, 2, 2.4, 'straw', 0, -4.4, 0, f);
    S.arms.push(p); S.fore.push(f);
  }
  shell(S, 12);
}

/** The dune colossus: 22 m of piled sand. Body to 17.5 m, head to 22; its footprint the row's 6.5 m radius (GIANTS.colossus.radius). */
function buildColossus(S) {
  const H = S.G.height, root = S.group = new THREE.Group(); root.name = 'giant.colossus';
  S.body = new THREE.Group(); S.body.name = 'colossus.body'; root.add(S.body);
  const b = boxer(S), box = (name, w, h, d, m, x, y, z, into = S.body) => b(`colossus.${name}`, w, h, d, m, x, y, z, into);
  S.legs = {}; for (const s of [-1, 1]) S.legs[s > 0 ? 'L' : 'R'] = box(`leg${s > 0 ? 'L' : 'R'}`, 3.4, 7, 3.4, 'deep', s * 2.5, 3.5, 0); // (two columns of packed sand; +x its left)
  box('pelvis', 8.4, 2.6, 5.2, 'dune', 0, 8.3, 0);
  box('torso', 9.6, 8, 6.2, 'dune', 0, 13.6, 0);
  box('chest', 7.6, 3.2, 6.8, 'deep', 0, 15.2, 0.4); // (a heavier brow of sand across the chest)
  for (let i = 0; i < 4; i++) box(`ridge${i}`, 1.4, 1.8, 1.6, 'ridge', 0, 11 + i * 2, -3.6 - (i % 2) * 0.5); // (a ridge of windblown crest down its back)
  S.head = new THREE.Group(); S.head.name = 'colossus.head'; S.head.position.y = 17.5; S.body.add(S.head);
  box('skull', 4.8, 4.5, 4.4, 'dune', 0, 2.25, 0, S.head);
  box('eyeL', 0.8, 0.5, 0.3, 'eye', 1.1, 2.6, 2.25, S.head); box('eyeR', 0.8, 0.5, 0.3, 'eye', -1.1, 2.6, 2.25, S.head); // (two ember eyes in a blank face)
  S.arms = []; S.fore = [];
  for (const s of [-1, 1]) { // (arms[0] its right, arms[1] its left)
    const side = s > 0 ? 'L' : 'R';
    const p = new THREE.Group(); p.name = `colossus.arm${side}`; p.position.set(s * 6.2, 16.2, 0); S.body.add(p);
    box(`shoulder${side}`, 4.2, 3.2, 4.2, 'rock', 0, 0.4, 0, p); box(`upperArm${side}`, 2.8, 6, 2.8, 'dune', 0, -3.2, 0, p);
    const f = new THREE.Group(); f.name = `colossus.forearm${side}`; f.position.y = -6.4; p.add(f);
    box(`forearm${side}`, 2.6, 6, 2.6, 'deep', 0, -3, 0, f); box(`fist${side}`, 3.8, 3.4, 3.8, 'dune', 0, -7.4, 0, f);
    S.arms.push(p); S.fore.push(f);
  }
  shell(S, H * 0.75);
}

/** The barrier: a plain translucent sphere about the body for now. */
function shell(S, r) {
  const sg = new THREE.SphereGeometry(r, 20, 14); S.geos.push(sg);
  S.shell = new THREE.Mesh(sg, S.mats.barrier); S.shell.name = `${S.G.id}.barrier`; S.shell.position.y = S.G.height * 0.5; S.group.add(S.shell);
}

const BUILD = { straw: buildStraw, colossus: buildColossus };
/** The body of S.G built (a giant with no body of its own gets the straw's). */
export function buildBody(S) { (BUILD[S.G.id] || buildStraw)(S); }
