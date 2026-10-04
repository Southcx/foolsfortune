// ---------------------------------------------------------------------------------------
// THE OVERTURE'S TRAILER: the cinematic the title opens with, cut to Wanda's "Fortune Favours the Fool" (music/overture.js), played on
// the title once a session (docs/boards/OVERTURE.md is the board; this is its director). The world built behind the title is run
// for it, the Courier is put in each place a camera shot needs and moved there, and the camera is the cine system's (cine/sequences.js:
// 'overture', one segment a camera shot, editable in the workbench like the chest's); at ASCEND it hands the screen back to the title's
// own scene (the precipice, where the board ends anyway), cranes up, and fires the logo (vfx/logofire.js) on the strike.
//
//   THE CLOCK   the music's: the arranger's place in the score (section and bar) and the audio clock give the time since the first
//               note exactly, so a camera shot never drifts from its hit; with no overture playing (a test, `/overture`), a clock of its own
//   THE BOARD   cine/overture.board.js: each camera shot, when, where (a PLACE: a named spot in the world, its yaw the frame its camera
//               is keyed in), what the Courier does (keys held, a tool drawn, a small function), and the segment that frames it
//   THE SANDBOX nothing done in the trailer is the player's: the ledger is put back as it was, the log says nothing, the achievements
//               wait, the place's own music stands down, and the Courier is put back where they were, tools away
//
// Prior art: the in-engine trailers of the sixth generation (Metal Gear Solid 2's and Shenmue's, made from the game running, its own
// camera scripted), Unreal's Sequencer and Unity's Timeline (one clock, camera shots on it), and the anime opening's cut-a-bar grammar (the
// board's own sources).
//
//   game.overture = new Overture(game)   .start({ own })   .update(rawDt)   .active   .world (is the world the picture)   .skip()
//   .seek(t)   .afterRender(canvas)   (main.js: after the frame is drawn, for the stills)   .titleFrame(titleScene)   (after the title's update)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { Stills } from '../ui/stills.js';
import { LogoFire } from '../vfx/logofire.js';
import { BOARD, PLACES, BAR, HANDOVER, ROAR, STRIKE, END, OVERTURE_TITLE } from './overture.board.js';

export class Overture {
  constructor(game) {
    this.game = game;
    this.active = false; this.world = false;
    this.t = 0; this.i = -1; this.h = null;
    this.stills = new Stills();
    this.held = new Set();
    this.seen = false;
    const st = document.createElement('style'); st.textContent = 'body.overture #godarts { display: none !important; }'; document.head.appendChild(st); // (the HUD steps out: hideui.js; the god hand's bar too)
    // any key or click while it plays: straight to the title (taken here, before the title's own keys see it)
    const skip = (e) => { if (!this.active || e.repeat) return; e.stopImmediatePropagation(); e.preventDefault?.(); this.skip(); };
    addEventListener('keydown', skip, true); addEventListener('mousedown', skip, true);
  }

  // ---------------------------------------------------------------- the clock
  /** Seconds since the overture's first note: the arranger's own count when it is playing, else this one's. */
  clock(raw) {
    const A = this.game.music?.arr;
    if (A?.alive && A.score?.title === OVERTURE_TITLE) {
      const S = A.score, ctx = A.ctx;
      let bars = 0; // (the time of the bar about to be laid out, from the first note: every section before it, then its bars)
      for (let i = 0; i < A.section && i < S.sections.length; i++) { const s = S.sections[i]; bars += s.bars * (s.beats || S.beats || 4) * 60 / (s.bpm || S.bpm); }
      const s = S.sections[Math.min(A.section, S.sections.length - 1)];
      bars += A.bar * (s.beats || S.beats || 4) * 60 / (s.bpm || S.bpm);
      this.ownClock = false;
      return bars - (A.next - ctx.currentTime);
    }
    return this.t + raw;
  }
  /** Is the overture playing (so the trailer should be)? */
  hearing() { const A = this.game.music?.arr; return !!(A?.alive && A.score?.title === OVERTURE_TITLE); }

