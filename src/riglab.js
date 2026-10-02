import * as THREE from 'three';
import { PALETTE } from './config.js';
import { BASE_Y, label, strip } from './basement.js';
import { ARCHES } from './techlab.js';

// ---------------------------------------------------------------------------
// Two wings of THE MOVEMENT LAB, west of the tech lab (through its west arch):
//
//   THE RIGGING  x -70..-36.5   things to hang from, climb and walk on
//     R1 HANG      a 2.7 m ledge to catch and shimmy along (with a shooting shelf behind you),
//                  and a 5.5 m pillar to latch up
//     R2 CABLES    a pit crossed three ways: overhead bars (swing across the gap), a zipline
//                  from a tower, and two balance beams (0.3 m, 0.2 m)
//     R3 GRATES    a 8.6 m grate wall, an overhang to crawl along over a pit, a tower beyond
//     R4 POLES     a pole to slide down, a rope to climb, a tower to get back up
//   THE HANDS    x -104..-70.5  things to pick up, push, kick and shoot
//     H1 CRATES    heavy crates to push and pull, small ones to lift; a 3.2 m wall to get up
//     H2 THROW     a range of targets at 10 / 16 / 22 m, with pots and crates on a bench
//     H3 PARRY     a mortar throwing at you every few seconds: kick them back at the targets
//     H4 RECOIL    a 7.2 m platform you can reach by shooting down in the air
// ---------------------------------------------------------------------------

export const RIG = { x0: -70, x1: -36.5, z0: -72, z1: -36.5 };
export const HANDS = { x0: -104, x1: -70.5, z0: -72, z1: -36.5 };
export const RIG_PIT = { x0: -67, x1: -52, z0: -70, z1: -56, depth: 4 };
export const GRATE_PIT = { x0: -66, x1: -58, z0: -52, z1: -42, depth: 4 };
const H = 13.5, Wt = 0.5;

export const RIG_CPS = [
  { room: 'R1', name: 'hang · latch', pos: [-40, 0, -46], yaw: -Math.PI / 2, zone: [-42, -37, -48, -44] },
  { room: 'R2', name: 'bars · cable · beams', pos: [-47, 1.2, -63], yaw: -Math.PI / 2, zone: [-52, -46, -70, -56] },
  { room: 'R3', name: 'grates', pos: [-57, 0, -47], yaw: Math.PI / 2, zone: [-58, -55.6, -52, -42] },
  { room: 'R4', name: 'poles · ropes', pos: [-45, 0, -54], yaw: Math.PI, zone: [-49, -40, -55.5, -52.5] },
];
export const HAND_CPS = [
  { room: 'H1', name: 'crates', pos: [-74, 0, -44], yaw: -Math.PI / 2, zone: [-77, -72, -48, -40] },
  { room: 'H2', name: 'throw', pos: [-75, 0, -55], yaw: -Math.PI / 2, zone: [-77, -73, -58, -52] },
  { room: 'H3', name: 'kick · parry', pos: [-82, 0, -64], yaw: Math.PI, zone: [-86, -78, -67, -61] },
  { room: 'H4', name: 'recoil', pos: [-94, 0, -66], yaw: -Math.PI / 2, zone: [-96, -90, -69, -63] },
];
// reset floors: rectangle -> index into RIG_CPS, and the height (relative to the basement floor) to fall below
export const RIG_PITS = [[[RIG_PIT.x0, RIG_PIT.x1, RIG_PIT.z0, RIG_PIT.z1], 1, -RIG_PIT.depth + 1.2], [[GRATE_PIT.x0, GRATE_PIT.x1, GRATE_PIT.z0, GRATE_PIT.z1], 2, -GRATE_PIT.depth + 1.2]];

