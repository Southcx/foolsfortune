// ---------------------------------------------------------------------------
// The System's face: the Codex (B). What is learned is announced in the log (tracking.js), not here. The Codex sorts what you can
// learn into arts; for now there is one shelf, MOVEMENT ARTS: the ones you know, the shapes
// of the ones you don't (a hint, and a bar that only fills as you get closer), and which
// variant is selected. The all-arts switch lends you everything. The Codex pauses the game while it's
// open. Fired-clay tablets, the same ink as the rest of the HUD.
// ---------------------------------------------------------------------------
import { ABILITIES, GOD_ARTS, BY_ID } from '../../progress/skills.js';
import { renderLedger, renderRecords, renderAngling, renderCurios } from './ledger.js';
import { renderVeritome } from '../../tools/veritome/ui.js';
import { renderTools } from '../../tools/codexpage.js';
import { renderSoundTest } from '../../music/soundtest.js';


const CSS = `
#codex { position: fixed; inset: 0; z-index: 9; display: none; align-items: center; justify-content: center; background: rgba(20,9,6,.78); cursor: default; user-select: none; }
#codex.open { display: flex; }
#codex .cx { width: min(980px, calc(100% - 24px)); max-height: calc(100% - 24px); overflow: auto; box-sizing: border-box; background: #2a140d; border: 1px solid rgba(255,178,122,.5);
  box-shadow: 0 0 0 4px rgba(28,13,8,.7), 0 20px 60px rgba(0,0,0,.6); padding: 18px 22px 16px; }
#codex header { display: flex; align-items: baseline; gap: 14px; flex-wrap: wrap; margin-bottom: 12px; }
#codex h2 { margin: 0; font-size: 20px; letter-spacing: .22em; color: var(--accent); font-weight: normal; }
#codex header .sub { opacity: .65; font-size: 11px; letter-spacing: .08em; flex: 1 0 100%; order: 9; margin-top: -6px; }
#codex header h2 { flex: 1; }
#codex .switch { display: flex; gap: 8px; align-items: center; font-size: 12px; letter-spacing: .12em; cursor: var(--jcur-pointer, pointer); padding: 4px 8px; border: 1px solid rgba(255,178,122,.35); border-radius: 3px; }
#codex .switch i { width: 26px; height: 12px; border-radius: 6px; background: rgba(28,13,8,.8); border: 1px solid rgba(255,178,122,.5); position: relative; }
#codex .switch i::after { content: ''; position: absolute; left: 1px; top: 1px; width: 8px; height: 8px; border-radius: 50%; background: var(--accent); transition: left .12s; }
#codex .switch.on { border-color: var(--accent); background: rgba(var(--jsel),.3); } #codex .switch.on i::after { left: 15px; background: #fff1dc; }
#codex .switch u { text-decoration: none; color: #fff1dc; min-width: 66px; display: inline-block; }
#codex .x { cursor: var(--jcur-pointer, pointer); padding: 2px 8px; border: 1px solid rgba(255,178,122,.35); border-radius: 3px; font-size: 12px; letter-spacing: .1em; }
#codex .x:hover, #codex button:hover { background: rgba(var(--jsel),.35); }
#codex .shelf { font-size: 11px; letter-spacing: .28em; color: var(--accent); margin: 0 0 10px; padding-bottom: 8px; border-bottom: 1px solid rgba(255,178,122,.2); display: flex; gap: 22px; }
#codex .shelf .tab { cursor: var(--jcur-pointer, pointer); opacity: .5; padding-bottom: 3px; } #codex .shelf .tab.on { opacity: 1; border-bottom: 2px solid var(--accent); } #codex .shelf .tab:hover { opacity: .9; }
#codex .body { display: grid; grid-template-columns: 250px 1fr; gap: 16px; min-height: 300px; }
@media (max-width: 720px) { #codex .body { grid-template-columns: 1fr; } }
#codex .list { display: flex; flex-direction: column; gap: 6px; }
#codex .row { display: flex; align-items: center; gap: 10px; padding: 8px 10px; border: 1px solid rgba(255,178,122,.25); border-radius: 4px; cursor: var(--jcur-pointer, pointer); background: rgba(28,13,8,.35); }
#codex .row.sel { border-color: var(--accent); background: rgba(var(--jsel),.3); }
#codex .row .g { font-size: 22px; width: 28px; text-align: center; }
#codex .row .t { flex: 1; min-width: 0; } #codex .row .t b { display: block; font-weight: normal; letter-spacing: .08em; font-size: 13px; }
#codex .row .t s { text-decoration: none; display: block; font-size: 10px; opacity: .6; }
#codex .row.locked .g, #codex .row.locked b { opacity: .5; }
#codex .bar { height: 5px; border-radius: 3px; background: rgba(28,13,8,.85); border: 1px solid rgba(255,178,122,.25); overflow: hidden; margin-top: 4px; }
#codex .bar i { display: block; height: 100%; background: linear-gradient(90deg, #c46a45, #ffb27a); }
#codex .card { border: 1px solid rgba(255,178,122,.3); border-radius: 4px; padding: 14px 16px; background: rgba(28,13,8,.35); }
#codex .card h3 { margin: 0 0 4px; font-size: 18px; letter-spacing: .14em; font-weight: normal; color: #fff1dc; }
#codex .card .in { font-size: 11px; color: var(--accent); letter-spacing: .1em; margin-bottom: 10px; }
#codex .card p { margin: 0 0 12px; opacity: .85; font-size: 13px; line-height: 1.5; }
#codex .card .hint { font-style: italic; opacity: .75; }
#codex .btns { display: flex; gap: 8px; flex-wrap: wrap; margin: 4px 0 12px; }
#codex button { font: inherit; font-size: 12px; letter-spacing: .1em; color: var(--ink); background: rgba(28,13,8,.7); border: 1px solid rgba(255,178,122,.5); padding: 6px 12px; border-radius: 3px; cursor: var(--jcur-pointer, pointer); }
#codex .vars { display: flex; flex-direction: column; gap: 6px; margin-top: 6px; }
#codex .var { display: flex; gap: 10px; align-items: flex-start; padding: 7px 9px; border: 1px solid rgba(255,178,122,.22); border-radius: 3px; cursor: var(--jcur-pointer, pointer); }
#codex .var.sel { border-color: var(--accent); background: rgba(var(--jsel),.25); }
#codex .var.locked { opacity: .55; cursor: default; }
#codex .var .r { width: 12px; height: 12px; border-radius: 50%; border: 1px solid var(--accent); margin-top: 2px; flex: none; }
#codex .var.sel .r { background: var(--accent); box-shadow: 0 0 6px var(--accent); }
#codex .var b { font-weight: normal; letter-spacing: .06em; font-size: 12px; } #codex .var small { display: block; font-size: 11px; opacity: .7; line-height: 1.4; }
#codex .goals { font-size: 11px; opacity: .8; margin-top: 3px; } #codex .goals span { display: inline-block; margin-right: 12px; }
#codex footer { margin-top: 14px; padding-top: 10px; border-top: 1px solid rgba(255,178,122,.2); display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
#codex footer textarea { flex: 1; min-width: 200px; height: 30px; resize: none; font: inherit; font-size: 11px; color: var(--ink); background: rgba(28,13,8,.8); border: 1px solid rgba(255,178,122,.35); padding: 5px 7px; border-radius: 3px; user-select: text; }
#codex footer .msg { font-size: 11px; opacity: .7; letter-spacing: .06em; }
`;

