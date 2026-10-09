// ---------------------------------------------------------------------------------------
// THE BOTTLE'S ARC: the Lachrymato Bottle's fill, beside the crosshair while the Soul Brush's load is spent (feedback/loadgauge.js says
// when and how full; this is its look). A curved vial to the right of the crosshair, in the Lachryma ring's language (vfx/hudring.js):
//   THE LIQUID   Lachryma itself, ink with its oil film in bands (violet, peacock, gold), filling from the bottom up as a liquid would,
//                a pale film line along its inner side and a bright MENISCUS across the vial where it stands (the light part)
//   THE VIAL     dark glass, keylined dark all round (the dark part: casebook rule 105), between two fine lines of the Mind
//   THE MARKS    three notches at the quarters, so how full it is reads as a count and not only as a length (the stamina wheel's segments)
//   LOW          under a quarter, the meniscus breathes
//   DRY          when it runs dry, the frame turns red and pulses and a cross stands at the vial's foot (Splatoon's empty-tank X), for
//                0.6 real seconds; the log's "The bristles run dry." is the load's own
// It eases in and out; nothing in it blinks (the flash is a pulse).
//
// Prior art: Super Mario Sunshine's water gauge (FLUDD's tank, a liquid that falls as you spray), Splatoon's ink tank and its empty-tank
// cross beside the reticle, Breath of the Wild's stamina wheel (beside the player, segmented, shown only while it moves).
//
//   const A = new BottleArc()   A.set({ show: 0..1, frac: 0..1, flash: 0..1 (the dry flash left), low })   A.el   A.dispose()
// ---------------------------------------------------------------------------------------

const C = 80, R = 30, SPAN = 50; // (the box's middle; the vial's radius in px and its half-sweep in degrees: the stand-in's 100 degrees at 30 px, Petra's numbers)
const pt = (deg, r = R) => { const a = (deg * Math.PI) / 180; return [C + Math.cos(a) * r, C + Math.sin(a) * r]; };
/** The vial's arc from the foot (+SPAN, below the right) up to `frac` of the way to its top (-SPAN). */
const arc = (frac, r = R) => {
  const f = Math.max(0.0005, Math.min(1, frac)), [x0, y0] = pt(SPAN, r), [x1, y1] = pt(SPAN - 2 * SPAN * f, r);
  return `M ${x0.toFixed(2)} ${y0.toFixed(2)} A ${r} ${r} 0 0 0 ${x1.toFixed(2)} ${y1.toFixed(2)}`;
};
const across = (frac, r0, r1) => { const d = SPAN - 2 * SPAN * frac, [a, b] = pt(d, r0), [c, e] = pt(d, r1); return `M ${a.toFixed(2)} ${b.toFixed(2)} L ${c.toFixed(2)} ${e.toFixed(2)}`; };

