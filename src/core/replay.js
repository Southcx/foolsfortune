// ---------------------------------------------------------------------------------------
// THE REPLAY (docs/plans/COOP.md, C2): what was pressed, a tick at a time, so a session can be played again and come out the same.
// A REPLAY is a header (the build, the seed the session was reseeded with when play began, the save as it was then, where the Courier
// stood, the game clock, the window's size) and the FRAMES: for each tick, its dt and the input as the tick read it (the keys that
// went down and came up, the presses, the look, the wheel, the cursor), each one only what changed, and the DEEDS done before it. Played back, each tick's input is
// replaced by the recorded one and its dt by the recorded dt; the simulation's chance (core/rng.js) does the rest. A replay is exact
// from the start of play; begun mid-session (`/record`) it restores what is kept and where the Courier stood, not the world's loose
// state (a pot already broken is whole again), and says so in its header.
//
// Prior art: Doom's and Quake's demo files (input per tic, from a known state: the cheapest exact replay), the input-recording replays
// of fighting games and RTSs (StarCraft's, Age of Empires' lockstep: the same input and the same seed give the same game), and
// Factorio's replays, which, like this one, are only as good as the simulation's determinism.
//
//   const replay = new Replay(input)   replay.begin(header)   dt = replay.frame(dt) (main.js, each tick, before anything reads the input)
//   replay.text() -> the file    replay.play(text) -> header (frames fed from the next tick)    .recording .playing .began .ended .full
//   replay.deed(name, fn)   replay.perform(name, ...args) -> what fn gave (a change not made through the input, kept with the frames)
// ---------------------------------------------------------------------------------------
const MAX = 60 * 60 * 20; // (twenty minutes at 60 frames a second: past it the recording stops, and the file says it is full)

export class Replay {
  constructor(input) {
    this.input = input;
    this.header = null;
    this.frames = [];
    this.recording = false; this.playing = false; this.began = false; this.ended = false; this.full = false;
    this.prev = { dt: null, down: new Set(), mx: null, my: null };
    this.i = 0;
    this.onEnd = null;
    this.deeds = new Map(); this.queued = []; // (what changes the game without the input: an agent's turn or travel, kept in the frames)
  }

  /** A DEED: something that changes the game other than through the input (an agent turning, travelling, saying). Registered once by
   *  name, at boot (a page playing a replay must know it); `perform` does it now and keeps it for the next frame, and playback does it
   *  again at the same point. Arguments are plain data. */
  deed(name, fn) { if (!this.deeds.has(name)) this.deeds.set(name, fn); }
  perform(name, ...args) {
    if (!this.began) this.starting?.(); // (a deed before the first tick: the recording begins with it, not after it)
    if (this.playing) return undefined; // (the replay says what happens now)
    if (this.recording) this.queued.push([name, ...args]);
    return this.deeds.get(name)?.(...args);
  }

  /** Recording from now: the header is what the game was when it began (main.js gathers it). */
  begin(header) {
    this.header = { v: 1, ...header };
    this.frames = []; this.prev = { dt: null, down: new Set(), mx: null, my: null };
    this.recording = true; this.playing = false; this.began = true; this.full = false; this.ended = false;
  }

  /** Each tick, before anything reads the input: recorded, or replaced by the recording. The dt this tick runs on. */
  frame(dt) {
    if (this.playing) return this.feed(dt);
    if (!this.recording) return dt;
    if (this.frames.length >= MAX) { this.recording = false; this.full = true; return dt; }
    const I = this.input, P = this.prev, f = {};
    if (this.queued.length) { f.do = this.queued; this.queued = []; }
    if (dt !== P.dt) { f.d = dt; P.dt = dt; }
    const add = [...I.down].filter((k) => !P.down.has(k)), rem = [...P.down].filter((k) => !I.down.has(k));
    if (add.length) f['+'] = add;
    if (rem.length) f['-'] = rem;
    if (add.length || rem.length) P.down = new Set(I.down);
    if (I.pressed.size) f.p = [...I.pressed];
    if (I.dx) f.x = I.dx;
    if (I.dy) f.y = I.dy;
    if (I.wheel) f.w = I.wheel;
    if (I.mx !== P.mx || I.my !== P.my) { f.m = [I.mx, I.my]; P.mx = I.mx; P.my = I.my; }
    this.frames.push(f);
    return dt;
  }

  feed(dt) {
    const f = this.frames[this.i++], I = this.input, P = this.prev;
    if (!f) { this.playing = false; this.ended = true; this.onEnd?.(this.header); return dt; }
    if (f.d != null) P.dt = f.d;
    for (const [name, ...args] of f.do || []) this.deeds.get(name)?.(...args);
    for (const k of f['+'] || []) P.down.add(k);
    for (const k of f['-'] || []) P.down.delete(k);
    I.down = new Set(P.down); I.pressed = new Set(f.p || []);
    I.dx = f.x || 0; I.dy = f.y || 0; I.wheel = f.w || 0;
    if (f.m) { I.mx = f.m[0]; I.my = f.m[1]; }
    return P.dt ?? dt;
  }

  /** The file: the header and the frames, as one text. */
  text() { return JSON.stringify({ ...this.header, full: this.full, frames: this.frames }); }

  /** Play a file from the next tick (the save it names must already be in place: main.js reloads the page for it). */
  play(text) {
    const r = typeof text === 'string' ? JSON.parse(text) : text;
    if (!r?.frames || r.v !== 1) throw new Error('replay: not a replay');
    const { frames, ...header } = r;
    this.header = header; this.frames = frames; this.i = 0;
    this.prev = { dt: null, down: new Set(), mx: null, my: null };
    this.playing = true; this.recording = false; this.began = true; this.ended = false;
    return header;
  }
  get length() { return this.frames.length; }
  get at() { return this.i; }
}
