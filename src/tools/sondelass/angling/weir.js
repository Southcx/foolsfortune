// ---------------------------------------------------------------------------------------
// THE WEIR: the Sondelass's own place, built for testing everything it does. It used to be a vaulted hall far out in the basement's
// layer; now it is the OASIS at the heart of the dunes (dunes.js): a pond on a flat of packed sand, open to the sky, the skiff drawn
// up on the beach. The pond and the well are cut into the dunes' height field; what is built round them is here. All positions are
// in the oasis's frame: metres from its centre, and up from the packed sand (the plateau).
//
//   THE SHALLOWS  a pond 48 x 32 m, four terraces down: a wading shelf (0.55 m), a mid terrace (2 m), a deep bowl (4.2 m) and a trench
//                 (6 m) with a stone pillar standing in it. The species keep to their depth bands, so where you cast decides what comes.
//   THE PIER      a plank pier from the south beach out over the shelf to the mid terrace; the place to stand and cast from.
//   THE WELL      a stone shaft 9.5 m deep to the east, full of liquid Lachryma, where the deep things live, and, at the top of the
//                 tide, the one that has no name.
//   THE YARD      a row of pots on plinths on the west side for the cutlass, and a tall pillar with a ledge for the hook.
//   THE TALLY     a stone board on the north beach of every kind you have landed (a silhouette until you have), how many, the biggest.
//   THE PERGOLA   timber beams over the water on posts, hook rings hanging from them (what the grapnel is for), and the tide lamp:
//                 it shows the tide (low, rising, high, falling: 80 s each); which of the entities are about depends on it (species.js).
//   THE TREASURY  five plinths on the north beach (a chest of each tier), the Tithe's console and its dais.
//   and palms round the flat, reeds at the water's edge.
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { PALETTE } from '../../../core/config.js';
import { label } from '../../../world/basement/basement.js';
import { Fish } from './fish.js';
import { setHaloTexture } from './fishmesh.js';
import { SPECIES, BY_SPECIES, TIDES, TIDE_LEN, weightOf } from './species.js';
import { Ripples } from './lure.js';
import { sfx } from '../../../audio/sfx.js';
import { FONT } from '../../../ui/theme.js';
import { mergeStatic } from '../../../render/merge.js';
import { RAPIER, GROUPS } from '../../../core/physics.js';
import { addOutline } from '../../../render/outline.js';
import { TITHE } from '../../../world/treasure/treasure.js';
import { ECON } from '../../../progress/econ/table.js';

import { DUNE, OASIS, POND, WELL, pondDepth } from '../../../world/dunes/dunes.js';
import { stream } from '../../../core/rng.js';
const simRand = stream('tools/sondelass/angling/weir'); // (the simulation's chance: core/rng.js, the same twice)
const _rm = new THREE.Matrix4(), _rq = new THREE.Quaternion(), _rs = new THREE.Vector3(), _re = new THREE.Euler();

// the oasis's frame, in the world
export const OX = DUNE.x + OASIS.x, OY = DUNE.y + OASIS.y, OZ = DUNE.z + OASIS.z;
/** Where the palms stand round the oasis flat (oasis frame, x / z): the Veritome photographs them too. */
export const PALM_SPOTS = [[-26, -14], [-30, 8], [-22, 26], [-40, -22], [24, -16], [28, 22], [44, -8], [46, 18], [-6, 40], [12, 42], [-44, 30], [36, 36], [-16, -30], [20, -34]].map(([x, z]) => [x * 1.3, z * 1.3]); // (spread with the pond, R46)
/** The tally's stone (world). */
export const TALLY_AT = [OX + 16, OY + 2.2, OZ + 41];
const B = OY; // (the builders below were written for a floor at B; the packed sand is that floor now)
export const WEIR_SPAWN = { pos: [OX + OASIS.x - 3, OY, OZ + POND.z - POND.rz - 7], yaw: 0 }; // (the dunes' spawn point: dunes.js)
/** The yard's west edge (oasis frame): its pots' plinths, past the pond's west shore. */
const YARD = -POND.rx - 20;
const RIM = { x0: WELL.x0 - 0.5, x1: WELL.x1 + 0.5, z0: WELL.z0 - 0.5, z1: WELL.z1 + 0.5 };

