// ---------------------------------------------------------------------------------------
// THE TITLE'S WORDS: the logo over THE FOOL'S PRECIPICE (title/scene.js), "PRESS START", and, once they have stepped off the hill, the menu:
// STORY, DEBUG, SETTINGS, SOUND TEST (the owner's split: STORY is the game to come, DEBUG the sandbox as it is, every tool and room).
// Keys or the mouse; the choice is lit (no pointing glove here: the owner's call, it flickered against the mouse's own). The first press wakes the sound if the browser
// kept it asleep (so the title's loop plays under the scene: Wanda's note), and the next one starts. The words here are placeholders for Espada's (docs/HANDOFFS.md) and
// the logo for Calissa's clay letters.
//
// Prior art: the PS2 title (PRESS START, then a short vertical menu over a living scene: Kingdom Hearts, Okami), and Persona 5's menus
// that move with the music.
//
//   const ui = new TitleUI(game, { onStart, onChoose })   ui.showMenu()   ui.fade(k)   ui.close()
// ---------------------------------------------------------------------------------------
import { sfx } from '../audio.js';

const CSS = `
#title { position: fixed; inset: 0; z-index: 12; pointer-events: none; font-family: var(--f-title, serif); color: #fff1dc; }
#title.on { pointer-events: auto; cursor: var(--jcur, default); }
#title .vig { position: absolute; inset: 0; background: radial-gradient(ellipse at 50% 45%, rgba(10,4,16,0) 45%, rgba(10,4,16,.65)); }
#title .logo { position: absolute; left: 0; right: 0; top: 9%; text-align: center; line-height: 1; transition: opacity .8s, transform .8s; }
#title .logo b { display: block; font: 700 clamp(46px, 7.4vw, 96px)/1.02 var(--f-deco, serif); letter-spacing: .02em;
  color: #f4e6cc; text-shadow: 0 3px 0 #6a3a5a, 0 6px 0 #2a1838, 0 0 40px rgba(180,155,230,.35); }
#title .logo span { display: block; margin-top: 10px; font: italic 20px var(--f-lore, serif); color: #d9c7f0; opacity: .9; }
#title .press { position: absolute; left: 0; right: 0; bottom: 14%; text-align: center; font: 600 18px var(--f-title, serif); letter-spacing: .5em;
  color: #fff1dc; animation: tbreath 2.6s ease-in-out infinite; }
@keyframes tbreath { 0%, 100% { opacity: .45; } 50% { opacity: 1; } }
#title .menu { position: absolute; right: 9%; top: 50%; transform: translateY(-50%); display: none; flex-direction: column; gap: 14px; text-align: right; }
#title.menuon .menu { display: flex; animation: tmenu .6s cubic-bezier(.2,.8,.3,1) both; }
@keyframes tmenu { from { opacity: 0; transform: translate(30px, -50%); } to { opacity: 1; transform: translate(0, -50%); } }
#title .menu .o { cursor: var(--jcur-pointer, pointer); font: 600 26px var(--f-title, serif); letter-spacing: .32em; opacity: .55; transition: opacity .15s, transform .15s; }
#title .menu .o small { display: block; font: italic 13px var(--f-lore, serif); letter-spacing: .02em; opacity: .8; margin-top: 2px; }
#title .menu .o.hot { opacity: 1; transform: translateX(-10px); text-shadow: 0 0 18px rgba(217,199,240,.6); }
#title.menuon .press { display: none; }
#title.menuon .vig { background: linear-gradient(to left, rgba(10,4,16,.78), rgba(10,4,16,.35) 38%, rgba(10,4,16,0) 60%), radial-gradient(ellipse at 50% 45%, rgba(10,4,16,0) 45%, rgba(10,4,16,.55)); }
#title.menuon .logo { opacity: .0; transform: translateY(-20px); }
#title .fade { position: absolute; inset: 0; background: #0b0614; opacity: 0; pointer-events: none; }
#title .ver { position: absolute; left: 14px; bottom: 10px; font: 11px var(--f-ui, monospace); opacity: .45; letter-spacing: .1em; }
`;

export class TitleUI {
  constructor(game, { onStart, onChoose }) {
    this.game = game; this.onStart = onStart; this.onChoose = onChoose;
    const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    const el = (this.el = document.createElement('div')); el.id = 'title'; el.className = 'on';
    el.innerHTML = `<div class="vig"></div>
      <div class="logo"><b>Fool's Fortune</b><span>the fortune is in the leap</span></div>
      <div class="press">PRESS START</div>
      <div class="menu"></div>
      <div class="fade"></div><div class="ver">ANAGAMI ISLAND · a work in progress</div>`;
    document.body.appendChild(el);
    this.menuEl = el.querySelector('.menu'); this.fadeEl = el.querySelector('.fade');
    this.items = []; this.hot = 0; this.page = 'main';
    this.key = (e) => this.onKey(e);
    addEventListener('keydown', this.key, true);
    el.addEventListener('mousedown', (e) => { if (e.button === 0 && !this.menuOn) { e.preventDefault(); this.start(); } });
    game.theme?.watch?.(el, { sound: false });
  }
  get menuOn() { return this.el.classList.contains('menuon'); }

