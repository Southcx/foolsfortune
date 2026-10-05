import * as THREE from 'three';
import { T } from '../../core/config.js';
import { sfx } from '../../audio/sfx.js';
import { inSiege } from './siege.js';
import { stream } from '../../core/rng.js';
const simRand = stream('world/basement/raids'); // (the simulation's chance: core/rng.js, the same twice)

// ---------------------------------------------------------------------------------------
// RAIDS: waves of crimson clapperjars that make for the jar while you are the god hand. They are
// a mode of one room now, THE SIEGE (siege.js), and nothing else: outside it the timer does not run
// and nothing spawns, so the hand can be used, learned and tested in peace. Kept apart from the
// hand itself (godhand/godhand.js) on purpose: the jar only knows how to be hurt (`hitJar`,
// `raidStrike`), and this module only knows how to send the attackers, so raids can be reworked,
// moved, or dropped without touching either.
// ---------------------------------------------------------------------------------------
const DOWN = new THREE.Vector3(0, -1, 0);

export class Raids {
  constructor(game, god) {
    this.game = game; this.god = god;
    this.t = T.god.firstWave; this.wave = 0; this.alive = 0;
  }

  /** Raids run only when the jar stands in the Siege room. */
  get here() { return inSiege(this.god.jar.pos); }

  reset() { this.t = T.god.firstWave; this.wave = 0; this.alive = 0; }

  status() { return this.here ? `raid ${this.wave} · next in ${Math.max(0, Math.ceil(this.t))} s · ${this.alive} raiders · ` : ''; }

  update(dt) {
    const g = this.game, god = this.god, V = god.jar;
    if (god.state !== 'on' || !V.alive) return;
    if (!this.here) {
      // (anything still coming is called off; the clock starts over when the jar is back here)
      if (this.alive > 0) for (const c of g.clappers.list) if (c.alive && c.raider) g.clappers.dismiss(c);
      this.alive = 0; this.t = T.god.firstWave; this.wave = 0;
      return;
    }
    const alive = g.clappers.list.filter((c) => c.alive && c.raider).length;
    if (this.alive > 0 && alive === 0 && this.wave > 0) this.cleared();
    this.alive = alive;
    this.t -= dt;
    if (this.t <= 0) { this.spawn(); this.t = T.god.waveEvery; }
  }

  spawn() {
    const g = this.game, V = this.god.jar;
    const n = Math.min(9, T.god.waveBase + this.wave * T.god.waveGrow);
    this.wave++;
    let made = 0;
    for (let i = 0; i < n * 3 && made < n; i++) {
      const a = simRand() * Math.PI * 2, r = 8 + simRand() * 6;
      const x = V.pos.x + Math.sin(a) * r, z = V.pos.z + Math.cos(a) * r;
      const down = g.physics.raycast({ x, y: V.pos.y + 2.5, z }, DOWN, 5, g.player.collider, undefined, (c) => !c.isSensor() && !c.parent()?.isDynamic());
      if (!down || Math.abs(down.point.y - V.pos.y) > 0.7 || down.normal.y < 0.85) continue;
      const from = { x: V.pos.x, y: V.pos.y + 0.6, z: V.pos.z }, to = new THREE.Vector3(x, V.pos.y + 0.6, z);
      const dir = to.clone().sub(new THREE.Vector3(from.x, from.y, from.z)), len = dir.length();
      const los = g.physics.raycast(from, dir.divideScalar(len), len - 0.3, g.player.collider, undefined, (c) => !c.isSensor() && !c.parent()?.isDynamic());
      if (los) continue;
      const fi = Math.max(0, g.clappers.floors.findIndex((f) => Math.abs(V.pos.y - f.y) < 0.9));
      const c = g.clappers.spawn(new THREE.Vector3(x, down.point.y, z), true, fi);
      c.cool = 0;
      c.raider = true; c.strikes = 0; c.state = 'raid'; c.killY = V.pos.y - 14;
      c.mat.color.set(0x5a2118); c.mat.emissive.set(0xff3a1a); c.mat.emissiveIntensity = 0.55;
      made++;
    }
    if (made) {
      sfx.thump();
      g.events?.emit('god.raid', { wave: this.wave, n: made });
    }
  }

  cleared() {
    const g = this.game;
    // a gift of Lachryma, and the jar takes a breath
    g.lachryma.gain(30, 'wave');
    this.god.mendJar(8);
    sfx.reforge();
    g.events?.emit('god.wave', { wave: this.wave });
  }
}
