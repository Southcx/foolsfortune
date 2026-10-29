// ---------------------------------------------------------------------------------------
// THE DUEL'S BEATS (the duel's view: vfx/duelview.js): a puzzle duel's events (progress/duel/, in the order the kernel returns them)
// played as the board v11 mock plays them, phase by phase: a run of one kind of event is one phase (every fall of a settle pass falls
// together; a pass's clears burst together), with a beat of stillness (ma) between. The timings are the mock's (board v11, figure 09):
//   the action 0.26 (swap on a shallow arc, rotate a quarter round its corner, drag along its path, drop down its lane, push and kick)
//   fall       free fall from rest (the first cell in 0.08), stretched as it gathers speed, then a squash along the gravity's axis
//              (0.07) and a puff of dust where it lands
//   cascade    a chain's second step on (CASCADE): its clear 0.2 so each lands on about a quarter second, its count swelling a step (gold
//              from the fourth: Puzzle & Dragons' combo counter)
//   clear      a flash (0.09: white almost at once, swelling 16%), then seven shards of its colour and a white spark; break: clay chips that fall; blast: its cross of
//              sparks first, the clears it makes 0.14 later; a duel's chain: its numeral from the clear's middle (rising, 0.9)
//   pinch      the junk flips like an Othello disc, its back the new colour (0.34)
//   land       junk thrown over the Line's head into its cells (0.035 apart); line: the Line steps a column (0.40, overshoot 1.4),
//              the domains' seam pushed; shift: the figurine steps clear; drip: a drop falling a cell into its gem (0.06 apart), a skyfall refill
//              (`sky`) a gem dropped from past the half's far edge, the columns staggered (SKY)
//   break     its half flashes white, a gold ring out of its body, its stars (one a depth); the EmO column whites out
//   orb   thrown from the broken body over the Line in arcs (0.05 apart, 0.5 each); fade: it lifts, swells and breaks (0.8)
//   run      the figurine hops its path (0.11 a cell); each orb it crosses rings out, and a bead runs down the spiritual link
//              into the Lachrimeter (vfx/spirituallink.js, reversed: a drink)
//   the tools  shot, hook, drill, paint, delay, hold, hold's send: one small motion each (0.4 to 0.6); the ones that bend the clearing
//              (shot and its pop, recolour and its paints, tune and tune.end, read) in toolbeats2.js; lesson.*: the asked verb (glows.js)
//   finisher       the crackle break and the data drain's beats on the board (vfx/datadrain.js DRAIN_BEATS), and the drain itself on the
//              foe in the world: its half's pieces stripped into cubes spiralling up into the god hand, the Line home (1.9)
//   turn       the turn's band torn across (cutin.js), then a side's points: the beads it lost crack, one by one
//   ember      Dread's junk lands as embers (`land` with kind 'ember'); `ember.cool`: the coal crazes (0.3), cracks open and turns, its gem
//              inside (0.5)
//   skills     the one-gesture duel's (skillcast.js): `skill` the cast (the Jar's pour into the cell), `blast { rows }` the Shot's beam,
//              `vein` the Vein's sparks; nothing a skill plays is spent
//   powers     power, swap (with `moved`), manifest, scan, lift, herd, transmute, miracle, drink: powercast.js
//   big plays  refund (ONE MORE), allclear, a weak or resisted chain step, trickle, undo: juice.js
//   flee       a d20 thrown before the board landing on its roll, its reasons counted in against 15 (2.2 or so: flee.js); fled: the
//              clash folds softly with no winner and the tsuitate folds away (1.4)
// Each event goes to Wanda's `sfx.duelEvent(e)` at the moment it is played (guarded: it may not be built yet).
// A play resolves once its last phase is shown; when nothing more is queued the view settles up with the duel as it stands.
//
// Prior art: Puyo Puyo's chain pacing (each pass of the cascade its own beat, the chain voice rising), Panel de Pon's chain counter,
// PuzzleScript's again-loop (the settle played step by step), Tetris 99's attack line, Into the Breach's resolution order (each event
// shown one after another, never all at once).
//
//   const T = new DuelBeats(view)   T.play(events) -> Promise   T.update(dt)   T.busy   T.clear()
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { sfx } from '../../audio/sfx.js';
import { junkOf } from '../../progress/duel/duel.js';
import { DUEL_VIEW, cellLocal, sm, ease, lerp, hash } from './layout.js';
import { toolBeat, TOOL_EVENTS } from './toolbeats.js';
import { TOOL_BEATS2, shotBeat, paintBeat, tuneBeat, tuneEndBeat, readBeat } from './toolbeats2.js';
import { FLEE } from '../../progress/duel/flee.js';
import { POWER_EVENTS, powerBeat } from './powercast.js';
import { JUICE_EVENTS } from './juice.js';
import { gemColour } from './pieces.js';
import { DIVE } from './formdive.js';
import { castBeat, blastBeat, veinBeat } from './skillcast.js';

