// ---------------------------------------------------------------------------------------
// DIALOGUE: a conversation with one of the clay folk (npc/folk.js). F at a folk begins it: the bars come in, the camera finds a
// two-shot over the Courier's shoulder, and a window opens at the foot of the screen with the speaker's name on a tab. The words
// arrive a letter at a time, each one a note of the speaker's voice (npc/clayese.js) and a lift of its lid, at a pace that is
// part of what is said:
//
//   - PACE. A comfortable 34 letters a second, quicker when the speaker is frightened or angry, slower when sad or awed; a beat
//     after a comma, a longer one after a full stop, a held breath at an ellipsis. {slow} and {fast} change it, {p:0.5} waits.
//   - THE LETTERS MOVE WITH THE FEELING. A line's mood gives all of it a quiet manner (fear trembles, anger throbs, sorrow sinks,
//     joy bobs, awe shimmers in the Lachryma's colours, confusion wobbles, a whisper is small), and a word can be pushed further:
//       {shake}...{/}  {tremble}  {wave}  {bounce}  {big}  {small}  {throb}  {wobble}  {hot} {cold} {gold} {lach}
//     {mood:fear} turns the speaker's feeling mid-line (its body and its marks follow: npc/folk.js), {burst} is the big moment,
//     {quake} shakes the camera, {glyph:ask} pops a mark over the speaker.
//   - THE BODY ANSWERS. Every line's mood is played on the folk: it hops for joy, shivers in fear, steams in anger, weeps.
//
// F, Space, Enter or a click: the first press finishes the line at once, the next turns the page. Choices are the Courier's words:
// the arrow keys or W / S and F, or a number, or the mouse (the glove points). Every finished line is also written in the log
// (tracking.js: "Mistress Saggar : ..."), so what was said is kept; the window itself is the conversation's, opened by the player
// and closed when it ends (CLAUDE.md's rule for words on screen).
//
// Prior art: the JRPG text box (Final Fantasy's and Dragon Quest's window with the name and the waiting cursor), Animal Crossing's
// letter-by-letter speech with its emphasis (the big shaking words, the pauses), Undertale's and Paper Mario's per-word effects
// (shaking text for fear, wavy text for whimsy), Persona's name tab, and Dark Cloud 2's over-the-shoulder conversation camera.
//
//   game.dialogue.begin(npc, node?)  game.dialogue.update(dt)       game.dialogue.open
//   (a line's text and mood, and a choice's text, may be functions of the game; a choice's `do(game, dialogue)` runs before its `go`)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { TALKS } from './talks.js';
import { moodOf } from './clayese.js';
import { sfx } from '../audio.js';

const BASE_CPS = 34;
const MOOD_CLASS = { fear: 'tremble', anger: 'throb', sad: 'sink', joy: 'bob', awe: 'lach', confused: 'wobble', whisper: 'small', sly: 'slant' };
const STYLE = new Set(['shake', 'tremble', 'wave', 'bounce', 'big', 'small', 'throb', 'wobble', 'hot', 'cold', 'gold', 'lach', 'slant', 'sink', 'bob', 'slow', 'fast']);

