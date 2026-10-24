// ---------------------------------------------------------------------------------------
// THE ART BAR'S SIZE SLIDER: the stroke's size on glass (docs/plans/MOBILE.md 8.2: "a size slider beside the art bar while a shaping
// art or PAINT is lit"; on the keyboard Shift and the wheel, world/garden/hand.js: 1 to 12 m). A groove pressed into clay, filled with
// the window colour's glaze to the size (the goals window's bar, ui/goalswindow.js), a round glazed knob on it, the size beside it in
// the System's type (14 px, "3 m": a number as a stat). Its whole length and 44 px across is the hit area; a finger anywhere on it
// takes the knob there and drags it.
// It reports only: `onSize(metres)` and `touch.size { size, by }`; what sets the hand's size is the driver's (Petra's). It shows the
// hand's own size whenever no finger holds it, so the keyboard and the glass agree.
//
// Prior art: Procreate's brush-size slider down the canvas's edge (one finger, always there while painting), the goals window's glazed
// groove (ui/goalswindow.js).
//
//   new SizeSlider(game)   .place(x, y, length, vertical)   .set(metres)   .show(on)   .onSize = (m) => {}   .value   SIZE_SLIDER
// ---------------------------------------------------------------------------------------
import { FONT } from '../theme.js';

/** The numbers: the size's range (metres, the hand's STROKE.size), the hit's thickness, the groove's, the knob's (CSS px). */
export const SIZE_SLIDER = { min: 1, max: 12, hit: 44, groove: 10, knob: 15 };

const CSS = `
.tsize{position:fixed;left:0;top:0;z-index:6;touch-action:none;user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:transparent;pointer-events:auto}
.tsize.off{display:none}
.tsize i{position:absolute;border-radius:${SIZE_SLIDER.groove}px;background:#2a140c;box-shadow:inset 0 2px 0 rgba(0,0,0,.6),0 1px 0 rgba(255,226,196,.14),0 0 0 1.5px #1c0d08}
.tsize b{position:absolute;border-radius:${SIZE_SLIDER.groove}px;background:linear-gradient(180deg,rgba(255,255,255,.35),transparent 55%),rgb(var(--jtop,104,50,32));filter:brightness(1.9) saturate(1.2)}
.tsize u{position:absolute;width:${SIZE_SLIDER.knob * 2}px;height:${SIZE_SLIDER.knob * 2}px;margin:${-SIZE_SLIDER.knob}px 0 0 ${-SIZE_SLIDER.knob}px;border-radius:50%;
  background:radial-gradient(circle at 38% 34%,rgba(255,248,236,.3),transparent 40%),radial-gradient(circle,rgb(var(--jtop,104,50,32)) 0 55%,#8c4a33 58% 100%);
  box-shadow:0 0 0 1.5px #1c0d08,0 2px 0 #2a120b,inset 0 0 0 2px rgba(255,226,196,.22)}
.tsize.held u{box-shadow:0 0 0 1.5px #1c0d08,0 2px 0 #2a120b,0 0 0 4px rgba(255,211,106,.85)}
.tsize s{position:absolute;text-decoration:none;font:14px ${FONT.sys};color:#efe6d2;text-shadow:1px 1px 0 #1c0d08;white-space:nowrap}
`;

