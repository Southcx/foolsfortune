// ---------------------------------------------------------------------------------------
// THE BOWL: the Great Slip Jelly's arena, the great cavern under the Great Dunemaw's third floor (docs/plans/DUNEMAW-ARENA.md, Dovina's
// level design plan; the measures are data: ARENA in progress/combat/dunemaw.js). A stamped room, not a carved one: its shape is authored.
// It is reached by the third floor's way down and built while the seam covers the drop, in the Well's own zone (render/zones.js 'well'),
// and taken down with the run.
//
// The room's frame: the bowl's centre on the rim's level, +z north (toward the way in), +x east; a BEARING is from north, clockwise.
//   - THE LEDGE to the north, 6 m up, at the tunnel's mouth: the reveal. Two one-way SLOPES (S1, S2) run down from it; none runs back up,
//     so stepping off commits (a sand slope you slide down and cannot climb: the Courier's `drift`, courier/player.js).
//   - THE FLOOR dishes 4 degrees to the centre; THE RIM SHALLOWS (r 22..28) are a hand of slip deep and slow a walk (the Courier's `wade`).
//   - SIX PILLARS at r 18, each two rams' worth: whole, CRACKED (its first), FALLEN (its second: a 12 m log across the floor, cover and one
//     more ram), then RUBBLE. EIGHT STALACTITES at r 12, hanging; one falls when a ram lands on the stone nearest it, or when the FOE
//     surfaces under it, and lies on the floor as a ram target used once.
//   - FIVE SLIP POOLS (W0 at the centre, W1..W4 at r 16): where the FOE sinks and surfaces when its crown is off. The Courier falling in is
//     put back on the nearest dry floor with a crack.
//   - THE UPPER RING: a gallery cut into the south wall, 4 m up, reached by S3 (walked both ways: one way, it could never be reached).
//   - THE CLUTCHES' places in the rim shallows (world/well/nursery.js lays them).
// What fights in it is the FOE's (creatures/jelly/greatjelly.js): this module answers what a charge meets (`ramHit`), spends what it
// struck (`spend`), drops stalactites, slides the sand toward a pool (`slide`), and keeps the Courier out of the pools.
//
// Its look is Calissa's: the Great Dunemaw's kit for the walls (vfx/dunemawkit.js), the dish's sand combed toward the pool as it slides and
// the pools' ring before a surfacing (vfx/bowl.js), the pillars that crack, fall and break to rubble and the brittle stalactites that shake
// and shatter (vfx/cavekit.js); here are their bodies, colliders and states. A felled pillar lies ACROSS the floor (along the ring, the way
// the ram was turning), so a 12 m log never runs into the wall.
//
// Prior art: Monster Hunter's arenas (a ring of walls and features the monster wrecks, about 60 m across); the bullring's barrera and
// burladeros (stone to step behind, drawn into); Zelda's Dodongo pit; Shadow of the Colossus (the room as the weapon); Journey's sand
// slopes (slid down, never climbed); Dark Souls' boss rooms (an entrance that commits).
//
//   const B = new Bowl(game)   B.group   B.local(p) / B.world(x, y, z)   B.floorY(x, z)   B.arrive -> { pos, yaw }   B.update(dt)
//   B.pillars [{ i, x, z, state }]   B.stals [{ i, x, z, state }]   B.pools [{ i, x, z, r, pos }]   B.clutchSpots -> [Vector3]
//   B.ramHit(x, z, r) -> { kind: 'pillar' | 'log' | 'stal' | 'wall', it } | null   B.spend(hit, dir) -> crack stage worth   B.dropOver(x, z, r)
//   B.fallenNear(x, z, r) -> stalactite | null   B.slide(x, z, speed) (toward a point; 0 to stop)   B.dispose()
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { ConvexGeometry } from 'three/addons/geometries/ConvexGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { RAPIER, GROUPS } from '../../core/physics.js';
import { ARENA } from '../../progress/combat/dunemaw.js';
import { roughen, segments } from './rock.js';
import { dunemawKit } from '../../vfx/dunemawkit.js';
import { DunemawMouth } from '../../vfx/dunemaw.js';
import { Pillar, Stalactite } from '../../vfx/cavekit.js';
import { bowlSand, bowlSandTick, PoolRing } from '../../vfx/bowl.js';
import { sfx } from '../../audio/sfx.js';