const ACTS = new Set(['swap', 'drag', 'rotate', 'drop', 'push', 'kick', 'form']);
const COST = { swap: 1, rotate: 1, drop: 1, push: 1, kick: 2, form: 1, run: 1, shot: 1, grab: 1, drill: 1, paint: 2, delay: 2, hold: 1, 'hold.send': 1, 'duel.finisher': 2 };
const POOL = { shot: 5, grab: 5, drill: 3, paint: 10, delay: 15, 'hold.send': 5 }; // (this branch's kernel: a spend's price, when its event carries no `spent`)
const DV = { N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0] };
/** Skyfall's fall-in (Dovina's skyfall.js): col: a column's stagger after the one left of it (real s); fall: the fall's time for one cell, by the root of the cells fallen (free fall). */
export const SKY = { col: 0.035, fall: 0.11 };
/** clear: a cascade step's clear after the first (real s); grow: the step count's swell a step; maxSize: its largest (cells). */
export const CASCADE = { clear: 0.2, grow: 0.42, maxSize: 4.2 };
const CLAY = 0x93552f, GOLD = 0xffd76a, TEAR = 0x7fdcff, DUST = 0xcfc3b0;
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Color();

export class DuelBeats {
  constructor(view) { this.view = view; this.jobs = []; this.job = null; this.phase = null; }
  get busy() { return !!(this.job || this.jobs.length); }
  clear() { for (const j of [this.job, ...this.jobs]) j?.resolve(); this.jobs.length = 0; this.job = null; this.phase = null; }

  play(events) { return new Promise((resolve) => this.jobs.push({ events: events || [], i: 0, resolve })); }

  update(dt) {
    for (let guard = 0; guard < 64; guard++) {
      if (!this.phase) {
        if (!this.job) { this.job = this.jobs.shift() || null; if (!this.job) return; }
        this.phase = this.next(this.job);
        if (!this.phase) { const j = this.job; this.job = null; if (!this.jobs.length) this.view.settleUp(); j.resolve(); continue; }
        this.phase.age = 0; for (const e of this.phase.events || []) { sfx.duelEvent?.(e); this.view.stage?.event?.(e); } // (the director's answer: stage.js)
      }
      const P = this.phase; P.age += dt; dt = 0;
      P.step?.(Math.min(1, P.age / P.dur), P.age);
      if (P.age < P.dur) return;
      P.end?.(); this.phase = null;
    }
  }

  /** The next phase of a job: the run of events at its head, built against the view's board as it will stand. */
  next(job) {
    const E = job.events; if (job.i >= E.length) return null;
    const e = E[job.i], run = (pred) => { const out = []; while (job.i < E.length && pred(E[job.i])) out.push(E[job.i++]); return out; };
    const V = this.view;
    if (e.type === 'skill') { job.i++; job.skill = true; return castBeat(this, e); } // (the one-gesture duel's cast, free: nothing after it in this play is spent, skillcast.js)
    if (e.type === 'blast' && e.rows) { job.i++; return blastBeat(this, e); }
    if (e.type === 'vein') { job.i++; return veinBeat(this, e); }
    if (e.type === 'charge') { job.i++; return { events: [e], dur: 0 }; }
    if (POWER_EVENTS.has(e.type) && (e.type !== 'swap' || e.moved)) { job.i++; return powerBeat(this, e); } // (the PvE duel's powers: powercast.js; a power's swap carries `moved`, the classic swap does not)
    if (e.type.startsWith('foe.')) { const cut = V.cutIn.beat(e); if (cut) return cut; job.i++; const ph = V.foeCast.beat(this, e); if (V.cutIn.cut.has(e)) ph.events = []; return ph; } // (the PvE duel's aberrant: a skill's cut-in first, once (cutin.js), then its cast, its desperate flare, its stagger: foecast.js)
    if (e.type === 'fall') return this.fall(run((x) => x.type === 'fall'));
    if (e.type === 'clear' || e.type === 'break' || e.type === 'blast') { const it = run((x) => x.type === 'clear' || x.type === 'break' || x.type === 'blast'); return this.clears(it, run((x) => x.type === 'chain')); }
    if (e.type === 'chain') return this.clears([], run((x) => x.type === 'chain'));
    if (e.type === 'pinch') return this.pinch(run((x) => x.type === 'pinch'));
    if (e.type === 'ember.cool') return this.cool(run((x) => x.type === 'ember.cool'));
    if (ACTS.has(e.type)) { job.i++; if (!(V.state?.style === 'pve' && e.side === 0)) V.spend(e.side, e.type === 'drag' ? Math.max(1, Math.ceil((e.path.length - 1) / 3)) : COST[e.type], e); return this.action(e); }
    if (e.type === 'run') { job.i++; V.spend(e.side, 1, e); return this.runPath(e, run((x) => x.type === 'orb.drink')); }
    if (TOOL_BEATS2.has(e.type)) { job.i++; // (the tools that bend the clearing: toolbeats2.js)
      if (e.type === 'shot') { this.pay(job, e.side, 1, e, 5); const pops = run((x) => x.type === 'blast' || ((x.type === 'clear' || x.type === 'break') && x.by === 'shot')); return shotBeat(this, e, pops, run((x) => x.type === 'chain' && x.step === 1 && x.side === e.side)); }
      if (e.type === 'recolour') { this.pay(job, e.side, 2, e, 10); return paintBeat(this, e, run((x) => x.type === 'paint')); }
      if (e.type === 'tune') { this.pay(job, e.side, 1, e, 8); return tuneBeat(this, e); }
      if (e.type === 'tune.end') return tuneEndBeat(this, e);
      this.pay(job, e.side, 1, e); return readBeat(this, e); }
    if (JUICE_EVENTS.has(e.type)) { job.i++; return V.juice.beat(this, e); } // (the big plays: refund, allclear, trickle, undo: juice.js)
    if (e.type.startsWith('lesson.')) { job.i++; this.view.glows?.lessonBeat?.(e); return { events: [e], dur: e.type === 'lesson.idle' ? 0.3 : 0.05 }; } // (the lesson's steps: the asked verb lit, glows.js)
    if (TOOL_EVENTS.has(e.type)) { const it = run((x) => x.type === e.type); this.pay(job, e.side, COST[e.type] ?? 1, e, POOL[e.type]); return toolBeat(this, it); }
    if (e.type === 'land') { job.i++; return this.land(e); }
    if (e.type === 'line') { job.i++; return this.line(e); }
    if (e.type === 'shift') { job.i++; return this.step(V.pieces.bodyAt(e.side), e.to, 0.28, [e]); }
    if (e.type === 'drip') return this.drip(run((x) => x.type === 'drip'));
    if (e.type === 'duelBreak') { job.i++; return this.duelBreak(e); }
    if (e.type === 'duelBreak.end') { job.i++; return { events: [e], dur: 0.38, step: () => {}, end: () => { V.marks.stars(e.side, 0); V.depth[e.side] = 0; } }; }
    if (e.type === 'orb') return this.shower(run((x) => x.type === 'orb'));
    if (e.type === 'orb.fade') return this.fade(run((x) => x.type === 'orb.fade'));
    if (e.type === 'orb.drink') { job.i++; return this.drinkAt(e); }
    if (e.type === 'duel.finisher') { job.i++; V.spend(e.side, COST['duel.finisher'], e, e.spent ?? [60, 40, 20][(e.depth || 1) - 1]); return this.finisher(e); }
    if (e.type === 'turn') { job.i++; return this.turn(e); }
    if (e.type === 'rest.cut') { job.i++; if (e.side === 0) V.restCuts++; return { events: [e], dur: 0 }; } // (a good chain took turns off the resting powers: the phone's power tiles flash their rims, ui/touch/duelscreen.js)
    if (e.type === 'flee') { job.i++; V.spend(e.side, e.ap ?? (e.ok ? 0 : FLEE.cost), e); // (only a failed roll costs: the owner, via Dovina's e3e13b4)
    return V.flee.roll(e); }
    if (e.type === 'duel.fled') { job.i++; return V.flee.fled(e); }
    if (e.type === 'offset' || e.type === 'send') { job.i++; V.count(e); return { events: [e], dur: 0.38 }; }
    if (e.type === 'duel.full' || e.type === 'duel.line' || e.type === 'duel.cap') { job.i++; return { events: [e], dur: 0.4, step: (u) => { if (e.winner === 0) V.board.won(sm(u)); } }; }
    job.i++; return { events: [e], dur: 0 }; // (settle.cap, settle.loop, and anything newer than this view: shown as nothing)
  }

