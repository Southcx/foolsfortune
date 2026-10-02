// ---------------------------------------------------------------------------------------
// THE LOG: the game's one place for text feedback. A chat window in the lower left, after Final Fantasy XI's
// (and, for the tabs, Final Fantasy XIV's): a dark blue translucent window with a pale bevelled frame, white text with a hard
// black outline, and a colour for every kind of message, so that a glance at the colour says what kind of thing happened before
// the words are read. There is no other text feedback in the game: no pop-ups, no toasts, no banners. Anything that used
// to announce itself now writes a line here, and the metrics behind it are counted quietly (stats.js).
//
// Prior art, and what was taken:
//  - FFXI's chat log: one scrolling log with a filter for every message class and a colour per class (the Message &
//    Channel options), an adjustable window alpha, plain sentences in the third person for combat ("The Goblin takes 12
//    points of damage."), skill-ups as their own line ("Your Sword skill rises 0.1 points."), gains in yellow, system and
//    error lines in cool white and soft red.
//  - FFXIV's chat window: tabs that each carry a filter (General, Battle, Event...), timestamps, and an unread mark on a
//    tab that has something new. Repeated combat lines fold into one with a count.
//
//   log.say('move', 'You slam into the ground.')                         one line
//   log.say('battle', 'You shatter a jar.', { key: 'break', fmt: (n) => `You shatter ${n} jars.` })   folds repeats within a moment
//   log.say('warn', 'You cannot do that.', { key: 'x', throttle: 3 })     at most once in 3 s
//   PageUp / PageDown scroll, End jumps to the newest, [ and ] change tab.
// ---------------------------------------------------------------------------------------
export const CLASSES = {
  system: { color: '#ead9c6', tab: 'SYSTEM' },
  info: { color: '#fff1e0', tab: 'SYSTEM' },
  warn: { color: '#ff9f80', tab: 'SYSTEM' },
  move: { color: '#e9c9a2', tab: 'MOVE' },
  surf: { color: '#a9d6bd', tab: 'MOVE' },
  battle: { color: '#fff1e0', tab: 'BATTLE' },
  hurt: { color: '#ff8f7d', tab: 'BATTLE' },
  gain: { color: '#ffd67e', tab: 'BATTLE' },
  art: { color: '#d3bde0', tab: 'EVENT' },
  god: { color: '#e2adc9', tab: 'EVENT' },
  circuit: { color: '#ffb87c', tab: 'EVENT' },
  explore: { color: '#c4d9a0', tab: 'EVENT' },
  record: { color: '#a8d3c9', tab: 'EVENT' },
  ach: { color: '#ffd45e', tab: 'EVENT' },
  angle: { color: '#9fd3d6', tab: 'BATTLE' },
  loot: { color: '#ffd98a', tab: 'BATTLE' },
  song: { color: '#c9b6ff', tab: 'BATTLE' }, // (the Crucibelle's songs)
  luck: { color: '#ff9ad5', tab: 'BATTLE' }, // (what came out of a Lockheart)
  find: { color: '#cdb8f2', tab: 'EVENT' }, // (the Dreamvane: what it found, what the pick gave)
  other: { color: '#c9b09f', tab: 'BATTLE' }, // (what others did: a clapperjar, the world itself)
  say: { color: '#ffffff', tab: 'CHAT' }, // (said aloud: the Courier's chat line, and the clay folk's words)
  emote: { color: '#f2c6e6', tab: 'CHAT' },
  npc: { color: '#e6f0ff', tab: 'CHAT' },
};
const TABS = ['ALL', 'CHAT', 'BATTLE', 'MOVE', 'EVENT', 'SYSTEM'];

