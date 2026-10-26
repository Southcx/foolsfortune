// ---------------------------------------------------------------------------------------
// THE SEAM: a place changed under a cover. Going down into a Well (or any change that builds a place and teleports the Courier into
// it) dips to the dark, makes the change while nothing can be seen, holds for a couple of drawn frames so the first frame of the new
// place is already done, and comes back up. The cover carries no words (CLAUDE.md: marks in the world are not text); its look is a
// `kind` for Calissa to dress (`data-kind` on the cover: 'maw' for a Well, a swirl of the pool closing over the view).
//
// STAGED (the owner's iPhone, v284: the graphics taken back 0.2 s after the Raceway was built and drawn in one frame): a change too big
// for one frame hands its work to `stage(steps)` from inside the crossing; the cover holds while the steps run, as many a frame as fit
// SEAM.slice real ms (the garbage of one has a frame to be collected before the next), then the WARM-UP: the textures now in view that
// the card has never had are uploaded a few MB a frame. While either runs under the plain cover the world is not drawn (`covering`:
// boot/frame.js), so nothing is uploaded at once behind it; the hold's frames then draw the place before it is shown. A step that throws is said in the console and its steps dropped; past SEAM.most
// real s what is left runs at once (never a cover that does not lift). On a phone the place is drawn behind the cover all along, its
// first draws a few a frame (render/firstdraws.js), and the hold lasts until none is waiting.
//
// Prior art: the console way of hiding a load inside a transition (Metroid Prime's doors and elevators, Jak and Daxter's streamed
// world behind a fade, the RPG battle wipe), timed on the game's own clock so a playtest and a replay step through it the same.
//
//   game.seam = new Seam(game)   game.seam.cross(fn, { kind, out, hold, back }) -> false if one is already under way
//   game.seam.stage(steps)   (inside a crossing's fn: an iterable of work run a slice a frame under the cover before it opens)
//   game.seam.update(rawDt) (main.js, each tick)   game.seam.busy   (a kind with a wipe of its own, game[kind + 'Wipe'], crosses under
//   it: its close(onCovered, opts) and open(); 'maw' a Well's, game.mawWipe; 'aberrant' a puzzle duel's, game.aberrantWipe with { foe })
// ---------------------------------------------------------------------------------------

/** slice: real ms of staged work a frame; uploadMB: texture MB sent to the card a frame in the warm-up; most: real s a stage may take
 *  before the rest runs at once. */
export const SEAM = { slice: 10, uploadMB: 4, most: 20 };

export class Seam {
  constructor(game) {
    this.game = game;
    this.job = null;
    this.el = document.createElement('div');
    this.el.id = 'seam';
    this.el.style.cssText = 'position:fixed;inset:0;background:#07030d;opacity:0;pointer-events:none;z-index:11';
    document.body.appendChild(this.el);
  }

  get busy() { return !!this.job; }
  /** The plain cover is shut and staged work or the warm-up runs: the world's draw is skipped (boot/frame.js). */
  get covering() { const J = this.job; return !!J && !J.wipe && (J.phase === 'stage' || J.phase === 'warm'); }

  /** Dip to the dark over `out` seconds, run `fn` there, hold `hold` drawn frames, come back over `back` seconds. */
  cross(fn, { kind = 'plain', out = 0.22, hold = 2, back = 0.35, ...opts } = {}) {
    if (this.job) return false;
    // a kind's own wipe when it is there (Calissa's: vfx/mawwipe.js, vfx/aberrantwipe.js: close(onCovered, opts), open()), else the plain dark cover
    const wipe = this.game[`${kind}Wipe`] || null;
    if (wipe?.close && !wipe.active) {
      const job = this.job = { fn, hold, phase: 'wipe', wipe };
      if (wipe.close(() => { try { fn(); } finally { this.after(job); } }, opts) !== false) return true;
      this.job = null; // (it would not close: the plain dark cover instead)
    }
    this.job = { fn, out, hold, back, t: 0, phase: 'out' };
    this.el.dataset.kind = kind;
    return true;
  }

