// ---------------------------------------------------------------------------------------
// REPROGRAM: a stunned mind, opened and rewritten. Knock a creature down with the Veritome's flash (flash.js, stun.js), walk up to it
// (the chevron marks it), and press the MIDDLE BUTTON: its program opens in a window (the maker's pixel art, ui/pixel.js, in the
// indigo of a mind). It offers a handful of MACROS, each a line of its code with what it will do; choose one (click it, or 1-5), and
// type its line, letter for letter, before the time runs out. A wrong key costs time. Typed whole, the line runs: the creature is
// rewritten (asleep, held, calmed, sent home; or made to take the Courier for kin, to fetch her Lachryma, to turn on its own kind) and
// comes to. Run out of time and its mind snaps shut: it wakes, and it remembers. While the window is open the creature is held down,
// and the world goes on: anything else that is after her still is.
//
// What a macro does is data (MACROS below): a status on the creature (creatures.js), or an order its mind carries out (its `macro`,
// read by its actions: jelly/mind.js), or a change to what it takes things for (its own relations: ai/ecology.js). A creature lists the
// macros it answers to (`c.macros`). A new macro is one row here and, if it is an order, one action in a mind.
//
// Prior art: The Typing of the Dead (each enemy a word to type, whole and quickly), NieR: Automata's hacking and Watch Dogs' profiler
// (a mind opened for a moment and changed), Transistor's Turn() (a plan written into the world while it waits), and the "Charm" and
// "Confuse" of the JRPG, made a line of code you type rather than a spell you pick.
//
//   game.reprogram.open(creature)   .close(why)   .open (bool)   (main.js calls claim(input) before the weapon, and update(rawDt))
// ---------------------------------------------------------------------------------------
import { hasTag } from '../tags.js';
import { REL, kindOf } from '../ai/index.js';
import { sfx } from '../audio.js';

/** The macros: the line to type, what it does (said in the window), and how it is done. */
export const MACROS = {
  halt: { line: 'halt(8);', does: 'It freezes where it stands for eight seconds.', status: ['halt', 8] },
  sleep: { line: 'sleep(15);', does: 'It falls asleep where it lies.', status: ['sleep', 15] },
  calm: { line: 'calm = true;', does: 'For forty seconds it will not strike anything.', status: ['calm', 40] },
  forget: { line: 'forget(all);', does: 'It forgets everything it knew of you, grudges and all.', status: ['forget', 25] },
  home: { line: 'go(home);', does: 'It turns and goes home, and stays there a while.', status: ['flee', 18] },
  soften: { line: 'skin.soft();', does: 'Every blow on it lands twice as hard, for twenty-five seconds.', status: ['soft', 25] },
  melt: { line: 'melt(10);', does: 'It pools into a harmless puddle for ten seconds.', status: ['melt', 10] },
  kin: { line: 'kin.add(courier);', does: 'It takes you for its own kind: it follows you and fights what fights you. (90 s)', kin: 90 },
  fetch: { line: 'fetch(lachryma);', does: 'It finds the nearest Lachryma lying about and brings it to you.', order: ['fetch', 35] },
  turn: { line: 'kin = rival;', does: 'It turns on its own kind for forty seconds.', turn: 40 },
};
const SHOWN = 5, PENALTY = 0.6, HOLD = 1.5, REACH = 3.4;
const BASE = 2.4, PER = 0.32; // (the time to type a line: seconds, and seconds a letter)