const CSS = `
#chatlog { position: absolute; left: 12px; bottom: calc(12px + var(--cine, 0vh)); width: min(40vw, 580px); height: clamp(170px, 26vh, 300px); box-sizing: border-box; display: flex; flex-direction: column;
  background: linear-gradient(180deg, rgba(70,34,23,.80), rgba(36,17,11,.90)); border: 2px solid #b3735a; border-radius: 4px;
  box-shadow: inset 0 0 0 1px #5d3123, inset 0 0 18px rgba(20,6,2,.55), 0 0 0 1px #1c0d08; pointer-events: none; transition: opacity .6s;
  font-family: var(--f-sys); letter-spacing: 0; }
#chatlog.idle { opacity: .5; }
#chatlog .tabs { display: flex; gap: 2px; padding: 3px 4px 0; border-bottom: 1px solid rgba(0,0,0,.35); font: 600 11px var(--f-title); letter-spacing: .12em; }
#chatlog .tab { padding: 2px 8px 3px; color: #b58f7a; border: 1px solid transparent; border-bottom: none; border-radius: 3px 3px 0 0; text-shadow: 1px 1px 0 #000; }
#chatlog .tab.on { color: #fff1e0; background: rgba(196,106,69,.30); border-color: #9a5a44; }
#chatlog .tab.new { color: #ffd67e; }
#chatlog .tab.on.new { color: #fff1e0; }
#chatlog .body { flex: 1; overflow-y: auto; overflow-x: hidden; padding: 3px 6px 4px; font-size: 16px; line-height: 18px; scrollbar-width: thin; scrollbar-color: #9a5a44 transparent; }
#chatlog .ln { text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000, 0 0 3px rgba(0,0,0,.6); word-wrap: break-word; }
#chatlog .ts { color: #a98572; margin-right: 8px; }
#chatlog .ln.ach { color: #ffd45e; }
#chatlog .min { margin-left: auto; padding: 0 8px 2px; color: #e8c3a8; border: 1px solid #9a5a44; border-bottom: none; border-radius: 3px 3px 0 0; cursor: var(--jcur-pointer, pointer); pointer-events: auto; font-size: 12px; line-height: 14px; text-shadow: 1px 1px 0 #000; background: rgba(28,13,8,.4); }
#chatlog .min.new { color: #ffd67e; border-color: #ffd67e; }
#chatlog .min:hover { background: rgba(196,106,69,.4); color: #fff1e0; }
#chatlog.mini { height: auto; }
#chatlog.mini .body, #chatlog.mini .foot { display: none; }
#chatlog .prog { display: none; margin: 0 4px 3px; padding: 4px 8px; border: 1px solid rgba(var(--jsel), .8); border-radius: 3px; background: rgba(8,4,2,.72); font: 14px/1.35 var(--f-sys); color: #cdb8a8; }
#chatlog.moded .prog { display: block; }
#chatlog .line { display: none; align-items: center; gap: 6px; margin: 0 4px 2px; padding: 2px 6px; border: 1px solid rgba(var(--jsel), .8); border-radius: 3px;
  background: rgba(8,3,1,.55); pointer-events: auto; }
#chatlog.typing .line { display: flex; }
#chatlog .line b { font: 16px var(--f-sys); color: var(--accent); font-weight: normal; }
#chatlog .line input { flex: 1; min-width: 0; background: none; border: none; outline: none; color: #fff; font: 16px var(--f-sys); caret-color: #ffd98a; padding: 0;
  text-shadow: 1px 1px 0 #000; user-select: text; }
#chatlog.typing { opacity: 1 !important; }
#chatlog .foot { padding: 1px 6px 0; font: 500 9.5px var(--f-ui); color: #94705e; letter-spacing: .1em; text-shadow: 1px 1px 0 #000; display: flex; justify-content: space-between; }
#chatlog .foot .keys { visibility: hidden; } #chatlog.typing .foot .keys { visibility: visible; } /* (the keys are said while the line is open, not always: docs/LOOK.md 7) */
`;

const pad = (n) => String(n).padStart(2, '0');
const clock = () => { const d = new Date(); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };

export class GameLog {
  constructor(game) {
    this.game = game;
    this.lines = [];      // { cls, text, ts, n, key, t, el }
    this.tab = 0;
    this.unread = new Set();
    this.max = 400;
    this.idleT = 0;
    this.last = null;
    this.quiet = new Map();
    const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    const root = document.createElement('div'); root.id = 'chatlog';
    root.innerHTML = `<div class="tabs">${TABS.map((t, i) => `<div class="tab" data-i="${i}">${t}</div>`).join('')}<div class="min" title="minimise (\\)">–</div></div><div class="body"></div><div class="prog"></div><div class="line"><b>›</b><input maxlength="200" spellcheck="false" autocomplete="off" placeholder="say something, or /help"></div><div class="foot"><span class="keys">ENTER CHAT · / COMMAND · PGUP / PGDN · [ ] TAB · \\ HIDE</span><span class="n"></span></div>`;
    (document.getElementById('hud') || document.body).appendChild(root);
    this.root = root;
    this.body = root.querySelector('.body');
    this.tabEls = [...root.querySelectorAll('.tab')];
    this.foot = root.querySelector('.n');
    // minimised: only the tab strip (new lines light their tab); the button, or \\ (kept between visits)
    this.minEl = root.querySelector('.min');
    this.minEl.addEventListener('mousedown', (e) => { e.stopPropagation(); e.preventDefault(); this.setMini(!this.mini); });
    let m = false; try { m = localStorage.getItem('foolsfortune.log.mini') === '1'; } catch { /* storage unavailable */ }
    this.setMini(m);
    this.setTab(0);
    addEventListener('keydown', (e) => this.key(e));
    // the chat line (chat.js runs what is sent)
    this.field = root.querySelector('.line input');
    this.history = []; this.hi = -1; this.typing = false;
    this.field.addEventListener('keydown', (e) => {
      e.stopPropagation();
      // (a mode borrows the line: what is typed goes to it, Enter keeps the line open, Esc ends the mode)
      if (this.mode && (e.code === 'Enter' || e.code === 'NumpadEnter')) { e.preventDefault(); const v = this.field.value; this.field.value = ''; this.mode.onSend?.(v); this.mode?.onInput?.(''); return; }
      if (this.mode && e.code === 'Escape') { e.preventDefault(); this.mode.onEscape?.(); return; }
      if (e.code === 'Enter' || e.code === 'NumpadEnter') { e.preventDefault(); const v = this.field.value; this.close(); this.send(v); }
      else if (e.code === 'Escape') { e.preventDefault(); this.closedAt = performance.now(); this.close(); }
      else if (e.code === 'ArrowUp' || e.code === 'ArrowDown') {
        e.preventDefault();
        if (!this.history.length) return;
        this.hi = e.code === 'ArrowUp' ? Math.min(this.history.length - 1, this.hi + 1) : Math.max(-1, this.hi - 1);
        this.field.value = this.hi < 0 ? '' : this.history[this.history.length - 1 - this.hi];
      }
    });
    this.field.addEventListener('input', () => this.mode?.onInput?.(this.field.value));
    this.field.addEventListener('blur', () => { if (this.typing) setTimeout(() => { if (document.activeElement === this.field) return; if (this.mode) this.field.focus({ preventScroll: true }); else this.close(); }, 0); });
    this.prog = root.querySelector('.prog'); this.prompt = root.querySelector('.line b');
  }

  /** Open the chat line (with `prefix` already typed). */
  open(prefix = '') {
    if (this.mini) this.setMini(false);
    this.typing = true; this.hi = -1;
    this.root.classList.add('typing');
    this.field.value = prefix;
    this.field.focus({ preventScroll: true });
    this.game.input?.down.clear(); // (the keys held as it opened are let go: the Courier stops)
    this.body.scrollTop = this.body.scrollHeight;
    this.wake();
  }
  close() {
    if (!this.typing) return;
    this.typing = false;
    this.root.classList.remove('typing');
    this.field.blur();
  }
  send(text) {
    const t = String(text || '').trim();
    if (!t) return;
    if (this.history[this.history.length - 1] !== t) this.history.push(t);
    if (this.history.length > 50) this.history.shift();
    this.onSend?.(t);
  }
  /** Lend the chat line to something that reads typing (a mode: { prompt, onInput(text), onSend(text), onEscape() }); null gives it back.
   *  The mode's own lines are drawn in the panel above the line (log.prog). */
  setMode(mode) {
    this.mode = mode || null;
    this.prompt.textContent = mode?.prompt || '›';
    this.root.classList.toggle('moded', !!mode);
    if (mode) this.open(''); else { this.prog.replaceChildren(); this.close(); this.closedAt = performance.now(); }
  }
  /** Typing, or just stopped with Esc (which also lets the mouse go: that is not a pause). */
  get busy() { return this.typing || performance.now() - (this.closedAt || 0) < 500; }
  clear() { this.lines.length = 0; this.last = null; this.body.replaceChildren(); }