  // ---------------------------------------------------------------- start, stop
  start({ own = false } = {}) {
    if (this.active) return;
    const g = this.game, P = g.player;
    this.active = true; this.world = true; this.t = 0; this.i = -1; this.seen = true; this.ownClock = own;
    // the sandbox: what the player has is kept aside, and put back after
    this.keep = { pos: P.pos.clone(), yaw: P.yaw, killY: P.killY, ledger: JSON.stringify({ life: g.ledger.life, rec: g.ledger.rec, firsts: g.ledger.firsts, done: g.ledger.done, sess: g.ledger.sess }), play: g.ledger.play };
    this.say = g.log.say; g.log.say = () => null;
    this.achTick = g.achievements?.tick; if (g.achievements) g.achievements.tick = () => {};
    this.spawned = [];
    document.getElementById('title')?.style.setProperty('opacity', '0'); // (the title's words wait for the title)
    g.ui?.want('overture', true); document.body.classList.add('overture');
    this.h = g.cine.play('overture', { anchors: this.anchors = { here: new THREE.Vector3(), courier: () => g.player.renderPos, look: new THREE.Vector3() }, yaw: 0, id: 'overture' });
    g.events.emit('overture.start', { own });
  }

  /** The world's part is over: the title's scene is the picture from here (ASCEND), the sandbox put back. */
  leaveWorld() {
    if (!this.world) return;
    const g = this.game, P = g.player;
    this.world = false;
    this.release(); this.cleanShot();
    for (const t of g.belt?.tools || []) if (t.wants) t.stow?.();
    for (const s of this.spawned) s.dispose?.();
    this.spawned = [];
    this.h?.stop(); this.h = null;
    g.cinema?.cut('overture'); g.mood?.free('overture'); g.time?.free('overture');
    this.stills.clear();
    // (back where they were, as they were)
    P.pos.copy(this.keep.pos); P.prevPos.copy(this.keep.pos); P.renderPos.copy(this.keep.pos); P.vel.set(0, 0, 0); P.yaw = this.keep.yaw; P.killY = this.keep.killY; P.place?.();
    const L = JSON.parse(this.keep.ledger), led = g.ledger;
    Object.assign(led, L); led.play = this.keep.play; led.version++; led.save();
    g.log.say = this.say;
    if (g.achievements) g.achievements.tick = this.achTick;
    document.getElementById('title')?.style.setProperty('opacity', '1');
    g.ui?.want('overture', false); document.body.classList.remove('overture');
  }

  stop() {
    if (!this.active) return;
    this.leaveWorld();
    this.logo?.dispose(); this.logo = null;
    const lg = document.querySelector('#title .logo'); if (lg) lg.style.removeProperty('opacity');
    const press = document.querySelector('#title .press'); if (press) press.style.removeProperty('visibility');
    this.active = false;
    this.game.events.emit('overture.end', { at: +this.t.toFixed(1) });
  }

  /** Jump the trailer's own clock (tests, the workbench): the next update cuts to the camera shot at t. */
  seek(t) { this.ownClock = true; this.t = t; this.i = -1; for (let i = 0; i < BOARD.length && BOARD[i].t <= t; i++) this.i = i - 1; }

  /** Any key: straight to the title (the music plays on into it by itself). */
  skip() { if (this.active) this.stop(); }

  // ---------------------------------------------------------------- per frame
  update(raw) {
    if (!this.active) return;
    const g = this.game;
    if (!this.ownClock && !this.hearing() && this.t > 1) { this.stop(); return; } // (the music stopped under it: so does the trailer)
    this.t = this.clock(raw);
    if (this.t >= HANDOVER && !g.title?.active) { this.stop(); return; } // (played in the world, `/overture`: there is no title to hand to)
    if (this.t >= HANDOVER && this.world) this.leaveWorld();
    if (this.t >= END) { this.stop(); return; }
    if (!this.world) return;
    // the camera shot for now
    let i = this.i;
    while (i + 1 < BOARD.length && this.t >= BOARD[i + 1].t) i++;
    if (i !== this.i && i >= 0) this.enter(i);
    const S = BOARD[this.i];
    if (S) {
      const u = (this.t - S.t) / Math.max(0.01, (BOARD[this.i + 1]?.t ?? HANDOVER) - S.t);
      S.frame?.(this.sapi, u, this.t - S.t);
    }
  }

  enter(i) {
    const g = this.game, S = BOARD[i];
    this.release();
    this.cleanShot();
    this.i = i;
    this.sapi = Object.create(this.api); this.sapi.done = []; // (the camera shot's own scope: what one notes is gone at the next)
    const at = S.place ? PLACES[S.place]?.(g) : null;
    if (at) {
      this.anchors.here.copy(at.pos);
      this.h.yaw = at.yaw ?? 0;
      if (S.put !== false) this.put(at.pos, at.yaw ?? 0);
    }
    for (const k of S.hold || []) { g.input.down.add(k); this.held.add(k); }
    S.enter?.(this.sapi, at);
    this.h?.go(S.id, { tint: S.tint });
  }

