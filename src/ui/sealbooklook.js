// ---------------------------------------------------------------------------------------
// THE SEAL BOOK'S DRESS (docs/plans/HANKO.md 5: "a pilgrim's goshuinchō"; Petra's page `feedback/codex/sealbook.js`, its `sb-*` classes):
// the Codex's SEAL BOOK shelf dressed as a goshuinchō, each island's pages one book in that island's dress (OVERLAY.md 15.4). Only looks:
// every rule, every number and every word stay the page's; this moves its pages into their island's book and lays marks beside them.
//   THE HEAD      the page's counts on bisque plaques (the collection log's dress, ui/collectionslook.js)
//   A BOOK        an island's pages (the page's own SEAL_PAGES `island`, read again from each page's line if the order ever differs)
//                 behind a cover in the island's dress: Anagami's Clay (unglazed earthenware, grog-speckled, a cord-marked binding, the
//                 window colour fired faintly in), Margarite's Nacre (mother-of-pearl in lamp brass); on the cover its title slip
//                 (a daisen of washi, the island's name brushed down it) and how many of its pages are stamped
//   A PAGE        washi with its kozo fibres, the pages joined edge to edge and shaded in turn as a concertina folds; the page's
//                 stamps (the place's seal, its cradle's number in the Comb in a ring, over your seal's imprint, vermilion) pressed
//                 into the paper: multiplied into it, the ink mottled as a hand-pressed seal's is, set a degree or two off square;
//                 the place's name brushed down the right edge in sumi; the date brushed at the foot on the left (the play time the
//                 ledger's first holds, hours and minutes, in neuralese numerals in the running hand, as the numerals are worn on things)
//   NOT YET       a blank page: its name pencilled faint, and its cradle's number in the Comb pressed blind (no ink) where its seal will
//                 land, so you know where there is to go
//
// Prior art: the goshuinchō itself (the shrine's vermilion seal and the date brushed in sumi beside it, on a concertina of washi in a
// brocade cover with its daisen slip), Jōmon cord-marked ware (the binding), the collection log's and the underside's dresses here.
//
//   installSealBookLook(game)   (once, at boot: the style, and a watch on the Codex that dresses the shelf each time it is drawn)
//   SEAL_BOOK_LOOK (the inks, the islands' dresses)
// ---------------------------------------------------------------------------------------
import { SEAL_PAGES } from '../feedback/codex/sealbook.js';
import { drawCombNumber } from '../vfx/sealface.js';
import { runningHand } from './runninghand.js';
import { FONT } from './theme.js';

export const SEAL_BOOK_LOOK = {
  sumi: '#1f1611', vermilion: '#d64834', washi: '#f3ead8', gold: '#ffd36a', brass: '#b8913f',
  dress: { Anagami: 'clay', Margarite: 'nacre' }, word: { clay: 'CLAY', nacre: 'NACRE' },
};
const K = SEAL_BOOK_LOOK;
const S = 'body #codex'; // (one id and an element more than the page's own rules: the dress wins whichever style is injected later)
const svg = (s) => `url("data:image/svg+xml,${encodeURIComponent(s)}")`;
// washi: its long kozo fibres (a fractal noise stretched along the sheet, faint where it rises), its cloudy formation and its specks;
// the stamp's mottled ink as a mask (a few dropouts where the seal did not take)
const FIBRE = (fx, fy, seed) => svg(`<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><filter id="f" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="${fx} ${fy}" numOctaves="3" seed="${seed}" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 .5 0 0 0 0 .4 0 0 0 0 .28 1.5 0 0 0 -.93"/></filter><rect width="200" height="200" filter="url(#f)"/></svg>`);
const CLOUD = svg('<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240"><filter id="f" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".018" numOctaves="2" seed="21" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 .55 0 0 0 0 .45 0 0 0 0 .32 .4 0 0 0 -.12"/></filter><rect width="240" height="240" filter="url(#f)"/></svg>');
const SPECK = svg('<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160"><filter id="f" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".8" numOctaves="1" seed="11" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 .3 0 0 0 0 .22 0 0 0 0 .14 5 0 0 0 -3.6"/></filter><rect width="160" height="160" filter="url(#f)"/></svg>');
const MOTTLE = svg('<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128"><filter id="f" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".5" numOctaves="2" seed="3" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 -4.5 0 0 0 4.2"/></filter><rect width="128" height="128" filter="url(#f)"/></svg>');
const PAPER = `${FIBRE(0.012, 0.3, 4)},${CLOUD},${SPECK},radial-gradient(ellipse at 50% 38%,#f8f1e4,#e9dcc3)`;
const PAPER_SIZE = '200px 200px,240px 240px,160px 160px,100% 100%';