/** A bullseye on a plate that faces +x or +z (`axis`), rings when something lands on it. */
function bullseye(M, C, pos, axis, id) {
  const t = M.shuttle({ pos, to: [0, 0, 0], move: 1, dwell: 1 });
  t.box(axis === 'x' ? [0.3, 1.7, 1.7] : [1.7, 1.7, 0.3], C.wood, [0, 0, 0]);
  const rings = [];
  [[0.8, C.dark], [0.62, C.glow], [0.42, C.dark], [0.24, C.glow]].forEach(([r, c], i) => {
    const mat = new THREE.MeshBasicMaterial({ color: c });
    const d = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.02, 24), mat);
    if (axis === 'x') { d.rotation.z = Math.PI / 2; d.position.set(0.16 + i * 0.004, 0, 0); } else { d.rotation.x = Math.PI / 2; d.position.set(0, 0, 0.16 + i * 0.004); }
    t.group.add(d);
    rings.push({ mat, c: new THREE.Color(c) });
  });
  t.target = { id, hits: 0, cd: 0, flash: 0, r: 0.9, top: 0, rings };
  const white = new THREE.Color(0xffffff);
  t.tick = (dt) => {
    const g = t.target;
    g.cd = Math.max(0, g.cd - dt);
    g.flash = Math.max(0, g.flash - dt * 2.5);
    for (const r of g.rings) r.mat.color.copy(r.c).lerp(white, g.flash);
  };
  return t;
}

