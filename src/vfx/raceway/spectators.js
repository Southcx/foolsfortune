// ---------------------------------------------------------------------------------------
// THE RACEWAY'S SPECTATORS (plain name): clapperjars on the banks, in crowds beside each track's start and below its big jumps' landings
// (world/raceway/gaps.js GAPS: where the named jumps come down), two rows deep past the berm, facing the line. Each is the clay folk's
// lowest tier as the workshop knows them (creatures/clappers.js): a pot of a body, a lid that claps, two stubby arms; earthenware mostly,
// one in five glazed. At rest they shuffle and clap now and then, out of step. A crowd CHEERS when the Solar Skiff passes close (by how
// close and how fast), when a trick lands near it (skiff.trick, skiff.grab, skiff.gap, skiff.land.slope, a perfect pop, a banked trick
// combo), at a race's GO beside the start and at its finish: hopping, lids clapping quick, arms up and waving, easing back over a few
// real seconds. A look only: no collider, nothing counted, and no rival or race rule reads them.
// SEVEN DRAWS for every crowd in the park (bodies in four clays and glazes, the lids, the eyes, the arms): InstancedMeshes in a plain
// flat standard (the clay chips' program, vfx/particles.js), their matrices written only while the camera is within SEE metres of a
// crowd, from objects made once (no allocation a frame).
//
// Prior art: the stands of every racer (Mario Kart's Toads and Shy Guys on the banks, cheering harder as you pass; Wave Race 64's and
// F-Zero's crowds as instanced cut-outs), Tony Hawk's crowd reacting to a landed trick, the Tour de France's roadside fans leaning in;
// the house's own clapperjars (creatures/clappers.js: the lid's clap, the arm's wave) and the rivals' rider (vfx/racewayrivals.js).
//
//   const S = new RacewaySpectators(game, parent)   S.build(raceway)   S.update(dt, raceway)   S.cheerAt(pos, k, r)   S.prewarm() -> undo
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { GAPS } from '../../world/raceway/gaps.js';
import { sideOf } from '../../world/raceway/kit.js';
import { GLAZES } from '../../courier/vessel/glazes.js';

/** The numbers: a start's crowd from `start[0]` to `start[1]` metres along the line, spaced `every`, its rows `out` metres past the
 *  track's edge and `row` apart; a landing's crowd from the landing's start to `land` metres on; the jars' heights (m); the bodies'
 *  clays and glazes (one in `glazed` glazed); what makes them cheer (a pass within `pass` m, at `fast` m/s and more; a trick within
 *  `trick` m), the cheer's ease back (a real second), and how near the camera must be for them to move (m). */
export const CROWD = {
  start: [-36, 44], every: 2.4, out: 7.5, row: 1.7, rows: 2, land: [8, 56], landEvery: 2.6,
  h: [0.85, 1.1], clays: [0xc9744a, 0xd9906a], glazes: ['celadon', 'oxblood'], glazed: 5,
  pass: 26, fast: 18, trick: 90, ease: 0.32, see: 240, idle: 0.12,
};

const bare = (g) => { const n = g.index ? g.toNonIndexed() : g; for (const k of Object.keys(n.attributes)) if (k !== 'position' && k !== 'normal') n.deleteAttribute(k); return n; };
/** A clapperjar's pot of a body (a lathe, about 1 m tall at scale 1, its mouth at y 0.86). */
const bodyGeo = () => bare(new THREE.LatheGeometry([[0.0, 0], [0.24, 0.02], [0.33, 0.16], [0.36, 0.38], [0.33, 0.6], [0.25, 0.78], [0.22, 0.86], [0.0, 0.86]].map(([x, y]) => new THREE.Vector2(x, y)), 10));
/** Its lid, hinged at its back edge (the origin), lying forward over the mouth along +z; a knob on top. */
const lidGeo = () => mergeGeometries([bare(new THREE.CylinderGeometry(0.25, 0.25, 0.06, 10).translate(0, 0.03, 0.23)), bare(new THREE.SphereGeometry(0.06, 6, 4).translate(0, 0.09, 0.23))]);
/** Its two eyes, dark, on the front of the shoulder. */
const eyesGeo = () => mergeGeometries([-1, 1].map((s) => bare(new THREE.SphereGeometry(0.05, 6, 4).scale(1, 1.3, 0.6).translate(s * 0.11, 0.62, 0.32))));
/** An arm: a stub hanging from the shoulder (its origin), down -y, a round hand at its end. */
const armGeo = () => mergeGeometries([bare(new THREE.CylinderGeometry(0.06, 0.05, 0.3, 6).translate(0, -0.15, 0)), bare(new THREE.SphereGeometry(0.075, 6, 4).translate(0, -0.32, 0))]);

const std = (color, name) => new THREE.MeshStandardMaterial({ name, color, roughness: 0.8, metalness: 0, flatShading: true });
const _m = new THREE.Matrix4(), _m2 = new THREE.Matrix4(), _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _e = new THREE.Euler(), _s = new THREE.Vector3(), _p = new THREE.Vector3(), _o = new THREE.Vector3();
const X_AXIS = new THREE.Vector3(1, 0, 0), ONE = new THREE.Vector3(1, 1, 1), SIDES = [-1, 1], _ea = new THREE.Euler(0, 0, 0, 'YXZ');

