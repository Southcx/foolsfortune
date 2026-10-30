// ---------------------------------------------------------------------------------------
// THE SANDBOX'S YARD, PEN AND GROUND: what its three lecterns do (progress/sandbox.js SANDBOX.lecterns, STOCK).
//   rack    lays out STOCK in the yard with the level's own prop makers (crates, bricks, the breakable pots), so the kick, the carry and the god
//           hand know them already. What it laid last time is taken away first, and only that: nothing else in the world is touched.
//   pen     calls three slip jellies into the pen's ring of low clay posts, made training bodies (`training`: the ledger and the domains never
//           hear them, a burst pays no cubes, as the Throwing Room's: progress/combat/throwingroom.js isTraining) and lock targets (the lock-on
//           lists no training body of its own). The last three are taken away first. They stay burst until the pen is called again.
//   ground  puts the god hand's matter back: the island's matter field if it lies in the hall (godhand/islandmatter.js drop) and the creations
//           standing in the hall (godhand/creations.js erode), so the floor is as it was built.
// Prior art: Garry's Mod's cleanup button and spawn menu, Black & White's creature pen, Dawn of Mana's Havok yard, the Throwing Room's pots.
//
//   const y = new Yard(game)   y.rack() -> n   y.pen() -> n   y.ground() -> n   y.clear() (all of it taken away: the hall is coming down)
//   penPosts(kit)  (the pen's static posts, through the hall's builder)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { SANDBOX, STOCK } from '../../progress/sandbox.js';
import { PALETTE } from '../../core/config.js';
import { VOXEL } from '../../godhand/voxels.js';

const POST = { n: 20, w: 0.5, h: 0.9, color: 0xb07a55 }; // (the pen's posts: 20 round its ring, the one facing south left out for a way in)
const POTS = ['jar', 'amphora', 'pitcher', 'melon'];
const BRICK_LAYER = 2; // (bricks to a layer of the tower, laid across the last)
const inHall = (x, z) => Math.abs(x - SANDBOX.at.x) < SANDBOX.size.w / 2 + 1 && Math.abs(z - SANDBOX.at.z) < SANDBOX.size.d / 2 + 1;

/** The pen's posts, round SANDBOX.pen, as static boxes through the hall's builder (kit.box). */
export function penPosts(kit) {
  const P = SANDBOX.pen, X = (x) => SANDBOX.at.x + x, Z = (z) => SANDBOX.at.z + z;
  for (let k = 0; k < POST.n; k++) {
    const a = (k / POST.n) * Math.PI * 2; if (k === POST.n / 4) continue; // (a = 90 degrees is south, +z: the way in)
    kit.box([X(P.x + Math.cos(a) * P.r), SANDBOX.at.y + POST.h / 2, Z(P.z + Math.sin(a) * P.r)], [POST.w, POST.h, POST.w], POST.color, { rotY: -a });
  }
}

export class Yard {
  constructor(game) { this.game = game; this.laid = []; this.pots = []; this.jellies = []; }

  /** Where the stock goes, in rows across the yard from its north edge: [{ spec, x, z, i }] (local metres). */
  plan() {
    const Y = SANDBOX.yard, x0 = Y.x - Y.w / 2 + 1, x1 = SANDBOX.pen.x - SANDBOX.pen.r - 1 /* (clear of the pen's ring) */, out = [];
    let z = Y.z - Y.d / 2 + 1;
    for (const spec of STOCK) {
      const size = spec.tower ? 1 : spec.kind === 'pot' ? 0.7 : spec.size, step = size + 0.8; let x = x0;
      if (spec.tower) { out.push({ spec, x: x0 + 0.5, z, i: 0 }); z += size + 2; continue; }
      for (let i = 0; i < spec.n; i++) { if (x > x1) { x = x0; z += size + 0.5; } out.push({ spec, x, z, i }); x += step; }
      z += size + 2;
    }
    return out;
  }

