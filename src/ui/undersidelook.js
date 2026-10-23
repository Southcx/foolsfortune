// ---------------------------------------------------------------------------------------
// THE UNDERSIDE'S DRESS (docs/plans/SPREADS.md 5.1; Dovina's page `pneuka/underside.js`, its `us-*` classes): the Pneuka Box turned over,
// in the Clay dress and the reading view's colours (vfx/readingview.js SUIT_LOOK), so the window's flip side and the reading round the
// Courier read as one thing. Only looks: every rule, every number and every word stay the page's.
//   THE TABS      the spreads as glazed tiles on a cord; the one laid lit gold, a shut one unfired bisque
//   THE CLOTH     plum velvet with a fine nap, gold thread between the cells; a lit cell glows (the page's tint, laid over the velvet
//                 so the nap shows through); a dark cell is the cloth burned through, its crack drawn as a scorched fissure, never a
//                 glyph; the Fool's cell a small gold disc with a ring
//   A PLACE       empty: a frame of gold thread stitched on the cloth; laid: a card of the house deck's stock (cream slip, a gold edge, a
//                 plum border), reversed with a vermilion edge (the house's "turned"); your pair's place wears a fine gold knot
//   THE HAND      the cards fanned on the window's floor, the held one lifted and haloed in gold
//   THE TALLY     four glazed bars in their suit's colour on a bisque trough
//
// Prior art: the reading table's own dress (ui/readingtable.js: the slips, the gold edge, the plum), Balatro's hand (the held card lifted),
// a reader's velvet cloth (the Rider-Waite readers' spread cloth), and the Golden Dawn's diagram laid on it.
//
//   installUndersideLook()   (once, at boot: injects the style; the page's classes do the rest)   UNDERSIDE_LOOK (the colours)
// ---------------------------------------------------------------------------------------
import { SUIT_LOOK } from '../vfx/readingview.js';

const hex = (n) => `#${n.toString(16).padStart(6, '0')}`;
export const UNDERSIDE_LOOK = {
  velvet: '#2a1830', velvetDeep: '#140a18', thread: 'rgba(212,165,60,.55)', gold: '#ffd36a', slip: '#efe0c2', plum: '#3a2148', vermilion: '#e0442a',
  suits: Object.fromEntries(Object.entries(SUIT_LOOK).map(([k, v]) => [k, hex(v)])),
};
const L = UNDERSIDE_LOOK;

// (a scorched fissure, drawn once as an SVG: a dark cell's crack)
const CRACK = `url("data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 44 44"><path d="M6 8 L18 19 L14 28 L25 35 M18 19 L33 13 L38 24" fill="none" stroke="#ffb27a" stroke-opacity=".55" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M6 8 L18 19 L14 28 L25 35 M18 19 L33 13 L38 24" fill="none" stroke="#000" stroke-opacity=".7" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round" transform="translate(.6 .6)"/></svg>')}")`;