/** Is a world point at the oasis? */
export function inWeir(p, pad = 0) {
  return Math.hypot(p.x - OX, p.z - OZ) < OASIS.flat + pad && p.y > OY - 16 && p.y < OY + 30;
}

/** The treasury on the north beach: five plinths (one chest of each tier, common to prismatic), the Tithe's console and the dais its sealed chests land on. */
export const TREASURY = { z: 40, plinths: [-6.8, -3.4, 0, 3.4, 6.8], top: 0.55, tithe: { x: -11, z: 40.3 }, dais: { x: -15.5, z: 38 } };
export const WEIR_FLOOR = B;

const pondD = (x, z) => Math.max(0, pondDepth(x - DUNE.x, z - DUNE.z));
export const POOLS = [
  { id: 'shallows', name: 'THE SHALLOWS', x0: OX + POND.x - POND.rx - 3, x1: OX + POND.x + POND.rx + 3, z0: OZ + POND.z - POND.rz - 2.5, z1: OZ + POND.z + POND.rz + 2.5, surface: DUNE.y + POND.surface, bottom: DUNE.y + POND.surface - 6, maxDepth: 6,
    depthAt: pondD, species: SPECIES.filter((s) => !s.legend).map((s) => s.id), cap: 13 },
  { id: 'well', name: 'THE WELL', x0: DUNE.x + WELL.x0, x1: DUNE.x + WELL.x1, z0: DUNE.z + WELL.z0, z1: DUNE.z + WELL.z1, surface: DUNE.y + WELL.surface, bottom: DUNE.y + WELL.surface - WELL.depth, maxDepth: WELL.depth,
    depthAt: () => WELL.depth, species: ['dread', 'hush', 'hunger', 'lachryma'], cap: 3 },
];