  key(e) {
    if (!this.game.input?.enabled || e.repeat && e.code !== 'PageUp' && e.code !== 'PageDown') return;
    const tag = document.activeElement?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    if ((e.code === 'Enter' || e.code === 'NumpadEnter' || e.code === 'Slash') && !e.repeat && (this.canOpen?.() ?? true)) {
      e.preventDefault(); this.open(e.code === 'Slash' ? '/' : ''); return;
    }
    if (e.code === 'PageUp') { this.body.scrollTop -= this.body.clientHeight * 0.8; this.wake(); e.preventDefault(); }
    else if (e.code === 'PageDown') { this.body.scrollTop += this.body.clientHeight * 0.8; this.wake(); e.preventDefault(); }
    else if (e.code === 'End') { this.body.scrollTop = this.body.scrollHeight; this.wake(); }
    else if (e.code === 'Backslash') this.setMini(!this.mini);
    else if (e.code === 'BracketRight') this.setTab((this.tab + 1) % TABS.length);
    else if (e.code === 'BracketLeft') this.setTab((this.tab + TABS.length - 1) % TABS.length);
  }

  wake() { this.idleT = 0; this.root.classList.remove('idle'); }

  setMini(v) {
    this.mini = v;
    this.root.classList.toggle('mini', v);
    this.minEl.textContent = v ? '+' : '–';
    try { localStorage.setItem('foolsfortune.log.mini', v ? '1' : '0'); } catch { /* storage unavailable */ }
    if (!v) { this.minEl.classList.remove('new'); this.body.scrollTop = this.body.scrollHeight; this.wake(); }
  }

  shows(cls, tab = this.tab) { return tab === 0 || (CLASSES[cls]?.tab || 'SYSTEM') === TABS[tab]; }

  setTab(i) {
    this.tab = i;
    this.unread.delete(i);
    this.tabEls.forEach((t, k) => { t.classList.toggle('on', k === i); t.classList.toggle('new', this.unread.has(k)); });
    this.body.replaceChildren(...this.lines.filter((l) => this.shows(l.cls)).slice(-120).map((l) => this.build(l)));
    this.body.scrollTop = this.body.scrollHeight;
    this.wake();
  }

  build(l) {
    const d = document.createElement('div');
    d.className = `ln ${l.cls}`;
    d.style.color = l.tone || CLASSES[l.cls]?.color || '#fff';
    d.innerHTML = `<span class="ts">${l.ts}</span>`;
    d.append(document.createTextNode(l.text));
    l.el = d;
    return d;
  }

  /**
   * One line. `key` + `fmt` fold repeats: a second line with the same key inside `win` seconds updates the first,
   * with fmt(count) as its text.
   */
  say(cls, text, { key = null, win = 1.6, fmt = null, tone = null, throttle = 0 } = {}) {
    const now = performance.now() / 1000;
    if (throttle && key) { // (a refusal repeated by a held key says itself once)
      if (now - (this.quiet.get(key) ?? -99) < throttle) return null;
      this.quiet.set(key, now);
    }
    const p = this.last;
    if (key && p && p.key === key && now - p.t < win) {
      p.n++; p.t = now;
      p.text = fmt ? fmt(p.n) : p.text;
      if (p.el) p.el.lastChild.textContent = p.text;
      this.afterSay(p);
      return p;
    }
    const l = { cls, text, ts: clock(), n: 1, key, t: now, tone };
    this.lines.push(l);
    if (this.lines.length > this.max) this.lines.shift();
    this.last = l;
    if (this.shows(cls)) {
      const near = this.body.scrollHeight - this.body.scrollTop - this.body.clientHeight < 40;
      this.body.appendChild(this.build(l));
      while (this.body.children.length > 140) this.body.firstChild.remove();
      if (near) this.body.scrollTop = this.body.scrollHeight;
    }
    this.afterSay(l);
    return l;
  }

  afterSay(l) {
    const tab = TABS.indexOf(CLASSES[l.cls]?.tab || 'SYSTEM');
    if (tab !== this.tab && this.tab !== 0) { this.unread.add(tab); this.tabEls[tab]?.classList.add('new'); }
    if (this.mini) this.minEl.classList.add('new'); // (folded away: the button lights up)
    this.wake();
  }

  /** Per frame: the window settles back to half strength when nothing has been said for a while. */
  tick(dt) {
    this.idleT += dt;
    if (this.idleT > 9) this.root.classList.add('idle');
    if (this.foot) this.foot.textContent = `${this.lines.length} lines`;
  }
}
