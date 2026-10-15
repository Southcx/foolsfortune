// ---------------------------------------------------------------------------------------
// THE HOW-TO: a first-play lesson drawn as a spotlight over the page (docs/plans/CASINO.md's table chrome; Calissa's brief, section 4).
// A full-screen dim with one hole cut round a target's screen rectangle, the hole's edge a thin walking ring of the oil film, and one
// line of text on a lacquer plate beside it, one idea per step. Pips show the progress; NEXT moves on; SKIP and Esc end it at once.
// A step may WAIT for a predicate (the player making the move) instead of NEXT: it advances on its own once the predicate holds, so
// the player does the step and does not only read it. The hole lets clicks through to the target; everything else is blocked while
// a lesson runs, so the page under it cannot be used by accident.
//
// No save writes here: whether a player has seen the how-to is the owner module's (Dovina's coach), which calls play() and decides
// when. Nothing is text in the world: this is the one window of words the table view allows, and it is not the log.
//
// Prior art taken: Slay the Spire's and Balatro's first-run tutorial boxes (a dim with the one thing lit, a line beside it, skippable),
// the spotlight of the Unreal Tournament and Factorio tutorials (a hole cut in the dark, its edge drawn), Hearthstone's "click here"
// steps that wait for the player's own move, and the Xbox Accessibility Guidelines (a skip that is always there; 107: every action
// by keyboard too: Esc skips, Enter takes NEXT).
// The film colours are the oxidation module's own (filmColour, the walk of the oil film), not a second iridescence.
//
//   new HowTo({ root })                          one per page (created lazily by howTo())
//   howTo.play(steps, { onDone, onSkip })        steps: [{ target: () => DOMRect | null, line: string, wait?: () => boolean }]
//                                                 target null (or absent) puts no hole in: the whole page dims and the line is centred
//   howTo.stop()                                 ends a lesson without calling onDone or onSkip
//   howTo.playing                                true while a lesson runs
//   helpButton(onReplay) -> element              the small "?" that replays a how-to (its own button, always on top of the veil)
// ---------------------------------------------------------------------------------------
import { filmColour } from '../vfx/oxidation.js';

const CSS = `
#htw-root{position:fixed;inset:0;z-index:9000;pointer-events:none;font-family:"M PLUS Rounded 1c",system-ui,sans-serif;color:#f4ecd8}
#htw-root .htw-blk{position:fixed;pointer-events:auto;background:transparent}
#htw-root .htw-dim{position:fixed;inset:0;background:rgba(12,9,18,.72);pointer-events:auto}
#htw-root .htw-hole{position:fixed;border-radius:10px;box-shadow:0 0 0 100vmax rgba(12,9,18,.72);pointer-events:none}
#htw-root .htw-ring{position:fixed;border-radius:12px;padding:5px;pointer-events:none;
  background:linear-gradient(90deg,var(--f0),var(--f1),var(--f2),var(--f3),var(--f0),var(--f1),var(--f2),var(--f3));background-size:200% 100%;
  -webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;
  mask:linear-gradient(#000 0 0) content-box exclude,linear-gradient(#000 0 0);
  animation:htwWalk 3.2s linear infinite}
@keyframes htwWalk{from{background-position:0 0}to{background-position:-200% 0}}
#htw-root .htw-card{position:fixed;width:min(440px,calc(100vw - 32px));box-sizing:border-box;padding:14px 16px 12px;border-radius:8px;pointer-events:auto;
  background:linear-gradient(180deg,#2a2034,#17111f);box-shadow:0 0 0 2px #17111f,0 0 0 3px rgba(255,255,255,.14),0 8px 24px rgba(0,0,0,.5)}
#htw-root .htw-line{font-size:20px;line-height:1.35;margin:0 0 10px;font-weight:700}
#htw-root .htw-foot{display:flex;align-items:center;gap:10px}
#htw-root .htw-pips{display:flex;gap:6px;flex:1;align-items:center}
#htw-root .htw-pip{width:9px;height:9px;border-radius:50%;border:1.5px solid #f4ecd8;box-sizing:border-box;opacity:.5}
#htw-root .htw-pip.done{background:#f4ecd8;opacity:.85}
#htw-root .htw-pip.now{background:var(--f2);border-color:var(--f2);opacity:1;transform:scale(1.25)}
#htw-root .htw-count{font-size:13px;opacity:.7;margin-left:4px}
#htw-root .htw-btn{font:inherit;font-size:15px;font-weight:800;letter-spacing:.04em;padding:7px 14px;border-radius:5px;border:0;cursor:pointer;background:#f4ecd8;color:#17111f}
#htw-root .htw-btn.ghost{background:transparent;color:#f4ecd8;box-shadow:inset 0 0 0 1.5px rgba(244,236,216,.6)}
#htw-root .htw-btn:focus-visible{outline:2px solid var(--f2);outline-offset:2px}
#htw-root .htw-wait{font-size:14px;opacity:.75;font-style:italic}
#htw-root .htw-tick{position:fixed;width:0;height:0;border:8px solid transparent;pointer-events:none}
.htw-help{position:fixed;z-index:9001;width:30px;height:30px;border-radius:50%;border:1.5px solid #f4ecd8;background:#17111f;color:#f4ecd8;
  font:inherit;font-size:16px;font-weight:800;cursor:pointer;padding:0;line-height:1}
.htw-help:focus-visible{outline:2px solid #f0e442;outline-offset:2px}
`;

