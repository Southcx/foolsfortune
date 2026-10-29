// ---------------------------------------------------------------------------------------
// THE TRACK EDITOR'S DRESS (Dovina's panel `#tedit` and its map, world/raceway/editor.js; her handoff of 2026-10-24): the panel in the
// Clay dress as the other System windows wear it (OVERLAY.md 15.4: Anagami's; ui/goalswindow.js clayDress), only looks: every rule,
// word and button stays hers.
//   THE WINDOW   unglazed earthenware, its grog speckled, the window colour fired faintly into it; chamfered top-left and bottom-right,
//                its keyline the labradorite's film (OVERLAY.md 10.4), a heading over a cord-marked band (Jomon ware's rope)
//   A BUTTON     a glazed tile: fired terracotta under a glossy glaze in the window colour, its rim catching the light; chosen, glazed
//                gold; shut (a power not yet yours), bisque left unglazed and dusty
//   THE BUDGET   a glaze run in a bisque trough (gold once full)
//   THE MAP      the lot as a fired tile: bisque with its grog, the lot's grid pressed in, the line as a gold-edged road of pale slip, the
//                start a gold bar, the points clay pegs, the pieces celadon lozenges, the traps ember discs ringed dark, the camera's
//                view a frame in the film's colours (drawMap, asked by her drawMap first)
//
// Prior art: the house's own Clay windows (ui/goalswindow.js, ui/collectionslook.js), a potter's test-tile board, Trackmania's and
// RollerCoaster Tycoon's minimap (the view's box on the whole).
//
//   game.trackEditorLook = new TrackEditorLook()   (injects the style once)   .drawMap(editor, canvas) -> true (her map stands back)
// ---------------------------------------------------------------------------------------
import { LOT } from '../progress/trackdef.js';
import { PIECES } from '../progress/trackpieces.js';
import { FILM, GOLD } from './brineframe.js';

