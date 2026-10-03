// ---------------------------------------------------------------------------------------
// REPROGRAM: a stunned mind, opened and rewritten. Knock a creature down with the Veritome's flash (flash.js, stun.js), walk up to it
// (the chevron marks it), and press the MIDDLE BUTTON: its mind opens in a window (the maker's pixel art, ui/pixel.js, in the indigo of a
// mind) and offers the MACROS the Courier has composed (the Codex: VERITOME, THE MIND; mind/lattice.js), each as its NEURALESE (the words of
// its Functions, mind/functions.js: STIL LON) with its runes and how well it was made. Choose one (click it, or 1-5) and say it: type its
// words, letter for letter, before the time runs out (a wrong key costs time; a well-made macro gives more time). Typed whole, it runs
// (mind/macros.js runMacro): each Function is done through the parts of the creature's mind (a directive to its Brain, a status, a relation,
// a drive, a memory wiped), as strongly and as long as the macro is good, and the creature comes to, rewritten. A poorly made macro may be
// thrown off (the mind wakes, and remembers). Run out of time and its mind snaps shut, the same. The world goes on while they type.
//
// Prior art: The Typing of the Dead (a word to type, whole and quickly), NieR: Automata's hacking and Watch Dogs' profiler (a mind opened
// for a moment and changed), Transistor's Functions and Turn() (abilities composed beforehand, run in the moment), Black & White's and
// Spore's minds taught by example, and the "Charm" and "Confuse" of the JRPG, made a sentence of a language you learned by watching.
//
//   game.reprogram.start(creature)   .close(why)   .open (bool)   (main.js calls claim(input) before the weapon, and update(rawDt))
// ---------------------------------------------------------------------------------------
import { hasTag } from '../tags.js';
import { sfx } from '../audio.js';
import { FUNCTIONS } from '../mind/functions.js';
import { runMacro } from '../mind/macros.js';
import { runeStrip } from '../mind/runes.js';

const SHOWN = 5, PENALTY = 0.6, HOLD = 1.5, REACH = 3.4;
const BASE = 2.2, PER = 0.42; // (the time to type a macro: seconds, and seconds a letter, before its quality)

const CSS = `
#reprogram { position: fixed; left: 50%; bottom: calc(18% + var(--cine, 0vh)); transform: translateX(-50%); z-index: 30; display: none; min-width: 360px; max-width: 92vw;
  /* (the window colour the player chose: ui/theme.js's frame and fill, so it matches every other window) */
  border-style: solid; border-width: 14px; border-color: transparent; border-image: var(--jframe) 14 / 14px / 0 stretch; border-radius: 9px;
  background: linear-gradient(180deg, rgba(var(--jtop), .96), rgba(var(--jbot), .97)) border-box; box-shadow: 0 10px 30px rgba(0,0,0,.55); text-shadow: 1px 1px 0 rgba(8,3,1,.75);
  padding: 2px 4px 4px; color: var(--jhi, #f1d2b0); cursor: var(--jcur, default); font-family: var(--f-ui, sans-serif); }
#reprogram.on { display: block; animation: rpin .12s cubic-bezier(.2,.8,.3,1) both; }
@keyframes rpin { from { transform: translateX(-50%) scaleY(.05); } to { transform: translateX(-50%); } }
#reprogram .hd { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
#reprogram .hd .who { flex: 1; display: flex; gap: 10px; align-items: center; }
#reprogram .hd .btns { display: flex; gap: 4px; }
#reprogram button { cursor: var(--jcur-pointer, pointer); }
#reprogram .list { display: grid; gap: 4px; }
#reprogram .m { all: unset; display: grid; grid-template-columns: auto 1fr; align-items: center; gap: 12px; padding: 5px 8px; border: 1px solid transparent; cursor: var(--jcur-pointer, pointer); }
#reprogram .m:hover, #reprogram .m.hot { background: rgba(var(--jsel), .3); border-color: var(--jmid); }
#reprogram .m .does { font: italic 13px var(--f-lore, serif); color: var(--jmid); filter: brightness(1.35); }
#reprogram .m .w { display: flex; gap: 8px; align-items: center; }
#reprogram .typing { display: none; }
#reprogram.typing .list { display: none; }
#reprogram.typing .typing { display: grid; gap: 8px; justify-items: center; }
#reprogram .line { display: flex; align-items: center; min-height: 20px; padding: 6px 10px; background: rgba(0,0,0,.35); border: 1px solid var(--jmid); }
#reprogram .line.bad { border-color: #ff7a9a; }
#reprogram .clock { width: 100%; height: 6px; background: rgba(0,0,0,.35); border: 1px solid var(--jmid); }
#reprogram .clock i { display: block; height: 100%; background: var(--jhi); }
#reprogram .help { display: none; font: italic 13px var(--f-lore, serif); color: var(--jmid); filter: brightness(1.35); margin-top: 8px; max-width: 420px; }
#reprogram.helping .help { display: block; }
#reprogram.verbose .m .does { white-space: normal; }
#reprogram .does { max-width: 360px; }
#reprogram .ok { display: flex; justify-content: center; margin-top: 6px; }
#reprogram input.rp-in { position: absolute; opacity: 0; pointer-events: none; width: 1px; height: 1px; }
`;

