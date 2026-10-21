// ---------------------------------------------------------------------------------------
// THE CROSSING'S FOE MARKS: what the player sees before a foe or a shot arrives (docs/plans/RAIL-FLOW.md section 4, the mock v4's legend).
//   the edge mark         where a wave will come in, a bar before it enters (every wave, RAIL-FLOW law 3; the ambusher's wait too), held
//                         at the frame's edge: two gold chevrons pointing in toward the ship, a ring round them closing as the wait runs
//                         out (the fill is the when), a throb on each beat. Its kind sets its size: a foe's, a swarm's (wider, a second
//                         ring), a boss's (largest, its ring in ember). Two marks asked at one spot are one. A world mark: no words.
//                         Carried in the rail's frame, so it keeps its place in the view.
//   the off-frame arrow   a foe in play outside the view, or a shot coming at the ship from outside it: a small arrowhead on the frame's
//                         edge pointing out toward it, gold for a foe, white-hot for shots (one an edge sector, brighter the more there
//                         are and the nearer). Read from the waves and the shot field each frame; nothing to call.
//   the mine burst        a mine going off (`rail.mine`, its `at` in the rail's frame): a hot flash, a shock ring in the plane its ring of
//                         shots flies in, opening to the burst's reach in 0.45 real s. Its body breaking up is railfoes.js's 'burst' death.
// Both in the rail's plain additive look (MeshBasicMaterial, additive), kept true under the storm's veil: they are the danger.
//
// Prior art: the off-screen threat arrow of Ikaruga and Sin and Punishment (an arrow at the frame edge where a foe will enter) and the
// closing ring of osu!'s approach circle as its timer; the mine's ring the shockwave decal of R-Type's space mines and Star Fox's bombs.
//
//   const M = new RailFoeMarks(game, stage)   M.build(scene)   M.parked() -> [objects]   M.update(raw)   M.clear()
//   game.edgeMark.show(local, wait, { kind: 'foe' | 'swarm' | 'boss' }) -> handle { stop() }   (local: a Vector3 in the rail's frame, where
//     it enters; wait: real seconds, a bar for a wave)   game.ambushMark is the same call (the ambusher's move: foemoves.js `overtake`)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { keepTrue } from './stormwarp.js';
import { BAR_S } from '../progress/rail/crossing.js';

const EDGE = { size: 1.2, inX: 0.84, inY: [-0.5, 0.8], gold: 0xffd36a, ember: 0xff8a3a, ringAlpha: 0.9, chevAlpha: 1, beat: BAR_S / 4, n: 10, same: 0.09 };
/** A mark's kind: its size, and its ring's colour (a boss's ember from the start). */
const KIND = { foe: { size: 1, ring: EDGE.gold, outer: false }, swarm: { size: 1.25, ring: EDGE.gold, outer: true }, boss: { size: 1.6, ring: EDGE.ember, outer: true }, hazard: { size: 1.15, ring: 0x9fe8de, outer: true } }; // (a hazard's: the crude-glass's pale teal, vfx/railhazards.js)
/** The off-frame arrow: where it sits (the frame's box, inside the edge marks'), how far ahead of the eye it is drawn (m), how far a foe
 *  or a shot may be and still earn one (m), how many sectors round the edge (one arrow each), a shot's approach (cos of its heading's angle
 *  to the ship). */
const ARROW = { inX: 0.9, inY: [-0.56, 0.86], at: 8, size: 0.32, reach: { foe: 70, shot: 32 }, sectors: 24, approach: 0.55, foe: 0xffd36a, shot: 0xfff2d8 };
const BURST = { time: 0.45, reach: 7, flash: 2.6, hot: 0xfff0c0, ring: 0xffb070, n: 6 };
const _a = new THREE.Vector3(), _m = new THREE.Matrix4(), _c = new THREE.Color(), _w = new THREE.Vector3(), _s = new THREE.Vector3(), _t = new THREE.Vector3(), _d = new THREE.Vector3(), _q = new THREE.Quaternion(), _z = new THREE.Vector3(0, 0, 1);

function additive(color, opacity) {
  const m = new THREE.MeshBasicMaterial({ color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false, side: THREE.DoubleSide });
  keepTrue(m); return m;
}
function put(scene, mesh, order) { mesh.visible = false; mesh.renderOrder = order; mesh.frustumCulled = false; mesh.userData.zoneFree = true; scene.add(mesh); return mesh; }