const CSS = `
body.talking #hud { opacity: 0; transition: opacity .2s; }
#hud { transition: opacity .3s; }
#dialogue { position: fixed; left: 0; right: 0; bottom: 0; z-index: 8; display: none; justify-content: center; pointer-events: none; padding-bottom: clamp(18px, 6vh, 64px); }
#dialogue.open { display: flex; }
#dialogue .dw { position: relative; width: min(780px, calc(100% - 32px)); min-height: 118px; box-sizing: border-box; padding: 16px 22px 18px; pointer-events: auto; }
#dialogue .name { position: absolute; left: 18px; top: -30px; padding: 3px 14px 4px; font: 600 15px var(--f-title); letter-spacing: .16em; color: #fff1dc;
  background: linear-gradient(180deg, rgba(var(--jtop), .97), rgba(var(--jbot), .97)); border: 2px solid var(--jhi); border-radius: 6px 6px 2px 2px;
  box-shadow: 0 0 0 1px rgba(0,0,0,.6), 0 4px 10px rgba(0,0,0,.4); text-shadow: 1px 1px 0 rgba(8,3,1,.8); }
#dialogue .name s { text-decoration: none; font: italic 14px var(--f-lore); letter-spacing: .02em; color: var(--accent); margin-left: 8px; opacity: .9; }
#dialogue .text { font: 500 21px/1.55 var(--f-ui); color: #fff7ea; min-height: 3.1em; letter-spacing: .01em; }
#dialogue .text .w { display: inline-block; white-space: pre; }
#dialogue .c { display: inline-block; animation: cin .14s cubic-bezier(.2,1.6,.4,1) both; }
@keyframes cin { from { opacity: 0; transform: translateY(5px) scale(.6); } }
#dialogue .more { position: absolute; right: 16px; bottom: 6px; width: 32px; height: 32px; background: var(--jglove-down) 0 0 / 32px 32px no-repeat; image-rendering: pixelated;
  opacity: 0; animation: jbob .5s steps(1) infinite; filter: drop-shadow(1px 2px 0 rgba(8,3,1,.5)); }
#dialogue.done .more { opacity: 1; }
#dialogue .choices { display: none; flex-direction: column; gap: 4px; margin-top: 6px; padding-left: 44px; }
#dialogue.ask .choices { display: flex; }
#dialogue .opt { font: 500 18px var(--f-ui); color: #e9d7c4; padding: 3px 10px; border-radius: 4px; cursor: var(--jcur-pointer, pointer); }
#dialogue .opt b { font: 16px var(--f-sys); color: var(--accent); margin-right: 8px; font-weight: normal; }
#dialogue .opt.sel { color: #fff; background: linear-gradient(90deg, rgba(var(--jsel), .55), rgba(var(--jsel), 0)); }
/* the manners of the letters (each letter gets its own delay, --i, so a word ripples) */
#dialogue .shake { animation: cin .14s both, dshake .2s steps(1) infinite; animation-delay: 0s, calc(var(--i) * -37ms); }
#dialogue .tremble { animation: cin .14s both, dtremble .32s steps(1) infinite; animation-delay: 0s, calc(var(--i) * -53ms); }
@keyframes dshake { 0% { transform: translate(1.6px, -1px) rotate(2deg); } 25% { transform: translate(-1.8px, 1.2px) rotate(-3deg); } 50% { transform: translate(1px, 1.6px); } 75% { transform: translate(-1.2px, -1.6px) rotate(2deg); } }
@keyframes dtremble { 0% { transform: translate(.6px, 0); } 33% { transform: translate(-.6px, .5px); } 66% { transform: translate(0, -.6px); } }
#dialogue .wave { animation: cin .14s both, dwave 1.1s ease-in-out infinite; animation-delay: 0s, calc(var(--i) * -90ms); }
@keyframes dwave { 0%, 100% { transform: translateY(2.5px); } 50% { transform: translateY(-3.5px); } }
#dialogue .bob { animation: cin .14s both, dwave 1.8s ease-in-out infinite; animation-delay: 0s, calc(var(--i) * -70ms); }
#dialogue .bounce { animation: cin .14s both, dbounce .6s cubic-bezier(.3,0,.6,1) infinite; animation-delay: 0s, calc(var(--i) * -60ms); }
@keyframes dbounce { 0%, 100% { transform: translateY(0); } 40% { transform: translateY(-6px) scaleY(1.08); } 55% { transform: translateY(0) scaleY(.9); } }
#dialogue .big { font-size: 1.42em; font-weight: 800; line-height: 1; animation: cbig .22s cubic-bezier(.2,1.8,.4,1) both; vertical-align: -.06em; }
@keyframes cbig { from { opacity: 0; transform: scale(2.2) rotate(-6deg); } }
#dialogue .big.shake, #dialogue .big.tremble { animation: cbig .22s both, dshake .16s steps(1) infinite; animation-delay: 0s, calc(var(--i) * -37ms); }
#dialogue .small { font-size: .78em; opacity: .78; letter-spacing: .04em; }
#dialogue .throb { animation: cin .14s both, dthrob .5s ease-in-out infinite; }
@keyframes dthrob { 50% { transform: scale(1.1); text-shadow: 0 0 8px rgba(255,80,40,.7), 1px 1px 0 #000; } }
#dialogue .wobble { animation: cin .14s both, dwobble 1.4s ease-in-out infinite; animation-delay: 0s, calc(var(--i) * -110ms); }
@keyframes dwobble { 0%, 100% { transform: rotate(-7deg) translateY(1px); } 50% { transform: rotate(7deg) translateY(-1px); } }
#dialogue .sink { animation: csink .5s ease-out both; color: #c9d6ee; }
@keyframes csink { from { opacity: 0; transform: translateY(-6px); } to { transform: translateY(1.5px); } }
#dialogue .slant { font-style: italic; transform: skewX(-8deg); }
#dialogue .hot { color: #ff7a5a; text-shadow: 0 0 6px rgba(255,90,40,.6), 1px 1px 0 #2a0800; }
#dialogue .cold { color: #bfe0ff; text-shadow: 0 0 6px rgba(140,190,255,.5), 1px 1px 0 #061226; }
#dialogue .gold { color: #ffd98a; text-shadow: 0 0 6px rgba(255,200,90,.55), 1px 1px 0 #2a1600; }
#dialogue .lach { background: linear-gradient(90deg, #9ff7ea, #b48cff, #ff9ad5, #ffd27a, #9ff7ea) 0 0 / 300% 100%; -webkit-background-clip: text; background-clip: text;
  color: transparent; animation: cin .14s both, dlach 3s linear infinite; animation-delay: 0s, calc(var(--i) * -80ms); text-shadow: none; filter: drop-shadow(1px 1px 0 rgba(8,3,1,.8)); }
@keyframes dlach { to { background-position: 300% 0; } }
`;

