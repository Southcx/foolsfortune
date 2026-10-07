// ---------------------------------------------------------------------------------------
// LAP CIRCUITS: a data-driven runner for timed courses through the gymnasium's pieces (docs/CIRCUITS.md).
// What a circuit is: an ordered list of STAGES, each a list of gates (a fork is a stage with more
// than one: any of them will do), crossed in order; a clock that starts when the first gate is
// crossed; splits against your best; a soft penalty (not a fail) for a gate crossed slower than it
// asks; a fall goes back to the last gate with a penalty and loses the "clean" mark; a medal
// from the par times at the end.
//
// Prior art, and what was taken: racing games' checkpoint runners (ordered gates, beacons, splits
// against a best lap, a delta on every gate; Trackmania's medals from author times and its
// "respawn at the last checkpoint" rule) and speedrun timers' split tables. The course itself
// is only data, so a new circuit is a list of zones and a par table, and the stress test can visit
// them all the same way.
//
//   circuits.enter(id)     teleport to the start and arm the run (the index calls this)
//   circuits.update(dt)    every frame
//   circuits.restart()     back to the start line (R)
//   circuits.leave()       forget the run (H, or leaving the course's bounds)
//
// A gate: { zone: [x0, x1, y0, y1, z0, z1] (world), label?, route?, minSpeed?, respawn?: [x, y, z] }
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { BASE_Y } from './basement.js';
import { sfx } from '../../audio/sfx.js';
import { BRAID_DEF, SPINDLE_DEF } from './circuitrooms.js';

const B = BASE_Y;
const STORE = 'foolsfortune.circuits.v1';
const zone = (x0, x1, y0, y1, z0, z1) => [x0, x1, B + y0, B + y1, z0, z1];

/** THE MILL RACE: the mill's own pieces in one loop (no new geometry). West to east across the cogs and the millstone, then the fork: the belts under the gates along the north wall, or the lifts, the gantry and the shuttle; the ferris wheel to its deck; back west and up the steam to the ledge, and drop to the start. */
export const MILL_RACE_DEF = {
  id: 'mill', name: 'THE MILL RACE', blurb: 'the mill in one loop: cogs, millstone, a fork, the ferris wheel, the steam',
  spawn: { at: [37.2, 0, -54], yaw: Math.PI / 2 },
  bounds: [34, 132, -74, -34], // (x0, x1, z0, z1: where the run is alive)
  resetY: -3.2, // below this inside the bounds is a fall (the chasm's floor)
  par: { gold: 62, silver: 80, bronze: 105 },
  stages: [
    [{ label: 'START', zone: zone(39, 41.5, -1, 3, -58, -50) }],
    [{ label: 'COGS', zone: zone(52, 56, -1, 4, -57, -51) }],
    [{ label: 'MILLSTONE', zone: zone(66, 76, -1, 4, -59, -49) }],
    [
      { label: 'BELTS', route: 'belts', zone: zone(80, 90, -1, 4, -45, -38) },
      { label: 'GANTRY', route: 'gantry', zone: zone(92, 98, 9, 13, -72, -69) },
    ],
    [{ label: 'FERRIS DECK', zone: zone(77.5, 82, 9.6, 13.6, -57, -53) }],
    [{ label: 'STEAM LEDGE', zone: zone(37, 42, 8.2, 12, -72, -66) }],
    [{ label: 'FINISH', zone: zone(39, 41.5, -1, 3, -58, -50) }], // (a lap: the start line again, after the ledge)
  ],
};

export const CIRCUIT_DEFS = [BRAID_DEF, MILL_RACE_DEF, SPINDLE_DEF];

const css = `
#circuit { position: absolute; left: 24px; top: 58px; min-width: 230px; font-size: 13px; letter-spacing: .06em; background: rgba(28,13,8,.55);
  padding: 7px 12px; border-radius: 3px; display: none; font-variant-numeric: tabular-nums; color: #f5d9bd; line-height: 1.55; pointer-events: none; }
#circuit b { color: #fff1dc; font-size: 20px; font-weight: normal; }
#circuit .n { color: #ffb27a; letter-spacing: .12em; }
#circuit .d { opacity: .8; }
#circuit .good { color: #ffd98a; } #circuit .bad { color: #ff8a70; }
#circuit .medal { font-size: 15px; letter-spacing: .14em; }`;

