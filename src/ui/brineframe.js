// ---------------------------------------------------------------------------------------
// THE BRINE FRAME: a System window in the Emocean's dress (docs/plans/OVERLAY.md 10.3 and 15.4: the System's line and type, the
// island's matter, the player's window colour as its glaze), for the windows the crossing summons: the rail readout (ui/railreadout.js)
// and the results window (ui/railresults.js). DOM, CSS and one small inline SVG a window; 0 shader programs.
//
//   MATTER     the window colour (ui/theme.js THEMES, its --jtop / --jbot) as a tarred glaze, opaque, pooling lighter at its edges, with a
//              salt crust speckled over it (two offset dot lattices, still) and a band of twisted rope under the header.
//   LINE       the labradorite: a 1-dot outer keyline and a 1-dot inner one 2 dots in, walking the schiller (FILM, OVERLAY.md 10.4)
//              slowly along the frame; chamfered at 45 degrees top-left and bottom-right, the top-right corner folded (Denno Coil's),
//              a knot as the corner glyph bottom-left (Brine's: rope, tar, salt crust, knots).
//   TAB        the window's name in the names face (Cinzel), on a tarred tab standing off the top edge, cut on a diagonal.
//   THE DOT    one dot of the 480-line present (render/present.js) is --d = innerHeight / 480 CSS px; every size is whole dots.
//
// Prior art: the style bible's frame (OVERLAY.md 10.3: Calissa's round six mocks), Kingdom Hearts II's command menu skinned by its
// world (Port Royal's rope and tar), Denno Coil's folded-corner windows, a ship's chart table (salt-crusted wood, a whipped rope edge).
//
//   injectBrineCss()   brineFrame(host, { tab }) -> { body, tab, layout() }   dot() -> CSS px a dot   FILM, GOLD, SALT, INK, LACHRYMA_TINT
// ---------------------------------------------------------------------------------------
import { FONT } from './theme.js';

export const FILM = ['#4c0fb3', '#0a8cbf', '#f2b82e', '#d91a80']; // (OVERLAY.md 10.4: the schiller's four stops)
export const GOLD = '#ffd36a'; // (won: a medal reached, a rank won; the kintsugi gold the crossing's parts wear)
export const SALT = '#efe6d2'; // (the type's ink on tar: salt-white)
export const INK = '#17111f';
export const LACHRYMA_TINT = '#7fdcff'; // (matter you hold: the surge is Lachryma)
export const COUNT_FACE = `'Jersey 15', ${FONT.sys}`; // (the counts face, OVERLAY.md 10.2)

/** One dot of the 480-line present, in CSS px. */
export const dot = () => (typeof innerHeight === 'number' ? Math.max(1, innerHeight / 480) : 1.5);

const CSS = `
:where(.bf){position:relative}
.bf{--d:1.5px;--c:calc(6*var(--d));--fold:calc(5*var(--d));color:${SALT};font-family:${FONT.sys};
  font-size:calc(14*var(--d));line-height:1.15;-webkit-font-smoothing:none}
.bf-body{position:relative;padding:calc(7*var(--d)) calc(8*var(--d)) calc(6*var(--d));
  clip-path:polygon(var(--c) 0,calc(100% - var(--fold)) 0,100% var(--fold),100% calc(100% - var(--c)),calc(100% - var(--c)) 100%,0 100%,0 var(--c));
  background:
    radial-gradient(circle,rgba(239,230,210,.16) 0 calc(.5*var(--d)),transparent calc(.6*var(--d))) 0 0/calc(5*var(--d)) calc(5*var(--d)),
    radial-gradient(circle,rgba(239,230,210,.09) 0 calc(.5*var(--d)),transparent calc(.6*var(--d))) calc(2*var(--d)) calc(3*var(--d))/calc(7*var(--d)) calc(9*var(--d)),
    radial-gradient(120% 140% at 50% 50%,rgba(var(--jbot,34,15,9),.97) 55%,rgba(var(--jtop,104,50,32),.96) 100%),
    linear-gradient(180deg,rgba(var(--jtop,104,50,32),.97),rgba(var(--jbot,34,15,9),.98));
  box-shadow:inset 0 0 calc(3*var(--d)) rgba(8,6,4,.85)}
.bf-svg{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;overflow:visible}
.bf-rope{height:calc(3*var(--d));margin:0 calc(-4*var(--d)) calc(4*var(--d));
  background:linear-gradient(180deg,rgba(255,240,210,.35),transparent 40%,rgba(0,0,0,.55)),
    repeating-linear-gradient(118deg,#cbb27c 0 calc(1.5*var(--d)),#6e5630 calc(1.5*var(--d)) calc(3*var(--d)));
  box-shadow:0 var(--d) 0 rgba(10,7,4,.8)}
.bf-tab{position:absolute;left:calc(5*var(--d));bottom:100%;margin-bottom:calc(-1*var(--d));padding:calc(2*var(--d)) calc(12*var(--d)) var(--d) calc(6*var(--d));
  background:linear-gradient(180deg,#2a221b,#120e0b);clip-path:polygon(0 0,calc(100% - calc(7*var(--d))) 0,100% 100%,0 100%);
  font-family:${FONT.title};font-weight:700;font-size:calc(11*var(--d));letter-spacing:.18em;color:${SALT};white-space:nowrap;
  box-shadow:inset 0 calc(-1*var(--d)) 0 ${FILM[1]}}
.bf-lead{flex:1 1 auto;min-width:calc(6*var(--d));align-self:flex-end;height:calc(4*var(--d));margin:0 calc(3*var(--d));
  background:radial-gradient(circle,rgba(239,230,210,.45) 0 calc(.5*var(--d)),transparent calc(.6*var(--d))) 0 50%/calc(3*var(--d)) calc(4*var(--d)) repeat-x}
.bf-count{font-family:${COUNT_FACE};font-variant-numeric:tabular-nums;font-weight:400;letter-spacing:.04em}
.bf .rn{font-family:${COUNT_FACE};font-weight:400;letter-spacing:.02em;text-shadow:0 var(--d) 0 rgba(8,6,4,.9)}
.bf .rn-col{width:.52em}
.bf .rn-sep{width:.22em}
`;
let styled = false;
export function injectBrineCss() {
  if (styled || typeof document === 'undefined') return;
  styled = true;
  const s = document.createElement('style'); s.setAttribute('data-brineframe', ''); s.textContent = CSS; document.head.appendChild(s);
}

