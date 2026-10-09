// ---------------------------------------------------------------------------------------
// STAINS: spilled crude on the ground, graded by its feeling (the owner, 2026-10-06; docs/plans/SUNSHINE-SYSTEMS.md section 4, Dovina's
// numbers in progress/brushload.js STAINS). The game day's layout puts STAINS.shore of them on the Shore, where the voyages' spills
// come ashore; a cracked Lachrymato Bottle spills one where the Courier stood. Left alone, a stain grows a stage a game day (its crude
// grows with it), and at the third it spawns ONE aberrant Figment (a slip jelly gone wrong), then holds. The Soul Brush's mop drinks a
// stain up (tools/soulbrush/load.js); emptied, it is washed (`stain.wash`). A blot LIVES IN THE PAINT MAP (LACHRYMA-LOOP.md 3, rules 6
// and 7: world/ground/paintmap.js, crude cells that keep): laid there once (and again when the map's window moves), grown by its rim a
// stage at a time, so two that touch read as one; a spill on a blot of its own feeling joins it; the mop wipes a strip, rim first.
// (Calissa's Stain meshes, vfx/stains.js, are no longer laid: the paint map draws it.)
//
// Prior art: Super Mario Sunshine's goop (a stage's pollution that Piranha Plants grow out of, cleaned for access), PowerWash
// Simulator (the stain coming off is its own reward), and Stardew Valley's daily layout (what the day put down stays until dealt with).
//
//   const S = new Stains(game)   S.update(dt)   S.spill(pos, grade, lachryma, by)   S.wipe(a, b, y, want) -> { got, grade, at, smear }
//   S.list ([{ x, y, z, grade, born, drunk, spawned, from }])   S.stageOf(s)   S.crudeOf(s)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { STAINS, stainStage } from '../../progress/brushload.js';
import { ASPECTS, NATIVE } from '../../progress/weather.js';
import { now, today, DAY_MS } from '../../core/calendar.js';
import { seeded } from '../../core/rng.js';

const RADIUS = [1.1, 1.6, 2.2, 2.8]; // (metres across a stain's middle, by stage 0..3)
const CELL_M2 = 0.0625; // (one paint map cell: 0.25 m square)
const SHORE_CAP = 6; // (stains the Shore holds at most: the game days' layouts add up to this, never past it)

const _o = new THREE.Vector3(), _down = new THREE.Vector3(0, -1, 0);
const segDist = (px, pz, ax, az, bx, bz) => { const dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz, t = l2 ? Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / l2)) : 0; return Math.hypot(px - ax - t * dx, pz - az - t * dz); };

export class Stains {
  constructor(game) {
    this.game = game; this.list = []; this.laid = -1; this.t = 0;
    if (game.paintmap) game.paintmap.onRecentre = () => { for (const s of this.list) s.mapR = 0; this.draw(); }; // (a new window: every blot laid again)
    game.save?.section('stains', {
      scope: 'world', version: 1,
      dump: () => ({ list: this.list.map(({ mapR, ...s }) => ({ ...s })), laid: this.laid }),
      load: (d) => { this.list = (d.list || []).filter((s) => ASPECTS.includes(s.grade)).map((s) => ({ ...s })); this.laid = d.laid ?? -1; this.draw(); },
      reset: () => { this.list = []; this.laid = -1; this.draw(); },
    });
  }

  stageOf(s) { return stainStage((now() - s.born) / DAY_MS); }
  /** The Lachryma a stain still holds: its stage's crude, less what the mop has drunk. */
  crudeOf(s) { return Math.max(0, STAINS.crude[this.stageOf(s)] - s.drunk); }

  /** A spill: a stain of `grade` where `pos` is (a cracked bottle, a crossing's spill). Its crude starts at what was spilled. */
  spill(pos, grade, lachryma = STAINS.crude[0], by = 'environment', from = 'spill') {
    if (!ASPECTS.includes(grade)) return null;
    const y = this.groundAt(pos.x, pos.y, pos.z);
    const onto = this.list.find((o) => o.grade === grade && Math.abs(o.y - y) < 1.2 && Math.hypot(o.x - pos.x, o.z - pos.z) < RADIUS[this.stageOf(o)] + RADIUS[0]);
    if (onto) { // (a spill on a blot of its own feeling joins it: its crude added, the blot laid out again to hold it)
      onto.drunk -= lachryma; onto.mapR = 0; this.draw(); this.save(); // (past its stage's crude: it is laid out bigger, by its area)
      this.game.events?.emit('stain.spill', { grade, lachryma, from, by, joined: true });
      return onto;
    }
    const s = { x: pos.x, y, z: pos.z, grade, born: now(), drunk: Math.max(0, STAINS.crude[0] - lachryma), spawned: false, from };
    this.list.push(s); this.draw(); this.save();
    this.game.events?.emit('stain.spill', { grade, lachryma, from, by });
    return s;
  }

