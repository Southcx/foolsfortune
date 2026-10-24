// ---------------------------------------------------------------------------------------
// THE RACE'S FIREWORKS (plain name): a short show over the start arch of the track a race was won on (race.finish in first place
// against rivals, or with a medal run alone): shells rising from behind the arch's lintel in a fan and bursting high over it, a peony of
// sparks in a seat colour or gold each, a crackle after, about five real seconds in all, louder in the dark (the sparks' size by the
// hour). The library's effects on the shared particle pools (vfx/raceway/effects.js 'raceway.firework.rise', '.burst'), each burst's lamp
// lent by the light budget like any lamp: no meshes, no program. A look only: the win is said in the log, by its rule.
// Sound: none of its own yet (a placeholder: the burst's report and crackle are Wanda's to write, audio/).
//
// Prior art: the fireworks over Mario Kart's and F-Zero's podiums, Gran Turismo's cup wins, a real peony shell (a lift charge, a
// rising trail, a sphere of stars at the apex, a crackle), and the house's sun glyph's gold (vfx/racewaylooks.js).
//
//   const F = new RaceFireworks(game)   F.update(dt, raceway)   F.show(track)   (heard on race.finish)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { SEAT_LOOK, SEAT_NAMES } from '../seatlook.js';
import { sideOf } from '../../world/raceway/kit.js';

/** The numbers: shells in a show and the real seconds over which they go up; the lintel's height over the line (m, kit.js: 11 over the
 *  higher post's foot) and the apex's above it; the fan's spread across the line (m); a shell's climb (real s). */
export const SHOW = { shells: 9, over: 4.6, lintel: 11.6, apex: [18, 30], spread: 22, climb: 0.85, cap: 24 };

const _p = new THREE.Vector3();

export class RaceFireworks {
  constructor(game) {
    this.game = game; this.t = 0; this.queue = Array.from({ length: SHOW.cap }, () => ({ at: -1, x: 0, y: 0, z: 0, apex: 0, tint: new THREE.Color(), rose: false }));
    this.colours = [...SEAT_NAMES.map((n) => new THREE.Color(SEAT_LOOK[n].hex)), new THREE.Color(0xffd36a), new THREE.Color(0xffd36a)];
    game.events?.on('race.finish', (e) => { if (e && (e.of > 1 ? e.place === 1 : !!e.medal)) this.show(e.track); });
  }

  /** A show over the start arch of track `id` (the race's). */
  show(id) {
    const R = this.game.raceway, T = R?.trackOf?.(id) || R?.track; if (!T) return;
    const F = T.frame(T.line), a = sideOf(R, T, T.line, -F.w - 3), b = sideOf(R, T, T.line, F.w + 3), top = Math.max(a.y, b.y) + SHOW.lintel;
    const rx = -F.fz, rz = F.fx, mx = (a.x + b.x) / 2, mz = (a.z + b.z) / 2;
    for (let i = 0; i < SHOW.shells; i++) {
      const q = this.queue.find((s) => s.at < 0); if (!q) break;
      const lat = (Math.random() - 0.5) * SHOW.spread, back = -2 - Math.random() * 3; // (from just behind the lintel, the grid's side)
      q.at = this.t + (i / SHOW.shells) * SHOW.over + Math.random() * 0.25; q.rose = false;
      q.x = mx + rx * lat - F.fx * back; q.z = mz + rz * lat - F.fz * back; q.y = top; q.apex = top + SHOW.apex[0] + Math.random() * (SHOW.apex[1] - SHOW.apex[0]);
      q.tint.copy(this.colours[(Math.random() * this.colours.length) | 0]);
    }
  }

  update(dt, R) {
    this.t += dt;
    const V = this.game.vfx, night = 1 - THREE.MathUtils.smoothstep(R?.sun ?? 1, 0.1, 0.8);
    for (const q of this.queue) {
      if (q.at < 0 || this.t < q.at) continue;
      if (!q.rose) { q.rose = true; V?.play('raceway.firework.rise', { pos: _p.set(q.x, q.y, q.z), tint: q.tint, power: 1 }); continue; }
      if (this.t >= q.at + SHOW.climb) { q.at = -1; V?.play('raceway.firework.burst', { pos: _p.set(q.x, q.apex, q.z), tint: q.tint, power: 0.8 + 0.5 * night }); }
    }
  }
}
