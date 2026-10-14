// ---------------------------------------------------------------------------------------
// THE CITY TRIAL (docs/plans/SKIFF-RACING.md section 12): Kirby Air Ride's, in the park. Begun at the race board: for a few real
// minutes the park is yours to roam, its tracks strewn with PATCHES (top speed, acceleration, grip, the pool, a banked flare); each one
// ridden over makes the board a little more that, for this trial only. When the clock runs out, the STADIUM: one event drawn at random
// (a race against the rivals on a drawn track, a hot lap, a pot smash or the escape), ridden on the board you built. Then the patches
// are gone. Its point is the roam: the park learned by hunting it, and a choice between the patch you can see and the one you want.
// Events (with `by`): citytrial.start, citytrial.clock { left }, citytrial.patch { kind, n }, citytrial.stadium { event, track },
// citytrial.end { why }. The patches' look is a placeholder (Calissa's: a spinning gem in its kind's colour).
//
// Prior art: Kirby Air Ride's City Trial (the roam, the patches, the drawn Stadium), Mario Kart's item boxes as a field to read,
// Burnout Paradise's open world as the lobby.
//
//   const C = new CityTrial(game, race)   C.start()   C.update(dt)   C.mult(key)   C.on   CITY, PATCHES (the numbers)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { RW } from './track.js';
import { stream } from '../../core/rng.js';

const cityRand = stream('citytrial'); // (the patches' places and the Stadium's draw: the session's seed)

/** Real seconds of the roam; patches strewn; metres one is taken from; the clock said at these real seconds left; the Stadium's draw. */
export const CITY = { roam: 150, patches: 48, reach: 2.4, said: [60, 30, 10], stadium: ['race', 'hotlap', 'pots', 'escape'] };
/** Each patch: its colour, and what one adds (a multiplier's share; the pool's gain; a banked flare's share). Labels: placeholders. */
export const PATCHES = {
  top: { colour: 0xff7a5a, add: 0.02 }, accel: { colour: 0xffd36b, add: 0.03 }, grip: { colour: 0x6ad0a0, add: 0.03 },
  pool: { colour: 0x7fdcff, gain: 20 }, flare: { colour: 0xffffff, stock: 0.5 },
};

export class CityTrial {
  constructor(game, race) {
    this.game = game; this.race = race; this.on = null; this.stacks = {};
    const done = (why) => { if (this.on?.stage === 'stadium') this.end(why); };
    game.events?.on('race.finish', (e) => { if (e.city) done('finish'); });
    game.events?.on('race.end', (e) => { if (e.city) done(e.why); });
  }
  /** The board's multiplier for one of its numbers, from the patches taken (1 when none, or no trial). */
  mult(key) { return this.on && PATCHES[key]?.add ? 1 + PATCHES[key].add * (this.stacks[key] || 0) : 1; }
  start() {
    const g = this.game, R = this.race.R; if (this.on || this.race.running || !R?.active) return false;
    this.on = { stage: 'roam', t: CITY.roam, said: new Set() }; this.stacks = {};
    this.strew(R);
    g.events?.emit('citytrial.start', { seconds: CITY.roam, by: 'courier' });
    return true;
  }
  /** The patches laid on the tracks' lines at random, each a kind at random. */
  strew(R) {
    const g = this.game, kinds = Object.keys(PATCHES), m = new THREE.Matrix4(), c = new THREE.Color();
    this.geo ||= new THREE.OctahedronGeometry(0.7);
    this.mesh = new THREE.InstancedMesh(this.geo, new THREE.MeshBasicMaterial({ color: 0xffffff }), CITY.patches); this.mesh.userData.zone = 'raceway'; this.mesh.frustumCulled = false;
    this.patches = [];
    for (let k = 0; k < CITY.patches; k++) {
      const T = R.tracks[k % R.tracks.length], F = T.frame(cityRand() * T.length), lat = (cityRand() * 2 - 1) * (F.w - 2);
      const x = RW.x + F.x - F.fz * lat, z = RW.z + F.z + F.fx * lat, y = R.rideHeight(x, z) + 1.2, kind = kinds[k % kinds.length];
      this.patches.push({ x, y, z, kind, up: true }); m.makeTranslation(x, y, z); this.mesh.setMatrixAt(k, m); this.mesh.setColorAt(k, c.set(PATCHES[kind].colour));
    }
    this.mesh.instanceMatrix.needsUpdate = true; this.mesh.instanceColor.needsUpdate = true; g.scene.add(this.mesh);
  }
  update(dt) {
    const K = this.on, g = this.game; if (!K) return;
    if (!this.race.R?.active) { this.end('left'); return; }
    if (K.stage !== 'roam') return;
    K.t -= dt;
    for (const s of CITY.said) if (K.t <= s && !K.said.has(s)) { K.said.add(s); g.events?.emit('citytrial.clock', { left: s, by: 'courier' }); }
    this.take();
    if (K.t <= 0) this.stadium();
  }
  /** A patch ridden over: taken, its kind's share added. */
  take() {
    const g = this.game, P = g.player.pos, S = g.techs?.active?.id === 'skiff' ? g.techs.active : null; if (!S || !this.mesh) return;
    for (let k = 0; k < this.patches.length; k++) {
      const p = this.patches[k]; if (!p.up || Math.abs(P.y - p.y) > 3 || Math.hypot(P.x - p.x, P.z - p.z) > CITY.reach) continue;
      p.up = false; this.mesh.setMatrixAt(k, new THREE.Matrix4().makeScale(0, 0, 0)); this.mesh.instanceMatrix.needsUpdate = true;
      const D = PATCHES[p.kind]; this.stacks[p.kind] = (this.stacks[p.kind] || 0) + 1;
      if (D.gain) g.lachryma?.gain(D.gain, 'patch');
      if (D.stock && S.combo) S.combo.stocks = Math.min(3, S.combo.stocks + D.stock);
      g.glyphs?.pop('star', new THREE.Vector3(p.x, p.y, p.z), { color: D.colour, size: 0.6, burst: true });
      g.events?.emit('citytrial.patch', { kind: p.kind, n: this.stacks[p.kind], by: 'courier' });
    }
  }
  /** The roam over: the patches cleared from the park, one event drawn and begun on the board as built. */
  stadium() {
    const K = this.on, g = this.game, R = this.race.R; K.stage = 'stadium';
    if (this.mesh) { this.mesh.removeFromParent(); this.mesh.dispose(); this.mesh = null; }
    const event = CITY.stadium[Math.floor(cityRand() * CITY.stadium.length)], track = event === 'escape' ? 'gorge' : R.tracks[Math.floor(cityRand() * R.tracks.length)].id;
    g.events?.emit('citytrial.stadium', { event, track, by: 'courier' });
    if (!this.race.start(track, { mode: event, city: true })) this.end('stadium');
  }
  end(why) {
    const K = this.on; if (!K) return; this.on = null; this.stacks = {};
    if (this.mesh) { this.mesh.removeFromParent(); this.mesh.dispose(); this.mesh = null; }
    this.game.events?.emit('citytrial.end', { why, by: 'courier' });
  }
}
