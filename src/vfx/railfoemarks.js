// ---------------------------------------------------------------------------------------
// THE CROSSING'S FOE MARKS: two of Petra's placeholders on the rail dressed (world/emocean/foemoves.js, foemechanics.js).
//   the ambush edge mark  where an ambusher will come in, held at the frame's edge for its wait (`mark` beats) while it is unseen: two gold
//                         chevrons pointing in toward the ship, a ring round them closing as the wait runs out (the fill is the when), a
//                         throb on each beat. A world mark: no words. Carried in the rail's frame, so it keeps its place in the view.
//   the mine burst        a mine going off (`rail.mine`, its `at` in the rail's frame): a hot flash, a shock ring in the plane its ring of
//                         shots flies in, opening to the burst's reach in 0.45 real s. Its body breaking up is railfoes.js's 'burst' death.
// Both in the rail's plain additive look (MeshBasicMaterial, additive), kept true under the storm's veil: they are the danger.
//
// Prior art: the off-screen threat arrow of Ikaruga and Sin and Punishment (an arrow at the frame edge where a foe will enter) and the
// closing ring of osu!'s approach circle as its timer; the mine's ring the shockwave decal of R-Type's space mines and Star Fox's bombs.
//
//   const M = new RailFoeMarks(game, stage)   M.build(scene)   M.parked() -> [objects]   M.update(raw)   M.clear()
//   game.ambushMark.show(local, wait) -> handle { stop() }   (local: a Vector3 in the rail's frame; wait: real seconds)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { keepTrue } from './stormwarp.js';
import { BAR_S } from '../progress/rail/crossing.js';

const EDGE = { size: 1.2, inX: 0.84, inY: [-0.5, 0.8], gold: 0xffd36a, ember: 0xff8a3a, ringAlpha: 0.9, chevAlpha: 1, beat: BAR_S / 4, n: 4 };
const BURST = { time: 0.45, reach: 7, flash: 2.6, hot: 0xfff0c0, ring: 0xffb070, n: 6 };
const _w = new THREE.Vector3(), _s = new THREE.Vector3(), _t = new THREE.Vector3(), _d = new THREE.Vector3(), _q = new THREE.Quaternion(), _z = new THREE.Vector3(0, 0, 1);

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

export class RailFoeMarks {
  constructor(game, stage) {
    this.game = game; this.st = stage; this.edges = []; this.bursts = [];
    game.ambushMark = { show: (local, wait) => this.show(local, wait) };
    game.events?.on?.('rail.mine', (e) => { if (e?.at) this.burst(e.at, e.up); });
  }
  build(scene) {
    const chev = chevronGeometry(), ring = new THREE.RingGeometry(0.62, 0.7, 40, 1);
    for (let i = 0; i < EDGE.n; i++) {
      const g = new THREE.Group(); g.visible = false; g.renderOrder = 56; g.frustumCulled = false; g.userData.zoneFree = true; scene.add(g);
      const c = new THREE.Mesh(chev, additive(EDGE.gold, EDGE.chevAlpha)), r = new THREE.Mesh(ring, additive(EDGE.gold, EDGE.ringAlpha * 0.35)), f = new THREE.Mesh(new THREE.RingGeometry(0.5, 0.56, 40, 1, Math.PI / 2, Math.PI * 2), additive(EDGE.gold, EDGE.ringAlpha));
      for (const m of [c, r, f]) { m.renderOrder = 56; m.frustumCulled = false; g.add(m); }
      this.edges.push({ g, c, r, f, local: new THREE.Vector3(), t: 0, wait: 0, on: false });
    }
    const flash = new THREE.CircleGeometry(1, 24), shock = new THREE.RingGeometry(0.86, 1, 48, 1);
    for (let i = 0; i < BURST.n; i++) this.bursts.push({ flash: put(scene, new THREE.Mesh(flash, additive(BURST.hot, 1)), 57), ring: put(scene, new THREE.Mesh(shock, additive(BURST.ring, 1)), 57), local: new THREE.Vector3(), up: new THREE.Vector3(0, 1, 0), t: Infinity });
  }
  parked() { return [...this.edges.map((e) => e.g), ...this.bursts.flatMap((b) => [b.flash, b.ring])]; }

  /** An ambusher's mark at the frame's edge (foemoves.js `overtake`), held `wait` real seconds. */
  show(local, wait) {
    const e = this.edges.find((x) => !x.on) || this.edges[0];
    e.local.copy(local); e.t = 0; e.wait = Math.max(0.1, wait); e.on = true;
    return { stop: () => { e.on = false; e.g.visible = false; } };
  }
  /** A mine's burst at `at` (the rail's frame); `up` the normal of the plane its ring flies in (the frame's y; x in the side view). */
  burst(at, up) {
    const b = this.bursts.find((x) => x.t >= BURST.time) || this.bursts[0];
    b.local.copy(at); b.up.set(up?.[0] ?? 0, up?.[1] ?? 1, up?.[2] ?? 0); b.t = 0;
  }
  clear() { for (const e of this.edges) { e.on = false; e.g.visible = false; } for (const b of this.bursts) { b.t = Infinity; b.flash.visible = b.ring.visible = false; } }

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
      const dist = _w.distanceTo(cam.position), sc = EDGE.size * Math.max(0.6, dist * 0.06) * throb;
      e.g.scale.setScalar(sc);
      // the ring's fill runs out as the wait does (osu!'s approach circle); the last beat warms to an ember
      const left = 1 - k;
      e.f.material.color.setHex(left < EDGE.beat / e.wait ? EDGE.ember : EDGE.gold); // (the last beat warms to an ember)
      e.f.geometry.setDrawRange(0, Math.round(left * 40) * 6); // (the ring's fill runs out as the wait does: osu!'s approach circle)
      e.c.material.opacity = EDGE.chevAlpha * (0.65 + 0.35 * Math.exp(-beat * 5));
    }
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
}
