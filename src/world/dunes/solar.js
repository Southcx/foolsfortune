// ---------------------------------------------------------------------------------------
// THE SOLAR SKIFFING TRIAL: rings of light across the Dunes, charged by the sun, raced against the Gnomon's shadow (docs/plans/
// DUNEMAW-SYSTEMS.md section 4; the numbers are Dovina's, progress/combat/dunemaw.js SOLAR; the Gnomon is Espada's: the trial begins at
// its foot). F there by day begins it; at night the Gnomon casts no shadow and it is closed. Twenty-four rings stand on a loop round the
// Gnomon's side of the oasis, the same all game day (seeded by it). A ring the sun reaches is LIT; one in a dune's shadow (the sun low,
// at dawn and dusk) or dimmed by the weather is DARK, and costs and pays nothing. Through the lit ones in order on the skiff; a lit ring
// passed by costs two seconds. The shadow sweeps the dial in 90 real seconds: the clock. Through the last ring, the time is said in
// the log and a medal is had (gold 60, silver 72, bronze 85: Petra measures the line, and they move with it); each medal pays once,
// ever (a trial is a test, not a farm). Leaving the Dunes ends it. The rings' look is Calissa's (vfx/solarring.js).
// Events (each with `by`): trial.solar.start { lit }, trial.solar { seconds, taken, lit, phase, medal }, trial.solar.end { why }.
//
// Prior art: Pilotwings' and Wave Race's rings (a line through gates against a clock), Wind Waker's sailing, the sundial (the shadow is
// the clock), and Mario Kart's time trials (a medal is a test passed once, not a reward farmed).
//
//   game.solar = new SolarTrial(game)   .offer() -> { pos, d } | null   .start()   .update(dt)   .running   .parked() (for the warm-up)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { SOLAR, medalOf, litRing } from '../../progress/combat/dunemaw.js';
import { SolarRing } from '../../vfx/solarring.js';
import { phaseAt, clockAt } from '../../progress/weather.js';
import { ECON } from '../../progress/econ/table.js';
import { today } from '../../core/calendar.js';
import { seeded } from '../../core/rng.js';
import { DUNE } from './dunes.js';

const LOOP = { r: 170, wobble: 30, lift: 3, ring: 3.2, foot: 26 }; // (the loop's radius and seeded wobble in metres, a ring's height over the sand and radius; F within 26 m of the Gnomon's middle)
const PAY = { gold: 3, silver: 6, bronze: 10 }; // (minutes of play each medal pays, once ever: the spec's 3, 6 and 10)

export class SolarTrial {
  constructor(game) {
    this.game = game; this.running = false; this.rings = []; this.built = -1;
    game.interact?.add('solar', () => (game.dialogue?.open ? null : this.offer())); // (F at the Gnomon's foot: the chevron's id 'solar')
  }
  get dunes() { return this.game.dunes; }

  /** The course for a game day: 24 points on a loop beside the Gnomon, toward the oasis, each a ring facing along the loop. */
  course(day = today()) {
    const D = this.dunes, G = D?.gnomon; if (!G) return [];
    const r = seeded((day * 2654435761) >>> 0), toward = new THREE.Vector3(DUNE.x, 0, DUNE.z).sub(new THREE.Vector3(G.x, 0, G.z)).normalize(); // (toward the oasis)
    const c = new THREE.Vector3(G.x, 0, G.z).addScaledVector(toward, LOOP.r + 30), a0 = Math.atan2(G.x - c.x, G.z - c.z), pts = [];
    for (let i = 0; i < SOLAR.rings; i++) {
      const a = a0 + ((i + 0.5) / SOLAR.rings) * Math.PI * 2, rr = LOOP.r + (r() - 0.5) * 2 * LOOP.wobble;
      const x = c.x + Math.sin(a) * rr, z = c.z + Math.cos(a) * rr;
      pts.push(new THREE.Vector3(x, D.heightAt(x, z) + LOOP.lift, z));
    }
    return pts.map((p, i) => ({ pos: p, dir: pts[(i + 1) % pts.length].clone().sub(pts[(i + SOLAR.rings - 1) % pts.length]).setY(0).normalize() }));
  }
  build() {
    const day = today(); if (this.built === day && this.rings.length) return;
    for (const R of this.rings) { this.game.scene.remove(R.look.group); R.look.dispose?.(); }
    this.rings = this.course(day).map((c) => {
      const look = new SolarRing({ radius: LOOP.ring }); look.group.position.copy(c.pos); look.group.lookAt(c.pos.clone().add(c.dir)); look.group.visible = false; look.group.userData.zone = 'dunes';
      this.game.scene.add(look.group); return { ...c, look, lit: false, taken: false };
    });
    this.built = day;
  }
  parked() { const R = new SolarRing({ radius: LOOP.ring }); R.set({ lit: true, next: true }); this.game.scene.add(R.group); return [R.group]; }