export function buildWeir(L, env) {
  const C = PALETTE, S = L.scene;
  const blk = (x0, x1, y0, y1, z0, z1, color = C.mid, opts = {}) =>
    L.box([OX + (x0 + x1) / 2, B + (y0 + y1) / 2, OZ + (z0 + z1) / 2], [x1 - x0, y1 - y0, z1 - z0], color, opts);
  const solid = { outline: false, shadow: false };
  const STONE = 0xc9a07a, TIMBER = 0x7a4a30;
  const [pool, well] = POOLS;
  env.water.add({ x0: pool.x0, x1: pool.x1, z0: pool.z0, z1: pool.z1, surface: pool.surface, bottom: pool.bottom, depthAt: pondD });
  env.water.add({ x0: well.x0, x1: well.x1, z0: well.z0, z1: well.z1, surface: well.surface, bottom: well.bottom, kind: 'lachryma' }); // (the Well is filled with liquid Lachryma)
  // ---- the well: a stone shaft, its floor, a rim, and flagstones round it over the dug-out sand
  const wb = WELL.surface - OASIS.y - WELL.depth; // (its floor, in the oasis frame)
  blk(RIM.x0, RIM.x1, wb - 0.5, wb, RIM.z0, RIM.z1, C.dark, solid);
  blk(RIM.x0, WELL.x0, wb, 0.35, RIM.z0, RIM.z1, STONE, solid); blk(WELL.x1, RIM.x1, wb, 0.35, RIM.z0, RIM.z1, STONE, solid);
  blk(WELL.x0, WELL.x1, wb, 0.35, RIM.z0, WELL.z0, STONE, solid); blk(WELL.x0, WELL.x1, wb, 0.35, WELL.z1, RIM.z1, STONE, solid);
  const F = 3.6; // (the flagstones reach past where the sand was dug)
  blk(RIM.x0 - F, RIM.x1 + F, -0.3, 0.06, RIM.z0 - F, RIM.z0, STONE, { outline: false }); blk(RIM.x0 - F, RIM.x1 + F, -0.3, 0.06, RIM.z1, RIM.z1 + F, STONE, { outline: false });
  blk(RIM.x0 - F, RIM.x0, -0.3, 0.06, RIM.z0, RIM.z1, STONE, { outline: false }); blk(RIM.x1, RIM.x1 + F, -0.3, 0.06, RIM.z0, RIM.z1, STONE, { outline: false });
  // ---- the pier, its posts and lanterns (out from the south beach over the shelf)
  const pz0 = POND.z - POND.rz - 3.5, pz1 = POND.z - 4;
  blk(-2, 2, -0.16, 0, pz0, pz1, C.wood);
  for (let z = pz0 + 2; z <= pz1; z += 4) { blk(-1.9, -1.5, -7, 0, z - 0.2, z + 0.2, TIMBER, solid); blk(1.5, 1.9, -7, 0, z - 0.2, z + 0.2, TIMBER, solid); }
  for (const z of [pz0 + 2, pz0 + 8, pz1 - 0.5]) for (const x of [-1.7, 1.7]) { blk(x - 0.05, x + 0.05, 0, 1.2, z - 0.05, z + 0.05, C.dark, solid); const l = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 6), new THREE.MeshBasicMaterial({ color: C.hot })); l.position.set(OX + x, B + 1.3, OZ + z); S.add(l); }
  // ---- the stone pillar in the trench (a ledge on top to hook to)
  blk(POND.x - 1.5, POND.x + 1.5, -7, 0.15, POND.z - 1.5, POND.z + 1.5, STONE);
  blk(POND.x - 0.5, POND.x + 0.5, 0.15, 7, POND.z - 0.5, POND.z + 0.5, C.mid);
  blk(POND.x - 1.2, POND.x + 1.2, 7, 7.3, POND.z - 1.2, POND.z + 1.2, C.dark);
  // ---- the pergola: posts, two long beams over the water and three across, the rings that hang from them
  // (laid out on the pond's own measures: K is how much bigger it is than the pond it was first built for, 22 by 15)
  const K = POND.rx / 22, top = 10.5, zs = [POND.z - 7 * K, POND.z + 7 * K], xs = [-22, -8, 8, 22].map((x) => x * K);
  for (const z of zs) for (const x of xs) blk(x - 0.3, x + 0.3, -7, top, z - 0.3, z + 0.3, TIMBER);
  for (const z of zs) blk(-23.5 * K, 23.5 * K, top - 0.7, top, z - 0.35, z + 0.35, TIMBER);
  for (const x of [-8, 0, 8].map((x) => x * K)) blk(x - 0.3, x + 0.3, top - 1.2, top - 0.7, zs[0] - 1, zs[1] + 1, TIMBER);
  const ringMat = new THREE.MeshBasicMaterial({ color: C.glow });
  for (const z of zs) for (const x of [-18, -12, 4, 14].map((x) => x * K)) {
    const r = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.06, 6, 20), ringMat);
    r.position.set(OX + x, B + top - 1.9, OZ + z); r.rotation.x = Math.PI / 2; S.add(r);
    const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.1, 4), new THREE.MeshBasicMaterial({ color: C.dark }));
    chain.position.set(OX + x, B + top - 1.25, OZ + z); S.add(chain);
  }
  // ---- the yard (west): plinths for the pots, and a tall pillar with a ledge
  for (let i = 0; i < 6; i++) blk(YARD - 2, YARD, 0, 0.8, -7 + i * 4, -5 + i * 4, C.mid);
  blk(YARD + 4.5, YARD + 7, 0, 6, 19, 21.5, STONE);
  blk(YARD + 4.5, YARD + 9, 5.6, 6, 19, 23.5, C.dark);
  // ---- the treasury: five plinths, the Tithe's console and its dais
  for (const x of TREASURY.plinths) { blk(x - 0.75, x + 0.75, 0, TREASURY.top, TREASURY.z - 0.55, TREASURY.z + 0.55, C.mid); blk(x - 0.85, x + 0.85, TREASURY.top, TREASURY.top + 0.06, TREASURY.z - 0.65, TREASURY.z + 0.65, C.dark); }
  { const { x, z } = TREASURY.tithe; blk(x - 0.55, x + 0.55, 0, 1.06, z - 0.32, z + 0.32, STONE); blk(x - 0.62, x + 0.62, 1.06, 1.12, z - 0.4, z + 0.4, C.dark); }
  { const { x, z } = TREASURY.dais; blk(x - 1.15, x + 1.15, -0.2, 0.14, z - 1.15, z + 1.15, C.dark); blk(x - 0.9, x + 0.9, 0.14, 0.16, z - 0.9, z + 0.9, C.mid, solid); }
  // ---- the tally's stone (the board itself is drawn on it: Weir.buildBoard)
  blk(9.4, 22.6, -0.5, 6.1, TALLY_AT[2] - OZ + 0.1, TALLY_AT[2] - OZ + 0.7, STONE);
  // words
  const T = (t, x, z, o = {}) => label(S, t, [OX + x, B + 0.02 + (o.y || 0), OZ + z], { rotY: Math.PI, ...o });
  T('THE WEIR', -3, pz0 - 3.2, { width: 3.2, sub: 'Q draw · 2 the rod · 4-8 aspect · hold LMB cast · MMB sound' });
  T('PIER', 0, pz0 + 0.8, { width: 1.1, sub: 'hold LMB · release to cast', y: -0.02 });
  T('THE YARD', YARD + 4, -10, { width: 2.2, sub: '1 cutlass · LMB combo · RMB lunge' });
  T('THE WELL', (WELL.x0 + WELL.x1) / 2, RIM.z0 - 2.2, { width: 2, sub: 'deep things · the top of the tide', y: 0.06 });
  ['COMMON', 'FINE', 'RARE', 'EPIC', 'PRISMATIC'].forEach((n, i) => T(n, TREASURY.plinths[i], TREASURY.z - 1.35, { width: 1.5 }));
  T('THE TREASURY', 0, TREASURY.z - 3.4, { width: 3, sub: 'F open · they come back' });
  T('THE TITHE', TREASURY.tithe.x, TREASURY.tithe.z - 1.55, { width: 2, sub: `F · ${TITHE.cost} cubes · a sealed chest lands on the dais` });
  T('HOOK', -12, pz0 - 1, { width: 1.1, sub: '3 the hook · LMB throw · hold: reel · RMB: pay out / tap: let go' });
}

