import * as THREE from 'three';
import { T } from './config.js';
import { sfx } from './audio.js';
import { inSiege } from './siege.js';

// ---------------------------------------------------------------------------------------
// RAIDS: waves of crimson clapperjars that make for the vessel while you are the god hand. They are
// a mode of one room now, THE SIEGE (siege.js), and nothing else: outside it the timer does not run
// and nothing spawns, so the hand can be used, learned and tested in peace. Kept apart from the
// hand itself (godmode.js) on purpose: the vessel only knows how to be hurt (`hitVessel`,
// `raidStrike`), and this module only knows how to send the attackers, so raids can be reworked,
// moved, or dropped without touching either.
// ---------------------------------------------------------------------------------------
const DOWN = new THREE.Vector3(0, -1, 0);

export class Raids {
  constructor(game, god) {
    this.game = game; this.god = god;
    this.t = T.god.firstWave; this.wave = 0; this.alive = 0; this.banner = 0;
  }

  /** Raids run only when the vessel stands in the Siege room. */
  get here() { return inSiege(this.god.vessel.pos); }

  reset() { this.t = T.god.firstWave; this.wave = 0; this.alive = 0; this.banner = 0; }

  status() { return this.here ? `raid ${this.wave} · next in ${Math.max(0, Math.ceil(this.t))} s · ${this.alive} raiders · ` : ''; }

  update(dt) {
    const g = this.game, god = this.god, V = god.vessel;
    if (god.state !== 'on' || !V.alive) return;
    this.banner = Math.max(0, this.banner - dt);
    god.el.banner.classList.toggle('on', this.banner > 0);
    if (!this.here) {
      // (anything still coming is called off; the clock starts over when the vessel is back here)
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
    const g = this.game, V = this.god.vessel;
    const n = Math.min(9, T.god.waveBase + this.wave * T.god.waveGrow);
    this.wave++;
    let made = 0;
    for (let i = 0; i < n * 3 && made < n; i++) {
      const a = Math.random() * Math.PI * 2, r = 8 + Math.random() * 6;
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
      this.banner = 2.2;
      this.god.el.banner.textContent = `RAID ${this.wave}`;
      sfx.thump();
      g.events?.emit('god.raid', { wave: this.wave, n: made });
    }
  }

  cleared() {
    const g = this.game;
    this.banner = 1.8;
    this.god.el.banner.textContent = 'WAVE CLEARED';
    // a gift of Lachryma, and the vessel takes a breath
    g.lachryma.gain(30, 'wave');
    this.god.mendVessel(8);
    sfx.reforge();
    g.events?.emit('god.wave', { wave: this.wave });
  }
}
