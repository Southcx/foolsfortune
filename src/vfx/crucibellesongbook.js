// ---------------------------------------------------------------------------------------
// THE CRUCIBELLE'S SONGBOOK (plain name; South, 2026-11-23: "overhaul the Crucibelle UI when equipped? The metronome looks good but it
// uses the same compass UI that the Dreamvane has instead of something more useful for music or the spellcasting via notes"). The
// Crucibelle's own UI, in the overlay's own scene (render/overlayscene.js) at the 480-line present, bottom-right beside the thermometer
// Lachrimeter where every tool's piece stands (the Soul Brush's desk, the Sondelass's guard, the Lockheart's reliquary). It replaces the
// pendulum on the wire compass (vfx/crucibellehud.js, retired with it; the compass is the Dreamvane's alone again).
//   THE METRONOME  the songbook's own, a Maelzel's pyramid (not the fob on the bell: tools/crucibelle/model.js): its rod swings so each
//                  end lands on a beat of the bell's (its grid, folded to BEAT.max), slowing into each end; a notch at each end exactly as
//                  wide as the bell's on-beat window; the downbeat's end taller and the rod thicker into it; the bar's beats as studs, the
//                  tempo on the plinth; with no music the bell's own tempo, drawn fainter; Half Time (the knack) on every other beat with
//                  a notch in the middle. Fever: the scale plate filling with ember, the weight an ember trailing smoke, the peak a
//                  brighten that settles and a ring of smoke (crucibellesongbook/metronome.js)
//   THE TINES      the ten keys as a kalimba's (1 to 5 low, 6 to 0 high), each in its degree's colour wearing its neume, its key under it,
//                  its note's name over the bridge; lit and ringing as played, a chord's three together (crucibellesongbook/tines.js)
//   THE PAGE       the songs, a line each: their notes as neumes, the motif matched as a prefix (played inked, the next standing proud,
//                  a line that no longer fits greyed), the cost now; a song cast, its line brightened and ruled (crucibellesongbook/songs.js)
//   THE AMP        in the combat recital: the strum chain's four picks, the feedback's wave, the whammy's bend (tines.js ampDraw)
//   THE LINK       it claims the spiritual link (vfx/spirituallink.js), its end at the metronome's apex: a song's or a chord's spend a
//                  bead down it, a refusal its slack.
// It reads, never drives (the bell's grid(), now(), fever, history, lastNote, scaleNow(); its recital's play; the pool; the knacks).
// Every cue the ear gets the eye gets (Rhythm Heaven): the beat, the bar, the window, the hit and the miss, the fever, a song.
// Two canvases on planes of the overlay's flat kind: the piece (redrawn at 30 Hz while anything moves, slower at rest, and on each beat)
// and the rod (its own plane, turned every frame, redrawn only as the fever's ember changes): no program of its own.
//
// Prior art, as on a museum label: Maelzel's metronome (1815); the kalimba and the mbira; Ocarina of Time's song staff; shape-note
// tunebooks and the chant's neumes; Patapon's fever; Rhythm Heaven; the Soul Brush's desk and the Lockheart's reliquary (the house's
// tool UIs by the Lachrimeter, their canvas and their gate: vfx/soulbrushdesk.js, vfx/redrawgate.js).
//
//   game.crucibelleSongbook = new CrucibelleSongbook(game)   (boot/warmup.js, beside the other tool UIs; it updates itself in the overlay's scene)
//   .read() -> { shown, angle, amp, notch, centre, inNotch, towardEnd, own, half, down, side, motif, notes, disagree, casts } (a sweep plays by it)
//   .state -> { shown, motif, open, next, fever, recital }
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { overlayFlat } from './lachrimetertube.js';
import { SONGS, match } from '../tools/crucibelle/songs.js';
import { chordOf, WHAMMY } from '../tools/crucibelle/harmony.js';
import { RECITAL_PLAY } from '../tools/crucibelle/recitalplay.js';
import { C01, swing, scaleNames } from './crucibellesongbook/look.js';
import { metronomeDraw, rodDraw, METRO } from './crucibellesongbook/metronome.js';
import { tinesDraw, ampDraw } from './crucibellesongbook/tines.js';
import { pageDraw, pageRemeasure } from './crucibellesongbook/songs.js';
import { RedrawGate } from './redrawgate.js';

const K = 2;                       // (texture pixels a dot)
const CW = 276, CH = 154;          // (the canvas in dots)
const OX = 268, OY = 152;          // (the piece's foot, its right edge's base, in the canvas: everything is drawn in dots from it)
const CLEAR = 18, AT = [150, 14];  // (CSS px from the right edge, as the tube's; then the foot in dots: clear of the tube's plinth)
const PAGE = [-268, -150, 150, 74], AMP_BOX = [-268, -71, 150, 10], TINES = [-268, -58, 150, 56];
const IDLE_HZ = 10, BEAD = 2;
const ALIVE_BEATS = 4;             // (the bell begins its motif again after a pause of this many beats: tools/crucibelle/crucibelle.js note)
const SONG_IDS = Object.keys(SONGS);

