// ---------------------------------------------------------------------------------------
// THE CROSSING'S SWARM AND GEOMETRY, STAGED (the workbench's MODELS tab, group "the crossing"; docs/plans/RAIL-OVERHAUL.md sections 5
// and 6). Two looks the rail's runtime does not drive yet, shown at the rail's own scales (the ship a 1.7 m sloop flying 3 m over the
// crude: courier/ship/ship.js, views.js) so what is judged here is what the crossing will show:
//
//   crossing:shoal     the shoal at 600 glints (vfx/shoal.js): a bait ball turning over the crude with the Conductor in it and the boil
//                      under it, the frenzy's strike groups turning silver and streaking at the ship each bar; then the school drawn
//                      up into the Leviathan's silhouette (vfx/shoalsilhouette.js), its eye opening, locked and burning, cracking,
//                      shattered; the school scatters into the crude and comes back as a ball. A 24 real-second loop.
//   crossing:geometry  the ambient geometry (vfx/railgeometry.js) scrolling past the ship at the rail's speed: rail rings it threads
//                      (each lit as it passes), folding lattices either side (folding as they come abreast), monoliths rising ahead
//                      and sinking behind, and the folded sea turning up over the horizon and lying overhead (on, then off, on a loop).
//
// The glints here are steered by a stand-in (each makes for its own target, arriving, never hovering: Reynolds' seek and arrival, no
// neighbours) so 600 cost nothing on the CPU; the crossing's are Petra's boids. The counts are this stage's (the set piece's are
// SHOAL.count, Dovina's, and MAX, Petra's).
//
// Prior art: the workbench's other stages (workbench/stages.js), Abzû's schools moved by formula, and the rail's own views for the
// framing (the stage keeps `userData.rigs`: the chase and free cameras over its ship, for a screenshot).
//
//   buildSwarmStage('crossing:shoal' | 'crossing:geometry') -> Object3D (userData.tick(t), userData.rigs { chase, free } -> { pos, look, fov })
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { CrudeSea } from '../vfx/crudesea.js';
import { Sloop } from '../vfx/sloop.js';
import { ShoalLook } from '../vfx/shoal.js';
import { silhouetteTargets, silhouetteSwim, silhouetteEyeAt, facing, SilhouetteEye } from '../vfx/shoalsilhouette.js';
import { RailGeometry } from '../vfx/railgeometry.js';

const CRUISE = 3, SHIP_SCALE = 0.24, SPEED = 26; // (courier/ship/views.js CRUISE, ship.js SCALE, core/config.js T.ship.speed)
const V = (x, y, z) => new THREE.Vector3(x, y, z);
/** The rail's chase and free cameras over a ship at the origin (views.js VIEW_RIGS, at the ship's rest; the base fov 70, main.js). */
const RIGS = { chase: { pos: V(0, CRUISE + 2.2, -7.5), look: V(0, CRUISE + 1.0, 20), fov: 70 }, free: { pos: V(0, CRUISE + 1.6, -10), look: V(0, CRUISE + 1.2, 30), fov: 78 } };

/** What every stage of the crossing stands on: a patch of the crude, the ship over it, and a frame for the workbench to fit. */
function base(obj, { frame }) {
  const ship = new Sloop(); ship.group.scale.setScalar(SHIP_SCALE); ship.group.position.set(0, CRUISE, 0); obj.add(ship.group);
  const fr = new THREE.Mesh(new THREE.BoxGeometry(...frame.size), new THREE.MeshBasicMaterial()); fr.position.set(...frame.at); fr.visible = false; obj.add(fr); // (only for the workbench's framing: never drawn)
  obj.userData.rigs = RIGS;
  const late = { sea: null };
  late.add = () => { // (the sea patch comes on the first tick, after the workbench has framed the stage: a 200 m sea would frame from 400 m)
    late.sea = new CrudeSea({ size: 220, cells: 110 }); late.sea.mesh.userData.mat0 = late.sea.mat; obj.add(late.sea.mesh);
  };
  return { ship, late };
}