const EDGE = 8;        // px kept clear of the viewport's edge
const PAD = 10;        // px the hole is grown past the target's rectangle
const WAIT_BEAT = 450; // ms between a wait's predicate turning true and the step advancing

function ensureCss() {
  if (document.getElementById('htw-css')) return;
  const st = document.createElement('style');
  st.id = 'htw-css';
  st.textContent = CSS;
  document.head.appendChild(st);
}

function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
}

export class HowTo {
  constructor({ root = document.body } = {}) {
    ensureCss();
    this.parent = root;
    this.playing = false;
    this.steps = [];
    this.i = 0;
    this.onDone = null;
    this.onSkip = null;
    this.raf = 0;
    this.beatAt = 0;
    this.keyFn = (e) => this.onKey(e);
    this.build();
  }

  build() {
    const root = el('div');
    root.id = 'htw-root';
    root.style.display = 'none';
    // Four blockers round the hole (the hole itself lets clicks through to the target); a full blocker when there is no hole.
    this.blk = ['top', 'bot', 'lft', 'rgt', 'all'].map((k) => {
      const b = el('div', 'htw-blk');
      b.dataset.k = k;
      root.appendChild(b);
      return b;
    });
    this.dim = el('div', 'htw-dim');
    this.dim.style.display = 'none';
    root.appendChild(this.dim);
    this.hole = el('div', 'htw-hole');
    this.ring = el('div', 'htw-ring');
    for (let k = 0; k < 4; k++) root.style.setProperty(`--f${k}`, filmColour(k / 4).getStyle());
    this.card = el('div', 'htw-card');
    this.line = el('p', 'htw-line');
    this.foot = el('div', 'htw-foot');
    this.pips = el('div', 'htw-pips');
    this.count = el('span', 'htw-count');
    this.pips.appendChild(this.count);
    this.skipBtn = el('button', 'htw-btn ghost', 'SKIP');
    this.skipBtn.type = 'button';
    this.skipBtn.addEventListener('click', () => this.finish(false));
    this.nextBtn = el('button', 'htw-btn', 'NEXT ›');
    this.nextBtn.type = 'button';
    this.nextBtn.addEventListener('click', () => this.advance());
    this.waitLine = el('span', 'htw-wait', '');
    this.foot.append(this.pips, this.waitLine, this.skipBtn, this.nextBtn);
    this.card.append(this.line, this.foot);
    root.append(this.hole, this.ring, this.card);
    // The ring sits on the hole's edge; the hole's box-shadow is the dim outside it.
    this.root = root;
    this.parent.appendChild(root);
  }

  // The lesson starts at step 0. A step's target is read every frame, so a moving thing keeps its hole.
  play(steps = [], { onDone = null, onSkip = null } = {}) {
    if (!steps.length) { if (onDone) onDone(); return; }
    this.stop();
    this.steps = steps;
    this.i = 0;
    this.onDone = onDone;
    this.onSkip = onSkip;
    this.playing = true;
    this.root.style.display = '';
    window.addEventListener('keydown', this.keyFn, true);
    this.show();
    this.tick();
  }

  // Ends without calling onDone or onSkip (a caller that tears its page down).
  stop() {
    if (!this.playing) return;
    this.playing = false;
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    window.removeEventListener('keydown', this.keyFn, true);
    this.root.style.display = 'none';
    this.steps = [];
    this.onDone = null;
    this.onSkip = null;
  }

  finish(done) {
    const cb = done ? this.onDone : this.onSkip;
    this.stop();
    if (cb) cb();
  }

  advance() {
    if (!this.playing) return;
    if (this.i >= this.steps.length - 1) { this.finish(true); return; }
    this.i++;
    this.beatAt = 0;
    this.show();
  }