/** Where the bowl stands: its centre on the rim's level, in the Well's zone (render/zonemap.js), under where the floors are built. */
export const BOWL_AT = new THREE.Vector3(-1300, -925, 0);
const DEG = Math.PI / 180, UP = new THREE.Vector3(0, 1, 0);
const R = ARENA.radius, RIM = ARENA.rim.from, ROOF = ARENA.roof, TAN = Math.tan(ARENA.dish * DEG);
const LEDGE = { x: ARENA.ledge.width / 2, z0: ARENA.ledge.z[0], z1: ARENA.ledge.z[1], y: ARENA.ledge.y, back: 46 }; // (the tunnel runs on to z 46)
const SLOPE = { x: 4.5, half: 1.5, z1: 15.6 }; // (S1, S2: 3 m wide at x -4.5 and +4.5, from the ledge's lip down to z 15.6, about 30 degrees)
const S3 = { bearing: 166, r0: ARENA.upper.from, r1: 17.2, half: 1.5 }; // (the upper ring's way down, between P3 and W3)
const STAL = { len: 4.5, root: 0.75, fall: 0.8 }; // (a stalactite's hanging spike, the root's radius, the shake before it drops: sim seconds)
const PILLAR = { r: ARENA.pillars.width / 2, h: ARENA.pillars.height };
export const bearingXZ = (b, r) => ({ x: Math.sin(b * DEG) * r, z: Math.cos(b * DEG) * r });

/** The floor's height at a radius: the dish down to the centre, the rim shallows a hand of slip lower (eased between). */
export function dishY(r) {
  const d = (rr) => -(RIM - rr) * TAN;
  if (r <= RIM - 1) return d(r);
  if (r >= RIM + 0.5) return -ARENA.rim.depth;
  const k = (r - (RIM - 1)) / 1.5; return d(RIM - 1) + (-ARENA.rim.depth - d(RIM - 1)) * k * k * (3 - 2 * k);
}

export class Bowl {
  constructor(game) {
    this.game = game;
    const g = game, W = g.physics.world;
    this.body = W.createRigidBody(RAPIER.RigidBodyDesc.fixed());
    this.group = new THREE.Group(); this.group.name = 'well-bowl'; this.group.userData.zone = 'well';
    this.group.position.copy(BOWL_AT);
    this.K = (g.dunemawKit ||= (() => { const k = dunemawKit({ env: g.sky?.env }); for (const mm of [k.wall, k.floor, k.trim, k.sand].filter(Boolean)) mm.userData.shared = true; return k; })());
    this.dishMat = bowlSand({}); // (Calissa's: its streaks run toward uPool at uSlide)
    this.sandMat = this.K.sand || (g.wellSandMat ||= Object.assign(new THREE.MeshStandardMaterial({ color: 0xc9a473, roughness: 1, name: 'well-sand-standin' }), { userData: { shared: true } }));
    this.slipMat = slipMaterial();
    this.t = 0;
    this.slideV = new THREE.Vector3(); // (the sand's slide toward the FOE's pool, m/s, set by slide())
    this.buildFloor(); this.buildWalls(); this.buildLedge(); this.buildRing();
    this.buildPillars(); this.buildStalactites(); this.buildPools();
    this.clutchSpots = [22, 68, 112, 158, 202, 248, 292, 338].slice(0, ARENA.clutches.perQuadrant * 4).map((b) => { const p = bearingXZ(b, ARENA.clutches.r); return this.world(p.x, dishY(ARENA.clutches.r), p.z); });
    // two lamps from the light budget (W0's glow, and a warm one over the ledge: render/lightbudget.js lends them real lights)
    const glow = new THREE.PointLight(0x9a6bff, 26, 40, 1.3); glow.position.set(0, 4, 0);
    const warm = new THREE.PointLight(0xffa066, 18, 34, 1.3); warm.position.set(0, LEDGE.y + 5, LEDGE.z0 + 4);
    this.group.add(glow, warm); g.lights?.adopt(glow); g.lights?.adopt(warm);
    g.scene.add(this.group);
    /** Where a Courier dropping in arrives: in the tunnel behind the ledge, facing the bowl. */
    this.arrive = { pos: this.world(0, LEDGE.y + 0.05, 40), yaw: Math.PI };
    /** Where a wipe makes them whole: on the ledge behind the Lip Stone (1.4 m from it), facing the bowl (the tunnel was 11.8 m off, SWEEPS group 7). */
    this.lipStand = { pos: this.world(0, LEDGE.y + 0.05, LEDGE.z0 + 3.6), yaw: Math.PI };
  }

