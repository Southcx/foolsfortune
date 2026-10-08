// ---------------------------------------------------------------------------------------
// THE CELESTIAL BRUSH: hold RMB with the Soul Brush out and the world all but stops (a twenty-fifth of its speed), the screen turns to
// paper, and the mouse is the brush: LMB draws. A drawing is read when the hand rests (a short pause after the last stroke) and may
// be made of several strokes in any order ($P, gesture.js); what it means is planned at once against the view it was drawn over and
// paid for from the mind (Lachryma is the ink), and the ink takes, or runs. Several drawings can be made in one hold. When RMB is let
// go, time comes back and every drawing that took is done, one after another, in the order drawn (techniques.js).
//
// The mind pays a little for every second the paper is open and for the length of ink laid, and each technique has its cost; with too
// little the brush comes up dry (the drawing runs, the log says so once).
//
// Prior art: Okami's Celestial Brush (time stops, the canvas, techniques read from shapes, ink pots that empty with every stroke and
// refill with time), Metal Gear Rising's Blade Mode for the near-stop as a request to the time service (core/time.js) and the mouse
// taken from the camera while it is open (player.lookScale), and Magic Cat Academy for drawing straight over the scene.
// ---------------------------------------------------------------------------------------
import { sfx } from '../../audio/sfx.js';
import { recognize } from './gesture.js';
import { viewOf, TINT } from './techniques.js';

const SLOW = 0.04, DRAIN = 1.5, INK_PER_PX = 0.004, ENTER_MIN = 6, REST = 0.42, QUEUE_MAX = 4, SENS = 1.15;

export class Celestial {
  constructor(tool) {
    this.tool = tool;
    this.active = false;
    this.queue = [];
    this.restT = -1;
    this.drew = 0;
  }
  get game() { return this.tool.game; }
  get P() { return this.tool.P; }
  get canvas() { return this.tool.canvas; }

  canEnter() { return this.game.lachryma.available >= ENTER_MIN && !this.game.god?.controlling; }

  enter() {
    const g = this.game, P = this.P;
    this.active = true; this.queue.length = 0; this.restT = -1; this.drew = 0; this.x = null;
    g.time.slow('brush', SLOW);
    P.lookScale.brush = 0;
    this.canvas.show(true);
    this.x = this.canvas.cur.x; this.y = this.canvas.cur.y;
    sfx.brushIn?.();
    g.events?.emit('brush.canvas', { open: true });
  }

  exit(why = 'let go') {
    if (!this.active) return;
    const g = this.game, P = this.P;
    if (this.canvas.drawing || this.canvas.pending().length) this.read(); // (a drawing still wet when the brush lifts is read too)
    this.active = false;
    g.time.free('brush');
    P.lookScale.brush = 1;
    this.canvas.show(false);
    sfx.brushOut?.();
    // the painting takes: each drawing, in the order drawn
    this.queue.forEach((plan, i) => g.fx.after(0.05 + i * 0.16, () => plan.run()));
    g.events?.emit('brush.canvas', { open: false, drawings: this.queue.length, why });
    this.queue = [];
  }

  /** The frame, in real seconds (`raw`): the paper, the brush, the reading. */
  update(raw, inp) {
    const g = this.game, cv = this.canvas;
    const ask = DRAIN * raw / (g.psyche?.widen?.('ouranurgy.still') || 1); // (Ouranurgy: the canvas stays open longer on the same Lachryma)
    const took = g.lachryma.drain(ask, 'brush');
    if (!inp.isDown('Mouse2')) return this.exit('let go');
    if (took < ask * 0.5) return this.exit('empty');
    // the brush's point follows the mouse
    const W = cv.size.w, H = cv.size.h;
    this.x = Math.min(W - 2, Math.max(2, this.x + inp.dx * SENS));
    this.y = Math.min(H - 2, Math.max(2, this.y + inp.dy * SENS));
    cv.cursor(this.x, this.y, g.lachryma.available / 20);
    if (inp.isDown('Mouse0') && this.queue.length < QUEUE_MAX) {
      if (!cv.drawing) { cv.begin(this.x, this.y); sfx.inkDab?.(0.5); }
      const d = cv.extend(this.x, this.y);
      if (d > 0) {
        this.drew += d;
        const ink = d * INK_PER_PX / (g.alchemy?.widen?.('visualization.canvas') ?? 1); // (Visualization: the same Lachryma draws a longer line)
        if (g.lachryma.drain(ink, 'brush') < ink * 0.5) { cv.lift(); this.dry(); }
        else if (cv.stroke?.length > 600) { cv.lift(); this.restT = 0; } // (a stroke that goes on and on is ended: it is read as it is)
      }
      this.restT = -1;
    } else if (cv.drawing) { cv.lift(); this.restT = 0; }
    // the hand rests: read what it drew
    if (this.restT >= 0) { this.restT += raw; if (this.restT >= REST) { this.restT = -1; this.read(); } }
  }

  /** Read the pending drawing: plan it, pay for it, and let it take (or run). */
  read() {
    const g = this.game, cv = this.canvas, strokes = cv.pending();
    if (!strokes.length) return;
    const rec = recognize(strokes);
    const plan = this.tool.techniques.plan(rec, viewOf(g, cv.size.w, cv.size.h));
    if (!plan) { cv.run(); sfx.inkRun?.(); g.events?.emit('brush.miss', { strokes: strokes.length }); return; }
    if (plan.empty) { cv.fade(); g.events?.emit('brush.miss', { strokes: strokes.length, shape: rec?.name }); return; }
    if (!g.lachryma.spend(plan.cost, `brush.${plan.id}`)) { cv.run(); this.dry(); return; }
    cv.take(TINT[plan.id] || '#f2c35a');
    sfx.glyphTake?.(plan.id);
    this.queue.push(plan);
    g.events?.emit('brush.read', { technique: plan.id, strokes: strokes.length });
  }

  dry() {
    const g = this.game;
    sfx.fizzle?.();
    g.hud?.lachrymaPulse?.(false);
    g.log?.say('info', 'Your brush runs dry.', { key: 'brushdry', throttle: 3 });
  }
}