  /** The first press only wakes the sound, if the browser had it asleep, so the title's loop plays under the scene; the next starts. */
  wake() {
    if (this.woke) return false;
    this.woke = true;
    const asleep = !sfx.ctx || sfx.ctx.state !== 'running';
    sfx.unlock?.();
    if (asleep) { this.el.classList.add('awake'); return true; }
    return false;
  }
  start() { if (this.started) return; if (this.wake()) return; this.started = true; sfx.unlock?.(); sfx.menuOk?.(); this.onStart?.(); }

  /** The menu, once they have stepped off. */
  showMenu(page = 'main') {
    this.page = page;
    const g = this.game, music = g.music;
    const pages = {
      main: [
        { id: 'story', label: 'STORY', sub: 'Anagami Island (not yet written)' },
        { id: 'debug', label: 'DEBUG', sub: 'the workshop as it stands: every tool, every room' },
        { id: 'settings', label: 'SETTINGS', sub: 'music, voice, windows' },
        { id: 'sound', label: 'SOUND TEST', sub: 'the music, one piece at a time' },
      ],
      settings: [
        { id: 'music', label: `MUSIC ${music?.on === false ? 'OFF' : 'ON'}` },
        { id: 'voice', label: `VOICE ${g.voice?.settings?.on ? 'ON' : 'OFF'}` },
        { id: 'window', label: `WINDOWS ${g.theme?.name ? g.theme.name.toUpperCase() : ''}` },
        { id: 'back', label: 'BACK' },
      ],
    };
    this.menuEl.innerHTML = '';
    this.items = pages[page].map((it, i) => {
      const d = document.createElement('div'); d.className = 'o'; d.innerHTML = `${it.label}${it.sub ? `<small>${it.sub}</small>` : ''}`;
      d.onmouseenter = () => this.setHot(i);
      d.onclick = () => this.pick(i);
      this.menuEl.appendChild(d);
      return { ...it, d };
    });
    this.el.classList.add('menuon');
    this.setHot(Math.min(this.hot, this.items.length - 1), true);
  }
  setHot(i, quiet = false) {
    this.hot = (i + this.items.length) % this.items.length;
    this.items.forEach((it, k) => it.d.classList.toggle('hot', k === this.hot));
    if (!quiet) sfx.menuMove?.();
  }
  pick(i = this.hot) {
    const it = this.items[i], g = this.game;
    if (!it || this.chosen) return;
    sfx.menuOk?.();
    if (this.page === 'settings') {
      if (it.id === 'music') g.music?.setOn?.(!(g.music.on !== false));
      else if (it.id === 'voice') g.voice?.set?.({ on: !g.voice.settings.on });
      else if (it.id === 'window') g.theme?.next?.();
      else if (it.id === 'back') { this.hot = 2; this.showMenu('main'); return; }
      this.showMenu('settings');
      return;
    }
    if (it.id === 'settings') { this.hot = 0; this.showMenu('settings'); return; }
    if (it.id === 'sound') { g.codex.shelf = 'sound'; g.codex.show(); return; }
    this.chosen = it.id;
    this.onChoose?.(it.id);
  }
  onKey(e) {
    if (!this.el.isConnected || this.closed || this.game.codex?.open) return;
    e.stopPropagation();
    if (!this.menuOn) { if (!['ShiftLeft', 'ShiftRight', 'AltLeft', 'AltRight', 'ControlLeft', 'ControlRight', 'MetaLeft', 'MetaRight', 'Tab'].includes(e.code)) { e.preventDefault(); this.start(); } return; }
    if (['ArrowUp', 'KeyW'].includes(e.code)) { e.preventDefault(); this.setHot(this.hot - 1); }
    else if (['ArrowDown', 'KeyS'].includes(e.code)) { e.preventDefault(); this.setHot(this.hot + 1); }
    else if (['Enter', 'Space', 'KeyF', 'NumpadEnter'].includes(e.code)) { e.preventDefault(); this.pick(); }
    else if (e.code === 'Escape' && this.page !== 'main') { e.preventDefault(); this.showMenu('main'); }
  }
  fade(k) { this.fadeEl.style.opacity = String(Math.max(0, Math.min(1, k))); }
  close() {
    this.closed = true;
    removeEventListener('keydown', this.key, true);
    this.el.remove();
  }
}