/** Two chevrons pointing +X (in), side by side, as one flat shape. */
function chevronGeometry() {
  const s = new THREE.Shape(), c = (x) => { s.moveTo(x - 0.18, 0.32); s.lineTo(x + 0.12, 0); s.lineTo(x - 0.18, -0.32); s.lineTo(x - 0.32, -0.32); s.lineTo(x - 0.02, 0); s.lineTo(x - 0.32, 0.32); s.closePath(); };
  c(-0.05); c(0.3);
  return new THREE.ShapeGeometry(s);
}
/** One arrowhead pointing +X, its tip at the origin (so it sits on the frame's edge and points out). */
function arrowGeometry() {
  const s = new THREE.Shape(); s.moveTo(0, 0); s.lineTo(-0.9, 0.5); s.lineTo(-0.62, 0); s.lineTo(-0.9, -0.5); s.closePath();
  return new THREE.ShapeGeometry(s);
}

export class RailFoeMarks {
  constructor(game, stage) {
    this.game = game; this.st = stage; this.edges = []; this.bursts = [];
    game.edgeMark = game.ambushMark = { show: (local, wait, o) => this.show(local, wait, o) };
    this.sector = Array.from({ length: ARROW.sectors }, () => ({ foe: 0, shot: 0, fx: 0, fy: 0, sx: 0, sy: 0 }));
    game.events?.on?.('rail.mine', (e) => { if (e?.at) this.burst(e.at, e.up); });
  }
  build(scene) {
    const chev = chevronGeometry(), ring = new THREE.RingGeometry(0.62, 0.7, 40, 1);
    for (let i = 0; i < EDGE.n; i++) {
      const g = new THREE.Group(); g.visible = false; g.renderOrder = 56; g.frustumCulled = false; g.userData.zoneFree = true; scene.add(g);
      const c = new THREE.Mesh(chev, additive(EDGE.gold, EDGE.chevAlpha)), r = new THREE.Mesh(ring, additive(EDGE.gold, EDGE.ringAlpha * 0.35)), f = new THREE.Mesh(new THREE.RingGeometry(0.5, 0.56, 40, 1, Math.PI / 2, Math.PI * 2), additive(EDGE.gold, EDGE.ringAlpha));
      const o = new THREE.Mesh(ring, additive(EDGE.gold, EDGE.ringAlpha * 0.3)); o.scale.setScalar(1.3); // (a swarm's and a boss's second ring)
      for (const m of [c, r, f, o]) { m.renderOrder = 56; m.frustumCulled = false; g.add(m); }
      this.edges.push({ g, c, r, f, o, local: new THREE.Vector3(), t: 0, wait: 0, on: false, kind: KIND.foe });
    }
    // the off-frame arrows: one instanced draw, an arrowhead a sector
    this.arrows = new THREE.InstancedMesh(arrowGeometry(), additive(0xffffff, 1), ARROW.sectors);
    this.arrows.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(ARROW.sectors * 3), 3);
    this.arrows.count = 0; put(scene, this.arrows, 56); this.arrows.visible = true;
    const flash = new THREE.CircleGeometry(1, 24), shock = new THREE.RingGeometry(0.86, 1, 48, 1);
    for (let i = 0; i < BURST.n; i++) this.bursts.push({ flash: put(scene, new THREE.Mesh(flash, additive(BURST.hot, 1)), 57), ring: put(scene, new THREE.Mesh(shock, additive(BURST.ring, 1)), 57), local: new THREE.Vector3(), up: new THREE.Vector3(0, 1, 0), t: Infinity });
  }
  parked() { return [this.arrows, ...this.edges.map((e) => e.g), ...this.bursts.flatMap((b) => [b.flash, b.ring])]; }

  /** A wave's mark at the frame's edge where it will enter (or an ambusher's: foemoves.js `overtake`), held `wait` real seconds. Asked
   *  where one already stands (within `EDGE.same` of the frame, in the rail's frame as the view sees it), that one is kept and the larger
   *  kind and the later end win: two waves from one edge read as one mark. */
  show(local, wait, { kind = 'foe' } = {}) {
    const K = KIND[kind] || KIND.foe, cam = this.game.camera, R = this.st.rail;
    let e = null;
    if (cam && R) {
      R.toWorld(local, _w); _a.copy(_w).project(cam);
      for (const x of this.edges) if (x.on && x.wait - x.t > 0.05) { R.toWorld(x.local, _w); _s.copy(_w).project(cam); if (Math.hypot(_s.x - _a.x, _s.y - _a.y) < EDGE.same) { e = x; break; } }
    }
    if (e) { e.wait = Math.max(e.wait - e.t, wait); e.t = 0; if (K.size > e.kind.size) e.kind = K; }
    else { e = this.edges.find((x) => !x.on) || this.edges.reduce((a, b) => (a.wait - a.t < b.wait - b.t ? a : b)); e.local.copy(local); e.t = 0; e.wait = Math.max(0.1, wait); e.kind = K; }
    e.on = true; e.r.material.color.setHex(e.kind.ring); e.o.visible = e.kind.outer; e.o.material.color.setHex(e.kind.ring);
    return { stop: () => { e.on = false; e.g.visible = false; } };
  }
  /** A mine's burst at `at` (the rail's frame); `up` the normal of the plane its ring flies in (the frame's y; x in the side view). */
  burst(at, up) {
    const b = this.bursts.find((x) => x.t >= BURST.time) || this.bursts[0];
    b.local.copy(at); b.up.set(up?.[0] ?? 0, up?.[1] ?? 1, up?.[2] ?? 0); b.t = 0;
  }
  clear() { this.arrows && (this.arrows.count = 0); for (const e of this.edges) { e.on = false; e.g.visible = false; } for (const b of this.bursts) { b.t = Infinity; b.flash.visible = b.ring.visible = false; } }

  /** Once a frame, after the camera is placed. */
  update(raw) {
    const R = this.st.rail, cam = this.game.camera; if (!R || !cam) return;
    const ship = this.st.ship?.look?.group;
    for (const e of this.edges) {
      if (!e.on) { e.g.visible = false; continue; }
      e.t += raw; if (e.t >= e.wait) { e.on = false; e.g.visible = false; continue; }
      R.toWorld(e.local, _w);
      // kept inside the frame, clear of the log and the Lachrimeter along the bottom (v247's look: the chase's was half off the right edge, the overhead's on the log)
      _s.copy(_w).project(cam); _s.x = Math.max(-EDGE.inX, Math.min(EDGE.inX, _s.x)); _s.y = Math.max(EDGE.inY[0], Math.min(EDGE.inY[1], _s.y)); _w.copy(_s).unproject(cam);
      e.g.visible = true; e.g.position.copy(_w); e.g.quaternion.copy(cam.quaternion);
      // pointing in: toward the ship as the camera sees it (any view: the chevrons turn in the screen's plane)
      let ang = 0;
      if (ship) { _s.copy(_w).project(cam); _t.setFromMatrixPosition(ship.matrixWorld).project(cam); ang = Math.atan2(_t.y - _s.y, (_t.x - _s.x) * (cam.aspect || 1)); }
      e.c.rotation.z = ang;
      const k = e.t / e.wait, beat = (e.t % EDGE.beat) / EDGE.beat, throb = 1 + 0.18 * Math.exp(-beat * 6);
      const dist = _w.distanceTo(cam.position), sc = EDGE.size * e.kind.size * Math.max(0.6, dist * 0.06) * throb;
      e.g.scale.setScalar(sc);
      // the ring's fill runs out as the wait does (osu!'s approach circle); the last beat warms to an ember
      const left = 1 - k;
      e.f.material.color.setHex(left < EDGE.beat / e.wait ? EDGE.ember : EDGE.gold); // (the last beat warms to an ember)
      e.f.geometry.setDrawRange(0, Math.round(left * 40) * 6); // (the ring's fill runs out as the wait does: osu!'s approach circle)
      e.c.material.opacity = EDGE.chevAlpha * (0.65 + 0.35 * Math.exp(-beat * 5));
    }
    this.offFrame(cam, ship);
    for (const b of this.bursts) {
      const on = b.t < BURST.time; b.flash.visible = b.ring.visible = on; if (!on) continue;
      b.t += raw; const k = Math.min(1, b.t / BURST.time), e = 1 - (1 - k) ** 3;
      R.toWorld(b.local, _w); R.dirWorld(b.up, _d).normalize();
      b.ring.position.copy(_w); _q.setFromUnitVectors(_z, _d); b.ring.quaternion.copy(_q); b.ring.scale.setScalar(Math.max(0.01, BURST.reach * e));
      b.ring.material.opacity = (1 - k) ** 1.5;
      b.flash.position.copy(_w); b.flash.quaternion.copy(cam.quaternion); b.flash.scale.setScalar(BURST.flash * (0.6 + 0.8 * Math.min(1, k * 4)));
      b.flash.material.opacity = Math.max(0, 1 - k * 2.4);
    }
  }

  /** The off-frame arrows: every foe in play and every shot closing on the ship from outside the view, gathered by the edge's sector. */
  offFrame(cam, ship) {
    const st = this.st, R = st.rail, A = this.arrows; if (!A) return;
    for (const q of this.sector) { q.foe = 0; q.shot = 0; }
    let sx = 0, sy = 0; if (ship) { _t.setFromMatrixPosition(ship.matrixWorld).project(cam); sx = _t.x; sy = _t.y; }
    const shipL = st.ship?.local;
    const add = (local, what, w) => {
      R.toWorld(local, _w); _s.copy(_w).applyMatrix4(cam.matrixWorldInverse); const behind = _s.z > 0;
      _s.copy(_w).project(cam); if (behind) { _s.x = -_s.x; _s.y = -_s.y; }
      if (!behind && Math.abs(_s.x) <= 1 && Math.abs(_s.y) <= 1) return; // (in view: it is its own mark)
      const ang = Math.atan2((_s.y - sy), (_s.x - sx) * (cam.aspect || 1));
      const q = this.sector[((Math.round(ang / (2 * Math.PI) * ARROW.sectors) % ARROW.sectors) + ARROW.sectors) % ARROW.sectors];
      if (w > q[what]) { q[what] = w; q[what === 'foe' ? 'fx' : 'sx'] = Math.cos(ang); q[what === 'foe' ? 'fy' : 'sy'] = Math.sin(ang); }
    };
    for (const f of st.waves?.foes || []) {
      if (!f.alive || f.solid === false || !f.local || !shipL) continue;
      const d = f.local.distanceTo(shipL); if (d < ARROW.reach.foe) add(f.local, 'foe', 1 - d / ARROW.reach.foe);
    }
    const shots = st.trip?.field?.shots;
    if (shots && shipL) for (const x of shots) {
      if (!x.on || x.back) continue;
      _d.copy(shipL).sub(x.p); const d = _d.length(); if (d > ARROW.reach.shot || d < 0.5) continue;
      if (_d.dot(x.dir) / d < ARROW.approach) continue; // (only one coming at the ship)
      add(x.p, 'shot', 1 - d / ARROW.reach.shot);
    }
    let n = 0;
    for (const q of this.sector) for (const what of ['foe', 'shot']) {
      const w = q[what]; if (w <= 0 || n >= ARROW.sectors) continue;
      const cx = what === 'foe' ? q.fx : q.sx, cy = what === 'foe' ? q.fy : q.sy;
      // where the line from the ship's place on the screen meets the arrows' box
      const ax = cx / (cam.aspect || 1), ay = cy, tx = ax > 0 ? (ARROW.inX - sx) / ax : ax < 0 ? (-ARROW.inX - sx) / ax : Infinity, ty = ay > 0 ? (ARROW.inY[1] - sy) / ay : ay < 0 ? (ARROW.inY[0] - sy) / ay : Infinity;
      const tt = Math.max(0, Math.min(tx, ty)); _s.set(sx + ax * tt, sy + ay * tt, 0.5).unproject(cam).sub(cam.position).normalize().multiplyScalar(ARROW.at).add(cam.position);
      const sc = ARROW.size * (what === 'shot' ? 0.75 : 1) * (0.7 + 0.5 * w);
      _q.setFromAxisAngle(_z, Math.atan2(cy, cx)); _q.premultiply(cam.quaternion);
      _m.compose(_s, _q, _a.set(sc, sc, sc)); A.setMatrixAt(n, _m);
      A.setColorAt(n, _c.setHex(what === 'foe' ? ARROW.foe : ARROW.shot).multiplyScalar(0.45 + 0.55 * w)); n++;
    }
    A.count = n; A.instanceMatrix.needsUpdate = true; if (A.instanceColor) A.instanceColor.needsUpdate = true;
  }
}