export function buildRigLab(L, env) {
  const C = PALETTE, S = L.scene, B = BASE_Y, M = env.movers, R = env.rigging;
  const blk = (x0, x1, y0, y1, z0, z1, color = C.mid, opts = {}) =>
    L.box([(x0 + x1) / 2, B + (y0 + y1) / 2, (z0 + z1) / 2], [x1 - x0, y1 - y0, z1 - z0], color, opts);
  const solid = { outline: false, shadow: false };
  const rod = (x, z, y0, y1, r = 0.03) => { // (a hanger from the ceiling: for the eye only)
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, y1 - y0, 5), new THREE.MeshStandardMaterial({ color: C.dark, roughness: 0.9 }));
    m.position.set(x, B + (y0 + y1) / 2, z);
    S.add(m);
  };

  const floor = (Rm, holes) => {
    const zs = [...new Set([Rm.z0 - 0.5, Rm.z1, ...holes.flatMap((h) => [h.z0, h.z1])])].sort((a, b) => a - b);
    for (let i = 0; i < zs.length - 1; i++) {
      const za = zs[i], zb = zs[i + 1], zm = (za + zb) / 2;
      const cuts = holes.filter((h) => zm > h.z0 && zm < h.z1).sort((a, b) => a.x0 - b.x0);
      let xa = Rm.x0 - 0.5;
      for (const h of cuts) { if (h.x0 > xa) blk(xa, h.x0, -0.5, 0, za, zb, C.dark, { outline: false }); xa = h.x1; }
      if (Rm.x1 + 0.5 > xa) blk(xa, Rm.x1 + 0.5, -0.5, 0, za, zb, C.dark, { outline: false });
    }
  };
  // a hall: ceiling, north and south walls, and the sides that aren't shared with the next hall
  const shell = (Rm, { west = true, doorWest = null, lights = [] } = {}) => {
    blk(Rm.x0 - 0.5, Rm.x1 + 0.5, H, H + 0.5, Rm.z0 - 0.5, Rm.z1, C.deep, solid);
    blk(Rm.x0 - 0.5, Rm.x1 + 0.5, 0, H, Rm.z0 - Wt, Rm.z0, C.wall, solid);
    blk(Rm.x0 - 0.5, Rm.x1 + 0.5, 0, H, Rm.z1, Rm.z1 + Wt, C.wall, solid);
    if (west) {
      const x = Rm.x0 - Wt;
      if (!doorWest) blk(x, x + Wt, 0, H, Rm.z0 - 0.5, Rm.z1, C.wall, solid);
      else {
        const [d0, d1, dh] = doorWest;
        blk(x, x + Wt, 0, H, Rm.z0 - 0.5, d0, C.wall, solid);
        blk(x, x + Wt, 0, H, d1, Rm.z1, C.wall, solid);
        blk(x, x + Wt, dh, H, d0, d1, C.wall, solid);
      }
    }
    for (const p of lights) {
      const l = new THREE.PointLight(0xffa066, p[3] ?? 40, 60, 1.05);
      l.position.set(p[0], B + p[1], p[2]);
      S.add(l);
    }
  };
  /** A reset pit: dark skin, floor and faces. */
  const pit = (P) => {
    blk(P.x0, P.x1, -P.depth - 0.5, -P.depth, P.z0, P.z1, C.outline, { outline: false });
    blk(P.x0 - 0.5, P.x0 + 0.01, -P.depth, -0.02, P.z0, P.z1, C.dark, solid);
    blk(P.x1 - 0.01, P.x1 + 0.5, -P.depth, -0.02, P.z0, P.z1, C.dark, solid);
    blk(P.x0, P.x1, -P.depth, -0.02, P.z0 - 0.5, P.z0 + 0.01, C.dark, solid);
    blk(P.x0, P.x1, -P.depth, -0.02, P.z1 - 0.01, P.z1 + 0.5, C.dark, solid);
    strip(S, [(P.x0 + P.x1) / 2, B + 0.01, P.z1 + 0.04], [P.x1 - P.x0, 0.02, 0.08]);
    strip(S, [(P.x0 + P.x1) / 2, B + 0.01, P.z0 - 0.04], [P.x1 - P.x0, 0.02, 0.08]);
  };

  // ============================== THE RIGGING ==============================
  floor(RIG, [RIG_PIT, GRATE_PIT]);
  shell(RIG, { west: true, doorWest: ARCHES.hands, lights: [[-50, 10, -58], [-56, 10, -44], [-42, 10, -64, 30]] });
  label(S, 'THE RIGGING', [-39.6, B + 0.02, -42.5], { rotY: Math.PI / 2, width: 3, sub: 'hang · climb · balance · slide' });
  label(S, 'THE HANDS', [-73, B + 0.02, -47], { rotY: -Math.PI / 2, width: 2.4, sub: 'lift · push · kick · parry' });
  strip(S, [-70.3, B + 4.02, -47], [0.1, 0.06, 4.2]);

  // ---- R1 HANG: a ledge to catch, a pillar to latch ----
  {
    blk(-60, -49, 0, 2.7, -43, -40, C.wood);
    strip(S, [-54.5, B + 2.71, -40.02], [11, 0.03, 0.05]);
    blk(-56, -48, 2.2, 2.35, -37.6, -36.5, C.dark); // (a shelf on the south wall: the targets to shoot while you hang)
    blk(-47, -43, 0, 5.5, -43, -39, C.mid);
    label(S, 'HANG', [-54.5, B + 0.02, -45.5], { width: 1.8, help: 'Jump at a ledge with W held to hang; A and D shimmy, W climbs up.' });
    label(S, '2.7 m', [-54.5, B + 1.3, -39.98], { rotY: Math.PI, width: 1.2, vertical: true, sub: 'aim behind you' });
    label(S, 'LATCH', [-45, B + 0.02, -45], { width: 1.5, sub: 'C beside a wall, in the air' });
    label(S, '5.5 m', [-45, B + 2.7, -39.02], { rotY: Math.PI, width: 1, vertical: true });
  }

  // ---- R2: a pit crossed by bars, a zipline, and two balance beams ----
  {
    const P = RIG_PIT;
    pit(P);
    blk(-52, -46, 0, 1.2, -70, -56, C.mid); // start
    blk(-70, -67, 0, 1.2, -70, -56, C.mid); // end
    blk(-52, -48, 1.2, 6.4, -70, -67, C.pot); // zip tower
    env.ladders.add({ x: -50, z: -67, y0: B + 1.2, y1: B + 6.4, n: new THREE.Vector3(0, 0, 1) });
    blk(-70, -67, 1.2, 3.4, -70, -67, C.pot); // zip landing
    // overhead bars, a swing-jump apart
    R.addBar([-51.5, B + 3.7, -59], [-58.5, B + 3.7, -59]);
    R.addBar([-61.1, B + 3.7, -59], [-68.5, B + 3.7, -59]);
    for (const x of [-51.5, -55, -58.5, -61.1, -64.8, -68.5]) rod(x, -59, 3.7, H);
    // the zipline: down from the tower top
    R.addBar([-51, B + 8.3, -68.5], [-66.5, B + 5.7, -68.5], { zip: true });
    rod(-51, -68.5, 8.3, H, 0.05);
    // two balance beams, flush with the platforms
    R.addBeam(L, [-52, B + 1.2, -63], [-67, B + 1.2, -63], { width: 0.3 });
    R.addBeam(L, [-52, B + 1.2, -65.5], [-67, B + 1.2, -65.5], { width: 0.2, color: C.pot });
    label(S, 'BARS', [-49, B + 1.22, -57.6], { rotY: -Math.PI / 2, width: 1.2, help: 'Jump up to a bar; W and S move along it and Space swings off.' });
    label(S, 'BEAMS', [-49, B + 1.22, -63.9], { rotY: -Math.PI / 2, width: 1.3, sub: '0.3 m and 0.2 m', help: 'On a beam, Shift trots.' });
    label(S, 'CABLE', [-50, B + 6.42, -66.6], { rotY: Math.PI, width: 1.3, sub: 'jump at it, ride it down' });
    label(S, 'CABLES', [-48, B + 1.22, -69], { rotY: -Math.PI / 2, width: 1.5, sub: 'ladder up the tower' });
  }

  // ---- R3: grates ----
  {
    const P = GRATE_PIT;
    pit(P);
    blk(-70, -66, 0, 6.5, -52, -44, C.mid); // the tower beyond (its top is where your feet swing to under the roof)
    env.ladders.add({ x: -68, z: -52, y0: B, y1: B + 6.5, n: new THREE.Vector3(0, 0, -1) });
    // a wall, climbed from its west face (the strip of floor beside the pit) up to a roof that
    // runs out over the pit to the tower
    R.addGrate(L, { c: [-56, B + 4.3, -47], n: [1, 0, 0], w: 6, h: 8.6 });
    R.addGrate(L, { c: [-61, B + 8.75, -47], n: [0, -1, 0], w: 10, h: 6 });
    // (the roof hangs from the ceiling on rods)
    for (const x of [-65, -61, -57]) for (const z of [-49.5, -44.5]) rod(x, z, 8.8, H, 0.05);
    label(S, 'GRATES', [-57, B + 0.02, -50.4], { rotY: -Math.PI / 2, width: 1.4, help: 'Walk into a grate to cling to it, any way up; C lets go.' });
    label(S, '8.6 m', [-56.1, B + 4, -51.2], { rotY: 0, width: 1, vertical: true, sub: 'up, then overhead' });
  }

  // ---- R4: a tower, a pole down, a rope up ----
  {
    blk(-41, -37, 0, 8.5, -72, -56, C.mid);
    env.ladders.add({ x: -39, z: -56, y0: B, y1: B + 8.5, n: new THREE.Vector3(0, 0, 1) });
    R.addPole({ x: -43.4, z: -68, y0: B, y1: B + 9.2, r: 0.08 });
    R.addPole({ x: -43.4, z: -60, y0: B + 1.2, y1: B + 10.5, rope: true });
    const g = new THREE.Mesh(new THREE.BoxGeometry(4, 0.4, 1.4), new THREE.MeshStandardMaterial({ color: C.wood, roughness: 0.9, flatShading: true }));
    g.position.set(-43.4, B + 10.7, -60);
    S.add(g);
    for (const dx of [-1.6, 1.6]) rod(-43.4 + dx, -60, 10.9, H, 0.06);
    label(S, 'POLES', [-45, B + 0.02, -57.5], { width: 1.6, help: 'Walk into a pole to climb it; C slides down.' });
    label(S, 'POLE', [-43.4, B + 0.02, -70], { width: 1, sub: 'jump from the tower' });
    label(S, 'ROPE', [-43.4, B + 0.02, -62.4], { rotY: Math.PI, width: 1, help: 'On a rope, Space leaps off.' });
    label(S, '8.5 m', [-39, B + 8.52, -57.4], { rotY: Math.PI, width: 1, vertical: false });
  }

  // ============================== THE HANDS ==============================
  floor(HANDS, []);
  shell(HANDS, { west: true, lights: [[-84, 10, -50], [-96, 10, -60]] });

  // ---- H1: crates ----
  {
    blk(-98, -88, 0, 3.2, -46, -40, C.mid);
    label(S, 'CRATES', [-78, B + 0.02, -37.8], { rotY: Math.PI, width: 1.8, help: 'Hold Z at a crate: W pushes and S pulls.' });
    label(S, '3.2 m', [-88.02, B + 1.9, -43], { rotY: Math.PI / 2, width: 1, vertical: true, sub: 'stack up to it' });
    label(S, 'LIFT', [-80, B + 0.02, -39.2], { rotY: Math.PI, width: 1.2, sub: 'Z at a small one' });
  }
  // ---- H2: a throwing range ----
  {
    const cases = [[-86, 1.6, -55, 'r1'], [-92, 3.2, -58, 'r2'], [-98, 1.4, -52, 'r3']];
    for (const [x, y, z, id] of cases) {
      blk(x - 0.55, x + 0.55, 0, y - 0.9, z - 0.55, z + 0.55, C.wood);
      bullseye(M, C, [x, B + y, z], 'x', `throw-${id}`);
    }
    blk(-82, -77.5, 0, 0.95, -57, -53, C.wood); // the bench with things to throw
    label(S, 'THROW', [-79.75, B + 0.98, -53.4], { rotY: Math.PI, width: 1.4, sub: 'Z lifts · fire throws' });
    label(S, '10 · 16 · 22 m', [-75, B + 0.02, -51], { rotY: -Math.PI / 2, width: 1.9, sub: 'pots break where they land' });
  }
  // ---- H3: a mortar to parry ----
  {
    const at = [-82, 2.4, -71.3];
    env.lobbers.add({ pos: [at[0], B + at[1], at[2]], zone: [-92, -72, -70, -58], interval: 3.6, speed: 13 });
    for (const x of [-89, -75]) bullseye(M, C, [x, B + 2.4, -71.6], 'z', `parry-${x}`);
    label(S, 'PARRY', [-82, B + 0.02, -66.2], { width: 1.6, sub: 'kick the ball back at a target' });
    label(S, 'KICK', [-90, B + 0.02, -62], { width: 1.1, sub: 'Z, nothing in reach' });
  }
  // ---- H4: a platform you can only get to with the gun ----
  {
    blk(-104, -98, 0, 7.2, -72, -62, C.mid);
    label(S, 'RECOIL', [-95.5, B + 0.02, -66], { rotY: -Math.PI / 2, width: 1.6, sub: 'in the air, shoot down' });
    label(S, '7.2 m', [-97.98, B + 5, -64], { rotY: Math.PI / 2, width: 1, vertical: true, sub: 'three shots a jump' });
  }
  env.ladders.build(L, 0.3);
}

