// ---------------------------------------------------------------------------------------
// THE HAUNT MODE (docs/plans/TRACK-EDITOR.md 7; the owner, 2026-10-24: "the ability to take control of [traps] via Possession, ostensibly so
// other players could then use them to interfere with your run. Crawl used this to great effect"; bots for now): the clapperjars race a
// track with traps (your made track, or a park track's own trap layout, set up only for this) for three laps and you are the ghost: you
// possess its traps from above and spend them on the riders. LMB on a trap (or Space,
// the next ready trap ahead of the leader) fires it; Q and E choose the lane a pillar row rises in and the side a gust blows from. The haunt
// ends when the first rival finishes: HELD if its time is past the track's par (HAUNT.parK of its reference race: they were slowed enough),
// broken through if not; your wrecks counted either way (haunt.end).
// The camera hangs over the leader (cinema.shot, read every frame); the Courier stands by the start pillar, held, as in the editor.
// A HAUNT IS KEPT (asynchronous play: Trackmania's ghosts, Dark Souls' messages, Mario Maker's shared levels): on a made track, every trap
// you fire is written down (the leader's lap, its metres short of the trap, your lane and side) and kept with the track (editor.js keepHaunt,
// the best by wrecks), so its share code carries it: whoever loads the code is haunted by you in its haunted race (traps.js 'recorded').
//
// Prior art: Crawl (Powerhoof, 2017): the dead possess the dungeon's traps against the living hero; Dungeon Keeper's hand over the heroes;
// the house's own rivals (world/raceway/rivals.js) as the riders.
//
//   game.haunt = new Haunt(game)   .start(trackId = 'made') -> bool   .stop(why)   .on   .rivals   .wrecks   .update(dt)   HAUNT
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { RW } from './track.js';
import { refLap } from '../../progress/skiffruler.js';

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

  /** Begin on a track with traps: its rivals on its grid, the traps yours. False if it has none, or a race is under way. */
  start(trackId = 'made') {
    const g = this.game, R = this.R, T = R?.trackOf(trackId), Rv = this.rivals; if (!T?.features?.traps?.length || !Rv || g.race?.running || this.on) return false;
    this.on = true; this.wrecks = 0; this.t = 0; this.fires = [];
    this.race = { state: 'run', running: true, lap: 1, t: 0, lapsTotal: HAUNT.laps, T };
    Rv.start(T, false, 'clapperjars'); Rv.meOf = () => Math.max(...Rv.list.map((r) => r.d)) - 25; // (no rider of yours: the pack banded round its leader)
    R.traps.use(T); Rv.go(); R.traps.haunt('courier'); R.track = T; this.T = T;
    this.par = Math.round(this.refOf(T) * HAUNT.parK);
    const el = (this.canvas = g.renderer?.domElement);
    this.onMove = (e) => { this.ndc = { x: (e.clientX / innerWidth) * 2 - 1, y: -(e.clientY / innerHeight) * 2 + 1 }; };
    this.onDown = (e) => { if (e.button === 0 && this.on) this.click(); };
    el?.addEventListener('pointermove', this.onMove); el?.addEventListener('pointerdown', this.onDown);
    g.events?.emit('haunt.start', { track: T.id, traps: R.traps.list.length, by: 'courier' });
    return true;
  }
  stop(why = 'left') {
    if (!this.on) return; const g = this.game;
    this.on = false; this.rivals.meOf = null; this.rivals.stop(); this.R.traps.haunt(null); this.R.traps.use(null); g.cinema?.unshot('haunt');
    this.canvas?.removeEventListener('pointermove', this.onMove); this.canvas?.removeEventListener('pointerdown', this.onDown);
    if (why !== 'done') g.events?.emit('haunt.end', { wrecks: this.wrecks, held: false, par: this.par, seconds: +this.t.toFixed(2), winner: 'no one', why, track: this.T?.id, by: 'courier' });
  }
  finish(e) {
    const held = e.seconds > this.par, kept = this.T.id === 'made' && !!this.game.trackEditor?.keepHaunt?.({ fires: this.fires, wrecks: this.wrecks, by: 'the maker' });
    this.game.events?.emit('haunt.end', { wrecks: this.wrecks, held, par: this.par, seconds: e.seconds, winner: this.rivals?.list?.[e.rival]?.name || 'A rival', why: 'done', track: this.T?.id, kept, by: 'courier' });
    this.stop('done');
  }
  /** A track's reference race (the ruler: progress/skiffruler.js), kept by its key: the made track's is already measured. */
  refOf(T) { if (T === this.R.made.T) return this.R.made.ref; (this.refs ||= {}); return (this.refs[T.key || T.id] ??= refLap(T, () => 1, { race: true }).seconds); }
  /** The cursor on the ground (park-local), from the mouse through the camera. */
  cursor() {
    const cam = this.game.camera; if (!this.ndc || !cam) return null;
    const ray = new THREE.Raycaster(); ray.setFromCamera(this.ndc, cam); return this.R.pick(ray.ray);
  }
  click() { const c = this.cursor(); if (!c) return; const i = this.R.traps.nearest(c.x, c.z); if (i >= 0) this.shoot(i); }
  /** A trap fired, and written down if it fired: which trap, the leader's lap, and how many metres short of the trap the leader was (the
   *  recorded haunt replays it against whoever races the track: traps.js 'recorded'). */
  shoot(i) {
    const R = this.R, T = this.T, L = T.length; if (!R.traps.fire(i, { lane: this.lane, dir: this.dir })) return false;
    const lead = this.rivals.list.reduce((a, r) => (!a || r.d > a.d ? r : a), null), Tp = R.traps.list[i]; if (!lead || !Tp) return true;
    const s = ((lead.s % L) + L) % L, gap = ((Tp.s - s) % L + L) % L, lap = Math.max(0, Math.min(HAUNT.laps - 1, Math.floor(Math.max(0, lead.d) / L)));
    if (gap < 200) this.fires.push([i, lap, +gap.toFixed(1), this.lane, this.dir]);
    return true;
  }
  /** Space: the next ready trap ahead of the leader, within 150 m. */
  fireNext() {
    const R = this.R, T = this.T, L = T.length, lead = this.rivals.list.reduce((a, r) => (!a || r.d > a.d ? r : a), null); if (!lead) return;
    const s = ((lead.s % L) + L) % L; let best = -1, bg = 150;
    R.traps.list.forEach((Tp, i) => { const gap = ((Tp.s - s) % L + L) % L; if (gap < bg && Tp.clock?.ready && Tp.stun <= 0) { bg = gap; best = i; } });
    if (best >= 0) this.shoot(best);
  }

  update(dt) {
    if (!this.on) return;
    const g = this.game, R = this.R, In = g.input, Rv = this.rivals; this.t += dt; this.race.t = this.t;
    if (!this.T || !R.active || (this.T.id === 'made' && this.T !== R.made.T)) { this.stop('left'); return; }
    if (In?.wasPressed('KeyQ')) { this.lane = Math.max(0, this.lane - 1); this.dir = -1; }
    if (In?.wasPressed('KeyE')) { this.lane = Math.min(2, this.lane + 1); this.dir = 1; }
    if (In?.wasPressed('Space')) this.fireNext();
    if (In?.wasPressed('Backspace')) { this.stop('retired'); return; }
    Rv.update(dt, this.race);
    // the camera over the leader, leaning back along its way
    const lead = Rv.list.reduce((a, r) => (!a || r.d > a.d ? r : a), null);
    if (lead?.group) { const p = lead.group.position, F = lead.F || this.T.frame(lead.s || 0); this.look = (this.look || p.clone()).lerp(p, Math.min(1, dt * 3)); this.pos = this.look.clone().add(new THREE.Vector3(-F.fx * HAUNT.camBack, HAUNT.camH, -F.fz * HAUNT.camBack)); g.cinema?.shot('haunt', { pos: this.pos, look: this.look, fov: 0, bars: 0, ease: 4 }); }
  }
}