const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; };

export class Codex {
  constructor(game) {
    this.game = game;
    this.sys = game.system;
    this.open = false;
    this.shelf = 'move'; // which shelf is open: the Movement Arts, or the God Arts
    this.sel = ABILITIES[0].id;
    this.msg = '';
    const st = document.createElement('style');
    st.textContent = CSS;
    document.head.appendChild(st);
    this.root = el('div');
    this.root.id = 'codex';
    this.root.addEventListener('mousedown', (e) => e.stopPropagation());
    this.root.addEventListener('click', (e) => { if (e.target === this.root) this.close(); });
    // (Esc closes it anywhere; over the title, where the game's tick (B) does not run, B does too: the SOUND TEST is opened from there)
    addEventListener('keydown', (e) => {
      if (!this.open || e.repeat || /^(TEXTAREA|INPUT)$/.test(e.target?.tagName)) return;
      if (e.code === 'Escape' || (e.code === 'KeyB' && this.game.title?.active)) { e.preventDefault(); e.stopPropagation(); this.close(); }
    }, true);
    document.body.appendChild(this.root);
    this.sys.listeners.add(() => { if (this.open) this.render(); });
  }

  toggle() { this.open ? this.close() : this.show(); }

  show() {
    this.open = true;
    this.root.style.zIndex = this.game.title?.active ? '14' : ''; // (over the title's own layers (12) when opened from its menu)
    this.root.classList.add('open');
    document.exitPointerLock?.();
    this.render();
  }

