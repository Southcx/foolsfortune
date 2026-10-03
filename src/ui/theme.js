// ---------------------------------------------------------------------------------------
// THE WINDOWS: one look for every menu, after the sixth-generation JRPGs the game takes its manners from. A window is a framed box
// with a gradient fill (the player picks its colour, as Final Fantasy's config always let you), a bevelled double rule round it and a
// gem at each corner; a white glove points at the thing under the mouse (or the keyboard's choice) and bobs; a window opens by
// unfolding from a line in a tenth of a second; moving, confirming and backing out each have their own small sound.
//
// The letters: four faces, each with one job (all SIL Open Font Licence, bundled, see the README's credits):
//   - M PLUS Rounded 1c: the windows' own text. The rounded gothic of the era's Japanese menus (the FOT-Seurat / Rodin look of
//     Kingdom Hearts, Wind Waker and Dark Cloud 2), legible small and large.
//   - Cinzel: titles and tabs. Roman capitals with small-cap lower case, the face of Ivalice and of every tarot deck.
//   - IM Fell English (italic): lore and hints, the Veritome's handwriting: a seventeenth-century book face.
//   - DotGothic16: the System. The log and the HUD's numbers speak in a dot font on its 8 x 16 cell (.hack's fake desktop, the PS2's
//     debug and memory-card screens), drawn at its own size so it stays crisp.
//
// Prior art: Final Fantasy's window (the blue gradient, the bevel, the glove, the Config colour sliders), Rogue Galaxy's and Dark Cloud
// 2's framed menus (Level-5: rounded frames, gems at the corners, a short unfold), Phantasy Star Online's and .hack's system fonts,
// Tales' instant cursor sounds; the trope compendium's UI tab (nine-slice 8-px corners, cursor the same frame, confirm <= 50 ms,
// open/close <= 150 ms, a Lachryma sheen for selection).
//
//   installTheme(game)            once, before the menus are built: fonts, the kit's CSS, the glove, the sounds
//   theme.set('midnight')         the window colour (kept in the browser);  THEMES lists them
//   theme.watch(root)             a menu's root: its 'open' class unfolds its window and plays the open / back sounds
// ---------------------------------------------------------------------------------------
import { sfx } from '../audio.js';
import fUi from '../assets/fonts/mplusround500.woff2?b64';
import fUiBold from '../assets/fonts/mplusround800.woff2?b64';
import fTitle from '../assets/fonts/cinzel.woff2?b64';
import fDeco from '../assets/fonts/cinzeldeco.woff2?b64';
import fLore from '../assets/fonts/fellitalic.woff2?b64';
import fSys from '../assets/fonts/dotgothic16.woff2?b64';
import gPoint from '../assets/ui/glove_point.png?b64';
import gCursor from '../assets/ui/glove_cursor.png?b64';
import gGrab from '../assets/ui/glove_grab.png?b64';

export const FONT = {
  ui: `'M PLUS Rounded 1c', 'Hiragino Maru Gothic ProN', 'Arial Rounded MT Bold', system-ui, sans-serif`,
  title: `'Cinzel', 'Trajan Pro', Georgia, serif`,
  deco: `'Cinzel Decorative', 'Cinzel', Georgia, serif`,
  lore: `'IM Fell English', Georgia, 'Times New Roman', serif`,
  sys: `'DotGothic16', ui-monospace, monospace`,
};

// the window colours: the fill's top and bottom, the frame's light, middle and dark, and the selection's tint
export const THEMES = {
  kiln: { name: 'KILN', top: '104,50,32', bot: '34,15,9', hi: '#f1d2b0', mid: '#b3735a', lo: '#1c0d08', sel: '196,106,69' },
  oxblood: { name: 'OXBLOOD', top: '118,30,34', bot: '36,7,11', hi: '#f3d3ae', mid: '#a5534a', lo: '#160506', sel: '200,70,70' },
  midnight: { name: 'MIDNIGHT', top: '46,62,150', bot: '9,13,48', hi: '#eef1ff', mid: '#8796d6', lo: '#05071c', sel: '110,130,230' },
  verdigris: { name: 'VERDIGRIS', top: '32,96,88', bot: '7,28,28', hi: '#e2f3e6', mid: '#6fa596', lo: '#031210', sel: '80,170,150' },
  umber: { name: 'UMBER', top: '70,60,52', bot: '18,15,13', hi: '#efe4d2', mid: '#9c8a74', lo: '#0c0a08', sel: '170,140,100' },
};
const KEY = 'foolsfortune.windows.v1';

