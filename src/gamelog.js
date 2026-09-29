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
  system: { color: '#cdd8ff', tab: 'SYSTEM' },
  info: { color: '#ffffff', tab: 'SYSTEM' },
  warn: { color: '#ff9c9c', tab: 'SYSTEM' },
  move: { color: '#b9f1ff', tab: 'MOVE' },
  surf: { color: '#a9f2e2', tab: 'MOVE' },
  battle: { color: '#ffffff', tab: 'BATTLE' },
  hurt: { color: '#ff9a9a', tab: 'BATTLE' },
  gain: { color: '#ffe98a', tab: 'BATTLE' },
  art: { color: '#a3c4ff', tab: 'EVENT' },
  god: { color: '#e5b8ff', tab: 'EVENT' },
  circuit: { color: '#ffd07f', tab: 'EVENT' },
  explore: { color: '#bdffb5', tab: 'EVENT' },
  record: { color: '#9df0ff', tab: 'EVENT' },
  ach: { color: '#ffd45e', tab: 'EVENT' },
};
const TABS = ['ALL', 'BATTLE', 'MOVE', 'EVENT', 'SYSTEM'];

const CSS = `
#chatlog { position: absolute; left: 12px; bottom: 12px; width: min(40vw, 580px); height: clamp(150px, 23vh, 260px); box-sizing: border-box; display: flex; flex-direction: column;
  background: linear-gradient(180deg, rgba(22,29,68,.80), rgba(9,12,34,.88)); border: 2px solid #8d96c8; border-radius: 4px;
  box-shadow: inset 0 0 0 1px #2b3468, inset 0 0 18px rgba(0,0,10,.5), 0 0 0 1px #05071a; pointer-events: none; transition: opacity .6s;
  font-family: "Lucida Grande", "Segoe UI", "DejaVu Sans", Arial, sans-serif; letter-spacing: 0; }
#chatlog.idle { opacity: .5; }
#chatlog .tabs { display: flex; gap: 2px; padding: 3px 4px 0; border-bottom: 1px solid #38427a; font-size: 10.5px; letter-spacing: .08em; }
#chatlog .tab { padding: 2px 8px 3px; color: #8f99cc; border: 1px solid transparent; border-bottom: none; border-radius: 3px 3px 0 0; text-shadow: 1px 1px 0 #000; }
#chatlog .tab.on { color: #fff; background: rgba(90,104,190,.35); border-color: #59639f; }
#chatlog .tab.new { color: #ffe98a; }
#chatlog .tab.on.new { color: #fff; }
#chatlog .body { flex: 1; overflow-y: auto; overflow-x: hidden; padding: 4px 8px 5px; font-size: 12.5px; line-height: 1.34; scrollbar-width: thin; scrollbar-color: #59639f transparent; }
#chatlog .ln { text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000, 0 0 3px rgba(0,0,0,.6); word-wrap: break-word; }
#chatlog .ts { color: #7f89c0; font-size: 10.5px; margin-right: 6px; }
#chatlog .ln.ach { font-weight: bold; }
#chatlog .foot { padding: 1px 8px 2px; font-size: 9.5px; color: #6f79b0; letter-spacing: .1em; text-shadow: 1px 1px 0 #000; display: flex; justify-content: space-between; }
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
    root.innerHTML = `<div class="tabs">${TABS.map((t, i) => `<div class="tab" data-i="${i}">${t}</div>`).join('')}</div><div class="body"></div><div class="foot"><span>PGUP / PGDN · [ ] TAB</span><span class="n"></span></div>`;
    (document.getElementById('hud') || document.body).appendChild(root);
    this.root = root;
    this.body = root.querySelector('.body');
    this.tabEls = [...root.querySelectorAll('.tab')];
    this.foot = root.querySelector('.n');
    this.setTab(0);
    addEventListener('keydown', (e) => this.key(e));
  }

  key(e) {
    if (!this.game.input?.enabled || e.repeat && e.code !== 'PageUp' && e.code !== 'PageDown') return;
    const tag = document.activeElement?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    if (e.code === 'PageUp') { this.body.scrollTop -= this.body.clientHeight * 0.8; this.wake(); e.preventDefault(); }
    else if (e.code === 'PageDown') { this.body.scrollTop += this.body.clientHeight * 0.8; this.wake(); e.preventDefault(); }
    else if (e.code === 'End') { this.body.scrollTop = this.body.scrollHeight; this.wake(); }
    else if (e.code === 'BracketRight') this.setTab((this.tab + 1) % TABS.length);
    else if (e.code === 'BracketLeft') this.setTab((this.tab + TABS.length - 1) % TABS.length);
  }

  wake() { this.idleT = 0; this.root.classList.remove('idle'); }

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
    this.wake();
  }

  /** Per frame: the window settles back to half strength when nothing has been said for a while. */
  tick(dt) {
    this.idleT += dt;
    if (this.idleT > 9) this.root.classList.add('idle');
    if (this.foot) this.foot.textContent = `${this.lines.length} lines`;
  }
}
