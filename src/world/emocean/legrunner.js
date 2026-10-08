// ---------------------------------------------------------------------------------------
// THE LEG RUNNER: plays one waypoint's leg from its schedule (progress/rail/legs.js `schedule`; the split with Petra, 2026-10-08). On each
// event's bar it lets a wave in (world/emocean/waves.js `spawn`), sets a pattern going from its thrower (the pattern player into the shot
// field), sets lights adrift for the lock-on (a breath that still scores), or hands the peak to the leg's director (the stage's: the
// shoal, the Wreckers, Old Nobody). A thing more than a bar late (the game paused while the cue played on) is let go, never heaped, as
// the waves do. The waypoint shapes it: its Figment class (the waves' classes), its feeling (the patterns' kinds), a storm (more volleys).
//
// What it needs of the stage (Petra's), passed in, never reached for:
//   waves (spawn, add, foes)   player (a PatternPlayer)   object() -> the director's big thing to fire from, or null   onDirector(setPiece)
//
// Prior art: the shmup stage script on the beat (Rez's layers, Cave's wave tables), and the waves' own let-go rule.
//
//   const L = new LegRunner({ waves, player, object, onDirector, scene })   L.begin(waypoint, { feel, storm, strength })   L.update(bar)
//   L.plan   L.done   L.phaseAt(bar) -> { id, view }   (bar: from the leg's first, in the cue's bars)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { schedule } from '../../progress/rail/legs.js';

/** Where a pattern with no thrower fires from: up the rail, at the ship's height. */
export const AHEAD = [0, 4, 60];
const LIGHT = { speed: 9, pay: 40 }; // (a light drifting by: lock it for its pay; it never fires)

export class LegRunner {
  constructor({ waves, player, object = () => null, onDirector = null, scene = null } = {}) {
    Object.assign(this, { waves, player, object, onDirector, scene });
    this.plan = null; this.next = 0; this.idx = 0; this.done = true;
  }

  /** A waypoint's leg begins: { type, strength, feel, storm } (the sea chart's waypoint). */
  begin(w, extra = {}) {
    this.plan = schedule(w.type, { strength: w.strength ?? 1, feel: w.feel ?? null, storm: !!w.storm, ...extra });
    this.next = 0; this.idx = 0; this.done = !this.plan; this.feel = w.feel ?? null;
    return this.plan;
  }
  phaseAt(bar) { return this.plan?.phases.find((p) => bar >= p.from && bar < p.to) || null; }

  update(bar) {
    if (this.done) return;
    const E = this.plan.events;
    while (this.next < E.length && E[this.next].bar <= bar) {
      const e = E[this.next++];
      if (bar - e.bar > 1) continue; // (more than a bar late: let go)
      if (e.wave) this.waves.spawn({ ...e.wave, lane: e.wave.lane ?? ((this.idx % 3) - 1), bar: e.bar }, this.idx++);
      else if (e.pattern) this.pattern(e.pattern);
      else if (e.targets) this.lights(e.targets);
      else if (e.director) this.onDirector?.(e.director);
    }
    if (bar >= this.plan.bars) this.done = true;
  }

  /** A pattern from its thrower: 'ahead', the newest live foe of a role, or the director's big thing; no thrower, from ahead. */
  pattern(p) {
    let from = null;
    if (p.from === 'object') from = this.object?.() || null;
    else if (p.from !== 'ahead') for (let i = this.waves.foes.length - 1; i >= 0; i--) { const f = this.waves.foes[i]; if (f.alive && f.role === p.from) { from = f; break; } }
    this.player.play(p.name, p.params, { from, at: from ? null : AHEAD, mode: p.mode, kind: p.kind, feel: this.feel });
  }

  /** Lights to lock, set adrift across the frame (Rez's scanning orbs: the calm's score, the release's flotsam). */
  lights(n) {
    for (let i = 0; i < n; i++) {
      const x = -14 + 28 * (i + 0.5) / n, y = 3 + 3 * Math.sin(i * 1.7), z = 70 + (i % 3) * 8;
      this.waves.add({
        kind: 'rail.light', name: 'a light', role: 'light', cls: 0, aspect: this.feel, radius: 1.1, hp: 1, pay: LIGHT.pay, chain: false, count: false,
        local: new THREE.Vector3(x, y, z), mesh: this.lightMesh(),
        tick: (dt, f) => { f.local.z -= LIGHT.speed * dt; f.local.y += Math.sin(f.t * 2 + i) * 0.4 * dt; return f.local.z > -12; },
      });
    }
  }
  lightMesh() { // (a placeholder: Calissa's lights to lock)
    this.lightGeo ||= new THREE.OctahedronGeometry(0.7, 0);
    this.lightMat ||= new THREE.MeshBasicMaterial({ color: 0xbfefff, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false });
    return new THREE.Mesh(this.lightGeo, this.lightMat);
  }
}