  /** The Courier put somewhere at once (no sparkle, no reset of their pool: an edit, not a teleport they made). */
  put(pos, yaw) {
    const P = this.game.player;
    P.pos.copy(pos); P.prevPos.copy(pos); P.renderPos.copy(pos); P.vel.set(0, 0, 0);
    P.yaw = yaw; P.bodyYaw = yaw; P.pitch = 0;
    P.killY = Math.min(this.keep.killY ?? -Infinity, pos.y - 90); // (the sand sea lies far below the workshop: its floor of the world with it, as toDunes does)
    P.wallrun = null; P.mantle = null; P.sliding = false; P.dashT = 0; P.riding = null; P.platform = null;
    P.techs?.reset?.();
    P.place?.();
  }

  cleanShot() { for (const fn of this.sapi?.done || []) { try { fn(); } catch (e) { console.error(e); } } if (this.sapi) this.sapi.done = []; }

  release() { for (const k of this.held) this.game.input.down.delete(k); this.held.clear(); }

  /** What a camera shot's own functions may do (overture.board.js). */
  get api() {
    const self = this, g = this.game;
    return this._api ||= {
      game: g,
      get t() { return self.t; },
      hold(...keys) { for (const k of keys) { g.input.down.add(k); self.held.add(k); } },
      let(...keys) { for (const k of keys) { g.input.down.delete(k); self.held.delete(k); } },
      press(k) { g.input.down.add(k); g.input.pressed?.add?.(k); setTimeout(() => g.input.down.delete(k), 60); },
      put: (p, y) => self.put(p, y),
      keep(o) { self.spawned.push(o); return o; },
      after(fn) { this.done.push(fn); },
      still: () => { self.wantStill = true; },
      riffle: (k) => self.stills.riffle(k),
      clearStills: () => self.stills.clear(),
    };
  }

  /** After the world's frame is drawn: a still taken now holds exactly what was seen. */
  afterRender(canvas) { if (this.wantStill) { this.wantStill = false; this.stills.take(canvas); } }

  // ---------------------------------------------------------------- the title's part: ASCEND to THE STRIKE
  /** After the title scene's own update: the crane up, and the logo fired on the strike. */
  titleFrame(T) {
    if (!this.active || this.world) return;
    const t = this.t, cam = T.camera;
    // the crane: from close on them, sitting on the edge, up and back to the title's own framing (and the whole sea), through ASCEND and HOLD
    const e = THREE.MathUtils.smoothstep(t, HANDOVER, ROAR);
    if (e < 1) {
      const head = T.ch.root.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, 0.75, 0));
      const look = cam.position.clone().addScaledVector(cam.getWorldDirection(new THREE.Vector3()), 30); // (where the title looks)
      const near = head.clone().addScaledVector(cam.position.clone().sub(head).normalize(), 2.0).add(new THREE.Vector3(0, -0.15, 0));
      cam.position.lerpVectors(near, cam.position, e);
      cam.lookAt(head.lerp(look, e));
    }
    const press = document.querySelector('#title .press'); if (press) press.style.visibility = t < END - 0.6 ? 'hidden' : ''; // (its breath is a CSS animation: it would win over an opacity)
    // the logo: raw clay out of the dark on the kiln's roar, glazed through it, gold in one frame on the strike
    const lg = document.querySelector('#title .logo');
    if (t >= ROAR - 0.4) {
      this.logo ||= new LogoFire(T.scene);
      this.logo.place(cam);
      const glaze = t < STRIKE ? THREE.MathUtils.clamp((t - ROAR) / (STRIKE - 0.1 - ROAR), 0, 1) * 2.8 : 4;
      const out = THREE.MathUtils.clamp((t - STRIKE - 1.2) / 1.2, 0, 1);
      this.logo.set(glaze, THREE.MathUtils.clamp((t - ROAR + 0.4) / 0.8, 0, 1) * (1 - out), t >= STRIKE ? Math.max(0, 1 - (t - STRIKE) / 0.5) : 0);
      if (lg) lg.style.opacity = String(out);
    } else if (lg) lg.style.opacity = '0';
  }
}

export { BAR };