let uid = 0;
const NS = 'http://www.w3.org/2000/svg';
const svgEl = (tag, attrs = {}) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); return e; };

/** Build a Brine window inside `host` (which gets the class .bf). Returns its body (put the rows there), its tab, and layout() to call
 *  when its size changes (a ResizeObserver calls it too). */
export function brineFrame(host, { tab = '' } = {}) {
  injectBrineCss();
  host.classList.add('bf');
  const id = `bf${++uid}`;
  const body = document.createElement('div'); body.className = 'bf-body';
  const svg = svgEl('svg', { class: 'bf-svg', 'aria-hidden': 'true' });
  const defs = svgEl('defs'), grad = svgEl('linearGradient', { id: `${id}g`, gradientUnits: 'userSpaceOnUse', x1: 0, y1: 0, x2: 240, y2: 60, spreadMethod: 'repeat' });
  FILM.concat(FILM[0]).forEach((c, i) => grad.appendChild(svgEl('stop', { offset: i / 4, 'stop-color': c })));
  const walk = svgEl('animateTransform', { attributeName: 'gradientTransform', type: 'translate', from: '0 0', to: '240 60', dur: '7s', repeatCount: 'indefinite' });
  grad.appendChild(walk); defs.appendChild(grad); svg.appendChild(defs);
  const outer = svgEl('path', { fill: 'none', stroke: `url(#${id}g)` }), inner = svgEl('path', { fill: 'none', stroke: `url(#${id}g)`, opacity: 0.8 });
  const fold = svgEl('path', { stroke: `url(#${id}g)` }), knot = svgEl('path', { fill: 'none', stroke: `url(#${id}g)`, 'stroke-linecap': 'round' });
  svg.append(outer, inner, fold, knot);
  body.appendChild(svg);
  const t = document.createElement('div'); t.className = 'bf-tab'; t.textContent = tab; if (!tab) t.hidden = true;
  host.append(t, body);

  const layout = () => {
    const d = parseFloat(getComputedStyle(host).getPropertyValue('--d')) || dot(), w = body.offsetWidth, h = body.offsetHeight;
    if (!w || !h) return;
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    const c = 6 * d, f = 5 * d;
    const path = (i) => { const o = i + d / 2, cc = c - o * 0.41, ff = f - o * 0.41;
      return `M${o + cc} ${o}H${w - o - ff}L${w - o} ${o + ff}V${h - o - cc}L${w - o - cc} ${h - o}H${o}V${o + cc}Z`; };
    outer.setAttribute('d', path(0)); outer.setAttribute('stroke-width', d);
    inner.setAttribute('d', path(2 * d)); inner.setAttribute('stroke-width', d);
    fold.setAttribute('d', `M${w - f} 0V${f}H${w}Z`); fold.setAttribute('stroke-width', d);
    fold.style.fill = 'rgb(var(--jtop,104,50,32))';
    // the corner glyph: an overhand knot in the bottom-left corner, the line's own colour
    const kx = 4 * d, ky = h - 4 * d, s = 2.4 * d;
    knot.setAttribute('d', `M${kx} ${ky}c${s} ${-2 * s} ${3 * s} ${-2 * s} ${2 * s} 0s${-2.2 * s} ${0.6 * s} ${-1.2 * s} ${-1.4 * s}s${2 * s} ${-0.8 * s} ${3 * s} ${0.4 * s}`);
    knot.setAttribute('stroke-width', d);
    walk.setAttribute('to', `${Math.round(w)} ${Math.round(h / 4)}`); grad.setAttribute('x2', Math.round(w)); grad.setAttribute('y2', Math.round(h / 4));
  };
  if (typeof ResizeObserver === 'function') new ResizeObserver(layout).observe(body);
  return { body, tab: t, layout };
}