export class BottleArc {
  constructor() {
    const el = (this.el = document.createElement('div'));
    el.id = 'bottlearc';
    el.style.cssText = `position:fixed;left:50%;top:50%;width:${2 * C}px;height:${2 * C}px;margin:${-C}px 0 0 ${-C}px;pointer-events:none;z-index:5;opacity:0`;
    const notches = [0.25, 0.5, 0.75].map((f) => `<path d="${across(f, R - 3.4, R + 3.4)}" class="notch"/>`).join('');
    const [fx, fy] = pt(SPAN + 11);
    el.innerHTML = `<svg viewBox="0 0 ${2 * C} ${2 * C}" style="width:100%;height:100%;overflow:visible">
<defs><linearGradient id="bottlearc-film" x1="0" y1="${C + R}" x2="0" y2="${C - R}" gradientUnits="userSpaceOnUse">
<stop offset="0" stop-color="#3a2c78"/><stop offset=".3" stop-color="#1f6f8c"/><stop offset=".55" stop-color="#2c2560"/><stop offset=".8" stop-color="#8a6a24"/><stop offset="1" stop-color="#4a2f86"/></linearGradient>
<linearGradient id="bottlearc-sheen" x1="0" y1="${C + R}" x2="0" y2="${C - R}" gradientUnits="userSpaceOnUse">
<stop offset="0" stop-color="#c9b8ff"/><stop offset=".35" stop-color="#9ff0ff"/><stop offset=".7" stop-color="#ffe39a"/><stop offset="1" stop-color="#e6c8ff"/></linearGradient></defs>
<g fill="none" stroke-linecap="round">
<path class="kl" d="${arc(1)}" stroke="rgba(8,5,14,.78)" stroke-width="11"/>
<path class="glass" d="${arc(1)}" stroke="rgba(40,28,64,.62)" stroke-width="7"/>
<path class="liq" d="" stroke="url(#bottlearc-film)" stroke-width="6.2"/>
<path class="sheen" d="" stroke="url(#bottlearc-sheen)" stroke-width="1.3" stroke-opacity=".9"/>
<g class="notches" stroke="rgba(8,5,14,.9)" stroke-width="1.6" stroke-linecap="butt">${notches}</g>
<path class="frameKl" d="${arc(1, R + 5.6)} ${arc(1, R - 5.6)}" stroke="rgba(8,5,14,.55)" stroke-width="2.8"/>
<path class="frame" d="${arc(1, R + 5.6)} ${arc(1, R - 5.6)}" stroke="#b6a8d8" stroke-width="1.1" stroke-opacity=".85"/>
<path class="menKl" d="" stroke="rgba(8,5,14,.9)" stroke-width="4.4"/>
<path class="men" d="" stroke="#fff1dc" stroke-width="2"/>
<g class="dry" opacity="0" stroke-linecap="round"><path d="M ${fx - 5} ${fy - 5} L ${fx + 5} ${fy + 5} M ${fx + 5} ${fy - 5} L ${fx - 5} ${fy + 5}" stroke="rgba(8,5,14,.92)" stroke-width="6.5"/><path d="M ${fx - 5} ${fy - 5} L ${fx + 5} ${fy + 5} M ${fx + 5} ${fy - 5} L ${fx - 5} ${fy + 5}" stroke="#ff5a48" stroke-width="3"/></g>
</g></svg>`;
    document.body.appendChild(el);
    const q = (s) => el.querySelector(s);
    this.liq = q('.liq'); this.sheen = q('.sheen'); this.men = q('.men'); this.menKl = q('.menKl'); this.frame = q('.frame'); this.kl = q('.kl'); this.dry = q('.dry');
    this.shown = 0; this.t = 0; this.last = -1;
  }

  /** show: 0..1 (eased by the caller); frac: how full; flash: the dry flash left (1 at its start, 0 none); low: under a quarter. */
  set({ show = 0, frac = 0, flash = 0, low = false } = {}, raw = 1 / 60) {
    this.t = (this.t + raw) % 60;
    if (Math.abs(show - this.shown) > 0.004) { this.shown = show; this.el.style.opacity = show.toFixed(3); }
    if (show <= 0) return;
    const f = Math.max(0, Math.min(1, frac)), key = Math.round(f * 400);
    if (key !== this.last) {
      this.last = key;
      this.liq.setAttribute('d', f > 0.004 ? arc(f) : ''); this.sheen.setAttribute('d', f > 0.004 ? arc(f, R - 1.9) : '');
      const m = across(f, R - 5, R + 5); this.men.setAttribute('d', m); this.menKl.setAttribute('d', m);
    }
    const pulse = flash > 0 ? 0.5 - 0.5 * Math.cos(flash * Math.PI * 2 * 2.5) : 0; // (two and a half pulses over the flash)
    this.frame.setAttribute('stroke', flash > 0 ? mixHex('#b6a8d8', '#ff5a48', Math.min(1, 0.55 + pulse)) : '#b6a8d8');
    this.kl.setAttribute('stroke', pulse > 0.02 ? `rgba(${Math.round(8 + 90 * pulse)},5,14,.82)` : 'rgba(8,5,14,.78)');
    this.dry.setAttribute('opacity', flash > 0 ? (0.65 + 0.35 * pulse).toFixed(2) : '0');
    this.men.setAttribute('stroke-opacity', low ? (0.55 + 0.45 * (0.5 + 0.5 * Math.cos(this.t * Math.PI * 2 * 1.2))).toFixed(2) : '1');
  }

  dispose() { this.el.remove(); }
}

/** Two #rrggbb colours mixed (0: the first, 1: the second). */
function mixHex(a, b, k) {
  const p = (h, i) => parseInt(h.slice(1 + 2 * i, 3 + 2 * i), 16);
  return `#${[0, 1, 2].map((i) => Math.round(p(a, i) + (p(b, i) - p(a, i)) * k).toString(16).padStart(2, '0')).join('')}`;
}
