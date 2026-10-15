// ---------------------------------------------------------------------------------------
// THE POT SMASH (docs/plans/SKIFF-RACING.md section 12): a lap alone with clay pots stood on the line; each one ridden through is
// smashed and takes a real second off the lap's time, so the fastest lap is not the fastest line but the one that bends to the pots
// (Crash Team Racing's Relic Race: the time crates freeze the clock; Burnout's road rage, the lap as a hunt). The pots stand where the
// track's own seed puts them, the same every run, so a route can be learned. The look is a placeholder (Calissa's: the pottery props).
// Events (with `by`): race.pot { smashed, left, speed, at }; the race's finish carries pots { smashed, of } and the seconds already taken off.
//
// Prior art: Crash Team Racing's Relic Races (time crates, 1 s each, a route learned), Burnout 3's Road Rage, Trackmania's fixed seeds.
//
//   const P = new PotTrial(game, race)   (a mode's ruleset: the race calls plan, begin, update, result, stop)   POTS (the numbers)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { RW } from './track.js';

/** How many pots a lap, metres kept clear after the line and before it, the seconds one takes off, metres a pot is smashed from. */
export const POTS = { n: 30, clear: 70, off: 1, reach: 2.6, seed: 7, scale: 2 }; // (v204, the owner: "pots need to be 2x larger and more visible": scale, the look's own heights times it; reach 1.7 for a 1 m pot)

const rng = (seed) => () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

export class PotTrial {
  constructor(game, race) { this.game = game; this.race = race; this.pots = []; }
  begin(race) {
    const g = this.game, T = race.T, R = race.R, L = T.length, r = rng(POTS.seed + T.id.length * 131);
    this.stop(); this.smashed = 0;
    if (!this.geo) { this.geo = new THREE.CylinderGeometry(0.42 * POTS.scale, 0.3 * POTS.scale, 0.9 * POTS.scale, 10); this.geo.translate(0, 0.45 * POTS.scale, 0); this.mat = new THREE.MeshStandardMaterial({ color: 0xc9744a, roughness: 0.85, flatShading: true }); }
    this.mesh = new THREE.InstancedMesh(this.geo, this.mat, POTS.n); this.mesh.userData.zone = 'raceway'; this.mesh.frustumCulled = false;
    const m = new THREE.Matrix4();
    for (let k = 0; k < POTS.n; k++) {
      const s = T.line + POTS.clear + (k + r() * 0.6) * ((L - 2 * POTS.clear) / POTS.n), F = T.frame(s), lat = (r() * 2 - 1) * (F.w - 2);
      const x = RW.x + F.x - F.fz * lat, z = RW.z + F.z + F.fx * lat, y = R.rideHeight(x, z);
      this.pots.push({ x, y, z, up: true }); m.makeTranslation(x, y, z); this.mesh.setMatrixAt(k, m);
    }
    this.mesh.instanceMatrix.needsUpdate = true; g.scene.add(this.mesh);
  }
  update(race) {
    const g = this.game, P = g.player.pos; if (!this.mesh) return;
    for (let k = 0; k < this.pots.length; k++) {
      const p = this.pots[k]; if (!p.up || Math.abs(P.y - p.y) > 2.5 * POTS.scale || Math.hypot(P.x - p.x, P.z - p.z) > POTS.reach) continue;
      p.up = false; this.smashed++; this.mesh.setMatrixAt(k, new THREE.Matrix4().makeScale(0, 0, 0)); this.mesh.instanceMatrix.needsUpdate = true;
      const at = new THREE.Vector3(p.x, p.y + 0.5 * POTS.scale, p.z), S = g.techs?.active?.id === 'skiff' ? g.techs.active : null;
      g.fx?.impact?.(at, new THREE.Vector3(0, 1, 0), { sparks: 0, dust: 14 }); g.glyphs?.pop('star', at, { color: 0xffb37a, size: 0.6, burst: true });
      g.events?.emit('race.pot', { smashed: this.smashed, left: this.pots.length - this.smashed, speed: +(S?.speed || 0).toFixed(1), at: { x: +p.x.toFixed(1), y: +p.y.toFixed(1), z: +p.z.toFixed(1) }, by: 'courier' }); // (speed: the plume's size, Calissa's)
    }
  }
  /** The lap's time less a second a pot. */
  result(race, out) { out.raw = out.seconds; out.seconds = +Math.max(0, out.seconds - this.smashed * POTS.off).toFixed(2); out.pots = { smashed: this.smashed, of: this.pots.length }; }
  stop() { if (this.mesh) { this.mesh.removeFromParent(); this.mesh.dispose(); this.mesh = null; } this.pots = []; }
}