const CSS = `
#pneuka .us .us-tabs{gap:4px;padding:2px 0 4px;border-bottom:1px solid rgba(212,165,60,.35)}
#pneuka .us .us-tab{border:0;border-radius:3px;padding:5px 12px;font:700 10px/1 Georgia,serif;letter-spacing:.16em;text-transform:uppercase;color:#2a140c;
  background:linear-gradient(180deg,#e9d6bc,#c9a882);box-shadow:inset 0 1px 0 rgba(255,255,255,.35),inset 0 -2px 0 rgba(0,0,0,.25),0 0 0 1px #2a140c}
#pneuka .us .us-tab.on{color:#2a140c;background:linear-gradient(180deg,#ffe6a8,${L.gold});box-shadow:inset 0 1px 0 #fff8,0 0 0 1px #2a140c,0 0 10px rgba(255,211,106,.45)}
#pneuka .us .us-tab.shut{color:#6a5040;background:linear-gradient(180deg,#b8a088,#9a8068);opacity:.75}
#pneuka .us .us-cloth{border:0;border-radius:6px;
  background:radial-gradient(circle,rgba(255,236,214,.06) 0 1px,transparent 1.4px) 0 0/5px 6px,radial-gradient(ellipse at 50% 40%,${L.velvet},${L.velvetDeep});
  box-shadow:0 0 0 2px #2a140c,0 0 0 4px rgba(212,165,60,.45),inset 0 0 30px rgba(0,0,0,.6),0 14px 30px rgba(0,0,0,.55)}
#pneuka .us .us-cell{border:1px solid ${L.thread};border-radius:2px;background-blend-mode:screen}
#pneuka .us .us-cell:not(.dark){box-shadow:inset 0 0 8px rgba(0,0,0,.45)}
#pneuka .us .us-cell.dark{background:${CRACK} center/100% 100% no-repeat,radial-gradient(circle,#0a0406,#000)!important;border-color:rgba(255,120,60,.35);
  box-shadow:inset 0 0 6px rgba(255,90,40,.35)}
#pneuka .us .us-cell.dark::after{content:none}
#pneuka .us .us-cell.fool{box-shadow:inset 0 0 0 1px ${L.gold},inset 0 0 8px rgba(0,0,0,.45)}
#pneuka .us .us-cell.fool::before{content:'';position:absolute;left:50%;top:50%;width:8px;height:8px;margin:-4px 0 0 -4px;border-radius:50%;background:${L.gold};box-shadow:0 0 0 3px rgba(255,211,106,.25),0 0 8px ${L.gold}}
#pneuka .us .us-pos{border-radius:4px;font:9px/1.05 Georgia,serif;transition:transform .15s}
#pneuka .us .us-pos.empty{border:1.5px dashed ${L.thread};color:${L.gold};background:rgba(20,9,6,.35);box-shadow:inset 0 0 0 2px rgba(20,9,6,.6)}
#pneuka .us .us-pos.empty:hover{border-color:${L.gold};background:rgba(255,211,106,.08)}
#pneuka .us .us-pos.laid{color:#2a140c;background:linear-gradient(180deg,${L.slip},#dcc49c);border:2px solid ${L.gold};
  box-shadow:inset 0 0 0 2px ${L.plum},0 4px 10px rgba(0,0,0,.6)}
#pneuka .us .us-pos.laid b{font:700 13px/1 Georgia,serif;color:${L.plum}}
#pneuka .us .us-pos.rev{border-color:${L.vermilion};box-shadow:inset 0 0 0 2px ${L.plum},0 0 8px rgba(224,68,42,.5),0 4px 10px rgba(0,0,0,.6)}
#pneuka .us .us-pos.pair::after{content:'';position:absolute;top:-4px;right:-4px;width:8px;height:8px;border-radius:50%;background:${L.gold};box-shadow:0 0 0 1px #2a140c}
#pneuka .us .us-pos i{border-color:#2a140c;box-shadow:0 0 4px currentColor}
#pneuka .us .us-lbl{color:${L.gold};font:italic 9px/1 Georgia,serif;letter-spacing:.04em;text-shadow:0 1px 2px #000,0 0 4px #000}
#pneuka .us .us-hand{gap:0;padding:12px 4px 2px}
#pneuka .us .us-card{margin-left:-10px;border-radius:5px;color:#2a140c;font:10px/1.1 Georgia,serif;background:linear-gradient(180deg,${L.slip},#dcc49c);
  border:2px solid ${L.gold};box-shadow:inset 0 0 0 2px ${L.plum},0 6px 12px rgba(0,0,0,.5);transition:transform .15s,box-shadow .15s}
#pneuka .us .us-card:first-child{margin-left:0}
#pneuka .us .us-card:nth-child(odd){transform:rotate(-3deg)}
#pneuka .us .us-card:nth-child(even){transform:rotate(3deg)}
#pneuka .us .us-card b{font:700 15px/1 Georgia,serif;color:${L.plum}}
#pneuka .us .us-card span{text-shadow:0 0 1px #2a140c,0 0 1px #2a140c,0 0 2px #2a140c} /* (the suit's word keylined dark: Swords' pale steel vanished on the cream) */
#pneuka .us .us-card:hover{transform:translateY(-6px) rotate(0);z-index:2}
#pneuka .us .us-card.held{transform:translateY(-14px) rotate(0);z-index:3;box-shadow:inset 0 0 0 2px ${L.plum},0 0 0 2px ${L.gold},0 0 16px rgba(255,211,106,.55),0 10px 18px rgba(0,0,0,.6)}
#pneuka .us .us-tally{font:11px/1.2 Georgia,serif;color:#efe6d2}
#pneuka .us .us-tally .bar{height:8px;border-radius:4px;background:linear-gradient(180deg,#4e2a1c,#3a1c12);box-shadow:inset 0 1px 2px rgba(0,0,0,.6),0 1px 0 rgba(255,226,196,.1)}
#pneuka .us .us-tally .bar i{border-radius:4px;box-shadow:inset 0 1px 0 rgba(255,255,255,.4),inset 0 -1px 0 rgba(0,0,0,.25)}
#pneuka .us .us-note{font:italic 11px/1.35 Georgia,serif;color:#e9d6bc;opacity:.85}
`;

let installed = false;
/** The underside's dress, once (the page's classes take it from there). */
export function installUndersideLook() {
  if (installed || typeof document === 'undefined') return;
  installed = true;
  const s = document.createElement('style'); s.setAttribute('data-undersidelook', ''); s.textContent = CSS; document.head.appendChild(s);
}
