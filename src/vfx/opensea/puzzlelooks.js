// ---------------------------------------------------------------------------------------
// THE ISLETS' PUZZLES' LOOKS (docs/plans/OPEN-SEA.md section 12; Dovina's handoff, 2026-10-20): the open sea's puzzle pieces dressed
// over Dovina's placeholders (world/opensea/puzzlepieces.js, `game.opensea.pieces`). Once the pieces exist, each placeholder mesh keeps
// its place and its part in the play (the pieces' own code still lights it, hides it and reads it) and is given a shape from
// puzzlekit.js and the one islet program (vfx/opensea/isletlooks.js `isletMaterial`):
//   a PAIR's carving        its figure carved in stone and painted in its pair's colour, on a plinth; the two of a pair turned alike
//   a LINE-UP's stone       the worn disc with two footprints and a groove along the line (turned to the bearing)
//   a LINE-UP's four arcs   stone voussoirs with a Lachrymite vein toward the eye, at the placeholder's exact radius and tube (0.6% of
//                           its distance: the ring reads as one line from the stone's eye); one material a line-up, so the pieces'
//                           `sync` lights all four at once (emissive 0x6a5a30, over the vein's own glow)
//   the ECHO's two stones   the singing stone (holes through it, the degrees' colours inlaid) and the listening stone (a cup a note on
//                           its flat top); the sockets kept, as Lachrymite beads that still light in DEGREE_COLOR (puzzlepieces.js `light`)
//   a dug CACHE             (`box(C)`, asked by the pieces) its pit and thrown sand, the old sea chest, its lid open, cubes inside
//   the DIG's moment        (`dig(C)`, asked by the pieces in place of the placeholder sparkle) sand thrown up (`sea.dig`), the chest
//                           rising out of the hole and its lid swinging open, a find's glint as it opens (`sea.dig.find`)
// Seeded from the piece's id: the same carving every time, as the sea is the save's.
//
// Cost: no new program (the islet program, compiled at boot by SeaLooks.prewarm; the sockets keep the placeholders' Lambert); one draw
// a piece (a chest three: pit, body, lid); the effects on the shared particle pools.
//
// Prior art: the islets' own dressing (vfx/opensea/isletlooks.js: a placeholder's mesh kept, its geometry and program swapped, so the
// room's logic never knows); The Witness's anamorphic lines (one figure from one spot); Animal Crossing's dig and Zelda's chest (the
// thing up out of the hole, then the light out of the lid).
//
//   game.puzzleLooks = new PuzzleLooks(game)   .update(dt) (each frame: dresses the pieces once they exist, plays the digs)
//   .dig(C) -> true (the dig's moment)   .box(C) -> Object3D (the opened cache, rising if it was just dug)   .dressed
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { seeded } from '../../core/rng.js';
import { DEGREE_COLOR } from '../../tools/crucibelle/songs.js';
import { isletMaterial } from './isletlooks.js';
import { carving, lineupStone, lineupArc, singingStone, listeningStone, cacheBox } from './puzzlekit.js';

const PI = Math.PI;
const hashId = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
/** The dig's beats (real s): the chest up out of the hole, its lid open, the find's glint; how deep it starts (m). */
export const DIG = { rise: 0.8, lidFrom: 0.7, lidTo: 1.25, find: 0.95, deep: 0.55, rest: -0.12, open: 1.95 }; // (rest: half sunk in its hole)
const backOut = (t) => { const c = 1.6; return 1 + (c + 1) * (t - 1) ** 3 + c * (t - 1) ** 2; };
const _v = new THREE.Vector3();

export class PuzzleLooks {
  constructor(game) { this.game = game; this.dressed = null; this.rising = new Map(); this.boxes = new Map(); this.own = null; }
  /** The islet program's shared material (the islets' own, or one of this module's). */
  get mat() { return this.game.seaLooks?.mat || (this.own ||= isletMaterial()); }

