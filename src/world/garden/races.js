// ---------------------------------------------------------------------------------------
// THE GARDEN'S RACES (docs/plans/SPIRIT-GARDEN.md section 7, item 17c; Dovina's RACE and raceSpeed in progress/realm.js): a track is a
// groove the hand carved in one stroke that closes on itself (its end within CLOSE metres of its start) and runs RACE.minLength metres
// or more; it is kept with the planetoid. Up to RACE.runners spirits on that planetoid run it, begun from a spirit's page: each runs a
// lap at raceSpeed for the stretch it is on (flat by mirth, a climb by desire, water by dread, the last third by grief, the inside line
// by wonder), held to the groove (their bodies carried, not stepped). The first home wins RACE.bond of bond; every finish is a record in
// the ledger. Races pay no cubes. The tracks are drawn as a faint line over the groove (a stand-in for Calissa's markers).
//
// Prior art: Sonic Adventure's Chao Race (stats as stretches of a track), and drawing a closed loop to make a course (Trackmania's
// editor, Line Rider).
//
//   const T = new Races(realm)   T.offer(stroke)   T.tracks [{ planet, pts: [dir], len }]   T.start(track, spirits)   T.fixed(dt)   T.running
//   T.dump() / T.load(d)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { RACE, raceSpeed } from '../../progress/realm.js';
import { spiritName } from './raising.js';

const CLOSE = 3, STEP = 1, LIFT = 0.12, LANE = 0.45, MOST = 4; // (metres to close a loop; metres between a track's points; metres over the groove; metres between lanes; tracks kept a planetoid)

export class Races {
  constructor(realm) {
    this.R = realm; this.tracks = []; this.running = null;
    this.lines = new THREE.Group(); this.lines.name = 'garden-tracks'; realm.site.group.add(this.lines);
    this.lineMat = new THREE.LineBasicMaterial({ name: 'garden-track', color: 0xfff2d8, transparent: true, opacity: 0.5 });
  }