/** Chests on the plinths (they close again after a while), and the Tithe's console brought alive. */
export function stockTreasury(game) {
  const V = (x, y, z) => new THREE.Vector3(OX + x, B + y, OZ + z);
  TREASURY.plinths.forEach((x, tier) => game.chests.spawn(tier, V(x, TREASURY.top + 0.06, TREASURY.z), { yaw: Math.PI, id: `weir.${tier}`, respawn: () => (game.mode === 'debug' ? ECON.treasury.debug : ECON.treasury.respawn[tier]), floor: B }));
  game.chests.setTithe({ pos: V(TREASURY.tithe.x, 0, TREASURY.tithe.z), yaw: Math.PI, dais: V(TREASURY.dais.x, 0.16, TREASURY.dais.z) });
}

export function spawnWeir(Bk, level) {
  const C = PALETTE;
  const kinds = ['jar', 'amphora', 'pitcher', 'melon', 'jar', 'amphora'];
  for (let i = 0; i < 6; i++) Bk.spawn({ kind: kinds[i], pos: [OX + YARD - 1, B + 0.8 + 0.002, OZ - 6 + i * 4], color: i % 2 ? C.potLight : C.pot, respawn: 6 });
  for (const [x, z, s] of [[YARD + 6, -4, 1.0], [YARD + 7, 0, 1.0], [YARD + 6, 4, 0.9]]) level.crate([OX + x, B + s / 2, OZ + z], s);
}