  close() {
    this.open = false;
    this.root.classList.remove('open');
    this.onClose?.();
  }

  render() {
    const s = this.sys, r = this.root;
    r.innerHTML = '';
    const cx = el('div', 'cx');
    r.appendChild(cx);

    const head = el('header');
    head.appendChild(el('h2', '', 'THE CODEX'));
    head.appendChild(el('span', 'sub', 'the Veritome\'s own pages · arts are learned by doing · B to close'));
    const allArts = el('div', `switch allarts${s.lendAll ? ' on' : ''}`, 'ALL ARTS <i></i>');
    allArts.title = 'Everything unlocked: for testing and for showing the game off';
    allArts.onclick = () => s.setLendAll(!s.lendAll);
    head.appendChild(allArts);
    // the System's voice (audio/voice/voice.js): on or off, kept in the browser
    const V = this.game.voice;
    if (V) {
      const vo = el('div', `switch${V.settings.on ? ' on' : ''}`, 'VOICE <i></i>');
      vo.title = 'The System speaks what matters most, in its own synthesized voice';
      vo.onclick = () => { V.set({ on: !V.settings.on }); if (V.settings.on) V.say('Confirmed. The System will speak.', { key: 'voice.on', throttle: 0 }); this.render(); };
      head.appendChild(vo);
    }
    // the music (music/player.js): on or off, kept in the browser
    const M = this.game.music;
    if (M) {
      const mu = el('div', `switch${M.on ? ' on' : ''}`, 'MUSIC <i></i>');
      mu.title = 'The rooms that have a theme play it (the Dunes: "Mirage of the Still Water")';
      mu.onclick = () => { M.setOn(!M.on); this.render(); };
      head.appendChild(mu);
    }
    // the window colour (ui/theme.js), as Final Fantasy's config always offered: a click for the next
    const TH = this.game.theme;
    if (TH) {
      const wc = el('div', 'switch wcol', `WINDOW <u>${TH.name}</u>`);
      wc.title = 'The colour of every window: Kiln, Oxblood, Midnight, Verdigris, Umber';
      wc.onclick = () => { TH.next(); this.render(); };
      head.appendChild(wc);
    }
    const x = el('div', 'x', 'CLOSE');
    x.onclick = () => this.close();
    head.appendChild(x);
    cx.appendChild(head);

    const tabs = el('div', 'shelf');
    for (const [id, name] of [['move', 'MOVEMENT ARTS'], ['god', 'GOD ARTS'], ['angle', 'ANGLING'], ['curios', 'CURIOS'], ['veritome', 'VERITOME'], ['tools', 'TOOLS'], ['ledger', 'LEDGER'], ['records', 'RECORDS'], ['grimoire', 'GRIMOIRE'], ['sound', 'SOUND TEST']]) {
      const t = el('span', `tab${this.shelf === id ? ' on' : ''}`, name);
      t.onclick = () => { this.shelf = id; if (id === 'move' || id === 'god') this.sel = (id === 'god' ? GOD_ARTS : ABILITIES)[0].id; this.render(); };
      tabs.appendChild(t);
    }
    cx.appendChild(tabs);
    if (this.shelf === 'ledger' || this.shelf === 'records' || this.shelf === 'angle' || this.shelf === 'curios' || this.shelf === 'veritome' || this.shelf === 'tools' || this.shelf === 'sound' || this.shelf === 'grimoire') {
      (this.shelf === 'grimoire' ? (c, host) => this.game.codexPages?.grimoire?.(c, host) : this.shelf === 'ledger' ? renderLedger : this.shelf === 'angle' ? renderAngling : this.shelf === 'curios' ? renderCurios : this.shelf === 'veritome' ? renderVeritome : this.shelf === 'tools' ? renderTools : this.shelf === 'sound' ? renderSoundTest : renderRecords)(this, cx);
      this.rows = {}; this.cardHost = null;
      const foot = el('footer');
      foot.appendChild(el('span', 'msg', 'counted quietly as you play · the log (lower left) says the rest'));
      cx.appendChild(foot);
      return;
    }
    const body = el('div', 'body');
    const list = el('div', 'list');
    this.rows = {};
    for (const a of (this.shelf === 'god' ? GOD_ARTS : ABILITIES)) {
      const own = s.has(a.id);
      const frac = s.skillFrac(a.id, a.goals);
      const nvar = a.variants.filter((v) => s.has(`${a.id}.${v.id}`)).length;
      const row = el('div', `row${own ? '' : ' locked'}`,
        `<span class="g">${own ? a.glyph : '?'}</span><span class="t"><b>${own ? a.name.toUpperCase() : '· · ·'}</b><s>${own ? `${nvar}/${a.variants.length} variants` : frac > 0 ? `${Math.round(frac * 100)}% learned` : 'unknown'}</s>${own ? '' : `<div class="bar"><i style="width:${Math.round(frac * 100)}%"></i></div>`}</span>`);
      row.onclick = () => { this.sel = a.id; this.renderCard(); this.markSel(); };
      this.rows[a.id] = row;
      list.appendChild(row);
    }
    body.appendChild(list);
    this.cardHost = el('div');
    body.appendChild(this.cardHost);
    cx.appendChild(body);

    const foot = el('footer');
    const exp = el('button', '', 'EXPORT CODE');
    const ta = el('textarea');
    ta.placeholder = 'paste a save code here, then IMPORT';
    ta.spellcheck = false;
    const imp = el('button', '', 'IMPORT');
    const rst = el('button', '', 'RESET PROGRESS');
    const msg = el('span', 'msg', this.msg);
    // (the whole save, core/save.js: the box and the belt, the ledger, the Book, the map, the Wells... not the System's unlocks alone;
    // a code from before, FFS1, is still the System's; putting one back, or erasing, reloads the page so every module reads it afresh)
    const G = this.game.save, reload = () => setTimeout(() => location.reload(), 400);
    exp.onclick = () => { ta.value = G.code(); ta.select(); try { navigator.clipboard?.writeText(ta.value); this.setMsg('code copied'); } catch { this.setMsg('select and copy the code'); } };
    imp.onclick = () => { const c = ta.value.trim(); if (c.startsWith('FFS2.') ? G.fromCode(c) : s.importCode(c)) { this.setMsg('imported'); if (c.startsWith('FFS2.')) reload(); } else this.setMsg('that code did not check out'); };
    let armed = false;
    rst.onclick = () => { if (!armed) { armed = true; rst.textContent = 'CLICK AGAIN TO ERASE'; setTimeout(() => { armed = false; rst.textContent = 'RESET PROGRESS'; }, 3000); } else { G.wipeProgress(); this.setMsg('progress erased'); reload(); } };
    for (const n of [exp, ta, imp, rst, msg]) foot.appendChild(n);
    this.msgEl = msg;
    cx.appendChild(foot);
    this.renderCard();
    this.markSel();
  }