  /** An action point and the pool's bead spent, unless the play is a skill's (free: PUZZLE-DUELS.md 22). */
  pay(job, ...a) { if (!job.skill) this.view.spend(...a); }

  /** A body or piece stepping to a cell (shift, a walk). */
  step(v, to, dur, events) {
    const P = this.view.pieces; if (!v || !to) return { events, dur: 0 };
    const fx = v.cx, fy = v.cy; P.move(v, to[0], to[1]);
    return { events, dur, step: (u) => { const e = sm(u); v.x = lerp(fx, to[0], e); v.y = lerp(fy, to[1], e); v.dy = -Math.sin(Math.PI * e) * 0.18; }, end: () => { v.x = to[0]; v.y = to[1]; v.dy = 0; } };
  }

  fall(F) {
    const P = this.view.pieces, G = DUEL_VIEW.fallG, mv = [];
    for (const f of F) { const v = P.at(f.from[0], f.from[1]) || P.byId(f.id); if (!v) continue; P.adopt(v, f.id); mv.push({ v, from: f.from, to: f.to, d: Math.abs(f.to[0] - f.from[0]) + Math.abs(f.to[1] - f.from[1]) }); }
    for (const m of mv) P.move(m.v, -1, -1); for (const m of mv) P.move(m.v, m.to[0], m.to[1]); // (all lifted, then all set: a stack moves as one)
    let T = 0; for (const m of mv) { m.tf = Math.sqrt((2 * m.d) / G); m.dir = [Math.sign(m.to[0] - m.from[0]), Math.sign(m.to[1] - m.from[1])]; T = Math.max(T, m.tf); }
    const dur = T + DUEL_VIEW.squash + DUEL_VIEW.ma;
    return { events: F, dur, step: (u, age) => { for (const m of mv) {
      const t = Math.min(age, m.tf), dist = Math.min(m.d, 0.5 * G * t * t); m.v.x = m.from[0] + m.dir[0] * dist; m.v.y = m.from[1] + m.dir[1] * dist;
      let sx = 1, sy = 1, k = 0;
      if (age <= m.tf) k = -Math.min(0.16, (G * t) / 220); // (stretched along the fall as it gathers speed)
      else { const q = Math.min(1, (age - m.tf) / DUEL_VIEW.squash); k = Math.sin(Math.PI * q) * 0.22; // (squashed on landing, Puyo's bounce)
        if (!m.landed) { m.landed = true; if (m.d >= 1 && m.v.kind !== 'body') { cellLocal(m.to[0] + m.dir[0] * 0.45, m.to[1] + m.dir[1] * 0.45, this.view.board3, _a); this.view.bursts.burst(_a, DUST, 3, { speed: 0.35, life: 0.28, fall: 0, spread: 0.05, size: 0.016 }); } } } // (a puff of dust where it lands)
      if (m.dir[0]) { sx = 1 - k; sy = 1 + k * 0.6; } else { sy = 1 - k; sx = 1 + k * 0.6; }
      m.v.sx = sx; m.v.sy = sy; } },
      end: () => { for (const m of mv) { m.v.x = m.to[0]; m.v.y = m.to[1]; m.v.sx = m.v.sy = 1; } } };
  }

