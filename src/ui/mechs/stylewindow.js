// ---------------------------------------------------------------------------------------
// THE MECH'S STYLE WINDOW / A STYLE TAB (plain names; South, 2026-11-03: "could you please create a snazzy ingame UI for customization of
// your mech as part of the hangar?"): the mech's style (vfx/mechs/mechstyle.js `game.mechStyle`) chosen on a page of the index window
// set aside to the right (feedback/indexmenu.js showPage aside), the mech in the gantry left in view beside it and wearing each choice
// at once. Opened by the STYLE tile on the assembly page (ui/mechs/assemblylook.js) and by `/mechstyle` alone.
//   THE TABS     by body area (styleoptions.js STYLE_TABS: FRAME, HEAD, SHOULDERS, BODY, HIPS, BACK, WEAPON), glazed tiles on a lacquer
//                rail, the chosen one lifted and ringed gold, its number its key (1 .. 7; Q and E step)
//   A SLOT       its name on a vermilion lacquer band with a gold fascia, its one line, what it wears now; greyed with its one line of
//                why where it does not apply (the harness on the hero, the gunblade with no blade weapon fitted)
//   AN OPTION    a bisque test tile (the assembly page's grammar): its glyph in a glazed well (styleglyphs.js), its plain label and one
//                line; the worn one glazed whole in the window colour, rimmed gold, a gold check in its corner; a choice that rebuilds
//                the frame (the form, the figure, the harness, the cradle mount: ~0.3 to 1.3 real s) shows FIRING while it is built
//   ON WEAR      a gold sweep across the tile and across the free side over the mech
//   THE FOOT     RANDOM (every look but the form), RESET (to MECH_STYLE), BACK to the gantry's page where it was opened from, DONE
//   THE CAMERA   stylecam.js: a front three-quarter, moved to the hovered slot's part, orbited by a drag on the free side
//   KEYS         the arrows move between the options, Enter or Space wears, 1 .. 7 / Q, E the tabs, the wheel or a pinch the distance,
//                Esc or F closes (the index window's); on touch the tiles are 52 px or more
// Looks only: every choice goes through `game.mechStyle.set` (the save is its), the frame's parts are the assembly page's (Dovina's).
//
// Prior art: Armored Core's paint and emblem garage (the mech beside the page, the slot moved to), Gundam Breaker's part-and-paint
// screen (a tab a body area, the frame turned on a pad), Monster Hunter's layered armour (a look per slot over what is worn),
// Medabots' part swap; the house's own: the assembly page's dress (ui/mechs/assemblylook.js), the pier's page set aside.
//
//   installMechStyleWindow(game) -> game.mechStyleWindow { open({ from }), close(), isOpen, tab }   STYLE_WINDOW
// ---------------------------------------------------------------------------------------
import { MECH_STYLE } from '../../vfx/mechs/mechstyle.js';
import { STYLE_TABS, STYLE_SLOTS } from './styleoptions.js';
import { glyphEl } from './styleglyphs.js';
import { StyleCam } from './stylecam.js';

export const STYLE_WINDOW = { page: 'mechstyle', gold: '#ffd36a', ember: '#ff6a3a', sweep: 0.9, cols: 3, rebuilds: ['form', 'figure', 'harness', 'cradle'] };
const W = STYLE_WINDOW, GOLD = W.gold, S = 'body #indexmenu';