// ---------------------------------------------------------------- the shoal at 600
function shoalStage() {
  const obj = new THREE.Group(), N = 600, { ship, late } = base(obj, { frame: { size: [40, 22, 70], at: [0, 9, 26] } });
  const L = new ShoalLook({ max: 800 }); L._s.setScalar(2); obj.add(L.group); L.group.traverse((o) => { o.userData.mat0 = o.material; });
  const eye = new SilhouetteEye({ radius: 3 }); eye.group.visible = false; obj.add(eye.group); eye.group.traverse((o) => { o.userData.mat0 = o.material; });
  const ball = silhouetteTargets(N, 'ball', { radius: 6.5 }), lev = silhouetteTargets(N, 'leviathan', { length: 56 });
  const p = new Float32Array(N * 3), v = new Float32Array(N * 3), roll = new Float32Array(N), dash = new Float32Array(N), strike = new Float32Array(N).fill(-1), ph = new Float32Array(N).map(() => Math.random());
  const q = Array.from({ length: N }, () => new THREE.Quaternion());
  const ballAt = V(5, CRUISE + 3.5, 13), levAt = V(-2, CRUISE + 14, 52), head = new THREE.Vector3(), swim = new Float32Array(N * 3), M = new THREE.Matrix4(), Q = new THREE.Quaternion();
  for (let i = 0; i < N; i++) { p[i * 3] = ballAt.x + ball.points[i * 3]; p[i * 3 + 1] = -1.5; p[i * 3 + 2] = ballAt.z + ball.points[i * 3 + 2]; }
  const T = new THREE.Vector3(), P = new THREE.Vector3(), W = new THREE.Vector3(), Z = V(0, 0, 1), U = new THREE.Vector3(), qq = new THREE.Quaternion();
  let pt = 0, lastBar = -1, loop = -1;
  obj.userData.tick = (t) => {
    if (!late.sea) late.add();
    const dt = Math.min(0.05, Math.max(0, t - pt)); pt = t;
    const k = t % 24, form = k >= 8 && k < 18, scatter = k >= 18 && k < 20, inBall = !form && !scatter;
    if (Math.floor(t / 24) !== loop) { loop = Math.floor(t / 24); eye.reset(); }
    // the ball turns; the silhouette swims, facing the chase camera
    const rot = t * 0.45, cr = Math.cos(rot), sr = Math.sin(rot);
    facing(levAt, RIGS.chase.pos, Q); M.compose(levAt, Q, W.set(1, 1, 1)); silhouetteSwim(lev, t, swim); head.set(0, 0, 1).applyQuaternion(Q);
    // the frenzy: each bar (1.5 s) a strike group of 14 turns silver for a quarter-bar, then dashes at the ship
    const bar = Math.floor(t / 1.5);
    if (bar !== lastBar) { lastBar = bar; if (inBall && k > 2) for (let n = 0, i = (bar * 37) % N; n < 14; i = (i + 41) % N) { if (strike[i] < 0) { strike[i] = 0; n++; } } }
    for (let i = 0; i < N; i++) {
      const o = i * 3; P.set(p[o], p[o + 1], p[o + 2]);
      let speed = 9, agile = 3;
      if (strike[i] >= 0) strike[i] += dt;
      const st = strike[i];
      if (st >= 0 && st < 0.375) { T.set(ballAt.x + ball.points[o] * cr - ball.points[o + 2] * sr, ballAt.y + ball.points[o + 1], ballAt.z + ball.points[o] * sr + ball.points[o + 2] * cr); }
      else if (st >= 0.375 && st < 1.6) { T.set(Math.sin(i) * 1.5, CRUISE + Math.cos(i * 1.3) * 0.8, -4); speed = 24; agile = 6; } // (at where the ship will be, and past it)
      else if (form) { T.set(swim[o], swim[o + 1], swim[o + 2]).applyMatrix4(M); speed = 16; agile = 2.5; }
      else if (scatter) { T.copy(P).sub(levAt).setY(0).normalize().multiplyScalar(60).add(levAt).setY(-6); speed = 20; agile = 2; }
      else T.set(ballAt.x + ball.points[o] * cr - ball.points[o + 2] * sr, ballAt.y + ball.points[o + 1], ballAt.z + ball.points[o] * sr + ball.points[o + 2] * cr);
      if (st >= 1.6) strike[i] = -1;
      // never hovering: each makes for a point circling its target (a fish swims or sinks)
      const a = t * 3.2 + ph[i] * 6.28; T.x += Math.cos(a) * 0.6; T.y += Math.sin(a * 0.7) * 0.35; T.z += Math.sin(a) * 0.6;
      U.subVectors(T, P); const d = U.length(); U.multiplyScalar(Math.min(speed, 1.5 + d * 1.6) / Math.max(d, 1e-3)); // (arrival: slower as it nears)
      const e = 1 - Math.exp(-agile * dt);
      v[o] += (U.x - v[o]) * e; v[o + 1] += (U.y - v[o + 1]) * e; v[o + 2] += (U.z - v[o + 2]) * e;
      p[o] += v[o] * dt; p[o + 1] += v[o + 1] * dt; p[o + 2] += v[o + 2] * dt;
      if (late.sea && !scatter) { const h = late.sea.heightAt(p[o], p[o + 2]); if (p[o + 1] > h - 1) p[o + 1] = Math.max(p[o + 1], h + 0.2); } // (on the crude, not through it; one still under comes up by swimming)
      W.set(v[o], v[o + 1], v[o + 2]); if (form && st < 0) W.normalize().addScaledVector(head, 2.5); if (W.lengthSq() > 0.01) q[i].slerp(qq.setFromUnitVectors(Z, W.normalize()), 1 - Math.exp(-8 * dt));
      roll[i] += ((st >= 0 && st < 1.6 ? 1 : 0) - roll[i]) * (1 - Math.exp(-10 * dt)); dash[i] += ((st >= 0.375 && st < 1.6 ? 1 : 0) - dash[i]) * (1 - Math.exp(-12 * dt));
      L.set(i, P.set(p[o], p[o + 1], p[o + 2]), q[i], roll[i], dash[i]);
    }
    L.count = N;
    L.ball(ballAt, 6.5, inBall ? 1 : 0);
    L.glow(THREE.MathUtils.clamp(form ? (k - 8) / 2 : scatter ? 1 - (k - 18) : 0, 0, 1)); // (the silhouette lit from within as it forms)
    L.conductor(W.set(ballAt.x + Math.cos(t * 0.9) * 2, ballAt.y - 1, ballAt.z + Math.sin(t * 0.9) * 2), qq.setFromAxisAngle(U.set(0, 1, 0), -t * 0.9), inBall);
    L.boil(W.set(ballAt.x, 0, ballAt.z), 9, inBall ? 1 : 0, late.sea);
    L.update(dt);
    // the eye: seen once the silhouette has formed, opened, locked, cracked, shattered
    eye.group.visible = k >= 9.5 && k < 20;
    if (eye.group.visible) {
      silhouetteEyeAt(lev, t, W).applyMatrix4(M); eye.group.position.copy(W);
      eye.set({ open: k > 10 ? 1 : 0, locked: k > 13 ? 1 : 0, crack: THREE.MathUtils.clamp((k - 14) / 2.5, 0, 0.9) });
      if (k > 17) eye.shatter();
      eye.update(dt);
    }
    late.sea?.update(t);
    ship.set({ sail: 1, glow: 0.6, t }); ship.group.position.y = CRUISE + Math.sin(t * 1.1) * 0.15;
  };
  return obj;
}