  clears(it, chains) {
    const V = this.view, P = V.pieces, X = V.bursts, B = V.board3, hasB = it.some((c) => c.type === 'blast'), cd = hasB ? 0.14 : 0, step = Math.max(1, ...chains.map((c) => c.step || 1)), dur = (hasB ? 0.56 : step >= 2 ? CASCADE.clear : 0.42) + DUEL_VIEW.ma; // (a cascade's steps on a quarter-second beat, the board waiting for each: Puzzle & Dragons')
    const gone = [];
    for (const c of it) { if (c.type === 'blast') continue; const v = P.at(c.at[0], c.at[1]) || P.byId(c.id); if (!v) continue; P.move(v, -1, -1); gone.push({ v, c, popped: false }); }
    const marks = chains.map((ch) => { const cells = it.filter((q) => q.type === 'clear' && q.side === ch.side); const n = Math.max(1, cells.length);
      const cx = cells.reduce((a, q) => a + q.at[0], 0) / n, cy = cells.reduce((a, q) => a + q.at[1], 0) / n; return { ch, at: cellLocal(cells.length ? cx : B.w / 2, cells.length ? cy : B.h / 2, B, new THREE.Vector3()), shown: false }; });
    let blasted = false; V.juice?.note(it);
    return { events: [...it, ...chains], dur, step: (u, age) => {
      if (hasB && !blasted) { blasted = true; for (const c of it.filter((q) => q.type === 'blast')) { cellLocal(c.at[0], c.at[1], B, _a);
        for (const [dx, dy] of Object.values(DV)) for (let r = 0; r <= (V.state?.rs?.blast || 2); r++) { _b.copy(_a); _b.x += dx * r * DUEL_VIEW.cs; _b.y -= dy * r * DUEL_VIEW.cs; X.burst(_b, r ? 0xc8402a : 0xfff2e0, 3, { speed: 0.6, life: 0.32, fall: 0 }); } } }
      for (const g of gone) {
        if (!g.popped && age < cd + 0.09) { const f = Math.max(0, (age - cd) / 0.09); g.v.flash = Math.min(1, f * 2.5); g.v.s = 1 + 0.16 * f; } // (white almost at once, swelling: the beat before the pop, Bejeweled's)
        else if (!g.popped) { g.popped = true; cellLocal(g.v.x, g.v.y, B, _a);
          if (g.c.type === 'break') X.burst(_a, CLAY, 6, { speed: 0.7, life: 0.5, fall: 6, size: 0.03 });
          else { X.burst(_a, g.v.kind === 'gem' ? gemColour(g.v.colour, _c).getHex() : 0xe8dcc8, 7, { speed: 1.2, life: 0.42 }); X.burst(_a, 0xffffff, 2, { speed: 0.3, life: 0.14, fall: 0, size: 0.03 }); }
          P.remove(g.v); }
      }
      for (const m of marks) if (!m.shown && age >= cd + 0.1) { m.shown = true; V.marks.numeral(String(m.ch.step), m.at, m.ch.step >= 4 ? '#ffd76a' : V.sideHex(m.ch.side), { size: Math.min(CASCADE.maxSize, 1.6 + CASCADE.grow * (m.ch.step - 1)), dur: 0.9 + 0.08 * m.ch.step }); V.juice?.chainHit(m.ch, m.at, it); V.sent[m.ch.side] += junkOf(m.ch.cleared, m.ch.step); V.showCounts(); }
    }, end: () => { for (const g of gone) if (!g.popped) P.remove(g.v); } };
  }

  pinch(it) {
    const P = this.view.pieces, L = it.map((e) => ({ e, v: P.at(e.at[0], e.at[1]) || P.byId(e.id), turned: false })).filter((q) => q.v);
    return { events: it, dur: 0.34 + DUEL_VIEW.ma, step: (u) => { const f = sm(Math.min(1, u * 1.12));
      for (const q of L) { if (f >= 0.5 && !q.turned) { q.turned = true; q.v.kind = 'gem'; q.v.colour = q.e.colour; } q.v.flip = f < 0.5 ? Math.PI * f : Math.PI * (f - 1); } },
      end: () => { for (const q of L) { q.v.kind = 'gem'; q.v.colour = q.e.colour; q.v.flip = 0; } } };
  }

