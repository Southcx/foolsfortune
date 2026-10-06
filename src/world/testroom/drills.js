// ---------------------------------------------------------------------------------------
// THE DRILLS: the testing room's four measures of aim and recoil (Dovina's: progress/combat/testroom.js DRILLS, score, group), begun from
// the Index's Testing page in the room (a trial is begun in its own room) and ended by their own clock, or by leaving the room. A drill
// counts the psygun's shots (`shot.fire`, which carries what the shot hit) against its own targets, and at the end says one event,
// `drill.end { id, run: { hits, shots, times, group }, tuned, by }`; the rule (feedback/tracking/testroom.js) scores it, says it and
// records it, unless the game is tuned (debug/tuned.js).
//
//   Flick    20 targets, one at a time, anywhere in a 120 degree arc 4 to 14 m from the mark; 1.5 s each; the mean time to hit
//   Track    one target crossing the room at 3 to 6 m/s for 15 s, 6 to 12 m off; the share of shots that hit
//   Spray    20 shots held at the clay wall 10 m off; the wall keeps the dents (the pattern is read from the wall: no numbers on it)
//   Recover  three bursts of five at three targets in a row at 8 m (left, centre, right), the one to shoot lit; the share on target
//
// Its chance draws from its own stream (core/rng.js), so a replay of a drill is the same drill. The targets are plain discs: their look
// is Calissa's to replace (the target's rings, the lit one, the wall's dents).
//
// Prior art: Aim Lab's and KovaaK's drills (Gridshot, Sixshot, strafe tracking), Counter-Strike's spray practice on a wall.
//
//   const D = new Drills(game, room)   D.start(id)   D.update(dt, raw)   D.active (the drill running, or null)   D.page(im, el) (the Index's Testing page)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { RAPIER, GROUPS } from '../../core/physics.js';
import { PALETTE } from '../../core/config.js';
import { stream } from '../../core/rng.js';
import { DRILLS, WALL, KEYS, medalOf, group } from '../../progress/combat/testroom.js';
import { tuned } from '../../debug/tuned.js';
import { TR } from './layout.js';

const R = stream('world/testroom');
const DEG = Math.PI / 180, GAP = 0.35, TARGET_R = 0.32;
const DENT_R = 0.035, DENT_SEG = 8;                        // (a dent's radius, metres, and its triangles)

/** A target: a disc on its face toward the mark, its collider a ball the shot finds (`entity.type === 'drilltarget'`). */
class Target {
  constructor(game) {
    this.game = game;
    const g = (this.mesh = new THREE.Group());
    const face = new THREE.Mesh(new THREE.CylinderGeometry(TARGET_R, TARGET_R, 0.05, 20), new THREE.MeshStandardMaterial({ color: PALETTE.cream, roughness: 0.7 }));
    face.rotation.z = Math.PI / 2; g.add(face);
    this.bull = new THREE.Mesh(new THREE.CylinderGeometry(TARGET_R * 0.4, TARGET_R * 0.4, 0.06, 16), new THREE.MeshStandardMaterial({ color: 0xb8402e, roughness: 0.6, emissive: 0x000000 }));
    this.bull.rotation.z = Math.PI / 2; g.add(this.bull);
    g.visible = false; game.scene.add(g);
    this.ent = { type: 'drilltarget', target: this };
    this.col = game.physics.world.createCollider(RAPIER.ColliderDesc.ball(TARGET_R).setTranslation(0, -50, 0).setCollisionGroups(GROUPS.static));
    game.physics.register(this.col, this.ent);
    this.col.setEnabled(false);
  }
  show(p) { this.mesh.position.copy(p); this.mesh.lookAt(TR.mark.x, p.y, TR.mark.z); this.mesh.rotateY(Math.PI / 2); this.mesh.visible = true; this.col.setTranslation(p); this.col.setEnabled(true); this.lit(false); }
  move(p) { this.mesh.position.copy(p); this.col.setTranslation(p); }
  hide() { this.mesh.visible = false; this.col.setEnabled(false); this.col.setTranslation({ x: 0, y: -50, z: 0 }); }
  lit(on) { this.bull.material.emissive.setHex(on ? 0xff6a3a : 0x000000); }
}

