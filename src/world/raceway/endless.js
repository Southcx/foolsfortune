// ---------------------------------------------------------------------------------------
// THE ENDLESS RUN IN THE WORLD (G307; docs/plans/TRACK-EDITOR.md 10, W5; the rules progress/trackshelf.js): the shelf's tracks ridden one
// after another, each built on the lot (R.made.set) and ridden as one flying lap alone (the `endless` mode, modes.js) against a pace of
// the track's reference race for one lap; cleared or failed (too slow, or retired), the next after a breath. Three lives, one skip
// (`/endless skip`), the shelf's order shuffled once. Begun from the race board's BUILD tab (ENDLESS) or `/endless`, at the Raceway, with
// no race under way and the editor shut. Nothing is paid in cubes (a made track pays in records: the owner, 2026-10-24); the streak is
// the ledger's (tracking/trackeditor.js).
//
// Prior art: Super Mario Maker 2's Endless Challenge; progress/trackshelf.js.
//
//   game.endless = new Endless(game)   .start() -> bool   .stop(why)   .skip()   .run   .on   .update(dt)   /endless [skip | stop]
//   events: endless.start { tracks, by }, endless.track { name, grade, seconds, par, streak, by }, endless.fail { title, why, lives, by },
//   endless.skip { title, by }, endless.end { streak, why, by }
// ---------------------------------------------------------------------------------------
import { endlessStart, endlessCurrent, endlessStep, gradeOf } from '../../progress/trackshelf.js';
import { stream } from '../../core/rng.js';

const rand = stream('raceway/endless');
const BREATH = 2.5; // (real seconds between one track and the next)

export class Endless {
  constructor(game) {
    this.game = game; this.run = null; this.wait = 0; this.name = '';
    game.events?.on('race.finish', (e) => { if (this.run && e.mode === 'endless') this.result(e); });
    game.events?.on('race.end', (e) => { if (this.run && e.mode === 'endless' && !this.done) this.fail('retired'); });
    game.chat?.add('endless', { help: 'ride the shelf of tracks one after another: /endless, /endless skip, /endless stop', run: (a) => {
      if (a[0] === 'stop') return this.stop('stopped'); if (a[0] === 'skip') return this.skip(); this.start();
    } });
  }
  get on() { return !!this.run && !this.run.over; }
  say(text) { this.game.log?.say('warn', text, { key: 'endless.cmd', throttle: 1 }); return false; }

  start() {
    const g = this.game, R = g.raceway, S = g.trackShelf; if (this.on) return false;
    if (!R?.active) return this.say('You are not at the Raceway.'); if (g.race?.running) return this.say('A race is under way: /retire first.'); if (g.trackEditor?.active || g.haunt?.on) return this.say('Close the editor first.');
    this.run = endlessStart(S?.entries || [], rand); if (!this.run) return this.say('The shelf needs two tracks: load a track code in the editor, or shelve one of yours.');
    g.events?.emit('endless.start', { tracks: this.run.order.length, by: 'courier' }); return this.begin();
  }
  /** Build the current track on the lot and ride it. */
  begin() {
    const g = this.game, hash = endlessCurrent(this.run), def = g.trackShelf?.defOf(hash);
    if (!def) return this.finishRun('lost');
    const T = g.raceway.made.set(def); if (!T) { this.fail('unbuildable'); return false; }
    this.hash = hash; this.name = def.name; this.done = false; this.par = g.raceway.made.ref / 3;
    return g.race.start('made', { mode: 'endless', solo: true }) || this.finishRun('refused');
  }
  result(e) {
    this.done = true; const g = this.game, grade = gradeOf(e.seconds, this.par), name = this.name;
    if (!grade) return this.fail('slow', e.seconds);
    g.trackShelf?.note(this.hash, e.seconds);
    const r = endlessStep(this.run, { t: 'finish', grade }); this.run = r.run;
    g.events?.emit('endless.track', { title: name, grade, seconds: +e.seconds.toFixed(2), par: +this.par.toFixed(1), streak: this.run.streak, by: 'courier' });
    this.advance(r);
  }
  fail(why, seconds = 0) {
    this.done = true; const r = endlessStep(this.run, { t: 'fail' }); this.run = r.run;
    this.game.events?.emit('endless.fail', { title: this.name, why, lives: this.run.lives, by: 'courier' });
    this.advance(r);
  }
  skip() {
    if (!this.on) return this.say('No endless run.'); const r = endlessStep(this.run, { t: 'skip' }); if (r.run === this.run) return this.say('No skip left.');
    this.run = r.run; this.game.events?.emit('endless.skip', { title: this.name, by: 'courier' }); this.done = true; this.game.race?.end('skipped'); this.advance(r); return true;
  }
  advance(r) { if (r.ended) { this.finishRun(r.ended); return; } this.wait = BREATH; }
  finishRun(why) { const streak = this.run?.streak || 0; this.game.events?.emit('endless.end', { streak, why, by: 'courier' }); this.run = null; this.wait = 0; return false; }
  stop(why = 'stopped') { if (!this.run) return; this.done = true; if (this.game.race?.running) this.game.race.end('stopped'); this.finishRun(why); }
  update(dt) { if (this.on && this.wait > 0 && (this.wait -= dt) <= 0) this.begin(); }
}