  update(dt) {
    const J = this.job; if (!J) return;
    if (J.phase === 'out') {
      J.t += dt; this.el.style.opacity = String(Math.min(1, J.t / J.out));
      if (J.t >= J.out) { this.el.style.opacity = '1'; try { J.fn(); } finally { this.after(J); } }
    } else if (J.phase === 'wipe') {
      // (the wipe is closing: it calls back when the view is covered)
    } else if (J.phase === 'stage') {
      this.runSteps(J);
    } else if (J.phase === 'warm') {
      this.warm(J);
    } else if (J.phase === 'hold') {
      if (--J.n <= 0 && (!this.game.firstDraws?.pending || performance.now() - (J.start ?? 0) > SEAM.most * 1000)) { this.lifted(J); if (J.wipe) { J.wipe.open(); this.job = null; } else { J.phase = 'back'; J.t = 0; } }
    } else {
      J.t += dt; this.el.style.opacity = String(Math.max(0, 1 - J.t / J.back));
      if (J.t >= J.back) { this.el.style.opacity = '0'; this.job = null; }
    }
  }

  /** Inside a crossing's fn: work to run under the cover a slice a frame (an iterable: a generator's steps). False when no crossing. */
  stage(steps) {
    const J = this.job; if (!J || !steps) return false;
    (J.steps ||= []).push(steps[Symbol.iterator] ? steps[Symbol.iterator]() : steps);
    return true;
  }

  /** The crossing's fn has run: its staged work, then the warm-up, then the hold. */
  after(J) { J.phase = J.steps?.length ? 'stage' : 'warm'; J.t0 = J.start = performance.now(); J.n = J.hold; J.staged = J.steps?.length || 0; }

  /** The cover lifts: how long the staged work and the warm-up took, for the field report (debug/fieldreport.js). */
  lifted(J) { this.game.events?.emit('seam.lift', { kind: this.el.dataset.kind || J.wipe?.constructor?.name || 'plain', staged: J.staged || 0, ms: Math.round(performance.now() - (J.start ?? performance.now())), textures: J.texN || 0 }); }

  runSteps(J) {
    const end = performance.now() + SEAM.slice, all = performance.now() - J.t0 > SEAM.most * 1000;
    while (J.steps.length && (all || performance.now() < end)) {
      try { if (J.steps[0].next().done) J.steps.shift(); } catch (e) { console.error('seam: a staged step failed', e); J.steps.shift(); }
    }
    if (!J.steps.length) { J.phase = 'warm'; J.t0 = performance.now(); }
  }

  /** The textures in view the card has never had, a few MB a frame. (Not the programs: compileAsync of the scene compiled every
   *  zone's, 160 more than drawn on the emulated phone; each is drawn's own to compile at the first frame, under the hold.) */
  warm(J) {
    const g = this.game, R = g.renderer, scene = g.scene, cam = g.camera;
    if (!R || !scene) { J.phase = 'hold'; return; }
    if (!J.tex) {
      const seen = new Set(), list = (J.tex = []);
      const take = (t) => { if (!t?.isTexture || seen.has(t)) return; seen.add(t); if (t.version > 0 && !t.isRenderTargetTexture && !R.properties.get(t).__webglTexture) list.push(t); };
      J.texN = 0;
      scene.traverseVisible((o) => { for (const m of [].concat(o.material || [])) { for (const v of Object.values(m)) take(v); if (m.uniforms) for (const u of Object.values(m.uniforms)) take(u?.value); } });
    }
    let mb = 0;
    while (J.tex.length && mb < SEAM.uploadMB) { const t = J.tex.pop(), im = t.image || {}; try { R.initTexture(t); J.texN++; } catch { /* drawn as it was */ } mb += ((im.width || 1) * (im.height || 1) * 4) / 1e6; }
    if (J.tex.length) return;
    J.phase = 'hold'; J.n = J.hold;
  }
}