export class Reprogram {
  constructor(game) {
    this.game = game;
    this.open = false; this.c = null; this.phase = null;
    const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    const px = game.px;
    const el = (this.el = document.createElement('div')); el.id = 'reprogram';
    el.innerHTML = `<div class="hd"><div class="who"></div><div class="btns"></div></div><div class="list"></div>
      <div class="typing"><div class="does"></div><div class="line"><span class="typed"></span><span class="rest"></span></div><div class="clock"><i></i></div></div>
      <div class="help">Choose a macro (click it, or 1 to 5), then say it: type its words, spaces and all, before the bar runs out. A wrong key costs time. A well-made macro gives more time, lasts longer and is harder to throw off. Compose them in the Codex (B): VERITOME, THE MIND. Esc closes the mind, and leaves it as it was.</div>
      <div class="ok"></div><input class="rp-in" autocomplete="off" spellcheck="false">`;
    document.body.appendChild(el);
    this.who = el.querySelector('.who'); this.list = el.querySelector('.list'); this.does = el.querySelector('.typing .does');
    this.lineEl = el.querySelector('.line'); this.clock = el.querySelector('.clock i'); this.field = el.querySelector('input');
    const btns = el.querySelector('.btns');
    btns.append(px.button('help', 'mind', () => el.classList.toggle('helping'), 'how it works'),
      px.button('exclaim', 'mind', () => el.classList.toggle('verbose'), 'what each does, in full'),
      px.button('xclose', 'mind', () => this.close('closed'), 'close (Esc)'));
    this.title = px.show(px.text('REPROGRAM', 'mind')); this.who.appendChild(this.title);
    this.name = px.show(px.text('', 'gold')); this.who.appendChild(this.name);
    this.typedCv = px.show(px.text('', 'gold')); this.restCv = px.show(px.text('', 'mind'));
    el.querySelector('.typed').appendChild(this.typedCv); el.querySelector('.rest').appendChild(this.restCv);
    // the confirm: its gem lights when the line is whole (the maker's large button)
    this.okUp = px.art('confirm', 'mind'); this.okDown = px.art('confirm_p', 'mind');
    this.okCv = px.show(this.okUp); const ok = document.createElement('button'); ok.className = 'pxbtn'; ok.title = 'run the line'; ok.appendChild(this.okCv);
    ok.addEventListener('click', () => { if (this.phase === 'type' && this.typed === this.line) this.run(); });
    el.querySelector('.ok').appendChild(ok);
    this.field.addEventListener('keydown', (e) => this.key(e));
    this.field.addEventListener('input', () => this.typing());
    this.field.addEventListener('blur', () => { if (this.open) setTimeout(() => this.open && this.field.focus({ preventScroll: true }), 0); });
    el.addEventListener('pointerdown', (e) => { e.stopPropagation(); setTimeout(() => this.open && this.field.focus({ preventScroll: true }), 0); });
    this.programmed = new Set();
    // the chevron marks a mind that can be opened (interact.js); the middle button opens it
    game.interact?.add('reprogram', (P) => { const c = this.target(); return c ? { pos: c.head?.() ?? c.pos, d: Math.hypot(c.pos.x - P.pos.x, c.pos.z - P.pos.z) - 0.5, ref: c } : null; });
  }