// the corner gem: a chip of Lachryma, its thin-film colours across it and a glint
const gem = (cx, cy, lo) => `<path d="M${cx} ${cy - 5}L${cx + 5} ${cy}L${cx} ${cy + 5}L${cx - 5} ${cy}Z" fill="url(#g)" stroke="${lo}" stroke-width="1.2"/>`
  + `<rect x="${cx - 1.6}" y="${cy - 2.6}" width="1.4" height="1.4" fill="#fff" opacity=".85"/>`;
/** The nine-slice frame for a theme, as an SVG data URL: 40 x 40, sliced at 14. */
function frameSVG(t) {
  const s = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
<defs><linearGradient id="b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${t.hi}"/><stop offset="1" stop-color="${t.mid}"/></linearGradient>
<linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9ff7ea"/><stop offset=".4" stop-color="#9a6cff"/><stop offset=".7" stop-color="#ff8fc8"/><stop offset="1" stop-color="#ffd27a"/></linearGradient></defs>
<rect x=".5" y=".5" width="39" height="39" rx="8" fill="none" stroke="${t.lo}" stroke-width="1"/>
<rect x="2.5" y="2.5" width="35" height="35" rx="6.5" fill="none" stroke="url(#b)" stroke-width="3"/>
<rect x="4.5" y="4.5" width="31" height="31" rx="4.5" fill="none" stroke="${t.lo}" stroke-width="1"/>
<rect x="6" y="6" width="28" height="28" rx="3.5" fill="none" stroke="${t.hi}" stroke-opacity=".28" stroke-width="1"/>
${gem(5, 5, t.lo)}${gem(35, 5, t.lo)}${gem(5, 35, t.lo)}${gem(35, 35, t.lo)}</svg>`;
  return `url("data:image/svg+xml;utf8,${encodeURIComponent(s)}")`;
}

// the gloves (drawn by the game's maker, 48 x 48): pointing (the menu's cursor, beside the option), the mouse's own pointer over a
// window (its fingertip at 14, 11), and the fist while a button is held or a thing is dragged
export const GLOVES = {
  point: `data:image/png;base64,${gPoint}`,
  cursor: `data:image/png;base64,${gCursor}`,
  grab: `data:image/png;base64,${gGrab}`,
};
/** The pointing glove as a data URL; (down) turned a quarter to point at the thing below it (needs the image decoded: see install). */
export function gloveURL(down = false) { return down ? (theme.gloveDown || GLOVES.point) : GLOVES.point; }

// the windows the kit dresses (the menus build their own boxes; these selectors find them): [panel, its root]
export const WINDOWS = ['#codex .cx', '#indexmenu .im', '#pneuka .px', '#shop .px', '#pneuka .menu', '#overlay .card', '#mapui .side', '#mapui .legend', '#chatlog', '#dialogue .dw'];
const W = (suffix = '') => WINDOWS.map((s) => `html body ${s}${suffix}`).join(',\n');

const CSS = () => `
@font-face { font-family: 'M PLUS Rounded 1c'; font-weight: 400 600; src: url(data:font/woff2;base64,${fUi}) format('woff2'); }
@font-face { font-family: 'M PLUS Rounded 1c'; font-weight: 700 900; src: url(data:font/woff2;base64,${fUiBold}) format('woff2'); }
@font-face { font-family: 'Cinzel'; font-weight: 400 900; src: url(data:font/woff2;base64,${fTitle}) format('woff2'); }
@font-face { font-family: 'Cinzel Decorative'; font-weight: 400 900; src: url(data:font/woff2;base64,${fDeco}) format('woff2'); }
@font-face { font-family: 'IM Fell English'; font-style: italic; src: url(data:font/woff2;base64,${fLore}) format('woff2'); }
@font-face { font-family: 'IM Fell English'; font-style: normal; src: url(data:font/woff2;base64,${fLore}) format('woff2'); }
@font-face { font-family: 'DotGothic16'; src: url(data:font/woff2;base64,${fSys}) format('woff2'); }
:root { --f-ui: ${FONT.ui}; --f-title: ${FONT.title}; --f-deco: ${FONT.deco}; --f-lore: ${FONT.lore}; --f-sys: ${FONT.sys}; }
html body { font-family: var(--f-ui); font-weight: 500; }
html body button, html body textarea, html body input { font-family: inherit; }

/* the window: a gradient fill under a nine-slice frame */
${W()} { border-style: solid; border-width: 14px; border-color: transparent; border-image: var(--jframe) 14 / 14px / 0 stretch; border-radius: 9px;
  background: linear-gradient(180deg, rgba(var(--jtop), .96), rgba(var(--jbot), .97)) border-box; background-clip: border-box;
  box-shadow: 0 10px 30px rgba(0,0,0,.55); text-shadow: 1px 1px 0 rgba(8,3,1,.75); }
html body #chatlog { background: linear-gradient(180deg, rgba(var(--jtop), .74), rgba(var(--jbot), .86)) border-box; box-shadow: 0 4px 14px rgba(0,0,0,.35); }
html body #pneuka .menu { border-width: 11px; border-image: var(--jframe) 14 / 11px / 0 stretch; }
${W(' h1')}, ${W(' h2')}, ${W(' h3')}, ${W(' h4')}, html body #codex .shelf, html body #indexmenu .grp, html body #codex .tab, html body #codex .row .t b,
html body #indexmenu .room b, html body #codex .card h3, html body #mapui h2 { font-family: var(--f-title); font-weight: 600; }
html body #codex h2, html body #indexmenu h2, html body #pneuka h2, html body #mapui h2 { font-size: 22px; letter-spacing: .2em; }
${W(' .hint')}, ${W(' .lore')}, ${W(' .card p em')} { font-family: var(--f-lore); font-style: italic; font-size: 1.12em; letter-spacing: .01em; }
/* the unfolding: from a line to the window, in a tenth of a second */
@keyframes junfold { from { transform: scaleY(.04); opacity: .6; } 60% { transform: scaleY(1.02); opacity: 1; } to { transform: none; } }
.junfold :is(${WINDOWS.join(',')}) { animation: junfold .11s cubic-bezier(.2,.8,.3,1) both; }
/* the glove */
#jglove { position: fixed; left: 0; top: 0; width: 48px; height: 48px; z-index: 40; pointer-events: none; display: none; image-rendering: pixelated;
  background-size: 48px 48px; filter: drop-shadow(1px 2px 0 rgba(8,3,1,.45)); }