  /** Embers cooling: the coal crazes (the iron wire, then the golden thread: crazing.js), cracks open (chips and a last spark) and
   *  turns like a disc, its gem inside. */
  cool(it) {
    const V = this.view, P = V.pieces, C = 0.3, L = it.map((e) => ({ e, v: P.at(e.at[0], e.at[1]) || P.byId(e.id), turned: false, open: false })).filter((q) => q.v);
    for (const q of L) { q.v.count = 0; q.v.craze = 0.001; }
    return { events: it, dur: C + 0.5 + DUEL_VIEW.ma, step: (u, age) => {
      for (const q of L) {
        if (age < C) { q.v.craze = sm(age / C); q.v.s = 1 + 0.04 * Math.sin(age * 60) * (age / C); continue; } // (the crackle running, a shiver in the coal)
        if (!q.open) { q.open = true; q.v.craze = 1; q.v.s = 1; cellLocal(q.v.x, q.v.y, V.board3, _a); V.bursts.burst(_a, 0x2e1810, 5, { speed: 0.6, life: 0.45, fall: 5, size: 0.02 }); V.bursts.burst(_a, 0xff8a3a, 3, { speed: 0.3, life: 0.5, fall: -1.5, size: 0.015 }); }
        const f = sm(Math.min(1, ((age - C) / 0.5) * 1.1));
        if (f >= 0.5 && !q.turned) { q.turned = true; q.v.kind = 'gem'; q.v.colour = q.e.colour; q.v.flash = 1; q.v.craze = 0; }
        q.v.flip = f < 0.5 ? Math.PI * f : Math.PI * (f - 1); if (q.turned) q.v.flash = Math.max(0, 1 - (f - 0.5) * 2);
      } },
      end: () => { for (const q of L) { q.v.kind = 'gem'; q.v.colour = q.e.colour; q.v.flip = 0; q.v.flash = 0; q.v.craze = 0; q.v.s = 1; } } };
  }

  /** The god hand's and the Courier's board actions (0.26 real s). */
  action(e) {
    const V = this.view, P = V.pieces, mv = [];
    const at = (c) => P.at(c[0], c[1]);
    if (e.type === 'swap') { const a = at(e.a), b = at(e.b); if (a) mv.push({ v: a, from: e.a, to: e.b, arc: 1 }); if (b) mv.push({ v: b, from: e.b, to: e.a, arc: -1 }); }
    else if (e.type === 'drag') { const p = e.path, first = at(p[0]); if (first) mv.push({ v: first, from: p[0], to: p[p.length - 1], path: p }); for (let k = 1; k < p.length; k++) { const v = at(p[k]); if (v) mv.push({ v, from: p[k], to: p[k - 1] }); } }
    else if (e.type === 'rotate') { const [x, y] = e.at, Q = [[0, 0], [1, 0], [1, 1], [0, 1]]; Q.forEach(([dx, dy], k) => { const sr = Q[(k + 3) % 4], v = at([x + sr[0], y + sr[1]]); if (v) mv.push({ v, from: [x + sr[0], y + sr[1]], to: [x + dx, y + dy], rot: [x + 0.5, y + 0.5] }); }); }
    else if (e.type === 'drop') { const k = V.known(e.id), v = P.add('gem', { id: e.id, colour: k?.colour || 'mirth' }, e.at[0], e.at[1]); const [gx, gy] = V.state.board.grav(e.at[0], e.at[1]); mv.push({ v, from: [e.at[0] - gx * 1.5, e.at[1] - gy * 1.5], to: e.at, grow: true }); }
    else if (e.type === 'push') { const d = DV[e.dir], body = P.bodyAt(e.side), run = []; let c = [...e.to];
      while (at(c) && at(c) !== body) { run.push({ v: at(c), from: [...c], to: [c[0] + d[0], c[1] + d[1]] }); c = [c[0] + d[0], c[1] + d[1]]; }
      mv.push(...run); if (body) mv.push({ v: body, from: [e.to[0] - d[0], e.to[1] - d[1]], to: e.to }); }
    else if (e.type === 'kick') { const v = P.byId(e.id); if (v) mv.push({ v, from: [v.cx, v.cy], to: e.to }); }
    else if (e.type === 'form') { V.form(e.side, e.to); if (e.side === 0 && V.dive) V.dive.start(e.to); else { const body = P.bodyAt(e.side); if (body) { cellLocal(body.x, body.y, V.board3, _a); V.bursts.burst(_a, V.filmHex(0.1), 12, { speed: 0.9, life: 0.4, fall: 0, spread: 0.2 }); } } } // (your form: the Jar's pour, formdive.js)
    for (const m of mv) if (!m.grow) P.move(m.v, -1, -1); for (const m of mv) P.move(m.v, m.to[0], m.to[1]);
    const dur = e.type === 'form' && e.side === 0 && V.dive ? DIVE.open + DIVE.dur + DUEL_VIEW.ma : (e.type === 'kick' ? 0.28 + 0.03 * Math.hypot(mv[0]?.to[0] - mv[0]?.from[0] || 0, mv[0]?.to[1] - mv[0]?.from[1] || 0) : 0.26) + DUEL_VIEW.ma;
    return { events: [e], dur, step: (u) => { const s = sm(Math.min(1, u * 1.15)); for (const m of mv) {
      let px, py;
      if (m.rot) { const a0 = Math.atan2(m.from[1] - m.rot[1], m.from[0] - m.rot[0]), r = Math.SQRT1_2; px = m.rot[0] + Math.cos(a0 + s * Math.PI / 2) * r; py = m.rot[1] + Math.sin(a0 + s * Math.PI / 2) * r; }
      else if (m.path) { const n = m.path.length - 1, q = s * n, k = Math.min(n - 1, Math.floor(q)), f = q - k; px = lerp(m.path[k][0], m.path[k + 1][0], f); py = lerp(m.path[k][1], m.path[k + 1][1], f); }
      else { px = lerp(m.from[0], m.to[0], s); py = lerp(m.from[1], m.to[1], s); if (m.arc) { const nx = -(m.to[1] - m.from[1]), ny = m.to[0] - m.from[0]; px += nx * m.arc * 0.22 * Math.sin(Math.PI * s); py += ny * m.arc * 0.22 * Math.sin(Math.PI * s); m.v.lift = m.arc * 0.4 * Math.sin(Math.PI * s); } }
      m.v.x = px; m.v.y = py; m.v.s = m.grow ? 0.6 + 0.4 * s : 1 + 0.08 * Math.sin(Math.PI * s); } },
      end: () => { for (const m of mv) { m.v.x = m.to[0]; m.v.y = m.to[1]; m.v.s = 1; m.v.lift = 0; } } };
  }