/** Parse a line's markup into letters (with their manners) and commands. */
export function parse(src, baseCls = []) {
  const out = [], stack = [];
  let i = 0;
  while (i < src.length) {
    if (src[i] === '{') {
      const j = src.indexOf('}', i);
      if (j > i) {
        const tag = src.slice(i + 1, j).trim(); i = j + 1;
        if (tag[0] === '/') { const nm = tag.slice(1); if (!nm) stack.pop(); else { const k = stack.lastIndexOf(nm); if (k >= 0) stack.splice(k, 1); } continue; }
        const [k, v] = tag.split(':');
        if (STYLE.has(k)) stack.push(k); else out.push({ cmd: k, v: v ?? null });
        continue;
      }
    }
    out.push({ ch: src[i], cls: [...baseCls, ...stack] });
    i++;
  }
  return out;
}
const plain = (src) => src.replace(/\{[^}]*\}/g, '');

export class Dialogue {
  constructor(game) {
    this.game = game; this.open = false;
    const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    const r = (this.root = document.createElement('div')); r.id = 'dialogue';
    r.innerHTML = '<div class="dw"><div class="name"></div><div class="text"></div><div class="choices"></div><div class="more"></div></div>';
    document.body.appendChild(r);
    this.el = { name: r.querySelector('.name'), text: r.querySelector('.text'), choices: r.querySelector('.choices') };
    r.addEventListener('mousedown', (e) => { e.stopPropagation(); if (!e.target.closest('.opt')) this.advance(); });
    this.cam = new THREE.Vector3(); this.look = new THREE.Vector3();
  }

  /** Begin talking with a folk. */
  begin(npc, at = null) {
    const g = this.game, T = TALKS[npc.id];
    if (!T || this.open) return false;
    this.npc = npc; this.talk = T; this.open = true; this.vars = {}; this.age = 0; this.opts = null;
    document.body.classList.add('talking');
    // (the camera goes to whichever side of the pair the player's camera is already on: no swing across)
    { const c = g.camera.position, P = g.player.pos, dx = npc.pos.x - P.x, dz = npc.pos.z - P.z; this.side = (-(dz) * (c.x - P.x) + dx * (c.z - P.z)) >= 0 ? 1 : -1; }
    const met = g.ledger?.get?.(`npc.talk.${npc.id}`) || 0;
    this.root.classList.add('open');
    this.el.name.innerHTML = `${npc.name}${npc.def.title ? `<s>${npc.def.title}</s>` : ''}`;
    g.events.emit('npc.talk', { npc: npc.id, first: !met });
    this.go(at || (met ? (T.again || T.start) : T.start));
    return true;
  }
  end() {
    if (!this.open) return;
    const g = this.game, n = this.npc;
    this.open = false; this.root.classList.remove('open', 'done', 'ask'); document.body.classList.remove('talking');
    g.cinema?.unshot('talk'); g.mood?.free('npc.burst');
    if (n) g.folk.setMood(n, n.def.temper || 'calm', 0.35);
    g.events.emit('npc.bye', { npc: n?.id });
    this.npc = null; this.node = null;
  }