  /** The sun's direction now (from the hour: up in the east at dawn, high at noon, down in the west at dusk). */
  sun() {
    const { hour = 12, minute = 0 } = clockAt() || {}, h = hour + minute / 60, k = THREE.MathUtils.clamp((h - 6) / 12, 0, 1);
    const elev = Math.sin(k * Math.PI) * (Math.PI / 3), az = Math.PI * (0.5 - k);
    return new THREE.Vector3(Math.cos(elev) * Math.sin(az), Math.sin(elev), Math.cos(elev) * Math.cos(az)).normalize();
  }
  /** Is a ring in a dune's shadow: the sand rises above the line from it toward the sun, within 300 m? */
  shaded(p, sun) {
    for (let d = 8; d < 300; d += 8) { const x = p.x + sun.x * d, z = p.z + sun.z * d; if (this.dunes.heightAt(x, z) > p.y + sun.y * d) return true; }
    return false;
  }

  offer() {
    const G = this.dunes?.gnomon, P = this.game.player; if (!G || this.running || !this.dunes.active) return null;
    const d = Math.hypot(P.pos.x - G.x, P.pos.z - G.z); return d < LOOP.foot ? { pos: G.clone().setY(P.pos.y + 2.4), d } : null;
  }
  start() {
    const g = this.game, phase = phaseAt();
    if (phase === 'night') { g.log?.say('warn', 'The Gnomon casts no shadow at night. The trial is closed.', { key: 'solar.night', throttle: 3 }); return false; }
    this.build();
    const sun = this.sun(), aspect = g.weather?.now?.aspect ?? g.weather?.aspect ?? null;
    for (const R of this.rings) { R.lit = litRing(true, this.shaded(R.pos, sun), aspect); R.taken = false; R.look.group.visible = true; R.look.set({ lit: R.lit }); }
    this.running = true; this.t = 0; this.next = 0; this.missed = 0; this.phase = phase;
    this.lit = this.rings.filter((R) => R.lit).length;
    this.prev = g.player.pos.clone();
    g.events?.emit('trial.solar.start', { lit: this.lit, by: 'courier' });
    this.mark();
    return true;
  }
  /** The next lit ring glows as the one to make for. */
  mark() { const n = this.rings.findIndex((R, i) => i >= this.next && R.lit); this.rings.forEach((R, i) => R.look.set({ lit: R.lit, next: i === n })); }

  update(dt) {
    const raw = this.game.rawDt ?? dt, it = this.game.interact?.cur, PL = this.game.player;
    if (it?.id === 'solar' && PL.peekLatch?.('KeyF') && !this.game.god?.controlling) { PL.latch('KeyF'); this.start(); }
    for (const R of this.rings) if (R.look.group.visible) R.look.update(raw);
    if (!this.running) return;
    const g = this.game, P = g.player.pos;
    this.t += dt;
    if (!this.dunes.active) { this.end('left'); return; }
    // through a ring: the segment since last step crosses its plane inside it
    for (let i = this.next; i < this.rings.length; i++) {
      const R = this.rings[i], a = this.prev.clone().sub(R.pos).dot(R.dir), b = P.clone().sub(R.pos).dot(R.dir);
      if (a > 0 || b < 0) continue;
      const k = a / (a - b), at = this.prev.clone().lerp(P, k);
      if (at.distanceTo(R.pos) > LOOP.ring) continue;
      for (let j = this.next; j < i; j++) if (this.rings[j].lit && !this.rings[j].taken) this.missed++; // (a lit ring passed by: two seconds)
      if (R.lit) { R.taken = true; R.look.pass(); }
      this.next = i + 1; this.mark();
      break;
    }
    this.prev.copy(P);
    if (this.next >= this.rings.length) this.finish();
    else if (this.t >= SOLAR.limit) this.end('time');
  }
  finish() {
    const g = this.game, L = g.ledger, taken = this.rings.filter((R) => R.taken).length;
    const seconds = +(this.t + this.missed * SOLAR.missed).toFixed(1), medal = medalOf(seconds);
    const first = medal && !(L?.get?.(`trial.solar.${medal}`) > 0); // (each medal pays once, ever: the ledger counts it as the event lands)
    g.events?.emit('trial.solar', { seconds, taken, lit: this.lit, phase: this.phase, medal, by: 'courier' });
    if (first) g.cubes?.earn(Math.round(PAY[medal] * ECON.perMinute), 'trial');
    this.end('done');
  }
  end(why) {
    this.running = false;
    for (const R of this.rings) R.look.group.visible = false;
    if (why !== 'done') this.game.events?.emit('trial.solar.end', { why, by: 'courier' });
  }
}