const CSS = `
${S} .sb-head{gap:10px;align-items:stretch;font:11px/1.2 var(--f-sys);letter-spacing:.1em;opacity:1}
${S} .sb-head>div{padding:6px 12px 7px;border-radius:4px;color:#3a1c10;
  background:radial-gradient(circle,rgba(60,30,14,.16) 0 1px,transparent 1.5px) 0 0/6px 7px,linear-gradient(180deg,#e9d6bc,#c9a882);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.4),inset 0 -2px 0 rgba(0,0,0,.22),0 0 0 1px #2a140c,0 3px 6px rgba(0,0,0,.4)}
${S} .sb-head b{font:400 24px/1 'Jersey 15',var(--f-sys);color:#2a140c;letter-spacing:.02em}
${S} .sb-wrap.sbl-on{display:block}
${S} .sbl-book{display:flex;align-items:center;margin:6px 0 20px;padding:4px 0 6px}
${S} .sbl-fold{display:flex;flex-wrap:wrap;row-gap:16px;filter:drop-shadow(0 7px 9px rgba(0,0,0,.5))}
${S} .sbl-book,${S} .sb-head{-webkit-text-size-adjust:100%;text-size-adjust:100%}
${S} .sbl-fold .sb-page{position:relative;flex:none;width:168px;height:236px;box-sizing:border-box;margin:0;padding:30px 0 0;border:0;border-radius:0;
  text-align:center;background:${PAPER};background-size:${PAPER_SIZE}}
${S} .sbl-fold .sb-page::before{content:'';position:absolute;inset:0;pointer-events:none;
  background:linear-gradient(90deg,rgba(255,255,255,.22),transparent 28%,transparent 62%,rgba(96,62,30,.16));box-shadow:inset -1px 0 0 rgba(120,86,52,.35)}
${S} .sbl-fold .sb-page:nth-child(odd)::before{background:linear-gradient(90deg,rgba(96,62,30,.2),transparent 40%,transparent 80%,rgba(255,255,255,.14))}
${S} .sbl-fold .sb-page.got{border:0;background:${PAPER};background-size:${PAPER_SIZE}}
${S} .sbl-fold .sb-page>canvas:not([class]){position:relative;width:136px;height:136px;margin:0 auto;mix-blend-mode:multiply;transform:rotate(var(--tilt,0deg));
  -webkit-mask-image:${MOTTLE};mask-image:${MOTTLE};-webkit-mask-size:136px 136px;mask-size:136px 136px}
${S} .sbl-fold .sb-page b{position:absolute;right:8px;top:16px;writing-mode:vertical-rl;white-space:nowrap;font:400 14px/1 ${FONT.lore};letter-spacing:.14em;color:${K.sumi};
  text-shadow:0 0 .7px rgba(31,22,17,.6),.4px .3px 0 rgba(31,22,17,.25)}
${S} .sbl-fold .sb-page:not(.got) b{color:rgba(74,56,40,.34);text-shadow:none}
${S} .sbl-fold .sb-page s{position:absolute;left:50%;bottom:11px;transform:translateX(-50%);transform-origin:50% 100%;white-space:nowrap;font:italic 10px/1 ${FONT.lore};letter-spacing:.06em;color:rgba(64,42,28,.72);opacity:1}
${S} .sbl-fold .sb-page canvas.sbl-date{position:absolute;left:12px;bottom:26px;width:56px;height:44px;margin:0;mix-blend-mode:multiply;pointer-events:auto}
${S} .sbl-fold .sb-page canvas.sbl-blind{position:absolute;left:50%;top:30px;width:136px;height:136px;margin:0 0 0 -68px;pointer-events:none}
${S} .sbl-cover{position:relative;flex:none;align-self:stretch;width:112px;min-height:248px;margin:-6px 4px -6px 0;box-sizing:border-box;border-radius:5px 2px 2px 5px;
  display:flex;flex-direction:column;align-items:center;gap:10px;padding:16px 10px 12px 18px;color:#f1d2b0;
  background:radial-gradient(circle,rgba(255,236,214,.17) 0 1px,transparent 1.5px) 0 0/7px 8px,
    radial-gradient(circle,rgba(30,14,8,.38) 0 1.2px,transparent 1.7px) 3px 2px/11px 13px,
    linear-gradient(180deg,rgba(var(--jtop,104,50,32),.28),rgba(var(--jbot,34,15,9),.42)),linear-gradient(160deg,#8a5238,#4e2a1c);
  box-shadow:inset 0 1px 0 rgba(255,230,200,.3),inset 0 -3px 0 rgba(0,0,0,.35),0 0 0 1px #1c0d08,0 8px 16px rgba(0,0,0,.5)}
${S} .sbl-cover::before{content:'';position:absolute;left:0;top:0;bottom:0;width:10px;border-radius:5px 0 0 5px;
  background:linear-gradient(90deg,rgba(255,230,200,.22),transparent 45%,rgba(0,0,0,.45)),repeating-linear-gradient(62deg,#a8664a 0 2px,#5c3020 2px 4px),#7a4630;
  box-shadow:1px 0 0 rgba(20,8,4,.7)}
${S} .sbl-slip{writing-mode:vertical-rl;padding:12px 6px;font:700 15px/1 ${FONT.title};letter-spacing:.28em;color:${K.sumi};background:${PAPER};
  background-size:${PAPER_SIZE};box-shadow:0 0 0 1px rgba(20,8,4,.75),0 0 0 3px rgba(212,165,60,.5),0 2px 4px rgba(0,0,0,.5)}
${S} .sbl-dress{font:600 9px/1 ${FONT.title};letter-spacing:.3em;opacity:.8}
${S} .sbl-count{margin-top:auto;font:400 22px/1 'Jersey 15',var(--f-sys);color:#fff1dc;letter-spacing:.04em;text-shadow:0 1px 0 #1c0d08}
${S} .sbl-count small{font-size:13px;opacity:.7}
${S} .sbl-book.full .sbl-count{color:${K.gold}}
${S} .sbl-book[data-dress="nacre"] .sbl-cover{color:#3a2c38;
  background:radial-gradient(ellipse at 28% 18%,rgba(255,255,255,.75),transparent 40%),
    conic-gradient(from 210deg at 40% 45%,#f3eee8,#dbe7f1,#eadcf0,#e1f0e6,#f4e6d6,#e6e2f3,#f3eee8),linear-gradient(160deg,#f0ebe3,#cfc6c9);
  box-shadow:inset 0 1px 0 #fff,inset 0 -3px 0 rgba(90,70,60,.25),0 0 0 1px #4a3a2a,0 0 0 3px ${K.brass},0 8px 16px rgba(0,0,0,.5)}
${S} .sbl-book[data-dress="nacre"] .sbl-cover::before{background:linear-gradient(90deg,#f6dc9a,${K.brass} 50%,#6d5220);box-shadow:1px 0 0 rgba(40,28,10,.6)}
${S} .sbl-book[data-dress="nacre"] .sbl-count{color:#3a2c38;text-shadow:0 1px 0 rgba(255,255,255,.7)}
@media (max-height:520px){
  ${S} .sbl-fold .sb-page{width:132px;height:188px;padding-top:22px}
  ${S} .sbl-fold .sb-page>canvas:not([class]){width:104px;height:104px;-webkit-mask-size:104px 104px;mask-size:104px 104px}
  ${S} .sbl-fold .sb-page b{font-size:11px;letter-spacing:.1em;right:6px;top:12px}
  ${S} .sbl-fold .sb-page s{font-size:9px;bottom:8px}
  ${S} .sbl-fold .sb-page canvas.sbl-date{left:8px;bottom:21px;width:42px;height:34px}
  ${S} .sbl-fold .sb-page canvas.sbl-blind{top:22px;width:104px;height:104px;margin-left:-52px}
  ${S} .sbl-cover{width:92px;min-height:200px;padding:12px 8px 10px 16px}
  ${S} .sbl-slip{font-size:12px;padding:9px 5px}
}
`;

