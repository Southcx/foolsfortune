// ---------------------------------------------------------------------------------------
// STRAWMAN'S WELL, THE PIT'S KIT (docs/plans/STRAWMANS-WELL.md 3.12): what kills in a precision stage and what comes after, the Pit's and
// lent to the Flip (VVVVVV's spikes and its retry). Pins as spikes, a pinking wheel as a saw (Pip's sewing kit at giant scale: Calissa
// dresses them), a death and its retry, and the run's ghosts. Placeholder looks.
//   spikes      a row of pins standing up off a floor or down off a ceiling, one InstancedMesh for a stage; each row's rectangle is what
//               kills (a body overlapping it, shrunk a little: the near miss is fair)
//   a saw       a spinning wheel on a path (a function of real time), a circle that kills
//   the retry   a death said (`well.pit.death` { stage, cause, by }), the Courier hidden and held where they fell for PIT.retry real s
//               (Super Meat Boy's 0.4), then the stage puts them back (its own `respawn`)
//   the ghosts  every attempt's path kept, a sample a fixed step (x, y), up to PIT.ghosts; played back all at once, each a pale body,
//               each bursting where it died (Super Meat Boy's replay)
//
// Prior art: Super Meat Boy (instant retry, the saws, every death replayed at the end), I Wanna Be the Guy (spikes everywhere, the death
// count), VVVVVV (spikes on floor and ceiling, a checkpoint a room).
//
//   const K = new SpikeBatch(color)   K.row(x0, x1, y, dir, z) -> rect (world)   K.build(S)   saw(S, r) -> { mesh, r, x, y }
//   hitsRect(P, rect, shrink)   hitsCircle(P, x, y, r)   bodyRect(P, out)   const D = new Retry(well, stage, respawn)   D.kill(cause)
//   D.post(dt)   D.dead   const G = new Ghosts(S, max)   G.begin()   G.sample(x, y)   G.end(died)   G.play()   G.update(dt)   G.dispose()
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { PIT } from '../../../progress/strawmanwell.js';
import { COLOR, DEPTH } from '../stagekit.js';

/** A pin's spacing and height (m), how much a body's box is shrunk before it is struck (m), and the ghosts' look and pace. */
export const PITKIT = { pin: 0.32, tall: 0.5, shrink: 0.08, width: 0.28, ghostAlpha: 0.32, ghostColor: 0xf0e2b0, ghostMax: 20, saw: 9 };

const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _p = new THREE.Vector3(), UP = new THREE.Vector3(0, 1, 0);

/** The Courier's body as a box in the plane (world): { x0, x1, y0, y1 }. */
export function bodyRect(P, out = {}) {
  out.x0 = P.pos.x - PITKIT.width; out.x1 = P.pos.x + PITKIT.width; out.y0 = P.pos.y; out.y1 = P.pos.y + P.height; return out;
}
const _b = {};
export function hitsRect(P, r, shrink = PITKIT.shrink) {
  const b = bodyRect(P, _b);
  return b.x1 > r.x0 + shrink && b.x0 < r.x1 - shrink && b.y1 > r.y0 + shrink && b.y0 < r.y1 - shrink;
}
export function hitsCircle(P, x, y, r) {
  const b = bodyRect(P, _b), cx = Math.max(b.x0, Math.min(x, b.x1)), cy = Math.max(b.y0, Math.min(y, b.y1));
  return (cx - x) ** 2 + (cy - y) ** 2 < (r - PITKIT.shrink) ** 2;
}

/** Pins, many rows to one draw. */
export class SpikeBatch {
  constructor(color = COLOR.pin) { this.color = color; this.pins = []; this.rects = []; }
  /** A row from x0 to x1 standing on y (dir +1: up off a floor; -1: down off a ceiling), at depth z. Returns the rectangle that kills. */
  row(x0, x1, y, dir = 1, z = 0) {
    const n = Math.max(1, Math.round((x1 - x0) / PITKIT.pin));
    for (let i = 0; i < n; i++) for (const dz of [-0.7, 0, 0.7]) this.pins.push([x0 + (i + 0.5) * (x1 - x0) / n, y, z + dz, dir]);
    const r = { x0, x1, y0: dir > 0 ? y : y - PITKIT.tall, y1: dir > 0 ? y + PITKIT.tall : y };
    this.rects.push(r); return r;
  }
  build(S) {
    if (!this.pins.length) return null;
    const geo = new THREE.ConeGeometry(PITKIT.pin * 0.42, PITKIT.tall, 6); geo.translate(0, PITKIT.tall / 2, 0);
    const mat = new THREE.MeshStandardMaterial({ color: this.color, metalness: 0.5, roughness: 0.35, flatShading: true });
    const M = new THREE.InstancedMesh(geo, mat, this.pins.length);
    this.pins.forEach(([x, y, z, dir], i) => {
      _q.setFromAxisAngle(_s.set(1, 0, 0), dir > 0 ? 0 : Math.PI);
      M.setMatrixAt(i, _m.compose(_p.set(x, y, z), _q, _s.set(1, 1, 1)));
    });
    M.instanceMatrix.needsUpdate = true; M.computeBoundingSphere(); M.castShadow = true;
    S.add(M); this.mesh = M; return M;
  }
}