const CSS = `
${S}[data-aside] .im:has(.msw){width:min(440px,calc(100% - 24px));max-height:calc(100% - 24px);padding:14px 14px 12px;
  background:radial-gradient(circle,rgba(255,236,214,.05) 0 1px,transparent 1.4px) 0 0/5px 6px,linear-gradient(180deg,#3a1a10,#1e0d07);
  border:0;box-shadow:0 0 0 1px #0d0503,0 0 0 4px #8a2a18,0 0 0 5px ${GOLD},0 0 0 7px #1c0d08,0 18px 50px rgba(0,0,0,.6)}
${S} .im:has(.msw) header h2{color:${GOLD};text-shadow:0 1px 0 #1c0d08,0 0 12px rgba(255,211,106,.35)}
${S} .msw{display:flex;flex-direction:column;gap:8px;font:13px var(--f-sys,system-ui);color:#f2e2c8}
${S} .msw-tabs{display:grid;grid-template-columns:repeat(4,1fr);gap:5px;padding:6px;border-radius:6px;position:sticky;top:-14px;z-index:2;
  background:linear-gradient(180deg,#a8321c,#6a1a0c);box-shadow:inset 0 1px 0 rgba(255,200,170,.35),inset 0 -2px 0 rgba(0,0,0,.4),0 0 0 1px #1c0d08,0 0 0 2px ${GOLD},0 4px 8px rgba(0,0,0,.4)}
${S} .msw-tab{position:relative;min-height:34px;border:0;border-radius:4px 6px 3px 5px;cursor:var(--jcur-pointer,pointer);padding:4px 4px 3px;
  font:700 10px/1.1 var(--f-title,serif);letter-spacing:.12em;color:#2a140c;
  background:radial-gradient(circle,rgba(60,30,14,.16) 0 1px,transparent 1.5px) 0 0/6px 7px,linear-gradient(175deg,#ead8be,#c4a37e);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.4),inset 0 -2px 0 rgba(0,0,0,.25),0 0 0 1px #2a140c}
${S} .msw-tab small{position:absolute;left:3px;top:2px;font:400 11px/1 'Jersey 15',monospace;opacity:.55;letter-spacing:0}
${S} .msw-tab.on{color:#fff3e2;text-shadow:0 1px 0 #1c0d08;transform:translateY(-1px);
  background:radial-gradient(ellipse at 30% -10%,rgba(255,240,220,.35),transparent 55%),linear-gradient(180deg,rgb(var(--jsel,196,106,69)),rgba(var(--jbot,34,15,9),1));
  box-shadow:inset 0 1px 0 rgba(255,240,220,.55),0 0 0 1px #1c0d08,0 0 0 2px ${GOLD},0 0 10px rgba(255,211,106,.4)}
${S} .msw-slot{display:flex;flex-direction:column;gap:6px}
${S} .msw-band{position:relative;padding:6px 10px 5px 12px;border-radius:3px;
  background:linear-gradient(180deg,rgba(255,220,190,.18),transparent 40%),linear-gradient(180deg,#b23a1e,#6e1c0c);
  box-shadow:inset 0 2px 0 ${GOLD},inset 0 -2px 0 #6a4310,inset 3px 0 0 ${GOLD},0 0 0 1px #1c0d08}
${S} .msw-band b{display:block;font:700 12px/1.1 var(--f-title,serif);letter-spacing:.2em;color:#fff1dc;text-shadow:0 1px 0 #1c0d08}
${S} .msw-band span{display:block;font:12px/1.3 var(--f-sys,system-ui);color:#f7d9c0;opacity:.9}
${S} .msw-band em{position:absolute;right:9px;top:6px;font:400 14px/1 'Jersey 15',monospace;font-style:normal;color:${GOLD};letter-spacing:.03em;max-width:46%;text-align:right;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
${S} .msw-why{padding:5px 8px 5px 24px;position:relative;border-radius:4px;font:12px/1.3 var(--f-sys,system-ui);color:#f1dcc4;
  background:rgba(20,9,5,.55);box-shadow:inset 0 0 0 1px rgba(255,211,106,.25)}
${S} .msw-why::before{content:'i';position:absolute;left:7px;top:50%;transform:translateY(-50%);width:12px;height:12px;border-radius:50%;text-align:center;
  font:900 9px/12px var(--f-title,serif);color:#2a140c;background:${GOLD}}
${S} .msw-grp{font:700 9px var(--f-title,serif);letter-spacing:.28em;color:${GOLD};opacity:.85;margin:4px 2px -2px;grid-column:1/-1}
${S} .msw-opts{display:grid;grid-template-columns:repeat(${W.cols},minmax(0,1fr));gap:6px}
${S} .msw-opts.off{opacity:.42;filter:saturate(.3);pointer-events:none}
${S} .msw-opt{position:relative;display:grid;grid-template-columns:40px 1fr;grid-template-rows:auto 1fr;gap:1px 6px;align-items:start;min-height:56px;padding:5px 6px 6px 5px;
  border:0;border-radius:4px 7px 3px 6px;text-align:left;cursor:var(--jcur-pointer,pointer);overflow:hidden;outline:none;color:#2a140c;
  background:radial-gradient(circle,rgba(60,30,14,.16) 0 1px,transparent 1.5px) 0 0/6px 7px,linear-gradient(180deg,rgba(var(--jtop,104,50,32),.35) 0 7px,transparent 7px),linear-gradient(175deg,#ead8be,#c4a37e);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.4),inset 0 -2px 0 rgba(0,0,0,.25),0 0 0 1px #2a140c,0 3px 5px rgba(0,0,0,.35);transition:transform .08s}
${S} .msw-opt canvas{grid-row:1/span 2;width:40px;height:40px;border-radius:4px;background:radial-gradient(ellipse at 35% 25%,rgba(255,240,220,.25),transparent 60%),linear-gradient(180deg,rgba(var(--jsel,196,106,69),.85),rgba(var(--jbot,34,15,9),1));
  box-shadow:inset 0 1px 2px rgba(0,0,0,.55),0 0 0 1px #2a140c}
${S} .msw-opt b{font:700 11px/1.12 var(--f-title,serif);letter-spacing:.04em;padding-right:9px}
${S} .msw-opt span{font:10.5px/1.22 var(--f-sys,system-ui);opacity:.82}
${S} .msw-opt:hover,${S} .msw-opt.sel{transform:translateY(-1px);box-shadow:inset 0 1px 0 rgba(255,255,255,.5),inset 0 -2px 0 rgba(0,0,0,.25),0 0 0 1px #2a140c,0 0 0 3px rgba(var(--jsel,196,106,69),.75),0 4px 8px rgba(0,0,0,.4)}
${S} .msw-opt.on{color:#fff3e2;text-shadow:0 1px 0 #1c0d08;
  background:radial-gradient(ellipse at 30% -10%,rgba(255,240,220,.35),transparent 55%),linear-gradient(180deg,rgb(var(--jsel,196,106,69)),rgba(var(--jbot,34,15,9),1));
  box-shadow:inset 0 1px 0 rgba(255,240,220,.55),inset 0 -2px 0 rgba(0,0,0,.35),0 0 0 1px #1c0d08,0 0 0 3px ${GOLD},0 0 12px rgba(255,211,106,.35)}
${S} .msw-opt.on canvas{box-shadow:inset 0 1px 2px rgba(0,0,0,.55),0 0 0 1px ${GOLD}}
${S} .msw-opt.on::after{content:'';position:absolute;right:4px;top:4px;width:9px;height:9px;background:${GOLD};
  clip-path:polygon(14% 52%,0 66%,38% 100%,100% 22%,86% 8%,38% 70%);filter:drop-shadow(0 1px 0 #1c0d08)}
${S} .msw-opt.firing::before{content:'FIRING';position:absolute;inset:0;display:flex;align-items:center;justify-content:center;z-index:1;
  font:700 11px var(--f-title,serif);letter-spacing:.3em;color:#fff1dc;text-shadow:0 1px 0 #1c0d08;background:linear-gradient(90deg,rgba(255,106,58,.25),rgba(255,211,106,.55),rgba(255,106,58,.25)) 0 0/200% 100%;animation:msw-fire .6s linear infinite}
${S} .msw-opt.worn::before{content:'';position:absolute;inset:0;pointer-events:none;background:linear-gradient(105deg,transparent 30%,rgba(255,236,170,.85) 48%,transparent 66%) no-repeat;background-size:250% 100%;animation:msw-sweep ${W.sweep}s ease-out forwards}
@keyframes msw-fire{to{background-position:-200% 0}}
@keyframes msw-sweep{from{background-position:120% 0}to{background-position:-60% 0}}
${S} .msw-foot{display:flex;gap:6px;flex-wrap:wrap;position:sticky;bottom:-12px;padding:8px 0 2px;background:linear-gradient(0deg,#1e0d07 70%,transparent)}
${S} .msw-btn{flex:1;min-width:76px;min-height:40px;border:0;border-radius:5px 8px 4px 7px;cursor:var(--jcur-pointer,pointer);color:#2a140c;font:700 12px var(--f-title,serif);letter-spacing:.16em;
  background:radial-gradient(circle,rgba(60,30,14,.16) 0 1px,transparent 1.5px) 0 0/6px 7px,linear-gradient(180deg,#f0dcc0,#c9a882);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.45),inset 0 -3px 0 rgba(0,0,0,.25),0 0 0 1px #2a140c,0 4px 8px rgba(0,0,0,.4)}
${S} .msw-btn.done{color:#fff1dc;text-shadow:0 1px 0 #1c0d08;background:linear-gradient(180deg,#b23a1e,#6e1c0c);box-shadow:inset 0 1px 0 rgba(255,220,190,.4),inset 0 -3px 0 rgba(0,0,0,.35),0 0 0 1px #1c0d08,0 0 0 3px ${GOLD},0 4px 8px rgba(0,0,0,.4)}
${S} .msw-hint{font:11px/1.3 var(--f-sys,system-ui);color:#e6cfb2;opacity:.7}
#msw-sweep{position:fixed;top:0;bottom:0;left:0;z-index:8;pointer-events:none;width:30vw;opacity:0;
  background:linear-gradient(100deg,transparent,rgba(255,211,106,.0) 30%,rgba(255,226,150,.32) 50%,rgba(255,211,106,0) 70%,transparent);mix-blend-mode:screen}
#msw-sweep.go{animation:msw-pass ${W.sweep * 1.3}s ease-out forwards}
@keyframes msw-pass{0%{opacity:1;transform:translateX(-30vw)}100%{opacity:.6;transform:translateX(var(--msw-free,70vw))}}
html body.hud-touch #indexmenu .msw-tab{min-height:44px;font-size:11px}
html body.hud-touch #indexmenu .msw-opts{grid-template-columns:repeat(2,minmax(0,1fr))}
html body.hud-touch #indexmenu .msw-opt{min-height:60px;grid-template-columns:44px 1fr}
html body.hud-touch #indexmenu .msw-opt canvas{width:44px;height:44px}
html body.hud-touch #indexmenu .msw-opt span{font-size:11px}
html body.hud-touch #indexmenu .msw-btn{min-height:48px}
html body.hud-touch #indexmenu .msw-hint{display:none}
`;

