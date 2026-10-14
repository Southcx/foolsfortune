// ---------------------------------------------------------------------------------------
// THE ESCAPE (docs/plans/SKIFF-RACING.md section 12): the Gorge Run's crater wakes. Set down partway down its spiral, you ride on round
// it, across its floor and up the climb out, while the antlion comes up the road behind you, quicker as it goes; out at the gate past
// the climb, you have escaped; if it reaches you, the board is taken (a wreck) and the run is over. Its pace is a number a real second
// (it starts slow, ends faster than a careless line), so the escape is a race against a clock you can see in your mirror.
// Events (with `by`): race.escape.wake, race.escape.near { metres } (it is close), race.escape.caught (by: creature); the race's finish
// (mode escape) is the escape.
// The antlion here is the crater's own, the eldest: the pits' maws are its younger kin (Espada's proposal, 2026-10-14, until the owner
// rules). Its body is a placeholder (a dark cone of jaws on the road: Calissa's to make).
//
// Prior art: Crash Bandicoot's boulder and polar bear chases, Sonic Adventure's orca, Temple Run, Burnout's pursuit: a chaser whose
// pace is a curve, so the run is about the line, not the reflex.
//
//   const E = new Escape(game, race)   (a mode's ruleset: the race calls plan, begin, update, result, stop)   ESCAPE (the numbers)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { RW } from './track.js';

/** The escape on the Gorge Run: where it begins (s on the line), the gate it ends at (index), metres behind you the antlion wakes, its
 *  pace at waking and its gain a real second (m/s), the most it reaches, metres apart it takes you, metres apart it is said to be near. */
export const ESCAPE = { track: 'gorge', from: 1389, gate: 5, behind: 120, pace: 16, gain: 0.28, max: 30, take: 3, near: 25 };

export class Escape {
  constructor(game, race) { this.game = game; this.race = race; }
  plan() { return { track: ESCAPE.track, from: ESCAPE.from, gate: 4, flying: true, laps: 1 }; } // (set down past gate 4 on a flying start: the clock begins at once, see begin)
  begin(race) {
    const g = this.game; this.stop();
    this.d = -ESCAPE.behind; this.v = ESCAPE.pace; this.mine = 0; this.saidNear = false; this.awake = false;
    race.state = 'run'; race.goT = 9; race.solarDone = true; // (no countdown: it is already awake)
    const jaws = new THREE.Mesh(new THREE.ConeGeometry(4, 6, 7, 1, true), new THREE.MeshStandardMaterial({ color: 0x2a1a14, roughness: 0.9, side: THREE.DoubleSide, flatShading: true }));
    jaws.rotation.x = Math.PI / 2; this.body = new THREE.Group(); this.body.add(jaws); this.body.userData.zone = 'raceway'; g.scene.add(this.body);
  }
  update(race, dt) {
    const g = this.game, R = race.R, T = race.T, L = T.length;
    if (!this.awake) { this.awake = true; g.events?.emit('race.escape.wake', { by: 'creature' }); }
    this.mine = ((R.s - ESCAPE.from) % L + L) % L; if (this.mine > L - 200) this.mine -= L; // (your metres along the line from where it began)
    this.v = Math.min(ESCAPE.max, this.v + ESCAPE.gain * dt); this.d += this.v * dt;
    const F = T.frame(ESCAPE.from + this.d), x = RW.x + F.x, z = RW.z + F.z;
    this.body.position.set(x, R.heightAt(x, z) + 2, z); this.body.rotation.y = Math.atan2(F.fx, F.fz);
    const gap = this.mine - this.d;
    if (gap < ESCAPE.near && !this.saidNear) { this.saidNear = true; g.events?.emit('race.escape.near', { metres: Math.round(gap), by: 'creature' }); }
    if (gap > ESCAPE.near * 2) this.saidNear = false;
    if (gap < ESCAPE.take) {
      g.events?.emit('race.escape.caught', { by: 'creature' });
      const S = race.skiff; if (S?.phase === 'ride') S.bail('wrecked');
      race.end('caught'); return false;
    }
  }
  gate(race, i) { return i >= ESCAPE.gate; } // (out past the climb's gate: escaped)
  result(race, out) { out.seconds = +race.t.toFixed(2); out.margin = Math.round(this.mine - this.d); }
  stop() { if (this.body) { this.body.removeFromParent(); this.body = null; } }
}