export class SizeSlider {
  constructor(game) {
    this.game = game; this.value = 3; this.onSize = null; this.pid = null; this.vertical = false; this.len = 160; this.on = false;
    if (!document.querySelector('style[data-touchsize]')) { const s = document.createElement('style'); s.setAttribute('data-touchsize', ''); s.textContent = CSS; document.head.appendChild(s); }
    const el = (this.el = document.createElement('div')); el.className = 'tsize off';
    this.groove = document.createElement('i'); this.fill = document.createElement('b'); this.knob = document.createElement('u'); this.word = document.createElement('s');
    el.append(this.groove, this.fill, this.knob, this.word);
    const at = (e) => {
      const r = el.getBoundingClientRect(), k = this.vertical ? 1 - (e.clientY - r.top - SIZE_SLIDER.knob) / (this.len - 2 * SIZE_SLIDER.knob) : (e.clientX - r.left - SIZE_SLIDER.knob) / (this.len - 2 * SIZE_SLIDER.knob);
      const m = Math.round((SIZE_SLIDER.min + Math.max(0, Math.min(1, k)) * (SIZE_SLIDER.max - SIZE_SLIDER.min)) * 2) / 2;
      if (m !== this.value) { this.set(m); this.game.events?.emit?.('touch.size', { size: m, by: 'courier' }); try { this.onSize?.(m); } catch (err) { console.warn('size.onSize', err); } }
    };
    el.addEventListener('pointerdown', (e) => { if (this.pid != null) return; e.preventDefault(); e.stopPropagation(); this.pid = e.pointerId; try { el.setPointerCapture(e.pointerId); } catch { /* synthetic */ } el.classList.add('held'); at(e); });
    el.addEventListener('pointermove', (e) => { if (e.pointerId === this.pid) at(e); });
    const end = (e) => { if (e.pointerId === this.pid) { this.pid = null; el.classList.remove('held'); } };
    for (const ev of ['pointerup', 'pointercancel', 'lostpointercapture']) el.addEventListener(ev, end);
    document.body.appendChild(el);
  }

  get held() { return this.pid != null; }

  /** Lay it at (x, y), `length` long, down (vertical) or across. */
  place(x, y, length, vertical) {
    this.len = Math.round(length); this.vertical = !!vertical;
    const H = SIZE_SLIDER.hit, G = SIZE_SLIDER.groove, K = SIZE_SLIDER.knob;
    Object.assign(this.el.style, { transform: `translate(${Math.round(x)}px, ${Math.round(y)}px)`, width: `${vertical ? H : this.len}px`, height: `${vertical ? this.len : H}px` });
    Object.assign(this.groove.style, vertical ? { left: `${(H - G) / 2}px`, top: `${K - G / 2}px`, width: `${G}px`, height: `${this.len - 2 * K + G}px` } : { top: `${(H - G) / 2}px`, left: `${K - G / 2}px`, height: `${G}px`, width: `${this.len - 2 * K + G}px` });
    Object.assign(this.word.style, vertical ? { left: '50%', top: `${this.len + 2}px`, transform: 'translateX(-50%)' } : { left: `${this.len + 6}px`, top: `${(H - 16) / 2}px`, transform: 'none' });
    this.set(this.value, true);
  }

  /** Show a size (metres); the knob, the glaze and the words follow. */
  set(m, force = false) {
    m = Math.max(SIZE_SLIDER.min, Math.min(SIZE_SLIDER.max, +m || SIZE_SLIDER.min));
    if (m === this.value && !force) return;
    this.value = m;
    const k = (m - SIZE_SLIDER.min) / (SIZE_SLIDER.max - SIZE_SLIDER.min), H = SIZE_SLIDER.hit, G = SIZE_SLIDER.groove, K = SIZE_SLIDER.knob, span = this.len - 2 * K;
    if (this.vertical) {
      const y = K + (1 - k) * span;
      Object.assign(this.knob.style, { left: `${H / 2}px`, top: `${y}px` });
      Object.assign(this.fill.style, { left: `${(H - G) / 2}px`, top: `${y}px`, width: `${G}px`, height: `${this.len - K - y + G / 2}px` });
    } else {
      const x = K + k * span;
      Object.assign(this.knob.style, { left: `${x}px`, top: `${H / 2}px` });
      Object.assign(this.fill.style, { top: `${(H - G) / 2}px`, left: `${K - G / 2}px`, height: `${G}px`, width: `${x - K + G / 2}px` });
    }
    this.word.textContent = `${m % 1 ? m.toFixed(1) : m} m`;
  }

  show(on) { if (!!on === this.on) return; this.on = !!on; this.el.classList.toggle('off', !on); if (!on && this.pid != null) { this.pid = null; this.el.classList.remove('held'); } }
}