  /** The run: the figurine hops its path; each orb it crosses rings out, and a bead runs down the link. */
  runPath(e, drinks) {
    const V = this.view, P = V.pieces, body = P.bodyAt(e.side), path = e.path, per = 0.11, B = V.board3;
    const dr = drinks.map((d) => ({ d, k: path.findIndex((q) => q[0] === d.at[0] && q[1] === d.at[1]), v: P.at(d.at[0], d.at[1]), done: false }));
    for (const q of dr) if (q.v && q.v !== body) P.move(q.v, -1, -1);
    const to = path[path.length - 1]; if (body) P.move(body, to[0], to[1]);
    return { events: [e, ...drinks], dur: (path.length - 1) * per + 0.12 + DUEL_VIEW.ma, step: (u, age) => {
      const n = path.length - 1, q = Math.min(n, age / per), k = Math.min(n - 1, Math.floor(q)), f = q - k;
      if (body && n > 0) { body.x = lerp(path[k][0], path[k + 1][0], f); body.y = lerp(path[k][1], path[k + 1][1], f); body.dy = -Math.sin(Math.PI * f) * 0.25; }
      if (n > 0 && Math.floor(q * 3) !== this.lastDot) { this.lastDot = Math.floor(q * 3); cellLocal(body?.x ?? to[0], body?.y ?? to[1], B, _a); V.bursts.burst(_a, V.filmHex(q * 0.2), 1, { speed: 0.05, life: 0.6, fall: 0, spread: 0, size: 0.018 }); }
      for (const d of dr) if (!d.done && age >= d.k * per) { d.done = true; if (d.v && d.v !== body) { cellLocal(d.v.x, d.v.y, B, _a); V.bursts.burst(_a, TEAR, 6, { speed: 0.7, life: 0.35, fall: 0 }); P.remove(d.v); } V.drink(d.d); }
    }, end: () => { if (body) { body.x = to[0]; body.y = to[1]; body.dy = 0; } for (const d of dr) if (!d.done) { if (d.v && d.v !== body) P.remove(d.v); V.drink(d.d); } } };
  }

  /** A drink with no run before it (a newer kernel's order): the orb rings out where it is. */
  drinkAt(e) {
    const V = this.view, v = V.pieces.at(e.at[0], e.at[1]);
    if (v && v.kind === 'orb') { cellLocal(v.x, v.y, V.board3, _a); V.bursts.burst(_a, TEAR, 6, { speed: 0.7, life: 0.35, fall: 0 }); V.pieces.remove(v); }
    V.drink(e); return { events: [e], dur: 0.2 };
  }

  /** Junk landing on a side: thrown from the other side over the Line's head into its cells. */
  land(e) {
    const V = this.view, P = V.pieces, B = V.board3, cells = e.at || [], top = -2.5;
    const kind = e.kind === 'ember' ? 'ember' : 'junk', count = kind === 'ember' ? V.state?.rs?.embers?.count ?? 3 : null;
    const it = cells.map(([x, y], k) => { const id = V.state?.board?.at(x, y)?.kind === kind ? V.state.board.at(x, y).id : null; const v = P.add(kind, { id, count, slime: !!e.slime }, x, y); v.hidden = true; return { v, x, y, d: k * 0.035 }; });
    V.pending[e.side] = Math.max(0, V.pending[e.side] - (e.n || cells.length)); V.showCounts();
    const hurl = !!V.hurled && e.side === 0; V.hurled = false; // (a Hurl's landing: thrown from the aberrant's end of the board in a high arc, foecast.js)
    const fromX = hurl ? B.w + 0.5 : (V.lineCol ?? B.line) - 0.5, y0 = hurl ? B.h * 0.4 : top, fly = hurl ? 0.6 : 0.45, arc = hurl ? 1.2 : 1.5, rise = hurl ? 0.45 : 1.2, gap = hurl ? 0.05 : 0.035; // (a Hurl's arc low and across the board, kept in the phone's frame)
    for (const q of it) q.d = q.d / 0.035 * gap;
    return { events: [e], dur: fly + 0.03 + it.length * gap + DUEL_VIEW.ma, step: (u, age) => { for (const q of it) {
      const f = Math.max(0, Math.min(1, (age - q.d) / fly)); q.v.hidden = age < q.d; const s = hurl ? f : sm(f);
      q.v.x = lerp(fromX, q.x, s); q.v.y = lerp(y0, q.y, s) - Math.sin(Math.PI * s) * arc; q.v.spin = (1 - s) * 6 * (hash(q.x, q.y) - 0.5); q.v.lift = Math.sin(Math.PI * s) * rise;
      if (f >= 1 && !q.knocked) { q.knocked = true; cellLocal(q.x, q.y, B, _a); V.bursts.burst(_a, kind === 'ember' ? 0xff7a2a : CLAY, 3, { speed: 0.4, life: 0.3, fall: kind === 'ember' ? -1 : 5, size: 0.02 }); } } },
      end: () => { for (const q of it) { q.v.hidden = false; q.v.x = q.x; q.v.y = q.y; q.v.spin = 0; q.v.lift = 0; } if (V.state?.style === 'pve') V.readPush(true); } };
  }

