// ---------------------------------------------------------------------------------------
// THE SEAL PICKER: your seal carved once, at character creation, and never again (docs/plans/HANKO.md 5; the owner, 2026-10-17:
// "Recarving your seal would be like making a new account... take it seriously"). A ceremony, not a form: a still dark field (ma) and
// one System window in the style bible's dress (OVERLAY.md 10.3: the window colour as the glaze, the labradorite keylines walking the
// schiller, chamfered and folded corners, the tab, the path strip, rows split by a hairline and a glyph). Three choices:
//   THE NAME     letters typed, 2 to 12, that neuralese can spell as two or three syllables (cellsOf, npc/neuralesespelling.js); what it
//                cannot spell is said plainly on the line under it; the name is shown in the running hand (final: drawn as it is)
//   THE OUTLINE  SEAL_OUTLINES: round (maru-in), square (kaku-in), oval, gourd (hyotan-in)
//   THE CARVING  SEAL_CARVINGS: relief (shubun, the name standing in ink) or intaglio (hakubun, the name cut out of it)
// shown two ways before it is final: pressed into a cradle (a drawn cradle's floor, the imprint burning and cooling at each change) and
// as a page of the Seal Book. The ink is the window colour (the imprint's: vfx/sealimprint.js). Confirm is a press and HOLD (1.5 real s,
// a carving stroke filling, the cradle's pad ring lighting round) beside the one line that says it is for good; letting go when it is
// full carves it: game.cradles.choose(...), then done() inside that same pointer or key handler (the pointer lock wants a gesture).
// No skip. Keys: letters, Backspace, Left and Right (or 1 to 4) the outline, Up and Down (or 5, 6) the carving, Enter or Space held.
// On a phone the name is typed into a real field (MOBILE.md 5): an <input> laid unseen over the carved field (16 px, or iOS zooms on
// focus), focused by a tap on it, its value read as letters into setName; while the keyboard is up (visualViewport) the window is
// lifted so the field sits above it.
//
// Drawn on one 2D canvas at the 480-line present, upscaled bilinearly as the world is (render/present.js): no WebGL, no texture, no
// draw call. The window is cached and redrawn only when what it shows changes; a frame composites the cache, the keylines through the
// walking film strip, and the cradle's burn.
//
// Prior art: the hanko registered at a Japanese city office (the jitsuin, carved once and kept); the seal carver's choices (maru-in,
// kaku-in, hyotan-in; shubun and hakubun); character creation that asks for a name you keep (Dark Souls' and Monster Hunter's, the
// MMO's name reservation); the press-and-hold confirm of Destiny's and Death Stranding's irreversible choices; round six's gate
// (Calissa's mock, overlay/r6-gate: the imprint burning into a cradle's floor) and round five's Seal Book (overlay/r5-jar-8).
//
//   game.sealPicker = new SealPicker(game)   .open(done)   (done() once game.cradles.choose has taken it)   .isOpen
// ---------------------------------------------------------------------------------------
import { drawSealFace } from '../vfx/sealface.js';
import { runningHand } from './runninghand.js';
import { cellsOf } from '../npc/neuralesespelling.js';
import { SEAL_OUTLINES, SEAL_CARVINGS } from '../world/cradles.js';
import { THEMES, theme, FONT, GLOVES } from './theme.js';
import { sfx } from '../audio/sfx.js';

const LINES = 480; // (the present's lines: the picker pixelates as the world does)
const TOUCH_LINE = 'Tap to type your name: two or three syllables, 2 to 12 letters.';
const UPRIGHT = { w: 384, h: 760 }; // (an upright phone: the least canvas width, and the height the one column needs)
const HOLD = 1.5, LETGO = 0.25; // (real seconds: the hold to carve; the stroke running back when let go early)
const MA = 0.5, IN = [0.07, 0.1, 0.12, 0.06], OUT_K = 2 / 3; // (the stillness first; the entrance: a line, the unfold, the scan, the tab)
const COOL = 2.0; // (real seconds an imprint burns down to dim: vfx/sealimprint.js's)
const WALK = 0.05; // (the schiller's walk along the keylines, loops a real second)
const COUNT = `'Jersey 15', ${FONT.sys}`; // (the count face, src/ui/theme.js)
const NAME_F = (px, w = 600) => `${w} ${px}px ${FONT.title}`, READ_F = `14px ${FONT.sys}`, COUNT_F = (px) => `${px}px ${COUNT}`;
const FILM = ['#4c0fb3', '#0a8cbf', '#f2b82e', '#d91a80']; // (OVERLAY.md 10.4)
const CLAY = { top: '#7d4129', front: '#4a2416', rim: '#b8714a', sill: '#5a2c1c', sillFront: '#33170e', groove: '#2a120a', well: '#120a09' };
const COPPER = '#c27a3e';
const OUTLINE_WORDS = { round: ['ROUND', 'maru-in'], square: ['SQUARE', 'kaku-in'], oval: ['OVAL', 'daen-in'], gourd: ['GOURD', 'hyotan-in'] };
const CARVING_WORDS = { relief: ['RELIEF', 'name in ink'], intaglio: ['INTAGLIO', 'name cut out'] };
const PADS = 28;

/** What the typed name is to neuralese: { ok, cells, line } (the line says what it is, or plainly what it cannot be). */
export function readSealName(name) {
  const n = String(name || '');
  if (!n) return { ok: false, cells: null, line: 'type your name: two or three syllables' };
  if (n.length < 2) return { ok: false, cells: null, line: 'two letters at least' };
  let cells;
  try { cells = cellsOf(n); } catch (e) { return { ok: false, cells: null, line: plainly(String(e.message || e)) }; }
  if (cells.length < 2) return { ok: false, cells, line: 'one syllable: a seal takes two or three' };
  if (cells.length > 3) return { ok: false, cells, line: `${cells.length} syllables: a seal takes two or three` };
  return { ok: /^[A-Za-z]{2,12}$/.test(n), cells, line: `${cells.length} syllables  ${cells.map((c) => c.text).join(' · ')}` };
}
/** The spelling's refusal (npc/neuralesespelling.js) said plainly. */
function plainly(m) {
  let r;
  if ((r = /lacks \((\w+)\)/.exec(m))) return `neuralese has no letter ${r[1].toUpperCase()}`;
  if ((r = /cannot begin with (\w+)/.exec(m))) return `a name cannot begin ${r[1].toUpperCase()}`;
  if ((r = /ends on (\w+)/.exec(m))) return `a name cannot end ${r[1].toUpperCase()}`;
  if ((r = /has (\w+) where one consonant/.exec(m))) return `${r[1].toUpperCase()}: one consonant closes a syllable`;
  if (/no vowel/.test(m)) return 'a name needs a vowel';
  return 'neuralese cannot spell it';
}

const canvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

export class SealPicker {
  constructor(game) {
    this.game = game; this.el = null; this.done = null; this.isOpen = false;
    this.name = ''; this.outline = SEAL_OUTLINES[0]; this.carving = SEAL_CARVINGS[0]; this.read = readSealName('');
    this.hover = null; this.holding = null; this.hold = 0; this.full = false; this.burnT = COOL; this.flash = 0;
    this.t = 0; this.out = -1; this.raf = 0; this.last = 0; this.dirty = true; this.bodyDirty = true; this.themeId = null;
    this.onKey = (e) => this.key(e, true); this.onKeyUp = (e) => this.key(e, false);
    this.onDown = (e) => this.pointer(e, 'down'); this.onUp = (e) => this.pointer(e, 'up'); this.onMove = (e) => this.pointer(e, 'move');
    this.onResize = () => { this.layout(); };
    this.onInput = () => this.typed();
    this.frame = (now) => this.tick(now);
  }

  /** Your seal's ceremony; done() is called once the seal is carved (at once if it already is). */
  open(done) {
    if (this.isOpen) return;
    if (this.game.cradles?.mine) { done?.(); return; }
    this.done = done; this.isOpen = true; this.t = 0; this.out = -1; this.hold = 0; this.full = false; this.holding = null; this.flash = 0;
    if (!this.el) this.build();
    document.body.appendChild(this.el); document.body.appendChild(this.input);
    this.input.value = this.name;
    this.layout();
    globalThis.visualViewport?.addEventListener('resize', this.onResize); globalThis.visualViewport?.addEventListener('scroll', this.onResize);
    addEventListener('keydown', this.onKey, true); addEventListener('keyup', this.onKeyUp, true); addEventListener('resize', this.onResize);
    this.el.addEventListener('pointerdown', this.onDown); this.el.addEventListener('pointerup', this.onUp); this.el.addEventListener('pointermove', this.onMove);
    this.el.addEventListener('pointercancel', this.onUp);
    Promise.all([NAME_F(16), READ_F, COUNT_F(14)].map((f) => document.fonts?.load?.(f))).then(() => { this.dirty = this.bodyDirty = true; }, () => {});
    sfx.menuOpen?.();
    this.last = performance.now(); this.raf = requestAnimationFrame(this.frame);
  }