  update(dt) {
    const P = this.game.opensea?.pieces;
    if (P && this.dressed !== P) { this.dress(P); this.dressed = P; }
    for (const [id, R] of this.rising) {
      R.t += dt; const b = this.boxes.get(id); if (!b) continue;
      b.body.position.y = THREE.MathUtils.lerp(-DIG.deep, DIG.rest, backOut(Math.min(1, R.t / DIG.rise)));
      b.lid.rotation.x = -DIG.open * THREE.MathUtils.smoothstep(R.t, DIG.lidFrom, DIG.lidTo);
      if (!R.found && R.t >= DIG.find) { R.found = true; this.game.vfx?.play?.('sea.dig.find', { pos: b.group.localToWorld(_v.set(0, b.hinge[0] + 0.1, 0)) }); }
      if (R.t >= DIG.lidTo) this.rising.delete(id);
    }
  }

  /** A placeholder given its look: the same mesh, a new geometry, the islet program. */
  swap(mesh, geo, mat = this.mat) {
    const old = [mesh.geometry, mesh.material];
    mesh.geometry = geo; mesh.material = mat; mesh.castShadow = mesh.receiveShadow = true;
    old[0].dispose(); if (old[1] !== mat && !old[1].userData?.shared) old[1].dispose();
  }

  dress(P) {
    for (const p of P.pairs) {
      const turn = seeded(hashId(p.id))() * PI * 2; // (both of a pair face the same way: one more likeness to notice)
      for (const h of p.at) if (h.mesh) { this.swap(h.mesh, carving(p.shape, p.colour, seeded(hashId(`${p.id}@${h.islet}`)), 0.75)); h.mesh.rotation.y = turn; }
    }
    for (const L of P.lineups) {
      if (L.stone) { this.swap(L.stone, lineupStone(0.1)); L.stone.rotation.y = Math.atan2(L.dir.x, L.dir.z); }
      const lit = isletMaterial(); lit.fog = false; // (one a line-up: its four arcs light together, clear of the sea's fog so they read from the spot)
      for (const a of L.arcs) { const T = a.geometry.parameters; this.swap(a, lineupArc(T.radius, T.tube), lit); }
    }
    for (const E of P.echoes) {
      this.swap(E.hearAt.mesh, singingStone(seeded(hashId(`${E.id}:sing`)), 1.1, DEGREE_COLOR));
      this.swap(E.playAt.mesh, listeningStone(seeded(hashId(`${E.id}:hear`)), 1.1, E.sockets.length));
      for (const s of E.sockets) { s.geometry.dispose(); s.geometry = new THREE.IcosahedronGeometry(0.12, 1); s.material.color.setHex(0x1c2830); }
    }
    P.sync(); // (the lit arcs and sockets, and the dug boxes, read again onto the new materials)
  }

  /** The dig's moment (puzzlepieces.js `dig`, before it asks for the box): the sand thrown up, the chest to rise. */
  dig(C) {
    this.game.vfx?.play?.('sea.dig', { pos: C.ground.clone() });
    this.rising.set(C.id, { t: 0, found: false });
    return true;
  }

  /** The opened cache at its spot: rising out of its hole if it was just dug, else resting open (a loaded save). */
  box(C) {
    const B = cacheBox(seeded(hashId(String(C.id)))), group = new THREE.Group(), body = new THREE.Group();
    const pit = new THREE.Mesh(B.pit, this.mat), chest = new THREE.Mesh(B.body, this.mat), lid = new THREE.Mesh(B.lid, this.mat);
    for (const m of [pit, chest, lid]) m.castShadow = m.receiveShadow = true;
    lid.position.set(0, B.hinge[0], B.hinge[1]); body.add(chest, lid); group.add(pit, body);
    group.position.copy(C.ground); group.rotation.y = seeded(hashId(`${C.id}:turn`))() * PI * 2; body.position.y = DIG.rest;
    group.userData.zone = 'opensea'; this.game.scene.add(group);
    const R = this.rising.has(C.id);
    const b = { group, body, lid, hinge: B.hinge }; this.boxes.set(C.id, b);
    if (R) { body.position.y = -DIG.deep; lid.rotation.x = 0; } else lid.rotation.x = -DIG.open;
    return group;
  }
}