  /** The Line steps a column (overshoot 1.4); the domains' seam pushes into the side that gave ground. */
  line(e) {
    const V = this.view, from = V.lineCol ?? V.state.board.line, to = e.line, receiver = 1 - e.side;
    V.clash.push(receiver); if (V.state?.style === 'pve') V.foeCast.conquest(Math.round(from), Math.round(to)); // (the battle of wills: a column taken or lost, foecast.js)
    return { events: [e], dur: 0.45, step: (u) => V.setLine(lerp(from, to, ease(Math.min(1, u / 0.9), 1.4))), end: () => { V.setLine(to); if (V.state?.style === 'pve') V.readPush(true); } };
  }

  /** The drip: a drop of Lachryma falling a cell and crystallising into its gem. A skyfall refill (`sky`, Dovina's skyfall.js) drops
   *  instead from past the half's upstream edge (gravity's far end) down to its cell, a gem already, the columns staggered left to right
   *  as Puzzle & Dragons' skyfall comes in; its colour is the event's (a refill can be cleared in the same settle). */
  drip(it) {
    const V = this.view, P = V.pieces, b = V.state.board, cols = [...new Set(it.filter((e) => e.sky).map((e) => e.at[0]))].sort((p, q) => p - q), stack = new Map();
    const q = it.map((e, k) => {
      const v = P.add(e.sky ? 'gem' : 'orb', { id: e.id, colour: e.colour || V.known(e.id)?.colour || 'mirth', side: e.side }, e.at[0], e.at[1]); v.hidden = true;
      const [gx, gy] = b.grav(e.at[0], e.at[1]);
      if (!e.sky) return { e, v, g: [gx, gy], d: k * 0.06, t: 0.4, gem: false };
      let n = 1, x = e.at[0], y = e.at[1]; while (b.in(x - gx, y - gy) && n < 40) { x -= gx; y -= gy; n++; } // (cells to just past the far edge)
      v.kind = 'gem'; return { e, v, n, gx, gy, col: x + ',' + y, sky: true };
    });
    for (const r of q.filter((r) => r.sky).sort((p, q) => q.n - p.n)) { // (a column's refills stacked past its edge, the deepest lowest: they fall as one block)
      const i = stack.get(r.col) || 0; stack.set(r.col, i + 1); const D = r.n + i;
      r.g = [r.gx * D, r.gy * D]; r.d = cols.indexOf(r.e.at[0]) * SKY.col; r.t = SKY.fall * Math.sqrt(D); }
    const end = Math.max(0, ...q.map((r) => r.d + r.t));
    return { events: it, dur: end + 0.02 + DUEL_VIEW.ma, step: (u, age) => { for (const r of q) {
      const f = Math.max(0, Math.min(1, (age - r.d) / r.t)); r.v.hidden = age < r.d; const s = f * f;
      r.v.x = r.e.at[0] - r.g[0] * (1 - s); r.v.y = r.e.at[1] - r.g[1] * (1 - s);
      if (r.sky) { r.v.flash = f >= 1 ? Math.max(0, 0.7 - (age - r.d - r.t) * 5) : 0; continue; } // (a glint as it lands)
      if (f > 0.75 && !r.gem) { r.gem = true; r.v.kind = 'gem'; r.v.flash = 1; } if (r.gem) r.v.flash = Math.max(0, 1 - (f - 0.75) * 4); } },
      end: () => { for (const r of q) { r.v.hidden = false; r.v.kind = 'gem'; r.v.flash = 0; r.v.x = r.e.at[0]; r.v.y = r.e.at[1]; } } };
  }

  duelBreak(e) {
    const V = this.view, body = V.pieces.bodyAt(e.side);
    V.clash.flash(e.side); V.board.whiteEmo(e.side); V.depth[e.side] = e.depth;
    if (body) { cellLocal(body.x, body.y, V.board3, _a); V.bursts.burst(_a, GOLD, 16, { speed: 1.6, life: 0.5, fall: 0, spread: 0.1, size: 0.03 }); }
    return { events: [e], dur: 0.74, step: (u) => { if (u > 0.3) V.marks.stars(e.side, e.depth, V.headOf(e.side, _b)); }, end: () => V.marks.stars(e.side, e.depth, V.headOf(e.side, _b)) };
  }