  world(x, y, z) { return new THREE.Vector3(BOWL_AT.x + x, BOWL_AT.y + y, BOWL_AT.z + z); }
  local(p) { return { x: p.x - BOWL_AT.x, y: p.y - BOWL_AT.y, z: p.z - BOWL_AT.z }; }
  floorY(x, z) { return BOWL_AT.y + dishY(Math.hypot(x, z)); }

  // ------------------------------------------------------------------ building
  collide(desc) { return this.game.physics.world.createCollider(desc.setCollisionGroups(GROUPS.static).setFriction(0.9), this.body); }
  mesh(geo, mat, name) { const m = new THREE.Mesh(geo, mat); m.castShadow = m.receiveShadow = true; if (name) m.name = name; this.group.add(m); return m; }

  /** The dish and the rim: a radial sheet (rings every 1.5 m, 64 spokes), drawn and collided as the same triangles; the slip over the rim. */
  buildFloor() {
    const NR = Math.ceil(R / 1.5) + 1, NS = 64, pos = [], idx = [];
    pos.push(0, dishY(0), 0);
    for (let i = 1; i < NR; i++) {
      const r = Math.min(R + 0.6, i * 1.5);
      for (let s = 0; s < NS; s++) { const a = (s / NS) * Math.PI * 2; pos.push(Math.sin(a) * r, dishY(r), Math.cos(a) * r); }
    }
    for (let s = 0; s < NS; s++) idx.push(0, 1 + s, 1 + ((s + 1) % NS));
    for (let i = 1; i < NR - 1; i++) for (let s = 0; s < NS; s++) {
      const a = 1 + (i - 1) * NS + s, b = 1 + (i - 1) * NS + ((s + 1) % NS), c = a + NS, d = b + NS;
      idx.push(a, c, b, b, c, d);
    }
    const P = new Float32Array(pos), I = new Uint32Array(idx);
    const world = P.slice(); for (let k = 0; k < world.length; k += 3) { world[k] += BOWL_AT.x; world[k + 1] += BOWL_AT.y; world[k + 2] += BOWL_AT.z; }
    this.collide(RAPIER.ColliderDesc.trimesh(world, I, RAPIER.TriMeshFlags?.FIX_INTERNAL_EDGES ?? 0));
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(P, 3)); geo.setIndex(new THREE.BufferAttribute(I, 1)); geo.computeVertexNormals();
    this.mesh(geo, this.dishMat, 'bowl-floor');
    const slip = new THREE.Mesh(new THREE.RingGeometry(RIM + 0.3, R, 64, 1), this.slipMat); slip.rotation.x = -Math.PI / 2; slip.position.y = -0.04; slip.name = 'bowl-slip';
    slip.receiveShadow = true; this.group.add(slip);
    // the roof: a disc seen from below
    const roof = new THREE.Mesh(new THREE.CircleGeometry(R + 1, 48), this.K.trim); roof.rotation.x = Math.PI / 2; roof.position.y = ROOF; roof.name = 'bowl-roof'; this.group.add(roof);
    this.collide(RAPIER.ColliderDesc.cuboid(R + 2, 0.5, R + 2).setTranslation(BOWL_AT.x, BOWL_AT.y + ROOF + 0.5, BOWL_AT.z));
  }

  /** The wall at r 28, rough, a box a segment (none where the ledge's tunnel comes in, below the tunnel's roof). */
  buildWalls() {
    const N = 48, T = 1.2, geos = [], tunnelA = Math.asin((LEDGE.x + 0.4) / R);
    for (let s = 0; s < N; s++) {
      const a0 = (s / N) * Math.PI * 2, a1 = ((s + 1) / N) * Math.PI * 2, am = (a0 + a1) / 2;
      const len = 2 * (R + T / 2) * Math.sin(Math.PI / N) + 0.15, cx = Math.sin(am) * (R + T / 2), cz = Math.cos(am) * (R + T / 2);
      const north = Math.abs(Math.atan2(Math.sin(am), Math.cos(am))) < tunnelA;
      const y0 = north ? LEDGE.y + 6 : -2, h = ROOF + 1 - y0;
      const g = new THREE.BoxGeometry(len, h, T, segments(len), segments(h), 1).toNonIndexed(); g.deleteAttribute('uv');
      g.rotateY(am); g.translate(cx, y0 + h / 2, cz); roughen(g, { seed: 9 }); geos.push(g);
      this.collide(RAPIER.ColliderDesc.cuboid(len / 2, h / 2, T / 2).setTranslation(BOWL_AT.x + cx, BOWL_AT.y + y0 + h / 2, BOWL_AT.z + cz).setRotation(new THREE.Quaternion().setFromAxisAngle(UP, am)));
    }
    const m = this.mesh(mergeGeometries(geos, false), this.K.wall, 'bowl-wall'); m.geometry.computeVertexNormals();
    geos.forEach((g) => g.dispose());
  }

  /** A box drawn and collided (the bowl's own frame). */
  block(x, y, z, sx, sy, sz, mat = this.K.wall, rough = true) {
    let g = rough ? new THREE.BoxGeometry(sx, sy, sz, segments(sx), segments(sy), segments(sz)).toNonIndexed() : new THREE.BoxGeometry(sx, sy, sz);
    g.translate(x, y, z); if (rough) { g.deleteAttribute('uv'); roughen(g, { seed: 4, amp: 0.15 }); g.computeVertexNormals(); }
    this.collide(RAPIER.ColliderDesc.cuboid(sx / 2, sy / 2, sz / 2).setTranslation(BOWL_AT.x + x, BOWL_AT.y + y, BOWL_AT.z + z));
    return this.mesh(g, mat);
  }
  /** A ramp: a wedge from a high edge to a low one, `half` wide either side of x (a convex hull, drawn and collided). */
  wedge(pts) {
    const v = pts.map((p) => new THREE.Vector3(...p));
    const geo = new ConvexGeometry(v); geo.computeVertexNormals();
    this.mesh(geo, this.sandMat);
    const flat = new Float32Array(v.flatMap((p) => [p.x + BOWL_AT.x, p.y + BOWL_AT.y, p.z + BOWL_AT.z]));
    this.collide(RAPIER.ColliderDesc.convexHull(flat));
  }

  /** The ledge and its tunnel, and the two one-way slopes down from it. */
  buildLedge() {
    const { x, z0, y, back } = LEDGE, zt = Math.sqrt(R * R - x * x) - 0.6; // (the tunnel's walls start where the bowl's wall would be)
    this.block(0, (y - 2) / 2, (z0 + back) / 2, 2 * x, y + 2, back - z0, this.K.trim, false); // (its top at y)
    this.block(-x - 0.6, y + 3, (zt + back) / 2, 1.2, 6, back - zt); this.block(x + 0.6, y + 3, (zt + back) / 2, 1.2, 6, back - zt);
    this.block(0, y + 6.4, (zt + back) / 2, 2 * x + 2.4, 0.8, back - zt, this.K.trim, false);
    this.block(0, y + 3, back + 0.6, 2 * x + 2.4, 6, 1.2);
    for (const sx of [-SLOPE.x, SLOPE.x]) {
      const a = sx - SLOPE.half, b = sx + SLOPE.half, yl = dishY(Math.hypot(sx, SLOPE.z1)) - 0.2;
      this.wedge([[a, y, z0], [b, y, z0], [a, yl, SLOPE.z1], [b, yl, SLOPE.z1], [a, yl, z0], [b, yl, z0]]);
    }
    // the Lip Stone's place (DUNEMAW-EXTREME.md, Round 2): a stone at the ledge's lip, drawn only for now
    const stone = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.7, 1.1, 7), this.K.wall); stone.position.set(0, y + 0.55, z0 + 2.2); stone.name = 'lip-stone'; this.group.add(stone);
  }

  /** The upper ring: a gallery cut into the south wall, 4 m up (r 24..28, bearings 90 round to 270), and S3 down from it. */
  buildRing() {
    const { from } = ARENA.upper, y = ARENA.upper.y, N = 16, geos = [], b0 = ARENA.upper.bearings[0], b1 = ARENA.upper.bearings[1];
    for (let s = 0; s < N; s++) {
      const a = (b0 + ((s + 0.5) / N) * (b1 - b0)) * DEG, w = R - from, rc = from + w / 2, len = (rc * (b1 - b0) * DEG) / N + 0.3;
      const cx = Math.sin(a) * rc, cz = Math.cos(a) * rc;
      const g = new THREE.BoxGeometry(len, 0.6, w); g.rotateY(a + Math.PI / 2); g.translate(cx, y - 0.3, cz); geos.push(g);
      this.collide(RAPIER.ColliderDesc.cuboid(len / 2, 0.3, w / 2).setTranslation(BOWL_AT.x + cx, BOWL_AT.y + y - 0.3, BOWL_AT.z + cz).setRotation(new THREE.Quaternion().setFromAxisAngle(UP, a + Math.PI / 2)));
    }
    this.mesh(mergeGeometries(geos, false), this.K.trim, 'bowl-ring'); geos.forEach((g) => g.dispose());
    // S3: radial, from the ring's inner edge down to the floor
    const d = bearingXZ(S3.bearing, 1), n = { x: d.z, z: -d.x }, at = (r, k) => [d.x * r + n.x * k, 0, d.z * r + n.z * k];
    const yl = dishY(S3.r1) - 0.2, hi = (r, k) => { const p = at(r, k); p[1] = y; return p; }, lo = (r, k) => { const p = at(r, k); p[1] = yl; return p; };
    this.wedge([hi(S3.r0, -S3.half), hi(S3.r0, S3.half), lo(S3.r1, -S3.half), lo(S3.r1, S3.half), lo(S3.r0, -S3.half), lo(S3.r0, S3.half)]);
  }

  /** The six pillars at r 18, each its own body (a ram can bring one down). */
  buildPillars() {
    this.pillars = ARENA.pillars.bearings.map((b, i) => {
      const p = bearingXZ(b, ARENA.pillars.r), y = dishY(ARENA.pillars.r);
      const look = new Pillar({ height: PILLAR.h, radius: PILLAR.r, fx: this.game.fx }); look.group.position.set(p.x, y, p.z); look.group.name = `pillar-${i + 1}`;
      look.group.traverse((o) => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
      this.group.add(look.group);
      const rb = this.game.physics.world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(BOWL_AT.x + p.x, BOWL_AT.y + y + PILLAR.h / 2, BOWL_AT.z + p.z));
      const col = this.game.physics.world.createCollider(RAPIER.ColliderDesc.cylinder(PILLAR.h / 2, PILLAR.r).setCollisionGroups(GROUPS.static).setFriction(0.9), rb);
      return { i, bearing: b, x: p.x, z: p.z, y, state: 'whole', look, rb, col, log: null };
    });
  }

  /** The eight stalactites at r 12: a spike hanging from a rock drape to the roof. */
  buildStalactites() {
    const drapes = [];
    this.stals = ARENA.stalactites.bearings.map((b, i) => {
      const p = bearingXZ(b, ARENA.stalactites.r), tip = ARENA.stalactites.y[i % 2];
      const look = new Stalactite({ kind: 'brittle', length: STAL.len, radius: STAL.root, fx: this.game.fx }); // (brittle: these fall; Calissa's grit says so)
      look.group.position.set(p.x, tip + STAL.len, p.z); look.group.name = `stal-${i + 1}`; look.mesh.castShadow = true; this.group.add(look.group);
      const h = ROOF - tip - STAL.len, d = new THREE.CylinderGeometry(STAL.root * 0.8, STAL.root * 1.6, h, 7); d.translate(p.x, tip + STAL.len + h / 2, p.z); drapes.push(d);
      return { i, x: p.x, z: p.z, tip, state: 'hanging', look, root: look.group, vy: 0, col: null };
    });
    this.mesh(mergeGeometries(drapes, false), this.K.wall, 'bowl-drapes'); drapes.forEach((g) => g.dispose());
  }

  /** The five slip pools: W0 at the centre, W1..W4 at r 16 on the four bearings (Calissa's pool, small). */
  buildPools() {
    const P = ARENA.pools, list = [{ x: 0, z: 0, r: P.centre / 2 }, ...P.ring.bearings.map((b) => ({ ...bearingXZ(b, P.ring.r), r: P.ring.width / 2 }))];
    this.pools = list.map((w, i) => {
      const y = dishY(Math.hypot(w.x, w.z));
      const mouth = new DunemawMouth({ radius: w.r, maw: 0x2a1a40 }); mouth.group.position.set(w.x, y + 0.03, w.z); mouth.mesh.name = `pool-w${i}`; mouth.maw.name = `rim-w${i}`;
      this.group.add(mouth.group);
      const ripple = new PoolRing({ radius: w.r, fx: this.game.fx }); ripple.group.position.set(w.x, y + 0.06, w.z); this.group.add(ripple.group); // (Calissa's ring before a surfacing)
      return { i, x: w.x, z: w.z, r: w.r, y, mouth, ripple, pos: this.world(w.x, y, w.z), ringT: 0, ringDur: 1 };
    });
  }

  // ------------------------------------------------------------------ what the FOE's charge meets
  /** What a body of radius r at (x, z) (the bowl's frame) touches: a standing pillar, a fallen one, a fallen stalactite, or the wall. */
  ramHit(x, z, r) {
    for (const p of this.pillars) {
      if (p.state === 'whole' || p.state === 'cracked') { if (Math.hypot(x - p.x, z - p.z) < PILLAR.r + r) return { kind: 'pillar', it: p }; }
      else if ((p.state === 'fallen' || p.state === 'falling') && segDist(x, z, p.log) < PILLAR.r * 0.8 + r) return { kind: 'log', it: p };
    }
    for (const s of this.stals) if (s.state === 'fallen' && segDist(x, z, s.seg) < STAL.root * 0.8 + r) return { kind: 'stal', it: s };
    if (Math.hypot(x, z) > R - r - 0.4) return { kind: 'wall', it: null };
    if (z > LEDGE.z0 - r && Math.abs(x) < LEDGE.x + r) return { kind: 'wall', it: null }; // (the ledge's face is wall too)
    return null;
  }

  /** A ram spent what it struck: a pillar cracks, then falls (away along `dir`) as a log; a log goes to rubble; a fallen stalactite
   *  shatters. Ram into stone and the nearest stalactite overhead comes down too. True if it was stone a ram can use. */
  spend(hit, dir) {
    if (!hit || hit.kind === 'wall') return false;
    const g = this.game, it = hit.it;
    if (hit.kind === 'pillar') {
      if (it.state === 'whole') { it.state = 'cracked'; it.look.crack(1); }
      else this.topple(it, dir);
      this.dropNearest(it.x, it.z);
    } else if (hit.kind === 'log') {
      it.state = 'rubble'; this.removeLog(it); it.look.rubble(); // (a heap where the log lay: an island the slide does not move)
      this.dropNearest(it.x, it.z);
    } else if (hit.kind === 'stal') {
      it.state = 'gone'; it.look.shatter(); if (it.col) { g.physics.world.removeCollider(it.col, false); it.col = null; }
    }
    sfx.shatter?.(hit.kind === 'stal' ? 1.4 : 2.2, g.listenerDistance(this.world(it.x, 1, it.z)), 'stone'); // (Wanda's crack and fall come on bowl.spend)
    g.events?.emit('bowl.spend', { what: hit.kind, state: it.state, i: it.i, by: 'creature' }); // (Calissa's seams and dust, Wanda's crack: their cues)
    return true;
  }
  /** A cracked pillar falls: the standing body goes, and it lies across the floor as a 12 m log (its own collider, cover): along the ring,
   *  the way the ram was turning (a ram from the centre runs outward, and a log felled straight along it would run into the wall). */
  topple(p, dir) {
    const W = this.game.physics.world, rr = Math.hypot(p.x, p.z), tx = -p.z / rr, tz = p.x / rr, sgn = dir.x * tx + dir.z * tz < 0 ? -1 : 1;
    const d = new THREE.Vector3(tx * sgn, 0, tz * sgn);
    p.state = 'fallen';
    W.removeRigidBody(p.rb); p.rb = null; p.col = null;
    // (it lies from its foot along d, shortened where the wall would cut it: the far end kept 1.5 m inside the wall)
    const a = { x: p.x + d.x * 0.5, z: p.z + d.z * 0.5 }, ad = a.x * d.x + a.z * d.z, RR = R - 1.5;
    const t = Math.max(2, Math.min(PILLAR.h - 1, -ad + Math.sqrt(Math.max(0, ad * ad - (a.x * a.x + a.z * a.z) + RR * RR))));
    const b = { x: a.x + d.x * t, z: a.z + d.z * t };
    p.log = { ax: a.x, az: a.z, bx: b.x, bz: b.z };
    const mx = (a.x + b.x) / 2, mz = (a.z + b.z) / 2, len = Math.hypot(b.x - a.x, b.z - a.z), yaw = Math.atan2(d.x, d.z), y = this.floorY(mx, mz) - BOWL_AT.y + PILLAR.r * 0.8;
    p.look.fall(d); // (Calissa's fall: slow off the vertical, then all at once, with a bounce and dust)
    p.logBody = W.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(BOWL_AT.x + mx, BOWL_AT.y + y, BOWL_AT.z + mz)
      .setRotation(new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, yaw, 0, 'YXZ'))));
    W.createCollider(RAPIER.ColliderDesc.cylinder(len / 2, PILLAR.r * 0.8).setCollisionGroups(GROUPS.static).setFriction(0.9), p.logBody);
    this.game.events?.emit('bowl.fall', { what: 'pillar', i: p.i, by: 'creature' });
  }
  removeLog(p) { if (p.logBody) { this.game.physics.world.removeRigidBody(p.logBody); p.logBody = null; } }

  /** The hanging stalactite nearest a point drops (a ram's shock: the arena thins overhead as the floor is spent). */
  dropNearest(x, z) {
    let best = null, bd = Infinity;
    for (const s of this.stals) if (s.state === 'hanging') { const d = Math.hypot(s.x - x, s.z - z); if (d < bd) { bd = d; best = s; } }
    if (best) this.drop(best);
  }
  /** Every hanging stalactite within r of a point drops (the FOE surfacing under them). */
  dropOver(x, z, r) { for (const s of this.stals) if (s.state === 'hanging' && Math.hypot(s.x - x, s.z - z) < r) this.drop(s); }
  drop(s) { s.state = 'shaking'; s.shake = STAL.fall; s.look.shake(STAL.fall); this.game.events?.emit('bowl.shake', { i: s.i, by: 'environment' }); }
  /** A fallen stalactite within r of a point (the FOE's slam on one cracks its crown: the hammer's way), or null. */
  fallenNear(x, z, r) { return this.stals.find((s) => s.state === 'fallen' && segDist(x, z, s.seg) < r) || null; }
  /** Is a point (the bowl's frame) on something that does not slide: a fallen log, rubble, a fallen stalactite? */
  island(x, z) {
    for (const p of this.pillars) {
      if (p.state === 'fallen' && segDist(x, z, p.log) < PILLAR.r + 0.4) return true;
      if (p.state === 'rubble' && segDist(x, z, p.log) < PILLAR.r + 0.8) return true;
    }
    return this.stals.some((s) => s.state === 'fallen' && segDist(x, z, s.seg) < STAL.root + 0.4);
  }
  /** The sand slides toward a point at `speed` m/s (the FOE's pool, when its crown is off); 0 stops it. */
  slide(x, z, speed) { this.slideTo = speed > 0 ? { x, z, speed } : null; }

  // ------------------------------------------------------------------ every frame
  update(dt) {
    const g = this.game, P = g.player;
    this.t += dt;
    const raw = g.rawDt ?? dt;
    for (const w of this.pools) {
      w.mouth.update(this.t, 1);
      if (w.ringT > 0) { w.ringT = Math.max(0, w.ringT - dt); w.ripple.ring(w.ringT > 0 ? 1 - w.ringT / w.ringDur : 0); }
      w.ripple.update(raw);
    }
    for (const p of this.pillars) p.look.update(this.t, dt);
    for (const s of this.stals) s.look.update(this.t, dt);
    // the dish's streaks: toward the pool the sand slides to, at its speed (Calissa's bowlSand)
    const U = this.dishMat.userData.u; U.uSlide.value = this.slideTo ? this.slideTo.speed : 0;
    if (this.slideTo) U.uPool.value.set(BOWL_AT.x + this.slideTo.x, BOWL_AT.z + this.slideTo.z);
    bowlSandTick(this.dishMat, raw);
    // the stalactites: a shake, a fall, a landing (then a ram target lying on the floor, and something to stand behind)
    for (const s of this.stals) {
      if (s.state === 'shaking') {
        s.shake -= dt; if (s.shake <= 0) { s.state = 'falling'; s.vy = 0; }
      } else if (s.state === 'falling') {
        s.vy -= 9.81 * dt; s.root.position.y += s.vy * dt;
        const tipY = s.root.position.y - STAL.len;
        const floor = dishY(Math.hypot(s.x, s.z));
        // (on the Courier under it: a blow, as a falling rock's)
        const L = this.local(P.pos);
        if (Math.hypot(L.x - s.x, L.z - s.z) < STAL.root + 0.4 && tipY < L.y + 1.9 && tipY > L.y - 0.2 && !s.hit) {
          s.hit = true; g.vesselDamage?.hit({ from: this.world(s.x, L.y + 3, s.z), k: 0.5, why: 'stalactite', by: 'environment' });
        }
        if (tipY <= floor + 0.3) this.land(s, floor);
      }
    }
    // the Courier: the one-way slopes, the shallows, the pools, the slide
    const L = this.local(P.pos), r = Math.hypot(L.x, L.z), drift = P.drift;
    drift.set(0, 0, 0); P.wade = 1;
    if (P.grounded) {
      const onSlope = (Math.abs(Math.abs(L.x) - SLOPE.x) < SLOPE.half + 0.2 && L.z > SLOPE.z1 && L.z < LEDGE.z0 && L.y > dishY(r) + 0.25);
      if (onSlope) drift.set(0, -3.9, -7.5); // (the sand gives under the feet: down the 30-degree slope, faster than a sprint climbs it)
      else if (r > RIM + 0.5 && L.y < 0.5) P.wade = ARENA.rim.wade;
      else if (this.slideTo && L.y < 1.2 && r < RIM + 0.5 && !this.island(L.x, L.z)) {
        const dx = this.slideTo.x - L.x, dz = this.slideTo.z - L.z, d = Math.hypot(dx, dz);
        if (d > 0.5) drift.set((dx / d) * this.slideTo.speed, 0, (dz / d) * this.slideTo.speed);
      }
      for (const w of this.pools) {
        if (w.r <= 0 || Math.hypot(L.x - w.x, L.z - w.z) > w.r * 0.85 || L.y > w.y + 1) continue; // (r 0: the pale pool, slip no longer)
        // (in: put back on the nearest dry floor, with a crack: the slip is two metres deep and takes the feet)
        const dx = L.x - w.x, dz = L.z - w.z, d = Math.hypot(dx, dz) || 1, out = { x: w.x + (dx / d) * (w.r + 1.4), z: w.z + (dz / d) * (w.r + 1.4) };
        g.course?.teleport(this.world(out.x, dishY(Math.hypot(out.x, out.z)) + 0.1, out.z), P.yaw, { keepPool: true });
        g.vesselDamage?.hit({ from: this.world(w.x, w.y, w.z), k: 0.3, why: 'slip', by: 'environment' });
        g.events?.emit('bowl.pool', { pool: w.i, by: 'environment' });
        break;
      }
    }
  }
  /** A falling stalactite lands: it lies on the floor, tipped over, as a ram target (used once) and a little cover. */
  land(s, floor) {
    const g = this.game, W = g.physics.world, a = (s.i * 1.7) % (Math.PI * 2), d = { x: Math.sin(a), z: Math.cos(a) };
    s.state = 'fallen'; s.hit = false;
    s.root.position.set(s.x, floor + STAL.root * 0.7, s.z); s.root.rotation.set(-Math.PI / 2, a, 0, 'YXZ'); // (its point, -Y from the root, laid along d)
    s.seg = { ax: s.x, az: s.z, bx: s.x + d.x * STAL.len, bz: s.z + d.z * STAL.len };
    const mx = s.x + d.x * STAL.len / 2, mz = s.z + d.z * STAL.len / 2;
    s.col = W.createCollider(RAPIER.ColliderDesc.cylinder(STAL.len / 2, STAL.root * 0.7).setTranslation(BOWL_AT.x + mx, BOWL_AT.y + floor + STAL.root * 0.7, BOWL_AT.z + mz)
      .setRotation(new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, a, 0, 'YXZ'))).setCollisionGroups(GROUPS.static).setFriction(0.9), this.body);
    sfx.shatter?.(1.2, g.listenerDistance(this.world(s.x, floor, s.z)), 'stone');
    g.events?.emit('bowl.fall', { what: 'stalactite', i: s.i, by: 'environment' });
  }

  /** A pool rings before the FOE surfaces in it (Calissa's ripple, Wanda's ring: both listen for foe.rise). */
  ring(i, seconds) { const w = this.pools[i]; if (w) { w.ringT = w.ringDur = seconds; } }
  /** The FOE comes up through a pool: the ring's splash. */
  surfaced(i) { const w = this.pools[i]; if (w) { w.ringT = 0; w.ripple.ring(0); w.ripple.surface(); } }

  dispose() {
    const g = this.game, W = g.physics.world;
    g.player.drift.set(0, 0, 0); g.player.wade = 1;
    for (const p of this.pillars) { if (p.rb) W.removeRigidBody(p.rb); this.removeLog(p); p.look.dispose(); }
    for (const s of this.stals) s.look.dispose();
    for (const w of this.pools) w.ripple.dispose();
    W.removeRigidBody(this.body);
    g.scene.remove(this.group);
    this.group.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((mm) => { if (!mm.userData?.shared) mm.dispose(); }); });
  }
}

/** The rim's slip (one a bowl; the warm-up compiles one like it: world/well/dunemaw.js prewarm). */
export const slipMaterial = () => new THREE.MeshStandardMaterial({ color: 0x6b5236, roughness: 0.25, metalness: 0, transparent: true, opacity: 0.82, name: 'bowl-slip' });

/** The distance from a point to a segment ({ ax, az, bx, bz }), on the floor's plane. */
function segDist(x, z, s) {
  if (!s) return Infinity;
  const vx = s.bx - s.ax, vz = s.bz - s.az, L2 = vx * vx + vz * vz || 1, t = Math.max(0, Math.min(1, ((x - s.ax) * vx + (z - s.az) * vz) / L2));
  return Math.hypot(x - (s.ax + vx * t), z - (s.az + vz * t));
}
