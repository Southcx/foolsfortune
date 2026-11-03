// ---------------------------------------------------------------------------------------
// STRAWMAN'S GUIDE AND RIVAL (docs/plans/STRAWMANS-WELL.md 1, "Strawman as the muse"; GAPS G253): a ghost of Strawman made of straw
// that runs a stage as you enter it, and, in the Pit, the rival that races your own best line.
//   the guide   on entering a stage (not the wings) a ghost of straw runs the stage's authored route (its checkpoints, then its goal: the
//               builder's own numbers) at GUIDE.speed, hopping between them, the demonstration the mimicry puzzles give (MIMICRY.md); it
//               stands at the goal when it is there. Nothing it does is yours to follow: it opens no door and bears no weight
//   the rival   the Courier's quickest clean run of a stage this session (their x and y a tenth of a real second, kept on `well.stage.clear`),
//               run again beside them as a ghost: in the Pit (the gauntlet) it replaces the guide once there is one. A clear that comes
//               before the rival's end beats it (`well.guide { beat: true }`, the verb 'rival'); a clear after it, no
// A run is kept in memory only (a session's), never the save: the ghost is a convenience. The ghost's look is a placeholder (a Strawman
// model scaled to the Courier's height, its materials thinned to GUIDE.alpha): named wellGuideGhost for Calissa.
//
// Prior art: the mimicry puzzles' demonstration (world/mimicry/), Celeste's and Mario Kart's ghosts, Super Meat Boy's replay, the
// Raceway's ghost (world/raceway/).
//
//   const G = new StrawGuide(well)   G.start(stageId)   G.stop()   G.update(dt)   G.clear()   G.best   events: well.guide { stage, kind, beat?, by }
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { StrawmanModel } from '../../vfx/strawman.js';
import { GUIDE } from '../../progress/strawmanwell.js';
import { AT, laneOf } from './layout.js';

const STEP = 0.1, SCALE = 0.7;

/** The ghost's model: Strawman, thinned. */
function ghostBody(into) {
  const m = new StrawmanModel(); m.group.name = 'wellGuideGhost'; m.group.scale.setScalar(SCALE);
  m.group.traverse((o) => { if (o.material) { o.material = [].concat(o.material).map((q) => { const c = q.clone(); c.transparent = true; c.opacity = GUIDE.alpha; c.depthWrite = false; return c; }); if (o.material.length === 1) o.material = o.material[0]; } });
  into.add(m.group); return m;
}

export class StrawGuide {
  constructor(well) { this.well = well; this.game = well.game; this.run = null; this.best = {}; this.rec = null; this.offs = []; }

  /** The authored route of a stage in world metres: its checkpoints, then its goal. */
  route(id) {
    const St = this.well.stages[id], L = laneOf(id); if (!St || !L) return null;
    const pts = [[L.start, 0], ...(St.checks || []), ...(St.goal ? [St.goal] : [])];
    return pts.length > 1 ? pts.map(([x, y]) => [AT.x + x, AT.y + y]) : null;
  }

  /** A stage entered: the rival if there is a line to race here (the Pit), else the guide. Recording begins. */
  start(id) {
    this.stop();
    const W = this.well, L = laneOf(id); if (!L) return;
    this.rec = { id, xy: [], t: 0, acc: 0 };
    const best = this.best[id], rival = id === 'pit' && best;
    let xy = null, kind = 'guide';
    if (rival) { xy = best.xy; kind = 'rival'; }
    else { const R = this.route(id); if (!R) return; xy = this.walk(R); }
    const body = ghostBody(W.kit.lane(L).group);
    this.run = { id, kind, xy, body, t: 0, z: L.z, done: false, cleared: false };
    this.game.events?.emit('well.guide', { stage: id, kind, by: 'environment' });
  }

  /** A route sampled as a run: x, y at a tenth of a real second, at GUIDE.speed, a hop between waypoints. */
  walk(R) {
    const xy = [];
    for (let i = 1; i < R.length; i++) {
      const [x0, y0] = R[i - 1], [x1, y1] = R[i], d = Math.hypot(x1 - x0, y1 - y0), n = Math.max(1, Math.ceil(d / (GUIDE.speed * STEP)));
      for (let k = 0; k < n; k++) { const u = k / n; xy.push(x0 + (x1 - x0) * u, y0 + (y1 - y0) * u + Math.sin(u * Math.PI) * GUIDE.hop * Math.min(1, d / 6)); }
    }
    const last = R[R.length - 1]; xy.push(last[0], last[1]);
    return xy;
  }

  stop() {
    const r = this.run; this.run = null;
    if (r) { r.body.group.removeFromParent(); r.body.dispose?.(); r.body.group.traverse((o) => { for (const m of [].concat(o.material || [])) m.dispose?.(); }); }
    this.rec = null;
  }

  listen(on) {
    for (const off of this.offs) off(); this.offs = [];
    if (!on) return;
    this.offs.push(this.game.events.on('well.stage.clear', (e) => this.cleared(e)), this.game.events.on('well.pit.death', () => { if (this.rec) this.rec.dirty = true; }));
  }

  /** A clear: the rival beaten or not, and the run kept if it is the quickest. */
  cleared(e) {
    if (e.by !== 'courier') return;
    const R = this.run, rec = this.rec;
    if (R?.kind === 'rival' && R.id === e.stage) {
      const beat = !R.done;
      this.game.events?.emit('well.guide', { stage: e.stage, kind: 'rival', beat, by: 'courier' });
      if (beat) this.well.verb('rival');
    }
    const old = this.best[e.stage]; // (a run with a death in it is kept only until a clean one comes: a ghost that jumps back is no line)
    if (rec?.id === e.stage && rec.xy.length > 4 && (!old || (old.dirty && !rec.dirty) || (old.dirty === !!rec.dirty && e.t < old.t))) this.best[e.stage] = { t: e.t, xy: rec.xy.slice(), dirty: !!rec.dirty };
    if (R) R.cleared = true;
  }

  update(dt) {
    const W = this.well, P = this.game.player, id = W.stage?.id;
    if ((this.run && this.run.id !== id) || (this.rec && this.rec.id !== id)) this.stop();
    if (!this.rec || !W.stage || W.stage.cleared && !this.run) return;
    // recording the Courier (until the stage is cleared)
    const rec = this.rec;
    if (!W.stage.cleared && W.here) { rec.t += dt; rec.acc += dt; while (rec.acc >= STEP) { rec.acc -= STEP; rec.xy.push(+P.pos.x.toFixed(2), +P.pos.y.toFixed(2)); } }
    const r = this.run; if (!r) return;
    r.t += dt;
    const k = Math.min(r.xy.length / 2 - 1, Math.floor(r.t / STEP)), f = Math.min(1, r.t / STEP - k), k2 = Math.min(r.xy.length / 2 - 1, k + 1);
    const x = r.xy[2 * k] + (r.xy[2 * k2] - r.xy[2 * k]) * f, y = r.xy[2 * k + 1] + (r.xy[2 * k2 + 1] - r.xy[2 * k + 1]) * f;
    if (k >= r.xy.length / 2 - 1) r.done = true;
    const m = r.body, dx = r.xy[2 * k2] - r.xy[2 * k];
    m.group.position.set(x, y, r.z - 0.6); if (Math.abs(dx) > 1e-3) m.yawTo = dx > 0 ? Math.PI / 2 : -Math.PI / 2;
    m.update?.(dt);
  }

  clear() { this.stop(); this.listen(false); }
}