const S = 'body #tedit'; // (an element more than her rules: the dress wins whichever style is injected later)
const GLAZE = 'linear-gradient(180deg,rgba(255,255,255,.38),transparent 46%,rgba(0,0,0,.2))';
const CSS = `
${S}{border:0;border-radius:0;padding:10px 12px 12px;color:#f6e6d2;font-family:var(--f-sys);font-size:12px;line-height:1.35;
  clip-path:polygon(10px 0,100% 0,100% calc(100% - 10px),calc(100% - 10px) 100%,0 100%,0 10px);
  background:radial-gradient(circle,rgba(255,236,214,.16) 0 .8px,transparent 1px) 0 0/6px 7px,
    radial-gradient(circle,rgba(40,20,10,.35) 0 .9px,transparent 1.1px) 3px 2px/9px 10px,
    linear-gradient(180deg,rgba(var(--jtop,104,50,32),.24),rgba(var(--jbot,34,15,9),.32)),linear-gradient(180deg,#7a4630,#4e2a1c);
  box-shadow:inset 0 0 0 1px #1c0d08,inset 0 0 0 2px ${FILM[0]}99,inset 0 0 0 3px ${FILM[1]}55,inset 0 1px 0 4px rgba(255,226,196,.08),inset 0 0 18px rgba(8,4,2,.55);
  scrollbar-color:#b8692e #3e2016;scrollbar-width:thin}
${S} h3{margin:10px 0 6px;padding-bottom:5px;font:600 11px/1.1 var(--f-title);letter-spacing:.18em;color:#ffdcb4;text-shadow:0 1px 0 #1c0d08;
  background:linear-gradient(180deg,rgba(255,230,200,.2),transparent 45%,rgba(0,0,0,.4)) 0 100%/100% 3px no-repeat,
    repeating-linear-gradient(62deg,#a8664a 0 1.5px,#5c3020 1.5px 3px) 0 100%/100% 3px no-repeat}
${S} > h3:first-of-type{color:${GOLD}}
${S} .row{gap:5px}
${S} button{font:500 11px/1.1 var(--f-sys);letter-spacing:.04em;color:#fff1dc;padding:5px 8px 6px;border:0;border-radius:4px 6px 3px 5px;cursor:pointer;
  background:${GLAZE},linear-gradient(180deg,rgba(var(--jtop,104,50,32),.85),rgba(var(--jbot,34,15,9),.9)),#6a3a26;
  box-shadow:inset 0 1px 0 rgba(255,236,214,.4),inset 0 -2px 0 rgba(0,0,0,.35),0 0 0 1px #1c0d08,0 2px 3px rgba(0,0,0,.45);text-shadow:0 1px 0 rgba(0,0,0,.55)}
${S} button:nth-child(3n){border-radius:6px 3px 5px 4px}
${S} button:hover:not(:disabled){filter:brightness(1.18)}
${S} button.on{color:#2a140c;text-shadow:0 1px 0 rgba(255,240,200,.5);background:${GLAZE},linear-gradient(180deg,#ffe6a8,${GOLD} 55%,#c8962e);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.6),inset 0 -2px 0 rgba(120,70,10,.45),0 0 0 1px #1c0d08,0 0 8px rgba(255,211,106,.45)}
${S} button:disabled{opacity:1;cursor:default;color:rgba(40,22,14,.7);text-shadow:none;filter:saturate(.5);
  background:radial-gradient(circle,rgba(60,30,14,.22) 0 1px,transparent 1.5px) 0 0/5px 4px,linear-gradient(170deg,#a88a6e,#7e624a);
  box-shadow:inset 0 1px 0 rgba(255,236,214,.16),inset 0 -1px 0 rgba(0,0,0,.3),0 0 0 1px rgba(28,13,8,.8)}
${S} .bar{height:9px;border:0;border-radius:5px;margin:4px 0 6px;background:linear-gradient(180deg,#5a3626,#b89a7a 30%,#d8c0a0);box-shadow:inset 0 2px 2px rgba(0,0,0,.55),0 1px 0 rgba(255,226,196,.15)}
${S} .bar i{border-radius:5px;background:${GLAZE},rgb(var(--jsel,196,106,69));box-shadow:inset 0 0 0 1px rgba(255,240,220,.25),0 0 6px rgba(var(--jsel,196,106,69),.5)}
${S} .map canvas{border:0;border-radius:2px;box-shadow:0 0 0 1px #1c0d08,0 0 0 3px #b8692e,0 0 0 4px ${GOLD},0 0 0 5px #1c0d08,0 4px 10px rgba(0,0,0,.5);margin:6px 5px 4px;image-rendering:auto}
${S} textarea.code{color:#2a140c;border:0;border-radius:3px;background:linear-gradient(180deg,#d8c0a0,#e9d6bc);box-shadow:inset 0 2px 3px rgba(0,0,0,.45),0 0 0 1px #1c0d08}
${S} .err{color:#ff9a7a;text-shadow:0 1px 0 #1c0d08} ${S} .ok{color:#bfe8c8;text-shadow:0 1px 0 #1c0d08} ${S} .dim{opacity:.72}
body.tedit-hand canvas{cursor:none}
`;
// the map's palette: bisque and its grog, the grid pressed in, the road's slip and gold, pegs, pieces, traps, the view's film
const MAPC = { ground: ['#d8c0a0', '#c9a882'], grog: 'rgba(60,30,14,.22)', grid: 'rgba(90,50,26,.28)', lot: '#8a4a3a', road: '#f3e2c4', edge: '#c8962e', ink: '#2a140c',
  peg: '#d9906a', pegSel: GOLD, piece: '#7fb293', trap: '#ff6a3a', trapRim: '#4a1408' };