export class Circuits {
  constructor(game) {
    this.game = game;
    this.defs = new Map(CIRCUIT_DEFS.map((d) => [d.id, d]));
    this.run = null;
    this.best = {};
    try { this.best = JSON.parse(localStorage.getItem(STORE) || '{}'); } catch { /* storage unavailable */ }
    const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    this.el = document.createElement('div'); this.el.id = 'circuit';
    document.body.appendChild(this.el);
    this.beacons = new Map(); // gate -> beacon
    this.buildBeacons();
  }

  get active() { return !!this.run; }

  // ---- the beacons: a column of light on every gate of the next stage, faint on the rest
  buildBeacons() {
    const mat = (o) => new THREE.MeshBasicMaterial({ color: 0xffc65c, transparent: true, opacity: o, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    for (const def of this.defs.values()) {
      def.stages.forEach((stage) => stage.forEach((gate) => {
        const [x0, x1, y0, y1, z0, z1] = gate.zone;
        const g = new THREE.Group();
        const w = Math.min(x1 - x0, 12), d = Math.min(z1 - z0, 12);
        const col = new THREE.Mesh(new THREE.BoxGeometry(w, 9, d), mat(0.12));
        col.position.y = 4.5;
        const floor = new THREE.Mesh(new THREE.BoxGeometry(w, 0.05, d), mat(0.5));
        g.add(col, floor);
        g.position.set((x0 + x1) / 2, y0 + 1.05, (z0 + z1) / 2);
        g.visible = false;
        this.game.scene.add(g);
        this.beacons.set(gate, { g, col, floor });
      }));
    }
  }

  showBeacons(def, stageIx) {
    for (const [gate, b] of this.beacons) b.g.visible = false;
    if (!def) return;
    def.stages.forEach((stage, i) => stage.forEach((gate) => {
      const b = this.beacons.get(gate);
      const on = i === stageIx, soon = i === stageIx + 1;
      b.g.visible = on || soon;
      b.col.material.opacity = on ? 0.2 : 0.05;
      b.floor.material.opacity = on ? 0.7 : 0.18;
    }));
  }

  // ---- arming and leaving
  enter(id) {
    const def = this.defs.get(id);
    if (!def) return;
    const g = this.game;
    const s = def.spawn;
    g.course.teleport(new THREE.Vector3(s.at[0] + (def.origin?.[0] || 0), B + s.at[1], s.at[2] + (def.origin?.[1] || 0)), s.yaw);
    g.course.running = false; g.course.current = -1; g.course.lapT = null;
    this.arm(def);
    g.events?.emit('circuit.enter', { id: def.id, title: def.name });
  }

  arm(def) {
    this.run = { def, stage: 0, t: 0, started: false, penalty: 0, clean: true, splits: [], routes: [], done: false, doneT: 0, last: null, gateTime: 0, respawn: this.spawnOf(def) };
    this.showBeacons(def, 0);
  }

  spawnOf(def) {
    const s = def.spawn;
    return { v: new THREE.Vector3(s.at[0] + (def.origin?.[0] || 0), B + s.at[1] + 0.05, s.at[2] + (def.origin?.[1] || 0)), yaw: s.yaw };
  }

  restart() { if (this.run) { const d = this.run.def; this.enter(d.id); } }

  leave() {
    if (!this.run) return;
    this.run = null;
    this.showBeacons(null);
    this.el.style.display = 'none';
  }

  // ---- per frame
  update(dt) {
    const r = this.run;
    if (!r) return;
    const g = this.game, P = g.player, p = P.pos, def = r.def;
    const [bx0, bx1, bz0, bz1] = def.bounds;
    if (p.x < bx0 || p.x > bx1 || p.z < bz0 || p.z > bz1 || p.y > B + 60 || p.y < B - 30) { this.leave(); return; }
    // (a fall)
    if (!r.done && p.y < B + def.resetY) { this.fall(); return; }
    if (r.done) { r.doneT += dt; this.draw(); return; }
    if (r.started) r.t += dt;
    const stage = def.stages[r.stage];
    for (const gate of stage) {
      const [x0, x1, y0, y1, z0, z1] = gate.zone;
      if (p.x < x0 || p.x > x1 || p.z < z0 || p.z > z1 || p.y < y0 || p.y > y1) continue;
      this.pass(gate);
      break;
    }
    this.draw();
  }

  pass(gate) {
    const r = this.run, g = this.game, def = r.def, speed = Math.hypot(g.player.vel.x, g.player.vel.z);
    if (!r.started) { r.started = true; r.t = 0; }
    else {
      let pen = 0;
      if (gate.minSpeed && speed < gate.minSpeed) { pen = 1; r.penalty += pen; }
      r.splits.push({ label: gate.label, t: r.t, v: speed, pen });
      const bestSp = this.best[def.id]?.splits?.[r.splits.length - 1];
      const delta = bestSp ? r.t + r.penalty - bestSp.t : null;
      g.events?.emit('circuit.gate', { id: def.id, label: gate.label, time: r.t + r.penalty, delta, slow: !!pen, speed });
      sfx.lockOn?.(2);
    }
    if (gate.route) r.routes.push(gate.route);
    // where a fall puts you: on the gate you just crossed
    const [x0, x1, y0, , z0, z1] = gate.zone;
    r.respawn = { v: new THREE.Vector3((x0 + x1) / 2, y0 + 1.05, (z0 + z1) / 2), yaw: gate.yaw ?? r.respawn.yaw };
    if (gate.respawn) r.respawn.v.set(gate.respawn[0], gate.respawn[1], gate.respawn[2]);
    r.stage++;
    if (r.stage >= def.stages.length) return this.finish();
    this.showBeacons(def, r.stage);
  }

  fall() {
    const r = this.run, g = this.game;
    r.clean = false;
    r.penalty += 3;
    g.events?.emit('circuit.fall', { id: r.def.id });
    sfx.fizzle?.();
    g.course.teleport(r.respawn.v.clone(), r.respawn.yaw);
  }

  finish() {
    const r = this.run, def = r.def, g = this.game;
    r.done = true; r.doneT = 0;
    const total = r.t + r.penalty;
    r.total = total;
    const P = def.par;
    r.medal = total <= P.gold ? 'GOLD' : total <= P.silver ? 'SILVER' : total <= P.bronze ? 'BRONZE' : '—';
    const prev = this.best[def.id];
    r.pb = !prev || total < prev.time;
    if (r.pb) {
      this.best[def.id] = { time: total, clean: r.clean, medal: r.medal, splits: r.splits.map((s) => ({ ...s, t: s.t + 0 })) };
      try { localStorage.setItem(STORE, JSON.stringify(this.best)); } catch { /* storage unavailable */ }
    } else if (r.clean && !prev.clean) { prev.clean = true; }
    this.showBeacons(null);
    g.events?.emit('circuit.finish', { id: def.id, title: def.name, time: total, medal: r.medal, clean: r.clean, pb: r.pb, gates: r.splits.length, routes: r.routes.length });
    sfx.lockOn?.(3);
  }

  draw() {
    const r = this.run, def = r.def;
    this.el.style.display = 'block';
    const t = r.t + r.penalty, best = this.best[def.id];
    const stagesN = def.stages.length;
    let h = `<span class="n">${def.name}</span><br>`;
    if (r.done) {
      h += `<b>${r.total.toFixed(2)}</b>s <span class="medal ${r.medal === '—' ? 'bad' : 'good'}">${r.medal}</span>${r.clean ? ' · clean' : ''}${r.pb ? ' · best' : ''}<br>`;
      h += `<span class="d">gold ${def.par.gold}s · silver ${def.par.silver}s · bronze ${def.par.bronze}s${r.routes.length ? ` · route ${r.routes.join(' ')}` : ''}<br>R to run it again · H hub</span>`;
    } else {
      h += `<b>${r.started ? t.toFixed(2) : '0.00'}</b>s ${r.penalty ? `<span class="bad">+${r.penalty}s</span>` : ''}${r.clean ? '' : ' · not clean'}<br>`;
      const next = def.stages[r.stage].map((g) => g.label).join(' or ');
      h += `<span class="d">${r.started ? `gate ${r.stage}/${stagesN - 1}` : 'cross the line to start'} · next: ${next}${best ? ` · best ${best.time.toFixed(2)}s` : ''}</span>`;
    }
    this.el.innerHTML = h;
  }
}
