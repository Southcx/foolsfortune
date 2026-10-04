// ---------------------------------------------------------------------------------------
// THE RHYTHM MODE (game.rhythm): the soundtrack played as a rhythm game on the Crucibelle's ten notes. A track's note chart
// (rhythm/chart.js) is drawn from its own score; the backing (the score with the lead taken out) plays on an arranger of its own, a
// bar of clicks first; the player plays the lead on keys 1 to 0, and each hit sounds the true note on its own instrument (a sax hit
// is the sax), so a good run plays the song and a miss leaves a hole in the tune. A press with no note near plays its lane's note
// softly on the lead (the Crucibelle's pentatonic: nothing is wrong, only unasked). Judging is on the audio clock: a key's time is
// the event's own timestamp carried onto the audio clock at the moment the speakers are playing (getOutputTimestamp), so the output's
// latency is already in it; `offset` (ms, kept) moves the judging for a slow screen or a far speaker.
//
// It is begun from a stage in a room (begin(track, level)), never a key; Esc ends it early. While it plays it has the digit keys (the
// field's tools do not see them) and the place's music stands aside (music/choose.js). The field's Crucibelle stays improvisation.
// What happened is an event: rhythm.start, rhythm.score { track, title, level, accuracy, combo, perfect, great, good, miss, full, by }
// (a finished song), rhythm.quit { track, title, level, by }.
//
// Prior art: StepMania and DDR (a chart per song, three levels of it), Guitar Hero and Rock Band (you play the lead; a miss drops it
// from the mix), Rhythm Heaven's and Patapon's "the sound is the feedback", and Chris Wilson's "A Tale of Two Clocks".
//
//   game.rhythm = new Rhythm(game)   game.rhythm.begin('wanda', 'steady')   game.rhythm.active   game.rhythm.end()   game.rhythm.offset
//   game.rhythm.press(lane, audioTime) (what a key calls; a script can too)   TRACKS: the playable tracks (the sound test's, arranged)
// ---------------------------------------------------------------------------------------
import { Arranger } from '../arranger.js';
import { TRACKS as ALL } from '../soundtest.js';
import { noteChart, KEYS } from './chart.js';
import { Judge } from './judge.js';
import { Highway } from './highway.js';
import { sfx } from '../../audio/sfx.js';

export const TRACKS = ALL.filter((T) => T.score.arrange);
const KEY = 'foolsfortune.rhythm.v1';
const SLACK = 0.15; // (a note is called missed this long after its window shuts: a press caught behind a slow frame is still judged on its own time)
const LEAD_IN = 0.15; // (the arranger starts its first bar this far ahead of the clock: arranger.js play)

export class Rhythm {
  constructor(game) {
    this.game = game; this.active = false; this.highway = new Highway(); this.offset = 0; this.turn = -1;
    try { this.offset = +(JSON.parse(localStorage.getItem(KEY) || '{}').offset || 0); } catch { /* none kept */ }
    this.onKey = (e) => this.key(e);
  }
  get ctx() { return sfx.ctx; }
  setOffset(ms) { this.offset = ms; try { localStorage.setItem(KEY, JSON.stringify({ offset: ms })); } catch { /* this session */ } }