  setMsg(t) { this.msg = t; if (this.msgEl) this.msgEl.textContent = t; }

  markSel() { for (const [id, row] of Object.entries(this.rows || {})) row.classList.toggle('sel', id === this.sel); }

  renderCard() {
    const s = this.sys, a = BY_ID[this.sel], host = this.cardHost;
    if (!host || !a) return;
    host.innerHTML = '';
    const own = s.has(a.id);
    const card = el('div', 'card');
    if (!own) {
      const frac = s.skillFrac(a.id, a.goals);
      card.appendChild(el('h3', '', '· · ·'));
      card.appendChild(el('div', 'in', 'NOT YET LEARNED'));
      card.appendChild(el('p', 'hint', a.hint));
      card.appendChild(el('div', 'bar', `<i style="width:${Math.round(frac * 100)}%"></i>`));
      if (frac > 0) card.appendChild(this.goalLine(a.id, a.goals));
      host.appendChild(card);
      return;
    }
    card.appendChild(el('h3', '', `${a.glyph}  ${a.name.toUpperCase()}`));
    card.appendChild(el('div', 'in', `INPUT · ${a.input}`));
    card.appendChild(el('p', '', a.blurb));
    if (a.follows) card.appendChild(el('p', '', `<span style="color:var(--accent)">FOLLOW-UPS</span> · ${a.follows.join(' · ')}`));
    const btns = el('div', 'btns');
    if (a.station) {
      const go = el('button', '', 'GO TO STATION');
      go.title = 'Teleport to where this is practised (the basement labs)';
      go.onclick = () => this.goTo(a.station);
      btns.appendChild(go);
    } else card.appendChild(el('p', '', '<span style="color:var(--accent)">USE IT</span> · ~ turns you into the hand; right click holds the art wheel; it works on ground you have mapped (M, N).'));
    card.appendChild(btns);
    card.appendChild(el('div', 'in', 'VARIANTS'));
    const vars = el('div', 'vars');
    const cur = s.variantId(a.id);
    const std = el('div', `var${cur ? '' : ' sel'}`, '<span class="r"></span><span><b>STANDARD</b><small>As it comes.</small></span>');
    std.onclick = () => s.setVariant(a.id, null);
    vars.appendChild(std);
    for (const v of a.variants) {
      const vid = `${a.id}.${v.id}`, have = s.has(vid);
      const frac = s.skillFrac(vid, v.goals);
      const row = el('div', `var${have ? '' : ' locked'}${have && cur === v.id ? ' sel' : ''}`,
        `<span class="r"></span><span><b>${have ? v.name.toUpperCase() : '▒▒▒▒▒▒'}</b><small>${have ? v.blurb : v.hint}</small>${have ? '' : `<div class="bar"><i style="width:${Math.round(frac * 100)}%"></i></div>`}</span>`);
      if (!have && frac > 0) row.querySelector('span:last-child').appendChild(this.goalLine(vid, v.goals));
      if (have) row.onclick = () => s.setVariant(a.id, v.id);
      vars.appendChild(row);
    }
    card.appendChild(vars);
    host.appendChild(card);
  }

  goalLine(id, goals) {
    const s = this.sys;
    const d = el('div', 'goals');
    goals.forEach((g, i) => {
      const v = Math.floor(s.goalValue(id, i));
      d.appendChild(el('span', '', `${g.label}: ${Math.min(v, g.n)}/${g.n}`));
    });
    return d;
  }

  goTo(station) {
    const c = this.game.course;
    const i = c?.cps.findIndex((cp) => cp.room === station);
    if (i === undefined || i < 0) return;
    this.close();
    c.goTo(i, 'geyser');
  }
}
