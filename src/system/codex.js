import { ABILITIES, BY_ID } from './skills.js';
import { SLOTS_MAX } from './system.js';
import { sfx } from '../audio.js';

// ---------------------------------------------------------------------------
// The System's face: the belt on the HUD, the [SYSTEM] toasts, and the Codex (B): the
// abilities you know and the shapes of the ones you don't, what's on your belt, variants,
// Lab mode, and the save code. Fired-clay tablets, the same ink as the rest of the HUD.
// The Codex pauses the game while it's open.
// ---------------------------------------------------------------------------

const CSS = `
#belt { position: absolute; left: 24px; bottom: 74px; display: flex; gap: 5px; align-items: flex-end; }
#belt .b { position: relative; width: 38px; height: 38px; box-sizing: border-box; border: 1px solid rgba(255,178,122,.4); background: rgba(28,13,8,.5); border-radius: 4px;
  display: flex; align-items: center; justify-content: center; font-size: 17px; }
#belt .b small { position: absolute; left: 3px; bottom: 1px; font-size: 8px; letter-spacing: .04em; opacity: .85; color: var(--accent); }
#belt .b em { position: absolute; right: 3px; top: 1px; font-style: normal; font-size: 8px; color: #fff1dc; opacity: .8; }
#belt .b.busy { border-color: #fff1dc; background: rgba(196,106,69,.45); box-shadow: 0 0 10px rgba(255,178,122,.6); }
#belt .b.lab { border-style: dashed; }
#belt .tag { position: absolute; left: 0; top: -14px; font-size: 9px; letter-spacing: .16em; color: var(--accent); opacity: .8; white-space: nowrap; }
#belt.none { display: none; }
#sys-toasts { position: absolute; left: 50%; top: 84px; transform: translateX(-50%); display: flex; flex-direction: column; align-items: center; gap: 8px; }
.sys-toast { font-size: 15px; letter-spacing: .1em; padding: 10px 18px 10px 14px; background: rgba(28,13,8,.86); border: 1px solid var(--accent); border-left-width: 5px;
  text-shadow: 0 1px 0 #1c0d08; box-shadow: 0 0 22px rgba(255,178,122,.35); animation: systoast 5.2s ease-out forwards; max-width: 520px; text-align: left; }
.sys-toast b { color: #fff1dc; font-weight: normal; } .sys-toast .k { color: var(--accent); margin-right: 8px; }
.sys-toast small { display: block; font-size: 11px; letter-spacing: .06em; opacity: .75; margin-top: 3px; }
@keyframes systoast { 0% { transform: translateY(-14px) scale(.96); opacity: 0; } 6% { transform: none; opacity: 1; } 88% { opacity: 1; } 100% { opacity: 0; transform: translateY(-6px); } }
#codex { position: fixed; inset: 0; z-index: 9; display: none; align-items: center; justify-content: center; background: rgba(20,9,6,.78); cursor: default; user-select: none; }
#codex.open { display: flex; }
#codex .cx { width: min(980px, calc(100% - 24px)); max-height: calc(100% - 24px); overflow: auto; box-sizing: border-box; background: #2a140d; border: 1px solid rgba(255,178,122,.5);
  box-shadow: 0 0 0 4px rgba(28,13,8,.7), 0 20px 60px rgba(0,0,0,.6); padding: 18px 22px 16px; }
#codex header { display: flex; align-items: baseline; gap: 14px; flex-wrap: wrap; margin-bottom: 12px; }
#codex h2 { margin: 0; font-size: 20px; letter-spacing: .22em; color: var(--accent); font-weight: normal; }
#codex header .sub { opacity: .65; font-size: 12px; letter-spacing: .08em; flex: 1; }
#codex .lab { display: flex; gap: 8px; align-items: center; font-size: 12px; letter-spacing: .12em; cursor: pointer; padding: 4px 8px; border: 1px solid rgba(255,178,122,.35); border-radius: 3px; }
#codex .lab i { width: 26px; height: 12px; border-radius: 6px; background: rgba(28,13,8,.8); border: 1px solid rgba(255,178,122,.5); position: relative; }
#codex .lab i::after { content: ''; position: absolute; left: 1px; top: 1px; width: 8px; height: 8px; border-radius: 50%; background: var(--accent); transition: left .12s; }
#codex .lab.on { border-color: var(--accent); background: rgba(196,106,69,.3); } #codex .lab.on i::after { left: 15px; background: #fff1dc; }
#codex .x { cursor: pointer; padding: 2px 8px; border: 1px solid rgba(255,178,122,.35); border-radius: 3px; font-size: 12px; letter-spacing: .1em; }
#codex .x:hover, #codex button:hover { background: rgba(196,106,69,.35); }
#codex .slots { display: flex; gap: 7px; flex-wrap: wrap; margin-bottom: 14px; padding-bottom: 12px; border-bottom: 1px solid rgba(255,178,122,.2); }
#codex .slot { width: 92px; height: 62px; box-sizing: border-box; border: 1px solid rgba(255,178,122,.45); background: rgba(196,106,69,.22); border-radius: 4px; padding: 5px 6px; cursor: pointer;
  display: flex; flex-direction: column; justify-content: space-between; position: relative; }
#codex .slot .g { font-size: 20px; line-height: 1; } #codex .slot .n { font-size: 10px; letter-spacing: .06em; line-height: 1.15; }
#codex .slot .v { font-size: 9px; color: var(--accent); opacity: .9; }
#codex .slot .kk { position: absolute; right: 5px; top: 4px; font-size: 9px; color: var(--accent); }
#codex .slot.empty { background: none; border-style: dashed; opacity: .55; align-items: center; justify-content: center; font-size: 10px; letter-spacing: .1em; }
#codex .slot.locked { background: none; border-style: dotted; opacity: .28; align-items: center; justify-content: center; font-size: 10px; }
#codex .body { display: grid; grid-template-columns: 250px 1fr; gap: 16px; min-height: 300px; }
@media (max-width: 720px) { #codex .body { grid-template-columns: 1fr; } }
#codex .list { display: flex; flex-direction: column; gap: 6px; }
#codex .row { display: flex; align-items: center; gap: 10px; padding: 8px 10px; border: 1px solid rgba(255,178,122,.25); border-radius: 4px; cursor: pointer; background: rgba(28,13,8,.35); }
#codex .row.sel { border-color: var(--accent); background: rgba(196,106,69,.3); }
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
#codex button { font: inherit; font-size: 12px; letter-spacing: .1em; color: var(--ink); background: rgba(28,13,8,.7); border: 1px solid rgba(255,178,122,.5); padding: 6px 12px; border-radius: 3px; cursor: pointer; }
#codex button.on { background: rgba(196,106,69,.5); border-color: var(--accent); } #codex button:disabled { opacity: .35; cursor: default; }
#codex .vars { display: flex; flex-direction: column; gap: 6px; margin-top: 6px; }
#codex .var { display: flex; gap: 10px; align-items: flex-start; padding: 7px 9px; border: 1px solid rgba(255,178,122,.22); border-radius: 3px; cursor: pointer; }
#codex .var.sel { border-color: var(--accent); background: rgba(196,106,69,.25); }
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
    this.sel = ABILITIES[0].id;
    this.msg = '';
    const st = document.createElement('style');
    st.textContent = CSS;
    document.head.appendChild(st);
    // HUD parts
    this.belt = el('div');
    this.belt.id = 'belt';
    document.getElementById('hud').appendChild(this.belt);
    this.toasts = el('div');
    this.toasts.id = 'sys-toasts';
    document.getElementById('hud').appendChild(this.toasts);
    // the Codex
    this.root = el('div');
    this.root.id = 'codex';
    this.root.addEventListener('mousedown', (e) => e.stopPropagation());
    this.root.addEventListener('click', (e) => { if (e.target === this.root) this.close(); });
    document.body.appendChild(this.root);
    this.sys.listeners.add(() => { this.renderBelt(); if (this.open) this.render(); });
    game.events?.on('system.unlock', (e) => {
      const a = BY_ID[e.ability];
      this.toast(e.variant ? 'VARIANT LEARNED' : 'SKILL ACQUIRED', e.title.toUpperCase(),
        e.variant ? `${a.name} · press B to choose it` : `${a.blurb.split('.')[0]}. It's on your belt (B).`);
      sfx.systemUnlock?.();
    });
    // the first time you move: a line about what the System is (once per browser)
    const INTRO = 'foolsfortune.system.intro';
    let seen = false;
    try { seen = !!localStorage.getItem(INTRO); } catch { /* storage unavailable */ }
    if (!seen && this.sys.mastery() === 0 && !this.sys.lab) {
      const off = game.events?.on('jump', () => {
        off?.();
        try { localStorage.setItem(INTRO, '1'); } catch { /* storage unavailable */ }
        setTimeout(() => this.toast('NOTICE', 'SKILLS ARE LEARNED BY DOING', 'Dash, fall hard, run walls, break pots: it is watching. B opens the Codex; LAB MODE in it lends you everything.'), 4000);
      });
    }
    this.renderBelt();
  }

  toast(kind, title, sub) {
    const t = el('div', 'sys-toast', `<span class="k">[SYSTEM]</span>${kind} · <b>${title}</b>${sub ? `<small>${sub}</small>` : ''}`);
    this.toasts.appendChild(t);
    setTimeout(() => t.remove(), 5300);
    while (this.toasts.children.length > 3) this.toasts.firstChild.remove();
  }

  toggle() { this.open ? this.close() : this.show(); }

  show() {
    this.open = true;
    this.root.classList.add('open');
    document.exitPointerLock?.();
    this.render();
  }

  close() {
    this.open = false;
    this.root.classList.remove('open');
    this.onClose?.();
  }

  // ---- the belt on the HUD ----
  renderBelt() {
    const s = this.sys, b = this.belt;
    const ids = s.lab ? ABILITIES.map((a) => a.id) : s.state.equipped;
    b.className = ids.length ? '' : 'none';
    b.innerHTML = '';
    if (!ids.length) return;
    const tag = el('div', 'tag', s.lab ? 'BELT · LAB MODE' : 'BELT');
    b.appendChild(tag);
    for (const id of ids) {
      const a = BY_ID[id];
      const vid = s.variantId(id);
      const d = el('div', `b${s.lab ? ' lab' : ''}`, `${a.glyph}<small>${a.key}</small>${vid ? `<em>${a.variants.find((v) => v.id === vid).name[0]}</em>` : ''}`);
      d.title = `${a.name}${vid ? ` · ${a.variants.find((v) => v.id === vid).name}` : ''}: ${a.input}`;
      d.dataset.id = id;
      b.appendChild(d);
    }
  }

  /** Per frame: light a belt slot while its tech is running. */
  tick() {
    const active = this.game.techs?.active?.id;
    for (const d of this.belt.children) {
      if (!d.dataset.id) continue;
      d.classList.toggle('busy', BY_ID[d.dataset.id]?.tech === active);
    }
  }

  // ---- the Codex ----
  render() {
    const s = this.sys, r = this.root;
    r.innerHTML = '';
    const cx = el('div', 'cx');
    r.appendChild(cx);

    const head = el('header');
    head.appendChild(el('h2', '', 'THE SYSTEM'));
    head.appendChild(el('span', 'sub', 'skills are learned by doing · B to close'));
    const lab = el('div', `lab${s.lab ? ' on' : ''}`, 'LAB MODE <i></i>');
    lab.title = 'Everything unlocked and on the belt: for testing and for showing the game off';
    lab.onclick = () => s.setLab(!s.lab);
    head.appendChild(lab);
    const x = el('div', 'x', 'CLOSE');
    x.onclick = () => this.close();
    head.appendChild(x);
    cx.appendChild(head);

    // the belt: slots up to capacity, the rest shown as still to be earned
    const slots = el('div', 'slots');
    const cap = s.capacity();
    const ids = s.lab ? ABILITIES.map((a) => a.id) : s.state.equipped;
    for (let i = 0; i < SLOTS_MAX; i++) {
      const id = ids[i];
      if (id) {
        const a = BY_ID[id], vid = s.variantId(id);
        const d = el('div', 'slot', `<span class="g">${a.glyph}</span><span class="n">${a.name}</span><span class="v">${vid ? a.variants.find((v) => v.id === vid).name : 'standard'}</span><span class="kk">${a.key}</span>`);
        d.title = 'click to take off the belt';
        d.onclick = () => { if (!s.lab) s.unequip(id); };
        d.onmouseenter = () => { this.sel = id; this.renderCard(); this.markSel(); };
        slots.appendChild(d);
      } else if (i < cap) slots.appendChild(el('div', 'slot empty', 'EMPTY'));
      else slots.appendChild(el('div', 'slot locked', 'EARN'));
    }
    cx.appendChild(slots);

    const body = el('div', 'body');
    const list = el('div', 'list');
    this.rows = {};
    for (const a of ABILITIES) {
      const own = s.has(a.id);
      const frac = s.skillFrac(a.id, a.goals);
      const nvar = a.variants.filter((v) => s.has(`${a.id}.${v.id}`)).length;
      const row = el('div', `row${own ? '' : ' locked'}`,
        `<span class="g">${own ? a.glyph : '?'}</span><span class="t"><b>${own ? a.name.toUpperCase() : '· · ·'}</b><s>${own ? `${s.equipped(a.id) || s.lab ? 'on belt' : 'off belt'} · ${nvar}/${a.variants.length} variants` : frac > 0 ? `${Math.round(frac * 100)}% learned` : 'unknown'}</s>${own ? '' : `<div class="bar"><i style="width:${Math.round(frac * 100)}%"></i></div>`}</span>`);
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
    exp.onclick = () => { ta.value = s.exportCode(); ta.select(); try { navigator.clipboard?.writeText(ta.value); this.setMsg('code copied'); } catch { this.setMsg('select and copy the code'); } };
    imp.onclick = () => this.setMsg(s.importCode(ta.value) ? 'imported' : 'that code did not check out');
    let armed = false;
    rst.onclick = () => { if (!armed) { armed = true; rst.textContent = 'CLICK AGAIN TO ERASE'; setTimeout(() => { armed = false; rst.textContent = 'RESET PROGRESS'; }, 3000); } else { s.reset(); this.setMsg('progress erased'); } };
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
    const on = s.equipped(a.id);
    const eq = el('button', on || s.lab ? 'on' : '', s.lab ? 'ON THE BELT (LAB)' : on ? 'ON THE BELT · TAKE OFF' : 'PUT ON THE BELT');
    eq.disabled = s.lab;
    eq.onclick = () => { if (on) s.unequip(a.id); else if (!s.equip(a.id)) this.setMsg('the belt is full: take something off first'); };
    btns.appendChild(eq);
    const go = el('button', '', 'GO TO STATION');
    go.title = 'Teleport to where this is practised (the basement labs)';
    go.onclick = () => this.goTo(a.station);
    btns.appendChild(go);
    card.appendChild(btns);
    // variants
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
      if (!have && v.station) { row.title = `Practised at ${v.station}`; }
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