/* the mouse's own glove over the windows (the menus' clickable things say var(--jcur-pointer)), and the fist while held */
:root { --jcur: url(${GLOVES.cursor}) 14 11, default; --jcur-pointer: url(${GLOVES.cursor}) 14 11, pointer; --jcur-grab: url(${GLOVES.grab}) 17 14, grabbing; }
${W()}, #overlay, #codex, #pneuka, #indexmenu { cursor: var(--jcur); }
html.jgrab, html.jgrab * { cursor: var(--jcur-grab) !important; }
#jglove.on { display: block; }
`;

class Theme {
  constructor() {
    this.id = 'kiln';
    try { const s = JSON.parse(localStorage.getItem(KEY) || '{}'); if (THEMES[s.id]) this.id = s.id; } catch { /* the default */ }
    this.target = null; this.mouse = { x: -1, y: -1 }; this.kb = false; this.raf = 0;
  }
  install() {
    const st = document.createElement('style'); st.id = 'jtheme'; st.textContent = CSS(); document.head.appendChild(st);
    this.glove = document.createElement('div'); this.glove.id = 'jglove'; this.glove.style.backgroundImage = `url(${GLOVES.point})`;
    // the glove turned to point down (the HUD's palette), made once the picture is decoded
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas'); c.width = c.height = 48; const x = c.getContext('2d');
      x.translate(48, 0); x.rotate(Math.PI / 2); x.drawImage(img, 0, 0);
      this.gloveDown = c.toDataURL(); document.documentElement.style.setProperty('--jglove-down', `url(${this.gloveDown})`);
    };
    img.src = GLOVES.point;
    // the fist: while a button is held over a window
    addEventListener('pointerdown', (e) => { if (e.target instanceof Element && e.target.closest(`${WINDOWS.join(',')}, #overlay`)) document.documentElement.classList.add('jgrab'); }, true);
    addEventListener('pointerup', () => document.documentElement.classList.remove('jgrab'), true);
    addEventListener('dragend', () => document.documentElement.classList.remove('jgrab'), true);
    document.body.appendChild(this.glove);
    this.apply();
    // the glove follows the mouse to the thing it would click, and the keyboard to the thing it chose
    addEventListener('pointermove', (e) => { this.mouse.x = e.clientX; this.mouse.y = e.clientY; this.kb = false; if (!document.documentElement.classList.contains('jgrab')) this.aim(this.optionAt(e.target), true); }, { passive: true });
    addEventListener('keydown', (e) => { if (/^Arrow|^Tab$/.test(e.code)) { this.kb = true; requestAnimationFrame(() => this.aim(this.chosen(), true)); } }, true);
    addEventListener('click', (e) => { const o = this.optionAt(e.target); if (o && !o.matches(':disabled')) sfx.menuOk?.(); }, true);
  }
  /** The window colour: one of THEMES, kept in the browser. */
  set(id) {
    if (!THEMES[id]) return;
    this.id = id; this.apply();
    try { localStorage.setItem(KEY, JSON.stringify({ id })); } catch { /* this session only */ }
  }
  next() { const ids = Object.keys(THEMES); this.set(ids[(ids.indexOf(this.id) + 1) % ids.length]); return this.id; }
  get name() { return THEMES[this.id].name; }
  apply() {
    const t = THEMES[this.id], r = document.documentElement.style;
    r.setProperty('--jtop', t.top); r.setProperty('--jbot', t.bot); r.setProperty('--jsel', t.sel); r.setProperty('--jhi', t.hi); r.setProperty('--jmid', t.mid); r.setProperty('--jframe', frameSVG(t));
  }

  /** A menu's root: when it gains 'open' its window unfolds (and the open sound plays); when it loses it, the back sound. */
  watch(root, { sound = true, point = null } = {}) {
    if (!root) return;
    const isOpen = () => root.classList.contains('open') || (root.id === 'overlay' && root.style.display !== 'none');
    let was = isOpen();
    new MutationObserver(() => {
      const now = isOpen();
      if (now === was) return;
      was = now;
      if (now) {
        root.classList.remove('junfold'); void root.offsetWidth; root.classList.add('junfold');
        clearTimeout(root._junfold); root._junfold = setTimeout(() => root.classList.remove('junfold'), 160);
        if (sound) sfx.menuOpen?.();
        if (point) requestAnimationFrame(() => this.aim(root.querySelector(point)));
      } else { if (sound) sfx.menuBack?.(); this.aim(null); }
    }).observe(root, { attributes: true, attributeFilter: ['class', 'style'] });
  }

  /** The option an element belongs to: the outermost clickable thing round it, inside a window. */
  optionAt(e) {
    if (!(e instanceof Element) || !e.closest(WINDOWS.join(','))) return null;
    let o = null;
    for (let x = e; x && x !== document.body; x = x.parentElement) {
      if (x.matches(WINDOWS.join(','))) break;
      const cs = getComputedStyle(x);
      if (/pointer$/.test(cs.cursor) && x.tagName !== 'TEXTAREA') o = x; else if (o) break;
    }
    return o;
  }
  /** What the keyboard has chosen in the open window. */
  chosen() { return document.querySelector('.open .sel, .open .on.room'); }

  aim(o, sound = false) {
    if (o === this.target) return;
    this.target = o;
    if (o && sound && !o.matches(':disabled')) sfx.menuMove?.();
    // (placed before it is shown: shown first, it would sit a frame at the corner of the page)
    if (!o) { this.glove.classList.remove('on'); return; }
    if (this.raf) cancelAnimationFrame(this.raf);
    this.follow(performance.now());
  }
  follow = (now) => {
    this.raf = 0;
    let o = this.target;
    if (o && !o.isConnected) { // (the menu drew itself again under the mouse: point at what is there now)
      const at = this.kb ? this.chosen() : document.elementFromPoint(this.mouse.x, this.mouse.y);
      o = this.target = this.kb ? at : this.optionAt(at);
    }
    const r = o?.offsetParent ? o.getBoundingClientRect() : null;
    // (nothing to point at, or a thing with no size on the page (a folded window's option): no glove, rather than one at the corner)
    if (!r || r.width < 1 || r.height < 1 || getComputedStyle(o).visibility === 'hidden') { this.glove.classList.remove('on'); this.target = null; return; }
    const bob = Math.floor(now / 250) % 2 ? 2 : 0; // (a stepped bob, four times a second, as the glove always has)
    const tip = this.tip || [42, 14]; // (where its fingertip is on the picture: the 48 px glove's, or the pixel glove's at its scale)
    const x = Math.max(2, Math.round(r.left - tip[0] - 4 - bob)), y = Math.round(r.top + Math.min(r.height, 40) / 2 - tip[1]);
    this.glove.style.transform = `translate(${x}px, ${y}px)`;
    this.glove.classList.add('on');
    this.raf = requestAnimationFrame(this.follow);
  };
}