const CSS = `
#reprogram { position: fixed; left: 50%; bottom: calc(18% + var(--cine, 0vh)); transform: translateX(-50%); z-index: 30; display: none; min-width: 360px; max-width: 92vw;
  background: linear-gradient(180deg, #211638, #0f0a1e); border: 3px solid #563889; box-shadow: 0 0 0 3px #0a0612, 0 12px 30px rgba(0,0,0,.6), inset 0 0 0 1px #7650b8;
  padding: 10px 12px 12px; color: #d2c3f4; cursor: var(--jcur, default); font-family: var(--f-ui, sans-serif); }
#reprogram.on { display: block; animation: rpin .12s cubic-bezier(.2,.8,.3,1) both; }
@keyframes rpin { from { transform: translateX(-50%) scaleY(.05); } to { transform: translateX(-50%); } }
#reprogram .hd { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
#reprogram .hd .who { flex: 1; display: flex; gap: 10px; align-items: center; }
#reprogram .hd .btns { display: flex; gap: 4px; }
#reprogram button { cursor: var(--jcur-pointer, pointer); }
#reprogram .list { display: grid; gap: 4px; }
#reprogram .m { all: unset; display: grid; grid-template-columns: auto 1fr; align-items: center; gap: 12px; padding: 5px 8px; border: 1px solid transparent; cursor: var(--jcur-pointer, pointer); }
#reprogram .m:hover, #reprogram .m.hot { background: rgba(118,80,184,.28); border-color: #7650b8; }
#reprogram .m .does { font: italic 13px var(--f-lore, serif); color: #b49be6; }
#reprogram .typing { display: none; }
#reprogram.typing .list { display: none; }
#reprogram.typing .typing { display: grid; gap: 8px; justify-items: center; }
#reprogram .line { display: flex; align-items: center; min-height: 20px; padding: 6px 10px; background: #0a0612; border: 1px solid #432c6e; }
#reprogram .line.bad { border-color: #ff7a9a; }
#reprogram .clock { width: 100%; height: 6px; background: #170f2a; border: 1px solid #432c6e; }
#reprogram .clock i { display: block; height: 100%; background: #b49be6; }
#reprogram .help { display: none; font: italic 13px var(--f-lore, serif); color: #b49be6; margin-top: 8px; max-width: 420px; }
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
      <div class="help">Choose a macro (click it, or 1 to 5), then type its line exactly, before the bar runs out. A wrong key costs time. Esc closes the mind, and leaves it as it was.</div>
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
    // which macros its mind shows this time: a handful of those it answers to
    const pool = (c.macros || []).filter((m) => MACROS[m]);
    for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
    this.offer = pool.slice(0, SHOWN);
    px.swap(this.name, px.text((c.name || 'it').toUpperCase(), 'gold'));
    this.list.innerHTML = '';
    this.offer.forEach((id, i) => {
      const b = document.createElement('button'); b.className = 'm'; b.dataset.i = i;
      b.append(px.show(px.text(`${i + 1}  ${MACROS[id].line}`, 'mind')));
      const d = document.createElement('span'); d.className = 'does'; d.textContent = MACROS[id].does; b.append(d);
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
    const id = this.offer?.[i];
    if (this.phase !== 'choose' || !id) return;
    const M = MACROS[id];
    this.macro = id; this.line = M.line; this.typed = ''; this.bad = 0;
    this.total = this.t = BASE + PER * M.line.length;
    this.phase = 'type';
    this.does.textContent = M.does;
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
    const g = this.game, c = this.c, M = MACROS[this.macro];
    if (!c?.alive) return this.close('gone');
    const took = this.apply(c, this.macro, M);
    g.creatures.clearStatus(c, 'stun'); c.onStatusEnd?.('stun'); // (it comes to, rewritten)
    c.brain?.signal();
    sfx.menuOk?.(); sfx.cardGet?.(false);
    g.glyphs?.pop('note', c.head?.() ?? c.pos.clone(), { color: 0xb49be6, size: 0.55, life: 1.2, burst: true });
    g.events?.emit('reprogram.run', { macro: this.macro, kind: c.kind, chars: this.line.length, misses: this.bad, secs: +(this.total - this.t).toFixed(1), took });
    this.close('ran');
  }

  /** The macro, done to the creature. */
  apply(c, id, M) {
    const g = this.game, now = c.brain?.now ?? 0;
    if (M.status) return g.creatures.apply(c, M.status[0], M.status[1], 3, 'courier');
    if (M.kin) {
      c.rel.set('courier', REL.KIN); c.macro = { id: 'kin', until: now + M.kin };
      const f = c.mem?.fact(g.player); if (f) { f.grudge = 0; f.threat = 0; }
      this.programmed.add(c);
      return true;
    }
    if (M.order) { c.macro = { id: M.order[0], until: now + M.order[1] }; this.programmed.add(c); return true; }
    if (M.turn) {
      c.rel.set(kindOf(c), REL.RIVAL); c.macro = { id: 'turn', until: now + M.turn };
      this.programmed.add(c);
      return true;
    }
    return false;
  }

  close(why = 'closed') {
    const g = this.game, c = this.c;
    if (!this.open) return;
    this.open = false; this.phase = null;
    this.el.classList.remove('on', 'typing', 'helping');
    this.field.blur();
    if (why === 'time' && c?.alive) { // (its mind snaps shut: it comes to, and it remembers who was in it)
      g.creatures.clearStatus(c, 'stun'); c.onStatusEnd?.('stun');
      c.mem?.hurt(g.player, 'courier', 0.4, g.player.pos);
    }
    if (why !== 'ran') g.events?.emit('reprogram.close', { why, kind: c?.kind ?? 'creature' });
    this.c = null;
    if (g.input?.enabled && !g.god?.active) g.input.requestLock();
  }

  update(rawDt) {
    const g = this.game, P = g.player;
    // the orders and bonds written into minds wear off in their time
    for (const c of this.programmed) {
      if (!c.alive || !c.macro || (c.brain && c.brain.now > c.macro.until)) {
        if (c.macro?.id === 'kin') c.rel.delete('courier');
        if (c.macro?.id === 'turn') c.rel.delete(kindOf(c));
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