  /** The stunned mind within reach, if the hands are free for it (not with the Psygun up: its middle button is a shell). */
  target() {
    const g = this.game, P = g.player;
    if (this.open || g.weapon?.drawT > 0.3 || g.god?.controlling) return null;
    let best = null, bd = REACH;
    for (const c of g.creatures?.list || []) {
      if (!c.alive || !hasTag(c, 'programmable') || !g.stun?.stunned(c)) continue;
      const d = Math.hypot(c.pos.x - P.pos.x, c.pos.z - P.pos.z);
      if (d < bd && Math.abs(c.pos.y - P.pos.y) < 2) { bd = d; best = c; }
    }
    return best;
  }

  /** Before the weapon reads the input: the middle button near a stunned mind opens it (and is no shell). */
  claim(inp) {
    if (this.open || !inp?.enabled || !inp.wasPressed('Mouse1')) return;
    const c = this.target();
    if (!c) return;
    inp.pressed.delete('Mouse1');
    this.start(c);
  }

  start(c) {
    const g = this.game, px = g.px;
    this.open = true; this.c = c; this.phase = 'choose'; this.runT = null;
    g.px.swap(this.okCv, this.okUp);
    // what it is offered: the macros they have composed (the Codex, VERITOME, THE MIND)
    this.offer = (g.macros?.ready() || []).slice(0, SHOWN);
    px.swap(this.name, px.text((c.name || 'it').toUpperCase(), 'gold'));
    this.list.innerHTML = '';
    if (!this.offer.length) { const d = document.createElement('div'); d.className = 'does'; d.textContent = 'You have no macro to say. Compose one in the Codex (B): VERITOME, THE MIND.'; this.list.appendChild(d); }
    this.offer.forEach(({ c: m }, i) => {
      const b = document.createElement('button'); b.className = 'm'; b.dataset.i = i;
      const head = document.createElement('span'); head.className = 'w';
      head.append(px.show(px.text(`${i + 1}`, 'mind')), px.show(runeStrip(m.words)), px.show(px.text(m.words.join(' '), 'gold')));
      const d = document.createElement('span'); d.className = 'does';
      d.textContent = `${m.effects.map((e) => FUNCTIONS[e.fn].label.toLowerCase()).join(', ')} · made ${Math.round(m.q * 100)}%`;
      b.append(head, d);
      b.addEventListener('click', () => this.choose(i));
      this.list.appendChild(b);
    });
    this.el.classList.remove('typing'); this.el.classList.add('on');
    this.field.value = ''; document.exitPointerLock?.();
    setTimeout(() => this.open && this.field.focus({ preventScroll: true }), 0);
    sfx.menuOpen?.();
    g.events?.emit('reprogram.open', { kind: c.kind, offered: this.offer.length });
  }

  choose(i) {
    const o = this.offer?.[i];
    if (this.phase !== 'choose' || !o) return;
    const m = o.c;
    this.macro = o.i; this.compiled = m;
    this.line = m.words.join(' ').toLowerCase(); this.typed = ''; this.bad = 0;
    this.total = this.t = (BASE + PER * this.line.length) * (0.8 + 0.5 * m.q);
    this.phase = 'type';
    this.does.textContent = m.effects.map((e) => FUNCTIONS[e.fn].does).join(' ');
    this.el.classList.add('typing');
    this.field.value = '';
    this.draw();
    sfx.menuOk?.();
  }

  key(e) {
    if (e.code === 'Escape') { e.preventDefault(); this.close('closed'); return; }
    if (this.phase === 'choose') {
      const n = /^Digit([1-9])$/.exec(e.code);
      if (n) { e.preventDefault(); this.choose(+n[1] - 1); }
      return;
    }
    if (e.code === 'Enter' || e.code === 'NumpadEnter') { e.preventDefault(); if (this.typed === this.line) this.run(); }
  }