/** The maker's pixel gloves (ui/pixel.js), at their NATIVE size (one art pixel to one pixel of the page: a cursor is a cursor, and is
 *  not scaled with the rest of the art), in place of the 48 px ones: the mouse's pointer and fist over the windows, the menu's
 *  pointing glove beside the chosen option (the maker's left-pointing glove, turned round to point right, at the option), and the
 *  same turned to point down (the dialogue's "more", the shells' hand). */
Theme.prototype.pixelGloves = function (px) {
  const root = document.documentElement.style;
  root.setProperty('--jcur', px.cursor('glove_point', 'clay', 6, 1, 'default', 1));
  root.setProperty('--jcur-pointer', px.cursor('glove_point', 'clay', 6, 1, 'pointer', 1));
  root.setProperty('--jcur-grab', px.cursor('glove_grab', 'clay', 15, 13, 'grabbing', 1));
  const src = px.art('glove_left', 'clay'), w = src.width, h = src.height;
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.translate(w, 0); g.scale(-1, 1); g.drawImage(src, 0, 0);
  this.glove.style.backgroundImage = `url(${c.toDataURL()})`; this.glove.style.width = `${w}px`; this.glove.style.height = `${h}px`; this.glove.style.backgroundSize = `${w}px ${h}px`;
  this.tip = [w - 2, 6]; // (its fingertip, turned round)
  const d = document.createElement('canvas'); d.width = h; d.height = w;
  const x = d.getContext('2d'); x.imageSmoothingEnabled = false; x.translate(h, 0); x.rotate(Math.PI / 2); x.drawImage(c, 0, 0);
  this.gloveDown = d.toDataURL(); root.setProperty('--jglove-down', `url(${this.gloveDown})`);
};

export const theme = new Theme();
export function installTheme() { theme.install(); return theme; }
/** Resolves when the faces are ready to draw with (the signs in the world are painted onto canvases once, at build). */
export function fontsReady() {
  if (!document.fonts?.load) return Promise.resolve();
  const want = ['500 16px "M PLUS Rounded 1c"', '800 16px "M PLUS Rounded 1c"', '600 16px Cinzel', '700 16px "Cinzel Decorative"', 'italic 16px "IM Fell English"', '16px DotGothic16'];
  return Promise.race([Promise.all(want.map((f) => document.fonts.load(f))), new Promise((r) => setTimeout(r, 1500))]).catch(() => {});
}
