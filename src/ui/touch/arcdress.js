// ---------------------------------------------------------------------------------------
// THE ARC'S DRESS (plain name; TOUCH-REBUILD.md 3.1.1, 7; South's rulings 2026-11-01 and 02: square tiles on one grid, "the tiles need
// equal padding or else it looks awful"; the fold as the tablitas): the look laid over Petra's arc (ui/touch/arc.js places, presses and
// folds it; each tile a `.tt` with `data-slot` A..G, PICK, BELT, and the fold column's `data-fold` 'folded' | 'flipping' | 'open').
// The tiles' bodies are tile.js's glazed clay; this adds what says which slot is which and how the fold stands:
//   A          the primary verb, 2 x 2: an ember rim round its clay (the hearth's fire: the one you press most)
//   F          the meter: a gold ring set round it (its charge fills the tile's own rim; full, the rim is gold)
//   THE STACK  folded, the column shows its face with the tiles under it as a stepped rim of clay edges, each a step lower and narrower
//              (a stack of tablitas seen from the side), gold-edged so it reads as more to pull
//   A FLIP     a tile landing in the cascade turns down over its top edge onto its cell (the plates' clack: Wanda's sound), two
//              ribbons, vermilion and gold, crossed over its face for the moment it falls (the tablitas' ribbons), gone once landed
// A radial (radial.js) stands on a faint dark band round its anchor, a gold thread along its inner edge (radialBack, here).
// Prior art: the Jacob's ladder toy (in Mexico the tablitas: wooden plates on crossed ribbons that cascade), glazed tiles' raised
// rims (Iznik's borders), Brawl Stars' main button's ring, the console weapon wheels' backing ring (Ratchet & Clank's).
//
//   installArcDress() (once: tileStyle calls it)   radialBack(cx, cy, r, w, from, to) -> element (removed by its caller)   ARC_DRESS
// ---------------------------------------------------------------------------------------

/** The colours (CSS): the clay's edges, the keyline, the ember and the gold, the ribbons. */
export const ARC_DRESS = { clay: ['#8a4a2c', '#74402a', '#5e3220'], key: '#1c0d08', ember: '#ff7a2a', gold: '#ffd36a', vermilion: '#e0442a' };
const D = ARC_DRESS;

const CSS = `
.tt[data-slot]{border-radius:20%}
.tt[data-slot="A"]{box-shadow:0 0 0 2px ${D.key},0 0 0 4px ${D.ember}b0,0 0 14px ${D.ember}55}
.tt[data-slot="F"]{box-shadow:0 0 0 2px ${D.key},0 0 0 4px ${D.gold}c0,0 0 0 6px ${D.key}}
body .tt.arc-stack,body .tt[data-fold="folded"]{box-shadow:
  0 5px 0 -2px ${D.clay[0]},0 6px 0 -2px ${D.key},0 6px 0 -1px ${D.gold}66,
  0 11px 0 -5px ${D.clay[1]},0 12px 0 -5px ${D.key},
  0 17px 0 -8px ${D.clay[2]},0 18px 0 -8px ${D.key},0 20px 10px -6px rgba(0,0,0,.45)}
body .tt[data-slot="F"][data-fold="folded"]{box-shadow:0 0 0 2px ${D.key},0 0 0 4px ${D.gold}c0,
  0 7px 0 -2px ${D.clay[0]},0 8px 0 -2px ${D.key},0 13px 0 -5px ${D.clay[1]},0 14px 0 -5px ${D.key},0 19px 0 -8px ${D.clay[2]},0 20px 0 -8px ${D.key},0 22px 10px -6px rgba(0,0,0,.45)}
.tt[data-fold="flipping"]>canvas{transform-origin:50% 0;animation:arc-flip .14s cubic-bezier(.3,1.5,.6,1) both}
.tt[data-fold="flipping"]::before,.tt[data-fold="flipping"]::after{content:'';position:absolute;left:-10%;top:46%;width:120%;height:5px;z-index:2;
  pointer-events:none;border-radius:2px;animation:arc-ribbon .2s ease-out both}
.tt[data-fold="flipping"]::before{background:${D.vermilion};transform:rotate(38deg)}
.tt[data-fold="flipping"]::after{background:${D.gold};transform:rotate(-38deg)}
@keyframes arc-flip{from{transform:perspective(180px) rotateX(-88deg);filter:brightness(.55)}to{transform:none;filter:none}}
@keyframes arc-ribbon{from{opacity:1}to{opacity:0}}
.radial-back{position:fixed;pointer-events:none;z-index:5}
`;

let done = false;
export function installArcDress() {
  if (done || typeof document === 'undefined') return; done = true;
  const s = document.createElement('style'); s.setAttribute('data-arcdress', ''); s.textContent = CSS; document.head.appendChild(s);
}

/** A radial's backing: a band of dark clay on the arc its choices stand on (centre cx, cy; radius r; width w; angles from .. to, y
 *  down), a gold thread along its inner edge. An SVG element at the page's top; its caller removes it. */
export function radialBack(cx, cy, r, w, from, to) {
  const pad = w / 2 + 8, R = r + pad, size = R * 2 + 4, NS = 'http://www.w3.org/2000/svg', svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', 'radial-back'); svg.setAttribute('width', size); svg.setAttribute('height', size);
  svg.style.left = `${cx - size / 2}px`; svg.style.top = `${cy - size / 2}px`;
  const c = size / 2, a0 = from - 0.08, a1 = to + 0.08, arc = (rad) => { const x0 = c + Math.cos(a0) * rad, y0 = c + Math.sin(a0) * rad, x1 = c + Math.cos(a1) * rad, y1 = c + Math.sin(a1) * rad, big = Math.abs(a1 - a0) > Math.PI ? 1 : 0; return `M${x0} ${y0} A${rad} ${rad} 0 ${big} ${a1 > a0 ? 1 : 0} ${x1} ${y1}`; };
  const path = (d, stroke, width, cap = 'round') => { const p = document.createElementNS(NS, 'path'); p.setAttribute('d', d); p.setAttribute('fill', 'none'); p.setAttribute('stroke', stroke); p.setAttribute('stroke-width', width); p.setAttribute('stroke-linecap', cap); svg.appendChild(p); };
  path(arc(r), 'rgba(28,13,8,.42)', w * 0.72); path(arc(r - w * 0.36 - 2), D.gold + '99', 1.25);
  document.body.appendChild(svg); return svg;
}