const hash = (s) => { let h = 2166136261; for (const ch of String(s)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967295; };
const make = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const dpr = () => (typeof devicePixelRatio === 'number' ? devicePixelRatio : 1);
/** A canvas the size its CSS gives it, at the device's pixels: its layout size, never its box on screen (the Codex's window unfolds
 *  from a line as it opens, a transform, and a box read then was two pixels tall). */
function sized(c) { const k = dpr(); c.width = Math.max(1, Math.round(c.offsetWidth * k)); c.height = Math.max(1, Math.round(c.offsetHeight * k)); return c.getContext('2d'); }

/** A page's words fitted to it: its name scaled to end above the page's line, the line scaled to the page's width (a transform, so a
 *  browser that inflates text, as a phone's may, is fitted too: font sizes would be inflated again). */
function fitWords(page) {
  const b = page.querySelector(':scope > b'), s = page.querySelector(':scope > s');
  if (b) { b.style.transform = ''; const room = page.clientHeight - b.offsetTop - 30, h = b.offsetHeight; if (h > room && room > 0) { b.style.transformOrigin = '100% 0'; b.style.transform = `scale(${(room / h).toFixed(3)})`; } }
  if (s) { s.style.transform = ''; const room = page.clientWidth - 14, w = s.offsetWidth; if (w > room && room > 0) s.style.transform = `translateX(-50%) scale(${(room / w).toFixed(3)})`; }
}

/** The date brushed in sumi: hours and minutes of play, the minutes a modifier hung under the hours, the ink bleeding into the paper. */
function brushDate(c, secs) {
  const ctx = sized(c); if (!ctx) return;
  const W = c.width, H = c.height, h = Math.floor(secs / 3600), m = Math.floor((secs % 3600) / 60);
  const words = [{ num: h }, { num: m, mod: true }], m1 = runningHand(null, words, { scale: 1 });
  const s = Math.min((W * 0.9) / Math.max(1, m1.width), (H * 0.88) / Math.max(1, m1.height));
  const at = { x: (W - m1.width * s) / 2 - m1.x0 * s, y: (H - (m1.y1 - m1.y0) * s) / 2 - m1.y0 * s, scale: s, ink: K.sumi };
  ctx.save(); ctx.globalAlpha = 0.2; ctx.filter = `blur(${(0.6 * dpr()).toFixed(2)}px)`; runningHand(ctx, words, { ...at, lw: s * 2 }); ctx.restore();
  runningHand(ctx, words, { ...at, lw: s * 1.05 });
}

/** The cradle's number in the Comb and the seal's ring pressed blind where the page's stamp will land (sealbook.js stamp()'s place). */
function blindNumber(c, n) {
  const ctx = sized(c); if (!ctx) return;
  const Sz = c.width, k = dpr(), z = Sz * 0.2;
  const press = (dx, dy, ink, a) => {
    ctx.save(); ctx.globalAlpha = a; ctx.translate(dx * k, dy * k); ctx.strokeStyle = ink; ctx.lineWidth = 1.6 * k;
    ctx.beginPath(); ctx.arc(Sz * 0.5, Sz * 0.3, Sz * 0.22, 0, Math.PI * 2); ctx.stroke();
    if (n != null) { const m = drawCombNumber(null, n, { size: z }); drawCombNumber(ctx, n, { x: Sz * 0.5 + z / 2 - m.width / 2, y: Sz * 0.3 + Math.sqrt(3) * z / 4 - m.height / 2, size: z, ink }); }
    ctx.restore();
  };
  press(1, 1, '#ffffff', 0.85); press(-0.6, -0.6, '#6b4a2c', 0.4); // (the paper lifted where the light falls on the pressed edge, shaded where it does not)
}

/** Dress one drawn shelf: its pages into their islands' books, a date beside each stamp, a blind number on each blank. */
function dress(game, wrap) {
  if (wrap.classList.contains('sbl-on')) return;
  const pages = [...wrap.children].filter((e) => e.classList.contains('sb-page'));
  if (!pages.length) return;
  const L = game?.ledger, books = new Map();
  pages.forEach((el, i) => {
    const name = el.querySelector('b')?.textContent || '';
    let P = SEAL_PAGES[i];
    if (!P || P.name.toUpperCase() !== name) P = SEAL_PAGES.find((q) => q.name.toUpperCase() === name) || { page: null, name, island: (el.querySelector('s')?.textContent || '').split(' · ')[0] || 'Anagami', number: null };
    if (!books.has(P.island)) books.set(P.island, []);
    books.get(P.island).push({ el, P });
  });
  wrap.classList.add('sbl-on');
  const later = [];
  for (const [island, list] of books) {
    const dressId = K.dress[island] || 'clay', got = list.filter((x) => x.el.classList.contains('got')).length;
    const book = make('div', `sbl-book${got === list.length ? ' full' : ''}`); book.dataset.dress = dressId;
    const cover = make('div', 'sbl-cover'), count = make('div', 'sbl-count');
    count.innerHTML = `${got}<small> / ${list.length}</small>`;
    cover.append(make('div', 'sbl-slip', island.toUpperCase()), make('div', 'sbl-dress', K.word[dressId] || dressId.toUpperCase()), count);
    const fold = make('div', 'sbl-fold');
    for (const { el, P } of list) {
      el.style.setProperty('--tilt', `${((hash(P.page || P.name) - 0.5) * 5).toFixed(2)}deg`);
      const t = P.page ? L?.firsts?.[`seal.book.${P.page}`] : null;
      if (el.classList.contains('got') && t != null) {
        const c = make('canvas', 'sbl-date'), h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60);
        c.title = `sealed ${h} h ${String(m).padStart(2, '0')} m into your play`; c.setAttribute('aria-label', c.title);
        el.append(c); later.push(() => brushDate(c, t));
      } else if (!el.classList.contains('got')) {
        const c = make('canvas', 'sbl-blind'); c.setAttribute('aria-hidden', 'true'); el.append(c); later.push(() => blindNumber(c, P.number));
      }
      fold.append(el); later.push(() => fitWords(el));
    }
    book.append(cover, fold); wrap.append(book);
  }
  // (drawn once laid out, so each canvas takes its CSS size at the device's pixels)
  requestAnimationFrame(() => { for (const f of later) f(); });
}

let installed = false;
/** The Seal Book's dress, once: the style, and the shelf dressed each time the Codex draws it. */
export function installSealBookLook(game) {
  if (installed || typeof document === 'undefined') return;
  installed = true;
  const st = document.createElement('style'); st.setAttribute('data-sealbooklook', ''); st.textContent = CSS; document.head.appendChild(st);
  const watch = (root) => new MutationObserver((ms) => { for (const m of ms) for (const n of m.addedNodes) if (n.nodeType === 1 && n.classList.contains('sb-wrap')) dress(game, n); }).observe(root, { childList: true, subtree: true });
  const codex = document.getElementById('codex');
  if (codex) { watch(codex); return; }
  const wait = new MutationObserver(() => { const c = document.getElementById('codex'); if (c) { wait.disconnect(); watch(c); } }); // (the Codex not built yet: watch for it)
  wait.observe(document.body, { childList: true });
}