/** Breakables and props in the wings (they come back): the shelf targets, the crates, the bench, the kick row. */
export function spawnRigLab(Bk, level) {
  const C = PALETTE, B = BASE_Y;
  // R1: pots on the shelf behind you
  for (const x of [-55, -53, -51, -49]) Bk.spawn({ kind: 'jar', pos: [x, B + 2.35, -37.1], color: C.potLight, target: true, respawn: 6 });
  // H1: heavy crates (push / pull) and small ones (lift)
  level.crate([-83.5, B + 0.6, -44], 1.2);
  level.crate([-83.5, B + 0.6, -40.6], 1.2);
  level.crate([-80, B + 0.35, -40.6], 0.7);
  level.crate([-81.2, B + 0.35, -40.6], 0.7);
  // H2: what to throw
  const kinds = ['jar', 'amphora', 'pitcher', 'melon'];
  kinds.forEach((k, i) => Bk.spawn({ kind: k, pos: [-81.3 + i * 1.0, B + 0.96, -55], color: i % 2 ? C.potLight : C.pot, respawn: 8 }));
  level.crate([-80.5, B + 1.3, -56], 0.7);
  level.crate([-78.5, B + 1.3, -54], 0.6);
  // H3: pots to kick
  for (let i = 0; i < 5; i++) Bk.spawn({ kind: kinds[i % 4], pos: [-94 + i * 1.1, B + 0.002, -63.5], color: i % 2 ? C.potLight : C.pot, respawn: 8 });
}