// ---------------------------------------------------------------------------------------
// The room alive: the tide, the shoals that come with it, the tally board, the reeds and the mist.
// ---------------------------------------------------------------------------------------
export class Weir {
  constructor(game) {
    this.game = game;
    setHaloTexture(game.fx.haloTexture);
    this.pools = POOLS.map((p) => ({ ...p, fish: [] }));
    this.tide = 1; this.tideT = 0; this.t = 0; this.spawnT = 2;
    this.ripples = new Ripples(game.scene, 16);
    this.fish = []; // all of them
    this.hooks = null; // set by the Angler: { lure(), callbacks }
    this.sound = { r: 0, src: new THREE.Vector3(), id: 0 }; // (r: how far the sounding has reached; id: which sounding)
    this.legendSeen = -1;
    // the lamp over the water: shows the tide
    const g = (this.lamp = new THREE.Group());
    this.lampY = B + 8.3; // (it hangs from the pergola's middle beam, over the pillar)
    g.position.set(OX + POND.x, this.lampY, OZ + POND.z);
    this.lampMat = new THREE.MeshBasicMaterial({ color: 0xffb27a });
    g.add(new THREE.Mesh(new THREE.IcosahedronGeometry(0.55, 1), this.lampMat));
    for (const r of [0.9, 1.3]) { const t = new THREE.Mesh(new THREE.TorusGeometry(r, 0.03, 4, 30), new THREE.MeshBasicMaterial({ color: 0xffe0c0 })); t.rotation.x = Math.PI / 2 + (r > 1 ? 0.4 : 0); g.add(t); this.lampRings = this.lampRings || []; this.lampRings.push(t); }
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 2, 4), new THREE.MeshBasicMaterial({ color: PALETTE.dark }));
    rod.position.y = 1.6; g.add(rod);
    this.lampLight = new THREE.PointLight(0xffb27a, 26, 60, 1.1);
    g.add(this.lampLight);
    game.scene.add(g);
    // the reeds at the water's edge: the only thing here that moves for no reason but the wind (one instanced draw for the bed of them:
    // forty-six meshes were forty-six draws, render/propbatch.js's rule for many copies of a prop)
    this.reeds = [];
    const reedMat = new THREE.MeshStandardMaterial({ color: 0x5a7a4a, roughness: 0.9, flatShading: true });
    const cone = new THREE.ConeGeometry(0.05, 1, 4); cone.translate(0, 0.5, 0);
    let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0, tries = 0; i < 46 && tries < 2000; tries++) {
      const a = rnd() * Math.PI * 2, rr = 0.85 + rnd() * 0.3;
      const x = OX + POND.x + Math.cos(a) * POND.rx * rr, z = OZ + POND.z + Math.sin(a) * POND.rz * rr;
      const d = pondDepth(x - DUNE.x, z - DUNE.z);
      if (d < 0.05 || d > 0.5 || (Math.abs(x - OX) < 2.6 && z < OZ + POND.z)) continue; // (in the shallows, and not on the pier's line)
      const h = 1.2 + rnd() * 1.1;
      this.reeds.push({ pos: new THREE.Vector3(x, DUNE.y + POND.surface - d, z), h, p: rnd() * 6 }); i++;
    }
    this.reedBed = new THREE.InstancedMesh(cone, reedMat, this.reeds.length);
    this.reedBed.userData.zone = 'dunes';
    this.swayReeds(0);
    game.scene.add(this.reedBed);
    // palms round the flat, and the skiff's mooring post
    buildPalms(game);
    // what the oasis offers a creature (creatures/ai/ecology.js): water in the shallows all round the pond, shade under every palm, and the fish
    // that come up into the shallows, for anything quick enough
    const eco = game.ai?.eco;
    if (eco) {
      for (let i = 0; i < 14; i++) {
        const a = (i / 14) * Math.PI * 2, x = OX + POND.x + Math.cos(a) * POND.rx * 0.95, z = OZ + POND.z + Math.sin(a) * POND.rz * 0.95;
        eco.offer({ kind: 'water', pos: new THREE.Vector3(x, DUNE.y + POND.surface, z), radius: 2.2 });
      }
      for (const [lx, lz] of PALM_SPOTS) eco.offer({ kind: 'shade', pos: new THREE.Vector3(OX + lx, game.dunes.heightAt(OX + lx, OZ + lz), OZ + lz), radius: 2.6 });
      const shallows = this.pools.find((p) => p.id === 'shallows');
      eco.provide('prey', (pos, range) => (shallows?.fish || []).filter((f) => !f.dying && f.state !== 'hooked' && f.state !== 'bite' && f.pos.y > shallows.surface - 1.1 && f.pos.distanceTo(pos) < range)
        .map((f) => ({ pos: f.pos, ref: f, kind: 'fish', gone: () => f.dying || !this.fish.includes(f), take: () => { if (f.dying || !this.fish.includes(f)) return false; this.remove(f); return true; } })));
    }
    // a board of what has been landed
    this.board = this.buildBoard();
  }

  swayReeds(t) {
    const M = this.reedBed, m = _rm, q = _rq, s = _rs, e = _re;
    this.reeds.forEach((r, i) => { e.set(0, 0, Math.sin(t * 0.8 + r.p) * 0.09); s.set(1, r.h, 1); M.setMatrixAt(i, m.compose(r.pos, q.setFromEuler(e), s)); });
    M.instanceMatrix.needsUpdate = true;
    if (!M.boundingSphere) M.computeBoundingSphere();
  }

  get near() { const p = this.game.player.pos; return inWeir(p, 8) || !!this.hooks?.lure()?.active; }
  poolAt(x, z) { for (const p of this.pools) if (x > p.x0 && x < p.x1 && z > p.z0 && z < p.z1) return p; return null; }
  get tideDef() { return TIDES[this.tide]; }

  // ---- the tally board (on its stone on the north beach)
  buildBoard() {
    const c = document.createElement('canvas'); c.width = 1400; c.height = 620;
    const tex = new THREE.CanvasTexture(c);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(12, 12 * 620 / 1400), new THREE.MeshBasicMaterial({ map: tex, transparent: true }));
    m.position.set(OX + 16, B + 3.2, OZ + 31.07); m.rotation.y = Math.PI; // (on the tally's stone, facing the water)
    this.game.scene.add(m);
    return { c, tex, v: -1, m };
  }

  drawBoard() {
    const L = this.game.ledger, b = this.board, g = b.c.getContext('2d');
    g.clearRect(0, 0, b.c.width, b.c.height);
    g.fillStyle = 'rgba(28,13,8,.86)'; g.fillRect(0, 0, b.c.width, b.c.height);
    g.strokeStyle = '#ffb27a'; g.lineWidth = 5; g.strokeRect(8, 8, b.c.width - 16, b.c.height - 16);
    g.fillStyle = '#ffb27a'; g.font = `700 42px ${FONT.title}`; g.textAlign = 'left';
    g.fillText('THE TALLY', 40, 68);
    g.fillStyle = '#fbe3cf'; g.font = `26px ${FONT.sys}`; g.textAlign = 'right';
    g.fillText(`${L.get('fish.total')} landed · ${L.under('fish.sp.').filter(([, v]) => v > 0).length}/${SPECIES.length} kinds`, b.c.width - 40, 66);
    SPECIES.forEach((sp, i) => {
      const col = i % 5, row = Math.floor(i / 5), x = 40 + col * 270, y = 110 + row * 250;
      const n = L.get(`fish.sp.${sp.id}`), cm = L.best(`fish.cm.${sp.id}`);
      g.fillStyle = 'rgba(255,178,122,.10)'; g.fillRect(x, y, 250, 230);
      g.fillStyle = n ? `#${sp.color.toString(16).padStart(6, '0')}` : '#3b1c13';
      g.beginPath(); g.ellipse(x + 125, y + 78, 62 + (sp.size[1] > 200 ? 10 : 0), 26, 0, 0, Math.PI * 2); g.fill();
      g.beginPath(); g.moveTo(x + 185, y + 78); g.lineTo(x + 225, y + 48); g.lineTo(x + 225, y + 108); g.closePath(); g.fill();
      g.fillStyle = '#fbe3cf'; g.font = `500 24px ${FONT.ui}`; g.textAlign = 'center';
      g.fillText(n ? sp.name.toUpperCase() : '? ? ?', x + 125, y + 150);
      g.font = `22px ${FONT.sys}`; g.fillStyle = '#ffb27a';
      g.fillText(n ? `${n} · best ${Math.round(cm)} cm` : 'not yet landed', x + 125, y + 190);
    });
    b.tex.needsUpdate = true;
  }

  // ---- population
  weights(pool) {
    const out = [];
    for (const id of pool.species) {
      const sp = BY_SPECIES[id];
      if (sp.legend || !sp.tides.includes(this.tide)) continue;
      out.push([sp, sp.rarity]);
    }
    return out;
  }

  spawn(pool, sp, cm = null) {
    if (!sp) {
      const ws = this.weights(pool);
      if (!ws.length) return null;
      let r = simRand() * ws.reduce((a, [, w]) => a + w, 0);
      for (const [s, w] of ws) { r -= w; if (r <= 0) { sp = s; break; } }
      sp = sp || ws[0][0];
    }
    const k = Math.pow(simRand(), 1.7);
    const size = cm ?? sp.size[0] + (sp.size[1] - sp.size[0]) * k;
    const f = new Fish(pool, sp, size, new THREE.Vector3(0, 0, 0));
    for (let i = 0; i < 10; i++) {
      f.pickWaypoint();
      if (f.wp.distanceTo(this.game.player.pos) > 6) break;
    }
    f.pos.copy(f.wp); f.wp = null;
    this.game.scene.add(f.mesh.group);
    pool.fish.push(f); this.fish.push(f);
    return f;
  }

  remove(f) {
    f.dispose(this.game.scene);
    for (const p of this.pools) p.fish = p.fish.filter((x) => x !== f);
    this.fish = this.fish.filter((x) => x !== f);
  }

  /** The bell of the tide, and the shoals with it. */
  update(dt) {
    const g = this.game, near = this.near;
    this.t += dt;
    this.ripples.update(dt);
    this.tideT += dt;
    if (this.tideT >= TIDE_LEN) {
      this.tideT = 0; this.tide = (this.tide + 1) % TIDES.length;
      g.events?.emit('angle.tide', { phase: TIDES[this.tide].id, near });
      if (this.tide === 2 && g.ledger.get('fish.total') >= 5) this.wakeLegend();
    }
    // the lamp
    const td = TIDES[this.tide];
    this.lampMat.color.lerp(new THREE.Color(td.lamp), Math.min(1, dt * 1.5));
    this.lampLight.color.copy(this.lampMat.color);
    this.lampLight.intensity = 16 + 12 * [0.2, 0.7, 1, 0.55][this.tide];
    this.lamp.position.y = this.lampY + [0, 0.5, 1.0, 0.5][this.tide] * 0.9;
    this.lampRings.forEach((r, i) => { r.rotation.z += dt * (0.3 + i * 0.2); });
    if (!near) return;
    this.swayReeds(this.t);
    // shoals
    this.spawnT -= dt;
    if (this.spawnT <= 0) {
      this.spawnT = 1.4;
      for (const p of this.pools) {
        const live = p.fish.filter((f) => !f.dying && f.sp.tides.includes(this.tide)).length;
        if (live < p.cap * (p.id === 'well' ? 0.7 : 1) && this.weights(p).length && !(p.id === 'well' && this.tide !== 2 && simRand() < 0.6)) this.spawn(p);
      }
    }
    const hooks = this.hooks;
    const ctx = {
      lure: hooks?.lure() || null, tide: this.tide, near: true,
      sound: this.sound.r, sourcePos: this.sound.src, camera: g.camera, pingId: this.sound.id,
      onProbe: hooks?.onProbe, onBite: hooks?.onBite, onMiss: hooks?.onMiss, onSpook: hooks?.onSpook, onNotice: hooks?.onNotice, onPing: hooks?.onPing,
    };
    for (const f of [...this.fish]) {
      if (f.pool && ctx.lure && ctx.lure.pool && ctx.lure.pool !== f.pool) { ctx.lure = null; }
      f.update(dt, { ...ctx, lure: ctx.lure && ctx.lure.pool === f.pool ? ctx.lure : null });
      if (f.dead) this.remove(f);
    }
    // a board redrawn when the ledger has moved (throttled)
    if (this.board.v !== g.ledger.version && this.t - (this.board.last || 0) > 1.5) { this.board.v = g.ledger.version; this.board.last = this.t; this.drawBoard(); }
  }

  wakeLegend() {
    const well = this.pools.find((p) => p.id === 'well');
    if (well.fish.some((f) => f.sp.legend)) return;
    const sp = BY_SPECIES.lachryma;
    const f = this.spawn(well, sp, sp.size[0] + simRand() * (sp.size[1] - sp.size[0]));
    if (f && this.near) { sfx.leviathan(); this.game.events?.emit('angle.legend', {}); }
  }

  /** Called when the player leaves: the fish are put away, the lure retrieved. */
  reset() { for (const f of [...this.fish]) this.remove(f); }
}