export class CrucibelleSongbook {
  constructor(game) {
    this.game = game; this.S0 = game.overlayScene;
    this.t = 0; this.a = 0; this.shown = false; this.gate = new RedrawGate(30); this.rodGate = new RedrawGate(15); this.busy = true;
    this.tines = Array.from({ length: 10 }, () => ({ age: -1 })); this.arcNotes = []; this.smoke = []; this.heat = 0;
    this.castAt = {}; this.peakT = -9; this.ringT = -9; this.ringAt = [0, 0]; this.lastBeat = -1; this.lastSw = null;
    this.notes = 0; this.disagree = 0; this.casts = 0; this.chainAt = -9; this.lastChain = 0; this.recA = 0;
    this.state = { shown: false, motif: [], open: [], next: {}, fever: 0, recital: false };
    this.endFn = (out) => this.linkEnd(out);
    const on = (n, f) => game.events?.on(n, f);
    on('crucibelle.note', (e) => this.noted(e));
    on('song.play', (e) => { this.castAt[e.song] = this.t; this.casts++; });
    on('crucibelle.fever', () => { this.peakT = this.t; this.ringT = this.t; });
    if (!this.S0) return;
    this.c = document.createElement('canvas'); this.c.width = CW * K; this.c.height = CH * K; this.x = this.c.getContext('2d');
    this.tex = tex(this.c);
    this.plane = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), overlayFlat({ map: this.tex, depthTest: false, depthWrite: false }));
    this.plane.frustumCulled = false; this.plane.renderOrder = 20;
    const { RW, RH } = METRO;
    this.rc = document.createElement('canvas'); this.rc.width = RW * K * 2; this.rc.height = RH * K * 2; this.rx = this.rc.getContext('2d'); // (the rod drawn finer: it turns)
    this.rtex = tex(this.rc);
    this.rod = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), overlayFlat({ map: this.rtex, depthTest: false, depthWrite: false }));
    this.rod.frustumCulled = false; this.rod.renderOrder = 21;
    this.pivot = new THREE.Group(); this.pivot.add(this.rod);
    this.root = new THREE.Group(); this.root.name = 'crucibelleSongbook'; this.root.userData.overlayHidden = true; this.root.add(this.plane, this.pivot);
    this.slot = this.S0.add(this.root, { anchor: 'br', x: 0, y: 0, z: 0, hud: true, update: (dt, slot) => this.update(dt, slot) });
    document.fonts?.addEventListener?.('loadingdone', () => { pageRemeasure(); this.gate.reset(); });
  }

  get bell() { return this.game.crucibelle || null; }
  /** The Crucibelle, drawn and in the hands as the belt says, or null. */
  tool() {
    const g = this.game, B = this.bell;
    if (!B || g.belt?.inHand !== B || B.drawT <= 0.02 || B.drawTarget <= 0 || g.god?.controlling || g.rhythm?.active) return null;
    return B;
  }
  half() { return !!this.game.knacks?.on?.('halfTime'); }

  /** The link's far end: the metronome's apex, in the overlay scene's coordinates. */
  linkEnd(out) {
    if (!this.shown) return null;
    const dot = this.dot || 1, p = this.root.position;
    return out.set(p.x + METRO.X * dot, p.y + 124 * dot, 0);
  }

  // ---------------------------------------------------------------- the bus
  noted(e) {
    const cb = this.bell; if (!cb) return;
    const d = e.degree; if (!(d >= 1 && d <= 5)) return;
    // (judged at the press: the bell keeps the time it judged with as lastNote, set before the event)
    const now = cb.now(), t = Number.isFinite(cb.lastNote) && now - cb.lastNote < 0.25 && cb.lastNote <= now ? cb.lastNote : now;
    const sw = swing(t, cb.grid(), this.half(), METRO.AMP), reg = e.octave ? 1 : 0;
    this.notes++; if (sw.inNotch !== !!e.onBeat) this.disagree++;
    const lit = Array.isArray(e.chord) && e.chord.length ? chordOf(d, reg).map((c) => ({ d: c.d, up: Math.min(1, c.up) })) : [{ d, up: reg }];
    for (const c of lit) this.tines[c.up * 5 + c.d - 1] = { age: 0 };
    this.arcNotes.push({ d, high: !!reg, on: !!e.onBeat, th: sw.th, age: 0 }); if (this.arcNotes.length > 6) this.arcNotes.shift();
    (this.motifOn ||= []).push(!!e.onBeat); if (this.motifOn.length > 8) this.motifOn.shift();
    this.gate.reset();
  }

  hookPool() {
    const pool = this.game.lachryma; if (this.hooked === pool || !pool?.on) return; this.hooked = pool;
    const mine = (e) => this.shown && (e.tag === 'song' || e.tag === 'harmony');
    pool.on('spend', (e) => { if (mine(e)) this.game.spiritualLink?.bead({ amount: Math.max(BEAD, e.amount || BEAD), dur: 0.12 }); });
    pool.on('denied', (e) => { if (mine(e)) this.game.spiritualLink?.slack(); });
  }

  // ---------------------------------------------------------------- each frame it may be drawn
  update(dt, slot) {
    const g = this.game, Bc = document.body.classList, cb = this.tool();
    const allowed = !!cb && !g.title?.active && !g.rail?.stage?.active && !Bc.contains('cine') && !Bc.contains('bztable-seated');
    this.a = C01(this.a + (allowed ? dt / 0.22 : -dt / 0.16));
    if (!allowed && this.a <= 0) return this.hide();
    this.t += dt;
    if (!this.shown) { this.shown = true; this.root.userData.overlayHidden = false; this.gate.reset(); this.rodGate.reset(); this.hookPool(); g.spiritualLink?.attach(this, this.endFn); }
    const dot = (this.dot = (slot.view.h || innerHeight) / 480), W = slot.view.w || innerWidth, H = slot.view.h || innerHeight;
    const hx = Math.round((W - CLEAR - AT[0] * dot) / dot) * dot, hy = Math.round((H - AT[1] * dot) / dot) * dot;
    slot.x = hx - W; slot.y = hy - H;
    this.plane.scale.set(CW * dot, CH * dot, 1); this.plane.position.set((CW / 2 - OX) * dot, -(CH / 2 - OY) * dot, 0);
    const op = this.a * this.a * (3 - 2 * this.a);
    this.plane.material.opacity = op; this.rod.material.opacity = op;
    const B = this.bell; if (!B) return;
    const S = this.read1(dt, B);
    // the rod: its own plane about the pivot, turned every frame; thicker into the downbeat
    const { RW, RH, RPX, RPY, X, PY } = METRO;
    this.pivot.position.set(X * dot, -PY * dot, 0); this.pivot.rotation.z = -S.sw.th; this.pivot.scale.set(1 + 0.3 * S.sw.down, 1, 1);
    this.rod.scale.set(RW * dot, RH * dot, 1); this.rod.position.set((RW / 2 - RPX) * dot, (RPY - RH / 2) * dot, 0);
    if (this.rodGate.sig(dt, `${Math.round(this.heat * 24)}`)) { const r = this.rx; r.setTransform(K * 2, 0, 0, K * 2, 0, 0); rodDraw(r, this.heat); this.rtex.needsUpdate = true; }
    if (S.sw.beat !== this.lastBeat) { this.lastBeat = S.sw.beat; this.gate.reset(); } // (the bar's studs step on the beat itself, never late)
    if (this.gate.rate(dt, this.busy, IDLE_HZ)) this.paint(S);
  }

  hide() {
    if (!this.shown) return;
    this.shown = false; if (this.root) this.root.userData.overlayHidden = true; this.smoke = []; this.arcNotes = [];
    this.game.spiritualLink?.detach(this); this.state.shown = false;
  }

  /** The bell, read: everything the canvas draws (S). */
  read1(dt, cb) {
    const t = cb.now(), G = cb.grid(), sw = swing(t, G, this.half(), METRO.AMP), own = !this.game.music?.grid?.(); // (no music: the bell's own tempo, drawn fainter)
    this.lastSw = { sw, own, t };
    this.heat += (cb.fever - this.heat) * (1 - Math.exp(-dt * 5));
    for (const T of this.tines) if (T.age >= 0) { T.age += dt; if (T.age > 2) T.age = -1; }
    for (const m of this.arcNotes) m.age += dt; while (this.arcNotes.length && this.arcNotes[0].age > 1.2) this.arcNotes.shift();
    // the smoke off the weight, where the rod's weight is now (in canvas dots)
    const { X, PY } = METRO, wx = X + Math.sin(sw.th) * 62, wy = PY - Math.cos(sw.th) * 62;
    if (this.heat > 0.05) this.smoke.push({ x: wx, y: wy - 6, age: 0 });
    const life = 0.15 + 0.55 * this.heat;
    for (const p of this.smoke) { p.age += dt; p.y -= dt * 34; p.x += Math.sin(p.age * 9 + p.y * 0.2) * dt * 5; }
    while (this.smoke.length && (this.smoke[0].age > life || this.smoke.length > 40)) this.smoke.shift();
    if (this.t - this.ringT < 0.02) this.ringAt = [wx, wy];
    // the motif and the songs: matched as a prefix, dead once the bell would begin again
    const hist = cb.history || [], alive = hist.length > 0 && t - cb.lastNote <= G.spb * ALIVE_BEATS;
    const ons = this.motifOn || [], motif = alive ? hist.map((d, i) => ({ d, on: ons[ons.length - hist.length + i] ?? true })) : [];
    const pool = this.game.lachryma?.value ?? 0, fever = cb.fever || 0;
    const songs = SONG_IDS.map((id) => {
      const Sg = SONGS[id], n = Sg.notes.length; let k = 0;
      if (alive) for (let j = Math.min(n - 1, hist.length); j > 0; j--) { let ok = true; for (let q = 0; q < j; q++) if (hist[hist.length - j + q] !== Sg.notes[q]) { ok = false; break; } if (ok) { k = j; break; } }
      const cost = Math.round(Sg.cost * (1 - 0.45 * fever)), ca = this.castAt[id];
      return { id, name: Sg.name, notes: Sg.notes, k, open: !alive || k > 0, cost, afford: pool >= cost, castAge: ca != null ? this.t - ca : -1 };
    });
    // the recital: the strum chain, the feedback, the whammy
    const R = cb.recital, P = R?.play, ron = !!R?.on;
    this.recA = C01(this.recA + (ron ? dt / 0.2 : -dt / 0.2));
    const chain = P?.chain || 0; if (chain !== this.lastChain) { if (chain > this.lastChain) this.chainAt = this.t; this.lastChain = chain; }
    const recital = { a: this.recA, chain, max: RECITAL_PLAY.chain.max, fb: P?.feedbackOn ? 1 : 0, wham: P?.wham || 0, chainAge: this.t - this.chainAt, barHz: WHAMMY.per / (G.spb * 4) };
    const S = {
      a: 1, t: this.t, sw, own, bpm: Math.round(60 / G.spb), heat: this.heat, peak: this.t - this.peakT < 1.6 ? 1 - (this.t - this.peakT) / 1.6 : 0,
      ringAge: this.t - this.ringT < 1.4 ? this.t - this.ringT : -1, ringAt: this.ringAt, smoke: this.smoke, smokeLife: life,
      arcNotes: this.arcNotes, tines: this.tines, names: scaleNames(cb), motif, motifA: 1, alive, songs, recital,
    };
    this.busy = this.heat > 0.02 || this.arcNotes.length > 0 || this.tines.some((T) => T.age >= 0) || alive || this.recA > 0 || S.peak > 0 || S.ringAge >= 0 || songs.some((s) => s.castAge >= 0 && s.castAge < 1.5);
    Object.assign(this.state, { shown: this.shown && this.a > 0.5, motif: motif.map((m) => m.d), open: songs.filter((s) => s.open && s.k > 0).map((s) => s.id), next: Object.fromEntries(songs.filter((s) => s.open && s.k > 0).map((s) => [s.id, s.notes[s.k]])), fever: +this.heat.toFixed(2), recital: ron, chain, match: match(hist) });
    return S;
  }

  paint(S) {
    const x = this.x;
    x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, this.c.width, this.c.height); x.setTransform(K, 0, 0, K, OX * K, OY * K);
    x.lineJoin = 'round';
    pageDraw(x, S, S.t, ...PAGE);
    ampDraw(x, S, S.t, ...AMP_BOX);
    tinesDraw(x, S, S.t, ...TINES);
    metronomeDraw(x, S, S.t);
    this.tex.needsUpdate = true;
  }

  /** What the eye can read off the songbook's metronome now (a sweep plays the bell by it alone: scripts/sweeps/tools.mjs 9b). Radians. */
  read() {
    const cb = this.bell, inHand = !!this.tool();
    if (!cb) return { shown: false };
    const t = cb.now(), G = cb.grid(), s = swing(t, G, this.half(), METRO.AMP), M = this.game.music?.grid?.();
    const shown = this.S0 ? this.shown && this.a > 0.5 : inHand;
    return { shown, t, angle: +s.th.toFixed(4), amp: METRO.AMP, notch: +s.notch.toFixed(4), centre: +s.centre.toFixed(4), inNotch: s.inNotch, towardEnd: s.towardEnd,
      own: !M || M.t0 !== G.t0, half: s.half, down: +s.down.toFixed(3), side: s.side, motif: [...(cb.history || [])], notes: this.notes, disagree: this.disagree, casts: this.casts };
  }
}

function tex(c) {
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.generateMipmaps = false; t.minFilter = THREE.LinearFilter; t.magFilter = THREE.LinearFilter;
  return t;
}
