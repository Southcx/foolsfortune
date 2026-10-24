// ---------------------------------------------------------------------------------------
// THE HAUNT MODE (docs/plans/TRACK-EDITOR.md 7; the owner, 2026-10-24: "the ability to take control of [traps] via Possession, ostensibly so
// other players could then use them to interfere with your run. Crawl used this to great effect"; bots for now): the clapperjars race your
// made track for three laps and you are the ghost: you possess its traps from above and spend them on the riders. LMB on a trap (or Space,
// the next ready trap ahead of the leader) fires it; Q and E choose the lane a pillar row rises in and the side a gust blows from. The haunt
// ends when the first rival finishes: HELD if its time is past the track's par (HAUNT.parK of its reference race: they were slowed enough),
// broken through if not; your wrecks counted either way (haunt.end).
// The camera hangs over the leader (cinema.shot, read every frame); the Courier stands by the start pillar, held, as in the editor.
//
// Prior art: Crawl (Powerhoof, 2017): the dead possess the dungeon's traps against the living hero; Dungeon Keeper's hand over the heroes;
// the house's own rivals (world/raceway/rivals.js) as the riders.
//
//   game.haunt = new Haunt(game)   .start() -> bool   .stop(why)   .on   .rivals   .wrecks   .update(dt)   HAUNT
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { RW } from './track.js';
import { LOT } from '../../progress/trackdef.js';

/** The haunt's numbers: laps; par as a share of the track's reference race (measured: the clapperjars unhindered finish near 0.80 of it,
 *  so a par of 0.9 asks for some ten real seconds of wrecks over three laps); the camera's height over the leader and its lean. */
export const HAUNT = { laps: 3, parK: 0.9, camH: 70, camBack: 38 };

export class Haunt {
  constructor(game) {
    this.game = game; this.on = false; this.wrecks = 0; this.lane = 1; this.dir = 1; this.ndc = null;
    game.events?.on('trap.hit', (e) => { if (this.on && e.by === 'courier' && e.target === 'rival') this.wrecks++; });
    game.events?.on('race.rival.finish', (e) => { if (this.on) this.finish(e); });
  }
  get R() { return this.game.raceway; }
  get rivals() { return this.game.race?.rivals; }

  /** Begin: the made track's rivals on its grid, the traps yours. False if there is no made track, or a race is under way. */
  start() {
    const g = this.game, R = this.R, T = R?.made?.T, Rv = this.rivals; if (!T || !Rv || g.race?.running || this.on) return false;
    this.on = true; this.wrecks = 0; this.t = 0;
    this.race = { state: 'run', running: true, lap: 1, t: 0, lapsTotal: HAUNT.laps, T };
    Rv.start(T, false, 'clapperjars'); Rv.meOf = () => Math.max(...Rv.list.map((r) => r.d)) - 25; // (no rider of yours: the pack banded round its leader)
    Rv.go(); R.traps.haunt('courier'); R.track = T;
    this.par = Math.round(R.made.ref * HAUNT.parK);
    const el = (this.canvas = g.renderer?.domElement);
    this.onMove = (e) => { this.ndc = { x: (e.clientX / innerWidth) * 2 - 1, y: -(e.clientY / innerHeight) * 2 + 1 }; };
    this.onDown = (e) => { if (e.button === 0 && this.on) this.click(); };
    el?.addEventListener('pointermove', this.onMove); el?.addEventListener('pointerdown', this.onDown);
    g.events?.emit('haunt.start', { traps: R.traps.list.length, by: 'courier' });
    return true;
  }
  stop(why = 'left') {
    if (!this.on) return; const g = this.game;
    this.on = false; this.rivals.meOf = null; this.rivals.stop(); this.R.traps.haunt(null); g.cinema?.unshot('haunt');
    this.canvas?.removeEventListener('pointermove', this.onMove); this.canvas?.removeEventListener('pointerdown', this.onDown);
    if (why !== 'done') g.events?.emit('haunt.end', { wrecks: this.wrecks, held: false, par: this.par, seconds: +this.t.toFixed(2), winner: 'no one', why, by: 'courier' });
  }
  finish(e) {
    const held = e.seconds > this.par;
    this.game.events?.emit('haunt.end', { wrecks: this.wrecks, held, par: this.par, seconds: e.seconds, winner: this.rivals?.list?.[e.rival]?.name || 'A rival', why: 'done', by: 'courier' });
    this.stop('done');
  }

  /** The cursor on the lot's floor (lot-local), from the mouse through the camera. */
  cursor() {
    const g = this.game, cam = g.camera; if (!this.ndc || !cam) return null;
    const ray = new THREE.Raycaster(); ray.setFromCamera(this.ndc, cam);
    const y = RW.y + LOT.y, d = ray.ray.direction; if (Math.abs(d.y) < 1e-4) return null;
    const k = (y - ray.ray.origin.y) / d.y; if (k < 0) return null;
    const p = ray.ray.origin.clone().addScaledVector(d, k); return { x: p.x - RW.x - LOT.x, z: p.z - RW.z - LOT.z };
  }
  click() { const c = this.cursor(); if (!c) return; const i = this.R.traps.nearest(c.x, c.z); if (i >= 0) this.R.traps.fire(i, { lane: this.lane, dir: this.dir }); }
  /** Space: the next ready trap ahead of the leader, within 150 m. */
  fireNext() {
    const R = this.R, T = R.made.T, L = T.length, lead = this.rivals.list.reduce((a, r) => (!a || r.d > a.d ? r : a), null); if (!lead) return;
    const s = ((lead.s % L) + L) % L; let best = -1, bg = 150;
    R.traps.list.forEach((Tp, i) => { const gap = ((Tp.s - s) % L + L) % L; if (gap < bg && Tp.clock?.ready && Tp.stun <= 0) { bg = gap; best = i; } });
    if (best >= 0) R.traps.fire(best, { lane: this.lane, dir: this.dir });
  }

  update(dt) {
    if (!this.on) return;
    const g = this.game, R = this.R, In = g.input, Rv = this.rivals; this.t += dt; this.race.t = this.t;
    if (!R.made.T || !R.active) { this.stop('left'); return; }
    if (In?.wasPressed('KeyQ')) { this.lane = Math.max(0, this.lane - 1); this.dir = -1; }
    if (In?.wasPressed('KeyE')) { this.lane = Math.min(2, this.lane + 1); this.dir = 1; }
    if (In?.wasPressed('Space')) this.fireNext();
    if (In?.wasPressed('Backspace')) { this.stop('retired'); return; }
    Rv.update(dt, this.race);
    // the camera over the leader, leaning back along its way
    const lead = Rv.list.reduce((a, r) => (!a || r.d > a.d ? r : a), null);
    if (lead?.group) { const p = lead.group.position, F = lead.F || R.made.T.frame(lead.s || 0); this.look = (this.look || p.clone()).lerp(p, Math.min(1, dt * 3)); this.pos = this.look.clone().add(new THREE.Vector3(-F.fx * HAUNT.camBack, HAUNT.camH, -F.fz * HAUNT.camBack)); g.cinema?.shot('haunt', { pos: this.pos, look: this.look, fov: 0, bars: 0, ease: 4 }); }
  }
}