export class Drills {
  constructor(game, room) {
    this.game = game; this.room = room;
    this.active = null;
    this.targets = [new Target(game), new Target(game), new Target(game)];
    // the wall's dents: small dark discs on its face, the oldest gone after WALL.keep real seconds. One plain mesh whose vertices are
    // written in place (a disc of DENT_SEG triangles per dent, a spent one folded to a point): one draw call, and no shader program of its
    // own (an instanced basic material would be the only one in the game: perf, R45)
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(WALL.maxDents * DENT_SEG * 9), 3).setUsage(THREE.DynamicDrawUsage));
    this.dents = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: PALETTE.deep }));
    this.dents.frustumCulled = false; this.dentAt = []; this.dentN = 0; this.clock = 0;
    game.scene.add(this.dents);
    game.events?.on('shot.fire', (e) => this.shot(e));
  }

  // ---------------------------------------------------------------- begin, run, end
  start(id) {
    const D = DRILLS[id], g = this.game;
    if (!D || !this.room.inRoom(g.player.pos)) return false;
    this.stop();
    g.lachryma?.reset?.(); // (a drill measures the aim, not the supply: the pool starts full, as a trial's does: world/trial.js)
    this.active = { id, D, t: 0, shots: 0, hits: 0, times: [], points: [], i: -1, wait: GAP, cur: null, upAt: 0 };
    if (id === 'spray') this.clearDents();
    if (id === 'recover') this.recoverSet();
    g.events?.emit('drill.start', { id, by: 'courier' });
    return true;
  }
  stop() { for (const T of this.targets) T.hide(); this.active = null; }

  end() {
    const a = this.active, g = this.game;
    if (!a) return;
    const run = { hits: a.hits, shots: a.shots, times: a.times };
    if (a.id === 'spray') run.group = group(a.points, { x: 0, y: 0 });
    this.stop();
    g.events?.emit('drill.end', { id: a.id, run, tuned: tuned().knobs.map((k) => k.key), by: 'courier' });
  }

  /** A shot was fired (psygun: `shot.fire { ent, at }`): counted against the drill running. */
  shot(e) {
    const a = this.active;
    if (!a) return;
    a.shots++;
    const ent = e.ent;
    if (a.id === 'spray') {
      if (ent?.type === 'spraywall' && e.at) { a.points.push({ x: e.at.z - TR.wall.z, y: e.at.y - TR.wall.y }); this.dent(e.at); }
      if (a.shots >= DRILLS.spray.shots) this.end();
      return;
    }
    if (ent?.type !== 'drilltarget') { if (a.id === 'recover' && a.shots >= DRILLS.recover.bursts * DRILLS.recover.shots) this.end(); return; }
    if (a.id === 'flick' && ent.target === a.cur) { a.hits++; a.times.push(Math.round((a.t - a.upAt) * 1000)); a.cur.hide(); a.cur = null; a.wait = GAP; }
    else if (a.id === 'track' && ent.target === a.cur) a.hits++;
    else if (a.id === 'recover') {
      const k = Math.min(DRILLS.recover.bursts - 1, Math.floor((a.shots - 1) / DRILLS.recover.shots));
      if (ent.target === this.targets[k]) a.hits++;
      this.recoverLight(a.shots);
      if (a.shots >= DRILLS.recover.bursts * DRILLS.recover.shots) this.end();
    }
  }

  update(dt, raw = dt) {
    this.clock += raw;
    this.fadeDents();
    const a = this.active, g = this.game;
    if (!a) return;
    if (!this.room.inRoom(g.player.pos)) { this.stop(); g.events?.emit('drill.left', { id: a.id }); return; } // (left the room: the drill is off)
    a.t += dt;
    if (a.id === 'flick') this.flick(a, dt);
    else if (a.id === 'track') this.track(a, dt);
    else if (a.id === 'spray' && a.t > 30) this.end(); // (20 shots, or the time a slow trigger finger gets)
    else if (a.id === 'recover' && a.t > 30) this.end();
  }

  flick(a, dt) {
    const D = DRILLS.flick;
    if (a.cur) { if (a.t - a.upAt > D.window) { a.cur.hide(); a.cur = null; a.wait = GAP; } return; } // (missed: the whole window, by score())
    if ((a.wait -= dt) > 0) return;
    if (++a.i >= D.targets) { this.end(); return; }
    const ang = (R() * 2 - 1) * (D.arc / 2) * DEG, d = D.range[0] + R() * (D.range[1] - D.range[0]);
    const p = new THREE.Vector3(TR.mark.x + Math.cos(ang) * d, 0.8 + R() * 1.8, TR.mark.z + Math.sin(ang) * d);
    p.x = THREE.MathUtils.clamp(p.x, TR.mark.x + 2, TR.x1 - 0.8); p.z = THREE.MathUtils.clamp(p.z, TR.z0 + 0.8, TR.z1 - 0.8);
    a.cur = this.targets[0]; a.cur.show(p); a.upAt = a.t;
  }

  track(a, dt) {
    const D = DRILLS.track;
    if (!a.cur) { a.cur = this.targets[0]; a.dir = 1; a.speed = D.speed[0] + R() * (D.speed[1] - D.speed[0]); a.x = TR.mark.x + D.range[0] + R() * (D.range[1] - D.range[0]); a.z = TR.z0 + 1; a.cur.show(new THREE.Vector3(a.x, 1.6, a.z)); }
    a.z += a.dir * a.speed * dt;
    if (a.z > TR.z1 - 1 || a.z < TR.z0 + 1) { a.dir *= -1; a.z = THREE.MathUtils.clamp(a.z, TR.z0 + 1, TR.z1 - 1); a.speed = D.speed[0] + R() * (D.speed[1] - D.speed[0]); }
    a.cur.move(new THREE.Vector3(a.x, 1.6, a.z));
    if (a.t >= D.seconds) this.end();
  }

  /** Recover's three targets in a row at 8 m, left to right as seen from the mark; the one to shoot is lit. */
  recoverSet() {
    const d = DRILLS.recover.range[0];
    [-20, 0, 20].forEach((deg, i) => this.targets[i].show(new THREE.Vector3(TR.mark.x + Math.cos(deg * DEG) * d, 1.5, TR.mark.z + Math.sin(deg * DEG) * d))); // (facing +x down the lane, -z is the left)
    this.recoverLight(0);
  }
  recoverLight(shots) { const k = Math.min(2, Math.floor(shots / DRILLS.recover.shots)); this.targets.forEach((T, i) => T.lit(i === k)); }

  // ---------------------------------------------------------------- the wall's dents (kept WALL.keep real seconds, at most WALL.maxDents)
  dent(at) {
    const i = this.dentN < WALL.maxDents ? this.dentN++ : this.dentAt.indexOf(Math.min(...this.dentAt.map((t) => t ?? -Infinity)));
    this.writeDent(i, at.y, at.z, DENT_R); this.dentAt[i] = this.clock;
  }
  // (dent i as a fan in the wall's plane, wound to face the mark at -x; r 0 folds it to a point)
  writeDent(i, y, z, r) {
    const a = this.dents.geometry.attributes.position, x = TR.wall.x - 0.006;
    for (let k = 0; k < DENT_SEG; k++) {
      const a0 = (k / DENT_SEG) * Math.PI * 2, a1 = ((k + 1) / DENT_SEG) * Math.PI * 2, o = (i * DENT_SEG + k) * 3;
      a.setXYZ(o, x, y, z); a.setXYZ(o + 1, x, y + Math.sin(a0) * r, z + Math.cos(a0) * r); a.setXYZ(o + 2, x, y + Math.sin(a1) * r, z + Math.cos(a1) * r);
    }
    a.needsUpdate = true;
  }
  fadeDents() {
    for (let i = 0; i < this.dentN; i++) if (this.dentAt[i] != null && this.clock - this.dentAt[i] > WALL.keep) { this.writeDent(i, 0, 0, 0); this.dentAt[i] = null; }
  }
  clearDents() { for (let i = 0; i < this.dentN; i++) this.writeDent(i, 0, 0, 0); this.dentN = 0; this.dentAt = []; }

  // ---------------------------------------------------------------- the Index's Testing page (feedback/indexmenu.js showPage)
  page(im, el) {
    const g = this.game, L = g.ledger, t = tuned().knobs;
    im.appendChild(el('div', 'grp', 'DRILLS · Stand on the firing mark, face the wall, and choose one'));
    const grid = el('div', 'rooms');
    for (const [id, D] of Object.entries(DRILLS)) {
      const best = L?.best(KEYS.best(id)), medal = best != null ? medalOf(id, best) : null;
      const row = el('div', 'room', `<span class="n">${D.name[0]}</span><span><b>${D.name}</b><s>${best != null ? `best ${best} ${D.unit}${medal ? ` · ${medal}` : ''}` : 'no run yet'}</s></span>`);
      row.onclick = () => { g.course?.menu?.close(); this.start(id); };
      grid.appendChild(row);
    }
    im.appendChild(grid);
    if (t.length) im.appendChild(el('div', 'grp', `TUNED · ${t.map((k) => k.key).join(', ')} · runs are not recorded`));
    const S = this.room.strawman, b = S?.last;
    im.appendChild(el('div', 'grp', `STRAWMAN · ${S?.mode || 'still'} · press F at Strawman to change`));
    im.appendChild(el('div', 'cal', b ? `<div><span>last bout</span><b>${b.blows} blows in ${b.seconds} s · ${Math.round(b.damage)} damage · ${b.perSecond} a second</b></div>` : '<div><span>last bout</span><b>none yet</b></div>'));
  }
}