  /** The rack: what it laid last time taken away, then STOCK laid out again. Returns how many things were laid. */
  rack() {
    const g = this.game, L = g.level, B = SANDBOX.at, y = B.y; if (!L) return 0;
    this.takeAway();
    const before = new Set(L.dynamic);
    for (const { spec, x, z, i } of this.plan()) {
      const px = B.x + x, pz = B.z + z;
      if (spec.kind === 'crate') L.crate([px, y + spec.size / 2 + 0.01, pz], spec.size);
      else if (spec.kind === 'pot') {
        const e = g.breakables?.spawn({ kind: POTS[i % POTS.length], pos: [px, y + 0.002, pz], color: i % 2 ? PALETTE.potLight : PALETTE.pot, training: true }); // (training: a pot broken here is never counted: boot/services.js)
        if (e) this.pots.push(e);
      } else if (spec.kind === 'brick') this.tower(spec, px, pz);
    }
    for (const e of L.dynamic) if (!before.has(e)) this.laid.push(e);
    return this.laid.length + this.pots.length;
  }

  /** A tower of bricks, BRICK_LAYER to a layer, each layer across the one below (the level's brick makes one at a time). */
  tower(spec, x, z) {
    const [bl, bh, bw] = spec.size, y = SANDBOX.at.y, L = this.game.level, layers = Math.ceil(spec.n / BRICK_LAYER);
    for (let k = 0; k < spec.n; k++) {
      const layer = Math.floor(k / BRICK_LAYER), j = k % BRICK_LAYER, off = (j - (BRICK_LAYER - 1) / 2) * bw * 1.02, across = layer % 2 === 1;
      const size = across ? [bw, bh, bl] : [bl, bh, bw], at = across ? [x + off, z] : [x, z + off];
      L.brick([at[0], y + bh / 2 + 0.002 + layer * (bh + 0.002), at[1]], size);
    }
    return layers;
  }

  /** The pen: the last three taken away, three slip jellies called into the ring. Returns how many. */
  pen() {
    const g = this.game, J = g.jellies, P = SANDBOX.pen, B = SANDBOX.at; if (!J) return 0;
    this.takeAwayJellies();
    for (let k = 0; k < 3; k++) {
      const a = (k / 3) * Math.PI * 2 + 0.5, c = J.spawn(new THREE.Vector3(B.x + P.x + Math.cos(a) * P.r * 0.4, B.y, B.z + P.z + Math.sin(a) * P.r * 0.4), { once: true, yaw: a + Math.PI });
      c.training = true; g.lock?.add(c); this.jellies.push(c);
    }
    return this.jellies.length;
  }

  /** The god hand's matter put back: the field if it lies in the hall, and the creations standing in it. Returns the creations' chunks eroded. */
  ground() {
    const g = this.game, B = SANDBOX.at, F = g.matter?.field; let n = 0;
    const C = g.creations;
    if (C?.grid?.chunks?.size) { // (chunk by chunk: a ball over the whole hall would walk millions of cells)
      const w = VOXEL.n * VOXEL.size;
      for (const c of [...C.grid.chunks.values()]) {
        const x = (c.cx + 0.5) * w, yy = (c.cy + 0.5) * w, z = (c.cz + 0.5) * w;
        if (c.vol > 0 && inHall(x, z) && Math.abs(yy - B.y - 2) < SANDBOX.size.h) { C.erode({ x, y: yy, z }, w * 0.87); n++; }
      }
    }
    if (F && inHall(F.cx, F.cz)) g.matter.drop();
    return n;
  }

  takeAway() {
    const g = this.game, L = g.level, keep = [];
    for (const e of this.laid) { if (!L.dynamic.includes(e)) continue; if (e.carried) keep.push(e); else L.removeProp(e); } // (one that was sliced away or broke is already gone; one in the hands stays tracked)
    this.laid = keep;
    for (const e of this.pots) if (e.alive && g.breakables?.items.has(e)) g.breakables.removeQuiet(e);
    this.pots = [];
  }
  takeAwayJellies() {
    const g = this.game;
    for (const c of this.jellies) { g.lock?.remove(c); g.jellies?.dispose(c); }
    this.jellies = [];
  }
  /** Everything it laid or called taken away (the hall coming down); the ground too. */
  clear() { this.takeAway(); this.takeAwayJellies(); this.ground(); }
}