  onKey(e) {
    if (!this.playing) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      this.finish(false);
    } else if (e.key === 'Enter' && !this.nextBtn.hidden && !this.nextBtn.disabled) {
      e.preventDefault();
      e.stopPropagation();
      this.advance();
    }
  }

  // The card's own line and pips for the step now showing.
  show() {
    const s = this.steps[this.i];
    const n = this.steps.length;
    this.line.textContent = s.line;
    this.count.textContent = `${this.i + 1} / ${n}`;
    this.pips.querySelectorAll('.htw-pip').forEach((p) => p.remove());
    for (let k = 0; k < n; k++) {
      const p = el('span', 'htw-pip' + (k < this.i ? ' done' : k === this.i ? ' now' : ''));
      this.pips.insertBefore(p, this.count);
    }
    const waits = typeof s.wait === 'function';
    this.nextBtn.hidden = waits;
    this.waitLine.textContent = waits ? 'Try it:' : '';
    this.nextBtn.textContent = this.i >= n - 1 ? 'DONE' : 'NEXT ›';
  }

  // Once a frame: place the hole and card on the target's rectangle, and move on when a wait is met.
  tick() {
    if (!this.playing) return;
    this.raf = requestAnimationFrame(() => this.tick());
    const s = this.steps[this.i];
    let r = null;
    try { r = s.target ? s.target() : null; } catch (err) { r = null; }
    this.place(r);
    if (typeof s.wait === 'function') {
      let met = false;
      try { met = !!s.wait(); } catch (err) { met = false; }
      if (met) {
        const now = performance.now();
        if (!this.beatAt) this.beatAt = now;
        if (now - this.beatAt >= WAIT_BEAT) this.advance();
      } else {
        this.beatAt = 0;
      }
    }
  }

  place(rect) {
    const vw = window.innerWidth, vh = window.innerHeight;
    if (!rect || !(rect.width > 0) || !(rect.height > 0)) {
      this.hole.style.display = 'none';
      this.ring.style.display = 'none';
      this.dim.style.display = '';
      this.blk.forEach((b) => { b.style.cssText = b.dataset.k === 'all' ? `left:0;top:0;width:${vw}px;height:${vh}px` : 'display:none'; });
      this.card.style.left = `${Math.max(EDGE, (vw - this.card.offsetWidth) / 2)}px`;
      this.card.style.top = `${Math.max(EDGE, vh * 0.62)}px`;
      return;
    }
    const x = Math.max(0, rect.left - PAD), y = Math.max(0, rect.top - PAD);
    const w = Math.min(vw - x, rect.width + PAD * 2), h = Math.min(vh - y, rect.height + PAD * 2);
    this.dim.style.display = 'none';
    this.hole.style.display = '';
    this.ring.style.display = '';
    for (const [key, sx, sy, sw, sh] of [
      ['top', 0, 0, vw, y],
      ['bot', 0, y + h, vw, vh - (y + h)],
      ['lft', 0, y, x, h],
      ['rgt', x + w, y, vw - (x + w), h],
    ]) {
      const b = this.blk.find((q) => q.dataset.k === key);
      b.style.cssText = sw > 0 && sh > 0 ? `left:${sx}px;top:${sy}px;width:${sw}px;height:${sh}px` : 'display:none';
    }
    this.blk.find((q) => q.dataset.k === 'all').style.display = 'none';
    for (const e of [this.hole, this.ring]) {
      e.style.left = `${x}px`; e.style.top = `${y}px`; e.style.width = `${w}px`; e.style.height = `${h}px`;
    }
    this.placeCard(x, y, w, h, vw, vh);
  }

  // Beside the hole: below it when there is room, else above; kept on screen; its width caps at the page's.
  placeCard(x, y, w, h, vw, vh) {
    const cw = this.card.offsetWidth || 440, ch = this.card.offsetHeight || 120;
    const below = y + h + 14;
    const top = below + ch <= vh - EDGE ? below : Math.max(EDGE, y - ch - 14);
    const left = Math.min(Math.max(EDGE, x + w / 2 - cw / 2), vw - cw - EDGE);
    this.card.style.left = `${Math.max(EDGE, left)}px`;
    this.card.style.top = `${top}px`;
  }
}

let shared = null;
// The page's one how-to (created on first use, in document.body).
export function howTo() {
  if (!shared) shared = new HowTo({ root: document.body });
  return shared;
}

// The small "?" that replays a how-to. It sits at the top right of the page, over the veil, and calls onReplay (the caller's play).
export function helpButton(onReplay, { label = 'How to play', right = 14, top = 14 } = {}) {
  ensureCss();
  const b = el('button', 'htw-help', '?');
  b.type = 'button';
  b.title = label;
  b.setAttribute('aria-label', label);
  b.style.right = `${right}px`;
  b.style.top = `${top}px`;
  b.addEventListener('click', () => { if (onReplay) onReplay(); });
  document.body.appendChild(b);
  return b;
}
