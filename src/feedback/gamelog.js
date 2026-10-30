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
//   log.say('say', 'Calissa : words', { who: 'calissa' })                  a sibling's line, its head in its division's colour (ui/siblingline.js)
//   log.lines (the last `max` lines)   log.said (every line ever said: a line's `seq` is its place, so a mark survives the cap)
//   PageUp / PageDown scroll, End jumps to the newest, [ and ] change tab.
//
// THE SYSTEM'S TERMINAL (OVERLAY.md 14; the owner's "full send", 2026-10-16; the type and colours Calissa's, 2026-10-30): each line wears the
// game hour it was said at (the game clock, HH:MM) and the prompt's glyph, and the newest is typed in at TYPE.cps behind a block caret
// blinking in steps; a line said while another types lands that one whole, and so does opening the chat line, so the log is never
// behind. A command the player sends is echoed before its reply. A hero line (an achievement's, or `hero`) says `log.hero` for the
// glitch to answer. The rules, the events and the words are untouched: only how a line arrives.
//   log.say(cls, text, { hero })   event log.hero { cls }
// ---------------------------------------------------------------------------------------
import { speakerLine } from '../ui/siblingline.js';
import { now as calendarNow } from '../core/calendar.js';
import { clockAt } from '../progress/weather.js';
/** The terminal's typing (Calissa's): characters a real second, the caret's step on and off (real s). */
export const TYPE = { cps: 60, blink: 0.53 };
export const CLASSES = {
  system: { color: '#ead9c6', tab: 'SYSTEM' },
  info: { color: '#fff1e0', tab: 'SYSTEM' },
  warn: { color: '#ff9f80', tab: 'SYSTEM' },
  move: { color: '#e9c9a2', tab: 'MOVE' },
  skiff: { color: '#a9d6bd', tab: 'MOVE' },
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
#chatlog .body { flex: 1; overflow-y: auto; overflow-anchor: none; overflow-x: hidden; padding: 3px 6px 4px; font-size: 16px; line-height: 18px; scrollbar-width: thin; scrollbar-color: #9a5a44 transparent; }
#chatlog .ln { text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000, 0 0 3px rgba(0,0,0,.6); word-wrap: break-word; }
#chatlog .ts { color: #a98572; margin-right: 8px; }
#chatlog .pr { color: rgba(var(--jsel), 1); }
#chatlog .caret { color: #fff1e0; }
#chatlog .caret.off { visibility: hidden; }
#chatlog .ln.echo { color: #ffffff; }
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
#chatlog.typing { opacity: 1 !important; pointer-events: auto; } #chatlog.typing .tab { cursor: pointer; } /* (while the line is open the log takes the mouse: its wheel scrolls, its tabs are clicked, T142) */
#chatlog .foot { padding: 1px 6px 0; font: 500 9.5px var(--f-ui); color: #94705e; letter-spacing: .1em; text-shadow: 1px 1px 0 #000; display: flex; justify-content: space-between; }
#chatlog .foot .keys { visibility: hidden; } #chatlog.typing .foot .keys { visibility: visible; } /* (the keys are said while the line is open, not always: docs/ART.md precept 7) */
`;

const pad = (n) => String(n).padStart(2, '0');
const clock = () => { const c = clockAt(calendarNow()); return `${pad(c.hour)}:${pad(c.minute)}`; }; // (the game hour it was said at: the calendar's clock, which a replay holds)

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
    this.pinned = true; // (following the newest line; let go while they scroll back to read)
    // (it lets go only when you scroll back yourself: the wheel up, PageUp, a drag on the bar; reaching the end again takes it back.
    //  A scroll the log makes itself, or one the browser makes when old lines are dropped at the cap, never lets go: SWEEPS.md, the log)
    const atEnd = () => this.body.scrollHeight - this.body.scrollTop - this.body.clientHeight < 40;
    this.body.addEventListener('wheel', (e) => { if (e.deltaY < 0) this.pinned = false; else if (atEnd()) this.pinned = true; }, { passive: true });
    this.body.addEventListener('pointerdown', () => { this.dragging = true; });
    addEventListener('pointerup', () => { if (this.dragging) { this.dragging = false; this.pinned = atEnd(); } });
    this.body.addEventListener('scroll', () => { if (this.dragging || !this.pinned) this.pinned = atEnd(); }, { passive: true });
    this.tabEls = [...root.querySelectorAll('.tab')];
    this.tabEls.forEach((t, i) => t.addEventListener('pointerdown', (e) => { e.preventDefault(); this.setTab(i); })); // (a click on a tab, the line kept open: its focus is not lost to the click)
    this.foot = root.querySelector('.n');
    // minimised: only the tab strip (new lines light their tab); the button, or \\ (kept between visits)
    this.minEl = root.querySelector('.min');
    this.minEl.addEventListener('pointerdown', (e) => { e.stopPropagation(); e.preventDefault(); this.setMini(!this.mini); });
    // (kept as the save's `logView` section, the settings'; a save with none takes in the key the log once wrote itself, and deletes it)
    const S = game?.save, old = S?.keyed?.('foolsfortune.log.mini', 'settings');
    S?.section('logView', { scope: 'settings', version: 1, dump: () => ({ mini: !!this.mini }), load: (s) => this.setMini(!!s.mini, false),
      reset: () => { const t = old?.text(); old?.remove(); this.setMini(t === '1', false); if (t != null) S.dirty('logView'); } });
    if (!S) this.setMini(false, false);
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
      else if (e.code === 'Escape') { e.preventDefault(); this.closedAt = this.clock(); this.close(); }
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
    this.land(); // (the line being typed lands whole: the player is reading)
    if (this.mini) this.setMini(false);
    this.typing = true; this.hi = -1;
    this.root.classList.add('typing');
    this.field.value = prefix;
    this.field.focus({ preventScroll: true });
    this.game.input?.down.clear(); // (the keys held as it opened are let go: the Courier stops)
    this.body.scrollTop = this.body.scrollHeight;
    if (this.game.input?.locked) { this.freed = true; document.exitPointerLock?.(); } // (the mouse lent to the log while the line is open: a release while it is busy is no pause, main.js)
    this.wake();
  }
  close() {
    if (!this.typing) return;
    this.typing = false;
    this.root.classList.remove('typing');
    this.field.blur();
    if (this.freed) { this.freed = false; const I = this.game.input; if (I?.enabled && (I.wantLock?.() ?? true)) I.requestLock(); } // (and taken back; refused after an Esc, a click takes it: core/input.js)
  }
  send(text) {
    const t = String(text || '').trim();
    if (!t) return;
    if (t[0] === '/') this.say('system', t, { echo: true }); // (the command echoed before its reply, as a terminal does)
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
    if (mode) this.open(''); else { this.prog.replaceChildren(); this.close(); this.closedAt = this.clock(); }
  }
  /** Typing, or just stopped with Esc (which also lets the mouse go: that is not a pause). */
  /** The game's clock, in ms (the input it gates is the simulation's: the same twice: core/rng.js), the page's when there is no game. */
  clock() { const t = this.game?.events?.time; return t != null ? t * 1000 : performance.now(); }
  get busy() { return this.typing || this.clock() - (this.closedAt || 0) < 500; }
  clear() { this.typing0 = null; this.lines.length = 0; this.last = null; this.body.replaceChildren(); }

  key(e) {
    if (!this.game.input?.enabled || e.repeat && e.code !== 'PageUp' && e.code !== 'PageDown') return;
    const tag = document.activeElement?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    if ((e.code === 'Enter' || e.code === 'NumpadEnter' || e.code === 'Slash') && !e.repeat && (this.canOpen?.() ?? true)) {
      e.preventDefault(); this.open(e.code === 'Slash' ? '/' : ''); return;
    }
    if (e.code === 'PageUp') { this.pinned = false; this.body.scrollTop -= this.body.clientHeight * 0.8; this.wake(); e.preventDefault(); }
    else if (e.code === 'PageDown') { this.body.scrollTop += this.body.clientHeight * 0.8; this.pinned = this.body.scrollHeight - this.body.scrollTop - this.body.clientHeight < 40; this.wake(); e.preventDefault(); }
    else if (e.code === 'End') { this.pinned = true; this.body.scrollTop = this.body.scrollHeight; this.wake(); }
    else if (e.code === 'Backslash' || e.code === 'IntlBackslash') this.setMini(!this.mini); // (IntlBackslash: the \\ key by the left Shift on UK and other ISO keyboards)
    else if (e.code === 'BracketRight') this.setTab((this.tab + 1) % TABS.length);
    else if (e.code === 'BracketLeft') this.setTab((this.tab + TABS.length - 1) % TABS.length);
  }

  wake() { this.idleT = 0; this.root.classList.remove('idle'); }

  /** Fold the log to its tab strip (or open it). `keep` false is a fold that is not the player's choice (the spirit press view's: vfx/alchemy/presslook.js), so their saved choice stays. */
  setMini(v, keep = true) {
    this.mini = v;
    this.root.classList.toggle('mini', v);
    this.minEl.textContent = v ? '+' : '–';
    if (keep) this.game?.save?.dirty('logView');
    if (!v) { this.minEl.classList.remove('new'); this.body.scrollTop = this.body.scrollHeight; this.wake(); }
  }

  shows(cls, tab = this.tab) { return tab === 0 || (CLASSES[cls]?.tab || 'SYSTEM') === TABS[tab]; }

  setTab(i) {
    this.land(); // (the lines are drawn again whole)
    this.tab = i;
    this.unread.delete(i);
    this.tabEls.forEach((t, k) => { t.classList.toggle('on', k === i); t.classList.toggle('new', this.unread.has(k)); });
    this.body.replaceChildren(...this.lines.filter((l) => this.shows(l.cls)).slice(-120).map((l) => this.build(l)));
    this.body.scrollTop = this.body.scrollHeight;
    if (this.game.input?.locked) { this.freed = true; document.exitPointerLock?.(); } // (the mouse lent to the log while the line is open: a release while it is busy is no pause, main.js)
    this.wake();
  }

  build(l, typed = false) {
    const d = document.createElement('div');
    d.className = `ln ${l.cls}${l.echo ? ' echo' : ''}`;
    if (!l.echo) d.style.color = l.tone || CLASSES[l.cls]?.color || '#fff';
    d.innerHTML = `<span class="ts">${l.ts}</span><span class="pr">&gt; </span>`;
    if (l.who) speakerLine(d, l); // (a sibling's line: its head in its division's colour, ui/siblingline.js)
    else { l.node = document.createTextNode(typed ? '' : l.text); d.append(l.node); }
    l.el = d;
    if (typed && l.node) { const c = document.createElement('span'); c.className = 'caret'; c.textContent = '\u2588'; d.append(c); this.typing0 = { l, caret: c, shown: 0, t: 0 }; }
    return d;
  }
  /** The line being typed, landed whole now (a newer line came, or the chat line opened). */
  land() { const T = this.typing0; if (!T) return; this.typing0 = null; T.l.node.data = T.l.text; T.caret.remove(); }

  /**
   * One line. `key` + `fmt` fold repeats: a second line with the same key inside `win` seconds updates the first,
   * with fmt(count) as its text.
   */
  say(cls, text, { key = null, win = 1.6, fmt = null, tone = null, throttle = 0, who = null, echo = false, hero = false } = {}) {
    if (text == null || text === '') return null; // (nothing to say: never a blank line, and the typing reads a string each frame)
    text = String(text);
    const now = performance.now() / 1000;
    if (throttle && key) { // (a refusal repeated by a held key says itself once)
      if (now - (this.quiet.get(key) ?? -99) < throttle) return null;
      this.quiet.set(key, now);
    }
    const p = this.last;
    if (key && p && p.key === key && (fmt || p.text === text) && now - p.t < win) { // (a different line under the same key is its own line: two casts close together were one, the second's name lost)
      p.n++; p.t = now;
      p.text = fmt ? String(fmt(p.n)) : p.text;
      if (p.el) { if (this.typing0?.l === p) this.land(); (p.node || p.el.lastChild).textContent = p.text; }
      if (this.pinned !== false) this.toEnd = true; // (a merged line can grow onto a second row: follow it)
      this.afterSay(p);
      return p;
    }
    const l = { cls, text, ts: clock(), n: 1, key, t: now, tone, who, echo, seq: this.said = (this.said || 0) + 1 }; // (seq: a line's place among all ever said; `lines` keeps only the last `max`, so mark a place by seq, never by index)
    this.lines.push(l);
    if (this.lines.length > this.max) this.lines.shift();
    this.last = l;
    if (this.shows(cls)) {
      // (no reading of the window's scroll here: each read lays out the whole page again, and a burst of lines (cubes pouring in)
      //  made a burst of layouts: the owner's spikes in the dunes (R41). Whether it follows the end is kept by its scroll event, and the
      //  scroll to the end is done once a frame, in tick)
      this.land(); // (the line before lands whole: the log is never behind)
      this.body.appendChild(this.build(l, !echo && !who && !this.mini));
      while (this.body.children.length > 140) this.body.firstChild.remove();
      if (this.pinned !== false) this.toEnd = true;
    }
    this.afterSay(l);
    if (hero || cls === 'ach') this.game?.events?.emit('log.hero', { cls }); // (the hero line's hook: the glitch answers it, vfx/glitch.js)
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
    const T = this.typing0;
    if (T) { // (the newest line typed in behind its caret, which blinks in steps)
      T.t += dt; T.shown = Math.min(T.l.text.length, T.shown + TYPE.cps * dt);
      T.l.node.data = T.l.text.slice(0, Math.floor(T.shown));
      T.caret.classList.toggle('off', Math.floor(T.t / TYPE.blink) % 2 === 1);
      if (T.shown >= T.l.text.length) this.land();
    }
    this.idleT += dt;
    if (this.idleT > 9) this.root.classList.add('idle');
    if (this.toEnd) { this.toEnd = false; this.body.scrollTop = this.body.scrollHeight; }
    if (this.foot && this.footN !== this.lines.length) { this.footN = this.lines.length; this.foot.textContent = `${this.lines.length} lines`; }
  }
}