  build() {
    const el = (this.el = canvas(2, 2)); el.id = 'sealpicker';
    el.style.cssText = `position:fixed;inset:0;width:100%;height:100%;z-index:40;image-rendering:auto;touch-action:none;cursor:url(${GLOVES.cursor}) 14 11, default;`;
    this.ctx = el.getContext('2d');
    const f = (this.input = document.createElement('input')); f.id = 'sealpicker-name';
    Object.assign(f, { type: 'text', maxLength: 12, autocomplete: 'off', spellcheck: false, enterKeyHint: 'done', placeholder: 'Your name' });
    f.setAttribute('autocapitalize', 'characters'); f.setAttribute('autocorrect', 'off'); f.setAttribute('aria-label', 'your name');
    f.style.cssText = 'position:fixed;z-index:41;margin:0;padding:0;border:0;outline:0;background:transparent;color:transparent;caret-color:transparent;font-size:16px;opacity:0.01;touch-action:manipulation;';
    f.addEventListener('input', this.onInput);
    f.addEventListener('pointerup', () => { if (!this.holding && this.out < 0) f.focus(); }); // (in the gesture's own handler: the first touch's full screen moves the page under the finger)
    f.addEventListener('focus', () => { this.dirty = true; this.onResize(); }); f.addEventListener('blur', () => { this.dirty = true; this.onResize(); });
  }
  /** The field's value read as the name: letters only, upper case, 12 at most (the keys' own rule). */
  typed() {
    if (this.holding || this.out >= 0) { this.input.value = this.name; return; }
    const n = this.input.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 12);
    if (this.input.value !== n) this.input.value = n;
    if (n !== this.name) this.setName(n);
  }
  /** The unseen field laid over the carved one, and the window lifted above the keyboard while it is up. */
  placeField() {
    const L = this.L, sx = innerWidth / L.W, s = innerHeight / L.H, F = L.field, vv = globalThis.visualViewport; // (the canvas is stretched to the view: below 1:1 it squeezes)
    let dy = 0;
    if (vv && document.activeElement === this.input && vv.height < innerHeight * 0.85) {
      const want = vv.offsetTop + Math.min(vv.height * 0.35, 120); // (the field's top, a little way down what is left in view)
      dy = Math.min(0, want - F.y * s);
    }
    this.el.style.transform = dy ? `translateY(${Math.round(dy)}px)` : '';
    Object.assign(this.input.style, { left: `${F.x * sx}px`, top: `${F.y * s + dy}px`, width: `${F.w * sx}px`, height: `${Math.max(44, F.h * s)}px` });
  }

  /** Every box of the window, in the present's pixels; the caches sized to it. */
  layout() {
    const up = innerHeight > innerWidth * 1.15, asp = innerWidth / Math.max(1, innerHeight); // (upright: one column, the canvas scaled evenly)
    const W = up ? Math.max(UPRIGHT.w, Math.ceil(UPRIGHT.h * asp)) : Math.max(LINES, Math.round(LINES * asp)), H = up ? Math.round(W / asp) : LINES;
    if (this.el.width !== W) { this.el.width = W; this.el.height = H; }
    for (const k of ['body', 'win', 'line', 'tmp']) { if (!this[k] || this[k].width !== W) this[k] = canvas(W, H); }
    if (!this.filmStrip) { const f = (this.filmStrip = canvas(256, 1)), c = f.getContext('2d'), g = c.createLinearGradient(0, 0, 256, 0); for (let i = 0; i <= 8; i++) g.addColorStop(i / 8, FILM[i % 4]); c.fillStyle = g; c.fillRect(0, 0, 256, 1); }
    if (!this.faceLit) { this.faceLit = canvas(128, 128); this.faceDim = canvas(128, 128); }
    const R = up ? 280 : 0, Fy = up ? 284 : 0, h = up ? 380 + Fy + 34 : 380; // (upright: the previews under the choices, the foot under them, the line over the hold)
    const w = up ? Math.min(W - 24, 360) : Math.min(W - 24, 640), x = Math.round((W - w) / 2), y = Math.round((H - h) / 2) + 12;
    const split = x + Math.round(w * 0.52), lx = x + 16, lw = up ? w - 32 : split - 8 - lx, rx = up ? lx : split + 8, rw = up ? lw : x + w - 16 - rx;
    const L = (this.L = { W, H, x, y, w, h, lx, lw, rx, rw, up, R, Fy });
    const sw = Math.floor((lw - 18) / 4), cw = Math.floor((lw - 6) / 2);
    L.outlines = SEAL_OUTLINES.map((id, i) => ({ id, kind: 'outline', x: lx + i * (sw + 6), y: y + 168, w: sw, h: 72 }));
    L.carvings = SEAL_CARVINGS.map((id, i) => ({ id, kind: 'carving', x: lx + i * (cw + 6), y: y + 270, w: cw, h: 40 }));
    L.confirm = { id: 'confirm', kind: 'confirm', x: up ? lx : x + w - 16 - 224, y: y + 330 + Fy + (up ? 34 : 0), w: up ? lw : 224, h: up ? 42 : 30 }; // (upright: the whole width, a thumb's height)
    L.field = { x: lx, y: y + 52, w: lw, h: 32 };
    L.cradle = { x: rx, y: y + 52 + R, w: rw, h: 154 };
    L.book = { x: rx, y: y + 236 + R, w: rw, h: 80 };
    const C = L.cradle, cx = C.x + C.w / 2, cy = C.y + C.h * 0.54, RX = Math.min(C.w * 0.27, 64), RY = RX * 0.42;
    L.well = { cx, cy, RX, RY };
    L.pads = Array.from({ length: PADS }, (_, i) => { const a = -Math.PI / 2 + i / PADS * Math.PI * 2; return [cx + Math.cos(a) * RX * 1.09, cy + Math.sin(a) * RY * 1.09, FILM[i % 4]]; });
    const tr = (s) => [[cx + s * RX * 1.2, cy], [cx + s * RX * 1.55, cy], [cx + s * RX * 1.75, cy + RY * 0.9], [s > 0 ? C.x + C.w - 14 : C.x + 14, cy + RY * 0.9]];
    const tu = (s) => [[cx + s * RX * 1.12, cy - RY * 0.55], [cx + s * RX * 1.6, cy - RY * 1.05], [s > 0 ? C.x + C.w - 22 : C.x + 22, cy - RY * 1.05]];
    L.traces = [tr(-1), tr(1), tu(-1), tu(1)];
    L.hits = [...L.outlines, ...L.carvings, L.confirm];
    this.placeField();
    this.dirty = this.bodyDirty = true;
  }

  // ---- the input: letters, the choices, the hold (a pointer or a key); no skip
  key(e, down) {
    if (!this.isOpen || this.out >= 0) return;
    e.stopPropagation();
    const c = e.code;
    if (!down) { if ((c === 'Enter' || c === 'NumpadEnter' || c === 'Space') && this.holding === 'key') { e.preventDefault(); this.release(); } return; }
    if (c === 'Enter' || c === 'NumpadEnter' || c === 'Space') { e.preventDefault(); if (document.activeElement === this.input) { this.input.blur(); return; } if (!e.repeat && !this.holding) this.press('key'); return; }
    if (this.holding) return; // (nothing changes under the chisel)
    if (c === 'Backspace') { e.preventDefault(); if (this.name) this.setName(this.name.slice(0, -1)); return; }
    if (c === 'ArrowLeft' || c === 'ArrowRight') { e.preventDefault(); const i = SEAL_OUTLINES.indexOf(this.outline), d = c === 'ArrowLeft' ? -1 : 1; this.choose('outline', SEAL_OUTLINES[(i + d + SEAL_OUTLINES.length) % SEAL_OUTLINES.length]); return; }
    if (c === 'ArrowUp' || c === 'ArrowDown') { e.preventDefault(); const i = SEAL_CARVINGS.indexOf(this.carving); this.choose('carving', SEAL_CARVINGS[(i + 1) % SEAL_CARVINGS.length]); return; }
    const dg = /^(?:Digit|Numpad)([1-6])$/.exec(c);
    if (dg) { e.preventDefault(); const n = +dg[1]; if (n <= 4) this.choose('outline', SEAL_OUTLINES[n - 1]); else this.choose('carving', SEAL_CARVINGS[n - 5]); return; }
    if (/^Key[A-Z]$/.test(c) && !e.ctrlKey && !e.metaKey && !e.altKey) { e.preventDefault(); if (this.name.length < 12) this.setName(this.name + c.slice(3)); }
  }
  pointer(e, what) {
    if (!this.isOpen || this.out >= 0) return;
    const r = this.el.getBoundingClientRect(), px = (e.clientX - r.left) * this.L.W / r.width, py = (e.clientY - r.top) * this.L.H / r.height;
    const at = this.L.hits.find((b) => px >= b.x && px <= b.x + b.w && py >= b.y && py <= b.y + b.h) || null;
    if (what === 'move') { if (at !== this.hover) { this.hover = at; this.dirty = true; } return; }
    if (what === 'up') { if (this.holding === 'pointer') this.release(); return; }
    if (e.button !== 0 || this.holding) return;
    e.preventDefault();
    const F = this.L.field;
    if (!at && px >= F.x && px <= F.x + F.w && py >= F.y && py <= F.y + F.h) { this.input.focus(); return; } // (the carved field: a tap on it is a tap on the real one)
    if (!at) return;
    if (at.kind === 'confirm') { this.el.setPointerCapture?.(e.pointerId); this.press('pointer'); }
    else this.choose(at.kind, at.id);
  }
  setName(n) { this.name = n; if (this.input && this.input.value !== n) this.input.value = n; this.read = readSealName(n); this.burnT = 0; this.dirty = true; this.faces = null; sfx.click?.(); }
  choose(kind, id) { if (this[kind] === id) return; this[kind] = id; this.burnT = 0; this.dirty = true; this.faces = null; sfx.menuMove?.(); }
  press(by) { if (!this.read.ok) { sfx.menuBack?.(); return; } this.holding = by; this.dirty = true; }
  /** The hold let go: full, the seal is carved here, in the gesture's own handler; short of full, the stroke runs back. */
  release() {
    const full = this.full; this.holding = null; this.dirty = true;
    if (!full) return;
    const seal = { name: this.name, outline: this.outline, carving: this.carving };
    this.game.cradles?.choose(seal); // (seal.carve on the bus: world/cradles.js)
    sfx.menuOk?.(); // (PLACEHOLDER: the carving's sound is Wanda's, on seal.carve)
    this.flash = 1; this.burnT = 0; this.out = 0;
    removeEventListener('keydown', this.onKey, true); removeEventListener('keyup', this.onKeyUp, true); removeEventListener('resize', this.onResize);
    globalThis.visualViewport?.removeEventListener('resize', this.onResize); globalThis.visualViewport?.removeEventListener('scroll', this.onResize);
    this.input.blur(); this.input.remove(); this.el.style.transform = '';
    const d = this.done; this.done = null; d?.();
  }

  close() {
    cancelAnimationFrame(this.raf); this.raf = 0; this.isOpen = false;
    this.el.removeEventListener('pointerdown', this.onDown); this.el.removeEventListener('pointerup', this.onUp); this.el.removeEventListener('pointermove', this.onMove);
    this.el.removeEventListener('pointercancel', this.onUp);
    this.el.remove(); this.input.remove();
  }

  // ---- the frame
  tick(now) {
    const dt = Math.min(0.5, Math.max(0, (now - this.last) / 1000)); this.last = now; this.t += dt; // (real seconds: the hold is a real 1.5 s, however slow the frame)
    const was = this.full;
    if (this.holding) this.hold = Math.min(1, this.hold + dt / HOLD); else if (this.out < 0) this.hold = Math.max(0, this.hold - dt / LETGO);
    this.full = this.hold >= 1;
    if (this.full !== was) { this.dirty = true; if (this.full) sfx.menuMove?.(); }
    this.burnT += dt; this.flash = Math.max(0, this.flash - dt * 3);
    if (this.out >= 0) { this.out += dt; if (this.out > 0.25 + total() * OUT_K + 0.3) { this.close(); return; } }
    if (this.themeId !== theme.id) { this.themeId = theme.id; this.bodyDirty = this.dirty = true; this.faces = null; }
    if (this.bodyDirty) this.drawBody();
    if (this.dirty) this.drawWindow();
    this.compose();
    this.raf = requestAnimationFrame(this.frame);
  }

  compose() {
    const L = this.L, c = this.ctx, { W, H, x, y, w, h } = L;
    c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
    c.clearRect(0, 0, W, H);
    // the field: still, dark (ma); it fades in first and last out
    const fadeIn = Math.min(1, this.t / (MA * 0.5)), fadeOut = this.out < 0 ? 1 : Math.max(0, 1 - Math.max(0, this.out - 0.25 - total() * OUT_K) / 0.3);
    c.globalAlpha = 0.96 * fadeIn * fadeOut; c.fillStyle = '#07040c'; c.fillRect(0, 0, W, H); c.globalAlpha = 1;
    // the window's entrance (a line, the unfold, the scan, the tab), or its exit (the same, back, in two thirds the time)
    let k = this.out < 0 ? Math.max(0, this.t - MA) : Math.max(0, total() - Math.max(0, this.out - 0.25) / OUT_K);
    if (this.out < 0 && this.t < MA) return;
    const [a, b, s, tb] = IN, cy = y + h / 2;
    if (k < a) { const q = k / a; c.fillStyle = theme.id ? THEMES[theme.id].hi : '#fff'; c.fillRect(Math.round(x + w / 2 - w * q / 2), Math.round(cy), Math.round(w * q), 1); return; }
    k -= a;
    const unfold = Math.min(1, k / b), half = h / 2 * unfold;
    this.walkLines();
    c.save(); c.beginPath(); c.rect(0, cy - half - 1, W, half * 2 + 2); c.clip();
    if (k >= b) {
      const q = Math.min(1, (k - b) / s), bot = y + h * q;
      c.save(); c.beginPath(); c.rect(0, y - 2, W, bot - y + 2); c.clip(); c.drawImage(this.win, 0, 0); if (q >= 1) this.drawLive(c); c.restore();
      if (q < 1) { c.globalAlpha = 0.5; c.fillStyle = THEMES[theme.id].hi; c.fillRect(x, Math.round(bot) - 1, w, 3); c.globalAlpha = 1; }
    }
    c.drawImage(this.tmp, 0, 0);
    c.restore();
    const qt = Math.min(1, Math.max(0, (k - b - s) / tb));
    if (qt > 0) { const o = Math.round(-(1 - qt) * 8); c.globalAlpha = qt; c.drawImage(this.win, 0, 0, W, y, 0, o, W, y); c.drawImage(this.tmp, 0, 0, W, y, 0, o, W, y); c.globalAlpha = 1; }
  }

  /** The keylines in the film, walking: the white line mask through the strip, shifted; no allocation. */
  walkLines() {
    const t = this.tmp.getContext('2d'), { W, H } = this.L, ph = (this.t * WALK) % 1;
    t.globalCompositeOperation = 'copy'; t.imageSmoothingEnabled = true; t.drawImage(this.filmStrip, -ph * W, 0, W * 2, H);
    t.globalCompositeOperation = 'destination-in'; t.drawImage(this.line, 0, 0); t.globalCompositeOperation = 'source-over';
  }

  /** What moves on the window once it is in: the cradle's burn and pad ring, the traces, the carving stroke. */
  drawLive(c) {
    const L = this.L, { cx, cy, RX, RY } = L.well, burn = Math.pow(Math.max(0, 1 - this.burnT / COOL), 1.5), hold = this.hold;
    c.save(); c.globalAlpha = 0.6; c.drawImage(this.faceDim, cx - RX * 0.9, cy - RY * 0.9, RX * 1.8, RY * 1.8);
    if (burn > 0.01 || this.flash > 0) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, burn + this.flash); c.drawImage(this.faceLit, cx - RX * 0.9, cy - RY * 0.9, RX * 1.8, RY * 1.8); }
    c.restore();
    // the traces out from the cradle, lit by the burn and the hold
    const tk = Math.min(1, burn * 0.8 + hold * 0.6 + this.flash);
    if (tk > 0.01) {
      c.save(); c.globalAlpha = tk; c.lineWidth = 2; c.lineCap = 'round';
      L.traces.forEach((tr, i) => {
        c.strokeStyle = FILM[(i + 1) % 4]; c.beginPath(); c.moveTo(tr[0][0], tr[0][1]); for (let j = 1; j < tr.length; j++) c.lineTo(tr[j][0], tr[j][1]); c.stroke();
        const e = tr[tr.length - 1]; c.fillStyle = '#fff'; c.beginPath(); c.arc(e[0], e[1], 2, 0, 7); c.fill();
      });
      c.restore();
    }
    // the pad ring: lit round as the stroke fills; all of it with the burn
    const n = Math.floor(hold * PADS);
    c.save();
    for (let i = 0; i < PADS; i++) {
      const p = L.pads[i], on = i < n ? 1 : burn * 0.9 + this.flash;
      if (on < 0.02) continue;
      c.globalAlpha = Math.min(1, on); c.fillStyle = i < n ? p[2] : '#fff'; c.fillRect(Math.round(p[0]) - 1, Math.round(p[1]) - 1, 2, 2);
    }
    c.restore();
    // the carving stroke under the confirm: a chisel's line filling, its head a bright point
    const B = L.confirm, sx = B.x + 10, ex = B.x + B.w - 10, sy = B.y + B.h - 6, hx = sx + (ex - sx) * hold;
    if (hold > 0) {
      c.save(); c.drawImage(this.filmStrip, 0, 0, 256, 1, sx, sy - 1, Math.max(1, hx - sx), 2);
      c.fillStyle = '#fff'; c.fillRect(Math.round(hx) - 1, sy - 2, 2, 4); c.restore();
    }
  }

  // ---- the caches: the window's body (on a layout or a window colour), and what it shows (on a change)
  drawBody() {
    this.bodyDirty = false;
    const L = this.L, T = THEMES[theme.id] || THEMES.kiln, c = this.body.getContext('2d'), { W, H, x, y, w, h } = L;
    c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, W, H);
    // the glaze: the window colour fired, pooling lighter at its edges, kiln marks in it, and one kintsugi seam
    const g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, `rgba(${T.top},0.96)`); g.addColorStop(1, `rgba(${T.bot},0.97)`);
    winPath(c, x, y, w, h, 0); c.fillStyle = g; c.fill();
    c.save(); winPath(c, x, y, w, h, 0); c.clip();
    c.shadowColor = T.hi; c.shadowBlur = 14; c.strokeStyle = `rgba(${T.sel},0.35)`; c.lineWidth = 6; winPath(c, x, y, w, h, -3); c.stroke(); c.shadowBlur = 0;
    let s = 1234567; const rnd = () => ((s = Math.imul(s ^ (s >>> 15), 2246822519) ^ (s << 7)) >>> 0) / 4294967296;
    for (let i = 0; i < 420; i++) { c.fillStyle = rnd() < 0.5 ? `rgba(${T.bot},0.25)` : 'rgba(255,240,220,0.05)'; c.fillRect(Math.round(x + rnd() * w), Math.round(y + rnd() * h), 1 + (rnd() < 0.2), 1); }
    c.globalAlpha = 0.05; c.strokeStyle = T.hi; c.lineWidth = 1; hexMesh(c, x, y, w, h, 7); c.globalAlpha = 1; // (the hex mesh behind the rows)
    c.strokeStyle = 'rgba(217,164,65,0.75)'; c.beginPath(); c.moveTo(x, y + h - 58); c.lineTo(x + 9, y + h - 50); c.lineTo(x + 7, y + h - 41); c.lineTo(x + 18, y + h - 30); c.lineTo(x + 15, y + h - 22); c.lineTo(x + 26, y + h); c.stroke();
    c.restore();
    // the fold (the top right corner turned down)
    c.fillStyle = `rgba(${T.bot},0.95)`; c.beginPath(); c.moveTo(x + w - 14, y); c.lineTo(x + w - 14, y + 14); c.lineTo(x + w, y + 14); c.closePath(); c.fill();
    c.fillStyle = `rgba(${T.top},0.6)`; c.beginPath(); c.moveTo(x + w - 14, y); c.lineTo(x + w, y + 14); c.lineTo(x + w - 14, y + 14); c.closePath(); c.fill();
    // the tab off the top edge, cut on a diagonal
    c.font = NAME_F(16); const tw = Math.ceil(c.measureText('SYSTEM // YOUR SEAL').width) + 36; L.tab = { x: x + 14, y: y - 24, w: tw, h: 24 };
    c.fillStyle = `rgba(${T.top},0.97)`; tabPath(c, L.tab); c.fill();
    // the cradle's floor: the sill, its grooves, the collar and the well (OVERLAY.md 10.5c: the cradle on the threshold)
    const C = L.cradle, { cx, cy, RX, RY } = L.well;
    c.fillStyle = 'rgba(8,4,10,0.85)'; c.fillRect(C.x, C.y, C.w, C.h);
    c.fillStyle = CLAY.sill; c.beginPath(); c.moveTo(C.x + 8, cy - RY * 1.7); c.lineTo(C.x + C.w - 8, cy - RY * 1.7); c.lineTo(C.x + C.w - 2, cy + RY * 2.1); c.lineTo(C.x + 2, cy + RY * 2.1); c.closePath(); c.fill();
    c.fillStyle = CLAY.sillFront; c.fillRect(C.x + 2, Math.round(cy + RY * 2.1), C.w - 4, 9);
    c.strokeStyle = 'rgba(0,0,0,0.18)'; for (let i = 0; i < 6; i++) { const yy = Math.round(cy - RY * 1.5 + i * RY * 0.62); c.beginPath(); c.moveTo(C.x + 10 + i * 3, yy); c.lineTo(C.x + C.w - 12, yy + 1); c.stroke(); }
    c.strokeStyle = CLAY.groove; c.lineWidth = 3; c.lineCap = 'round';
    for (const tr of L.traces) { c.beginPath(); c.moveTo(tr[0][0], tr[0][1]); for (let j = 1; j < tr.length; j++) c.lineTo(tr[j][0], tr[j][1]); c.stroke(); }
    c.lineWidth = 1;
    const oct = (k, dy = 0) => { c.beginPath(); for (let i = 0; i < 8; i++) { const a = (i + 0.5) / 8 * Math.PI * 2; c.lineTo(cx + Math.cos(a) * RX * k, cy + dy + Math.sin(a) * RY * k); } c.closePath(); };
    c.fillStyle = CLAY.front; oct(1.32, 7); c.fill(); c.fillRect(cx - RX * 1.22, cy, RX * 2.44, 7);
    c.fillStyle = CLAY.top; oct(1.32); c.fill(); c.strokeStyle = CLAY.rim; c.globalAlpha = 0.6; oct(1.32); c.stroke(); c.globalAlpha = 1;
    for (const p of L.pads) { c.fillStyle = '#2a1610'; c.fillRect(Math.round(p[0]) - 1, Math.round(p[1]) - 1, 2, 2); }
    c.fillStyle = CLAY.well; c.beginPath(); c.ellipse(cx, cy, RX, RY, 0, 0, 7); c.fill();
    const sc = c.createRadialGradient(cx, cy, RY * 0.2, cx, cy, RX); sc.addColorStop(0, 'rgba(40,20,14,0.0)'); sc.addColorStop(1, 'rgba(0,0,0,0.5)');
    c.fillStyle = sc; c.beginPath(); c.ellipse(cx, cy, RX, RY, 0, 0, 7); c.fill();
    // the Seal Book's page
    const P = L.book; c.fillStyle = `rgba(${T.bot},0.55)`; c.fillRect(P.x, P.y, P.w, P.h);
    c.globalAlpha = 0.06; c.strokeStyle = T.hi; hexMesh(c, P.x, P.y, P.w, P.h, 6); c.globalAlpha = 1;
    // the keylines: a white mask, coloured by the walking film each frame (outer, inner 2 dots in, the tab, the corner glyph)
    const m = this.line.getContext('2d'); m.setTransform(1, 0, 0, 1, 0, 0); m.clearRect(0, 0, W, H); m.strokeStyle = '#fff'; m.fillStyle = '#fff'; m.lineWidth = 1;
    winPath(m, x + 0.5, y + 0.5, w - 1, h - 1, 0); m.stroke(); winPath(m, x + 3.5, y + 3.5, w - 7, h - 7, 0); m.stroke();
    m.beginPath(); m.moveTo(x + w - 14.5, y + 0.5); m.lineTo(x + w - 14.5, y + 14.5); m.lineTo(x + w - 0.5, y + 14.5); m.stroke();
    tabPath(m, { x: L.tab.x + 0.5, y: L.tab.y + 0.5, w: L.tab.w, h: L.tab.h }, true); m.stroke();
    hexAt(m, x + 10, y + h - 10, 4); m.stroke(); m.fillRect(x + 9, y + h - 11, 2, 2);
    m.strokeRect(C.x + 0.5, C.y + 0.5, C.w - 1, C.h - 1);
    this.maskBase = this.maskBase && this.maskBase.width === W ? this.maskBase : canvas(W, H); // (the base mask; the chosen slots' borders join it in drawWindow)
    const mb = this.maskBase.getContext('2d'); mb.globalCompositeOperation = 'copy'; mb.drawImage(this.line, 0, 0); mb.globalCompositeOperation = 'source-over';
    this.dirty = true;
  }

  /** The faces at this state (the cradle's lit and dim, the slots', the book's): drawn on a change only. */
  drawFaces(ink) {
    const seal = { name: this.read.cells ? this.name : '', outline: this.outline, carving: this.carving };
    for (const [cv, lit] of [[this.faceLit, true], [this.faceDim, false]]) { const f = cv.getContext('2d'); f.clearRect(0, 0, 128, 128); drawSealFace(f, seal, { size: 128, ink, lit }); }
    const mini = (o, cv0, size) => { const cv = cv0 && cv0.width === size ? cv0 : canvas(size, size), f = cv.getContext('2d'); f.clearRect(0, 0, size, size); drawSealFace(f, { ...seal, ...o }, { size, ink }); return cv; };
    this.miniO = SEAL_OUTLINES.map((id, i) => mini({ outline: id }, this.miniO?.[i], 36));
    this.miniC = SEAL_CARVINGS.map((id, i) => mini({ carving: id }, this.miniC?.[i], 32));
    this.bookFace = mini({}, this.bookFace, 52);
    this.faces = true;
  }

  drawWindow() {
    this.dirty = false;
    const L = this.L, T = THEMES[theme.id] || THEMES.kiln, ink = `rgb(${T.sel})`, c = this.win.getContext('2d'), { W, H, x, y, w, h, lx, lw, rx, rw } = L;
    if (!this.faces) this.drawFaces(ink);
    c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, W, H); c.drawImage(this.body, 0, 0);
    const m = this.line.getContext('2d'); m.globalCompositeOperation = 'copy'; m.drawImage(this.maskBase, 0, 0); m.globalCompositeOperation = 'source-over'; m.strokeStyle = '#fff';
    const hiA = (a) => withAlpha(T.hi, a);
    // the tab and the strip
    text(c, 'SYSTEM // YOUR SEAL', L.tab.x + 14, L.tab.y + 18, NAME_F(16), T.hi);
    let px = text(c, 'VESSOUL', x + 14, y + 19, COUNT_F(14), hiA(0.8));
    for (const word of ['THE PNEUKA JAR', 'YOUR SEAL']) { tri(c, px + 6, y + 14, hiA(0.6)); px = text(c, word, px + 14, y + 19, COUNT_F(14), hiA(0.8)); }
    text(c, 'CARVED ONCE', x + w - 22, y + 19, COUNT_F(14), hiA(0.8), 'right');
    hair(c, x + 10, x + w - 10, y + 25, T);
    // THE NAME: the carved field, the running hand, the line under it
    section(c, 'THE NAME', lx, lx + lw, y + 44, T, `${this.name.length} / 12`);
    const F = L.field; c.fillStyle = 'rgba(23,17,31,0.6)'; c.fillRect(F.x, F.y, F.w, F.h); c.strokeStyle = hiA(0.25); c.strokeRect(F.x + 0.5, F.y + 0.5, F.w - 1, F.h - 1);
    if (this.name) {
      c.save(); c.letterSpacing = '3px'; const ex = text(c, this.name, F.x + 10, F.y + 25, NAME_F(24), T.hi); c.restore();
      c.fillStyle = hiA(this.holding ? 0.2 : 0.55); c.fillRect(Math.round(ex) + 1, F.y + 7, 2, 20); // (the caret: steady, never blinking)
    } else { text(c, 'Your name', F.x + 10, F.y + 21, READ_F, hiA(0.4)); c.fillStyle = hiA(0.55); c.fillRect(F.x + 8, F.y + 7, 2, 20); }
    if (this.read.cells && this.read.ok) {
      const words = [{ cells: this.read.cells }], m1 = runningHand(null, words, { scale: 1 }); // (2x: its cell two reading lines tall, OVERLAY.md 10.5; fitted to the row)
      const sc = Math.min(3.6, (lw - 12) / Math.max(1, m1.width), 34 / Math.max(1, m1.height));
      const m2 = runningHand(null, words, { scale: sc }), bx = lx + 6 - (m2.x0 - 0), by = y + 106 - (m2.y0 + m2.y1) / 2 + 0;
      runningHand(c, words, { x: Math.round(bx), y: Math.round(by), scale: sc });
    } else { c.globalAlpha = 0.25; c.fillStyle = T.hi; c.fillRect(lx + 6, y + 100, lw - 12, 1); c.globalAlpha = 1; }
    const ok = this.read.ok; (ok ? hexAt : cross)(c, lx + 5, y + 134, 4); c.strokeStyle = hiA(ok ? 0.9 : 0.6); c.stroke();
    const line = !this.name && this.game.input?.device === 'touch' ? TOUCH_LINE : this.read.line; // (Espada's words, 2026-10-24)
    c.font = READ_F; const cut = c.measureText(line).width > lw - 14 ? line.indexOf(': ') : -1; // (too long for the column: two rows, broken at its colon)
    if (cut > 0) { text(c, line.slice(0, cut + 1), lx + 14, y + 133, READ_F, hiA(ok ? 0.9 : 0.65)); text(c, line.slice(cut + 2), lx + 14, y + 148, READ_F, hiA(ok ? 0.9 : 0.65)); }
    else text(c, line, lx + 14, y + 139, READ_F, hiA(ok ? 0.9 : 0.65));
    // THE OUTLINE and THE CARVING: slots in the frame, their key in a bracket square, the chosen lit in the schiller
    section(c, 'THE OUTLINE', lx, lx + lw, y + 160, T);
    L.outlines.forEach((b, i) => {
      this.slot(c, m, b, T, this.outline === b.id, `${i + 1}`);
      c.drawImage(this.miniO[i], Math.round(b.x + (b.w - 36) / 2), b.y + 5);
      text(c, OUTLINE_WORDS[b.id][0], b.x + b.w / 2, b.y + 55, NAME_F(14), this.outline === b.id ? T.hi : hiA(0.7), 'center');
      text(c, OUTLINE_WORDS[b.id][1], b.x + b.w / 2, b.y + 69, READ_F, hiA(0.55), 'center');
    });
    section(c, 'THE CARVING', lx, lx + lw, y + 262, T);
    L.carvings.forEach((b, i) => {
      this.slot(c, m, b, T, this.carving === b.id, `${i + 5}`);
      c.drawImage(this.miniC[i], b.x + 4, b.y + 4);
      text(c, CARVING_WORDS[b.id][0], b.x + 42, b.y + 17, NAME_F(14), this.carving === b.id ? T.hi : hiA(0.7));
      text(c, CARVING_WORDS[b.id][1], b.x + 42, b.y + 34, READ_F, hiA(0.55));
    });
    // the two previews' headers and the book's page
    section(c, 'PRESSED INTO A CRADLE', rx, rx + rw, y + 44 + L.R, T);
    section(c, 'A PAGE OF THE SEAL BOOK', rx, rx + rw, y + 228 + L.R, T);
    const P = L.book, dx = P.x + 36, dy = P.y + P.h / 2;
    c.fillStyle = CLAY.well; c.beginPath(); c.arc(dx, dy, 29, 0, 7); c.fill(); c.strokeStyle = COPPER; c.lineWidth = 3; c.beginPath(); c.arc(dx, dy, 29, 0, 7); c.stroke(); c.lineWidth = 1;
    c.globalAlpha = 0.9; c.drawImage(this.bookFace, dx - 26, dy - 26); c.globalAlpha = 1;
    text(c, this.read.ok ? this.name : '—', P.x + 76, P.y + 22, NAME_F(18), T.hi);
    text(c, 'your seal, carved', P.x + 76, P.y + 39, READ_F, hiA(0.7));
    row(c, 'PRESSED', '0', P.x + 76, P.x + P.w - 8, P.y + 57, T); row(c, 'RECEIVED', '0', P.x + 76, P.x + P.w - 8, P.y + 73, T);
    // the foot: the one line, and the hold
    hair(c, x + 10, x + w - 10, y + 322 + L.Fy, T);
    text(c, 'Your seal is carved once, and for good.', lx, y + 350 + L.Fy, READ_F, hiA(0.9));
    const B = L.confirm, can = this.read.ok, hot = this.hover === B || this.holding;
    c.fillStyle = 'rgba(23,17,31,0.55)'; c.fillRect(B.x, B.y, B.w, B.h);
    if (can) m.strokeRect(B.x + 0.5, B.y + 0.5, B.w - 1, B.h - 1); else { c.strokeStyle = hiA(0.25); c.strokeRect(B.x + 0.5, B.y + 0.5, B.w - 1, B.h - 1); }
    if (this.game.input?.device !== 'touch') keyBox(c, B.x + 8, B.y + Math.round((B.h - 18) / 2), 'ENTER', T, can ? 0.85 : 0.35); // (no key to name under a thumb)
    const label = !can ? 'NAME FIRST' : this.full ? 'LET GO' : 'HOLD TO CARVE';
    text(c, label, B.x + B.w - 12, B.y + Math.round(B.h / 2) + 4, NAME_F(16), can ? (hot ? T.hi : hiA(0.85)) : hiA(0.35), 'right');
    c.fillStyle = hiA(0.15); c.fillRect(B.x + 10, B.y + B.h - 6, B.w - 20, 1);
  }

  /** A slot in the frame: dark inset, its key in a bracket square; chosen, its border joins the keylines (the schiller walks it). */
  slot(c, m, b, T, on, key) {
    c.fillStyle = on ? `rgba(${T.sel},0.22)` : 'rgba(23,17,31,0.45)'; c.fillRect(b.x, b.y, b.w, b.h);
    if (on) m.strokeRect(b.x + 0.5, b.y + 0.5, b.w - 1, b.h - 1);
    else { c.strokeStyle = withAlpha(T.hi, this.hover === b ? 0.7 : 0.22); c.strokeRect(b.x + 0.5, b.y + 0.5, b.w - 1, b.h - 1); }
    keyBox(c, b.x + b.w - 15, b.y + 3, key, T, on ? 0.9 : 0.45);
  }
}