  /** Begin a track (an id of TRACKS; none: the next in the list) at a level (light, steady, full). False if it cannot. */
  begin(track = null, level = 'steady') {
    if (this.active || !sfx.ok?.()) return false;
    const T = TRACKS.find((x) => x.id === track) || TRACKS[(this.turn = (this.turn + 1) % TRACKS.length)];
    const chart = noteChart(T.score, { level });
    if (!chart.notes.length) return false;
    if (this.game.music) this.game.music.pick = null; // (a sound-test pick gives way too)
    this.T = T; this.chart = chart; this.level = chart.level; this.judge = new Judge(chart.notes);
    this.arr = new Arranger(sfx); this.arr.jitter = 0; this.arr.volume = 0.36;
    this.t0 = this.ctx.currentTime + LEAD_IN; // (the chart's zero on the audio clock: the count-in's first click)
    this.arr.play(chart.backing); this.t0 = this.arr.started ?? this.t0;
    this.active = true; this.finished = false; this.lastSweep = 0;
    addEventListener('keydown', this.onKey, true); // (capture: ahead of the field's input, which never sees the digits)
    this.highway.show({ notes: this.judge.notes });
    this.frame = requestAnimationFrame(() => this.tick());
    this.game.events?.emit('rhythm.start', { track: T.id, title: T.title, level: this.level, notes: chart.notes.length, by: 'courier' });
    return true;
  }
  /** End it: finished (the song played out) or quit early. */
  end(finished = false) {
    if (!this.active) return;
    this.active = false; cancelAnimationFrame(this.frame);
    removeEventListener('keydown', this.onKey, true);
    this.arr.stop(finished ? 2 : 0.6); this.highway.hide();
    const J = this.judge, ev = { track: this.T.id, title: this.T.title, level: this.level, by: 'courier' };
    if (finished) this.game.events?.emit('rhythm.score', { ...ev, accuracy: J.accuracy, combo: J.best, ...J.counts, full: J.counts.miss === 0 });
    else this.game.events?.emit('rhythm.quit', ev);
  }

  /** The chart's clock now (seconds from the count-in's first click), as the speakers are playing it. */
  now() { return this.heard(performance.now()); }
  /** A moment on the page's clock (performance.now, an event's timeStamp), carried onto the chart's clock. */
  heard(ms) {
    const c = this.ctx, o = c.getOutputTimestamp?.();
    const audio = o && o.performanceTime > 0 ? o.contextTime + (ms - o.performanceTime) / 1000 : c.currentTime - (c.outputLatency || c.baseLatency || 0) + (ms - performance.now()) / 1000;
    return audio - this.t0 - this.offset / 1000;
  }
  key(e) {
    if (e.code === 'Escape') { e.stopPropagation(); e.preventDefault(); this.end(false); return; }
    const lane = KEYS.indexOf(e.code); if (lane < 0) return;
    e.stopPropagation(); e.preventDefault();
    if (!e.repeat) this.press(lane, this.heard(e.timeStamp));
  }
  /** A press in a lane at chart time t: judged, and the note sounded (the true one, or the lane's own, softly). */
  press(lane, t = this.now()) {
    if (!this.active) return null;
    const r = this.judge.press(lane, t);
    const A = this.arr, at = this.ctx.currentTime + 0.005;
    if (r) {
      const n = r.note, w = r.grade === 'perfect' ? 1 : r.grade === 'great' ? 0.9 : 0.75;
      A.play1({ i: n.i, b: 0, d: n.d / A.spb, n: n.midi, v: n.v * w, o: n.o }, at, n.g);
      this.highway.hit(lane, r.grade);
    } else {
      const n = this.nearest(lane);
      if (n) A.play1({ i: n.i, b: 0, d: 0.5, n: n.midi, v: n.v * 0.35, o: n.o }, at, n.g);
    }
    return r;
  }
  /** The lane's note nearest in time (a stray press plays it). */
  nearest(lane) {
    let best = null, bd = 1e9; const t = this.now();
    for (const n of this.judge.byLane[lane]) { const d = Math.abs(n.t - t); if (d < bd) { bd = d; best = n; } else if (n.t > t) break; }
    return best;
  }
  tick() {
    if (!this.active) return;
    const t = this.now(), J = this.judge;
    for (const n of J.sweep(t - SLACK)) this.highway.hit(n.lane, 'miss');
    const dt = Math.min(0.1, Math.max(0, t - this.lastSweep)); this.lastSweep = t;
    this.highway.draw(t, { combo: J.combo, progress: t / this.chart.length, dt });
    if (t > this.chart.length + 0.5) { this.end(true); return; } // (the song's last bar played out)
    this.frame = requestAnimationFrame(() => this.tick());
  }
}