export class TrackEditorLook {
  constructor() {
    if (typeof document === 'undefined' || document.getElementById('tedit-look')) return;
    const st = document.createElement('style'); st.id = 'tedit-look'; st.textContent = CSS; document.head.appendChild(st);
  }
  /** The bisque ground, made once a size (the grog's speckle is drawn, not noise each redraw). */
  groundOf(px) {
    if (this.ground?.width === px) return this.ground;
    const c = (this.ground = document.createElement('canvas')); c.width = c.height = px; const x = c.getContext('2d');
    const g = x.createLinearGradient(0, 0, 0, px); g.addColorStop(0, MAPC.ground[0]); g.addColorStop(1, MAPC.ground[1]); x.fillStyle = g; x.fillRect(0, 0, px, px);
    let s = 11; const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    x.fillStyle = MAPC.grog; for (let i = 0; i < px * 3; i++) x.fillRect(r() * px, r() * px, 1 + (r() > 0.8), 1);
    x.strokeStyle = MAPC.grid; x.lineWidth = 1; for (let i = 1; i < 8; i++) { const v = Math.round((i * px) / 8) + 0.5; x.beginPath(); x.moveTo(v, 0); x.lineTo(v, px); x.moveTo(0, v); x.lineTo(px, v); x.stroke(); }
    x.strokeStyle = MAPC.lot; x.lineWidth = 2; x.strokeRect(1, 1, px - 2, px - 2);
    return c;
  }
  /** The editor's map drawn in the Clay dress (her drawMap's content, its look ours). */
  drawMap(E, c) {
    const x = c.getContext('2d'), D = E.def, T = E.T, px = c.width, k = px / (2 * LOT.half), at = (lx, lz) => [(lx + LOT.half) * k, (lz + LOT.half) * k];
    x.drawImage(this.groundOf(px), 0, 0);
    if (T) { // (the road: a gold edge under pale slip, its width the line's)
      x.lineCap = 'round'; x.lineJoin = 'round';
      for (const [col, extra] of [[MAPC.ink, 3], [MAPC.edge, 2], [MAPC.road, 0]]) {
        x.strokeStyle = col;
        for (let s = 0; s < T.length; s += 6) { const a = T.frame(s), b = T.frame(Math.min(T.length - 0.01, s + 6)); x.lineWidth = Math.max(2, a.w * 2 * k) + extra; x.beginPath(); x.moveTo(...at(a.x - LOT.x, a.z - LOT.z)); x.lineTo(...at(b.x - LOT.x, b.z - LOT.z)); x.stroke(); }
      }
      const F = T.frame(T.line || 0), [sx, sz] = at(F.x - LOT.x, F.z - LOT.z), w = F.w * k + 1;
      x.lineCap = 'butt'; x.strokeStyle = MAPC.ink; x.lineWidth = 5; x.beginPath(); x.moveTo(sx - F.fz * w, sz + F.fx * w); x.lineTo(sx + F.fz * w, sz - F.fx * w); x.stroke();
      x.strokeStyle = GOLD; x.lineWidth = 3; x.stroke();
    }
    D.points.forEach((p, i) => { const [qx, qz] = at(p[0], p[1]), on = E.sel?.type === 'point' && E.sel.i === i; x.fillStyle = MAPC.ink; x.beginPath(); x.arc(qx, qz, on ? 4.2 : 3, 0, 2 * Math.PI); x.fill(); x.fillStyle = on ? MAPC.pegSel : MAPC.peg; x.beginPath(); x.arc(qx, qz, on ? 3 : 2, 0, 2 * Math.PI); x.fill(); });
    const tie = (a, b, style) => { if (!a || !b) return; x.strokeStyle = style; x.setLineDash([3, 3]); x.lineWidth = 1.5; x.beginPath(); x.moveTo(...a); x.lineTo(...b); x.stroke(); x.setLineDash([]); };
    const lozenge = (q) => { if (!q) return null; const [qx, qz] = at(q.x, q.z); x.fillStyle = MAPC.ink; x.beginPath(); x.moveTo(qx, qz - 4.2); x.lineTo(qx + 4.2, qz); x.lineTo(qx, qz + 4.2); x.lineTo(qx - 4.2, qz); x.fill(); x.fillStyle = MAPC.piece; x.beginPath(); x.moveTo(qx, qz - 3); x.lineTo(qx + 3, qz); x.lineTo(qx, qz + 3); x.lineTo(qx - 3, qz); x.fill(); return [qx, qz]; };
    const ember = (q) => { if (!q) return null; const [qx, qz] = at(q.x, q.z); x.fillStyle = MAPC.trapRim; x.beginPath(); x.arc(qx, qz, 4.6, 0, 2 * Math.PI); x.fill(); x.fillStyle = MAPC.trap; x.beginPath(); x.arc(qx, qz, 3.2, 0, 2 * Math.PI); x.fill(); x.fillStyle = 'rgba(255,230,160,.9)'; x.beginPath(); x.arc(qx - 1, qz - 1, 1.1, 0, 2 * Math.PI); x.fill(); return [qx, qz]; };
    for (const Pc of D.pieces) { const a = lozenge(E.spot(Pc)); if (PIECES[Pc.kind]?.span) tie(a, lozenge(E.spot(Pc, true)), MAPC.piece); }
    for (const Tp of D.traps) { const a = ember(E.spot(Tp)); if (Tp.u2 != null) tie(a, ember(E.spot(Tp, true)), MAPC.trap); }
    // the camera's view: its footprint, framed in the film's colours
    const cam = E.game.camera, hh = E.cam.h * Math.tan(((cam?.fov || 70) * Math.PI) / 360), hw = hh * (cam?.aspect || 1.6), [cx, cz] = at(E.cam.x, E.cam.z);
    const gr = x.createLinearGradient(cx - hw * k, cz - hh * k, cx + hw * k, cz + hh * k); FILM.forEach((f, i) => gr.addColorStop(i / (FILM.length - 1), f));
    x.strokeStyle = MAPC.ink; x.lineWidth = 3.5; x.strokeRect(cx - hw * k, cz - hh * k, 2 * hw * k, 2 * hh * k);
    x.strokeStyle = gr; x.lineWidth = 2; x.strokeRect(cx - hw * k, cz - hh * k, 2 * hw * k, 2 * hh * k);
    return true;
  }
}