  /** The orbs shed onto a side, thrown from the broken side's body over the Line in arcs. */
  shower(it) {
    const V = this.view, P = V.pieces, src = P.bodyAt(1 - it[0].side), sx = src ? src.cx : V.state.board.w / 2, sy = src ? src.cy : V.state.board.h / 2;
    const q = it.map((e, k) => { const v = P.add('orb', { id: e.id, side: e.side }, e.at[0], e.at[1]); v.hidden = true; return { e, v, d: k * 0.05 }; });
    return { events: it, dur: 0.55 + it.length * 0.05 + DUEL_VIEW.ma, step: (u, age) => { for (const r of q) {
      const f = Math.max(0, Math.min(1, (age - r.d) / 0.5)); r.v.hidden = age < r.d; const s = sm(f);
      r.v.x = lerp(sx, r.e.at[0], s); r.v.y = lerp(sy, r.e.at[1], s) - Math.sin(Math.PI * s) * 3; r.v.s = f > 0.85 ? 1 + 0.3 * Math.sin(Math.PI * (f - 0.85) / 0.15) : 1; } },
      end: () => { for (const r of q) { r.v.hidden = false; r.v.x = r.e.at[0]; r.v.y = r.e.at[1]; r.v.s = 1; } } };
  }

  fade(it) {
    const V = this.view, P = V.pieces, q = it.map((e) => ({ e, v: P.at(e.at[0], e.at[1]) })).filter((r) => r.v);
    for (const r of q) P.move(r.v, -1, -1);
    return { events: it, dur: 0.84, step: (u) => { for (const r of q) { r.v.dy = -0.7 * sm(u); r.v.s = 1 + 0.5 * u; r.v.sx = 1 - 0.6 * u; } },
      end: () => { for (const r of q) { cellLocal(r.v.x, r.v.y + r.v.dy, V.board3, _a); V.bursts.burst(_a, TEAR, 4, { speed: 0.5, life: 0.4, fall: 0 }); P.remove(r.v); } } };
  }

  /** The finisher: the crackle break and the data drain's beats on the board; the drain itself on the foe in the world. */
  finisher(e) {
    const V = this.view, P = V.pieces, B = V.board3, foe = 1 - e.side, hand = V.handPoint(foe, new THREE.Vector3());
    V.drainFoe();
    const half = P.list.filter((v) => v.kind !== 'body' && (foe === 1 ? v.cx >= (V.lineCol ?? B.line) : v.cx < (V.lineCol ?? B.line)));
    half.sort((a, b) => (foe === 1 ? b.cx - a.cx : a.cx - b.cx)); // (from its back wall toward the Line)
    const lineFrom = V.lineCol ?? B.line, home = foe === 1 ? B.w : 0; let crackled = false, stripped = 0;
    return { events: [e], dur: 1.95, step: (u, age) => {
      if (!crackled) { crackled = true; V.clash.flash(foe); for (const v of half) { cellLocal(v.x, v.y, B, _a); if (hash(v.cx, v.cy) < 0.35) V.bursts.burst(_a, [0xf1e7d0, 0x9cc8a8, 0x3a2a22][Math.floor(hash(v.cy, v.cx) * 3)], 2, { speed: 0.9, life: 0.45, fall: 5, size: 0.025 }); } }
      if (age >= 1.0 && age < 1.7) { const want = Math.floor(((age - 1.0) / 0.7) * half.length);
        while (stripped < Math.min(want, half.length)) { const v = half[stripped++]; cellLocal(v.x, v.y, B, _a); V.bursts.spiral(_a, hand, v.kind === 'gem' ? gemColour(v.colour, _c).getHex() : CLAY, 0, 0.35); P.remove(v); }
        V.pieces.hideBody(foe, Math.floor(age * 8) % 2 === 1); }
      if (age >= 1.7) { V.pieces.hideBody(foe, true); V.setLine(lerp(lineFrom, home, sm((age - 1.7) / 0.2))); if (e.side === 0) V.board.won(sm((age - 1.7) / 0.2)); }
    }, end: () => { for (const v of half.slice(stripped)) P.remove(v); V.setLine(home); V.pieces.hideBody(foe, true); V.finisherDone = true; } };
  }

  /** A side's turn begins: its points, the lost ones cracking one by one. */
  turn(e) {
    const V = this.view, lost = e.lost || 0, max = e.ap + lost, cut = V.cutIn?.turn?.(e) || 0; // (the turn's change torn across the screen first: cutin.js)
    if (V.state?.style === 'pve') { V.readPush(true); return { events: [e], dur: Math.max(0.05, cut) }; } // (no action points: the foot's beads are the push meters, duelview.js readPush)
    V.board.setAP(e.side, max, max, 0); V.apShown[e.side] = e.ap;
    let n = 0;
    return { events: [e], dur: Math.max(cut, lost ? 0.25 + lost * 0.14 : 0.05), step: (u, age) => { while (n < lost && age >= 0.1 + n * 0.14) { n++; V.board.crack(e.side, _a); V.bursts.burst(_a, 0x3a2a22, 4, { speed: 0.5, life: 0.35, fall: 4, size: 0.015 }); } },
      end: () => { while (n < lost) { n++; V.board.crack(e.side); } V.board.setAP(e.side, e.ap, max, lost); } };
  }
}