  /** What is typed, as it is typed: a letter that does not fit the line costs time and is not kept. */
  typing() {
    if (this.phase !== 'type') { this.field.value = ''; return; }
    const v = this.field.value.toLowerCase();
    if (this.line.startsWith(v)) { if (v.length > this.typed.length) sfx.menuMove?.(); this.typed = v; this.lineEl.classList.remove('bad'); }
    else {
      this.field.value = this.typed; this.t -= PENALTY; this.bad++;
      this.lineEl.classList.add('bad'); sfx.dryFire?.();
      this.game.events?.emit('reprogram.miss', {});
    }
    this.draw();
    if (this.typed === this.line && this.runT == null) { this.game.px.swap(this.okCv, this.okDown); this.runT = 0.22; } // (the gem lights: it runs)
  }

  draw() {
    const px = this.game.px;
    px.swap(this.typedCv, px.text(this.typed || '', 'gold'));
    px.swap(this.restCv, px.text(this.line.slice(this.typed.length), 'mind'));
    this.clock.style.width = `${Math.max(0, (this.t / this.total) * 100).toFixed(1)}%`;
  }

  run() {
    const g = this.game, c = this.c, m = this.compiled;
    if (!c?.alive || !m) return this.close('gone');
    const r = runMacro(g, c, m);
    const words = m.words.join('-');
    if (!r.ok) { // (thrown off: a weak macro, a mind that would not have it)
      g.events?.emit('reprogram.reject', { macro: words, kind: c.kind, q: +m.q.toFixed(2) });
      return this.close('reject');
    }
    g.creatures.clearStatus(c, 'stun'); c.onStatusEnd?.('stun'); // (it comes to, rewritten)
    c.brain?.signal();
    if (c.macro) this.programmed.add(c);
    sfx.menuOk?.(); sfx.cardGet?.(false);
    g.glyphs?.pop('note', c.head?.() ?? c.pos.clone(), { color: 0xb49be6, size: 0.55, life: 1.2, burst: true });
    g.events?.emit('reprogram.run', { macro: words, kind: c.kind, q: +m.q.toFixed(2), effects: m.effects.map((e) => e.fn), refused: r.refused, chars: this.line.length, misses: this.bad, secs: +(this.total - this.t).toFixed(1) });
    this.close('ran');
  }

  close(why = 'closed') {
    const g = this.game, c = this.c;
    if (!this.open) return;
    this.open = false; this.phase = null;
    this.el.classList.remove('on', 'typing', 'helping');
    this.field.blur();
    if ((why === 'time' || why === 'reject') && c?.alive) { // (its mind snaps shut: it comes to, and it remembers who was in it)
      g.creatures.clearStatus(c, 'stun'); c.onStatusEnd?.('stun');
      c.mem?.hurt(g.player, 'courier', 0.4, g.player.pos);
    }
    if (why !== 'ran' && why !== 'reject') g.events?.emit('reprogram.close', { why, kind: c?.kind ?? 'creature' });
    this.c = null;
    if (g.input?.enabled && !g.god?.active) g.input.requestLock();
  }

  update(rawDt) {
    const g = this.game, P = g.player;
    // the orders and bonds written into minds wear off in their time
    for (const c of this.programmed) {
      if (!c.alive || !c.macro || (c.brain && c.brain.now > c.macro.until)) {
        if (c.alive && c.macro) g.events?.emit('reprogram.wear', { macro: c.macro.id, kind: c.kind });
        c.macro = null; this.programmed.delete(c);
      }
    }
    if (!this.open) return;
    const c = this.c;
    if (!c?.alive) return this.close('gone');
    if (Math.hypot(c.pos.x - P.pos.x, c.pos.z - P.pos.z) > REACH * 2.2) return this.close('far');
    g.stun?.hold(c, HOLD);
    if (this.runT != null) { this.runT -= rawDt; if (this.runT <= 0) { this.runT = null; g.px.swap(this.okCv, this.okUp); this.run(); } return; }
    if (this.phase === 'type') {
      this.t -= rawDt;
      this.clock.style.width = `${Math.max(0, (this.t / this.total) * 100).toFixed(1)}%`;
      if (this.t <= 0) this.close('time');
    }
  }
}
