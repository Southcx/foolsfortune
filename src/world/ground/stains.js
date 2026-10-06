// ---------------------------------------------------------------------------------------
// STAINS: spilled crude on the ground, graded by its feeling (the owner, 2026-10-06; docs/plans/SUNSHINE-SYSTEMS.md section 4, Dovina's
// numbers in progress/brushload.js STAINS). The game day's layout puts STAINS.shore of them on the Shore, where the voyages' spills
// come ashore; a cracked Lachrymato Bottle spills one where the Courier stood. Left alone, a stain grows a stage a game day (its crude
// grows with it), and at the third it spawns ONE aberrant Figment (a slip jelly gone wrong), then holds. The Soul Brush's mop drinks a
// stain up (tools/soulbrush/load.js); emptied, it is washed (`stain.wash`). Drawn into the paint map (world/ground/paintmap.js).
//
// Prior art: Super Mario Sunshine's goop (a stage's pollution that Piranha Plants grow out of, cleaned for access), PowerWash
// Simulator (the stain coming off is its own reward), and Stardew Valley's daily layout (what the day put down stays until dealt with).
//
//   const S = new Stains(game, paintmap)   S.update(dt)   S.spill(pos, grade, lachryma, by)   S.drink(x, y, z, r, want) -> { got, grade }
//   S.list ([{ x, y, z, grade, born, drunk, spawned, from }])   S.stageOf(s)   S.crudeOf(s)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { STAINS, stainStage } from '../../progress/brushload.js';
import { ASPECTS } from '../../progress/weather.js';
import { now, today, DAY_MS } from '../../core/calendar.js';
import { seeded } from '../../core/rng.js';

const RADIUS = [1.1, 1.6, 2.2, 2.8]; // (metres across a stain's middle, by stage 0..3)
const SHORE_CAP = 6; // (stains the Shore holds at most: the game days' layouts add up to this, never past it)

export class Stains {
  constructor(game, paintmap) {
    this.game = game; this.pm = paintmap; this.list = []; this.laid = -1; this.t = 0;
    game.save?.section('stains', {
      scope: 'world', version: 1,
      dump: () => ({ list: this.list.map((s) => ({ ...s })), laid: this.laid }),
      load: (d) => { this.list = (d.list || []).filter((s) => ASPECTS.includes(s.grade)).map((s) => ({ ...s })); this.laid = d.laid ?? -1; this.draw(); },
      reset: () => { this.list = []; this.laid = -1; },
    });
  }

  stageOf(s) { return stainStage((now() - s.born) / DAY_MS); }
  /** The Lachryma a stain still holds: its stage's crude, less what the mop has drunk. */
  crudeOf(s) { return Math.max(0, STAINS.crude[this.stageOf(s)] - s.drunk); }

  /** A spill: a stain of `grade` where `pos` is (a cracked bottle, a crossing's spill). Its crude starts at what was spilled. */
  spill(pos, grade, lachryma = STAINS.crude[0], by = 'environment', from = 'spill') {
    if (!ASPECTS.includes(grade)) return null;
    const s = { x: pos.x, y: pos.y, z: pos.z, grade, born: now(), drunk: Math.max(0, STAINS.crude[0] - lachryma), spawned: false, from };
    this.list.push(s); this.draw(); this.save();
    this.game.events?.emit('stain.spill', { grade, lachryma, from, by });
    return s;
  }

  /** The mop: drink up to `want` Lachryma from the stains within r of (x, y, z). An emptied stain is washed. */
  drink(x, y, z, r, want) {
    let got = 0, grade = null;
    for (const s of this.list.slice()) {
      if (got >= want) break;
      const rad = RADIUS[this.stageOf(s)];
      if (Math.abs(s.y - y) > 1.2 || Math.hypot(s.x - x, s.z - z) > r + rad) continue;
      const t = Math.min(this.crudeOf(s), want - got); s.drunk += t; got += t; grade = s.grade;
      if (this.crudeOf(s) <= 0.01) this.wash(s);
    }
    if (got) { this.draw(); this.save(); }
    return { got, grade };
  }

  wash(s) {
    const stage = this.stageOf(s);
    this.list.splice(this.list.indexOf(s), 1);
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
          this.list.push({ x, y, z, grade: ASPECTS[Math.floor(R() * ASPECTS.length)], born: d * DAY_MS, drunk: 0, spawned: false, from: 'shore' });
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

  draw() { this.pm?.setStains(this.list.map((s) => { const st = this.stageOf(s); return { x: s.x, y: s.y, z: s.z, r: RADIUS[st] * (0.35 + 0.65 * this.crudeOf(s) / STAINS.crude[st]), k: 1, aspect: s.grade }; })); }
  save() { this.game.save?.dirty('stains'); }
}