/** A saw: a pinking wheel of radius r facing the audience; the stage moves it (`x`, `y`, world) and it turns itself. */
export function saw(S, r, z) {
  const g = new THREE.Group();
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.1, 18), new THREE.MeshStandardMaterial({ color: COLOR.pin, metalness: 0.6, roughness: 0.3, flatShading: true }));
  disc.rotation.x = Math.PI / 2; g.add(disc);
  const teeth = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.12, r * 1.12, 0.05, 9), new THREE.MeshStandardMaterial({ color: COLOR.mark, flatShading: true }));
  teeth.rotation.x = Math.PI / 2; g.add(teeth);
  g.position.z = z + DEPTH / 2 - 0.4; S.add(g);
  return { mesh: g, r, x: 0, y: 0, place(x, y, dt) { this.x = x; this.y = y; g.position.x = x; g.position.y = y; g.rotation.z -= PITKIT.saw * dt; } };
}

/** A death and its retry: said once, the Courier hidden and held, then handed back to the stage's `respawn` after PIT.retry real s. */
export class Retry {
  constructor(well, stage, respawn) { this.well = well; this.stage = stage; this.respawn = respawn; this.t = 0; this.at = new THREE.Vector3(); this.count = 0; }
  get dead() { return this.t > 0; }
  kill(cause) {
    if (this.t > 0) return false;
    const g = this.well.game, P = g.player;
    this.t = PIT.retry; this.count++; this.at.copy(P.pos); this.froze = P.freeze; P.freeze = true; P.vel.set(0, 0, 0); P.endCore?.(); // (a mantle cut short: it would carry them back after the retry)
    g.fx?.impact?.(new THREE.Vector3(P.pos.x, P.pos.y + 0.9, P.pos.z), UP, { sparks: 14, dust: 10 });
    g.character?.setHidden(true);
    g.events?.emit('well.pit.death', { stage: this.stage, cause, by: 'courier' });
    return true;
  }
  /** After each fixed step: held where they fell, then put back. */
  post(dt) {
    if (this.t <= 0) return;
    const P = this.well.game.player;
    P.moveTo(this.at, P.vel.set(0, 0, 0));
    if ((this.t -= dt) > 0) return;
    this.t = 0; P.freeze = !!this.froze;
    this.well.game.character?.setHidden(false);
    this.respawn();
    this.well.verb('retry');
  }
  /** Let go at once (the stage left mid-death). */
  cancel() { if (this.t <= 0) return; this.t = 0; this.well.game.player.freeze = !!this.froze; this.well.game.character?.setHidden(false); }
}

/** The run's ghosts: each attempt's path, played back all at once. */
export class Ghosts {
  constructor(S, max = PIT.ghosts) {
    this.S = S; this.max = max; this.runs = []; this.cur = null; this.playing = false; this.t = 0; this.step = 1 / 60;
    const geo = new THREE.CapsuleGeometry(0.32, 1.1, 4, 8); geo.translate(0, 0.87, 0);
    this.mesh = new THREE.InstancedMesh(geo, new THREE.MeshBasicMaterial({ color: PITKIT.ghostColor, transparent: true, opacity: PITKIT.ghostAlpha, depthWrite: false }), max);
    this.mesh.count = 0; this.mesh.visible = false; this.mesh.frustumCulled = false; this.mesh.renderOrder = 3; S.add(this.mesh);
  }
  begin() { if (this.playing) return; this.cur = { xy: [], died: false }; this.runs.push(this.cur); if (this.runs.length > this.max) this.runs.shift(); }
  sample(x, y, dt) { if (this.cur && !this.playing) { this.step = dt; this.cur.xy.push(x, y); } }
  end(died) { if (this.cur) this.cur.died = died; this.cur = null; }
  /** All of them at once, from each one's start. */
  play() {
    this.end(false); this.playing = true; this.t = 0; this.z = this.S.z;
    this.runs = this.runs.filter((r) => r.xy.length >= 4);
    this.mesh.count = this.runs.length; this.mesh.visible = this.runs.length > 0;
    this.long = Math.min(PITKIT.ghostMax, Math.max(0, ...this.runs.map((r) => r.xy.length / 2)) * this.step);
    return this.runs.length;
  }
  update(dt, fx) {
    if (!this.playing) return;
    this.t += dt;
    const k = Math.floor(this.t / this.step);
    this.runs.forEach((r, i) => {
      const n = r.xy.length / 2, j = Math.min(n - 1, k), gone = k >= n;
      if (gone && !r.burst) { r.burst = true; if (r.died) fx?.impact?.(_p.set(r.xy[2 * j], r.xy[2 * j + 1] + 0.9, this.z), UP, { sparks: 6, dust: 4 }); }
      this.mesh.setMatrixAt(i, _m.compose(_p.set(r.xy[2 * j], r.xy[2 * j + 1], this.z + 0.2), _q.identity(), _s.setScalar(gone ? 0 : 1)));
    });
    this.mesh.instanceMatrix.needsUpdate = true;
    if (this.t > this.long + 0.5) { this.playing = false; this.mesh.visible = false; this.runs = []; }
  }
  dispose() { this.runs = []; this.cur = null; this.playing = false; }
}