const ID = (id) => (id == null ? 'none' : String(id));

export class MechStyleWindow {
  constructor(game) {
    this.game = game; this.tab = 'frame'; this.sel = 0; this.from = null; this.isOpen = false; this.busy = false; this.cam = new StyleCam(game);
    this.keyFn = (e) => this.key(e); this.lastMs = 0;
  }
  get menu() { return this.game.indexMenu || this.game.course?.menu; }
  get style() { return this.game.mechStyle; }
  get mine() { const m = this.menu; return !!(m?.open && m.page?.name === W.page); }
  ctx() {
    const L = this.style, sel = this.game.hangar?.state?.sel;
    return { form: L?.form || 'hero', blade: sel ? sel.weaponL === 'greatBlade' || sel.weaponR === 'greatBlade' : null };
  }

  /** The window open (from: 'gantry' where the assembly page opened it, so BACK returns there). */
  open({ from = null } = {}) {
    if (!this.menu?.showPage || !this.style) return false;
    if (!this.styled) { const s = document.createElement('style'); s.id = 'mech-style-window'; s.textContent = CSS; document.head.appendChild(s); this.styled = true; this.sweepEl = document.createElement('div'); this.sweepEl.id = 'msw-sweep'; document.body.appendChild(this.sweepEl); }
    this.from = from; this.sel = 0; this.cam.focus(this.focusOf(this.tab));
    this.draw();
    if (!this.isOpen) { this.isOpen = true; addEventListener('keydown', this.keyFn, true); this.bindPad(); this.loop(); }
    return true;
  }
  close() { if (this.mine) this.menu.close(); }
  /** The page shut (by Esc, F, CLOSE or another page): the keys let go, the camera handed back. */
  shut() {
    this.isOpen = false; removeEventListener('keydown', this.keyFn, true); this.unbindPad(); this.cam.release();
  }
  loop() {
    let last = performance.now();
    const step = (now) => {
      if (!this.isOpen) return;
      if (!this.mine) { this.shut(); return; }
      const dt = Math.min(0.1, (now - last) / 1000); last = now;
      this.update(dt);
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  /** One display frame while open: the camera (the frame is paused under the index window). Callable by a headless driver. */
  update(dt) { const im = this.menu?.root?.querySelector('.im'); this.cam.update(dt, im ? im.getBoundingClientRect().width + 12 : 0); }
  focusOf(tab) { const T = STYLE_TABS.find((t) => t.id === tab); return STYLE_SLOTS[T?.slots[0]]?.focus || 'whole'; }

  // ------------------------------------------------------------------ the page
  draw() {
    const was = this.menu?.root?.querySelector('.im'), y = this.mine && was ? was.scrollTop : 0;
    const device = this.game.input?.device;
    this.menu.showPage(W.page, (im, el) => this.page(im, el), { title: "THE MECH'S STYLE", sub: device === 'touch' ? 'tap a look · drag the view' : 'click a look · drag the view · F closes', aside: 'right' });
    const im = this.menu.root.querySelector('.im'); if (im) im.scrollTop = y;
    this.mark();
  }
  page(im, el) {
    const L = this.style, c = this.ctx(), root = el('div', 'msw'); im.appendChild(root);
    const tabs = el('div', 'msw-tabs'); root.appendChild(tabs);
    STYLE_TABS.forEach((T, i) => {
      const b = el('button', `msw-tab${T.id === this.tab ? ' on' : ''}`); b.append(el('small', '', String(i + 1)), document.createTextNode(T.label));
      b.onclick = (e) => { e.stopPropagation(); this.toTab(T.id); }; b.onmouseenter = () => this.cam.focus(this.focusOf(T.id)); tabs.appendChild(b);
    });
    this.tiles = [];
    const T = STYLE_TABS.find((t) => t.id === this.tab);
    for (const slot of T.slots) {
      const D = STYLE_SLOTS[slot], why = D.off?.(c) ?? null, opts = D.options(c), worn = opts.find((o) => ID(o.id) === ID(L[slot]));
      const box = el('div', 'msw-slot'); root.appendChild(box);
      const band = el('div', 'msw-band'); band.append(el('b', '', D.label), el('span', '', D.line), el('em', '', worn ? worn.label : '')); box.appendChild(band);
      if (why) box.appendChild(el('div', 'msw-why', why));
      const grid = el('div', `msw-opts${why ? ' off' : ''}`); box.appendChild(grid);
      let grp;
      for (const o of opts) {
        if (o.group !== undefined && o.group !== grp) { grp = o.group; if (grp) grid.appendChild(el('div', 'msw-grp', grp)); }
        const b = el('button', `msw-opt${ID(o.id) === ID(L[slot]) ? ' on' : ''}`); b.dataset.slot = slot; b.dataset.id = ID(o.id);
        b.append(glyphEl(o.glyph), el('b', '', o.label), el('span', '', o.line)); b.title = `${o.label}: ${o.line}`;
        b.onclick = (e) => { e.stopPropagation(); this.wear(slot, o.id, b); };
        b.onmouseenter = () => { this.cam.focus(D.focus); };
        grid.appendChild(b); if (!why) this.tiles.push({ el: b, slot, id: o.id });
      }
    }
    const foot = el('div', 'msw-foot'); root.appendChild(foot);
    const btn = (t, run, cls = '') => { const b = el('button', `msw-btn ${cls}`, t); b.onclick = (e) => { e.stopPropagation(); run(); }; foot.appendChild(b); };
    btn('RANDOM', () => this.random()); btn('RESET', () => this.reset());
    if (this.from === 'gantry') btn('BACK', () => this.game.hangar?.assembly?.show?.());
    btn('DONE', () => this.close(), 'done');
    if (!this.cam.can()) root.appendChild(el('div', 'msw-why', 'The mech is not standing in its gantry: your choices are kept and worn when it is.'));
    root.appendChild(el('div', 'msw-hint', 'Arrows move · Enter wears · 1-7 or Q / E the tabs · drag or wheel the view'));
  }
  /** The keyboard's place, lit. */
  mark() { this.tiles?.forEach((t, i) => t.el.classList.toggle('sel', i === this.sel)); }
  toTab(id) { if (id === this.tab) return; this.tab = id; this.sel = 0; this.cam.focus(this.focusOf(id)); this.draw(); const im = this.menu.root.querySelector('.im'); if (im) im.scrollTop = 0; }

  // ------------------------------------------------------------------ wearing
  /** One look worn, through the style (its save, its wear); a choice that rebuilds the frame shows FIRING while it builds. */
  wear(slot, id, tile = null) {
    if (this.busy || ID(this.style[slot]) === ID(id)) return;
    this.cam.focus(STYLE_SLOTS[slot].focus);
    const slow = W.rebuilds.includes(slot) && !!this.game.hangar?.pilot?.mech;
    const go = () => {
      const t0 = performance.now();
      this.style.set(slot, id ?? 'none');
      this.settle(); this.lastMs = performance.now() - t0; this.busy = false;
      this.draw(); this.flash(slot, id);
    };
    if (slow && tile) { this.busy = true; tile.classList.add('firing'); requestAnimationFrame(() => requestAnimationFrame(go)); } // (the tile painted FIRING before the build holds the thread)
    else go();
  }
  /** Several looks at once (RANDOM, RESET): laid on the style together, worn in one pass (the form first, one rebuild at most a kind). */
  wearAll(picks) {
    const L = this.style; if (this.busy) return;
    const slots = Object.keys(picks).filter((k) => ID(L[k]) !== ID(picks[k])); if (!slots.length) return;
    this.busy = true;
    const go = () => {
      const t0 = performance.now();
      for (const k of slots) if (k !== slots[slots.length - 1]) L[k] = picks[k];
      const lastK = slots[slots.length - 1]; L.set(lastK, picks[lastK] ?? 'none'); // (set: the save marked, the body worn once, the event said)
      this.settle(); this.lastMs = performance.now() - t0; this.busy = false; this.draw(); this.flash(null);
    };
    requestAnimationFrame(() => requestAnimationFrame(go));
  }
  random() {
    const c = this.ctx(), pick = (slot) => { const o = STYLE_SLOTS[slot].options(c); return o[Math.floor(Math.random() * o.length)].id; };
    const out = {}; for (const s of Object.keys(MECH_STYLE)) if (s !== 'form') out[s] = pick(s);
    this.wearAll(out);
  }
  reset() { this.wearAll({ ...MECH_STYLE }); }
  /** The frame back where the gantry holds it after a rebuild (its seat at the walkway, the cradle placed), the frame being paused. */
  settle() {
    const H = this.game.hangar, P = H?.pilot; if (!H?.built || !P?.mech || P.mode !== 'gantry' || this.game.cradles?.sealed) return;
    P.toGantry?.(); if (H.cradle) P.placeCradle?.(H.cradle);
  }
  /** The gold sweep: across the tile worn and across the free side over the mech. */
  flash(slot, id) {
    const t = slot ? this.menu.root.querySelector(`.msw-opt[data-slot="${slot}"][data-id="${ID(id)}"]`) : null;
    if (t) t.classList.add('worn');
    const s = this.sweepEl, im = this.menu.root.querySelector('.im'); if (!s) return;
    const free = Math.max(0, innerWidth - (im ? im.getBoundingClientRect().width + 24 : 0));
    s.style.setProperty('--msw-free', `${free}px`); s.classList.remove('go'); void s.offsetWidth; s.classList.add('go');
  }

  // ------------------------------------------------------------------ the keys and the pad
  key(e) {
    if (!this.mine) return;
    const tag = e.target?.tagName; if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    const n = this.tiles?.length || 0, i = STYLE_TABS.findIndex((t) => t.id === this.tab), cols = this.game.input?.device === 'touch' ? 2 : W.cols;
    const move = (d) => { if (!n) return; this.sel = Math.max(0, Math.min(n - 1, this.sel + d)); this.mark(); const t = this.tiles[this.sel]; t.el.scrollIntoView?.({ block: 'nearest' }); this.cam.focus(STYLE_SLOTS[t.slot].focus); };
    let used = true;
    if (e.code === 'ArrowRight') move(1); else if (e.code === 'ArrowLeft') move(-1);
    else if (e.code === 'ArrowDown') move(cols); else if (e.code === 'ArrowUp') move(-cols);
    else if (e.code === 'Enter' || e.code === 'Space') { const t = this.tiles?.[this.sel]; if (t) this.wear(t.slot, t.id, t.el); }
    else if (e.code === 'KeyQ') this.toTab(STYLE_TABS[(i + STYLE_TABS.length - 1) % STYLE_TABS.length].id);
    else if (e.code === 'KeyE') this.toTab(STYLE_TABS[(i + 1) % STYLE_TABS.length].id);
    else if (/^Digit[1-7]$/.test(e.code)) this.toTab(STYLE_TABS[+e.code.slice(5) - 1].id);
    else used = false;
    if (used) { e.preventDefault(); e.stopPropagation(); this.game.input?.spend?.(e.code); }
  }
  /** A drag on the free side turns the view; the wheel or a pinch its distance; a click there does not close the page. */
  bindPad() {
    const R = this.menu.root; if (!R || this.pad) return;
    const free = (e) => e.target === R;
    const pts = new Map();
    const down = (e) => { if (!free(e)) return; pts.set(e.pointerId, { x: e.clientX, y: e.clientY }); this.dragged = false; R.setPointerCapture?.(e.pointerId); };
    const move = (e) => {
      const p = pts.get(e.pointerId); if (!p) return;
      if (pts.size >= 2) { const [a, b] = [...pts.values()], d0 = Math.hypot(a.x - b.x, a.y - b.y); p.x = e.clientX; p.y = e.clientY; const d1 = Math.hypot(a.x - b.x, a.y - b.y); if (d0 > 8 && d1 > 8) this.cam.zoom(d0 / d1); this.dragged = true; return; }
      const dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY;
      if (Math.abs(dx) + Math.abs(dy) > 0) { this.cam.drag(dx, dy); this.dragged = true; }
    };
    const up = (e) => { pts.delete(e.pointerId); };
    const click = (e) => { if (free(e) && this.mine) { e.stopImmediatePropagation(); e.preventDefault(); } }; // (the free side is the view's pad: a tap there never closes the page)
    const wheel = (e) => { if (!this.mine || !free(e)) return; this.cam.zoom(Math.exp(e.deltaY * 0.0012)); e.preventDefault(); };
    R.addEventListener('pointerdown', down); R.addEventListener('pointermove', move); R.addEventListener('pointerup', up); R.addEventListener('pointercancel', up);
    R.addEventListener('click', click, true); R.addEventListener('wheel', wheel, { passive: false });
    this.pad = () => { R.removeEventListener('pointerdown', down); R.removeEventListener('pointermove', move); R.removeEventListener('pointerup', up); R.removeEventListener('pointercancel', up); R.removeEventListener('click', click, true); R.removeEventListener('wheel', wheel); };
  }
  unbindPad() { this.pad?.(); this.pad = null; }
}

export function installMechStyleWindow(game) {
  if (game.mechStyleWindow || typeof document === 'undefined') return game.mechStyleWindow;
  game.mechStyleWindow = new MechStyleWindow(game);
  return game.mechStyleWindow;
}