export class RacewaySpectators {
  constructor(game, parent) {
    this.game = game; this.parent = parent; this.t = 0; this.built = false; this.crowds = []; this.jars = [];
    this.mats = [...CROWD.clays.map((c, i) => std(c, `raceway-spectator-clay${i}`)), ...CROWD.glazes.map((k) => std(GLAZES[k]?.color ?? 0x7fae9a, `raceway-spectator-${k}`))];
    this.lidMat = std(0x6a3a28, 'raceway-spectator-lid'); this.eyeMat = std(0x1c1210, 'raceway-spectator-eyes'); this.armMat = std(0xb8693e, 'raceway-spectator-arms');
    for (const m of this.mats) m.roughness = 0.7; this.mats[2].roughness = this.mats[3].roughness = 0.35; // (the glazes shine)
    const E = game.events, near = (k) => (e) => { const p = game.player?.pos; if (p) this.cheerAt(p, k, CROWD.trick); };
    E?.on('skiff.trick', near(0.8)); E?.on('skiff.grab', near(0.7)); E?.on('skiff.gap', near(1)); E?.on('skiff.land.slope', near(0.6));
    E?.on('skiff.pop', (e) => { if (e?.perfect) near(0.7)(); }); E?.on('skiff.combo.bank', near(0.9)); E?.on('skiff.grind.trick', near(0.6));
    E?.on('race.go', () => this.cheerStarts(1)); E?.on('race.finish', () => this.cheerStarts(1));
  }