// ---------------------------------------------------------------- the ambient geometry
function geometryStage() {
  const obj = new THREE.Group(), { ship, late } = base(obj, { frame: { size: [70, 30, 90], at: [0, 12, 35] } });
  const loopZ = 220, wrap = (z) => ((((z + 40) % loopZ) + loopZ) % loopZ) - 40; // (things scroll toward the ship and come round again, -40 .. 180 m)
  let G = null, rings = [], lat = [], mono = [], pt = 0;
  const prevZ = new Map();
  const build = () => { // (on the first tick, as the sea: built at load, the sunk slabs and far rings would frame the stage from 200 m)
    G = new RailGeometry({ seaY: 0 }); obj.add(G.group); obj.userData.geometry = G;
    rings = [0, 1, 2, 3, 4].map((i) => ({ z0: 30 + i * 44, x: [0, 2.5, -2, 1, -2.5][i], r: 5 + (i % 2), h: null }));
    for (const r of rings) r.h = G.ring(V(r.x, r.r + 1, r.z0), new THREE.Quaternion(), r.r);
    lat = [-1, 1].flatMap((s) => [0, 1].map((j) => ({ z0: 60 + j * 110 + (s > 0 ? 55 : 0), s, h: G.lattice(V(0, 0, 0), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, s * Math.PI * 0.3, 0)), 22, { cells: 10 }) }))); // (turned 54 degrees off the rail, so the fold is seen, not edge on)
    mono = [[24, 70, 14], [-30, 120, 18], [36, 160, 22], [-20, 200, 12], [44, 30, 20]].map(([x, z0, h]) => ({ x, z0, h: G.monolith(V(x, 0, z0), { height: h, rise: 0 }) }));
    G.group.traverse((o) => { o.userData.mat0 = o.material; });
  };
  obj.userData.tick = (t) => {
    if (!late.sea) { late.add(); build(); }
    const dt = Math.min(0.05, Math.max(0, t - pt)), s = SPEED * t; pt = t;
    for (const r of rings) {
      const z = wrap(r.z0 - s), before = prevZ.get(r) ?? z; prevZ.set(r, z);
      r.h.pos.set(r.x, r.r + 1, z);
      if (before > z + 100) r.h.set({ lit: 0 }); // (come round again: dark)
      r.h.crossed(V(0, CRUISE, z - before), V(0, CRUISE, 0)); // (the ship's path through the ring, in the ring's frame: it lights as it is threaded)
    }
    for (const l of lat) { // (a sheet either side, standing; it folds as it comes abreast and lies open again once it is past)
      const z = wrap(l.z0 - s); l.h.mesh.position.set(l.s * 18, 12, z);
      l.h.set({ fold: THREE.MathUtils.smoothstep(z, -30, 10) * (1 - THREE.MathUtils.smoothstep(z, 10, 70)) * 0.9 + 0.05 });
    }
    for (const m of mono) { const z = wrap(m.z0 - s); m.h.pos.set(m.x, late.sea.heightAt(m.x, z), z); m.h.set({ rise: z > 150 || z < -25 ? 0 : 1 }); }
    const k = t % 16; G.ceiling(k > 3 && k < 12, { height: 45, ahead: 200 });
    G.update(dt, { t, camera: { position: V(0, CRUISE, 0) } }); // (the folded sea spans the ship: the stage's eye)
    late.sea.update(t);
    ship.set({ sail: 1, glow: 0.6, t }); ship.group.position.y = CRUISE + Math.sin(t * 1.1) * 0.15;
  };
  return obj;
}

export function buildSwarmStage(id) {
  if (id === 'crossing:shoal') return shoalStage();
  if (id === 'crossing:geometry') return geometryStage();
  return null;
}