  /** A node of the talk: its lines in order, then its choices (or its next, or the end). */
  go(id) {
    if (!id || !this.talk.nodes[id]) { this.end(); return; }
    this.node = this.talk.nodes[id]; this.li = 0;
    this.node.enter?.(this.game, this);
    this.line();
  }
  line() {
    const g = this.game, N = this.node, L = N.lines.filter((l) => !l.when || l.when(g))[this.li];
    if (!L) { this.afterLines(); return; }
    const text = typeof L.text === 'function' ? L.text(g, this) : L.text;
    this.cur = L;
    this.mood = (typeof L.mood === 'function' ? L.mood(g, this) : L.mood) || 'calm';
    g.folk.setMood(this.npc, this.mood, L.k ?? 0.85);
    const base = MOOD_CLASS[this.mood] ? [MOOD_CLASS[this.mood]] : [];
    this.toks = parse(text, base); this.ti = 0; this.wait = 0.12; this.typed = false; this.plain = plain(text);
    this.end_ = /\?\s*["”']?$/.test(this.plain) ? '?' : /!\s*["”']?$/.test(this.plain) ? '!' : '.';
    this.letters = this.toks.filter((t) => t.ch).length; this.li2 = 0;
    this.el.text.replaceChildren(); this.word = null;
    this.root.classList.remove('done', 'ask');
    L.do?.(g, this);
  }
  afterLines() {
    const N = this.node, g = this.game;
    if (N.choices) {
      const opts = N.choices.filter((c) => !c.when || c.when(g));
      this.opts = opts; this.sel = 0;
      this.el.choices.replaceChildren(...opts.map((c, i) => {
        const d = document.createElement('div'); d.className = `opt${i === 0 ? ' sel' : ''}`; d.innerHTML = `<b>${i + 1}</b>${this.say(c)}`;
        d.addEventListener('mouseenter', () => this.pick(i, false));
        d.addEventListener('mousedown', (e) => { e.stopPropagation(); this.pick(i, false); this.choose(); });
        return d;
      }));
      this.root.classList.add('ask'); this.root.classList.remove('done');
      requestAnimationFrame(() => g.theme?.aim(this.el.choices.querySelector('.sel')));
      return;
    }
    this.go(N.next);
  }
  /** A choice's words (a string, or a function of the game: a price, a count). */
  say(c) { return typeof c.text === 'function' ? c.text(this.game, this) : c.text; }
  pick(i, sound = true) {
    if (!this.opts) return;
    this.sel = (i + this.opts.length) % this.opts.length;
    [...this.el.choices.children].forEach((d, k) => d.classList.toggle('sel', k === this.sel));
    this.game.theme?.aim(this.el.choices.children[this.sel], sound);
  }
  choose() {
    const c = this.opts?.[this.sel]; if (!c) return;
    sfx.menuOk?.();
    this.game.events.emit('npc.choose', { npc: this.npc.id, text: this.say(c).replace(/<[^>]+>/g, '') });
    this.opts = null; this.el.choices.replaceChildren(); this.root.classList.remove('ask');
    this.game.theme?.aim(null);
    c.do?.(this.game, this);
    this.go(typeof c.go === 'function' ? c.go(this.game, this) : c.go);
  }
  /** F / Space / Enter / click: finish the line, or turn the page. */
  advance() {
    if (!this.open || this.opts) return;
    if (!this.typed) { while (this.ti < this.toks.length) this.step(true); this.finish(); return; }
    sfx.menuMove?.();
    this.li++; this.line();
  }
  finish() {
    if (this.typed) return;
    this.typed = true; this.root.classList.add('done');
    this.game.events.emit('npc.say', { npc: this.npc.id, line: this.plain, mood: this.mood });
    // a line that has nothing after it and no choices: the window waits for the last press
  }

  /** One token: a letter onto the page (and its voice), or a command. */
  step(silent = false) {
    const t = this.toks[this.ti++], g = this.game, F = g.folk, n = this.npc;
    if (!t) return 0;
    if (t.cmd) {
      const v = t.v;
      if (t.cmd === 'p') return silent ? 0 : parseFloat(v) || 0.3;
      if (t.cmd === 'mood') { this.mood = v; F.setMood(n, v, 0.95); }
      else if (t.cmd === 'burst') F.burst(n);
      else if (t.cmd === 'quake') g.player.shake = Math.max(g.player.shake || 0, parseFloat(v) || 0.25);
      else if (t.cmd === 'glyph') g.glyphs?.pop(v, F.head(n).add(new THREE.Vector3(0, 0.32 * n.scale, 0)), { size: 0.42, color: 0xfff1dc });
      return 0;
    }
    // letters go into words (so a line breaks between words, not inside them)
    if (t.ch === ' ' || !this.word) { this.word = document.createElement('span'); this.word.className = 'w'; this.el.text.appendChild(this.word); if (t.ch === ' ') { this.word.textContent = ' '; this.word = null; return this.delay(t); } }
    const s = document.createElement('span');
    s.className = `c ${t.cls.join(' ')}`; s.textContent = t.ch; s.style.setProperty('--i', this.li2);
    this.word.appendChild(s);
    this.li2++;
    if (!silent && /[A-Za-z0-9]/.test(t.ch) && (this.li2 % (t.cls.includes('fast') ? 2 : 1) === 0)) {
      F.speak(n, t.ch, { emph: t.cls.includes('big') ? 1 : 0, pos: this.li2 / Math.max(1, this.letters), end: this.end_, gain: t.cls.includes('small') ? 0.5 : 1 });
    }
    return this.delay(t);
  }
  delay(t) {
    const M = moodOf(this.mood);
    let d = 1 / (BASE_CPS * M.speed);
    if (t.cls?.includes('slow')) d *= 2.6;
    if (t.cls?.includes('fast')) d *= 0.5;
    if (t.cls?.includes('big')) d *= 1.6;
    const nx = this.toks[this.ti]?.ch;
    if ('.!?'.includes(t.ch) && !(nx && '.!?"”\''.includes(nx))) d += 0.3 / Math.max(0.6, M.speed);
    else if (',;:'.includes(t.ch)) d += 0.12;
    else if (t.ch === '—') d += 0.2;
    else if (t.ch === '…') d += 0.45;
    return d;
  }

  update(dt) {
    if (!this.open) return;
    const g = this.game, inp = g.input, n = this.npc, P = g.player;
    // the camera: a two-shot from the side, a little behind the Courier, the speaker nearer the middle (the folk stand lower than
    // they do, so the lens comes down to them)
    const h = g.folk.head(n), dx = h.x - P.pos.x, dz = h.z - P.pos.z, d = Math.hypot(dx, dz) || 1;
    const fx = dx / d, fz = dz / d, rx = -fz * this.side, rz = fx * this.side;
    const mx = P.pos.x + dx * 0.55, mz = P.pos.z + dz * 0.55;
    this.cam.set(mx + rx * 2.9 - fx * 1.1, Math.max(P.pos.y, n.pos.y) + 1.25, mz + rz * 2.9 - fz * 1.1);
    this.look.set(P.pos.x + dx * 0.7, (P.pos.y + 1.2 + h.y) / 2, P.pos.z + dz * 0.7);
    g.cinema?.shot('talk', { pos: this.cam, look: this.look, fov: -10, bars: 1, ease: 4 });
    // the typing
    if (!this.typed && !this.opts) {
      this.wait -= dt;
      let guard = 0;
      while (this.wait <= 0 && this.ti < this.toks.length && guard++ < 6) this.wait += this.step();
      if (this.ti >= this.toks.length && this.wait <= 0) this.finish();
    }
    // keys
    this.age = (this.age || 0) + dt;
    if (this.age < 0.2) return; // (the F that began it is not also the F that turns the first page)
    const pressed = (k) => inp.wasPressed(k);
    if (this.opts) {
      if (pressed('KeyW') || pressed('ArrowUp')) this.pick(this.sel - 1);
      if (pressed('KeyS') || pressed('ArrowDown')) this.pick(this.sel + 1);
      for (let i = 0; i < this.opts.length && i < 9; i++) if (pressed(`Digit${i + 1}`)) { this.pick(i, false); this.choose(); return; }
      if (pressed('KeyF') || pressed('Space') || pressed('Enter')) this.choose();
    } else if (pressed('KeyF') || pressed('Space') || pressed('Enter') || pressed('Mouse0')) this.advance();
  }
}