/**
 * Palms round the oasis: a curved trunk of stacked segments and a crown of drooping fronds, built from primitives and baked into
 * one mesh per material (render/merge.js); each trunk a collider. Low-poly in the manner of the era's palms (Final Fantasy X's
 * Besaid, Wind Waker's Outset): a few flat-shaded planes read as a crown at any distance.
 */
function buildPalms(game) {
  const S = game.scene, W = game.physics.world;
  const group = new THREE.Group();
  const bark = new THREE.MeshStandardMaterial({ color: 0x8a5a3c, roughness: 0.95, flatShading: true });
  const leaf = new THREE.MeshStandardMaterial({ color: 0x6f8a3a, roughness: 0.9, flatShading: true, side: THREE.DoubleSide });
  const leafDark = new THREE.MeshStandardMaterial({ color: 0x55702e, roughness: 0.9, flatShading: true, side: THREE.DoubleSide });
  // a frond: a long thin diamond, bent down along its length
  const frond = new THREE.BufferGeometry();
  {
    const P = [], n = 5, len = 3.4;
    for (let k = 0; k < n; k++) {
      const t0 = k / n, t1 = (k + 1) / n, w0 = Math.sin(t0 * Math.PI) * 0.55, w1 = Math.sin(t1 * Math.PI) * 0.55;
      const y0 = -t0 * t0 * 1.6, y1 = -t1 * t1 * 1.6, x0 = t0 * len, x1 = t1 * len;
      P.push(x0, y0, -w0, x1, y1, -w1, x0, y0 + 0.08, 0, x0, y0 + 0.08, 0, x1, y1, -w1, x1, y1 + 0.08, 0);
      P.push(x0, y0 + 0.08, 0, x1, y1 + 0.08, 0, x0, y0, w0, x0, y0, w0, x1, y1 + 0.08, 0, x1, y1, w1);
    }
    frond.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
    frond.computeVertexNormals();
  }
  const spots = PALM_SPOTS;
  let seed = 11; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (const [lx, lz] of spots) {
    const x = OX + lx, z = OZ + lz, y = game.dunes.heightAt(x, z);
    const h = 6 + rnd() * 3.5, lean = (rnd() - 0.5) * 0.5, yaw = rnd() * Math.PI * 2, segs = 5;
    const dir = new THREE.Vector3(Math.cos(yaw), 0, Math.sin(yaw));
    let p = new THREE.Vector3(x, y - 0.3, z);
    for (let k = 0; k < segs; k++) {
      const t = (k + 1) / segs, bend = lean * t * t * 2.2;
      const q = p.clone().addScaledVector(new THREE.Vector3(0, 1, 0), h / segs).addScaledVector(dir, bend);
      const seg = new THREE.Mesh(new THREE.CylinderGeometry(0.24 - 0.02 * k, 0.28 - 0.02 * k, p.distanceTo(q) + 0.05, 6), bark);
      seg.position.copy(p).lerp(q, 0.5);
      seg.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), q.clone().sub(p).normalize());
      seg.castShadow = true; group.add(seg);
      p = q;
    }
    for (let f = 0; f < 8; f++) {
      const m = new THREE.Mesh(frond, f % 2 ? leaf : leafDark);
      m.position.copy(p);
      m.rotation.set(0, (f / 8) * Math.PI * 2 + rnd() * 0.4, 0.25 + rnd() * 0.35, 'YZX');
      m.castShadow = true; group.add(m);
    }
    const b = W.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(x, y + h / 2, z));
    W.createCollider(RAPIER.ColliderDesc.cylinder(h / 2, 0.3).setCollisionGroups(GROUPS.static), b);
  }
  for (const m of group.children) if (m.material === bark) addOutline(m);
  mergeStatic(group);
  S.add(group);
  return group;
}