// ---- drawing helpers (whole pixels; the three faces)
function total() { return IN[0] + IN[1] + IN[2] + IN[3]; }
function withAlpha(hex, a) { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; }
function text(c, s, x, y, font, fill, align = 'left') {
  c.font = font; c.fillStyle = fill; c.textAlign = align; c.textBaseline = 'alphabetic'; c.fillText(s, Math.round(x), Math.round(y));
  return align === 'left' ? x + c.measureText(s).width : x;
}
function hair(c, x0, x1, y, T) { c.fillStyle = withAlpha(T.hi, 0.22); c.fillRect(Math.round(x0), Math.round(y), Math.round(x1 - x0), 1); }
/** A section's heading: its name carved (Cinzel), a hairline to a diamond glyph, a count at the end. */
function section(c, name, x0, x1, y, T, count = null) {
  const e = text(c, name, x0, y, NAME_F(14), T.hi);
  const cw = count ? (c.font = COUNT_F(14), c.measureText(count).width + 8) : 0, end = x1 - cw - 8;
  if (end > e + 10) { hair(c, e + 6, end - 4, y - 5, T); c.fillStyle = withAlpha(T.hi, 0.6); c.save(); c.translate(end, y - 4.5); c.rotate(Math.PI / 4); c.fillRect(-2, -2, 4, 4); c.restore(); }
  if (count) text(c, count, x1, y, COUNT_F(14), withAlpha(T.hi, 0.8), 'right');
}
function row(c, label, value, x0, x1, y, T) {
  const e = text(c, label, x0, y, COUNT_F(14), withAlpha(T.hi, 0.75)); c.font = COUNT_F(14); const vw = c.measureText(value).width;
  c.fillStyle = withAlpha(T.hi, 0.35); for (let px = Math.ceil(e + 4); px < x1 - vw - 4; px += 3) c.fillRect(px, Math.round(y) - 2, 1, 1);
  text(c, value, x1, y, COUNT_F(14), T.hi, 'right');
}
function keyBox(c, x, y, key, T, a) {
  c.font = COUNT_F(14); const w = Math.max(11, Math.ceil(c.measureText(key).width) + 5);
  c.strokeStyle = withAlpha(T.hi, a); c.strokeRect(Math.round(x) + 0.5, Math.round(y) + 0.5, w, 13);
  text(c, key, x + w / 2 + 0.5, y + 12, COUNT_F(14), withAlpha(T.hi, a), 'center');
}
function tri(c, x, y, fill) { c.fillStyle = fill; c.beginPath(); c.moveTo(Math.round(x), Math.round(y) - 3); c.lineTo(Math.round(x) + 4, Math.round(y)); c.lineTo(Math.round(x), Math.round(y) + 3); c.closePath(); c.fill(); }
function hexAt(c, x, y, r) { c.beginPath(); for (let k = 0; k <= 6; k++) { const a = k * Math.PI / 3; k ? c.lineTo(x + r * Math.cos(a), y + r * Math.sin(a)) : c.moveTo(x + r, y); } }
function cross(c, x, y, r) { c.beginPath(); c.moveTo(x - r, y - r); c.lineTo(x + r, y + r); c.moveTo(x + r, y - r); c.lineTo(x - r, y + r); }
function hexMesh(c, x, y, w, h, r) {
  const dx = r * 1.5, dy = r * Math.sqrt(3); c.beginPath();
  for (let i = 0, cx = x; cx < x + w + r; i++, cx += dx) for (let cy = y + (i % 2) * dy / 2; cy < y + h + r; cy += dy) {
    for (let k = 0; k < 4; k++) { const a = k * Math.PI / 3; const p = [cx + r * Math.cos(a), cy + r * Math.sin(a)]; k ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); }
  }
  c.stroke();
}
/** The window's outline: chamfered at the top left and bottom right, the top right cut for its fold (inset d, negative outward). */
function winPath(c, x, y, w, h, d) {
  const ch = 10, f = 14; x -= d; y -= d; w += 2 * d; h += 2 * d;
  c.beginPath(); c.moveTo(x + ch, y); c.lineTo(x + w - f, y); c.lineTo(x + w, y + f); c.lineTo(x + w, y + h - ch); c.lineTo(x + w - ch, y + h); c.lineTo(x, y + h); c.lineTo(x, y + ch); c.closePath();
}
/** The tab: standing off the top edge, its right end cut on a diagonal (open along the window's top when only its line is wanted). */
function tabPath(c, t, open = false) {
  c.beginPath(); c.moveTo(t.x, t.y + t.h); c.lineTo(t.x, t.y + 4); c.lineTo(t.x + 4, t.y); c.lineTo(t.x + t.w - 14, t.y); c.lineTo(t.x + t.w, t.y + t.h); if (!open) c.closePath();
}
