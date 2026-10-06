// ---------------------------------------------------------------------------------------
// THE FLYTHROUGH: a floor of the Great Dunemaw previewed on arrival (docs/plans/DUNEMAW.md; the owner, 2026-10-06: "use the frame
// accumulation shader more… like a sweeping pan or camera flythrough previewing the Dunemaw"). The camera starts over the way down
// and races back along the floor's path through its doorways, at door height, smeared by the frame accumulation (the PS2's feedback
// blur, render/glow.js post.accum), and lands behind the Courier's shoulder, where the player's camera takes over. It shows where the
// floor leads before the walk begins. Any key or button skips it.
//
// Prior art: the level flyover before a stage (Super Monkey Ball's and Burnout's track previews, the "course preview" of a racing game:
// the route shown once, fast, ending where the player starts), and the PS2's motion-blur trails on a fast camera (Burnout, MGS2's
// speed smears).
//
//   game.flythrough = new Flythrough(game)   (plays itself on well.floor)   .play(points, { end, look })   .stop()   .update(rawDt)   .active
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

const SIDES = { n: [0, -1], s: [0, 1], w: [-1, 0], e: [1, 0] };
const EYE = 3.0; // (metres above the floor: under the 4 m doors)
const _p = new THREE.Vector3(), _l = new THREE.Vector3();

/** The floor's path from the way in to the way down: Petra's `layout.path` when the floor carries it, else found through the doors. */
export function floorPath(cur) {
  if (cur?.path?.length) return cur.path;
  const cells = cur?.cells || [];
  const at = new Map(cells.map((c) => [`${c.c},${c.r}`, c]));
  const start = cells.find((c) => c.role === 'start'), exit = cells.find((c) => c.role === 'exit') || start;
  if (!start) return [];
  const prev = new Map([[start, null]]), q = [start];
  while (q.length) { // (breadth first through the doors)
    const c = q.shift(); if (c === exit) break;
    for (const d of c.doors || []) { const n = at.get(`${c.c + SIDES[d][0]},${c.r + SIDES[d][1]}`); if (n && !prev.has(n)) { prev.set(n, c); q.push(n); } }
  }
  const path = []; for (let c = exit; c; c = prev.get(c)) path.unshift(c);
  return path;
}

export class Flythrough {
  constructor(game) {
    this.game = game; this.run = null;
    game.events?.on?.('well.floor', () => setTimeout(() => this.floor(), 0)); // (after the floor is built and the Courier stands on it)
    this.skip = () => { if (this.run && this.run.t > 0.25) this.stop(); };
    addEventListener('keydown', this.skip); addEventListener('mousedown', this.skip);
  }

  get active() { return !!this.run; }

  /** The floor the Courier has just arrived on, flown backward from its way down to their shoulder. */
  floor() {
    const W = this.game.well, cur = W?.cur, P = this.game.player?.pos;
    if (!cur || !P || this.game.cine?.active) return;
    const Y = cur.arrive?.pos?.y ?? P.y;
    const path = floorPath(cur);
    if (path.length < 2) return;
    const pts = [];
    const down = cur.down?.pos; if (down) pts.push(new THREE.Vector3(down.x, Y + EYE + 1.5, down.z));
    for (let i = path.length - 1; i >= 1; i--) pts.push(new THREE.Vector3(path[i].x, Y + EYE, path[i].z)); // (the start's own cell is left out: the Courier stands in it)
    const yaw = this.game.player.yaw ?? cur.arrive?.yaw ?? 0, fwd = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw)), right = new THREE.Vector3(-fwd.z, 0, fwd.x);
    // (the next cell is in front of them, through the door they face: the camera comes up and over their shoulder, never through them,
    // and settles behind it, looking where they look, as the player's camera does: player.forward, 3 m back)
    pts.push(P.clone().addScaledVector(fwd, -0.4).addScaledVector(right, -2.2).setY(P.y + 3.0)); // (beside them and above: the camera curls round, never across their face)
    pts.push(P.clone().addScaledVector(fwd, -3.0).addScaledVector(right, -0.6).setY(P.y + 1.7));
    this.play(pts, { look: P.clone().addScaledVector(fwd, 6).setY(P.y + 1.3) });
  }

  /** Fly a camera along `points` (world), its look running ahead along them, ending on `look`. Length by distance: 3 to 5.5 real seconds. */
  play(points, { look } = {}) {
    if (points.length < 2) return;
    this.stop();
    const curve = new THREE.CatmullRomCurve3(points, false, 'centripetal');
    const len = curve.getLength(), dur = THREE.MathUtils.clamp(1.8 + len / 30, 3, 5.5);
    this.run = { curve, dur, t: 0, look: look?.clone() || points[points.length - 1].clone(), id: 'flythrough' };
    const A = this.game.post?.accum; if (A && !this.game.death?.active) Object.assign(A, { amt: 0.55, zoom: 0.006, spin: 0.0015 });
  }

  stop() {
    if (!this.run) return;
    this.game.cinema?.unshot(this.run.id);
    const A = this.game.post?.accum; if (A && !this.game.death?.active) A.amt = 0;
    this.run = null;
  }

  update(raw) {
    const R = this.run; if (!R) return;
    R.t += raw;
    const x = Math.min(1, R.t / R.dur), u = x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2; // (in and out: it starts, races, and settles)
    R.curve.getPointAt(u, _p);
    R.curve.getPointAt(Math.min(1, u + 0.06), _l);
    if (u > 0.85) _l.lerp(R.look, (u - 0.85) / 0.15); // (the last stretch turns to the Courier)
    _l.y -= 0.6; // (a little down: the floor and the doorways ahead, not the ceiling)
    this.game.cinema?.shot(R.id, { pos: _p, look: _l, fov: 0, roll: 0, bars: 0, ease: 30 }); // (shot copies them)
    const A = this.game.post?.accum; if (A && !this.game.death?.active) A.amt = 0.55 * (1 - Math.max(0, (x - 0.8) / 0.2)); // (the smear lets go as it lands)
    if (x >= 1) this.stop();
  }

  dispose() { this.stop(); removeEventListener('keydown', this.skip); removeEventListener('mousedown', this.skip); }
}