  /** A carve stroke ended: its path (directions from the planetoid's heart) becomes a track if it closes on itself and is long enough. */
  offer(planet, path) {
    if (!path || path.length < 4) return null;
    const pts = [path[0].clone()]; let len = 0;
    for (const d of path) { const a = pts[pts.length - 1].angleTo(d) * planet.r; if (a >= STEP) { pts.push(d.clone()); len += a; } }
    const close = pts[pts.length - 1].angleTo(pts[0]) * planet.r;
    if (close > CLOSE || len + close < RACE.minLength) return null;
    len += close;
    const mine = this.tracks.filter((t) => t.planet === planet);
    if (mine.length >= MOST) this.drop(mine[0]);
    const T = { planet, pts, len };
    this.tracks.push(T); this.draw(T);
    this.R.game.events?.emit('garden.track', { planetoid: planet.id, metres: Math.round(len), by: 'courier' });
    return T;
  }
  drop(T) { this.tracks.splice(this.tracks.indexOf(T), 1); if (T.line) { this.lines.remove(T.line); T.line.geometry.dispose(); } }
  /** A track's points in the world, over the ground as it is now. */
  at(T, i, lane = 0, out = new THREE.Vector3()) {
    const P = T.planet, n = T.pts.length, d = T.pts[((i % n) + n) % n], next = T.pts[(((i + 1) % n) + n) % n];
    const side = next.clone().sub(d).cross(d).normalize();
    const dir = d.clone().addScaledVector(side, (lane * LANE) / P.r).normalize();
    return out.copy(P.c).addScaledVector(dir, P.radiusAt(dir) + LIFT);
  }
  draw(T) {
    const pts = []; for (let i = 0; i <= T.pts.length; i++) pts.push(this.at(T, i));
    T.line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), this.lineMat); T.line.name = 'garden-track'; this.lines.add(T.line);
  }
  /** The ground moved: every track's line laid over it again. */
  redraw(planet) { for (const T of this.tracks) if (!planet || T.planet === planet) { if (T.line) { this.lines.remove(T.line); T.line.geometry.dispose(); } this.draw(T); } }
  near(planet) { return this.tracks.filter((t) => t.planet === planet); }

  /** A race on a track: up to RACE.runners of the spirits on its planetoid. */
  start(T, spirits) {
    if (this.running || !T) return false;
    const runners = spirits.filter((s) => s.body.planet === T.planet).slice(0, RACE.runners);
    if (runners.length < 1) return false;
    runners.forEach((s, k) => { s.body.held = true; s.run = { s: 0, lane: k - (runners.length - 1) / 2, done: null }; });
    this.running = { T, runners, t: 0 };
    this.R.game.events?.emit('spirit.race.start', { runners: runners.map((s) => spiritName(s.e)), metres: Math.round(T.len), by: 'courier' });
    return true;
  }
  fixed(dt) {
    const X = this.running; if (!X) return;
    X.t += dt;
    const T = X.T, n = T.pts.length, W = this.R.waterworks.waters[T.planet.id];
    for (const s of X.runners) {
      const r = s.run; if (r.done != null) continue;
      const i = Math.floor((r.s / T.len) * n), here = this.at(T, i, r.lane), ahead = this.at(T, i + 1, r.lane);
      const wet = W && W.depthAt(T.pts[i % n]) > 0.15, climb = ahead.distanceTo(T.planet.c) - here.distanceTo(T.planet.c) > 0.05;
      r.s += raceSpeed(s.e.sp, wet ? 'water' : climb ? 'climb' : 'flat', r.s / T.len) * dt;
      if (r.s >= T.len) { r.done = X.t; continue; }
      const k = (r.s / T.len) * n - i; s.body.pos.lerpVectors(here, ahead, k); s.body.up.copy(s.body.pos).sub(T.planet.c).normalize(); s.body.vel.set(0, 0, 0);
    }
    if (X.runners.every((s) => s.run.done != null) || X.t > 300) this.finish();
  }
  finish() {
    const X = this.running; if (!X) return; this.running = null;
    const order = X.runners.filter((s) => s.run.done != null).sort((a, b) => a.run.done - b.run.done);
    const win = order[0], seconds = win ? +win.run.done.toFixed(1) : null;
    if (win) win.e.sp.bond = Math.min(100, (win.e.sp.bond || 0) + RACE.bond);
    for (const s of X.runners) { s.body.held = false; s.run = null; }
    this.R.game.events?.emit('spirit.race', { winner: win ? spiritName(win.e) : null, seconds, runners: X.runners.length, metres: Math.round(X.T.len), by: 'courier' });
    this.R.game.save?.dirty('realm'); this.R.game.save?.dirty('bound');
  }
  stop() { if (this.running) { for (const s of this.running.runners) { s.body.held = false; s.run = null; } this.running = null; } }

  dump() { return this.tracks.map((t) => [t.planet.id, ...t.pts.flatMap((d) => [+d.x.toFixed(4), +d.y.toFixed(4), +d.z.toFixed(4)])]); }
  load(d) {
    for (const T of [...this.tracks]) this.drop(T);
    for (const a of Array.isArray(d) ? d : []) {
      const P = this.R.site.by[a?.[0]]; if (!P) continue;
      const pts = []; for (let i = 1; i + 2 < a.length; i += 3) pts.push(new THREE.Vector3(a[i], a[i + 1], a[i + 2]).normalize());
      let len = 0; for (let i = 0; i < pts.length; i++) len += pts[i].angleTo(pts[(i + 1) % pts.length]) * P.r;
      if (pts.length > 3) { const T = { planet: P, pts, len }; this.tracks.push(T); this.draw(T); }
    }
  }
  /** A planetoid's tracks gone (the hand's reset). */
  clear(P) { for (const T of this.near(P)) this.drop(T); }
}