  /** The mop's stroke this frame, a to b at height y: a strip 2.4 m wide (STAINS.wipe) wiped across the blots it crosses, each from its
   *  rim, up to `want` Lachryma; a thin smear pushed on 0.5 m. An emptied blot is washed. */
  wipe(a, b, y, want, width = null) {
    const pm = this.game.paintmap, w = width ?? STAINS.wipe ?? 2.4; // (`width`: Clean's splat, not the mop's strip)
    let got = 0, grade = null, at = null, smear = null;
    if (!pm) return { got, grade, at, smear };
    for (const s of this.list.slice()) {
      if (got >= want) break;
      if (Math.abs(s.y - y) > 1.2 || segDist(s.x, s.z, a.x, a.z, b.x, b.z) > this.reach(s) + w / 2) continue;
      const per = this.perCell(s), r = pm.wipe(a.x, a.z, b.x, b.z, s.y, w, (want - got) / per, true, s);
      if (r.got <= 0) continue;
      const t = Math.min(this.crudeOf(s), r.got * per); s.drunk += t; got += t; grade = s.grade; at = s; smear = r.smear;
      if (r.smear) pm.stamp(r.smear.x, s.y, r.smear.z, 0.3, s.grade, 0.15, true); // (the smear: the crude the stroke pushed along, thin)
      if (this.crudeOf(s) <= 0.01 || !pm.count(s.x, s.y, s.z, this.reach(s), true)) { got += this.crudeOf(s); s.drunk += this.crudeOf(s); this.wash(s); } // (no crude cell left of it: emptied, all of it taken)
    }
    if (got) this.save();
    return { got, grade, at: at && new THREE.Vector3(at.x, at.y, at.z), smear };
  }
  /** How far a blot's cells reach from its middle (it grows past its stage's size when spills join it). */
  reach(s) { return Math.max(RADIUS[this.stageOf(s)], s.mapR || 0) + 0.25; }
  /** Lachryma a cell-full of a blot's crude holds: its stage's crude spread over its disc. */
  perCell(s) { const R = RADIUS[this.stageOf(s)]; return STAINS.crude[this.stageOf(s)] / Math.max(1, (Math.PI * R * R) / CELL_M2); }

  wash(s) {
    const stage = this.stageOf(s), pm = this.game.paintmap;
    this.list.splice(this.list.indexOf(s), 1);
    pm?.wipe(s.x, s.z, s.x, s.z, s.y, 2 * RADIUS[stage] + 1, 1e9, true, s); // (what little is left of it, gone with it)
    this.game.events?.emit('stain.wash', { grade: s.grade, stage, by: 'courier' });
  }

  /** The game day's layout: the Shore's stains, a few a game day, seeded by the day (the same for everyone on it). */
  layDay(day) {
    const beach = this.game.dunes?.beach; if (!beach) return;
    const from = this.laid < 0 ? day : this.laid + 1;
    for (let d = Math.max(from, day - 3); d <= day; d++) { // (no more than three game days' worth: a long absence does not bury the beach)
      const R = seeded((d * 2654435761) >>> 0), land = beach.landing().pos;
      for (let k = 0; k < STAINS.shore && this.list.filter((s) => s.from === 'shore').length < SHORE_CAP; k++) {
        for (let tries = 0; tries < 12; tries++) {
          const x = land.x + (R() - 0.5) * 50, z = land.z + (R() - 0.5) * 70, w = beach.shoreAt(x, z);
          if (w < 2 || w > 30) continue; // (on the sand, near the waterline: where the sea leaves what it carries)
          const y = beach.heightAt(x, z);
          this.list.push({ x, y, z, grade: NATIVE[Math.floor(R() * NATIVE.length)], born: d * DAY_MS, drunk: 0, spawned: false, from: 'shore' });
          break;
        }
      }
    }
    this.laid = day; this.draw(); this.save();
  }

  /** Once a frame: a new game day lays its stains; once a real second, stages are redrawn and a grown stain spawns its Figment. */
  update(dt) {
    this.t -= dt; if (this.t > 0) return; this.t = 1;
    const day = today();
    if (day !== this.laid && this.game.dunes?.beach) this.layDay(day);
    const P = this.game.player?.pos, J = this.game.jellies;
    for (const s of this.list) {
      if (s.spawned || this.stageOf(s) < STAINS.spawn.at || !P || !J) continue;
      if (Math.hypot(P.x - s.x, P.z - s.z) > 70) continue; // (it spawns where it can be met: not out of sight across the map)
      s.spawned = true;
      const c = J.spawn(new THREE.Vector3(s.x, s.y + 0.1, s.z), { cls: 1 });
      if (c) { c.aberrant = true; c.name = 'Aberrant Slip Jelly'; c.grade = s.grade; } // (Espada names it; a bounty's quarry)
      this.game.events?.emit('stain.spawn', { grade: s.grade, kind: STAINS.spawn.kind, by: 'environment' });
      this.save();
    }
    this.draw();
  }

  /** Each blot in the paint map: laid when it is first in the map's window (at the size its crude left fills), its rim laid again
   *  when it grows a stage; never laid again over what the mop took. */
  draw() {
    const pm = this.game.paintmap; if (!pm) return;
    for (const s of this.list) {
      const st = this.stageOf(s), R = RADIUS[st];
      if (s.mapR >= R - 1e-3) continue;
      const frac = Math.max(0.05, this.crudeOf(s) / STAINS.crude[st]), r = R * Math.sqrt(frac);
      pm.stamp(s.x, s.y, s.z, r, s.grade, 1, true);
      s.mapR = Math.max(R, r);
    }
  }
  /** The static ground under (x, z) near height y (a pot or a creature is not ground), else y. */
  groundAt(x, y, z) {
    const hit = this.game.physics?.raycast(_o.set(x, y + 0.6, z), _down, 3, undefined, undefined, (c) => !c.parent() || c.parent().isFixed());
    return hit ? hit.point.y : y;
  }
  /** Once a frame (render): nothing now (the paint map draws the blots). */
  tick() {}
  save() { this.game.save?.dirty('stains'); }
}