  /** The crowds laid from the tracks' data (the starts, the landings), once. */
  build(R) {
    if (this.built || !R?.tracks?.length) return; this.built = true;
    let sd = 7331; const rnd = () => ((sd = (sd * 16807) % 2147483647) / 2147483647);
    const others = (T, p) => R.tracks.some((T2) => { if (T2 === T) return false; const n = T2.nearest(p.x - R.center.x, p.z - R.center.z); return n && n.d < T2.frame(n.s).w + 6; });
    const crowd = (T, s0, s1, every, sides, start) => {
      const C = { members: [], x: 0, z: 0, n: 0, cheer: 0, start, track: T.id };
      for (let s = s0; s <= s1; s += every) for (const sd2 of sides) for (let r = 0; r < CROWD.rows; r++) {
        const ss = s + (r % 2) * every * 0.5 + (rnd() - 0.5) * 0.6, F = T.frame(((ss % T.length) + T.length) % T.length), lat = sd2 * (F.w + CROWD.out + r * CROWD.row + rnd() * 0.5);
        const p = sideOf(R, T, ((ss % T.length) + T.length) % T.length, lat);
        if (others(T, p) || Math.abs(R.heightAt(p.x + 1.5, p.z) - p.y) > 1.6) continue; // (none on another road, none on a cliff)
        const j = { x: p.x, y: p.y, z: p.z, yaw: 0, h: CROWD.h[0] + rnd() * (CROWD.h[1] - CROWD.h[0]), ph: rnd() * 20, rate: 0.7 + rnd() * 0.6, mat: rnd() < 1 / CROWD.glazed ? 2 + (rnd() < 0.5 ? 0 : 1) : rnd() < 0.5 ? 0 : 1, crowd: C };
        // (facing the line: from its place back across to the track's middle)
        const mx = F.x + R.center.x, mz = F.z + R.center.z; j.yaw = Math.atan2(mx - p.x, mz - p.z) + (rnd() - 0.5) * 0.5;
        C.members.push(j); C.x += p.x; C.z += p.z; C.n++;
      }
      if (C.n) { C.x /= C.n; C.z /= C.n; C.r = Math.max(...C.members.map((j) => Math.hypot(j.x - C.x, j.z - C.z))); this.crowds.push(C); this.jars.push(...C.members); }
    };
    for (const T of R.tracks) crowd(T, T.line + CROWD.start[0], T.line + CROWD.start[1], CROWD.every, [-1, 1], true);
    for (const G of GAPS) { const T = R.tracks.find((t) => t.id === G.track); if (!T) continue; const s = T.sOf(G.on[0], G.on[1]); crowd(T, s + CROWD.land[0], s + Math.min(G.on[2] - G.on[1], CROWD.land[1]), CROWD.landEvery, [G.id.length % 2 ? 1 : -1], false); }
    const n = this.jars.length, byMat = this.mats.map(() => []);
    this.jars.forEach((j, i) => { j.idx = i; byMat[j.mat].push(j); });
    this.bodies = this.mats.map((m, i) => { const im = new THREE.InstancedMesh(bodyGeo(), m, Math.max(1, byMat[i].length)); im.count = byMat[i].length; byMat[i].forEach((j, k) => { j.bi = i; j.bk = k; }); return im; });
    this.lids = new THREE.InstancedMesh(lidGeo(), this.lidMat, n); this.eyes = new THREE.InstancedMesh(eyesGeo(), this.eyeMat, n); this.arms = new THREE.InstancedMesh(armGeo(), this.armMat, n * 2);
    this.all = [...this.bodies, this.lids, this.eyes, this.arms];
    for (const m of this.all) { m.name = 'raceway-spectators'; m.frustumCulled = false; m.castShadow = false; m.receiveShadow = false; m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); this.parent.add(m); }
    this.pose(0, true);
  }

  /** The laid crowds taken down (stage 2's teardown): their meshes out and their geometry let go; the listeners and materials kept, laid again on the next frame the Raceway is active. */
  clear() {
    for (const m of this.all || []) { m.parent?.remove(m); m.geometry.dispose(); m.dispose(); }
    this.all = this.bodies = this.lids = this.eyes = this.arms = null; this.crowds = []; this.jars = []; this.built = false;
  }

  /** The crowds near `pos` cheer up to `k` (0..1), within `r` metres. */
  cheerAt(pos, k, r) { for (const C of this.crowds) { const d = Math.hypot(pos.x - C.x, pos.z - C.z) - C.r; if (d < r) C.cheer = Math.max(C.cheer, k * (1 - Math.max(0, d) / r * 0.5)); } }
  cheerStarts(k) { const p = this.game.player?.pos; for (const C of this.crowds) if (C.start && (!p || Math.hypot(p.x - C.x, p.z - C.z) < 400)) C.cheer = Math.max(C.cheer, k); }

  prewarm() { return () => {}; }

  update(dt, R) {
    if (!this.built) this.build(R); if (!this.built) return;
    this.t += dt;
    const cam = this.game.camera.position, P = this.game.player, S = this.game.techs?.active?.id === 'skiff' ? this.game.techs.active : null;
    const v = S?.v ? Math.hypot(S.v.x, S.v.z) : 0;
    let near = false;
    for (const C of this.crowds) {
      C.cheer = Math.max(0, C.cheer - dt * CROWD.ease);
      if (P && v > 4) { const d = Math.hypot(P.pos.x - C.x, P.pos.z - C.z) - C.r; if (d < CROWD.pass) C.cheer = Math.max(C.cheer, (1 - Math.max(0, d) / CROWD.pass) * Math.min(1, 0.35 + v / CROWD.fast)); }
      C.seen = Math.hypot(cam.x - C.x, cam.z - C.z) - C.r < CROWD.see; near ||= C.seen;
    }
    if (near) this.pose(dt, false);
  }

  /** Every jar of a seen crowd posed: the hop, the squash, the lid's clap, the arms' clap or wave. */
  pose(dt, all) {
    const t = this.t;
    for (const j of this.jars) {
      if (!all && !j.crowd.seen) continue;
      const c = Math.max(CROWD.idle, j.crowd.cheer), w = (2.2 + 5.5 * c) * j.rate, ph = t * w + j.ph, i = j.idx;
      const idleClap = c <= CROWD.idle + 0.02 ? Math.max(0, Math.sin(t * 0.37 + j.ph * 3)) ** 6 : 1; // (at rest a clap now and then, out of step)
      const hop = c > 0.35 ? Math.abs(Math.sin(ph * 0.5)) * 0.22 * (c - 0.3) : 0, sq = 1 - 0.06 * Math.abs(Math.sin(ph)) * idleClap;
      _e.set(0, j.yaw + Math.sin(t * 0.3 + j.ph) * 0.15, Math.sin(ph * 0.5) * 0.06 * c); _q.setFromEuler(_e);
      _m.compose(_p.set(j.x, j.y + hop - 0.04, j.z), _q, _s.set(j.h, j.h * sq, j.h));
      this.bodies[j.bi].setMatrixAt(j.bk, _m); this.eyes.setMatrixAt(i, _m);
      // the lid: hinged at the mouth's back edge, clapping open
      const open = (0.15 + 0.55 * c) * Math.max(0, Math.sin(ph)) * idleClap;
      _m2.compose(_o.set(0, 0.86, -0.23), _q2.setFromAxisAngle(X_AXIS, -open), ONE); _m2.premultiply(_m);
      this.lids.setMatrixAt(i, _m2);
      // the arms: forward and clapping in front at rest and in a mild cheer, up and waving in a big one
      const up = THREE.MathUtils.smoothstep(c, 0.5, 0.85), clap = Math.abs(Math.sin(ph)) * idleClap;
      for (const sd of SIDES) {
        const raise = up * (2.6 + 0.35 * Math.sin(ph * 1.3 + sd)) + (1 - up) * (0.5 + 0.6 * idleClap);
        const inward = (1 - up) * (0.25 + 0.6 * clap), spread = up * (0.45 + 0.2 * Math.sin(ph + sd));
        _ea.set(-raise, -sd * inward, sd * spread); _q2.setFromEuler(_ea);
        _m2.compose(_o.set(sd * 0.33, 0.56, 0.04), _q2, ONE); _m2.premultiply(_m);
        this.arms.setMatrixAt(i * 2 + (sd > 0 ? 1 : 0), _m2);
      }
    }
    for (const m of this.all) m.instanceMatrix.needsUpdate = true;
  }
}
